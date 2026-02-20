import { prisma } from "@/lib/prisma";
import { MarketCard } from "@/components/markets/market-card";
import { MarketSortTabs } from "@/components/markets/market-sort-tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/format";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const status = params.status ?? "OPEN";
  const sort = params.sort ?? "trending";
  const q = params.q;

  // Build where clause
  const where: Prisma.MarketWhereInput = {
    ...(category ? { category } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { title: { contains: q } } : {}),
  };

  // Build orderBy based on sort
  let orderBy: Prisma.MarketOrderByWithRelationInput | Prisma.MarketOrderByWithRelationInput[];
  switch (sort) {
    case "new":
      orderBy = { createdAt: "desc" };
      break;
    case "ending":
      orderBy = { closesAt: "asc" };
      // Only show open markets for ending soon
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

  let markets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let totalVolume = 0;
  let totalTrades = 0;
  try {
    const [marketsResult, volAgg, tradeCount] = await Promise.all([
      prisma.market.findMany({
        where,
        orderBy,
      }),
      prisma.market.aggregate({
        where,
        _sum: { totalVolume: true },
      }),
      prisma.trade.count(),
    ]);
    markets = marketsResult;
    totalVolume = volAgg._sum.totalVolume ?? 0;
    totalTrades = tradeCount;
  } catch {
    // Database not available
  }

  // Build href helpers
  function statusHref(s: string) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (s !== "OPEN") p.set("status", s);
    if (sort !== "trending") p.set("sort", sort);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/markets${qs ? `?${qs}` : ""}`;
  }

  const categoryLabel = category
    ? category.charAt(0) + category.slice(1).toLowerCase().replace("_", " & ")
    : null;

  return (
    <div>
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {categoryLabel ? `${categoryLabel} Markets` : "Markets"}
          </h1>
          {q && (
            <p className="text-muted-foreground mt-1">
              Results for &ldquo;{q}&rdquo;
              <Link href="/markets" className="ml-2 text-[var(--color-brand)] hover:underline text-sm">
                Clear
              </Link>
            </p>
          )}
        </div>

        {/* Quick stats bar */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {markets.length} market{markets.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {formatCompactNumber(totalVolume)} vol.
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {totalTrades.toLocaleString()} trades
          </span>
        </div>
      </div>

      {/* Sort pills */}
      <MarketSortTabs />

      {/* Status filter — inline text links */}
      <div className="flex items-center gap-4 mt-4 mb-6 text-sm">
        {["OPEN", "RESOLVED", "ALL"].map((s) => {
          const isActive = status === s || (s === "OPEN" && !params.status);
          return (
            <Link
              key={s}
              href={statusHref(s)}
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

      {/* Markets grid */}
      {markets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No markets found</p>
          <p className="text-sm mt-1">Try a different filter or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
