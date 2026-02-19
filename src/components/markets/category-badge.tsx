import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  POLITICS: "bg-blue-500/10 text-blue-700 border-blue-200",
  SPORTS: "bg-green-500/10 text-green-700 border-green-200",
  CRYPTO: "bg-orange-500/10 text-orange-700 border-orange-200",
  CLIMATE: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  ECONOMICS: "bg-amber-500/10 text-amber-700 border-amber-200",
  CULTURE: "bg-purple-500/10 text-purple-700 border-purple-200",
  COMPANIES: "bg-slate-500/10 text-slate-700 border-slate-200",
  FINANCIALS: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  TECH_SCIENCE: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  ENTERTAINMENT: "bg-pink-500/10 text-pink-700 border-pink-200",
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
