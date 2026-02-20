"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "./category-badge";
import { MiniSparkline } from "./mini-sparkline";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { Clock, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Market } from "@/generated/prisma/client";

function MarketImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={(e) => {
        // Hide the image on error, show fallback
        const target = e.currentTarget;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          parent.classList.add("flex", "items-center", "justify-center");
          const fallback = document.createElement("div");
          fallback.className = "text-muted-foreground/30";
          fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
          parent.appendChild(fallback);
        }
      }}
    />
  );
}

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={cn(
        "group h-full cursor-pointer transition-all duration-200 overflow-hidden",
        "hover:shadow-lg hover:border-border hover:-translate-y-0.5",
      )}>
        {/* Market image — larger with overlay price */}
        {market.imageUrl && (
          <div className="relative h-36 w-full bg-muted overflow-hidden">
            <MarketImage src={market.imageUrl} alt={market.title} />
            {/* Gradient overlay — stronger for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Category + time badges on image */}
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

            {/* Large price overlay on image — Polymarket style */}
            <div className="absolute bottom-2 left-3">
              <span className="text-2xl font-bold text-white tabular-nums drop-shadow-lg">
                {yesCents}¢
              </span>
              <span className="text-[10px] text-white/80 ml-1 font-medium uppercase tracking-wide">chance</span>
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

          {/* Meta row — Volume + traders estimate */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {formatCompactNumber(market.totalVolume)} Vol.
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {Math.max(1, Math.floor(market.totalVolume / 150))} traders
              </span>
            </div>
            {!market.imageUrl && market.status === "OPEN" && (
              <span className={cn(
                "text-[10px]",
                closing ? "text-[var(--color-no)] font-medium" : ""
              )}>
                {timeLeft}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
