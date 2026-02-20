import { prisma } from "@/lib/prisma";
import { MarketCard } from "@/components/markets/market-card";
import { MarketSortTabs } from "@/components/markets/market-sort-tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

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
  const region = params.region; // "NO" | "INT" | undefined

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

  let markets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let regionCounts = { total: 0, no: 0, int: 0 };
  try {
    const [result, noCount, intCount, totalCount] = await Promise.all([
      prisma.market.findMany({ where, orderBy }),
      prisma.market.count({ where: { status: status !== "ALL" ? status : undefined, region: "NO" } }),
      prisma.market.count({ where: { status: status !== "ALL" ? status : undefined, region: "INT" } }),
      prisma.market.count({ where: { status: status !== "ALL" ? status : undefined } }),
    ]);
    markets = result;
    regionCounts = { total: totalCount, no: noCount, int: intCount };
  } catch {
    // Database not available
  }

  const categoryLabels: Record<string, string> = {
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
  const categoryLabel = category ? categoryLabels[category] ?? category : null;

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

  const regionTitle = region === "NO" ? "🇳🇴 Norway" : region === "INT" ? "🌍 International" : null;

  return (
    <div>
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

      {/* ─── Region Tabs ─── */}
      <div className="flex items-center gap-1.5 mb-4">
        {[
          { label: "All", value: undefined as string | undefined, count: regionCounts.total },
          { label: "🇳🇴 Norway", value: "NO", count: regionCounts.no },
          { label: "🌍 Intl", value: "INT", count: regionCounts.int },
        ].map((tab) => {
          const isActive = region === tab.value || (!region && !tab.value);
          return (
            <Link
              key={tab.label}
              href={buildHref({ region: tab.value, category: undefined })}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {tab.label}
              <span className={cn("text-xs tabular-nums", isActive ? "opacity-70" : "opacity-50")}>{tab.count}</span>
            </Link>
          );
        })}
      </div>

      <MarketSortTabs />

      <div className="flex items-center gap-4 mt-3 mb-5 text-sm">
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

      {markets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-medium">No markets found</p>
          <p className="text-sm mt-1">Try a different filter or search</p>
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden bg-card">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
