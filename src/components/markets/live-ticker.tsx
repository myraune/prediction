"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecentActivity } from "@/actions/live";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  userName: string;
  marketId: string;
  marketTitle: string;
  side: "YES" | "NO";
  direction: "BUY" | "SELL";
  amount: number;
  shares: number;
  price: number;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function LiveActivityTicker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const knownIds = new Set<string>();

    async function poll() {
      try {
        const result = await getRecentActivity(8);
        if (!active) return;

        // Detect new trades for animation
        const freshIds = new Set<string>();
        for (const t of result) {
          if (!knownIds.has(t.id)) {
            freshIds.add(t.id);
            knownIds.add(t.id);
          }
        }

        if (freshIds.size > 0) {
          setNewIds(freshIds);
          setTimeout(() => active && setNewIds(new Set()), 1500);
        }

        setTrades(result);
      } catch {
        // Silently fail
      }
    }

    // Initial fetch
    poll();
    const id = setInterval(poll, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (trades.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-yes)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Live Activity
        </h3>
      </div>
      <div className="space-y-0">
        {trades.map((t) => (
          <Link
            key={t.id}
            href={`/markets/${t.marketId}`}
            className={cn(
              "flex items-start gap-2 py-1.5 text-[12px] rounded px-1 transition-all duration-300",
              newIds.has(t.id)
                ? "bg-[var(--color-yes)]/10"
                : "hover:bg-accent/50"
            )}
          >
            <span className={cn(
              "font-semibold shrink-0 w-6 text-center",
              t.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
            )}>
              {t.side === "YES" ? "Y" : "N"}
            </span>
            <span className="flex-1 min-w-0 text-muted-foreground leading-tight">
              <span className="font-medium text-foreground">{t.userName}</span>
              {" "}{t.direction === "BUY" ? "bought" : "sold"}{" "}
              <span className="tabular-nums font-medium text-foreground">{t.shares.toFixed(1)}</span>
              {" "}at{" "}
              <span className={cn(
                "tabular-nums font-medium",
                t.side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
              )}>
                {t.price}¢
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
              {timeAgo(t.createdAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
