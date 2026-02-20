import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  POLITICS: "text-blue-600 dark:text-blue-400",
  SPORTS: "text-green-600 dark:text-green-400",
  CRYPTO: "text-orange-600 dark:text-orange-400",
  CLIMATE: "text-cyan-600 dark:text-cyan-400",
  ECONOMICS: "text-amber-600 dark:text-amber-400",
  CULTURE: "text-purple-600 dark:text-purple-400",
  COMPANIES: "text-slate-600 dark:text-slate-400",
  FINANCIALS: "text-emerald-600 dark:text-emerald-400",
  TECH_SCIENCE: "text-indigo-600 dark:text-indigo-400",
  ENTERTAINMENT: "text-pink-600 dark:text-pink-400",
};

export function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-wider",
        categoryColors[category] ?? "text-muted-foreground"
      )}
    >
      {cat?.label ?? category}
    </span>
  );
}
