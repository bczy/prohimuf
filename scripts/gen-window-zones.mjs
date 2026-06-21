#!/usr/bin/env node
/**
 * Derive enemy-window zones from the facade ART, one set per panel, so the cops
 * and the procedural balcony railings line up with the real lit windows of each
 * (independently generated) facade panel — see issue: "désalignement fenêtres /
 * ennemis / grilles sur le décor large".
 *
 * For each level the designer's `windowGrid` (cols/rows/extent in levelArt.json)
 * is the intended layout; this only *snaps* each row/column line onto the warm
 * window light of THIS panel's image, via separable warm-density centroids. So
 * the slot COUNT stays stable while positions track whatever art was generated.
 *
 * Output: src/game/levels/windowZones.generated.json
 *   { "<levelId>": WindowZone[][] }  // outer = panels (0..PANELS-1)
 * Pass --debug to also write overlay JPEGs to scripts/.dbg-<level>-p<n>.jpg
 * (gitignored) — open them to check each grid lands on the real windows.
 *
 * Run after regenerating facade art:  node scripts/gen-window-zones.mjs
 * Requires the pure-JS JPEG decoder: `npm i --no-save jpeg-js` (the facade
 * panels are JPEG-encoded despite their .png names).
 */
import fs from "fs";
import path from "path";
import jpeg from "jpeg-js";

const ROOT = process.cwd();
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");
const OUT = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
const LEVELS_DIR = path.resolve(ROOT, "public/assets/levels");
const PANELS = 4;
const DEBUG = process.argv.includes("--debug");

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function panelFile(id, p) {
  const name = p === 0 ? "facade" : `facade_${p + 1}`;
  const f = path.join(LEVELS_DIR, id, `${name}.png`);
  // A missing panel falls back to the first facade (same as the renderer).
  return fs.existsSync(f) ? f : path.join(LEVELS_DIR, id, "facade.png");
}

// Warm-lit window pixel: warmer than the cool stone wall (r clearly over b).
function litMask(data, W, H) {
  const mask = new Uint8Array(W * H);
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 90 && r >= g && g >= b * 0.82 && r - b > 18 && r + g + b > 150) mask[p] = 1;
  }
  return mask;
}

// Warm centroid of `profile` within ±half of `nominal`; empty cell keeps nominal.
function snap(profile, nominal, half, lo, hi) {
  const a = clamp(Math.round(nominal - half), lo, hi);
  const b = clamp(Math.round(nominal + half), lo, hi);
  let w = 0;
  let acc = 0;
  for (let i = a; i <= b; i++) {
    w += profile[i];
    acc += profile[i] * i;
  }
  return w > 0 ? acc / w : nominal;
}

function detectPanel(file, grid) {
  const raw = jpeg.decode(fs.readFileSync(file), { useTArray: true });
  const { width: W, height: H, data } = raw;
  const mask = litMask(data, W, H);

  const xL = Math.round(grid.left * W);
  const xR = Math.round(grid.right * W);
  const yT = Math.round(grid.top * H);
  const yB = Math.round(grid.bottom * H);

  const colSum = new Float64Array(W);
  const rowSum = new Float64Array(H);
  for (let y = yT; y <= yB; y++) {
    for (let x = xL; x <= xR; x++) {
      if (mask[y * W + x]) {
        colSum[x]++;
        rowSum[y]++;
      }
    }
  }

  const colStep = grid.cols > 1 ? (xR - xL) / (grid.cols - 1) : W;
  const rowStep = grid.rows > 1 ? (yB - yT) / (grid.rows - 1) : H;

  const cols = [];
  for (let c = 0; c < grid.cols; c++) {
    const nom = grid.cols === 1 ? (xL + xR) / 2 : lerp(xL, xR, c / (grid.cols - 1));
    cols.push(snap(colSum, nom, colStep * 0.42, xL, xR));
  }
  const rows = [];
  for (let r = 0; r < grid.rows; r++) {
    const nom = grid.rows === 1 ? (yT + yB) / 2 : lerp(yT, yB, r / (grid.rows - 1));
    rows.push(snap(rowSum, nom, rowStep * 0.42, yT, yB));
  }

  const zw = (colStep * 0.6) / W;
  const zh = (rowStep * 0.62) / H;
  const zones = [];
  for (const ry of rows) {
    for (const cx of cols) {
      zones.push({
        x: +(cx / W).toFixed(4),
        y: +(ry / H).toFixed(4),
        w: +zw.toFixed(4),
        h: +zh.toFixed(4),
      });
    }
  }
  return { zones, raw };
}

function writeOverlay(raw, zones, out) {
  const { width: W, height: H, data } = raw;
  for (let i = 0; i < data.length; i += 4) {
    data[i] *= 0.5;
    data[i + 1] *= 0.5;
    data[i + 2] *= 0.5;
  }
  const px = (v, n) => clamp(Math.round(v * n), 0, n - 1);
  for (const z of zones) {
    const x0 = px(z.x - z.w / 2, W);
    const x1 = px(z.x + z.w / 2, W);
    const y0 = px(z.y - z.h / 2, H);
    const y1 = px(z.y + z.h / 2, H);
    for (let x = x0; x <= x1; x++)
      for (const y of [y0, y1]) {
        const i = (y * W + x) * 4;
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 0;
      }
    for (let y = y0; y <= y1; y++)
      for (const x of [x0, x1]) {
        const i = (y * W + x) * 4;
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 0;
      }
  }
  fs.writeFileSync(out, jpeg.encode({ width: W, height: H, data }, 88).data);
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const fallbackGrid = manifest.windowGrid;
  const result = {};
  for (const level of manifest.levels) {
    const grid = level.windowGrid ?? fallbackGrid;
    const panels = [];
    for (let p = 0; p < PANELS; p++) {
      const file = panelFile(level.id, p);
      const { zones, raw } = detectPanel(file, grid);
      panels.push(zones);
      if (DEBUG) writeOverlay(raw, zones, path.resolve(ROOT, `scripts/.dbg-${level.id}-p${p}.jpg`));
      console.log(`${level.id} panel ${p}: ${zones.length} zones  (${path.basename(file)})`);
    }
    result[level.id] = panels;
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
}

main();
