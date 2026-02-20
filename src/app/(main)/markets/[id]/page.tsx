import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrice } from "@/lib/amm";
import { formatRelativeDate, formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { CategoryBadge } from "@/components/markets/category-badge";
import { MarketStatsBar } from "@/components/markets/market-stats-bar";
import { PriceChart } from "@/components/charts/price-chart";
import { TradePanel } from "@/components/trading/trade-panel";
import { CommentsSection } from "@/components/markets/comments-section";
import { RelatedMarkets } from "@/components/markets/related-markets";
import { ProbabilityBar } from "@/components/markets/probability-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  let uniqueTraders = 0;
  try {
    const [userData, positions, traderCount] = await Promise.all([
      session?.user?.id
        ? prisma.user.findUnique({
            where: { id: session.user.id },
            select: { balance: true },
          })
        : null,
      session?.user?.id
        ? prisma.position.findMany({
            where: { userId: session.user.id, marketId: id },
          })
        : [],
      prisma.position.groupBy({
        by: ["userId"],
        where: { marketId: id, shares: { gt: 0 } },
      }),
    ]);
    user = userData;
    userPositions = positions;
    uniqueTraders = traderCount.length;
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
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  const statusColor =
    market.status === "OPEN"
      ? "bg-[var(--color-yes)]/10 text-[var(--color-yes)]"
      : market.status === "RESOLVED"
      ? "bg-muted text-foreground"
      : "bg-muted text-muted-foreground";

  // Estimate a 24h change from recent trades
  const recentTrade = market.trades.length > 0 ? market.trades[0] : null;
  const oldTrade = market.trades.length > 3 ? market.trades[market.trades.length - 1] : null;
  const priceChange = recentTrade && oldTrade
    ? Math.round((recentTrade.price - oldTrade.price) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Main content */}
      <div className="space-y-6 min-w-0">
        {/* Market image banner */}
        {market.imageUrl && (
          <div className="relative h-48 sm:h-56 w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* Large price overlay on banner */}
            <div className="absolute bottom-4 left-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tabular-nums drop-shadow-lg">
                  {yesCents}¢
                </span>
                <span className="text-sm text-white/70 font-medium">YES</span>
              </div>
              {priceChange !== 0 && (
                <div className={cn(
                  "flex items-center gap-0.5 mt-0.5",
                  priceChange > 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
                )}>
                  {priceChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="text-xs font-semibold drop-shadow">{priceChange > 0 ? "+" : ""}{priceChange}¢</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Title + badges + large price */}
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CategoryBadge category={market.category} />
            <Badge variant="outline" className={statusColor}>
              {market.status}
            </Badge>
            {market.resolution && (
              <Badge className={
                market.resolution === "YES"
                  ? "bg-[var(--color-yes)] text-white"
                  : "bg-[var(--color-no)] text-white"
              }>
                Resolved: {market.resolution}
              </Badge>
            )}
            {closing && market.status === "OPEN" && (
              <Badge variant="outline" className="text-[var(--color-no)] border-[var(--color-no)]/30">
                <Clock className="h-3 w-3 mr-1" />
                Closing {timeLeft}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{market.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{market.description}</p>

          {/* Large cent price display — only show if no image (avoid duplication) */}
          {!market.imageUrl && (
            <div className="flex items-baseline gap-4 mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums text-[var(--color-yes)]">{yesCents}¢</span>
                <span className="text-sm font-medium text-[var(--color-yes)]/70">YES</span>
              </div>
              <div className="text-muted-foreground text-lg">/</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums text-[var(--color-no)]">{noCents}¢</span>
                <span className="text-sm font-medium text-[var(--color-no)]/70">NO</span>
              </div>
              {priceChange !== 0 && (
                <div className={cn(
                  "flex items-center gap-0.5 text-sm font-semibold",
                  priceChange > 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
                )}>
                  {priceChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {priceChange > 0 ? "+" : ""}{priceChange}¢
                </div>
              )}
            </div>
          )}
        </div>

        {/* Probability bar */}
        <ProbabilityBar yesPercent={price.yes * 100} size="lg" />

        {/* Enhanced stats bar */}
        <MarketStatsBar
          yesPrice={price.yes}
          noPrice={price.no}
          totalVolume={market.totalVolume}
          tradeCount={market._count.trades}
          closesAt={market.closesAt}
        />

        {/* Extra info row — traders, created date */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span><strong className="text-foreground">{uniqueTraders}</strong> unique traders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span><strong className="text-foreground">{formatCompactNumber(market.totalVolume)}</strong> total volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Created {formatRelativeDate(market.createdAt)}</span>
          </div>
        </div>

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
                  const pnlPercent = pos.avgPrice > 0 ? ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 : 0;
                  return (
                    <div key={pos.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          pos.side === "YES"
                            ? "bg-[var(--color-yes)]/20 text-[var(--color-yes)]"
                            : "bg-[var(--color-no)]/20 text-[var(--color-no)]"
                        }>
                          {pos.side}
                        </Badge>
                        <span className="text-sm font-medium tabular-nums">
                          {pos.shares.toFixed(2)} shares
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          Avg: {Math.round(pos.avgPrice * 100)}¢ &rarr; {Math.round(currentPrice * 100)}¢
                        </p>
                        <p className={`text-xs tabular-nums ${pnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} pts ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent trades — enhanced with more data */}
        {market.trades.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <span className="text-xs text-muted-foreground">{market._count.trades} total trades</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {market.trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.user.name}</span>
                      <span className="text-muted-foreground">{trade.direction.toLowerCase()}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] h-5",
                        trade.side === "YES"
                          ? "text-[var(--color-yes)] border-[var(--color-yes)]/30"
                          : "text-[var(--color-no)] border-[var(--color-no)]/30"
                      )}>
                        {trade.side}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground tabular-nums">
                      <span className="font-medium text-foreground">{trade.shares.toFixed(2)}</span>
                      <span className="mx-1">@</span>
                      <span className={cn(
                        "font-medium",
                        trade.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
                      )}>
                        {Math.round(trade.price * 100)}¢
                      </span>
                      <span className="ml-2 text-muted-foreground">{formatRelativeDate(trade.createdAt)}</span>
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
      <div className="lg:sticky lg:top-[72px] lg:h-fit space-y-4">
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

        {/* Market info card in sidebar */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn("text-[10px] h-5", statusColor)}>{market.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium tabular-nums">{formatCompactNumber(market.totalVolume)} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Traders</span>
                <span className="font-medium tabular-nums">{uniqueTraders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total trades</span>
                <span className="font-medium tabular-nums">{market._count.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closes</span>
                <span className={cn(
                  "font-medium",
                  closing && "text-[var(--color-no)]"
                )}>
                  {timeLeft}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
