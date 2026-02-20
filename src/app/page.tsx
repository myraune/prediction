export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MarketCard } from "@/components/markets/market-card";
import { formatCompactNumber } from "@/lib/format";
import { ArrowRight } from "lucide-react";
import { VikingWordmark } from "@/components/brand/viking-logo";

export default async function LandingPage() {
  let topMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTrades = 0;

  try {
    const [top, volAgg, tradeCount, marketCount] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 8,
      }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
      prisma.trade.count(),
      prisma.market.count({ where: { status: "OPEN" } }),
    ]);
    topMarkets = top;
    totalVolume = volAgg._sum.totalVolume ?? 0;
    totalTrades = tradeCount;
    totalMarkets = marketCount;
  } catch {
    // Database not available
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/">
            <VikingWordmark height={22} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm font-medium">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Trade on what
            <br />
            happens next.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
            Buy and sell shares on future events. Prices 1¢–99¢ reflect real-time probability. Start with 1,000 free points.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register">
              <Button size="lg" className="font-medium gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline" className="font-medium">
                Browse Markets
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-10 text-sm">
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalMarkets}</p>
              <p className="text-muted-foreground">Markets</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatCompactNumber(totalVolume)}</p>
              <p className="text-muted-foreground">Volume</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalTrades.toLocaleString()}</p>
              <p className="text-muted-foreground">Trades</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Markets */}
      {topMarkets.length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Top Markets</h2>
              <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-xl border divide-y overflow-hidden bg-card">
              {topMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
          <h2 className="text-lg font-semibold mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Pick an event", desc: "Browse markets on politics, sports, crypto, climate, and more." },
              { step: "02", title: "Buy shares", desc: "Buy YES at 72¢ if you think it will happen. Buy NO at 28¢ if you disagree." },
              { step: "03", title: "Win or trade", desc: "Correct shares pay 100 pts. Or sell anytime as prices change." },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-xs font-mono text-muted-foreground">{item.step}</span>
                <h3 className="text-sm font-semibold mt-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="text-muted-foreground mt-2">1,000 free points. No credit card.</p>
          <div className="mt-6">
            <Link href="/register">
              <Button size="lg" className="font-medium gap-2">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2025 Viking Market</span>
          <span>Virtual prediction market &middot; No real money</span>
        </div>
      </footer>
    </div>
  );
}
