import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  POLITICS: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  SPORTS: "bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800",
  CRYPTO: "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  CLIMATE: "bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:text-cyan-400 dark:border-cyan-800",
  ECONOMICS: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800",
  CULTURE: "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  COMPANIES: "bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400 dark:border-slate-700",
  FINANCIALS: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  TECH_SCIENCE: "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800",
  ENTERTAINMENT: "bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-400 dark:border-pink-800",
};

export function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", categoryColors[category] ?? "")}
    >
      {cat?.label ?? category}
    </Badge>
  );
}
