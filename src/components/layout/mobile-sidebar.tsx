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
  Menu,
  LayoutGrid,
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
  { href: "/markets", label: "Markets", icon: LayoutGrid },
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
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center px-5 h-14 border-b">
          <VikingWordmark height={22} />
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {mainNav.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 border-b" />

        <div className="p-3 flex-1">
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
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
      </SheetContent>
    </Sheet>
  );
}
