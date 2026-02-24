"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Trophy,
  Landmark,
  TrophyIcon,
  Bitcoin,
  ThermometerSun,
  TrendingUpIcon,
  Palette,
  Building2,
  Cpu,
  Tv,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";
import { ThemeToggleInline } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

const categoryIcons: Record<string, React.ElementType> = {
  POLITICS: Landmark,
  SPORTS: TrophyIcon,
  CRYPTO: Bitcoin,
  CLIMATE: ThermometerSun,
  ECONOMICS: TrendingUpIcon,
  CULTURE: Palette,
  COMPANIES: Building2,
  FINANCIALS: BarChart3,
  TECH_SCIENCE: Cpu,
  ENTERTAINMENT: Tv,
};

const mainNav = [
  { href: "/markets", label: "Markets", icon: LayoutGrid },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

interface SidebarProps {
  categoryCounts?: Record<string, number>;
}

export function Sidebar({ categoryCounts = {} }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeRegion = searchParams.get("region");

  return (
    <aside className="hidden lg:flex flex-col w-[200px] border-r bg-background h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center px-4 h-12 shrink-0">
        <Link href="/">
          <VikingWordmark height={18} />
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 mt-2">
        {mainNav.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-viking)]/10 text-[var(--color-viking)] border-l-2 border-[var(--color-viking)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Region */}
      <div className="px-3 mt-5">
        <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Region
        </p>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/markets?region=NO"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] transition-colors",
              activeRegion === "NO" && pathname === "/markets"
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span className="text-xs text-muted-foreground font-medium">NO</span>
            <span className="flex-1">Norway</span>
          </Link>
          <Link
            href="/markets?region=INT"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] transition-colors",
              activeRegion === "INT" && pathname === "/markets"
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">International</span>
          </Link>
        </nav>
      </div>

      <div className="px-3 mt-5 flex-1">
        <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Categories
        </p>
        <nav className="flex flex-col gap-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat.value] ?? LayoutGrid;
            const count = categoryCounts[cat.value] ?? 0;
            const isActive = activeCategory === cat.value && pathname === "/markets";
            return (
              <Link
                key={cat.value}
                href={`/markets?category=${cat.value}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] transition-colors",
                  isActive
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{cat.label}</span>
                {count > 0 && (
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">{count}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-3 border-t mt-auto shrink-0">
        <ThemeToggleInline className="w-full" />
      </div>
    </aside>
  );
}
