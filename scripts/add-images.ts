/**
 * One-off script to add Unsplash images to all markets that don't have one.
 * Maps market titles to relevant, curated Unsplash photos.
 *
 * Usage: npx tsx scripts/add-images.ts
 */
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

// ─── IMAGE MAPPING ─────────────────────────────────────────
// Maps a keyword/phrase from the title → curated Unsplash photo
// All use ?w=800&q=80 format for consistent sizing
const IMAGE_MAP: Record<string, string> = {
  // ── SPORTS ──
  "Klæbo": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  "Kilde": "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&q=80",
  "gold record": "https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=800&q=80",
  "Ødegaard": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
  "Bodø/Glimt": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
  "Hovland": "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80",
  "20+ gold": "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&q=80",
  "Shiffrin": "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&q=80",
  "Hamilton": "https://images.unsplash.com/photo-1541889328-3d9adc92b7c3?w=800&q=80",
  "Real Madrid": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",

  // ── POLITICS ──
  "NATO Arctic": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "defense spending": "https://images.unsplash.com/photo-1580752300992-559f8e0734e0?w=800&q=80",
  "EU membership": "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
  "no-confidence": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80",
  "Rødt": "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80",
  "AI regulation": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "midterms": "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80",
  "India-Pakistan": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80",
  "digital services tax": "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80",

  // ── ECONOMICS / FINANCE ──
  "NOK/EUR": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "sovereign wealth": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
  "Oslo Børs": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  "CPI inflation": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  "electricity": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
  "salmon price": "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800&q=80",
  "Fed to cut": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
  "recession": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "Gold above": "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
  "EUR/USD": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "Japanese Yen": "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
  "Dollar index": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",

  // ── COMPANIES ──
  "Kahoot": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80",
  "unicorn": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
  "Equinor": "https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=800&q=80",
  "Mowi": "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800&q=80",
  "Nel ASA": "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800&q=80",
  "OpenAI IPO": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "Tesla stock": "https://images.unsplash.com/photo-1617704548623-340376564e68?w=800&q=80",
  "TikTok": "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80",

  // ── TECH / SCIENCE ──
  "Electric car": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
  "Anthropic": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  "Vision Pro": "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&q=80",
  "Tesla Full Self": "https://images.unsplash.com/photo-1617704548623-340376564e68?w=800&q=80",
  "ARC-AGI": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",

  // ── CRYPTO ──
  "Bitcoin above $120K": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
  "Ethereum": "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80",
  "stablecoin": "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&q=80",
  "market cap above $5": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
  "Solana": "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&q=80",
  "DNB": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",

  // ── CLIMATE ──
  "offshore wind": "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800&q=80",
  "Langskip": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
  "emissions": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
  "hottest year": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
  "CO2 emissions": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
  "Nuclear fusion": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",

  // ── ENTERTAINMENT / CULTURE ──
  "Norwegian film": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
  "NRK": "https://images.unsplash.com/photo-1504711434969-e33886168d9c?w=800&q=80",
  "Nintendo": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80",
  "Netflix": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80",
};

function findImage(title: string): string | null {
  for (const [keyword, url] of Object.entries(IMAGE_MAP)) {
    if (title.includes(keyword)) {
      return url;
    }
  }
  return null;
}

async function main() {
  console.log("Fetching markets without images...");

  const markets = await prisma.market.findMany({
    where: { imageUrl: null },
    select: { id: true, title: true, category: true },
  });

  console.log(`Found ${markets.length} markets without images.`);

  let updated = 0;
  let skipped = 0;

  for (const market of markets) {
    const imageUrl = findImage(market.title);
    if (imageUrl) {
      await prisma.market.update({
        where: { id: market.id },
        data: { imageUrl },
      });
      console.log(`  ✅ ${market.title.substring(0, 60)}...`);
      updated++;
    } else {
      console.log(`  ⏭️  No match: ${market.title.substring(0, 60)}...`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
