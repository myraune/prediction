import { prisma } from "@/lib/prisma";
import { MarketCard } from "@/components/markets/market-card";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const status = params.status ?? "OPEN";

  const markets = await prisma.market.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(status !== "ALL" ? { status } : {}),
    },
    orderBy: { totalVolume: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-muted-foreground mt-1">Browse all prediction markets</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/markets">
          <Button variant={!category ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat.value} href={`/markets?category=${cat.value}${status !== "OPEN" ? `&status=${status}` : ""}`}>
            <Button
              variant={category === cat.value ? "default" : "outline"}
              size="sm"
            >
              {cat.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {["OPEN", "RESOLVED", "ALL"].map((s) => (
          <Link
            key={s}
            href={`/markets?${category ? `category=${category}&` : ""}${s !== "OPEN" ? `status=${s}` : ""}`}
          >
            <Button
              variant={status === s || (s === "OPEN" && !params.status) ? "secondary" : "ghost"}
              size="sm"
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          </Link>
        ))}
      </div>

      {/* Markets grid */}
      {markets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No markets found</p>
          <p className="text-sm mt-1">Try a different category or status filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
