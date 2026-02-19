"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buyShares as calcBuy } from "@/lib/amm";
import { buySharesAction } from "@/actions/trading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TradePanelProps {
  marketId: string;
  poolYes: number;
  poolNo: number;
  userBalance: number;
  marketStatus: string;
}

export function TradePanel({ marketId, poolYes, poolNo, userBalance, marketStatus }: TradePanelProps) {
  const router = useRouter();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isDisabled = marketStatus !== "OPEN";

  const preview = useMemo(() => {
    if (amountNum <= 0) return null;
    try {
      return calcBuy({ poolYes, poolNo }, side, amountNum);
    } catch {
      return null;
    }
  }, [amountNum, poolYes, poolNo, side]);

  async function handleTrade() {
    if (amountNum <= 0 || amountNum > userBalance) return;
    setLoading(true);

    const result = await buySharesAction({ marketId, side, amount: amountNum });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Bought ${result.shares?.toFixed(2)} ${side} shares at ${result.price?.toFixed(2)} pts each`);
      setAmount("");
      router.refresh();
    }
    setLoading(false);
  }

  const quickAmounts = [10, 25, 50, 100, 250];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trade</CardTitle>
      </CardHeader>
      <CardContent>
        {isDisabled ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="font-medium">Market is {marketStatus.toLowerCase()}</p>
            <p className="text-sm">Trading is no longer available</p>
          </div>
        ) : (
          <Tabs value={side} onValueChange={(v) => setSide(v as "YES" | "NO")}>
            <TabsList className="w-full">
              <TabsTrigger value="YES" className="flex-1 data-[state=active]:bg-[var(--color-mint)] data-[state=active]:text-[var(--color-ink)]">
                Buy YES
              </TabsTrigger>
              <TabsTrigger value="NO" className="flex-1 data-[state=active]:bg-[var(--color-signal)] data-[state=active]:text-white">
                Buy NO
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="amount">Amount (points)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  max={userBalance}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {userBalance.toLocaleString("nb-NO")} pts
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(Math.min(qa, userBalance)))}
                    disabled={qa > userBalance}
                  >
                    {qa}
                  </Button>
                ))}
              </div>

              {preview && amountNum > 0 && (
                <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-medium">{preview.shares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg price</span>
                    <span className="font-medium">{preview.effectivePrice.toFixed(2)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential payout</span>
                    <span className="font-medium text-[var(--color-mint)]">
                      {preview.shares.toFixed(2)} pts
                    </span>
                  </div>
                </div>
              )}

              <Button
                className={`w-full ${
                  side === "YES"
                    ? "bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[var(--color-mint)]/90"
                    : "bg-[var(--color-signal)] text-white hover:bg-[var(--color-signal)]/90"
                }`}
                onClick={handleTrade}
                disabled={loading || amountNum <= 0 || amountNum > userBalance}
              >
                {loading ? "Trading..." : `Buy ${side} for ${amountNum || 0} pts`}
              </Button>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
