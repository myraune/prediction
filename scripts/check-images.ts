/**
 * Check which market image URLs are broken (return non-200 status)
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

async function main() {
  const markets = await prisma.market.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { title: "asc" },
  });

  console.log(`Testing ${markets.length} image URLs...\n`);

  const broken: { id: string; title: string; url: string; status: string }[] = [];

  // Test in batches of 10
  for (let i = 0; i < markets.length; i += 10) {
    const batch = markets.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (m) => {
        const url = m.imageUrl!;
        try {
          const resp = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            headers: { "User-Agent": "Mozilla/5.0 (compatible; ImageCheck/1.0)" },
          });
          if (!resp.ok) {
            // Some servers block HEAD requests, fall back to GET
            const resp2 = await fetch(url, {
              method: "GET",
              redirect: "follow",
              headers: { "User-Agent": "Mozilla/5.0 (compatible; ImageCheck/1.0)" },
            });
            if (!resp2.ok) {
              return { id: m.id, title: m.title, url, status: `${resp2.status}` };
            }
          }
          return null;
        } catch (err: any) {
          return { id: m.id, title: m.title, url, status: err.message || "FETCH_ERROR" };
        }
      })
    );
    for (const r of results) {
      if (r) broken.push(r);
    }
    process.stdout.write(`  Checked ${Math.min(i + 10, markets.length)}/${markets.length}\r`);
  }

  console.log("\n");

  if (broken.length === 0) {
    console.log("✅ All image URLs are valid!");
  } else {
    console.log(`❌ ${broken.length} broken images:\n`);
    for (const b of broken) {
      console.log(`  [${b.status}] ${b.title}`);
      console.log(`  ${b.url}\n`);
    }
  }

  await prisma.$disconnect();
}

main();
