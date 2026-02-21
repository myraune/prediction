"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyShares as calcBuy, sellShares as calcSell, getPrice, estimateSlippage } from "@/lib/amm";
import { buySharesAction, sellSharesAction } from "@/actions/trading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserPosition {
  side: "YES" | "NO";
  shares: number;
  avgPrice: number;
}

interface TradePanelProps {
  marketId: string;
  poolYes: number;
  poolNo: number;
  userBalance: number;
  marketStatus: string;
  userPositions?: UserPosition[];
}

export function TradePanel({ marketId, poolYes, poolNo, userBalance, marketStatus, userPositions = [] }: TradePanelProps) {
  const router = useRouter();
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isDisabled = marketStatus !== "OPEN";
  const price = getPrice({ poolYes, poolNo });
  const yesCents = Math.round(price.yes * 100);
  const noCents = Math.round(price.no * 100);

  const currentPosition = userPositions.find((p) => p.side === side);
  const hasPosition = currentPosition && currentPosition.shares > 0;

  const buyPreview = useMemo(() => {
    if (direction !== "BUY" || amountNum <= 0) return null;
    try {
      const result = calcBuy({ poolYes, poolNo }, side, amountNum);
      const slippage = estimateSlippage({ poolYes, poolNo }, side, amountNum);
      return { ...result, slippage };
    } catch {
      return null;
    }
  }, [direction, amountNum, poolYes, poolNo, side]);

  const sellPreview = useMemo(() => {
    if (direction !== "SELL" || amountNum <= 0) return null;
    try {
      const result = calcSell({ poolYes, poolNo }, side, amountNum);
      const pointsReceived = side === "YES"
        ? poolNo - result.newPoolNo
        : poolYes - result.newPoolYes;
      return { ...result, pointsReceived };
    } catch {
      return null;
    }
  }, [direction, amountNum, poolYes, poolNo, side]);

  async function handleBuy() {
    if (amountNum <= 0 || amountNum > userBalance) return;
    setLoading(true);
    const result = await buySharesAction({ marketId, side, amount: amountNum });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Bought ${result.shares?.toFixed(2)} ${side} shares`);
      setAmount("");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSell() {
    if (amountNum <= 0 || !currentPosition || amountNum > currentPosition.shares) return;
    setLoading(true);
    const result = await sellSharesAction({ marketId, side, shares: amountNum });
    if (result.error) {
      toast.error(result.error);
    } else {
      const received = "pointsReceived" in result ? result.pointsReceived : 0;
      toast.success(`Sold ${amountNum.toFixed(2)} ${side} shares for ${received?.toFixed(2)} pts`);
      setAmount("");
      router.refresh();
    }
    setLoading(false);
  }

  const quickBuyAmounts = [10, 25, 50, 100];
  const quickSellPercents = [25, 50, 75, 100];

  return (
    <div className="rounded-lg border p-3 bg-card">
      {isDisabled ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="font-medium">Market is {marketStatus.toLowerCase()}</p>
          <p className="text-sm mt-1">Trading is no longer available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current price header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trade</span>
            <div className="flex items-center gap-2 text-sm tabular-nums">
              <span className="font-bold text-[var(--color-yes)]">{yesCents}¢</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-bold text-[var(--color-no)]">{noCents}¢</span>
            </div>
          </div>

          {/* BUY / SELL toggle */}
          <div className="flex rounded bg-accent p-0.5">
            <button
              onClick={() => { setDirection("BUY"); setAmount(""); }}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-colors",
                direction === "BUY"
                  ? "bg-[var(--color-yes)]/15 text-[var(--color-yes)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Buy
            </button>
            <button
              onClick={() => { setDirection("SELL"); setAmount(""); }}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-colors",
                direction === "SELL"
                  ? "bg-[var(--color-no)]/15 text-[var(--color-no)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sell
            </button>
          </div>

          {/* YES / NO outcome buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { setSide("YES"); setAmount(""); }}
              className={cn(
                "flex-1 py-3 rounded-lg font-semibold text-sm transition-all",
                side === "YES"
                  ? "bg-[var(--color-yes)] text-white"
                  : "bg-[var(--color-yes)]/8 text-[var(--color-yes)] hover:bg-[var(--color-yes)]/15"
              )}
            >
              Yes {yesCents}¢
            </button>
            <button
              onClick={() => { setSide("NO"); setAmount(""); }}
              className={cn(
                "flex-1 py-3 rounded-lg font-semibold text-sm transition-all",
                side === "NO"
                  ? "bg-[var(--color-no)] text-white"
                  : "bg-[var(--color-no)]/8 text-[var(--color-no)] hover:bg-[var(--color-no)]/15"
              )}
            >
              No {noCents}¢
            </button>
          </div>

          {/* Current position indicator */}
          {hasPosition && (
            <div className="flex items-center justify-between py-2 px-3 bg-accent/50 rounded text-xs">
              <span className="text-muted-foreground">Your {side} position</span>
              <span className="font-medium tabular-nums">{currentPosition.shares.toFixed(2)} shares</span>
            </div>
          )}

          {direction === "BUY" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="buy-amount" className="text-xs text-muted-foreground">Amount (points)</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  max={userBalance}
                  className="text-lg font-semibold mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {userBalance.toLocaleString()} pts
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickBuyAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={() => setAmount(String(Math.min(qa, userBalance)))}
                    disabled={qa > userBalance}
                  >
                    ${qa}
                  </Button>
                ))}
              </div>

              {buyPreview && amountNum > 0 && (
                <div className="bg-accent rounded p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-medium tabular-nums">{buyPreview.shares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg price</span>
                    <span className="font-medium tabular-nums">{Math.round(buyPreview.effectivePrice * 100)}¢</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className={cn(
                      "font-medium tabular-nums",
                      buyPreview.slippage > 0.05 ? "text-[var(--color-no)]" : "text-muted-foreground"
                    )}>
                      {(buyPreview.slippage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5">
                    <span className="text-muted-foreground">Payout if {side}</span>
                    <span className="font-medium tabular-nums">
                      {buyPreview.shares.toFixed(2)} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max profit</span>
                    <span className="font-semibold text-[var(--color-yes)] tabular-nums">
                      +{(buyPreview.shares - amountNum).toFixed(2)} pts
                    </span>
                  </div>
                </div>
              )}

              <Button
                className={cn(
                  "w-full h-11 font-semibold",
                  side === "YES"
                    ? "bg-[var(--color-yes)] text-white hover:bg-[var(--color-yes)]/90"
                    : "bg-[var(--color-no)] text-white hover:bg-[var(--color-no)]/90"
                )}
                onClick={handleBuy}
                disabled={loading || amountNum <= 0 || amountNum > userBalance}
              >
                {loading ? "Buying..." : `Buy ${side} ${side === "YES" ? yesCents : noCents}¢`}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasPosition ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm font-medium">No {side} shares to sell</p>
                  <p className="text-xs mt-1">Buy some shares first</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="sell-shares" className="text-xs text-muted-foreground">Shares to sell</Label>
                    <Input
                      id="sell-shares"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={0}
                      max={currentPosition.shares}
                      step="0.01"
                      className="text-lg font-semibold mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {currentPosition.shares.toFixed(2)} shares
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {quickSellPercents.map((pct) => {
                      const shareAmount = (pct / 100) * currentPosition.shares;
                      return (
                        <Button
                          key={pct}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-3"
                          onClick={() => setAmount(shareAmount.toFixed(2))}
                        >
                          {pct}%
                        </Button>
                      );
                    })}
                  </div>

                  {sellPreview && amountNum > 0 && (
                    <div className="bg-accent rounded p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Selling</span>
                        <span className="font-medium tabular-nums">{amountNum.toFixed(2)} shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg sell price</span>
                        <span className="font-medium tabular-nums">{Math.round(sellPreview.effectivePrice * 100)}¢</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="text-muted-foreground">You receive</span>
                        <span className="font-semibold text-[var(--color-yes)]">
                          {sellPreview.pointsReceived.toFixed(2)} pts
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 font-semibold",
                      side === "YES"
                        ? "border-[var(--color-yes)] text-[var(--color-yes)] hover:bg-[var(--color-yes)]/10"
                        : "border-[var(--color-no)] text-[var(--color-no)] hover:bg-[var(--color-no)]/10"
                    )}
                    onClick={handleSell}
                    disabled={loading || amountNum <= 0 || !currentPosition || amountNum > currentPosition.shares}
                  >
                    {loading ? "Selling..." : `Sell ${side}`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
