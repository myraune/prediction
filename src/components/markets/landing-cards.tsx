"use client";

import Link from "next/link";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { MiniSparkline } from "./mini-sparkline";
import type { Market } from "@/generated/prisma/client";

// ─── Featured Card — large with chart area ──────────────────
export function FeaturedCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg border bg-card hover:border-foreground/20 transition-all duration-150 p-4 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {catLabel && (
            <span className="font-medium uppercase tracking-wide">{catLabel}</span>
          )}
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
        </div>
        <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-foreground/80 transition-colors">
          {market.title}
        </h3>

        {/* Sparkline chart */}
        <div className="flex-1 min-h-[48px]">
          <MiniSparkline marketId={market.id} currentPrice={yesPercent} height={48} />
        </div>

        {/* Yes / No + Volume */}
        <div className="flex items-center gap-2 mt-auto">
          <span
            className="flex-1 py-2 text-sm font-semibold tabular-nums rounded-md bg-[var(--color-yes)]/10 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/20 transition-colors border border-[var(--color-yes)]/20 text-center cursor-pointer"
          >
            Yes {yesPercent}¢
          </span>
          <span
            className="flex-1 py-2 text-sm font-semibold tabular-nums rounded-md bg-[var(--color-no)]/10 text-[var(--color-no)] hover:bg-[var(--color-no)]/20 transition-colors border border-[var(--color-no)]/20 text-center cursor-pointer"
          >
            No {noPercent}¢
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 ml-1">
            ${formatCompactNumber(market.totalVolume)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Card — standard card for grids ──────────────────
export function CompactCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg border bg-card hover:border-foreground/20 transition-all duration-150 p-3.5 h-full flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {catLabel && (
            <span className="font-medium uppercase tracking-wide">{catLabel}</span>
          )}
          <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
        </div>
        <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1 group-hover:text-foreground/80 transition-colors">
          {market.title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-yes)]/10 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/20 transition-colors border border-[var(--color-yes)]/20 text-center cursor-pointer"
          >
            Yes {yesPercent}¢
          </span>
          <span
            className="flex-1 py-1.5 text-xs font-semibold tabular-nums rounded-md bg-[var(--color-no)]/10 text-[var(--color-no)] hover:bg-[var(--color-no)]/20 transition-colors border border-[var(--color-no)]/20 text-center cursor-pointer"
          >
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

// ─── Sidebar Row — compact list item ──────────────────
export function SidebarRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex items-center gap-3 py-2.5 hover:bg-accent/50 transition-colors rounded px-1"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1">
          {market.title}
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          ${formatCompactNumber(market.totalVolume)} vol
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span className="text-sm font-bold tabular-nums">{yesPercent}¢</span>
        <span className="text-[10px] text-muted-foreground">Yes</span>
      </div>
    </Link>
  );
}
