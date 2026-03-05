import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Auto-finalize markets whose dispute period has expired
export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron or manual trigger)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find markets that are PENDING_RESOLUTION and past their dispute window
    const pendingMarkets = await prisma.market.findMany({
      where: { status: "PENDING_RESOLUTION" },
      select: {
        id: true,
        title: true,
        resolution: true,
        pendingResolutionAt: true,
        disputePeriodHours: true,
      },
    });

    const now = new Date();
    const finalized: string[] = [];
    const errors: string[] = [];

    for (const market of pendingMarkets) {
      if (!market.pendingResolutionAt || !market.resolution) continue;

      const disputeEnds = new Date(
        market.pendingResolutionAt.getTime() + market.disputePeriodHours * 60 * 60 * 1000
      );

      if (now < disputeEnds) continue; // Still in dispute period

      try {
        await prisma.$transaction(async (tx) => {
          // Update market status to RESOLVED
          await tx.market.update({
            where: { id: market.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
            },
          });

          // Dismiss remaining open disputes
          await tx.dispute.updateMany({
            where: { marketId: market.id, status: "OPEN" },
            data: { status: "DISMISSED" },
          });

          // Find all positions
          const positions = await tx.position.findMany({
            where: { marketId: market.id, shares: { gt: 0 } },
          });

          // Settle positions with ledger entries
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

        finalized.push(market.title);
      } catch (err) {
        errors.push(`${market.title}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingMarkets.length,
      finalized: finalized.length,
      finalizedMarkets: finalized,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
