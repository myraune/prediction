export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MarketCard } from "@/components/markets/market-card";
import { CATEGORIES } from "@/lib/constants";
import {
  TrendingUp,
  Landmark,
  Trophy,
  Bitcoin,
  ThermometerSun,
  TrendingUpIcon,
  Palette,
  Building2,
  BarChart3,
  Cpu,
  Tv,
  ArrowRight,
  Zap,
  Shield,
  ChartLine,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  POLITICS: <Landmark className="h-5 w-5" />,
  SPORTS: <Trophy className="h-5 w-5" />,
  CRYPTO: <Bitcoin className="h-5 w-5" />,
  CLIMATE: <ThermometerSun className="h-5 w-5" />,
  ECONOMICS: <TrendingUpIcon className="h-5 w-5" />,
  CULTURE: <Palette className="h-5 w-5" />,
  COMPANIES: <Building2 className="h-5 w-5" />,
  FINANCIALS: <BarChart3 className="h-5 w-5" />,
  TECH_SCIENCE: <Cpu className="h-5 w-5" />,
  ENTERTAINMENT: <Tv className="h-5 w-5" />,
};

export default async function LandingPage() {
  let featuredMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let countMap: Record<string, number> = {};
  let totalMarkets = 0;

  try {
    featuredMarkets = await prisma.market.findMany({
      where: { featured: true, status: "OPEN" },
      orderBy: { totalVolume: "desc" },
      take: 6,
    });

    const categoryCounts = await prisma.market.groupBy({
      by: ["category"],
      where: { status: "OPEN" },
      _count: true,
    });

    countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count]));
    totalMarkets = categoryCounts.reduce((sum, c) => sum + c._count, 0);
  } catch {
    // Database not available — render page with empty data
  }

  return (
    <div className="min-h-screen">
      {/* Hero — Kalshi-style clean white */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="flex items-center gap-2.5 mb-5">
            <TrendingUp className="h-8 w-8 text-[var(--color-brand)]" />
            <span className="text-2xl font-bold tracking-tight">Norsk Predikt</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1]">
            Trade on what happens{" "}
            <span className="text-[var(--color-brand)]">next</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-xl">
            Buy and sell on the outcome of Norwegian events. Politics, sports, crypto, climate — all priced 0–99¢.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalMarkets || "50+"}</p>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Live Markets</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums">1,000</p>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Starting Pts</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-brand)]">Free</p>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">To Play</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90 font-semibold gap-2">
                Start Trading
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline" className="gap-2">
                Browse Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value props — single row, compact */}
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: <Zap className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "Instant Trading",
                desc: "Buy YES or NO from 1¢ to 99¢",
              },
              {
                icon: <Shield className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "No Real Money",
                desc: "Trade with virtual points, zero risk",
              },
              {
                icon: <ChartLine className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "Real-Time Prices",
                desc: "Automated market maker pricing",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 justify-center">
                {item.icon}
                <div className="text-left">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      {featuredMarkets.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Trending Markets</h2>
            <Link href="/markets" className="text-sm text-[var(--color-brand)] hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}

      {/* Categories — compact horizontal pills */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-lg font-semibold tracking-tight mb-5 text-center">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/markets?category=${cat.value}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-accent/50 transition-colors text-sm font-medium"
              >
                <span className="text-muted-foreground">{categoryIcons[cat.value]}</span>
                <span>{cat.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {countMap[cat.value] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-[var(--color-brand)]" />
              <span className="text-sm font-semibold">Norsk Predikt</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Virtual prediction market · No real money
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
