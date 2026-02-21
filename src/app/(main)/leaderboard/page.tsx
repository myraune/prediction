import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatPoints } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      where: { role: "USER" },
      include: {
        positions: {
          where: { shares: { gt: 0 } },
          include: { market: true },
        },
      },
      orderBy: { balance: "desc" },
    });
  } catch {
    // Database not available
  }

  const leaderboard = users
    .map((user) => {
      let positionValue = 0;
      for (const pos of user.positions) {
        const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
        const currentPrice = pos.side === "YES" ? price.yes : price.no;
        positionValue += pos.shares * currentPrice;
      }
      return {
        id: user.id,
        name: user.name,
        balance: user.balance,
        positionValue,
        totalValue: user.balance + positionValue,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Top predictors ranked by portfolio value</p>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const user = leaderboard[idx];
            if (!user) return null;
            const rank = idx + 1;
            return (
              <div
                key={user.id}
                className={cn(
                  "rounded-xl border p-4 bg-card text-center",
                  idx === 0 ? "ring-1 ring-foreground/20 order-2 sm:order-1" : idx === 1 ? "order-1 sm:order-2" : "order-3"
                )}
              >
                <div className="text-2xl font-bold mb-2 text-muted-foreground">
                  #{rank}
                </div>
                <Avatar className="h-10 w-10 mx-auto mb-2">
                  <AvatarFallback className="bg-foreground text-background text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-lg font-bold tabular-nums mt-1">
                  {formatPoints(user.totalValue)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Rankings</h3>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Positions</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((user, i) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className={cn("font-bold tabular-nums", i < 3 ? "text-foreground" : "text-muted-foreground")}>
                      #{i + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-foreground text-background text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPoints(user.balance)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPoints(user.positionValue)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatPoints(user.totalValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
