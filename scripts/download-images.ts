/**
 * Download all market images from Wikimedia Commons to /public/markets/
 * Then update the database to use local paths instead of external URLs.
 * This eliminates Wikimedia rate-limiting (503) when loading many images at once.
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
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function getExtFromUrl(url: string): string {
  // Get extension from the URL filename
  const filename = url.split("/").pop() || "";
  if (filename.endsWith(".jpg") || filename.endsWith(".JPG")) return ".jpg";
  if (filename.endsWith(".jpeg") || filename.endsWith(".JPEG")) return ".jpg";
  if (filename.endsWith(".png") || filename.endsWith(".PNG")) return ".png";
  if (filename.endsWith(".svg")) return ".svg";
  // SVG thumbnails rendered as PNG
  if (filename.includes(".svg.png")) return ".png";
  return ".jpg"; // fallback
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadImage(
  url: string,
  filepath: string
): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
    if (!resp.ok) {
      console.error(`    ❌ HTTP ${resp.status} for ${url}`);
      return false;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    writeFileSync(filepath, buffer);
    return true;
  } catch (err: any) {
    console.error(`    ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const markets = await prisma.market.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { title: "asc" },
  });

  console.log(`📷 Downloading images for ${markets.length} markets...\n`);

  // Deduplicate URLs first (many markets share the same image)
  const urlToSlug = new Map<string, string>(); // url → local filename
  const marketUrlPairs: { id: string; title: string; url: string }[] = [];

  for (const m of markets) {
    const url = m.imageUrl!;
    if (!url.startsWith("http")) continue; // skip already-local paths
    marketUrlPairs.push({ id: m.id, title: m.title, url });

    if (!urlToSlug.has(url)) {
      const ext = getExtFromUrl(url);
      const slug = slugify(m.title);
      urlToSlug.set(url, `${slug}${ext}`);
    }
  }

  console.log(`  ${urlToSlug.size} unique URLs to download\n`);

  // Download each unique image (with delays to avoid rate limits)
  let downloaded = 0;
  let failed = 0;

  for (const [url, filename] of urlToSlug) {
    const filepath = join(PUBLIC_DIR, filename);

    if (existsSync(filepath)) {
      console.log(`  ⏭  ${filename} (already exists)`);
      downloaded++;
      continue;
    }

    let ok = await downloadImage(url, filepath);
    if (!ok) {
      // Retry once after longer wait for 429s
      console.log(`    ⏳ Retrying in 8s...`);
      await sleep(8000);
      ok = await downloadImage(url, filepath);
    }
    if (ok) {
      console.log(`  ✅ ${filename}`);
      downloaded++;
    } else {
      failed++;
    }

    // Rate limit: 2.5s between downloads to avoid Wikimedia 429
    await sleep(2500);
  }

  console.log(`\n  Downloaded: ${downloaded}, Failed: ${failed}\n`);

  // Now update the database URLs to local paths
  console.log("📝 Updating database URLs to local paths...\n");
  let updated = 0;

  for (const { id, url } of marketUrlPairs) {
    const filename = urlToSlug.get(url);
    if (!filename) continue;

    const localPath = `/markets/${filename}`;
    const filepath = join(PUBLIC_DIR, filename);

    if (!existsSync(filepath)) {
      console.log(`  ⏭  Skipping ${filename} (not downloaded)`);
      continue;
    }

    await prisma.market.update({
      where: { id },
      data: { imageUrl: localPath },
    });
    updated++;
  }

  console.log(`\n✅ Updated ${updated} markets to use local images`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
