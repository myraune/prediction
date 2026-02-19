import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPrice } from "@/lib/amm";
import { formatPoints, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let user = { balance: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let positions: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trades: any[] = [];
  try {
    user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { balance: true },
    });

    positions = await prisma.position.findMany({
      where: { userId: session.user.id, shares: { gt: 0 } },
      include: { market: true },
      orderBy: { market: { closesAt: "asc" } },
    });

    trades = await prisma.trade.findMany({
      where: { userId: session.user.id },
      include: { market: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    // Database not available
  }

  // Calculate portfolio value
  let investedValue = 0;
  let unrealizedPnl = 0;
  for (const pos of positions) {
    const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
    const currentPrice = pos.side === "YES" ? price.yes : price.no;
    const currentValue = pos.shares * currentPrice;
    const costBasis = pos.shares * pos.avgPrice;
    investedValue += costBasis;
    unrealizedPnl += currentValue - costBasis;
  }

  const totalValue = user.balance + investedValue + unrealizedPnl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track your positions and performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-mint)]/10 rounded-lg">
                <Wallet className="h-5 w-5 text-[var(--color-mint)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{formatPoints(user.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold">{formatPoints(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${unrealizedPnl >= 0 ? "bg-[var(--color-mint)]/10" : "bg-[var(--color-signal)]/10"}`}>
                {unrealizedPnl >= 0
                  ? <TrendingUp className="h-5 w-5 text-[var(--color-mint)]" />
                  : <TrendingDown className="h-5 w-5 text-[var(--color-signal)]" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P/L</p>
                <p className={`text-2xl font-bold ${unrealizedPnl >= 0 ? "text-[var(--color-mint)]" : "text-[var(--color-signal)]"}`}>
                  {unrealizedPnl >= 0 ? "+" : ""}{formatPoints(unrealizedPnl)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active positions</p>
              <p className="text-sm mt-1">
                <Link href="/markets" className="text-[var(--color-mint)] hover:underline">
                  Browse markets
                </Link>{" "}
                to start trading
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => {
                  const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
                  const currentPrice = pos.side === "YES" ? price.yes : price.no;
                  const pnl = pos.shares * (currentPrice - pos.avgPrice);
                  return (
                    <TableRow key={pos.id}>
                      <TableCell>
                        <Link href={`/markets/${pos.marketId}`} className="hover:underline font-medium">
                          {pos.market.title.length > 50
                            ? pos.market.title.slice(0, 50) + "..."
                            : pos.market.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          pos.side === "YES"
                            ? "bg-[var(--color-mint)]/20 text-[var(--color-mint)]"
                            : "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
                        }>
                          {pos.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{pos.shares.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{pos.avgPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currentPrice.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-medium ${pnl >= 0 ? "text-[var(--color-mint)]" : "text-[var(--color-signal)]"}`}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No trades yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(trade.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/markets/${trade.marketId}`} className="hover:underline">
                        {trade.market.title.length > 40
                          ? trade.market.title.slice(0, 40) + "..."
                          : trade.market.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {trade.direction} {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{trade.amount.toFixed(0)} pts</TableCell>
                    <TableCell className="text-right">{trade.shares.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
