import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

// Server component that fetches TopBar data — wrapped in Suspense
async function TopBarWithData() {
  const session = await auth();

  // Fetch balance and category counts in parallel
  const [balance, categoryCounts] = await Promise.all([
    (async () => {
      if (!session?.user?.id) return undefined;
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { balance: true },
        });
        return user?.balance ?? undefined;
      } catch {
        return undefined;
      }
    })(),
    (async () => {
      try {
        const counts = await prisma.market.groupBy({
          by: ["category"],
          where: { status: "OPEN" },
          _count: true,
        });
        return Object.fromEntries(counts.map((c) => [c.category, c._count]));
      } catch {
        return {} as Record<string, number>;
      }
    })(),
  ]);

  return <TopBar balance={balance} categoryCounts={categoryCounts} />;
}

// Lightweight shell that renders instantly
function TopBarFallback() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 border-b border-border/50">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="flex-1 max-w-md h-9 skeleton rounded-full" />
        <div className="hidden lg:flex items-center gap-2">
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-5 w-20 skeleton rounded" />
        </div>
        <div className="ml-auto h-9 w-9 skeleton rounded-full" />
      </div>
    </header>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<TopBarFallback />}>
        <TopBarWithData />
      </Suspense>
      <main className="px-4 sm:px-6 py-4 max-w-[1400px] w-full mx-auto pb-24 lg:pb-4">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
