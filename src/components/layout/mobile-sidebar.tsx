"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  TrendingUp,
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
  Menu,
} from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { useState } from "react";

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
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

interface MobileSidebarProps {
  categoryCounts?: Record<string, number>;
}

export function MobileSidebar({ categoryCounts = {} }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        {/* Logo */}
        <div className="flex items-center px-5 h-16 border-b">
          <VikingWordmark height={24} />
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-1 p-3">
          {mainNav.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/50 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 border-b border-border/60" />

        {/* Categories */}
        <div className="p-3 flex-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </p>
          <nav className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = categoryIcons[cat.value] ?? TrendingUp;
              const count = categoryCounts[cat.value] ?? 0;
              const isActive = activeCategory === cat.value && pathname === "/markets";
              return (
                <Link
                  key={cat.value}
                  href={`/markets?category=${cat.value}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{cat.label}</span>
                  <span className="text-xs tabular-nums opacity-60">{count}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </SheetContent>
    </Sheet>
  );
}
