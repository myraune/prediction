"use client";

import { useLiveMarket } from "@/hooks/use-live-market";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LivePriceProps {
  marketId: string;
  initialYes: number; // cents
  initialNo: number;  // cents
  initialVolume: number;
}

export function LivePrice({ marketId, initialYes, initialNo, initialVolume }: LivePriceProps) {
  const { yesPrice, noPrice, totalVolume, flash } = useLiveMarket(
    marketId,
    { yesPrice: initialYes, noPrice: initialNo, totalVolume: initialVolume },
    5000
  );

  return (
    <div className="flex items-baseline gap-4">
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-3xl font-bold font-price transition-colors duration-300",
            flash === "up" && "text-[var(--color-yes)]",
            flash === "down" && "text-[var(--color-no)]",
            !flash && "text-[var(--color-yes)]"
          )}
        >
          {yesPrice}¢
        </span>
        <span className="text-sm text-muted-foreground">Yes</span>
      </div>
      <span className="text-muted-foreground">/</span>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-3xl font-bold font-price transition-colors duration-300",
            flash === "up" && "text-[var(--color-no)]",
            flash === "down" && "text-[var(--color-yes)]",
            !flash && "text-[var(--color-no)]"
          )}
        >
          {noPrice}¢
        </span>
        <span className="text-sm text-muted-foreground">No</span>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-yes)]" />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          ${formatCompactNumber(totalVolume)} vol
        </span>
      </div>
    </div>
  );
}
