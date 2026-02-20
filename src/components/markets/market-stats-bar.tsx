import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import { cn } from "@/lib/utils";

interface MarketStatsBarProps {
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  tradeCount: number;
  closesAt: Date;
}

export function MarketStatsBar({
  yesPrice,
  noPrice,
  totalVolume,
  tradeCount,
  closesAt,
}: MarketStatsBarProps) {
  const closing = isClosingSoon(closesAt);
  const timeLeft = getTimeRemaining(closesAt);

  const stats = [
    { label: "Yes", value: `${Math.round(yesPrice * 100)}¢`, color: "text-[var(--color-yes)]" },
    { label: "No", value: `${Math.round(noPrice * 100)}¢`, color: "text-[var(--color-no)]" },
    { label: "Volume", value: formatCompactNumber(totalVolume), color: "" },
    { label: "Trades", value: tradeCount.toLocaleString(), color: "" },
    { label: "Closes", value: timeLeft, color: cn(closing && "text-[var(--color-no)]") },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 py-3 border-y">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
          <span className={cn("text-sm font-semibold tabular-nums", stat.color)}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
