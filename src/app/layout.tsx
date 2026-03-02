import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
  openGraph: {
    type: "website",
    siteName: "Viking Market",
    title: "Viking Market — Norway's Prediction Market",
    description:
      "Trade on real-world events. From Norwegian politics to global markets — buy and sell shares on outcomes you believe in.",
    url: "https://viking-market.com",
    locale: "en_US",
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
