import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runBotTrading } from "@/actions/bot-trading";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { trades?: number; marketIds?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // Use defaults
  }

  const result = await runBotTrading(body.trades, body.marketIds);

  return NextResponse.json(result);
}
