import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { API_HEADERS } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 50);

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { balance: "desc" },
    take: limit,
    select: {
      name: true,
      balance: true,
      _count: { select: { trades: true, positions: true } },
    },
  });

  const data = users.map((u, i) => ({
    rank: i + 1,
    name: u.name,
    balance: Math.round(u.balance * 100) / 100,
    totalTrades: u._count.trades,
    activePositions: u._count.positions,
  }));

  return NextResponse.json({ data }, { headers: API_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
