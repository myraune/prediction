"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VikingLogo } from "@/components/brand/viking-logo";
import { joinWaitlist, getWaitlistCount } from "@/actions/waitlist";
import { Zap, Gift, Users } from "lucide-react";

const benefits = [
  { icon: Zap, text: "Early access before public launch" },
  { icon: Gift, text: "Bonus starting points for early users" },
  { icon: Users, text: "Help shape the platform with feedback" },
];

export default function WaitlistPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(0);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    getWaitlistCount().then(setWaitlistCount);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = (formData.get("name") as string) || undefined;

    const result = await joinWaitlist({ email, name });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.success) {
      setPosition(result.position ?? 0);
      setAlreadyExists(result.alreadyExists ?? false);
      setSuccess(true);
      setWaitlistCount((prev) => (result.alreadyExists ? prev : prev + 1));
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <VikingLogo size="lg" />
            <span className="text-xl font-semibold tracking-tight">Viking Market</span>
          </Link>

          {!success ? (
            <>
              <h1 className="text-xl font-semibold">Be first in line</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Norway&apos;s prediction market is launching soon. Join the
                waitlist to get early access.
              </p>

              {/* Live waitlist count */}
              {waitlistCount > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="font-semibold text-foreground tabular-nums">
                    {waitlistCount}
                  </span>{" "}
                  {waitlistCount === 1 ? "person has" : "people have"} already
                  joined
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mt-2 mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground/5 mb-3">
                  <span className="text-2xl">&#9989;</span>
                </div>
              </div>
              <h1 className="text-xl font-semibold">
                {alreadyExists ? "You're already on the list!" : "You're in!"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {alreadyExists
                  ? "We already have your email. We'll notify you when we launch."
                  : `You're #${position} on the waitlist. We'll send you an invite when we're ready.`}
              </p>
            </>
          )}
        </div>

        {!success ? (
          <div className="space-y-5">
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input id="name" name="name" placeholder="Your name" />
              </div>
              <Button
                type="submit"
                className="w-full bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join the Waitlist"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                No spam. We&apos;ll only email you when there&apos;s something
                worth sharing.
              </p>
            </form>

            {/* Benefits */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Early access perks
              </p>
              {benefits.map((b) => (
                <div key={b.text} className="flex items-center gap-3">
                  <b.icon className="h-4 w-4 text-[var(--color-viking)] shrink-0" />
                  <span className="text-sm text-muted-foreground">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Your position
              </p>
              <p className="text-3xl font-bold tabular-nums">#{position}</p>
              {waitlistCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  out of {waitlistCount} on the waitlist
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                While you wait, you can explore the markets:
              </p>
              <Link href="/markets" className="block">
                <Button variant="outline" className="w-full">
                  Browse Markets
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!success && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
