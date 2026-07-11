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
 * ── Why this is a FRAME-DIFF gate (the earlier raw-frame version was invalid) ──
 * A first cut measured the assigned neon hue directly on the single DELIVERING
 * frame. That FAILED to discriminate on the real game: belliard's facade prompt
 * asks for "windows glowing warm orange" (levelArt.json), which sit in the SAME
 * hue band as the truck's orange rim. The metric measured the level art, not the
 * rim — both the old binary plate AND the new gradient scored ~60% intermediate
 * (a ~4pp delta = noise), so the gate would never have caught Bertrand's bug.
 *
 * The fix isolates the rim by construction. We diff TWO frames of the SAME level:
 *   A — after the scene mounts but BEFORE the delivery trigger (vehicle absent),
 *   B — at the DELIVERING banner (vehicle + additive rim present).
 * Cops are frozen VISIBLE and the crosshair is static (no input), so the scene is
 * otherwise identical; PNG screenshots are lossless, so the static background
 * (including the warm windows) cancels to zero. The per-pixel ADDED light
 * `max(0, B - A)` is exactly what the vehicle contributed: the (grayscale) sprite
 * body plus the ADDITIVE neon rim. Filtering that added light to the assigned neon
 * hue leaves the rim alone — the facade can no longer pollute it.
 *
 * Nice property of additive blending: the added rim colour is `alpha · neon`, so
 * its HSV *saturation* is that of the neon hue REGARDLESS of alpha (scaling all
 * channels cancels in s = (max−min)/max), and the alpha itself is recovered from
 * the neon's NON-clamping channel as `alpha = max_c(added_c / neon_c)` (see the
 * DARK-baseline note below and the NEON_RGB comment). So a saturation floor keeps
 * even the faint outer-margin pixels, and the recovered alpha reads the falloff:
 *   - a hard BINARY plate adds a CONSTANT-alpha (≈1) rim → the recovered alphas
 *     pile at the top (a hard spatial cutoff, no ramp) → the intermediate band is
 *     nearly empty.
 *   - a real GRADIENT rim ramps alpha 1→0 → the recovered alphas spread across the
 *     intermediate band → a large intermediate share.
 * Gate: intermediate-alpha share >= HALO_MIN_INTERMEDIATE (default 0.20).
 *
 * CRUCIAL — measure only over a DARK baseline. Additive light `min(255, bg+α·neon)`
 * CLAMPS where the background is bright, so `B−A` UNDER-reads there and its spread
 * no longer reflects alpha (a constant-alpha plate over a busy/bright background
 * manufactures a fake intensity spread — verified, it fooled an earlier cut). We
 * therefore only accept rim pixels whose BASELINE is dark (max channel <=
 * DARK_BG_MAX), where `B−A ≈ α·neon` holds faithfully. The rim margin peeks out
 * AROUND the vehicle over the dark night asphalt, so plenty of pixels qualify; the
 * warm-orange facade windows are bright (excluded) AND static (cancelled anyway).
 *
 * The B-only DELIVERING HUD banner glows NEON_ORANGE (#ff6600 ≈ 24°, inside the
 * orange band; src/render/ui/HUD.tsx) — it is masked out with a top strip so it
 * can't masquerade as rim falloff. Remaining stray added-neon (a transient toast)
 * is rejected by a robust percentile bbox around the dominant rim cluster.
 *
 * Reusable export (checkHaloGradient) called from scripts/e2e-delivery.mjs on its
 * two in-scene screenshot buffers, plus a standalone two-file CLI:
 *
 *   node scripts/check-halo-gradient.mjs --file DELIVERING.png --against PRE.png --neon orange
 *   node scripts/check-halo-gradient.mjs --file B.png --against A.png --neon cyan --json
 *
 * Env overrides (CI can re-tune without a code change, like SPRITE_SET):
 *   HALO_MIN_INTERMEDIATE  intermediate-share floor (default 0.20)
 *   HALO_MIN_NEON_PIXELS   min added-neon pixels needed to judge (default 150)
 *
 * Exit: 0 when the halo shows a gradient falloff; 1 when it does not (or a file is
 * missing / unreadable / the two frames differ in size). Depends on
 * @napi-rs/canvas (same dep as check-sprite-style.mjs), imported lazily so
 * importing this module never throws.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Neon name → assigned hue band (degrees) ──────────────────────────────────
// Mirrors NEON_HEX in src/render/scene/vehicleNeon.ts (the render source of
// truth): orange #FF8C14 (h≈31°), cyan #28F0FF (h≈184°), magenta #FF3CDC
// (h≈311°), green #78FF3C (h≈102°). Bands are centred on those hues, wide enough
// to hold the additive-composited rim but narrow enough not to swallow a
// neighbouring accent.
export const NEON_HUE_BANDS = {
  orange: [15, 50],
  cyan: [165, 210],
  magenta: [285, 335],
  green: [80, 140],
};

// Neon name → RGB, mirroring NEON_HEX in src/render/scene/vehicleNeon.ts. Used to
// RECOVER alpha from the added light: `added_c = min(255, bg_c + α·neon_c) − bg_c`,
// so a channel CLAMPS (under-reads α) exactly when bg_c + α·neon_c > 255. Every
// accent has at least one LOW channel that never clamps over a dark baseline, so
// α = max_c(added_c / neon_c) recovers the true alpha (the unclamped channel wins;
// clamped channels only ever read LOWER). This is why a full-intensity plate can't
// hide behind its saturated max channel (orange r=255 always clamps) — its green
// channel (140) reads α≈1 cleanly and the plate lands in the top bin.
const NEON_RGB = {
  orange: [255, 140, 20],
  cyan: [40, 240, 255],
  magenta: [255, 60, 220],
  green: [120, 255, 60],
};
const ALPHA_CHANNEL_MIN = 16; // ignore near-zero neon channels (noise-amplifying)

// A pixel counts as "changed" only if its total absolute per-channel diff clears
// this floor — kills sub-quantisation jitter. PNG is lossless and the scene is
// frozen, so real static regions diff to exactly 0; this stays low so the faint
// outer edge of a true gradient is still captured.
const DIFF_NOISE = 12;

// Added-neon acceptance: the added light `max(0,B−A)` must be in the assigned hue
// band, saturated enough to be that neon (not a grayscale sprite-body diff), and
// bright enough to clear noise. Because added = alpha·neon, saturation is
// alpha-independent, so this floor never discards faint gradient pixels.
const NEON_SAT_FLOOR = 0.4;
const NEON_VAL_FLOOR = 8 / 255; // added max-channel >= 8 (recovered alpha >= ~0.03)

// Only measure the rim where the BASELINE background is dark: there additive
// light does not clamp, so max(0,B−A) faithfully recovers α·neon. A brighter
// baseline clips the sum and manufactures a fake intensity spread (which fooled
// an earlier constant-alpha plate). Night asphalt around the vehicle is well
// under this; warm windows / neon signs are above it (and cancel in the diff).
const DARK_BG_MAX = 100;

// HUD strip to mask (fraction of height, from the top). The DELIVERING banner +
// integrity bar + top HUD row live here and appear only in B; the banner glows
// NEON_ORANGE. The vehicle rolls in the lower street lane, well below this.
const MASK_TOP_FRAC = 0.18;

// Intensity-histogram shape. Normalised value in (LOW_HI, TOP_LO) is the
// "intermediate" ramp between zero and the neon peak.
const HIST_BINS = 10;
const LOW_HI = 0.15;
const TOP_LO = 0.85;

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
 * Analyse the alpha-gradient falloff of the neon rim isolated by diffing two
 * frames of the same level: `a` (vehicle absent) vs `b` (vehicle + rim present).
 * Pure (no I/O) so it is unit-testable and reusable. Returns measured metrics.
 *
 * @param {{W:number,H:number,d:Uint8ClampedArray|Buffer}} a  baseline frame (pre-trigger)
 * @param {{W:number,H:number,d:Uint8ClampedArray|Buffer}} b  delivering frame
 * @param {string} neonName  assigned neon name (orange|cyan|magenta|green)
 */
export function analyzeHaloDiff(a, b, neonName) {
  if (a.W !== b.W || a.H !== b.H) {
    throw new Error(`frame size mismatch: A ${a.W}x${a.H} vs B ${b.W}x${b.H}`);
  }
  const W = b.W;
  const H = b.H;
  const da = a.d;
  const db = b.d;
  const band = NEON_HUE_BANDS[neonName] ?? NEON_HUE_BANDS.cyan;
  const [hlo, hhi] = band;
  const neonRgb = NEON_RGB[neonName] ?? NEON_RGB.cyan;
  const maskTopY = Math.round(H * MASK_TOP_FRAC);

  // Pass 1: collect ADDED-neon rim pixels with their recovered alpha (v) + xy.
  const xs = [];
  const ys = [];
  const vals = [];
  for (let y = maskTopY; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      // Only trust the diff where the baseline is DARK (no additive clamping).
      if (Math.max(da[o], da[o + 1], da[o + 2]) > DARK_BG_MAX) continue;
      const dr = db[o] - da[o];
      const dg = db[o + 1] - da[o + 1];
      const dbl = db[o + 2] - da[o + 2];
      if (Math.abs(dr) + Math.abs(dg) + Math.abs(dbl) < DIFF_NOISE) continue;
      // Added light only (additive rim brightens); grayscale sprite-body diffs
      // are near-neutral and dropped by the hue/sat test below.
      const ar = dr > 0 ? dr : 0;
      const ag = dg > 0 ? dg : 0;
      const ab = dbl > 0 ? dbl : 0;
      const [h, s, v] = rgbToHsv(ar, ag, ab); // hue/sat identify a neon-rim pixel
      if (v >= NEON_VAL_FLOOR && s >= NEON_SAT_FLOOR && inBand(h, hlo, hhi)) {
        // Recover alpha from the NON-clamping neon channel (max of per-channel
        // ratios): the saturated channel under-reads, the low channel reads true.
        let alpha = 0;
        if (neonRgb[0] >= ALPHA_CHANNEL_MIN) alpha = Math.max(alpha, ar / neonRgb[0]);
        if (neonRgb[1] >= ALPHA_CHANNEL_MIN) alpha = Math.max(alpha, ag / neonRgb[1]);
        if (neonRgb[2] >= ALPHA_CHANNEL_MIN) alpha = Math.max(alpha, ab / neonRgb[2]);
        if (alpha > 1) alpha = 1;
        xs.push(x);
        ys.push(y);
        vals.push(alpha);
      }
    }
  }

  const rawCount = xs.length;

  // Robust bbox around the dominant rim cluster (p5..p95) rejects a stray added-
  // neon outlier (e.g. a transient toast) outside the vehicle.
  let bbox = { x0: 0, y0: maskTopY, x1: W - 1, y1: H - 1, located: false };
  if (rawCount >= MIN_NEON_PIXELS) {
    const sx = [...xs].sort((p, q) => p - q);
    const sy = [...ys].sort((p, q) => p - q);
    bbox = {
      x0: percentile(sx, 0.05),
      y0: percentile(sy, 0.05),
      x1: percentile(sx, 0.95),
      y1: percentile(sy, 0.95),
      located: true,
    };
  }

  // Keep only rim pixels inside the cluster bbox.
  const intensities = [];
  for (let i = 0; i < rawCount; i++) {
    if (xs[i] >= bbox.x0 && xs[i] <= bbox.x1 && ys[i] >= bbox.y0 && ys[i] <= bbox.y1) {
      intensities.push(vals[i]);
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
    let intermediate = 0;
    let top = 0;
    let low = 0;
    for (const v of intensities) {
      // v ≈ recovered alpha in ABSOLUTE terms (added max channel / 255), valid
      // because we only kept dark-baseline pixels. No min/max normalisation —
      // that would rescale a plate's clamp-jitter into a fake ramp.
      const bin = Math.min(HIST_BINS - 1, Math.floor(v * HIST_BINS));
      hist[bin]++;
      if (v >= TOP_LO) top++;
      else if (v <= LOW_HI) low++;
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
    maskTopY,
    bbox,
    rawCount,
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
  let mod;
  try {
    mod = await import("@napi-rs/canvas");
  } catch {
    throw new Error(
      "@napi-rs/canvas is required for the halo gradient check " +
        "(install: npm i --no-save --legacy-peer-deps @napi-rs/canvas@1.0.2)",
    );
  }
  const { loadImage, createCanvas } = mod;
  const img = await loadImage(source);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { W, H, d: ctx.getImageData(0, 0, W, H).data };
}

/**
 * Load the two frames (file paths OR Buffers OR pre-decoded pixels) and evaluate
 * the halo gradient on their diff. `file`/`buffer`/`pixels` = the DELIVERING
 * frame (B); `against`/`baselineBuffer`/`baselinePixels` = the pre-trigger frame
 * (A). Prints the measured numbers unless `quiet`. Returns
 * `{ pass, metrics, checks }`.
 */
export async function checkHaloGradient({
  file,
  buffer,
  pixels,
  against,
  baselineBuffer,
  baselinePixels,
  neon,
  quiet = false,
}) {
  const neonName = neon ?? "cyan";
  const b = pixels ?? (await decodePixels(buffer ?? file));
  const a = baselinePixels ?? (await decodePixels(baselineBuffer ?? against));
  const metrics = analyzeHaloDiff(a, b, neonName);
  const { pass, checks } = evaluateHalo(metrics);

  if (!quiet) {
    const label = file ? path.relative(ROOT, path.resolve(process.cwd(), file)) : "<buffer>";
    const base = against ? path.relative(ROOT, path.resolve(process.cwd(), against)) : "<buffer>";
    console.log(
      `\n[halo-gradient] ${pass ? "PASS" : "FAIL"}  ${label}  vs baseline ${base}  ` +
        `(${metrics.W}x${metrics.H}, neon=${neonName}, hue ${metrics.hueBand[0]}..${metrics.hueBand[1]}°)`,
    );
    console.log(
      `    maskTopY=${metrics.maskTopY} located=${metrics.bbox.located} ` +
        `bbox=[${metrics.bbox.x0},${metrics.bbox.y0}..${metrics.bbox.x1},${metrics.bbox.y1}] ` +
        `addedNeon raw=${metrics.rawCount} inBbox=${metrics.neonCount} ` +
        `recoveredAlpha=${metrics.minI.toFixed(3)}..${metrics.maxI.toFixed(3)}`,
    );
    console.log(
      `    alpha histogram (0→1, ${HIST_BINS} bins): [${metrics.hist.join(", ")}]  ` +
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
  const ai = args.indexOf("--against");
  const ni = args.indexOf("--neon");
  const asJson = args.includes("--json");

  const file = fi !== -1 ? args[fi + 1] : null;
  const against = ai !== -1 ? args[ai + 1] : null;
  const neon = ni !== -1 ? args[ni + 1] : "orange";

  if (!file || !against) {
    console.error(
      "usage: node scripts/check-halo-gradient.mjs --file DELIVERING.png --against PRE_TRIGGER.png " +
        "--neon <orange|cyan|magenta|green> [--json]",
    );
    process.exit(2);
  }
  for (const f of [file, against]) {
    if (!fs.existsSync(path.resolve(process.cwd(), f))) {
      console.error(`[halo-gradient] MISSING file: ${f}`);
      process.exit(1);
    }
  }
  if (!NEON_HUE_BANDS[neon]) {
    console.error(
      `[halo-gradient] unknown --neon "${neon}" (known: ${Object.keys(NEON_HUE_BANDS).join(", ")})`,
    );
    process.exit(2);
  }

  const { pass, metrics } = await checkHaloGradient({
    file: path.resolve(process.cwd(), file),
    against: path.resolve(process.cwd(), against),
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
 * ── HONESTY NOTE (invalidated first attempt) ─────────────────────────────────
 * The first version of this gate measured the assigned neon hue on the SINGLE
 * DELIVERING frame. It was invalidated on real builds: belliard's facade has
 * "windows glowing warm orange" (levelArt.json) in the truck's orange band, so
 * the metric read the level art, not the rim. Measured (1280x720, belliard):
 *   OLD binary-alpha plate  → 60.9% intermediate  (would PASS — WRONG)
 *   NEW gradient bake        → 65.1% intermediate  (PASS)
 * A ~4pp delta is noise; the gate could not have caught Bertrand's bug. That
 * approach is DISCARDED. This gate diffs A (pre-trigger) vs B (DELIVERING) so the
 * static facade cancels and only the vehicle's added rim light is measured.
 *
 * ── Frame-diff metric — MEASURED numbers ─────────────────────────────────────
 * GREEN, real build (live preview, belliard, 1280x720, truck→orange; the NEW
 * gradient bake from the parallel render lane): intermediate-alpha share 69.9%
 * (recovered alpha 0.03..1.0, 4226 rim pixels in a tight street-lane cluster
 * bbox≈[509,582..768,656]) → PASS, ~50pp above the floor.
 *
 * RED, synthetic (no paired pre-trigger frame exists for the OLD bake — only one
 * saved DELIVERING frame — so the plate is validated by construction): a binary
 * plate (constant α, hard cutoff) and a gradient ((1−d/m)²) are additively
 * composited onto the SAME real dark street crop from the saved old-bake frame,
 * then diffed against that crop:
 *
 *   rim                          intermediate-alpha share   verdict (floor 20%)
 *   binary plate (constant α)    0.0%                       FAIL  ← the shipped bug
 *   gradient ((1−d/m)²)          31.9%                      PASS
 *   real NEW gradient (live)     69.9%                      PASS
 *
 * The separation is wide and STRUCTURAL: a constant-α plate recovers α≈1 for every
 * rim pixel (a spatial step, no ramp) → the whole population lands in the top alpha
 * bin, intermediate ≈ 0; a real falloff spreads α smoothly 1→0 → a big intermediate
 * band. 20% (the safe low end of the task's 20–25% band) sits far above the plate
 * (0%) and far below either gradient (32% / 70%), so it kills the plate without
 * false-failing a genuine glow. Do NOT lower the floor to "pass" a plate — that
 * re-admits the exact bug. Every run prints the histogram + shares so this table
 * stays honest as the render evolves.
 *
 * ── Why the earlier intensity-normalisation was replaced by alpha recovery ─────
 * Normalising added intensity to the observed min/max let a plate over a bright or
 * busy background LOOK like a ramp: additive light clamps (min(255, bg+α·neon)), so
 * `B−A` under-reads where bg is bright and the clamp-jitter, once rescaled, faked
 * an intermediate spread (a plate scored 34–72% — it PASSED, wrong). Two fixes make
 * it robust: (1) only measure over a DARK baseline (max channel <= 100), where the
 * diff is trustworthy; (2) recover α = max_c(added_c / neon_c) from the neon's
 * NON-clamping (low) channel — orange's r=255 always clamps, but its g=140 reads α
 * cleanly. With both, a plate recovers α≡1 and correctly FAILS.
 *
 * ── Robustness notes ──────────────────────────────────────────────────────────
 *  - Additive rim colour is α·neon, so its saturation is the neon's regardless of α
 *    → a 0.4 sat floor keeps the faint outer pixels (the falloff evidence) while
 *    rejecting grayscale sprite-body diffs.
 *  - The B-only DELIVERING HUD banner glows NEON_ORANGE (#ff6600, in-band); it is
 *    masked by a top strip (18% of height). A vanishing toast in A cancels via the
 *    one-directional max(0,B−A) added-light test; a new toast is rejected by the
 *    p5..p95 cluster bbox around the dominant rim.
 */
