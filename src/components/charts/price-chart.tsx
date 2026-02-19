"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getPriceHistory } from "@/actions/snapshots";
import { cn } from "@/lib/utils";

const timeRanges = ["1D", "1W", "1M", "ALL"] as const;

interface PriceChartProps {
  marketId: string;
  currentYesPrice: number;
}

interface DataPoint {
  time: string;
  yes: number;
  no: number;
}

export function PriceChart({ marketId, currentYesPrice }: PriceChartProps) {
  const [range, setRange] = useState<string>("ALL");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPriceHistory(marketId, range).then((d) => {
      // Always include current price as last point
      const currentPoint: DataPoint = {
        time: new Date().toISOString(),
        yes: Math.round(currentYesPrice * 100),
        no: Math.round((1 - currentYesPrice) * 100),
      };

      if (d.length === 0) {
        // If no snapshots, create a flat line from market creation at 50%
        setData([
          { time: new Date(Date.now() - 86400000).toISOString(), yes: 50, no: 50 },
          currentPoint,
        ]);
      } else {
        setData([...d, currentPoint]);
      }
      setLoading(false);
    });
  }, [marketId, range, currentYesPrice]);

  const formatTime = (time: string) => {
    const d = new Date(time);
    if (range === "1D") {
      return d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("nb-NO", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex items-center gap-1">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              range === r
                ? "bg-[var(--color-mint)]/15 text-[var(--color-mint)]"
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
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5adbb5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5adbb5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => formatTime(String(label))}
                formatter={(value, name) => [
                  `${value}%`,
                  name === "yes" ? "YES" : "NO",
                ]}
              />
              <Area
                type="monotone"
                dataKey="yes"
                stroke="#5adbb5"
                strokeWidth={2}
                fill="url(#yesGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#5adbb5", stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
