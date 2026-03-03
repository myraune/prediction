import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how prediction markets work on Viking Market. Browse markets, buy YES or NO shares, and earn points when you're right.",
  openGraph: {
    title: "How It Works — Viking Market",
    description:
      "Learn how prediction markets work on Viking Market. Browse markets, buy YES or NO shares, and earn points when you're right.",
  },
};

const steps = [
  {
    icon: Search,
    title: "1. Browse Markets",
    description:
      "Explore prediction markets on Norwegian and global events — politics, sports, economics, tech, and more. Each market poses a yes-or-no question about a future outcome.",
  },
  {
    icon: ArrowUpDown,
    title: "2. Buy YES or NO",
    description:
      "Think something will happen? Buy YES shares. Think it won't? Buy NO shares. Prices range from 1¢ to 99¢ and reflect the crowd's probability estimate.",
  },
  {
    icon: Trophy,
    title: "3. Earn When You're Right",
    description:
      "When the event resolves, winning shares pay out at $1 each. If you bought YES at 40¢ and the event happens, you earn 60¢ per share. The better your prediction, the bigger your return.",
  },
];

const faqs = [
  {
    q: "What is a prediction market?",
    a: "A prediction market is a platform where people trade shares on the outcomes of real-world events. Prices reflect the crowd's estimated probability — if YES shares trade at 70¢, the market thinks there's roughly a 70% chance the event will happen.",
  },
  {
    q: "How are prices set?",
    a: "Viking Market uses a Logarithmic Market Scoring Rule (LMSR) — an automated market maker. This means there's always liquidity and you can trade instantly. Prices adjust automatically as people buy and sell.",
  },
  {
    q: "Is this real money?",
    a: "Right now, Viking Market uses play money. Everyone starts with 1,000 points. We're working toward a licensed real-money platform — join the waitlist to be first in line.",
  },
  {
    q: "How are markets resolved?",
    a: "Each market has clear resolution criteria. When the event's outcome is known, an admin resolves the market based on publicly verifiable information. Winning shares pay out $1, losing shares pay out $0.",
  },
  {
    q: "Can I sell my shares before a market resolves?",
    a: "Yes. You can sell your shares at any time at the current market price. You don't have to wait for the final result — take profits early or cut your losses.",
  },
  {
    q: "Who creates the markets?",
    a: "Markets are created by the Viking Market team based on newsworthy events and community interest. We focus on Norwegian and Nordic topics, plus globally relevant events.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">How It Works</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Prediction markets turn opinions into probabilities. Here&apos;s how
          to get started on Viking Market in three simple steps.
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-viking)]/10">
              <step.icon className="h-5 w-5 text-[var(--color-viking)]" />
            </div>
            <h2 className="font-semibold text-sm">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Example */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Example Trade</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            Say there&apos;s a market: <strong className="text-foreground">&ldquo;Will Norway win a gold medal at the 2026 Winter Olympics?&rdquo;</strong>
          </p>
          <p>
            YES shares are trading at <strong className="text-foreground text-[var(--color-yes)]">62¢</strong> — the crowd thinks there&apos;s about a 62% chance.
          </p>
          <p>
            You think Norway will definitely win gold, so you buy <strong className="text-foreground">100 YES shares</strong> at 62¢ each, spending <strong className="text-foreground">$62</strong>.
          </p>
          <p>
            Norway wins gold! Each YES share pays out <strong className="text-foreground">$1</strong>.
            You earn <strong className="text-foreground text-[var(--color-yes)]">$100</strong> total — a profit of <strong className="text-foreground text-[var(--color-yes)]">$38</strong>.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border bg-card p-4">
              <h3 className="font-medium text-sm">{faq.q}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Ready to start predicting?</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Join the waitlist for early access to Viking Market — Norway&apos;s prediction market.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/waitlist">
            <Button className="bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white">
              Join Waitlist
            </Button>
          </Link>
          <Link href="/markets">
            <Button variant="outline">Browse Markets</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
