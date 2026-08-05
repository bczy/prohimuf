#!/usr/bin/env node
/**
 * PHOTO QTE PLATE — SCRIPTED SIGNAGE RETOUCH (STORY-QTE-PHOTO-PAPARAZZI).
 *
 * Bertrand's decision (2026-08-05), after two opposite generative-edit failures on the
 * SAME instruction ("blank the signage"): plate_edit_a over-generalised and blanked every
 * glazed surface (a4f4f82e), then a re-roll of the identical prompt did nothing at all
 * (4083d6bc). Two tirages, two opposite failure modes ⇒ the edit endpoint is not
 * controllable at this granularity (no strength/guidance/fidelity knob exists on
 * POST /v1/images/edits — checked APIDOCS.md, not assumed; see gen-photo-sprites.mjs).
 * Blanking rectangular, well-delimited sign bands is a DETERMINISTIC image operation — it
 * does not need a generative model at all. This script does it directly on pixels, the
 * same way retouch-belliard-decor.mjs's xerox pass fixes a register defect without a
 * re-roll: measured, documented, reproducible.
 *
 * FIVE TARGETS on `plate-v2-reference.png` (2048x1152), located by inspection (crops with
 * a coordinate grid overlaid, not eyeballed off the full plate, and not off a
 * downscaled preview — see CALIBRATION below):
 *   1. `laindorete` — the fascia band lettered "LAINDORETE" above the right-hand shopfront.
 *   2. `gytten` — the small framed paper notice lettered "GYTTEN" inside the left window.
 *   3. `coolam` — the sign text "Coolam" painted on the interior back wall of the other
 *      left window.
 *   4. `bcra` — a second lettering ("Bcra."/"Bero") on the display window pane above the
 *      row of exhibited chairs, right-hand shopfront corner. Missed by the first pass
 *      because that inspection worked off a downscaled preview of the plate — at 1:1 the
 *      lettering is unmistakable; at preview scale it reads as glass glare.
 *   5. `fascia-glyphs` — a row of small gibberish glyphs on the fascia trim strip directly
 *      below the "LAINDORETE" band and above the shutter, running most of the shopfront's
 *      width. Same miss cause as `bcra`: legible at 1:1, illegible at preview scale — this
 *      row sits one eye-scan below LAINDORETE, exactly where a player's eye lands next.
 *
 * CALIBRATION WARNING — READ BEFORE TOUCHING `TARGETS`: every rect below is a set of pixel
 * coordinates measured on ONE SPECIFIC RASTER, `plate-v2-reference.png` as committed. They
 * are not proportional/relative and do not "follow" the artwork if the plate is ever
 * regenerated (new pollinations tirage, re-crop, upscale, style pass, etc.) — a
 * regenerated plate can move or resize every shopfront, and these rects would then either
 * miss the new lettering entirely or blank an unrelated patch of wall, SILENTLY (the
 * script would still run and still "succeed"). A silently-misaligned retouch script is
 * worse than no retouch script at all — it launders a defect into looking fixed. Two
 * guards enforce that:
 *   - `EXPECTED_SOURCE_SHA256` pins the exact source bytes this calibration was measured
 *     against. A mismatch aborts before touching a single pixel (bypass with
 *     `--allow-recalibration` only once you have re-measured every rect against the new
 *     source and updated this hash — never to silence the check on stale coordinates).
 *   - Each target's `rect` is required to contain real contrast (a min/max luma spread
 *     above `MIN_LETTERING_CONTRAST`) before it is painted — the same statistical
 *     footprint real ink lettering leaves against a flatter surface. A rect that measures
 *     as flat (because the plate moved and the rect now lands on plain wall) is skipped
 *     with a loud warning instead of blanking the wrong patch.
 *
 * Concept-artist's clause for the generative route applies just as much to a retouch: "the
 * blanked panel must carry the same ink hatching and the same grey tone as the surface it
 * is fixed to" — a flat clean rectangle on a textured wall is as much an AI tell as the
 * gibberish lettering it replaces. So this is NOT a flat fill: each target's replacement
 * tone and grain are MEASURED from a calibrated sample strip of the same surface next to
 * it (never from the target rect itself, which is the lettering, and never from an
 * unrelated part of the picture, which risks a different light/material) and then
 * regenerated as a flat tone + the same deterministic clumpy "toner" grain algorithm
 * retouch-belliard-decor.mjs already established for this house style (mulberry32 PRNG,
 * darken-only multiply grain — never a lightening pass, matching the bible's toner law).
 *
 * IDEMPOTENT BY CONSTRUCTION: every sample strip lies OUTSIDE its own target rect, so a
 * second run measures the same (already-blanked) surroundings and repaints the same flat
 * tone + the same seeded grain — a true fixed point, not a re-roll or a re-darken. (Note:
 * the contrast guard above means a second run on an already-blanked plate will now SKIP
 * every target rather than repaint it, since a correctly blanked rect measures flat by
 * design — which is also a true fixed point, just a cheaper one.)
 *
 * Usage:
 *   node scripts/retouch-photoqte-signage.mjs                # retouch (only if not already fixed-point)
 *   node scripts/retouch-photoqte-signage.mjs --out <path>    # write to a different file (debugging)
 *   node scripts/retouch-photoqte-signage.mjs --dry-run       # log the measured tone/grain, write nothing
 *   node scripts/retouch-photoqte-signage.mjs --allow-recalibration  # skip the source hash pin
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.resolve(ROOT, "public/assets/photoqte/plate-v2-reference.png");

// Pinned to the exact `plate-v2-reference.png` this calibration was measured against —
// see the CALIBRATION WARNING above. Recompute with `shasum -a 256` after a deliberate
// re-measure, never to make a stale-coordinates warning go away.
const EXPECTED_SOURCE_SHA256 = "a2c353d6c0525938cbf18b0f4b2314006eb5bb4fc23293de0d9018030d2b7ba4";

// Minimum (max-min) luma spread a target rect must contain to be treated as real
// lettering worth blanking. Real ink strokes on a flat wall/glass ground read as a wide
// spread (near-black strokes on a near-white or mid-grey ground); a rect that has drifted
// onto plain textured wall measures a narrow spread. House toner grain alone (GRAIN_AMP
// 0.14 of the local tone) stays well under this on a mid-grey ground, so the guard doesn't
// false-positive on ordinary wall texture.
const MIN_LETTERING_CONTRAST = 40;

// Grain constants — same values and same darken-only-multiply idiom as
// retouch-belliard-decor.mjs's XEROX_GRAIN_AMP/XEROX_GRAIN_BLOCK (house toner law).
const GRAIN_AMP = 0.14;
const GRAIN_BLOCK = 3;

/** Deterministic PRNG (mulberry32) — same algorithm as retouch-belliard-decor.mjs, so the
 * grain reads as the same "ink" even though the two scripts don't share a module. */
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Each target: `rect` is the region to blank; `sampleRects` are calibrated strips of the
 * SAME surface (never the rect itself) the tone/grain are measured from. `seed` is the
 * grain PRNG seed — one per target, so the three patches don't share an identical noise
 * pattern (which itself would be a tell — real toner grain is not periodic across a
 * building's different signs).
 */
// Rects located by inspection: crops with a coordinate grid overlaid (not eyeballed off
// the full 2048x1152 plate), re-verified by cropping the exact rect back out of the source
// and confirming it fully contains the lettering including descenders/paper border.
const TARGETS = [
  {
    key: "laindorete",
    rect: { x0: 1600, y0: 600, x1: 2048, y1: 668 },
    // The fascia's own blank trim strip further above the lettering, same stone, same
    // shot — kept clear of the feathered edge (rect top minus FEATHER_PX) so the sample
    // is never contaminated by the patch's own blend on a re-run (idempotency).
    sampleRects: [{ x0: 1600, y0: 580, x1: 2048, y1: 594 }],
    seed: 130501,
  },
  {
    key: "gytten",
    // Covers the paper's own drawn frame border too, not just the interior lettering —
    // the paper (and the lettering on it) is wider than a first pass assumed (re-cropped
    // twice to find its true extent: x122-283, y728-768).
    rect: { x0: 118, y0: 724, x1: 286, y1: 772 },
    // The wall around the paper, immediately above and below it but outside the feathered
    // rect — the wall is the correct sample surface here (not the paper's own material):
    // blanking the paper into plain wall removes the sign without leaving an odd blank
    // rectangle floating on the wall where a paper notice used to be.
    sampleRects: [
      { x0: 118, y0: 706, x1: 286, y1: 716 },
      { x0: 118, y0: 780, x1: 286, y1: 790 },
    ],
    seed: 130502,
  },
  {
    key: "coolam",
    rect: { x0: 405, y0: 698, x1: 585, y1: 740 },
    // The interior back wall directly above the lettering, before the illustrated figures
    // start lower in the same window; kept clear of the feathered edge.
    sampleRects: [{ x0: 405, y0: 680, x1: 570, y1: 692 }],
    seed: 130503,
  },
  {
    key: "bcra",
    // The window pane above the exhibited chairs, right-hand shopfront corner. Covers the
    // full "Bcra."-like lettering plus the stray mark just past it, re-verified by cropping
    // the exact rect back out of the source at 10x.
    rect: { x0: 1435, y0: 651, x1: 1540, y1: 671 },
    // Clear glass in the same pane, below the lettering and above the pane's lower frame
    // bar (outside the feathered edge) — glass is the correct sample surface here, same as
    // `gytten`'s wall: the lettering sits ON a plain surface, not on its own material.
    sampleRects: [{ x0: 1405, y0: 679, x1: 1545, y1: 687 }],
    seed: 130504,
  },
  {
    key: "fascia-glyphs",
    // The fascia trim strip below "LAINDORETE" and above the shutter — a row of small
    // gibberish glyphs running most of the shopfront's width. Right edge stops short of
    // the plate border, left edge stops short of the corner return, both re-verified by
    // cropping the exact rect back out of the source (first pass at x0=1642 left a glyph
    // stroke uncovered at x~1614-1642 — re-cropped at 15x to find the true left extent).
    rect: { x0: 1608, y0: 672, x1: 2008, y1: 690 },
    // The same trim strip continues past the glyphs to the right, plain and undecorated —
    // the correct sample surface (same material, same light, same shot) without touching
    // the plate's right border.
    sampleRects: [{ x0: 2010, y0: 676, x1: 2044, y1: 692 }],
    seed: 130505,
  },
];

// Blend margin, px: the biggest remaining "AI tell" after tone-matching the fill is a
// perfectly straight geometric edge no real photograph or ink drawing has — a real sign
// board has a frame, a real patch of wall doesn't stop on a ruler line. Feathering the
// patch into the original pixels over a few px removes that hard edge without touching the
// measured tone (the feather blends INTO the original surrounding pixels, which are
// already the same surface the tone was sampled from).
const FEATHER_PX = 6;

/** Median luma over one or more sample rects — median, not mean, so the odd stray dark
 * pixel at a sample strip's edge (an ink stroke bleeding past its own bbox) can't drag the
 * measured tone down the way a mean would. */
function measureSampleLuma(img, sampleRects) {
  const values = [];
  for (const { x0, y0, x1, y1 } of sampleRects) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * img.width + x) * 4;
        values.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
      }
    }
  }
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  // Robust spread (median absolute deviation, scaled) — used as the grain's own
  // amplitude clamp so a target sampled from an already-flat surface doesn't invent noise
  // that wasn't there.
  const deviations = values.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)];
  return { median, mad };
}

/** Fill `rect` with a flat tone at `median` plus the same clumpy multiply-only toner grain
 * as the rest of the house style, amplitude bounded by the surface's own measured spread
 * (`mad`) so a naturally flatter surface (e.g. the paper notice) gets a naturally flatter
 * fill instead of the fascia's own grain amplitude pasted onto it. */
function paintMatchedPatch(img, rect, median, mad, seed) {
  const rand = mulberry32(seed);
  const { x0, y0, x1, y1 } = rect;
  // The noise field covers the FEATHERED (expanded) area too, so the grain itself is
  // continuous across the blend boundary instead of starting/stopping at the hard rect.
  const fx0 = x0 - FEATHER_PX;
  const fy0 = y0 - FEATHER_PX;
  const fx1 = x1 + FEATHER_PX;
  const fy1 = y1 + FEATHER_PX;
  const w = fx1 - fx0;
  const h = fy1 - fy0;
  const bw = Math.ceil(w / GRAIN_BLOCK);
  const bh = Math.ceil(h / GRAIN_BLOCK);
  const blockNoise = new Float32Array(bw * bh);
  for (let i = 0; i < blockNoise.length; i++) blockNoise[i] = rand() * 2 - 1; // [-1,1]

  // MAD of a normal-ish distribution is ~0.6745*sigma; invert that to get an amplitude in
  // the same units as GRAIN_AMP (a fraction of `median`), clamped so a perfectly flat
  // sample (mad≈0, e.g. a clean paper margin) still gets a faint amplitude rather than a
  // dead, obviously-synthetic flat rectangle.
  const amp = Math.min(GRAIN_AMP, Math.max(0.02, (mad / 0.6745 / Math.max(median, 1)) * 1.5));

  for (let y = fy0; y < fy1; y++) {
    for (let x = fx0; x < fx1; x++) {
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      // Distance OUTSIDE the core rect on each axis (0 if inside) — feather weight is 1
      // inside the rect, tapering linearly to 0 at FEATHER_PX past its edge.
      const dx = x < x0 ? x0 - x : x >= x1 ? x - (x1 - 1) : 0;
      const dy = y < y0 ? y0 - y : y >= y1 ? y - (y1 - 1) : 0;
      const dist = Math.max(dx, dy);
      const weight = Math.max(0, 1 - dist / FEATHER_PX);
      if (weight <= 0) continue;

      const bx = ((x - fx0) / GRAIN_BLOCK) | 0;
      const by = ((y - fy0) / GRAIN_BLOCK) | 0;
      const noise = blockNoise[by * bw + bx];
      const grainMul = 1 - amp * Math.max(0, -noise); // darken-only, same idiom house-wide
      const synth = Math.max(0, Math.min(255, median * grainMul));

      const i = (y * img.width + x) * 4;
      const orig = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
      const v = Math.round(weight * synth + (1 - weight) * orig);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      // alpha untouched — the plate is opaque throughout, nothing to key here.
    }
  }
}

/** Max-min luma spread inside `rect` — the statistical footprint real ink lettering
 * leaves against a flatter ground. Used to guard against a rect that has silently drifted
 * off its lettering (see CALIBRATION WARNING at the top of this file). */
function measureRectContrast(img, rect) {
  const { x0, y0, x1, y1 } = rect;
  let min = 255;
  let max = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.width + x) * 4;
      const v = lum(img.data[i], img.data[i + 1], img.data[i + 2]);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return max - min;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const allowRecalibration = args.includes("--allow-recalibration");
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? path.resolve(ROOT, args[outIdx + 1]) : SOURCE;

  const sourceHash = createHash("sha256").update(fs.readFileSync(SOURCE)).digest("hex");
  if (sourceHash !== EXPECTED_SOURCE_SHA256 && !allowRecalibration) {
    console.error(
      `Fatal: ${path.relative(ROOT, SOURCE)} does not match the raster this script's ` +
        `TARGETS rects were calibrated against (got sha256 ${sourceHash}, expected ` +
        `${EXPECTED_SOURCE_SHA256}). The plate was likely regenerated — every rect in ` +
        `TARGETS needs re-measuring against the new source before this script can be ` +
        `trusted again. Re-run with --allow-recalibration only once you've done that and ` +
        `updated EXPECTED_SOURCE_SHA256.`,
    );
    process.exit(1);
  }

  const loaded = await loadImage(SOURCE);
  const canvas = createCanvas(loaded.width, loaded.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(loaded, 0, 0);
  const image = ctx.getImageData(0, 0, loaded.width, loaded.height);

  for (const target of TARGETS) {
    const contrast = measureRectContrast(image, target.rect);
    if (contrast < MIN_LETTERING_CONTRAST) {
      console.warn(
        `[${target.key}] SKIPPED — rect contrast ${contrast.toFixed(1)} is below ` +
          `MIN_LETTERING_CONTRAST (${MIN_LETTERING_CONTRAST}); this rect no longer looks ` +
          `like it contains lettering. Either it is already blanked (expected on a ` +
          `second run) or the source has drifted from calibration — check before assuming.`,
      );
      continue;
    }
    const { median, mad } = measureSampleLuma(image, target.sampleRects);
    console.log(
      `[${target.key}] sampled median luma ${median.toFixed(1)}, mad ${mad.toFixed(1)} → ` +
        `filling rect [${target.rect.x0},${target.rect.y0},${target.rect.x1},${target.rect.y1}]`,
    );
    if (!dryRun) paintMatchedPatch(image, target.rect, median, mad, target.seed);
  }

  if (dryRun) {
    console.log("[dry-run] nothing written.");
    return;
  }

  ctx.putImageData(image, 0, 0);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, canvas.toBuffer("image/png"));
  console.log(`[ok] wrote ${path.relative(ROOT, outFile)}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
