import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiError, apiSuccess, API_HEADERS } from "@/lib/api-auth";

// GET /api/v1/orders/:id — Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { market: { select: { title: true } } },
  });

  if (!order) return apiError("Order not found", 404);
  if (order.userId !== user.id) return apiError("Not your order", 403);

  return apiSuccess({
    id: order.id,
    marketId: order.marketId,
    marketTitle: order.market.title,
    side: order.side,
    targetPrice: order.targetPrice,
    amount: order.amount,
    status: order.status,
    filledAt: order.filledAt,
    tradeId: order.tradeId,
    createdAt: order.createdAt,
  });
}

// DELETE /api/v1/orders/:id — Cancel a pending order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateApiKey(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.userId !== user.id) return apiError("Not your order", 403);
    if (order.status !== "PENDING") return apiError("Order is not pending", 400);

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return apiSuccess({ id, status: "CANCELLED" });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to cancel order", 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: API_HEADERS });
}
