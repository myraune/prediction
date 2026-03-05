"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buyShares as calcBuy, sellShares as calcSell } from "@/lib/amm";
import { revalidatePath } from "next/cache";
import { tradeSchema } from "@/lib/validations";
import { TRADING_FEE_RATE } from "@/lib/constants";
import { recordPriceSnapshot } from "./snapshots";
import { reactiveBot } from "./bot-trading";
import { matchOrders } from "./orders";

export async function buySharesAction(data: { marketId: string; side: "YES" | "NO"; amount: number }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  const parsed = tradeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { marketId, side, amount } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      if (market.status !== "OPEN") throw new Error("Market is not open");
      if (new Date() > market.closesAt) throw new Error("Market has closed");
      if (user.balance < amount) throw new Error("Insufficient balance");

      // Calculate fee: 2% of trade amount
      const fee = Math.round(amount * TRADING_FEE_RATE * 100) / 100;
      const netAmount = amount - fee;

      const tradeResult = calcBuy(
        { poolYes: market.poolYes, poolNo: market.poolNo },
        side,
        netAmount // Only net amount goes to AMM
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
        where: { id: userId },
        data: { balance: { decrement: amount } },
        select: { balance: true },
      });

      const trade = await tx.trade.create({
        data: {
          userId,
          marketId,
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
          userId,
          type: "BUY",
          amount: -amount,
          balanceAfter: updatedUser.balance,
          description: `Bought ${side} on "${market.title.slice(0, 60)}" (fee: ${fee} pts)`,
          marketId,
          tradeId: trade.id,
        },
      });

      const existingPosition = await tx.position.findUnique({
        where: { userId_marketId_side: { userId, marketId, side } },
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
          data: {
            userId,
            marketId,
            side,
            shares: tradeResult.shares,
            avgPrice: tradeResult.effectivePrice,
          },
        });
      }

      return { ...tradeResult, fee };
    });

    // Non-blocking post-trade tasks
    recordPriceSnapshot(marketId).catch(() => {});
    reactiveBot(marketId).catch(() => {});
    matchOrders(marketId).catch(() => {});

    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/portfolio");
    return { success: true, shares: result.shares, price: result.effectivePrice, fee: result.fee };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Trade failed" };
  }
}

export async function sellSharesAction(data: { marketId: string; side: "YES" | "NO"; shares: number }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  const { marketId, side, shares } = data;
  if (shares <= 0) return { error: "Invalid share amount" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
      if (market.status !== "OPEN") throw new Error("Market is not open");

      const position = await tx.position.findUnique({
        where: { userId_marketId_side: { userId, marketId, side } },
      });

      if (!position || position.shares < shares) throw new Error("Insufficient shares");

      const tradeResult = calcSell(
        { poolYes: market.poolYes, poolNo: market.poolNo },
        side,
        shares
      );

      await tx.market.update({
        where: { id: marketId },
        data: {
          poolYes: tradeResult.newPoolYes,
          poolNo: tradeResult.newPoolNo,
        },
      });

      const grossReceived = side === "YES"
        ? market.poolNo - tradeResult.newPoolNo
        : market.poolYes - tradeResult.newPoolYes;

      // Calculate fee: 2% of gross proceeds
      const fee = Math.round(grossReceived * TRADING_FEE_RATE * 100) / 100;
      const netReceived = grossReceived - fee;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: netReceived } },
        select: { balance: true },
      });

      const trade = await tx.trade.create({
        data: {
          userId,
          marketId,
          side,
          direction: "SELL",
          amount: grossReceived,
          shares,
          price: tradeResult.effectivePrice,
          fee,
        },
      });

      // Ledger entry
      await tx.ledger.create({
        data: {
          userId,
          type: "SELL",
          amount: netReceived,
          balanceAfter: updatedUser.balance,
          description: `Sold ${side} on "${market.title.slice(0, 60)}" (fee: ${fee} pts)`,
          marketId,
          tradeId: trade.id,
        },
      });

      await tx.position.update({
        where: { id: position.id },
        data: {
          shares: position.shares - shares,
          realized: position.realized + (netReceived - shares * position.avgPrice),
        },
      });

      return { pointsReceived: netReceived, effectivePrice: tradeResult.effectivePrice, fee };
    });

    // Non-blocking post-trade tasks
    recordPriceSnapshot(marketId).catch(() => {});
    reactiveBot(marketId).catch(() => {});
    matchOrders(marketId).catch(() => {});

    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/portfolio");
    return { success: true, ...result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sell failed" };
  }
}
