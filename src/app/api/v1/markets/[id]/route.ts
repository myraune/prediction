import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { apiError, API_HEADERS } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      _count: { select: { trades: true, positions: true, comments: true } },
    },
  });

  if (!market) {
    return apiError("Market not found", 404);
  }

  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });

  // Get recent price history
  const priceHistory = await prisma.priceSnapshot.findMany({
    where: { marketId: id },
    orderBy: { timestamp: "desc" },
    take: 100,
    select: { yesPrice: true, noPrice: true, timestamp: true },
  });

  const data = {
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category,
    status: market.status,
    resolution: market.resolution,
    resolutionNote: market.resolutionNote,
    closesAt: market.closesAt.toISOString(),
    resolvedAt: market.resolvedAt?.toISOString() ?? null,
    createdAt: market.createdAt.toISOString(),
    featured: market.featured,
    region: market.region,
    volume: Math.round(market.totalVolume),
    probability: Math.round(price.yes * 1000) / 10,
    yesPrice: Math.round(price.yes * 100) / 100,
    noPrice: Math.round(price.no * 100) / 100,
    pool: { yes: Math.round(market.poolYes * 100) / 100, no: Math.round(market.poolNo * 100) / 100 },
    imageUrl: market.imageUrl,
    stats: {
      trades: market._count.trades,
      traders: market._count.positions,
      comments: market._count.comments,
    },
    priceHistory: priceHistory.reverse().map((s) => ({
      yes: s.yesPrice,
      no: s.noPrice,
      timestamp: s.timestamp.toISOString(),
    })),
  };

  return NextResponse.json({ data }, { headers: API_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
