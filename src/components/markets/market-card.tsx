"use client";

import Link from "next/link";
import Image from "next/image";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Market } from "@/generated/prisma/client";

function MarketImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="48px"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

/**
 * Kalshi/Polymarket-style market row.
 * Compact horizontal layout: thumbnail | title + meta | YES/NO buttons
 */
export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`}>
      <div
        className={cn(
          "group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-lg border border-transparent",
          "hover:bg-muted/50 hover:border-border/60 transition-colors cursor-pointer"
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
          {market.imageUrl ? (
            <MarketImage src={market.imageUrl} alt={market.title} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-foreground">
            {market.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatCompactNumber(market.totalVolume)} Vol</span>
            <span className="text-border">·</span>
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
              <span className={cn(closing && "text-[var(--color-no)] font-medium")}>
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* YES / NO buttons — right side */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex flex-col items-center justify-center w-16 h-10 rounded-md text-center",
              "bg-[var(--color-yes)]/10 border border-[var(--color-yes)]/20",
              "group-hover:bg-[var(--color-yes)]/15 transition-colors"
            )}
          >
            <span className="text-sm font-bold tabular-nums text-[var(--color-yes)] leading-none">
              {yesCents}¢
            </span>
            <span className="text-[9px] font-medium text-[var(--color-yes)]/70 uppercase">
              Yes
            </span>
          </div>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-16 h-10 rounded-md text-center",
              "bg-[var(--color-no)]/10 border border-[var(--color-no)]/20",
              "group-hover:bg-[var(--color-no)]/15 transition-colors"
            )}
          >
            <span className="text-sm font-bold tabular-nums text-[var(--color-no)] leading-none">
              {noCents}¢
            </span>
            <span className="text-[9px] font-medium text-[var(--color-no)]/70 uppercase">
              No
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
