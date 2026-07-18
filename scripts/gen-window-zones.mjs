#!/usr/bin/env node
/**
 * Derive enemy-window zones from the facade ART so the cops and the procedural
 * balcony railings line up with the real lit windows of the (independently
 * generated) backdrop art — see issue: "désalignement fenêtres / ennemis /
 * grilles sur le décor large".
 *
 * Two independent passes, two independent art pipelines:
 *
 * 1. SINGLE-FACADE (unchanged, ADR-0028): for each level the designer's
 *    `windowGrid` (cols/rows/extent in levelArt.json) is the intended layout;
 *    this *snaps* each row/column line onto the warm window light of THIS
 *    panel's JPEG image (`facade[_N].png`, one set per `PANELS` panel), via
 *    separable warm-density centroids. Slot COUNT stays stable; positions
 *    track whatever art was generated. Output keyed by bare level id →
 *    `WindowZone[][]` (outer = panels 0..PANELS-1).
 *
 * 2. TRONÇON-SEQUENCE (ADR-0046): each level with a `backdrop.mode ===
 *    "troncon-sequence"` in the manifest names a FIXED set of distinct,
 *    variable-width, transparent PNG tronçons (`<file>.png`), each its own
 *    building(s) with irregular window counts/positions — there is no shared
 *    nominal grid to snap to. This pass instead DETECTS the real window rows
 *    (floors) and columns (bays) per tronçon from the art itself:
 *      - floor bands: peaks in the row-wise density of near-black ink lines
 *        (window frames / balcony ironwork read as thick dark outlines in
 *        this comic-filtered art) within the upper lit-window y-band
 *        (~0.15–0.50, per the v2 art direction — excludes the roofline above
 *        and the tagged/shuttered ground floor below);
 *      - window bays per floor: peaks in the column-wise density of the same
 *        dark-line mask, paired left/right-edge → one zone per pair whose gap
 *        falls in a plausible single-window width range;
 *      - each candidate zone is opacity-checked (must sit on real building
 *        pixels, not a between-building sky sliver) before being kept.
 *    Output keyed `${levelId}/${file}` → flat `WindowZone[]` (see
 *    `src/game/levels/levelArt.ts` `GENERATED_TRONCON_ZONES` — a DISTINCT
 *    namespace from the bare level-id keys above; level-id keys never
 *    contain `/`, so the two never collide. `getBackdropLayout` falls back to
 *    the bare-id zones when a `${levelId}/${file}` entry is absent).
 *
 * Output: src/game/levels/windowZones.generated.json (one combined object).
 * Pass --debug to also write overlay JPEGs to scripts/.dbg-<level>-<tag>.jpg
 * (gitignored) — open them to check the zones land on the real windows.
 *
 * Run after regenerating facade/tronçon art:  node scripts/gen-window-zones.mjs
 * Requires the pure-JS JPEG decoder: `npm i --no-save jpeg-js` (the facade
 * panels are JPEG-encoded despite their .png names; also used to encode
 * --debug overlays for BOTH passes, tronçons included). The tronçon pass
 * additionally reads real PNGs (RGBA + alpha) via `pngjs`, already present in
 * node_modules as a transitive dep (vitest's browser-mode diff mocker) — no
 * extra install needed.
 */
import fs from "fs";
import path from "path";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");
const OUT = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
const LEVELS_DIR = path.resolve(ROOT, "public/assets/levels");
const PANELS = 4;
const DEBUG = process.argv.includes("--debug");

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Pass 1 — single-facade (unchanged behaviour).
// ---------------------------------------------------------------------------

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

// Shared debug overlay: draws green zone outlines over a darkened copy of the
// source pixels (RGBA {width,height,data}, either jpeg-js's or pngjs's raw
// shape — both are W×H RGBA byte buffers) and writes it out as JPEG.
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

// ---------------------------------------------------------------------------
// Pass 2 — tronçon-sequence (ADR-0046): detect real window openings.
// ---------------------------------------------------------------------------

// Upper lit-window floors: below the roofline/chimneys, above the tagged
// shuttered ground floor (v2 art direction).
const TRONCON_Y_BAND = [0.15, 0.5];
const OPAQUE_ALPHA = 200; // sky-keyed pixels are fully transparent; building is not.
const DARK_MAX = 60; // near-black ink outline (window frames / ironwork).
const ROW_DIST_FRAC = 0.07; // min spacing between detected floor lines.
const ROW_PROMINENCE = 0.04;
const MIN_FLOOR_FRAC = 0.035; // floor bands thinner than this get folded into a neighbour.
const COL_DIST_FRAC = 0.03; // min spacing between detected window-edge lines.
const COL_PROMINENCE = 0.08;
const MIN_WIN_FRAC = 0.018; // plausible single-window-bay width range (of tile width).
const MAX_WIN_FRAC = 0.085;
const ZONE_W_SHRINK = 0.82; // inset from the detected outer frame edges toward the glass.
const ZONE_H_SHRINK = 0.78;
const MIN_ZONE_OPACITY = 0.85; // reject zones landing on a between-building sky sliver.

// Simple centred moving average (edge-replicated), good enough for peak-finding
// on a few-hundred-sample profile — not required to match scipy bit-for-bit.
function smooth1d(arr, size) {
  const n = arr.length;
  const half = Math.floor(size / 2);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let k = -half; k <= half; k++) {
      sum += arr[clamp(i + k, 0, n - 1)];
      count++;
    }
    out[i] = sum / count;
  }
  return out;
}

// Topographic prominence of the local maximum at `peak`: how far it stands
// above the higher of its two nearest bounding valleys.
function prominenceAt(y, peak) {
  const peakVal = y[peak];
  let leftMin = peakVal;
  for (let i = peak - 1; i >= 0; i--) {
    if (y[i] > peakVal) break;
    leftMin = Math.min(leftMin, y[i]);
  }
  let rightMin = peakVal;
  for (let i = peak + 1; i < y.length; i++) {
    if (y[i] > peakVal) break;
    rightMin = Math.min(rightMin, y[i]);
  }
  return peakVal - Math.max(leftMin, rightMin);
}

// Local maxima of `y` at least `distance` apart, kept highest-first, filtered
// by minimum topographic `prominence`. A minimal from-scratch analogue of
// scipy.signal.find_peaks (sized for this tool's few-hundred-sample profiles).
function findPeaks(y, distance, prominence) {
  const n = y.length;
  const candidates = [];
  let i = 1;
  while (i < n - 1) {
    if (y[i - 1] < y[i]) {
      let j = i;
      while (j < n - 1 && y[j] === y[j + 1]) j++;
      if (j < n - 1 && y[j + 1] < y[j]) candidates.push(Math.floor((i + j) / 2));
      i = j + 1;
    } else {
      i++;
    }
  }
  const withProm = candidates
    .map((p) => ({ p, prom: prominenceAt(y, p) }))
    .filter((c) => c.prom >= prominence)
    .sort((a, b) => y[b.p] - y[a.p]);
  const kept = [];
  for (const c of withProm) {
    if (kept.every((k) => Math.abs(k - c.p) >= distance)) kept.push(c.p);
  }
  return kept.sort((a, b) => a - b);
}

/**
 * Detect window zones on one tronçon PNG (RGBA + real alpha transparency).
 * Returns `{ zones, floorBands }` (floorBands in y-fractions, for logging).
 */
function detectTronconZones(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data } = png;
  const opaque = new Uint8Array(W * H);
  const dark = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const isOpaque = data[i + 3] > OPAQUE_ALPHA;
      opaque[y * W + x] = isOpaque ? 1 : 0;
      if (isOpaque) {
        const mx = Math.max(data[i], data[i + 1], data[i + 2]);
        dark[y * W + x] = mx < DARK_MAX ? 1 : 0;
      }
    }
  }

  const y0 = Math.round(TRONCON_Y_BAND[0] * H);
  const y1 = Math.round(TRONCON_Y_BAND[1] * H);

  // Floor bands: row-wise dark/opaque density peaks (frame lintels + rails).
  const rowFrac = new Float64Array(y1 - y0);
  for (let y = y0; y < y1; y++) {
    let op = 0;
    let dk = 0;
    for (let x = 0; x < W; x++) {
      if (opaque[y * W + x]) {
        op++;
        if (dark[y * W + x]) dk++;
      }
    }
    rowFrac[y - y0] = op > 0 ? dk / op : 0;
  }
  const rowPeaksRel = findPeaks(
    smooth1d(rowFrac, 3),
    Math.max(Math.round(H * ROW_DIST_FRAC), 5),
    ROW_PROMINENCE,
  );
  const rowPeaks = rowPeaksRel.map((p) => p + y0);

  const bounds = Array.from(new Set([y0, ...rowPeaks, y1])).sort((a, b) => a - b);
  const minFloor = MIN_FLOOR_FRAC * H;
  const floors = [];
  let cur0 = bounds[0];
  for (let j = 1; j < bounds.length; j++) {
    const h = bounds[j] - cur0;
    if (h >= minFloor) {
      floors.push([cur0, bounds[j]]);
      cur0 = bounds[j];
    } else if (j === bounds.length - 1) {
      // Trailing sliver too thin to be its own floor: fold into the previous one.
      if (floors.length > 0) floors[floors.length - 1][1] = bounds[j];
      else floors.push([cur0, bounds[j]]);
    }
  }

  // Window bays per floor: column-wise dark/opaque density peaks, paired
  // left/right frame edges → one zone per plausible-width pair.
  const zones = [];
  for (const [fy0, fy1] of floors) {
    const colFrac = new Float64Array(W);
    for (let x = 0; x < W; x++) {
      let op = 0;
      let dk = 0;
      for (let y = fy0; y < fy1; y++) {
        if (opaque[y * W + x]) {
          op++;
          if (dark[y * W + x]) dk++;
        }
      }
      colFrac[x] = op > 0 ? dk / op : 0;
    }
    const colPeaks = findPeaks(
      smooth1d(colFrac, 5),
      Math.max(Math.round(W * COL_DIST_FRAC), 5),
      COL_PROMINENCE,
    );

    let i = 0;
    while (i < colPeaks.length - 1) {
      const p0 = colPeaks[i];
      const p1 = colPeaks[i + 1];
      const gap = p1 - p0;
      if (gap >= MIN_WIN_FRAC * W && gap <= MAX_WIN_FRAC * W) {
        const cx = (p0 + p1) / 2;
        const w = gap * ZONE_W_SHRINK;
        const fyc = (fy0 + fy1) / 2;
        const fh = (fy1 - fy0) * ZONE_H_SHRINK;
        const x0 = clamp(Math.round(cx - w / 2), 0, W - 1);
        const x1 = clamp(Math.round(cx + w / 2), 0, W - 1);
        const yy0 = clamp(Math.round(fyc - fh / 2), 0, H - 1);
        const yy1 = clamp(Math.round(fyc + fh / 2), 0, H - 1);
        let op = 0;
        let cnt = 0;
        for (let y = yy0; y <= yy1; y++) {
          for (let x = x0; x <= x1; x++) {
            cnt++;
            if (opaque[y * W + x]) op++;
          }
        }
        if (cnt > 0 && op / cnt >= MIN_ZONE_OPACITY) {
          zones.push({
            x: +(cx / W).toFixed(4),
            y: +(fyc / H).toFixed(4),
            w: +(w / W).toFixed(4),
            h: +(fh / H).toFixed(4),
          });
        }
        i += 2;
      } else {
        i += 1;
      }
    }
  }

  return { zones, floorBands: floors.map(([a, b]) => [+(a / H).toFixed(3), +(b / H).toFixed(3)]) };
}

// ---------------------------------------------------------------------------

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const fallbackGrid = manifest.windowGrid;
  const result = {};

  // Pass 1 — single-facade, all levels (unchanged output, unchanged behaviour).
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

  // Pass 2 — tronçon-sequence levels (ADR-0046): detect real window openings
  // per distinct tronçon file, keyed `${levelId}/${file}`.
  for (const level of manifest.levels) {
    if (level.backdrop?.mode !== "troncon-sequence") continue;
    const files = Array.from(new Set(level.backdrop.tiles.map((t) => t.file)));
    for (const file of files) {
      const png = path.join(LEVELS_DIR, level.id, `${file}.png`);
      if (!fs.existsSync(png)) {
        console.warn(`${level.id}/${file}: missing ${path.relative(ROOT, png)}, skipped`);
        continue;
      }
      const { zones, floorBands } = detectTronconZones(png);
      result[`${level.id}/${file}`] = zones;
      console.log(
        `${level.id}/${file}: ${zones.length} zones across ${floorBands.length} floor band(s) ` +
          `y≈[${floorBands.map(([a, b]) => `${a}-${b}`).join(", ")}]`,
      );
      if (DEBUG) {
        const raw = PNG.sync.read(fs.readFileSync(png));
        writeOverlay(raw, zones, path.resolve(ROOT, `scripts/.dbg-${level.id}-${file}.jpg`));
      }
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
}

main();
