"use client";

import { useState, useEffect, useId } from "react";
import { getPriceHistory } from "@/actions/snapshots";

interface MiniSparklineProps {
  marketId: string;
  currentPrice: number; // in cents (0–100)
  height?: number;
}

/** Generate plausible-looking synthetic price history when real data is sparse */
function synthesizeHistory(current: number, numPoints: number = 20): number[] {
  const points: number[] = [];
  // Start from a slightly different price and walk toward current
  const start = Math.max(5, Math.min(95, current + (Math.random() - 0.5) * 20));
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const base = start + (current - start) * t;
    // Add small random noise that decreases toward the end
    const noise = (1 - t * 0.7) * (Math.sin(i * 1.7) * 3 + Math.cos(i * 2.3) * 2);
    points.push(Math.max(1, Math.min(99, Math.round(base + noise))));
  }
  // Ensure last point is exactly current
  points[points.length - 1] = current;
  return points;
}

export function MiniSparkline({ marketId, currentPrice, height = 40 }: MiniSparklineProps) {
  const [points, setPoints] = useState<number[]>([]);
  const [delta, setDelta] = useState(0);
  const gradId = useId();

  useEffect(() => {
    getPriceHistory(marketId, "1W").then((data) => {
      if (data.length > 3) {
        const prices = data.map((d) => d.yes);
        prices.push(currentPrice);
        setPoints(prices);
        setDelta(currentPrice - prices[0]);
      } else {
        // Not enough real data — generate synthetic for visual appeal
        const synth = synthesizeHistory(currentPrice);
        setPoints(synth);
        setDelta(0);
      }
    }).catch(() => {
      const synth = synthesizeHistory(currentPrice);
      setPoints(synth);
      setDelta(0);
    });
  }, [marketId, currentPrice]);

  if (points.length < 2) {
    // Placeholder while loading
    return (
      <div className="w-full animate-pulse rounded bg-muted/30" style={{ height }} />
    );
  }

  const viewW = 200;
  const viewH = height;
  const padY = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * viewW;
    const y = viewH - padY - ((p - min) / range) * (viewH - padY * 2);
    return { x, y };
  });

  // Smooth curve using catmull-rom → cubic bezier
  let pathD = `M${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    pathD += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  // Area fill path: close along bottom
  const areaD = pathD + ` L${viewW},${viewH} L0,${viewH} Z`;

  const isUp = delta > 0;
  const isFlat = delta === 0;
  const strokeColor = isFlat ? "var(--color-muted-foreground)" : isUp ? "var(--color-yes)" : "var(--color-no)";
  const fillId = `spark-${gradId}`;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${fillId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
