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

  await Promise.all([
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
  // 20 Norwegian-themed markets, 2 per category

  await prisma.market.createMany({
    data: [
      // ── POLITICS ──
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

      // ── SPORTS ──
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

      // ── CRYPTO ──
      {
        title: "Will Bitcoin exceed $150,000 before July 2025?",
        description:
          "Resolves YES if Bitcoin (BTC/USD) closes above $150,000 on any major exchange (Coinbase, Binance) before July 1, 2025.",
        category: "CRYPTO",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 85,
        poolNo: 115,
      },
      {
        title: "Will Norway introduce a CBDC (digital krone) pilot by 2026?",
        description:
          "Resolves YES if Norges Bank officially launches a central bank digital currency pilot program before January 1, 2026.",
        category: "CRYPTO",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 130,
        poolNo: 70,
      },

      // ── CLIMATE ──
      {
        title: "Will Oslo record a temperature above 30C in summer 2025?",
        description:
          "Resolves YES if Oslo-Blindern records a maximum temperature above 30.0C between June 1 and August 31, 2025.",
        category: "CLIMATE",
        closesAt: new Date("2025-08-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 95,
        poolNo: 105,
      },
      {
        title: "Will Arctic sea ice reach a new record low in 2025?",
        description:
          "Resolves YES if the September 2025 Arctic sea ice minimum (NSIDC data) is lower than the current record of 3.39 million sq km set in 2012.",
        category: "CLIMATE",
        closesAt: new Date("2025-10-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 115,
        poolNo: 85,
      },

      // ── ECONOMICS ──
      {
        title: "Will Norges Bank cut the key policy rate before October 2025?",
        description:
          "Resolves YES if Norges Bank announces a reduction in the key policy rate (styringsrenten) before October 1, 2025.",
        category: "ECONOMICS",
        closesAt: new Date("2025-10-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 75,
        poolNo: 125,
      },
      {
        title: "Will USD/NOK exchange rate drop below 10.00 in 2025?",
        description:
          "Resolves YES if the USD/NOK exchange rate closes below 10.00 on any trading day in 2025. Source: Norges Bank.",
        category: "ECONOMICS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 130,
        poolNo: 70,
      },

      // ── CULTURE ──
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
        title: "Will Norway finish top 10 in Eurovision 2025?",
        description:
          "Resolves YES if Norway's entry finishes in the top 10 of the Eurovision Song Contest 2025 Grand Final.",
        category: "CULTURE",
        closesAt: new Date("2025-05-17T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 100,
        poolNo: 100,
      },

      // ── COMPANIES ──
      {
        title: "Will Equinor's stock price exceed 350 NOK by end of 2025?",
        description:
          "Resolves YES if Equinor ASA (EQNR) closes above 350 NOK on the Oslo Boers on any trading day before December 31, 2025.",
        category: "COMPANIES",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 105,
        poolNo: 95,
      },
      {
        title: "Will Kahoot! be acquired by a foreign company in 2025?",
        description:
          "Resolves YES if Kahoot! ASA receives and accepts a formal acquisition offer from a non-Norwegian company during 2025.",
        category: "COMPANIES",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 140,
        poolNo: 60,
      },

      // ── FINANCIALS ──
      {
        title: "Will Brent crude oil exceed $90/barrel before July 2025?",
        description:
          "Resolves YES if the Brent crude oil spot price closes above $90 USD per barrel on any trading day before July 1, 2025.",
        category: "FINANCIALS",
        closesAt: new Date("2025-07-01T00:00:00Z"),
        createdById: admin.id,
        featured: true,
        poolYes: 105,
        poolNo: 95,
      },
      {
        title: "Will Oslo Boers main index (OBX) hit a new all-time high in 2025?",
        description:
          "Resolves YES if the OBX Total Return Index sets a new all-time closing high at any point during 2025.",
        category: "FINANCIALS",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 70,
        poolNo: 130,
      },

      // ── TECH & SCIENCE ──
      {
        title: "Will a Norwegian research team publish a breakthrough in battery tech in 2025?",
        description:
          "Resolves YES if a Norwegian university or institute (NTNU, SINTEF, UiO) publishes peer-reviewed research on solid-state batteries cited in Nature/Science in 2025.",
        category: "TECH_SCIENCE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 120,
        poolNo: 80,
      },
      {
        title: "Will Norway's 5G coverage reach 90% of the population by end of 2025?",
        description:
          "Resolves YES if Nkom (Norwegian Communications Authority) reports 90%+ population 5G coverage by December 31, 2025.",
        category: "TECH_SCIENCE",
        closesAt: new Date("2025-12-31T00:00:00Z"),
        createdById: admin.id,
        poolYes: 90,
        poolNo: 110,
      },

      // ── ENTERTAINMENT ──
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
      {
        title: "Will a Norwegian film be nominated for an Oscar in 2026?",
        description:
          "Resolves YES if a Norwegian-produced film receives an Academy Award nomination in any category for the 2026 ceremony.",
        category: "ENTERTAINMENT",
        closesAt: new Date("2026-01-15T00:00:00Z"),
        createdById: admin.id,
        poolYes: 110,
        poolNo: 90,
      },
    ],
  });

  console.log("Seed complete!");
  console.log(`  1 admin + 4 users`);
  console.log(`  20 Norwegian prediction markets (10 categories)`);
  console.log("");
  console.log("  Login credentials:");
  console.log("  admin@norskpredikt.no / password123");
  console.log("  ola@example.no / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
