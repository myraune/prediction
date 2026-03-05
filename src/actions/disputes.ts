"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disputeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// ─── CREATE DISPUTE ─────────────────────────────────────
// Users can file a dispute during the PENDING_RESOLUTION window
export async function createDispute(data: { marketId: string; reason: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = disputeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  try {
    const market = await prisma.market.findUniqueOrThrow({
      where: { id: parsed.data.marketId },
      select: {
        id: true,
        status: true,
        pendingResolutionAt: true,
        disputePeriodHours: true,
      },
    });

    if (market.status !== "PENDING_RESOLUTION") {
      return { error: "Market is not pending resolution" };
    }

    // Check dispute window hasn't closed
    if (market.pendingResolutionAt) {
      const disputeEnds = new Date(
        market.pendingResolutionAt.getTime() + market.disputePeriodHours * 60 * 60 * 1000
      );
      if (new Date() > disputeEnds) {
        return { error: "Dispute period has ended" };
      }
    }

    // Check user has a position in this market (must have skin in the game)
    const position = await prisma.position.findFirst({
      where: { userId: session.user.id, marketId: market.id, shares: { gt: 0 } },
    });
    if (!position) {
      return { error: "You must have an active position to file a dispute" };
    }

    // Check user hasn't already disputed this market
    const existing = await prisma.dispute.findUnique({
      where: { marketId_userId: { marketId: market.id, userId: session.user.id } },
    });
    if (existing) {
      return { error: "You have already filed a dispute on this market" };
    }

    await prisma.$transaction([
      prisma.dispute.create({
        data: {
          marketId: market.id,
          userId: session.user.id,
          reason: parsed.data.reason,
        },
      }),
      prisma.market.update({
        where: { id: market.id },
        data: { disputeCount: { increment: 1 } },
      }),
    ]);

    revalidatePath(`/markets/${market.id}`);
    revalidatePath("/admin/markets");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to file dispute" };
  }
}

// ─── DISMISS DISPUTE (Admin) ─────────────────────────────
export async function dismissDispute(disputeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  try {
    const dispute = await prisma.dispute.findUniqueOrThrow({
      where: { id: disputeId },
      select: { id: true, status: true, marketId: true },
    });

    if (dispute.status !== "OPEN") return { error: "Dispute is not open" };

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: "DISMISSED" },
    });

    revalidatePath(`/markets/${dispute.marketId}`);
    revalidatePath("/admin/markets");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to dismiss dispute" };
  }
}

// ─── UPHOLD DISPUTE (Admin) ──────────────────────────────
// Upholds a dispute — admin should then revert the resolution
export async function upholdDispute(disputeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  try {
    const dispute = await prisma.dispute.findUniqueOrThrow({
      where: { id: disputeId },
      select: { id: true, status: true, marketId: true },
    });

    if (dispute.status !== "OPEN") return { error: "Dispute is not open" };

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: "UPHELD" },
    });

    revalidatePath(`/markets/${dispute.marketId}`);
    revalidatePath("/admin/markets");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to uphold dispute" };
  }
}
