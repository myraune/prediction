import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { API_HEADERS } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status") || "OPEN";
  const region = searchParams.get("region");
  const featured = searchParams.get("featured");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const sort = searchParams.get("sort") || "volume";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (region) where.region = region;
  if (featured === "true") where.featured = true;

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case "volume": orderBy.totalVolume = "desc"; break;
    case "newest": orderBy.createdAt = "desc"; break;
    case "closing": orderBy.closesAt = "asc"; break;
    default: orderBy.totalVolume = "desc";
  }

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        resolution: true,
        closesAt: true,
        createdAt: true,
        featured: true,
        region: true,
        poolYes: true,
        poolNo: true,
        totalVolume: true,
        imageUrl: true,
      },
    }),
    prisma.market.count({ where }),
  ]);

  const data = markets.map((m) => {
    const price = getPrice({ poolYes: m.poolYes, poolNo: m.poolNo });
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      resolution: m.resolution,
      closesAt: m.closesAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
      featured: m.featured,
      region: m.region,
      volume: Math.round(m.totalVolume),
      probability: Math.round(price.yes * 1000) / 10,
      yesPrice: Math.round(price.yes * 100) / 100,
      noPrice: Math.round(price.no * 100) / 100,
      imageUrl: m.imageUrl,
    };
  });

  return NextResponse.json(
    { data, meta: { total, limit, offset, hasMore: offset + limit < total } },
    { headers: API_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_HEADERS });
}
