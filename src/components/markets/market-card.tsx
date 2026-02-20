"use client";

import Link from "next/link";
import Image from "next/image";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
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

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
        {/* Thumbnail */}
        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
          {market.imageUrl ? (
            <MarketImage src={market.imageUrl} alt={market.title} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {catLabel && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{catLabel}</span>
            )}
          </div>
          <h3 className="text-sm font-medium leading-tight line-clamp-1">
            {market.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">${formatCompactNumber(market.totalVolume)} Vol</span>
            <span className="text-muted-foreground/40">&middot;</span>
            {market.status === "RESOLVED" ? (
              <span
                className={cn(
                  "font-medium",
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

        {/* YES / NO buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex flex-col items-center justify-center w-[56px] h-9 rounded-md bg-[var(--color-yes)]/10 hover:bg-[var(--color-yes)]/18 transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[13px] font-bold tabular-nums text-[var(--color-yes)] leading-none">
              {yesCents}¢
            </span>
            <span className="text-[9px] font-semibold text-[var(--color-yes)]/50 uppercase mt-0.5">
              Yes
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center w-[56px] h-9 rounded-md bg-[var(--color-no)]/10 hover:bg-[var(--color-no)]/18 transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[13px] font-bold tabular-nums text-[var(--color-no)] leading-none">
              {noCents}¢
            </span>
            <span className="text-[9px] font-semibold text-[var(--color-no)]/50 uppercase mt-0.5">
              No
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
