export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, TrendingUp, Clock, Flame, Zap, Target, Trophy, Shield, BarChart3, Users } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import { FeaturedCard, CompactCard } from "@/components/markets/landing-cards";
import { LiveActivityTicker } from "@/components/markets/live-ticker";
import { HeroStats } from "@/components/landing/hero-stats";
import { TrendingTicker } from "@/components/landing/trending-ticker";
import { CountdownRow } from "@/components/landing/countdown-row";
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
    const [featuredResult, marketCount, catCounts, volumeAgg, traderCount, topUsers] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 14,
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

    featured = featuredResult.slice(0, 2);
    trending = featuredResult.slice(2, 14);

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

    const featuredIds = featuredResult.map((m) => m.id);
    const closing = await prisma.market.findMany({
      where: { status: "OPEN", closesAt: { gt: new Date() }, id: { notIn: featuredIds } },
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
              <Link href="/markets" className="px-2.5 py-1 text-xs font-medium rounded text-muted-foreground hover:text-[var(--color-viking)] hover:bg-accent transition-colors whitespace-nowrap viking-accent">
                Browse
              </Link>
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([cat]) => (
                  <Link
                    key={cat}
                    href={`/markets?category=${cat}`}
                    className="px-2.5 py-1 text-xs font-medium rounded text-muted-foreground hover:text-[var(--color-viking)] hover:bg-accent transition-colors whitespace-nowrap viking-accent"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Link>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Leaderboard
            </Link>
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

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden border-b">
        {/* Subtle red gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-viking)]/5 via-transparent to-[var(--color-viking)]/3 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 relative">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              Trade the future.<br />
              <span className="viking-gradient-text">Bet on what you believe.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
              Buy and sell shares on real-world events. From Norwegian politics to global crypto
              markets &mdash; predict outcomes and win.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Link href="/register">
                <Button className="h-10 px-6 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white font-semibold">
                  Start Trading
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button variant="outline" className="h-10 px-6">
                  Browse Markets
                </Button>
              </Link>
            </div>
          </div>

          {/* Animated stats */}
          <div className="mt-10 pt-8 border-t max-w-md">
            <HeroStats
              totalMarkets={totalMarkets}
              totalVolume={totalVolume}
              totalTraders={totalTraders}
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--color-viking)]/10 text-[var(--color-viking)] mb-3 transition-transform group-hover:scale-110">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Pick a market</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose from {totalMarkets}+ markets on politics, sports, crypto, and more.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--color-viking)]/10 text-[var(--color-viking)] mb-3 transition-transform group-hover:scale-110">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Buy Yes or No</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Shares are priced 1&cent;&ndash;99&cent;. Buy Yes if you think it happens, No if it won&apos;t.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--color-viking)]/10 text-[var(--color-viking)] mb-3 transition-transform group-hover:scale-110">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Win if you&apos;re right</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Correct shares pay out 100&cent;. Sell anytime before resolution for a profit.
              </p>
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
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[var(--color-viking)]" />
                  <h2 className="text-sm font-semibold">Featured</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featured.map((market) => (
                    <FeaturedCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Markets */}
            {trending.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[var(--color-viking)]" />
                    <h2 className="text-sm font-semibold">Top Markets</h2>
                  </div>
                  <Link
                    href="/markets"
                    className="text-xs text-muted-foreground hover:text-[var(--color-viking)] transition-colors flex items-center gap-1"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trending.map((market) => (
                    <CompactCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}

            {/* Browse all CTA */}
            <section className="py-6 border-t">
              <div className="flex flex-col items-center gap-3">
                <Link href="/markets">
                  <Button variant="outline" size="lg" className="gap-2">
                    Browse all {totalMarkets} markets
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </div>

          {/* ─── Right Sidebar ─── */}
          <aside className="hidden xl:block space-y-5">
            {/* Closing Soon — with countdown timers */}
            {closingSoon.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-viking)]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Closing Soon
                  </h3>
                </div>
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

            {/* Top Traders — leaderboard preview */}
            {topTraders.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-[var(--color-viking)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Top Traders
                    </h3>
                  </div>
                  <Link href="/leaderboard" className="text-[10px] text-muted-foreground hover:text-[var(--color-viking)] transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-0">
                  {topTraders.map((trader, i) => (
                    <div key={trader.name} className="flex items-center gap-2 py-2">
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-4">
                        {i === 0 ? "\ud83e\udd47" : i === 1 ? "\ud83e\udd48" : i === 2 ? "\ud83e\udd49" : `#${i + 1}`}
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
      <footer className="border-t mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <VikingWordmark height={16} />
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
                Norway&apos;s prediction market. Trade on outcomes, not opinions.
              </p>
            </div>

            {/* Markets */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Markets</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/markets" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Browse All</Link>
                <Link href="/markets?category=POLITICS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Politics</Link>
                <Link href="/markets?category=SPORTS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sports</Link>
                <Link href="/markets?category=CRYPTO" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Crypto</Link>
                <Link href="/markets?category=ECONOMICS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Economics</Link>
              </nav>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Platform</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
                <Link href="/portfolio" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
                <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
              </nav>
            </div>

            {/* Trust */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trust</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-[var(--color-viking)]" />
                  <span>LMSR AMM pricing</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3 text-[var(--color-viking)]" />
                  <span>Transparent resolution</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 text-[var(--color-viking)]" />
                  <span>{totalTraders}+ traders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>&copy; 2026 <span className="text-[var(--color-viking)] font-semibold">Viking</span> Market. All rights reserved.</span>
            <span>Built in Norway \ud83c\uddf3\ud83c\uddf4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
