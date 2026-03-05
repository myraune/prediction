"use client";

import Image from "next/image";
import {
  Landmark,
  Trophy,
  Bitcoin,
  ThermometerSun,
  TrendingUp,
  Palette,
  Building2,
  BarChart3,
  Cpu,
  Tv,
  BarChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category → icon mapping
const CATEGORY_ICON: Record<string, LucideIcon> = {
  POLITICS: Landmark,
  SPORTS: Trophy,
  CRYPTO: Bitcoin,
  CLIMATE: ThermometerSun,
  ECONOMICS: TrendingUp,
  CULTURE: Palette,
  COMPANIES: Building2,
  FINANCIALS: BarChart3,
  TECH_SCIENCE: Cpu,
  ENTERTAINMENT: Tv,
};

// Category → background color for fallback circles
const CATEGORY_BG: Record<string, string> = {
  POLITICS: "bg-blue-500/15 text-blue-400",
  SPORTS: "bg-emerald-500/15 text-emerald-400",
  CRYPTO: "bg-amber-500/15 text-amber-400",
  CLIMATE: "bg-teal-500/15 text-teal-400",
  ECONOMICS: "bg-violet-500/15 text-violet-400",
  CULTURE: "bg-pink-500/15 text-pink-400",
  COMPANIES: "bg-slate-500/15 text-slate-400",
  FINANCIALS: "bg-yellow-500/15 text-yellow-400",
  TECH_SCIENCE: "bg-cyan-500/15 text-cyan-400",
  ENTERTAINMENT: "bg-rose-500/15 text-rose-400",
};

interface MarketThumbnailProps {
  imageUrl?: string | null;
  category: string;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const ICON_SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const PX_MAP = { sm: 24, md: 36, lg: 44 };

export function MarketThumbnail({
  imageUrl,
  category,
  title,
  size = "md",
  className,
}: MarketThumbnailProps) {
  const sizeClass = SIZE_MAP[size];
  const px = PX_MAP[size];

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden bg-muted shrink-0",
          sizeClass,
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={title}
          width={px}
          height={px}
          className="object-cover h-full w-full"
          sizes={`${px}px`}
          unoptimized={!imageUrl.includes("unsplash")}
        />
      </div>
    );
  }

  // Fallback: category icon in colored circle
  const Icon = CATEGORY_ICON[category] ?? BarChart;
  const colorClass = CATEGORY_BG[category] ?? "bg-muted text-muted-foreground";
  const iconSize = ICON_SIZE_MAP[size];

  return (
    <div
      className={cn(
        "rounded-lg shrink-0 flex items-center justify-center",
        sizeClass,
        colorClass,
        className
      )}
    >
      <Icon className={iconSize} />
    </div>
  );
}
