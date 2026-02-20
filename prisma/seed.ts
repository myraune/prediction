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
    prisma.user.create({
      data: { email: "ola@example.no", name: "Ola Nordmann", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "kari@example.no", name: "Kari Hansen", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "erik@example.no", name: "Erik Berg", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "ingrid@example.no", name: "Ingrid Larsen", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "magnus@example.no", name: "Magnus Johansen", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "sofie@example.no", name: "Sofie Nilsen", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "bjorn@example.no", name: "Bjorn Eriksen", hashedPassword, balance: 1000 },
    }),
    prisma.user.create({
      data: { email: "astrid@example.no", name: "Astrid Dahl", hashedPassword, balance: 1000 },
    }),
  ]);

  const users = [ola, kari, erik, ingrid, magnus, sofie, bjorn, astrid];

  // ─── MARKETS ─────────────────────────────────────────
  // 40+ markets across all categories — mix of Norwegian and global

  const markets = await Promise.all([
    // ── POLITICS ──
    prisma.market.create({
      data: {
        title: "Will Hoyre win the 2025 Stortinget election?",
        description: "Resolves YES if Hoyre (H) leads the governing coalition after the September 2025 Stortinget election.",
        category: "POLITICS",
        closesAt: new Date("2025-09-15T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 72,
        poolNo: 128,
        totalVolume: 4520,
        imageUrl: "https://images.unsplash.com/photo-1575540325276-0869cf52e7c5?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will MDG pass the sperregrense (4%) in the next election?",
        description: "Resolves YES if MDG receives 4%+ of the national vote in the 2025 Stortinget election.",
        category: "POLITICS",
        closesAt: new Date("2025-09-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 125,
        poolNo: 75,
        totalVolume: 1870,
        imageUrl: "https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Trump impose new tariffs on EU by June 2025?",
        description: "Resolves YES if the US announces new import tariffs targeting European Union goods before July 1, 2025.",
        category: "POLITICS",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 65,
        poolNo: 135,
        totalVolume: 8930,
        imageUrl: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Ukraine and Russia reach a ceasefire in 2025?",
        description: "Resolves YES if both Ukraine and Russia agree to and implement a formal ceasefire lasting at least 30 days during 2025.",
        category: "POLITICS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 135,
        poolNo: 65,
        totalVolume: 12400,
        imageUrl: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=800&q=80",
      },
    }),

    // ── SPORTS ──
    prisma.market.create({
      data: {
        title: "Will Erling Haaland score 30+ Premier League goals in 2024/25?",
        description: "Resolves YES if Haaland scores 30+ goals in the 2024/25 Premier League season (league matches only).",
        category: "SPORTS",
        closesAt: new Date("2025-05-25T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 82,
        poolNo: 118,
        totalVolume: 6200,
        imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Norway qualify for the 2026 FIFA World Cup?",
        description: "Resolves YES if Norway's men's national team qualifies for the 2026 FIFA World Cup in USA, Canada, and Mexico.",
        category: "SPORTS",
        closesAt: new Date("2025-11-30T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 108,
        poolNo: 92,
        totalVolume: 5400,
        imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Real Madrid win Champions League 2025?",
        description: "Resolves YES if Real Madrid CF wins the 2024/25 UEFA Champions League final.",
        category: "SPORTS",
        closesAt: new Date("2025-06-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 78,
        poolNo: 122,
        totalVolume: 3800,
        imageUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Magnus Carlsen return to classical chess World Championship?",
        description: "Resolves YES if Magnus Carlsen officially enters or announces entry into a classical format World Chess Championship match by end of 2025.",
        category: "SPORTS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 140,
        poolNo: 60,
        totalVolume: 2100,
        imageUrl: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800&q=80",
      },
    }),

    // ── CRYPTO ──
    prisma.market.create({
      data: {
        title: "Will Bitcoin exceed $150,000 before July 2025?",
        description: "Resolves YES if BTC/USD closes above $150,000 on Coinbase or Binance before July 1, 2025.",
        category: "CRYPTO",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 78,
        poolNo: 122,
        totalVolume: 15600,
        imageUrl: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Ethereum flip Bitcoin in market cap by 2026?",
        description: "Resolves YES if Ethereum's total market cap exceeds Bitcoin's at any point before January 1, 2026.",
        category: "CRYPTO",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 145,
        poolNo: 55,
        totalVolume: 4300,
        imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Solana reach $500 in 2025?",
        description: "Resolves YES if SOL/USD trades above $500 on any major exchange during 2025.",
        category: "CRYPTO",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 120,
        poolNo: 80,
        totalVolume: 3200,
        imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80",
      },
    }),

    // ── CLIMATE ──
    prisma.market.create({
      data: {
        title: "Will 2025 be the hottest year on record globally?",
        description: "Resolves YES if NASA GISS or NOAA declares 2025 the hottest calendar year on record for global surface temperature.",
        category: "CLIMATE",
        closesAt: new Date("2026-01-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 68,
        poolNo: 132,
        totalVolume: 7800,
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Arctic sea ice reach a new record low in 2025?",
        description: "Resolves YES if September 2025 Arctic sea ice minimum (NSIDC) is below 3.39M sq km (2012 record).",
        category: "CLIMATE",
        closesAt: new Date("2025-10-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 115,
        poolNo: 85,
        totalVolume: 2900,
        imageUrl: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Norway ban new oil exploration licenses in 2025?",
        description: "Resolves YES if Norway's government formally announces a moratorium on new oil/gas exploration licenses during 2025.",
        category: "CLIMATE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 150,
        poolNo: 50,
        totalVolume: 1600,
        imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&q=80",
      },
    }),

    // ── ECONOMICS ──
    prisma.market.create({
      data: {
        title: "Will the Federal Reserve cut rates 3+ times in 2025?",
        description: "Resolves YES if the Fed cuts the federal funds rate at least 3 times (75+ basis points total) during 2025.",
        category: "ECONOMICS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 110,
        poolNo: 90,
        totalVolume: 9200,
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Norges Bank cut the key policy rate before October 2025?",
        description: "Resolves YES if Norges Bank reduces the styringsrenten before October 1, 2025.",
        category: "ECONOMICS",
        closesAt: new Date("2025-10-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 75,
        poolNo: 125,
        totalVolume: 4100,
        imageUrl: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will US GDP growth exceed 3% in 2025?",
        description: "Resolves YES if US real GDP growth for 2025 (BEA advance estimate) exceeds 3.0% annualized.",
        category: "ECONOMICS",
        closesAt: new Date("2026-01-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 118,
        poolNo: 82,
        totalVolume: 3500,
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      },
    }),

    // ── CULTURE ──
    prisma.market.create({
      data: {
        title: "Will Norway finish top 10 in Eurovision 2025?",
        description: "Resolves YES if Norway's entry finishes top 10 in the Eurovision Song Contest 2025 Grand Final.",
        category: "CULTURE",
        closesAt: new Date("2025-05-17T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 95,
        poolNo: 105,
        totalVolume: 3900,
        imageUrl: "https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Taylor Swift announce another Eras Tour extension?",
        description: "Resolves YES if Taylor Swift officially announces additional Eras Tour dates beyond the currently scheduled shows.",
        category: "CULTURE",
        closesAt: new Date("2025-09-30T00:00:00Z"),
        createdById: admin.id,
        poolYes: 88,
        poolNo: 112,
        totalVolume: 5200,
        imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
      },
    }),

    // ── COMPANIES ──
    prisma.market.create({
      data: {
        title: "Will Tesla stock exceed $400 in 2025?",
        description: "Resolves YES if TSLA closes above $400 on NASDAQ at any point during 2025.",
        category: "COMPANIES",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 88,
        poolNo: 112,
        totalVolume: 8700,
        imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Apple launch a foldable device in 2025?",
        description: "Resolves YES if Apple Inc. officially announces/releases a foldable iPhone or iPad during 2025.",
        category: "COMPANIES",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 140,
        poolNo: 60,
        totalVolume: 4600,
        imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Equinor's stock exceed 350 NOK by end of 2025?",
        description: "Resolves YES if EQNR closes above 350 NOK on Oslo Boers at any point before December 31, 2025.",
        category: "COMPANIES",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 102,
        poolNo: 98,
        totalVolume: 2200,
        imageUrl: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80",
      },
    }),

    // ── FINANCIALS ──
    prisma.market.create({
      data: {
        title: "Will S&P 500 hit 6,500 in 2025?",
        description: "Resolves YES if the S&P 500 index closes above 6,500 on any trading day in 2025.",
        category: "FINANCIALS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 75,
        poolNo: 125,
        totalVolume: 11300,
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Brent crude oil exceed $90/barrel before July 2025?",
        description: "Resolves YES if Brent crude spot closes above $90 USD/barrel before July 1, 2025.",
        category: "FINANCIALS",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 105,
        poolNo: 95,
        totalVolume: 3700,
        imageUrl: "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will gold exceed $3,000/oz in 2025?",
        description: "Resolves YES if gold spot price (XAUUSD) closes above $3,000 per troy ounce during 2025.",
        category: "FINANCIALS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 70,
        poolNo: 130,
        totalVolume: 6100,
        imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
      },
    }),

    // ── TECH & SCIENCE ──
    prisma.market.create({
      data: {
        title: "Will OpenAI release GPT-5 in 2025?",
        description: "Resolves YES if OpenAI publicly releases (API or product) a model officially branded as GPT-5 during 2025.",
        category: "TECH_SCIENCE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 68,
        poolNo: 132,
        totalVolume: 14200,
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will an AI system pass a Turing test in 2025?",
        description: "Resolves YES if any AI system is declared to have passed a formal Turing test by a credible scientific body in 2025.",
        category: "TECH_SCIENCE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 130,
        poolNo: 70,
        totalVolume: 5800,
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will SpaceX Starship reach orbit successfully in 2025?",
        description: "Resolves YES if SpaceX Starship completes a full orbital trajectory and controlled reentry during 2025.",
        category: "TECH_SCIENCE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 60,
        poolNo: 140,
        totalVolume: 7400,
        imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",
      },
    }),

    // ── ENTERTAINMENT ──
    prisma.market.create({
      data: {
        title: "Will GTA 6 be released before October 2025?",
        description: "Resolves YES if Grand Theft Auto VI is available for purchase on any platform before October 1, 2025.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2025-10-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 92,
        poolNo: 108,
        totalVolume: 9800,
        imageUrl: "https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will a Norwegian film be nominated for an Oscar in 2026?",
        description: "Resolves YES if a Norwegian-produced film receives any Academy Award nomination for the 2026 ceremony.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2026-01-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 112,
        poolNo: 88,
        totalVolume: 1800,
        imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
      },
    }),
    prisma.market.create({
      data: {
        title: "Will Netflix subscriber count exceed 300M in 2025?",
        description: "Resolves YES if Netflix reports global paid subscriber count exceeding 300 million in any 2025 quarterly earnings.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 80,
        poolNo: 120,
        totalVolume: 4500,
        imageUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80",
      },
    }),
  ]);

  // ─── SIMULATE TRADES ────────────────────────────────
  // Add realistic trading activity to make the platform look alive

  const tradeData: Array<{
    marketIdx: number;
    userId: string;
    side: string;
    direction: string;
    amount: number;
    shares: number;
    price: number;
    daysAgo: number;
  }> = [];

  // Generate trades for top markets
  const activeMarketIndices = [0, 2, 3, 4, 5, 8, 11, 15, 18, 20, 23, 26, 28, 30];
  for (const idx of activeMarketIndices) {
    const numTrades = 5 + Math.floor(Math.random() * 15);
    for (let i = 0; i < numTrades; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const side = Math.random() > 0.45 ? "YES" : "NO";
      const amount = [10, 25, 50, 100][Math.floor(Math.random() * 4)];
      const price = 0.3 + Math.random() * 0.4; // 30-70 cents
      const shares = amount / price;
      tradeData.push({
        marketIdx: idx,
        userId: user.id,
        side,
        direction: "BUY",
        amount,
        shares,
        price,
        daysAgo: Math.floor(Math.random() * 14),
      });
    }
  }

  // Create trades in batches
  for (const td of tradeData) {
    const market = markets[td.marketIdx];
    if (!market) continue;
    await prisma.trade.create({
      data: {
        marketId: market.id,
        userId: td.userId,
        side: td.side,
        direction: td.direction,
        amount: td.amount,
        shares: td.shares,
        price: td.price,
        createdAt: new Date(Date.now() - td.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create positions for users who traded
  const positionMap = new Map<string, { shares: number; totalCost: number; count: number }>();
  for (const td of tradeData) {
    const market = markets[td.marketIdx];
    if (!market) continue;
    const key = `${td.userId}-${market.id}-${td.side}`;
    const existing = positionMap.get(key) ?? { shares: 0, totalCost: 0, count: 0 };
    existing.shares += td.shares;
    existing.totalCost += td.amount;
    existing.count += 1;
    positionMap.set(key, existing);
  }

  for (const [key, pos] of positionMap) {
    const [userId, marketId, side] = key.split("-");
    const avgPrice = pos.totalCost / pos.shares;
    await prisma.position.create({
      data: {
        userId: userId!,
        marketId: marketId!,
        side: side!,
        shares: pos.shares,
        avgPrice,
      },
    });
  }

  // Create some price snapshots for charts
  for (const market of markets) {
    const baseYes = market.poolYes / (market.poolYes + market.poolNo) * 100;
    for (let d = 14; d >= 0; d--) {
      const drift = (Math.random() - 0.5) * 6;
      const yes = Math.max(5, Math.min(95, Math.round(baseYes + drift)));
      await prisma.priceSnapshot.create({
        data: {
          marketId: market.id,
          yesPrice: yes,
          noPrice: 100 - yes,
          timestamp: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log(`  1 admin + ${users.length} users`);
  console.log(`  ${markets.length} prediction markets across 10 categories`);
  console.log(`  ${tradeData.length} simulated trades`);
  console.log(`  ${positionMap.size} positions`);
  console.log(`  ${markets.length * 15} price snapshots`);
  console.log("");
  console.log("  Login credentials:");
  console.log("  admin@vikingmarket.no / password123");
  console.log("  ola@example.no / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
