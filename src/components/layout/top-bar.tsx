"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, User, LogOut, Shield } from "lucide-react";
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
import { MobileSidebar } from "./mobile-sidebar";
import Link from "next/link";

interface TopBarProps {
  balance?: number;
  categoryCounts?: Record<string, number>;
}

export function TopBar({ balance, categoryCounts }: TopBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/markets?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        {/* Mobile hamburger */}
        <MobileSidebar categoryCounts={categoryCounts} />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Balance pill — exchange style */}
          {balance !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[var(--color-yes)]/10 text-[var(--color-yes)] px-3 py-1.5 rounded text-sm font-bold tabular-nums">
              <span>{balance.toLocaleString("nb-NO")}</span>
              <span className="text-[var(--color-yes)]/60 text-xs font-medium">pts</span>
            </div>
          )}

          <ThemeToggle />

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[var(--color-yes)] text-white text-xs font-bold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-muted-foreground text-xs">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {balance !== undefined && (
                <div className="px-2 py-1.5 text-sm sm:hidden">
                  <span className="font-medium">{balance.toLocaleString("nb-NO")} pts</span>
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
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
