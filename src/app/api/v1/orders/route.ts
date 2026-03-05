import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiError, apiSuccess, API_HEADERS } from "@/lib/api-auth";
import { limitOrderSchema } from "@/lib/validations";
import { MAX_PENDING_ORDERS } from "@/lib/constants";

// POST /api/v1/orders — Create a limit order
export async function POST(request: NextRequest) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized. Provide a valid API key via Authorization: Bearer vm_...", 401);
  }

  let body: { marketId?: string; side?: string; targetPrice?: number; amount?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = limitOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid data", 400);
  }

  const { marketId, side, targetPrice, amount } = parsed.data;

  try {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { status: true, closesAt: true },
    });
    if (!market) return apiError("Market not found", 404);
    if (market.status !== "OPEN") return apiError("Market is not open", 400);
    if (new Date() > market.closesAt) return apiError("Market has closed", 400);

    if (user.balance < amount) return apiError("Insufficient balance", 400);

    const pendingCount = await prisma.order.count({
      where: { userId: user.id, marketId, status: "PENDING" },
    });
    if (pendingCount >= MAX_PENDING_ORDERS) {
      return apiError(`Maximum ${MAX_PENDING_ORDERS} pending orders per market`, 400);
    }

    const order = await prisma.order.create({
      data: { userId: user.id, marketId, side, targetPrice, amount, status: "PENDING" },
    });

    return apiSuccess({
      orderId: order.id,
      marketId,
      side,
      targetPrice,
      amount,
      status: "PENDING",
    }, 201);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to create order", 500);
  }
}

// GET /api/v1/orders — List user's orders
export async function GET(request: NextRequest) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // optional filter
  const marketId = searchParams.get("marketId"); // optional filter

  const where: Record<string, unknown> = { userId: user.id };
  if (status) where.status = status;
  if (marketId) where.marketId = marketId;

  const orders = await prisma.order.findMany({
    where,
    include: { market: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(
    orders.map((o) => ({
      id: o.id,
      marketId: o.marketId,
      marketTitle: o.market.title,
      side: o.side,
      targetPrice: o.targetPrice,
      amount: o.amount,
      status: o.status,
      filledAt: o.filledAt,
      tradeId: o.tradeId,
      createdAt: o.createdAt,
    }))
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: API_HEADERS });
}
