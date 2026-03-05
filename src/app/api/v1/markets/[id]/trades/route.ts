import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, API_HEADERS } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const market = await prisma.market.findUnique({ where: { id }, select: { id: true } });
  if (!market) {
    return apiError("Market not found", 404);
  }

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where: { marketId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        side: true,
        direction: true,
        amount: true,
        shares: true,
        price: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.trade.count({ where: { marketId: id } }),
  ]);

  const data = trades.map((t) => ({
    id: t.id,
    side: t.side,
    direction: t.direction,
    amount: Math.round(t.amount * 100) / 100,
    shares: Math.round(t.shares * 100) / 100,
    price: Math.round(t.price * 100) / 100,
    trader: t.user.name,
    createdAt: t.createdAt.toISOString(),
  }));

  return NextResponse.json(
    { data, meta: { total, limit, offset, hasMore: offset + limit < total } },
    { headers: API_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
