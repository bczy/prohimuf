#!/usr/bin/env node
/**
 * ART GATE 2 — pixel-level style gate over the generated vehicle sprites.
 *
 * Where check-art-prompts.mjs guards the *words*, this guards the *pixels* that
 * come back from FLUX + the chroma-key detour. It catches the three quality
 * failures the concept-artist lane hit repeatedly and that a byte-size gate
 * (e2e-assets.mjs) is blind to:
 *
 *   (1) GROUND — the sprite was generated on a WHITE/light ground, so the
 *       black→transparent chroma-key had nothing to key and left an opaque halo.
 *       Measured as: the outermost 2px border must be overwhelmingly transparent
 *       OR near-black (post-key and pre-key both acceptable). A failed key leaves
 *       a bright coloured border → the clean-border ratio collapses.
 *   (2) NEON — the assigned rim light (orange/cyan/magenta) is missing. Measured
 *       as: a minimum share of the non-transparent pixels sit inside the assigned
 *       hue band at high saturation & value — proof a luminous rim actually
 *       exists in the right colour.
 *   (3) SILHOUETTE — wrong proportions (e.g. a long low sedan when a short tall
 *       one-box car was wanted, or a vehicle cropped out of frame). Measured from
 *       the content bounding box: aspect within per-type bounds, the box wide
 *       enough to hold the whole vehicle, and dense enough to be a solid body.
 *
 * Thresholds are CALIBRATED against the current PM-accepted PNGs (truck/car/moto)
 * — the gate must pass all three as-is. Each run prints the measured numbers so
 * future re-tuning (after a re-roll) is informed. See the calibration table at
 * the bottom for the measured values and the margins chosen.
 *
 * Usage:
 *   node scripts/check-sprite-style.mjs                    # check all vehicle types
 *   node scripts/check-sprite-style.mjs --file a.png --type car   # one file
 *   node scripts/check-sprite-style.mjs --fail-list f.txt  # also write failing
 *                                                          #   type names (CI retry)
 * Exit: 0 when every checked sprite PASSES; 1 if any FAILS (or a file is missing).
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, process.env.LEVEL_ART ?? "src/game/levels/levelArt.json");
const PUBLIC_DIR = path.resolve(ROOT, "public");

// ── Calibrated thresholds (see calibration table at the bottom) ──────────────
const ALPHA_CONTENT = 32; // alpha above this = opaque vehicle content
const ALPHA_CLEAR = 16; // alpha below this = keyed-out background
const NEAR_BLACK_MAX = 24; // max(r,g,b) below this = near-black (pre-key bg / dark body)

const GROUND_MIN_CLEAN_PCT = 85; // border must be >= this % transparent-or-near-black
const NEON_MIN_PCT = 0.75; // >= this % of content pixels inside the assigned hue band
const NEON_MIN_SAT = 0.55;
const NEON_MIN_VAL = 0.65;
const BBOX_FILL_MIN_PCT = 45; // content must fill >= this % of its bounding box (solid body)
const BBOX_WIDTH_MIN_PCT = 60; // bbox must span >= this % of canvas width (whole vehicle in frame)

// Assigned-hue bands (degrees) — a luminous rim of the wrong colour still fails.
const HUE_BANDS = {
  orange: [20, 45],
  cyan: [165, 210],
  magenta: [280, 330],
};

// Per-type content aspect (bbox width / height) bounds. Calibrated to the
// PM-accepted art, which frames each vehicle edge-to-edge (so aspect trends high
// vs a naive guess); see the calibration note.
const ASPECT_BOUNDS = {
  truck: [3.0, 5.5],
  car: [2.2, 4.3],
  moto: [1.4, 3.0],
};

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function loadPixels(file) {
  return loadImage(file).then((img) => {
    const W = img.width;
    const H = img.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return { W, H, d: ctx.getImageData(0, 0, W, H).data };
  });
}

function measure({ W, H, d }, neon) {
  const band = HUE_BANDS[neon] ?? HUE_BANDS.cyan;
  const [hlo, hhi] = band;

  // GROUND — outermost 2px border, clean = transparent OR near-black.
  let borderTotal = 0;
  let borderClean = 0;
  const isBorder = (x, y) => x < 2 || y < 2 || x >= W - 2 || y >= H - 2;

  // NEON + content bbox in one pass.
  let content = 0;
  let neonPix = 0;
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;
  let filled = 0; // opaque pixels (== content), used for bbox density below

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const a = d[o + 3];
      const mx = Math.max(d[o], d[o + 1], d[o + 2]);

      if (isBorder(x, y)) {
        borderTotal++;
        if (a < ALPHA_CLEAR || mx < NEAR_BLACK_MAX) borderClean++;
      }

      if (a > ALPHA_CONTENT) {
        content++;
        filled++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const [h, s, v] = rgbToHsv(d[o], d[o + 1], d[o + 2]);
        if (h >= hlo && h <= hhi && s >= NEON_MIN_SAT && v >= NEON_MIN_VAL) neonPix++;
      }
    }
  }

  const bw = maxX >= minX ? maxX - minX + 1 : 0;
  const bh = maxY >= minY ? maxY - minY + 1 : 0;

  return {
    W,
    H,
    borderCleanPct: borderTotal ? (borderClean / borderTotal) * 100 : 0,
    content,
    neonPct: content ? (neonPix / content) * 100 : 0,
    bboxW: bw,
    bboxH: bh,
    aspect: bh ? bw / bh : 0,
    bboxFillPct: bw && bh ? (filled / (bw * bh)) * 100 : 0,
    bboxWidthPct: (bw / W) * 100,
    bboxHeightPct: (bh / H) * 100, // informational (future tuning)
  };
}

function evaluate(type, neon, m) {
  const [aLo, aHi] = ASPECT_BOUNDS[type] ?? [0, Infinity];
  const checks = [
    {
      name: "GROUND border clean",
      ok: m.borderCleanPct >= GROUND_MIN_CLEAN_PCT,
      got: `${m.borderCleanPct.toFixed(2)}%`,
      need: `>= ${GROUND_MIN_CLEAN_PCT}%`,
    },
    {
      name: `NEON ${neon} rim`,
      ok: m.neonPct >= NEON_MIN_PCT,
      got: `${m.neonPct.toFixed(3)}%`,
      need: `>= ${NEON_MIN_PCT}% of content`,
    },
    {
      name: "SILHOUETTE aspect",
      ok: m.aspect >= aLo && m.aspect <= aHi,
      got: m.aspect.toFixed(3),
      need: `${aLo}..${aHi}`,
    },
    {
      name: "SILHOUETTE bbox fill",
      ok: m.bboxFillPct >= BBOX_FILL_MIN_PCT,
      got: `${m.bboxFillPct.toFixed(2)}%`,
      need: `>= ${BBOX_FILL_MIN_PCT}%`,
    },
    {
      name: "SILHOUETTE frame width",
      ok: m.bboxWidthPct >= BBOX_WIDTH_MIN_PCT,
      got: `${m.bboxWidthPct.toFixed(2)}%`,
      need: `>= ${BBOX_WIDTH_MIN_PCT}%`,
    },
  ];
  return { pass: checks.every((c) => c.ok), checks };
}

async function checkSprite(type, neon, file) {
  if (!fs.existsSync(file)) {
    console.log(`\n[${type}] MISSING  ${path.relative(ROOT, file)}`);
    return false;
  }
  const px = await loadPixels(file);
  const m = measure(px, neon);
  const { pass, checks } = evaluate(type, neon, m);

  console.log(
    `\n[${type}] ${pass ? "PASS" : "FAIL"}  ${path.relative(ROOT, file)}  ` +
      `(${m.W}x${m.H}, neon=${neon}, bbox ${m.bboxW}x${m.bboxH}, ` +
      `height ${m.bboxHeightPct.toFixed(1)}% of canvas)`,
  );
  for (const c of checks) {
    console.log(`    ${c.ok ? "ok " : "XX "}${c.name.padEnd(22)} ${c.got}  (need ${c.need})`);
  }
  return pass;
}

function loadTypes() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const types = json.vehicles?.types ?? {};
  return Object.entries(types).map(([type, def]) => ({
    type,
    neon: def.neon ?? "cyan",
    file: path.resolve(PUBLIC_DIR, def.asset ?? `assets/vehicles/${type}.png`),
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  const ti = args.indexOf("--type");
  const fl = args.indexOf("--fail-list");
  const failListPath = fl !== -1 ? args[fl + 1] : null;

  let targets;
  if (fi !== -1) {
    const type = ti !== -1 ? args[ti + 1] : null;
    if (!type) {
      console.error("--file requires --type <truck|car|moto>");
      process.exit(2);
    }
    // Resolve the neon from levelArt for the given type (fall back to cyan).
    const known = loadTypes().find((t) => t.type === type);
    targets = [
      { type, neon: known?.neon ?? "cyan", file: path.resolve(process.cwd(), args[fi + 1]) },
    ];
  } else {
    targets = loadTypes();
  }

  console.log(`[check-sprite-style] checking ${String(targets.length)} sprite(s)`);

  const failing = [];
  for (const t of targets) {
    const ok = await checkSprite(t.type, t.neon, t.file);
    if (!ok) failing.push(t.type);
  }

  if (failListPath) {
    fs.writeFileSync(failListPath, failing.join("\n") + (failing.length ? "\n" : ""));
    console.log(`\n[check-sprite-style] failing types written to ${failListPath}`);
  }

  if (failing.length > 0) {
    console.error(
      `\n[check-sprite-style] FAILED — ${failing.length} sprite(s): ${failing.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `\n[check-sprite-style] PASSED — all ${String(targets.length)} sprite(s) meet the style gate`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

/*
 * CALIBRATION TABLE — measured against the PM-accepted PNGs on disk:
 *
 *   metric                 truck    car      moto     threshold        margin
 *   GROUND border clean    99.39%   91.70%   99.88%   >= 85%           car tightest (+6.7pp)
 *   NEON hue-band share     8.66%   10.28%    2.02%   >= 0.75%         moto tightest (2.7x)
 *   SILHOUETTE aspect        4.19    3.17     2.13    per-type bounds  centred on measured
 *   SILHOUETTE bbox fill    80.1%   75.9%    61.8%   >= 45%           moto tightest (+16.8pp)
 *   SILHOUETTE frame width  99.2%  100.0%   91.4%   >= 60%           moto tightest (+31pp)
 *
 * Notes / tensions (reported to the lead):
 *  - GROUND: the task suggested >= 95%, but the PM-accepted car frames the vehicle
 *    edge-to-edge so its neon body touches the border → 91.70% clean. Recalibrated
 *    to 85%, which still cleanly separates a real white-ground key failure (whole
 *    border coloured → near 0-20% clean) from an accepted edge-to-edge sprite.
 *  - SILHOUETTE aspect: the suggested guess bounds (truck 1.4-2.6 / car 1.3-2.3 /
 *    moto 1.0-2.0) predate the art; the accepted sprites are framed full-width, so
 *    aspect ≈ canvasWidth / contentHeight runs high (4.19 / 3.17 / 2.13). Bounds
 *    recentred on the measured values with margin. Because of full-width framing,
 *    aspect is a WEAK discriminator for "long low sedan vs tall one-box"; the
 *    bbox-fill + bbox-height% metrics (printed each run) carry that signal better,
 *    and are the recommended lever for a future tightening pass.
 *  - "content must fill >= 45% of the bbox height" is implemented as bbox fill
 *    DENSITY (opaque pixels / bbox area >= 45%) — a solid body, not a sparse
 *    wireframe. bbox height as a % of canvas is printed for reference.
 */
