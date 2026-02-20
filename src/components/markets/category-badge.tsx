import { CATEGORIES } from "@/lib/constants";

export function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {cat?.label ?? category}
    </span>
  );
}
