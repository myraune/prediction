import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Be first in line for Viking Market — Norway's prediction market. Sign up to get early access when we launch.",
  openGraph: {
    title: "Join the Waitlist — Viking Market",
    description:
      "Be first in line for Viking Market — Norway's prediction market. Sign up to get early access when we launch.",
  },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
