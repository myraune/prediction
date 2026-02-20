import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear all data
  await prisma.comment.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.position.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.market.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // ─── USERS ───────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@vikingmarket.no",
      name: "Admin Nordmann",
      hashedPassword,
      role: "ADMIN",
      balance: 10000,
    },
  });

  const [ola, kari, erik, ingrid, magnus, sofie, bjorn, astrid] = await Promise.all([
    prisma.user.create({ data: { email: "ola@example.no", name: "Ola Nordmann", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "kari@example.no", name: "Kari Hansen", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "erik@example.no", name: "Erik Berg", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "ingrid@example.no", name: "Ingrid Larsen", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "magnus@example.no", name: "Magnus Johansen", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "sofie@example.no", name: "Sofie Nilsen", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "bjorn@example.no", name: "Bjorn Eriksen", hashedPassword, balance: 1000 } }),
    prisma.user.create({ data: { email: "astrid@example.no", name: "Astrid Dahl", hashedPassword, balance: 1000 } }),
  ]);

  const users = [ola, kari, erik, ingrid, magnus, sofie, bjorn, astrid];

  // ─── MARKETS ─────────────────────────────────────────
  // LMSR pools: YES price = poolNo / (poolYes + poolNo)
  // So for 65% YES → poolYes=35, poolNo=65

  const markets = await Promise.all([
    // ── POLITICS (4) ──
    prisma.market.create({
      data: {
        title: "Will Arbeiderpartiet lead the next Norwegian government after Sept 2025?",
        description: "Resolves YES if Arbeiderpartiet leads the governing coalition after the September 2025 Stortinget election.",
        category: "POLITICS", closesAt: new Date("2025-09-15T20:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 45, poolNo: 55, totalVolume: 18200,
        imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Trump impose 25%+ tariffs on EU before July 2025?",
        description: "Resolves YES if the US announces import tariffs of 25% or higher targeting EU goods before July 1, 2025.",
        category: "POLITICS", closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 30, poolNo: 70, totalVolume: 42500,
        imageUrl: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Ukraine-Russia ceasefire agreement in 2025?",
        description: "Resolves YES if Ukraine and Russia agree to a formal ceasefire lasting 30+ days during 2025.",
        category: "POLITICS", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 72, poolNo: 28, totalVolume: 67800,
        imageUrl: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will FrP get 20%+ in the 2025 Norwegian election?",
        description: "Resolves YES if Fremskrittspartiet receives 20%+ of the national vote in September 2025.",
        category: "POLITICS", closesAt: new Date("2025-09-15T20:00:00Z"),
        createdById: admin.id,
        poolYes: 55, poolNo: 45, totalVolume: 8900,
        imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80",
      },
    }),

    // ── SPORTS (4) ──
    prisma.market.create({
      data: {
        title: "Erling Haaland: Premier League top scorer 2024/25?",
        description: "Resolves YES if Haaland finishes as the top scorer in the 2024/25 Premier League.",
        category: "SPORTS", closesAt: new Date("2025-05-25T18:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 35, poolNo: 65, totalVolume: 31200,
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Norway qualify for the 2026 FIFA World Cup?",
        description: "Resolves YES if Norway qualifies for the 2026 World Cup in USA, Canada and Mexico.",
        category: "SPORTS", closesAt: new Date("2025-11-20T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 48, poolNo: 52, totalVolume: 22400,
        imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Barcelona to win Champions League 2025?",
        description: "Resolves YES if FC Barcelona wins the 2024/25 UEFA Champions League.",
        category: "SPORTS", closesAt: new Date("2025-06-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 60, poolNo: 40, totalVolume: 15600,
        imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will a Norwegian win a Grand Tour cycling race in 2025?",
        description: "Resolves YES if a Norwegian cyclist wins the Tour de France, Giro, or Vuelta in 2025.",
        category: "SPORTS", closesAt: new Date("2025-09-14T00:00:00Z"),
        createdById: admin.id,
        poolYes: 65, poolNo: 35, totalVolume: 5800,
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
      },
    }),

    // ── CRYPTO (3) ──
    prisma.market.create({
      data: {
        title: "Bitcoin above $150K before July 2025?",
        description: "Resolves YES if BTC/USD closes above $150,000 on any major exchange before July 1, 2025.",
        category: "CRYPTO", closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 58, poolNo: 42, totalVolume: 89300,
        imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Ethereum above $5,000 in 2025?",
        description: "Resolves YES if ETH/USD trades above $5,000 on Coinbase at any point during 2025.",
        category: "CRYPTO", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 50, poolNo: 50, totalVolume: 34100,
        imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Solana to flip Ethereum in daily DEX volume by Dec 2025?",
        description: "Resolves YES if Solana has higher 7-day avg DEX volume than Ethereum for any week in 2025.",
        category: "CRYPTO", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 40, poolNo: 60, totalVolume: 19700,
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80",
      },
    }),

    // ── CLIMATE (3) ──
    prisma.market.create({
      data: {
        title: "2025 hottest year on record globally?",
        description: "Resolves YES if NASA or NOAA declares 2025 the hottest calendar year on record.",
        category: "CLIMATE", closesAt: new Date("2026-02-01T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 32, poolNo: 68, totalVolume: 28400,
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Arctic sea ice record low in September 2025?",
        description: "Resolves YES if Sept 2025 Arctic sea ice minimum is below 3.39M sq km (2012 record).",
        category: "CLIMATE", closesAt: new Date("2025-10-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 62, poolNo: 38, totalVolume: 9200,
        imageUrl: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Norway announce end date for oil exploration in 2025?",
        description: "Resolves YES if Norway sets an official end date for new oil/gas exploration licenses.",
        category: "CLIMATE", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 82, poolNo: 18, totalVolume: 6100,
        imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&q=80",
      },
    }),

    // ── ECONOMICS (3) ──
    prisma.market.create({
      data: {
        title: "Fed to cut rates 3+ times in 2025?",
        description: "Resolves YES if the Federal Reserve cuts the funds rate at least 3 times (75+ bps) during 2025.",
        category: "ECONOMICS", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 55, poolNo: 45, totalVolume: 51600,
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Norges Bank to cut styringsrenten before October 2025?",
        description: "Resolves YES if Norges Bank reduces the key policy rate before October 1, 2025.",
        category: "ECONOMICS", closesAt: new Date("2025-10-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 38, poolNo: 62, totalVolume: 14300,
        imageUrl: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "US recession (2 consecutive GDP decline quarters) in 2025?",
        description: "Resolves YES if the US has two consecutive quarters of real GDP decline during 2025.",
        category: "ECONOMICS", closesAt: new Date("2026-02-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 72, poolNo: 28, totalVolume: 38900,
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
      },
    }),

    // ── CULTURE (2) ──
    prisma.market.create({
      data: {
        title: "Norway top 5 at Eurovision 2025?",
        description: "Resolves YES if Norway finishes top 5 in the Eurovision 2025 Grand Final.",
        category: "CULTURE", closesAt: new Date("2025-05-17T23:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 60, poolNo: 40, totalVolume: 12800,
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Beyonce to announce new world tour in 2025?",
        description: "Resolves YES if Beyonce officially announces a new concert tour with dates in 2025/2026.",
        category: "CULTURE", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 45, poolNo: 55, totalVolume: 16500,
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
      },
    }),

    // ── COMPANIES (3) ──
    prisma.market.create({
      data: {
        title: "Tesla stock above $500 at any point in 2025?",
        description: "Resolves YES if TSLA closes above $500 on NASDAQ at any point during 2025.",
        category: "COMPANIES", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 42, poolNo: 58, totalVolume: 55300,
        imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Apple to release a foldable device in 2025?",
        description: "Resolves YES if Apple announces or releases a foldable iPhone or iPad during 2025.",
        category: "COMPANIES", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 85, poolNo: 15, totalVolume: 21400,
        imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Nvidia market cap above $4 trillion in 2025?",
        description: "Resolves YES if Nvidia exceeds $4T market cap at any point during 2025.",
        category: "COMPANIES", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 38, poolNo: 62, totalVolume: 47200,
        imageUrl: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400&q=80",
      },
    }),

    // ── FINANCIALS (3) ──
    prisma.market.create({
      data: {
        title: "S&P 500 above 6,500 in 2025?",
        description: "Resolves YES if the S&P 500 closes above 6,500 on any trading day in 2025.",
        category: "FINANCIALS", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 32, poolNo: 68, totalVolume: 62100,
        imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Gold above $3,500/oz before December 2025?",
        description: "Resolves YES if gold spot price closes above $3,500/oz during 2025.",
        category: "FINANCIALS", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 48, poolNo: 52, totalVolume: 29800,
        imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Brent crude oil above $90/barrel before July 2025?",
        description: "Resolves YES if Brent crude spot closes above $90/barrel before July 1, 2025.",
        category: "FINANCIALS", closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 52, poolNo: 48, totalVolume: 18700,
        imageUrl: "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=400&q=80",
      },
    }),

    // ── TECH & SCIENCE (3) ──
    prisma.market.create({
      data: {
        title: "OpenAI to release GPT-5 in 2025?",
        description: "Resolves YES if OpenAI publicly releases a model branded as GPT-5 during 2025.",
        category: "TECH_SCIENCE", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 35, poolNo: 65, totalVolume: 71500,
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "SpaceX Starship successful orbital flight in 2025?",
        description: "Resolves YES if SpaceX Starship completes a full orbital trajectory and controlled landing.",
        category: "TECH_SCIENCE", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 25, poolNo: 75, totalVolume: 44800,
        imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will an AI score 90%+ on ARC-AGI benchmark in 2025?",
        description: "Resolves YES if any AI system achieves 90%+ accuracy on ARC-AGI by end of 2025.",
        category: "TECH_SCIENCE", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 42, poolNo: 58, totalVolume: 33600,
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80",
      },
    }),

    // ── ENTERTAINMENT (3) ──
    prisma.market.create({
      data: {
        title: "GTA 6 released before November 2025?",
        description: "Resolves YES if GTA VI is available for purchase on any platform before Nov 1, 2025.",
        category: "ENTERTAINMENT", closesAt: new Date("2025-11-01T00:00:00Z"),
        createdById: admin.id, featured: true,
        poolYes: 40, poolNo: 60, totalVolume: 58700,
        imageUrl: "https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Netflix to exceed 320M subscribers in 2025?",
        description: "Resolves YES if Netflix reports 320M+ global paid subscribers in any 2025 earnings.",
        category: "ENTERTAINMENT", closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 42, poolNo: 58, totalVolume: 14600,
        imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8d6f2b?w=400&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will a Norwegian film win Palme d'Or at Cannes 2025?",
        description: "Resolves YES if a Norwegian film wins the Palme d'Or at 2025 Cannes Film Festival.",
        category: "ENTERTAINMENT", closesAt: new Date("2025-05-24T00:00:00Z"),
        createdById: admin.id,
        poolYes: 92, poolNo: 8, totalVolume: 3200,
        imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
      },
    }),
  ]);

  // ─── SIMULATE TRADES ────────────────────────────────
  const tradeData: Array<{
    marketIdx: number; userId: string; side: string; direction: string;
    amount: number; shares: number; price: number; daysAgo: number;
  }> = [];

  for (let idx = 0; idx < markets.length; idx++) {
    const numTrades = 8 + Math.floor(Math.random() * 20);
    for (let i = 0; i < numTrades; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const amount = [10, 25, 50, 100, 200][Math.floor(Math.random() * 5)];
      const price = 0.15 + Math.random() * 0.7;
      tradeData.push({
        marketIdx: idx, userId: user.id, side, direction: "BUY",
        amount, shares: amount / price, price,
        daysAgo: Math.floor(Math.random() * 30),
      });
    }
  }

  for (const td of tradeData) {
    const market = markets[td.marketIdx];
    if (!market) continue;
    await prisma.trade.create({
      data: {
        marketId: market.id, userId: td.userId, side: td.side,
        direction: td.direction, amount: td.amount, shares: td.shares,
        price: td.price,
        createdAt: new Date(Date.now() - td.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Positions
  const posMap = new Map<string, { shares: number; cost: number }>();
  for (const td of tradeData) {
    const m = markets[td.marketIdx];
    if (!m) continue;
    const k = `${td.userId}-${m.id}-${td.side}`;
    const e = posMap.get(k) ?? { shares: 0, cost: 0 };
    e.shares += td.shares;
    e.cost += td.amount;
    posMap.set(k, e);
  }
  for (const [key, pos] of posMap) {
    const [userId, marketId, side] = key.split("-");
    await prisma.position.create({
      data: { userId: userId!, marketId: marketId!, side: side!, shares: pos.shares, avgPrice: pos.cost / pos.shares },
    });
  }

  // Price snapshots (30 days)
  for (const market of markets) {
    const baseYes = market.poolNo / (market.poolYes + market.poolNo) * 100;
    for (let d = 30; d >= 0; d--) {
      const drift = (Math.random() - 0.5) * 8;
      const yes = Math.max(3, Math.min(97, Math.round(baseYes + drift)));
      await prisma.priceSnapshot.create({
        data: {
          marketId: market.id, yesPrice: yes, noPrice: 100 - yes,
          timestamp: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log(`  1 admin + ${users.length} users`);
  console.log(`  ${markets.length} markets · ${tradeData.length} trades · ${posMap.size} positions · ${markets.length * 31} snapshots`);
  console.log("  Login: admin@vikingmarket.no / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
