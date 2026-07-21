#!/usr/bin/env node
/**
 * Build the wide Belliard street backdrop from ONE ideogram render by mirroring
 * it (Bertrand's call — a two-different-image butt-join always shows a seam; a
 * horizontal mirror makes the seam meet its own reflection = invisible).
 *
 * Pipeline: normalise to a common B&W value range → despeckle the sky band
 * (grayscale dilation removes the model's dark stipple dots, keeps chimneys) →
 * trim the left white margin and trim the right edge back to a DARK column (so
 * the mirror seam lands on dark content, no white band) → mirror.
 *
 * Source render comes from the CI experiment (gen-street-experiment.yml,
 * model=ideogram-v4-quality, seed 7111) — not committed; pass its path.
 * Output: public/assets/levels/belliard/street-wide.png.
 *
 *   node scripts/stitch-belliard-street.mjs <source.png> [out.png]
 */
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const H = 1248;
const T_MEAN = 155;
const T_STD = 68;
const SKY_BAND = Math.round(H * 0.14);
const DILATE_R = 2;

async function prep(file) {
  const img = await loadImage(file);
  const w = Math.round((img.width * H) / img.height);
  const cv = createCanvas(w, H);
  const c = cv.getContext("2d");
  c.drawImage(img, 0, 0, w, H);
  const d = c.getImageData(0, 0, w, H);
  const p = d.data;
  const n = w * H;
  let s = 0;
  for (let i = 0; i < p.length; i += 4) {
    const y = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    p[i] = p[i + 1] = p[i + 2] = y;
    s += y;
  }
  const mean = s / n;
  let v2 = 0;
  for (let i = 0; i < p.length; i += 4) v2 += (p[i] - mean) ** 2;
  const std = Math.sqrt(v2 / n);
  for (let i = 0; i < p.length; i += 4) {
    const v = Math.max(0, Math.min(255, (p[i] - mean) * (T_STD / std) + T_MEAN));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  // Sky despeckle: grayscale dilation over the top band fills small dark dots
  // with surrounding light; chimneys (larger) survive.
  const src = Float32Array.from({ length: w * H }, (_, k) => p[k * 4]);
  for (let y = 0; y < SKY_BAND; y++) {
    for (let x = 0; x < w; x++) {
      let mx = 0;
      for (let dy = -DILATE_R; dy <= DILATE_R; dy++) {
        for (let dx = -DILATE_R; dx <= DILATE_R; dx++) {
          const xx = Math.max(0, Math.min(w - 1, x + dx));
          const yy = Math.max(0, Math.min(H - 1, y + dy));
          if (src[yy * w + xx] > mx) mx = src[yy * w + xx];
        }
      }
      const i = (y * w + x) * 4;
      p[i] = p[i + 1] = p[i + 2] = mx;
    }
  }
  return { w, data: p };
}

async function main() {
  const [source, out = "public/assets/levels/belliard/street-wide.png"] = process.argv.slice(2);
  if (!source) {
    console.error("usage: node scripts/stitch-belliard-street.mjs <source.png> [out.png]");
    process.exit(1);
  }
  const a = await prep(source);
  const colMean = (x) => {
    let s = 0;
    for (let y = 0; y < H; y++) s += a.data[(y * a.w + x) * 4];
    return s / H;
  };
  let L = 0;
  while (L < a.w - 1 && colMean(L) > 210) L++; // drop left white margin
  let R = a.w;
  while (R > L + 1 && colMean(R - 1) > 150) R--; // trim right back to a dark seam column
  const w = R - L;
  const finalW = w * 2;
  const g = (x, y) => a.data[(y * a.w + (L + x)) * 4];
  const cv = createCanvas(finalW, H);
  const ctx = cv.getContext("2d");
  const od = ctx.createImageData(finalW, H);
  const o = od.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < finalW; x++) {
      const v = x < w ? g(x, y) : g(w - 1 - (x - w), y); // right half = mirror of left
      const i = (y * finalW + x) * 4;
      o[i] = o[i + 1] = o[i + 2] = v;
      o[i + 3] = 255;
    }
  }
  ctx.putImageData(od, 0, 0);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, cv.toBuffer("image/png"));
  console.log(
    `${out} — ${finalW}x${H} (${(finalW / H).toFixed(3)}:1, ${((finalW * H) / 1e6).toFixed(1)} MP)`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
