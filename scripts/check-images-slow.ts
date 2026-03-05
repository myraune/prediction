import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const markets = await prisma.market.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { title: "asc" },
  });

  // Deduplicate URLs
  const urlToMarkets = new Map<string, string[]>();
  for (const m of markets) {
    const url = m.imageUrl!;
    if (!urlToMarkets.has(url)) urlToMarkets.set(url, []);
    urlToMarkets.get(url)!.push(m.title);
  }

  console.log(`Testing ${urlToMarkets.size} unique image URLs (${markets.length} markets)...\n`);

  const broken: { url: string; titles: string[]; status: string }[] = [];
  let i = 0;

  for (const [url, titles] of urlToMarkets) {
    i++;
    try {
      const resp = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      });
      if (!resp.ok) {
        broken.push({ url, titles, status: `${resp.status}` });
        console.log(`  ❌ [${resp.status}] ${titles[0]}`);
      } else {
        // Consume body to free connection
        await resp.arrayBuffer();
      }
    } catch (err: any) {
      broken.push({ url, titles, status: err.message || "FETCH_ERROR" });
      console.log(`  ❌ [ERR] ${titles[0]}: ${err.message}`);
    }
    // Rate limit: 500ms between requests
    if (i % 5 === 0) await sleep(1000);
    else await sleep(300);
  }

  console.log(`\n${"=".repeat(60)}`);
  if (broken.length === 0) {
    console.log("✅ All image URLs are valid!");
  } else {
    console.log(`\n❌ ${broken.length} broken URLs affecting ${broken.reduce((s, b) => s + b.titles.length, 0)} markets:\n`);
    for (const b of broken) {
      console.log(`  [${b.status}] ${b.url}`);
      for (const t of b.titles) console.log(`    → ${t}`);
      console.log();
    }
  }

  await prisma.$disconnect();
}

main();
