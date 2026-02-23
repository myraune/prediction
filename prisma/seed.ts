import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

// ─── HELPERS ─────────────────────────────────────────────
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function daysFromNow(days: number) { return new Date(Date.now() + days * 86400000); }
function daysAgo(days: number) { return new Date(Date.now() - days * 86400000); }
function poolsFromProb(prob: number): { poolYes: number; poolNo: number } {
  return { poolYes: Math.round((1 - prob) * 100), poolNo: Math.round(prob * 100) };
}

// ─── MARKET DATA ──────────────────────────────────────────
interface MarketDef {
  title: string;
  description: string;
  category: string;
  prob: number;
  volume: number;
  closesAt: Date;
  featured?: boolean;
  imageUrl?: string;
  daysActive: number;
  region: "NO" | "INT";
}

// ═══════════════════════════════════════════════════════════
// ══ NORWEGIAN MARKETS ═════════════════════════════════════
// ═══════════════════════════════════════════════════════════

const NO_MARKETS: MarketDef[] = [

  // ── WINTER OLYMPICS 2026 — Milano Cortina (Feb 6–22) ─────
  // These are the HOT markets right now
  {
    title: "Norway to top the gold medal table at Milano Cortina 2026?",
    description: "Resolves YES if Norway wins the most gold medals at the 2026 Winter Olympics. Norway traditionally dominates winter sports — will they do it again?",
    category: "SPORTS", prob: 0.58, volume: 312000, closesAt: daysFromNow(1), featured: true, daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80", region: "NO",
  },
  {
    title: "Norway 40+ total medals at Milano Cortina 2026?",
    description: "Resolves YES if Norway wins 40 or more total medals (gold+silver+bronze) at the 2026 Winter Olympics.",
    category: "SPORTS", prob: 0.45, volume: 187000, closesAt: daysFromNow(1), featured: true, daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=800&q=80", region: "NO",
  },
  {
    title: "Johannes Høsflot Klæbo to win 3+ gold medals at Milano Cortina?",
    description: "Resolves YES if Klæbo wins 3 or more individual/relay golds at the 2026 Winter Olympics.",
    category: "SPORTS", prob: 0.28, volume: 145000, closesAt: daysFromNow(1), daysActive: 25, region: "NO",
  },
  {
    title: "Therese Johaug gold medal at Milano Cortina 2026?",
    description: "Resolves YES if Therese Johaug wins at least one gold medal at the 2026 Winter Olympics in her comeback season.",
    category: "SPORTS", prob: 0.35, volume: 167000, closesAt: daysFromNow(1), featured: true, daysActive: 25,
    imageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80", region: "NO",
  },
  {
    title: "Norway to break all-time Winter Olympics gold record at Milano Cortina?",
    description: "Resolves YES if Norway wins more than 17 golds (their record from Beijing 2022).",
    category: "SPORTS", prob: 0.32, volume: 98000, closesAt: daysFromNow(1), daysActive: 20, region: "NO",
  },
  {
    title: "Aleksander Aamodt Kilde to compete at Milano Cortina 2026?",
    description: "Resolves YES if Kilde competes in any alpine skiing event at the 2026 Winter Olympics after his injury recovery.",
    category: "SPORTS", prob: 0.55, volume: 89000, closesAt: daysFromNow(1), daysActive: 20, region: "NO",
  },

  // ── NORWEGIAN POLITICS — 2025 election already happened, focus on aftermath + 2026 ──
  {
    title: "Will Erna Solberg still be PM on July 1, 2026?",
    description: "Resolves YES if Erna Solberg remains Prime Minister of Norway on July 1, 2026.",
    category: "POLITICS", prob: 0.78, volume: 124000, closesAt: daysFromNow(130), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80", region: "NO",
  },
  {
    title: "Norway to formally begin NATO Arctic defense pact negotiations in 2026?",
    description: "Resolves YES if Norway enters formal negotiations on an Arctic-specific NATO defense agreement during 2026.",
    category: "POLITICS", prob: 0.42, volume: 67800, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Norway to increase defense spending above 2.5% of GDP in 2026 budget?",
    description: "Resolves YES if Norway's defense budget exceeds 2.5% of GDP in the 2026 national budget.",
    category: "POLITICS", prob: 0.58, volume: 54200, closesAt: daysFromNow(280), daysActive: 50, region: "NO",
  },
  {
    title: "Will Norway apply for EU membership before 2030?",
    description: "Resolves YES if the Norwegian government formally applies for EU membership before 2030. Current polls show increasing support.",
    category: "POLITICS", prob: 0.07, volume: 78500, closesAt: daysFromNow(310), daysActive: 80, region: "NO",
  },
  {
    title: "Norwegian government crisis or no-confidence vote in 2026?",
    description: "Resolves YES if the Storting holds a no-confidence vote against the government, or if the government resigns, during 2026.",
    category: "POLITICS", prob: 0.12, volume: 42100, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },
  {
    title: "Rødt (Red Party) to leave opposition pact before summer 2026?",
    description: "Resolves YES if Rødt breaks from the informal left-wing opposition coordination before June 30, 2026.",
    category: "POLITICS", prob: 0.18, volume: 28400, closesAt: daysFromNow(130), daysActive: 30, region: "NO",
  },

  // ── NORWEGIAN SPORTS (non-Olympics) ──────────────────────
  {
    title: "Erling Haaland Premier League top scorer 2025/26?",
    description: "Resolves YES if Haaland finishes as the PL top scorer for the 2025/26 season.",
    category: "SPORTS", prob: 0.35, volume: 156000, closesAt: daysFromNow(100), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80", region: "NO",
  },
  {
    title: "Martin Ødegaard to win PFA Player of the Year 2025/26?",
    description: "Resolves YES if Martin Ødegaard wins the PFA Players' Player of the Year award for 2025/26.",
    category: "SPORTS", prob: 0.15, volume: 78400, closesAt: daysFromNow(120), daysActive: 40, region: "NO",
  },
  {
    title: "Bodø/Glimt to win Eliteserien 2026?",
    description: "Resolves YES if FK Bodø/Glimt wins the Norwegian Eliteserien football league in 2026.",
    category: "SPORTS", prob: 0.30, volume: 45800, closesAt: daysFromNow(280), daysActive: 15, region: "NO",
  },
  {
    title: "Jakob Ingebrigtsen to break 1500m world record in 2026?",
    description: "Resolves YES if Jakob Ingebrigtsen sets a new 1500m world record during the 2026 outdoor season.",
    category: "SPORTS", prob: 0.22, volume: 52300, closesAt: daysFromNow(200), daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80", region: "NO",
  },
  {
    title: "Viktor Hovland to win a golf Major in 2026?",
    description: "Resolves YES if Viktor Hovland wins The Masters, PGA Championship, US Open, or The Open in 2026.",
    category: "SPORTS", prob: 0.12, volume: 41200, closesAt: daysFromNow(200), daysActive: 40, region: "NO",
  },

  // ── NORWEGIAN ECONOMY & FINANCE ───────────────────────
  {
    title: "Norges Bank to cut rates to 3.75% or below by June 2026?",
    description: "Resolves YES if the Norwegian central bank cuts the key policy rate to 3.75% or below before July 1, 2026. Current rate: 4.25%.",
    category: "ECONOMICS", prob: 0.62, volume: 134000, closesAt: daysFromNow(130), featured: true, daysActive: 70,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80", region: "NO",
  },
  {
    title: "NOK/EUR below 11.00 by summer 2026?",
    description: "Resolves YES if the Norwegian krone strengthens below 11.00 against the euro before July 1, 2026.",
    category: "FINANCIALS", prob: 0.28, volume: 72400, closesAt: daysFromNow(130), daysActive: 55, region: "NO",
  },
  {
    title: "Oslo housing prices: Will spring 2026 see 3%+ quarterly growth?",
    description: "Resolves YES if Oslo housing prices rise more than 3% from Q1 to Q2 2026 per Eiendom Norge.",
    category: "ECONOMICS", prob: 0.42, volume: 94200, closesAt: daysFromNow(130), featured: true, daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", region: "NO",
  },
  {
    title: "Norway's sovereign wealth fund above 20 trillion NOK in 2026?",
    description: "Resolves YES if the Government Pension Fund Global exceeds 20 trillion NOK in market value during 2026.",
    category: "ECONOMICS", prob: 0.62, volume: 78200, closesAt: daysFromNow(310), daysActive: 65, region: "NO",
  },
  {
    title: "Brent crude above $85/barrel in March 2026?",
    description: "Resolves YES if Brent crude oil closes above $85/barrel on any trading day in March 2026.",
    category: "FINANCIALS", prob: 0.55, volume: 68900, closesAt: daysFromNow(37), daysActive: 25,
    imageUrl: "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=800&q=80", region: "NO",
  },
  {
    title: "Equinor Q1 2026 earnings above 10B NOK?",
    description: "Resolves YES if Equinor reports Q1 2026 adjusted earnings above 10 billion NOK.",
    category: "COMPANIES", prob: 0.55, volume: 52100, closesAt: daysFromNow(60), daysActive: 30, region: "NO",
  },
  {
    title: "Oslo Børs (OBX) new all-time high in H1 2026?",
    description: "Resolves YES if the OBX index sets a new all-time high before July 1, 2026.",
    category: "FINANCIALS", prob: 0.48, volume: 63400, closesAt: daysFromNow(130), daysActive: 50, region: "NO",
  },
  {
    title: "Norwegian CPI inflation below 3.0% by March 2026?",
    description: "Resolves YES if Norwegian CPI (12-month growth) falls below 3.0% in the March 2026 reading.",
    category: "ECONOMICS", prob: 0.45, volume: 44700, closesAt: daysFromNow(45), daysActive: 25, region: "NO",
  },
  {
    title: "South Norway electricity: average above 80 øre/kWh in March 2026?",
    description: "Resolves YES if the average spot price (NO2 area) exceeds 80 øre/kWh for March 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 82400, closesAt: daysFromNow(37), daysActive: 20, region: "NO",
  },
  {
    title: "Norwegian salmon price above 130 NOK/kg in Q1 2026?",
    description: "Resolves YES if the salmon spot price exceeds 130 NOK/kg at any point in Q1 2026.",
    category: "FINANCIALS", prob: 0.38, volume: 38400, closesAt: daysFromNow(37), daysActive: 25, region: "NO",
  },

  // ── NORWEGIAN TECH, COMPANIES & CLIMATE ──────────
  {
    title: "Kahoot! to be acquired or taken private in 2026?",
    description: "Resolves YES if Kahoot! is acquired or delisted from the Oslo Stock Exchange during 2026.",
    category: "COMPANIES", prob: 0.18, volume: 31200, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Norwegian tech startup to reach unicorn ($1B+) status in H1 2026?",
    description: "Resolves YES if a Norwegian tech company achieves a $1B+ valuation before July 2026.",
    category: "TECH_SCIENCE", prob: 0.25, volume: 44100, closesAt: daysFromNow(130), daysActive: 50, region: "NO",
  },
  {
    title: "Norway to win Eurovision 2026 in Basel?",
    description: "Resolves YES if Norway wins the Eurovision Song Contest 2026, held in Basel, Switzerland in May.",
    category: "CULTURE", prob: 0.06, volume: 67200, closesAt: daysFromNow(80), featured: true, daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", region: "NO",
  },
  {
    title: "Electric car share above 96% of new sales in Norway in any month 2026?",
    description: "Resolves YES if EVs account for more than 96% of new car registrations in Norway during any month in 2026.",
    category: "TECH_SCIENCE", prob: 0.72, volume: 41200, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "North Sea offshore wind: physical construction to begin in 2026?",
    description: "Resolves YES if physical construction begins on a Norwegian offshore wind project in the North Sea during 2026.",
    category: "CLIMATE", prob: 0.42, volume: 44100, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Norway's Langskip CCS plant to reach full capacity in 2026?",
    description: "Resolves YES if the Langskip/Northern Lights carbon capture facility reaches full operational capacity in 2026.",
    category: "CLIMATE", prob: 0.48, volume: 35200, closesAt: daysFromNow(310), daysActive: 50, region: "NO",
  },
  {
    title: "DNB to offer crypto trading in its mobile app in 2026?",
    description: "Resolves YES if DNB Bank offers cryptocurrency trading directly in its mobile app by end of 2026.",
    category: "CRYPTO", prob: 0.18, volume: 36400, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Norway 2026 emissions: at least 3% decrease vs 2025?",
    description: "Resolves YES if Norway's greenhouse gas emissions decrease by at least 3% in 2026 compared to 2025.",
    category: "CLIMATE", prob: 0.28, volume: 38900, closesAt: daysFromNow(350), daysActive: 50, region: "NO",
  },
  {
    title: "Mowi stock above 220 NOK by April 2026?",
    description: "Resolves YES if Mowi ASA closes above 220 NOK on the Oslo Stock Exchange before May 1, 2026.",
    category: "COMPANIES", prob: 0.42, volume: 29800, closesAt: daysFromNow(70), daysActive: 35, region: "NO",
  },
  {
    title: "Nel ASA to announce major green hydrogen deal (>1B NOK) in 2026?",
    description: "Resolves YES if Nel ASA announces a contract or partnership exceeding 1 billion NOK in 2026.",
    category: "COMPANIES", prob: 0.22, volume: 31800, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Norwegian film to win at Berlin or Cannes 2026?",
    description: "Resolves YES if a Norwegian film wins a major prize at Berlin International Film Festival or Cannes Film Festival 2026.",
    category: "ENTERTAINMENT", prob: 0.10, volume: 28400, closesAt: daysFromNow(100), daysActive: 35, region: "NO",
  },
  {
    title: "NRK to launch AI-powered news service in 2026?",
    description: "Resolves YES if NRK officially launches an AI-based personalized news product during 2026.",
    category: "ENTERTAINMENT", prob: 0.35, volume: 22800, closesAt: daysFromNow(310), daysActive: 25, region: "NO",
  },
];

// ═══════════════════════════════════════════════════════════
// ══ INTERNATIONAL MARKETS ═════════════════════════════════
// ═══════════════════════════════════════════════════════════

const INT_MARKETS: MarketDef[] = [

  // ── WINTER OLYMPICS 2026 — International angle ─────
  {
    title: "USA to finish top 3 in total medals at Milano Cortina 2026?",
    description: "Resolves YES if the United States finishes with the 3rd most or more total medals at the 2026 Winter Olympics.",
    category: "SPORTS", prob: 0.62, volume: 145000, closesAt: daysFromNow(1), featured: true, daysActive: 25,
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80", region: "INT",
  },
  {
    title: "Any country to win 20+ gold medals at Milano Cortina 2026?",
    description: "Resolves YES if any single country wins 20 or more gold medals at the 2026 Winter Olympics.",
    category: "SPORTS", prob: 0.15, volume: 89000, closesAt: daysFromNow(1), daysActive: 20, region: "INT",
  },
  {
    title: "Mikaela Shiffrin to win gold at Milano Cortina 2026?",
    description: "Resolves YES if Mikaela Shiffrin wins at least one gold medal at the 2026 Winter Olympics.",
    category: "SPORTS", prob: 0.45, volume: 112000, closesAt: daysFromNow(1), daysActive: 25, region: "INT",
  },

  // ── INTL POLITICS ────────────────────────────────────
  {
    title: "Ukraine-Russia ceasefire agreement by June 2026?",
    description: "Resolves YES if Ukraine and Russia agree to a formal ceasefire (not just peace talks) before July 1, 2026.",
    category: "POLITICS", prob: 0.18, volume: 234000, closesAt: daysFromNow(130), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=800&q=80", region: "INT",
  },
  {
    title: "Trump to announce 2026 tariff increases on EU goods?",
    description: "Resolves YES if the Trump administration announces new tariffs specifically targeting EU imports before April 2026.",
    category: "POLITICS", prob: 0.65, volume: 87400, closesAt: daysFromNow(45), featured: true, daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80", region: "INT",
  },
  {
    title: "US Congress to pass new AI regulation in 2026?",
    description: "Resolves YES if the US Congress passes comprehensive AI regulation (not just executive orders) during 2026.",
    category: "POLITICS", prob: 0.22, volume: 56800, closesAt: daysFromNow(310), daysActive: 40, region: "INT",
  },
  {
    title: "Republicans to lose House majority in 2026 midterms?",
    description: "Resolves YES if the Democratic Party wins a majority in the U.S. House following the November 2026 midterm elections.",
    category: "POLITICS", prob: 0.52, volume: 178000, closesAt: daysFromNow(280), daysActive: 60, region: "INT",
  },
  {
    title: "India-Pakistan: will military tensions escalate to strikes in 2026?",
    description: "Resolves YES if India or Pakistan conducts military strikes against the other's territory during 2026.",
    category: "POLITICS", prob: 0.18, volume: 98000, closesAt: daysFromNow(310), daysActive: 25, region: "INT",
  },
  {
    title: "EU to impose digital services tax above 5% in 2026?",
    description: "Resolves YES if the EU passes a digital services tax exceeding 5% on major tech companies during 2026.",
    category: "POLITICS", prob: 0.30, volume: 34500, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },

  // ── INTL SPORTS ──────────────────────────────────────
  {
    title: "2026 FIFA World Cup: Will the host nation USA reach the semis?",
    description: "Resolves YES if the United States reaches the semifinal round of the 2026 FIFA World Cup (June-July 2026).",
    category: "SPORTS", prob: 0.30, volume: 198000, closesAt: daysFromNow(150), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80", region: "INT",
  },
  {
    title: "2026 World Cup: Argentina to defend their title?",
    description: "Resolves YES if Argentina wins the 2026 FIFA World Cup, defending their 2022 title.",
    category: "SPORTS", prob: 0.18, volume: 167000, closesAt: daysFromNow(150), daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8d6f2b?w=800&q=80", region: "INT",
  },
  {
    title: "Lewis Hamilton to win a race for Ferrari in 2026?",
    description: "Resolves YES if Lewis Hamilton wins at least one F1 Grand Prix driving for Ferrari in 2026.",
    category: "SPORTS", prob: 0.55, volume: 89000, closesAt: daysFromNow(300), daysActive: 40, region: "INT",
  },
  {
    title: "Real Madrid to win Champions League 2025/26?",
    description: "Resolves YES if Real Madrid wins the 2025/26 UEFA Champions League final in May 2026.",
    category: "SPORTS", prob: 0.22, volume: 67500, closesAt: daysFromNow(90), daysActive: 35, region: "INT",
  },

  // ── INTL CRYPTO ──────────────────────────────────────
  {
    title: "Bitcoin above $150K by end of 2026?",
    description: "Resolves YES if BTC/USD closes above $150,000 before December 31, 2026.",
    category: "CRYPTO", prob: 0.48, volume: 345000, closesAt: daysFromNow(310), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80", region: "INT",
  },
  {
    title: "Bitcoin above $120K by April 2026?",
    description: "Resolves YES if BTC/USD trades above $120,000 at any point before May 1, 2026.",
    category: "CRYPTO", prob: 0.55, volume: 267000, closesAt: daysFromNow(70), daysActive: 45, region: "INT",
  },
  {
    title: "Ethereum above $5,000 by summer 2026?",
    description: "Resolves YES if ETH/USD trades above $5,000 at any point before July 1, 2026.",
    category: "CRYPTO", prob: 0.38, volume: 134000, closesAt: daysFromNow(130), daysActive: 55, region: "INT",
  },
  {
    title: "US stablecoin regulation bill to pass in 2026?",
    description: "Resolves YES if Congress passes a comprehensive stablecoin regulatory framework during 2026.",
    category: "CRYPTO", prob: 0.58, volume: 67800, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "Crypto total market cap above $5 trillion in 2026?",
    description: "Resolves YES if total cryptocurrency market cap exceeds $5 trillion at any point during 2026.",
    category: "CRYPTO", prob: 0.42, volume: 89000, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
  },
  {
    title: "Solana to flip Ethereum in daily transaction volume in 2026?",
    description: "Resolves YES if Solana processes more daily transactions than Ethereum mainnet for 7 consecutive days during 2026.",
    category: "CRYPTO", prob: 0.35, volume: 45600, closesAt: daysFromNow(310), daysActive: 30, region: "INT",
  },

  // ── INTL TECH ────────────────────────────────────────
  {
    title: "OpenAI to release GPT-5 before July 2026?",
    description: "Resolves YES if OpenAI releases a model officially branded as GPT-5 before July 1, 2026.",
    category: "TECH_SCIENCE", prob: 0.58, volume: 178000, closesAt: daysFromNow(130), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", region: "INT",
  },
  {
    title: "Anthropic valuation above $100B in next funding round?",
    description: "Resolves YES if Anthropic's valuation exceeds $100 billion in any 2026 funding round or secondary sale.",
    category: "TECH_SCIENCE", prob: 0.55, volume: 67800, closesAt: daysFromNow(310), daysActive: 40, region: "INT",
  },
  {
    title: "Apple to ship Vision Pro 2 (or cheaper headset) in 2026?",
    description: "Resolves YES if Apple releases a second-generation or lower-cost Vision headset during 2026.",
    category: "TECH_SCIENCE", prob: 0.42, volume: 58200, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "Tesla Full Self-Driving Level 4 approval in any US state by 2026?",
    description: "Resolves YES if Tesla receives Level 4 autonomous driving approval in any US state during 2026.",
    category: "TECH_SCIENCE", prob: 0.15, volume: 112000, closesAt: daysFromNow(310), daysActive: 65, region: "INT",
  },
  {
    title: "First AI model to score 90%+ on ARC-AGI benchmark in 2026?",
    description: "Resolves YES if any AI model achieves 90%+ accuracy on the ARC-AGI benchmark during 2026.",
    category: "TECH_SCIENCE", prob: 0.48, volume: 56300, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },

  // ── INTL ECONOMICS & FINANCE ─────────────────────────
  {
    title: "Fed to cut rates in March 2026?",
    description: "Resolves YES if the Federal Reserve cuts the federal funds rate at the March 2026 FOMC meeting.",
    category: "ECONOMICS", prob: 0.38, volume: 198000, closesAt: daysFromNow(25), featured: true, daysActive: 30, region: "INT",
  },
  {
    title: "S&P 500 above 6,500 by end of March 2026?",
    description: "Resolves YES if the S&P 500 closes above 6,500 on the last trading day of March 2026.",
    category: "ECONOMICS", prob: 0.52, volume: 156000, closesAt: daysFromNow(37), daysActive: 25,
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80", region: "INT",
  },
  {
    title: "US recession (2 consecutive GDP decline quarters) in 2026?",
    description: "Resolves YES if the US experiences two consecutive quarters of real GDP decline during 2026.",
    category: "ECONOMICS", prob: 0.25, volume: 134000, closesAt: daysFromNow(330), daysActive: 60, region: "INT",
  },
  {
    title: "Gold above $3,200/oz in Q1 2026?",
    description: "Resolves YES if gold spot price closes above $3,200/oz at any point before April 1, 2026.",
    category: "ECONOMICS", prob: 0.65, volume: 89000, closesAt: daysFromNow(37), daysActive: 25, region: "INT",
  },
  {
    title: "EUR/USD above 1.10 by April 2026?",
    description: "Resolves YES if EUR/USD rises above 1.10 at any point before May 1, 2026.",
    category: "FINANCIALS", prob: 0.42, volume: 56300, closesAt: daysFromNow(70), daysActive: 35, region: "INT",
  },
  {
    title: "Japanese Yen to strengthen below 145/USD by mid-2026?",
    description: "Resolves YES if USD/JPY drops below 145 at any point before July 1, 2026.",
    category: "FINANCIALS", prob: 0.35, volume: 42800, closesAt: daysFromNow(130), daysActive: 40, region: "INT",
  },
  {
    title: "Dollar index (DXY) below 100 by June 2026?",
    description: "Resolves YES if the U.S. Dollar Index drops below 100 before July 1, 2026.",
    category: "FINANCIALS", prob: 0.28, volume: 45600, closesAt: daysFromNow(130), daysActive: 35, region: "INT",
  },

  // ── INTL COMPANIES & ENTERTAINMENT ───────────────────
  {
    title: "Nvidia market cap above $4 trillion by March 2026?",
    description: "Resolves YES if Nvidia's market cap exceeds $4 trillion before April 1, 2026.",
    category: "COMPANIES", prob: 0.48, volume: 145000, closesAt: daysFromNow(37), featured: true, daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=800&q=80", region: "INT",
  },
  {
    title: "OpenAI IPO in 2026?",
    description: "Resolves YES if OpenAI completes an IPO on a major exchange during 2026.",
    category: "COMPANIES", prob: 0.22, volume: 89000, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
  },
  {
    title: "Tesla stock above $400 by April 2026?",
    description: "Resolves YES if TSLA closes above $400 before May 1, 2026.",
    category: "COMPANIES", prob: 0.52, volume: 112000, closesAt: daysFromNow(70), daysActive: 40, region: "INT",
  },
  {
    title: "TikTok still operational in the US on June 1, 2026?",
    description: "Resolves YES if TikTok is available to US users on June 1, 2026.",
    category: "COMPANIES", prob: 0.72, volume: 134000, closesAt: daysFromNow(100), daysActive: 60, region: "INT",
  },
  {
    title: "GTA 6: will it be released before October 2026?",
    description: "Resolves YES if Grand Theft Auto VI is available for purchase before October 1, 2026.",
    category: "ENTERTAINMENT", prob: 0.55, volume: 198000, closesAt: daysFromNow(220), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=800&q=80", region: "INT",
  },
  {
    title: "Nintendo Switch 2 to sell 10M+ units in first 3 months?",
    description: "Resolves YES if the Switch 2 sells 10 million+ units within its first 3 months on sale in 2026.",
    category: "ENTERTAINMENT", prob: 0.45, volume: 78400, closesAt: daysFromNow(200), daysActive: 35, region: "INT",
  },
  {
    title: "Netflix to surpass 350M subscribers in 2026?",
    description: "Resolves YES if Netflix reports 350M+ global subscribers in any 2026 quarterly report.",
    category: "ENTERTAINMENT", prob: 0.52, volume: 45600, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },

  // ── INTL CLIMATE ──────────────────────────────────────
  {
    title: "2026 to be the hottest year on record globally?",
    description: "Resolves YES if NASA or NOAA declares 2026 the hottest year on record, surpassing 2024/2025.",
    category: "CLIMATE", prob: 0.38, volume: 56300, closesAt: daysFromNow(330), daysActive: 50, region: "INT",
  },
  {
    title: "Global CO2 emissions to decline in 2026 vs 2025?",
    description: "Resolves YES if global CO2 emissions in 2026 are lower than 2025 per IEA or similar authority.",
    category: "CLIMATE", prob: 0.12, volume: 34500, closesAt: daysFromNow(350), daysActive: 40, region: "INT",
  },
  {
    title: "Nuclear fusion: second lab to achieve net energy gain in 2026?",
    description: "Resolves YES if a second laboratory (after NIF) achieves nuclear fusion net energy gain during 2026.",
    category: "TECH_SCIENCE", prob: 0.08, volume: 34500, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
  },
];

const MARKETS: MarketDef[] = [...NO_MARKETS, ...INT_MARKETS];

// ─── DEMO USER NAMES (Norwegian + international mix) ──────
const USER_NAMES = [
  "Erik Hansen", "Ingrid Johansen", "Ole Olsen", "Kari Larsen", "Magnus Pedersen",
  "Sigrid Berg", "Lars Nilsen", "Astrid Dahl", "Henrik Strand", "Nora Lund",
  "Bjørn Haugen", "Mette Kristiansen", "Sven Andreassen", "Hilde Martinsen", "Tor Solberg",
  "Synne Bakke", "Jon Vik", "Marit Hagen", "Arne Hovland", "Ragnhild Holm",
  "Per Moe", "Silje Fossum", "Anders Knutsen", "Camilla Ruud", "Thomas Lien",
  "Ida Sæther", "Fredrik Engen", "Julie Brekke", "Kristoffer Tangen", "Hanna Myhr",
  "Alex Morgan", "Sam Chen", "Jordan Rivera", "Casey Kim", "Riley Patel",
  "Quinn Murphy", "Dakota Lee", "Reese Garcia", "Morgan Taylor", "Jamie Brown",
  "Skyler White", "Peyton Davis", "Drew Martinez", "Harper Wilson", "Blake Anderson",
  "Cameron Thomas", "Finley Jackson", "Emerson Harris", "Rowan Clark", "Sage Robinson",
];

async function main() {
  console.log("Clearing existing data...");
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

  console.log("Creating admin + 50 users...");
  const admin = await prisma.user.create({
    data: { email: "admin@vikingmarket.no", name: "Admin Nordmann", hashedPassword, role: "ADMIN", balance: 50000 },
  });

  const users: Array<{ id: string; name: string }> = [];
  for (const name of USER_NAMES) {
    const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "a");
    const user = await prisma.user.create({
      data: { email: `${slug}@demo.vikingmarket.no`, name, hashedPassword, balance: randInt(200, 5000) },
    });
    users.push({ id: user.id, name: user.name });
  }

  console.log(`Creating ${MARKETS.length} markets (${NO_MARKETS.length} Norwegian + ${INT_MARKETS.length} International)...`);
  const markets: Array<{ id: string; def: MarketDef; poolYes: number; poolNo: number }> = [];

  for (const def of MARKETS) {
    const pools = poolsFromProb(def.prob);
    const market = await prisma.market.create({
      data: {
        title: def.title, description: def.description, category: def.category,
        closesAt: def.closesAt, createdById: admin.id, featured: def.featured ?? false,
        region: def.region,
        poolYes: pools.poolYes, poolNo: pools.poolNo, totalVolume: def.volume,
        imageUrl: def.imageUrl ?? null,
      },
    });
    markets.push({ id: market.id, def, poolYes: pools.poolYes, poolNo: pools.poolNo });
  }

  console.log("Generating trades...");
  const allTrades: Array<{
    marketIdx: number; userId: string; side: string; direction: string;
    amount: number; shares: number; price: number; createdAt: Date;
  }> = [];
  const AMOUNTS = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 500];

  for (let mIdx = 0; mIdx < markets.length; mIdx++) {
    const m = markets[mIdx]!;
    const volumeFactor = Math.log10(m.def.volume) / Math.log10(350000);
    const numTrades = Math.max(15, Math.round(volumeFactor * 80));
    for (let t = 0; t < numTrades; t++) {
      const user = pick(users);
      const yesBias = m.def.prob;
      const side = Math.random() < (yesBias * 0.6 + 0.2) ? "YES" : "NO";
      const direction = Math.random() < 0.85 ? "BUY" : "SELL";
      const amount = pick(AMOUNTS);
      const basePrice = side === "YES" ? m.def.prob : (1 - m.def.prob);
      const price = Math.max(0.02, Math.min(0.98, basePrice + (Math.random() - 0.5) * 0.15));
      const shares = amount / price;
      const tradeAge = Math.random() * m.def.daysActive;
      allTrades.push({ marketIdx: mIdx, userId: user.id, side, direction, amount, shares, price, createdAt: daysAgo(tradeAge) });
    }
  }

  console.log(`  Total trades to insert: ${allTrades.length}`);
  const BATCH_SIZE = 20;
  for (let i = 0; i < allTrades.length; i += BATCH_SIZE) {
    const batch = allTrades.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((td) => {
      const market = markets[td.marketIdx]!;
      return prisma.trade.create({
        data: { marketId: market.id, userId: td.userId, side: td.side, direction: td.direction, amount: td.amount, shares: td.shares, price: td.price, createdAt: td.createdAt },
      });
    }));
    if (i % 200 === 0 && i > 0) console.log(`  Inserted ${i}/${allTrades.length} trades...`);
    if (i % 100 === 0) await new Promise(r => setTimeout(r, 50));
  }

  console.log("Computing positions...");
  const posMap = new Map<string, { shares: number; cost: number }>();
  for (const td of allTrades) {
    const m = markets[td.marketIdx]!;
    const k = `${td.userId}|${m.id}|${td.side}`;
    const e = posMap.get(k) ?? { shares: 0, cost: 0 };
    if (td.direction === "BUY") { e.shares += td.shares; e.cost += td.amount; }
    else { e.shares = Math.max(0, e.shares - td.shares); e.cost = Math.max(0, e.cost - td.amount); }
    posMap.set(k, e);
  }
  const posEntries = [...posMap.entries()].filter(([, pos]) => pos.shares > 0.01);
  console.log(`  ${posEntries.length} non-zero positions`);

  for (let i = 0; i < posEntries.length; i += BATCH_SIZE) {
    const batch = posEntries.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(([key, pos]) => {
      const [userId, marketId, side] = key.split("|");
      return prisma.position.create({
        data: { userId: userId!, marketId: marketId!, side: side!, shares: pos.shares, avgPrice: pos.shares > 0 ? pos.cost / pos.shares : 0 },
      });
    }));
    if (i % 100 === 0) await new Promise(r => setTimeout(r, 50));
  }

  console.log("Generating price snapshots...");
  let snapshotCount = 0;
  for (const m of markets) {
    const days = m.def.daysActive;
    const baseYes = m.def.prob * 100;
    let currentYes = Math.max(3, Math.min(97, baseYes + (Math.random() - 0.5) * 20));
    const snapshots: Array<{ yesPrice: number; noPrice: number; timestamp: Date }> = [];
    for (let d = days; d >= 0; d--) {
      const meanReversion = (baseYes - currentYes) * 0.03;
      const noise = (Math.random() - 0.5) * 6;
      currentYes = Math.max(3, Math.min(97, currentYes + meanReversion + noise));
      snapshots.push({ yesPrice: Math.round(currentYes), noPrice: 100 - Math.round(currentYes), timestamp: daysAgo(d) });
    }
    for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
      const batch = snapshots.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((snap) =>
        prisma.priceSnapshot.create({ data: { marketId: m.id, yesPrice: snap.yesPrice, noPrice: snap.noPrice, timestamp: snap.timestamp } })
      ));
    }
    snapshotCount += snapshots.length;
    if (snapshotCount % 500 === 0) await new Promise(r => setTimeout(r, 50));
  }

  console.log("Generating comments...");
  const COMMENT_TEMPLATES = [
    "Very bullish here. Fundamentals are strong.", "Buying more YES. Seems underpriced.",
    "NO is the right play. Market is overestimating this.", "Interesting market. Watching closely.",
    "Loaded up on shares. We'll see.", "Current price seems about right.",
    "Way too volatile right now.", "Great opportunity to buy the dip.",
    "I think the market is mispricing this.", "Sold for a profit. Good luck everyone!",
    "Should be trading higher, no?", "NO side feels safer here.",
    "Crazy odds. Easy money.", "Market will correct soon.",
    "High conviction. Increased my position.", "What's your thesis?",
    "Just started trading this. Fascinating!", "Probability has shifted a lot.",
    "Taking profit. Up 40%.", "One of the most exciting markets on here.",
  ];

  const featuredMarkets = markets.filter((m) => m.def.featured);
  let commentCount = 0;
  for (const market of featuredMarkets) {
    const numComments = randInt(3, 12);
    for (let c = 0; c < numComments; c++) {
      const user = pick(users);
      await prisma.comment.create({
        data: { content: pick(COMMENT_TEMPLATES), userId: user.id, marketId: market.id, createdAt: daysAgo(Math.random() * market.def.daysActive) },
      });
      commentCount++;
    }
  }

  const noCount = NO_MARKETS.length;
  const intCount = INT_MARKETS.length;
  console.log("\nSeed complete!");
  console.log(`  NO: ${noCount} Norwegian markets`);
  console.log(`  INT: ${intCount} International markets`);
  console.log(`  Users: 1 admin + ${users.length} demo`);
  console.log(`  Total markets: ${markets.length}`);
  console.log(`  Trades: ${allTrades.length}`);
  console.log(`  Positions: ${posEntries.length}`);
  console.log(`  Snapshots: ${snapshotCount}`);
  console.log(`  Comments: ${commentCount}`);
  console.log(`  Login: admin@vikingmarket.no / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
