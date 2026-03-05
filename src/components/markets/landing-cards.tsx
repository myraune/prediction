"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { MiniSparkline } from "./mini-sparkline";
import { MarketThumbnail } from "./market-thumbnail";
import type { Market } from "@/generated/prisma/client";

// ─── Featured Card — large with thumbnail + chart area ──────────────
export function FeaturedCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-xl border border-border/50 bg-card hover:border-border transition-colors duration-150 p-4 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {catLabel && (
              <span className="font-medium uppercase tracking-wide">{catLabel}</span>
            )}
            <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
          </div>
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>

        {/* Thumbnail + Title */}
        <div className="flex items-start gap-3">
          <MarketThumbnail
            imageUrl={market.imageUrl}
            category={market.category}
            title={market.title}
            size="xl"
            className="rounded-xl"
          />
          <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-foreground/80 transition-colors">
            {market.title}
          </h3>
        </div>

        {/* Sparkline chart */}
        <div className="flex-1 min-h-[48px]">
          <MiniSparkline marketId={market.id} currentPrice={yesPercent} height={48} />
        </div>

        {/* Yes / No + Volume */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="flex-1 py-2 text-sm font-semibold font-price rounded-lg bg-[var(--color-viking)]/10 text-[var(--color-viking)] hover:bg-[var(--color-viking)]/20 transition-colors text-center cursor-pointer">
            Yes {yesPercent}¢
          </span>
          <span className="flex-1 py-2 text-sm font-semibold font-price rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted transition-colors text-center cursor-pointer">
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

// ─── Compact Card — with thumbnail ──────────────────
export function CompactCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noPercent = Math.round(price.no * 100);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;
  const timeLeft = getTimeRemaining(market.closesAt);
  const closing = isClosingSoon(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-xl border border-border/50 bg-card hover:border-border transition-colors duration-150 p-4 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {catLabel && (
              <span className="font-medium uppercase tracking-wide">{catLabel}</span>
            )}
            <span className={cn(closing && "text-[var(--color-no)] font-medium")}>{timeLeft}</span>
          </div>
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>

        {/* Thumbnail + Title */}
        <div className="flex items-start gap-3 flex-1">
          <MarketThumbnail
            imageUrl={market.imageUrl}
            category={market.category}
            title={market.title}
            size="xl"
            className="rounded-xl"
          />
          <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1 group-hover:text-foreground/80 transition-colors">
            {market.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <span className="flex-1 py-1.5 text-xs font-semibold font-price rounded-lg bg-[var(--color-viking)]/10 text-[var(--color-viking)] hover:bg-[var(--color-viking)]/20 transition-colors text-center cursor-pointer">
            Yes {yesPercent}¢
          </span>
          <span className="flex-1 py-1.5 text-xs font-semibold font-price rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted transition-colors text-center cursor-pointer">
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

// ─── Sidebar Row — compact list item with tiny thumbnail ──────────
export function SidebarRow({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex items-center gap-2.5 py-2.5 hover:bg-accent/50 transition-colors rounded px-1"
    >
      <MarketThumbnail
        imageUrl={market.imageUrl}
        category={market.category}
        title={market.title}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1">
          {market.title}
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          ${formatCompactNumber(market.totalVolume)} vol
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span className="text-sm font-bold font-price">{yesPercent}¢</span>
        <span className="text-[10px] text-muted-foreground">Yes</span>
      </div>
    </Link>
  );
}
