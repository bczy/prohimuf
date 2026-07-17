#!/usr/bin/env node
/**
 * align-windows.mjs — window-alignment HARNESS for the image levels.
 *
 * Generalizes the original belliard-only harness to any playable level. The AI
 * facade art is NOT a clean grid, so a fixed grid of cop zones makes sprites
 * overflow their window openings while some slots sit on bare wall. This harness
 * DETECTS the real lit windows from each facade, then drives the live production
 * render to place one non-overflowing cop in each, looping until zero defects,
 * with debug overlays as proof.
 *
 *   SUCCESS (per level): for every panel #zones == #detected windows, each
 *   rendered enemy sprite box is contained (⊆, +τ) in its window opening, and no
 *   zone sits on bare wall. Exit 0 when clean, non-zero while any defect remains.
 *
 * Usage:
 *   node scripts/align-windows.mjs [--check|--fix] [levelId ...]
 *     default levels = every playable level (belliard, stalingrad, vitry)
 *     --check   measure ONLY — apply the committed windowZones.generated.json,
 *               read the rendered slot rects, report defects, write NOTHING,
 *               exit non-zero on any defect (CI gate).
 *     --fix     (default) DETECT → build zones → apply via __MUF_ZONES__ → read
 *               __MUF_SLOT_RECTS__ → measure → correct → loop to 0 defects →
 *               overwrite ONLY the target level's key of
 *               windowZones.generated.json (other levels left byte-identical).
 *
 * Detection adapts PER LEVEL (see LEVEL_CFG):
 *   - Floor rows: belliard keeps its proven equal-thirds split of the residential
 *     band (⇒ its shipped 17-zone / 5-5-7 result is preserved EXACTLY). Every
 *     other level uses RUN-BASED row detection — a per-row warm-density profile
 *     over the gameplay band (windowGrid.top/bottom), thresholded into contiguous
 *     warm RUNS whose centroids are the floor centres. This is robust to however
 *     many floors a facade has (do NOT assume 3).
 *   - Per row, window columns come from a warm column-density profile whose
 *     above-threshold runs (twin panes merged, wide runs split by pitch) are the
 *     lit windows. Dark/ambiguous windows are intentionally NOT invented.
 *
 * Geometry contract (GameScene.tsx, mirrored by measure()):
 *   The EnemySprite plane IGNORES the zone width — planeH = zone.h · 0.8, planeW =
 *   planeH · WIDEST_ASPECT, and the box is shifted DOWN by planeH · 0.28 (feet at
 *   sill). So zone.h controls the sprite SIZE, zone.y its vertical placement, and
 *   zone.w only frames the foreground railing (⇒ set to the opening width). The
 *   harness reads the live per-panel slot rects via __MUF_SLOT_RECTS__ and
 *   calibrates the h→size / y→placement mapping from the first render.
 *
 * Every facade is one panel tiled ×4, so ONE detection drives all four identical
 * panels of a level.
 *
 * Requires: jpeg-js (`npm i --no-save --legacy-peer-deps jpeg-js`) and playwright
 * (`ln -s /opt/node22/lib/node_modules/playwright node_modules/playwright`), and a
 * server already serving the production build at PREVIEW_URL
 * (default http://127.0.0.1:4173/prohimuf/).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jpeg from "jpeg-js";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";
import { misaligned, ALIGN_TOL } from "./lib/alignment.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";
const ZONES_JSON = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
const facadeFile = (id) => path.resolve(ROOT, "public/assets/levels", id, "facade.png");
const dbgPrefix = (id) => path.resolve(ROOT, "scripts", `.dbg-${id}-align`);

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const MAX_ITERS = 12;
const PANELS = 4;

// Containment tolerance (per side), matching the render contract's τ.
const TAU = 0.01;
// Sprite plane target: fill this fraction of the opening HEIGHT.
const FILL = 0.88;
// Extra safety margin (beyond τ) kept between the sprite box and the opening edge.
const MARGIN = 0.006;

const DEFAULT_WARM = (r, g, b) => r > 78 && r - b > 12 && r + g + b > 120;

/**
 * Per-level detection tuning (facade-pixel fractions). `band` null ⇒ read the
 * gameplay band from the level's windowGrid.top/bottom in levelArt.json.
 *
 * belliard is special-cased to its ORIGINAL equal-thirds path and hand-tuned band
 * so its shipped 17-zone / 5-5-7 result is reproduced byte-for-byte; do not touch.
 */
const LEVEL_CFG = {
  belliard: {
    rowMode: "thirds",
    nRows: 3,
    band: [0.15, 0.63], // preserved verbatim from align-belliard-windows.mjs
    rowHalf: 0.06,
    colSmooth: 3,
    colThresh: 0.13,
    twinMerge: 0.05,
    minPitch: 0.075,
    splitPitch: 0.09,
    minRunW: 0.03,
    openingW: 0.081,
    openingH: 0.125,
    probeH: 0.13,
    warm: DEFAULT_WARM,
  },
  stalingrad: {
    rowMode: "runs",
    band: null, // 0.17–0.52 from windowGrid
    rowSmooth: 0.005, // vertical smoothing radius (fraction of H)
    rowDetrend: 0.06, // top-hat baseline radius (fraction of H)
    rowThresh: 0.025, // min detrended warm width-fraction to belong to a floor
    rowGapMerge: 0.012, // merge floor runs separated by < this (fraction of H)
    rowMinH: 0.015, // ignore floor runs thinner than this
    rowHalf: 0.045,
    colSmooth: 3,
    colThresh: 0.16,
    twinMerge: 0.03,
    minPitch: 0.085,
    splitPitch: 0.11,
    minRunW: 0.03,
    openingW: 0.085,
    openingH: 0.11,
    probeH: 0.11,
    warm: DEFAULT_WARM,
  },
  vitry: {
    rowMode: "runs",
    band: null, // 0.16–0.82 from windowGrid
    rowSmooth: 0.005,
    rowDetrend: 0.04,
    rowThresh: 0.02,
    rowGapMerge: 0.008,
    rowMinH: 0.01,
    rowHalf: 0.028,
    colSmooth: 3,
    colThresh: 0.14,
    twinMerge: 0.025,
    minPitch: 0.07,
    splitPitch: 0.1,
    minRunW: 0.022,
    openingW: 0.065,
    openingH: 0.072,
    probeH: 0.08,
    warm: DEFAULT_WARM,
  },
};

const smooth1d = (arr, lo, hi, radius) => {
  const out = new Float64Array(arr.length);
  for (let i = lo; i <= hi; i++) {
    let s = 0;
    let n = 0;
    for (let d = -radius; d <= radius; d++) {
      const j = i + d;
      if (j >= lo && j <= hi) {
        s += arr[j];
        n++;
      }
    }
    out[i] = s / n;
  }
  return out;
};

/** Contiguous runs of `arr[lo..hi] >= thr`, returned as [start,end] index pairs. */
function runsAbove(arr, lo, hi, thr) {
  const runs = [];
  let inRun = false;
  let rs = 0;
  for (let i = lo; i <= hi; i++) {
    if (arr[i] >= thr && !inRun) {
      inRun = true;
      rs = i;
    } else if (arr[i] < thr && inRun) {
      inRun = false;
      runs.push([rs, i - 1]);
    }
  }
  if (inRun) runs.push([rs, hi]);
  return runs;
}

const centroid = (arr, a, b) => {
  let num = 0;
  let den = 0;
  for (let i = Math.round(a); i <= Math.round(b); i++) {
    num += i * arr[i];
    den += arr[i];
  }
  return den > 0 ? num / den : (a + b) / 2;
};

/**
 * Per-row window columns (facade px). A warm column-density profile of the row's
 * scan band → smoothed → above-threshold runs (twin panes merged, wide runs split
 * by pitch, min-pitch enforced). Returns one `{ cx, x0, x1 }` per window — the warm
 * centroid AND the measured run bounds — so `detectOpenings` can size each opening
 * to its real horizontal extent, not a fixed width. Shared by both row-detection
 * strategies.
 */
function detectColumns(det, cfg, cy) {
  const { W, H, warmAt } = det;
  const lo = Math.max(0, Math.round(cy - cfg.rowHalf * H));
  const hi = Math.min(H - 1, Math.round(cy + cfg.rowHalf * H));
  const col = new Float64Array(W);
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = lo; y <= hi; y++) s += warmAt(x, y);
    col[x] = s;
  }
  const sm = smooth1d(col, 0, W - 1, cfg.colSmooth);
  const bandH = hi - lo + 1;
  const thr = bandH * cfg.colThresh;
  const runs = runsAbove(sm, 0, W - 1, thr);
  // merge twin panes of one french window
  const merged = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && r[0] - last[1] <= cfg.twinMerge * W) last[1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  // runs → windows (split abnormally wide runs by pitch; each segment keeps its
  // own [x0,x1] bounds and a centroid computed WITHIN that segment)
  const wins = [];
  for (const [a, b] of merged) {
    const w = b - a + 1;
    if (w < cfg.minRunW * W) continue;
    const n = Math.max(1, Math.round(w / (cfg.splitPitch * W)));
    for (let s = 0; s < n; s++) {
      const x0 = a + (w * s) / n;
      const x1 = a + (w * (s + 1)) / n;
      wins.push({ cx: centroid(sm, x0, x1), x0, x1 });
    }
  }
  // enforce min pitch: collapse near-coincident centres, UNIONing their bounds and
  // recomputing the centroid over the unioned span
  wins.sort((p, q) => p.cx - q.cx);
  const out = [];
  for (const win of wins) {
    const last = out[out.length - 1];
    if (last !== undefined && win.cx - last.cx < cfg.minPitch * W) {
      const x0 = Math.min(last.x0, win.x0);
      const x1 = Math.max(last.x1, win.x1);
      out[out.length - 1] = { cx: centroid(sm, x0, x1), x0, x1 };
    } else {
      out.push(win);
    }
  }
  return out;
}

/** belliard's proven equal-thirds floor rows: each third's warm centroid. */
function rowsThirds(det, cfg) {
  const { W, H, warmAt } = det;
  const yTop = Math.round(cfg.band[0] * H);
  const yBot = Math.round(cfg.band[1] * H);
  const rowSum = new Float64Array(H);
  for (let y = yTop; y <= yBot; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) s += warmAt(x, y);
    rowSum[y] = s;
  }
  const rows = [];
  for (let k = 0; k < cfg.nRows; k++) {
    const lo = Math.round(yTop + ((yBot - yTop) * k) / cfg.nRows);
    const hi = Math.round(yTop + ((yBot - yTop) * (k + 1)) / cfg.nRows);
    let num = 0;
    let den = 0;
    for (let y = lo; y < hi; y++) {
      num += y * rowSum[y];
      den += rowSum[y];
    }
    rows.push(den > 0 ? num / den : (lo + hi) / 2);
  }
  return rows;
}

/**
 * Rolling-minimum baseline over ±radius (morphological erosion). Subtracting it
 * (a "top-hat") removes the slow-varying warm floor and lifts each floor's hump
 * clear of the inter-floor valleys, so floors of very different absolute
 * brightness (a dim top floor vs a bright shallow valley below it) still split.
 */
function detrend(arr, lo, hi, radius) {
  const out = new Float64Array(arr.length);
  for (let i = lo; i <= hi; i++) {
    let m = Infinity;
    for (let j = Math.max(lo, i - radius); j <= Math.min(hi, i + radius); j++) {
      if (arr[j] < m) m = arr[j];
    }
    out[i] = Math.max(0, arr[i] - m);
  }
  return out;
}

/**
 * Run-based floor rows: per-row warm width-fraction profile over the band,
 * smoothed and detrended (top-hat) → contiguous warm RUNS (small gaps merged,
 * thin runs dropped) → each run's warm centroid is a floor centre. Robust to any
 * floor count and to floors of differing brightness.
 */
function rowsRuns(det, cfg) {
  const { W, H, warmAt } = det;
  const yTop = Math.round(cfg.band[0] * H);
  const yBot = Math.round(cfg.band[1] * H);
  const rowDen = new Float64Array(H);
  for (let y = yTop; y <= yBot; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) s += warmAt(x, y);
    rowDen[y] = s / W;
  }
  let sm = smooth1d(rowDen, yTop, yBot, Math.max(1, Math.round(cfg.rowSmooth * H)));
  if (cfg.rowDetrend) sm = detrend(sm, yTop, yBot, Math.round(cfg.rowDetrend * H));
  let runs = runsAbove(sm, yTop, yBot, cfg.rowThresh);
  // merge floor runs separated by a small vertical gap
  const mergeGap = Math.round(cfg.rowGapMerge * H);
  const merged = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && r[0] - last[1] <= mergeGap) last[1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  runs = merged.filter(([a, b]) => b - a + 1 >= Math.round(cfg.rowMinH * H));
  return runs.map(([a, b]) => centroid(sm, a, b));
}

/**
 * Detect the real lit windows from a level's facade. Returns openings in per-panel
 * facade-normalized coords (x,y = CENTRE, w,h = SIZE, y-down), the image data, and
 * the detected row centres (normalized).
 */
function detectOpenings(levelId, band) {
  const cfg = { ...LEVEL_CFG[levelId] };
  if (cfg.band === null) cfg.band = band;
  const raw = jpeg.decode(fs.readFileSync(facadeFile(levelId)), { useTArray: true });
  const { width: W, height: H, data } = raw;
  const warm = cfg.warm;
  const warmAt = (x, y) => {
    const i = (y * W + x) * 4;
    return warm(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
  };
  const det = { W, H, data, warmAt };

  const rowCenters = cfg.rowMode === "thirds" ? rowsThirds(det, cfg) : rowsRuns(det, cfg);

  const openings = [];
  rowCenters.forEach((cy, row) => {
    for (const { cx, x0, x1 } of detectColumns(det, cfg, cy)) {
      // measured width from the run bounds, clamped to a sane band around the seed;
      // fall back to the seed only for degenerate bounds (zero warm mass / too thin)
      const runWpx = x1 - x0;
      const degenerate = !(runWpx > 0) || runWpx < cfg.minRunW * W;
      const w = degenerate
        ? cfg.openingW
        : Math.min(Math.max(runWpx / W, 0.55 * cfg.openingW), 1.6 * cfg.openingW);
      openings.push({
        x: +(cx / W).toFixed(4),
        y: +(cy / H).toFixed(4),
        w: +w.toFixed(4),
        h: cfg.openingH,
        row,
      });
    }
  });
  openings.sort((p, q) => p.row - q.row || p.x - q.x);
  return { openings, cfg, W, H, data, warmAt, rowCenters: rowCenters.map((c) => c / H) };
}

/**
 * Build zones for one panel from the openings, using the calibrated linear map
 * from the live render (a: h→size, b: h→y-shift, c: h→size-x). Sizes each sprite
 * to FILL of the opening height and centres it, with zone.w = opening width.
 */
function zonesFromOpenings(openings, cal) {
  const { a, b, c } = cal;
  return openings.map((o) => {
    let zh = (FILL * o.h) / a;
    const zhMaxH = (o.h + 2 * TAU - 2 * MARGIN) / a;
    const zhMaxW = (o.w + 2 * TAU - 2 * MARGIN) / c;
    zh = Math.min(zh, zhMaxH, zhMaxW);
    const zy = o.y - b * zh; // reported slot centre lands on o.y
    return {
      x: +o.x.toFixed(4),
      y: +zy.toFixed(4),
      w: +o.w.toFixed(4),
      h: +zh.toFixed(4),
    };
  });
}

/**
 * Match each panel's slot rects to the openings (1:1 by nearest), then classify
 * defects: OVERFLOW (slot ⊄ opening+τ), COUNT (#zones ≠ #openings), EMPTY (opening
 * with no zone), WALL (zone centre on bare wall), and MISALIGN (the applied railing
 * frame `zone.x`/`zone.w` off its measured opening beyond `ALIGN_TOL`).
 * `warmDensity(x,y)` samples the facade for the bare-wall check. `zones` is the
 * APPLIED panel-0 zone array (committed zones in `--check`, `panelZones` in `--fix`);
 * omit it to skip the MISALIGN pass.
 */
function measure(slotRects, openings, warmDensity, zones) {
  const defects = [];
  const bySlot = [];
  for (let p = 0; p < PANELS; p++) {
    const slots = slotRects.filter((s) => s.panel === p);
    if (slots.length !== openings.length) {
      defects.push(`panel ${p}: COUNT ${slots.length} zones ≠ ${openings.length} openings`);
    }
    const used = new Set();
    for (const s of slots) {
      let best = -1;
      let bd = Infinity;
      for (let o = 0; o < openings.length; o++) {
        if (used.has(o)) continue;
        const d = Math.hypot(s.x - openings[o].x, s.y - openings[o].y);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      if (best < 0) continue;
      used.add(best);
      const o = openings[best];
      const contained =
        s.x - s.w / 2 >= o.x - o.w / 2 - TAU &&
        s.x + s.w / 2 <= o.x + o.w / 2 + TAU &&
        s.y - s.h / 2 >= o.y - o.h / 2 - TAU &&
        s.y + s.h / 2 <= o.y + o.h / 2 + TAU;
      bySlot.push({ panel: p, opening: o, slot: s, contained });
      if (!contained) {
        defects.push(
          `panel ${p}: OVERFLOW slot@(${s.x.toFixed(3)},${s.y.toFixed(3)}) ` +
            `[${s.w.toFixed(3)}×${s.h.toFixed(3)}] ⊄ opening@(${o.x.toFixed(3)},${o.y.toFixed(3)}) ` +
            `[${o.w.toFixed(3)}×${o.h.toFixed(3)}]`,
        );
      }
      if (warmDensity) {
        const near = openings.some(
          (op) => Math.hypot(s.x - op.x, s.y - op.y) < 0.5 * Math.min(op.w, op.h),
        );
        if (!near && warmDensity(s.x, s.y) < 0.05) {
          defects.push(`panel ${p}: WALL zone@(${s.x.toFixed(3)},${s.y.toFixed(3)}) on bare wall`);
        }
      }
    }
    for (let o = 0; o < openings.length; o++) {
      if (used.has(o)) continue;
      const op = openings[o];
      defects.push(`panel ${p}: EMPTY opening@(${op.x.toFixed(3)},${op.y.toFixed(3)}) has no zone`);
    }
  }
  // MISALIGN — the applied railing frame (zone.x/zone.w) vs its measured opening.
  // Panel-independent (every panel gets the same zone array), so scored once by the
  // same greedy nearest-centre match used for slots.
  if (zones) {
    const usedO = new Set();
    for (const z of zones) {
      let best = -1;
      let bd = Infinity;
      for (let o = 0; o < openings.length; o++) {
        if (usedO.has(o)) continue;
        const d = Math.hypot(z.x - openings[o].x, z.y - openings[o].y);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      if (best < 0) continue;
      usedO.add(best);
      const o = openings[best];
      const reason = misaligned(z, o, ALIGN_TOL);
      if (reason) {
        defects.push(
          `MISALIGN(${reason}) frame@(x=${z.x.toFixed(3)},w=${z.w.toFixed(3)}) ⊄ ` +
            `opening@(x=${o.x.toFixed(3)},w=${o.w.toFixed(3)})`,
        );
      }
    }
  }
  return { defects, bySlot };
}

/** Draw a rectangle outline (centre form) into an RGBA buffer. */
function outline(buf, W, H, cx, cy, w, h, [r, g, b]) {
  const x0 = Math.max(0, Math.round((cx - w / 2) * W));
  const x1 = Math.min(W - 1, Math.round((cx + w / 2) * W));
  const y0 = Math.max(0, Math.round((cy - h / 2) * H));
  const y1 = Math.min(H - 1, Math.round((cy + h / 2) * H));
  for (let x = x0; x <= x1; x++)
    for (const y of [y0, y1]) {
      const i = (y * W + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
    }
  for (let y = y0; y <= y1; y++)
    for (const x of [x0, x1]) {
      const i = (y * W + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
    }
}

/**
 * Debug overlay: dimmed facade with detected openings (green) and panel-0 slot
 * rects (magenta; red if the slot overflows). Read this to judge alignment.
 */
function writeOverlay(det, id, slotRects, bySlot, iter, tag) {
  const { W, H, data } = det;
  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] *= 0.42;
    buf[i + 1] *= 0.42;
    buf[i + 2] *= 0.42;
  }
  for (const o of det.openings) outline(buf, W, H, o.x, o.y, o.w, o.h, [0, 255, 40]);
  const overflow = new Set(bySlot.filter((b) => b.panel === 0 && !b.contained).map((b) => b.slot));
  for (const s of slotRects.filter((s) => s.panel === 0)) {
    outline(buf, W, H, s.x, s.y, s.w, s.h, overflow.has(s) ? [255, 40, 40] : [255, 0, 220]);
  }
  const file = `${dbgPrefix(id)}-${tag}-i${String(iter).padStart(2, "0")}.jpg`;
  fs.writeFileSync(file, jpeg.encode({ width: W, height: H, data: buf }, 90).data);
  return file;
}

/** Warm-density sampler over the facade for the bare-wall defect check. */
function makeWarmDensity(det) {
  const { W, H, data, cfg } = det;
  const warm = cfg.warm;
  return (nx, ny) => {
    const cx = Math.round(nx * W);
    const cy = Math.round(ny * H);
    const rx = Math.round(0.03 * W);
    const ry = Math.round(0.05 * H);
    let hit = 0;
    let total = 0;
    for (let y = cy - ry; y <= cy + ry; y++) {
      if (y < 0 || y >= H) continue;
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (x < 0 || x >= W) continue;
        const i = (y * W + x) * 4;
        if (warm(data[i], data[i + 1], data[i + 2])) hit++;
        total++;
      }
    }
    return total > 0 ? hit / total : 0;
  };
}

// ---- Browser plumbing ---------------------------------------------------------

async function enterLevel(page, levelName) {
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(levelName, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
  await page.waitForFunction(
    () =>
      typeof window.__MUF_SLOT_RECTS__ === "function" &&
      typeof window.__MUF_APPLY_ZONES__ === "function",
    { timeout: RENDER_TIMEOUT },
  );
  await sleep(500);
}

async function applyAndRead(page, panelZones) {
  await page.evaluate((zones) => {
    window.__MUF_ZONES__ = zones;
    window.__MUF_APPLY_ZONES__();
    return null;
  }, panelZones);
}
const readSlots = (page) => page.evaluate(() => window.__MUF_SLOT_RECTS__());

function readAllZones() {
  return JSON.parse(fs.readFileSync(ZONES_JSON, "utf8"));
}
function writeLevelZones(id, panelZones) {
  const all = readAllZones();
  all[id] = panelZones; // overwrite this level only; others untouched
  fs.writeFileSync(ZONES_JSON, JSON.stringify(all, null, 2) + "\n");
}

/** Run --check for one level. Returns the defect count. */
async function checkLevel(page, level, band) {
  const det = detectOpenings(level.id, band);
  const warmDensity = makeWarmDensity(det);
  const committed = readAllZones()[level.id];
  if (!Array.isArray(committed)) throw new Error(`windowZones.generated.json has no ${level.id}[]`);
  await enterLevel(page, level.name);
  await applyAndRead(page, committed);
  await sleep(300);
  const slots = await readSlots(page);
  const { defects, bySlot } = measure(slots, det.openings, warmDensity, committed[0]);
  const overlay = writeOverlay(det, level.id, slots, bySlot, 0, "check");
  if (defects.length > 0) {
    console.error(`[align:${level.id}] CHECK FAILED — ${defects.length} defect(s):`);
    for (const d of defects.slice(0, 24)) console.error(`  ✗ ${d}`);
  } else {
    console.log(`[align:${level.id}] CHECK PASSED — 0 defects across ${PANELS} panels`);
  }
  console.log(`[align:${level.id}] overlay: ${path.relative(ROOT, overlay)}`);
  return defects.length;
}

/** Run --fix for one level. Returns the residual defect count (0 = converged). */
async function fixLevel(page, level, band) {
  const det = detectOpenings(level.id, band);
  const warmDensity = makeWarmDensity(det);
  const perRow = {};
  det.openings.forEach((o) => (perRow[o.row] = (perRow[o.row] ?? 0) + 1));
  console.log(
    `[align:${level.id}] detected ${det.openings.length} windows over ${det.rowCenters.length} ` +
      `floors (per row ${Object.values(perRow).join("/")}), ` +
      `row centres ${det.rowCenters.map((c) => c.toFixed(3)).join(", ")}`,
  );

  await enterLevel(page, level.name);

  // Calibrate the h→(size,y,size-x) map from a first probe render.
  const probeH = det.cfg.probeH;
  const probe = det.openings.map((o) => ({
    x: +o.x.toFixed(4),
    y: +(o.y - 0.224 * probeH).toFixed(4),
    w: +o.w.toFixed(4),
    h: probeH,
  }));
  await applyAndRead(
    page,
    Array.from({ length: PANELS }, () => probe),
  );
  await sleep(400);
  const probeSlots = (await readSlots(page)).filter((s) => s.panel === 0);
  let a = 0;
  let b = 0;
  let c = 0;
  probeSlots.forEach((s, i) => {
    a += s.h / probe[i].h;
    b += (s.y - probe[i].y) / probe[i].h;
    c += s.w / probe[i].h;
  });
  const n = probeSlots.length || 1;
  const cal = { a: a / n, b: b / n, c: c / n };
  console.log(
    `[align:${level.id}] calibrated a=${cal.a.toFixed(4)} b=${cal.b.toFixed(4)} c=${cal.c.toFixed(4)}`,
  );

  let panelZones = zonesFromOpenings(det.openings, cal);
  let converged = false;
  let lastSlots = [];
  let overlay = "";
  for (let iter = 1; iter <= MAX_ITERS; iter++) {
    await applyAndRead(
      page,
      Array.from({ length: PANELS }, () => panelZones),
    );
    await sleep(300);
    lastSlots = await readSlots(page);
    const { defects, bySlot } = measure(lastSlots, det.openings, warmDensity, panelZones);
    overlay = writeOverlay(det, level.id, lastSlots, bySlot, iter, "fix");
    console.log(
      `[align:${level.id}] iter ${iter}: ${defects.length} defect(s) → ${path.relative(ROOT, overlay)}`,
    );
    if (defects.length === 0) {
      converged = true;
      break;
    }
    const overflowByIdx = new Set();
    bySlot
      .filter((bs) => bs.panel === 0 && !bs.contained)
      .forEach((bs) => {
        const idx = det.openings.indexOf(bs.opening);
        if (idx >= 0) overflowByIdx.add(idx);
      });
    // Correction (panelZones[i] is 1:1 with openings[i]): snap a horizontally
    // misaligned railing frame to the measured opening edges (deterministic), then
    // shrink any overflowing sprite by height and re-centre.
    panelZones = panelZones.map((z, i) => {
      const o = det.openings[i];
      let nz = z;
      if (misaligned(nz, o, ALIGN_TOL)) {
        nz = { ...nz, x: +o.x.toFixed(4), w: +o.w.toFixed(4) };
      }
      if (overflowByIdx.has(i)) {
        const zh = +(nz.h * 0.94).toFixed(4);
        nz = { x: nz.x, y: +(o.y - cal.b * zh).toFixed(4), w: nz.w, h: zh };
      }
      return nz;
    });
  }

  if (converged) {
    writeLevelZones(
      level.id,
      Array.from({ length: PANELS }, () => panelZones),
    );
    console.log(
      `[align:${level.id}] FIX converged — wrote ${panelZones.length} zones × ${PANELS} panels ` +
        `to ${path.relative(ROOT, ZONES_JSON)}`,
    );
    return 0;
  }
  const { defects } = measure(lastSlots, det.openings, warmDensity, panelZones);
  console.error(
    `[align:${level.id}] FIX did NOT converge (${defects.length} defect(s)) — NOT writing.`,
  );
  for (const d of defects.slice(0, 24)) console.error(`  ✗ ${d}`);
  console.error(`[align:${level.id}] last overlay: ${path.relative(ROOT, overlay)}`);
  return defects.length;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--check") ? "check" : "fix";
  const requested = args.filter((a) => !a.startsWith("--"));

  const { manifest, levels } = loadLevelManifest(ROOT);
  const bandOf = (id) => {
    const l = manifest.levels.find((x) => x.id === id);
    const g = l.windowGrid ?? manifest.windowGrid;
    return [g.top, g.bottom];
  };
  const targetIds = requested.length > 0 ? requested : levels.map((l) => l.id);
  for (const id of targetIds) {
    if (!LEVEL_CFG[id]) throw new Error(`no detection config for level "${id}"`);
    if (!levels.find((l) => l.id === id)) throw new Error(`levelArt.json has no level "${id}"`);
  }

  const { levelIds } = loadLevelManifest(ROOT);
  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await seedDeterminism(page, levelIds);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  let totalDefects = 0;
  try {
    for (const id of targetIds) {
      const level = levels.find((l) => l.id === id);
      const band = bandOf(id);
      const d =
        mode === "check" ? await checkLevel(page, level, band) : await fixLevel(page, level, band);
      totalDefects += d;
    }
  } catch (e) {
    console.error(`[align] Fatal: ${e.message}`);
    totalDefects += 1;
  } finally {
    if (pageErrors.length > 0) console.warn(`[align] page error(s): ${pageErrors.join("; ")}`);
    await browser.close();
  }
  console.log(`[align] ${mode} done — ${targetIds.join(", ")} — ${totalDefects} total defect(s)`);
  process.exit(totalDefects > 0 ? 1 : 0);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((e) => {
    console.error("[align] Fatal:", e.message);
    process.exit(1);
  });
}

export { detectOpenings, LEVEL_CFG, writeOverlay, measure };
