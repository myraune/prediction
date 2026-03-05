import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buyShares as calcBuy, sellShares as calcSell } from "@/lib/amm";
import { authenticateApiKey, apiError, apiSuccess, API_HEADERS } from "@/lib/api-auth";
import { TRADING_FEE_RATE } from "@/lib/constants";
import { recordPriceSnapshot } from "@/actions/snapshots";
import { reactiveBot } from "@/actions/bot-trading";
import { matchOrders } from "@/actions/orders";

export async function POST(request: NextRequest) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized. Provide a valid API key via Authorization: Bearer vm_...", 401);
  }

  let body: { marketId?: string; side?: string; direction?: string; amount?: number; shares?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { marketId, side, direction = "BUY", amount, shares } = body;

  if (!marketId) return apiError("marketId is required");
  if (!side || !["YES", "NO"].includes(side)) return apiError("side must be YES or NO");
  if (!["BUY", "SELL"].includes(direction)) return apiError("direction must be BUY or SELL");

  if (direction === "BUY") {
    if (!amount || amount <= 0) return apiError("amount must be a positive number for BUY");
    if (amount > 500) return apiError("Maximum trade amount is 500 points");

    try {
      const result = await prisma.$transaction(async (tx) => {
        const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
        const dbUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });

        if (market.status !== "OPEN") throw new Error("Market is not open");
        if (new Date() > market.closesAt) throw new Error("Market has closed");
        if (dbUser.balance < amount) throw new Error("Insufficient balance");

        const fee = Math.round(amount * TRADING_FEE_RATE * 100) / 100;
        const netAmount = amount - fee;

        const tradeResult = calcBuy(
          { poolYes: market.poolYes, poolNo: market.poolNo },
          side as "YES" | "NO",
          netAmount
        );

        await tx.market.update({
          where: { id: marketId },
          data: {
            poolYes: tradeResult.newPoolYes,
            poolNo: tradeResult.newPoolNo,
            totalVolume: { increment: amount },
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
          select: { balance: true },
        });

        const trade = await tx.trade.create({
          data: {
            userId: user.id, marketId, side, direction: "BUY",
            amount, shares: tradeResult.shares, price: tradeResult.effectivePrice, fee,
          },
        });

        await tx.ledger.create({
          data: {
            userId: user.id, type: "BUY", amount: -amount, balanceAfter: updatedUser.balance,
            description: `API: Bought ${side} on "${market.title.slice(0, 50)}" (fee: ${fee} pts)`,
            marketId, tradeId: trade.id,
          },
        });

        const existingPosition = await tx.position.findUnique({
          where: { userId_marketId_side: { userId: user.id, marketId, side } },
        });

        if (existingPosition) {
          const totalShares = existingPosition.shares + tradeResult.shares;
          const totalCost = existingPosition.shares * existingPosition.avgPrice + netAmount;
          await tx.position.update({
            where: { id: existingPosition.id },
            data: { shares: totalShares, avgPrice: totalCost / totalShares },
          });
        } else {
          await tx.position.create({
            data: { userId: user.id, marketId, side, shares: tradeResult.shares, avgPrice: tradeResult.effectivePrice },
          });
        }

        return {
          tradeId: trade.id, side, direction: "BUY", amount, fee,
          shares: Math.round(tradeResult.shares * 100) / 100,
          effectivePrice: Math.round(tradeResult.effectivePrice * 100) / 100,
          newBalance: Math.round(updatedUser.balance * 100) / 100,
        };
      });

      recordPriceSnapshot(marketId).catch(() => {});
      reactiveBot(marketId).catch(() => {});
      matchOrders(marketId).catch(() => {});
      return apiSuccess(result, 201);
    } catch (err) {
      return apiError(err instanceof Error ? err.message : "Trade failed", 400);
    }
  } else {
    // SELL
    if (!shares || shares <= 0) return apiError("shares must be a positive number for SELL");

    try {
      const result = await prisma.$transaction(async (tx) => {
        const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
        if (market.status !== "OPEN") throw new Error("Market is not open");

        const position = await tx.position.findUnique({
          where: { userId_marketId_side: { userId: user.id, marketId, side } },
        });
        if (!position || position.shares < shares) throw new Error("Insufficient shares");

        const tradeResult = calcSell(
          { poolYes: market.poolYes, poolNo: market.poolNo },
          side as "YES" | "NO",
          shares
        );

        await tx.market.update({
          where: { id: marketId },
          data: { poolYes: tradeResult.newPoolYes, poolNo: tradeResult.newPoolNo },
        });

        const grossReceived = side === "YES"
          ? market.poolNo - tradeResult.newPoolNo
          : market.poolYes - tradeResult.newPoolYes;

        const fee = Math.round(grossReceived * TRADING_FEE_RATE * 100) / 100;
        const netReceived = grossReceived - fee;

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: netReceived } },
          select: { balance: true },
        });

        const trade = await tx.trade.create({
          data: {
            userId: user.id, marketId, side, direction: "SELL",
            amount: grossReceived, shares, price: tradeResult.effectivePrice, fee,
          },
        });

        await tx.ledger.create({
          data: {
            userId: user.id, type: "SELL", amount: netReceived, balanceAfter: updatedUser.balance,
            description: `API: Sold ${side} on "${market.title.slice(0, 50)}" (fee: ${fee} pts)`,
            marketId, tradeId: trade.id,
          },
        });

        await tx.position.update({
          where: { id: position.id },
          data: {
            shares: position.shares - shares,
            realized: position.realized + (netReceived - shares * position.avgPrice),
          },
        });

        return {
          tradeId: trade.id, side, direction: "SELL", fee,
          shares: Math.round(shares * 100) / 100,
          pointsReceived: Math.round(netReceived * 100) / 100,
          effectivePrice: Math.round(tradeResult.effectivePrice * 100) / 100,
          newBalance: Math.round(updatedUser.balance * 100) / 100,
        };
      });

      recordPriceSnapshot(marketId).catch(() => {});
      reactiveBot(marketId).catch(() => {});
      matchOrders(marketId).catch(() => {});
      return apiSuccess(result, 201);
    } catch (err) {
      return apiError(err instanceof Error ? err.message : "Sell failed", 400);
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
