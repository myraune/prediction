import Link from "next/link";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Market } from "@/generated/prisma/client";

interface RelatedMarketsProps {
  markets: Market[];
}

export function RelatedMarkets({ markets }: RelatedMarketsProps) {
  if (markets.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 bg-card">
      <h3 className="text-sm font-medium mb-3">Related Markets</h3>
      <div className="divide-y">
        {markets.map((market) => {
          const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
          const yesPercent = price.yes * 100;
          const closing = isClosingSoon(market.closesAt);
          const timeLeft = getTimeRemaining(market.closesAt);

          return (
            <Link
              key={market.id}
              href={`/markets/${market.id}`}
              className="flex items-center justify-between py-3 hover:bg-muted/50 transition-colors -mx-1 px-1 rounded"
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium line-clamp-1">
                  {market.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatCompactNumber(market.totalVolume)} vol</span>
                  <span className={cn(closing && "text-[var(--color-no)]")}>
                    {timeLeft}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-semibold tabular-nums text-[var(--color-yes)]">
                  {Math.round(yesPercent)}¢
                </span>
                <p className="text-[10px] text-muted-foreground">YES</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
