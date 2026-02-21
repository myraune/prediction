"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New" },
  { value: "ending", label: "Ending Soon" },
  { value: "popular", label: "Popular" },
] as const;

export function MarketSortTabs() {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "trending";
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  function buildHref(sort: string) {
    const params = new URLSearchParams();
    if (sort !== "trending") params.set("sort", sort);
    if (category) params.set("category", category);
    if (status && status !== "OPEN") params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/markets${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {sortOptions.map((opt) => {
        const isActive = currentSort === opt.value;
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
