"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CountdownMarket {
  id: string;
  title: string;
  poolYes: number;
  poolNo: number;
  totalVolume: number;
  closesAt: string; // ISO string
}

function getCountdown(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getUrgency(closesAt: string): "urgent" | "soon" | "normal" {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff < 3600000) return "urgent"; // < 1 hour
  if (diff < 86400000) return "soon"; // < 1 day
  return "normal";
}

export function CountdownRow({ market }: { market: CountdownMarket }) {
  const [countdown, setCountdown] = useState(getCountdown(market.closesAt));
  const [urgency, setUrgency] = useState(getUrgency(market.closesAt));

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(getCountdown(market.closesAt));
      setUrgency(getUrgency(market.closesAt));
    }, 30000); // update every 30s
    return () => clearInterval(id);
  }, [market.closesAt]);

  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = Math.round(price.yes * 100);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex items-center gap-2 py-2.5 px-1 hover:bg-accent/50 transition-colors rounded"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight line-clamp-1 group-hover:text-foreground/80">
          {market.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ${formatCompactNumber(market.totalVolume)} vol
          </span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums">{yesPercent}¢</span>
        <span
          className={cn(
            "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded",
            urgency === "urgent"
              ? "bg-[var(--color-no)]/15 text-[var(--color-no)]"
              : urgency === "soon"
                ? "bg-[var(--color-viking)]/10 text-[var(--color-viking)]"
                : "bg-accent text-muted-foreground"
          )}
        >
          {countdown}
        </span>
      </div>
    </Link>
  );
}
