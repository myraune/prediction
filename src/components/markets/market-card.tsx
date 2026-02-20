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

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
        {/* Thumbnail */}
        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
          {market.imageUrl ? (
            <MarketImage src={market.imageUrl} alt={market.title} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-snug line-clamp-1">
            {market.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            <span>{formatCompactNumber(market.totalVolume)} Vol</span>
            <span>·</span>
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
          <button
            className="flex flex-col items-center justify-center w-[60px] h-9 rounded-md bg-[var(--color-yes)]/8 hover:bg-[var(--color-yes)]/15 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[13px] font-semibold tabular-nums text-[var(--color-yes)] leading-none">
              {yesCents}¢
            </span>
            <span className="text-[9px] font-medium text-[var(--color-yes)]/60 uppercase mt-0.5">
              Yes
            </span>
          </button>
          <button
            className="flex flex-col items-center justify-center w-[60px] h-9 rounded-md bg-[var(--color-no)]/8 hover:bg-[var(--color-no)]/15 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[13px] font-semibold tabular-nums text-[var(--color-no)] leading-none">
              {noCents}¢
            </span>
            <span className="text-[9px] font-medium text-[var(--color-no)]/60 uppercase mt-0.5">
              No
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}
