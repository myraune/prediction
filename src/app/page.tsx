export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  UserPlus,
  Search,
  Award,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  POLITICS: <Landmark className="h-8 w-8" />,
  SPORTS: <Trophy className="h-8 w-8" />,
  CRYPTO: <Bitcoin className="h-8 w-8" />,
  CLIMATE: <ThermometerSun className="h-8 w-8" />,
  ECONOMICS: <TrendingUpIcon className="h-8 w-8" />,
  CULTURE: <Palette className="h-8 w-8" />,
  COMPANIES: <Building2 className="h-8 w-8" />,
  FINANCIALS: <BarChart3 className="h-8 w-8" />,
  TECH_SCIENCE: <Cpu className="h-8 w-8" />,
  ENTERTAINMENT: <Tv className="h-8 w-8" />,
};

export default async function LandingPage() {
  let featuredMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let countMap: Record<string, number> = {};

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
  } catch {
    // Database not available — render page with empty data
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--color-ink)] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-10 w-10 text-[var(--color-mint)]" />
            <span className="text-3xl font-semibold">Norsk Predikt</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl leading-tight">
            Predict Norway&apos;s{" "}
            <span className="text-[var(--color-mint)]">Future</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-2xl">
            Trade on Norwegian politics, sports, crypto, climate, and more with virtual NOK points.
            No real money &mdash; just your knowledge and instincts.
          </p>
          <div className="mt-8 flex gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[var(--color-mint)]/90 font-semibold">
                Start Predicting
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      {featuredMarkets.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Trending Markets</h2>
              <p className="text-muted-foreground mt-1">The most popular predictions right now</p>
            </div>
            <Link href="/markets">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-card border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.value} href={`/markets?category=${cat.value}`}>
                <Card className="h-full hover:bg-accent/30 transition-colors cursor-pointer text-center">
                  <CardContent className="pt-6 pb-4 flex flex-col items-center gap-3">
                    <div className="text-muted-foreground">
                      {categoryIcons[cat.value]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {countMap[cat.value] ?? 0} markets
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-semibold tracking-tight mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <UserPlus className="h-10 w-10 text-[var(--color-mint)]" />,
              title: "1. Sign Up",
              desc: "Create a free account and receive 1,000 NOK points to start with.",
            },
            {
              icon: <Search className="h-10 w-10 text-[var(--color-mint)]" />,
              title: "2. Find Markets",
              desc: "Browse prediction markets across politics, sports, crypto, climate, and more.",
            },
            {
              icon: <Award className="h-10 w-10 text-[var(--color-mint)]" />,
              title: "3. Earn Points",
              desc: "Buy YES or NO shares. Earn points when your predictions come true.",
            },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-5 w-5 text-[var(--color-mint)]" />
              <span className="font-semibold">Norsk Predikt</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Virtual prediction market. No real money involved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
