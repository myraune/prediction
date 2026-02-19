import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CategoryBadge } from "./category-badge";
import { ProbabilityBar } from "./probability-bar";
import { getPrice } from "@/lib/amm";
import { formatDate } from "@/lib/format";
import { Clock, BarChart3 } from "lucide-react";
import type { Market } from "@/generated/prisma/client";

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = price.yes * 100;

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={market.category} />
            {market.status === "RESOLVED" && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                market.resolution === "YES" ? "bg-[var(--color-mint)]/20 text-[var(--color-mint)]" : "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
              }`}>
                {market.resolution}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 mt-2">
            {market.title}
          </h3>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ProbabilityBar yesPercent={yesPercent} size="sm" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>{market.totalVolume.toLocaleString("nb-NO")} vol</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(market.closesAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
