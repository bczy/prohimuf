#!/usr/bin/env node
/**
 * Region-mask the SKY of the Belliard tronçon tiles to transparency (ADR-0048).
 *
 * WHY NOT A GLOBAL CHROMA-KEY: the deep-night sky sits at near-black #141210 and
 * so do the buildings' inked outlines and shadowed recesses — a global "clear all
 * near-black" pass would eat the walls (v3 draft §5). Instead we exploit the
 * ADR-0048 geometry: the buildings FLOAT with transparent L/R margins and sky
 * above the rooflines, so the sky is **connected to the top/left/right borders**
 * while every wall, the bare mur-pignon (tronçon-b) and the set-back passage
 * (tronçon-c) are INTERIOR — walled off from the border by the buildings' bright
 * inked silhouette. A 4-connected flood-fill of dark pixels seeded from those
 * three borders therefore clears the sky and the between-building sky slivers
 * WITHOUT touching the opaque interior beats. The bottom edge is the street line
 * the buildings stand on, so it is NOT seeded.
 *
 * THRESHOLD CAVEAT: `ceiling` (max luma treated as sky) must sit between the
 * near-black sky and the mid-grey walls (#3A3E44 ≈ luma 60). The default is a
 * starting point; TUNE it against the first real v3 render — no v3 tronçon PNG
 * exists yet (generation runs in CI). The pure {@link skyMask} is unit-tested on
 * a synthetic fixture for the core property (border sky cleared, interior kept).
 *
 *   node scripts/key-troncon-sky.mjs                 # key troncon-a/b/c in place
 *   node scripts/key-troncon-sky.mjs --ceiling 44    # override the sky luma ceiling
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = process.cwd();
const DIR = path.resolve(ROOT, "public/assets/levels/belliard");
const TILES = ["troncon-a.png", "troncon-b.png", "troncon-c.png"];
const DEFAULT_CEILING = 44; // luma; between #141210 (~20) and #3A3E44 (~60)

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Compute which pixels are border-connected sky (to be cleared to alpha 0).
 * Pure + deterministic; exported for the unit test.
 * @param {number} w @param {number} h
 * @param {Uint8ClampedArray|Uint8Array|number[]} rgba length w*h*4
 * @param {{ceiling?: number}} [opts]
 * @returns {Uint8Array} length w*h, 1 = sky (clear), 0 = keep
 */
export function skyMask(w, h, rgba, { ceiling = DEFAULT_CEILING } = {}) {
  const sky = new Uint8Array(w * h);
  const isDark = (i) => luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) <= ceiling;
  const stack = [];
  const seed = (x, y) => {
    const i = y * w + x;
    if (!sky[i] && isDark(i)) {
      sky[i] = 1;
      stack.push(i);
    }
  };
  // Seed the top, left and right borders only (NOT the bottom = street line).
  for (let x = 0; x < w; x++) seed(x, 0);
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }
  return sky;
}

async function keyTile(file, ceiling) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(path.join(DIR, file));
  const w = img.width;
  const h = img.height;
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const mask = skyMask(w, h, data.data, { ceiling });
  let cleared = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i]) {
      data.data[i * 4 + 3] = 0;
      cleared++;
    }
  }
  ctx.putImageData(data, 0, 0);
  fs.writeFileSync(path.join(DIR, file), cv.toBuffer("image/png"));
  console.log(
    `  ${file} (${w}x${h}) — sky cleared ${cleared}px (${((100 * cleared) / (w * h)).toFixed(1)}%)`,
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const ci = argv.indexOf("--ceiling");
  const ceiling = ci >= 0 ? Number(argv[ci + 1]) : DEFAULT_CEILING;
  console.log(`Keying tronçon sky → ${DIR} (ceiling=${ceiling})\n`);
  for (const file of TILES) {
    if (!fs.existsSync(path.join(DIR, file))) {
      console.log(`  [skip] ${file} (missing)`);
      continue;
    }
    await keyTile(file, ceiling);
  }
  console.log("\ndone.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
