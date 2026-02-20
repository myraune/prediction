"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, User, LogOut, Shield, LogIn, Wallet } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <MobileSidebar categoryCounts={categoryCounts} />

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-9 bg-muted border-0 focus-visible:ring-1 text-sm"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              {balance !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-semibold tabular-nums">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  {balance.toLocaleString()}
                  <span className="text-muted-foreground text-xs font-normal">pts</span>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
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
                    <p className="text-muted-foreground text-xs">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {balance !== undefined && (
                    <div className="px-2 py-1.5 text-sm sm:hidden">
                      <span className="font-medium">{balance.toLocaleString()} pts</span>
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
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-sm">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
