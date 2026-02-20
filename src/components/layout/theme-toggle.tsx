"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", className)}>
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  const icon =
    theme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : resolvedTheme === "dark" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Moon className="h-4 w-4" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", className)}>
          {icon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn("gap-2", theme === "light" && "font-medium text-foreground")}
        >
          <Sun className="h-4 w-4" />
          Light
          {theme === "light" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn("gap-2", theme === "dark" && "font-medium text-foreground")}
        >
          <Moon className="h-4 w-4" />
          Dark
          {theme === "dark" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn("gap-2", theme === "system" && "font-medium text-foreground")}
        >
          <Monitor className="h-4 w-4" />
          System
          {theme === "system" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact inline toggle for sidebar footer */
export function ThemeToggleInline({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const modes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  const activeValue = theme ?? "system";

  return (
    <div className={cn("flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5", className)}>
      {modes.map((mode) => {
        const isActive = activeValue === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => setTheme(mode.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={mode.label}
          >
            <mode.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
