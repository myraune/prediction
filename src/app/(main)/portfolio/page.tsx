import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatPoints, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function PortfolioPage() {
  const session = await auth();

  let user = { balance: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let positions: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trades: any[] = [];

  if (session?.user?.id) {
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
  }

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
        <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your positions and performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Available Balance", value: formatPoints(user.balance) },
          { label: "Total Portfolio Value", value: formatPoints(totalValue) },
          {
            label: "Unrealized P/L",
            value: `${unrealizedPnl >= 0 ? "+" : ""}${formatPoints(unrealizedPnl)}`,
            color: unrealizedPnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4 bg-card">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-1 tabular-nums", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Positions */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Active Positions</h3>
        </div>
        <div className="p-4">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active positions</p>
              <p className="text-sm mt-1">
                <Link href="/markets" className="text-foreground hover:underline">
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
                            ? "bg-[var(--color-yes)]/15 text-[var(--color-yes)]"
                            : "bg-[var(--color-no)]/15 text-[var(--color-no)]"
                        }>
                          {pos.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{pos.shares.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{Math.round(pos.avgPrice * 100)}¢</TableCell>
                      <TableCell className="text-right tabular-nums">{Math.round(currentPrice * 100)}¢</TableCell>
                      <TableCell className={cn("text-right font-medium tabular-nums", pnl >= 0 ? "text-[var(--color-yes)]" : "text-[var(--color-no)]")}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Recent Trades</h3>
        </div>
        <div className="p-4">
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
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
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
                    <TableCell className="text-right tabular-nums">{trade.amount.toFixed(0)} pts</TableCell>
                    <TableCell className="text-right tabular-nums">{trade.shares.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
