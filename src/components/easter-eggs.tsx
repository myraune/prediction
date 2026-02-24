"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const VIKING_QUOTES = [
  "Til Valhall! \u2694\ufe0f",
  "Sk\u00e5l, warrior! \ud83c\udf7a",
  "The raven flies north...",
  "Fear not death, for the hour of your doom is set and none may escape it.",
  "Where wolf ears are, wolf teeth are near.",
  "Better to fight and fall than to live without hope.",
  "The brave man well shall fight and win, though dull his blade may be.",
];

// ─── Viking Longship SVG ──────────────────────────────
function Longship() {
  return (
    <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hull */}
      <path d="M10 40 Q15 50 50 50 Q85 50 90 40 L85 42 Q50 55 15 42 Z" fill="var(--viking)" opacity="0.9" />
      {/* Hull stripe */}
      <path d="M18 42 Q50 52 82 42" stroke="var(--viking)" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Keel extension */}
      <path d="M5 38 Q8 42 15 42" stroke="var(--viking)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M95 38 Q92 42 85 42" stroke="var(--viking)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Dragon head (bow) */}
      <path d="M95 38 Q98 34 96 28 Q94 24 92 26 Q94 30 93 35" stroke="var(--viking)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="28" r="1" fill="var(--viking)" />
      {/* Tail (stern) */}
      <path d="M5 38 Q2 32 6 26 Q8 34 6 36" stroke="var(--viking)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Mast */}
      <line x1="50" y1="40" x2="50" y2="8" stroke="var(--viking)" strokeWidth="2" />
      {/* Sail */}
      <path d="M50 10 Q65 18 50 35 Z" fill="var(--viking)" opacity="0.3" />
      <path d="M50 10 Q35 18 50 35 Z" fill="var(--viking)" opacity="0.15" />
      {/* Sail stripes */}
      <line x1="50" y1="16" x2="42" y2="22" stroke="var(--viking)" strokeWidth="0.5" opacity="0.4" />
      <line x1="50" y1="22" x2="44" y2="28" stroke="var(--viking)" strokeWidth="0.5" opacity="0.4" />
      {/* Shields along hull */}
      {[25, 35, 45, 55, 65, 75].map((x) => (
        <circle key={x} cx={x} cy="41" r="3" fill="var(--viking)" opacity="0.6" stroke="var(--viking)" strokeWidth="0.5" />
      ))}
      {/* Oars */}
      {[30, 40, 50, 60, 70].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1="44"
          x2={x + (i % 2 === 0 ? 4 : -4)}
          y2="54"
          stroke="var(--viking)"
          strokeWidth="0.8"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

// ─── Floating Rune ──────────────────────────────
function FloatingRune({ x, y, rune }: { x: number; y: number; rune: string }) {
  return (
    <div
      className="rune-flash fixed pointer-events-none z-[9999] text-[var(--color-viking)] font-bold text-2xl select-none"
      style={{ left: x - 12, top: y - 24 }}
    >
      {rune}
    </div>
  );
}

// ─── Main Easter Eggs Provider ──────────────────────────────
export function EasterEggs() {
  const [showShip, setShowShip] = useState(false);
  const [runes, setRunes] = useState<{ id: number; x: number; y: number; rune: string }[]>([]);
  const konamiIndex = useRef(0);
  const runeCounter = useRef(0);

  // Konami code listener
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === KONAMI[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI.length) {
          konamiIndex.current = 0;
          triggerLongship();
        }
      } else {
        konamiIndex.current = e.key === KONAMI[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Click rune sparkle — on rapid double-click anywhere
  useEffect(() => {
    function handleDblClick(e: MouseEvent) {
      const RUNE_SET = ["\u16a0", "\u16a2", "\u16a6", "\u16b1", "\u16b7", "\u16c1", "\u16c7", "\u16de", "\u16df"];
      const rune = RUNE_SET[Math.floor(Math.random() * RUNE_SET.length)];
      const id = ++runeCounter.current;
      setRunes((prev) => [...prev, { id, x: e.clientX, y: e.clientY, rune }]);
      setTimeout(() => {
        setRunes((prev) => prev.filter((r) => r.id !== id));
      }, 1200);
    }
    window.addEventListener("dblclick", handleDblClick);
    return () => window.removeEventListener("dblclick", handleDblClick);
  }, []);

  const triggerLongship = useCallback(() => {
    setShowShip(true);
    toast("SK\u00c5L! \u2694\ufe0f", {
      description: "The Vikings have arrived!",
      duration: 4000,
    });
    setTimeout(() => setShowShip(false), 4500);
  }, []);

  return (
    <>
      {/* Viking longship animation */}
      {showShip && (
        <div className="fixed bottom-8 left-0 z-[9998] pointer-events-none longship-sail">
          <Longship />
        </div>
      )}

      {/* Floating runes on double-click */}
      {runes.map((r) => (
        <FloatingRune key={r.id} x={r.x} y={r.y} rune={r.rune} />
      ))}
    </>
  );
}

// ─── Logo Easter Egg Hook — use in VikingWordmark ──────────────────
export function useLogoEasterEgg() {
  const clickTimes = useRef<number[]>([]);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    clickTimes.current.push(now);
    // Keep only clicks from last 2 seconds
    clickTimes.current = clickTimes.current.filter((t) => now - t < 2000);

    if (clickTimes.current.length >= 7) {
      clickTimes.current = [];
      const quote = VIKING_QUOTES[Math.floor(Math.random() * VIKING_QUOTES.length)];
      toast(quote, { duration: 3000 });
    }
  }, []);

  return handleLogoClick;
}
