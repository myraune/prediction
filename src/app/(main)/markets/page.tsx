import { prisma } from "@/lib/prisma";
import { MarketCard } from "@/components/markets/market-card";
import { MarketSortTabs } from "@/components/markets/market-sort-tabs";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
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
  try {
    markets = await prisma.market.findMany({ where, orderBy });
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
    <div className="min-w-0">
      {/* ─── Header ─── */}
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

      {/* ─── Market Grid — 4 columns on desktop ─── */}
      {markets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchX aria-hidden="true" className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No markets found</p>
          <p className="text-sm mt-1">Try a different filter or search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
