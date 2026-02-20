import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log("Adding region column to Market table...");
  try {
    await client.execute('ALTER TABLE Market ADD COLUMN region TEXT NOT NULL DEFAULT "NO"');
    console.log("Column added.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column")) {
      console.log("Column already exists, skipping.");
    } else {
      throw e;
    }
  }

  console.log("Creating index on region...");
  await client.execute("CREATE INDEX IF NOT EXISTS Market_region_idx ON Market(region)");
  console.log("Done!");
}

main().catch(console.error);
