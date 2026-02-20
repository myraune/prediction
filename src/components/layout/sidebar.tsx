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

const categoryLabelsNO: Record<string, string> = {
  POLITICS: "Politikk",
  SPORTS: "Sport",
  CRYPTO: "Krypto",
  CLIMATE: "Klima",
  ECONOMICS: "Økonomi",
  CULTURE: "Kultur",
  COMPANIES: "Selskaper",
  FINANCIALS: "Finans",
  TECH_SCIENCE: "Tech & Vitenskap",
  ENTERTAINMENT: "Underholdning",
};

const mainNav = [
  { href: "/markets", label: "Markeder", icon: LayoutGrid },
  { href: "/portfolio", label: "Portefølje", icon: BarChart3 },
  { href: "/leaderboard", label: "Toppliste", icon: Trophy },
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
    <aside className="hidden lg:flex flex-col w-[220px] border-r bg-background h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center px-5 h-14 shrink-0">
        <Link href="/">
          <VikingWordmark height={22} />
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
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
              {link.label === "Markeder" && (
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-yes)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-yes)]" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Region quick links */}
      <div className="px-3 mt-5">
        <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Region
        </p>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/markets?region=NO"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
              activeRegion === "NO" && pathname === "/markets"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span className="text-sm">🇳🇴</span>
            <span className="flex-1">Norge</span>
          </Link>
          <Link
            href="/markets?region=INT"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
              activeRegion === "INT" && pathname === "/markets"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Internasjonalt</span>
          </Link>
        </nav>
      </div>

      <div className="px-3 mt-5 flex-1">
        <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Kategorier
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
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{categoryLabelsNO[cat.value] ?? cat.label}</span>
                {count > 0 && (
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">{count}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
