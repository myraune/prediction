import { prisma } from "@/lib/prisma";
import { MarketCard, MarketRow } from "@/components/markets/market-card";
import { MarketSortTabs } from "@/components/markets/market-sort-tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { Flame, Clock } from "lucide-react";
import { LiveActivityTicker } from "@/components/markets/live-ticker";
import type { Prisma, Market } from "@/generated/prisma/client";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; sort?: string; q?: string; region?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const status = params.status ?? "OPEN";
  const sort = params.sort ?? "trending";
  const q = params.q;
  const region = params.region;

  const where: Prisma.MarketWhereInput = {
    ...(category ? { category } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { title: { contains: q } } : {}),
    ...(region ? { region } : {}),
  };

  let orderBy: Prisma.MarketOrderByWithRelationInput | Prisma.MarketOrderByWithRelationInput[];
  switch (sort) {
    case "new":
      orderBy = { createdAt: "desc" };
      break;
    case "ending":
      orderBy = { closesAt: "asc" };
      where.status = "OPEN";
      break;
    case "popular":
      orderBy = { totalVolume: "desc" };
      break;
    case "trending":
    default:
      orderBy = { totalVolume: "desc" };
      break;
  }

  let markets: Market[] = [];
  let categoryCounts: Record<string, number> = {};
  let topMovers: Market[] = [];
  let closingSoon: Market[] = [];
  try {
    const statusFilter = status !== "ALL" ? status : undefined;
    const [result, catCounts, movers, closing] = await Promise.all([
      prisma.market.findMany({ where, orderBy }),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: statusFilter, ...(region ? { region } : {}) },
        _count: true,
      }),
      // Top movers — most volume (proxy for activity)
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 5,
      }),
      // Closing soon
      prisma.market.findMany({
        where: { status: "OPEN", closesAt: { gt: new Date() } },
        orderBy: { closesAt: "asc" },
        take: 5,
      }),
    ]);
    markets = result;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));
    topMovers = movers;
    closingSoon = closing;
  } catch {
    // Database not available
  }

  const categoryLabel = category
    ? CATEGORIES.find((c) => c.value === category)?.label ?? category
    : null;

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      category,
      status: status !== "OPEN" ? status : undefined,
      sort: sort !== "trending" ? sort : undefined,
      q,
      region,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/markets${qs ? `?${qs}` : ""}`;
  }

  const regionTitle = region === "NO" ? "Norway" : region === "INT" ? "International" : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
      {/* ─── Main Content ─── */}
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {regionTitle ?? categoryLabel ?? "Markets"}
            </h1>
            {q && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Results for &ldquo;{q}&rdquo;
                <Link href="/markets" className="ml-2 text-foreground hover:underline">
                  Clear
                </Link>
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {markets.length} market{markets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ─── Category Tabs (Kalshi-style horizontal) ─── */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-none pb-1">
          <Link
            href={buildHref({ category: undefined, region: undefined })}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              !category && !region
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            All
          </Link>
          <Link
            href={buildHref({ region: "NO", category: undefined })}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              region === "NO"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            Norway
          </Link>
          <Link
            href={buildHref({ region: "INT", category: undefined })}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              region === "INT"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            International
          </Link>
          <div className="w-px h-4 bg-border mx-1" />
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.value] ?? 0;
            if (count === 0) return null;
            const isActive = category === cat.value;
            return (
              <Link
                key={cat.value}
                href={buildHref({ category: cat.value, region: undefined })}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* ─── Sort + Status ─── */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <MarketSortTabs />
          <div className="flex items-center gap-3 text-xs shrink-0">
            {["OPEN", "RESOLVED", "ALL"].map((s) => {
              const isActive = status === s || (s === "OPEN" && !params.status);
              return (
                <Link
                  key={s}
                  href={buildHref({ status: s === "OPEN" ? undefined : s })}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ─── Market Grid ─── */}
        {markets.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-medium">No markets found</p>
            <p className="text-sm mt-1">Try a different filter or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Right Sidebar — Kalshi-style ─── */}
      <aside className="hidden xl:block space-y-5">
        {/* Top Movers */}
        {topMovers.length > 0 && (
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Movers</h3>
            </div>
            <div className="divide-y">
              {topMovers.map((m) => (
                <MarketRow key={m.id} market={m} />
              ))}
            </div>
          </div>
        )}

        {/* Closing Soon */}
        {closingSoon.length > 0 && (
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closing Soon</h3>
            </div>
            <div className="divide-y">
              {closingSoon.map((m) => (
                <MarketRow key={m.id} market={m} />
              ))}
            </div>
          </div>
        )}

        {/* Live Activity Feed */}
        <LiveActivityTicker />
      </aside>
    </div>
  );
}
