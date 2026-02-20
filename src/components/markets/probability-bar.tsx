import { cn } from "@/lib/utils";

export function ProbabilityBar({
  yesPercent,
  size = "md",
}: {
  yesPercent: number;
  size?: "sm" | "md" | "lg";
}) {
  const noPercent = 100 - yesPercent;
  const yesCents = Math.round(yesPercent);
  const noCents = Math.round(noPercent);
  const height = size === "sm" ? "h-1.5" : size === "md" ? "h-2" : "h-3";

  return (
    <div className="w-full">
      <div className={cn("flex rounded-full overflow-hidden bg-muted", height)}>
        <div
          className="bg-[var(--color-yes)] transition-all duration-500"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-[var(--color-no)]/30 transition-all duration-500"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {size !== "sm" && (
        <div className="flex justify-between mt-1.5 text-xs font-medium">
          <span className="text-[var(--color-yes)]">Yes {yesCents}¢</span>
          <span className="text-[var(--color-no)]">No {noCents}¢</span>
        </div>
      )}
    </div>
  );
}
