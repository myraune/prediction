"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  // Find position for current side
  const currentPosition = userPositions.find((p) => p.side === side);
  const hasPosition = currentPosition && currentPosition.shares > 0;

  // Buy preview
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

  // Sell preview
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
    <Card>
      <CardContent className="pt-6">
        {isDisabled ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="font-medium">Market is {marketStatus.toLowerCase()}</p>
            <p className="text-sm">Trading is no longer available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* BUY / SELL toggle */}
            <div className="flex rounded-lg bg-secondary p-0.5">
              <button
                onClick={() => { setDirection("BUY"); setAmount(""); }}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-md transition-colors",
                  direction === "BUY"
                    ? "bg-background text-foreground"
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
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sell
              </button>
            </div>

            {/* YES / NO tabs */}
            <Tabs value={side} onValueChange={(v) => { setSide(v as "YES" | "NO"); setAmount(""); }}>
              <TabsList className="w-full">
                <TabsTrigger
                  value="YES"
                  className="flex-1 data-[state=active]:bg-[var(--color-mint)]/15 data-[state=active]:text-[var(--color-mint)]"
                >
                  YES {(price.yes * 100).toFixed(0)}%
                </TabsTrigger>
                <TabsTrigger
                  value="NO"
                  className="flex-1 data-[state=active]:bg-[var(--color-signal)]/15 data-[state=active]:text-[var(--color-signal)]"
                >
                  NO {(price.no * 100).toFixed(0)}%
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Current position indicator */}
            {hasPosition && (
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md text-xs">
                <span className="text-muted-foreground">Your {side} position</span>
                <span className="font-medium">{currentPosition.shares.toFixed(2)} shares</span>
              </div>
            )}

            {direction === "BUY" ? (
              /* ─── BUY MODE ─── */
              <div className="space-y-4">
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
                    Balance: {userBalance.toLocaleString("nb-NO")} pts
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickBuyAmounts.map((qa) => (
                    <Button
                      key={qa}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => setAmount(String(Math.min(qa, userBalance)))}
                      disabled={qa > userBalance}
                    >
                      {qa}
                    </Button>
                  ))}
                </div>

                {buyPreview && amountNum > 0 && (
                  <div className="bg-muted rounded-md p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shares</span>
                      <span className="font-medium">{buyPreview.shares.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg price</span>
                      <span className="font-medium">{buyPreview.effectivePrice.toFixed(3)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage</span>
                      <span className={cn(
                        "font-medium",
                        buyPreview.slippage > 0.05 ? "text-[var(--color-signal)]" : "text-muted-foreground"
                      )}>
                        {(buyPreview.slippage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5">
                      <span className="text-muted-foreground">Potential payout</span>
                      <span className="font-semibold text-[var(--color-mint)]">
                        {buyPreview.shares.toFixed(2)} pts
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className={cn(
                    "w-full h-11 font-semibold",
                    side === "YES"
                      ? "bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[var(--color-mint)]/90"
                      : "bg-[var(--color-signal)] text-white hover:bg-[var(--color-signal)]/90"
                  )}
                  onClick={handleBuy}
                  disabled={loading || amountNum <= 0 || amountNum > userBalance}
                >
                  {loading ? "Buying..." : `Buy ${side}`}
                </Button>
              </div>
            ) : (
              /* ─── SELL MODE ─── */
              <div className="space-y-4">
                {!hasPosition ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm font-medium">No {side} shares to sell</p>
                    <p className="text-xs mt-1">Buy some shares first to sell them later</p>
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

                    {/* Quick-fill percentages */}
                    <div className="flex flex-wrap gap-2">
                      {quickSellPercents.map((pct) => {
                        const shareAmount = (pct / 100) * currentPosition.shares;
                        return (
                          <Button
                            key={pct}
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            onClick={() => setAmount(shareAmount.toFixed(2))}
                          >
                            {pct}%
                          </Button>
                        );
                      })}
                    </div>

                    {sellPreview && amountNum > 0 && (
                      <div className="bg-muted rounded-md p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selling</span>
                          <span className="font-medium">{amountNum.toFixed(2)} shares</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg sell price</span>
                          <span className="font-medium">{sellPreview.effectivePrice.toFixed(3)} pts</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5">
                          <span className="text-muted-foreground">You receive</span>
                          <span className="font-semibold text-[var(--color-mint)]">
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
                          ? "border-[var(--color-mint)] text-[var(--color-mint)] hover:bg-[var(--color-mint)]/10"
                          : "border-[var(--color-signal)] text-[var(--color-signal)] hover:bg-[var(--color-signal)]/10"
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
      </CardContent>
    </Card>
  );
}
