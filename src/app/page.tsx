export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, Clock, Zap } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import type { Market } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/constants";

// ─── Featured Card — large hero-style card for top markets ──────
function FeaturedCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-border/80 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[16/9] bg-muted">
          {market.imageUrl ? (
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent to-muted" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Category badge */}
          {catLabel && (
            <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-black/50 text-white/90 rounded backdrop-blur-sm">
              {catLabel}
            </span>
          )}
          {/* Big percentage overlay */}
          <div className="absolute bottom-3 right-3">
            <span className="text-3xl font-bold text-white tabular-nums drop-shadow-lg">
              {yesPercent}%
            </span>
            <span className="text-xs text-white/70 ml-1">Yes</span>
          </div>
        </div>
        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-foreground/90">
            {market.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              ${formatCompactNumber(market.totalVolume)} Vol
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-2.5 py-1 text-xs font-semibold tabular-nums rounded bg-[var(--color-yes)]/15 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/25 transition-colors">
                Yes {yesPercent}¢
              </button>
              <button className="px-2.5 py-1 text-xs font-semibold tabular-nums rounded bg-[var(--color-no)]/15 text-[var(--color-no)] hover:bg-[var(--color-no)]/25 transition-colors">
                No {100 - yesPercent}¢
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Market Card — standard grid card with image ──────
function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-border/80 transition-all duration-200 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[2/1] bg-muted">
          {market.imageUrl ? (
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Percentage overlay */}
          <div className="absolute bottom-2 right-2">
            <span className="text-2xl font-bold text-white tabular-nums drop-shadow-lg">
              {yesPercent}%
            </span>
          </div>
          {catLabel && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-black/50 text-white/80 rounded backdrop-blur-sm">
              {catLabel}
            </span>
          )}
        </div>
        {/* Content */}
        <div className="p-2.5 flex-1 flex flex-col">
          <h3 className="text-[13px] font-medium leading-snug line-clamp-2 flex-1">
            {market.title}
          </h3>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <span className="tabular-nums">${formatCompactNumber(market.totalVolume)}</span>
              <span className="text-muted-foreground/40">&middot;</span>
              <span className={cn("truncate", closing && "text-[var(--color-no)]")}>{timeLeft}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="px-2 py-0.5 text-[11px] font-semibold tabular-nums rounded bg-[var(--color-yes)]/15 text-[var(--color-yes)]">
                Yes {yesPercent}¢
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold tabular-nums rounded bg-[var(--color-no)]/15 text-[var(--color-no)]">
                No {100 - yesPercent}¢
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Row — for "more markets" lists ──────
function CompactRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors">
      {market.imageUrl && (
        <div className="relative h-9 w-9 rounded overflow-hidden bg-muted shrink-0">
          <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="36px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1">{market.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">${formatCompactNumber(market.totalVolume)}</span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span className={cn(closing && "text-[var(--color-no)]")}>{timeLeft}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-lg font-bold tabular-nums">{yesPercent}%</span>
        <span className="text-[10px] text-muted-foreground ml-0.5">Yes</span>
      </div>
    </Link>
  );
}

// ─── Topic Tile — category image link ──────
function TopicTile({ label, href, color }: { label: string; href: string; color: string }) {
  return (
    <Link
      href={href}
      className="group relative flex items-end p-3 rounded-xl h-20 overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
      style={{ background: color }}
    >
      <span className="text-white text-sm font-semibold drop-shadow-sm">{label}</span>
    </Link>
  );
}

export default async function LandingPage() {
  let featured: Market[] = [];
  let norskTrending: Market[] = [];
  let intlTrending: Market[] = [];
  let closingSoon: Market[] = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let categoryCounts: Record<string, number> = {};

  try {
    // Phase 1: fetch featured + aggregates
    const [
      featuredResult,
      volAgg,
      marketCount,
      catCounts,
    ] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 6,
      }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
      prisma.market.count({ where: { status: "OPEN" } }),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: true,
      }),
    ]);
    featured = featuredResult;
    totalVolume = volAgg._sum.totalVolume ?? 0;
    totalMarkets = marketCount;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));

    // Phase 2: exclude featured IDs from trending to avoid dupes
    const featuredIds = featured.map((m) => m.id);
    const [noTrending, intTrending, closing] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN", region: "NO", id: { notIn: featuredIds } },
        orderBy: { totalVolume: "desc" },
        take: 6,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", region: "INT", id: { notIn: featuredIds } },
        orderBy: { totalVolume: "desc" },
        take: 6,
      }),
      prisma.market.findMany({
        where: { status: "OPEN", closesAt: { gt: new Date() }, id: { notIn: featuredIds } },
        orderBy: { closesAt: "asc" },
        take: 5,
      }),
    ]);
    norskTrending = noTrending;
    intlTrending = intTrending;
    closingSoon = closing;
  } catch {
    // Database not available
  }

  const topicColors = [
    { cat: "POLITICS", color: "linear-gradient(135deg, #1e3a5f, #2d5aa0)" },
    { cat: "SPORTS", color: "linear-gradient(135deg, #1a5c2e, #2d8a4e)" },
    { cat: "CRYPTO", color: "linear-gradient(135deg, #7c4a1c, #c47f2c)" },
    { cat: "ECONOMICS", color: "linear-gradient(135deg, #5c4a1a, #8a7a2d)" },
    { cat: "TECH_SCIENCE", color: "linear-gradient(135deg, #2d2d6b, #4a4aaa)" },
    { cat: "CLIMATE", color: "linear-gradient(135deg, #1a4a5c, #2d7a8a)" },
    { cat: "ENTERTAINMENT", color: "linear-gradient(135deg, #5c1a4a, #8a2d6b)" },
    { cat: "COMPANIES", color: "linear-gradient(135deg, #3d3d3d, #5a5a5a)" },
  ];

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

  // Hero: top 2 for large cards, rest for smaller grid
  const heroMarkets = featured.slice(0, 2);
  const gridMarkets = featured.slice(2, 6);

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
        {/* ─── Featured Markets (Hero Grid) ─── */}
        {featured.length > 0 && (
          <section className="pt-5 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heroMarkets.map((market) => (
                <FeaturedCard key={market.id} market={market} />
              ))}
            </div>
            {gridMarkets.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {gridMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── Topic Tiles ─── */}
        <section className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topicColors
              .filter((t) => categoryCounts[t.cat])
              .slice(0, 8)
              .map((topic) => (
                <TopicTile
                  key={topic.cat}
                  label={CATEGORY_LABELS[topic.cat] ?? topic.cat}
                  href={`/markets?category=${topic.cat}`}
                  color={topic.color}
                />
              ))}
          </div>
        </section>

        {/* ─── Norway — Trending ─── */}
        {norskTrending.length > 0 && (
          <section className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Trending in Norway</h2>
              </div>
              <Link
                href="/markets?region=NO"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {norskTrending.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Closing Soon ─── */}
        {closingSoon.length > 0 && (
          <section className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Closing Soon</h2>
              </div>
              <Link
                href="/markets?sort=ending"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {closingSoon.map((market) => (
                <CompactRow key={market.id} market={market} />
              ))}
            </div>
          </section>
        )}

        {/* ─── International — Trending ─── */}
        {intlTrending.length > 0 && (
          <section className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">International</h2>
              </div>
              <Link
                href="/markets?region=INT"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {intlTrending.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Stats bar ─── */}
        <section className="py-6 mt-2 border-t">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalMarkets}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active Markets</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums">${formatCompactNumber(totalVolume)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Volume</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums">2</p>
              <p className="text-xs text-muted-foreground mt-0.5">Regions</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link href="/register">
              <Button size="sm" className="text-xs">
                Start Trading <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t">
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
