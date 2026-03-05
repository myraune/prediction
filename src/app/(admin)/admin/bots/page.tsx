import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, Zap, DollarSign } from "lucide-react";
import { BotControls } from "./bot-controls";

export default async function AdminBotsPage() {
  const [bots, recentBotTrades, openMarkets] = await Promise.all([
    prisma.user.findMany({
      where: { role: "BOT" },
      select: { id: true, name: true, balance: true, _count: { select: { trades: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.trade.findMany({
      where: { user: { role: "BOT" } },
      select: {
        id: true,
        side: true,
        amount: true,
        shares: true,
        price: true,
        createdAt: true,
        user: { select: { name: true } },
        market: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.market.count({ where: { status: "OPEN", closesAt: { gt: new Date() } } }),
  ]);

  const totalBotTrades = bots.reduce((sum, b) => sum + b._count.trades, 0);
  const totalBotBalance = bots.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Bot Trading
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage automated house traders that provide market activity
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Bots</p>
                <p className="text-2xl font-bold">{bots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bot Trades</p>
                <p className="text-2xl font-bold">{totalBotTrades.toLocaleString("nb-NO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Combined Balance</p>
                <p className="text-2xl font-bold">{Math.round(totalBotBalance).toLocaleString("nb-NO")} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Open Markets</p>
                <p className="text-2xl font-bold">{openMarkets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <BotControls />

      {/* Bot list */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {bots.map((bot) => (
              <div key={bot.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{bot.name}</p>
                    <p className="text-sm text-muted-foreground">{bot._count.trades} trades</p>
                  </div>
                </div>
                <p className="text-sm font-mono">{Math.round(bot.balance).toLocaleString("nb-NO")} pts</p>
              </div>
            ))}
            {bots.length === 0 && (
              <p className="text-muted-foreground py-4 text-center">
                No bot users found. Run the database seed to create them.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bot Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentBotTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{trade.user.name}</span>
                  <span className="text-muted-foreground"> bought </span>
                  <span className={trade.side === "YES" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {trade.side}
                  </span>
                  <span className="text-muted-foreground"> on </span>
                  <span className="truncate">{trade.market.title.slice(0, 45)}...</span>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="font-mono">{Math.round(trade.amount)} pts</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(trade.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {recentBotTrades.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No bot trades yet. Run the bots to generate activity.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
