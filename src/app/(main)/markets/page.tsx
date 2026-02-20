import { prisma } from "@/lib/prisma";
import { MarketCard } from "@/components/markets/market-card";
import { MarketSortTabs } from "@/components/markets/market-sort-tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

  const where: Prisma.MarketWhereInput = {
    ...(category ? { category } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { title: { contains: q } } : {}),
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
  try {
    markets = await prisma.market.findMany({ where, orderBy });
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

  function statusHref(s: string) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (s !== "OPEN") p.set("status", s);
    if (sort !== "trending") p.set("sort", sort);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/markets${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {categoryLabel ?? "Markets"}
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

      <MarketSortTabs />

      <div className="flex items-center gap-4 mt-3 mb-5 text-sm">
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
