import { cn } from "@/lib/utils";

export function ProbabilityBar({
  yesPercent,
  size = "md",
  animated = false,
}: {
  yesPercent: number;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}) {
  const noPercent = 100 - yesPercent;
  const height =
    size === "sm" ? "h-1.5" :
    size === "md" ? "h-2.5" :
    size === "lg" ? "h-4" :
    "h-6";

  return (
    <div className="w-full">
      <div className={cn(
        "flex rounded-full overflow-hidden bg-muted",
        height,
      )}>
        <div
          className={cn(
            "bg-[var(--color-mint)] transition-all duration-500",
            animated && "animate-in slide-in-from-left"
          )}
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className={cn(
            "bg-[var(--color-signal)]/60 transition-all duration-500",
          )}
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {(size === "md" || size === "lg" || size === "xl") && (
        <div className="flex justify-between mt-1.5 text-xs font-medium">
          <span className="text-[var(--color-mint)]">YES {yesPercent.toFixed(1)}%</span>
          <span className="text-[var(--color-signal)]">NO {noPercent.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
