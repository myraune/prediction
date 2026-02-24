"use client";

import { useEffect, useRef, useState } from "react";

function useAnimatedCounter(target: number, duration: number = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

interface HeroStatsProps {
  totalMarkets: number;
  totalVolume: number;
  totalTraders: number;
}

export function HeroStats({ totalMarkets, totalVolume, totalTraders }: HeroStatsProps) {
  const markets = useAnimatedCounter(totalMarkets);
  const volume = useAnimatedCounter(Math.round(totalVolume / 1000));
  const traders = useAnimatedCounter(totalTraders);

  return (
    <div ref={markets.ref} className="grid grid-cols-3 gap-4 sm:gap-8">
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold font-price text-[var(--color-viking)]">
          {markets.value}
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
          Markets
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold font-price text-[var(--color-viking)]">
          ${volume.value}K
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
          Volume
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold font-price text-[var(--color-viking)]">
          {traders.value}
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
          Traders
        </div>
      </div>
    </div>
  );
}
