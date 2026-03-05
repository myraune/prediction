import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { authenticateApiKey, apiError, API_HEADERS } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized. Provide a valid API key via Authorization: Bearer vm_...", 401);
  }

  const positions = await prisma.position.findMany({
    where: { userId: user.id, shares: { gt: 0.01 } },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          poolYes: true,
          poolNo: true,
          closesAt: true,
        },
      },
    },
  });

  const data = positions.map((pos) => {
    const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
    const currentPrice = pos.side === "YES" ? price.yes : price.no;
    const currentValue = pos.shares * currentPrice;
    const cost = pos.shares * pos.avgPrice;
    const unrealizedPnl = currentValue - cost;

    return {
      marketId: pos.market.id,
      marketTitle: pos.market.title,
      marketStatus: pos.market.status,
      category: pos.market.category,
      closesAt: pos.market.closesAt.toISOString(),
      side: pos.side,
      shares: Math.round(pos.shares * 100) / 100,
      avgPrice: Math.round(pos.avgPrice * 100) / 100,
      currentPrice: Math.round(currentPrice * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      realizedPnl: Math.round(pos.realized * 100) / 100,
    };
  });

  const summary = {
    totalPositions: data.length,
    totalValue: Math.round(data.reduce((s, p) => s + p.currentValue, 0) * 100) / 100,
    totalCost: Math.round(data.reduce((s, p) => s + p.cost, 0) * 100) / 100,
    totalUnrealizedPnl: Math.round(data.reduce((s, p) => s + p.unrealizedPnl, 0) * 100) / 100,
    totalRealizedPnl: Math.round(data.reduce((s, p) => s + p.realizedPnl, 0) * 100) / 100,
    balance: Math.round(user.balance * 100) / 100,
  };

  return NextResponse.json({ data, summary }, { headers: API_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
