import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrice } from "@/lib/amm";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Clock, BarChart3 } from "lucide-react";
import type { Market } from "@/generated/prisma/client";

interface RelatedMarketsProps {
  markets: Market[];
}

export function RelatedMarkets({ markets }: RelatedMarketsProps) {
  if (markets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Related Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          {markets.map((market) => {
            const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
            const yesPercent = price.yes * 100;
            const closing = isClosingSoon(market.closesAt);
            const timeLeft = getTimeRemaining(market.closesAt);

            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="flex items-center justify-between py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium line-clamp-1">
                    {market.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {formatCompactNumber(market.totalVolume)}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1",
                      closing && "text-[var(--color-no)]"
                    )}>
                      <Clock className="h-3 w-3" />
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
      </CardContent>
    </Card>
  );
}
