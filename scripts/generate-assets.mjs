#!/usr/bin/env node
/**
 * Asset generator — Underground Paris
 * Uses Pollinations.ai (free, no API key) to generate game sprites and textures.
 *
 * Usage:
 *   node scripts/generate-assets.mjs
 *   node scripts/generate-assets.mjs --asset player_idle
 *   node scripts/generate-assets.mjs --list
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../src/assets/generated");

const BASE_STYLE =
  "black and white fanzine style, acid neon highlights, flat 2D game sprite, 90s Paris rave aesthetic";

const ASSETS = [
  // --- Player ---
  {
    name: "player_idle",
    description: "Player character — standing idle",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, standing idle pose. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_walk",
    description: "Player character — walking",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, mid-walk pose. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- Contacts ---
  {
    name: "contact_dj_masta_klem",
    description: "DJ Masta Klem — sonorisateur, Vitry 94",
    prompt: `2D game sprite of a Black DJ character carrying a crate of vinyl records, 90s streetwear, cap, oversized jacket. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_faiza",
    description: "Faïza La Logiste — organisation, Stalingrad 19e",
    prompt: `2D game sprite of a French-North African woman organizer, clipboard in hand, practical clothing, sharp eyes, 90s style. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_seb_le_blond",
    description: "Seb le Blond — Châtelet",
    prompt: `2D game sprite of a scruffy blond French guy, unreliable vibe, 90s casual clothes, cigarette behind ear. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_oxane",
    description: "Oxane — photographe, Belleville 20e",
    prompt: `2D game sprite of a young woman photographer, 35mm camera around neck, artsy 90s clothes, Belleville aesthetic. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_karim",
    description: "Karim Le Mécano — générateurs, Pantin 93",
    prompt: `2D game sprite of a mechanic man with generator equipment, work clothes, Pantin banlieue 90s style, sturdy build. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- Antagonists ---
  {
    name: "cop_bac",
    description: "BAC de nuit — patrouille visible",
    prompt: `2D game sprite of a French BAC night police officer, dark uniform, visible patrol stance, threatening. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_rg",
    description: "RG en civil — détective discret",
    prompt: `2D game sprite of a plainclothes French intelligence officer, subtle tells, trench coat, 90s Paris street, blending in. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- UI ---
  {
    name: "ui_menu_cover",
    description: "Menu principal — couverture de fanzine",
    prompt: `Underground Paris rave fanzine cover, hand-drawn lettering, black and white photocopied texture, acid neon highlights, 90s Paris underground rave scene. Full page layout. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_gameover",
    description: "Game over — une de journal fictif",
    prompt: `Fictional French newspaper front page, big dramatic headline about a failed rave, black and white newspaper texture with photocopied grain, neon highlights. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_flyer_rave",
    description: "Sélection de niveau — flyer de rave",
    prompt: `Underground rave party flyer, Paris 1990s, hand-stamped typography, black and white photocopied with acid neon color accents, torn edges. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function generateImage(asset, retries = 5) {
  const encodedPrompt = encodeURIComponent(asset.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${asset.width}&height=${asset.height}&nologo=true&model=flux&seed=${seed}`;

  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 15000;
        console.log(`  [retry ${i + 1}] ${e.message} — waiting ${wait / 1000}s...`);
        await sleep(wait);
      } else {
        throw e;
      }
    }
  }
}

async function generateAsset(asset) {
  const outPath = path.join(OUTPUT_DIR, `${asset.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${asset.name} — already exists`);
    return;
  }
  console.log(`  [gen]  ${asset.name} — ${asset.description}`);
  try {
    const imageBuffer = await generateImage(asset);
    fs.writeFileSync(outPath, imageBuffer);
    console.log(`  [ok]   saved → src/assets/generated/${asset.name}.png`);
  } catch (e) {
    console.log(`  [fail] ${asset.name} — ${e.message} (skipped)`);
  }
  await sleep(5000); // pause between assets to avoid rate limiting
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available assets:");
    ASSETS.forEach((a) =>
      console.log(`  ${a.name.padEnd(32)} ${a.description}`)
    );
    return;
  }

  const targetIndex = args.indexOf("--asset");
  const target = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const toGenerate = target ? ASSETS.filter((a) => a.name === target) : ASSETS;

  if (target && toGenerate.length === 0) {
    console.error(`Asset "${target}" not found. Use --list to see available assets.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${toGenerate.length} asset(s) → src/assets/generated/\n`);
  for (const asset of toGenerate) {
    await generateAsset(asset);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
