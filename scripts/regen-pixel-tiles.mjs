#!/usr/bin/env node
/**
 * Generate a pixel-art tile atlas (Style B) for the building facade.
 * One texture per TileType used by the tilemap. Lit windows are the slots
 * where enemy cops appear, so they are drawn as an empty warm-lit room.
 *
 * Output: demo/pixel-tiles/ (preview) or public/assets/tiles/ via OUT_DIR.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", process.env.OUT_DIR ?? "demo/pixel-tiles");

const STYLE =
  ", 16-bit pixel art, crisp clean pixels, cohesive night palette deep blue violet with magenta and cyan neon accents, dithering, retro snes game tile, flat front elevation, seamless tileable, no text, no people";

const TILES = [
  {
    name: "tile_wall",
    prompt: "parisian haussmann stone building wall section at night, weathered plaster",
  },
  {
    name: "tile_window_dark",
    prompt:
      "a single dark unlit apartment window with shutters in a stone wall at night, no light inside, black void glass",
  },
  {
    name: "tile_window_lit",
    prompt:
      "a single warmly lit empty apartment window in a stone wall at night, glowing warm orange interior, curtains, empty room",
  },
  {
    name: "tile_door",
    prompt: "a parisian building wooden double entrance door in a stone wall at night",
  },
  {
    name: "tile_shop",
    prompt:
      "a small parisian ground-floor shop storefront with a glowing neon sign and lit vitrine at night",
  },
  {
    name: "tile_balcony",
    prompt: "an ornate parisian wrought-iron balcony railing row on a stone wall at night",
  },
  {
    name: "tile_rooftop",
    prompt: "a parisian grey zinc rooftop with a brick chimney and antenna against the night sky",
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generate(prompt, retries = 5) {
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt + STYLE,
  )}?width=128&height=128&nologo=true&model=flux&seed=${seed}`;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        await sleep((i + 1) * 8000);
      } else throw e;
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${TILES.length} tile(s) → ${OUT_DIR}\n`);
  for (const t of TILES) {
    console.log(`  [gen]  ${t.name}`);
    try {
      const buf = await generate(t.prompt);
      fs.writeFileSync(path.join(OUT_DIR, `${t.name}.png`), buf);
      console.log(`  [ok]   ${t.name} (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] ${t.name} — ${e.message}`);
    }
    await sleep(2000);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
