export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, Users, BarChart3, Zap, ChevronRight, Globe } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import type { Market } from "@/generated/prisma/client";

// ─── Landing Market Card ──────────────────────────────────
function LandingMarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          {market.imageUrl && (
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="40px" />
            </div>
          )}
          <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1">
            {market.title}
          </h3>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex flex-col items-center py-2.5 rounded-lg bg-[var(--color-yes)]/8">
            <span className="text-lg font-bold tabular-nums text-[var(--color-yes)] leading-none">
              {yesCents}¢
            </span>
            <span className="text-[10px] font-medium text-[var(--color-yes)]/60 uppercase mt-1">Yes</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2.5 rounded-lg bg-[var(--color-no)]/8">
            <span className="text-lg font-bold tabular-nums text-[var(--color-no)] leading-none">
              {noCents}¢
            </span>
            <span className="text-[10px] font-medium text-[var(--color-no)]/60 uppercase mt-1">No</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${formatCompactNumber(market.totalVolume)} Vol</span>
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact List Card ────────────────────────────────────
function CompactMarketRow({ market }: { market: Market }) {
  const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yc = Math.round(p.yes * 100);
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
      {market.imageUrl && (
        <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0">
          <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="32px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-1">{market.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">${formatCompactNumber(market.totalVolume)}</span>
          <span className={cn("text-xs", closing ? "text-[var(--color-no)] font-medium" : "text-muted-foreground")}>{timeLeft}</span>
        </div>
      </div>
      <span className="text-sm font-bold tabular-nums text-[var(--color-yes)]">{yc}¢</span>
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
  let norskTrending: Market[] = [];
  let norskNew: Market[] = [];
  let norskClosing: Market[] = [];
  let intlTrending: Market[] = [];
  let intlNew: Market[] = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTrades = 0;
  let totalUsers = 0;
  let categoryCounts: Record<string, number> = {};

  try {
    const [
      noTrending, noNew, noClosing,
      intTrending, intNew,
      volAgg, tradeCount, marketCount, userCount, catCounts,
    ] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN", region: "NO" },
        orderBy: { totalVolume: "desc" },
        take: 8,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", region: "NO" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", region: "NO", closesAt: { gt: new Date() } },
        orderBy: { closesAt: "asc" },
        take: 5,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", region: "INT" },
        orderBy: { totalVolume: "desc" },
        take: 8,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", region: "INT" },
        orderBy: { createdAt: "desc" },
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
    norskTrending = noTrending;
    norskNew = noNew;
    norskClosing = noClosing;
    intlTrending = intTrending;
    intlNew = intNew;
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
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🇳🇴</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Norway&apos;s Prediction Market</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Bet on what<br />happens in Norway
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Trade on Norwegian politics, sports, economy, and more.
            Prices from 1¢ to 99¢ reflect real-time probability.
            Start free with 1,000 points.
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
              <p className="text-xl font-bold tabular-nums leading-none">${formatCompactNumber(totalVolume)}</p>
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
              <Link
                href="/markets?region=NO"
                className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-muted/50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                🇳🇴 Norway
              </Link>
              <Link
                href="/markets?region=INT"
                className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-muted/50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                🌍 International
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

      {/* ═══════════════════════════════════════════════════════
          🇳🇴 NORWAY — Main Section (Primary)
          ═══════════════════════════════════════════════════════ */}

      {norskTrending.length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇳🇴</span>
                <h2 className="text-lg font-semibold">Trending in Norway</h2>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-yes)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-yes)]" />
                </span>
              </div>
              <Link href="/markets?region=NO" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {norskTrending.map((market) => (
                <LandingMarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(norskNew.length > 0 || norskClosing.length > 0) && (
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {norskNew.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <h2 className="text-base font-semibold">New Markets</h2>
                    </div>
                    <Link href="/markets?region=NO&sort=new" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      See all <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden bg-card">
                    {norskNew.map((market) => (
                      <CompactMarketRow key={market.id} market={market} />
                    ))}
                  </div>
                </div>
              )}
              {norskClosing.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-no)] animate-pulse" />
                      <h2 className="text-base font-semibold">Closing Soon</h2>
                    </div>
                    <Link href="/markets?region=NO&sort=ending" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      See all <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden bg-card">
                    {norskClosing.map((market) => (
                      <CompactMarketRow key={market.id} market={market} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          🌍 INTERNATIONAL Section
          ═══════════════════════════════════════════════════════ */}

      {intlTrending.length > 0 && (
        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">International</h2>
                <span className="text-xs text-muted-foreground ml-1">Global Markets</span>
              </div>
              <Link href="/markets?region=INT" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {intlTrending.map((market) => (
                <LandingMarketCard key={market.id} market={market} />
              ))}
            </div>

            {intlNew.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <h2 className="text-base font-semibold">New International</h2>
                  </div>
                </div>
                <div className="rounded-xl border divide-y overflow-hidden bg-card">
                  {intlNew.map((market) => (
                    <CompactMarketRow key={market.id} market={market} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── How it works ─── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-lg font-semibold mb-8 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Pick an event", desc: "Browse 100+ markets on Norwegian politics, sports, economy, and more." },
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
