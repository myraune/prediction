"use client";

import { useState, useEffect } from "react";
import { getPriceHistory } from "@/actions/snapshots";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MiniSparklineProps {
  marketId: string;
  currentPrice: number; // in cents
}

export function MiniSparkline({ marketId, currentPrice }: MiniSparklineProps) {
  const [points, setPoints] = useState<number[]>([]);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    getPriceHistory(marketId, "1W").then((data) => {
      if (data.length > 1) {
        const prices = data.map((d) => d.yes);
        prices.push(currentPrice);
        setPoints(prices);
        setDelta(currentPrice - prices[0]);
      } else {
        // Not enough data — show flat
        setPoints([50, currentPrice]);
        setDelta(0);
      }
    });
  }, [marketId, currentPrice]);

  if (points.length < 2) return null;

  // Build SVG sparkline
  const width = 100;
  const height = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pathPoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M${pathPoints.join(" L")}`;
  const color = delta > 0 ? "var(--color-yes)" : delta < 0 ? "var(--color-no)" : "var(--muted-foreground)";

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="shrink-0" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-0.5 text-[10px] font-medium tabular-nums" style={{ color }}>
        {delta > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : delta < 0 ? (
          <TrendingDown className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
        <span>{delta > 0 ? "+" : ""}{delta}¢</span>
      </div>
    </div>
  );
}
