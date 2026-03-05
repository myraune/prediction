/**
 * Download remaining failed images at smaller thumbnail sizes (600px instead of 960px)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter });
const PUBLIC_DIR = join(process.cwd(), "public", "markets");

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
function getExtFromUrl(url: string): string {
  const f = url.split("/").pop() || "";
  if (f.endsWith(".svg.png") || f.endsWith(".PNG") || f.endsWith(".png")) return ".png";
  return ".jpg";
}
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function makeSmaller(url: string): string {
  // Replace 960px with 600px in thumbnail URLs
  return url.replace(/960px-/, "600px-");
}

async function main() {
  // Find markets still pointing to wikimedia (not yet downloaded)
  const markets = await prisma.market.findMany({
    where: { imageUrl: { startsWith: "https://upload.wikimedia.org" } },
    select: { id: true, title: true, imageUrl: true },
  });

  console.log(`${markets.length} markets still using Wikimedia URLs\n`);

  // Deduplicate
  const urlMap = new Map<string, { slug: string; ext: string }>();
  for (const m of markets) {
    const url = m.imageUrl!;
    if (!urlMap.has(url)) {
      urlMap.set(url, { slug: slugify(m.title), ext: getExtFromUrl(url) });
    }
  }

  console.log(`${urlMap.size} unique URLs to try at 600px\n`);

  let downloaded = 0;
  let failed = 0;
  const failedUrls: string[] = [];

  for (const [url, { slug, ext }] of urlMap) {
    const filename = `${slug}${ext}`;
    const filepath = join(PUBLIC_DIR, filename);

    if (existsSync(filepath)) { downloaded++; continue; }

    // Try 600px version
    const smallUrl = makeSmaller(url);
    try {
      const resp = await fetch(smallUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        redirect: "follow",
      });
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        writeFileSync(filepath, buf);
        console.log(`  ✅ ${filename} (600px)`);
        downloaded++;
      } else {
        // Try 400px
        const tinyUrl = url.replace(/960px-/, "400px-");
        const resp2 = await fetch(tinyUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
          redirect: "follow",
        });
        if (resp2.ok) {
          const buf = Buffer.from(await resp2.arrayBuffer());
          writeFileSync(filepath, buf);
          console.log(`  ✅ ${filename} (400px)`);
          downloaded++;
        } else {
          // Try original (non-thumb)
          const origUrl = url.replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");
          const resp3 = await fetch(origUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
            redirect: "follow",
          });
          if (resp3.ok) {
            const buf = Buffer.from(await resp3.arrayBuffer());
            writeFileSync(filepath, buf);
            console.log(`  ✅ ${filename} (original)`);
            downloaded++;
          } else {
            console.log(`  ❌ ${filename} (all sizes failed: ${resp.status}/${resp2.status}/${resp3.status})`);
            failedUrls.push(url);
            failed++;
          }
        }
      }
    } catch (err: any) {
      console.log(`  ❌ ${filename}: ${err.message}`);
      failedUrls.push(url);
      failed++;
    }

    await sleep(3000);
  }

  console.log(`\nDownloaded: ${downloaded}, Failed: ${failed}`);

  if (failedUrls.length > 0) {
    console.log(`\nFailed URLs:`);
    for (const u of failedUrls) console.log(`  ${u}`);
  }

  // Update DB for newly downloaded files
  console.log(`\n📝 Updating database...`);
  let updated = 0;
  for (const m of markets) {
    const url = m.imageUrl!;
    const info = urlMap.get(url)!;
    const filename = `${info.slug}${info.ext}`;
    const filepath = join(PUBLIC_DIR, filename);
    if (existsSync(filepath)) {
      await prisma.market.update({
        where: { id: m.id },
        data: { imageUrl: `/markets/${filename}` },
      });
      updated++;
    }
  }
  console.log(`✅ Updated ${updated} markets`);
  await prisma.$disconnect();
}
main();
