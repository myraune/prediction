"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marketSchema, resolveMarketSchema } from "@/lib/validations";
import { INITIAL_POOL_SIZE } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function createMarket(formData: {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  featured: boolean;
  imageUrl?: string;
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
    },
  });

  revalidatePath("/markets");
  revalidatePath("/admin/markets");
  return { success: true, marketId: market.id };
}

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

      if (market.status !== "OPEN") throw new Error("Market is not open");

      // Update market status
      await tx.market.update({
        where: { id: market.id },
        data: {
          status: "RESOLVED",
          resolution: parsed.data.resolution,
          resolutionNote: parsed.data.resolutionNote,
          resolvedAt: new Date(),
        },
      });

      // Find all positions for this market
      const positions = await tx.position.findMany({
        where: { marketId: market.id, shares: { gt: 0 } },
      });

      // Pay out winning positions (1 point per share)
      for (const pos of positions) {
        const isWinner = pos.side === parsed.data.resolution;
        const payout = isWinner ? pos.shares : 0;

        if (payout > 0) {
          await tx.user.update({
            where: { id: pos.userId },
            data: { balance: { increment: payout } },
          });
        }

        await tx.position.update({
          where: { id: pos.id },
          data: {
            realized: pos.realized + (payout - pos.shares * pos.avgPrice),
          },
        });
      }
    });

    revalidatePath("/markets");
    revalidatePath("/admin/markets");
    revalidatePath(`/markets/${data.marketId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Resolution failed" };
  }
}
