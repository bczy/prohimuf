#!/usr/bin/env node
/**
 * Make the cop sprites' flat dark background transparent so they read as
 * figures in the windows instead of opaque rectangles.
 *
 * Uses an edge flood-fill (not a global colour key) so dark pixels *inside*
 * the cop — uniform, boots — are preserved; only background-connected pixels
 * near the sampled corner colour are cleared.
 *
 * Operates in place on public/assets/enemy_*.png.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const DIR = path.resolve(process.cwd(), "public/assets");
const THRESHOLD_SQ = 24 * 24; // conservative: only near-identical background is cleared

function dist2(a, b, c, r, g, bl) {
  const dr = a - r;
  const dg = b - g;
  const db = c - bl;
  return dr * dr + dg * dg + db * db;
}

async function cutout(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;

  // Background colour = average of the four corners.
  const corners = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + (W - 1)) * 4];
  let br = 0;
  let bg = 0;
  let bb = 0;
  for (const o of corners) {
    br += d[o];
    bg += d[o + 1];
    bb += d[o + 2];
  }
  br /= 4;
  bg /= 4;
  bb /= 4;

  const visited = new Uint8Array(W * H);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p]) return;
    visited[p] = 1;
    const o = p * 4;
    if (dist2(d[o], d[o + 1], d[o + 2], br, bg, bb) <= THRESHOLD_SQ) {
      d[o + 3] = 0; // clear alpha
      stack.push(p);
    }
  };

  // Seed from top + sides only (not the bottom): the cop's dark trousers are
  // close to the background colour, so seeding the bottom edge would leak the
  // fill up between the legs and eat them. A small shadow at the feet remains.
  for (let x = 0; x < W; x++) {
    pushIf(x, 0);
  }
  for (let y = 0; y < H; y++) {
    pushIf(0, y);
    pushIf(W - 1, y);
  }
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % W;
    const y = (p - x) / W;
    pushIf(x - 1, y);
    pushIf(x + 1, y);
    pushIf(x, y - 1);
    pushIf(x, y + 1);
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`  cut ${path.basename(file)} (${W}x${H})`);
}

async function main() {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => /^enemy_.*\.png$/.test(f))
    .map((f) => path.join(DIR, f));
  if (files.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  for (const f of files) await cutout(f);
  console.log("done.");
}

// The edge flood-fill cutout is reused by sibling generators (e.g.
// gen-vehicle-sprites.mjs), so expose it. Only run the enemy_*.png batch when
// this file is invoked directly as a CLI, not when imported as a module.
export { cutout };

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
