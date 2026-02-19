"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Flame, Clock, Timer, TrendingUp } from "lucide-react";

const sortOptions = [
  { value: "trending", label: "Trending", icon: Flame },
  { value: "new", label: "New", icon: Clock },
  { value: "ending", label: "Ending Soon", icon: Timer },
  { value: "popular", label: "Popular", icon: TrendingUp },
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
    <div className="flex items-center gap-1 border-b pb-px">
      {sortOptions.map((opt) => {
        const isActive = currentSort === opt.value;
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              isActive
                ? "border-[var(--color-mint)] text-[var(--color-mint)]"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
