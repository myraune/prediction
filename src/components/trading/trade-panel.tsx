"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buyShares as calcBuy, sellShares as calcSell, getPrice, estimateSlippage } from "@/lib/amm";
import { buySharesAction, sellSharesAction } from "@/actions/trading";
import { createLimitOrder } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TRADING_FEE_RATE } from "@/lib/constants";

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
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
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
      const fee = Math.round(amountNum * TRADING_FEE_RATE * 100) / 100;
      const netAmount = amountNum - fee;
      const result = calcBuy({ poolYes, poolNo }, side, netAmount);
      const slippage = estimateSlippage({ poolYes, poolNo }, side, netAmount);
      return { ...result, slippage, fee, netAmount };
    } catch {
      return null;
    }
  }, [direction, amountNum, poolYes, poolNo, side]);

  const sellPreview = useMemo(() => {
    if (direction !== "SELL" || amountNum <= 0) return null;
    try {
      const result = calcSell({ poolYes, poolNo }, side, amountNum);
      const grossReceived = side === "YES"
        ? poolNo - result.newPoolNo
        : poolYes - result.newPoolYes;
      const fee = Math.round(grossReceived * TRADING_FEE_RATE * 100) / 100;
      const netReceived = grossReceived - fee;
      return { ...result, pointsReceived: netReceived, grossReceived, fee };
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

  async function handleLimitOrder() {
    const limitPriceNum = parseFloat(limitPrice) / 100;
    if (amountNum <= 0 || limitPriceNum <= 0 || limitPriceNum >= 1) return;
    setLoading(true);
    const result = await createLimitOrder({
      marketId,
      side,
      targetPrice: limitPriceNum,
      amount: amountNum,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Limit order placed: ${side} @ ${limitPrice}¢`);
      setAmount("");
      setLimitPrice("");
      router.refresh();
    }
    setLoading(false);
  }

  const quickBuyAmounts = [10, 25, 50, 100];
  const quickSellPercents = [25, 50, 75, 100];

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {isDisabled ? (
        <div className="text-center py-10 px-4 text-muted-foreground">
          <p className="font-medium">Market is {marketStatus.toLowerCase()}</p>
          <p className="text-xs mt-1">Trading is no longer available</p>
        </div>
      ) : (
        <>
          {/* ─── YES / NO — Kalshi prominent buttons ─── */}
          <div className="grid grid-cols-2" role="radiogroup" aria-label="Select outcome">
            <button
              role="radio"
              aria-checked={side === "YES"}
              onClick={() => { setSide("YES"); setDirection("BUY"); setAmount(""); }}
              className={cn(
                "py-4 text-center transition-all relative min-h-[64px]",
                side === "YES"
                  ? "bg-[var(--color-yes)]/8"
                  : "bg-card hover:bg-muted/40"
              )}
            >
              <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-0.5">Yes</div>
              <div className={cn(
                "text-2xl font-bold font-price",
                side === "YES" ? "text-[var(--color-yes)]" : "text-foreground"
              )}>
                {yesCents}¢
              </div>
              {side === "YES" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-yes)]" />
              )}
            </button>
            <button
              role="radio"
              aria-checked={side === "NO"}
              onClick={() => { setSide("NO"); setDirection("BUY"); setAmount(""); }}
              className={cn(
                "py-4 text-center transition-all relative min-h-[64px]",
                side === "NO"
                  ? "bg-[var(--color-no)]/8"
                  : "bg-card hover:bg-muted/40"
              )}
            >
              <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-0.5">No</div>
              <div className={cn(
                "text-2xl font-bold font-price",
                side === "NO" ? "text-[var(--color-no)]" : "text-foreground"
              )}>
                {noCents}¢
              </div>
              {side === "NO" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-no)]" />
              )}
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Order type: Market / Limit */}
            <div className="flex rounded-lg bg-muted/50 p-0.5" role="tablist" aria-label="Order type">
              <button
                role="tab"
                aria-selected={orderType === "MARKET"}
                onClick={() => { setOrderType("MARKET"); setAmount(""); setLimitPrice(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-medium rounded-md transition-all min-h-[36px]",
                  orderType === "MARKET"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Market
              </button>
              <button
                role="tab"
                aria-selected={orderType === "LIMIT"}
                onClick={() => { setOrderType("LIMIT"); setDirection("BUY"); setAmount(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-medium rounded-md transition-all min-h-[36px]",
                  orderType === "LIMIT"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Limit
              </button>
            </div>

            {orderType === "LIMIT" ? (
              /* ── LIMIT ORDER ── */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="limit-price" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Price (¢)</label>
                    <Input
                      id="limit-price"
                      type="number"
                      inputMode="numeric"
                      placeholder={String(side === "YES" ? yesCents : noCents)}
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      min={1}
                      max={99}
                      className="text-base font-semibold mt-1 h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor="limit-amount" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Amount</label>
                    <Input
                      id="limit-amount"
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={1}
                      max={500}
                      className="text-base font-semibold mt-1 h-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{userBalance.toLocaleString()} pts available</span>
                  {amountNum > 0 && parseFloat(limitPrice) > 0 && (
                    <span className="font-price">~{((amountNum * (1 - TRADING_FEE_RATE)) / (parseFloat(limitPrice) / 100)).toFixed(1)} shares</span>
                  )}
                </div>

                {amountNum > 0 && parseFloat(limitPrice) > 0 && (
                  <div className="text-xs space-y-1.5 pt-1 border-t">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fee (2%)</span>
                      <span className="font-price">{(amountNum * TRADING_FEE_RATE).toFixed(2)} pts</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Payout if {side}</span>
                      <span className="font-price text-[var(--color-yes)]">
                        {((amountNum * (1 - TRADING_FEE_RATE)) / (parseFloat(limitPrice) / 100)).toFixed(2)} pts
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className={cn(
                    "w-full h-11 font-semibold text-sm rounded-lg",
                    side === "YES"
                      ? "bg-[var(--color-yes)] text-white hover:bg-[var(--color-yes)]/90"
                      : "bg-[var(--color-no)] text-white hover:bg-[var(--color-no)]/90"
                  )}
                  onClick={handleLimitOrder}
                  disabled={loading || amountNum <= 0 || !parseFloat(limitPrice) || parseFloat(limitPrice) < 1 || parseFloat(limitPrice) > 99}
                >
                  {loading ? "Placing..." : `Place ${side} limit @ ${limitPrice || "?"}¢`}
                </Button>
              </div>
            ) : (
              /* ── MARKET ORDER ── */
              <>
                {/* Buy / Sell toggle */}
                <div className="flex rounded-lg bg-muted/50 p-0.5" role="tablist" aria-label="Trade direction">
                  <button
                    role="tab"
                    aria-selected={direction === "BUY"}
                    onClick={() => { setDirection("BUY"); setAmount(""); }}
                    className={cn(
                      "flex-1 py-2 text-xs font-semibold rounded-md transition-all min-h-[36px]",
                      direction === "BUY"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Buy
                  </button>
                  <button
                    role="tab"
                    aria-selected={direction === "SELL"}
                    onClick={() => { setDirection("SELL"); setAmount(""); }}
                    className={cn(
                      "flex-1 py-2 text-xs font-semibold rounded-md transition-all min-h-[36px]",
                      direction === "SELL"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Sell
                  </button>
                </div>

                {/* Position indicator */}
                {hasPosition && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Your {side} position</span>
                    <span className="font-semibold font-price text-foreground">{currentPosition.shares.toFixed(2)} shares</span>
                  </div>
                )}

                {direction === "BUY" ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="buy-amount" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Amount (points)</label>
                      <Input
                        id="buy-amount"
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={1}
                        max={userBalance}
                        className="text-lg font-semibold mt-1 h-10"
                      />
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {userBalance.toLocaleString()} pts available
                      </div>
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-1.5">
                      {quickBuyAmounts.map((qa) => (
                        <button
                          key={qa}
                          aria-label={`Set amount to ${qa} points`}
                          className="flex-1 py-2 text-xs font-medium rounded-md border hover:bg-muted/60 transition-colors disabled:opacity-30 min-h-[36px]"
                          onClick={() => setAmount(String(Math.min(qa, userBalance)))}
                          disabled={qa > userBalance}
                        >
                          ${qa}
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    {buyPreview && amountNum > 0 && (
                      <div className="text-xs space-y-1.5 pt-2 border-t">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shares</span>
                          <span className="font-price font-medium text-foreground">{buyPreview.shares.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Avg price</span>
                          <span className="font-price">{Math.round(buyPreview.effectivePrice * 100)}¢</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Fee (2%)</span>
                          <span className="font-price">{buyPreview.fee.toFixed(2)}</span>
                        </div>
                        {buyPreview.slippage > 0.01 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Slippage</span>
                            <span className={cn("font-price", buyPreview.slippage > 0.05 ? "text-[var(--color-no)]" : "")}>
                              {(buyPreview.slippage * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1.5 border-t font-medium">
                          <span>Payout if {side}</span>
                          <span className="font-price text-[var(--color-yes)]">
                            {buyPreview.shares.toFixed(2)} pts
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      className={cn(
                        "w-full h-11 font-semibold text-sm rounded-lg",
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
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm font-medium">No {side} shares to sell</p>
                        <p className="text-xs mt-1">Buy some shares first</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="sell-shares" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Shares to sell</label>
                          <Input
                            id="sell-shares"
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={0}
                            max={currentPosition.shares}
                            step="0.01"
                            className="text-lg font-semibold mt-1 h-10"
                          />
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {currentPosition.shares.toFixed(2)} shares available
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          {quickSellPercents.map((pct) => {
                            const shareAmount = (pct / 100) * currentPosition.shares;
                            return (
                              <button
                                key={pct}
                                aria-label={`Sell ${pct}% of shares`}
                                className="flex-1 py-2 text-xs font-medium rounded-md border hover:bg-muted/60 transition-colors min-h-[36px]"
                                onClick={() => setAmount(shareAmount.toFixed(2))}
                              >
                                {pct}%
                              </button>
                            );
                          })}
                        </div>

                        {sellPreview && amountNum > 0 && (
                          <div className="text-xs space-y-1.5 pt-2 border-t">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Avg sell price</span>
                              <span className="font-price">{Math.round(sellPreview.effectivePrice * 100)}¢</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Fee (2%)</span>
                              <span className="font-price">{sellPreview.fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t font-medium">
                              <span>You receive</span>
                              <span className="font-price text-[var(--color-yes)]">
                                {sellPreview.pointsReceived.toFixed(2)} pts
                              </span>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 font-semibold text-sm rounded-lg",
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
