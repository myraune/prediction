"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VikingLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

const iconPixelMap = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

export function VikingLogo({ className, size = "md" }: VikingLogoProps) {
  const px = iconPixelMap[size];
  return (
    <Image
      src="/icon-1.svg"
      alt="Viking Market"
      width={px}
      height={px}
      className={cn(sizeMap[size], "rounded-sm", className)}
      priority
      unoptimized
    />
  );
}

export function VikingWordmark({
  className,
  height = 28,
}: {
  className?: string;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const width = Math.round(height * (613 / 86));
  const src = mounted && resolvedTheme === "dark" ? "/logo-light.svg" : "/logo-dark.svg";

  return (
    <Image
      src={src}
      alt="Viking Market"
      width={width}
      height={height}
      className={className}
      priority
      unoptimized
    />
  );
}

export function VikingBrand({
  className,
  size = "md",
  showText = true,
  useWordmark = false,
}: VikingLogoProps & { showText?: boolean; useWordmark?: boolean }) {
  if (useWordmark) {
    return (
      <div className={cn("flex items-center", className)}>
        <VikingWordmark height={size === "lg" ? 36 : size === "xl" ? 44 : 28} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VikingLogo size={size} />
      {showText && (
        <span className="font-semibold tracking-tight lowercase">
          viking market
        </span>
      )}
    </div>
  );
}
