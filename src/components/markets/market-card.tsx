"use client";

import Link from "next/link";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Market } from "@/generated/prisma/client";

// ─── Compact Card — Kalshi-style, no images, no sparkline ──────────
export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg border bg-card hover:border-[var(--color-viking)]/30 transition-all duration-150 p-3.5 h-full flex flex-col gap-2.5 card-tilt">
        {/* Category + Time */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {catLabel && (
            <span className="font-medium uppercase tracking-wide">{catLabel}</span>
          )}
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>
            {market.status === "RESOLVED" ? (
              <span
                className={cn(
                  "font-semibold",
                  market.resolution === "YES"
                    ? "text-[var(--color-yes)]"
                    : "text-[var(--color-no)]"
                )}
              >
                Resolved {market.resolution}
              </span>
            ) : (
              timeLeft
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1 group-hover:text-foreground/80 transition-colors">
          {market.title}
        </h3>

        {/* Yes / No buttons + volume */}
        <div className="flex items-center gap-2">
          <span className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-yes)]/10 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/20 transition-colors border border-[var(--color-yes)]/20 text-center cursor-pointer">
            Yes {yesPercent}¢
          </span>
          <span className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-no)]/10 text-[var(--color-no)] hover:bg-[var(--color-no)]/20 transition-colors border border-[var(--color-no)]/20 text-center cursor-pointer">
            No {noPercent}¢
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-0.5">
            ${formatCompactNumber(market.totalVolume)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Row — for sidebar lists (Trending, Movers, New) ──────
export function MarketRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex items-center gap-3 py-2.5 px-1 hover:bg-accent/50 transition-colors rounded"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1 group-hover:text-foreground/80">
          {market.title}
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          ${formatCompactNumber(market.totalVolume)} vol
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="text-sm font-bold tabular-nums">{yesPercent}¢</span>
        <span className="text-[10px] text-muted-foreground">Yes</span>
      </div>
    </Link>
  );
}
