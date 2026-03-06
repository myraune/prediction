export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { formatCompactNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VikingLogo, VikingWordmark } from "@/components/brand/viking-logo";
import { FeaturedCard, CompactCard } from "@/components/markets/landing-cards";
import { LiveActivityTicker } from "@/components/markets/live-ticker";
import { TrendingTicker } from "@/components/landing/trending-ticker";
import { CountdownRow } from "@/components/landing/countdown-row";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Search, ArrowUpDown, Trophy } from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import type { Market } from "@/generated/prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  POLITICS: "Politics", SPORTS: "Sports", CRYPTO: "Crypto", CLIMATE: "Climate",
  ECONOMICS: "Economics", CULTURE: "Culture", COMPANIES: "Companies",
  FINANCIALS: "Financials", TECH_SCIENCE: "Tech & Science", ENTERTAINMENT: "Entertainment",
};

export default async function LandingPage() {
  let featured: Market[] = [];
  let trending: Market[] = [];
  let closingSoon: Market[] = [];
  let totalMarkets = 0;
  let totalVolume = 0;
  let totalTraders = 0;
  let categoryCounts: Record<string, number> = {};
  let topTraders: { name: string; totalValue: number }[] = [];
  let waitlistCount = 0;
  let latestPosts: { slug: string; title: string; excerpt: string; category: string; publishedAt: Date | null }[] = [];

  try {
    const [featuredPicks, topByVolume, marketCount, catCounts, volumeAgg, traderCount, topUsers, wlCount, recentPosts] = await Promise.all([
      prisma.market.findMany({
        where: { status: "OPEN", featured: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: { totalVolume: "desc" },
        take: 20,
      }),
      prisma.market.count({ where: { status: "OPEN" } }),
      prisma.market.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: true,
      }),
      prisma.market.aggregate({
        _sum: { totalVolume: true },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.findMany({
        where: { role: "USER" },
        include: {
          positions: {
            where: { shares: { gt: 0 } },
            include: { market: true },
          },
        },
        orderBy: { balance: "desc" },
        take: 5,
      }),
      prisma.waitlistEntry.count(),
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true, excerpt: true, category: true, publishedAt: true },
        take: 3,
      }),
    ]);
    totalMarkets = marketCount;
    waitlistCount = wlCount;
    latestPosts = recentPosts;
    totalVolume = volumeAgg._sum.totalVolume ?? 0;
    totalTraders = traderCount;
    categoryCounts = Object.fromEntries(catCounts.map((c) => [c.category, c._count]));

    featured = featuredPicks.slice(0, 2);
    const featuredIds = new Set(featured.map((m) => m.id));
    const remainingFeatured = featuredPicks.slice(2).filter((m) => !featuredIds.has(m.id));
    const topNonFeatured = topByVolume.filter((m) => !featuredIds.has(m.id) && !remainingFeatured.some((f) => f.id === m.id));
    trending = [...remainingFeatured, ...topNonFeatured].slice(0, 12);

    topTraders = topUsers.map((user) => {
      let positionValue = 0;
      for (const pos of user.positions) {
        const price = getPrice({ poolYes: pos.market.poolYes, poolNo: pos.market.poolNo });
        const currentPrice = pos.side === "YES" ? price.yes : price.no;
        positionValue += pos.shares * currentPrice;
      }
      return { name: user.name, totalValue: user.balance + positionValue };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const allShownIds = [...featured, ...trending].map((m) => m.id);
    const closing = await prisma.market.findMany({
      where: { status: "OPEN", closesAt: { gt: new Date() }, id: { notIn: allShownIds } },
      orderBy: { closesAt: "asc" },
      take: 5,
    });
    closingSoon = closing;
  } catch {
    // Database not available
  }

  const tickerMarkets = [...featured, ...trending].slice(0, 10).map((m) => {
    const p = getPrice({ poolYes: m.poolYes, poolNo: m.poolNo });
    return {
      id: m.id,
      title: m.title,
      yesPrice: Math.round(p.yes * 100),
      change: 0,
    };
  });

  return (
    <div className="min-h-screen bg-background relative">
      {/* ─── Animated dotted surface background ─── */}
      <DottedSurface className="opacity-30" />

      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex items-center justify-between h-14 border-b border-border/50">
          <div className="flex items-center gap-5">
            <Link href="/" className="shrink-0 flex items-center">
              <VikingLogo size="md" className="sm:hidden" />
              <VikingWordmark height={20} className="hidden sm:block" />
            </Link>
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-none">
              <Link href="/markets" className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap">
                Browse
              </Link>
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([cat]) => (
                  <Link
                    key={cat}
                    href={`/markets?category=${cat}`}
                    className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Link>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Leaderboard
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-3">
                Log in
              </Button>
            </Link>
            <Link href="/waitlist">
              <Button size="sm" className="text-xs h-7 px-3 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white rounded-full">
                Join Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Category Bar ─── */}
      <div className="sm:hidden border-b border-border/50 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 px-4 py-1.5">
          <Link href="/markets" className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap shrink-0">
            Browse
          </Link>
          {Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([cat]) => (
              <Link
                key={cat}
                href={`/markets?category=${cat}`}
                className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap shrink-0"
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </Link>
            ))}
          <Link href="/leaderboard" className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap shrink-0">
            Leaderboard
          </Link>
        </div>
      </div>

      {/* ─── Trending Ticker ─── */}
      <TrendingTicker markets={tickerMarkets} />

      {/* ─── Hero ─── */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1]">
              Trade the future.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg">
              Buy and sell shares on real-world events. From Norwegian politics to global crypto
              markets &mdash; predict outcomes and win.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <Link href="/waitlist">
                <Button size="sm" className="h-8 px-4 bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white text-xs font-medium rounded-full">
                  Join Waitlist
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalMarkets} markets &middot; {totalTraders} traders{waitlistCount > 0 && <> &middot; {waitlistCount} on waitlist</>}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Markets + Sidebar ─── */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 pt-6">
          {/* ─── Main Column ─── */}
          <div className="min-w-0">
            {/* Featured Markets */}
            {featured.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Featured</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featured.map((market) => (
                    <FeaturedCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Markets */}
            {trending.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-muted-foreground">Top Markets</h2>
                  <Link
                    href="/markets"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trending.map((market) => (
                    <CompactCard key={market.id} market={market} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ─── Right Sidebar ─── */}
          <aside className="hidden xl:block space-y-4">
            {/* Closing Soon */}
            {closingSoon.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Closing Soon
                </h3>
                <div className="divide-y divide-border/50">
                  {closingSoon.map((m) => (
                    <CountdownRow
                      key={m.id}
                      market={{
                        id: m.id,
                        title: m.title,
                        poolYes: m.poolYes,
                        poolNo: m.poolNo,
                        totalVolume: m.totalVolume,
                        closesAt: m.closesAt.toISOString(),
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Traders */}
            {topTraders.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top Traders
                  </h3>
                  <Link href="/leaderboard" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-0">
                  {topTraders.map((trader, i) => (
                    <div key={trader.name} className="flex items-center gap-2 py-2">
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-4 text-right">
                        #{i + 1}
                      </span>
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-foreground text-background text-[9px] font-semibold">
                          {trader.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium flex-1 truncate">{trader.name}</span>
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                        {formatCompactNumber(trader.totalValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="rounded-xl border border-border/50 bg-card p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Categories
              </h3>
              <div className="space-y-0.5">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <Link
                      key={cat}
                      href={`/markets?category=${cat}`}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                      <span className="text-[11px] tabular-nums opacity-60">{count}</span>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <LiveActivityTicker />
          </aside>
        </div>
      </main>

      {/* ─── How It Works ─── */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold tracking-tight">How it works</h2>
            <p className="text-sm text-muted-foreground mt-1">Three steps to start predicting.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Search, title: "Browse Markets", desc: "Explore prediction markets on Norwegian and global events — politics, sports, economics, and more." },
              { icon: ArrowUpDown, title: "Buy YES or NO", desc: "Think something will happen? Buy YES. Think it won't? Buy NO. Prices reflect the crowd's probability." },
              { icon: Trophy, title: "Earn When Right", desc: "Winning shares pay out $1. The better your prediction, the bigger your return." },
            ].map((step) => (
              <div key={step.title} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-viking)]/10">
                  <step.icon className="h-5 w-5 text-[var(--color-viking)]" />
                </div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Learn more &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Latest from Blog ─── */}
      {latestPosts.length > 0 && (
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Latest from the blog</h2>
                <p className="text-sm text-muted-foreground mt-1">Analysis and insights behind our markets.</p>
              </div>
              <Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl border border-border/50 bg-card p-5 hover:border-[var(--color-viking)]/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      {post.category === "ANALYSIS" ? "Analysis" : post.category === "NEWS" ? "News" : "Guide"}
                    </Badge>
                    {post.publishedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {post.publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug group-hover:text-[var(--color-viking)] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <span className="text-[10px] text-[var(--color-viking)] font-medium mt-3 inline-block">
                    Read more &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bottom CTA ─── */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
          <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-8 text-center space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Ready to predict the future?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Join the waitlist for early access to Viking Market — Norway&apos;s prediction market.
              {waitlistCount > 0 && <> <strong className="text-foreground">{waitlistCount}</strong> people are already waiting.</>}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/waitlist">
                <Button className="bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white rounded-full">
                  Join Waitlist
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline" className="rounded-full">How It Works</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div className="col-span-2 sm:col-span-1">
              <VikingWordmark height={16} />
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
                Norway&apos;s prediction market.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Markets</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/markets" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Browse All</Link>
                <Link href="/markets?category=POLITICS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Politics</Link>
                <Link href="/markets?category=SPORTS" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sports</Link>
                <Link href="/markets?category=CRYPTO" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Crypto</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Platform</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
                <Link href="/portfolio" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
                <Link href="/waitlist" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Join Waitlist</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Learn</h4>
              <nav className="flex flex-col gap-1.5">
                <Link href="/how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>&copy; 2026 Viking Market</span>
            <span>Built in Norway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
