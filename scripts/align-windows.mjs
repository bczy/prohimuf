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
 *   The EnemySprite plane IGNORES the zone width — planeH = zone.h ·
 *   ENEMY_PLANE_SCALE (1.3, EnemySprite.tsx), planeW = planeH · WIDEST_ASPECT,
 *   and the box is lifted UP by planeH · ENEMY_BODY_LIFT (0.02 — feet seated at
 *   the sill, body rising through and above the opening). So zone.h controls the
 *   sprite SIZE, zone.y its vertical placement, and zone.w only frames the
 *   foreground railing (⇒ set to the opening width). The harness reads the live
 *   per-panel slot rects via __MUF_SLOT_RECTS__ and calibrates the h→size /
 *   y→placement mapping from the first render.
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
import { PNG } from "pngjs";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";
import { misaligned, ALIGN_TOL } from "./lib/alignment.mjs";
import { coverStrips, coverDefects } from "./lib/coverage.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";
const ZONES_JSON = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
// A bare level id ("belliard") resolves the classic single-facade "facade.png".
// A NAMESPACED id "belliard/troncon-a" (align-troncon.mjs, ADR-0028 addendum
// "troncon-sequence") resolves that level's OWN tronçon PNG instead — level ids
// never contain "/", so the two never collide.
const facadeFile = (id) => {
  const slash = id.indexOf("/");
  if (slash < 0) return path.resolve(ROOT, "public/assets/levels", id, "facade.png");
  const level = id.slice(0, slash);
  const file = id.slice(slash + 1);
  return path.resolve(ROOT, "public/assets/levels", level, `${file}.png`);
};
// Debug-overlay filenames are flat under scripts/, so a namespaced id's "/"
// must not become a path separator.
const dbgPrefix = (id) => path.resolve(ROOT, "scripts", `.dbg-${id.replace(/\//g, "-")}-align`);

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const MAX_ITERS = 12;
const PANELS = 4;

// Containment tolerance (per side), matching the render contract's τ.
const TAU = 0.01;
// Sprite plane target: fill this fraction of the opening HEIGHT. Since the
// ENEMY_PLANE_SCALE bump (0.8→1.3, EnemySprite.tsx) the SQUARE plane (aspect-1
// gptimage cells, figure centred with transparent margins) deliberately
// overshoots the opening's top AND sides — a standing figure is taller than its
// window — so the target is the old 0.88 fill scaled by 1.3/0.8, the plane-box
// gate degrades to FEET SEATING (bottom edge at the sill; horizontal alignment
// is gated by MISALIGN/coverage on the railing frames instead), and the
// old fit caps no longer apply.
const FILL = 1.43;
// Extra safety margin (beyond τ) kept between the sprite box and the opening edge.
// (No longer read by the fit — kept as documentation of the historical tuning.)
const _MARGIN = 0.006;

// Coverage-audit tuning (ADR-0028 iteration 2). The UNDERCOVER/OVERCOVER audit and
// the measure()-side gate share these so the corrected openings always satisfy the
// gate by construction.
// Hysteresis LOW shoulder as a fraction of the high column threshold (per-level
// override: cfg.hystLow).
const HYST_LOW = 0.45;
// A density valley splits a run only when it drops below this fraction of the LOWER
// flanking peak (per-level override: cfg.valleyFrac).
const VALLEY_FRAC = 0.4;
// Normalized gap kept between a coverage strip and a neighbouring opening's edge.
const COVER_NB_GAP = 0.008;
// Per-column warm-density threshold that bounds a lit window in the coverage-audit
// re-derivation (between OVERCOVER_DENS and UNDERCOVER_DENS; per-level override:
// cfg.coverBnd).
const COVER_BND = 0.18;
// Cap on the post-detection coverage-audit re-derivation loop.
const MAX_AUDIT_ITERS = 8;

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
  // Clamp indices into the array: a pitch-split segment's x1 can reach W (a+w for the
  // last segment), and reading arr[W] returns undefined → NaN accumulation → a silent
  // midpoint fallback. Clamp to [0, len-1] so the real warm centroid is always computed.
  const lo = Math.max(0, Math.round(a));
  const hi = Math.min(arr.length - 1, Math.round(b));
  let num = 0;
  let den = 0;
  for (let i = lo; i <= hi; i++) {
    num += i * arr[i];
    den += arr[i];
  }
  return den > 0 ? num / den : (a + b) / 2;
};

/**
 * Split a run `[a,b]` at every DENSITY VALLEY that separates two distinct window
 * peaks, appending the final sub-runs to `out`. Fires regardless of the pitch
 * heuristic — it catches two adjacent windows (plus the wall between them) merged
 * into one run: `n = round(w/(splitPitch·W))` can round such a pair to 1 so
 * pitch-split leaves it whole and the frame straddles both windows + the wall.
 *
 * A valley qualifies only when: (a) its density `< VALLEY_FRAC · min(leftPeak,
 * rightPeak)` (deep relative to the LOWER flanking peak, so a dim window still
 * splits from a bright one), AND (b) each resulting sub-run is `>= minRunW·W` wide,
 * AND (c) the two sub-run midpoints are `>= minPitch·W` apart. (b)+(c) are the
 * mullion guard: the two panes of ONE french window are separated by a thin, often
 * deep valley too, but their sub-runs are narrow and their centres sit closer than
 * one window pitch — so we do NOT split them (that stays the job of twinMerge). We
 * recurse so a run holding three+ windows splits at every qualifying valley.
 */
function valleySplit([a, b], sm, cfg, W, out) {
  const minRunWpx = cfg.minRunW * W;
  const minPitchPx = cfg.minPitch * W;
  const valleyFrac = cfg.valleyFrac ?? VALLEY_FRAC;
  // Only look for a valley where BOTH sub-runs could still clear minRunW.
  const loX = Math.ceil(a + minRunWpx);
  const hiX = Math.floor(b - minRunWpx);
  let vx = -1;
  let vv = Infinity;
  for (let x = loX; x <= hiX; x++) {
    if (sm[x] < vv) {
      vv = sm[x];
      vx = x;
    }
  }
  if (vx < 0) {
    out.push([a, b]);
    return;
  }
  let peakL = 0;
  for (let x = a; x <= vx; x++) peakL = Math.max(peakL, sm[x]);
  let peakR = 0;
  for (let x = vx; x <= b; x++) peakR = Math.max(peakR, sm[x]);
  const midL = (a + vx) / 2;
  const midR = (vx + 1 + b) / 2;
  const qualifies =
    vv < valleyFrac * Math.min(peakL, peakR) &&
    vx - a + 1 >= minRunWpx &&
    b - vx >= minRunWpx &&
    midR - midL >= minPitchPx;
  if (!qualifies) {
    out.push([a, b]);
    return;
  }
  valleySplit([a, vx], sm, cfg, W, out);
  valleySplit([vx + 1, b], sm, cfg, W, out);
}

/**
 * Per-row window columns (facade px). A warm column-density profile of the row's
 * scan band → smoothed → high-threshold runs → HYSTERESIS-expanded down a LOW
 * shoulder → twin panes merged → VALLEY-split → wide runs pitch-split → min-pitch
 * enforced. Returns `{ wins, sm, thr, low }` where each win is `{ cx, x0, x1 }` —
 * the warm centroid AND the measured run bounds — plus the row's smoothed profile
 * and thresholds so the coverage audit can re-derive a bound locally. Shared by both
 * row-detection strategies.
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
  const low = (cfg.hystLow ?? HYST_LOW) * thr;
  const runs = runsAbove(sm, 0, W - 1, thr);

  // HYSTERESIS EXPANSION — grow each high-threshold run outward while the profile
  // stays on the LOW shoulder (`sm >= low`), so a dim second pane whose peak fell
  // below `thr` rejoins its bright twin. Each side is bounded by the ORIGINAL edge
  // of the neighbouring run and by a hard cap of `splitPitch·W` total width so one
  // window can never annex a whole neighbour. Runs are disjoint & x-ascending.
  const cap = Math.round(cfg.splitPitch * W);
  const exp = runs.map(([a, b]) => [a, b]);
  for (let k = 0; k < exp.length; k++) {
    let [a, b] = exp[k];
    const leftBound = k > 0 ? runs[k - 1][1] + 1 : 0;
    const rightBound = k < runs.length - 1 ? runs[k + 1][0] - 1 : W - 1;
    while (a - 1 >= leftBound && sm[a - 1] >= low && b - (a - 1) + 1 <= cap) a--;
    while (b + 1 <= rightBound && sm[b + 1] >= low && b + 1 - a + 1 <= cap) b++;
    exp[k] = [a, b];
  }
  // If two expanded runs met in the gap between their cores, cut at the density
  // MINIMUM of that gap (the true valley separating the two windows).
  for (let k = 0; k + 1 < exp.length; k++) {
    if (exp[k][1] >= exp[k + 1][0]) {
      const gLo = runs[k][1] + 1;
      const gHi = runs[k + 1][0] - 1;
      let minX = gLo;
      let minV = Infinity;
      for (let x = gLo; x <= gHi; x++) {
        if (sm[x] < minV) {
          minV = sm[x];
          minX = x;
        }
      }
      exp[k][1] = minX;
      exp[k + 1][0] = minX + 1;
    }
  }

  // merge twin panes of one french window (a dim pane not reached by expansion)
  const merged = [];
  for (const r of exp) {
    const last = merged[merged.length - 1];
    if (last && r[0] - last[1] <= cfg.twinMerge * W) last[1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  // VALLEY-split any run holding two+ distinct window peaks (over-merged pair),
  // THEN pitch-split any still-abnormally-wide run as a fallback. Each segment keeps
  // its own [x0,x1] bounds and a centroid computed WITHIN that segment.
  const split = [];
  for (const run of merged) valleySplit(run, sm, cfg, W, split);
  const wins = [];
  for (const [a, b] of split) {
    const w = b - a + 1;
    if (w < cfg.minRunW * W) continue;
    const n = Math.max(1, Math.round(w / (cfg.splitPitch * W)));
    for (let s = 0; s < n; s++) {
      const x0 = a + (w * s) / n;
      // last segment's x1 is a+w = b+1, which can reach W; clamp the stored bound to W-1
      const x1 = Math.min(W - 1, a + (w * (s + 1)) / n);
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
  return { wins: out, sm, thr, low };
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

/** Rectangular-region warm-density sampler (normalized `[x0,x1]×[y0,y1]` → warm
 * fraction). The coverage audit and the UNDERCOVER/OVERCOVER gate use this, unlike
 * the fixed 0.03×0.05 point sampler (`makeWarmDensity`) that the WALL check keeps.
 * An empty span (x1<=x0 or y1<=y0, e.g. a neighbour-clamped strip) returns 0.
 * `pixelAt(x,y)` is the same per-pixel "window evidence" predicate `detectOpenings`
 * builds (pointwise `warm(r,g,b)` by default, or a level's `cfg.buildMask`). */
function makeWarmRect(W, H, pixelAt) {
  return (nx0, nx1, ny0, ny1) => {
    // A reversed span (nx1 <= nx0) means a neighbour bound clamped the strip past the
    // frame edge — no room for the window to continue there, so it reads EMPTY (0).
    // Do NOT min/max-swap: that would sample the absolute range and pull in the
    // neighbouring window as a false UNDERCOVER.
    if (nx1 <= nx0 || ny1 <= ny0) return 0;
    const x0 = Math.max(0, Math.round(nx0 * W));
    const x1 = Math.min(W - 1, Math.round(nx1 * W));
    const y0 = Math.max(0, Math.round(ny0 * H));
    const y1 = Math.min(H - 1, Math.round(ny1 * H));
    if (x1 < x0 || y1 < y0) return 0;
    let hit = 0;
    let total = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (pixelAt(x, y)) hit++;
        total++;
      }
    }
    return total > 0 ? hit / total : 0;
  };
}

/** Convert measured pixel run bounds to a normalized frame {x,w}, applying the
 * fallback-seed clamp (`w ∈ [0.55,1.6]·openingW`). `x` is the geometric MIDPOINT of
 * the bounds (NOT the glow-biased centroid `cx`, which would overhang bare wall). Only
 * a truly EMPTY run (`x1<=x0`, zero warm mass) falls back to `openingW` centred on
 * `cx`; a positive-but-narrow run (below `minRunW`, e.g. a tiny lit window the coverage
 * audit re-derived) is floor-clamped and centred on its MIDPOINT — not blown up to the
 * wide seed, which would overhang wall. */
function boundsToFrame(x0px, x1px, cx, cfg, W) {
  const runWpx = x1px - x0px;
  const degenerate = !(runWpx > 0);
  const measured = runWpx / W;
  const floor = 0.55 * cfg.openingW;
  const ceil = 1.6 * cfg.openingW;
  const w = degenerate ? cfg.openingW : Math.min(Math.max(measured, floor), ceil);
  const x = degenerate ? cx / W : (x0px + x1px) / 2 / W;
  return {
    x,
    w,
    degenerate,
    measured,
    saturated: !degenerate && (measured < floor || measured > ceil),
  };
}

/**
 * Re-derive a window's warm bounds `[x0px,x1px]` directly off the art in the
 * opening's vertical band (`y0..y1`), searched only within `[lbPx,rbPx]` (the
 * neighbour-bounded window). A per-column warm-density profile at the GATE's own
 * vertical resolution → smoothed → runs above `coverBnd`. The frame is TRIMMED-to-warm:
 * the returned span is the union of every lit run the current frame `[flPx,frPx]`
 * overlaps (or lies within `twinMerge·W` of), so wall is trimmed off the EDGES
 * (fixes OVERCOVER) and an adjacent dim pane just outside is pulled in (fixes
 * UNDERCOVER) without changing which windows the frame covers. When the frame sits
 * entirely on wall between runs, it snaps to the nearest run. Returns `null` for a
 * lit-run-free band. Because this and the measure()-side gate both read warm density
 * in the SAME opening y-band, a bound re-derived here satisfies the gate by
 * construction (unlike the row column profile, whose narrower scan band can disagree).
 */
function deriveWindowBounds(flPx, frPx, lbPx, rbPx, y0, y1, warmRect, cfg, W) {
  const bnd = cfg.coverBnd ?? COVER_BND;
  const lb = Math.max(0, Math.floor(lbPx));
  const rb = Math.min(W - 1, Math.ceil(rbPx));
  if (rb - lb < 1) return null;
  const wc = new Float64Array(W);
  for (let x = lb; x <= rb; x++) wc[x] = warmRect(x / W, (x + 1) / W, y0, y1);
  const sm = smooth1d(wc, lb, rb, 2);
  const runs = runsAbove(sm, lb, rb, bnd);
  if (runs.length === 0) return null;
  const mergeGap = Math.round(cfg.twinMerge * W);
  const sel = runs.filter(([a, b]) => b >= flPx - mergeGap && a <= frPx + mergeGap);
  if (sel.length === 0) {
    let best = runs[0];
    let bd = Infinity;
    const c = (flPx + frPx) / 2;
    for (const run of runs) {
      const d = Math.abs((run[0] + run[1]) / 2 - c);
      if (d < bd) {
        bd = d;
        best = run;
      }
    }
    return best;
  }
  return [sel[0][0], sel[sel.length - 1][1]];
}

/**
 * Post-detection COVERAGE AUDIT (ADR-0028 iteration 2) — the detection-side
 * correction path for UNDERCOVER / OVERCOVER, run BEFORE zones are built. The
 * DESIGN CHOICE (over an in-loop fixLevel() zone correction): because
 * `zonesFromOpenings()` builds each frame's x/w straight from the opening, an
 * UNDERCOVER/OVERCOVER means the OPENING is mis-measured — a zone-side nudge has
 * nothing to push against, so the fix belongs on the opening, before zones exist.
 *
 * For each opening it samples the SAME exterior/interior strips the measure()-side
 * gate uses (off the art); when any fire, it RE-DERIVES the window bounds directly
 * from the art in the opening's own y-band (`deriveWindowBounds`) — the widen
 * (UNDERCOVER: the run extends past the frame) and the shrink/re-centre (OVERCOVER:
 * the run is narrower/offset, and boundsToFrame re-centres the floor-clamped frame on
 * the run midpoint) fall out of that single re-measurement. The change is accepted
 * ONLY when it strictly reduces that opening's defect count, so the audit can never
 * make an opening worse and always terminates. Re-run until stable; MAX_AUDIT_ITERS
 * guards runaway. Mutates `raw[i].{x0px,x1px}` in place.
 */
function auditCoverage(raw, cfg, warmRect, W, H, rowCenters) {
  const openingH = cfg.openingH;
  const floorW = 0.55 * cfg.openingW;
  const byRow = {};
  raw.forEach((r, i) => (byRow[r.row] ??= []).push(i));
  for (const row of Object.keys(byRow)) byRow[row].sort((i, j) => raw[i].x0px - raw[j].x0px);

  // Freeze each opening's neighbour STRIP bounds from the INITIAL detection. Using
  // live neighbour positions would let one re-derivation shift a neighbour's bound,
  // flag a previously-clean window, and cascade/oscillate; windows barely move, so
  // the initial bounds are stable and the audit only ever touches truly-flagged
  // openings. Bounds are keyed by raw index.
  const bound = {};
  for (const row of Object.keys(byRow)) {
    const idxs = byRow[row];
    for (let p = 0; p < idxs.length; p++) {
      const leftNb = p > 0 ? raw[idxs[p - 1]] : null;
      const rightNb = p < idxs.length - 1 ? raw[idxs[p + 1]] : null;
      const lnf = leftNb && boundsToFrame(leftNb.x0px, leftNb.x1px, leftNb.cx, cfg, W);
      const rnf = rightNb && boundsToFrame(rightNb.x0px, rightNb.x1px, rightNb.cx, cfg, W);
      bound[idxs[p]] = {
        left: lnf ? lnf.x + lnf.w / 2 + COVER_NB_GAP : 0,
        right: rnf ? rnf.x - rnf.w / 2 - COVER_NB_GAP : 1,
      };
    }
  }

  // Cover-defect count for one opening's frame (OVERCOVER suppressed at floor width).
  const scoreOf = (x0px, x1px, cx, leftBound, rightBound, y0, y1) => {
    const frame = boundsToFrame(x0px, x1px, cx, cfg, W);
    const st = coverStrips(frame, leftBound, rightBound);
    return coverDefects(
      {
        extLeft: warmRect(st.extLeft[0], st.extLeft[1], y0, y1),
        extRight: warmRect(st.extRight[0], st.extRight[1], y0, y1),
        intLeft: warmRect(st.intLeft[0], st.intLeft[1], y0, y1),
        intRight: warmRect(st.intRight[0], st.intRight[1], y0, y1),
      },
      { underDens: cfg.underDens, overDens: cfg.overDens, suppressOver: frame.w <= floorW * 1.05 },
    ).length;
  };

  for (let it = 0; it < MAX_AUDIT_ITERS; it++) {
    let changed = false;
    for (const row of Object.keys(byRow)) {
      const idxs = byRow[row];
      const cy = rowCenters[Number(row)];
      const y0 = cy / H - openingH / 2;
      const y1 = cy / H + openingH / 2;
      for (const idx of idxs) {
        const r = raw[idx];
        const { left: leftBound, right: rightBound } = bound[idx];
        const before = scoreOf(r.x0px, r.x1px, r.cx, leftBound, rightBound, y0, y1);
        if (before === 0) continue;
        const nb = deriveWindowBounds(
          r.x0px,
          r.x1px,
          leftBound * W,
          rightBound * W,
          y0,
          y1,
          warmRect,
          cfg,
          W,
        );
        if (!nb) continue;
        const cx = (nb[0] + nb[1]) / 2;
        const after = scoreOf(nb[0], nb[1], cx, leftBound, rightBound, y0, y1);
        if (after < before) {
          r.x0px = nb[0];
          r.x1px = nb[1];
          r.cx = cx;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
}

/**
 * Detect the real lit windows from a level's facade. Returns openings in per-panel
 * facade-normalized coords (x,y = CENTRE, w,h = SIZE, y-down), the image data, a
 * rectangular warm-density sampler, and the detected row centres (normalized).
 */
function detectOpenings(levelId, band) {
  const cfg = { ...LEVEL_CFG[levelId] };
  if (cfg.band === null) cfg.band = band;
  // Tronçon tiles (namespaced id) are REAL PNGs (RGBA + alpha); every other
  // level's facade.png is JPEG-encoded despite its extension. Both decoders
  // return the same {width,height,data:RGBA} shape (see gen-window-zones.mjs),
  // so nothing downstream needs to know which one ran.
  const decoded = levelId.includes("/")
    ? PNG.sync.read(fs.readFileSync(facadeFile(levelId)))
    : jpeg.decode(fs.readFileSync(facadeFile(levelId)), { useTArray: true });
  const { width: W, height: H, data } = decoded;
  // Per-pixel "window evidence" predicate. Every level so far (belliard/
  // stalingrad/vitry) uses `cfg.warm(r,g,b)` — a single-pixel warm-glow test
  // that works because their facades are lit-window JPEGs. The tronçon PNGs
  // (align-troncon.mjs) are a flat ink/wash illustration style where NEITHER
  // warmth NOR raw brightness separates window from wall (measured on the
  // shipped art: mean luminance win≈wall, r−b sign even flips between tiles);
  // what DOES separate them is local detail density (frame/mullion/ironwork
  // ink vs flat plaster) — a NEIGHBOURHOOD property a single (r,g,b) triple
  // cannot express. `cfg.buildMask(W,H,data)`, when set, replaces the pointwise
  // `warm()` wrapper with a precomputed `(x,y) → 0|1` predicate of the caller's
  // choosing (align-troncon.mjs's edge-density mask); every existing cfg omits
  // it, so `pixelAt` degrades to the byte-identical pointwise path.
  const pixelAt = cfg.buildMask
    ? cfg.buildMask(W, H, data)
    : (x, y) => {
        const i = (y * W + x) * 4;
        return cfg.warm(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
      };
  const warmAt = (x, y) => pixelAt(x, y);
  const det = { W, H, data, warmAt };
  const warmRect = makeWarmRect(W, H, pixelAt);

  const rowCenters = cfg.rowMode === "thirds" ? rowsThirds(det, cfg) : rowsRuns(det, cfg);

  // Detect raw windows (pixel bounds) per row.
  const raw = [];
  rowCenters.forEach((cy, row) => {
    const { wins } = detectColumns(det, cfg, cy);
    for (const { cx, x0, x1 } of wins) raw.push({ row, cx, x0px: x0, x1px: x1 });
  });

  // Coverage audit widens/shrinks/re-centres bounds to the ART before zones are built.
  auditCoverage(raw, cfg, warmRect, W, H, rowCenters);

  const openings = raw.map((r) => {
    const f = boundsToFrame(r.x0px, r.x1px, r.cx, cfg, W);
    if (f.saturated) {
      // saturated "measurement" — surface it so a clamped width is never silent
      console.warn(
        `[align:${levelId}] clamped run @x=${f.x.toFixed(3)} measured=${f.measured.toFixed(3)} → w=${f.w.toFixed(3)}`,
      );
    }
    return {
      x: +f.x.toFixed(4),
      y: +(rowCenters[r.row] / H).toFixed(4),
      w: +f.w.toFixed(4),
      h: cfg.openingH,
      row: r.row,
    };
  });
  openings.sort((p, q) => p.row - q.row || p.x - q.x);
  return { openings, cfg, W, H, data, warmAt, warmRect, rowCenters: rowCenters.map((c) => c / H) };
}

/**
 * Build zones for one panel from the openings, using the calibrated linear map
 * from the live render (a: h→size, b: h→y-shift, c: h→size-x). Sizes each sprite
 * to FILL of the opening height and centres it, with zone.w = opening width.
 */
function zonesFromOpenings(openings, cal) {
  const { a, b } = cal;
  return openings.map((o) => {
    // No fit caps: the square plane overshoots the opening's top and sides by
    // design (see FILL above); only the feet line is gated in measure().
    const zh = (FILL * o.h) / a;
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
 * frame `zone.x`/`zone.w` off its measured opening beyond `ALIGN_TOL`), and
 * UNDERCOVER/OVERCOVER (the frame edge measured against the ART, not the detected
 * opening — see `lib/coverage.mjs`). `warmDensity(x,y)` is the point sampler for the
 * bare-wall check; `warmRect(x0,x1,y0,y1)` is the rectangular sampler for the
 * coverage strips (OVERCOVER is suppressed for a frame at the floor width `cover.floorW`).
 * `cover` = `{ warmRect, floorW }` (omit to skip the coverage pass). `zonesByPanel` is
 * the APPLIED per-panel zone arrays (the committed 4 panels in `--check`, the 4 identical
 * `panelZones` in `--fix`); omit it to skip the MISALIGN + coverage pass. `panels`
 * (default every index `0..PANELS-1`) restricts which panel indices are evaluated —
 * the troncon-sequence harness (align-troncon.mjs) has HETEROGENEOUS tiles (one
 * detected-opening set per tronçon key, not one shared per level), so it measures
 * one key's own tile instance(s) at a time (e.g. `[0]` for troncon-a, `[1,3]` for the
 * two on-screen troncon-c instances) against that key's openings, leaving
 * `zonesByPanel` sparse (`undefined` at every index outside `panels`).
 */
function measure(slotRects, openings, warmDensity, cover, zonesByPanel, panels = null) {
  const warmRect = cover?.warmRect;
  const floorW = cover?.floorW ?? 0;
  const panelIndices = panels ?? Array.from({ length: PANELS }, (_, p) => p);
  const defects = [];
  const bySlot = [];
  for (const p of panelIndices) {
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
      // Feet seating only: the square plane deliberately overshoots the
      // opening's top and sides since the ENEMY_PLANE_SCALE bump; the bottom
      // edge (the feet) must still land at/inside the sill. Horizontal
      // alignment is gated by MISALIGN/coverage on the railing frames.
      const contained = s.y + s.h / 2 <= o.y + o.h / 2 + TAU;
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
  // MISALIGN — the applied railing frame (zone.x/zone.w) vs its measured opening, per
  // panel. Zones and openings share one construction order (row-major, x ascending), so
  // they pair 1:1 BY INDEX (zones[i] ↔ openings[i]) — no greedy nearest-centre match,
  // which could mis-pair when frames drift. A count mismatch is its own defect.
  if (zonesByPanel) {
    for (const p of panelIndices) {
      const zones = zonesByPanel[p];
      if (!zones) continue;
      if (zones.length !== openings.length) {
        defects.push(
          `panel ${p}: MISALIGN(count) ${zones.length} zones ≠ ${openings.length} openings`,
        );
        continue;
      }
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        const o = openings[i];
        const reason = misaligned(z, o, ALIGN_TOL);
        if (reason) {
          defects.push(
            `panel ${p}: MISALIGN(${reason}) frame@(x=${z.x.toFixed(3)},w=${z.w.toFixed(3)}) ⊄ ` +
              `opening@(x=${o.x.toFixed(3)},w=${o.w.toFixed(3)})`,
          );
        }
      }
      // UNDERCOVER / OVERCOVER — the applied frame measured against the ART (not the
      // detected opening, which MISALIGN already covers). Exterior strips test whether
      // the lit window continues past a frame edge (frame too narrow); interior strips
      // test whether a frame edge sits on unlit wall (frame too wide / straddling the
      // gap). Strips are bounded by the neighbouring FRAME in the same row so they never
      // reach into an adjacent window. Frames pair 1:1 with openings by index; group by
      // openings[i].row so neighbour lookup is intra-row.
      if (warmRect) {
        const byRow = {};
        for (let i = 0; i < zones.length; i++) (byRow[openings[i].row] ??= []).push(i);
        for (const row of Object.keys(byRow)) {
          const ids = byRow[row].sort((i, j) => zones[i].x - zones[j].x);
          for (let q = 0; q < ids.length; q++) {
            const z = zones[ids[q]];
            const o = openings[ids[q]];
            const ln = q > 0 ? zones[ids[q - 1]] : null;
            const rn = q < ids.length - 1 ? zones[ids[q + 1]] : null;
            const leftBound = ln ? ln.x + ln.w / 2 + COVER_NB_GAP : 0;
            const rightBound = rn ? rn.x - rn.w / 2 - COVER_NB_GAP : 1;
            const st = coverStrips(z, leftBound, rightBound);
            const y0 = o.y - o.h / 2;
            const y1 = o.y + o.h / 2;
            const reasons = coverDefects(
              {
                extLeft: warmRect(st.extLeft[0], st.extLeft[1], y0, y1),
                extRight: warmRect(st.extRight[0], st.extRight[1], y0, y1),
                intLeft: warmRect(st.intLeft[0], st.intLeft[1], y0, y1),
                intRight: warmRect(st.intRight[0], st.intRight[1], y0, y1),
              },
              // No per-level threshold override wired ⇒ module defaults; the audit uses
              // the same defaults + the same floor suppression, so a corrected opening
              // satisfies this gate by construction. OVERCOVER is a by-design overhang at
              // the railing's minimum (floor) width, so it is suppressed there.
              { suppressOver: z.w <= floorW * 1.05 },
            );
            for (const reason of reasons) {
              defects.push(
                `panel ${p}: ${reason === "nan" ? "COVER(nan)" : reason} ` +
                  `frame@(x=${z.x.toFixed(3)},y=${z.y.toFixed(3)},w=${z.w.toFixed(3)}) ` +
                  `opening@(x=${o.x.toFixed(3)},w=${o.w.toFixed(3)})`,
              );
            }
          }
        }
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
 * Debug overlay: dimmed facade with detected openings (green) and one panel's
 * slot rects (magenta; red if the slot overflows) — `panel` (default 0, every
 * existing single-facade caller's reference panel, since those 4 panels share
 * identical zones) selects WHICH rendered panel's rects to draw; the tronçon
 * harness (align-troncon.mjs) passes its tile's own panel index (never 0 for
 * troncon-b/troncon-c) so the drawn boxes are the boxes ACTUALLY rendered on
 * THIS image, not another tile's. Read this to judge alignment.
 */
function writeOverlay(det, id, slotRects, bySlot, iter, tag, panel = 0) {
  const { W, H, data } = det;
  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] *= 0.42;
    buf[i + 1] *= 0.42;
    buf[i + 2] *= 0.42;
  }
  for (const o of det.openings) outline(buf, W, H, o.x, o.y, o.w, o.h, [0, 255, 40]);
  const overflow = new Set(
    bySlot.filter((b) => b.panel === panel && !b.contained).map((b) => b.slot),
  );
  for (const s of slotRects.filter((s) => s.panel === panel)) {
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
  // MISALIGN over EVERY committed panel (all 4), not just panel 0 — each is checked
  // against the shared detected openings, so a single drifted panel is still caught.
  const cover = { warmRect: det.warmRect, floorW: 0.55 * det.cfg.openingW };
  const { defects, bySlot } = measure(slots, det.openings, warmDensity, cover, committed);
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
  const cover = { warmRect: det.warmRect, floorW: 0.55 * det.cfg.openingW };
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
  // Initial-guess placement from the render contract (bodyY = y + 0.02·planeH,
  // planeH = 1.3·zone.h ⇒ rect centre 0.026·zone.h ABOVE the zone centre in
  // image space); self-calibration refines a/b/c from the live render.
  const probe = det.openings.map((o) => ({
    x: +o.x.toFixed(4),
    y: +(o.y + 0.026 * probeH).toFixed(4),
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
  let lastDefects = [];
  let overlay = "";
  for (let iter = 1; iter <= MAX_ITERS; iter++) {
    const applied = Array.from({ length: PANELS }, () => panelZones);
    await applyAndRead(page, applied);
    await sleep(300);
    lastSlots = await readSlots(page);
    const { defects, bySlot } = measure(lastSlots, det.openings, warmDensity, cover, applied);
    lastDefects = defects; // measured against THIS iteration's applied zones (see below)
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
    // Correction (panelZones[i] is 1:1 with openings[i]): shrink any overflowing sprite
    // by height and re-centre. No MISALIGN snap needed — zonesFromOpenings builds x/w
    // straight from the openings and the shrink only touches h/y, so --fix frames are
    // aligned by construction; MISALIGN is a --check-time gate against drifted committed data.
    panelZones = panelZones.map((z, i) => {
      const o = det.openings[i];
      if (overflowByIdx.has(i)) {
        const zh = +(z.h * 0.94).toFixed(4);
        return { x: z.x, y: +(o.y - cal.b * zh).toFixed(4), w: z.w, h: zh };
      }
      return z;
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
  // Report the LAST measured iteration's defects (stored above) — re-measuring the stale
  // lastSlots against the now-corrected panelZones would score two mismatched states.
  console.error(
    `[align:${level.id}] FIX did NOT converge (${lastDefects.length} defect(s)) — NOT writing.`,
  );
  for (const d of lastDefects.slice(0, 24)) console.error(`  ✗ ${d}`);
  console.error(`[align:${level.id}] last overlay: ${path.relative(ROOT, overlay)}`);
  return lastDefects.length;
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
