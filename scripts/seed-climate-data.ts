/**
 * Seed demo data for climate markets (snapshots, trades, positions)
 * Run after fix-climate-markets.ts to populate charts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter });

function randomId(): string {
  return "demo_" + Math.random().toString(36).slice(2, 14);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function generatePriceWalk(start: number, end: number, n: number, vol: number = 0.03): number[] {
  const prices = [start];
  for (let i = 1; i < n; i++) {
    const progress = i / (n - 1);
    const target = start + (end - start) * progress;
    const current = prices[i - 1];
    const drift = (target - current) * 0.1;
    const noise = (Math.random() - 0.5) * 2 * vol;
    prices.push(Math.round(clamp(current + drift + noise, 0.02, 0.98) * 100) / 100);
  }
  return prices;
}

function buildBatchInsert(table: string, cols: string[], rows: (string | number | null)[][]): string {
  const colStr = cols.join(", ");
  const vals = rows.map((row) => {
    const v = row.map((c) => {
      if (c === null) return "NULL";
      if (typeof c === "number") return String(c);
      return `'${String(c).replace(/'/g, "''")}'`;
    });
    return `(${v.join(", ")})`;
  }).join(",\n");
  return `INSERT OR IGNORE INTO ${table} (${colStr}) VALUES\n${vals}`;
}

async function main() {
  console.log("🌡️  Seeding climate market data...\n");

  const markets = await prisma.market.findMany({
    where: { category: "CLIMATE" },
    select: { id: true, title: true, poolYes: true, poolNo: true, createdAt: true },
  });
  console.log(`Found ${markets.length} climate markets\n`);

  const demoUsers: { id: string }[] = await prisma.$queryRawUnsafe(
    `SELECT id FROM User WHERE id LIKE 'demo_%' ORDER BY RANDOM() LIMIT 5000`
  );
  console.log(`Demo user pool: ${demoUsers.length}\n`);

  const now = Date.now();
  let totalSnapshots = 0;
  let totalTrades = 0;
  let totalPositions = 0;

  for (const market of markets) {
    const daysOld = Math.min(60, Math.floor((now - market.createdAt.getTime()) / 86400000));
    const numDays = Math.max(7, daysOld);

    // Price walk
    const startPrice = randomBetween(0.15, 0.85);
    const endPrice = randomBetween(0.10, 0.90);
    const volatility = randomBetween(0.015, 0.05);
    const pointsPerDay = 8;
    const totalPoints = numDays * pointsPerDay;
    const prices = generatePriceWalk(startPrice, endPrice, totalPoints, volatility);

    // Snapshots
    const snapRows: (string | number)[][] = [];
    for (let i = 0; i < prices.length; i++) {
      const daysAgo = numDays - (i / pointsPerDay);
      const hoursOffset = (i % pointsPerDay) * 3;
      const ts = new Date(now - daysAgo * 86400000 + hoursOffset * 3600000);
      snapRows.push([randomId(), market.id, prices[i], Math.round((1 - prices[i]) * 100) / 100, ts.toISOString()]);
    }
    for (let b = 0; b < snapRows.length; b += 50) {
      const batch = snapRows.slice(b, b + 50);
      await prisma.$executeRawUnsafe(buildBatchInsert("PriceSnapshot", ["id", "marketId", "yesPrice", "noPrice", "timestamp"], batch));
      totalSnapshots += batch.length;
    }

    // Trades (80-250 per market)
    const numTrades = Math.floor(randomBetween(80, 250));
    const tradeRows: (string | number)[][] = [];
    for (let t = 0; t < numTrades; t++) {
      const user = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const dir = Math.random() > 0.25 ? "BUY" : "SELL";
      const amount = Math.round(randomBetween(5, 500) * 100) / 100;
      const shares = Math.round(randomBetween(5, 600) * 100) / 100;
      const price = Math.round(randomBetween(0.05, 0.95) * 100) / 100;
      const fee = Math.round(amount * 0.02 * 100) / 100;
      const daysAgo = Math.random() * Math.max(1, numDays);
      const createdAt = new Date(now - daysAgo * 24 * 3600000);
      tradeRows.push([randomId(), user.id, market.id, side, dir, amount, shares, price, fee, createdAt.toISOString()]);
    }
    for (let b = 0; b < tradeRows.length; b += 50) {
      const batch = tradeRows.slice(b, b + 50);
      await prisma.$executeRawUnsafe(buildBatchInsert("Trade", ["id", "userId", "marketId", "side", "direction", "amount", "shares", "price", "fee", "createdAt"], batch));
      totalTrades += batch.length;
    }

    // Positions (30-150 per market)
    const numPos = Math.floor(randomBetween(30, 150));
    const shuffled = [...demoUsers].sort(() => Math.random() - 0.5).slice(0, numPos);
    const posRows: (string | number)[][] = [];
    for (const user of shuffled) {
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const shares = Math.round(randomBetween(5, 200) * 100) / 100;
      const avgPrice = Math.round(randomBetween(0.10, 0.90) * 100) / 100;
      posRows.push([randomId(), user.id, market.id, side, shares, avgPrice]);
    }
    for (let b = 0; b < posRows.length; b += 50) {
      const batch = posRows.slice(b, b + 50);
      await prisma.$executeRawUnsafe(buildBatchInsert("Position", ["id", "userId", "marketId", "side", "shares", "avgPrice"], batch));
      totalPositions += batch.length;
    }

    // Update market pools to match end price
    const k = market.poolYes * market.poolNo;
    const sqrtK = Math.sqrt(k);
    const total = 2 * sqrtK;
    await prisma.market.update({
      where: { id: market.id },
      data: {
        poolYes: total * (1 - endPrice),
        poolNo: total * endPrice,
        totalVolume: Math.round(numTrades * randomBetween(30, 150)),
      },
    });

    console.log(`  ✓ ${market.title.slice(0, 50)}... (${snapRows.length} snaps, ${numTrades} trades, ${numPos} positions)`);
  }

  console.log(`\n✅ Done: ${totalSnapshots} snapshots, ${totalTrades} trades, ${totalPositions} positions`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
