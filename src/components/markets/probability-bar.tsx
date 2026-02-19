import { cn } from "@/lib/utils";

export function ProbabilityBar({
  yesPercent,
  size = "md",
}: {
  yesPercent: number;
  size?: "sm" | "md" | "lg";
}) {
  const noPercent = 100 - yesPercent;
  const height = size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-5";

  return (
    <div className="w-full">
      <div className={cn("flex rounded-full overflow-hidden", height)}>
        <div
          className="bg-[var(--color-mint)] transition-all duration-300"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-[var(--color-signal)] transition-all duration-300"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {size !== "sm" && (
        <div className="flex justify-between mt-1 text-xs font-medium">
          <span className="text-[var(--color-mint)]">YES {yesPercent.toFixed(1)}%</span>
          <span className="text-[var(--color-signal)]">NO {noPercent.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
