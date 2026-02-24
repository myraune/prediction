"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

// Category → emoji fallback mapping
const CATEGORY_EMOJI: Record<string, string> = {
  POLITICS: "\ud83c\udfe6",
  SPORTS: "\u26bd",
  CRYPTO: "\u20bf",
  CLIMATE: "\ud83c\udf0d",
  ECONOMICS: "\ud83d\udcc8",
  CULTURE: "\ud83c\udfa8",
  COMPANIES: "\ud83c\udfe2",
  FINANCIALS: "\ud83d\udcb0",
  TECH_SCIENCE: "\ud83e\uddec",
  ENTERTAINMENT: "\ud83c\udfac",
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
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
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

  // Fallback: category emoji in colored circle
  const emoji = CATEGORY_EMOJI[category] ?? "\ud83d\udcca";
  const colorClass = CATEGORY_BG[category] ?? "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-lg shrink-0 flex items-center justify-center",
        sizeClass,
        colorClass,
        className
      )}
    >
      <span className="select-none">{emoji}</span>
    </div>
  );
}
