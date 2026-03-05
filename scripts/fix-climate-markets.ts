/**
 * Fix Climate Markets — Replace policy-based climate markets with
 * Kalshi-style weather/climate markets adapted for Norway
 *
 * Kalshi-style climate = weather data markets:
 * - Temperature (daily highs, monthly records, seasonal milestones)
 * - Precipitation (snow, rain, monthly totals)
 * - Storms and extreme weather
 * - Climate change data (global temp records, Arctic warming)
 *
 * Norwegian data sources: MET Norway (yr.no), Meteorologisk institutt
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
  return "mkt_" + Math.random().toString(36).slice(2, 14);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// AMM pool setup from probability
function poolsFromProb(prob: number, liquidity: number = 1000) {
  const poolNo = liquidity;
  const poolYes = poolNo * ((1 - prob) / prob);
  return { poolYes, poolNo };
}

interface MarketDef {
  title: string;
  description: string;
  category: string;
  prob: number;
  volume: number;
  closesAt: Date;
  imageUrl: string;
  region: "NO" | "INT";
  resolutionSources?: string;
}

const newClimateMarkets: MarketDef[] = [
  // ═══════════════════════════════════════════
  // NORWEGIAN TEMPERATURE MARKETS
  // ═══════════════════════════════════════════
  {
    title: "Oslo daily high above 20°C before May 15?",
    description: "Resolves YES if the official MET Norway weather station at Blindern records a daily maximum temperature above 20°C on any day before May 15, 2026.",
    category: "CLIMATE", prob: 0.35, volume: 42000,
    closesAt: daysFromNow(72),
    imageUrl: "https://images.unsplash.com/photo-1561647784-2f9c43b07a0b?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway (Blindern station) daily climate report",
  },
  {
    title: "Bergen March 2026: total rainfall above 200mm?",
    description: "Resolves YES if Bergen Florida weather station records total precipitation above 200mm for the calendar month of March 2026.",
    category: "CLIMATE", prob: 0.55, volume: 38500,
    closesAt: daysFromNow(28),
    imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway monthly precipitation data (Bergen Florida station)",
  },
  {
    title: "Tromsø to record -20°C or colder in March 2026?",
    description: "Resolves YES if the official Tromsø weather station records a minimum temperature of -20°C or below during March 2026.",
    category: "CLIMATE", prob: 0.22, volume: 29800,
    closesAt: daysFromNow(28),
    imageUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway daily minimum temperature (Tromsø station)",
  },
  {
    title: "First 25°C day in Oslo before June 1?",
    description: "Resolves YES if Oslo Blindern station records a daily maximum of 25°C or above before June 1, 2026. This marks the unofficial start of Norwegian summer.",
    category: "CLIMATE", prob: 0.25, volume: 51200,
    closesAt: daysFromNow(89),
    imageUrl: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway daily climate report (Blindern station)",
  },
  {
    title: "Svalbard average temperature above 0°C in March 2026?",
    description: "Resolves YES if the monthly average temperature at Longyearbyen weather station is above 0°C for March 2026. Would be historically unusual and a sign of Arctic warming.",
    category: "CLIMATE", prob: 0.15, volume: 35600,
    closesAt: daysFromNow(28),
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway monthly climate data (Longyearbyen station)",
  },

  // ═══════════════════════════════════════════
  // NORWEGIAN PRECIPITATION & SNOW
  // ═══════════════════════════════════════════
  {
    title: "Oslo to get 30+ cm snow in a single day before April?",
    description: "Resolves YES if any single day before April 1, 2026 sees 30cm or more of new snowfall recorded at Oslo Blindern station.",
    category: "CLIMATE", prob: 0.12, volume: 28900,
    closesAt: daysFromNow(28),
    imageUrl: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway daily snowfall data (Blindern station)",
  },
  {
    title: "Bergen April 2026 rainfall: above or below 150mm?",
    description: "Resolves YES if total precipitation at Bergen Florida station exceeds 150mm in April 2026. Bergen averages ~170mm in April.",
    category: "CLIMATE", prob: 0.58, volume: 33400,
    closesAt: daysFromNow(58),
    imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e93e?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway monthly precipitation data (Bergen Florida station)",
  },
  {
    title: "Last snow in Oslo: before or after April 15?",
    description: "Resolves YES if the last recorded snowfall at Oslo Blindern in the 2025-2026 season occurs before April 15, 2026.",
    category: "CLIMATE", prob: 0.45, volume: 36700,
    closesAt: daysFromNow(75),
    imageUrl: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway daily snowfall observations (Blindern station)",
  },

  // ═══════════════════════════════════════════
  // NORWEGIAN EXTREME WEATHER / STORMS
  // ═══════════════════════════════════════════
  {
    title: "Named storm (ekstremvær) to hit Norway before June 2026?",
    description: "Resolves YES if MET Norway issues a named storm warning (ekstremvær) affecting mainland Norway before June 1, 2026. MET Norway names severe weather events since 1995.",
    category: "CLIMATE", prob: 0.65, volume: 44300,
    closesAt: daysFromNow(89),
    imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway named storm warnings (varsom.no)",
  },
  {
    title: "Red weather warning (rødt farevarsel) issued for any Norwegian county in spring 2026?",
    description: "Resolves YES if MET Norway issues a red-level weather warning for any county in Norway between March 1 and May 31, 2026. Red is the most severe warning level.",
    category: "CLIMATE", prob: 0.40, volume: 31200,
    closesAt: daysFromNow(89),
    imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway farevarsel system (yr.no/farevarsel)",
  },
  {
    title: "Flood warning for any major Norwegian river in spring 2026?",
    description: "Resolves YES if NVE (Norwegian Water Resources and Energy Directorate) issues an orange or red flood warning for any major river system in Norway during March-May 2026.",
    category: "CLIMATE", prob: 0.50, volume: 37800,
    closesAt: daysFromNow(89),
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
    region: "NO",
    resolutionSources: "NVE flood warning system (varsom.no/flom)",
  },

  // ═══════════════════════════════════════════
  // NORWEGIAN SEASONAL / CLIMATE MILESTONES
  // ═══════════════════════════════════════════
  {
    title: "Norway summer 2026: warmest on record?",
    description: "Resolves YES if the June-August 2026 average temperature across Norway is the highest ever recorded, per MET Norway's national average.",
    category: "CLIMATE", prob: 0.18, volume: 52100,
    closesAt: daysFromNow(200),
    imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway seasonal climate summary",
  },
  {
    title: "Nordkapp: midnight sun temperature above 15°C in June 2026?",
    description: "Resolves YES if the weather station nearest to Nordkapp records a temperature above 15°C during any midnight-sun hour (midnight ±2 hours) in June 2026.",
    category: "CLIMATE", prob: 0.20, volume: 27600,
    closesAt: daysFromNow(120),
    imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
    region: "NO",
    resolutionSources: "MET Norway hourly temperature data (Honningsvåg station)",
  },

  // ═══════════════════════════════════════════
  // INTERNATIONAL CLIMATE DATA MARKETS
  // ═══════════════════════════════════════════
  {
    title: "2026 global average temperature: above +1.5°C pre-industrial?",
    description: "Resolves YES if the NASA GISS Land-Ocean Temperature Index for 2026 is above 1.5°C anomaly relative to the 1850-1900 baseline.",
    category: "CLIMATE", prob: 0.55, volume: 68300,
    closesAt: daysFromNow(330),
    imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
    region: "INT",
    resolutionSources: "NASA GISS Land-Ocean Temperature Index (annual)",
  },
  {
    title: "2026 to be hottest year on record globally?",
    description: "Resolves YES if NASA or NOAA declares 2026 the hottest year on record, surpassing all previous years.",
    category: "CLIMATE", prob: 0.38, volume: 56300,
    closesAt: daysFromNow(330),
    imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
    region: "INT",
    resolutionSources: "NASA GISS or NOAA annual global temperature announcement",
  },
  {
    title: "Arctic sea ice minimum 2026: below 4 million km²?",
    description: "Resolves YES if the September 2026 Arctic sea ice extent minimum falls below 4 million km², as reported by NSIDC.",
    category: "CLIMATE", prob: 0.30, volume: 41200,
    closesAt: daysFromNow(220),
    imageUrl: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&q=80",
    region: "INT",
    resolutionSources: "NSIDC (National Snow and Ice Data Center) Arctic Sea Ice Index",
  },
  {
    title: "Category 4+ hurricane to make US landfall in 2026?",
    description: "Resolves YES if a Category 4 or higher hurricane on the Saffir-Simpson scale makes landfall in the continental United States during the 2026 Atlantic hurricane season.",
    category: "CLIMATE", prob: 0.25, volume: 47800,
    closesAt: daysFromNow(280),
    imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
    region: "INT",
    resolutionSources: "National Hurricane Center (NHC) official advisories",
  },
  {
    title: "Atlantic hurricane season 2026: above-average (>14 named storms)?",
    description: "Resolves YES if the 2026 Atlantic hurricane season produces more than 14 named storms, exceeding the 30-year average.",
    category: "CLIMATE", prob: 0.45, volume: 39500,
    closesAt: daysFromNow(300),
    imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
    region: "INT",
    resolutionSources: "NOAA / National Hurricane Center season summary",
  },
  {
    title: "Europe to experience a 40°C+ heatwave in summer 2026?",
    description: "Resolves YES if any official weather station in the EU/EEA records a temperature at or above 40°C between June 1 and August 31, 2026.",
    category: "CLIMATE", prob: 0.72, volume: 43600,
    closesAt: daysFromNow(200),
    imageUrl: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80",
    region: "INT",
    resolutionSources: "ECMWF / national meteorological services daily reports",
  },
  {
    title: "El Niño or La Niña: which dominates Q3 2026?",
    description: "Resolves YES for El Niño if the Oceanic Niño Index (ONI) average for Jul-Aug-Sep 2026 is +0.5°C or above. Resolves NO if neutral or La Niña.",
    category: "CLIMATE", prob: 0.35, volume: 36900,
    closesAt: daysFromNow(230),
    imageUrl: "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80",
    region: "INT",
    resolutionSources: "NOAA Climate Prediction Center Oceanic Niño Index (ONI)",
  },
  {
    title: "Atmospheric CO₂ at Mauna Loa to exceed 430 ppm monthly average in 2026?",
    description: "Resolves YES if any monthly average CO₂ reading at NOAA's Mauna Loa Observatory exceeds 430 parts per million during 2026.",
    category: "CLIMATE", prob: 0.60, volume: 34500,
    closesAt: daysFromNow(310),
    imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
    region: "INT",
    resolutionSources: "NOAA Mauna Loa CO₂ monthly mean data",
  },
];

async function main() {
  console.log("🌡️  Climate Markets Overhaul");
  console.log("============================\n");

  // ─── 1. Delete old climate markets ──────────────────
  const oldClimateMarkets = await prisma.market.findMany({
    where: { category: "CLIMATE" },
    select: { id: true, title: true },
  });

  console.log(`Found ${oldClimateMarkets.length} existing climate markets to replace:`);
  for (const m of oldClimateMarkets) {
    console.log(`  ✗ "${m.title}"`);
  }

  if (oldClimateMarkets.length > 0) {
    const ids = oldClimateMarkets.map((m) => m.id);
    // Delete related data first (trades, positions, snapshots, comments, orders)
    for (const id of ids) {
      await prisma.$executeRawUnsafe(`DELETE FROM Trade WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM Position WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM PriceSnapshot WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM Comment WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM "Order" WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM Dispute WHERE marketId = ?`, id);
      await prisma.$executeRawUnsafe(`DELETE FROM Ledger WHERE marketId = ?`, id);
    }
    // Delete the markets
    await prisma.market.deleteMany({ where: { category: "CLIMATE" } });
    console.log(`  ✅ Deleted ${oldClimateMarkets.length} old climate markets and related data\n`);
  }

  // ─── 2. Create new climate markets ──────────────────
  console.log(`Creating ${newClimateMarkets.length} new Kalshi-style climate markets...\n`);

  for (const m of newClimateMarkets) {
    const { poolYes, poolNo } = poolsFromProb(m.prob);
    const daysActive = Math.floor(Math.random() * 40) + 30;
    const createdAt = new Date(Date.now() - daysActive * 86400000);

    await prisma.market.create({
      data: {
        id: randomId(),
        title: m.title,
        description: m.description,
        category: m.category,
        status: "OPEN",
        poolYes,
        poolNo,
        totalVolume: m.volume,
        closesAt: m.closesAt,
        createdAt,
        imageUrl: m.imageUrl,
        region: m.region,
        resolutionSources: m.resolutionSources ?? null,
        createdById: "admin_andreas",
      },
    });

    console.log(`  ✓ ${m.region === "NO" ? "🇳🇴" : "🌍"} ${m.title}`);
  }

  console.log(`\n  ✅ Created ${newClimateMarkets.length} new climate markets`);

  // ─── 3. Summary ─────────────────────────────────────
  const noCount = newClimateMarkets.filter((m) => m.region === "NO").length;
  const intCount = newClimateMarkets.filter((m) => m.region === "INT").length;

  console.log(`\n  Norwegian: ${noCount} markets`);
  console.log(`  International: ${intCount} markets`);
  console.log(`\n  Categories covered:`);
  console.log(`  - Temperature (daily highs, records, milestones)`);
  console.log(`  - Precipitation (rain, snow, monthly totals)`);
  console.log(`  - Extreme weather (storms, floods, warnings)`);
  console.log(`  - Climate data (global temps, CO₂, sea ice, ENSO)`);
  console.log(`  - Hurricane season (US landfall, storm counts)`);

  const totalMarkets = await prisma.market.count();
  console.log(`\n  Total markets in database: ${totalMarkets}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
