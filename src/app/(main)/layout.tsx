import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let balance: number | undefined;
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
      });
      balance = user?.balance ?? undefined;
    } catch {
      // Database not available
    }
  }

  let categoryCounts: Record<string, number> = {};
  try {
    const counts = await prisma.market.groupBy({
      by: ["category"],
      where: { status: "OPEN" },
      _count: true,
    });
    categoryCounts = Object.fromEntries(counts.map((c) => [c.category, c._count]));
  } catch {
    // Database not available for category counts
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar balance={balance} categoryCounts={categoryCounts} />
      <main className="px-4 sm:px-6 py-4 max-w-[1400px] w-full mx-auto pb-20 lg:pb-4">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
