import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CategoryBadge } from "./category-badge";
import { ProbabilityBar } from "./probability-bar";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Market } from "@/generated/prisma/client";

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = price.yes * 100;
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={cn(
        "h-full cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:shadow-[var(--color-mint)]/5 hover:border-[var(--color-mint)]/20",
        "dark:hover:shadow-[var(--color-mint)]/10",
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={market.category} />
            {market.status === "RESOLVED" ? (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                market.resolution === "YES"
                  ? "bg-[var(--color-mint)]/20 text-[var(--color-mint)]"
                  : "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
              )}>
                {market.resolution}
              </span>
            ) : (
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                closing
                  ? "bg-[var(--color-signal)]/10 text-[var(--color-signal)]"
                  : "text-muted-foreground"
              )}>
                <Clock className="h-3 w-3" />
                {timeLeft}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 mt-2">
            {market.title}
          </h3>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Large probability display */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-mint)]">
              {yesPercent.toFixed(0)}%
            </span>
            <span className="text-sm font-medium text-[var(--color-mint)]/70">YES</span>
          </div>

          <ProbabilityBar yesPercent={yesPercent} size="sm" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>{formatCompactNumber(market.totalVolume)} vol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-mint)]">{yesPercent.toFixed(0)}%</span>
              <span>/</span>
              <span className="text-[var(--color-signal)]">{(100 - yesPercent).toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
