"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  RotateCcw,
  CheckCircle2,
  Coins,
} from "lucide-react";

type Step = "intro" | "pick-side" | "choose-amount" | "confirm" | "result";

const MARKET = {
  title: "Will Norway win a gold medal at the 2026 World Cup?",
  yesPrice: 0.35,
  noPrice: 0.65,
};

export function TradingSimulator() {
  const [step, setStep] = useState<Step>("intro");
  const [side, setSide] = useState<"YES" | "NO" | null>(null);
  const [amount, setAmount] = useState(50);
  const [, setResolved] = useState(false);

  const shares = side
    ? Math.round(amount / (side === "YES" ? MARKET.yesPrice : MARKET.noPrice) * 100) / 100
    : 0;
  const price = side === "YES" ? MARKET.yesPrice : MARKET.noPrice;
  const outcome: "YES" | "NO" = "YES"; // The "event happens" in our demo
  const isWinner = side === outcome;
  const payout = isWinner ? Math.round(shares * 100) / 100 : 0;
  const profit = payout - amount;

  const reset = useCallback(() => {
    setStep("intro");
    setSide(null);
    setAmount(50);
    setResolved(false);
  }, []);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-yes)] animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Interactive Demo
          </span>
        </div>
        {step !== "intro" && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Start over
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Market question */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sample Market</p>
          <p className="font-semibold text-sm leading-snug">{MARKET.title}</p>
          <div className="flex gap-3 text-xs">
            <span className="text-[var(--color-yes)] font-medium">
              YES {Math.round(MARKET.yesPrice * 100)}%
            </span>
            <span className="text-[var(--color-no)] font-medium">
              NO {Math.round(MARKET.noPrice * 100)}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {(["intro", "pick-side", "choose-amount", "confirm", "result"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                (["intro", "pick-side", "choose-amount", "confirm", "result"] as Step[]).indexOf(step) >= i
                  ? "bg-[var(--color-viking)]"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm leading-relaxed">
                Try placing a practice trade! This interactive demo walks you through exactly how
                prediction market trading works.
              </p>
              <p className="text-xs text-muted-foreground">
                Your balance: <span className="font-medium text-foreground">1,000 points</span> (play money)
              </p>
            </div>
            <Button
              onClick={() => setStep("pick-side")}
              className="w-full bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white"
            >
              Start Trading
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === "pick-side" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Step 1:</strong> Do you think this will happen?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSide("YES");
                  setStep("choose-amount");
                }}
                className="group rounded-lg border-2 border-transparent hover:border-[var(--color-yes)] bg-[var(--color-yes)]/10 p-4 text-left transition-all hover:bg-[var(--color-yes)]/20"
              >
                <TrendingUp className="h-5 w-5 text-[var(--color-yes)] mb-2" />
                <p className="font-semibold text-sm text-[var(--color-yes)]">Buy YES</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Price: {Math.round(MARKET.yesPrice * 100)}¢ per share
                </p>
                <p className="text-xs text-muted-foreground">
                  &ldquo;I think this will happen&rdquo;
                </p>
              </button>
              <button
                onClick={() => {
                  setSide("NO");
                  setStep("choose-amount");
                }}
                className="group rounded-lg border-2 border-transparent hover:border-[var(--color-no)] bg-[var(--color-no)]/10 p-4 text-left transition-all hover:bg-[var(--color-no)]/20"
              >
                <TrendingDown className="h-5 w-5 text-[var(--color-no)] mb-2" />
                <p className="font-semibold text-sm text-[var(--color-no)]">Buy NO</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Price: {Math.round(MARKET.noPrice * 100)}¢ per share
                </p>
                <p className="text-xs text-muted-foreground">
                  &ldquo;I think this won&apos;t happen&rdquo;
                </p>
              </button>
            </div>
          </div>
        )}

        {step === "choose-amount" && side && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Step 2:</strong> How much do you want to invest?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                    amount === a
                      ? "border-[var(--color-viking)] bg-[var(--color-viking)]/10 text-[var(--color-viking)]"
                      : "hover:border-foreground/20"
                  }`}
                >
                  {a} pts
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side</span>
                <span className={`font-medium ${side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}`}>
                  {side}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per share</span>
                <span>{Math.round(price * 100)}¢</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You&apos;ll get</span>
                <span className="font-medium">{shares.toFixed(1)} shares</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t mt-1">
                <span>If you win</span>
                <span className="text-[var(--color-yes)]">+{(shares - amount).toFixed(0)} pts profit</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("pick-side")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="flex-1 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white"
              >
                Review Trade
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && side && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Step 3:</strong> Confirm your trade
            </p>
            <div className="rounded-lg border-2 border-dashed border-[var(--color-viking)]/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[var(--color-viking)]" />
                <span className="font-medium text-sm">Trade Summary</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buying</span>
                  <span className={`font-semibold ${side === "YES" ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}`}>
                    {shares.toFixed(1)} {side} shares
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium">{amount} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max payout</span>
                  <span className="text-[var(--color-yes)] font-medium">{shares.toFixed(0)} pts</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("choose-amount")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => {
                  setResolved(true);
                  setStep("result");
                }}
                className={`flex-1 text-white ${
                  side === "YES"
                    ? "bg-[var(--color-yes)] hover:bg-[var(--color-yes)]/90"
                    : "bg-[var(--color-no)] hover:bg-[var(--color-no)]/90"
                }`}
              >
                Place Trade
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "result" && side && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-viking)]/10 mb-1">
                <Trophy className={`h-6 w-6 ${isWinner ? "text-[var(--color-yes)]" : "text-[var(--color-no)]"}`} />
              </div>
              <p className="font-semibold">
                The event resolved: <span className="text-[var(--color-yes)]">YES</span>
              </p>
              <p className="text-sm text-muted-foreground">Norway won a gold medal!</p>
            </div>

            <div className={`rounded-lg p-4 space-y-2 ${isWinner ? "bg-[var(--color-yes)]/10" : "bg-[var(--color-no)]/10"}`}>
              {isWinner ? (
                <>
                  <p className="text-sm font-medium text-[var(--color-yes)]">You won!</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your {shares.toFixed(1)} shares paid out</span>
                      <span className="font-medium">{payout.toFixed(0)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You spent</span>
                      <span>{amount} pts</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-medium">Profit</span>
                      <span className="font-bold text-[var(--color-yes)]">+{profit.toFixed(0)} pts</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--color-no)]">You lost this one</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your NO shares are worth</span>
                      <span className="font-medium">0 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You spent</span>
                      <span>{amount} pts</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-medium">Loss</span>
                      <span className="font-bold text-[var(--color-no)]">-{amount} pts</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    That&apos;s prediction markets — you win some, you learn from others. The key is having an edge over time.
                  </p>
                </>
              )}
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Key takeaway:</strong> You bought {side} at{" "}
                {Math.round(price * 100)}¢ per share. Each winning share pays $1.{" "}
                {isWinner
                  ? `Since you were right, you made ${Math.round((1 / price - 1) * 100)}% return on your trade.`
                  : "Since the market resolved the other way, your shares became worthless. Better luck next time!"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button asChild className="flex-1 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white">
                <Link href="/markets">Browse Real Markets</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
