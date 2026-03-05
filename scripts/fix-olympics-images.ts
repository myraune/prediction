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
  // Fix the broken 2026 Winter Olympics logo (404)
  const oldUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/2026_Winter_Olympics_logo.svg/960px-2026_Winter_Olympics_logo.svg.png";
  const newUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/OLYMPIC_OPENING_CEREMONY_MILANO-CORTINA_2026_STADIO_SAN_SIRO.jpg/600px-OLYMPIC_OPENING_CEREMONY_MILANO-CORTINA_2026_STADIO_SAN_SIRO.jpg";
  
  const result = await prisma.market.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl },
  });
  console.log(`Fixed ${result.count} Olympics markets`);

  // Also fix the Global_Temperature_Anomaly (which existed but was fragile SVG thumb)
  const oldTemp = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Global_Temperature_Anomaly.svg/960px-Global_Temperature_Anomaly.svg.png";
  const newTemp = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Global_Temperature_Anomaly.svg/600px-Global_Temperature_Anomaly.svg.png";
  const r2 = await prisma.market.updateMany({
    where: { imageUrl: oldTemp },
    data: { imageUrl: newTemp },
  });
  console.log(`Fixed ${r2.count} global temp markets`);

  await prisma.$disconnect();
}
main();
