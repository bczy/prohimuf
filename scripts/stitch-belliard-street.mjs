#!/usr/bin/env node
/**
 * Stitch two ideogram street renders into ONE wide ~5:1 Belliard backdrop image
 * (no tiles, no seams to glue at runtime — Bertrand's single-image approach).
 *
 * WHY: the drawn look + self-contained frontal framing come from a paid model
 * (ideogram-v4-quality via scripts/gen-street-paid.mjs, CI), but those models
 * clamp their aspect ratio to ~2.67:1 max — no native 5:1. So two ideogram
 * streets are butt-joined here into ~5.3:1, both first normalised to a common
 * B&W value range (mean + contrast) so no brightness step shows at the join;
 * a tiny feather softens the exact seam. The join reads as a boundary between
 * two building blocks (streets have those).
 *
 * Source renders come from the CI experiment (gen-street-experiment.yml,
 * model=ideogram-v4-quality, seeds 7111 + 7113) — not committed; pass their
 * paths. Output is the committed asset public/assets/levels/belliard/street-wide.png.
 *
 *   node scripts/stitch-belliard-street.mjs <left.png> <right.png> [out.png]
 */
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const H = 1248; // shared height
const T_MEAN = 155;
const T_STD = 68;
const FEATHER = 6;

async function prep(file) {
  const img = await loadImage(file);
  const w = Math.round((img.width * H) / img.height);
  const cv = createCanvas(w, H);
  const c = cv.getContext("2d");
  c.drawImage(img, 0, 0, w, H);
  const d = c.getImageData(0, 0, w, H);
  const p = d.data;
  let s = 0;
  const n = w * H;
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
  return { w, data: p };
}

async function main() {
  const [left, right, out = "public/assets/levels/belliard/street-wide.png"] =
    process.argv.slice(2);
  if (!left || !right) {
    console.error(
      "usage: node scripts/stitch-belliard-street.mjs <left.png> <right.png> [out.png]",
    );
    process.exit(1);
  }
  const a = await prep(left);
  const b = await prep(right);
  // Trim near-white margins on every edge so no pure-white band survives — the
  // right margin of `left` butting `right` was a white strip at the seam.
  const colMean = (im, x) => {
    let s = 0;
    for (let y = 0; y < H; y++) s += im.data[(y * im.w + x) * 4];
    return s / H;
  };
  const trim = (im) => {
    let L = 0;
    let R = im.w;
    while (L < R - 1 && colMean(im, L) > 210) L++;
    while (R > L + 1 && colMean(im, R - 1) > 210) R--;
    return { L, R, w: R - L };
  };
  const ta = trim(a);
  const tb = trim(b);
  const aw = ta.w;
  const bw = tb.w;
  const finalW = aw + bw;
  const gA = (x, y) => a.data[(y * a.w + (ta.L + x)) * 4];
  const gB = (x, y) => b.data[(y * b.w + (tb.L + x)) * 4];
  const cv = createCanvas(finalW, H);
  const ctx = cv.getContext("2d");
  const od = ctx.createImageData(finalW, H);
  const o = od.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < finalW; x++) {
      const dx = x - aw;
      let v;
      if (dx < -FEATHER) v = gA(x, y);
      else if (dx > FEATHER) v = gB(dx, y);
      else {
        const w = (dx + FEATHER) / (2 * FEATHER);
        v = gA(Math.min(aw - 1, x), y) * (1 - w) + gB(Math.max(0, dx), y) * w;
      }
      const i = (y * finalW + x) * 4;
      o[i] = o[i + 1] = o[i + 2] = v;
      o[i + 3] = 255;
    }
  }
  ctx.putImageData(od, 0, 0);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, cv.toBuffer("image/png"));
  console.log(
    `${out} — ${finalW}x${H} (${(finalW / H).toFixed(2)}:1, ${((finalW * H) / 1e6).toFixed(1)} MP)`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
