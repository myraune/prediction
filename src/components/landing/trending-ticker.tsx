"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TickerMarket {
  id: string;
  title: string;
  yesPrice: number;
  change: number; // positive = up, negative = down
}

export function TrendingTicker({ markets }: { markets: TickerMarket[] }) {
  if (markets.length === 0) return null;

  // Double the array for seamless loop
  const items = [...markets, ...markets];

  return (
    <div className="relative overflow-hidden border-b bg-card/50">
      <div className="flex items-center gap-6 py-2 animate-ticker whitespace-nowrap">
        {items.map((m, i) => (
          <Link
            key={`${m.id}-${i}`}
            href={`/markets/${m.id}`}
            className="flex items-center gap-2 text-xs shrink-0 hover:text-[var(--color-viking)] transition-colors group"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[200px]">
              {m.title}
            </span>
            <span className="font-bold tabular-nums">{m.yesPrice}¢</span>
            {m.change !== 0 && (
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  m.change > 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
                )}
              >
                {m.change > 0 ? "+" : ""}{m.change}¢
              </span>
            )}
            <span className="text-border">|</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
