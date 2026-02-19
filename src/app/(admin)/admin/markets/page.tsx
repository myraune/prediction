import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CategoryBadge } from "@/components/markets/category-badge";

export default async function AdminMarketsPage() {
  const markets = await prisma.market.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { trades: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Markets</h1>
        <Link href="/admin/markets/new">
          <Button>Create Market</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {market.title}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={market.category} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{market.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {market.totalVolume.toLocaleString("nb-NO")}
                  </TableCell>
                  <TableCell className="text-right">{market._count.trades}</TableCell>
                  <TableCell>{formatDate(market.closesAt)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/markets/${market.id}`}>
                      <Button variant="ghost" size="sm">
                        {market.status === "OPEN" ? "Edit / Resolve" : "View"}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
