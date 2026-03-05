"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marketSchema, resolveMarketSchema } from "@/lib/validations";
import { INITIAL_POOL_SIZE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { sendMarketResolvedEmail, sendWaitlistUpdateEmail } from "@/lib/email";

// ─── CREATE MARKET ────────────────────────────────────────
export async function createMarket(formData: {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  featured: boolean;
  imageUrl?: string;
  resolutionSources?: string;
  disputePeriodHours?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const parsed = marketSchema.safeParse({
    ...formData,
    closesAt: new Date(formData.closesAt),
    disputePeriodHours: formData.disputePeriodHours ?? 24,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const market = await prisma.market.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      closesAt: parsed.data.closesAt,
      featured: parsed.data.featured,
      imageUrl: parsed.data.imageUrl || null,
      createdById: session.user.id,
      poolYes: INITIAL_POOL_SIZE,
      poolNo: INITIAL_POOL_SIZE,
      resolutionSources: parsed.data.resolutionSources || null,
      disputePeriodHours: parsed.data.disputePeriodHours,
    },
  });

  revalidatePath("/markets");
  revalidatePath("/admin/markets");
  return { success: true, marketId: market.id };
}

// ─── PHASE 1: INITIATE RESOLUTION ────────────────────────
// Sets market to PENDING_RESOLUTION — no settlement yet.
// Starts the dispute window countdown.
export async function initiateResolution(data: {
  marketId: string;
  resolution: "YES" | "NO";
  resolutionNote?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const parsed = resolveMarketSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  try {
    await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({
        where: { id: parsed.data.marketId },
      });

      if (market.status !== "OPEN") throw new Error("Market is not open");

      // Expire all pending limit orders for this market
      await tx.order.updateMany({
        where: { marketId: market.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });

      await tx.market.update({
        where: { id: market.id },
        data: {
          status: "PENDING_RESOLUTION",
          resolution: parsed.data.resolution,
          resolutionNote: parsed.data.resolutionNote,
          pendingResolutionAt: new Date(),
        },
      });
    });

    revalidatePath("/markets");
    revalidatePath("/admin/markets");
    revalidatePath(`/markets/${data.marketId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Resolution initiation failed" };
  }
}

// ─── PHASE 2: FINALIZE RESOLUTION ────────────────────────
// Called after the dispute period expires. Settles positions
// and pays winners. Creates WIN/LOSS ledger entries.
export async function finalizeResolution(marketId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({
        where: { id: marketId },
        select: {
          id: true,
          status: true,
          resolution: true,
          resolutionNote: true,
          title: true,
          pendingResolutionAt: true,
          disputePeriodHours: true,
        },
      });

      if (market.status !== "PENDING_RESOLUTION") {
        throw new Error("Market is not pending resolution");
      }
      if (!market.resolution) {
        throw new Error("No resolution set");
      }

      // Check dispute period has elapsed
      if (market.pendingResolutionAt) {
        const disputeEnds = new Date(
          market.pendingResolutionAt.getTime() + market.disputePeriodHours * 60 * 60 * 1000
        );
        if (new Date() < disputeEnds) {
          throw new Error("Dispute period has not ended yet");
        }
      }

      // Update market status to RESOLVED
      await tx.market.update({
        where: { id: market.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      });

      // Dismiss all open disputes for this market
      await tx.dispute.updateMany({
        where: { marketId: market.id, status: "OPEN" },
        data: { status: "DISMISSED" },
      });

      // Find all positions for this market
      const positions = await tx.position.findMany({
        where: { marketId: market.id, shares: { gt: 0 } },
      });

      // Settle positions: pay winners, record WIN/LOSS for everyone
      for (const pos of positions) {
        const isWinner = pos.side === market.resolution;
        const payout = isWinner ? pos.shares : 0;
        const cost = pos.shares * pos.avgPrice;

        if (payout > 0) {
          const updatedUser = await tx.user.update({
            where: { id: pos.userId },
            data: { balance: { increment: payout } },
            select: { balance: true },
          });

          // WIN ledger entry
          await tx.ledger.create({
            data: {
              userId: pos.userId,
              type: "WIN",
              amount: payout,
              balanceAfter: updatedUser.balance,
              description: `Won ${pos.side} on "${market.title.slice(0, 50)}" — ${Math.round(payout)} pts payout`,
              marketId: market.id,
            },
          });
        } else {
          // LOSS ledger entry — no balance change, just record it
          const currentUser = await tx.user.findUniqueOrThrow({
            where: { id: pos.userId },
            select: { balance: true },
          });

          await tx.ledger.create({
            data: {
              userId: pos.userId,
              type: "LOSS",
              amount: 0,
              balanceAfter: currentUser.balance,
              description: `Lost ${pos.side} on "${market.title.slice(0, 50)}" — ${Math.round(cost)} pts invested`,
              marketId: market.id,
            },
          });
        }

        await tx.position.update({
          where: { id: pos.id },
          data: {
            realized: pos.realized + (payout - cost),
          },
        });
      }
    });

    revalidatePath("/markets");
    revalidatePath("/admin/markets");
    revalidatePath(`/markets/${marketId}`);
    revalidatePath("/portfolio");

    // Send email notifications (non-blocking)
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { resolution: true },
    });
    if (market?.resolution) {
      notifyMarketResolved(marketId, market.resolution as "YES" | "NO").catch(console.error);
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Finalization failed" };
  }
}

// ─── REVERT RESOLUTION ──────────────────────────────────
// Admin reverts a PENDING_RESOLUTION market back to OPEN
// (e.g. if a dispute is upheld).
export async function revertResolution(marketId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({
        where: { id: marketId },
      });

      if (market.status !== "PENDING_RESOLUTION") {
        throw new Error("Market is not pending resolution");
      }

      await tx.market.update({
        where: { id: marketId },
        data: {
          status: "OPEN",
          resolution: null,
          resolutionNote: null,
          pendingResolutionAt: null,
        },
      });
    });

    revalidatePath("/markets");
    revalidatePath("/admin/markets");
    revalidatePath(`/markets/${marketId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Revert failed" };
  }
}

// ─── LEGACY: INSTANT RESOLVE (still used for quick resolution) ─
// Resolves immediately without dispute period. Kept for backwards compat.
export async function resolveMarket(data: {
  marketId: string;
  resolution: "YES" | "NO";
  resolutionNote?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const parsed = resolveMarketSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  try {
    await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUniqueOrThrow({
        where: { id: parsed.data.marketId },
      });

      if (market.status !== "OPEN" && market.status !== "PENDING_RESOLUTION") {
        throw new Error("Market cannot be resolved");
      }

      // Expire all pending limit orders
      await tx.order.updateMany({
        where: { marketId: market.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });

      // Update market status
      await tx.market.update({
        where: { id: market.id },
        data: {
          status: "RESOLVED",
          resolution: parsed.data.resolution,
          resolutionNote: parsed.data.resolutionNote,
          resolvedAt: new Date(),
          pendingResolutionAt: null,
        },
      });

      // Dismiss all open disputes
      await tx.dispute.updateMany({
        where: { marketId: market.id, status: "OPEN" },
        data: { status: "DISMISSED" },
      });

      // Find all positions for this market
      const positions = await tx.position.findMany({
        where: { marketId: market.id, shares: { gt: 0 } },
      });

      // Pay out winning positions (1 point per share)
      for (const pos of positions) {
        const isWinner = pos.side === parsed.data.resolution;
        const payout = isWinner ? pos.shares : 0;
        const cost = pos.shares * pos.avgPrice;

        if (payout > 0) {
          const updatedUser = await tx.user.update({
            where: { id: pos.userId },
            data: { balance: { increment: payout } },
            select: { balance: true },
          });

          await tx.ledger.create({
            data: {
              userId: pos.userId,
              type: "WIN",
              amount: payout,
              balanceAfter: updatedUser.balance,
              description: `Won ${pos.side} on "${market.title.slice(0, 50)}" — ${Math.round(payout)} pts payout`,
              marketId: market.id,
            },
          });
        } else {
          const currentUser = await tx.user.findUniqueOrThrow({
            where: { id: pos.userId },
            select: { balance: true },
          });

          await tx.ledger.create({
            data: {
              userId: pos.userId,
              type: "LOSS",
              amount: 0,
              balanceAfter: currentUser.balance,
              description: `Lost ${pos.side} on "${market.title.slice(0, 50)}" — ${Math.round(cost)} pts invested`,
              marketId: market.id,
            },
          });
        }

        await tx.position.update({
          where: { id: pos.id },
          data: {
            realized: pos.realized + (payout - cost),
          },
        });
      }
    });

    revalidatePath("/markets");
    revalidatePath("/admin/markets");
    revalidatePath(`/markets/${data.marketId}`);
    revalidatePath("/portfolio");

    // Send email notifications (non-blocking)
    notifyMarketResolved(data.marketId, parsed.data.resolution).catch(console.error);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Resolution failed" };
  }
}

// ─── EMAIL NOTIFICATIONS ─────────────────────────────────
async function notifyMarketResolved(marketId: string, resolution: "YES" | "NO") {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { title: true, id: true, featured: true },
  });
  if (!market) return;

  // Notify users who traded on this market
  const traders = await prisma.trade.findMany({
    where: { marketId },
    select: { userId: true },
    distinct: ["userId"],
  });

  const traderIds = traders.map((t) => t.userId);
  if (traderIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: traderIds }, emailNotifications: true },
      select: { email: true, name: true },
    });

    for (const user of users) {
      sendMarketResolvedEmail({
        to: user.email,
        userName: user.name,
        marketTitle: market.title,
        resolution,
        marketId: market.id,
      }).catch(console.error);
    }
  }

  // Notify waitlist (featured markets only, limit to avoid spam)
  if (market.featured) {
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      take: 200,
      orderBy: { createdAt: "desc" },
      select: { email: true, name: true },
    });

    for (const entry of waitlistEntries) {
      sendWaitlistUpdateEmail({
        to: entry.email,
        name: entry.name,
        marketTitle: market.title,
        resolution,
        marketId: market.id,
      }).catch(console.error);
    }
  }
}
