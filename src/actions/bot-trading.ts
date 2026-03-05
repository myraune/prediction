"use server";

import { prisma } from "@/lib/prisma";
import { buyShares as calcBuy } from "@/lib/amm";
import { TRADING_FEE_RATE } from "@/lib/constants";
import { recordPriceSnapshot } from "./snapshots";

// ─── BOT TRADING CONFIG ──────────────────────────────────
const BOT_TRADE_AMOUNTS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
const MIN_POOL_FOR_TRADE = 20; // Don't trade if pools are too small
const MAX_TRADES_PER_RUN = 50; // Cap total trades per execution

interface BotTradeResult {
  botName: string;
  marketTitle: string;
  side: "YES" | "NO";
  amount: number;
  shares: number;
  effectivePrice: number;
}

interface RunBotsResult {
  success: boolean;
  tradesPlaced: number;
  trades: BotTradeResult[];
  error?: string;
}

/**
 * Picks a trade amount, biased toward smaller trades.
 * Bots mostly place small trades to simulate realistic activity.
 */
function pickTradeAmount(): number {
  // Weight toward smaller trades: 60% chance of ≤25 pts
  const r = Math.random();
  if (r < 0.3) return BOT_TRADE_AMOUNTS[0]!;       // 5
  if (r < 0.5) return BOT_TRADE_AMOUNTS[1]!;       // 10
  if (r < 0.65) return BOT_TRADE_AMOUNTS[2]!;      // 15
  if (r < 0.75) return BOT_TRADE_AMOUNTS[3]!;      // 20
  if (r < 0.82) return BOT_TRADE_AMOUNTS[4]!;      // 25
  if (r < 0.88) return BOT_TRADE_AMOUNTS[5]!;      // 30
  if (r < 0.93) return BOT_TRADE_AMOUNTS[6]!;      // 40
  if (r < 0.96) return BOT_TRADE_AMOUNTS[7]!;      // 50
  if (r < 0.99) return BOT_TRADE_AMOUNTS[8]!;      // 75
  return BOT_TRADE_AMOUNTS[9]!;                     // 100
}

/**
 * Decides which side a bot should trade based on current market probability.
 * Bots use a mean-reversion strategy: they tend to buy the underpriced side,
 * creating a natural counterparty for human traders who chase momentum.
 */
function pickSide(yesPrice: number): "YES" | "NO" {
  // Mean-reversion: buy the cheaper side more often
  // If YES is at 0.30, there's ~65% chance the bot buys YES (contrarian)
  // If YES is at 0.70, there's ~65% chance the bot buys NO (contrarian)
  const noBias = yesPrice; // Higher yes price → more likely to pick NO
  const r = Math.random();

  // Add some randomness so bots don't always trade the same side
  const threshold = 0.3 + noBias * 0.4; // Range: 0.3 to 0.7
  return r < threshold ? "NO" : "YES";
}

/**
 * Run bot trading: bots place trades on open markets to provide
 * visible counterparty activity. Uses the existing AMM for all trades.
 *
 * @param targetTrades - Approximate number of trades to place (default: 10-25 random)
 * @param marketIds - Optional: only trade on specific markets
 */
export async function runBotTrading(
  targetTrades?: number,
  marketIds?: string[]
): Promise<RunBotsResult> {
  try {
    // Get all bot users
    const bots = await prisma.user.findMany({
      where: { role: "BOT" },
      select: { id: true, name: true, balance: true },
    });

    if (bots.length === 0) {
      return { success: false, tradesPlaced: 0, trades: [], error: "No bot users found. Run seed first." };
    }

    // Get open markets
    const whereClause: { status: string; id?: { in: string[] }; closesAt: { gt: Date } } = {
      status: "OPEN",
      closesAt: { gt: new Date() },
    };
    if (marketIds?.length) {
      whereClause.id = { in: marketIds };
    }

    const markets = await prisma.market.findMany({
      where: whereClause,
      select: { id: true, title: true, poolYes: true, poolNo: true },
    });

    if (markets.length === 0) {
      return { success: false, tradesPlaced: 0, trades: [], error: "No open markets available." };
    }

    // Determine how many trades to place
    const numTrades = Math.min(
      targetTrades ?? (Math.floor(Math.random() * 16) + 10), // 10-25 by default
      MAX_TRADES_PER_RUN
    );

    const tradeResults: BotTradeResult[] = [];

    for (let i = 0; i < numTrades; i++) {
      // Pick a random bot and market
      const bot = bots[Math.floor(Math.random() * bots.length)]!;
      const market = markets[Math.floor(Math.random() * markets.length)]!;

      // Skip if pools are too small
      if (market.poolYes < MIN_POOL_FOR_TRADE || market.poolNo < MIN_POOL_FOR_TRADE) {
        continue;
      }

      const total = market.poolYes + market.poolNo;
      const yesPrice = market.poolNo / total;
      const side = pickSide(yesPrice);
      const amount = pickTradeAmount();

      // Skip if bot can't afford it
      if (bot.balance < amount) continue;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Re-read market state inside transaction
          const m = await tx.market.findUniqueOrThrow({
            where: { id: market.id },
            select: { poolYes: true, poolNo: true, status: true, closesAt: true },
          });

          if (m.status !== "OPEN" || new Date() > m.closesAt) {
            throw new Error("Market not tradeable");
          }

          // Fee calculation
          const fee = Math.round(amount * TRADING_FEE_RATE * 100) / 100;
          const netAmount = amount - fee;

          const tradeResult = calcBuy(
            { poolYes: m.poolYes, poolNo: m.poolNo },
            side,
            netAmount
          );

          // Update market pools
          await tx.market.update({
            where: { id: market.id },
            data: {
              poolYes: tradeResult.newPoolYes,
              poolNo: tradeResult.newPoolNo,
              totalVolume: { increment: amount },
            },
          });

          // Deduct from bot balance
          const updatedBot = await tx.user.update({
            where: { id: bot.id },
            data: { balance: { decrement: amount } },
            select: { balance: true },
          });

          // Create trade record
          const trade = await tx.trade.create({
            data: {
              userId: bot.id,
              marketId: market.id,
              side,
              direction: "BUY",
              amount,
              shares: tradeResult.shares,
              price: tradeResult.effectivePrice,
              fee,
            },
          });

          // Ledger entry
          await tx.ledger.create({
            data: {
              userId: bot.id,
              type: "BUY",
              amount: -amount,
              balanceAfter: updatedBot.balance,
              description: `Bot: ${side} on "${market.title.slice(0, 50)}"`,
              marketId: market.id,
              tradeId: trade.id,
            },
          });

          // Update or create position
          const existingPosition = await tx.position.findUnique({
            where: { userId_marketId_side: { userId: bot.id, marketId: market.id, side } },
          });

          if (existingPosition) {
            const totalShares = existingPosition.shares + tradeResult.shares;
            const totalCost = existingPosition.shares * existingPosition.avgPrice + amount;
            await tx.position.update({
              where: { id: existingPosition.id },
              data: { shares: totalShares, avgPrice: totalCost / totalShares },
            });
          } else {
            await tx.position.create({
              data: {
                userId: bot.id,
                marketId: market.id,
                side,
                shares: tradeResult.shares,
                avgPrice: tradeResult.effectivePrice,
              },
            });
          }

          return tradeResult;
        });

        // Update local bot balance to avoid over-spending
        bot.balance -= amount;

        // Update local market pools for subsequent trades
        market.poolYes = result.newPoolYes;
        market.poolNo = result.newPoolNo;

        tradeResults.push({
          botName: bot.name,
          marketTitle: market.title.slice(0, 60),
          side,
          amount,
          shares: Math.round(result.shares * 100) / 100,
          effectivePrice: Math.round(result.effectivePrice * 100) / 100,
        });

        // Record price snapshot (non-blocking)
        recordPriceSnapshot(market.id).catch(() => {});
      } catch {
        // Skip failed trades (market closed, insufficient balance, etc.)
        continue;
      }
    }

    return {
      success: true,
      tradesPlaced: tradeResults.length,
      trades: tradeResults,
    };
  } catch (err) {
    return {
      success: false,
      tradesPlaced: 0,
      trades: [],
      error: err instanceof Error ? err.message : "Bot trading failed",
    };
  }
}

/**
 * Run reactive bot trading: when a user places a trade, a bot
 * may respond with a counter-trade to simulate a live counterparty.
 * Call this after a user trade completes (non-blocking).
 */
export async function reactiveBot(marketId: string): Promise<void> {
  // 40% chance a bot reacts to any given user trade
  if (Math.random() > 0.4) return;

  // Small delay to make it feel natural (0.5-3 seconds)
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 2500));

  await runBotTrading(1, [marketId]);
}
