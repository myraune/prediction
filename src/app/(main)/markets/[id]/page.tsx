import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrice } from "@/lib/amm";
import { formatRelativeDate, formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { MarketStatsBar } from "@/components/markets/market-stats-bar";
import { PriceChart } from "@/components/charts/price-chart";
import { TradePanel } from "@/components/trading/trade-panel";
import { CommentsSection } from "@/components/markets/comments-section";
import { RelatedMarkets } from "@/components/markets/related-markets";
import { ProbabilityBar } from "@/components/markets/probability-bar";
import { Badge } from "@/components/ui/badge";
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
          take: 15,
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
        ? prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } })
        : null,
      session?.user?.id
        ? prisma.position.findMany({ where: { userId: session.user.id, marketId: id } })
        : [],
      prisma.position.groupBy({ by: ["userId"], where: { marketId: id, shares: { gt: 0 } } }),
    ]);
    user = userData;
    userPositions = positions;
    uniqueTraders = traderCount.length;
  } catch {
    // non-critical
  }

  let relatedMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let priceChange24h: number | null = null;
  try {
    const [related, snapshot24h] = await Promise.all([
      prisma.market.findMany({
        where: { category: market.category, id: { not: market.id }, status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 4,
      }),
      prisma.priceSnapshot.findFirst({
        where: {
          marketId: id,
          timestamp: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: "desc" },
      }),
    ]);
    relatedMarkets = related;
    if (snapshot24h) {
      const currentYes = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo }).yes;
      priceChange24h = Math.round((currentYes - snapshot24h.yesPrice) * 100);
    }
  } catch {
    // non-critical
  }

  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  const categoryLabels: Record<string, string> = {
    POLITICS: "Politics", SPORTS: "Sports", CRYPTO: "Crypto", CLIMATE: "Climate",
    ECONOMICS: "Economics", CULTURE: "Culture", COMPANIES: "Companies",
    FINANCIALS: "Financials", TECH_SCIENCE: "Tech & Science", ENTERTAINMENT: "Entertainment",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main */}
      <div className="space-y-6 min-w-0">
        {/* Small thumbnail — Kalshi-style (not a big hero) */}
        {market.imageUrl && (
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 float-right ml-3 mb-1">
            <Image src={market.imageUrl} alt={market.title} fill className="object-cover" sizes="48px" priority />
          </div>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-muted-foreground font-medium">{categoryLabels[market.category] ?? market.category}</span>
            {market.status === "RESOLVED" && market.resolution && (
              <Badge className={market.resolution === "YES" ? "bg-[var(--color-yes)] text-white" : "bg-[var(--color-no)] text-white"}>
                Resolved {market.resolution}
              </Badge>
            )}
            {closing && market.status === "OPEN" && (
              <Badge variant="outline" className="text-[var(--color-no)] border-[var(--color-no)]/30">
                Closes {timeLeft}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{market.title}</h1>
          {market.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{market.description}</p>
          )}
        </div>

        {/* Big price */}
        <div className="flex items-baseline gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-[var(--color-yes)]">{yesCents}¢</span>
            <span className="text-sm text-muted-foreground">Yes</span>
          </div>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-[var(--color-no)]">{noCents}¢</span>
            <span className="text-sm text-muted-foreground">No</span>
          </div>
          {priceChange24h !== null && priceChange24h !== 0 && (
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              priceChange24h > 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
            )}>
              {priceChange24h > 0 ? "▲" : "▼"} {Math.abs(priceChange24h)}¢ 24h
            </span>
          )}
        </div>

        <ProbabilityBar yesPercent={price.yes * 100} size="lg" />

        <MarketStatsBar
          yesPrice={price.yes}
          noPrice={price.no}
          totalVolume={market.totalVolume}
          tradeCount={market._count.trades}
          closesAt={market.closesAt}
        />

        {/* Info row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{uniqueTraders}</strong> traders</span>
          <span><strong className="text-foreground">{formatCompactNumber(market.totalVolume)}</strong> volume</span>
          <span>Created {formatRelativeDate(market.createdAt)}</span>
        </div>

        {/* Chart */}
        <div className="rounded-xl border p-3 bg-card">
          <h3 className="text-sm font-medium mb-3">Price History</h3>
          <PriceChart marketId={market.id} currentYesPrice={price.yes} />
        </div>

        {/* Resolution rules */}
        {market.resolutionNote && (
          <div className="rounded-xl border p-3 bg-card">
            <h3 className="text-sm font-medium mb-2">Resolution Rules</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{market.resolutionNote}</p>
          </div>
        )}

        {/* User positions */}
        {userPositions.length > 0 && (
          <div className="rounded-xl border p-3 bg-card">
            <h3 className="text-sm font-medium mb-3">Your Positions</h3>
            <div className="space-y-2">
              {userPositions.map((pos) => {
                const cp = pos.side === "YES" ? price.yes : price.no;
                const pnl = pos.shares * (cp - pos.avgPrice);
                return (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={pos.side === "YES" ? "bg-[var(--color-yes)]/15 text-[var(--color-yes)]" : "bg-[var(--color-no)]/15 text-[var(--color-no)]"}>
                        {pos.side}
                      </Badge>
                      <span className="tabular-nums">{pos.shares.toFixed(2)} shares</span>
                    </div>
                    <div className="text-right">
                      <span className="tabular-nums">{Math.round(pos.avgPrice * 100)}¢ → {Math.round(cp * 100)}¢</span>
                      <span className={cn("ml-2 font-medium tabular-nums", pnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]")}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent trades */}
        {market.trades.length > 0 && (
          <div className="rounded-xl border p-3 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">{market._count.trades} total</span>
            </div>
            <div className="space-y-0">
              {market.trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{trade.user.name}</span>
                    <span className="text-muted-foreground">{trade.direction.toLowerCase()}</span>
                    <span className={cn("text-xs font-medium", trade.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]")}>
                      {trade.side}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{trade.shares.toFixed(2)}</span>
                    <span className="mx-1">@</span>
                    <span className={trade.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}>
                      {Math.round(trade.price * 100)}¢
                    </span>
                    <span className="ml-2">{formatRelativeDate(trade.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CommentsSection marketId={market.id} />

        {relatedMarkets.length > 0 && <RelatedMarkets markets={relatedMarkets} />}
      </div>

      {/* Sidebar */}
      <div className="lg:sticky lg:top-[64px] lg:h-fit space-y-4">
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

        {/* Market info */}
        <div className="rounded-xl border p-3 bg-card space-y-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Market Info</h4>
          {[
            { label: "Status", value: market.status === "OPEN" ? "Open" : market.status.charAt(0) + market.status.slice(1).toLowerCase() },
            { label: "Volume", value: `$${formatCompactNumber(market.totalVolume)}` },
            { label: "Traders", value: String(uniqueTraders) },
            { label: "Trades", value: String(market._count.trades) },
            { label: "Closes", value: timeLeft },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={cn("font-medium tabular-nums", row.label === "Closes" && closing && "text-[var(--color-no)]")}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
