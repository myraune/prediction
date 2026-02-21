export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import type { Market } from "@/generated/prisma/client";

// ─── Market Row — dense Polymarket-style list item ──────
function MarketRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors">
      {market.imageUrl && (
        <div className="relative h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
          <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="32px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{market.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="tabular-nums">${formatCompactNumber(market.totalVolume)}</span>
          <span className={cn(closing && "text-[var(--color-no)]")}>{timeLeft}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="px-2.5 py-1 text-xs font-semibold tabular-nums rounded bg-[var(--color-yes)]/10 text-[var(--color-yes)]">
          Yes {yesCents}¢
        </span>
        <span className="px-2.5 py-1 text-xs font-semibold tabular-nums rounded bg-[var(--color-no)]/10 text-[var(--color-no)]">
          No {noCents}¢
        </span>
      </div>
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
  let categoryCounts: Record<string, number> = {};

  try {
    const [
      noTrending, noNew, noClosing,
      intTrending, intNew,
      volAgg, marketCount, catCounts,
    ] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN", region: "NO" },
        orderBy: { totalVolume: "desc" },
        take: 10,
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
        take: 5,
      }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
      prisma.market.count({ where: { status: "OPEN" } }),
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
    totalMarkets = marketCount;
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
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-12">
          <Link href="/" className="shrink-0">
            <VikingWordmark height={18} />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Markets
            </Link>
            <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Leaderboard
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm h-8">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm h-8">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Header ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Markets</h1>
            <p className="text-sm text-muted-foreground">
              {totalMarkets} active &middot; ${formatCompactNumber(totalVolume)} volume
            </p>
          </div>
          <Link href="/register">
            <Button size="sm" className="text-xs h-7">Start Trading</Button>
          </Link>
        </div>
      </section>

      {/* ─── Category Tabs ─── */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <Link
              href="/markets"
              className="px-3 py-1 text-xs font-medium rounded bg-foreground text-background whitespace-nowrap"
            >
              All
            </Link>
            <Link
              href="/markets?region=NO"
              className="px-3 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
            >
              Norway
            </Link>
            <Link
              href="/markets?region=INT"
              className="px-3 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
            >
              International
            </Link>
            {Object.entries(categoryCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([cat]) => (
                <Link
                  key={cat}
                  href={`/markets?category=${cat}`}
                  className="px-3 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* ─── Trending in Norway ─── */}
      {norskTrending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Trending in Norway</h2>
            <Link href="/markets?region=NO" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded border divide-y divide-border overflow-hidden bg-card">
            {norskTrending.map((market) => (
              <MarketRow key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}

      {/* ─── New + Closing Soon ─── */}
      {(norskNew.length > 0 || norskClosing.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {norskNew.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Recently Added</h2>
                  <Link href="/markets?region=NO&sort=new" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    See all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="rounded border divide-y divide-border overflow-hidden bg-card">
                  {norskNew.map((market) => (
                    <MarketRow key={market.id} market={market} />
                  ))}
                </div>
              </div>
            )}
            {norskClosing.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Closing Soon</h2>
                  <Link href="/markets?region=NO&sort=ending" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    See all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="rounded border divide-y divide-border overflow-hidden bg-card">
                  {norskClosing.map((market) => (
                    <MarketRow key={market.id} market={market} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── International ─── */}
      {intlTrending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-3 border-t mt-2">
          <div className="flex items-center justify-between mb-2 pt-3">
            <h2 className="text-sm font-medium text-muted-foreground">International</h2>
            <Link href="/markets?region=INT" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded border divide-y divide-border overflow-hidden bg-card">
            {intlTrending.map((market) => (
              <MarketRow key={market.id} market={market} />
            ))}
          </div>

          {intlNew.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">New International</h2>
              <div className="rounded border divide-y divide-border overflow-hidden bg-card">
                {intlNew.map((market) => (
                  <MarketRow key={market.id} market={market} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="border-t mt-6">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2026 Viking Market</span>
          <span>Virtual prediction market</span>
        </div>
      </footer>
    </div>
  );
}
