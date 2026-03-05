"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2, Play, Zap } from "lucide-react";

interface TradeResult {
  botName: string;
  marketTitle: string;
  side: string;
  amount: number;
  shares: number;
  effectivePrice: number;
}

export function BotControls() {
  const [loading, setLoading] = useState(false);
  const [tradeCount, setTradeCount] = useState(15);
  const [results, setResults] = useState<TradeResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBots() {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/admin/bot-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: tradeCount }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to run bots");
      } else {
        setResults(data.trades);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Run Bots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="tradeCount">Number of trades</Label>
            <Input
              id="tradeCount"
              type="number"
              min={1}
              max={50}
              value={tradeCount}
              onChange={(e) => setTradeCount(parseInt(e.target.value) || 15)}
              className="w-32"
            />
          </div>
          <Button onClick={runBots} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run {tradeCount} trades
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Bots use a mean-reversion strategy, buying underpriced sides to provide natural counterparty activity.
          Trades are placed through the existing AMM and show up in market trade history.
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">
              {results.length} trades placed successfully
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {results.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{t.botName}</span>
                    <span className={t.side === "YES" ? "text-green-600" : "text-red-600"}>
                      {t.side}
                    </span>
                  </div>
                  <span className="font-mono text-xs">{t.amount} pts @ {t.effectivePrice}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
