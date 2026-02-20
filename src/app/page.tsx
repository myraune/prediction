export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, Users, BarChart3, Zap, ChevronRight } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import type { Market } from "@/generated/prisma/client";

// ─── Landing Market Card (bigger, more prominent than browse card) ──
function LandingMarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm h-full flex flex-col">
        {/* Image + Category */}
        <div className="flex items-start gap-3 mb-3">
          {market.imageUrl && (
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={market.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          )}
          <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1">
            {market.title}
          </h3>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price buttons */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex flex-col items-center py-2.5 rounded-lg bg-[var(--color-yes)]/8">
            <span className="text-lg font-bold tabular-nums text-[var(--color-yes)] leading-none">
              {yesCents}¢
            </span>
            <span className="text-[10px] font-medium text-[var(--color-yes)]/60 uppercase mt-1">
              Yes
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2.5 rounded-lg bg-[var(--color-no)]/8">
            <span className="text-lg font-bold tabular-nums text-[var(--color-no)] leading-none">
              {noCents}¢
            </span>
            <span className="text-[10px] font-medium text-[var(--color-no)]/60 uppercase mt-1">
              No
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCompactNumber(market.totalVolume)} Vol</span>
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>
            {timeLeft}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Category Pill ────────────────────────────────────────
function CategoryPill({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-muted/50 transition-colors text-sm whitespace-nowrap"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
    </Link>
  );
}

export default async function LandingPage() {
  let trendingMarkets: Market[] = [];
  let newMarkets: Market[] = [];
  let closingSoonMarkets: Market[] = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTrades = 0;
  let totalUsers = 0;
  let categoryCounts: Record<string, number> = {};

  try {
    const [trending, newest, closingSoon, volAgg, tradeCount, marketCount, userCount, catCounts] = await Promise.all([
      // Trending: highest volume open markets
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 8,
      }),
      // Newest markets
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      // Closing soon
      prisma.market.findMany({
        where: { status: "OPEN", closesAt: { gt: new Date() } },
        orderBy: { closesAt: "asc" },
        take: 4,
      }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
      prisma.trade.count(),
      prisma.market.count({ where: { status: "OPEN" } }),
      prisma.user.count(),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: true,
      }),
    ]);
    trendingMarkets = trending;
    newMarkets = newest;
    closingSoonMarkets = closingSoon;
    totalVolume = volAgg._sum.totalVolume ?? 0;
    totalTrades = tradeCount;
    totalMarkets = marketCount;
    totalUsers = userCount;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));
  } catch {
    // Database not available
  }

  const CATEGORY_LABELS: Record<string, string> = {
    POLITICS: "Politics",
    SPORTS: "Sports",
    CRYPTO: "Crypto",
    CLIMATE: "Climate",
    ECONOMICS: "Economics",
    CULTURE: "Culture",
    COMPANIES: "Companies",
    FINANCIALS: "Financials",
    TECH_SCIENCE: "Tech & Science",
    ENTERTAINMENT: "Entertainment",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Nav ─── */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/">
            <VikingWordmark height={22} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Markets
            </Link>
            <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Leaderboard
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm font-medium">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-10 sm:pt-20 sm:pb-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Bet on what<br />happens next
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Trade on real-world events. Prices from 1¢ to 99¢ reflect
            real-time probability. Start free with 1,000 points.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/register">
              <Button size="lg" className="font-medium gap-2">
                Start Trading
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline" className="font-medium">
                Browse Markets
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Stats bar ─── */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-10 mt-10 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">{totalMarkets}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Markets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-yes)]/10">
              <TrendingUp className="h-4 w-4 text-[var(--color-yes)]" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">{formatCompactNumber(totalVolume)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Volume</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">{totalTrades.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Trades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">{totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Traders</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Navigation ─── */}
      {Object.keys(categoryCounts).length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Link
                href="/markets"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap"
              >
                All Markets
                <span className="text-xs opacity-70 tabular-nums">{totalMarkets}</span>
              </Link>
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <CategoryPill
                    key={cat}
                    label={CATEGORY_LABELS[cat] ?? cat}
                    count={count}
                    href={`/markets?category=${cat}`}
                  />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Trending Markets (Main Grid) ─── */}
      {trendingMarkets.length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-yes)]" />
                <h2 className="text-lg font-semibold">Trending Markets</h2>
              </div>
              <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {trendingMarkets.map((market) => (
                <LandingMarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Two-column: New + Closing Soon ─── */}
      {(newMarkets.length > 0 || closingSoonMarkets.length > 0) && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New Markets */}
              {newMarkets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <h2 className="text-base font-semibold">New Markets</h2>
                    </div>
                    <Link href="/markets?sort=newest" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      See all <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden bg-card">
                    {newMarkets.map((market) => {
                      const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
                      const yc = Math.round(p.yes * 100);
                      return (
                        <Link key={market.id} href={`/markets/${market.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                          {market.imageUrl && (
                            <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="32px" />
                            </div>
                          )}
                          <p className="text-sm font-medium leading-snug line-clamp-1 flex-1">{market.title}</p>
                          <span className="text-sm font-bold tabular-nums text-[var(--color-yes)]">{yc}¢</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Closing Soon */}
              {closingSoonMarkets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-no)] animate-pulse" />
                      <h2 className="text-base font-semibold">Closing Soon</h2>
                    </div>
                    <Link href="/markets?sort=closing" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      See all <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden bg-card">
                    {closingSoonMarkets.map((market) => {
                      const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
                      const yc = Math.round(p.yes * 100);
                      const tl = getTimeRemaining(market.closesAt);
                      return (
                        <Link key={market.id} href={`/markets/${market.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                          {market.imageUrl && (
                            <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="32px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug line-clamp-1">{market.title}</p>
                            <p className="text-xs text-[var(--color-no)] font-medium mt-0.5">{tl}</p>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-[var(--color-yes)]">{yc}¢</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── How it works (compact) ─── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-lg font-semibold mb-8 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Pick an event", desc: "Browse 100+ markets on politics, sports, crypto, AI, and more." },
              { step: "02", title: "Buy shares", desc: "Think it'll happen? Buy YES at 72¢. Disagree? Buy NO at 28¢." },
              { step: "03", title: "Win or trade", desc: "Winning shares pay 100 pts. Sell anytime as prices change." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 mb-3">
                  <span className="text-xs font-mono font-semibold text-primary">{item.step}</span>
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 text-center">
          <h2 className="text-2xl font-bold">Ready to start trading?</h2>
          <p className="text-muted-foreground mt-2">1,000 free points. No credit card required.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="font-medium gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2026 Viking Market</span>
          <span>Virtual prediction market &middot; No real money</span>
        </div>
      </footer>
    </div>
  );
}
