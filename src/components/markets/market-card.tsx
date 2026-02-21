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
      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export function MarketCard({ market }: { market: Market }) {
  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);
  const closing = isClosingSoon(market.closesAt);
  const timeLeft = getTimeRemaining(market.closesAt);
  const catLabel = CATEGORIES.find((c) => c.value === market.category)?.label;

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-card border border-border hover:border-border/80 transition-all hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[2/1] bg-muted">
          {market.imageUrl ? (
            <MarketImage src={market.imageUrl} alt={market.title} />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-accent to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Large percentage overlay */}
          <div className="absolute bottom-2 right-2">
            <span className="text-2xl font-bold text-white tabular-nums drop-shadow-lg">
              {yesPercent}%
            </span>
          </div>
          {catLabel && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-black/50 text-white/80 rounded backdrop-blur-sm">
              {catLabel}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 flex-1 flex flex-col">
          <h3 className="text-[13px] font-medium leading-snug line-clamp-2 flex-1">
            {market.title}
          </h3>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
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
                <span className={cn("truncate", closing && "text-[var(--color-no)] font-medium")}>
                  {timeLeft}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="px-2 py-0.5 text-[11px] font-semibold tabular-nums rounded bg-[var(--color-yes)]/15 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/25 transition-colors cursor-pointer"
                onClick={(e) => e.preventDefault()}
              >
                Yes {yesPercent}¢
              </span>
              <span
                className="px-2 py-0.5 text-[11px] font-semibold tabular-nums rounded bg-[var(--color-no)]/15 text-[var(--color-no)] hover:bg-[var(--color-no)]/25 transition-colors cursor-pointer"
                onClick={(e) => e.preventDefault()}
              >
                No {noCents}¢
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
