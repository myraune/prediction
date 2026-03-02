"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VikingLogo } from "@/components/brand/viking-logo";
import { joinWaitlist } from "@/actions/waitlist";

export default function WaitlistPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(0);
  const [alreadyExists, setAlreadyExists] = useState(false);

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
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <VikingLogo size="lg" />
            <span className="text-xl font-semibold tracking-tight">Viking Market</span>
          </Link>

          {!success ? (
            <>
              <h1 className="text-xl font-semibold">Be first in line</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Norway&apos;s prediction market is launching soon. Join the waitlist to get early access.
              </p>
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
                Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="name" name="name" placeholder="Your name" />
            </div>
            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={loading}
            >
              {loading ? "Joining..." : "Join the Waitlist"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No spam. We&apos;ll only email you when there&apos;s something worth sharing.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your position</p>
              <p className="text-3xl font-bold tabular-nums">#{position}</p>
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
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!success && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
