#!/usr/bin/env node
/**
 * Stamp rotating wheel spokes onto the courier flipbook frames — the
 * game-graphist scripted-retouch pass (documented, deterministic).
 *
 * WHY: FLUX reliably draws a consistent subject under a pinned seed (per-frame
 * strategy, ADR 0016 amendment) but refuses legible tri-spoke mag wheels and
 * re-rolls small details between frames. So the pipeline is: FLUX provides the
 * subject ONCE (frame 1 = the base), and this script derives EVERY frame from
 * that single base image — identical sprite on all frames (zero flicker), with
 * three bold spokes drawn onto each wheel disc, rotated per frame across a
 * 120-degree period (N frames = one full spoke cycle).
 *
 * Per-layer config below: the RIDER layer (the shipped full-cyclist courier
 * sprite, 6 frames at 20-degree steps, dark-outlined pale spokes so they read
 * on both the dark rear wheel and the pale front wheel) and the BIKE layer
 * (validated spare art, 3 frames at 40-degree steps). A layer is skipped when
 * its base PNG is absent.
 *
 * Wheel geometry is DETECTED, not hardcoded: each wheel disc is the centroid
 * of opaque dark pixels inside an x-window that excludes the sprite's other
 * dark masses (re-tune the windows if a base is regenerated with a different
 * composition). Spokes stop at 72-75% of the disc's 90th percentile radius so
 * they stay inside the rim.
 *
 * Deterministic and idempotent: re-running redraws the same pixels. Run it
 * AFTER any courier regeneration (the CI workflow does), post-cutout.
 *
 * Usage: node scripts/retouch-courier-spokes.mjs   (requires @napi-rs/canvas)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets/courier");

const LAYERS = [
  {
    base: "rider.png",
    frames: [
      "rider.png",
      "rider_f2.png",
      "rider_f3.png",
      "rider_f4.png",
      "rider_f5.png",
      "rider_f6.png",
    ],
    stepDeg: 20,
    // x-windows isolating the two wheel discs; the rider's torso sits above
    // the 55% height cutoff so only wheels match.
    windows: [
      [0, 110],
      [150, 256],
    ],
    yFrom: 0.55,
    lumMax: 90,
    radiusFactor: 0.72,
    outline: true, // pale front wheel needs a dark outline for contrast
  },
  {
    base: "bike.png",
    frames: ["bike.png", "bike_f2.png", "bike_f3.png"],
    stepDeg: 40,
    windows: [
      [0, 100],
      [160, 256],
    ],
    yFrom: 0.5,
    lumMax: 70,
    radiusFactor: 0.75,
    outline: false,
  },
];

const PALE = "rgb(206,206,214)";
const DARK = "rgb(40,40,46)";

async function main() {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  for (const layer of LAYERS) {
    const basePath = path.join(DIR, layer.base);
    if (!fs.existsSync(basePath)) {
      console.log(`[skip] ${layer.base} — no base on disk`);
      continue;
    }
    const img = await loadImage(fs.readFileSync(basePath));
    const W = img.width;
    const H = img.height;

    const probe = createCanvas(W, H);
    const pctx = probe.getContext("2d");
    pctx.drawImage(img, 0, 0);
    const data = pctx.getImageData(0, 0, W, H).data;

    const wheels = layer.windows.map(([x0, x1]) => {
      const pts = [];
      for (let y = Math.floor(H * layer.yFrom); y < H; y++) {
        for (let x = x0; x < Math.min(x1, W); x++) {
          const o = (y * W + x) * 4;
          const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
          if (data[o + 3] > 200 && lum < layer.lumMax) pts.push([x, y]);
        }
      }
      if (pts.length === 0) throw new Error(`${layer.base}: no wheel disc in x ${x0}..${x1}`);
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const ds = pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)).sort((a, b) => a - b);
      return { cx, cy, r: ds[Math.floor(ds.length * 0.9)] * layer.radiusFactor };
    });
    console.log(
      `${layer.base} wheels: ${wheels.map((w) => `(${w.cx.toFixed(1)},${w.cy.toFixed(1)} r=${w.r.toFixed(1)})`).join(" ")}`,
    );

    layer.frames.forEach((file, i) => {
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const rot = (i * layer.stepDeg * Math.PI) / 180;
      for (const { cx, cy, r } of wheels) {
        for (let k = 0; k < 3; k++) {
          const a = -Math.PI / 2 + rot + (k * 2 * Math.PI) / 3;
          const x2 = cx + Math.cos(a) * r;
          const y2 = cy + Math.sin(a) * r;
          if (layer.outline) {
            ctx.strokeStyle = DARK;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.strokeStyle = PALE;
          ctx.lineWidth = layer.outline ? 3 : 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.fillStyle = layer.outline ? DARK : PALE;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fill();
        if (layer.outline) {
          ctx.fillStyle = PALE;
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      fs.writeFileSync(path.join(DIR, file), canvas.toBuffer("image/png"));
      console.log(`[ok] ${file} — spokes at ${i * layer.stepDeg} deg`);
    });
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
