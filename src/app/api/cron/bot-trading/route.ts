import { NextResponse } from "next/server";
import { runBotTrading } from "@/actions/bot-trading";

// Vercel cron jobs call this endpoint
// Set up in vercel.json: { "crons": [{ "path": "/api/cron/bot-trading", "schedule": "*/30 * * * *" }] }
// Runs every 30 minutes to simulate organic trading activity

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBotTrading();

  return NextResponse.json({
    success: result.success,
    tradesPlaced: result.tradesPlaced,
    trades: result.trades.map((t) => ({
      bot: t.botName,
      market: t.marketTitle,
      side: t.side,
      amount: t.amount,
    })),
    error: result.error,
  });
}
