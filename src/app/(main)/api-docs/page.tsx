import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Code, Key, Zap, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Viking Market public REST API documentation. Trade programmatically on prediction markets.",
  openGraph: {
    title: "API Documentation — Viking Market",
    description: "Viking Market public REST API documentation. Trade programmatically on prediction markets.",
  },
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/markets",
    description: "List all markets with filters",
    auth: false,
    params: [
      { name: "category", type: "string", desc: "Filter by category (SPORTS, POLITICS, CRYPTO, etc.)" },
      { name: "status", type: "string", desc: "Filter by status (OPEN, RESOLVED, CLOSED). Default: OPEN" },
      { name: "region", type: "string", desc: "Filter by region (NO, INT)" },
      { name: "featured", type: "boolean", desc: "Only featured markets" },
      { name: "sort", type: "string", desc: "Sort by: volume, newest, closing" },
      { name: "limit", type: "number", desc: "Results per page (max 100, default 50)" },
      { name: "offset", type: "number", desc: "Pagination offset" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/markets/:id",
    description: "Get market details, stats, and price history",
    auth: false,
    params: [],
  },
  {
    method: "GET",
    path: "/api/v1/markets/:id/trades",
    description: "Get trade history for a market",
    auth: false,
    params: [
      { name: "limit", type: "number", desc: "Results per page (max 100)" },
      { name: "offset", type: "number", desc: "Pagination offset" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/trade",
    description: "Place a buy or sell trade",
    auth: true,
    params: [
      { name: "marketId", type: "string", desc: "Market ID (required)" },
      { name: "side", type: "string", desc: "YES or NO (required)" },
      { name: "direction", type: "string", desc: "BUY or SELL (default: BUY)" },
      { name: "amount", type: "number", desc: "Points to spend (required for BUY, max 500)" },
      { name: "shares", type: "number", desc: "Shares to sell (required for SELL)" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/portfolio",
    description: "Get your positions and portfolio summary",
    auth: true,
    params: [],
  },
  {
    method: "GET",
    path: "/api/v1/leaderboard",
    description: "Top traders by balance",
    auth: false,
    params: [
      { name: "limit", type: "number", desc: "Number of results (max 50, default 25)" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/me",
    description: "Get your account info",
    auth: true,
    params: [],
  },
  {
    method: "POST",
    path: "/api/v1/me",
    description: "Generate or regenerate your API key (requires web session)",
    auth: true,
    params: [],
  },
];

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Viking Market provides a public REST API for programmatic access to markets, trading, and portfolio data.
        </p>
      </div>

      {/* Quick start */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <Key className="h-5 w-5 text-[var(--color-viking)]" />
          <h3 className="font-medium text-sm">Authentication</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Public endpoints need no auth. Trading endpoints require an API key via Bearer token.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <Zap className="h-5 w-5 text-[var(--color-viking)]" />
          <h3 className="font-medium text-sm">Base URL</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-mono">
            https://viking-market.com/api/v1
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <BookOpen className="h-5 w-5 text-[var(--color-viking)]" />
          <h3 className="font-medium text-sm">Format</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All responses are JSON. Successful responses use {`{ data: ... }`}. Errors use {`{ error: "..." }`}.
          </p>
        </div>
      </div>

      {/* Getting API Key */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Code className="h-4 w-4" />
          Getting Your API Key
        </h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>1. Sign in to Viking Market</p>
          <p>2. Make a POST request to <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">/api/v1/me</code> (your web session authenticates this)</p>
          <p>3. Save the returned API key — it starts with <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">vm_</code></p>
        </div>
        <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
          <pre className="text-foreground">{`# Generate API key (must be logged in via browser)
curl -X POST https://viking-market.com/api/v1/me \\
  -H "Cookie: <your-session-cookie>"

# Use API key for authenticated endpoints
curl https://viking-market.com/api/v1/portfolio \\
  -H "Authorization: Bearer vm_your_api_key_here"`}</pre>
        </div>
      </div>

      {/* Example: Place a trade */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Example: Place a Trade</h2>
        <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
          <pre className="text-foreground">{`curl -X POST https://viking-market.com/api/v1/trade \\
  -H "Authorization: Bearer vm_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "marketId": "clx123abc",
    "side": "YES",
    "direction": "BUY",
    "amount": 50
  }'

# Response:
{
  "data": {
    "tradeId": "clx456def",
    "side": "YES",
    "direction": "BUY",
    "amount": 50,
    "shares": 78.43,
    "effectivePrice": 0.64,
    "newBalance": 950
  }
}`}</pre>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        {endpoints.map((ep) => (
          <div key={`${ep.method}-${ep.path}`} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                ep.method === "GET" ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
              }`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono font-medium">{ep.path}</code>
              {ep.auth && (
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs">
                  Auth Required
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{ep.description}</p>
            {ep.params.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
                <div className="space-y-1">
                  {ep.params.map((p) => (
                    <div key={p.name} className="flex items-start gap-2 text-xs">
                      <code className="px-1 py-0.5 rounded bg-muted font-mono shrink-0">{p.name}</code>
                      <span className="text-muted-foreground/60 shrink-0">({p.type})</span>
                      <span className="text-muted-foreground">{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rate limits */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Rate Limits</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Public endpoints: 100 requests/minute</p>
          <p>Authenticated endpoints: 60 requests/minute</p>
          <p>Trade endpoint: 10 requests/minute</p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Ready to build?</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Create an account and generate your API key to start trading programmatically.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register">
            <Button className="bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white">
              Create Account
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
