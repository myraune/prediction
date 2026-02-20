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
  const yesCents = Math.round(yesPercent);
  const noCents = Math.round(noPercent);
  const height =
    size === "sm" ? "h-1.5" :
    size === "md" ? "h-2.5" :
    size === "lg" ? "h-4" :
    "h-6";

  return (
    <div className="w-full">
      <div className={cn(
        "flex rounded-sm overflow-hidden bg-muted",
        height,
      )}>
        <div
          className={cn(
            "bg-[var(--color-yes)] transition-all duration-500",
            animated && "animate-in slide-in-from-left"
          )}
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className={cn(
            "bg-[var(--color-no)]/40 transition-all duration-500",
          )}
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {(size === "md" || size === "lg" || size === "xl") && (
        <div className="flex justify-between mt-1.5 text-xs font-medium">
          <span className="text-[var(--color-yes)]">YES {yesCents}¢</span>
          <span className="text-[var(--color-no)]">NO {noCents}¢</span>
        </div>
      )}
    </div>
  );
}
