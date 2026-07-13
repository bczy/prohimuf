#!/usr/bin/env node
/**
 * Stamp the courier bike's rotating tri-spoke "Y" onto its flipbook frames —
 * the game-graphist scripted-retouch pass (documented, deterministic).
 *
 * WHY: FLUX reliably draws a consistent whole bicycle per frame under the
 * pinned seed (per-frame strategy, ADR 0016 amendment) but refuses to draw
 * legible tri-spoke mag wheels and re-rolls small accessories between frames.
 * So the pipeline is: FLUX provides the bike ONCE (frame 1 = the base), and
 * this script derives EVERY frame from that single base image — identical
 * bike on all frames (zero flicker), with three bold pale spokes drawn onto
 * each wheel disc, rotated 0/40/80 degrees per frame (a 120-degree cycle:
 * three frames = one full spoke period).
 *
 * Wheel geometry is DETECTED, not hardcoded: the two dark wheel discs are
 * found as centroids of opaque near-black pixels in the lower half of the
 * sprite, scanning two x-windows that exclude the dark frame-bag band in the
 * middle (re-tune REAR_X_MAX / FRONT_X_MIN if the base bike is regenerated
 * with a different composition). Spokes stop at 75% of the disc's 90th
 * percentile radius so they stay inside the rim.
 *
 * Deterministic and idempotent: re-running redraws the same pixels. Run it
 * AFTER any bike regeneration (the CI workflow does), and after cutout —
 * the base is read post-keying so the spokes land on the transparent sprite.
 *
 * Usage: node scripts/retouch-bike-spokes.mjs   (requires @napi-rs/canvas)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets/courier");

// Frames derived from the base: file name -> spoke rotation in degrees.
const FRAMES = [
  ["bike.png", 0],
  ["bike_f2.png", 40],
  ["bike_f3.png", 80],
];

// x-windows isolating each wheel disc from the dark frame bag between them.
const REAR_X_MAX = 100;
const FRONT_X_MIN = 160;

const SPOKE_COLOR = "rgb(208,208,216)";
const SPOKE_WIDTH = 4;
const HUB_RADIUS = 5;

async function main() {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const basePath = path.join(DIR, "bike.png");
  if (!fs.existsSync(basePath)) {
    console.log("[skip] no bike.png base on disk — generate the bike layer first");
    return;
  }
  const img = await loadImage(fs.readFileSync(basePath));
  const W = img.width;
  const H = img.height;

  // Read pixels once for wheel detection.
  const probe = createCanvas(W, H);
  const pctx = probe.getContext("2d");
  pctx.drawImage(img, 0, 0);
  const data = pctx.getImageData(0, 0, W, H).data;

  function wheel(x0, x1) {
    const pts = [];
    for (let y = Math.floor(H / 2); y < H; y++) {
      for (let x = x0; x < x1; x++) {
        const o = (y * W + x) * 4;
        const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
        if (data[o + 3] > 200 && lum < 70) pts.push([x, y]);
      }
    }
    if (pts.length === 0) throw new Error(`no wheel disc found in x ${x0}..${x1}`);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const ds = pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)).sort((a, b) => a - b);
    return { cx, cy, r: ds[Math.floor(ds.length * 0.9)] * 0.75 };
  }

  const wheels = [wheel(0, REAR_X_MAX), wheel(FRONT_X_MIN, W)];
  console.log(
    `wheels: ${wheels.map((w) => `(${w.cx.toFixed(1)},${w.cy.toFixed(1)} r=${w.r.toFixed(1)})`).join(" ")}`,
  );

  for (const [file, deg] of FRAMES) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = SPOKE_COLOR;
    ctx.fillStyle = SPOKE_COLOR;
    ctx.lineWidth = SPOKE_WIDTH;
    const rot = (deg * Math.PI) / 180;
    for (const { cx, cy, r } of wheels) {
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + rot + (k * 2 * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, HUB_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }
    fs.writeFileSync(path.join(DIR, file), canvas.toBuffer("image/png"));
    console.log(`[ok] ${file} — spokes at ${deg} deg`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
