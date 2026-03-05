"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { getPriceHistory } from "@/actions/snapshots";
import { getLiveMarket } from "@/actions/live";
import { cn } from "@/lib/utils";

const timeRanges = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;

interface PriceChartProps {
  marketId: string;
  currentYesPrice: number;
}

interface DataPoint {
  time: string;
  yes: number;
  no: number;
}

/** Catmull-rom to cubic bezier smooth path */
function toSmoothPath(
  points: { x: number; y: number }[],
  close?: { viewW: number; viewH: number }
): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  if (close) {
    d += ` L${close.viewW},${close.viewH} L0,${close.viewH} Z`;
  }
  return d;
}

export function PriceChart({ marketId, currentYesPrice }: PriceChartProps) {
  const [range, setRange] = useState<string>("1D");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [livePrice, setLivePrice] = useState(Math.round(currentYesPrice * 100));
  const [, setPrevPrice] = useState(Math.round(currentYesPrice * 100));
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId();

  // Fetch historical data
  useEffect(() => {
    setLoading(true);
    setError(false);
    getPriceHistory(marketId, range)
      .then((d) => {
        const currentPoint: DataPoint = {
          time: new Date().toISOString(),
          yes: Math.round(currentYesPrice * 100),
          no: Math.round((1 - currentYesPrice) * 100),
        };
        if (d.length === 0) {
          setData([
            { time: new Date(Date.now() - 86400000).toISOString(), yes: 50, no: 50 },
            currentPoint,
          ]);
        } else {
          setData([...d, currentPoint]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [marketId, range, currentYesPrice]);

  // Live polling — update the last point every 5s so chart animates
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const result = await getLiveMarket(marketId);
        if (!active || !result) return;
        const newPrice = result.yesPrice;
        setLivePrice((old) => {
          if (old !== newPrice) setPrevPrice(old);
          return newPrice;
        });
        setData((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.yes !== newPrice) {
            updated[updated.length - 1] = {
              time: new Date().toISOString(),
              yes: newPrice,
              no: 100 - newPrice,
            };
          }
          return updated;
        });
      } catch {
        // silent
      }
    };
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [marketId]);

  const formatTime = useCallback((time: string) => {
    const d = new Date(time);
    if (range === "1H" || range === "6H" || range === "1D") {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [range]);

  // SVG dimensions — tall chart for Kalshi-style dominance
  const viewW = 700;
  const viewH = 280;
  const padX = 0;
  const padY = 20;
  const chartW = viewW - padX * 2;
  const chartH = viewH - padY * 2;

  // Calculate path coordinates
  const yesValues = data.map((d) => d.yes);
  const minVal = Math.min(...yesValues, 0);
  const maxVal = Math.max(...yesValues, 100);
  const rangeVal = maxVal - minVal || 1;

  const coords = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + (1 - (d.yes - minVal) / rangeVal) * chartH,
  }));

  const linePath = toSmoothPath(coords);
  const areaPath = toSmoothPath(coords, { viewW, viewH });

  // Price change
  const firstPrice = data.length > 0 ? data[0].yes : livePrice;
  const priceChange = livePrice - firstPrice;
  const isUp = priceChange >= 0;

  // Handle mouse hover for crosshair
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length < 2) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * viewW;
      const idx = Math.round(((x - padX) / chartW) * (data.length - 1));
      setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
    },
    [data.length, chartW]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverCoord = hoverIdx !== null ? coords[hoverIdx] : null;

  const strokeColor = isUp ? "var(--color-yes)" : "var(--color-no)";
  const lastCoord = coords.length > 0 ? coords[coords.length - 1] : null;

  // X-axis time labels (5 evenly-spaced)
  const timeLabels = data.length >= 2
    ? [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1]
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((idx) => ({ x: coords[idx]?.x ?? 0, label: formatTime(data[idx]?.time ?? "") }))
    : [];

  return (
    <div>
      {/* Price header — large, prominent */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-4xl font-bold font-price tracking-tight transition-all duration-300">
          {hoverPoint ? hoverPoint.yes : livePrice}¢
        </span>
        <span
          className={cn(
            "text-sm font-semibold font-price transition-colors",
            isUp ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"
          )}
        >
          {hoverPoint
            ? `${hoverPoint.yes >= firstPrice ? "+" : ""}${hoverPoint.yes - firstPrice}¢`
            : `${priceChange >= 0 ? "+" : ""}${priceChange}¢`}
        </span>
        <span className="text-xs text-muted-foreground">
          {hoverPoint ? formatTime(hoverPoint.time) : rangeLabel(range)}
        </span>
      </div>

      {/* Chart — big, full bleed */}
      <div className="relative w-full" style={{ height: "300px" }}>
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Failed to load chart data
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewW} ${viewH}`}
            preserveAspectRatio="none"
            className="overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
                <stop offset="80%" stopColor={strokeColor} stopOpacity={0.02} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* 50¢ reference line */}
            {minVal <= 50 && maxVal >= 50 && (
              <line
                x1={padX}
                x2={viewW}
                y1={padY + (1 - (50 - minVal) / rangeVal) * chartH}
                y2={padY + (1 - (50 - minVal) / rangeVal) * chartH}
                stroke="var(--color-border)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Area fill */}
            <path
              d={areaPath}
              fill={`url(#grad-${gradId})`}
              className="transition-all duration-700 ease-in-out"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-700 ease-in-out"
            />

            {/* Hover crosshair */}
            {hoverCoord && (
              <>
                <line
                  x1={hoverCoord.x}
                  x2={hoverCoord.x}
                  y1={padY - 5}
                  y2={viewH}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.5"
                />
                <circle
                  cx={hoverCoord.x}
                  cy={hoverCoord.y}
                  r="4"
                  fill={strokeColor}
                  stroke="var(--color-background)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}

            {/* Live pulsing dot at end */}
            {lastCoord && hoverIdx === null && (
              <>
                <circle
                  cx={lastCoord.x}
                  cy={lastCoord.y}
                  r="8"
                  fill={strokeColor}
                  opacity="0.12"
                  className="animate-live-pulse"
                />
                <circle
                  cx={lastCoord.x}
                  cy={lastCoord.y}
                  r="3"
                  fill={strokeColor}
                  stroke="var(--color-background)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}

            {/* X-axis time labels */}
            {timeLabels.map((t, i) => (
              <text
                key={i}
                x={t.x}
                y={viewH - 2}
                textAnchor={i === 0 ? "start" : i === timeLabels.length - 1 ? "end" : "middle"}
                fill="var(--color-muted-foreground)"
                fontSize="9"
                fontFamily="inherit"
                opacity="0.6"
              >
                {t.label}
              </text>
            ))}
          </svg>
        )}
      </div>

      {/* Time range selector — clean pills */}
      <div className="flex items-center gap-1 mt-2">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-all",
              range === r
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function rangeLabel(range: string) {
  switch (range) {
    case "1H": return "past hour";
    case "6H": return "past 6h";
    case "1D": return "today";
    case "1W": return "past week";
    case "1M": return "past month";
    case "ALL": return "all time";
    default: return "";
  }
}

function ChartSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full h-full relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-muted/20 animate-pulse" />
        <svg className="w-full h-full opacity-5" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M0,70 Q30,65 50,55 T100,50 T150,60 T200,45" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
