import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "./category-badge";
import { MiniSparkline } from "./mini-sparkline";
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
        "h-full cursor-pointer transition-all duration-150 overflow-hidden",
        "hover:shadow-md hover:border-border",
      )}>
        {/* Market image — Kalshi style */}
        {market.imageUrl && (
          <div className="relative h-32 w-full bg-muted">
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* Category + time on image */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
              <span className="bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium">
                <CategoryBadge category={market.category} />
              </span>
              {market.status === "RESOLVED" ? (
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-sm",
                  market.resolution === "YES"
                    ? "bg-[var(--color-yes)]/90 text-white"
                    : "bg-[var(--color-no)]/90 text-white"
                )}>
                  {market.resolution}
                </span>
              ) : (
                <span className={cn(
                  "flex items-center gap-1 text-[10px] bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded",
                  closing ? "text-[var(--color-no)]" : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3" />
                  {timeLeft}
                </span>
              )}
            </div>
          </div>
        )}

        <CardContent className={cn("p-4 space-y-3", !market.imageUrl && "pt-4")}>
          {/* Category + time (fallback when no image) */}
          {!market.imageUrl && (
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
          )}

          {/* Title */}
          <h3 className="text-sm font-medium leading-snug line-clamp-2">
            {market.title}
          </h3>

          {/* Mini sparkline — shows price movement */}
          <MiniSparkline marketId={market.id} currentPrice={yesCents} />

          {/* YES / NO price buttons — Kalshi style */}
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
