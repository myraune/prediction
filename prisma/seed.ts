import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear all data
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
      email: "admin@norskpredikt.no",
      name: "Admin Nordmann",
      hashedPassword,
      role: "ADMIN",
      balance: 10000,
    },
  });

  const [ola, kari, erik, ingrid] = await Promise.all([
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
  ]);

  // ─── MARKETS ─────────────────────────────────────────

  // POLITICS
  await prisma.market.createMany({
    data: [
      {
        title: "Will Arbeiderpartiet lead the polls by September 2025?",
        description:
          "Resolves YES if Arbeiderpartiet (Ap) is the highest-polling party in any major Norwegian poll (NRK/Aftenposten/VG) published in September 2025.",
        category: "POLITICS",
        closesAt: new Date("2025-09-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 100,
        poolNo: 100,
      },
      {
        title: "Will Hoyre win the 2025 Stortinget election?",
        description:
          "Resolves YES if Hoyre (H) leads the governing coalition after the next Stortinget election.",
        category: "POLITICS",
        closesAt: new Date("2025-09-15T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 80,
        poolNo: 120,
      },
      {
        title: "Will MDG pass the sperregrense (4%) in the next election?",
        description:
          "Resolves YES if Miljoepartiet De Gronne (MDG) receives 4% or more of the national vote in the next Stortinget election.",
        category: "POLITICS",
        closesAt: new Date("2025-09-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 120,
        poolNo: 80,
      },

      // SPORTS
      {
        title: "Will Erling Haaland score 30+ Premier League goals in 2024/25?",
        description:
          "Resolves YES if Erling Braut Haaland scores 30 or more goals in the 2024/25 Premier League season (league matches only).",
        category: "SPORTS",
        closesAt: new Date("2025-05-25T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 90,
        poolNo: 110,
      },
      {
        title: "Will Norway qualify for the 2026 FIFA World Cup?",
        description:
          "Resolves YES if the Norwegian men's national football team qualifies for the 2026 FIFA World Cup.",
        category: "SPORTS",
        closesAt: new Date("2025-11-30T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 110,
        poolNo: 90,
      },
      {
        title: "Will Johannes Thingnes Boe win the 2025/26 Biathlon World Cup overall?",
        description:
          "Resolves YES if Johannes Thingnes Boe finishes first in the overall 2025/26 IBU Biathlon World Cup standings.",
        category: "SPORTS",
        closesAt: new Date("2026-03-22T00:00:00Z"),
        createdById: admin.id,
        poolYes: 70,
        poolNo: 130,
      },
      {
        title: "Will Bodoe/Glimt win Eliteserien 2025?",
        description:
          "Resolves YES if FK Bodoe/Glimt finishes first in the 2025 Norwegian Eliteserien table.",
        category: "SPORTS",
        closesAt: new Date("2025-12-01T00:00:00Z"),
        createdById: admin.id,
        poolYes: 85,
        poolNo: 115,
      },

      // ECONOMY
      {
        title: "Will Brent crude oil exceed $90/barrel before July 2025?",
        description:
          "Resolves YES if the Brent crude oil spot price closes above $90 USD per barrel on any trading day before July 1, 2025.",
        category: "ECONOMY",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 105,
        poolNo: 95,
      },
      {
        title: "Will USD/NOK exchange rate drop below 10.00 in 2025?",
        description:
          "Resolves YES if the USD/NOK exchange rate closes below 10.00 on any trading day in 2025. Source: Norges Bank.",
        category: "ECONOMY",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 130,
        poolNo: 70,
      },
      {
        title: "Will Norges Bank cut the key policy rate before October 2025?",
        description:
          "Resolves YES if Norges Bank announces a reduction in the key policy rate (styringsrenten) before October 1, 2025.",
        category: "ECONOMY",
        closesAt: new Date("2025-10-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 75,
        poolNo: 125,
      },

      // WEATHER
      {
        title: "Will Oslo record a temperature above 30C in summer 2025?",
        description:
          "Resolves YES if Oslo-Blindern records a maximum temperature above 30.0C between June 1 and August 31, 2025.",
        category: "WEATHER",
        closesAt: new Date("2025-08-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 95,
        poolNo: 105,
      },
      {
        title: "Will Tromsoe have a white Christmas in 2025?",
        description:
          "Resolves YES if there is measurable snow (>= 1 cm) at the Tromsoe weather station at 12:00 CET on December 25, 2025.",
        category: "WEATHER",
        closesAt: new Date("2025-12-25T00:00:00Z"),
        createdById: admin.id,
        poolYes: 60,
        poolNo: 140,
      },

      // CULTURE
      {
        title: "Will a Norwegian artist win a Grammy in 2026?",
        description:
          "Resolves YES if any Norwegian citizen or Norway-based artist wins a Grammy Award at the 2026 ceremony.",
        category: "CULTURE",
        closesAt: new Date("2026-02-08T00:00:00Z"),
        createdById: admin.id,
        poolYes: 115,
        poolNo: 85,
      },
      {
        title: "Will the Munch Museum surpass 1 million visitors in 2025?",
        description:
          "Resolves YES if MUNCH reports more than 1,000,000 total visitors for calendar year 2025.",
        category: "CULTURE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 110,
        poolNo: 90,
      },

      // ENTERTAINMENT
      {
        title: "Will Norway finish top 10 in Eurovision 2025?",
        description:
          "Resolves YES if Norway's entry finishes in the top 10 of the Eurovision Song Contest 2025 Grand Final.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2025-05-17T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 100,
        poolNo: 100,
      },
      {
        title: "Will Skam get a new season announced in 2025?",
        description:
          "Resolves YES if NRK officially announces a new season of 'Skam' at any point during 2025.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 140,
        poolNo: 60,
      },
    ],
  });

  console.log("Seed complete!");
  console.log(`  1 admin + 4 users`);
  console.log(`  16 Norwegian prediction markets`);
  console.log("");
  console.log("  Login credentials:");
  console.log("  admin@norskpredikt.no / password123");
  console.log("  ola@example.no / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
