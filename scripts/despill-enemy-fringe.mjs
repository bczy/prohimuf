#!/usr/bin/env node
/**
 * EDGE-BAND DESPILL — post-key spill suppression for the `enemies` pochoir set on a
 * magenta (#FF3CDC) chroma ground (2026-07-18 black→magenta migration,
 * docs/handoffs/story-enemy-chroma-migration.md).
 *
 * ── The defect ─────────────────────────────────────────────────────────────────────
 * Classic chroma-key spill: FLUX renders a few px of blended/anti-aliased transition at
 * the ink/magenta boundary, and cutout-enemies.mjs's THRESHOLD_SQ (calibrated to clear
 * only near-identical ground) correctly leaves those transitional pixels OPAQUE — they
 * are not close enough to pure #FF3CDC to key, but they still carry a visible magenta
 * TINT. Invisible on a magenta composite (the sweep the pipeline used to rely on), it
 * reads as a clear pink/rose rim hugging the whole silhouette on any OTHER background —
 * confirmed on a cyan composite at both 256px and real 64px game scale (all 4 checkpoint
 * samples: enemy_sprite, _f2, enemy_sprite_2, enemy_shooting). Measured band width ≈ 6-7px
 * inward from the alpha edge (enemy_sprite_2, row y=150: x103 neutral →
 * x104-109 a noisy tinted transition, tint up to ~223 → x110+ settles to a stable neutral
 * ink tone, tint ≈ 15-20).
 *
 * ── The fix: BFS-distance-gated spill suppression, not a global recolour ─────────────
 * Only pixels within DESPILL_BAND px (4-connected, through OPAQUE pixels only) of a
 * transparent neighbour are touched — this is the same "bounded by measured geometry"
 * discipline as the flatten retouch's edge inset, applied to a ring INSIDE the silhouette
 * instead of outside it. A pixel's tint (max(0,r-g) + max(0,b-g), the same metric
 * retouch-flatten-enemy-background.mjs uses for pocket detection) is capped at
 * RESIDUAL_TINT by pulling the elevated channel(s) down toward g — never below g, never
 * touching a channel that is already <= g. Interior figure pixels (badge, skin, any
 * legitimate warm detail) sit outside the band and are never touched, so this cannot
 * desaturate content the artist actually intended.
 *
 * Cardinal rule (mirrors every sibling retouch in this file's family): surgical only.
 * Alpha is NEVER touched. RGB only changes within the edge band, and only the EXCESS over
 * `g` is trimmed — a pixel already <= RESIDUAL_TINT tint is left byte-identical. A
 * built-in self-check re-asserts alpha is untouched and aborts the write on a violation.
 *
 * Deterministic + idempotent: a second run finds every band pixel already at
 * tint <= RESIDUAL_TINT (nothing left to trim) → 0 changed, byte-identical.
 *
 * Pipeline position (5th and last stage — operates on the fully keyed + solidified
 * result, since fill-sprite-holes.mjs can itself introduce newly-opaque edge pixels):
 *   1. retouch-flatten-enemy-background.mjs --target=magenta
 *   2. cutout-enemies.mjs
 *   3. sweep-enemy-speckle.mjs
 *   4. fill-sprite-holes.mjs
 *   5. despill-enemy-fringe.mjs        (this script)
 *
 * Requires @napi-rs/canvas (same install as every sibling script):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/despill-enemy-fringe.mjs                 # every public/assets/enemy_*.png
 *   node scripts/despill-enemy-fringe.mjs a.png b.png     # explicit files
 *   node scripts/despill-enemy-fringe.mjs --check         # detect-only, exit 1 if any px would change
 *   ASSET_DIR=… node scripts/despill-enemy-fringe.mjs     # override target dir
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

// BFS band width (px, 4-connected through opaque pixels) from the nearest transparent
// pixel. Calibrated on enemy_sprite_2's measured spill band (~6-7px, see header); 10
// keeps a margin without reaching deep enough to risk a legitimate interior warm detail.
export const DESPILL_BAND = 10;

// Residual tint a band pixel is allowed to keep after suppression. 0 would force every
// band pixel to r<=g and b<=g exactly (a harder clamp, slight risk of an over-neutralised
// look on close inspection); 15 matches the "settled" ink tone's own measured tint
// (enemy_sprite_2 interior ≈ 15-20) so despilled edge pixels read the same as the ink
// right next to them, not artificially flatter.
export const RESIDUAL_TINT = 15;

const OPAQUE = 1; // alpha >= this counts as figure/opaque (matches fill-sprite-holes.mjs)

/**
 * BFS distance (4-conn, through opaque pixels only) from the nearest transparent pixel,
 * capped at `band` (pixels farther than `band` are not computed exactly — only whether
 * they are <= band matters). Pure. Returns a Uint8Array band-membership mask.
 */
export function computeEdgeBand({ W, H, alpha }, band) {
  const N = W * H;
  const inBand = new Uint8Array(N);
  const dist = new Int16Array(N).fill(-1);
  const queue = [];
  let qh = 0;
  for (let p = 0; p < N; p++) {
    if (alpha[p] < OPAQUE) continue; // transparent pixels are not band members themselves
    // Seed: opaque pixels with at least one transparent 4-neighbour are distance 1.
    const x = p % W;
    const y = (p / W) | 0;
    const neighbours = [
      x > 0 ? p - 1 : -1,
      x < W - 1 ? p + 1 : -1,
      y > 0 ? p - W : -1,
      y < H - 1 ? p + W : -1,
    ];
    for (const n of neighbours) {
      if (n >= 0 && alpha[n] < OPAQUE) {
        dist[p] = 1;
        inBand[p] = 1;
        queue.push(p);
        break;
      }
    }
  }
  while (qh < queue.length) {
    const p = queue[qh++];
    const d = dist[p];
    if (d >= band) continue;
    const x = p % W;
    const y = (p / W) | 0;
    const neighbours = [
      x > 0 ? p - 1 : -1,
      x < W - 1 ? p + 1 : -1,
      y > 0 ? p - W : -1,
      y < H - 1 ? p + W : -1,
    ];
    for (const n of neighbours) {
      if (n < 0 || alpha[n] < OPAQUE || dist[n] !== -1) continue;
      dist[n] = d + 1;
      inBand[n] = 1;
      queue.push(n);
    }
  }
  return inBand;
}

/**
 * Suppress spill within the edge band: for every band pixel, clamp r and b down toward g
 * so tint (max(0,r-g)+max(0,b-g)) never exceeds `residualTint`, distributing the trim
 * proportionally across whichever of r/b is elevated. Never raises a channel, never
 * touches alpha, never touches a pixel outside the band. Mutates `d`. Returns count of
 * pixels actually changed (tint already <= residualTint pixels are untouched).
 *
 * FLOOR, not round, is load-bearing for single-pass convergence: excessR*scale +
 * excessB*scale sums to EXACTLY residualTint before rounding (scale = residualTint /
 * tint), so flooring both terms can only ever produce a sum <= residualTint — guaranteed
 * termination in one pass. Math.round was tried first and has a real stuck-fixed-point
 * bug: e.g. excessR=8, excessB=8, tint=16, residualTint=15 → scale=0.9375 → both
 * round(7.5) to 8 (JS rounds .5 up) → NEITHER channel changes → tint stays 16 forever →
 * an infinite loop under the fixed-point iteration below (reproduced and hung on the
 * checkpoint sample). Floor has no such case: floor(7.5)=7 on both, tint drops to 14 the
 * very same pass.
 */
export function despillBand(d, inBand, { residualTint = RESIDUAL_TINT } = {}) {
  let changed = 0;
  for (let p = 0; p < inBand.length; p++) {
    if (!inBand[p]) continue;
    const o = p * 4;
    const r = d[o];
    const g = d[o + 1];
    const b = d[o + 2];
    const excessR = Math.max(0, r - g);
    const excessB = Math.max(0, b - g);
    const tint = excessR + excessB;
    if (tint <= residualTint) continue;
    const scale = residualTint / tint; // shrink both excesses proportionally to hit the cap
    const newR = g + Math.floor(excessR * scale);
    const newB = g + Math.floor(excessB * scale);
    if (newR !== r) d[o] = newR;
    if (newB !== b) d[o + 2] = newB;
    changed++;
  }
  return changed;
}

async function despillFile(file, { checkOnly }) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const N = W * H;
  const alpha = new Uint8Array(N);
  for (let p = 0; p < N; p++) alpha[p] = d[p * 4 + 3];
  const before = Uint8Array.from(d);

  const inBand = computeEdgeBand({ W, H, alpha }, DESPILL_BAND);
  // FLOOR-based despillBand converges in exactly ONE pass by construction (see its
  // docstring) — this loop is defensive only (caps at 3 rounds so a future edit that
  // reintroduces a rounding-direction bug degrades to "leaves a small residual" instead
  // of hanging, the way an earlier Math.round version genuinely did on this checkpoint).
  let changed = 0;
  for (let round = 0; round < 3; round++) {
    const n = despillBand(d, inBand);
    if (n === 0) break;
    changed += n;
  }

  if (checkOnly) {
    console.log(`  ${String(changed).padStart(6)}  ${path.basename(file)}`);
    return changed;
  }
  if (changed === 0) {
    console.log(`[ok ] ${path.basename(file)} — no spill in the edge band (${W}x${H})`);
    return 0;
  }

  // Self-check: alpha never changes; RGB only changes inside inBand.
  let violations = 0;
  for (let p = 0; p < N; p++) {
    if (d[p * 4 + 3] !== before[p * 4 + 3]) {
      violations++;
      continue;
    }
    if (!inBand[p]) {
      if (d[p * 4] !== before[p * 4] || d[p * 4 + 2] !== before[p * 4 + 2]) violations++;
    }
  }
  if (violations > 0) {
    console.error(
      `Fatal: ${path.basename(file)} — ${violations} surgical violation(s); NOT writing.`,
    );
    process.exit(1);
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(
    `[fix] ${path.basename(file)} — despilled ${changed}px in the edge band, self-check clean`,
  );
  return changed;
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes("--check");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const files =
    fileArgs.length > 0
      ? fileArgs.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync(ASSET_DIR)
          .filter((f) => /^enemy_.*\.png$/.test(f))
          .map((f) => path.join(ASSET_DIR, f));
  if (files.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  if (checkOnly) console.log("WOULD-DESPILL (px)");
  let dirty = false;
  let total = 0;
  for (const f of files) {
    const n = await despillFile(f, { checkOnly });
    total += n;
    if (n > 0) dirty = true;
  }
  if (checkOnly) {
    console.log(`  ${String(total).padStart(6)}  TOTAL`);
    if (dirty) {
      console.error("\n[--check] edge-band spill present — FAIL");
      process.exit(1);
    }
    console.log("\n[--check] no edge-band spill on any file — PASS");
  } else {
    console.log("done.");
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[despill-enemy-fringe] Fatal:", e.message);
    process.exit(1);
  });
}
