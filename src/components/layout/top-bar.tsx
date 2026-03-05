"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Search,
  User,
  LogOut,
  Shield,
  LogIn,
  Wallet,
  LayoutGrid,
  BarChart3,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { VikingLogo, VikingWordmark } from "@/components/brand/viking-logo";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

const mainNav = [
  { href: "/markets", label: "Markets", icon: LayoutGrid },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

interface TopBarProps {
  balance?: number;
  categoryCounts?: Record<string, number>;
}

export function TopBar({ balance, categoryCounts = {} }: TopBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const activeCategory = searchParams.get("category");
  const activeRegion = searchParams.get("region");
  const currentSort = searchParams.get("sort");
  const currentStatus = searchParams.get("status");
  const currentQ = searchParams.get("q");

  // Show category row on markets page
  const showCategoryRow = pathname === "/markets";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/markets?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  }

  function buildCategoryHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      category: activeCategory ?? undefined,
      status: currentStatus ?? undefined,
      sort: currentSort ?? undefined,
      q: currentQ ?? undefined,
      region: activeRegion ?? undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/markets${qs ? `?${qs}` : ""}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
      {/* ─── Row 1: Logo · Search · Nav · Balance · Avatar ─── */}
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 border-b border-border/50">
        {/* Logo — icon on mobile, wordmark on desktop */}
        <Link href="/" className="shrink-0 flex items-center">
          <VikingLogo size="md" className="sm:hidden" />
          <VikingWordmark height={20} className="hidden sm:block" />
        </Link>

        {/* Search — always visible */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-9 bg-accent/50 border-border/50 focus-visible:ring-1 text-sm rounded-full"
            />
          </div>
        </form>

        {/* Desktop Nav Links — hidden on mobile (bottom nav handles it) */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainNav.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: theme toggle, balance, avatar */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <ThemeToggle className="hidden sm:inline-flex" />

          {session?.user ? (
            <>
              {balance !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 text-sm font-semibold tabular-nums">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  {balance.toLocaleString()}
                  <span className="text-muted-foreground text-xs font-normal">
                    pts
                  </span>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                        {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {session.user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {balance !== undefined && (
                    <div className="px-2 py-1.5 text-sm sm:hidden">
                      <span className="font-medium">
                        {balance.toLocaleString()} pts
                      </span>
                    </div>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              size="sm"
              asChild
              className="gap-1.5 text-sm bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white rounded-full"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Row 2: Category pills — markets page only ─── */}
      {showCategoryRow && (
        <div className="flex items-center gap-1.5 px-4 sm:px-6 h-10 overflow-x-auto scrollbar-none border-b border-border/50">
          <Link
            href={buildCategoryHref({ category: undefined, region: undefined })}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              !activeCategory && !activeRegion
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            All
          </Link>
          <Link
            href={buildCategoryHref({ region: "NO", category: undefined })}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              activeRegion === "NO"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            Norway
          </Link>
          <Link
            href={buildCategoryHref({ region: "INT", category: undefined })}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              activeRegion === "INT"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            International
          </Link>

          <div className="w-px h-4 bg-border/50 mx-0.5 shrink-0" />

          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.value] ?? 0;
            const isActive = activeCategory === cat.value;
            return (
              <Link
                key={cat.value}
                href={buildCategoryHref({
                  category: cat.value,
                  region: undefined,
                })}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {cat.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1 tabular-nums",
                      isActive ? "opacity-70" : "text-muted-foreground/50"
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
