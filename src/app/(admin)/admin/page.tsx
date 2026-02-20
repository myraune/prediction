import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BarChart3, CheckCircle, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  let userCount = 0;
  let openMarkets = 0;
  let resolvedMarkets = 0;
  let totalVolumeSum = 0;
  try {
    const [uc, om, rm, tv] = await Promise.all([
      prisma.user.count(),
      prisma.market.count({ where: { status: "OPEN" } }),
      prisma.market.count({ where: { status: "RESOLVED" } }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
    ]);
    userCount = uc;
    openMarkets = om;
    resolvedMarkets = rm;
    totalVolumeSum = tv._sum.totalVolume ?? 0;
  } catch {
    // Database not available
  }

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-500" },
    { label: "Open Markets", value: openMarkets, icon: TrendingUp, color: "text-[var(--color-yes)]" },
    { label: "Resolved Markets", value: resolvedMarkets, icon: CheckCircle, color: "text-purple-500" },
    { label: "Total Volume", value: `${totalVolumeSum.toLocaleString("nb-NO")} pts`, icon: BarChart3, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage markets and users</p>
        </div>
        <Link href="/admin/markets/new">
          <Button>Create Market</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/admin/markets">
          <Button variant="outline">Manage Markets</Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline">Manage Users</Button>
        </Link>
      </div>
    </div>
  );
}
