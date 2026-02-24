"use client";

import { useState, useEffect, useRef } from "react";
import { getLiveMarket } from "@/actions/live";

interface LiveMarketData {
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  status: string;
}

/**
 * Polls a market's live price every `intervalMs` milliseconds.
 * Returns current data + a flash direction when price changes.
 */
export function useLiveMarket(
  marketId: string,
  initial: { yesPrice: number; noPrice: number; totalVolume: number },
  intervalMs: number = 5000
) {
  const [data, setData] = useState<LiveMarketData>({
    yesPrice: initial.yesPrice,
    noPrice: initial.noPrice,
    totalVolume: initial.totalVolume,
    status: "OPEN",
  });
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevYes = useRef(initial.yesPrice);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const result = await getLiveMarket(marketId);
        if (!active || !result) return;
        // Detect price change direction
        if (result.yesPrice > prevYes.current) {
          setFlash("up");
          setTimeout(() => active && setFlash(null), 800);
        } else if (result.yesPrice < prevYes.current) {
          setFlash("down");
          setTimeout(() => active && setFlash(null), 800);
        }
        prevYes.current = result.yesPrice;
        setData(result);
      } catch {
        // Silently fail — will retry next interval
      }
    }

    const id = setInterval(poll, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [marketId, intervalMs]);

  return { ...data, flash };
}
