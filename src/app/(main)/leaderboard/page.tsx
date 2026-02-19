import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatPoints } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

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

  // Calculate total portfolio value for each user
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

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Top predictors ranked by portfolio value</p>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const user = leaderboard[idx];
            if (!user) return null;
            const rank = idx + 1;
            return (
              <Card key={user.id} className={`text-center ${idx === 0 ? "ring-2 ring-yellow-400/50 order-2 sm:order-1" : idx === 1 ? "order-1 sm:order-2" : "order-3"}`}>
                <CardContent className="pt-6 pb-4">
                  <div className={`text-3xl font-bold mb-2 ${rankColors[idx] ?? ""}`}>
                    {rank === 1 ? <Trophy className="h-8 w-8 mx-auto text-yellow-500" /> : `#${rank}`}
                  </div>
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-lg font-bold text-[var(--color-mint)] mt-1">
                    {formatPoints(user.totalValue)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <span className={`font-bold ${i < 3 ? rankColors[i] : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatPoints(user.balance)}</TableCell>
                  <TableCell className="text-right">{formatPoints(user.positionValue)}</TableCell>
                  <TableCell className="text-right font-bold">{formatPoints(user.totalValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
