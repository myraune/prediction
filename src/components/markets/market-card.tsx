import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "./category-badge";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Market } from "@/generated/prisma/client";

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={cn(
        "h-full cursor-pointer transition-all duration-150",
        "hover:bg-accent/5 hover:border-border",
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Top row: category + time */}
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={market.category} />
            {market.status === "RESOLVED" ? (
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                market.resolution === "YES"
                  ? "bg-[var(--color-yes)]/15 text-[var(--color-yes)]"
                  : "bg-[var(--color-no)]/15 text-[var(--color-no)]"
              )}>
                {market.resolution}
              </span>
            ) : (
              <span className={cn(
                "flex items-center gap-1 text-[10px] text-muted-foreground",
                closing && "text-[var(--color-no)]"
              )}>
                <Clock className="h-3 w-3" />
                {timeLeft}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium leading-snug line-clamp-2">
            {market.title}
          </h3>

          {/* YES / NO price buttons — Polymarket style */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded bg-[var(--color-yes)]/10 border border-[var(--color-yes)]/20">
              <span className="text-xs font-medium text-[var(--color-yes)]">Yes</span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-yes)]">{yesCents}¢</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded bg-[var(--color-no)]/10 border border-[var(--color-no)]/20">
              <span className="text-xs font-medium text-[var(--color-no)]">No</span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-no)]">{noCents}¢</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            <span>{formatCompactNumber(market.totalVolume)} Vol.</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
