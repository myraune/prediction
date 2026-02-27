export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VikingWordmark } from "@/components/brand/viking-logo";
import { FeaturedCard, CompactCard } from "@/components/markets/landing-cards";
import { LiveActivityTicker } from "@/components/markets/live-ticker";
import { TrendingTicker } from "@/components/landing/trending-ticker";
import { CountdownRow } from "@/components/landing/countdown-row";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Market } from "@/generated/prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  POLITICS: "Politics", SPORTS: "Sports", CRYPTO: "Crypto", CLIMATE: "Climate",
  ECONOMICS: "Economics", CULTURE: "Culture", COMPANIES: "Companies",
  FINANCIALS: "Financials", TECH_SCIENCE: "Tech & Science", ENTERTAINMENT: "Entertainment",
};

export default async function LandingPage() {
  let featured: Market[] = [];
  let trending: Market[] = [];
  let closingSoon: Market[] = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTraders = 0;
  let categoryCounts: Record<string, number> = {};
  let topTraders: { name: string; totalValue: number }[] = [];

  try {
    const [featuredPicks, topByVolume, marketCount, catCounts, volumeAgg, traderCount, topUsers] = await Promise.all([
      // Featured markets (flagged by admin) — newest first
      prisma.market.findMany({
        where: { status: "OPEN", featured: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      // Top markets by volume (fallback & trending)
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 20,
      }),
      prisma.market.count({ where: { status: "OPEN" } }),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: true,
      }),
      prisma.market.aggregate({
        _sum: { totalVolume: true },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.findMany({
        where: { role: "USER" },
        include: {
          positions: {
            where: { shares: { gt: 0 } },
            include: { market: true },
          },
        },
        orderBy: { balance: "desc" },
        take: 5,
      }),
    ]);
    totalMarkets = marketCount;
    totalVolume = volumeAgg._sum.totalVolume ?? 0;
    totalTraders = traderCount;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));

    // Featured: top 2 from admin-flagged featured markets
    featured = featuredPicks.slice(0, 2);
    // Trending: remaining featured + top volume markets (deduplicated)
    const featuredIds = new Set(featured.map((m) => m.id));
    const remainingFeatured = featuredPicks.slice(2).filter((m) => !featuredIds.has(m.id));
    const topNonFeatured = topByVolume.filter((m) => !featuredIds.has(m.id) && !remainingFeatured.some((f) => f.id === m.id));
    trending = [...remainingFeatured, ...topNonFeatured].slice(0, 12);

    // Top traders with portfolio values
    topTraders = topUsers.map((user) => {
      let positionValue = 0;
      for (const pos of user.positions) {
        const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
        const currentPrice = pos.side === "YES" ? price.yes : price.no;
        positionValue += pos.shares * currentPrice;
      }
      return { name: user.name, totalValue: user.balance + positionValue };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const allShownIds = [...featured, ...trending].map((m) => m.id);
    const closing = await prisma.market.findMany({
      where: { status: "OPEN", closesAt: { gt: new Date() }, id: { notIn: allShownIds } },
      orderBy: { closesAt: "asc" },
      take: 5,
    });
    closingSoon = closing;
  } catch {
    // Database not available
  }

  // Ticker data — top 10 markets with price
  const tickerMarkets = [...featured, ...trending].slice(0, 10).map((m) => {
    const p = getPrice({ poolYes: m.poolYes, poolNo: m.poolNo });
    return {
      id: m.id,
      title: m.title,
      yesPrice: Math.round(p.yes * 100),
      change: Math.round((Math.random() - 0.4) * 8), // simulated 24h change
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0">
              <VikingWordmark height={18} />
            </Link>
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-none">
              <Link href="/markets" className="px-2.5 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap">
                Browse
              </Link>
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([cat]) => (
                  <Link
                    key={cat}
                    href={`/markets?category=${cat}`}
                    className="px-2.5 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Link>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Leaderboard
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-3">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs h-7 px-3 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Trending Ticker ─── */}
      <TrendingTicker markets={tickerMarkets} />

      {/* ─── Hero ─── */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1]">
              Trade the future.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg">
              Buy and sell shares on real-world events. From Norwegian politics to global crypto
              markets &mdash; predict outcomes and win.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <Link href="/register">
                <Button size="sm" className="h-8 px-4 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white text-xs font-medium">
                  Start Trading
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalMarkets} markets &middot; ${formatCompactNumber(totalVolume)} vol &middot; {totalTraders} traders
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Markets + Sidebar ─── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 pt-6">
          {/* ─── Main Column ─── */}
          <div className="min-w-0">
            {/* Featured Markets */}
            {featured.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Featured</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featured.map((market) => (
                    <FeaturedCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Markets */}
            {trending.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-muted-foreground">Top Markets</h2>
                  <Link
                    href="/markets"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trending.map((market) => (
                    <CompactCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ─── Right Sidebar ─── */}
          <aside className="hidden xl:block space-y-4">
            {/* Closing Soon */}
            {closingSoon.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Closing Soon
                </h3>
                <div className="divide-y">
                  {closingSoon.map((m) => (
                    <CountdownRow
                      key={m.id}
                      market={{
                        id: m.id,
                        title: m.title,
                        poolYes: m.poolYes,
                        poolNo: m.poolNo,
                        totalVolume: m.totalVolume,
                        closesAt: m.closesAt.toISOString(),
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Traders */}
            {topTraders.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top Traders
                  </h3>
                  <Link href="/leaderboard" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-0">
                  {topTraders.map((trader, i) => (
                    <div key={trader.name} className="flex items-center gap-2 py-2">
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-4 text-right">
                        #{i + 1}
                      </span>
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-foreground text-background text-[9px] font-semibold">
                          {trader.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium flex-1 truncate">{trader.name}</span>
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                        {formatCompactNumber(trader.totalValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="rounded-lg border bg-card p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Categories
              </h3>
              <div className="space-y-0.5">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <Link
                      key={cat}
                      href={`/markets?category=${cat}`}
                      className="flex items-center justify-between px-2 py-1.5 rounded text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                      <span className="text-[11px] tabular-nums opacity-60">{count}</span>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <LiveActivityTicker />
          </aside>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div className="col-span-2 sm:col-span-1">
              <VikingWordmark height={16} />
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
                Norway&apos;s prediction market.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Markets</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/markets" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Browse All</Link>
                <Link href="/markets?category=POLITICS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Politics</Link>
                <Link href="/markets?category=SPORTS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sports</Link>
                <Link href="/markets?category=CRYPTO" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Crypto</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Platform</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
                <Link href="/portfolio" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
                <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Info</h4>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span>LMSR AMM pricing</span>
                <span>Transparent resolution</span>
                <span>{totalTraders}+ traders</span>
              </div>
            </div>
          </div>
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>&copy; 2026 Viking Market</span>
            <span>Built in Norway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
