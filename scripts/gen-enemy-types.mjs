#!/usr/bin/env node
/**
 * Generate the sprites for the extra enemy archetypes (riot/CRS, motorcycle
 * cop, delivery civilian, bonus figure) in the same 16-bit pixel-art style as
 * the base cops: light tones on a PURE BLACK background (cutout-enemies.mjs
 * keys the black to transparency afterwards; EnemySprite tints per kind).
 *
 * Only MISSING files are generated, so existing cop sprites are never touched
 * and re-runs are cheap. Set FORCE=1 to regenerate everything listed here.
 *
 * Usage (CI): node scripts/gen-enemy-types.mjs && node scripts/cutout-enemies.mjs
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", process.env.OUT_DIR ?? "public/assets");
const FORCE = process.env.FORCE === "1";

const PIXEL_STYLE =
  ", 16-bit pixel art game sprite on a solid uniform matte black background (#000000) filling the whole frame edge to edge, the same flat black filling every space between the figure's limbs and gear, crisp clean pixels, light grey white and pale neon tones figure, simple bold shapes, centered, high contrast, retro snes style, no text, no watermark";

const ASSETS = [
  // ── Riot police (CRS): helmet + visor + shield, takes two hits ───────────
  {
    name: "enemy_riot",
    prompt:
      "a menacing french riot police officer CRS in a full helmet with visor and heavy body armor holding a riot shield, standing facing forward",
  },
  {
    name: "enemy_riot_shooting",
    prompt:
      "a french riot police officer CRS in helmet and body armor aiming a handgun forward at the viewer, muzzle flash",
  },
  // ── Motorcycle cop: fast, brief appearance ───────────────────────────────
  {
    name: "enemy_biker",
    prompt:
      "a french motorcycle police officer wearing a full-face crash helmet and leather uniform with boots, standing facing forward",
  },
  {
    name: "enemy_biker_shooting",
    prompt:
      "a french motorcycle police officer in a full-face helmet aiming a handgun forward at the viewer, muzzle flash",
  },
  // ── Civilian (the delivery courier): do NOT shoot ────────────────────────
  {
    name: "enemy_civilian",
    prompt:
      "a friendly young food delivery courier with a big insulated backpack and a bike helmet, ordinary civilian, empty hands, no weapon, standing facing forward",
  },
  // ── Bonus: glowing golden figure, rewards time ───────────────────────────
  {
    name: "enemy_bonus",
    prompt:
      "a glowing radiant golden mysterious figure in a shining trench coat and fedora hat, sparkling aura, standing facing forward",
  },
];

const WIDTH = 256;
const HEIGHT = 256;

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
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generate(prompt, retries = 5) {
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt + PIXEL_STYLE,
  )}?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux&seed=${seed}`;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 8000;
        console.log(`  [retry ${i + 1}] ${e.message} — wait ${wait / 1000}s`);
        await sleep(wait);
      } else throw e;
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Enemy-type sprites → ${OUT_DIR}\n`);
  for (const a of ASSETS) {
    const out = path.join(OUT_DIR, `${a.name}.png`);
    if (!FORCE && fs.existsSync(out)) {
      console.log(`  [skip] ${a.name} (exists)`);
      continue;
    }
    console.log(`  [gen]  ${a.name}`);
    try {
      const buf = await generate(a.prompt);
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   ${a.name} (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] ${a.name} — ${e.message}`);
    }
    await sleep(2000);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
