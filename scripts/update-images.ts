/**
 * Update market images — replace generic Unsplash stock photos
 * with specific, relevant images from Wikimedia Commons
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

// Map: partial title match → new image URL
// Order matters: first match wins, so put specific matches before general ones
const IMAGE_MAP: [string | RegExp, string][] = [
  // ── PEOPLE (Norwegian) ───────────────────────────────
  ["Erna Solberg", "https://upload.wikimedia.org/wikipedia/commons/d/dc/Erna_Solberg%2C_EPP_Congress_2025_Valencia_Day_1_%2854484743746%2C_cropped%29.jpg"],
  ["Erling Haaland", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Erling_Haaland_June_2025.jpg/960px-Erling_Haaland_June_2025.jpg"],
  [/Ødegaard|Odegaard/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Norway_Italy_-_June_2025_E_04.jpg/960px-Norway_Italy_-_June_2025_E_04.jpg"],
  ["Jakob Ingebrigtsen", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/2018_European_Athletics_Championships_Day_5_%2830%29_%28cropped%29.jpg/960px-2018_European_Athletics_Championships_Day_5_%2830%29_%28cropped%29.jpg"],
  ["Viktor Hovland", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Viktor_Hovland_Ryder_Cup_2025-205_%28cropped%29.jpg/960px-Viktor_Hovland_Ryder_Cup_2025-205_%28cropped%29.jpg"],
  ["Casper Ruud", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Ruud_RG22_%2858%29_%2852144535415%29.jpg/960px-Ruud_RG22_%2858%29_%2852144535415%29.jpg"],
  ["Karsten Warholm", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Karsten_Warholm_at_Istanbul_2023.jpg/960px-Karsten_Warholm_at_Istanbul_2023.jpg"],
  [/Klæbo|Klaebo/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/20190301_FIS_NWSC_Seefeld_Medal_Ceremony_850_6079_%28cropped%29.jpg/960px-20190301_FIS_NWSC_Seefeld_Medal_Ceremony_850_6079_%28cropped%29.jpg"],
  ["Therese Johaug", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Therese_Johaug_2465.jpg/960px-Therese_Johaug_2465.jpg"],
  [/Kilde/, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Aleksander_Aamodt_Kilde_-_Bormio_2019_%28cropped%29.jpg/960px-Aleksander_Aamodt_Kilde_-_Bormio_2019_%28cropped%29.jpg"],

  // ── PEOPLE (International) ───────────────────────────
  ["Lewis Hamilton", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/960px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg"],
  ["Max Verstappen", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg/960px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg"],
  ["Djokovic", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Novak_Djokovic_2024_Paris_Olympics.jpg/960px-Novak_Djokovic_2024_Paris_Olympics.jpg"],
  ["Alcaraz", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Carlos_Alcaraz_2025_FO.jpg/960px-Carlos_Alcaraz_2025_FO.jpg"],
  ["LeBron", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/960px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg"],
  ["Messi", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg/960px-Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg"],
  ["Shiffrin", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Mikaela_Shiffrin_%28Portrait%29.jpg/960px-Mikaela_Shiffrin_%28Portrait%29.jpg"],
  ["Ohtani", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dodgers_at_Nationals_%2853677192000%29_%28cropped%29.jpg/960px-Dodgers_at_Nationals_%2853677192000%29_%28cropped%29.jpg"],
  [/Pogačar|Pogacar/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/2022_Tour_of_Slovenia_%28Stage_3%2C_Tadej_Poga%C4%8Dar_celebrating_victory_on_Celje_Castle_v2%29.jpg/960px-2022_Tour_of_Slovenia_%28Stage_3%2C_Tadej_Poga%C4%8Dar_celebrating_victory_on_Celje_Castle_v2%29.jpg"],
  ["Jon Jones", "https://upload.wikimedia.org/wikipedia/commons/4/43/Jon_Jones_-_Supporting_Brain_Health_Study.jpg"],
  ["Trump", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg/960px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg"],

  // ── COMPANIES / ORGS (Norwegian) ─────────────────────
  ["Equinor", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Equinor_Mongstad.jpg/960px-Equinor_Mongstad.jpg"],
  [/Kongsberg/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Norwegian_Advanced_Surface_to_Air_Missile_System.jpg/960px-Norwegian_Advanced_Surface_to_Air_Missile_System.jpg"],
  ["DNB", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Bj%C3%B8rvika_at_sunset.jpg/960px-Bj%C3%B8rvika_at_sunset.jpg"],
  ["Norsk Hydro", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Norsk_Hydro_ASA_headquarters_in_V%C3%A6ker%C3%B8_01.jpg/960px-Norsk_Hydro_ASA_headquarters_in_V%C3%A6ker%C3%B8_01.jpg"],
  [/Mowi|salmon/, "https://upload.wikimedia.org/wikipedia/commons/f/f2/Fish_farming_in_Torskefjorden%2C_Senja%2C_Troms%2C_Norway%2C_2014_August.jpg"],
  ["Kahoot", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kahoot%21_HQ.jpg/960px-Kahoot%21_HQ.jpg"],
  ["Yara", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Yara_International_ASA_%28logo%29.svg/960px-Yara_International_ASA_%28logo%29.svg.png"],
  [/Telenor/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Fornebu_S_and_Telenor_HQ.jpg/960px-Fornebu_S_and_Telenor_HQ.jpg"],
  [/Nel ASA|green hydrogen/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/H2_Filling_Station_Halle.jpg/960px-H2_Filling_Station_Halle.jpg"],

  // ── COMPANIES / ORGS (International) ─────────────────
  ["Nvidia", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/2788-2888_San_Tomas_Expwy.jpg/960px-2788-2888_San_Tomas_Expwy.jpg"],
  [/Tesla/, "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_Model_S_%28Facelift_ab_04-2016%29_trimmed.jpg/960px-Tesla_Model_S_%28Facelift_ab_04-2016%29_trimmed.jpg"],
  ["OpenAI", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/960px-ChatGPT-Logo.svg.png"],
  [/TikTok/, "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/TikTok_brand_logo.svg/960px-TikTok_brand_logo.svg.png"],
  [/Nintendo|Switch/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nintendo_Switch_OLED_Model.png/960px-Nintendo_Switch_OLED_Model.png"],
  ["Netflix", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/2015_Netflix_logo.svg/960px-2015_Netflix_logo.svg.png"],
  ["Ferrari", "https://upload.wikimedia.org/wikipedia/commons/9/99/SF-24_at_the_Japanese_GP.jpg"],

  // ── POLITICS / INSTITUTIONS ──────────────────────────
  ["Eurovision", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Eurovision_Song_Contest_logo.svg/960px-Eurovision_Song_Contest_logo.svg.png"],
  [/Storting|no-confidence|government crisis/, "https://upload.wikimedia.org/wikipedia/commons/b/bb/Storting_building.jpg"],
  ["NATO", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/960px-Flag_of_NATO.svg.png"],
  [/EU member|EU.*tax|EU.*tariff|EU.*digital|EU.*antitrust|EU.*climate/, "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/960px-Flag_of_Europe.svg.png"],
  [/Rødt|Red Party/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/R%C3%B8dt_logo.svg/960px-R%C3%B8dt_logo.svg.png"],
  [/midterm|Congress|US.*regulation/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/US_Capitol_Building_at_night_Jan_2006.jpg/960px-US_Capitol_Building_at_night_Jan_2006.jpg"],
  [/Ukraine.*Russia|Russia.*Ukraine/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Ukraine.svg/960px-Flag_of_Ukraine.svg.png"],
  [/India.*Pakistan|Pakistan.*India/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/960px-Flag_of_India.svg.png"],

  // ── FINANCE / ECONOMICS ──────────────────────────────
  [/Norges Bank|rate.*cut.*Norway|Norwegian.*CPI/, "https://upload.wikimedia.org/wikipedia/commons/6/67/Norges_Bank_Kirkegata.jpg"],
  [/Oslo Børs|OBX|Oslo.*stock/, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Oslo_Bors_StockLink.JPG/960px-Oslo_Bors_StockLink.JPG"],
  [/sovereign wealth fund/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Norges_Bank_Investment_Management_logo.svg/960px-Norges_Bank_Investment_Management_logo.svg.png"],
  [/Fed.*cut|Federal Reserve|FOMC/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg/960px-Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg"],
  [/S&P 500|recession/, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/New_York_Stock_Exchange_NYC.jpg/960px-New_York_Stock_Exchange_NYC.jpg"],
  [/Brent crude|oil.*barrel/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Oil_platform_P-51_%28Brazil%29.jpg/960px-Oil_platform_P-51_%28Brazil%29.jpg"],
  [/NOK.*EUR|krone/, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Norges_Banks_seddelserie_VIII.jpg/960px-Norges_Banks_seddelserie_VIII.jpg"],
  [/housing.*Oslo/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Gr%C3%BCnerl%C3%B8kka.jpg/960px-Gr%C3%BCnerl%C3%B8kka.jpg"],
  [/electricity|kWh/, "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Alta_dam.jpg/960px-Alta_dam.jpg"],

  // ── SPORTS (teams/events) ────────────────────────────
  [/Milano Cortina|Winter Olympics|gold medal table|total medals/, "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/2026_Winter_Olympics_logo.svg/960px-2026_Winter_Olympics_logo.svg.png"],
  [/World Cup.*USA|FIFA.*2026|World Cup.*host/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png"],
  [/World Cup.*Argentina|Argentina.*defend/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png"],
  [/World Cup.*England/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png"],
  [/World Cup.*Brazil/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png"],
  [/World Cup.*African/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2026_FIFA_World_Cup.svg/960px-2026_FIFA_World_Cup.svg.png"],
  [/Champions League/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/UEFA_Champions_League.svg/960px-UEFA_Champions_League.svg.png"],
  [/Premier League.*Liverpool/, "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Liverpool_FC.svg/960px-Liverpool_FC.svg.png"],
  [/Premier League.*Arsenal/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Arsenal_FC.svg/960px-Arsenal_FC.svg.png"],
  [/Bodø.*Glimt|Eliteserien/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/FK_Bod%C3%B8-Glimt_logo.svg/960px-FK_Bod%C3%B8-Glimt_logo.svg.png"],
  [/Rosenborg/, "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Rosenborg_BK_logo.svg/960px-Rosenborg_BK_logo.svg.png"],
  [/Brann/, "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/SK_Brann_logo.svg/960px-SK_Brann_logo.svg.png"],
  [/Molde/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Molde_FK.svg/960px-Molde_FK.svg.png"],
  [/Ryder Cup/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Ryder_Cup.svg/960px-Ryder_Cup.svg.png"],
  [/NBA.*Celtics|Celtics.*champion/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Boston_Celtics.svg/960px-Boston_Celtics.svg.png"],
  [/handball.*men/, "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Handball_pictogram.svg/960px-Handball_pictogram.svg.png"],
  [/handball.*women/, "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Handball_pictogram.svg/960px-Handball_pictogram.svg.png"],

  // ── CRYPTO ───────────────────────────────────────────
  [/Bitcoin|BTC/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/960px-Bitcoin.svg.png"],
  [/Ethereum|ETH/, "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ethereum_logo_2014.svg/960px-Ethereum_logo_2014.svg.png"],
  [/stablecoin|crypto.*market cap/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/960px-Bitcoin.svg.png"],
  [/Solana/, "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Solana_cryptocurrency_two.jpg/960px-Solana_cryptocurrency_two.jpg"],

  // ── TECH / SCIENCE ───────────────────────────────────
  [/AI.*regulation|Congress.*AI/, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/US_Capitol_Building_at_night_Jan_2006.jpg/960px-US_Capitol_Building_at_night_Jan_2006.jpg"],
  [/GPT-5/, "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/960px-ChatGPT-Logo.svg.png"],
  ["Anthropic", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/960px-Anthropic_logo.svg.png"],
  [/Vision Pro|Apple.*headset/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Apple_Vision_Pro_headset.png/960px-Apple_Vision_Pro_headset.png"],
  [/ARC-AGI|AI.*benchmark/, "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Artificial_neural_network.svg/960px-Artificial_neural_network.svg.png"],
  [/NRK/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/NRK_logo.svg/960px-NRK_logo.svg.png"],
  [/Electric car|EV.*share/, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Nissan_Leaf_Tromso.jpg/960px-Nissan_Leaf_Tromso.jpg"],
  [/unicorn|startup/, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Oslo_Opera_House_seen_from_Langkaia.jpg/960px-Oslo_Opera_House_seen_from_Langkaia.jpg"],
  [/Norwegian film/, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/35mm_movie_negative.jpg/960px-35mm_movie_negative.jpg"],
  [/GTA.*6|Grand Theft Auto/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/960px-Rockstar_Games_Logo.svg.png"],

  // ── CLIMATE / WEATHER ────────────────────────────────
  ["Svalbard", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Longyearbyen_colourful_homes.jpg/960px-Longyearbyen_colourful_homes.jpg"],
  ["Nordkapp", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Nordkapp_2.jpg/960px-Nordkapp_2.jpg"],
  [/Bergen.*rain/, "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Bryggen_in_Bergen.jpg/960px-Bryggen_in_Bergen.jpg"],
  [/Tromsø/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Troms%C3%B8_2020-02-28.jpg/960px-Troms%C3%B8_2020-02-28.jpg"],
  [/Oslo.*snow|snow.*Oslo/, "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Karl_Johans_gate_in_Winter.jpg/960px-Karl_Johans_gate_in_Winter.jpg"],
  [/Oslo.*20°C|Oslo.*25°C|summer.*Oslo|Oslo.*warm/, "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Vigeland_Park%2C_Oslo.jpg/960px-Vigeland_Park%2C_Oslo.jpg"],
  [/hurricane|Hurricane/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Hurricane_Irma_2017-09-05_1706Z_%28Worldview%29.jpg/960px-Hurricane_Irma_2017-09-05_1706Z_%28Worldview%29.jpg"],
  [/Arctic.*sea ice/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Ice_capped_mountains_in_arctic.jpg/960px-Ice_capped_mountains_in_arctic.jpg"],
  [/heatwave|40°C/, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Thermometer_in_Sun.jpg/960px-Thermometer_in_Sun.jpg"],
  [/El Niño|La Niña|ENSO/, "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/ENSO_-_El_Ni%C3%B1o.svg/960px-ENSO_-_El_Ni%C3%B1o.svg.png"],
  [/CO₂|CO2|Mauna Loa/, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mauna_Loa_Observatory.jpg/960px-Mauna_Loa_Observatory.jpg"],
  [/global.*temperature|hottest year|1\.5°C/, "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Global_Temperature_Anomaly.svg/960px-Global_Temperature_Anomaly.svg.png"],
  [/flood|Flood/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/2023_Hans_flood_in_Norway_%2801%29.jpg/960px-2023_Hans_flood_in_Norway_%2801%29.jpg"],
  [/ekstremvær|named storm/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Waves_in_pacridge.jpg/960px-Waves_in_pacridge.jpg"],
  [/red.*warning|rødt farevarsel/, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Yr.no_icon_Farevarsel.svg/960px-Yr.no_icon_Farevarsel.svg.png"],
  [/warmest.*record|summer.*warmest/, "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sun_in_February.jpg/960px-Sun_in_February.jpg"],
  [/defense.*spending|defence.*spending/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Norwegian_Advanced_Surface_to_Air_Missile_System.jpg/960px-Norwegian_Advanced_Surface_to_Air_Missile_System.jpg"],

  // ── FINANCE (International) ──────────────────────────
  [/Gold.*\$|gold.*oz/, "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Gold_Bars.jpg/960px-Gold_Bars.jpg"],
  [/EUR.*USD|Dollar.*index|DXY|Yen/, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/New_York_Stock_Exchange_NYC.jpg/960px-New_York_Stock_Exchange_NYC.jpg"],
  [/Aker BP/, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Oil_platform_P-51_%28Brazil%29.jpg/960px-Oil_platform_P-51_%28Brazil%29.jpg"],
];

async function main() {
  console.log("🖼️  Updating market images...\n");

  const markets = await prisma.market.findMany({
    select: { id: true, title: true, imageUrl: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const market of markets) {
    let newUrl: string | null = null;

    for (const [pattern, url] of IMAGE_MAP) {
      if (typeof pattern === "string") {
        if (market.title.includes(pattern)) {
          newUrl = url;
          break;
        }
      } else {
        if (pattern.test(market.title)) {
          newUrl = url;
          break;
        }
      }
    }

    if (newUrl && newUrl !== market.imageUrl) {
      await prisma.market.update({
        where: { id: market.id },
        data: { imageUrl: newUrl },
      });
      console.log(`  ✓ ${market.title.slice(0, 65)}`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Updated ${updated} market images (${skipped} unchanged)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
