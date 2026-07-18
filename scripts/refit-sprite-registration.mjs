#!/usr/bin/env node
/**
 * REFIT SPRITE REGISTRATION — one-shot scripted retouch for the gptimage cutout
 * batch (in-game verdict: vehicles stretched, figures too small).
 *
 * Root causes:
 *  - The gptimage harness emitted SQUARE 256×256 PNGs, but the vehicle render
 *    planes use the manifest's declared sizes (truck 384×192 etc.) → the square
 *    art got stretched to the plane's aspect.
 *  - The generated figures only occupy ~55-70% of the frame height (empty
 *    margins), where the previous art filled the frame → everything rendered
 *    too small at the same plane scale.
 *
 * Fix, asset-side (no regeneration — the approved art is preserved):
 *  - Vehicles: autocrop the opaque bbox and fit it into the DECLARED aspect
 *    canvas (levelArt vehicles.types[t].size), 96% fill, centered.
 *  - Figures: autocrop and refit into 256×256 with the figure at ~94% of the
 *    frame height, bottom-anchored (feet on a consistent line), horizontally
 *    centered. The scale factor is COMMON across a type's frames (base + _fN)
 *    so the flipbook does not pulse between frames.
 *  - Untouched: hostage/girl.png and enemy_hostage.png (validated in-game as
 *    correctly registered) and the level backdrops.
 *
 * After running this, muzzle anchors MUST be re-measured
 * (scripts/measure-muzzle-anchors.mjs) — the refit changes normalized coords.
 *
 * Usage: node scripts/refit-sprite-registration.mjs   (idempotent-ish: a second
 * run re-fits already-fitted art to the same geometry, a no-op within rounding)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "public/assets");
const levelArt = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/game/levels/levelArt.json"), "utf8"),
);

const FIGURE_FILL = 0.94; // figure height as a fraction of the 256 frame
const BOTTOM_MARGIN = 0.03; // feet line above the bottom edge
const VEHICLE_FILL = 0.96;

async function readSprite(file) {
  const img = await loadImage(file);
  const c = createCanvas(img.width, img.height);
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  return { canvas: c, ctx: x, w: img.width, h: img.height };
}

function bbox(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function fitInto(src, box, outW, outH, scale, anchor) {
  const out = createCanvas(outW, outH);
  const ox = out.getContext("2d");
  ox.imageSmoothingEnabled = true;
  ox.imageSmoothingQuality = "high";
  const dw = box.w * scale;
  const dh = box.h * scale;
  const dx = (outW - dw) / 2;
  const dy = anchor === "bottom" ? outH - outH * BOTTOM_MARGIN - dh : (outH - dh) / 2;
  ox.drawImage(src, box.x0, box.y0, box.w, box.h, dx, dy, dw, dh);
  return out;
}

// ── figure groups: common scale per type so the flipbook stays steady ─────────
const figureGroups = [];
for (const key of Object.keys(levelArt.enemies.types)) {
  if (key === "enemy_hostage") continue; // validated in-game, untouched
  const frames = levelArt.enemies.types[key].frames ?? [""];
  const files = frames.map((_, i) => (i === 0 ? `${key}.png` : `${key}_f${i + 1}.png`));
  figureGroups.push({ name: key, files });
}
figureGroups.push({
  name: "courier/rider",
  files: [1, 2, 3, 4, 5, 6].map((n) => `courier/rider${n === 1 ? "" : `_f${n}`}.png`),
});

for (const group of figureGroups) {
  const sprites = [];
  for (const rel of group.files) {
    const file = path.join(ASSETS, rel);
    if (!fs.existsSync(file)) {
      console.log(`  [skip] ${rel} (missing)`);
      continue;
    }
    const s = await readSprite(file);
    const b = bbox(s.ctx, s.w, s.h);
    if (!b) {
      console.log(`  [skip] ${rel} (empty)`);
      continue;
    }
    sprites.push({ rel, file, ...s, box: b });
  }
  if (!sprites.length) continue;
  const outH = 256;
  const maxH = Math.max(...sprites.map((s) => s.box.h));
  const scale = (outH * FIGURE_FILL) / maxH; // common across the group
  for (const s of sprites) {
    const out = fitInto(s.canvas, s.box, 256, outH, scale, "bottom");
    fs.writeFileSync(s.file, out.toBuffer("image/png"));
    console.log(
      `  [fit] ${s.rel} bbox ${s.box.w}x${s.box.h} ×${scale.toFixed(3)} (group ${group.name})`,
    );
  }
}

// ── vehicles: fit into the DECLARED aspect from the manifest ──────────────────
for (const [key, def] of Object.entries(levelArt.vehicles.types)) {
  const rel = def.asset.replace(/^assets\//, "");
  const file = path.join(ASSETS, rel);
  if (!fs.existsSync(file)) {
    console.log(`  [skip] ${rel} (missing)`);
    continue;
  }
  const { width: outW, height: outH } = def.size;
  const s = await readSprite(file);
  const b = bbox(s.ctx, s.w, s.h);
  if (!b) continue;
  const scale = Math.min((outW * VEHICLE_FILL) / b.w, (outH * VEHICLE_FILL) / b.h);
  const out = fitInto(s.canvas, b, outW, outH, scale, "center");
  fs.writeFileSync(file, out.toBuffer("image/png"));
  console.log(`  [fit] ${rel} bbox ${b.w}x${b.h} → ${outW}x${outH} ×${scale.toFixed(3)} (${key})`);
}

console.log("\nDone. Now re-run: node scripts/measure-muzzle-anchors.mjs");
