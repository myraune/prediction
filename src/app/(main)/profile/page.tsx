import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPoints, formatDate } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        </div>
        <div className="rounded-xl border p-6 bg-card text-center">
          <p className="text-muted-foreground">Sign in to view your profile</p>
          <Link href="/login" className="text-sm text-foreground hover:underline mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  let user;
  try {
    user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      include: {
        _count: { select: { trades: true, positions: true } },
      },
    });
  } catch {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        </div>
        <div className="rounded-xl border p-6 bg-card text-center">
          <p className="text-muted-foreground">Unable to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      </div>

      <div className="rounded-xl border p-6 bg-card">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-foreground text-background text-xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Balance", value: formatPoints(user.balance) },
          { label: "Total Trades", value: String(user._count.trades) },
          { label: "Positions", value: String(user._count.positions) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4 bg-card text-center">
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
