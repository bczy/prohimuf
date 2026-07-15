#!/usr/bin/env node
/**
 * align-belliard-windows.mjs — window-alignment HARNESS for the `belliard` level.
 *
 * The bug (Bertrand): "plein de sprites dépassent des fenêtres; des fois il n'y a
 * rien devant les fenêtres — pas bon." The shipped belliard zones were a regular
 * 7×3 grid, but the AI facade art is NOT a clean grid — so cops overflowed their
 * window openings and some grid slots sat on bare wall while lit windows had no cop.
 *
 * This harness DETECTS the real windows from the facade art, then drives the live
 * production render to place one non-overflowing cop in each, looping until zero
 * defects, with debug overlays as proof.
 *
 *   SUCCESS: for every panel, #zones == #detected windows, each rendered enemy
 *   sprite box is contained (⊆, +τ) in its window opening, and no zone sits on
 *   bare wall. Exit 0 when clean, non-zero while any defect remains.
 *
 * Two modes (both drive a running production build via __MUF_* render hooks):
 *   --check         measure ONLY — apply the committed windowZones.generated.json
 *                   belliard zones, read the rendered slot rects, report defects,
 *                   write nothing, exit non-zero on any defect (CI gate).
 *   --fix (default) DETECT → build initial zones → apply via __MUF_ZONES__ → read
 *                   __MUF_SLOT_RECTS__ → measure → correct (tune each zone's h/y,
 *                   1:1 with the openings) → loop to 0 defects → overwrite the
 *                   belliard key of windowZones.generated.json (4 identical panels,
 *                   stalingrad/vitry untouched). Saves proof overlays each iter.
 *
 * Geometry contract (GameScene.tsx, mirrored by measure()):
 *   The EnemySprite plane IGNORES the zone width — planeH = zone.h · 0.8, planeW =
 *   planeH · WIDEST_ASPECT, and the box is shifted DOWN by planeH · 0.28 (feet at
 *   sill). So zone.h controls the sprite SIZE, zone.y its vertical placement, and
 *   zone.w only frames the foreground railing (⇒ set to the opening width). The
 *   harness reads the live per-panel slot rects via __MUF_SLOT_RECTS__ rather than
 *   trusting these constants, and calibrates the h→size / y→placement mapping from
 *   the first render so it stays correct if the render layout ever changes.
 *
 * Window detection (public/assets/levels/belliard/facade.png — JPEG despite .png):
 *   The facade is one panel, tiled ×4, so ONE detection drives all four identical
 *   panels. Warm-lit mask over the residential band → 3 floor row-centroids → per
 *   row a warm column-density profile whose peaks are the lit french windows (twin
 *   panes merged, abnormally wide runs split by pitch). Emits one opening per real,
 *   visible window; dark/ambiguous windows are intentionally NOT invented (a zone
 *   on unlit wall is itself a defect and against the reported bug).
 *
 * Requires: jpeg-js (`npm i --no-save --legacy-peer-deps jpeg-js`) and playwright
 * (`ln -s /opt/node22/lib/node_modules/playwright node_modules/playwright`), same
 * install pattern as the other e2e scripts. Expects a server already serving the
 * production build at PREVIEW_URL (default http://127.0.0.1:4173/prohimuf/).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import jpeg from "jpeg-js";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";
const LEVEL_ID = "belliard";
const FACADE = path.resolve(ROOT, "public/assets/levels", LEVEL_ID, "facade.png");
const ZONES_JSON = path.resolve(ROOT, "src/game/levels/windowZones.generated.json");
const DBG_PREFIX = path.resolve(ROOT, "scripts", `.dbg-${LEVEL_ID}-align`);

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const MAX_ITERS = 12;

// Containment tolerance (per side), matching the render contract's τ.
const TAU = 0.01;
// Sprite plane target: fill this fraction of the opening HEIGHT (85–92% window).
const FILL = 0.88;
// Extra safety margin (beyond τ) kept between the sprite box and the opening edge.
const MARGIN = 0.006;

// ---- Detection tuning (facade-pixel fractions) --------------------------------
const BAND_TOP = 0.15; // exclude roof / attic above this
const BAND_BOT = 0.63; // exclude the bright neon shopfronts below this
const ROW_HALF = 0.06; // half-height of a row's column-scan band
const COL_SMOOTH = 3; // column-profile smoothing radius (px)
const COL_THRESH = 0.13; // min warm fraction of the scan band to be a window column
const TWIN_MERGE = 0.05; // merge runs closer than this (french-window twin panes)
const MIN_PITCH = 0.075; // min separation between distinct windows
const SPLIT_PITCH = 0.09; // split a merged run wider than ~this into N windows
const MIN_RUN_W = 0.03; // ignore warm runs thinner than this (rail glints)

// Uniform opening size (the real french-window rectangle, ≈ the shipped size).
const OPENING_W = 0.081;
const OPENING_H = 0.125;

const isWarm = (r, g, b) => r > 78 && r - b > 12 && r + g + b > 120;

/**
 * Detect the real lit windows from the facade art. Returns openings in per-panel
 * facade-normalized coords (x,y = CENTRE, w,h = SIZE, y-down), plus the image dims.
 */
function detectOpenings() {
  const raw = jpeg.decode(fs.readFileSync(FACADE), { useTArray: true });
  const { width: W, height: H, data } = raw;
  const warmAt = (x, y) => {
    const i = (y * W + x) * 4;
    return isWarm(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
  };

  const yTop = Math.round(BAND_TOP * H);
  const yBot = Math.round(BAND_BOT * H);

  // 3 floor row-centres: split the residential band into thirds, take each
  // third's warm centroid (robust — no fragile global peak-picking).
  const rowSum = new Float64Array(H);
  for (let y = yTop; y <= yBot; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) s += warmAt(x, y);
    rowSum[y] = s;
  }
  const rowCenters = [];
  for (let k = 0; k < 3; k++) {
    const lo = Math.round(yTop + ((yBot - yTop) * k) / 3);
    const hi = Math.round(yTop + ((yBot - yTop) * (k + 1)) / 3);
    let num = 0;
    let den = 0;
    for (let y = lo; y < hi; y++) {
      num += y * rowSum[y];
      den += rowSum[y];
    }
    rowCenters.push(den > 0 ? num / den : (lo + hi) / 2);
  }

  const detectRow = (cy) => {
    const lo = Math.round(cy - ROW_HALF * H);
    const hi = Math.round(cy + ROW_HALF * H);
    const col = new Float64Array(W);
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = lo; y <= hi; y++) s += warmAt(x, y);
      col[x] = s;
    }
    // smooth
    const sm = new Float64Array(W);
    for (let x = 0; x < W; x++) {
      let s = 0;
      let n = 0;
      for (let d = -COL_SMOOTH; d <= COL_SMOOTH; d++) {
        const xx = x + d;
        if (xx >= 0 && xx < W) {
          s += col[xx];
          n++;
        }
      }
      sm[x] = s / n;
    }
    const bandH = hi - lo + 1;
    const thr = bandH * COL_THRESH;
    // contiguous above-threshold runs
    const runs = [];
    let inRun = false;
    let rs = 0;
    for (let x = 0; x < W; x++) {
      if (sm[x] >= thr && !inRun) {
        inRun = true;
        rs = x;
      } else if (sm[x] < thr && inRun) {
        inRun = false;
        runs.push([rs, x - 1]);
      }
    }
    if (inRun) runs.push([rs, W - 1]);
    // merge twin panes of one french window
    const merged = [];
    for (const r of runs) {
      const last = merged[merged.length - 1];
      if (last && r[0] - last[1] <= TWIN_MERGE * W) last[1] = r[1];
      else merged.push([r[0], r[1]]);
    }
    // runs → window centres (split abnormally wide runs by pitch)
    const wins = [];
    for (const [a, b] of merged) {
      const w = b - a + 1;
      if (w < MIN_RUN_W * W) continue;
      const n = Math.max(1, Math.round(w / (SPLIT_PITCH * W)));
      for (let s = 0; s < n; s++) {
        const x0 = a + (w * s) / n;
        const x1 = a + (w * (s + 1)) / n;
        let num = 0;
        let den = 0;
        for (let x = Math.round(x0); x <= Math.round(x1); x++) {
          num += x * sm[x];
          den += sm[x];
        }
        wins.push(den > 0 ? num / den : (x0 + x1) / 2);
      }
    }
    // enforce min pitch
    wins.sort((p, q) => p - q);
    const out = [];
    for (const cx of wins) {
      const last = out[out.length - 1];
      if (last !== undefined && cx - last < MIN_PITCH * W) out[out.length - 1] = (last + cx) / 2;
      else out.push(cx);
    }
    return out;
  };

  const openings = [];
  rowCenters.forEach((cy, row) => {
    for (const cx of detectRow(cy)) {
      openings.push({
        x: +(cx / W).toFixed(4),
        y: +(cy / H).toFixed(4),
        w: OPENING_W,
        h: OPENING_H,
        row,
      });
    }
  });
  openings.sort((p, q) => p.row - q.row || p.x - q.x);
  return { openings, W, H, data, rowCenters: rowCenters.map((c) => c / H) };
}

/**
 * Build zones for one panel from the openings, using the calibrated linear map
 * from the live render (a: h→size, b: h→y-shift, c: h→size-x). Sizes each sprite
 * to FILL of the opening height and centres it, with zone.w = opening width.
 */
function zonesFromOpenings(openings, cal) {
  const { a, b, c } = cal;
  return openings.map((o) => {
    // sprite plane target height (contained, ~FILL of opening height)
    let zh = (FILL * o.h) / a;
    // never let the sprite exceed the opening (±τ) in either axis
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
 * Match each panel's slot rects to the openings (1:1 by nearest x within the row),
 * then classify defects: OVERFLOW (slot ⊄ opening+τ), COUNT (#zones ≠ #openings),
 * EMPTY (opening with no zone centre near it), WALL (zone centre on bare wall).
 * `warmDensity(x,y)` samples the facade to detect bare-wall zones.
 */
function measure(slotRects, openings, panels, warmDensity) {
  const defects = [];
  const bySlot = []; // per slot: { panel, slot, opening, contained }
  for (let p = 0; p < panels; p++) {
    const slots = slotRects.filter((s) => s.panel === p);
    if (slots.length !== openings.length) {
      defects.push(`panel ${p}: COUNT ${slots.length} zones ≠ ${openings.length} openings`);
    }
    // greedy nearest match slot→opening
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
      // containment: slot box ⊆ opening expanded by τ
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
      // bare-wall: zone centre with no window light and no opening nearby
      if (warmDensity) {
        const near = openings.some(
          (op) => Math.hypot(s.x - op.x, s.y - op.y) < 0.5 * Math.min(op.w, op.h),
        );
        if (!near && warmDensity(s.x, s.y) < 0.05) {
          defects.push(`panel ${p}: WALL zone@(${s.x.toFixed(3)},${s.y.toFixed(3)}) on bare wall`);
        }
      }
    }
    // EMPTY: an opening no zone centre lands in
    for (let o = 0; o < openings.length; o++) {
      if (used.has(o)) continue;
      const op = openings[o];
      defects.push(`panel ${p}: EMPTY opening@(${op.x.toFixed(3)},${op.y.toFixed(3)}) has no zone`);
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
 * Debug overlay: dimmed facade with detected openings (green) and the rendered
 * slot rects of panel 0 (magenta; red if the slot overflows). Read this to judge
 * alignment — every opening must be a real window and every sprite frame inside.
 */
function writeOverlay(det, slotRects, bySlot, iter, tag) {
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
  const file = `${DBG_PREFIX}-${tag}-i${String(iter).padStart(2, "0")}.jpg`;
  fs.writeFileSync(file, jpeg.encode({ width: W, height: H, data: buf }, 90).data);
  return file;
}

/** Warm-density sampler over the facade for the bare-wall defect check. */
function makeWarmDensity(det) {
  const { W, H, data } = det;
  return (nx, ny) => {
    const cx = Math.round(nx * W);
    const cy = Math.round(ny * H);
    const rx = Math.round(0.03 * W);
    const ry = Math.round(0.05 * H);
    let warm = 0;
    let total = 0;
    for (let y = cy - ry; y <= cy + ry; y++) {
      if (y < 0 || y >= H) continue;
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (x < 0 || x >= W) continue;
        const i = (y * W + x) * 4;
        if (isWarm(data[i], data[i + 1], data[i + 2])) warm++;
        total++;
      }
    }
    return total > 0 ? warm / total : 0;
  };
}

// ---- Browser plumbing ---------------------------------------------------------

async function enterBelliard(page, levelName, levelIds) {
  await seedDeterminism(page, levelIds);
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(levelName, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
  // Wait for the harness hooks to register (they mount in a useEffect).
  await page.waitForFunction(
    () =>
      typeof window.__MUF_SLOT_RECTS__ === "function" &&
      typeof window.__MUF_APPLY_ZONES__ === "function",
    { timeout: RENDER_TIMEOUT },
  );
  await sleep(500);
}

/** Push per-panel zones into the live scene and read back the slot rects. */
async function applyAndRead(page, panelZones) {
  return page.evaluate((zones) => {
    window.__MUF_ZONES__ = zones;
    window.__MUF_APPLY_ZONES__();
    return null;
  }, panelZones);
}
async function readSlots(page) {
  return page.evaluate(() => window.__MUF_SLOT_RECTS__());
}

function readBelliardFromJson() {
  const all = JSON.parse(fs.readFileSync(ZONES_JSON, "utf8"));
  return all[LEVEL_ID];
}

function writeBelliardToJson(panelZones) {
  const all = JSON.parse(fs.readFileSync(ZONES_JSON, "utf8"));
  all[LEVEL_ID] = panelZones; // overwrite belliard only; stalingrad/vitry untouched
  fs.writeFileSync(ZONES_JSON, JSON.stringify(all, null, 2) + "\n");
}

async function main() {
  const mode = process.argv.includes("--check") ? "check" : "fix";
  const { levels, levelIds } = loadLevelManifest(ROOT);
  const level = levels.find((l) => l.id === LEVEL_ID);
  if (!level) throw new Error(`levelArt.json has no level "${LEVEL_ID}"`);

  const det = detectOpenings();
  const warmDensity = makeWarmDensity(det);
  const perRow = [0, 0, 0];
  det.openings.forEach((o) => perRow[o.row]++);
  console.log(
    `[align] detected ${det.openings.length} windows (per row ${perRow.join("/")}), ` +
      `row centres ${det.rowCenters.map((c) => c.toFixed(3)).join(", ")}`,
  );

  const PANELS = 4;
  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  let exitCode = 0;
  let finalOverlay = "";
  try {
    await enterBelliard(page, level.name, levelIds);

    if (mode === "check") {
      const belliard = readBelliardFromJson();
      if (!Array.isArray(belliard)) throw new Error("windowZones.generated.json has no belliard[]");
      await applyAndRead(page, belliard);
      await sleep(300);
      const slots = await readSlots(page);
      const { defects, bySlot } = measure(slots, det.openings, PANELS, warmDensity);
      finalOverlay = writeOverlay(det, slots, bySlot, 0, "check");
      if (defects.length > 0) {
        console.error(`[align] CHECK FAILED — ${defects.length} defect(s):`);
        for (const d of defects) console.error(`  ✗ ${d}`);
        exitCode = 1;
      } else {
        console.log(`[align] CHECK PASSED — 0 defects across ${PANELS} panels`);
      }
    } else {
      // FIX: calibrate the h→(size,y) map from a first probe render, then correct.
      const probeH = 0.13;
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
      // average calibration constants a=size/h, b=(y_report-zone.y)/h, c=w/h
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
        `[align] calibrated a=${cal.a.toFixed(4)} b=${cal.b.toFixed(4)} c=${cal.c.toFixed(4)}`,
      );

      let panelZones = zonesFromOpenings(det.openings, cal);
      let converged = false;
      let lastSlots = [];
      let lastBySlot = [];
      for (let iter = 1; iter <= MAX_ITERS; iter++) {
        await applyAndRead(
          page,
          Array.from({ length: PANELS }, () => panelZones),
        );
        await sleep(300);
        lastSlots = await readSlots(page);
        const { defects, bySlot } = measure(lastSlots, det.openings, PANELS, warmDensity);
        lastBySlot = bySlot;
        finalOverlay = writeOverlay(det, lastSlots, bySlot, iter, "fix");
        console.log(
          `[align] iter ${iter}: ${defects.length} defect(s) → ${path.relative(ROOT, finalOverlay)}`,
        );
        if (defects.length === 0) {
          converged = true;
          break;
        }
        // correct: for each overflowing panel-0 slot, shrink its zone height a
        // touch and re-centre (linear map is exact, so this only trims τ residue).
        const overflowByIdx = new Set();
        bySlot
          .filter((bs) => bs.panel === 0 && !bs.contained)
          .forEach((bs) => {
            const idx = det.openings.indexOf(bs.opening);
            if (idx >= 0) overflowByIdx.add(idx);
          });
        panelZones = panelZones.map((z, i) => {
          if (!overflowByIdx.has(i)) return z;
          const o = det.openings[i];
          const zh = +(z.h * 0.94).toFixed(4);
          return { x: z.x, y: +(o.y - cal.b * zh).toFixed(4), w: z.w, h: zh };
        });
      }

      if (converged) {
        // belliard is one facade tiled ×4 → write 4 IDENTICAL panels.
        writeBelliardToJson(Array.from({ length: PANELS }, () => panelZones));
        console.log(
          `[align] FIX converged — wrote belliard (${panelZones.length} zones × ${PANELS} panels) ` +
            `to ${path.relative(ROOT, ZONES_JSON)}`,
        );
      } else {
        console.error("[align] FIX did NOT converge within iteration cap — NOT writing zones.");
        const { defects } = measure(lastSlots, det.openings, PANELS, warmDensity);
        for (const d of defects.slice(0, 20)) console.error(`  ✗ ${d}`);
        exitCode = 1;
      }
    }
  } catch (e) {
    console.error(`[align] Fatal: ${e.message}`);
    exitCode = 1;
  } finally {
    if (pageErrors.length > 0) {
      console.warn(`[align] page error(s): ${pageErrors.join("; ")}`);
    }
    await browser.close();
  }
  if (finalOverlay) console.log(`[align] final overlay: ${path.relative(ROOT, finalOverlay)}`);
  process.exit(exitCode);
}

main().catch((e) => {
  console.error("[align] Fatal:", e.message);
  process.exit(1);
});
