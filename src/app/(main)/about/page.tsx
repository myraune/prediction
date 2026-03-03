import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VikingBrand } from "@/components/brand/viking-logo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Viking Market is Norway's prediction market platform. We're building a place for Norwegians to trade on real-world events and make better forecasts.",
  openGraph: {
    title: "About — Viking Market",
    description:
      "Viking Market is Norway's prediction market platform. We're building a place for Norwegians to trade on real-world events and make better forecasts.",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <VikingBrand size="lg" />
        <h1 className="text-2xl font-bold tracking-tight">
          Norway&apos;s prediction market
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Viking Market is a platform where you trade shares on the outcomes of
          real-world events. From Stortinget politics to global tech — put your
          knowledge to work and see how your predictions stack up.
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Our mission</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Prediction markets are one of the best tools we have for forecasting
          the future. They aggregate information from many people into a single
          probability — often more accurate than polls, pundits, or models.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;re building Viking Market to bring this tool to Norway. We
          believe better forecasts lead to better decisions — for individuals,
          businesses, and society.
        </p>
      </div>

      {/* Values */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Transparent",
            description:
              "Every market has clear resolution criteria. Prices are set by an open automated market maker (LMSR). No hidden rules.",
          },
          {
            title: "Norwegian-made",
            description:
              "Built in Norway, focused on Nordic events. We cover what matters to Norwegians — politics, economy, sports, culture, and more.",
          },
          {
            title: "Open to all",
            description:
              "Start with play money — no risk. Learn how prediction markets work, then join us when we launch real-money trading.",
          },
        ].map((v) => (
          <div key={v.title} className="rounded-xl border bg-card p-5 space-y-2">
            <h3 className="font-semibold text-sm">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {v.description}
            </p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">How it works</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            Each market on Viking Market represents a question about the future.
            Shares trade between 1¢ and 99¢ — the price reflects the
            crowd&apos;s estimated probability.
          </p>
          <p>
            If YES shares trade at 75¢, the market thinks there&apos;s roughly a 75%
            chance the event will happen. When the outcome is known, winning
            shares pay $1 and losing shares pay $0.
          </p>
          <p>
            Want a deeper explanation?{" "}
            <Link
              href="/how-it-works"
              className="text-foreground font-medium hover:underline"
            >
              Read our full guide &rarr;
            </Link>
          </p>
        </div>
      </div>

      {/* Roadmap */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">What&apos;s next</h2>
        <div className="space-y-2">
          {[
            { label: "Now", item: "Play-money prediction markets on Norwegian events" },
            { label: "Soon", item: "Mobile app, more market categories, community features" },
            { label: "Later", item: "Real-money trading with Norwegian financial licensing" },
          ].map((r) => (
            <div key={r.label} className="flex gap-3 text-sm">
              <span className="font-semibold text-[var(--color-viking)] w-12 shrink-0">
                {r.label}
              </span>
              <span className="text-muted-foreground">{r.item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Get early access</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We&apos;re launching soon. Join the waitlist to be first in line and help
          shape the platform.
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
