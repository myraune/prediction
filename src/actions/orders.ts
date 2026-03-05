"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buyShares as calcBuy } from "@/lib/amm";
import { limitOrderSchema } from "@/lib/validations";
import { TRADING_FEE_RATE, MAX_PENDING_ORDERS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { recordPriceSnapshot } from "./snapshots";

// ─── CREATE LIMIT ORDER ─────────────────────────────────
export async function createLimitOrder(data: {
  marketId: string;
  side: "YES" | "NO";
  targetPrice: number;
  amount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  const parsed = limitOrderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { marketId, side, targetPrice, amount } = parsed.data;

  try {
    // Validate market is open
    const market = await prisma.market.findUniqueOrThrow({
      where: { id: marketId },
      select: { status: true, closesAt: true },
    });
    if (market.status !== "OPEN") return { error: "Market is not open" };
    if (new Date() > market.closesAt) return { error: "Market has closed" };

    // Check user balance
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balance: true },
    });
    if (user.balance < amount) return { error: "Insufficient balance" };

    // Check pending order limit
    const pendingCount = await prisma.order.count({
      where: { userId, marketId, status: "PENDING" },
    });
    if (pendingCount >= MAX_PENDING_ORDERS) {
      return { error: `Maximum ${MAX_PENDING_ORDERS} pending orders per market` };
    }

    const order = await prisma.order.create({
      data: { userId, marketId, side, targetPrice, amount, status: "PENDING" },
    });

    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/portfolio");
    return { success: true, orderId: order.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create order" };
  }
}

// ─── CANCEL ORDER ───────────────────────────────────────
export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { userId: true, marketId: true, status: true },
    });

    if (order.userId !== session.user.id) return { error: "Not your order" };
    if (order.status !== "PENDING") return { error: "Order is not pending" };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/markets/${order.marketId}`);
    revalidatePath("/portfolio");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel order" };
  }
}

// ─── MATCH ORDERS (called after every AMM trade) ────────
// Checks if any pending limit orders should auto-execute based on current price
export async function matchOrders(marketId: string, depth: number = 0): Promise<number> {
  // Cap recursion to prevent infinite loops
  if (depth > 3) return 0;

  try {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { poolYes: true, poolNo: true, status: true, closesAt: true, title: true },
    });

    if (!market || market.status !== "OPEN" || new Date() > market.closesAt) return 0;

    const total = market.poolYes + market.poolNo;
    const currentYesPrice = market.poolNo / total;
    const currentNoPrice = market.poolYes / total;

    // Find matching pending orders
    const pendingOrders = await prisma.order.findMany({
      where: { marketId, status: "PENDING" },
      include: { user: { select: { id: true, balance: true } } },
      orderBy: { createdAt: "asc" }, // FIFO
    });

    let filled = 0;

    for (const order of pendingOrders) {
      // Check if order should fill:
      // YES order fills when price drops to target or lower (buying cheap)
      // NO order fills when NO price drops to target or lower
      const shouldFill =
        (order.side === "YES" && currentYesPrice <= order.targetPrice) ||
        (order.side === "NO" && currentNoPrice <= order.targetPrice);

      if (!shouldFill) continue;

      // Check balance
      if (order.user.balance < order.amount) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Re-read market inside tx
          const m = await tx.market.findUniqueOrThrow({
            where: { id: marketId },
            select: { poolYes: true, poolNo: true, status: true, closesAt: true, title: true },
          });
          if (m.status !== "OPEN" || new Date() > m.closesAt) throw new Error("Market closed");

          const fee = Math.round(order.amount * TRADING_FEE_RATE * 100) / 100;
          const netAmount = order.amount - fee;

          const tradeResult = calcBuy(
            { poolYes: m.poolYes, poolNo: m.poolNo },
            order.side as "YES" | "NO",
            netAmount
          );

          await tx.market.update({
            where: { id: marketId },
            data: {
              poolYes: tradeResult.newPoolYes,
              poolNo: tradeResult.newPoolNo,
              totalVolume: { increment: order.amount },
            },
          });

          const updatedUser = await tx.user.update({
            where: { id: order.userId },
            data: { balance: { decrement: order.amount } },
            select: { balance: true },
          });

          const trade = await tx.trade.create({
            data: {
              userId: order.userId,
              marketId,
              side: order.side,
              direction: "BUY",
              amount: order.amount,
              shares: tradeResult.shares,
              price: tradeResult.effectivePrice,
              fee,
            },
          });

          // Ledger entry
          await tx.ledger.create({
            data: {
              userId: order.userId,
              type: "BUY",
              amount: -order.amount,
              balanceAfter: updatedUser.balance,
              description: `Limit order filled: ${order.side} on "${m.title.slice(0, 50)}" @ ${Math.round(order.targetPrice * 100)}¢ (fee: ${fee} pts)`,
              marketId,
              tradeId: trade.id,
            },
          });

          // Update position
          const existingPosition = await tx.position.findUnique({
            where: { userId_marketId_side: { userId: order.userId, marketId, side: order.side } },
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
                userId: order.userId,
                marketId,
                side: order.side,
                shares: tradeResult.shares,
                avgPrice: tradeResult.effectivePrice,
              },
            });
          }

          // Mark order as filled
          await tx.order.update({
            where: { id: order.id },
            data: { status: "FILLED", filledAt: new Date(), tradeId: trade.id },
          });
        });

        filled++;
        recordPriceSnapshot(marketId).catch(() => {});
      } catch {
        // Skip failed orders
        continue;
      }
    }

    // Recursive: filled orders may have changed price enough to trigger more
    if (filled > 0 && depth < 3) {
      filled += await matchOrders(marketId, depth + 1);
    }

    return filled;
  } catch {
    return 0;
  }
}
