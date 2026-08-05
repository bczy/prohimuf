#!/usr/bin/env node
/**
 * slice-portrait-plate.mjs — the ONLY writer of `public/assets/portrait/*.png`
 * and `src/game/portraits/portraitPlate.generated.json` (ADR-0080 D5).
 *
 * Production route ratified by Bertrand (docs/handoffs/story-portrait-robot.md
 * §11 R-3): generate WHOLE FACES on a plate, then slice — never generate a band
 * directly (FLUX has no memory of skull width across calls, so per-band
 * generation guarantees a fractured skeleton at every seam; art brief §5.2,
 * ADR-0011 precedent). This script is that slice step, plus the recalage
 * (registration) pass and the seam-tolerance measurement that the brief
 * (§1.2bis) makes a condition of existence for the screen, not a nicety.
 *
 * ATOMICITY (ADR-0080 D5, art brief §1.2bis "portée du rejet"): there is no
 * per-band mode and no "regenerate one variant" flag — that absence IS the
 * atomicity guarantee. A run either writes all 24 files + the manifest
 * together, or writes nothing. A plate that fails the seam-tolerance gate is
 * rejected WHOLE (not per variant) — see `measureSeamContinuity` below.
 *
 * Modes:
 *   node scripts/slice-portrait-plate.mjs --placeholder
 *     Writes 24 flat, mutually-distinguishable, correctly-sized PLACEHOLDER
 *     PNGs with NO network call and NO real plate — this is what unblocks
 *     `dev-r3f-render` on day 1 (story §3.3 step 1) while the real plate is
 *     still pending the concept-artist prompt gate. Deterministic, procedural,
 *     dependency-free (same small PNG encoder as gen-courier-sprites.mjs).
 *
 *   node scripts/slice-portrait-plate.mjs [--plate <path>]
 *     The REAL pipeline: fetch (or read, with --plate) a face plate, run the
 *     recalage pass against its margin registration marks (eye-line / nose-base
 *     ticks, art brief §1.2bis), slice at the 3 seams with bleed removed at the
 *     ordinate, measure the 4 seam-tolerance grandeurs of §1.2bis on every
 *     internal seam, and write all 24 files + the manifest ONLY if every seam
 *     passes. FLUX generation is normally BLOCKED in the local sandbox
 *     (AGENTS.md) — this mode is exercised in CI
 *     (.github/workflows/gen-portrait-plate.yml). `--plate <path>` bypasses the
 *     network call for local testing against a hand-supplied PNG.
 *
 * `FORCE=1` regenerates even if all 24 files already exist. Without it, an
 * existing complete set is left untouched (idempotent).
 *
 * -----------------------------------------------------------------------
 * HONEST LIMIT — read before trusting this on a real plate (root-cause note).
 * -----------------------------------------------------------------------
 * The recalage pass below corrects VERTICAL drift only (a uniform scale +
 * offset fitted to the two registration marks, eye-line and nose-base). It
 * does NOT resample for rotation/tangent drift — the brief's tangent
 * tolerance (§1.2bis, ≤3° pass / ≥6° reject) is a real risk the pass cannot
 * fix, only detect: the left/right registration-mark disagreement is used as
 * a tilt ESTIMATE and folded into the seam measurement, but the pixels are
 * never rotated back straight. If FLUX drifts framing AND tilts the face,
 * this pass will not save the plate — it will (correctly) cause the seam
 * measurement to reject it, and the plate must be regenerated, not patched.
 * A full affine (rotation + scale) resample is the natural next step if plate
 * rejects turn out to cluster on tilt rather than pure vertical drift; not
 * built here because it cannot be validated without a real plate to test
 * against (network is blocked in this sandbox), and shipping unverified
 * rotation-resampling code that silently miscorrects a face is worse than
 * shipping the honest, narrower correction plus a hard reject.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";
import { fluxUrl, fetchWithRetry } from "./lib/pollinations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "public/assets/portrait");
const MANIFEST_OUT = path.resolve(ROOT, "src/game/portraits/portraitPlate.generated.json");
const FORCE = process.env.FORCE === "1";

// ── Canonical gabarit geometry (ADR-0080 D5, art brief §1.1/§1.2/§1.2bis) ────
// Reference space: the PLATE, portrait cropped to PORTRAIT_HEIGHT px tall
// (brief §1.2bis, resized by §9 GATE DIMENSIONS — lead-art, 2026-08-05).
// 580x775 replaces the original 768x1024: Pollinations' `flux` model caps
// render surface at ~590K px (RE-PANEL run 5d5b5f51 — the ORIGINAL 768x1024
// portrait content, margins not included, already exceeds that cap on its
// own, so no non-scaled request at the old resolution exists). VOIE B
// (brief §9.1): reframe the brief to what the service renders natively,
// rather than accept a silent, permanent format failure (VOIE A) or
// upscale before measuring (fabricates sub-pixel precision). The margin
// does NOT scale with this change — see PLATE_MARGIN_PX below, that's the
// actual decision.
export const GABARIT_ID = "gabarit-01";
export const BAND_ORDER = ["hair", "eyes", "nose", "mouth"];
export const VARIANTS_PER_BAND = 6;
export const PORTRAIT_WIDTH = 580;
export const PORTRAIT_HEIGHT = 775;
// C1 (hair/eyes), C2 (eyes/nose), C3 (nose/mouth) — fraction of PORTRAIT_HEIGHT
// (brief §1.2 ordinates). Bands are cut edge-to-edge at these fractions; no
// bleed survives into the delivered PNGs (brief §1.2bis: "le bleed n'est pas
// composé au rendu"). 775 = 25 × 31 was chosen (over e.g. 780) specifically
// so these three fractions land on whole pixels with no rounding needed —
// verified: 0.32×775=248, 0.52×775=403, 0.72×775=558, all exact (brief §9.2).
export const SEAMS = [0.32, 0.52, 0.72];
// Bleed drawn on the PLATE either side of a seam, absorbed by the cut — not
// present in delivered files, but a plate drawn without it is not a
// production defect this script can see (brief §1.2bis). Absolute, unchanged
// by §9 (anti-aliasing bleed doesn't shrink with the plate).
export const BLEED_PX = 12;
// Margin registration band around the portrait crop, where the eye-line /
// nose-base / axis / corner ticks live (brief §1.2bis "repères d'alignement").
// Absolute, unchanged by §9 GATE DIMENSIONS — this is lead-art's actual
// decision, not an oversight: "la marge ne se met pas à l'échelle, le
// portrait si". A printed tick's own anti-aliasing is 1-2px regardless of
// plate size, and this script's own confidence gates (MIN_TICK_RUN_PX,
// MIN_TICK_PEAK_RATIO below) require it detectable in absolute px — scaling
// the margin down would shrink the noise window below FLUX's own placement
// tolerance. The portrait absorbs the pixels the margin cannot give up.
export const PLATE_MARGIN_PX = 48;
export const PLATE_WIDTH = PORTRAIT_WIDTH + PLATE_MARGIN_PX * 2;
export const PLATE_HEIGHT = PORTRAIT_HEIGHT + PLATE_MARGIN_PX * 2;
export const EYE_LINE_FRAC = 0.4;
export const NOSE_BASE_FRAC = 0.65;

// Seam-tolerance table, brief §9.3 (lead-art, 2026-08-05) — supersedes the
// original §1.2bis table. The invariant lead-art holds constant is the
// RENDERED (on-screen) pixel, not the plate pixel: a 775px-tall plate is
// LESS reduced to the ~224px on-screen band than the original 1024px plate
// was, so an equal plate-pixel defect reads ~33% larger on screen — these
// thresholds are consequently tighter in plate px than before, by design,
// not by mistake.
export const TOLERANCE = {
  skullHalfWidth: { pass: 1.5, fail: 3 },
  medianAxis: { pass: 0.75, fail: 1.5 },
  tangentDeg: { pass: 3, fail: 6 },
  strokeWidthRelPct: { pass: 10, fail: 15 },
};

// ── Prompt family (FLUX) — words authored by concept-artist (Maud) ──────────
// dev-tooling-assets owns the wiring/schema and the path the words travel
// (this constant, `check-art-prompts.mjs`-style linting below); the WORDS
// belong to concept-artist per the ratified brief (docs/art-direction/
// brief-portrait-robot.md §7.1: "elle écrira les prompts, pas moi"). Mirrors
// the `pending: true` precedent already in levelArt.json's
// `shield_cover_lowered` entry: `lintPromptFamily` (below) treats a pending
// family as a non-fatal WARN, and `fetchPlate` refuses to spend a real FLUX
// call while `pending` is true, so this scaffold cannot accidentally burn the
// generation budget on empty prose.
export const PORTRAIT_PROMPT_FAMILY = {
  pending: false,
  // Pinned so a future real run is reproducible from the moment the prompt is
  // filled; concept-artist/lead-art re-pin at the prompt gate if they want a
  // different roll.
  seed: 190226,
  // Cadrage lock (brief §1.1/§1.2bis, bible §3.6 drafting vocabulary). Front-
  // loaded because FLUX over-weights early tokens: medium + view + centring +
  // constant skull width land before any face word, and the margin
  // registration marks are described as PART of the printed plate (a printer's
  // sheet, not a technical overlay) so FLUX draws them instead of fighting
  // them — `detectRegistration` above reads exactly those ticks.
  opening:
    "Flat 2D black ink drawing on a printed sheet: one human head, strict frontal view, " +
    "orthographic projection, centred, eye line level, crown to collarbone, constant skull " +
    "width. In the margin: pupil-line and nostril-base ticks at left and right, " +
    "centre-axis ticks top and bottom, crop crosses at the corners. ",
  // gabarit-01 hero face — subject + silhouette ONLY (no style, no ground, no
  // colour). Every feature is named as a flat, level volume so the three seam
  // ordinates (0.32 forehead / 0.52 above the nose bridge / 0.72 philtrum)
  // fall in flat, low-contrast zones (brief §1.2). Ears, neck and shoulders
  // are stated here because they belong to the gabarit, never to a band.
  // Variation (6 per band) is derived later by `kontext` img2img from THIS
  // validated plate, one named descriptor at a time (brief §5.2 step 4) —
  // never by re-rolling this prompt, which would change the skull.
  prompt:
    "Hard weathered face, broad flat forehead under a straight low hairline, wide-set " +
    "eyes under a heavy level brow, straight narrow nose ending blunt, long flat philtrum, " +
    "thin level mouth, square jaw, small ears flat to the skull, bare neck. ",
  // Shared house tail, verbatim from the bible §1/§3 register: one constant
  // ink weight and one hatch angle (brief §1.3 — two weights or two angles
  // read as two draughtsmen), flat frontal light (no shadow crossing a seam),
  // white paper ground (bands are opaque, never keyed).
  style:
    "Photocopied 1990s punk fanzine illustration: thick black ink outline of one constant " +
    "weight, sparse coarse halftone dots at one 45-degree angle, flat frontal light, " +
    "uniform white paper (#FFFFFF), high-contrast xerox toner.",
};

/** Prompt-gate-shaped lint (mirrors check-art-prompts.mjs's report shape) — no
 * network, no levelArt.json dependency: the catalogue is explicitly NOT in
 * levelArt.json (ADR-0080 D1/A3), so it does not belong in that file's linter. */
export function lintPromptFamily(family) {
  const errors = [];
  const warns = [];
  if (family.pending) {
    warns.push("PORTRAIT_PROMPT_FAMILY.pending — words not yet authored by concept-artist");
    return { errors, warns };
  }
  if (!Number.isInteger(family.seed) || family.seed <= 0) {
    errors.push("seed must be a positive integer");
  }
  for (const field of ["opening", "prompt", "style"]) {
    if (typeof family[field] !== "string" || !family[field].trim()) {
      errors.push(`${field} must be a non-empty string once pending=false`);
    }
  }
  const assembled = `${family.opening}${family.prompt}${family.style}`;
  const words = assembled.trim().split(/\s+/).filter(Boolean).length;
  if (words > 0 && words > 120) {
    errors.push(`assembled prompt is ${words} words — over the bible §3.3 ceiling of 120`);
  }
  return { errors, warns };
}

// ── Dependency-free PNG writer (8-bit RGB, no alpha — bands are opaque,
// jointive rectangles per art brief §1.0, never cut out) ────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePngRGB(width, height, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Placeholder drawing (procedural, no network) ─────────────────────────────
// House-neutral tints per band (purely so the four rows read as different
// bands at a glance) + a stripe count = variant index + 1 (so the six
// variants of one band are mutually distinguishable at a glance, per the
// story's "visuellement distinguables" requirement). NOT art — flat filler
// only, replaced wholesale the moment a real plate passes the seam gate.
const BAND_TINT = {
  hair: [64, 48, 40],
  eyes: [58, 70, 92],
  nose: [120, 96, 72],
  mouth: [128, 58, 64],
};
function drawPlaceholderBand(bandId, variantIndex, width, height) {
  const [r, g, b] = BAND_TINT[bandId];
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      rgb[o] = r;
      rgb[o + 1] = g;
      rgb[o + 2] = b;
    }
  }
  // (variantIndex + 1) light diagonal stripes, so 01..06 are each visually
  // distinct AND the count is legible without reading the filename.
  const stripes = variantIndex + 1;
  const period = Math.max(6, Math.round(width / (stripes * 2)));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((x + y) % period < 3) {
        const o = (y * width + x) * 3;
        rgb[o] = Math.min(255, r + 90);
        rgb[o + 1] = Math.min(255, g + 90);
        rgb[o + 2] = Math.min(255, b + 90);
      }
    }
  }
  return encodePngRGB(width, height, rgb);
}

// ── Shared geometry helpers ───────────────────────────────────────────────
function seamOrdinatesPx() {
  const ords = [0, ...SEAMS.map((f) => Math.round(f * PORTRAIT_HEIGHT)), PORTRAIT_HEIGHT];
  return BAND_ORDER.map((id, i) => ({ id, top: ords[i], bottom: ords[i + 1] }));
}

function variantFileName(bandId, i) {
  return `${bandId}-${String(i + 1).padStart(2, "0")}.png`;
}

function sha256Hex(buffers) {
  const h = crypto.createHash("sha256");
  for (const b of buffers) h.update(b);
  return h.digest("hex");
}

function writeManifest(checksum, extra = {}) {
  const bands = {};
  for (const { id } of seamOrdinatesPx()) {
    bands[id] = Array.from({ length: VARIANTS_PER_BAND }, (_, i) => ({
      id: `${id}-${String(i + 1).padStart(2, "0")}`,
      asset: `assets/portrait/${variantFileName(id, i)}`,
    }));
  }
  const manifest = {
    gabaritId: GABARIT_ID,
    plateChecksum: checksum,
    portraitSize: { width: PORTRAIT_WIDTH, height: PORTRAIT_HEIGHT },
    seams: SEAMS,
    bands,
    ...extra,
  };
  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
  fs.writeFileSync(MANIFEST_OUT, `${JSON.stringify(manifest, null, 2)}\n`);
}

// ── Placeholder mode ─────────────────────────────────────────────────────
function runPlaceholder() {
  const files = [];
  for (const { id, top, bottom } of seamOrdinatesPx()) {
    const height = bottom - top;
    for (let i = 0; i < VARIANTS_PER_BAND; i++) {
      files.push({
        name: variantFileName(id, i),
        buf: drawPlaceholderBand(id, i, PORTRAIT_WIDTH, height),
      });
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(OUT_DIR, f.name), f.buf);
  // Placeholder checksum is deterministic over the geometry, not real pixels —
  // clearly namespaced so nothing downstream mistakes it for plate provenance.
  const checksum = `placeholder:${sha256Hex(files.map((f) => f.buf)).slice(0, 16)}`;
  writeManifest(checksum, { placeholder: true });
  console.log(
    `[slice-portrait-plate] wrote ${files.length} placeholder PNGs to ` +
      `${path.relative(ROOT, OUT_DIR)} + manifest (checksum ${checksum})`,
  );
}

// ── Recalage (registration) pass ─────────────────────────────────────────
// Finds the eye-line / nose-base tick marks in the LEFT and RIGHT plate
// margins (brief §1.2bis) as the y of darkest ink density within a search
// window around the nominal ordinate, then fits a uniform vertical
// scale+offset so the two marks land exactly on their nominal fractions
// before slicing. See the file-header "HONEST LIMIT" note for what this does
// NOT correct (tilt/rotation).
function luminance(png, x, y) {
  const idx = (png.width * y + x) << 2;
  return (png.data[idx] * 299 + png.data[idx + 1] * 587 + png.data[idx + 2] * 114) / 1000;
}

// A registration mark is a printed TICK — a short, continuous ink stroke —
// not just "the darkest row in the window". Without these gates, a single
// toner grain in an otherwise empty margin IS the darkest row (darkness=1 >
// darkness=0 everywhere else) and gets silently promoted to a repère; the
// rescale that follows would then be fitted to noise (art brief §8 C-B).
// Two independent signals a grain cannot fake:
//   - MIN_RUN_PX: a real tick is a continuous stroke, not an isolated pixel.
//   - MIN_PEAK_RATIO: the winning row must stand out from the window's own
//     background (a genuine ink mark against blank paper), not just edge out
//     a field of equally-faint candidates.
const MIN_TICK_RUN_PX = 6;
const MIN_TICK_PEAK_RATIO = 3;
// On a genuinely blank margin (the nominal shape of a FAILED plate — FLUX
// drew no marks at all) every other row has run=0, so the window's own
// median (`backgroundRun`) is 0 too: there is no neighbourhood to stand out
// from, and the ratio check below is meaningless (division floored to /1).
// Without a floor here, ANY lone ≥MIN_TICK_RUN_PX artefact in empty space —
// a scanner hair, a fold, a residual crop line, an elongated toner smear —
// clears MIN_TICK_RUN_PX alone and is promoted to a confident repère. Require
// the same margin of confidence the ratio check would demand against the
// smallest possible real background (1px): MIN_TICK_RUN_PX * MIN_TICK_PEAK_RATIO.
const MIN_TICK_ISOLATED_RUN_PX = MIN_TICK_RUN_PX * MIN_TICK_PEAK_RATIO;

/** Longest run of consecutive dark (`luminance < 128`) pixels in row `y`
 * over `[xStart, xEnd)`, plus the total dark-pixel count for that row. */
function scanRow(png, xStart, xEnd, y) {
  let run = 0;
  let bestRun = 0;
  let dark = 0;
  for (let x = xStart; x < xEnd; x++) {
    if (luminance(png, x, y) < 128) {
      dark++;
      run++;
      if (run > bestRun) bestRun = run;
    } else {
      run = 0;
    }
  }
  return { run: bestRun, dark };
}

/** Confidence-gated tick search: scans `[nominalYAbs - windowPx, +windowPx]`
 * for a row whose longest continuous dark run both (a) meets a minimum
 * stroke length and (b) clears the window's own background by
 * `MIN_TICK_PEAK_RATIO`. Returns `{ found: false, reason }` rather than a
 * best-effort guess when neither is met — callers must treat `found: false`
 * as "no mark here", never fall back to the guess. */
function findTick(png, xStart, xEnd, nominalYAbs, windowPx = 24) {
  const yFrom = Math.max(0, nominalYAbs - windowPx);
  const yTo = Math.min(png.height - 1, nominalYAbs + windowPx);
  if (yFrom > yTo) {
    return {
      found: false,
      reason:
        `search window y∈[${nominalYAbs - windowPx},${nominalYAbs + windowPx}] falls entirely ` +
        `outside the plate (height=${png.height}px) — the plate is undersized or wrongly ` +
        `resolved, this is not a missing tick`,
    };
  }
  const rows = [];
  for (let y = yFrom; y <= yTo; y++) rows.push({ y, ...scanRow(png, xStart, xEnd, y) });

  let best = rows[0];
  for (const r of rows)
    if (r.run > best.run || (r.run === best.run && r.dark > best.dark)) best = r;

  if (best.run < MIN_TICK_RUN_PX) {
    return {
      found: false,
      reason:
        `no continuous stroke ≥${MIN_TICK_RUN_PX}px found (longest run was ${best.run}px ` +
        `at y=${best.y})`,
    };
  }

  // Background = median run length of the OTHER rows in the window (best
  // excluded). A genuine tick sits well above its own neighbourhood; grain
  // sits in a field of comparably-noisy neighbours.
  const otherRuns = rows
    .filter((r) => r.y !== best.y)
    .map((r) => r.run)
    .sort((a, b) => a - b);
  const backgroundRun = otherRuns.length > 0 ? otherRuns[Math.floor(otherRuns.length / 2)] : 0;

  if (backgroundRun === 0) {
    // Empty margin: no background to compute a ratio against. Fall back to
    // the absolute floor above instead of short-circuiting to "confident".
    if (best.run < MIN_TICK_ISOLATED_RUN_PX) {
      return {
        found: false,
        reason:
          `margin is otherwise empty (window median run = 0px) and the sole candidate ` +
          `(${best.run}px at y=${best.y}) is below the ${MIN_TICK_ISOLATED_RUN_PX}px floor ` +
          "required with no background to compare against — reads as an isolated artefact " +
          "(scanner hair, fold, crop-line residue), not a printed tick",
      };
    }
    return { found: true, y: best.y, run: best.run };
  }

  const peakRatio = best.run / backgroundRun;
  if (peakRatio < MIN_TICK_PEAK_RATIO) {
    return {
      found: false,
      reason:
        `no row stands out from the margin's background (best run ${best.run}px at y=${best.y} ` +
        `is only ${peakRatio.toFixed(1)}x the window median ${backgroundRun}px, need ` +
        `${MIN_TICK_PEAK_RATIO}x) — reads as generalised noise, not a printed tick`,
    };
  }

  return { found: true, y: best.y, run: best.run };
}

/** Runs `findTick` for the four registration marks (eye-line / nose-base ×
 * left / right margin) and throws a single, actionable error the moment ANY
 * is missing — naming which mark, which margin, and the y-window searched,
 * so `lead-art` can act on the message at roll 1 without re-deriving it. A
 * tick found on one side without its pair on the other is exactly the
 * "suspect" case the brief calls out, and is reported by name, not folded
 * into a generic failure. Per brief §1.2bis "portée du rejet", this throws
 * for the WHOLE plate — there is no partial/best-effort registration. */
export function detectRegistration(png) {
  const eyeNominalAbs = PLATE_MARGIN_PX + Math.round(EYE_LINE_FRAC * PORTRAIT_HEIGHT);
  const noseNominalAbs = PLATE_MARGIN_PX + Math.round(NOSE_BASE_FRAC * PORTRAIT_HEIGHT);
  const rightXStart = PLATE_MARGIN_PX + PORTRAIT_WIDTH;

  const marks = [
    {
      label: "eye-line",
      side: "left",
      xStart: 0,
      xEnd: PLATE_MARGIN_PX,
      nominalYAbs: eyeNominalAbs,
    },
    {
      label: "eye-line",
      side: "right",
      xStart: rightXStart,
      xEnd: png.width,
      nominalYAbs: eyeNominalAbs,
    },
    {
      label: "nose-base",
      side: "left",
      xStart: 0,
      xEnd: PLATE_MARGIN_PX,
      nominalYAbs: noseNominalAbs,
    },
    {
      label: "nose-base",
      side: "right",
      xStart: rightXStart,
      xEnd: png.width,
      nominalYAbs: noseNominalAbs,
    },
  ];

  const results = marks.map((m) => ({ ...m, ...findTick(png, m.xStart, m.xEnd, m.nominalYAbs) }));
  const missing = results.filter((r) => !r.found);
  if (missing.length > 0) {
    const lines = missing.map(
      (m) =>
        `  ✗ ${m.label} tick, ${m.side} margin — searched x∈[${m.xStart},${m.xEnd}) ` +
        `y∈[${Math.max(0, m.nominalYAbs - 24)},${Math.min(png.height - 1, m.nominalYAbs + 24)}] ` +
        `(nominal y=${m.nominalYAbs}): ${m.reason}`,
    );
    const found = results.filter((r) => r.found).map((m) => `${m.label}/${m.side}`);
    throw new Error(
      `registration ABORTED — ${missing.length}/4 mark(s) not found with confidence:\n` +
        `${lines.join("\n")}\n` +
        (found.length > 0 ? `  (found with confidence: ${found.join(", ")})\n` : "") +
        "Refusing to rescale on an unconfirmed repère (art brief §8 C-B) — the plate is " +
        "rejected WHOLE and must be regenerated, not patched.",
    );
  }

  const [eyeLeft, eyeRight, noseLeft, noseRight] = results;
  const eyeY = (eyeLeft.y + eyeRight.y) / 2;
  const noseY = (noseLeft.y + noseRight.y) / 2;
  // Tilt estimate only (not corrected — see file header). Expressed as the
  // vertical disagreement between the two margins at each mark, in px. Both
  // sides were independently confidence-gated above, so a large disagreement
  // here is read as real tilt, not noise, and is left to the seam-tolerance
  // gate downstream to accept or reject.
  const tiltPx = Math.max(Math.abs(eyeLeft.y - eyeRight.y), Math.abs(noseLeft.y - noseRight.y));

  return { eyeY, noseY, tiltPx };
}

/** Order sanity + vertical scale factor from measured eye-line/nose-base
 * absolute y's. Split out from `registerPortrait` so the sign guard is
 * directly unit-testable against arbitrary (eyeY, noseY) pairs — the
 * property under test ("a mirrored/inverted plate produces NOTHING, not a
 * plausible-looking mirrored portrait") does not depend on how those y's
 * were measured. Eye-line must sit strictly above nose-base (smaller y);
 * without this check a flipped plate, or two confident ticks read in the
 * wrong order, gives `noseLocal <= eyeLocal` ⇒ `scale <= 0` ⇒ a mirror or
 * degenerate rescale accepted in silence — the same failure mode this
 * file's confidence gates exist to close, just downstream of them. */
export function computeVerticalScale(eyeY, noseY) {
  const eyeNominalLocal = Math.round(EYE_LINE_FRAC * PORTRAIT_HEIGHT);
  const noseNominalLocal = Math.round(NOSE_BASE_FRAC * PORTRAIT_HEIGHT);
  const eyeLocal = eyeY - PLATE_MARGIN_PX;
  const noseLocal = noseY - PLATE_MARGIN_PX;
  if (noseY <= eyeY) {
    throw new Error(
      `registration ABORTED — eye-line (measured y=${eyeY}) is not above nose-base ` +
        `(measured y=${noseY}); a valid portrait has eye-line strictly above nose-base. ` +
        "This reads as a flipped/mirrored plate or a mismatched mark pair, not a tilt — " +
        "refusing to rescale (art brief §8 C-B). The plate is rejected WHOLE and must be " +
        "regenerated, not patched.",
    );
  }
  return { scale: (noseNominalLocal - eyeNominalLocal) / (noseLocal - eyeLocal || 1), eyeLocal };
}

/** Nearest-neighbour vertical-only resample driven by the two registration
 * marks. Returns a NEW pngjs-shaped {width,height,data} for just the portrait
 * bbox (PORTRAIT_WIDTH × PORTRAIT_HEIGHT), corrected.
 *
 * Accepts an optional pre-computed `registration` ({eyeY, noseY, tiltPx}) so
 * a caller that already ran `detectRegistration` for the tilt estimate (see
 * `runReal`) doesn't pay for a second full margin scan — and, more
 * importantly, so there is exactly one call site that can go stale if the
 * detection logic is ever gated differently, not two. Defaults to running
 * detection itself so existing single-argument callers are unaffected. */
export function registerPortrait(png, registration = detectRegistration(png)) {
  const { eyeY, noseY } = registration;
  const eyeNominalLocal = Math.round(EYE_LINE_FRAC * PORTRAIT_HEIGHT);
  const { scale, eyeLocal } = computeVerticalScale(eyeY, noseY);

  const out = {
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
    data: Buffer.alloc(PORTRAIT_WIDTH * PORTRAIT_HEIGHT * 4),
  };
  for (let y = 0; y < PORTRAIT_HEIGHT; y++) {
    let srcLocalY = eyeLocal + (y - eyeNominalLocal) / scale;
    srcLocalY = Math.max(0, Math.min(PORTRAIT_HEIGHT - 1, Math.round(srcLocalY)));
    const srcYAbs = PLATE_MARGIN_PX + srcLocalY;
    for (let x = 0; x < PORTRAIT_WIDTH; x++) {
      const srcXAbs = PLATE_MARGIN_PX + x;
      const srcIdx = (png.width * srcYAbs + srcXAbs) << 2;
      const dstIdx = (PORTRAIT_WIDTH * y + x) << 2;
      png.data.copy(out.data, dstIdx, srcIdx, srcIdx + 4);
    }
  }
  return out;
}

// ── Seam-tolerance measurement (art brief §1.2bis, tolerances per §9.3) ──
// Skull edge on a given row = first/last x whose luminance reads as ink.
// This integer edge is a SEARCH anchor for the sub-pixel centroid below, not
// itself a measurement — §9.3's PASS thresholds (medianAxis ≤0.75px,
// skullHalfWidth ≤1.5px) sit below one whole pixel, so reporting this
// integer value as the grandeur would silently under/over-report by up to a
// full pixel, more than the entire PASS budget.
function skullEdges(portrait, y) {
  let left = -1;
  let right = -1;
  for (let x = 0; x < portrait.width; x++) {
    const idx = (portrait.width * y + x) << 2;
    const lum =
      (portrait.data[idx] * 299 + portrait.data[idx + 1] * 587 + portrait.data[idx + 2] * 114) /
      1000;
    if (lum < 128) {
      if (left === -1) left = x;
      right = x;
    }
  }
  return { left, right };
}

function strokeWidth(portrait, y, edgeX, direction) {
  let w = 0;
  let x = edgeX;
  while (x >= 0 && x < portrait.width && w < 40) {
    const idx = (portrait.width * y + x) << 2;
    const lum =
      (portrait.data[idx] * 299 + portrait.data[idx + 1] * 587 + portrait.data[idx + 2] * 114) /
      1000;
    if (lum >= 128) break;
    w++;
    x += direction;
  }
  return w;
}

// Ink density at a pixel, used as the "alpha" weight for the sub-pixel
// centroid brief §9.3 mandates ("le centroïde pondéré par l'alpha du trait
// de contour, pas au premier pixel non transparent"): these plates are
// opaque ink-on-white-paper, not RGBA transparency, so darkness (1 - relative
// luminance) stands in for coverage/alpha — a pixel straddling the ink/paper
// boundary reads partial darkness from anti-aliasing, exactly the sub-pixel
// signal an integer threshold throws away.
function inkDensity(portrait, x, y) {
  const idx = (portrait.width * y + x) << 2;
  const lum =
    (portrait.data[idx] * 299 + portrait.data[idx + 1] * 587 + portrait.data[idx + 2] * 114) / 1000;
  return Math.max(0, Math.min(1, (255 - lum) / 255));
}

// Window either side of the integer edge over which the centroid is taken —
// wide enough to cover the full 5-6px contour stroke (brief §9.2) plus its
// anti-aliasing skirt on both sides.
const SUBPIXEL_CENTROID_WINDOW_PX = 8;

/** Sub-pixel x-position of the contour stroke's ink-density centroid around
 * an integer edge. Returns `null` (never a guess) when there is no ink in
 * the window — either the integer edge itself was `-1` (no ink found on the
 * row at all) or a pathological all-zero-density window — so a caller can
 * fail loudly instead of reporting a verdict this instrument cannot
 * support (brief §9.3). */
function subpixelEdgeCentroid(portrait, y, integerEdgeX) {
  if (integerEdgeX < 0) return null;
  let sumWeighted = 0;
  let sumWeight = 0;
  for (let dx = -SUBPIXEL_CENTROID_WINDOW_PX; dx <= SUBPIXEL_CENTROID_WINDOW_PX; dx++) {
    const x = integerEdgeX + dx;
    if (x < 0 || x >= portrait.width) continue;
    const w = inkDensity(portrait, x, y);
    if (w <= 0) continue;
    sumWeighted += x * w;
    sumWeight += w;
  }
  return sumWeight > 0 ? sumWeighted / sumWeight : null;
}

// Tangent fit span, brief §9.3: "arc de 5% de H de part et d'autre de la
// couture" — proportional, not a fixed row count, because a fixed-row fit
// becomes noise on a smaller plate while an angle itself has no scale.
const TANGENT_FIT_FRAC = 0.05;

/** Least-squares tangent angle (degrees off vertical) of the LEFT contour
 * edge's sub-pixel centroid, fit over up to `TANGENT_FIT_FRAC * H` rows
 * starting at `row` and moving by `direction` (-1 = upward/away from a seam
 * below, +1 = downward/away from a seam above). Returns `null` — never a
 * guessed angle — when fewer than 2 usable (ink-bearing) rows are found in
 * the fit window, per brief §9.3's "il faut le dire, pas arrondir". */
function fitTangentAngleDeg(portrait, row, direction) {
  const span = Math.round(TANGENT_FIT_FRAC * PORTRAIT_HEIGHT);
  const points = [];
  for (let i = 0; i < span; i++) {
    const y = row + direction * i;
    if (y < 0 || y >= portrait.height) break;
    const edges = skullEdges(portrait, y);
    const cx = subpixelEdgeCentroid(portrait, y, edges.left);
    if (cx !== null) points.push([y, cx]);
  }
  if (points.length < 2) return null;

  const n = points.length;
  const meanY = points.reduce((s, [y]) => s + y, 0) / n;
  const meanX = points.reduce((s, [, x]) => s + x, 0) / n;
  let num = 0;
  let den = 0;
  for (const [y, x] of points) {
    num += (y - meanY) * (x - meanX);
    den += (y - meanY) * (y - meanY);
  }
  if (den === 0) return null; // all rows identical y — degenerate, not a real fit
  const slopeDxDy = num / den;
  return (Math.atan(slopeDxDy) * 180) / Math.PI;
}

/** Measures the 4 grandeurs of §1.2bis/§9.3 across ONE seam between two
 * adjacent bands (top band's LAST row vs bottom band's FIRST row). Returns
 * `{ pass, alerts, values }` — `pass` false only on an outright FAIL value or
 * ≥2 simultaneous ALERT-zone values on the same seam (brief's stated rule).
 * Throws (never reports a degraded verdict) when the sub-pixel centroid or
 * the tangent fit cannot be produced — per brief §9.3, a script that cannot
 * measure at the required resolution must say so, not round to what it can
 * measure. */
export function measureSeamContinuity(topPortrait, topRow, botPortrait, botRow) {
  const t = skullEdges(topPortrait, topRow);
  const b = skullEdges(botPortrait, botRow);

  const tLeft = subpixelEdgeCentroid(topPortrait, topRow, t.left);
  const tRight = subpixelEdgeCentroid(topPortrait, topRow, t.right);
  const bLeft = subpixelEdgeCentroid(botPortrait, botRow, b.left);
  const bRight = subpixelEdgeCentroid(botPortrait, botRow, b.right);
  if (tLeft === null || tRight === null || bLeft === null || bRight === null) {
    throw new Error(
      "measureSeamContinuity: no ink found near the integer skull edge on one side of the " +
        "seam — cannot compute the alpha-weighted sub-pixel centroid brief §9.3 mandates " +
        "(skullHalfWidth/medianAxis PASS thresholds sit below 1 whole pixel; refusing to " +
        "report a verdict this instrument cannot support rather than rounding).",
    );
  }

  const topTangentDeg = fitTangentAngleDeg(topPortrait, topRow, -1);
  const botTangentDeg = fitTangentAngleDeg(botPortrait, botRow, 1);
  if (topTangentDeg === null || botTangentDeg === null) {
    throw new Error(
      `measureSeamContinuity: fewer than 2 usable edge points in the ${Math.round(TANGENT_FIT_FRAC * 100)}% ` +
        "of H tangent-fit window on one side of the seam (brief §9.3) — refusing to report a " +
        "tangent verdict this instrument cannot support rather than defaulting to 0.",
    );
  }

  const values = {
    leftHalfWidthDeltaPx: Math.abs(tLeft - bLeft),
    rightHalfWidthDeltaPx: Math.abs(tRight - bRight),
    medianAxisDeltaPx: Math.abs((tLeft + tRight) / 2 - (bLeft + bRight) / 2),
    strokeWidthDeltaPct:
      t.left >= 0 && b.left >= 0
        ? (Math.abs(
            strokeWidth(topPortrait, topRow, t.left, 1) -
              strokeWidth(botPortrait, botRow, b.left, 1),
          ) /
            Math.max(1, strokeWidth(topPortrait, topRow, t.left, 1))) *
          100
        : 0,
    tangentDeltaDeg: Math.abs(topTangentDeg - botTangentDeg),
  };

  const alerts = [];
  let fail = false;
  const check = (key, tol) => {
    const v = values[key];
    if (v >= tol.fail) fail = true;
    else if (v > tol.pass) alerts.push(key);
  };
  check("leftHalfWidthDeltaPx", TOLERANCE.skullHalfWidth);
  check("rightHalfWidthDeltaPx", TOLERANCE.skullHalfWidth);
  check("medianAxisDeltaPx", TOLERANCE.medianAxis);
  check("strokeWidthDeltaPct", TOLERANCE.strokeWidthRelPct);
  check("tangentDeltaDeg", TOLERANCE.tangentDeg);

  const pass = !fail && alerts.length < 2;
  return { pass, alerts, values };
}

// ── Real pipeline (network / --plate) ────────────────────────────────────
async function fetchPlate(plateArg) {
  if (plateArg) return fs.readFileSync(plateArg);
  if (PORTRAIT_PROMPT_FAMILY.pending) {
    throw new Error(
      "PORTRAIT_PROMPT_FAMILY.pending is still true — concept-artist has not authored the " +
        "plate prompt yet (art brief §7.1). Refusing to spend a FLUX call on empty prose. " +
        "Use --placeholder to unblock other lanes in the meantime.",
    );
  }
  const { errors } = lintPromptFamily(PORTRAIT_PROMPT_FAMILY);
  if (errors.length > 0) {
    throw new Error(`PORTRAIT_PROMPT_FAMILY failed the prompt gate:\n${errors.join("\n")}`);
  }
  const assembled = `${PORTRAIT_PROMPT_FAMILY.opening}${PORTRAIT_PROMPT_FAMILY.prompt}${PORTRAIT_PROMPT_FAMILY.style}`;
  const url = fluxUrl(assembled, PORTRAIT_PROMPT_FAMILY.seed, PLATE_WIDTH, PLATE_HEIGHT);
  return fetchWithRetry(url);
}

// ── Response-body content guard (RE-PANEL run 3995325a) ──────────────────
// pngjs's own failure on a bad body ("unrecognised content at end of
// stream") names neither the HTTP status, nor the Content-Type, nor what the
// bytes actually are — an HTML error page, a JSON queue/moderation response,
// and a truncated body all land on the SAME illegible pngjs exception. That
// run's 1.3s duration (real FLUX generations take tens of seconds elsewhere
// in this repo) is itself evidence nothing was decoded. This mirrors the
// confidence-gated tick detection above: don't hand an unvalidated body to a
// format-specific decoder and let it fail illegibly downstream — check first,
// name what's wrong.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function hasMagic(buf, magic) {
  return buf.length >= magic.length && buf.subarray(0, magic.length).equals(magic);
}

// Ground truth is the magic bytes, not the declared Content-Type header (a
// dumb proxy/CDN can mislabel a genuinely valid body) — but the header is
// still surfaced in every diagnostic message below, since it's part of what
// `lead-art` needs to name the actual failure mode (HTML/JSON/wrong-format).
function bodyDiagnostic(buf) {
  const httpStatus = buf.httpStatus ?? "unknown";
  const contentType = buf.contentType ?? "unknown";
  const preview = buf
    .subarray(0, 200)
    .toString("utf8")
    // eslint-disable-next-line no-control-regex -- deliberately scrubbing control bytes from a binary-body preview so it prints legibly.
    .replace(/[\x00-\x08\x0e-\x1f]/g, "?");
  return (
    `HTTP status: ${httpStatus}\n` +
    `Content-Type: ${contentType}\n` +
    `body size: ${buf.length} bytes\n` +
    `first 200 chars: ${JSON.stringify(preview)}`
  );
}

/** Validates the fetched plate body BEFORE it reaches `PNG.sync.read`.
 * A genuine PNG (magic bytes match) passes through unchanged. A genuine JPEG
 * (Pollinations is known to serve one depending on request parameters) is
 * decoded and re-encoded to PNG via `@napi-rs/canvas` — the SAME
 * normalisation `gen-level-art.mjs`'s `normalizeSize` already performs on a
 * fetched Pollinations buffer — because pngjs (this file's only decoder)
 * understands PNG alone, and the committed manifest contract is PNG output.
 * Anything else (HTML error page, JSON queue/moderation response, truncated
 * body) aborts with the full diagnostic instead of an opaque pngjs
 * exception. */
export async function ensurePngBuffer(buf) {
  if (hasMagic(buf, PNG_MAGIC)) return buf;

  if (hasMagic(buf, JPEG_MAGIC)) {
    let canvasLib;
    try {
      canvasLib = await import("@napi-rs/canvas");
    } catch (e) {
      throw new Error(
        "plate response is a JPEG, not the PNG this pipeline requires, and @napi-rs/canvas " +
          `is not installed to decode/re-encode it (${e.message}) — install it in CI before ` +
          "this step (see gen-courier-sprites.yml's install step).\n" +
          bodyDiagnostic(buf),
      );
    }
    const { createCanvas, loadImage } = canvasLib;
    const img = await loadImage(buf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    console.log(
      `[slice-portrait-plate] plate response was a JPEG (Content-Type: ` +
        `${buf.contentType ?? "unknown"}) — decoded and re-encoded to PNG`,
    );
    return canvas.toBuffer("image/png");
  }

  throw new Error(
    "plate response is not a recognisable PNG or JPEG — refusing to hand it to the PNG " +
      "decoder (art brief §8 C-B: a body that fails validation is rejected here, not passed " +
      `through to fail illegibly downstream).\n${bodyDiagnostic(buf)}`,
  );
}

// A wrong-size plate is at least two DIFFERENT failure modes, and reporting
// both as "framing drifted" sends the reader to the wrong place (RE-PANEL run
// 5d5b5f51: 674x874 vs the requested 864x1120 is NOT a framing drift — the
// aspect ratio is preserved to within 0.03%, i.e. the whole plate was
// rendered at a uniform smaller scale). `gen-level-art.mjs`'s `normalizeSize`
// already documented the same mechanism for the same service (a
// max-pixel-area cap on the `flux` model — every requested 1280x768 level
// texture there decodes to 991x594, aspect preserved, ~0.77x linear
// scale-down, consistent with a cap around 768x768's ~590K px; this plate's
// 864x1120 = 967,680px request → 674x874 = 588,876px response lands on
// almost exactly that same cap). A genuine framing drift (different aspect
// ratio) is a different bug with a different fix and keeps its own message.
const ASPECT_RATIO_TOLERANCE = 0.01; // 1% — run 5d5b5f51 measured 0.03% drift

// Documented ceiling (gen-level-art.mjs's normalizeSize, RE-PANEL run
// 5d5b5f51): every plate requested above ~590K px has come back reduced,
// aspect preserved. §9 GATE DIMENSIONS (lead-art, 2026-08-05) sized THIS
// script's PLATE_WIDTH/PLATE_HEIGHT specifically to sit under this ceiling
// (676x871 = 588,796px) so it should render natively — if an aspect-preserved
// scale-down ever fires again at these dimensions, the old explanation no
// longer automatically applies and the message below says so.
const POLLINATIONS_FLUX_AREA_CAP_PX = 590000;

export function isAspectPreservedScaleDown(actualW, actualH, expectedW, expectedH) {
  const actualRatio = actualW / actualH;
  const expectedRatio = expectedW / expectedH;
  return Math.abs(actualRatio - expectedRatio) / expectedRatio < ASPECT_RATIO_TOLERANCE;
}

export async function runReal(plateArg) {
  const rawBuf = await fetchPlate(plateArg);
  const buf = await ensurePngBuffer(rawBuf);
  const plate = PNG.sync.read(buf);
  if (plate.width !== PLATE_WIDTH || plate.height !== PLATE_HEIGHT) {
    if (isAspectPreservedScaleDown(plate.width, plate.height, PLATE_WIDTH, PLATE_HEIGHT)) {
      const requestedAreaPx = PLATE_WIDTH * PLATE_HEIGHT;
      const actualAreaPx = plate.width * plate.height;
      const overCap = requestedAreaPx > POLLINATIONS_FLUX_AREA_CAP_PX;
      throw new Error(
        `plate is ${plate.width}x${plate.height}, expected ${PLATE_WIDTH}x${PLATE_HEIGHT} — ` +
          "the aspect ratio is preserved (not a framing drift): the whole plate was rendered " +
          "at a uniform smaller scale. " +
          (overCap
            ? "Consistent with Pollinations' flux max-pixel-area cap (~590K px, documented in " +
              `gen-level-art.mjs's normalizeSize and RE-PANEL run 5d5b5f51): this request's ` +
              `${requestedAreaPx}px area exceeds it, the response's ${actualAreaPx}px does not.`
            : `UNEXPECTED: this request's ${requestedAreaPx}px area is already under the ` +
              "documented ~590K px cap (§9 GATE DIMENSIONS sized it there specifically to " +
              "render natively) — this is NOT the previously-diagnosed cap; investigate as a " +
              "new failure mode before assuming the old explanation still applies.") +
          " Refusing to proceed: upscaling before measuring would fabricate sub-pixel " +
          "precision on tolerances lead-art pixel-calibrated on this exact plate height (art " +
          "brief §9.3), and rescaling those tolerances to a different reference is lead-art's " +
          `call, not this script's — ESCALATE to lead-art${overCap ? " rather than retrying (a re-dispatch will hit the same cap)" : ""}.`,
      );
    }
    throw new Error(
      `plate is ${plate.width}x${plate.height}, expected ${PLATE_WIDTH}x${PLATE_HEIGHT} — ` +
        "framing drifted beyond what registration can fix (see file-header HONEST LIMIT)",
    );
  }
  const registration = detectRegistration(plate);
  const { tiltPx } = registration;
  const portrait = registerPortrait(plate, registration);

  const seams = seamOrdinatesPx();
  const bandRGB = (top, bottom) => {
    const height = bottom - top;
    const out = Buffer.alloc(PORTRAIT_WIDTH * height * 3);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < PORTRAIT_WIDTH; x++) {
        const srcIdx = (PORTRAIT_WIDTH * (top + y) + x) << 2;
        const dstIdx = height === 0 ? 0 : (y * PORTRAIT_WIDTH + x) * 3;
        out[dstIdx] = portrait.data[srcIdx];
        out[dstIdx + 1] = portrait.data[srcIdx + 1];
        out[dstIdx + 2] = portrait.data[srcIdx + 2];
      }
    }
    return out;
  };

  // Measure every internal seam (between consecutive bands) BEFORE writing
  // anything — the whole plate is rejected together (brief §1.2bis "portée
  // du rejet"), never a single band.
  const seamReports = [];
  for (let i = 0; i < seams.length - 1; i++) {
    const seamY = seams[i].bottom; // == seams[i+1].top
    const report = measureSeamContinuity(portrait, seamY - 1, portrait, seamY);
    seamReports.push({ between: `${seams[i].id}/${seams[i + 1].id}`, ...report });
  }
  const failedSeams = seamReports.filter((r) => !r.pass);
  if (failedSeams.length > 0 || tiltPx >= TOLERANCE.tangentDeg.fail * 4) {
    console.error("[slice-portrait-plate] REJECTED — plate fails seam continuity:");
    for (const r of failedSeams) console.error(`  ✗ ${r.between}`, r.values);
    if (tiltPx >= TOLERANCE.tangentDeg.fail * 4) {
      console.error(
        `  ✗ registration tilt disagreement ${tiltPx}px — rotation not correctable here`,
      );
    }
    throw new Error(
      "plate rejected — see above; the WHOLE plate must be regenerated (ADR-0080 D5)",
    );
  }
  for (const r of seamReports.filter((r) => r.alerts.length > 0)) {
    console.warn(`[slice-portrait-plate] ⚠ ${r.between} in alert zone:`, r.alerts);
  }

  const files = seams.map(({ id, top, bottom }) => ({
    id,
    height: bottom - top,
    rgb: bandRGB(top, bottom),
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const { id, height, rgb } of files) {
    for (let i = 0; i < VARIANTS_PER_BAND; i++) {
      // V1: all 6 variants of a band come from the SAME registered slice
      // (one gabarit, one hero plate). A future multi-face plate replaces
      // this loop body with per-variant crops; the manifest shape does not
      // change, only how each buffer is produced.
      const png = encodePngRGB(PORTRAIT_WIDTH, height, rgb);
      const name = variantFileName(id, i);
      fs.writeFileSync(path.join(OUT_DIR, name), png);
      written.push(png);
    }
  }
  const checksum = `sha256:${sha256Hex([buf])}`;
  writeManifest(checksum);
  console.log(
    `[slice-portrait-plate] wrote ${written.length} PNGs + manifest (checksum ${checksum})`,
  );
}

// ── CLI ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (!FORCE) {
    const allExist = seamOrdinatesPx().every(({ id }) =>
      Array.from({ length: VARIANTS_PER_BAND }, (_, i) =>
        fs.existsSync(path.join(OUT_DIR, variantFileName(id, i))),
      ).every(Boolean),
    );
    if (allExist) {
      console.log(
        `[slice-portrait-plate] all ${BAND_ORDER.length * VARIANTS_PER_BAND} files exist — skip (FORCE=1 to regenerate)`,
      );
      return;
    }
  }

  if (args.includes("--placeholder") || process.env.PLACEHOLDER === "1") {
    runPlaceholder();
    return;
  }
  const pi = args.indexOf("--plate");
  const plateArg = pi !== -1 ? args[pi + 1] : undefined;
  await runReal(plateArg);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`[slice-portrait-plate] FAILED: ${e.message}`);
    process.exit(1);
  });
}
