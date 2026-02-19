import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrice } from "@/lib/amm";
import { formatDate, formatPoints } from "@/lib/format";
import { CategoryBadge } from "@/components/markets/category-badge";
import { ProbabilityBar } from "@/components/markets/probability-bar";
import { TradePanel } from "@/components/trading/trade-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      _count: { select: { trades: true } },
      trades: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!market) notFound();

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
      })
    : null;

  const userPositions = session?.user?.id
    ? await prisma.position.findMany({
        where: { userId: session.user.id, marketId: id },
      })
    : [];

  const price = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
  const yesPercent = price.yes * 100;

  const statusColor =
    market.status === "OPEN"
      ? "bg-green-500/10 text-green-700"
      : market.status === "RESOLVED"
      ? "bg-blue-500/10 text-blue-700"
      : "bg-gray-500/10 text-gray-700";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={market.category} />
            <Badge variant="outline" className={statusColor}>
              {market.status}
            </Badge>
            {market.resolution && (
              <Badge className={
                market.resolution === "YES"
                  ? "bg-[var(--color-mint)] text-[var(--color-ink)]"
                  : "bg-[var(--color-signal)] text-white"
              }>
                Resolved: {market.resolution}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{market.title}</h1>
          <p className="text-muted-foreground mt-2">{market.description}</p>
        </div>

        {/* Probability */}
        <Card>
          <CardContent className="pt-6">
            <ProbabilityBar yesPercent={yesPercent} size="lg" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--color-mint)]">{yesPercent.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">YES probability</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatPoints(market.totalVolume)}</p>
                <p className="text-xs text-muted-foreground">Total volume</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{market._count.trades}</p>
                <p className="text-xs text-muted-foreground">Total trades</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatDate(market.closesAt)}</p>
                <p className="text-xs text-muted-foreground">Closes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User positions */}
        {userPositions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPositions.map((pos) => {
                  const currentPrice = pos.side === "YES" ? price.yes : price.no;
                  const pnl = pos.shares * (currentPrice - pos.avgPrice);
                  return (
                    <div key={pos.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <Badge className={
                          pos.side === "YES"
                            ? "bg-[var(--color-mint)]/20 text-[var(--color-mint)]"
                            : "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
                        }>
                          {pos.side}
                        </Badge>
                        <span className="ml-2 text-sm font-medium">
                          {pos.shares.toFixed(2)} shares
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Avg: {pos.avgPrice.toFixed(2)} pts
                        </p>
                        <p className={`text-xs ${pnl >= 0 ? "text-[var(--color-mint)]" : "text-[var(--color-signal)]"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} pts
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent trades */}
        {market.trades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {market.trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.user.name}</span>
                      <span className="text-muted-foreground">{trade.direction.toLowerCase()}</span>
                      <Badge variant="outline" className={
                        trade.side === "YES"
                          ? "bg-[var(--color-mint)]/10 text-[var(--color-mint)]"
                          : "bg-[var(--color-signal)]/10 text-[var(--color-signal)]"
                      }>
                        {trade.side}
                      </Badge>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <span>{trade.shares.toFixed(2)} shares @ {trade.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar - Trade panel */}
      <div>
        <TradePanel
          marketId={market.id}
          poolYes={market.poolYes}
          poolNo={market.poolNo}
          userBalance={user?.balance ?? 0}
          marketStatus={market.status}
        />
      </div>
    </div>
  );
}
