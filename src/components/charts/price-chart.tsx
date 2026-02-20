"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getPriceHistory } from "@/actions/snapshots";
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

function ChartSkeleton() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full h-full relative overflow-hidden rounded">
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
        <svg className="w-full h-full opacity-10" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path
            d="M0,70 Q30,65 50,55 T100,50 T150,60 T200,45"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </svg>
      </div>
    </div>
  );
}

export function PriceChart({ marketId, currentYesPrice }: PriceChartProps) {
  const [range, setRange] = useState<string>("ALL");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const formatTime = (time: string) => {
    const d = new Date(time);
    if (range === "1H" || range === "6H" || range === "1D") {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Unique gradient ID per chart instance to avoid SVG defs collision
  const gradientId = `yesGrad-${marketId.slice(0, 8)}`;

  return (
    <div className="space-y-3">
      {/* Time range selector — pill style */}
      <div className="flex items-center gap-1">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors",
              range === r
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Failed to load chart data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-yes, #2ecc71)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-yes, #2ecc71)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #6b7280)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #6b7280)" }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => `${v}¢`}
              />
              <ReferenceLine y={50} stroke="var(--color-border, #e5e5e5)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card, #ffffff)",
                  border: "1px solid var(--color-border, #e5e5e5)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--color-foreground, #0a0a0a)",
                }}
                labelFormatter={(label) => formatTime(String(label))}
                formatter={(value, name) => [
                  `${value}¢`,
                  name === "yes" ? "YES" : "NO",
                ]}
              />
              <Area
                type="monotone"
                dataKey="yes"
                stroke="var(--color-yes, #2ecc71)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-yes, #2ecc71)", stroke: "var(--color-card, #fff)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
