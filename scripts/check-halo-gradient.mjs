#!/usr/bin/env node
/**
 * HALO GRADIENT GATE (story-halo-alpha-composite-gate, AC4) — the mechanical
 * regression lock for the vehicle neon halo.
 *
 * Context: the delivery-vehicle neon rim is composed at RUNTIME in src/render
 * (ADR-0011, src/render/scene/vehicleNeon.ts) — it does NOT exist in the
 * delivered PNG. So neither the ASSET gate (scripts/check-sprite-style.mjs, which
 * judges the pure-B&W source sprite) nor a byte-size gate can ever see it. The
 * rim shipped with BINARY alpha — a hard opaque neon plate, no falloff — and
 * nothing caught it because no gate looks at the *composed in-game* frame.
 *
 * This gate closes that gap. It analyses a REAL delivery-scene screenshot (the
 * frame the e2e-delivery gate already captures with the truck + rim visible) and
 * FAILS if the halo shows no alpha-gradient falloff — i.e. a hard binary plate
 * instead of a glow bleeding off the vehicle.
 *
 * ── The metric (calibration table at the bottom; measured numbers printed every
 *    run so a re-tune is informed, exactly like check-sprite-style.mjs) ─────────
 *
 *   1. LOCATE the halo. Collect pixels in the vehicle's assigned neon hue band
 *      (truck→orange, car→cyan, moto→magenta — read from levelArt.json, never
 *      hardcoded blindly) that pass a STRICT saturation/value floor. Their robust
 *      x/y spread (10th–90th percentile, padded) is the halo bounding box. This
 *      rejects unrelated neon (street signs, warm windows up on the facade) and
 *      keeps the metric stable by focusing on the densest neon cluster — the rim.
 *
 *   2. MEASURE the falloff. Inside that bbox, re-collect neon-hue pixels with a
 *      LOOSE saturation floor (crucial: the FAINT outer-margin pixels of a real
 *      gradient are exactly the low-saturation ones — a strict floor would throw
 *      away the very evidence of a falloff). Their intensity (HSV value) is
 *      normalised against the observed min/max WITHIN this neon population — not
 *      an absolute scale — because AdditiveBlending composites the rim over a
 *      varying street background, so only relative intensity is meaningful.
 *
 *   3. DISCRIMINATE. Bucket the normalised intensities:
 *        - a hard BINARY plate is bimodal — the saturated neon pixels sit at
 *          near-max intensity only (solid full-neon over dark asphalt); there is
 *          no ramp, so the intermediate band is nearly empty and the top bin
 *          dominates.
 *        - a real GRADIENT halo spreads a meaningful share of pixels across the
 *          INTERMEDIATE intensities between the background floor and the peak.
 *      Gate: the intermediate-intensity share must be >= HALO_MIN_INTERMEDIATE
 *      (default 0.20 — the safe low end of the task's 20–25% range; a binary
 *      plate scores a few % here, a gradient 30–60%, so 20% cleanly separates
 *      them without false-failing a genuine glow). A degenerate near-flat neon
 *      population (max≈min intensity) is a plate by definition and fails.
 *
 * Structured as a reusable export (checkHaloGradient) called from
 * scripts/e2e-delivery.mjs on the in-scene screenshot buffer, AND a standalone
 * CLI over any PNG so a captured frame can be re-checked offline:
 *
 *   node scripts/check-halo-gradient.mjs --file shot.png --neon orange
 *   node scripts/check-halo-gradient.mjs --file shot.png --neon cyan --json
 *
 * Env overrides (CI can re-tune without a code change, like SPRITE_SET):
 *   HALO_MIN_INTERMEDIATE  intermediate-share floor (default 0.20)
 *   HALO_MIN_NEON_PIXELS   min neon pixels needed to judge (default 150)
 *
 * Exit: 0 when the halo shows a gradient falloff; 1 when it does not (or the file
 * is missing / unreadable). Depends on @napi-rs/canvas (same dep as
 * check-sprite-style.mjs), imported lazily so importing this module never throws.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Neon name → assigned hue band (degrees) + reference hue ──────────────────
// Mirrors NEON_HEX in src/render/scene/vehicleNeon.ts (the render source of
// truth): orange #FF8C14 (h≈31°), cyan #28F0FF (h≈184°), magenta #FF3CDC
// (h≈311°), green #78FF3C (h≈102°). Bands are centred on those hues, wide enough
// to hold the additive-composited rim (which shifts hue slightly over the street
// background) but narrow enough not to swallow a neighbouring accent.
export const NEON_HUE_BANDS = {
  orange: [15, 50],
  cyan: [165, 210],
  magenta: [285, 335],
  green: [80, 140],
};

// STRICT floors — used ONLY to LOCATE the rim cluster (find the vehicle). High
// enough to ignore faint background haze so the bbox lands on the real rim.
const LOCATE_SAT = 0.5;
const LOCATE_VAL = 0.4;

// LOOSE floors — used to MEASURE the falloff inside the located bbox. Deliberately
// low: the faint outer-margin pixels of a true gradient are low-saturation, and
// dropping them would erase the evidence of the falloff we are testing for.
const MEASURE_SAT = 0.22;
const MEASURE_VAL = 0.12;

// Intensity-histogram shape. Normalised value in (LOW_HI, TOP_LO) is the
// "intermediate" ramp between the background floor and the neon peak.
const HIST_BINS = 10;
const LOW_HI = 0.15; // below this normalised intensity = background floor
const TOP_LO = 0.85; // above this = the neon peak / plate

// Calibrated / env-tunable gate thresholds (see calibration table).
const MIN_INTERMEDIATE = numEnv("HALO_MIN_INTERMEDIATE", 0.2);
const MIN_NEON_PIXELS = numEnv("HALO_MIN_NEON_PIXELS", 150);

function numEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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

function inBand(h, lo, hi) {
  return h >= lo && h <= hi;
}

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const i = Math.min(sortedAsc.length - 1, Math.max(0, Math.round(p * (sortedAsc.length - 1))));
  return sortedAsc[i];
}

/**
 * Analyse a decoded RGBA frame for the neon halo's alpha-gradient falloff.
 * Pure (no I/O) so it is unit-testable and reusable. Returns the measured metrics
 * plus the pass/fail checks; the caller decides how to report.
 *
 * @param {{W:number,H:number,d:Uint8ClampedArray|Buffer}} px  decoded RGBA pixels
 * @param {string} neonName  assigned neon name (orange|cyan|magenta|green)
 */
export function analyzeHalo(px, neonName) {
  const { W, H, d } = px;
  const band = NEON_HUE_BANDS[neonName] ?? NEON_HUE_BANDS.cyan;
  const [hlo, hhi] = band;

  // ── Stage 1: LOCATE the rim cluster via strict neon pixels ─────────────────
  const xs = [];
  const ys = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const [h, s, v] = rgbToHsv(d[o], d[o + 1], d[o + 2]);
      if (v >= LOCATE_VAL && s >= LOCATE_SAT && inBand(h, hlo, hhi)) {
        xs.push(x);
        ys.push(y);
      }
    }
  }

  let bbox = { x0: 0, y0: 0, x1: W - 1, y1: H - 1, located: false };
  if (xs.length >= MIN_NEON_PIXELS) {
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    // Robust extent (p10..p90) rejects stray neon outliers; pad by 8% of frame.
    const padX = Math.round(W * 0.08);
    const padY = Math.round(H * 0.08);
    bbox = {
      x0: Math.max(0, percentile(xs, 0.1) - padX),
      y0: Math.max(0, percentile(ys, 0.1) - padY),
      x1: Math.min(W - 1, percentile(xs, 0.9) + padX),
      y1: Math.min(H - 1, percentile(ys, 0.9) + padY),
      located: true,
    };
  }

  // ── Stage 2: MEASURE falloff — loose neon pixels inside the bbox ────────────
  const intensities = [];
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const o = (y * W + x) * 4;
      const [h, s, v] = rgbToHsv(d[o], d[o + 1], d[o + 2]);
      if (v >= MEASURE_VAL && s >= MEASURE_SAT && inBand(h, hlo, hhi)) {
        intensities.push(v);
      }
    }
  }

  const neonCount = intensities.length;
  let minI = 0;
  let maxI = 0;
  let intermediateShare = 0;
  let topBinShare = 0;
  let lowBinShare = 0;
  const hist = new Array(HIST_BINS).fill(0);

  if (neonCount > 0) {
    minI = Math.min(...intensities);
    maxI = Math.max(...intensities);
    const range = maxI - minI;
    let intermediate = 0;
    let top = 0;
    let low = 0;
    for (const v of intensities) {
      // Normalise intensity RELATIVE to the observed neon population (additive
      // blending means only relative intensity is meaningful).
      const n = range > 1e-6 ? (v - minI) / range : 1; // flat population → all peak
      const bin = Math.min(HIST_BINS - 1, Math.floor(n * HIST_BINS));
      hist[bin]++;
      if (n >= TOP_LO) top++;
      else if (n <= LOW_HI) low++;
      else intermediate++;
    }
    intermediateShare = intermediate / neonCount;
    topBinShare = top / neonCount;
    lowBinShare = low / neonCount;
  }

  return {
    W,
    H,
    neonName,
    hueBand: [hlo, hhi],
    bbox,
    strictCount: xs.length,
    neonCount,
    minI,
    maxI,
    intensityRange: maxI - minI,
    intermediateShare,
    topBinShare,
    lowBinShare,
    hist,
  };
}

/** Turn measured metrics into pass/fail checks (calibrated thresholds). */
export function evaluateHalo(m) {
  const checks = [
    {
      name: "NEON pixels present",
      ok: m.neonCount >= MIN_NEON_PIXELS,
      got: String(m.neonCount),
      need: `>= ${MIN_NEON_PIXELS}`,
    },
    {
      name: "GRADIENT intermediate share",
      ok: m.neonCount >= MIN_NEON_PIXELS && m.intermediateShare >= MIN_INTERMEDIATE,
      got: `${(m.intermediateShare * 100).toFixed(2)}%`,
      need: `>= ${(MIN_INTERMEDIATE * 100).toFixed(0)}% (binary plate ⇒ near 0)`,
    },
  ];
  return { pass: checks.every((c) => c.ok), checks };
}

async function decodePixels(source) {
  let loadImage;
  try {
    ({ loadImage } = await import("@napi-rs/canvas"));
  } catch {
    throw new Error(
      "@napi-rs/canvas is required for the halo gradient check " +
        "(install: npm i --no-save --legacy-peer-deps @napi-rs/canvas@1.0.2)",
    );
  }
  const { createCanvas } = await import("@napi-rs/canvas");
  const img = await loadImage(source);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { W, H, d: ctx.getImageData(0, 0, W, H).data };
}

/**
 * Load a screenshot (file path OR Buffer OR pre-decoded pixels) and evaluate the
 * halo gradient. Prints the measured numbers unless `quiet`. Returns
 * `{ pass, metrics, checks }` so a caller (e2e-delivery) can fold it into its own
 * problem list.
 */
export async function checkHaloGradient({ file, buffer, pixels, neon, quiet = false }) {
  const neonName = neon ?? "cyan";
  const px = pixels ?? (await decodePixels(buffer ?? file));
  const metrics = analyzeHalo(px, neonName);
  const { pass, checks } = evaluateHalo(metrics);

  if (!quiet) {
    const label = file ? path.relative(ROOT, path.resolve(process.cwd(), file)) : "<buffer>";
    console.log(
      `\n[halo-gradient] ${pass ? "PASS" : "FAIL"}  ${label}  ` +
        `(${metrics.W}x${metrics.H}, neon=${neonName}, hue ${metrics.hueBand[0]}..${metrics.hueBand[1]}°)`,
    );
    console.log(
      `    located=${metrics.bbox.located} bbox=[${metrics.bbox.x0},${metrics.bbox.y0}..${metrics.bbox.x1},${metrics.bbox.y1}] ` +
        `strict=${metrics.strictCount} neon=${metrics.neonCount} ` +
        `intensity=${metrics.minI.toFixed(3)}..${metrics.maxI.toFixed(3)} (range ${metrics.intensityRange.toFixed(3)})`,
    );
    console.log(
      `    intensity histogram (min→max, ${HIST_BINS} bins): [${metrics.hist.join(", ")}]  ` +
        `low=${(metrics.lowBinShare * 100).toFixed(1)}% mid=${(metrics.intermediateShare * 100).toFixed(1)}% top=${(metrics.topBinShare * 100).toFixed(1)}%`,
    );
    for (const c of checks) {
      console.log(`    ${c.ok ? "ok " : "XX "}${c.name.padEnd(28)} ${c.got}  (need ${c.need})`);
    }
  }

  return { pass, metrics, checks };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function isMain() {
  return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
}

async function main() {
  const args = process.argv.slice(2);
  const fi = args.indexOf("--file");
  const ni = args.indexOf("--neon");
  const asJson = args.includes("--json");

  const file = fi !== -1 ? args[fi + 1] : null;
  const neon = ni !== -1 ? args[ni + 1] : "orange";

  if (!file) {
    console.error("usage: node scripts/check-halo-gradient.mjs --file shot.png --neon <orange|cyan|magenta|green> [--json]");
    process.exit(2);
  }
  if (!fs.existsSync(path.resolve(process.cwd(), file))) {
    console.error(`[halo-gradient] MISSING file: ${file}`);
    process.exit(1);
  }
  if (!NEON_HUE_BANDS[neon]) {
    console.error(`[halo-gradient] unknown --neon "${neon}" (known: ${Object.keys(NEON_HUE_BANDS).join(", ")})`);
    process.exit(2);
  }

  const { pass, metrics } = await checkHaloGradient({
    file: path.resolve(process.cwd(), file),
    neon,
    quiet: asJson,
  });

  if (asJson) console.log(JSON.stringify({ pass, metrics }, null, 2));
  process.exit(pass ? 0 : 1);
}

if (isMain()) {
  main().catch((e) => {
    console.error("[halo-gradient] Fatal:", e.message);
    process.exit(1);
  });
}

/*
 * CALIBRATION TABLE.
 *
 * The metric is intentionally RELATIVE (normalised within the neon-hue
 * population) because AdditiveBlending composites the rim over a varying street
 * background — an absolute intensity scale would drift with the backdrop.
 *
 * Expected separation (to be confirmed on the first CI run — the render fix
 * lands in a parallel lane; every run prints the measured numbers so this table
 * gets filled in with on-frame values, exactly like check-sprite-style.mjs):
 *
 *   frame                        intermediate share   verdict (floor 20%)
 *   binary-alpha plate (old)     ~0–8%                FAIL  ← the shipped bug
 *   alpha-gradient halo (AC1)    ~30–60%              PASS
 *
 * Why 20% (the low end of the task's 20–25% band): a binary plate has NO ramp —
 * its saturated neon pixels pile into the top intensity bin, leaving the
 * intermediate band nearly empty. A real falloff spreads pixels smoothly from the
 * background floor to the peak, so its intermediate share is several times the
 * floor. 20% sits well above the plate (~<10%) and well below the gradient
 * (~>30%), so it kills the plate while never false-failing a genuine glow. Raise
 * it toward 25% only after a green CI run confirms the gradient's real share with
 * margin. Do NOT lower it to "pass" a plate — that re-admits the exact bug this
 * gate exists to catch.
 *
 * Two-stage sat floors: LOCATE uses a STRICT floor (0.5) so the bbox lands on the
 * real rim and ignores background haze; MEASURE uses a LOOSE floor (0.22) so the
 * faint outer-margin pixels of a true gradient — the low-saturation ones — are
 * counted. A single strict floor would discard the very evidence of the falloff.
 */
