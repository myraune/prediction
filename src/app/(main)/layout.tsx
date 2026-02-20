import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

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
    <div className="flex min-h-screen bg-background">
      <Sidebar categoryCounts={categoryCounts} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar balance={balance} categoryCounts={categoryCounts} />
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
