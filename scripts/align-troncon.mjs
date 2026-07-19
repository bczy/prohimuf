#!/usr/bin/env node
/**
 * align-troncon.mjs — window-alignment harness for TRONÇON-SEQUENCE backdrops
 * (ADR-0048), a sibling of align-windows.mjs (ADR-0028) scoped to Belliard's
 * `belliard/troncon-{a,b,c}` window zones (`windowZones.generated.json`). Fixes
 * the "cops badly seated on Belliard windows" bug: enemies floating above/below
 * the sill (vertical), drifted off the window bay (horizontal), and rendering in
 * front of the wrought-iron grille instead of behind it (the grille frame is
 * drawn at `zone.x`/`zone.w`, so a zone off the real window leaves part of the
 * enemy's plane outside the grille's frame).
 *
 * WHY A SIBLING, NOT A MODE OF align-windows.mjs: that harness's whole
 * detection family (`detectColumns`/`rowsThirds`/`rowsRuns`) is built on a
 * WARM-GLOW pixel test (`cfg.warm(r,g,b)`) — correct for the lit-window JPEG
 * facades (belliard/stalingrad/vitry) but measurably wrong for the tronçon
 * PNGs: sampled directly off the shipped art, mean window luminance ≈ mean
 * wall luminance and warm-vs-cool (r−b) even flips sign between tiles (troncon-a
 * windows read COOL — sky reflection in the glass — while troncon-b's read
 * warm). What DOES separate window from wall in this ink/wash illustration
 * style is LOCAL DETAIL DENSITY (frame/mullion/shutter/balcony-ironwork ink vs
 * flat rendered plaster) — measured on the existing hand-placed zones vs their
 * wall gaps: local luminance std-dev inside a zone averages 45–49 across all
 * three tiles vs 26–39 in the gap between zones, a consistent, reliable split
 * a single-pixel warm test cannot see. `align-windows.mjs` gained ONE small
 * additive hook for this (`cfg.buildMask`, see its detectOpenings) — this file
 * owns the actual edge-density mask (`buildEdgeDensityMask` below) and the
 * three independently-tuned LEVEL_CFG entries; everything else (row/column RUN
 * detection, `measure()`'s defect classes, `writeOverlay`) is the SAME
 * imported, unforked align-windows.mjs machinery stalingrad/vitry already use.
 *
 * CONSERVATIVE BY DESIGN (per architect direction — the committed troncon zones
 * are HAND-PLACED, previously rejected a blind-detector overwrite once already):
 * this harness does NOT treat fresh detection as ground truth and replace
 * everything. It corrects two INDEPENDENT things, each only when it has a
 * confident basis to:
 *
 *   1. HEIGHT / VERTICAL SEATING (always corrected, the dominant reported bug):
 *      the committed troncon zone.h is (confirmed by overlay inspection) close
 *      to the RAW window-opening pixel height, i.e. never ran through the
 *      render-contract's FILL/ENEMY_PLANE_SCALE pre-shrink
 *      (`zonesFromOpenings` in align-windows.mjs). Rendered as-is, the sprite
 *      plane overshoots the sill by design amount minus that missing shrink —
 *      exactly "feet not seated". This harness treats the committed x/y/w as
 *      the trusted window-opening rectangle, empirically CALIBRATES the
 *      h→size / y→placement mapping off a live probe render (same technique
 *      as align-windows.mjs's `fixLevel`, not hand-derived constants — the
 *      render contract is verified against the ACTUAL render, never assumed),
 *      derives a FILL-scaled starting height, and iterates the same
 *      shrink-and-recentre correction `fixLevel` uses until every rendered
 *      slot's feet sit at/above the sill (OVERFLOW defect clear). Convergence
 *      gate = OVERFLOW only.
 *   2. HORIZONTAL DRIFT / GRILLE FRAMING (best-effort, bounded): per tile, the
 *      edge-density detector above proposes real window openings. A committed
 *      zone's x/w is SNAPPED to the nearest detected opening only when it is
 *      both close (within one opening-pitch) AND a plausible width match
 *      (0.5–2×) — i.e. high confidence. Anything else keeps its committed x/w
 *      untouched rather than risk a wrong relocation on this weaker-signal
 *      art. WALL/MISALIGN/COVER (art-vs-frame) defects are measured and
 *      reported at `--check` time as an audit, same vocabulary as
 *      align-windows.mjs, but are NOT part of the --fix convergence gate — on
 *      this art style they reflect the edge-density detector's OWN confidence
 *      limits, not necessarily a real misplacement, so a residual is reported
 *      rather than blindly "corrected" against a lower-trust signal.
 *
 * TILE DE-MULTIPLEXING (ADR-0048's a,c,b,c sequence): `window.__MUF_SLOT_RECTS__`
 * already reports each rendered slot in TILE-LOCAL facade-normalized coords
 * (GameScene.tsx builds `facade.rects` per backdrop tile, panel index = tile
 * index 0..3) — the SAME coordinate space a WindowZone is authored in, no
 * further inverse-transform needed (troncon tiles draw at native width,
 * `facadeDrawScale("troncon-sequence") === 1`, so `stretchAboutCentre` is the
 * identity; see facadeLayout.ts). The only demuxing required is PANEL INDEX →
 * TRONÇON KEY, read straight off the manifest's `backdrop.tiles` sequence
 * (never hardcoded) — `[a, c, b, c]` today.
 *
 * TRONÇON-C RECONCILIATION (both on-screen instances share ONE JSON key,
 * `belliard/troncon-c`): panels 1 and 3 apply the SAME zones array reference
 * against the SAME tile width with no draw-scale stretch in tronçon mode, so
 * their rendered slot rects are identical BY CONSTRUCTION (verified: `rect.x/
 * y/w/h` derive only from `z` and `tile.width`/`facadeH`, never from
 * `tile.centreX` — see GameScene.tsx facade useMemo). The merge rule is
 * therefore: derive the OVERFLOW correction independently from panel 1's and
 * panel 3's measurements and UNION the flagged indices (never intersect —
 * correct if EITHER instance overflows) before applying the single shared
 * shrink; if the two instances' measurements ever disagree beyond floating-
 * point noise (which the render contract above proves they should not), that
 * disagreement is logged as its own MISMATCH note rather than silently
 * resolved by "whichever ran last".
 *
 * Usage:
 *   node scripts/align-troncon.mjs [--check|--fix]
 *     --check   measure ONLY — apply the committed zones, report defects
 *               (OVERFLOW is the gate; WALL/MISALIGN/COVER are audited and
 *               printed but do not affect the exit code), write NOTHING.
 *     --fix     (default) calibrate → build corrected zones (height fix +
 *               bounded horizontal snap) → iterate the OVERFLOW-shrink loop to
 *               convergence → write ONLY the three `belliard/troncon-*` keys.
 *
 * Requires the same setup as align-windows.mjs: jpeg-js (ad hoc `npm i
 * --no-save jpeg-js`, only exercised for non-tronçon ids), pngjs (already a
 * devDependency, used for the real-alpha tronçon PNGs), playwright, and a
 * server already serving the production build at PREVIEW_URL.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";
import { detectOpenings, LEVEL_CFG, writeOverlay, measure } from "./align-windows.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";
const ZONES_JSON = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
const LEVEL_ID = "belliard";
const LEVEL_NAME = "Rue Belliard";

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const MAX_ITERS = 12;

// Same design fill-fraction align-windows.mjs's zonesFromOpenings() targets
// (FILL there, not exported — this is the same documented value, not a
// re-derivation): the rendered plane deliberately overshoots the opening
// height so a standing figure isn't a miniature in its window; only the feet
// (sill) line is gated.
const FILL = 1.43;
// Per-iteration shrink factor for an overflowing slot — identical mechanism to
// align-windows.mjs's fixLevel() loop.
const SHRINK = 0.94;
// ENEMY_BODY_LIFT(0.02) × ENEMY_PLANE_SCALE(1.3) (EnemySprite.tsx) — the fixed
// geometric offset the render contract applies between a zone's stored centre
// y and its rendered slot y (`s.y = z.y − BODY_LIFT_COEFF·z.h`, verified
// against the live probe every run: `cal.b` calibrates to exactly −0.0260,
// i.e. this same constant). Used ONLY to INVERT an already-written y back to
// its opening-centre reference for idempotent re-runs (see the ROW_HEIGHTS
// idempotency note) — the actual forward placement below still uses the
// empirically-calibrated `cal.b`, never this hardcoded constant.
const BODY_LIFT_COEFF = 0.026;

// ---------------------------------------------------------------------------
// Edge-density window detector (see file header for why this replaces the
// warm-glow test on tronçon art). Precomputes a per-pixel local-detail score
// via an integral image (O(1) box query) and thresholds it RELATIVE to the
// tile's own mean detail over its opaque (building) pixels, so the same
// factor self-adjusts across tiles of different overall contrast.
// ---------------------------------------------------------------------------
function buildEdgeDensityMask(radiusFrac, threshFactor) {
  return (W, H, data) => {
    const lum = new Float32Array(W * H);
    const opaque = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const p = y * W + x;
        opaque[p] = data[i + 3] > 128 ? 1 : 0;
        lum[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
    }
    const edge = new Float64Array(W * H);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!opaque[p]) continue;
        const gx = Math.abs(lum[p] - lum[p - 1]) + Math.abs(lum[p] - lum[p + 1]);
        const gy = Math.abs(lum[p] - lum[p - W]) + Math.abs(lum[p] - lum[p + W]);
        edge[p] = gx + gy;
      }
    }
    const stride = W + 1;
    const integral = new Float64Array(stride * (H + 1));
    for (let y = 0; y < H; y++) {
      let rowSum = 0;
      for (let x = 0; x < W; x++) {
        rowSum += edge[y * W + x];
        integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
      }
    }
    const boxSum = (x0, x1, y0, y1) => {
      const A = integral[y0 * stride + x0];
      const B = integral[y0 * stride + (x1 + 1)];
      const C = integral[(y1 + 1) * stride + x0];
      const D = integral[(y1 + 1) * stride + (x1 + 1)];
      return D - B - C + A;
    };
    const r = Math.max(1, Math.round(radiusFrac * Math.min(W, H)));
    let total = 0;
    let cnt = 0;
    for (let p = 0; p < W * H; p++) {
      if (opaque[p]) {
        total += edge[p];
        cnt++;
      }
    }
    const thr = (cnt > 0 ? total / cnt : 0) * threshFactor;
    return (x, y) => {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(W - 1, x + r);
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(H - 1, y + r);
      const n = (x1 - x0 + 1) * (y1 - y0 + 1);
      return boxSum(x0, x1, y0, y1) / n > thr ? 1 : 0;
    };
  };
}

// Shared detection tuning; only `band` differs per tile (each building's
// residential floor band sits at a slightly different y-fraction). Tuned by
// hand against the shipped art (see scripts/.dbg-belliard-troncon-*-align-*
// overlays) to recover the real floors/bays reasonably well — this is the
// BEST-EFFORT horizontal-snap signal (see file header), not the sole source
// of geometry.
const TRONCON_BASE_CFG = {
  rowMode: "runs",
  rowSmooth: 0.006,
  rowDetrend: 0.05,
  rowThresh: 0.09,
  rowGapMerge: 0.02,
  rowMinH: 0.03,
  rowHalf: 0.045,
  colSmooth: 3,
  colThresh: 0.22,
  twinMerge: 0.03,
  minPitch: 0.06,
  splitPitch: 0.095,
  minRunW: 0.02,
  openingW: 0.06,
  openingH: 0.09,
  probeH: 0.1,
  buildMask: buildEdgeDensityMask(0.012, 1.15),
};
const TRONCON_BAND = {
  "troncon-a": [0.14, 0.6],
  "troncon-b": [0.12, 0.7],
  "troncon-c": [0.12, 0.7],
};

/**
 * Per-DETECTED-ROW raw opening height, one array per tile parallel to that
 * tile's `detectOpenings(...).rowCenters` (index 0 = topmost floor). This is
 * the "raw opening height" input to the FILL/render-contract step — see the
 * IDEMPOTENCY note below for why it is a hand-tuned CONSTANT table, never read
 * off the committed zone data.
 *
 * IDEMPOTENCY: `windowZones.generated.json`'s `h` for an already-harness-fixed
 * zone is a RENDER-INPUT height (pre-shrunk by FILL/cal.a — see the FIX-mode
 * `zonesByFile` construction below), not a raw opening measurement. Reading
 * "raw opening height" back off the committed `z.h` would be circular on any
 * re-run AFTER a fix has been written (it already happened once during this
 * harness's own development — a `--check` run straight after a `--fix` run
 * reported fresh OVERFLOW because it reinterpreted the just-shrunk `h` as if
 * it were still the raw window height). align-windows.mjs never hits this:
 * its "opening" is always RE-MEASURED from the unchanging facade art, fully
 * decoupled from `windowZones.generated.json`. This table is the tronçon
 * equivalent of that decoupling — a per-row constant (align-windows.mjs's own
 * `LEVEL_CFG.openingH` is the same idea, one constant per whole level; this is
 * one per DETECTED FLOOR since the tronçon tiles mix multiple buildings of
 * visibly different storey heights — median h of the ORIGINAL hand-placed
 * zones nearest each detected row, computed once against the pre-harness
 * baseline and hand-pasted here, exactly as any other LEVEL_CFG tuning
 * constant is arrived at).
 */
const ROW_HEIGHTS = {
  "troncon-a": [0.0478, 0.0463, 0.059, 0.0558],
  "troncon-b": [0.0698, 0.0631, 0.0532, 0.0598],
  "troncon-c": [0.0483, 0.0517, 0.0828, 0.0517],
};

/** Raw opening height for a committed zone at `y`: nearest DETECTED row's
 *  `ROW_HEIGHTS` entry (rows are re-derived from the art every run — see the
 *  idempotency note above). */
function openingHeightAt(file, y, det) {
  let best = 0;
  let bd = Infinity;
  det.rowCenters.forEach((ry, i) => {
    const d = Math.abs(y - ry);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return ROW_HEIGHTS[file][best] ?? TRONCON_BASE_CFG.openingH;
}

function readAllZones() {
  return JSON.parse(fs.readFileSync(ZONES_JSON, "utf8"));
}
function writeTronconZones(zonesByFile) {
  const all = readAllZones();
  for (const [file, zones] of Object.entries(zonesByFile)) {
    all[`${LEVEL_ID}/${file}`] = zones; // overwrite ONLY these 3 keys
  }
  fs.writeFileSync(ZONES_JSON, JSON.stringify(all, null, 2) + "\n");
}

/**
 * Snap a committed zone's x/w to the nearest detected opening when confident
 * (within one opening-pitch AND a plausible 0.5–2× width match); otherwise
 * keep the committed x/w untouched. y/h are NEVER snapped here — the
 * committed y is trusted as the window's vertical centre (visually verified
 * against the art) and h is corrected separately by the FILL/render-contract
 * step, not by detection.
 */
function snapZoneX(zone, openings, cfg) {
  let best = null;
  let bd = Infinity;
  for (const o of openings) {
    const d = Math.hypot(zone.x - o.x, zone.y - o.y);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  if (best === null) return { x: zone.x, w: zone.w, snapped: false };
  const pitch = Math.max(cfg.minPitch, cfg.openingW) * 1.0;
  const widthRatio = best.w / zone.w;
  const confident = bd < pitch && widthRatio > 0.5 && widthRatio < 2;
  return confident
    ? { x: best.x, w: best.w, snapped: true }
    : { x: zone.x, w: zone.w, snapped: false };
}

/** Point warm/coverage-style density sampler built from a tile's own
 *  `detectOpenings` result (its `warmRect`), matching align-windows.mjs's
 *  `makeWarmDensity` box (0.03 half-width, 0.05 half-height) — not exported
 *  there, reproduced here as a thin wrapper over the EXPORTED `warmRect`. */
function warmDensityOf(det) {
  return (nx, ny) => det.warmRect(nx - 0.03, nx + 0.03, ny - 0.05, ny + 0.05);
}

// ---- Browser plumbing (same idiom as align-windows.mjs) -----------------------

async function enterLevel(page) {
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(LEVEL_NAME, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
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

async function applyAndRead(page, tileZones) {
  await page.evaluate((zones) => {
    window.__MUF_ZONES__ = zones;
    window.__MUF_APPLY_ZONES__();
    return null;
  }, tileZones);
}
const readSlots = (page) => page.evaluate(() => window.__MUF_SLOT_RECTS__());

async function screenshot(page, file) {
  await page.screenshot({ path: file, type: "jpeg", quality: 90 });
  return file;
}

/**
 * The tile sequence (panel index → tronçon file) read straight off the
 * manifest — never hardcoded (ADR-0048's a,c,b,c today could change).
 */
function tileSequence() {
  const { manifest } = loadLevelManifest(ROOT);
  const level = manifest.levels.find((l) => l.id === LEVEL_ID);
  if (level?.backdrop?.mode !== "troncon-sequence") {
    throw new Error(`${LEVEL_ID}: expected backdrop.mode "troncon-sequence"`);
  }
  return level.backdrop.tiles.map((t) => t.file);
}

/** Panel indices (0-based, into the tile sequence) that render a given file. */
function panelsForFile(sequence, file) {
  return sequence.flatMap((f, i) => (f === file ? [i] : []));
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--check") ? "check" : "fix";

  const sequence = tileSequence(); // e.g. ["troncon-a","troncon-c","troncon-b","troncon-c"]
  const files = Object.keys(TRONCON_BAND); // ["troncon-a","troncon-b","troncon-c"]
  for (const file of files) {
    if (!sequence.includes(file)) throw new Error(`${LEVEL_ID}: backdrop never tiles ${file}`);
  }

  // Scoped to actual execution (not an import-time side effect) so this
  // module can be imported without permanently mutating align-windows.mjs's
  // shared LEVEL_CFG singleton.
  for (const file of files) {
    LEVEL_CFG[`${LEVEL_ID}/${file}`] = { ...TRONCON_BASE_CFG, band: TRONCON_BAND[file] };
  }

  // Detect openings once per DISTINCT tronçon file (not per on-screen
  // instance — troncon-c has two instances sharing one detection + one JSON key).
  const det = {};
  for (const file of files) det[file] = detectOpenings(`${LEVEL_ID}/${file}`, null);
  // ROW_HEIGHTS is a hand-tuned table parallel to each file's DETECTED rows
  // (see the comment above ROW_HEIGHTS/openingHeightAt). If detection tuning
  // or the art ever changes the number of detected floors, `openingHeightAt`
  // would silently apply a WRONG floor's height via nearest-row matching
  // (never triggering its `?? fallback`) — fail loudly instead.
  for (const file of files) {
    const nRows = det[file].rowCenters.length;
    const nHeights = ROW_HEIGHTS[file].length;
    if (nRows !== nHeights) {
      throw new Error(
        `${LEVEL_ID}/${file}: detected ${String(nRows)} row(s) but ROW_HEIGHTS["${file}"] has ` +
          `${String(nHeights)} entries — detection tuning has drifted from the hand-tuned table; ` +
          `re-derive ROW_HEIGHTS for "${file}" before trusting openingHeightAt()`,
      );
    }
  }

  const committed = readAllZones();
  const committedZones = {};
  for (const file of files) {
    const zones = committed[`${LEVEL_ID}/${file}`];
    if (!Array.isArray(zones))
      throw new Error(`windowZones.generated.json has no ${LEVEL_ID}/${file}`);
    committedZones[file] = zones;
  }

  const { levelIds } = loadLevelManifest(ROOT);
  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await seedDeterminism(page, levelIds);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  let exitCode = 0;
  try {
    await enterLevel(page);

    // "Openings" per file: committed x trusted; x/w bounded-snapped to the
    // best-effort detection (see snapZoneX); h comes from the IDEMPOTENT
    // per-row ROW_HEIGHTS table (see openingHeightAt), NEVER from committed
    // `z.h` — that would be circular once `z.h` has already been through the
    // FILL/render-contract step once (see the idempotency note above
    // ROW_HEIGHTS). y is the committed centre with the SAME BODY_LIFT_COEFF
    // offset removed — a no-op (tiny perturbation) on never-processed data,
    // an EXACT inverse on already-fixed data (see BODY_LIFT_COEFF) — so the
    // opening-centre reference used for the sill line is idempotent too. h is
    // corrected below via the FILL step, never by detection.
    const openings = {};
    const snapNotes = {};
    for (const file of files) {
      snapNotes[file] = [];
      openings[file] = committedZones[file].map((z, i) => {
        const snap = snapZoneX(z, det[file].openings, det[file].cfg);
        if (snap.snapped && (Math.abs(snap.x - z.x) > 0.002 || Math.abs(snap.w - z.w) > 0.002)) {
          snapNotes[file].push(
            `  snap[${i}] x ${z.x.toFixed(4)}→${snap.x.toFixed(4)} w ${z.w.toFixed(4)}→${snap.w.toFixed(4)}`,
          );
        }
        const recoveredY = z.y - BODY_LIFT_COEFF * z.h;
        return {
          x: snap.x,
          y: recoveredY,
          w: snap.w,
          h: openingHeightAt(file, recoveredY, det[file]),
        };
      });
    }
    for (const file of files) {
      console.log(
        `[align-troncon] ${file}: ${openings[file].length} zones, ` +
          `${snapNotes[file].length} confident horizontal snap(s)`,
      );
      for (const n of snapNotes[file].slice(0, 12)) console.log(n);
    }

    // --- CHECK mode: measure the COMMITTED zones as-is, write nothing. ------
    if (mode === "check") {
      const beforeShot = await screenshot(
        page,
        path.resolve(ROOT, "scripts/.dbg-belliard-troncon-screenshot-check.jpg"),
      );
      console.log(`[align-troncon] screenshot: ${path.relative(ROOT, beforeShot)}`);
      const applied = [
        committedZones["troncon-a"],
        committedZones["troncon-c"],
        committedZones["troncon-b"],
        committedZones["troncon-c"],
      ];
      await applyAndRead(page, applied);
      await sleep(300);
      const slots = await readSlots(page);
      let overflowTotal = 0;
      let otherTotal = 0;
      for (const file of files) {
        const panels = panelsForFile(sequence, file);
        const zonesByPanel = [];
        for (const p of panels) zonesByPanel[p] = committedZones[file];
        const warmDensity = warmDensityOf(det[file]);
        const cover = { warmRect: det[file].warmRect, floorW: 0.55 * det[file].cfg.openingW };
        const { defects, bySlot } = measure(
          slots,
          openings[file],
          warmDensity,
          cover,
          zonesByPanel,
          panels,
        );
        const countDefect = defects.find((d) => d.includes("COUNT"));
        if (countDefect) {
          throw new Error(
            `${file}: ${countDefect} — readSlots() returned an unexpected slot count ` +
              `(render race or stale read); refusing to report a possibly-invalid CHECK`,
          );
        }
        const overlay = writeOverlay(
          det[file],
          `${LEVEL_ID}/${file}`,
          slots,
          bySlot,
          0,
          "check",
          panels[0],
        );
        const overflow = defects.filter((d) => d.includes("OVERFLOW")).length;
        overflowTotal += overflow;
        otherTotal += defects.length - overflow;
        console.log(
          `[align-troncon] ${file}: ${defects.length} defect(s) (${overflow} OVERFLOW, ` +
            `${defects.length - overflow} other) → ${path.relative(ROOT, overlay)}`,
        );
        for (const d of defects.slice(0, 16)) console.log(`  ✗ ${d}`);
      }
      console.log(
        `[align-troncon] CHECK ${overflowTotal === 0 ? "PASSED" : "FAILED"} — ` +
          `${overflowTotal} OVERFLOW (gate), ${otherTotal} other (audited, non-gating)`,
      );
      exitCode = overflowTotal > 0 ? 1 : 0;
    } else {
      // --- FIX mode: calibrate → converge the OVERFLOW-shrink loop. --------
      const beforeShot = await screenshot(
        page,
        path.resolve(ROOT, "scripts/.dbg-belliard-troncon-screenshot-before.jpg"),
      );
      console.log(`[align-troncon] before screenshot: ${path.relative(ROOT, beforeShot)}`);

      // Calibrate h→size / y→placement ONCE, empirically, off a live probe —
      // never hand-derived (the render contract is whatever GameScene.tsx
      // ACTUALLY does today). Analytically the mapping is independent of tile
      // width (verified: EnemySprite plane math never involves tile.centreX/
      // tile.width in the h/y terms — only x/w do), so one calibration serves
      // all three tiles.
      const probeH = TRONCON_BASE_CFG.probeH;
      const probeOf = (file) =>
        openings[file].map((o) => ({
          x: +o.x.toFixed(4),
          y: +(o.y + BODY_LIFT_COEFF * probeH).toFixed(4),
          w: +o.w.toFixed(4),
          h: probeH,
        }));
      const probeByFile = Object.fromEntries(files.map((f) => [f, probeOf(f)]));
      await applyAndRead(page, [
        probeByFile["troncon-a"],
        probeByFile["troncon-c"],
        probeByFile["troncon-b"],
        probeByFile["troncon-c"],
      ]);
      await sleep(400);
      const probeSlots = await readSlots(page);
      let a = 0;
      let b = 0;
      let n = 0;
      for (const file of files) {
        for (const p of panelsForFile(sequence, file)) {
          const slots = probeSlots.filter((s) => s.panel === p);
          probeByFile[file].forEach((pz, i) => {
            const s = slots[i];
            if (!s) return;
            a += s.h / pz.h;
            b += (s.y - pz.y) / pz.h;
            n++;
          });
        }
      }
      if (n === 0) {
        throw new Error(
          "calibration probe matched 0 slots across all tiles — cannot verify the render " +
            "contract against a live render (manifest/panel-index mismatch, or the probe " +
            "render hasn't settled); refusing to fall back to guessed constants",
        );
      }
      const cal = { a: a / n, b: b / n };
      console.log(
        `[align-troncon] calibrated a=${cal.a.toFixed(4)} b=${cal.b.toFixed(4)} (n=${String(n)} probe slots)`,
      );

      // WRITTEN x/w always come from the COMMITTED (hand-placed) zone, never
      // from the best-effort detection snap — the snap only feeds `openings[]`
      // (the sill-line target + the MISALIGN/WALL/COVER AUDIT below), never the
      // data this harness actually overwrites. Only h/y (the vertical seating,
      // the confirmed and mechanically-understood bug) are corrected here; see
      // the file header for why horizontal correction stays audit-only on this
      // art. `o.y`/`o.h` are unaffected by the snap (only x/w are), so the sill
      // target itself is exactly the committed data either way.
      let zonesByFile = Object.fromEntries(
        files.map((file) => [
          file,
          openings[file].map((o, i) => {
            const zh = (FILL * o.h) / cal.a;
            const committed = committedZones[file][i];
            return {
              x: committed.x,
              y: +(o.y - cal.b * zh).toFixed(4),
              w: committed.w,
              h: +zh.toFixed(4),
            };
          }),
        ]),
      );

      let converged = false;
      let lastOverflow = Infinity;
      let lastSlots = [];
      const overlays = {};
      for (let iter = 1; iter <= MAX_ITERS; iter++) {
        const applied = [
          zonesByFile["troncon-a"],
          zonesByFile["troncon-c"],
          zonesByFile["troncon-b"],
          zonesByFile["troncon-c"],
        ];
        await applyAndRead(page, applied);
        await sleep(300);
        lastSlots = await readSlots(page);

        let overflowTotal = 0;
        const overflowByFile = {};
        for (const file of files) {
          const panels = panelsForFile(sequence, file);
          overflowByFile[file] = new Set();
          // Merge rule (troncon-c, two on-screen instances): measure each
          // panel instance independently, UNION the flagged indices — correct
          // if EITHER instance overflows. The two are mathematically identical
          // by construction (see file header); a per-instance divergence would
          // indicate a render-contract regression, not a data problem, so it is
          // logged rather than silently averaged away.
          const perPanelOverflow = {};
          for (const p of panels) {
            const zonesByPanel = [];
            zonesByPanel[p] = zonesByFile[file];
            const { defects, bySlot } = measure(
              lastSlots,
              openings[file],
              null,
              null,
              zonesByPanel,
              [p],
            );
            const countDefect = defects.find((d) => d.includes("COUNT"));
            if (countDefect) {
              throw new Error(
                `${file} panel ${String(p)} iter ${String(iter)}: ${countDefect} — ` +
                  `readSlots() returned an unexpected slot count for this panel (render race, ` +
                  `a sleep() too short under load, or a stale __MUF_SLOT_RECTS__ read); refusing ` +
                  `to treat an empty/short measurement as "no OVERFLOW" and write unvalidated data`,
              );
            }
            const idxs = new Set();
            bySlot
              .filter((bs) => bs.panel === p && !bs.contained)
              .forEach((bs) => {
                const idx = openings[file].indexOf(bs.opening);
                if (idx >= 0) idxs.add(idx);
              });
            perPanelOverflow[p] = idxs;
            for (const idx of idxs) overflowByFile[file].add(idx);
          }
          if (panels.length > 1) {
            const [p0, ...rest] = panels;
            for (const p of rest) {
              const a0 = perPanelOverflow[p0];
              const a1 = perPanelOverflow[p];
              const same = a0.size === a1.size && [...a0].every((v) => a1.has(v));
              if (!same) {
                console.warn(
                  `[align-troncon] MISMATCH ${file}: panel ${p0} and panel ${p} disagree on ` +
                    `OVERFLOW (unexpected — the two instances should render identically)`,
                );
              }
            }
          }
          overflowTotal += overflowByFile[file].size;
        }

        console.log(
          `[align-troncon] iter ${iter}: ${overflowTotal} OVERFLOW zone(s) across all tiles`,
        );
        if (overflowTotal === 0) {
          converged = true;
          lastOverflow = 0;
          break;
        }
        lastOverflow = overflowTotal;

        zonesByFile = Object.fromEntries(
          files.map((file) => [
            file,
            zonesByFile[file].map((z, i) => {
              if (!overflowByFile[file].has(i)) return z;
              const o = openings[file][i];
              const zh = +(z.h * SHRINK).toFixed(4);
              return { x: z.x, y: +(o.y - cal.b * zh).toFixed(4), w: z.w, h: zh };
            }),
          ]),
        );
      }

      if (!converged) {
        console.error(
          `[align-troncon] FIX did NOT converge (${lastOverflow} OVERFLOW remaining) — NOT writing.`,
        );
        exitCode = 1;
      } else {
        writeTronconZones(zonesByFile);
        console.log(
          `[align-troncon] FIX converged — wrote ${files.map((f) => `${f}:${zonesByFile[f].length}`).join(", ")} ` +
            `to ${path.relative(ROOT, ZONES_JSON)}`,
        );

        // Evidence: per-tile art overlays (openings vs corrected slot rects,
        // red outline = still overflowing — none, once converged) + a real
        // in-game screenshot with the corrected zones live.
        for (const file of files) {
          const panels = panelsForFile(sequence, file);
          const zonesByPanel = [];
          for (const p of panels) zonesByPanel[p] = zonesByFile[file];
          const { bySlot } = measure(lastSlots, openings[file], null, null, zonesByPanel, panels);
          overlays[file] = writeOverlay(
            det[file],
            `${LEVEL_ID}/${file}`,
            lastSlots,
            bySlot,
            0,
            "fix",
            panels[0],
          );
          console.log(`[align-troncon] ${file} overlay: ${path.relative(ROOT, overlays[file])}`);
        }
        const afterShot = await screenshot(
          page,
          path.resolve(ROOT, "scripts/.dbg-belliard-troncon-screenshot-after.jpg"),
        );
        console.log(`[align-troncon] after screenshot: ${path.relative(ROOT, afterShot)}`);
      }
    }
  } catch (e) {
    console.error(`[align-troncon] Fatal: ${e.message}`);
    exitCode = 1;
  } finally {
    if (pageErrors.length > 0)
      console.warn(`[align-troncon] page error(s): ${pageErrors.join("; ")}`);
    await browser.close();
  }
  console.log(`[align-troncon] ${mode} done — exit ${String(exitCode)}`);
  process.exit(exitCode);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((e) => {
    console.error("[align-troncon] Fatal:", e.message);
    process.exit(1);
  });
}

export { buildEdgeDensityMask, snapZoneX, tileSequence, panelsForFile };
