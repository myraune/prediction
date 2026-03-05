/**
 * Fix the 9 broken Wikimedia image URLs (404s) with verified working ones
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

// Old broken URL → new working URL
const FIXES: [string, string][] = [
  // 1. FIFA World Cup 2026
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/2026_FIFA_World_Cup_emblem_%28with_wordmark%29.svg/600px-2026_FIFA_World_Cup_emblem_%28with_wordmark%29.png",
  ],
  // 2. Apple Vision Pro
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Apple_Vision_Pro_headset.png/960px-Apple_Vision_Pro_headset.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Apple_Vision_Pro_in_Apple_Store_Nagoya_-_6.jpg/600px-Apple_Vision_Pro_in_Apple_Store_Nagoya_-_6.jpg",
  ],
  // 3. Hurricane satellite image
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Hurricane_Irma_2017-09-05_1706Z_%28Worldview%29.jpg/960px-Hurricane_Irma_2017-09-05_1706Z_%28Worldview%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Irma_2017-09-06_1745Z.jpg/600px-Irma_2017-09-06_1745Z.jpg",
  ],
  // 4. NYSE building
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/New_York_Stock_Exchange_NYC.jpg/960px-New_York_Stock_Exchange_NYC.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/NYSE_Building.JPG/600px-NYSE_Building.JPG",
  ],
  // 5. ENSO / El Niño (needed .png extension for SVG thumbnail)
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/ENSO_-_El_Ni%C3%B1o.svg/960px-ENSO_-_El_Ni%C3%B1o.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ENSO_-_El_Ni%C3%B1o.svg/600px-ENSO_-_El_Ni%C3%B1o.png",
  ],
  // 6. Karl Johans gate winter
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Karl_Johans_gate_in_Winter.jpg/960px-Karl_Johans_gate_in_Winter.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Karl_Johans_gate_from_Slottsplassen%2C_with_snow.jpg/600px-Karl_Johans_gate_from_Slottsplassen%2C_with_snow.jpg",
  ],
  // 7. NRK logo
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/NRK_logo.svg/960px-NRK_logo.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/NRK_Norsk_rikskringkasting_corporate_logo.svg/600px-NRK_Norsk_rikskringkasting_corporate_logo.png",
  ],
  // 8. Oslo Opera House (.jpg → .JPG)
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Oslo_Opera_House_seen_from_Langkaia.jpg/960px-Oslo_Opera_House_seen_from_Langkaia.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Oslo_Opera_House_seen_from_Langkaia.JPG/600px-Oslo_Opera_House_seen_from_Langkaia.JPG",
  ],
  // 9. US Capitol
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/US_Capitol_Building_at_night_Jan_2006.jpg/960px-US_Capitol_Building_at_night_Jan_2006.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/US_Capitol_west_side_at_dusk.JPG/600px-US_Capitol_west_side_at_dusk.JPG",
  ],
];

async function main() {
  console.log("🔧 Fixing 9 broken image URLs...\n");

  let fixed = 0;
  for (const [oldUrl, newUrl] of FIXES) {
    const result = await prisma.market.updateMany({
      where: { imageUrl: oldUrl },
      data: { imageUrl: newUrl },
    });
    if (result.count > 0) {
      console.log(`  ✓ Fixed ${result.count} market(s): ${oldUrl.split("/").pop()}`);
      fixed += result.count;
    } else {
      console.log(`  - No matches for: ${oldUrl.split("/").pop()}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} markets total`);
  await prisma.$disconnect();
}

main();
