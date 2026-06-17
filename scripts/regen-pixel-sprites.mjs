#!/usr/bin/env node
/**
 * Regenerate the in-game raster sprites in a unified 16-bit pixel-art style.
 *
 * Only the sprites that are actually rendered during gameplay are covered:
 * enemy variants (idle + shooting, 1..3) and the player bullet. These are
 * tinted by neon color-multiply in EnemySprite.tsx, so each figure is drawn
 * in light tones on a PURE BLACK background (black multiplies to black and
 * stays invisible against the window; the figure glows when tinted).
 *
 * Output goes straight to public/assets/ (drop-in, identical filenames).
 * Set OUT_DIR=demo/pixel-sprites to preview without overwriting.
 *
 * Usage:
 *   node scripts/regen-pixel-sprites.mjs            # write to public/assets
 *   OUT_DIR=demo/pixel-sprites node scripts/regen-pixel-sprites.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", process.env.OUT_DIR ?? "public/assets");

const PIXEL_STYLE =
  ", 16-bit pixel art game sprite, crisp clean pixels, light grey white and pale neon tones figure, simple bold shapes, centered, solid pure flat black background, high contrast, retro snes style, no text, no watermark";

const ASSETS = [
  // ── Idle cop variants (menacing plainclothes, light tones) ───────────────
  {
    name: "enemy_sprite",
    prompt:
      "a menacing plainclothes french cop wearing a cap, standing facing forward, arms at sides",
    width: 256,
    height: 256,
  },
  {
    name: "enemy_sprite_2",
    prompt:
      "a menacing plainclothes cop in a leather jacket, standing facing forward, broad shoulders",
    width: 256,
    height: 256,
  },
  {
    name: "enemy_sprite_3",
    prompt:
      "a menacing plainclothes cop wearing sunglasses and a hood, standing facing forward",
    width: 256,
    height: 256,
  },
  // ── Shooting cop variants (aiming, muzzle flash) ─────────────────────────
  {
    name: "enemy_shooting",
    prompt:
      "a plainclothes french cop wearing a cap, aiming a handgun forward at the viewer, muzzle flash",
    width: 256,
    height: 256,
  },
  {
    name: "enemy_shooting_2",
    prompt:
      "a plainclothes cop in a leather jacket aiming a handgun forward at the viewer, muzzle flash",
    width: 256,
    height: 256,
  },
  {
    name: "enemy_shooting_3",
    prompt:
      "a plainclothes cop with sunglasses aiming a handgun forward at the viewer, muzzle flash",
    width: 256,
    height: 256,
  },
  // ── Player bullet tracer ─────────────────────────────────────────────────
  {
    name: "bullet_player",
    prompt:
      "a single small glowing bullet tracer projectile, bright white and pale yellow, tiny, motion streak",
    width: 64,
    height: 64,
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
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generate(prompt, width, height, retries = 5) {
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt + PIXEL_STYLE,
  )}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}`;
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
  console.log(`Regenerating ${ASSETS.length} sprite(s) → ${OUT_DIR}\n`);
  for (const a of ASSETS) {
    const out = path.join(OUT_DIR, `${a.name}.png`);
    console.log(`  [gen]  ${a.name}`);
    try {
      const buf = await generate(a.prompt, a.width, a.height);
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
