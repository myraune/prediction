import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

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
  // LMSR: YES price = poolNo / (poolYes + poolNo)
  // So for prob=0.65 → poolYes=35, poolNo=65
  return { poolYes: Math.round((1 - prob) * 100), poolNo: Math.round(prob * 100) };
}

// ─── MARKET DATA — 100 REAL 2026 EVENTS ──────────────────
interface MarketDef {
  title: string;
  description: string;
  category: string;
  prob: number;        // current YES probability
  volume: number;      // total volume in points
  closesAt: Date;
  featured?: boolean;
  imageUrl?: string;
  daysActive: number;  // how many days this market has been active (for trade/snapshot generation)
}

const MARKETS: MarketDef[] = [
  // ═══════════════════════════════════════════════════════
  // ── POLITICS (15) ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Will Republicans keep control of the House after 2026 midterms?",
    description: "Resolves YES if the Republican Party retains a majority in the U.S. House of Representatives following the November 2026 midterm elections.",
    category: "POLITICS", prob: 0.42, volume: 87400, closesAt: daysFromNow(280), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
  },
  {
    title: "Will Democrats win the Senate in 2026 midterms?",
    description: "Resolves YES if Democrats gain a net majority (51+ seats including VP tiebreaker) in the U.S. Senate after the 2026 elections.",
    category: "POLITICS", prob: 0.55, volume: 72300, closesAt: daysFromNow(280), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=400&q=80",
  },
  {
    title: "Trump approval rating above 45% on July 1, 2026?",
    description: "Resolves YES if the FiveThirtyEight aggregate of Trump's approval rating is above 45% on July 1, 2026.",
    category: "POLITICS", prob: 0.38, volume: 45600, closesAt: daysFromNow(130), daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80",
  },
  {
    title: "Ukraine-Russia peace deal signed by end of 2026?",
    description: "Resolves YES if Ukraine and Russia sign a formal peace agreement or permanent ceasefire treaty before December 31, 2026.",
    category: "POLITICS", prob: 0.22, volume: 134000, closesAt: daysFromNow(310), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400&q=80",
  },
  {
    title: "Will there be a new US government shutdown in 2026?",
    description: "Resolves YES if the U.S. federal government experiences a partial or full shutdown lasting 24+ hours during 2026.",
    category: "POLITICS", prob: 0.62, volume: 38700, closesAt: daysFromNow(310), daysActive: 40,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80",
  },
  {
    title: "Brazil presidential election: Will Lula seek re-election?",
    description: "Resolves YES if President Lula officially files as a candidate for the 2026 Brazilian presidential election.",
    category: "POLITICS", prob: 0.71, volume: 28900, closesAt: daysFromNow(250), daysActive: 35,
    imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80",
  },
  {
    title: "Will Mexico's Sheinbaum approval be above 55% by mid-2026?",
    description: "Resolves YES if President Claudia Sheinbaum's approval rating is above 55% in major polling averages by July 2026.",
    category: "POLITICS", prob: 0.48, volume: 15200, closesAt: daysFromNow(130), daysActive: 30,
  },
  {
    title: "New US tariffs above 30% on Chinese goods in 2026?",
    description: "Resolves YES if the US imposes any new tariffs of 30%+ on Chinese imports during 2026.",
    category: "POLITICS", prob: 0.73, volume: 56800, closesAt: daysFromNow(310), featured: true, daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  },
  {
    title: "Will the EU pass a comprehensive AI regulation update in 2026?",
    description: "Resolves YES if the European Union passes updated AI regulation beyond the current EU AI Act during 2026.",
    category: "POLITICS", prob: 0.35, volume: 22100, closesAt: daysFromNow(310), daysActive: 25,
  },
  {
    title: "Will Scotland hold another independence referendum by 2026?",
    description: "Resolves YES if the Scottish government officially schedules or holds an independence referendum before Dec 31, 2026.",
    category: "POLITICS", prob: 0.08, volume: 11400, closesAt: daysFromNow(310), daysActive: 60,
  },
  {
    title: "South Korea snap election in 2026?",
    description: "Resolves YES if South Korea holds a snap/early presidential election during 2026 following the December 2025 political crisis.",
    category: "POLITICS", prob: 0.65, volume: 41200, closesAt: daysFromNow(310), daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80",
  },
  {
    title: "Will NATO add a new member state in 2026?",
    description: "Resolves YES if any country completes accession to NATO during 2026.",
    category: "POLITICS", prob: 0.12, volume: 8700, closesAt: daysFromNow(310), daysActive: 45,
  },
  {
    title: "US Supreme Court to overturn Chevron deference fully in 2026 term?",
    description: "Resolves YES if SCOTUS issues a ruling further limiting or fully ending Chevron deference during its 2025-2026 term.",
    category: "POLITICS", prob: 0.41, volume: 19800, closesAt: daysFromNow(180), daysActive: 35,
  },
  {
    title: "Will India-Pakistan tensions lead to military conflict in 2026?",
    description: "Resolves YES if India and Pakistan engage in direct military confrontation (not just border skirmishes) during 2026.",
    category: "POLITICS", prob: 0.15, volume: 67200, closesAt: daysFromNow(310), daysActive: 20,
    imageUrl: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&q=80",
  },
  {
    title: "German coalition government collapse before Oct 2026?",
    description: "Resolves YES if Germany's coalition government falls or calls snap elections before October 2026.",
    category: "POLITICS", prob: 0.28, volume: 16400, closesAt: daysFromNow(230), daysActive: 40,
  },

  // ═══════════════════════════════════════════════════════
  // ── SPORTS (12) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "2026 FIFA World Cup: Will USA reach the semifinals?",
    description: "Resolves YES if the United States men's national team reaches the semifinal round of the 2026 FIFA World Cup.",
    category: "SPORTS", prob: 0.32, volume: 156000, closesAt: daysFromNow(160), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80",
  },
  {
    title: "2026 World Cup: Brazil to win the tournament?",
    description: "Resolves YES if Brazil wins the 2026 FIFA World Cup held in USA, Mexico, and Canada.",
    category: "SPORTS", prob: 0.14, volume: 198000, closesAt: daysFromNow(160), featured: true, daysActive: 80,
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
  },
  {
    title: "2026 World Cup: Argentina to defend their title?",
    description: "Resolves YES if Argentina wins the 2026 FIFA World Cup, defending their 2022 championship.",
    category: "SPORTS", prob: 0.11, volume: 187000, closesAt: daysFromNow(160), daysActive: 80,
    imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&q=80",
  },
  {
    title: "Will Erling Haaland score 30+ Premier League goals in 2025/26?",
    description: "Resolves YES if Erling Haaland scores 30 or more Premier League goals in the 2025/26 season.",
    category: "SPORTS", prob: 0.45, volume: 42800, closesAt: daysFromNow(260), daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
  },
  {
    title: "Milan Cortina 2026 Winter Olympics: Norway to top medal table?",
    description: "Resolves YES if Norway finishes with the most total medals at the 2026 Winter Olympics in Milan Cortina.",
    category: "SPORTS", prob: 0.38, volume: 31200, closesAt: daysFromNow(12), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80",
  },
  {
    title: "2026 Winter Olympics: Will a new Winter Olympics record be set in speed skating?",
    description: "Resolves YES if any world record is broken in speed skating events at the 2026 Milan Cortina Olympics.",
    category: "SPORTS", prob: 0.55, volume: 18400, closesAt: daysFromNow(12), daysActive: 45,
  },
  {
    title: "Real Madrid to win Champions League 2025/26?",
    description: "Resolves YES if Real Madrid wins the 2025/26 UEFA Champions League final.",
    category: "SPORTS", prob: 0.22, volume: 67500, closesAt: daysFromNow(120), daysActive: 35,
    imageUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=80",
  },
  {
    title: "NFL Super Bowl LXI: Will the Kansas City Chiefs three-peat?",
    description: "Resolves YES if the Kansas City Chiefs win Super Bowl LXI in February 2027 for three consecutive championships.",
    category: "SPORTS", prob: 0.08, volume: 89200, closesAt: daysFromNow(350), daysActive: 20,
    imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80",
  },
  {
    title: "Will Lewis Hamilton win a race for Ferrari in 2026?",
    description: "Resolves YES if Lewis Hamilton wins at least one Formula 1 Grand Prix driving for Scuderia Ferrari during the 2026 season.",
    category: "SPORTS", prob: 0.58, volume: 53100, closesAt: daysFromNow(300), daysActive: 40,
    imageUrl: "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400&q=80",
  },
  {
    title: "2026 World Cup: Group stage elimination for England?",
    description: "Resolves YES if England is eliminated in the group stage of the 2026 FIFA World Cup.",
    category: "SPORTS", prob: 0.09, volume: 44600, closesAt: daysFromNow(140), daysActive: 55,
  },
  {
    title: "Djokovic to win a Grand Slam in 2026?",
    description: "Resolves YES if Novak Djokovic wins any tennis Grand Slam tournament during 2026.",
    category: "SPORTS", prob: 0.25, volume: 36400, closesAt: daysFromNow(310), daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80",
  },
  {
    title: "NBA 2025/26: Will the Celtics repeat as champions?",
    description: "Resolves YES if the Boston Celtics win the 2025/26 NBA Championship.",
    category: "SPORTS", prob: 0.18, volume: 51200, closesAt: daysFromNow(150), daysActive: 35,
  },

  // ═══════════════════════════════════════════════════════
  // ── CRYPTO (12) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Bitcoin above $150K by end of 2026?",
    description: "Resolves YES if BTC/USD closes above $150,000 on any major exchange (Coinbase, Binance) before December 31, 2026.",
    category: "CRYPTO", prob: 0.52, volume: 234000, closesAt: daysFromNow(310), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80",
  },
  {
    title: "Bitcoin above $200K at any point in 2026?",
    description: "Resolves YES if BTC/USD trades above $200,000 at any point during 2026 on a major exchange.",
    category: "CRYPTO", prob: 0.28, volume: 178000, closesAt: daysFromNow(310), daysActive: 85,
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80",
  },
  {
    title: "Ethereum above $8,000 in 2026?",
    description: "Resolves YES if ETH/USD trades above $8,000 on Coinbase at any point during 2026.",
    category: "CRYPTO", prob: 0.35, volume: 89400, closesAt: daysFromNow(310), daysActive: 70,
    imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80",
  },
  {
    title: "Solana to overtake Ethereum in total value locked?",
    description: "Resolves YES if Solana's TVL exceeds Ethereum's TVL (per DeFiLlama) at any point during 2026.",
    category: "CRYPTO", prob: 0.18, volume: 45600, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "Will the US pass a stablecoin regulatory framework in 2026?",
    description: "Resolves YES if Congress passes and the President signs a comprehensive stablecoin bill during 2026.",
    category: "CRYPTO", prob: 0.55, volume: 38200, closesAt: daysFromNow(310), daysActive: 45,
  },
  {
    title: "Crypto total market cap above $5 trillion in 2026?",
    description: "Resolves YES if total cryptocurrency market capitalization exceeds $5 trillion at any point during 2026.",
    category: "CRYPTO", prob: 0.48, volume: 67800, closesAt: daysFromNow(310), daysActive: 55,
  },
  {
    title: "Will Tether (USDT) lose its #1 stablecoin position?",
    description: "Resolves YES if any stablecoin surpasses USDT in market capitalization during 2026.",
    category: "CRYPTO", prob: 0.12, volume: 21300, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "Bitcoin ETF total AUM above $200B by mid-2026?",
    description: "Resolves YES if total assets under management across all US spot Bitcoin ETFs exceeds $200 billion by July 1, 2026.",
    category: "CRYPTO", prob: 0.62, volume: 55100, closesAt: daysFromNow(130), daysActive: 60,
  },
  {
    title: "Will a major country adopt Bitcoin as legal tender in 2026?",
    description: "Resolves YES if any G20 nation or top-30 GDP country officially adopts Bitcoin as legal tender during 2026.",
    category: "CRYPTO", prob: 0.05, volume: 32400, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "XRP above $5 in 2026?",
    description: "Resolves YES if XRP/USD trades above $5.00 on a major exchange at any point during 2026.",
    category: "CRYPTO", prob: 0.30, volume: 29800, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "Will a DeFi protocol get hacked for $500M+ in 2026?",
    description: "Resolves YES if any single DeFi exploit results in losses exceeding $500 million during 2026.",
    category: "CRYPTO", prob: 0.35, volume: 18700, closesAt: daysFromNow(310), daysActive: 30,
  },
  {
    title: "Ethereum gas fees consistently below $0.01 in 2026?",
    description: "Resolves YES if average Ethereum L1 gas fees stay below $0.01 for any full calendar month in 2026.",
    category: "CRYPTO", prob: 0.15, volume: 14200, closesAt: daysFromNow(310), daysActive: 25,
  },

  // ═══════════════════════════════════════════════════════
  // ── TECH & SCIENCE (12) ───────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Will OpenAI release GPT-5 in 2026?",
    description: "Resolves YES if OpenAI publicly releases a model officially branded as GPT-5 during 2026.",
    category: "TECH_SCIENCE", prob: 0.72, volume: 112000, closesAt: daysFromNow(310), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80",
  },
  {
    title: "Apple to release AR/VR glasses under $1,000 in 2026?",
    description: "Resolves YES if Apple releases a Vision-branded headset priced under $1,000 USD during 2026.",
    category: "TECH_SCIENCE", prob: 0.45, volume: 58200, closesAt: daysFromNow(310), daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
  },
  {
    title: "SpaceX Starship to successfully land on Mars soil sample return mission?",
    description: "Resolves YES if SpaceX completes a successful Mars landing mission during 2026 (unmanned acceptable).",
    category: "TECH_SCIENCE", prob: 0.04, volume: 76400, closesAt: daysFromNow(310), daysActive: 80,
    imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=400&q=80",
  },
  {
    title: "Will an AI model pass the Turing Test convincingly in 2026?",
    description: "Resolves YES if an AI model passes a formal Turing Test (judged by expert panel) with >70% human-like rating.",
    category: "TECH_SCIENCE", prob: 0.40, volume: 41300, closesAt: daysFromNow(310), daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80",
  },
  {
    title: "Anthropic valuation above $100B in 2026?",
    description: "Resolves YES if Anthropic's post-money valuation exceeds $100 billion in any 2026 funding round or secondary sale.",
    category: "TECH_SCIENCE", prob: 0.58, volume: 34700, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "Tesla Full Self-Driving Level 4 approval in any US state?",
    description: "Resolves YES if Tesla receives official Level 4 autonomous driving approval from any US state regulator during 2026.",
    category: "TECH_SCIENCE", prob: 0.20, volume: 88900, closesAt: daysFromNow(310), daysActive: 65,
    imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&q=80",
  },
  {
    title: "Nuclear fusion net energy gain replicated by second lab in 2026?",
    description: "Resolves YES if a second laboratory (not NIF) achieves nuclear fusion net energy gain during 2026.",
    category: "TECH_SCIENCE", prob: 0.12, volume: 27600, closesAt: daysFromNow(310), daysActive: 55,
  },
  {
    title: "Will Neuralink implant its brain chip in 10+ patients by 2026?",
    description: "Resolves YES if Neuralink has implanted its brain-computer interface in 10 or more patients by end of 2026.",
    category: "TECH_SCIENCE", prob: 0.35, volume: 44100, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "First fully AI-written novel on NYT bestseller list in 2026?",
    description: "Resolves YES if a novel primarily written by AI appears on the NYT bestseller list during 2026.",
    category: "TECH_SCIENCE", prob: 0.08, volume: 15800, closesAt: daysFromNow(310), daysActive: 30,
  },
  {
    title: "NASA Artemis III crewed moon landing in 2026?",
    description: "Resolves YES if NASA's Artemis III mission successfully lands astronauts on the lunar surface during 2026.",
    category: "TECH_SCIENCE", prob: 0.10, volume: 52300, closesAt: daysFromNow(310), daysActive: 70,
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80",
  },
  {
    title: "Will quantum computing achieve 1000+ logical qubits in 2026?",
    description: "Resolves YES if any quantum computing company demonstrates 1000+ logical (error-corrected) qubits during 2026.",
    category: "TECH_SCIENCE", prob: 0.15, volume: 23400, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "iPhone 18 to feature foldable design?",
    description: "Resolves YES if Apple releases an iPhone 18 (or any 2026 iPhone) with a foldable screen design.",
    category: "TECH_SCIENCE", prob: 0.22, volume: 38900, closesAt: daysFromNow(250), daysActive: 25,
  },

  // ═══════════════════════════════════════════════════════
  // ── CLIMATE (8) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "2026 to be the hottest year on record?",
    description: "Resolves YES if NASA or NOAA declares 2026 the hottest calendar year on record for global surface temperature.",
    category: "CLIMATE", prob: 0.42, volume: 48700, closesAt: daysFromNow(330), featured: true, daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&q=80",
  },
  {
    title: "Category 6 hurricane classification created in 2026?",
    description: "Resolves YES if NOAA or WMO officially adds a Category 6 classification to the hurricane scale during 2026.",
    category: "CLIMATE", prob: 0.15, volume: 21300, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "Arctic ice-free summer before September 2026?",
    description: "Resolves YES if Arctic sea ice extent drops below 1 million square kilometers for the first time by September 2026.",
    category: "CLIMATE", prob: 0.08, volume: 31500, closesAt: daysFromNow(200), daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=400&q=80",
  },
  {
    title: "Global CO2 emissions to decline in 2026 vs 2025?",
    description: "Resolves YES if global CO2 emissions in 2026 are lower than 2025 according to the Global Carbon Project.",
    category: "CLIMATE", prob: 0.18, volume: 26800, closesAt: daysFromNow(350), daysActive: 40,
  },
  {
    title: "US to rejoin Paris Climate Agreement in 2026?",
    description: "Resolves YES if the United States officially re-enters the Paris Agreement during 2026.",
    category: "CLIMATE", prob: 0.05, volume: 34200, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "Major coral bleaching event affecting 50%+ of Great Barrier Reef?",
    description: "Resolves YES if a mass bleaching event affecting 50% or more of the Great Barrier Reef is reported during 2026.",
    category: "CLIMATE", prob: 0.65, volume: 17800, closesAt: daysFromNow(250), daysActive: 30,
    imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=400&q=80",
  },
  {
    title: "EU carbon border tax to exceed €100/tonne in 2026?",
    description: "Resolves YES if the EU CBAM carbon price exceeds €100 per tonne of CO2 at any point during 2026.",
    category: "CLIMATE", prob: 0.42, volume: 19500, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "Will any country ban all new ICE vehicle sales in 2026?",
    description: "Resolves YES if any country with 10M+ population implements a full ban on new internal combustion engine vehicle sales in 2026.",
    category: "CLIMATE", prob: 0.10, volume: 22100, closesAt: daysFromNow(310), daysActive: 45,
  },

  // ═══════════════════════════════════════════════════════
  // ── ECONOMICS (10) ────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Fed to cut rates below 3% by end of 2026?",
    description: "Resolves YES if the Federal Reserve lowers the federal funds rate below 3.00% before December 31, 2026.",
    category: "ECONOMICS", prob: 0.42, volume: 87600, closesAt: daysFromNow(310), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80",
  },
  {
    title: "US recession (2 consecutive GDP decline quarters) in 2026?",
    description: "Resolves YES if the US experiences two consecutive quarters of real GDP decline during 2026.",
    category: "ECONOMICS", prob: 0.32, volume: 98400, closesAt: daysFromNow(330), featured: true, daysActive: 70,
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  },
  {
    title: "US unemployment rate above 5% in 2026?",
    description: "Resolves YES if the US unemployment rate (BLS U-3) rises above 5.0% at any point during 2026.",
    category: "ECONOMICS", prob: 0.28, volume: 45200, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "US CPI inflation below 2% by mid-2026?",
    description: "Resolves YES if year-over-year CPI inflation falls below 2.0% in any month before July 2026.",
    category: "ECONOMICS", prob: 0.25, volume: 52800, closesAt: daysFromNow(130), daysActive: 55,
  },
  {
    title: "S&P 500 above 7,000 in 2026?",
    description: "Resolves YES if the S&P 500 index closes above 7,000 on any trading day during 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 112000, closesAt: daysFromNow(310), featured: true, daysActive: 65,
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80",
  },
  {
    title: "US national debt to exceed $38 trillion in 2026?",
    description: "Resolves YES if U.S. national debt surpasses $38 trillion during 2026.",
    category: "ECONOMICS", prob: 0.82, volume: 28600, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "Dollar index (DXY) below 95 in 2026?",
    description: "Resolves YES if the U.S. Dollar Index drops below 95 at any point during 2026.",
    category: "ECONOMICS", prob: 0.22, volume: 33100, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "Global GDP growth above 3% in 2026?",
    description: "Resolves YES if the IMF reports global GDP growth exceeding 3.0% for 2026 in its World Economic Outlook.",
    category: "ECONOMICS", prob: 0.48, volume: 24700, closesAt: daysFromNow(350), daysActive: 30,
  },
  {
    title: "Housing prices in top 10 US cities to decline 10%+ in 2026?",
    description: "Resolves YES if the Case-Shiller Home Price Index for any top-10 metro area drops 10%+ from peak during 2026.",
    category: "ECONOMICS", prob: 0.18, volume: 41200, closesAt: daysFromNow(310), daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
  },
  {
    title: "Gold above $3,500/oz in 2026?",
    description: "Resolves YES if gold spot price closes above $3,500/oz on COMEX at any point during 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 56300, closesAt: daysFromNow(310), daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&q=80",
  },

  // ═══════════════════════════════════════════════════════
  // ── COMPANIES (8) ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Nvidia market cap above $5 trillion in 2026?",
    description: "Resolves YES if Nvidia's market capitalization exceeds $5 trillion at any point during 2026.",
    category: "COMPANIES", prob: 0.42, volume: 87400, closesAt: daysFromNow(310), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400&q=80",
  },
  {
    title: "Tesla stock above $500 in 2026?",
    description: "Resolves YES if TSLA closes above $500 on NASDAQ at any point during 2026.",
    category: "COMPANIES", prob: 0.48, volume: 72100, closesAt: daysFromNow(310), daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&q=80",
  },
  {
    title: "Apple to become first $5 trillion company?",
    description: "Resolves YES if Apple Inc. becomes the first company to reach a $5 trillion market cap during 2026.",
    category: "COMPANIES", prob: 0.35, volume: 64500, closesAt: daysFromNow(310), daysActive: 45,
  },
  {
    title: "TikTok still operational in the US by end of 2026?",
    description: "Resolves YES if TikTok is available for download and use in the United States on December 31, 2026.",
    category: "COMPANIES", prob: 0.62, volume: 95200, closesAt: daysFromNow(310), daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80",
  },
  {
    title: "Meta stock above $700 in 2026?",
    description: "Resolves YES if META shares close above $700 on any trading day during 2026.",
    category: "COMPANIES", prob: 0.52, volume: 43800, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "Will Twitter/X achieve profitability in 2026?",
    description: "Resolves YES if X Corp (formerly Twitter) reports a profitable quarter during 2026 per verifiable financial reports.",
    category: "COMPANIES", prob: 0.30, volume: 37200, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "OpenAI IPO in 2026?",
    description: "Resolves YES if OpenAI completes an initial public offering on a major stock exchange during 2026.",
    category: "COMPANIES", prob: 0.25, volume: 58600, closesAt: daysFromNow(310), daysActive: 55,
  },
  {
    title: "Amazon to launch satellite internet competing with Starlink in 2026?",
    description: "Resolves YES if Amazon's Project Kuiper begins commercial satellite internet service during 2026.",
    category: "COMPANIES", prob: 0.55, volume: 31400, closesAt: daysFromNow(310), daysActive: 35,
  },

  // ═══════════════════════════════════════════════════════
  // ── FINANCIALS (5) ────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Brent crude oil above $100/barrel in 2026?",
    description: "Resolves YES if Brent crude spot price closes above $100/barrel at any point during 2026.",
    category: "FINANCIALS", prob: 0.30, volume: 42800, closesAt: daysFromNow(310), daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=400&q=80",
  },
  {
    title: "10-year Treasury yield below 3.5% in 2026?",
    description: "Resolves YES if the 10-year US Treasury yield drops below 3.5% at any point during 2026.",
    category: "FINANCIALS", prob: 0.35, volume: 38900, closesAt: daysFromNow(310), daysActive: 40,
  },
  {
    title: "Japanese Yen to strengthen below 130/USD in 2026?",
    description: "Resolves YES if the USD/JPY exchange rate drops below 130 at any point during 2026.",
    category: "FINANCIALS", prob: 0.18, volume: 25600, closesAt: daysFromNow(310), daysActive: 35,
  },
  {
    title: "FTSE 100 to reach new all-time high in 2026?",
    description: "Resolves YES if the FTSE 100 index closes at a new all-time high on any trading day during 2026.",
    category: "FINANCIALS", prob: 0.55, volume: 19800, closesAt: daysFromNow(310), daysActive: 30,
  },
  {
    title: "Copper price above $12,000/tonne in 2026?",
    description: "Resolves YES if LME copper price exceeds $12,000 per metric tonne at any point during 2026.",
    category: "FINANCIALS", prob: 0.42, volume: 22400, closesAt: daysFromNow(310), daysActive: 25,
  },

  // ═══════════════════════════════════════════════════════
  // ── CULTURE (5) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "Eurovision 2026: Will a Scandinavian country win?",
    description: "Resolves YES if Sweden, Norway, Denmark, Finland, or Iceland wins the Eurovision Song Contest 2026.",
    category: "CULTURE", prob: 0.22, volume: 31200, closesAt: daysFromNow(100), daysActive: 35,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
  },
  {
    title: "Taylor Swift to announce retirement from touring in 2026?",
    description: "Resolves YES if Taylor Swift publicly announces she will stop touring or take an indefinite hiatus during 2026.",
    category: "CULTURE", prob: 0.08, volume: 47800, closesAt: daysFromNow(310), daysActive: 40,
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
  },
  {
    title: "A K-pop group to headline Coachella 2026?",
    description: "Resolves YES if a K-pop act is an official headliner at Coachella 2026.",
    category: "CULTURE", prob: 0.35, volume: 21500, closesAt: daysFromNow(60), daysActive: 30,
  },
  {
    title: "Will Spotify reach 300M premium subscribers in 2026?",
    description: "Resolves YES if Spotify reports 300M+ premium (paid) subscribers in any 2026 quarterly earnings.",
    category: "CULTURE", prob: 0.48, volume: 18900, closesAt: daysFromNow(310), daysActive: 25,
  },
  {
    title: "Podcast to surpass radio in US daily listeners in 2026?",
    description: "Resolves YES if Edison Research or similar reports daily podcast listeners exceeding daily radio listeners in the US.",
    category: "CULTURE", prob: 0.22, volume: 14300, closesAt: daysFromNow(310), daysActive: 20,
  },

  // ═══════════════════════════════════════════════════════
  // ── ENTERTAINMENT (8) ─────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    title: "GTA 6 sales to exceed 30M copies in first month?",
    description: "Resolves YES if Grand Theft Auto VI sells over 30 million copies within its first 30 days of release.",
    category: "ENTERTAINMENT", prob: 0.62, volume: 88700, closesAt: daysFromNow(310), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=400&q=80",
  },
  {
    title: "Avatar 3 to gross $2B+ worldwide?",
    description: "Resolves YES if Avatar: Fire and Ash grosses over $2 billion at the worldwide box office.",
    category: "ENTERTAINMENT", prob: 0.45, volume: 52300, closesAt: daysFromNow(330), daysActive: 40,
    imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  },
  {
    title: "Netflix to surpass 350M total subscribers in 2026?",
    description: "Resolves YES if Netflix reports 350M+ global subscribers in any 2026 quarterly earnings report.",
    category: "ENTERTAINMENT", prob: 0.55, volume: 34100, closesAt: daysFromNow(310), daysActive: 35,
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8d6f2b?w=400&q=80",
  },
  {
    title: "A Marvel film to cross $2B box office in 2026?",
    description: "Resolves YES if any Marvel Cinematic Universe film grosses over $2 billion worldwide during 2026.",
    category: "ENTERTAINMENT", prob: 0.18, volume: 41200, closesAt: daysFromNow(310), daysActive: 30,
  },
  {
    title: "Will AI-generated content win a major film award in 2026?",
    description: "Resolves YES if a film using substantial AI-generated content wins at Oscars, BAFTA, or Cannes during 2026.",
    category: "ENTERTAINMENT", prob: 0.05, volume: 22800, closesAt: daysFromNow(310), daysActive: 25,
  },
  {
    title: "Nintendo Switch 2 to sell 20M+ units in 2026?",
    description: "Resolves YES if Nintendo's next-generation console sells 20 million+ units worldwide during 2026.",
    category: "ENTERTAINMENT", prob: 0.52, volume: 47600, closesAt: daysFromNow(310), daysActive: 45,
  },
  {
    title: "Stranger Things Season 5 to be Netflix's most-watched premiere?",
    description: "Resolves YES if Stranger Things S5 sets the record for most hours viewed in its first week on Netflix.",
    category: "ENTERTAINMENT", prob: 0.55, volume: 28400, closesAt: daysFromNow(250), daysActive: 30,
  },
  {
    title: "Gaming industry revenue to exceed $250B in 2026?",
    description: "Resolves YES if the global gaming industry revenue exceeds $250 billion in 2026 per Newzoo or similar.",
    category: "ENTERTAINMENT", prob: 0.62, volume: 19800, closesAt: daysFromNow(350), daysActive: 20,
  },

  // ═══════════════════════════════════════════════════════
  // ── HEALTH & MISC (5) — stored as CULTURE category ────
  // ═══════════════════════════════════════════════════════
  {
    title: "WHO to declare a new pandemic in 2026?",
    description: "Resolves YES if the World Health Organization declares a Public Health Emergency of International Concern (pandemic) during 2026.",
    category: "CULTURE", prob: 0.08, volume: 67200, closesAt: daysFromNow(310), daysActive: 45,
  },
  {
    title: "GLP-1 weight loss drugs to be approved OTC in 2026?",
    description: "Resolves YES if any GLP-1 receptor agonist (e.g., Ozempic-type drug) receives over-the-counter approval from the FDA during 2026.",
    category: "TECH_SCIENCE", prob: 0.12, volume: 38900, closesAt: daysFromNow(310), daysActive: 50,
  },
  {
    title: "Life expectancy in the US to increase in 2026 data?",
    description: "Resolves YES if US life expectancy for 2026 (when reported by CDC) shows an increase compared to 2025.",
    category: "CULTURE", prob: 0.55, volume: 15600, closesAt: daysFromNow(350), daysActive: 25,
  },
  {
    title: "World population to reach 8.2 billion in 2026?",
    description: "Resolves YES if the UN or World Bank reports that global population has exceeded 8.2 billion during 2026.",
    category: "CULTURE", prob: 0.72, volume: 12400, closesAt: daysFromNow(350), daysActive: 20,
  },
  {
    title: "Will lab-grown meat be sold in US supermarkets by end of 2026?",
    description: "Resolves YES if cultivated meat products are available for purchase in at least one major US supermarket chain during 2026.",
    category: "TECH_SCIENCE", prob: 0.35, volume: 28700, closesAt: daysFromNow(310), daysActive: 40,
  },
];

// ─── DEMO USER NAMES ─────────────────────────────────────
const USER_NAMES = [
  "Alex Morgan", "Sam Chen", "Jordan Rivera", "Casey Kim", "Riley Patel",
  "Avery Johnson", "Quinn Murphy", "Dakota Lee", "Reese Garcia", "Morgan Taylor",
  "Jamie Brown", "Skyler White", "Peyton Davis", "Drew Martinez", "Harper Wilson",
  "Blake Anderson", "Cameron Thomas", "Finley Jackson", "Emerson Harris", "Rowan Clark",
  "Sage Robinson", "Phoenix Lewis", "Kai Walker", "Winter Hall", "River Allen",
  "Oakley Young", "Lennox King", "Sutton Wright", "Remy Scott", "Arden Green",
  "Noel Baker", "Lane Adams", "Ellis Nelson", "Shea Hill", "Tatum Moore",
  "Hayden Price", "Kendall Ross", "Logan Carter", "Parker Evans", "Sydney Turner",
  "Mason Lee", "Luca Romano", "Emma Schmidt", "Noah Fischer", "Zara Ahmed",
  "Oscar Bergman", "Freya Lindqvist", "Axel Johansson", "Ingrid Svensson", "Lars Andersen",
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

  // ─── CREATE ADMIN ──────────────────────────────────────
  console.log("Creating admin + 50 users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@vikingmarket.no",
      name: "Admin Nordmann",
      hashedPassword,
      role: "ADMIN",
      balance: 50000,
    },
  });

  // ─── CREATE 50 DEMO USERS ─────────────────────────────
  const users: Array<{ id: string; name: string }> = [];
  for (const name of USER_NAMES) {
    const slug = name.toLowerCase().replace(/\s+/g, ".");
    const user = await prisma.user.create({
      data: {
        email: `${slug}@demo.vikingmarket.no`,
        name,
        hashedPassword,
        balance: randInt(200, 5000),
      },
    });
    users.push({ id: user.id, name: user.name });
  }

  // ─── CREATE 100 MARKETS ───────────────────────────────
  console.log(`Creating ${MARKETS.length} markets...`);
  const markets: Array<{ id: string; def: MarketDef; poolYes: number; poolNo: number }> = [];

  for (const def of MARKETS) {
    const pools = poolsFromProb(def.prob);
    const market = await prisma.market.create({
      data: {
        title: def.title,
        description: def.description,
        category: def.category,
        closesAt: def.closesAt,
        createdById: admin.id,
        featured: def.featured ?? false,
        poolYes: pools.poolYes,
        poolNo: pools.poolNo,
        totalVolume: def.volume,
        imageUrl: def.imageUrl ?? null,
      },
    });
    markets.push({ id: market.id, def, poolYes: pools.poolYes, poolNo: pools.poolNo });
  }

  // ─── SIMULATE TRADES (~10,000 total) ──────────────────
  console.log("Generating trades...");
  const allTrades: Array<{
    marketIdx: number; userId: string; side: string; direction: string;
    amount: number; shares: number; price: number; createdAt: Date;
  }> = [];

  const AMOUNTS = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 500];

  for (let mIdx = 0; mIdx < markets.length; mIdx++) {
    const m = markets[mIdx]!;
    // Higher volume markets get more trades
    const volumeFactor = Math.log10(m.def.volume) / Math.log10(250000);
    const numTrades = Math.max(30, Math.round(volumeFactor * 200));

    for (let t = 0; t < numTrades; t++) {
      const user = pick(users);
      // Bias side based on probability — more popular side gets more trades
      const yesBias = m.def.prob;
      const side = Math.random() < (yesBias * 0.6 + 0.2) ? "YES" : "NO";
      const direction = Math.random() < 0.85 ? "BUY" : "SELL";
      const amount = pick(AMOUNTS);
      const basePrice = side === "YES" ? m.def.prob : (1 - m.def.prob);
      // Add some noise to the price
      const price = Math.max(0.02, Math.min(0.98, basePrice + (Math.random() - 0.5) * 0.15));
      const shares = amount / price;

      // Spread trades across the active period
      const tradeAge = Math.random() * m.def.daysActive;
      const createdAt = daysAgo(tradeAge);

      allTrades.push({
        marketIdx: mIdx,
        userId: user.id,
        side,
        direction,
        amount,
        shares,
        price,
        createdAt,
      });
    }
  }

  console.log(`  Total trades to insert: ${allTrades.length}`);

  // Batch insert trades (in chunks of 50 for Turso compatibility)
  const BATCH_SIZE = 50;
  for (let i = 0; i < allTrades.length; i += BATCH_SIZE) {
    const batch = allTrades.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((td) => {
        const market = markets[td.marketIdx]!;
        return prisma.trade.create({
          data: {
            marketId: market.id,
            userId: td.userId,
            side: td.side,
            direction: td.direction,
            amount: td.amount,
            shares: td.shares,
            price: td.price,
            createdAt: td.createdAt,
          },
        });
      })
    );
    if (i % 500 === 0 && i > 0) {
      console.log(`  Inserted ${i}/${allTrades.length} trades...`);
    }
  }

  // ─── COMPUTE POSITIONS ────────────────────────────────
  console.log("Computing positions...");
  const posMap = new Map<string, { shares: number; cost: number }>();
  for (const td of allTrades) {
    const m = markets[td.marketIdx]!;
    const k = `${td.userId}|${m.id}|${td.side}`;
    const e = posMap.get(k) ?? { shares: 0, cost: 0 };
    if (td.direction === "BUY") {
      e.shares += td.shares;
      e.cost += td.amount;
    } else {
      e.shares = Math.max(0, e.shares - td.shares);
      e.cost = Math.max(0, e.cost - td.amount);
    }
    posMap.set(k, e);
  }

  // Filter out zero-share positions
  const posEntries = [...posMap.entries()].filter(([, pos]) => pos.shares > 0.01);
  console.log(`  ${posEntries.length} non-zero positions to insert`);

  for (let i = 0; i < posEntries.length; i += BATCH_SIZE) {
    const batch = posEntries.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(([key, pos]) => {
        const [userId, marketId, side] = key.split("|");
        return prisma.position.create({
          data: {
            userId: userId!,
            marketId: marketId!,
            side: side!,
            shares: pos.shares,
            avgPrice: pos.shares > 0 ? pos.cost / pos.shares : 0,
          },
        });
      })
    );
  }

  // ─── PRICE SNAPSHOTS (up to 90 days) ──────────────────
  console.log("Generating price snapshots...");
  let snapshotCount = 0;

  for (const m of markets) {
    const days = m.def.daysActive;
    const baseYes = m.def.prob * 100;

    // Generate a random walk for more realistic price history
    let currentYes = baseYes + (Math.random() - 0.5) * 20; // Start with some offset
    currentYes = Math.max(3, Math.min(97, currentYes));

    const snapshots: Array<{ yesPrice: number; noPrice: number; timestamp: Date }> = [];

    for (let d = days; d >= 0; d--) {
      // Random walk with mean reversion toward current probability
      const meanReversion = (baseYes - currentYes) * 0.03;
      const noise = (Math.random() - 0.5) * 6;
      currentYes = Math.max(3, Math.min(97, currentYes + meanReversion + noise));
      const yes = Math.round(currentYes);

      snapshots.push({
        yesPrice: yes,
        noPrice: 100 - yes,
        timestamp: daysAgo(d),
      });
    }

    // Batch insert snapshots
    for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
      const batch = snapshots.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((snap) =>
          prisma.priceSnapshot.create({
            data: {
              marketId: m.id,
              yesPrice: snap.yesPrice,
              noPrice: snap.noPrice,
              timestamp: snap.timestamp,
            },
          })
        )
      );
    }
    snapshotCount += snapshots.length;
  }

  // ─── GENERATE SOME COMMENTS ───────────────────────────
  console.log("Generating comments...");
  const COMMENT_TEMPLATES = [
    "I'm very bullish on this. The fundamentals are strong.",
    "Buying more YES shares here. This seems underpriced.",
    "NO is the play. Market is overestimating this probability.",
    "Interesting market. Going to watch this one for a while.",
    "Just loaded up on shares. Let's see how this plays out.",
    "The current price seems about right to me.",
    "This market is way too volatile right now.",
    "Great opportunity to buy the dip on YES shares.",
    "I think the market is mispricing this event significantly.",
    "Sold my position at a profit. Good luck to everyone still in.",
    "Anyone else think this should be trading higher?",
    "The NO side seems like the safer bet here.",
    "These odds are crazy. Easy money on YES.",
    "Market will correct soon. Patience is key.",
    "Added to my position. Strong conviction on this one.",
    "What's everyone's thesis on this market?",
    "Just getting into prediction markets. This is fascinating!",
    "The probability has shifted a lot this week.",
    "Taking profits here. Up 40% on my initial buy.",
    "This is one of the most interesting markets on the platform.",
  ];

  const featuredMarkets = markets.filter((m) => m.def.featured);
  let commentCount = 0;

  for (const market of featuredMarkets) {
    const numComments = randInt(3, 12);
    for (let c = 0; c < numComments; c++) {
      const user = pick(users);
      const content = pick(COMMENT_TEMPLATES);
      const daysOld = Math.random() * market.def.daysActive;
      await prisma.comment.create({
        data: {
          content,
          userId: user.id,
          marketId: market.id,
          createdAt: daysAgo(daysOld),
        },
      });
      commentCount++;
    }
  }

  // ─── SUMMARY ──────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`  👤 1 admin + ${users.length} users`);
  console.log(`  📊 ${markets.length} markets`);
  console.log(`  📈 ${allTrades.length} trades`);
  console.log(`  💰 ${posEntries.length} positions`);
  console.log(`  📉 ${snapshotCount} price snapshots`);
  console.log(`  💬 ${commentCount} comments`);
  console.log(`  🔑 Login: admin@vikingmarket.no / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
