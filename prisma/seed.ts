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
  region: "NO" | "INT"; // NO = Norway, INT = International
}

// ═══════════════════════════════════════════════════════════
// ══ NORWEGIAN MARKETS (56) ════════════════════════════════
// ═══════════════════════════════════════════════════════════

const NO_MARKETS: MarketDef[] = [

  // ── NORSK POLITIKK (12) ──────────────────────────────────
  {
    title: "Blir Arbeiderpartiet størst ved stortingsvalget 2025?",
    description: "Resolves YES om Arbeiderpartiet får flest stemmer ved stortingsvalget i september 2025.",
    category: "POLITICS", prob: 0.38, volume: 124000, closesAt: daysFromNow(200), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
    region: "NO",
  },
  {
    title: "Vil Erna Solberg bli statsminister igjen etter valget 2025?",
    description: "Resolves YES om Erna Solberg (Høyre) blir statsminister etter stortingsvalget 2025.",
    category: "POLITICS", prob: 0.52, volume: 98700, closesAt: daysFromNow(210), featured: true, daysActive: 85,
    imageUrl: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=400&q=80",
    region: "NO",
  },
  {
    title: "Høyre over 30% oppslutning ved valget 2025?",
    description: "Resolves YES om Høyre får over 30% av stemmene ved stortingsvalget 2025.",
    category: "POLITICS", prob: 0.45, volume: 67800, closesAt: daysFromNow(200), daysActive: 70, region: "NO",
  },
  {
    title: "Kommer FrP tilbake i regjering etter valget 2025?",
    description: "Resolves YES om Fremskrittspartiet blir del av regjeringen etter stortingsvalget 2025.",
    category: "POLITICS", prob: 0.35, volume: 54200, closesAt: daysFromNow(220), daysActive: 65, region: "NO",
  },
  {
    title: "Vil SV havne over sperregrensen i 2025?",
    description: "Resolves YES om SV får over 4% av stemmene ved stortingsvalget 2025.",
    category: "POLITICS", prob: 0.82, volume: 31400, closesAt: daysFromNow(200), daysActive: 50, region: "NO",
  },
  {
    title: "MDG over sperregrensen i stortingsvalget 2025?",
    description: "Resolves YES om Miljøpartiet De Grønne får over 4% av stemmene.",
    category: "POLITICS", prob: 0.28, volume: 42100, closesAt: daysFromNow(200), daysActive: 55, region: "NO",
  },
  {
    title: "Rødt over sperregrensen 2025?",
    description: "Resolves YES om Rødt får over 4% oppslutning ved stortingsvalget 2025.",
    category: "POLITICS", prob: 0.45, volume: 38900, closesAt: daysFromNow(200), daysActive: 50, region: "NO",
  },
  {
    title: "Vil Sp falle under 5% ved valget 2025?",
    description: "Resolves YES om Senterpartiet får under 5% av stemmene.",
    category: "POLITICS", prob: 0.42, volume: 35200, closesAt: daysFromNow(200), daysActive: 60, region: "NO",
  },
  {
    title: "Valgdeltakelse over 80% ved stortingsvalget 2025?",
    description: "Resolves YES om valgdeltakelsen overstiger 80% ved stortingsvalget 2025.",
    category: "POLITICS", prob: 0.55, volume: 22800, closesAt: daysFromNow(200), daysActive: 40, region: "NO",
  },
  {
    title: "Vil Norge søke EU-medlemskap innen 2030?",
    description: "Resolves YES om den norske regjeringen formelt søker om EU-medlemskap innen 2030.",
    category: "POLITICS", prob: 0.05, volume: 78500, closesAt: daysFromNow(310), featured: true, daysActive: 80, region: "NO",
  },
  {
    title: "Ny regjering med flertall på Stortinget etter 2025?",
    description: "Resolves YES om den nye regjeringen etter valget 2025 har flertall (85+ mandater) på Stortinget.",
    category: "POLITICS", prob: 0.38, volume: 45600, closesAt: daysFromNow(220), daysActive: 55, region: "NO",
  },
  {
    title: "Vil bompengepartiet (FNB) komme inn på Stortinget i 2025?",
    description: "Resolves YES om Folkeaksjonen nei til mer bompenger (FNB) vinner minst 1 stortingsmandat.",
    category: "POLITICS", prob: 0.03, volume: 12800, closesAt: daysFromNow(200), daysActive: 35, region: "NO",
  },

  // ── NORSK SPORT (12) ─────────────────────────────────────
  {
    title: "Erling Haaland toppscorer i Premier League 2025/26?",
    description: "Resolves YES om Erling Braut Haaland ender som toppscorer i Premier League sesongen 2025/26.",
    category: "SPORTS", prob: 0.38, volume: 156000, closesAt: daysFromNow(260), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80", region: "NO",
  },
  {
    title: "Norge til VM i fotball 2026?",
    description: "Resolves YES om det norske herrelandslaget kvalifiserer seg til FIFA VM 2026.",
    category: "SPORTS", prob: 0.15, volume: 198000, closesAt: daysFromNow(120), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80", region: "NO",
  },
  {
    title: "Norge flest gull i vinter-OL 2026 Milano Cortina?",
    description: "Resolves YES om Norge vinner flest gullmedaljer i vinter-OL 2026.",
    category: "SPORTS", prob: 0.52, volume: 87400, closesAt: daysFromNow(12), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80", region: "NO",
  },
  {
    title: "Norge flest medaljer totalt i vinter-OL 2026?",
    description: "Resolves YES om Norge ender med flest medaljer totalt (gull+sølv+bronse) i Milano Cortina 2026.",
    category: "SPORTS", prob: 0.45, volume: 64200, closesAt: daysFromNow(12), daysActive: 55, region: "NO",
  },
  {
    title: "Bodø/Glimt norsk seriemester 2025?",
    description: "Resolves YES om FK Bodø/Glimt vinner Eliteserien 2025.",
    category: "SPORTS", prob: 0.32, volume: 45800, closesAt: daysFromNow(280), daysActive: 40, region: "NO",
  },
  {
    title: "Rosenborg topp 3 i Eliteserien 2025?",
    description: "Resolves YES om Rosenborg BK ender blant topp 3 i Eliteserien 2025.",
    category: "SPORTS", prob: 0.42, volume: 38200, closesAt: daysFromNow(280), daysActive: 45, region: "NO",
  },
  {
    title: "Molde FK til Conference League gruppespill 2025/26?",
    description: "Resolves YES om Molde FK kvalifiserer seg til gruppespillet i Conference League 2025/26.",
    category: "SPORTS", prob: 0.35, volume: 28700, closesAt: daysFromNow(160), daysActive: 35, region: "NO",
  },
  {
    title: "Jakob Ingebrigtsen ny verdensrekord på 1500m i 2026?",
    description: "Resolves YES om Jakob Ingebrigtsen setter ny verdensrekord på 1500 meter i 2026.",
    category: "SPORTS", prob: 0.22, volume: 52300, closesAt: daysFromNow(310), daysActive: 50,
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80", region: "NO",
  },
  {
    title: "Therese Johaug comeback til vinter-OL 2026?",
    description: "Resolves YES om Therese Johaug stiller til start i minst én øvelse i vinter-OL 2026 Milano Cortina.",
    category: "SPORTS", prob: 0.18, volume: 67800, closesAt: daysFromNow(12), daysActive: 65, region: "NO",
  },
  {
    title: "Martin Ødegaard til Real Madrid eller Barcelona i 2026?",
    description: "Resolves YES om Martin Ødegaard blir solgt fra Arsenal til Real Madrid eller Barcelona innen 2026.",
    category: "SPORTS", prob: 0.12, volume: 78400, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Viktor Hovland vinner en Major i golf i 2026?",
    description: "Resolves YES om Viktor Hovland vinner en av de fire store golf-turneringene i 2026.",
    category: "SPORTS", prob: 0.15, volume: 41200, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Karsten Warholm under 46 sekunder på 400m hekk i 2026?",
    description: "Resolves YES om Karsten Warholm løper 400m hekk under 46.00 sekunder i 2026.",
    category: "SPORTS", prob: 0.28, volume: 34500, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },

  // ── NORSK ØKONOMI & FINANS (14) ──────────────────────────
  {
    title: "Norges Bank rente under 3.5% innen 2026?",
    description: "Resolves YES om styringsrenten i Norge settes under 3.5% innen utgangen av 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 87600, closesAt: daysFromNow(310), featured: true, daysActive: 70,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80", region: "NO",
  },
  {
    title: "NOK/EUR under 11.00 i 2026?",
    description: "Resolves YES om den norske kronen styrker seg til under 11.00 mot euro i 2026.",
    category: "FINANCIALS", prob: 0.32, volume: 72400, closesAt: daysFromNow(310), featured: true, daysActive: 65, region: "NO",
  },
  {
    title: "Oslo Børs (OBX) over 1500 i 2026?",
    description: "Resolves YES om OBX-indeksen lukker over 1500 poeng i løpet av 2026.",
    category: "FINANCIALS", prob: 0.42, volume: 56300, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Boligprisene i Oslo opp over 5% i 2026?",
    description: "Resolves YES om boligprisindeksen i Oslo stiger mer enn 5% i 2026 (SSB/Eiendom Norge).",
    category: "ECONOMICS", prob: 0.38, volume: 94200, closesAt: daysFromNow(310), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80", region: "NO",
  },
  {
    title: "Arbeidsledigheten i Norge over 4% i 2026?",
    description: "Resolves YES om registrert arbeidsledighet (NAV) overstiger 4% i 2026.",
    category: "ECONOMICS", prob: 0.22, volume: 41800, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Oljeprisen (Brent) over $90 i 2026?",
    description: "Resolves YES om Brent-oljeprisen lukker over $90/fat i løpet av 2026.",
    category: "FINANCIALS", prob: 0.55, volume: 68900, closesAt: daysFromNow(310), daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=400&q=80", region: "NO",
  },
  {
    title: "Laksepris over 120 NOK/kg gjennomsnitt i 2026?",
    description: "Resolves YES om gjennomsnittlig laksepris (NOS) overstiger 120 NOK/kg i 2026.",
    category: "FINANCIALS", prob: 0.48, volume: 38400, closesAt: daysFromNow(310), daysActive: 50, region: "NO",
  },
  {
    title: "Equinor aksje over 400 NOK i 2026?",
    description: "Resolves YES om Equinor (EQNR) lukker over 400 NOK på Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.35, volume: 52100, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Norsk KPI-inflasjon under 2.5% innen utgangen av 2026?",
    description: "Resolves YES om norsk KPI (12-måneders vekst) faller under 2.5% innen desember 2026.",
    category: "ECONOMICS", prob: 0.48, volume: 44700, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Oljefondet over 20 000 milliarder NOK i 2026?",
    description: "Resolves YES om Statens pensjonsfond utland (Oljefondet) passerer 20 000 milliarder NOK i markedsverdi i 2026.",
    category: "ECONOMICS", prob: 0.58, volume: 78200, closesAt: daysFromNow(310), featured: true, daysActive: 65, region: "NO",
  },
  {
    title: "NOK/USD under 10.00 i 2026?",
    description: "Resolves YES om USD/NOK-kursen faller under 10.00 (kronen styrker seg) i 2026.",
    category: "FINANCIALS", prob: 0.28, volume: 58600, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Norges Banks styringsrente uendret gjennom hele 2026?",
    description: "Resolves YES om Norges Bank holder styringsrenten uendret gjennom alle rentemøter i 2026.",
    category: "ECONOMICS", prob: 0.12, volume: 41200, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Oslo Børs ny all-time high i 2026?",
    description: "Resolves YES om Oslo Børs Hovedindeks (OSEBX) setter ny all-time high i 2026.",
    category: "FINANCIALS", prob: 0.58, volume: 63400, closesAt: daysFromNow(310), daysActive: 50, region: "NO",
  },
  {
    title: "Strømpris i Sør-Norge gjennomsnitt over 1.50 kr/kWh i 2026?",
    description: "Resolves YES om gjennomsnittlig spotpris (NO2) overstiger 1.50 kr/kWh for et kvartal i 2026.",
    category: "ECONOMICS", prob: 0.32, volume: 82400, closesAt: daysFromNow(310), featured: true, daysActive: 70, region: "NO",
  },

  // ── NORSK TECH, SELSKAPER & KLIMA (18) ───────────────────
  {
    title: "Kahoot! kjøpt opp eller tatt av børs i 2026?",
    description: "Resolves YES om Kahoot! blir kjøpt opp eller tatt av Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.22, volume: 31200, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Aker BP fusjoner eller kjøper et stort oljeselskap i 2026?",
    description: "Resolves YES om Aker BP gjennomfører en stor M&A-transaksjon (over 10 mrd NOK) i 2026.",
    category: "COMPANIES", prob: 0.18, volume: 28700, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },
  {
    title: "Norsk startup verdsatt over 10 mrd NOK (unicorn) i 2026?",
    description: "Resolves YES om et norsk tech-selskap oppnår unicorn-status (over 10 mrd NOK verdsettelse) i 2026.",
    category: "TECH_SCIENCE", prob: 0.32, volume: 44100, closesAt: daysFromNow(310), daysActive: 50, region: "NO",
  },
  {
    title: "Autonom ferge i fast rute i Norge innen 2026?",
    description: "Resolves YES om en autonom (selvkjørende) ferge settes i kommersiell fast rute i Norge innen 2026.",
    category: "TECH_SCIENCE", prob: 0.25, volume: 22800, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "DNB lanserer krypto-handel i appen i 2026?",
    description: "Resolves YES om DNB tilbyr kryptovaluta-handel direkte i sin mobilapp innen 2026.",
    category: "CRYPTO", prob: 0.15, volume: 36400, closesAt: daysFromNow(310), daysActive: 45, region: "NO",
  },
  {
    title: "Mowi aksjekurs over 250 NOK i 2026?",
    description: "Resolves YES om Mowi ASA lukker over 250 NOK på Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.42, volume: 29800, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },
  {
    title: "Hydrogen-ferge i kommersiell drift i Norge i 2026?",
    description: "Resolves YES om en hydrogendrevet ferge er i daglig kommersiell drift i Norge innen utgangen av 2026.",
    category: "TECH_SCIENCE", prob: 0.35, volume: 25400, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Yara-aksjen over 400 NOK i 2026?",
    description: "Resolves YES om Yara International lukker over 400 NOK på Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.28, volume: 21200, closesAt: daysFromNow(310), daysActive: 30, region: "NO",
  },
  {
    title: "Norge vinner Eurovision 2026?",
    description: "Resolves YES om Norge vinner Eurovision Song Contest 2026.",
    category: "CULTURE", prob: 0.08, volume: 67200, closesAt: daysFromNow(100), featured: true, daysActive: 45,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80", region: "NO",
  },
  {
    title: "Norsk film nominert til Oscar i 2026?",
    description: "Resolves YES om en norsk film blir nominert til Academy Award (beste internasjonale film) for 2026-seremoni.",
    category: "ENTERTAINMENT", prob: 0.15, volume: 28400, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },
  {
    title: "Skam-reboot eller ny sesong annonsert i 2026?",
    description: "Resolves YES om NRK eller annen norsk kanal annonserer en ny sesong eller reboot av SKAM i 2026.",
    category: "ENTERTAINMENT", prob: 0.12, volume: 34500, closesAt: daysFromNow(310), daysActive: 30, region: "NO",
  },
  {
    title: "Norge under 2% utslippskutt-mål i 2026?",
    description: "Resolves YES om Norges klimagassutslipp reduseres med minst 2% i 2026 sammenlignet med 2025.",
    category: "CLIMATE", prob: 0.35, volume: 38900, closesAt: daysFromNow(350), daysActive: 50, region: "NO",
  },
  {
    title: "Vindkraft-utbygging på land stoppet av regjering i 2026?",
    description: "Resolves YES om regjeringen innfører moratorium eller stopper nye vindkraftkonsesjoner på land i 2026.",
    category: "CLIMATE", prob: 0.22, volume: 26800, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
  {
    title: "Havvind-utbygging i Nordsjøen: Byggestart i 2026?",
    description: "Resolves YES om fysisk byggearbeid starter på et norsk havvind-prosjekt i Nordsjøen i 2026.",
    category: "CLIMATE", prob: 0.48, volume: 44100, closesAt: daysFromNow(310), daysActive: 55, region: "NO",
  },
  {
    title: "Første norske CCS-anlegg (karbonfangst) i drift i 2026?",
    description: "Resolves YES om Norges første fullskala karbonfangst- og lagringsanlegg (Langskip/Northern Lights) er operativt i 2026.",
    category: "CLIMATE", prob: 0.55, volume: 35200, closesAt: daysFromNow(310), daysActive: 50, region: "NO",
  },
  {
    title: "Handelsbalanse Norge: Overskudd over 500 mrd NOK i 2026?",
    description: "Resolves YES om Norges handelsbalanse (eksport minus import) overstiger 500 milliarder NOK i 2026.",
    category: "ECONOMICS", prob: 0.42, volume: 34800, closesAt: daysFromNow(350), daysActive: 40, region: "NO",
  },
  {
    title: "Telenor aksje over 200 NOK i 2026?",
    description: "Resolves YES om Telenor ASA lukker over 200 NOK på Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.38, volume: 24600, closesAt: daysFromNow(310), daysActive: 35, region: "NO",
  },
  {
    title: "Nel ASA aksje over 10 NOK igjen i 2026?",
    description: "Resolves YES om Nel ASA lukker over 10 NOK på Oslo Børs i 2026.",
    category: "COMPANIES", prob: 0.22, volume: 31800, closesAt: daysFromNow(310), daysActive: 40, region: "NO",
  },
];

// ═══════════════════════════════════════════════════════════
// ══ INTERNATIONAL MARKETS (44) ════════════════════════════
// ═══════════════════════════════════════════════════════════

const INT_MARKETS: MarketDef[] = [

  // ── INTL POLITICS (8) ────────────────────────────────────
  {
    title: "Will Republicans keep control of the House after 2026 midterms?",
    description: "Resolves YES if the Republican Party retains a majority in the U.S. House following the November 2026 midterm elections.",
    category: "POLITICS", prob: 0.42, volume: 87400, closesAt: daysFromNow(280), featured: true, daysActive: 60,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80", region: "INT",
  },
  {
    title: "Ukraine-Russia peace deal signed by end of 2026?",
    description: "Resolves YES if Ukraine and Russia sign a formal peace agreement before December 31, 2026.",
    category: "POLITICS", prob: 0.22, volume: 134000, closesAt: daysFromNow(310), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400&q=80", region: "INT",
  },
  {
    title: "Trump approval rating above 45% on July 1, 2026?",
    description: "Resolves YES if FiveThirtyEight aggregate approval is above 45% on July 1, 2026.",
    category: "POLITICS", prob: 0.38, volume: 45600, closesAt: daysFromNow(130), daysActive: 45, region: "INT",
  },
  {
    title: "New US tariffs above 30% on Chinese goods in 2026?",
    description: "Resolves YES if the US imposes new tariffs of 30%+ on Chinese imports during 2026.",
    category: "POLITICS", prob: 0.73, volume: 56800, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "Will the EU pass a comprehensive AI regulation update in 2026?",
    description: "Resolves YES if the EU passes updated AI regulation beyond the current AI Act during 2026.",
    category: "POLITICS", prob: 0.35, volume: 22100, closesAt: daysFromNow(310), daysActive: 25, region: "INT",
  },
  {
    title: "South Korea snap election in 2026?",
    description: "Resolves YES if South Korea holds a snap presidential election during 2026.",
    category: "POLITICS", prob: 0.65, volume: 41200, closesAt: daysFromNow(310), daysActive: 30, region: "INT",
  },
  {
    title: "Will India-Pakistan tensions lead to military conflict in 2026?",
    description: "Resolves YES if India and Pakistan engage in direct military confrontation during 2026.",
    category: "POLITICS", prob: 0.15, volume: 67200, closesAt: daysFromNow(310), daysActive: 20, region: "INT",
  },
  {
    title: "German coalition government collapse before Oct 2026?",
    description: "Resolves YES if Germany's coalition government falls or calls snap elections before October 2026.",
    category: "POLITICS", prob: 0.28, volume: 16400, closesAt: daysFromNow(230), daysActive: 40, region: "INT",
  },

  // ── INTL SPORTS (4) ──────────────────────────────────────
  {
    title: "2026 FIFA World Cup: Will USA reach the semifinals?",
    description: "Resolves YES if the United States reaches the semifinal round of the 2026 FIFA World Cup.",
    category: "SPORTS", prob: 0.32, volume: 156000, closesAt: daysFromNow(160), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80", region: "INT",
  },
  {
    title: "2026 World Cup: Brazil to win the tournament?",
    description: "Resolves YES if Brazil wins the 2026 FIFA World Cup.",
    category: "SPORTS", prob: 0.14, volume: 198000, closesAt: daysFromNow(160), daysActive: 80,
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8d6f2b?w=400&q=80", region: "INT",
  },
  {
    title: "Will Lewis Hamilton win a race for Ferrari in 2026?",
    description: "Resolves YES if Lewis Hamilton wins at least one F1 Grand Prix for Ferrari during 2026.",
    category: "SPORTS", prob: 0.58, volume: 53100, closesAt: daysFromNow(300), daysActive: 40, region: "INT",
  },
  {
    title: "Real Madrid to win Champions League 2025/26?",
    description: "Resolves YES if Real Madrid wins the 2025/26 UEFA Champions League.",
    category: "SPORTS", prob: 0.22, volume: 67500, closesAt: daysFromNow(120), daysActive: 35, region: "INT",
  },

  // ── INTL CRYPTO (6) ──────────────────────────────────────
  {
    title: "Bitcoin above $150K by end of 2026?",
    description: "Resolves YES if BTC/USD closes above $150,000 before December 31, 2026.",
    category: "CRYPTO", prob: 0.52, volume: 234000, closesAt: daysFromNow(310), featured: true, daysActive: 90,
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80", region: "INT",
  },
  {
    title: "Bitcoin above $200K at any point in 2026?",
    description: "Resolves YES if BTC/USD trades above $200,000 at any point during 2026.",
    category: "CRYPTO", prob: 0.28, volume: 178000, closesAt: daysFromNow(310), daysActive: 85, region: "INT",
  },
  {
    title: "Ethereum above $8,000 in 2026?",
    description: "Resolves YES if ETH/USD trades above $8,000 at any point during 2026.",
    category: "CRYPTO", prob: 0.35, volume: 89400, closesAt: daysFromNow(310), daysActive: 70, region: "INT",
  },
  {
    title: "Will the US pass a stablecoin regulatory framework in 2026?",
    description: "Resolves YES if Congress passes a comprehensive stablecoin bill during 2026.",
    category: "CRYPTO", prob: 0.55, volume: 38200, closesAt: daysFromNow(310), daysActive: 45, region: "INT",
  },
  {
    title: "Crypto total market cap above $5 trillion in 2026?",
    description: "Resolves YES if total cryptocurrency market cap exceeds $5 trillion during 2026.",
    category: "CRYPTO", prob: 0.48, volume: 67800, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
  },
  {
    title: "XRP above $5 in 2026?",
    description: "Resolves YES if XRP/USD trades above $5.00 at any point during 2026.",
    category: "CRYPTO", prob: 0.30, volume: 29800, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },

  // ── INTL TECH (5) ────────────────────────────────────────
  {
    title: "Will OpenAI release GPT-5 in 2026?",
    description: "Resolves YES if OpenAI releases a model officially branded as GPT-5 during 2026.",
    category: "TECH_SCIENCE", prob: 0.72, volume: 112000, closesAt: daysFromNow(310), featured: true, daysActive: 75,
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80", region: "INT",
  },
  {
    title: "Tesla Full Self-Driving Level 4 approval in any US state?",
    description: "Resolves YES if Tesla receives Level 4 autonomous driving approval during 2026.",
    category: "TECH_SCIENCE", prob: 0.20, volume: 88900, closesAt: daysFromNow(310), daysActive: 65, region: "INT",
  },
  {
    title: "Anthropic valuation above $100B in 2026?",
    description: "Resolves YES if Anthropic's valuation exceeds $100 billion in any 2026 funding round.",
    category: "TECH_SCIENCE", prob: 0.58, volume: 34700, closesAt: daysFromNow(310), daysActive: 40, region: "INT",
  },
  {
    title: "Apple to release AR/VR glasses under $1,000 in 2026?",
    description: "Resolves YES if Apple releases a Vision headset under $1,000 during 2026.",
    category: "TECH_SCIENCE", prob: 0.45, volume: 58200, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "iPhone 18 to feature foldable design?",
    description: "Resolves YES if Apple releases a 2026 iPhone with a foldable screen.",
    category: "TECH_SCIENCE", prob: 0.22, volume: 38900, closesAt: daysFromNow(250), daysActive: 25, region: "INT",
  },

  // ── INTL ECONOMICS & FINANCE (8) ─────────────────────────
  {
    title: "Fed to cut rates below 3% by end of 2026?",
    description: "Resolves YES if the Federal Reserve lowers rates below 3.00% before December 31, 2026.",
    category: "ECONOMICS", prob: 0.42, volume: 87600, closesAt: daysFromNow(310), featured: true, daysActive: 60, region: "INT",
  },
  {
    title: "US recession (2 consecutive GDP decline quarters) in 2026?",
    description: "Resolves YES if the US experiences two consecutive quarters of real GDP decline during 2026.",
    category: "ECONOMICS", prob: 0.32, volume: 98400, closesAt: daysFromNow(330), daysActive: 70, region: "INT",
  },
  {
    title: "S&P 500 above 7,000 in 2026?",
    description: "Resolves YES if the S&P 500 closes above 7,000 on any trading day during 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 112000, closesAt: daysFromNow(310), daysActive: 65,
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80", region: "INT",
  },
  {
    title: "Gold above $3,500/oz in 2026?",
    description: "Resolves YES if gold spot price closes above $3,500/oz at any point during 2026.",
    category: "ECONOMICS", prob: 0.55, volume: 56300, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "Dollar index (DXY) below 95 in 2026?",
    description: "Resolves YES if the U.S. Dollar Index drops below 95 during 2026.",
    category: "FINANCIALS", prob: 0.22, volume: 33100, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },
  {
    title: "Japanese Yen below 130/USD in 2026?",
    description: "Resolves YES if USD/JPY drops below 130 at any point during 2026.",
    category: "FINANCIALS", prob: 0.18, volume: 25600, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },
  {
    title: "EUR/USD above 1.15 in 2026?",
    description: "Resolves YES if EUR/USD rises above 1.15 at any point during 2026.",
    category: "FINANCIALS", prob: 0.38, volume: 42800, closesAt: daysFromNow(310), daysActive: 40, region: "INT",
  },
  {
    title: "Brent crude oil above $100/barrel in 2026?",
    description: "Resolves YES if Brent crude closes above $100/barrel during 2026.",
    category: "FINANCIALS", prob: 0.30, volume: 42800, closesAt: daysFromNow(310), daysActive: 45, region: "INT",
  },

  // ── INTL COMPANIES & ENTERTAINMENT (7) ───────────────────
  {
    title: "Nvidia market cap above $5 trillion in 2026?",
    description: "Resolves YES if Nvidia's market cap exceeds $5 trillion during 2026.",
    category: "COMPANIES", prob: 0.42, volume: 87400, closesAt: daysFromNow(310), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400&q=80", region: "INT",
  },
  {
    title: "TikTok still operational in the US by end of 2026?",
    description: "Resolves YES if TikTok is available in the United States on December 31, 2026.",
    category: "COMPANIES", prob: 0.62, volume: 95200, closesAt: daysFromNow(310), daysActive: 75, region: "INT",
  },
  {
    title: "OpenAI IPO in 2026?",
    description: "Resolves YES if OpenAI completes an IPO on a major exchange during 2026.",
    category: "COMPANIES", prob: 0.25, volume: 58600, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
  },
  {
    title: "Tesla stock above $500 in 2026?",
    description: "Resolves YES if TSLA closes above $500 during 2026.",
    category: "COMPANIES", prob: 0.48, volume: 72100, closesAt: daysFromNow(310), daysActive: 50, region: "INT",
  },
  {
    title: "GTA 6 sales to exceed 30M copies in first month?",
    description: "Resolves YES if GTA VI sells over 30 million copies within 30 days of release.",
    category: "ENTERTAINMENT", prob: 0.62, volume: 88700, closesAt: daysFromNow(310), featured: true, daysActive: 55,
    imageUrl: "https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=400&q=80", region: "INT",
  },
  {
    title: "Nintendo Switch 2 to sell 20M+ units in 2026?",
    description: "Resolves YES if Nintendo Switch 2 sells 20M+ units worldwide during 2026.",
    category: "ENTERTAINMENT", prob: 0.52, volume: 47600, closesAt: daysFromNow(310), daysActive: 45, region: "INT",
  },

  // ── INTL CLIMATE & MISC (6) ──────────────────────────────
  {
    title: "2026 to be the hottest year on record?",
    description: "Resolves YES if NASA or NOAA declares 2026 the hottest year on record.",
    category: "CLIMATE", prob: 0.42, volume: 48700, closesAt: daysFromNow(330), daysActive: 50, region: "INT",
  },
  {
    title: "WHO to declare a new pandemic in 2026?",
    description: "Resolves YES if the WHO declares a new pandemic during 2026.",
    category: "CULTURE", prob: 0.08, volume: 67200, closesAt: daysFromNow(310), daysActive: 45, region: "INT",
  },
  {
    title: "Netflix to surpass 350M total subscribers in 2026?",
    description: "Resolves YES if Netflix reports 350M+ global subscribers in any 2026 report.",
    category: "ENTERTAINMENT", prob: 0.55, volume: 34100, closesAt: daysFromNow(310), daysActive: 35, region: "INT",
  },
  {
    title: "Global CO2 emissions to decline in 2026 vs 2025?",
    description: "Resolves YES if global CO2 emissions in 2026 are lower than 2025.",
    category: "CLIMATE", prob: 0.18, volume: 26800, closesAt: daysFromNow(350), daysActive: 40, region: "INT",
  },
  {
    title: "Arctic ice-free summer before September 2026?",
    description: "Resolves YES if Arctic sea ice extent drops below 1M sq km by September 2026.",
    category: "CLIMATE", prob: 0.08, volume: 31500, closesAt: daysFromNow(200), daysActive: 55, region: "INT",
  },
  {
    title: "Nuclear fusion net energy gain replicated by second lab in 2026?",
    description: "Resolves YES if a second laboratory achieves nuclear fusion net energy gain during 2026.",
    category: "TECH_SCIENCE", prob: 0.12, volume: 27600, closesAt: daysFromNow(310), daysActive: 55, region: "INT",
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
    const volumeFactor = Math.log10(m.def.volume) / Math.log10(250000);
    const numTrades = Math.max(30, Math.round(volumeFactor * 200));
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
  const BATCH_SIZE = 50;
  for (let i = 0; i < allTrades.length; i += BATCH_SIZE) {
    const batch = allTrades.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((td) => {
      const market = markets[td.marketIdx]!;
      return prisma.trade.create({
        data: { marketId: market.id, userId: td.userId, side: td.side, direction: td.direction, amount: td.amount, shares: td.shares, price: td.price, createdAt: td.createdAt },
      });
    }));
    if (i % 500 === 0 && i > 0) console.log(`  Inserted ${i}/${allTrades.length} trades...`);
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
  }

  console.log("Generating comments...");
  const COMMENT_TEMPLATES = [
    "Veldig bullish her. Fundamentalene er sterke.", "Kjøper mer YES. Virker underpriset.",
    "NO er riktig spill. Markedet overvurderer dette.", "Interessant marked. Følger med.",
    "Lastet opp med aksjer. Vi får se.", "Nåværende pris virker riktig.",
    "Altfor volatilt akkurat nå.", "Flott mulighet til å kjøpe dippet.",
    "Tror markedet mispriser dette.", "Solgte med fortjeneste. Lykke til!",
    "Burde handles høyere, eller?", "NO-siden virker tryggere her.",
    "Gale odds. Easy money.", "Markedet korrigerer snart.",
    "Sterk overbevisning. Økte posisjonen.", "Hva er tesen deres?",
    "Nettopp begynt med dette. Fascinerende!", "Sannsynligheten har endret seg mye.",
    "Tar profitt. Opp 40%.", "Et av de mest spennende markedene her.",
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
  console.log("\n✅ Seed complete!");
  console.log(`  🇳🇴 ${noCount} Norwegian markets`);
  console.log(`  🌍 ${intCount} International markets`);
  console.log(`  👤 1 admin + ${users.length} users`);
  console.log(`  📊 ${markets.length} total markets`);
  console.log(`  📈 ${allTrades.length} trades`);
  console.log(`  💰 ${posEntries.length} positions`);
  console.log(`  📉 ${snapshotCount} price snapshots`);
  console.log(`  💬 ${commentCount} comments`);
  console.log(`  🔑 Login: admin@vikingmarket.no / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
