export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/markets/market-card";
import { CATEGORIES } from "@/lib/constants";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { getTimeRemaining, isClosingSoon } from "@/lib/time";
import {
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
  Users,
  Activity,
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VikingWordmark } from "@/components/brand/viking-logo";

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
  let topMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let recentMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let closingMarkets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
  let countMap: Record<string, number> = {};
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTrades = 0;
  let totalUsers = 0;

  try {
    const [featured, top, recent, closing, categoryCounts, volAgg, tradeCount, userCount] = await Promise.all([
      prisma.market.findMany({
        where: { featured: true, status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 6,
      }),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 10,
      }),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { closesAt: "asc" },
        take: 4,
      }),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: true,
      }),
      prisma.market.aggregate({ _sum: { totalVolume: true } }),
      prisma.trade.count(),
      prisma.user.count({ where: { role: "USER" } }),
    ]);

    featuredMarkets = featured;
    topMarkets = top;
    recentMarkets = recent;
    closingMarkets = closing;
    countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count]));
    totalMarkets = categoryCounts.reduce((sum, c) => sum + c._count, 0);
    totalVolume = volAgg._sum.totalVolume ?? 0;
    totalTrades = tradeCount;
    totalUsers = userCount;
  } catch {
    // Database not available — render page with empty data
  }

  return (
    <div className="min-h-screen">
      {/* Live ticker bar — Polymarket style */}
      <div className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-yes)] animate-pulse" />
              <span className="font-medium">{totalMarkets} Live Markets</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-background/60">
              <Activity className="h-3 w-3" />
              <span>{formatCompactNumber(totalVolume)} total volume</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-background/60 hidden md:inline">{totalTrades.toLocaleString()} trades executed</span>
            <Link href="/register" className="font-semibold hover:underline">
              Start Trading →
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="mb-4">
                <VikingWordmark height={36} />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                Trade on what happens{" "}
                <span className="text-[var(--color-brand)]">next</span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-lg">
                Buy and sell shares on future events. Each share pays 100 pts if correct, 0 if wrong. Prices from 1¢ to 99¢ reflect real-time probability.
              </p>

              {/* Key stats — Kalshi style */}
              <div className="flex items-center gap-5 mt-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[var(--color-brand)]/10 rounded">
                    <Activity className="h-4 w-4 text-[var(--color-brand)]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums leading-none">{totalMarkets || "50+"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Markets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[var(--color-yes)]/10 rounded">
                    <Users className="h-4 w-4 text-[var(--color-yes)]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums leading-none">{totalUsers || "100+"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Traders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded">
                    <BarChart3 className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums leading-none">{formatCompactNumber(totalVolume)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex gap-3 flex-wrap">
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

            {/* Right side — Top markets table (Polymarket style) */}
            {topMarkets.length > 0 && (
              <div className="bg-background rounded-lg border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Flame className="h-4 w-4 text-[var(--color-brand)]" />
                    Top Markets
                  </div>
                  <Link href="/markets" className="text-xs text-[var(--color-brand)] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="divide-y divide-border/60">
                  {topMarkets.slice(0, 6).map((market) => {
                    const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
                    const yesCents = Math.round(p.yes * 100);
                    return (
                      <Link key={market.id} href={`/markets/${market.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        {market.imageUrl ? (
                          <div className="relative h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
                            <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="32px" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{market.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formatCompactNumber(market.totalVolume)} Vol.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold tabular-nums text-[var(--color-yes)]">{yesCents}¢</span>
                          <span className="text-[10px] text-muted-foreground">YES</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works — Kalshi style three-step */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Zap className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "Pick an Event",
                desc: "Browse markets on politics, sports, crypto, climate and more. Each has a YES/NO outcome.",
              },
              {
                step: "02",
                icon: <Shield className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "Buy Shares",
                desc: "Buy YES at 72¢ if you think it's likely. Buy NO at 28¢ if you disagree. Prices reflect crowd odds.",
              },
              {
                step: "03",
                icon: <ChartLine className="h-5 w-5 text-[var(--color-brand)]" />,
                title: "Win or Trade",
                desc: "Correct shares pay 100 pts each. Or sell anytime as prices change. Start with 1,000 free pts.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 font-mono">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Trending Markets — full card grid */}
      {featuredMarkets.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[var(--color-brand)]" />
              <h2 className="text-lg font-semibold tracking-tight">Trending Markets</h2>
            </div>
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

      {/* New + Closing Soon — side by side sections */}
      {(recentMarkets.length > 0 || closingMarkets.length > 0) && (
        <section className="bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New Markets */}
              {recentMarkets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-[var(--color-yes)]" />
                    <h3 className="text-sm font-semibold">New Markets</h3>
                    <Link href="/markets?sort=new" className="ml-auto text-xs text-[var(--color-brand)] hover:underline">
                      See all →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {recentMarkets.map((market) => {
                      const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
                      const yesCents = Math.round(p.yes * 100);
                      return (
                        <Link key={market.id} href={`/markets/${market.id}`}>
                          <Card className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 flex items-center gap-3">
                              {market.imageUrl ? (
                                <div className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
                                  <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{market.title}</p>
                                <p className="text-[10px] text-muted-foreground">{formatCompactNumber(market.totalVolume)} Vol. · {getTimeRemaining(market.closesAt)}</p>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <span className="text-xs font-bold tabular-nums text-[var(--color-yes)] bg-[var(--color-yes)]/10 px-2 py-1 rounded">
                                  {yesCents}¢
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Closing Soon */}
              {closingMarkets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-[var(--color-no)]" />
                    <h3 className="text-sm font-semibold">Closing Soon</h3>
                    <Link href="/markets?sort=ending" className="ml-auto text-xs text-[var(--color-brand)] hover:underline">
                      See all →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {closingMarkets.map((market) => {
                      const p = getPrice({ poolYes: market.poolYes, poolNo: market.poolNo });
                      const yesCents = Math.round(p.yes * 100);
                      const closing = isClosingSoon(market.closesAt);
                      return (
                        <Link key={market.id} href={`/markets/${market.id}`}>
                          <Card className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 flex items-center gap-3">
                              {market.imageUrl ? (
                                <div className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
                                  <Image src={market.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{market.title}</p>
                                <p className={cn("text-[10px]", closing ? "text-[var(--color-no)] font-medium" : "text-muted-foreground")}>
                                  Closes in {getTimeRemaining(market.closesAt)}
                                </p>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <span className="text-xs font-bold tabular-nums text-[var(--color-yes)] bg-[var(--color-yes)]/10 px-2 py-1 rounded">
                                  {yesCents}¢
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories — compact horizontal pills with counts */}
      <section className="bg-card border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-lg font-semibold tracking-tight mb-5 text-center">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const count = countMap[cat.value] ?? 0;
              return (
                <Link
                  key={cat.value}
                  href={`/markets?category=${cat.value}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-accent/50 transition-colors text-sm font-medium"
                >
                  <span className="text-muted-foreground">{categoryIcons[cat.value]}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-background rounded-full px-1.5 py-0.5 tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[var(--color-brand)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Ready to start predicting?</h2>
          <p className="text-white/70 mt-2 text-sm">1,000 free points. No credit card required.</p>
          <div className="mt-5 flex gap-3 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-white text-[var(--color-brand)] hover:bg-white/90 font-semibold gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                Explore Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="mb-2">
                <VikingWordmark height={20} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Virtual prediction market platform. Trade on the outcome of real-world events with zero financial risk.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Markets</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Markets</Link>
                <Link href="/markets?sort=trending" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Trending</Link>
                <Link href="/markets?sort=new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">New Markets</Link>
                <Link href="/markets?sort=ending" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Closing Soon</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
                <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 mt-6 pt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2025 viking market</span>
            <span>Virtual prediction market · No real money</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
