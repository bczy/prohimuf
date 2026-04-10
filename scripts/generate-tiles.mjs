#!/usr/bin/env node
/**
 * Tile sprite generator — Underground Paris
 * Generates building facade tile textures via Pollinations.ai (free, no API key).
 *
 * Usage:
 *   node scripts/generate-tiles.mjs
 *   node scripts/generate-tiles.mjs --tile tile_wall
 *   node scripts/generate-tiles.mjs --list
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/assets/tiles");

const BASE_STYLE =
  "seamless tiling texture, black and white photocopied fanzine style, acid neon highlights, flat 2D game tile, 90s Paris building facade, pixel-crisp edges, no text, no watermark";

const TILES = [
  {
    name: "tile_wall",
    description: "Solid wall — Haussmann plaster or HLM concrete",
    prompt: `Parisian building wall tile, aged plaster texture, cracks and stains, brutalist concrete detail. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_window_dark",
    description: "Dark window — no one visible, shutters or darkness",
    prompt: `Building window tile, dark interior, wooden shutters half-closed, iron railing, no light inside. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_window_lit",
    description: "Lit window — warm neon light from inside",
    prompt: `Building window tile, glowing warm neon light inside, silhouette barely visible behind frosted glass, night scene. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_balcony",
    description: "Balcony — iron railing, flower pots optional",
    prompt: `Paris building balcony tile, ornate cast iron railing, narrow ledge, 90s Haussmann style. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_door",
    description: "Ground floor door — heavy wood or metal",
    prompt: `Parisian building entrance door tile, heavy wooden double door, stone surround, interphone, steps. ${BASE_STYLE}`,
    width: 128,
    height: 256,
  },
  {
    name: "tile_rooftop",
    description: "Rooftop edge — zinc roof, chimneys, night sky",
    prompt: `Parisian rooftop tile edge, zinc roof detail, chimney stack, attic window, night sky above, silhouette. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
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
      })
      .on("error", reject);
  });
}

async function generateImage(tile, retries = 5) {
  const encodedPrompt = encodeURIComponent(tile.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${tile.width}&height=${tile.height}&nologo=true&model=flux&seed=${seed}`;

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

async function generateTile(tile) {
  const outPath = path.join(OUTPUT_DIR, `${tile.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${tile.name} — already exists`);
    return;
  }
  console.log(`  [gen]  ${tile.name} — ${tile.description}`);
  try {
    const imageBuffer = await generateImage(tile);
    fs.writeFileSync(outPath, imageBuffer);
    console.log(`  [ok]   saved → public/assets/tiles/${tile.name}.png`);
  } catch (e) {
    console.log(`  [fail] ${tile.name} — ${e.message} (skipped)`);
  }
  await sleep(4000);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available tiles:");
    TILES.forEach((t) => console.log(`  ${t.name.padEnd(28)} ${t.description}`));
    return;
  }

  const targetIndex = args.indexOf("--tile");
  const target = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const toGenerate = target ? TILES.filter((t) => t.name === target) : TILES;

  if (target && toGenerate.length === 0) {
    console.error(`Tile "${target}" not found. Use --list to see available tiles.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Generating ${toGenerate.length} tile(s) → public/assets/tiles/\n`);
  for (const tile of toGenerate) {
    await generateTile(tile);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
