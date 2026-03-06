import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AgentChatWidget } from "@/components/chat/agent-chat-widget";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://viking-market.com"),
  title: {
    default: "Viking Market — Norway's Prediction Market",
    template: "%s | Viking Market",
  },
  description:
    "Trade on real-world events. From Norwegian politics to global markets — buy and sell shares on outcomes you believe in.",
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    languages: {
      "nb-NO": "https://viking-market.com",
      "x-default": "https://viking-market.com",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Viking Market",
    title: "Viking Market — Norges prediksjonsmarked",
    description:
      "Handle på virkelige hendelser. Fra norsk politikk til globale markeder — kjøp og selg aksjer på utfall du tror på.",
    url: "https://viking-market.com",
    locale: "nb_NO",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viking Market — Norway's Prediction Market",
    description:
      "Trade on real-world events. From Norwegian politics to global markets — buy and sell shares on outcomes you believe in.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <Script
          defer
          data-domain="viking-market.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
            <AgentChatWidget />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
