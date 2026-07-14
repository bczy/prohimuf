#!/usr/bin/env node
/**
 * FILL BUST HEM — iteration-5 of the ADR-0019 retouch chain (game-graphist pass).
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * Bertrand's art gate on enemy_shooting_3: "Je veux que tu remplisses encore un
 * peu plus le buste de cet ennemi." The remaining raggedness is NOT a retouch
 * bite — it is the ORIGINAL generated art's torn-paper hem (deep concave
 * notches in the bust's lower silhouette, open to the frame bottom, which the
 * fill-sprite-holes solidify cannot seal because they are wide border-connected
 * bays, not enclosed holes). This pass AUTHORS new fill: a bounded
 * morphological closing of the figure mask, restricted to the lower bust
 * region, each new pixel painted with the median tone of the nearby dark
 * clothing so it reads as jacket mass.
 *
 * Deterministic, per-file configured, iterated to a fixpoint in one run (so a
 * re-run writes nothing — CI-safe), and ADD-ONLY: the only mutation is a
 * transparent pixel (alpha<16) becoming an opaque clothing-tone pixel. A
 * self-check aborts the write if any existing opaque pixel would change.
 * Applied to BOTH flipbook frames of a kind so the flip does not pop.
 *
 * @napi-rs/canvas install (same as the sibling scripts):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/fill-bust-hem.mjs            # fill configured files in place
 *   node scripts/fill-bust-hem.mjs --check    # detect-only, exit 1 if any px would fill
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

const OPAQUE = 16;

/**
 * Per-file hem-fill config:
 *   region — normalized [x0,y0,x1,y1]: closing happens only here (lower bust);
 *   radius — closing disk radius in px: bridges concavities up to ~2*radius wide.
 * Calibrated on the 256x256 committed sprites against Bertrand's crop
 * (2026-07-14): the deep bay under the left chest of enemy_shooting_3 is
 * ~35 px wide (disk-16 closing bridges ~32 px; calibrated by visual pass). Frame 2 gets the same treatment so the flipbook stays coherent.
 */
const HEM_FILL = {
  // extendDown: columns whose lowest opaque pixel sits in the bottom band
  // (y >= extendDown * H — the bust's hem mass, NOT the gun/arm which ends
  // higher) are filled from that lowest pixel to the frame bottom, so the bust
  // reads frame-cut like its approved frame 2 instead of tapering into a bay
  // that no closing radius can seal (its mouth is the open bottom border).
  "enemy_shooting_3.png": { region: [0.0, 0.5, 1.0, 1.0], radius: 22, extendDown: 0.8 },
  "enemy_shooting_3_f2.png": { region: [0.0, 0.5, 1.0, 1.0], radius: 22 },
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

function diskOffsets(r) {
  const o = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) o.push([dx, dy]);
  return o;
}

function dilate(m, W, H, off) {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue;
      for (const [dx, dy] of off) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) o[ny * W + nx] = 1;
      }
    }
  return o;
}

function erode(m, W, H, off) {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let keep = 1;
      for (const [dx, dy] of off) {
        const nx = x + dx;
        const ny = y + dy;
        // Pixels outside the frame count as background for the erosion, EXCEPT
        // below the bottom edge: the bust is frame-cut there, and treating the
        // outside as background would erode the hem we are trying to grow.
        const v = ny >= H ? 1 : nx < 0 || ny < 0 || nx >= W ? 0 : m[ny * W + nx];
        if (!v) {
          keep = 0;
          break;
        }
      }
      o[y * W + x] = keep;
    }
  return o;
}

function zoneMask(zone, W, H) {
  const m = new Uint8Array(W * H);
  const [a, b, c, d] = zone;
  const x0 = Math.max(0, Math.floor(a * W));
  const y0 = Math.max(0, Math.floor(b * H));
  const x1 = Math.min(W - 1, Math.ceil(c * W));
  const y1 = Math.min(H - 1, Math.ceil(d * H));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
  return m;
}

/**
 * One closing pass restricted to the region: returns the mask of NEW pixels
 * (in closing(mask) but not mask, inside region). Pure.
 */
export function hemFillMask(alphaMask, W, H, region, radius, extendDown = null) {
  const off = diskOffsets(radius);
  const closed = erode(dilate(alphaMask, W, H, off), W, H, off);
  const rz = zoneMask(region, W, H);
  const out = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    if (closed[p] && !alphaMask[p] && rz[p]) out[p] = 1;
  }

  if (extendDown !== null) {
    // Frame-cut extension: for every column whose LOWEST opaque pixel lies in
    // the bottom band (the bust hem mass — the gun/arm bottoms end higher and
    // are skipped), fill from that pixel down to the frame bottom.
    const bandY = Math.floor(extendDown * H);
    for (let x = 0; x < W; x++) {
      let lowest = -1;
      for (let y = H - 1; y >= 0; y--) {
        if (alphaMask[y * W + x]) {
          lowest = y;
          break;
        }
      }
      if (lowest < bandY || lowest === -1) continue;
      for (let y = lowest + 1; y < H; y++) {
        const p = y * W + x;
        if (!alphaMask[p] && rz[p]) out[p] = 1;
      }
    }
  }
  return out;
}

/** Median dark-clothing RGB sampled from opaque pixels within `r` px of (x,y). */
function localTone(data, W, H, x, y, r) {
  const rs = [];
  const gs = [];
  const bs = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const p = ny * W + nx;
      if (data[p * 4 + 3] < OPAQUE) continue;
      const pr = data[p * 4];
      const pg = data[p * 4 + 1];
      const pb = data[p * 4 + 2];
      if (lum(pr, pg, pb) > 150) continue; // clothing tone, not flash/skin highlight
      rs.push(pr);
      gs.push(pg);
      bs.push(pb);
    }
  if (rs.length === 0) return [40, 42, 48];
  const med = (arr) => arr.sort((a, b) => a - b)[arr.length >> 1];
  return [med(rs), med(gs), med(bs)];
}

async function processFile(name, cfg, createCanvas, loadImage, checkOnly) {
  const fp = path.join(ASSET_DIR, name);
  if (!fs.existsSync(fp)) {
    console.log(`[skip] ${name} — not on disk`);
    return 0;
  }
  const img = await loadImage(fs.readFileSync(fp));
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const data = image.data;

  const before = Buffer.from(data); // self-check reference

  let total = 0;
  // Iterate to a fixpoint (bounded): once mask == closing(mask) inside the
  // region, the next run of this script writes nothing.
  for (let iter = 0; iter < 8; iter++) {
    const mask = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) mask[p] = data[p * 4 + 3] >= OPAQUE ? 1 : 0;
    const add = hemFillMask(mask, W, H, cfg.region, cfg.radius, cfg.extendDown ?? null);
    let n = 0;
    for (let p = 0; p < W * H; p++) {
      if (!add[p]) continue;
      const x = p % W;
      const y = (p / W) | 0;
      const [r, g, b] = localTone(data, W, H, x, y, 6);
      data[p * 4] = r;
      data[p * 4 + 1] = g;
      data[p * 4 + 2] = b;
      data[p * 4 + 3] = 255;
      n++;
    }
    total += n;
    if (n === 0) break;
  }

  if (checkOnly) {
    console.log(`[--check] ${name} — would fill ${String(total)} px`);
    return total;
  }
  if (total === 0) {
    console.log(`[ok ] ${name} — nothing to fill`);
    return 0;
  }

  // SELF-CHECK: add-only — every originally-opaque pixel must be byte-identical.
  for (let p = 0; p < W * H; p++) {
    if (before[p * 4 + 3] >= OPAQUE) {
      for (let c = 0; c < 4; c++) {
        if (before[p * 4 + c] !== data[p * 4 + c]) {
          console.error(`[ABORT] ${name} — opaque pixel changed at index ${String(p)}`);
          process.exit(1);
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(fp, canvas.toBuffer("image/png"));
  console.log(`[fix] ${name} — filled ${String(total)} px (add-only), self-check clean`);
  return total;
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  let total = 0;
  for (const [name, cfg] of Object.entries(HEM_FILL)) {
    total += await processFile(name, cfg, createCanvas, loadImage, checkOnly);
  }
  if (checkOnly) {
    if (total > 0) {
      console.log(`[--check] bust hem incomplete — ${String(total)} px would fill — FAIL`);
      process.exit(1);
    }
    console.log("[--check] bust hems at fixpoint — PASS");
  }
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[fill-bust-hem] Fatal:", e.message);
    process.exit(1);
  });
}
