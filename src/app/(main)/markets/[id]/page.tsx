import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrice } from "@/lib/amm";
import { formatRelativeDate, formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { PriceChart } from "@/components/charts/price-chart";
import { TradePanel } from "@/components/trading/trade-panel";
import { CommentsSection } from "@/components/markets/comments-section";
import { RelatedMarkets } from "@/components/markets/related-markets";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MarketJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { DisputeBanner } from "@/components/markets/dispute-banner";
import { ResolutionSources } from "@/components/markets/resolution-sources";
import { OrderBook } from "@/components/trading/order-book";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const market = await prisma.market.findUnique({
    where: { id },
    select: { title: true, description: true, category: true, metaTitleNo: true, metaDescNo: true },
  });

  if (!market) return { title: "Market Not Found" };

  const description = market.description.length > 160
    ? market.description.slice(0, 157) + "..."
    : market.description;

  const ogTitle = market.metaTitleNo || market.title;
  const ogDesc = market.metaDescNo || description;

  return {
    title: market.title,
    description: ogDesc,
    alternates: {
      languages: {
        "nb-NO": `https://viking-market.com/markets/${id}`,
        "x-default": `https://viking-market.com/markets/${id}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      type: "article",
      locale: "nb_NO",
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: ogDesc,
    },
  };
}

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

  let hasDisputed = false;
  if (session?.user?.id && market.status === "PENDING_RESOLUTION") {
    try {
      const existing = await prisma.dispute.findUnique({
        where: { marketId_userId: { marketId: id, userId: session.user.id } },
      });
      hasDisputed = !!existing;
    } catch {
      // non-critical
    }
  }

  const hasPosition = userPositions.some((p) => p.shares > 0);

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

  const categoryLabel = categoryLabels[market.category] ?? market.category;

  return (
    <>
      <MarketJsonLd
        title={market.title}
        description={market.description}
        url={`https://viking-market.com/markets/${market.id}`}
        category={categoryLabel}
        dateCreated={market.createdAt.toISOString()}
        dateModified={market.updatedAt.toISOString()}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://viking-market.com" },
          { name: "Markets", url: "https://viking-market.com/markets" },
          { name: categoryLabel, url: `https://viking-market.com/markets?category=${market.category}` },
          { name: market.title, url: `https://viking-market.com/markets/${market.id}` },
        ]}
      />

      {/* Breadcrumb — minimal */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Link href="/markets" className="hover:text-foreground transition-colors">Markets</Link>
        <span className="text-muted-foreground/40">/</span>
        <Link href={`/markets?category=${market.category}`} className="hover:text-foreground transition-colors">{categoryLabel}</Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ─── Main Column ─── */}
        <div className="space-y-4 min-w-0">
          {/* Title — clean, Kalshi-style */}
          <div>
            <h1 className="text-xl font-semibold tracking-tight leading-tight">{market.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {market.status === "RESOLVED" && market.resolution && (
                <Badge className={market.resolution === "YES" ? "bg-[var(--color-yes)] text-white text-[10px]" : "bg-[var(--color-no)] text-white text-[10px]"}>
                  Resolved {market.resolution}
                </Badge>
              )}
              {market.status === "PENDING_RESOLUTION" && (
                <Badge className="bg-amber-500 text-white text-[10px]">
                  Pending Resolution
                </Badge>
              )}
              {closing && market.status === "OPEN" && (
                <span className="text-[11px] text-[var(--color-no)] font-medium">
                  Closes {timeLeft}
                </span>
              )}
              {priceChange24h !== null && priceChange24h !== 0 && (
                <span className={cn(
                  "text-[11px] font-semibold font-price",
                  priceChange24h > 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
                )}>
                  {priceChange24h > 0 ? "+" : ""}{priceChange24h}¢ 24h
                </span>
              )}
            </div>
          </div>

          {/* ─── Chart — Hero (Kalshi-style: big, clean, no card border) ─── */}
          <PriceChart marketId={market.id} currentYesPrice={price.yes} />

          {/* Stats line — single row, minimal like Kalshi */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground py-1">
            <span>
              <span className="text-foreground font-semibold font-price">${formatCompactNumber(market.totalVolume)}</span> Vol
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="text-foreground font-semibold font-price">{uniqueTraders}</span> Traders
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="text-foreground font-semibold font-price">{market._count.trades}</span> Trades
            </span>
            <span className="text-border">·</span>
            <span className={cn(closing && "text-[var(--color-no)]")}>
              Closes <span className="font-semibold">{timeLeft}</span>
            </span>
          </div>

          {/* Description — subtle, collapsed feel */}
          {market.description && (
            <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3">{market.description}</p>
          )}

          {/* Dispute banner */}
          {market.status === "PENDING_RESOLUTION" && market.resolution && market.pendingResolutionAt && (
            <DisputeBanner
              marketId={market.id}
              resolution={market.resolution}
              pendingResolutionAt={market.pendingResolutionAt.toISOString()}
              disputePeriodHours={market.disputePeriodHours}
              disputeCount={market.disputeCount}
              hasPosition={hasPosition}
              hasDisputed={hasDisputed}
            />
          )}

          {/* Resolution sources */}
          {market.resolutionSources && (
            <ResolutionSources sources={market.resolutionSources} />
          )}

          {/* Resolution note */}
          {market.resolutionNote && (
            <div className="rounded-xl border border-border/50 p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Resolution Note</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{market.resolutionNote}</p>
            </div>
          )}

          {/* Order Book */}
          {market.status === "OPEN" && (
            <OrderBook marketId={market.id} />
          )}

          {/* User positions */}
          {userPositions.length > 0 && (
            <div className="rounded-xl border border-border/50 p-4 bg-card">
              <h3 className="text-sm font-medium mb-3">Your Positions</h3>
              <div className="space-y-2">
                {userPositions.map((pos) => {
                  const cp = pos.side === "YES" ? price.yes : price.no;
                  const pnl = pos.shares * (cp - pos.avgPrice);
                  return (
                    <div key={pos.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          pos.side === "YES" ? "bg-[var(--color-yes)]/15 text-[var(--color-yes)]" : "bg-[var(--color-no)]/15 text-[var(--color-no)]"
                        )}>
                          {pos.side}
                        </span>
                        <span className="font-price font-medium">{pos.shares.toFixed(2)} shares</span>
                      </div>
                      <div className="text-right font-price text-xs">
                        <span className="text-muted-foreground">{Math.round(pos.avgPrice * 100)}¢ → {Math.round(cp * 100)}¢</span>
                        <span className={cn("ml-2 font-semibold", pnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]")}>
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
            <div className="rounded-xl border border-border/50 p-4 bg-card">
              <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
              <div className="divide-y divide-border/50">
                {market.trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.user.name}</span>
                      <span className="text-muted-foreground">{trade.direction === "BUY" ? "bought" : "sold"}</span>
                      <span className={cn(
                        "font-bold px-1.5 py-0.5 rounded text-[10px]",
                        trade.side === "YES" ? "bg-[var(--color-yes)]/10 text-[var(--color-yes)]" : "bg-[var(--color-no)]/10 text-[var(--color-no)]"
                      )}>
                        {trade.side}
                      </span>
                    </div>
                    <div className="font-price text-muted-foreground">
                      <span className="text-foreground font-medium">{trade.shares.toFixed(1)}</span>
                      <span className="mx-1">@</span>
                      <span className={trade.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}>
                        {Math.round(trade.price * 100)}¢
                      </span>
                      <span className="ml-2 text-muted-foreground/60">{formatRelativeDate(trade.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CommentsSection marketId={market.id} />

          {relatedMarkets.length > 0 && <RelatedMarkets markets={relatedMarkets} />}
        </div>

        {/* ─── Sidebar ─── */}
        <div className="lg:sticky lg:top-[60px] lg:h-fit space-y-3">
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

          {/* Waitlist CTA for non-users */}
          {!session?.user && market.status === "OPEN" && (
            <a
              href="/waitlist"
              className="block rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-4 text-center hover:bg-[var(--color-viking)]/10 transition-colors"
            >
              <p className="text-sm font-semibold">Want to trade?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Join the waitlist for early access.
              </p>
              <span className="inline-block mt-2 text-xs font-medium text-[var(--color-viking)]">
                Join Waitlist →
              </span>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
