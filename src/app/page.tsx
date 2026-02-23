export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, Clock, Flame } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import { MiniSparkline } from "@/components/markets/mini-sparkline";
import type { Market } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/constants";

// ─── Featured Card — large with chart area ──────────────────
function FeaturedCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg border bg-card hover:border-foreground/20 transition-all duration-150 p-4 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {catLabel && (
            <span className="font-medium uppercase tracking-wide">{catLabel}</span>
          )}
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
        </div>
        <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-foreground/80 transition-colors">
          {market.title}
        </h3>

        {/* Sparkline chart — larger for featured */}
        <div className="h-10 flex-1 min-h-[40px]">
          <MiniSparkline marketId={market.id} currentPrice={yesPercent} />
        </div>

        {/* Yes / No + Volume */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            className="flex-1 py-2 text-sm font-semibold tabular-nums rounded-md bg-[var(--color-yes)]/10 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/20 transition-colors border border-[var(--color-yes)]/20"
            onClick={(e) => e.preventDefault()}
          >
            Yes {yesPercent}¢
          </button>
          <button
            className="flex-1 py-2 text-sm font-semibold tabular-nums rounded-md bg-[var(--color-no)]/10 text-[var(--color-no)] hover:bg-[var(--color-no)]/20 transition-colors border border-[var(--color-no)]/20"
            onClick={(e) => e.preventDefault()}
          >
            No {noPercent}¢
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 ml-1">
            ${formatCompactNumber(market.totalVolume)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Card — standard card for grids ──────────────────
function CompactCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg border bg-card hover:border-foreground/20 transition-all duration-150 p-3.5 h-full flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {catLabel && (
            <span className="font-medium uppercase tracking-wide">{catLabel}</span>
          )}
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
        </div>
        <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1 group-hover:text-foreground/80 transition-colors">
          {market.title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-yes)]/10 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/20 transition-colors border border-[var(--color-yes)]/20"
            onClick={(e) => e.preventDefault()}
          >
            Yes {yesPercent}¢
          </button>
          <button
            className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-no)]/10 text-[var(--color-no)] hover:bg-[var(--color-no)]/20 transition-colors border border-[var(--color-no)]/20"
            onClick={(e) => e.preventDefault()}
          >
            No {noPercent}¢
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-0.5">
            ${formatCompactNumber(market.totalVolume)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Sidebar Row — compact list item ──────────────────
function SidebarRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex items-center gap-3 py-2.5 hover:bg-accent/50 transition-colors rounded px-1"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1">
          {market.title}
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          ${formatCompactNumber(market.totalVolume)} vol
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span className="text-sm font-bold tabular-nums">{yesPercent}¢</span>
        <span className="text-[10px] text-muted-foreground">Yes</span>
      </div>
    </Link>
  );
}

export default async function LandingPage() {
  let featured: Market[] = [];
  let trending: Market[] = [];
  let closingSoon: Market[] = [];
  let totalMarkets = 0;
  let categoryCounts: Record<string, number> = {};

  try {
    const [
      featuredResult,
      marketCount,
      catCounts,
    ] = await Promise.all([
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
    ]);
    totalMarkets = marketCount;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));

    // First 2 are featured (large with chart), rest go to grid
    featured = featuredResult.slice(0, 2);
    trending = featuredResult.slice(2, 14);

    const featuredIds = featuredResult.map((m) => m.id);
    const [closing] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN", closesAt: { gt: new Date() }, id: { notIn: featuredIds } },
        orderBy: { closesAt: "asc" },
        take: 5,
      }),
    ]);
    closingSoon = closing;
  } catch {
    // Database not available
  }

  const CATEGORY_LABELS: Record<string, string> = {
    POLITICS: "Politics", SPORTS: "Sports", CRYPTO: "Crypto", CLIMATE: "Climate",
    ECONOMICS: "Economics", CULTURE: "Culture", COMPANIES: "Companies",
    FINANCIALS: "Financials", TECH_SCIENCE: "Tech & Science", ENTERTAINMENT: "Entertainment",
  };

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
              <Button size="sm" className="text-xs h-7 px-3">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 pt-5">
          {/* ─── Main Column ─── */}
          <div className="min-w-0">
            {/* Featured Markets — large cards with charts */}
            {featured.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Featured</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featured.map((market) => (
                    <FeaturedCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Markets — compact grid */}
            {trending.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Top Markets</h2>
                  </div>
                  <Link
                    href="/markets"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
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

            {/* Browse all */}
            <section className="py-4 border-t">
              <div className="flex items-center justify-center">
                <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  Browse all {totalMarkets} markets <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </div>

          {/* ─── Right Sidebar ─── */}
          <aside className="hidden xl:block space-y-5">
            {/* Closing Soon */}
            {closingSoon.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Closing Soon
                  </h3>
                </div>
                <div className="divide-y">
                  {closingSoon.map((m) => (
                    <SidebarRow key={m.id} market={m} />
                  ))}
                </div>
              </div>
            )}

            {/* Category breakdown */}
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
          </aside>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2026 Viking Market</span>
          <div className="flex items-center gap-4">
            <Link href="/markets" className="hover:text-foreground transition-colors">Markets</Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
