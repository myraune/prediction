"use server";

import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";

export async function recordPriceSnapshot(marketId: string) {
  try {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { poolYes: true, poolNo: true },
    });

    if (!market) return;

    const price = getPrice(market);

    await prisma.priceSnapshot.create({
      data: {
        marketId,
        yesPrice: price.yes,
        noPrice: price.no,
      },
    });
  } catch {
    // Silently fail — snapshot is non-critical
  }
}

export async function getPriceHistory(marketId: string, timeRange: string = "ALL") {
  const now = new Date();
  let since: Date | undefined;

  switch (timeRange) {
    case "1D":
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "1W":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1M":
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "ALL":
    default:
      since = undefined;
      break;
  }

  try {
    const snapshots = await prisma.priceSnapshot.findMany({
      where: {
        marketId,
        ...(since ? { timestamp: { gte: since } } : {}),
      },
      orderBy: { timestamp: "asc" },
      take: 500,
    });

    return snapshots.map((s) => ({
      time: s.timestamp.toISOString(),
      yes: Math.round(s.yesPrice * 100),
      no: Math.round(s.noPrice * 100),
    }));
  } catch {
    return [];
  }
}
