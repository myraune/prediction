"use server";

import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";

/** Lightweight live data for a single market */
export async function getLiveMarket(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { poolYes: true, poolNo: true, totalVolume: true, status: true },
  });
  if (!market) return null;
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  return {
    yesPrice: Math.round(price.yes * 100),
    noPrice: Math.round(price.no * 100),
    totalVolume: market.totalVolume,
    status: market.status,
  };
}

/** Recent trades across all markets — for the live activity ticker */
export async function getRecentActivity(limit: number = 8) {
  const trades = await prisma.trade.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      side: true,
      direction: true,
      amount: true,
      shares: true,
      price: true,
      createdAt: true,
      user: { select: { name: true } },
      market: { select: { id: true, title: true } },
    },
  });

  return trades.map((t) => ({
    id: t.id,
    userName: t.user.name ?? "Anon",
    marketId: t.market.id,
    marketTitle: t.market.title,
    side: t.side as "YES" | "NO",
    direction: t.direction as "BUY" | "SELL",
    amount: t.amount,
    shares: t.shares,
    price: Math.round(t.price * 100),
    createdAt: t.createdAt.toISOString(),
  }));
}
