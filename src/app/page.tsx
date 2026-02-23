export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Clock, Flame } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import { FeaturedCard, CompactCard, SidebarRow } from "@/components/markets/landing-cards";
import type { Market } from "@/generated/prisma/client";

export default async function LandingPage() {
  let featured: Market[] = [];
  let trending: Market[] = [];
  let closingSoon: Market[] = [];
  let totalMarkets = 0;
  let categoryCounts: Record<string, number> = {};

  const CATEGORY_LABELS: Record<string, string> = {
    POLITICS: "Politics", SPORTS: "Sports", CRYPTO: "Crypto", CLIMATE: "Climate",
    ECONOMICS: "Economics", CULTURE: "Culture", COMPANIES: "Companies",
    FINANCIALS: "Financials", TECH_SCIENCE: "Tech & Science", ENTERTAINMENT: "Entertainment",
  };

  try {
    const [featuredResult, marketCount, catCounts] = await Promise.all([
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
