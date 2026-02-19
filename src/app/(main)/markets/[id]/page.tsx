import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrice } from "@/lib/amm";
import { formatRelativeDate } from "@/lib/format";
import { CategoryBadge } from "@/components/markets/category-badge";
import { MarketStatsBar } from "@/components/markets/market-stats-bar";
import { PriceChart } from "@/components/charts/price-chart";
import { TradePanel } from "@/components/trading/trade-panel";
import { CommentsSection } from "@/components/markets/comments-section";
import { RelatedMarkets } from "@/components/markets/related-markets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  let market;
  try {
    market = await prisma.market.findUnique({
      where: { id },
      include: {
        _count: { select: { trades: true } },
        trades: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!market) notFound();

  let user = null;
  let userPositions: Awaited<ReturnType<typeof prisma.position.findMany>> = [];
  try {
    user = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { balance: true },
        })
      : null;

    userPositions = session?.user?.id
      ? await prisma.position.findMany({
          where: { userId: session.user.id, marketId: id },
        })
      : [];
  } catch {
    // Database not available for user data
  }

  // Fetch related markets (same category, excluding current)
  let relatedMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  try {
    relatedMarkets = await prisma.market.findMany({
      where: {
        category: market.category,
        id: { not: market.id },
        status: "OPEN",
      },
      orderBy: { totalVolume: "desc" },
      take: 4,
    });
  } catch {
    // Non-critical
  }

  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });

  const statusColor =
    market.status === "OPEN"
      ? "bg-green-500/10 text-green-700 dark:text-green-400"
      : market.status === "RESOLVED"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : "bg-gray-500/10 text-gray-700 dark:text-gray-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Main content */}
      <div className="space-y-6 min-w-0">
        {/* Title + badges */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={market.category} />
            <Badge variant="outline" className={statusColor}>
              {market.status}
            </Badge>
            {market.resolution && (
              <Badge className={
                market.resolution === "YES"
                  ? "bg-[var(--color-mint)] text-[var(--color-ink)]"
                  : "bg-[var(--color-signal)] text-white"
              }>
                Resolved: {market.resolution}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{market.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{market.description}</p>
        </div>

        {/* Stats bar */}
        <MarketStatsBar
          yesPrice={price.yes}
          noPrice={price.no}
          totalVolume={market.totalVolume}
          tradeCount={market._count.trades}
          closesAt={market.closesAt}
        />

        {/* Price chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart marketId={market.id} currentYesPrice={price.yes} />
          </CardContent>
        </Card>

        {/* Resolution rules */}
        {market.resolutionNote && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resolution Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{market.resolutionNote}</p>
            </CardContent>
          </Card>
        )}

        {/* User positions */}
        {userPositions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPositions.map((pos) => {
                  const currentPrice = pos.side === "YES" ? price.yes : price.no;
                  const pnl = pos.shares * (currentPrice - pos.avgPrice);
                  return (
                    <div key={pos.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          pos.side === "YES"
                            ? "bg-[var(--color-mint)]/20 text-[var(--color-mint)]"
                            : "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
                        }>
                          {pos.side}
                        </Badge>
                        <span className="text-sm font-medium">
                          {pos.shares.toFixed(2)} shares
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Avg: {pos.avgPrice.toFixed(2)} pts
                        </p>
                        <p className={`text-xs ${pnl >= 0 ? "text-[var(--color-mint)]" : "text-[var(--color-signal)]"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} pts
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent trades */}
        {market.trades.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {market.trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.user.name}</span>
                      <span className="text-muted-foreground">{trade.direction.toLowerCase()}</span>
                      <Badge variant="outline" className={
                        trade.side === "YES"
                          ? "bg-[var(--color-mint)]/10 text-[var(--color-mint)]"
                          : "bg-[var(--color-signal)]/10 text-[var(--color-signal)]"
                      }>
                        {trade.side}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <span>{trade.shares.toFixed(2)} @ {trade.price.toFixed(2)}</span>
                      <span className="ml-2">{formatRelativeDate(trade.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <CommentsSection marketId={market.id} />

        {/* Related markets */}
        {relatedMarkets.length > 0 && (
          <RelatedMarkets markets={relatedMarkets} />
        )}
      </div>

      {/* Right sidebar - Trade panel (sticky) */}
      <div className="lg:sticky lg:top-[72px] lg:h-fit">
        <TradePanel
          marketId={market.id}
          poolYes={market.poolYes}
          poolNo={market.poolNo}
          userBalance={user?.balance ?? 0}
          marketStatus={market.status}
          userPositions={userPositions.map((p) => ({
            side: p.side as "YES" | "NO",
            shares: p.shares,
            avgPrice: p.avgPrice,
          }))}
        />
      </div>
    </div>
  );
}
