/**
 * Demo Seed Script — populate Viking Market as if it's a live pilot with 10,000 users
 *
 * Creates:
 * - 10,000 users (Norwegian names)
 * - Realistic price history snapshots with random walk for ALL markets
 * - Thousands of trades spread across markets
 * - Varied positions, volumes, balances
 * - Waitlist entries
 *
 * Uses batched raw SQL to minimize Turso requests.
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

// ─── Norwegian name pools ───────────────────────────────
const FIRST_NAMES = [
  "Emma", "Nora", "Olivia", "Ella", "Maja", "Sofia", "Emilie", "Leah", "Ingrid", "Sara",
  "Anna", "Ida", "Thea", "Amalie", "Selma", "Alma", "Frida", "Aurora", "Hedda", "Astrid",
  "Oline", "Tiril", "Mia", "Tuva", "Vilde", "Linnea", "Solveig", "Sigrid", "Mathilde", "Julie",
  "Jakob", "Emil", "Noah", "Oliver", "Filip", "William", "Lucas", "Liam", "Henrik", "Oscar",
  "Magnus", "Aksel", "Theodor", "Isak", "Mathias", "Tobias", "Jonas", "Sander", "Elias", "Adrian",
  "Kasper", "Sebastian", "Kristian", "Erik", "Olav", "Håkon", "Sverre", "Morten", "Lars", "Petter",
  "Andreas", "Thomas", "Anders", "Knut", "Bjørn", "Eirik", "Geir", "Trond", "Rune", "Stein",
  "Tor", "Jan", "Per", "Ole", "Kari", "Anne", "Marit", "Liv", "Grete", "Hilde",
  "Silje", "Camilla", "Marte", "Karoline", "Helene", "Kristine", "Marianne", "Elisabeth", "Monica", "Berit",
  "Simen", "Vegard", "Erlend", "Stian", "Joakim", "Martin", "Daniel", "Christian", "Espen", "Sindre",
];

const LAST_NAMES = [
  "Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen",
  "Jensen", "Karlsen", "Johnsen", "Pettersen", "Eriksen", "Berg", "Haugen", "Hagen",
  "Johannessen", "Andreassen", "Jacobsen", "Dahl", "Jørgensen", "Henriksen", "Lund", "Halvorsen",
  "Sørensen", "Jakobsen", "Moen", "Gundersen", "Iversen", "Strand", "Solberg", "Martinsen",
  "Eide", "Bakken", "Berge", "Holm", "Lie", "Nguyen", "Amundsen", "Bakke",
  "Sandvik", "Lunde", "Myhre", "Tangen", "Vik", "Nygård", "Brekke", "Fjeld",
  "Aasen", "Hauge", "Aas", "Bøe", "Lindqvist", "Sivertsen", "Svendsen", "Christiansen",
  "Ødegård", "Norheim", "Viken", "Hegge", "Berntsen", "Knutsen", "Engen", "Vestby",
];

function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomId(): string {
  return "demo_" + Math.random().toString(36).slice(2, 14);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Retry wrapper for Turso calls
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (i === retries - 1) throw e;
      if (msg.includes("ENOTFOUND") || msg.includes("fetch failed") || msg.includes("ETIMEDOUT")) {
        console.log(`  ⚠ Network error, retrying in ${delayMs / 1000}s... (${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 1.5; // exponential backoff
      } else {
        throw e; // non-network errors should not retry
      }
    }
  }
  throw new Error("unreachable");
}

// ─── Random walk price generator ────────────────────────
function generatePriceWalk(
  startPrice: number,
  endPrice: number,
  numPoints: number,
  volatility: number = 0.03,
): number[] {
  const prices: number[] = [startPrice];
  for (let i = 1; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const target = startPrice + (endPrice - startPrice) * progress;
    const current = prices[i - 1];
    const drift = (target - current) * 0.1;
    const noise = (Math.random() - 0.5) * 2 * volatility;
    const next = clamp(current + drift + noise, 0.02, 0.98);
    prices.push(Math.round(next * 100) / 100);
  }
  return prices;
}

// Build multi-row INSERT statement (batches of N rows)
function buildBatchInsert(
  table: string,
  columns: string[],
  rows: (string | number | boolean | null)[][],
): string {
  const colStr = columns.join(", ");
  const valuesStr = rows
    .map((row) => {
      const vals = row.map((v) => {
        if (v === null) return "NULL";
        if (typeof v === "number") return String(v);
        if (typeof v === "boolean") return v ? "1" : "0";
        // Escape single quotes in strings
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(", ")})`;
    })
    .join(",\n");
  return `INSERT OR IGNORE INTO ${table} (${colStr}) VALUES\n${valuesStr}`;
}

async function main() {
  console.log("🏔️  Viking Market Demo Seed");
  console.log("==========================\n");

  // ─── 1. Get existing markets ───────────────────────────
  const markets = await withRetry(() =>
    prisma.market.findMany({
      where: { status: "OPEN" },
      select: { id: true, title: true, poolYes: true, poolNo: true, totalVolume: true, createdAt: true, closesAt: true },
    })
  );
  console.log(`Found ${markets.length} open markets\n`);

  if (markets.length === 0) {
    console.log("No markets found. Aborting.");
    return;
  }

  // ─── 2. Create 10,000 demo users ──────────────────────
  console.log("Creating 10,000 demo users...");
  const existingDemoCount = await withRetry(() =>
    prisma.user.count({ where: { id: { startsWith: "demo_" } } })
  );
  console.log(`  Existing demo users: ${existingDemoCount}`);

  const TOTAL_USERS = 10000;
  const usersToCreate = TOTAL_USERS - existingDemoCount;

  if (usersToCreate > 0) {
    const BATCH_SIZE = 25; // smaller batch for multi-row insert safety
    let created = 0;

    for (let batch = 0; batch < Math.ceil(usersToCreate / BATCH_SIZE); batch++) {
      const batchSize = Math.min(BATCH_SIZE, usersToCreate - created);
      const rows: (string | number | null)[][] = [];

      for (let i = 0; i < batchSize; i++) {
        const name = randomName();
        const balance = Math.round(randomBetween(200, 5000) * 100) / 100;
        const daysAgo = Math.floor(Math.random() * 90);
        const createdDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
        rows.push([
          randomId(), name,
          `${name.toLowerCase().replace(/[^a-z]/g, ".")}${created + i}@demo.viking-market.com`,
          "USER", balance, "", 1, createdDate, new Date().toISOString(),
        ]);
      }

      const sql = buildBatchInsert("User",
        ["id", "name", "email", "role", "balance", "hashedPassword", "emailNotifications", "createdAt", "updatedAt"],
        rows
      );

      await withRetry(() => prisma.$executeRawUnsafe(sql));
      created += batchSize;

      if (created % 500 === 0 || created >= usersToCreate) {
        process.stdout.write(`  Created ${created}/${usersToCreate} users\r`);
      }

      // Small delay every 100 to be nice to Turso
      if (created % 100 === 0) await new Promise((r) => setTimeout(r, 100));
    }
    console.log(`\n  ✅ Created ${usersToCreate} new users (total: ${TOTAL_USERS})`);
  } else {
    console.log("  ✅ Already have enough demo users");
  }

  // Get demo user IDs
  const allDemoUsers: { id: string }[] = await withRetry(() =>
    prisma.$queryRawUnsafe(`SELECT id FROM User WHERE id LIKE 'demo_%' ORDER BY RANDOM() LIMIT 10000`)
  );
  console.log(`  Active user pool: ${allDemoUsers.length}\n`);

  // ─── 3. Generate price snapshots with realistic movement ──
  console.log("Generating price history snapshots...");

  // Delete existing snapshots to replace with better ones
  await withRetry(() =>
    prisma.$executeRawUnsafe(`DELETE FROM PriceSnapshot WHERE timestamp > datetime('now', '-91 days')`)
  );

  const now = Date.now();
  let totalSnapshots = 0;

  // Process markets in chunks of 5 to reduce total requests
  for (let mi = 0; mi < markets.length; mi++) {
    const market = markets[mi];
    const daysOld = Math.min(90, Math.floor((now - market.createdAt.getTime()) / 86400000));
    const numDays = Math.max(7, daysOld);

    const startPrice = randomBetween(0.15, 0.85);
    const endPrice = randomBetween(0.10, 0.90);
    const volatility = randomBetween(0.01, 0.06);

    const pointsPerDay = 8;
    const totalPoints = numDays * pointsPerDay;
    const prices = generatePriceWalk(startPrice, endPrice, totalPoints, volatility);

    // Batch all snapshots for this market into chunks of 50
    const snapshotRows: (string | number)[][] = [];
    for (let i = 0; i < prices.length; i++) {
      const daysAgoVal = numDays - (i / pointsPerDay);
      const hoursOffset = (i % pointsPerDay) * 3;
      const timestamp = new Date(now - daysAgoVal * 86400000 + hoursOffset * 3600000);
      const yesPrice = prices[i];
      const noPrice = Math.round((1 - yesPrice) * 100) / 100;
      snapshotRows.push([randomId(), market.id, yesPrice, noPrice, timestamp.toISOString()]);
    }

    // Insert in batches of 50 rows
    for (let b = 0; b < snapshotRows.length; b += 50) {
      const batch = snapshotRows.slice(b, b + 50);
      const sql = buildBatchInsert("PriceSnapshot",
        ["id", "marketId", "yesPrice", "noPrice", "timestamp"],
        batch
      );
      await withRetry(() => prisma.$executeRawUnsafe(sql));
      totalSnapshots += batch.length;
    }

    // Update market pools to match end price
    const k = market.poolYes * market.poolNo;
    const sqrtK = Math.sqrt(k);
    const total = 2 * sqrtK;
    const newPoolYes = total * (1 - endPrice);
    const newPoolNo = total * endPrice;
    await withRetry(() =>
      prisma.market.update({ where: { id: market.id }, data: { poolYes: newPoolYes, poolNo: newPoolNo } })
    );

    if ((mi + 1) % 10 === 0 || mi === markets.length - 1) {
      process.stdout.write(`  Markets ${mi + 1}/${markets.length} — ${totalSnapshots} snapshots...\r`);
      await new Promise((r) => setTimeout(r, 200)); // small delay every 10 markets
    }
  }
  console.log(`\n  ✅ Generated ${totalSnapshots} price snapshots across ${markets.length} markets\n`);

  // ─── 4. Generate trades ────────────────────────────────
  console.log("Generating trades...");
  let totalTrades = 0;
  const TRADES_PER_MARKET_MIN = 50;
  const TRADES_PER_MARKET_MAX = 400;

  for (let mi = 0; mi < markets.length; mi++) {
    const market = markets[mi];
    const numTrades = Math.floor(randomBetween(TRADES_PER_MARKET_MIN, TRADES_PER_MARKET_MAX));
    const marketDays = Math.min(90, Math.floor((now - market.createdAt.getTime()) / 86400000));

    const tradeRows: (string | number)[][] = [];
    for (let t = 0; t < numTrades; t++) {
      const user = allDemoUsers[Math.floor(Math.random() * allDemoUsers.length)];
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const direction = Math.random() > 0.25 ? "BUY" : "SELL";
      const amount = Math.round(randomBetween(5, 500) * 100) / 100;
      const shares = Math.round(randomBetween(5, 600) * 100) / 100;
      const price = Math.round(randomBetween(0.05, 0.95) * 100) / 100;
      const fee = Math.round(amount * 0.02 * 100) / 100;
      const daysAgo = Math.random() * Math.max(1, marketDays);
      const hoursAgo = daysAgo * 24 + Math.random() * 24;
      const createdAt = new Date(now - hoursAgo * 3600000);
      tradeRows.push([randomId(), user.id, market.id, side, direction, amount, shares, price, fee, createdAt.toISOString()]);
    }

    // Insert trades in batches of 50
    for (let b = 0; b < tradeRows.length; b += 50) {
      const batch = tradeRows.slice(b, b + 50);
      const sql = buildBatchInsert("Trade",
        ["id", "userId", "marketId", "side", "direction", "amount", "shares", "price", "fee", "createdAt"],
        batch
      );
      await withRetry(() => prisma.$executeRawUnsafe(sql));
      totalTrades += batch.length;
    }

    if ((mi + 1) % 10 === 0 || mi === markets.length - 1) {
      process.stdout.write(`  Markets ${mi + 1}/${markets.length} — ${totalTrades} trades...\r`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  console.log(`\n  ✅ Generated ${totalTrades} trades\n`);

  // ─── 5. Generate positions ─────────────────────────────
  console.log("Generating positions...");
  let totalPositions = 0;

  for (let mi = 0; mi < markets.length; mi++) {
    const market = markets[mi];
    const numPositionUsers = Math.floor(randomBetween(20, 300));
    const shuffled = [...allDemoUsers].sort(() => Math.random() - 0.5).slice(0, numPositionUsers);

    const posRows: (string | number)[][] = [];
    for (const user of shuffled) {
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const shares = Math.round(randomBetween(5, 200) * 100) / 100;
      const avgPrice = Math.round(randomBetween(0.10, 0.90) * 100) / 100;
      posRows.push([randomId(), user.id, market.id, side, shares, avgPrice]);
    }

    // Insert positions in batches of 50
    for (let b = 0; b < posRows.length; b += 50) {
      const batch = posRows.slice(b, b + 50);
      const sql = buildBatchInsert("Position",
        ["id", "userId", "marketId", "side", "shares", "avgPrice"],
        batch
      );
      await withRetry(() => prisma.$executeRawUnsafe(sql));
      totalPositions += batch.length;
    }

    if ((mi + 1) % 20 === 0 || mi === markets.length - 1) {
      process.stdout.write(`  Markets ${mi + 1}/${markets.length} — ${totalPositions} positions...\r`);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  console.log(`\n  ✅ Generated ${totalPositions} positions\n`);

  // ─── 6. Update market volumes ──────────────────────────
  console.log("Updating market volumes...");
  for (const market of markets) {
    const tradeCount: { c: number }[] = await withRetry(() =>
      prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM Trade WHERE marketId = ?`, market.id)
    );
    const count = tradeCount[0]?.c ?? 0;
    const avgTradeSize = randomBetween(30, 150);
    const volume = Math.round(count * avgTradeSize);
    await withRetry(() =>
      prisma.market.update({ where: { id: market.id }, data: { totalVolume: volume } })
    );
  }
  console.log("  ✅ Updated all market volumes\n");

  // ─── 7. Add waitlist entries ───────────────────────────
  console.log("Adding waitlist entries...");
  const existingWaitlist = await withRetry(() => prisma.waitlistEntry.count());
  const targetWaitlist = 2500;
  const waitlistToAdd = Math.max(0, targetWaitlist - existingWaitlist);

  if (waitlistToAdd > 0) {
    for (let b = 0; b < waitlistToAdd; b += 50) {
      const batchSize = Math.min(50, waitlistToAdd - b);
      const rows: (string | number)[][] = [];
      for (let i = 0; i < batchSize; i++) {
        const name = randomName();
        const daysAgo = Math.floor(Math.random() * 60);
        const createdDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
        rows.push([
          randomId(),
          `${name.toLowerCase().replace(/[^a-z]/g, ".")}${b + i}@waitlist.viking-market.com`,
          name,
          createdDate,
        ]);
      }
      const sql = buildBatchInsert("WaitlistEntry", ["id", "email", "name", "createdAt"], rows);
      await withRetry(() => prisma.$executeRawUnsafe(sql));
    }
  }
  console.log(`  ✅ Added ${waitlistToAdd} waitlist entries (total: ~${targetWaitlist})\n`);

  // ─── 8. Add comments ─────────────────────────────
  console.log("Adding comments...");
  const commentTexts = [
    "Tror dette skjer innen fristen", "Helt uenig, dette er overprisa",
    "Interessant marked, følger med!", "Kjøpte YES i dag, virker som god verdi",
    "NO virker som best bet her", "Noen som har mer info om dette?",
    "Prisen har bevegd seg mye siste uke", "Bra marked, liker oddsen",
    "Tror markedet undervurderer sannsynligheten", "Selger mine YES shares nå",
    "Spennende å se hva som skjer", "Markedet reagerer på nyhetene",
    "Kjøpte mer i dag, god pris", "Venter på mer informasjon",
    "Dette er 50/50 nå", "Overraskende bevegelse i dag",
    "Følger nøye med på denne", "Litt usikker, men kjøpte litt",
    "Solgte alt, tror det snur", "Bra volum i dag!",
    "Prices look right here", "This is undervalued imo",
    "Watching this one closely", "Good entry point right now",
    "Just bought more YES", "Market seems overpriced",
    "Interesting development today", "Volume picking up!",
    "I think this resolves YES", "NO seems like the safe bet",
  ];

  let totalComments = 0;
  for (const market of markets.slice(0, 60)) {
    const numComments = Math.floor(randomBetween(2, 15));
    const rows: (string | number)[][] = [];
    for (let c = 0; c < numComments; c++) {
      const user = allDemoUsers[Math.floor(Math.random() * allDemoUsers.length)];
      const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
      rows.push([randomId(), text, user.id, market.id, createdDate, new Date().toISOString()]);
    }
    const sql = buildBatchInsert("Comment", ["id", "content", "userId", "marketId", "createdAt", "updatedAt"], rows);
    await withRetry(() => prisma.$executeRawUnsafe(sql));
    totalComments += rows.length;
  }
  console.log(`  ✅ Added ${totalComments} comments\n`);

  // ─── 9. Update user balances ────────
  console.log("Adjusting user balances...");
  await withRetry(() =>
    prisma.$executeRawUnsafe(
      `UPDATE User SET balance = ROUND(200 + ABS(RANDOM()) % 4800 + (ABS(RANDOM()) % 1000) * 0.01, 2)
       WHERE id LIKE 'demo_%'`
    )
  );
  console.log("  ✅ Randomized user balances\n");

  // ─── Summary ───────────────────────────────────────────
  const [userCount, tradeCount, positionCount, snapshotCount, waitlistCount, commentCount] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.position.count(),
    prisma.priceSnapshot.count(),
    prisma.waitlistEntry.count(),
    prisma.comment.count(),
  ]);

  console.log("═══════════════════════════════════");
  console.log("  🏔️  DEMO SEED COMPLETE");
  console.log("═══════════════════════════════════");
  console.log(`  Users:          ${userCount.toLocaleString()}`);
  console.log(`  Trades:         ${tradeCount.toLocaleString()}`);
  console.log(`  Positions:      ${positionCount.toLocaleString()}`);
  console.log(`  Price snapshots: ${snapshotCount.toLocaleString()}`);
  console.log(`  Waitlist:       ${waitlistCount.toLocaleString()}`);
  console.log(`  Comments:       ${commentCount.toLocaleString()}`);
  console.log(`  Markets:        ${markets.length}`);
  console.log("═══════════════════════════════════\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
