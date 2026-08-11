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
 * ATOMICITY (ADR-0080 D5, art brief §1.2bis "portée du rejet"), scaled to N
 * plates (Bertrand, 2026-08-06 — "complète la collection"): there is no
 * per-band mode, no per-plate mode, and no "regenerate one variant/one seed"
 * flag — that absence IS the atomicity guarantee. A run fetches
 * `VARIANTS_PER_BAND` (10) independent WHOLE-face plates from the SAME prompt
 * family (seeds `PORTRAIT_PROMPT_FAMILY.seed + i`), and either writes all 24
 * files (variant `i` of band `b` = seam-slice `b` of plate `i`) + the
 * manifest together, or writes nothing. A batch where ANY plate fails ANY
 * gate — its own registration, its own seam continuity, OR reproducibility
 * against the other plates (brief §10.3 `INTER_PLATE_TOLERANCE`) — is
 * rejected WHOLE, never per-plate: brief §10's anti-cherry-picking clause
 * ("une planche rejetée ne se re-génère pas à la graine suivante jusqu'à ce
 * qu'elle passe") forbids selectively re-rolling a single failure until it
 * passes, so there is deliberately no "drop the bad plate and draw a
 * replacement" code path — a batch failure means regenerating the WHOLE
 * batch (same seeds, or a new seed set decided batch-wide), never patching
 * one seed in place. See `runReal`'s own comment for the full reasoning.
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
 *     The REAL pipeline: fetch (or read a single hand-supplied PNG, with
 *     --plate, reused for every seed slot — local testing only) 6 whole-face
 *     plates, run the recalage pass on each plate's skull OUTLINE
 *     (crown/chin ordinates + per-row half-widths, art brief §10.2 — margin
 *     ticks are abandoned), check every plate reproduces the others within
 *     `INTER_PLATE_TOLERANCE` (brief §10.3), slice each at the 3 seams with
 *     bleed removed at the ordinate, measure the 4 seam-tolerance grandeurs
 *     of §9.3 per plate per seam, and write all 40 files + the manifest ONLY
 *     if every plate passes every gate. FLUX generation is normally BLOCKED
 *     in the local sandbox (AGENTS.md) — this mode is exercised in CI
 *     (.github/workflows/gen-portrait-plate.yml).
 *
 *   node scripts/slice-portrait-plate.mjs --explore-faces <N>
 *     RECONNAISSANCE, not production (Bertrand, 2026-08-06 — the `kontext`
 *     img2img derivation this replaced is abandoned: "il te suffit de
 *     générer N visages différents, en entier, PUIS ENSUITE tu découpes les
 *     bandes"). Generates N WHOLE-face plates from the SAME prompt family
 *     with different seeds, writes the raw PNGs + a best-effort measurement
 *     report to `scripts/.dbg-portrait-explore/` — NEVER `public/assets/`,
 *     never the manifest, never a commit. Reports what `detectSkullContour`/
 *     `measureControlAnchors` find per plate but never fails the job on a
 *     measurement problem — the point is to look at the images.
 *
 * `FORCE=1` regenerates even if all 40 files already exist. Without it, an
 * existing complete set is left untouched (idempotent).
 *
 * -----------------------------------------------------------------------
 * HONEST LIMIT — read before trusting this on a real plate (root-cause note).
 * -----------------------------------------------------------------------
 * The recalage pass below corrects VERTICAL drift only (a uniform scale +
 * offset fitted to the skull outline's crown/chin ordinates, art brief
 * §10.2 A0 — VOIE B, Bertrand/lead-art, ROLL 2 retrospective 2026-08-05,
 * replacing the abandoned margin-tick approach). It does NOT resample for
 * rotation/tangent drift — the brow/eye density bar's left/right
 * disagreement is used as a tilt ESTIMATE (§10.2 A1) and folded into the
 * plate-level verdict, but the pixels are never rotated back straight. If
 * FLUX drifts framing AND tilts the face, this pass will not save the plate
 * — it will (correctly) cause registration or the seam measurement to
 * reject it, and the plate must be regenerated, not patched. A full affine
 * (rotation + scale) resample is the natural next step if plate rejects
 * turn out to cluster on tilt rather than pure vertical drift; not built
 * here because it cannot be validated without a real plate to test against
 * (network is blocked in this sandbox), and shipping unverified
 * rotation-resampling code that silently miscorrects a face is worse than
 * shipping the honest, narrower correction plus a hard reject.
 *
 * WHAT THIS ASSUMES ABOUT THE DRAWING, cost of being wrong: TWO real draws
 * already spent on the wrong assumption that FLUX reliably draws printed
 * margin ticks (brief §9.4 named the failure mode in advance; ROLL 2
 * confirmed it — 3 of 4 candidate ticks measured at ~1.0x ambient margin
 * noise against a 3x confidence floor. FLUX did not draw the ticks badly,
 * it did not draw them). VOIE B does not bet on FLUX's statistical
 * reliability at all — it bets on a gabarit LAW already in force (brief
 * §1.1: "le contour appartient au gabarit, pas à la variante") now written
 * directly into the prompt (§10.1: "One unbroken closed skull outline...
 * blank white cheeks and forehead"). This script still assumes the outline
 * renders as ONE continuous ~5-6px stroke, closed, with crown/chin
 * extractable as franc extremes and the brow/eye and mouth density peaks
 * each unique in their window (>=2x their window's second-best candidate,
 * §10.2 clause 1 — the direct fix for the confidence-gate defect that broke
 * margin-tick detection). Nothing here GUARANTEES that assumption either;
 * brief §10.4 names the exact abandon condition (the outline isn't a
 * measurable object, OR a control peak isn't unique despite the blank-
 * cheeks clause, OR the first `kontext` derivative fails reproducibility
 * against the hero) and caps the budget at one re-roll beyond ROLL 3, only
 * if the failure is a nameable, correctable drawing defect — not a third
 * geometry this script invents on its own authority.
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
export const VARIANTS_PER_BAND = 10;
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
// Margin band around the portrait crop. Originally where the eye-line /
// nose-base / axis / corner registration TICKS lived (brief §1.2bis) —
// those are ABANDONED (brief §10, VOIE B: recalage now reads the skull
// outline drawn INSIDE the portrait crop, not printed marks in this
// margin). Still absolute, unchanged by §9 GATE DIMENSIONS: this constant
// remains the fixed offset at which the portrait bbox sits inside the
// fetched plate — cropping still needs a defined origin regardless of how
// registration is done — and crop-crosses/corner marks may still be printed
// here for a human to eyeball, they are simply no longer READ by any
// detector in this file.
export const PLATE_MARGIN_PX = 48;
export const PLATE_WIDTH = PORTRAIT_WIDTH + PLATE_MARGIN_PX * 2;
export const PLATE_HEIGHT = PORTRAIT_HEIGHT + PLATE_MARGIN_PX * 2;

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
  // Cadrage lock — GATED TEXT, brief §11.2bis (lead-art, 2026-08-06),
  // superseding §10.1. Written here WORD FOR WORD; the six load-bearing
  // clauses (§11.2bis) cannot be removed or reworded without re-gating.
  // Front-loaded because FLUX over-weights early tokens: medium + casting +
  // symmetry + constant skull width land before any face word.
  //
  // Two words that ROLL 1/2 proved are not decoration, and that no future
  // edit may quietly drop:
  //   • `crown` is GONE from this field (it appeared twice in §10.1, plus
  //     `collarbone`). Read literally by FLUX those are OBJECTS — the two
  //     rolls came back as crowned women in lace collars. The framing they
  //     carried is now "top of head and chin inside the sheet", which says
  //     the same geometry without naming anything wearable (brief §11.1).
  //   • `skull` is GONE from this field too (it appeared THREE times: `constant
  //     skull width`, `One unbroken closed skull outline`, `small ears flat to
  //     the skull`). Same failure as `crown`, same cause: read literally it is
  //     an OBJECT, and the model eventually drew one — Bertrand's contact sheet
  //     came back with five actual skulls, orbits as flat black holes and a
  //     stitched mouth (2026-08-09). The geometry is now carried by `head`,
  //     which says the same thing and names nothing macabre. `scalp` is banned
  //     for the same reason: the short-hair explorations that used `scalp
  //     blank` / `scalp stub` produced bare crania.
  //
  //     The rule this makes explicit, because `crown` alone did not: NEVER name
  //     a body part that is ALSO a standalone object the model can draw. Use
  //     the whole-form word (`head`) and let the geometry clauses do the work.
  //     `lintPromptFamily` now enforces the list rather than trusting a comment.
  //   • `one man's head` is a DATED CASTING DECISION (Bertrand, 2026-08-06,
  //     brief §11.3), not a stylistic accident. The gender token is a
  //     mandatory slot: it may be CHANGED, never EMPTIED — an empty slot is
  //     what handed the casting to FLUX's prior in the first place. Removing
  //     it is a prompt-gate FAIL.
  //
  // Frontality is expressed as OBSERVABLE SYMMETRY, not as a projection
  // term: `strict frontal view, orthographic projection, centred` failed on
  // ROLL 2 (the plate came back three-quarter). "both ears equal, both eyes
  // the same size on one level line" is false by construction on a turned
  // head, and it is the same quantity `measureControlAnchors` reads as
  // `tiltPx` — prompt and detector now state one thing.
  //
  // `detectSkullContour`/`measureControlAnchors` read exactly this field:
  // the closed outline (crown/chin extremes, A0), and the blank cheeks/
  // forehead that keep the brow/eye and mouth density peaks (A1/A2) unique
  // in their window.
  opening:
    "Black ink drawing on a printed sheet: one man's head facing forward, symmetrical about a " +
    "vertical centre line, both ears equal, both eyes the same size on one level line, constant " +
    "head width. One unbroken closed outline around the head containing the hair, top of head " +
    "and chin inside the sheet, blank white cheeks and forehead. ",
  // gabarit-01 hero face — subject + silhouette ONLY (no style, no ground, no
  // colour). Every feature is named as a flat, level volume so the three seam
  // ordinates (0.32 forehead / 0.52 above the nose bridge / 0.72 philtrum)
  // fall in flat, low-contrast zones (brief §1.2). Ears, neck and shoulders
  // are stated here because they belong to the gabarit, never to a band.
  // Variation (6 per band) is derived later by `kontext` img2img from THIS
  // validated plate, one named descriptor at a time (brief §5.2 step 4) —
  // never by re-rolling this prompt, which would change the skull.
  //
  // GATED TEXT, brief §11.2bis. Three clauses were LOOSENED here on purpose
  // (§11.2): `straight low hairline` → `a hairline across it`, `wide-set
  // eyes under a heavy level brow` → `eyes under a heavy level brow`,
  // `straight narrow nose ending blunt` → `a nose`. Motive: this field named
  // nine features out of nine, leaving the seed no room to work — the two
  // rolls came back as the same face twice, which would give the scene no
  // difficulty at all. The vacated shapes are what the seed and the five
  // `kontext` derivations now vary.
  //
  // What did NOT loosen, and why each one is load-bearing rather than
  // descriptive:
  //   • `heavy` (level brow) — A1 is a DENSITY peak, and what makes it
  //     unique in its window is ink LOAD, not ordinate. `level` alone fixes
  //     where the peak sits; `heavy` is what makes there be a peak at all.
  //     Dropping it manufactures brief §10.4 abandon condition 2 (lead-art
  //     C1, 2026-08-06).
  //   • `one thin level mouth line` — the low control peak A2; `line` names
  //     the mouth as a single horizontal, not a lip volume.
  //   • `broad forehead` (C1 at 0.32), `long flat philtrum` (C3 at 0.72) —
  //     the seam zones, which must stay flat and low-contrast.
  //   • `square jaw`, `small ears flat to the skull`, `bare neck` — the
  //     outline, i.e. the A0 referential itself (brief §8.3 Q5).
  prompt:
    "Hard weathered face, broad forehead, a hairline across it, eyes under a heavy level brow, " +
    "a nose, long flat philtrum, one thin level mouth line, square jaw, small ears flat to the " +
    "head, bare neck. ",
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
  // Body parts that are ALSO standalone objects the model can draw. Each entry is
  // a measured failure, not a precaution: `crown`/`collarbone` returned crowned
  // women in lace collars, `skull`/`scalp` returned actual skulls with hollow
  // orbits. A comment already warned about `crown` and the same class of word got
  // back in three times over — hence a check rather than prose.
  for (const banned of ["crown", "collarbone", "skull", "scalp"]) {
    if (new RegExp(`\\b${banned}s?\\b`, "i").test(assembled)) {
      errors.push(
        `assembled prompt contains "${banned}" — a body part that is also a drawable object; ` +
          "use the whole-form word (`head`) and let the geometry clauses carry the framing",
      );
    }
  }
  // The gender token is a mandatory slot (brief §11.3): it may be CHANGED, never
  // EMPTIED — an empty slot is what handed the casting to the model's prior.
  if (!/\b(man|woman|man's|woman's)\b/i.test(assembled)) {
    errors.push(
      "assembled prompt names no gender — the casting slot may be changed but never emptied " +
        "(brief §11.3)",
    );
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

// ── Recalage (registration) pass — VOIE B, skull-contour anchors ─────────
// (brief §10.2, Bertrand/lead-art, ROLL 2 retrospective 2026-08-05).
// Margin registration ticks are ABANDONED — see file header. This section
// finds the skull OUTLINE instead (crown/chin ordinates = A0, the only
// registration reference) plus two CONTROL-ONLY density peaks inside the
// face (brow/eye bar = A1, mouth line = A2) — never used to derive a
// resample, only measured and gated. The former nose-base anchor is
// abandoned outright (brief §10.2: two small, non-contiguous, low-ink,
// high-shape-variance blobs would rebuild ROLL 2's failure mode inside the
// face).
function luminance(png, x, y) {
  const idx = (png.width * y + x) << 2;
  return (png.data[idx] * 299 + png.data[idx + 1] * 587 + png.data[idx + 2] * 114) / 1000;
}

// The skull outline is drawn as ONE continuous ~5-6px stroke (brief §10.2
// A0 row; §10.1's `blank white cheeks and forehead` exists specifically so
// this stroke has no competing dark structure nearby). 5 is the floor of
// that stated range, not a value this script chose independently.
const MIN_CONTOUR_RUN_PX = 5;

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

/** Scans `[yFrom, yTo]` for the first row (in the given `direction`, "down"
 * from `yFrom` or "up" from `yTo`) whose longest continuous dark run meets
 * `MIN_CONTOUR_RUN_PX` — the crown/chin extreme. Returns `{ found: false,
 * reason }` (never a guessed extreme) when no such row exists, naming how
 * many rows were scanned and the longest run actually found, so a caller
 * can tell "contour absent" from "contour present but too faint" without
 * re-deriving the scan. */
function findContourExtreme(png, xFrom, xTo, yFrom, yTo, direction) {
  if (yFrom > yTo) {
    return {
      found: false,
      reason: `search window y∈[${yFrom},${yTo}] is empty (yFrom > yTo) — nothing to scan`,
    };
  }
  const ys = direction === "down" ? range(yFrom, yTo, 1) : range(yTo, yFrom, -1);
  let longestRunSeen = 0;
  for (const y of ys) {
    const { run } = scanRow(png, xFrom, xTo, y);
    if (run > longestRunSeen) longestRunSeen = run;
    if (run >= MIN_CONTOUR_RUN_PX) return { found: true, y, run };
  }
  return {
    found: false,
    reason:
      `no row in y∈[${yFrom},${yTo}] (x∈[${xFrom},${xTo})) has a continuous dark run ` +
      `≥${MIN_CONTOUR_RUN_PX}px (longest run seen: ${longestRunSeen}px) — the outline is not a ` +
      "measurable object here",
  };
}

function range(from, to, step) {
  const out = [];
  for (let v = from; step > 0 ? v <= to : v >= to; v += step) out.push(v);
  return out;
}

// Fraction of the crown→chin span that must have BOTH a left and a right
// contour edge for the axis to be trusted. This is this script's OWN
// engineering floor (not a number lead-art specified) standing in for "the
// outline doesn't break/double along its length" — brief §10.5's "fermé,
// continu, d'une seule épaisseur, sur tout le pourtour" is a visual/human
// criterion this script cannot fully verify (see HONEST LIMIT); this ratio
// is a coarse, explicitly-approximate mechanical floor for the same idea,
// not a substitute for it.
const MIN_CONTOUR_ROW_COVERAGE_RATIO = 0.8;

/** Detects the skull-outline registration reference (brief §10.2 A0) over
 * `[xFrom, xTo) x [yFrom, yTo]`: crown ordinate (topmost row meeting
 * `MIN_CONTOUR_RUN_PX`), chin ordinate (bottommost such row), and the
 * density-weighted median axis (mean of each row's left/right sub-pixel
 * centroid between crown and chin — same `subpixelEdgeCentroid` primitive
 * `measureSeamContinuity` uses, reused here rather than re-derived).
 * Throws — never returns a degraded/guessed value — when the crown, the
 * chin, or enough of the axis coverage is missing; per brief §10.2 clause 2,
 * "C-B reste en vigueur, transposé": the mechanism must be able to fail on
 * the drawing exactly as it could fail on the margin. */
export function detectSkullContour(png, { xFrom, xTo, yFrom, yTo }) {
  const crown = findContourExtreme(png, xFrom, xTo, yFrom, yTo, "down");
  const chin = findContourExtreme(png, xFrom, xTo, yFrom, yTo, "up");
  const missing = [];
  if (!crown.found) missing.push(`  ✗ crown — searched y∈[${yFrom},${yTo}]: ${crown.reason}`);
  if (!chin.found) missing.push(`  ✗ chin — searched y∈[${yFrom},${yTo}]: ${chin.reason}`);
  if (missing.length > 0) {
    throw new Error(
      `skull contour ABORTED — ${missing.length}/2 extreme(s) not found with confidence:\n` +
        `${missing.join("\n")}\n` +
        "The skull outline is not a measurable object on this plate (brief §10.4 abandon " +
        "condition 1) — refusing to register on it. The plate is rejected WHOLE and must be " +
        "regenerated, not patched.",
    );
  }
  if (crown.y >= chin.y) {
    throw new Error(
      `skull contour ABORTED — crown (measured y=${crown.y}) is not above chin ` +
        `(measured y=${chin.y}); a valid portrait has the crown strictly above the chin. This ` +
        "reads as a flipped/mirrored plate or a mismatched extreme pair, not a proportion " +
        "issue — refusing to register. The plate is rejected WHOLE and must be regenerated.",
    );
  }

  let sumCenters = 0;
  let coveredRows = 0;
  const totalRows = chin.y - crown.y + 1;
  for (let y = crown.y; y <= chin.y; y++) {
    const edges = skullEdges(png, y);
    const left = subpixelEdgeCentroid(png, y, edges.left);
    const right = subpixelEdgeCentroid(png, y, edges.right);
    if (left === null || right === null) continue;
    sumCenters += (left + right) / 2;
    coveredRows++;
  }
  const coverageRatio = coveredRows / totalRows;
  if (coverageRatio < MIN_CONTOUR_ROW_COVERAGE_RATIO) {
    throw new Error(
      `skull contour ABORTED — only ${coveredRows}/${totalRows} rows ` +
        `(${(coverageRatio * 100).toFixed(0)}%) between crown (y=${crown.y}) and chin ` +
        `(y=${chin.y}) have both a left and right edge, below the ` +
        `${(MIN_CONTOUR_ROW_COVERAGE_RATIO * 100).toFixed(0)}% floor — the outline reads as ` +
        "broken/discontinuous over its height, not a single closed stroke. The plate is " +
        "rejected WHOLE and must be regenerated.",
    );
  }

  return { crownY: crown.y, chinY: chin.y, axisX: sumCenters / coveredRows, coverageRatio };
}

// The exact clause brief §10.2 makes opposable: "un pic de densité n'est un
// ancrage que s'il est UNIQUE — le plus sombre ET séparé du deuxième
// candidat de sa fenêtre par un facteur 2". This is the direct fix for the
// margin-tick era's C-B defect (a "darkest row wins" detector that always
// returns SOME row): the two candidates compared here are the two best
// LOCAL MAXIMA of the row-density profile (non-maximum suppression), not
// the two highest-density ROWS — adjacent rows of one genuine peak are
// highly correlated and would trivially fail a naive top-2-rows comparison
// even for an unambiguous feature.
const PEAK_UNIQUENESS_RATIO = 2;

function rowInkDensity(png, xFrom, xTo, y) {
  let sum = 0;
  for (let x = xFrom; x < xTo; x++) sum += inkDensity(png, x, y);
  return sum / Math.max(1, xTo - xFrom);
}

/** Confidence-gated control-peak search (brief §10.2 A1/A2): scans
 * `[yFrom, yTo]` for local maxima of the row-density profile over
 * `[xFrom, xTo)`, and accepts the best one only if it is at least
 * `PEAK_UNIQUENESS_RATIO`x the SECOND-best local maximum in the same
 * window. Returns `{ found: false, reason }` naming both candidates' y and
 * density (never a guess) when the window has no local maximum at all, or
 * two competing ones — brief §10.4 abandon condition 2: this is meant to
 * fire when FLUX fills the face with texture instead of the two named
 * peaks, exactly as margin ticks failed on a textured margin. */
function findDensityPeak(png, xFrom, xTo, yFrom, yTo) {
  if (yFrom > yTo) {
    return { found: false, reason: `search window y∈[${yFrom},${yTo}] is empty` };
  }
  const profile = [];
  for (let y = yFrom; y <= yTo; y++)
    profile.push({ y, density: rowInkDensity(png, xFrom, xTo, y) });

  const isLocalMax = profile.map((r, i) => {
    const prev = profile[i - 1];
    const next = profile[i + 1];
    return (!prev || r.density >= prev.density) && (!next || r.density >= next.density);
  });
  // Merge ADJACENT local-maximum rows into ONE cluster before comparing.
  // Without this, a flat plateau (e.g. a solid-filled control band, exactly
  // the shape a real brow/eye bar or mouth line draws) registers one
  // "local maximum" per row of the plateau — the genuine single feature
  // would then get compared against its own immediate neighbour (ratio
  // ~1.0x) instead of an actual competing peak, and abort on itself.
  const clusters = [];
  for (let i = 0; i < profile.length; i++) {
    if (!isLocalMax[i]) continue;
    const lastCluster = clusters[clusters.length - 1];
    const lastRow = lastCluster?.rows[lastCluster.rows.length - 1];
    if (lastRow && profile[i].y === lastRow.y + 1) lastCluster.rows.push(profile[i]);
    else clusters.push({ rows: [profile[i]] });
  }
  if (clusters.length === 0) {
    return {
      found: false,
      reason: `no local maximum in the row-density profile over y∈[${yFrom},${yTo}]`,
    };
  }
  const peaks = clusters.map((c) =>
    c.rows.reduce((best, r) => (r.density > best.density ? r : best), c.rows[0]),
  );
  const sorted = [...peaks].sort((a, b) => b.density - a.density);
  const [best, second] = sorted;
  const secondDensity = second ? second.density : 0;
  const ratio = best.density / Math.max(0.001, secondDensity);
  if (ratio < PEAK_UNIQUENESS_RATIO) {
    return {
      found: false,
      reason:
        `best peak ${best.density.toFixed(3)} density at y=${best.y} is only ` +
        `${ratio.toFixed(1)}x the window's second-best local maximum ` +
        `${secondDensity.toFixed(3)} at y=${second.y} (need ${PEAK_UNIQUENESS_RATIO}x) — reads ` +
        "as generalised texture, not a unique control peak",
    };
  }
  return { found: true, y: best.y, density: best.density, ratio };
}

// Distance from a seam under which a control peak is ITSELF a plate defect
// (brief §10.2 clause 3): C1/C2/C3 are, by construction, flat/low-contrast
// zones (brief §1.2) — a density peak this close to one means a strong
// line crossed a seam (brief §8.4-5), not a genuine anchor.
const MIN_ANCHOR_SEAM_DISTANCE_FRAC = 0.05;

/** Measures brief §10.2's CONTROL-ONLY anchors — A1 (brow/eye density bar,
 * split left/right half of the portrait width for a tilt estimate) and A2
 * (mouth-line density peak, searched between seam C3 and the measured
 * chin) — plus the "no peak within 5% of H of a seam" plate-defect check
 * (clause 3). NEVER used to derive a resample (see file header); this is
 * diagnostic/gating only. Throws (never a degraded verdict) when a peak is
 * missing or not unique, or when a peak sits on a seam — brief §10.4
 * abandon condition 2 is written for exactly the first failure. */
export function measureControlAnchors(png, contour) {
  const seamsAbs = SEAMS.map((f) => PLATE_MARGIN_PX + Math.round(f * PORTRAIT_HEIGHT));
  const [c1, c2, c3] = seamsAbs;
  const portraitXFrom = PLATE_MARGIN_PX;
  const portraitXTo = PLATE_MARGIN_PX + PORTRAIT_WIDTH;
  const midX = portraitXFrom + Math.round(PORTRAIT_WIDTH / 2);

  const a1Left = findDensityPeak(png, portraitXFrom, midX, c1, c2);
  const a1Right = findDensityPeak(png, midX, portraitXTo, c1, c2);
  const a2 = findDensityPeak(png, portraitXFrom, portraitXTo, c3, contour.chinY);

  const missing = [];
  if (!a1Left.found) {
    missing.push(`  ✗ A1 (brow/eye bar), left half — y∈[${c1},${c2}]: ${a1Left.reason}`);
  }
  if (!a1Right.found) {
    missing.push(`  ✗ A1 (brow/eye bar), right half — y∈[${c1},${c2}]: ${a1Right.reason}`);
  }
  if (!a2.found) {
    missing.push(`  ✗ A2 (mouth line) — y∈[${c3},${contour.chinY}]: ${a2.reason}`);
  }
  if (missing.length > 0) {
    throw new Error(
      `control anchors ABORTED — ${missing.length}/3 not found with confidence:\n` +
        `${missing.join("\n")}\n` +
        "brief §10.4 abandon condition 2 — a control peak this ambiguous reads as FLUX filling " +
        "the face with texture instead of drawing the two named peaks, the same failure mode " +
        "margin ticks had. The plate is rejected WHOLE and must be regenerated.",
    );
  }

  const anchors = [
    { label: "A1 left", y: a1Left.y },
    { label: "A1 right", y: a1Right.y },
    { label: "A2", y: a2.y },
  ];
  const seamProblems = [];
  for (const a of anchors) {
    for (let i = 0; i < seamsAbs.length; i++) {
      const distancePx = Math.abs(a.y - seamsAbs[i]);
      if (distancePx < MIN_ANCHOR_SEAM_DISTANCE_FRAC * PORTRAIT_HEIGHT) {
        seamProblems.push(
          `  ✗ ${a.label} (y=${a.y}) is ${distancePx}px from seam C${i + 1} (y=${seamsAbs[i]}) ` +
            `— closer than ${(MIN_ANCHOR_SEAM_DISTANCE_FRAC * 100).toFixed(0)}% of H`,
        );
      }
    }
  }
  if (seamProblems.length > 0) {
    throw new Error(
      "control anchors ABORTED — a strong line crosses a seam (brief §10.2 clause 3 / " +
        `§8.4-5):\n${seamProblems.join("\n")}\nThe plate is rejected WHOLE and must be ` +
        "regenerated.",
    );
  }

  return {
    a1Y: (a1Left.y + a1Right.y) / 2,
    a2Y: a2.y,
    tiltPx: Math.abs(a1Left.y - a1Right.y),
  };
}

/** Straight crop of the portrait bbox (PORTRAIT_WIDTH × PORTRAIT_HEIGHT) at
 * its fixed plate offset (PLATE_MARGIN_PX on every side). No resample: under
 * VOIE B there is nothing to correct the HERO plate toward —
 * `detectSkullContour`'s job on the hero plate is to validate the outline
 * exists and RECORD its measurements (crownY/chinY/axisX) as the reference
 * a future derivative plate gets compared against (`compareToHeroPlate`),
 * not to warp pixels. A per-variant `kontext` pipeline that needs to ALIGN a
 * derived plate onto the hero would resample here; not built, because
 * nothing in this script derives per-variant plates yet (V1: every variant
 * comes from this same hero slice — see the loop comment in `runReal`). */
export function cropPortrait(png) {
  const out = {
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
    data: Buffer.alloc(PORTRAIT_WIDTH * PORTRAIT_HEIGHT * 4),
  };
  for (let y = 0; y < PORTRAIT_HEIGHT; y++) {
    const srcYAbs = PLATE_MARGIN_PX + y;
    for (let x = 0; x < PORTRAIT_WIDTH; x++) {
      const srcXAbs = PLATE_MARGIN_PX + x;
      const srcIdx = (png.width * srcYAbs + srcXAbs) << 2;
      const dstIdx = (PORTRAIT_WIDTH * y + x) << 2;
      png.data.copy(out.data, dstIdx, srcIdx, srcIdx + 4);
    }
  }
  return out;
}

/** RGB (no alpha — bands are opaque, brief §1.0) slice of `[top, bottom)`
 * from a registered portrait. Pure function of the portrait it's given, so
 * the batch pipeline calls it once per (plate, band) pair — variant `i` of
 * band `b` is exactly `bandRGB(plates[i].portrait, band.top, band.bottom)`. */
function bandRGB(portrait, top, bottom, height = bottom - top) {
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
}

// §10.3's NEW table — the INTER-PLATE reproducibility check (derived vs
// hero), DISTINCT from `TOLERANCE` below (§9.3, seam continuity WITHIN one
// plate — lead-art was explicit these do not change: "un recalage raté
// translate les deux côtés d'une couture de la même quantité", so §9.3 never
// depended on registration accuracy and doesn't loosen with it). These
// thresholds ARE loosened relative to §9.3's, and deliberately: A0 measures
// a CURVE (skull cap, chin), not a printed straight edge — the extreme
// ordinate of a flat arc is inherently less well-defined than a sub-pixel
// centroid on a printed line, and a hairstyle variant will move the crown by
// a few px regardless of what the prompt says. Holding these to §9.3's
// sub-pixel standard would reject every plate — lead-art's own words: "un
// contrôle qui rejette tout ne protège rien".
export const INTER_PLATE_TOLERANCE = {
  heightDeltaPctOfH: { pass: 0.5, fail: 1.0 },
  axisDeltaPx: { pass: 1.5, fail: 3.0 },
  a1DeltaPctOfH: { pass: 1.0, fail: 2.0 },
  a2DeltaPctOfH: { pass: 1.5, fail: 3.0 },
  tiltPx: { pass: 8, fail: 16 },
};

/** Compares a candidate plate's A0/A1/A2 measurements against the HERO
 * plate's (brief §10.2 clause 4: "chaque planche dérivée est recalée SUR LA
 * PLANCHE HÉROS, A0 → A0" — a numeric comparison, not a pixel resample; see
 * `cropPortrait` for why this script doesn't warp derived plates onto the
 * hero today). Pure function over already-measured numbers — no image I/O —
 * so it's directly testable against fixed inputs, independent of the
 * density-peak/contour detectors above. Returns `{ pass, alerts, values }`,
 * the same shape `measureSeamContinuity` returns: an outright FAIL value, OR
 * ≥2 simultaneous alert-zone values, rejects the WHOLE candidate plate
 * (brief §1.2bis "portée du rejet", carried over unchanged). */
export function compareToHeroPlate(candidate, hero) {
  const heroH = hero.chinY - hero.crownY;
  const candidateH = candidate.chinY - candidate.crownY;
  const values = {
    heightDeltaPctOfH: (Math.abs(candidateH - heroH) / heroH) * 100,
    axisDeltaPx: Math.abs(candidate.axisX - hero.axisX),
    a1DeltaPctOfH:
      (Math.abs(candidate.a1Y - candidate.crownY - (hero.a1Y - hero.crownY)) / heroH) * 100,
    a2DeltaPctOfH:
      (Math.abs(candidate.a2Y - candidate.crownY - (hero.a2Y - hero.crownY)) / heroH) * 100,
    tiltPx: candidate.tiltPx,
  };

  const alerts = [];
  let fail = false;
  const check = (key, tol) => {
    const v = values[key];
    if (v >= tol.fail) fail = true;
    else if (v > tol.pass) alerts.push(key);
  };
  check("heightDeltaPctOfH", INTER_PLATE_TOLERANCE.heightDeltaPctOfH);
  check("axisDeltaPx", INTER_PLATE_TOLERANCE.axisDeltaPx);
  check("a1DeltaPctOfH", INTER_PLATE_TOLERANCE.a1DeltaPctOfH);
  check("a2DeltaPctOfH", INTER_PLATE_TOLERANCE.a2DeltaPctOfH);
  check("tiltPx", INTER_PLATE_TOLERANCE.tiltPx);

  return { pass: !fail && alerts.length < 2, alerts, values };
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
async function fetchPlate(plateArg, seed) {
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
  const url = fluxUrl(assembled, seed ?? PORTRAIT_PROMPT_FAMILY.seed, PLATE_WIDTH, PLATE_HEIGHT);
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

/** Builds the wrong-size diagnostic message for one plate, and says whether
 * the cause is SYSTEMIC (Pollinations' area cap — every plate in the batch
 * requests the identical PLATE_WIDTH/PLATE_HEIGHT, so it will hit every
 * remaining seed identically; no point spending 5 more FLUX calls to learn
 * the same fact 5 more times) or plate-specific (collected into the batch
 * report, the rest of the batch is still worth fetching). */
function sizeMismatchDiagnostic(plate) {
  if (isAspectPreservedScaleDown(plate.width, plate.height, PLATE_WIDTH, PLATE_HEIGHT)) {
    const requestedAreaPx = PLATE_WIDTH * PLATE_HEIGHT;
    const actualAreaPx = plate.width * plate.height;
    const overCap = requestedAreaPx > POLLINATIONS_FLUX_AREA_CAP_PX;
    return {
      systemic: true,
      message:
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
    };
  }
  return {
    systemic: false,
    message:
      `plate is ${plate.width}x${plate.height}, expected ${PLATE_WIDTH}x${PLATE_HEIGHT} — ` +
      "framing drifted beyond what registration can fix (see file-header HONEST LIMIT)",
  };
}

/** Fetches, validates and registers ONE plate at the given seed. Returns
 * `{ seed, buf, plate, contour, controls, portrait }` on success. Throws a
 * `{ systemic }`-tagged error on a wrong-size plate (batch-fatal, see
 * `sizeMismatchDiagnostic`) or on a fetch/decode failure; returns
 * `{ seed, problem }` (never throws) on a registration failure (missing
 * contour, missing A1/A2, tilt over threshold) — a per-plate content defect
 * that does not prevent measuring the REST of the batch. */
async function fetchAndRegisterOnePlate(plateArg, seed) {
  let buf, plate;
  try {
    const rawBuf = await fetchPlate(plateArg, seed);
    buf = await ensurePngBuffer(rawBuf);
    plate = PNG.sync.read(buf);
  } catch (e) {
    const err = new Error(`seed ${seed}: fetch/decode failed — ${e.message}`);
    err.systemic = false;
    throw err;
  }
  if (plate.width !== PLATE_WIDTH || plate.height !== PLATE_HEIGHT) {
    const { message, systemic } = sizeMismatchDiagnostic(plate);
    const err = new Error(`seed ${seed}: ${message}`);
    err.systemic = systemic;
    throw err;
  }

  let contour, controls;
  try {
    // A0 first (registration reference), THEN the face (brief §10.5's read
    // order, one level deeper than §8.4's retired "repères avant le
    // visage"): if the outline isn't measurable, there is no point
    // measuring anything else on THIS plate.
    contour = detectSkullContour(plate, portraitRegion());
    controls = measureControlAnchors(plate, contour);
  } catch (e) {
    return { seed, problem: `seed ${seed}: registration — ${e.message}` };
  }
  if (controls.tiltPx >= INTER_PLATE_TOLERANCE.tiltPx.fail) {
    return {
      seed,
      problem:
        `seed ${seed}: A1 (brow/eye bar) tilt disagreement ${controls.tiltPx}px is at or ` +
        `beyond the ${INTER_PLATE_TOLERANCE.tiltPx.fail}px reject threshold (brief §10.3); ` +
        "rotation is not correctable here (see file-header HONEST LIMIT).",
    };
  }
  if (controls.tiltPx > INTER_PLATE_TOLERANCE.tiltPx.pass) {
    console.warn(
      `[slice-portrait-plate] ⚠ seed ${seed}: A1 tilt ${controls.tiltPx}px is in the alert ` +
        `zone (${INTER_PLATE_TOLERANCE.tiltPx.pass}-${INTER_PLATE_TOLERANCE.tiltPx.fail}px, brief §10.3)`,
    );
  }
  return { seed, buf, plate, contour, controls, portrait: cropPortrait(plate) };
}

/** Batch production pipeline (Bertrand, 2026-08-06, "complète la collection"
 * — replaces the V1 "one gabarit, one hero plate" TODO this file used to
 * carry): `VARIANTS_PER_BAND` (10) independent whole-face plates, same
 * `PORTRAIT_PROMPT_FAMILY`, seeds `PORTRAIT_PROMPT_FAMILY.seed + i` (the
 * exact scheme ROLL 3's validated pair used, extended) — sliced at the SAME
 * 3 seams, variant `i` of band `b` = seam-slice `b` of plate `i`. The
 * manifest SHAPE does not change (still `bands[id] = VARIANTS_PER_BAND
 * entries`, as it already was written to be) — only how each buffer is
 * produced.
 *
 * ATOMICITY, scaled to N plates, not relaxed (ADR-0080 D5): every plate is
 * fetched and measured, EVERY problem across the WHOLE batch is collected,
 * and only THEN does the batch pass or reject as ONE unit — nothing is
 * written unless all 6 plates individually pass AND reproduce each other
 * within `INTER_PLATE_TOLERANCE`. There is deliberately NO "drop the bad
 * plate and draw a replacement" path: brief §10's anti-cherry-picking
 * clause ("une planche rejetée ne se re-génère pas à la graine suivante
 * jusqu'à ce qu'elle passe") forbids selectively re-rolling a single
 * failure until it passes, and the cleanest way to make that impossible is
 * to not build a per-plate retry mechanism at all — a batch failure is a
 * batch failure, reported with every number, and regenerating means
 * re-running the WHOLE batch (same seeds, or a new seed set decided
 * batch-wide by a human), never patching one seed in place. */
export async function runReal(plateArg) {
  const seeds = Array.from(
    { length: VARIANTS_PER_BAND },
    (_, i) => PORTRAIT_PROMPT_FAMILY.seed + i,
  );

  const plates = [];
  const problems = [];
  for (const seed of seeds) {
    let result;
    try {
      result = await fetchAndRegisterOnePlate(plateArg, seed);
    } catch (e) {
      problems.push(e.message);
      if (e.systemic) {
        console.error(
          "[slice-portrait-plate] REJECTED — systemic failure, not spending the remaining " +
            `${seeds.length - seeds.indexOf(seed) - 1} FLUX call(s) on the same cap:`,
        );
        console.error(`  ✗ ${e.message}`);
        throw new Error("batch rejected — see above; the WHOLE batch must be regenerated");
      }
      continue;
    }
    if (result.problem) problems.push(result.problem);
    else plates.push(result);
  }

  // Inter-plate reproducibility (brief §10.3, point 1 of the 2026-08-06
  // brief: "vérifie-le et rapporte-le" — do the same fixed seams actually
  // land on the same facial position across independently-drawn plates?).
  // plates[0] is the reference — an arbitrary but deterministic choice
  // (first successfully-registered plate), not a privileged "hero": every
  // plate went through the identical gate above.
  const interPlateReports = [];
  if (plates.length > 1) {
    const reference = {
      crownY: plates[0].contour.crownY,
      chinY: plates[0].contour.chinY,
      axisX: plates[0].contour.axisX,
      a1Y: plates[0].controls.a1Y,
      a2Y: plates[0].controls.a2Y,
      tiltPx: plates[0].controls.tiltPx,
    };
    for (const p of plates.slice(1)) {
      const candidate = {
        crownY: p.contour.crownY,
        chinY: p.contour.chinY,
        axisX: p.contour.axisX,
        a1Y: p.controls.a1Y,
        a2Y: p.controls.a2Y,
        tiltPx: p.controls.tiltPx,
      };
      const report = compareToHeroPlate(candidate, reference);
      interPlateReports.push({ seed: p.seed, referenceSeed: plates[0].seed, ...report });
      if (!report.pass) {
        problems.push(
          `seed ${p.seed} vs reference seed ${plates[0].seed}: inter-plate reproducibility ` +
            `FAILED — ${JSON.stringify(report.values)}`,
        );
      } else if (report.alerts.length > 0) {
        console.warn(
          `[slice-portrait-plate] ⚠ seed ${p.seed} vs reference seed ${plates[0].seed} in ` +
            `alert zone:`,
          report.alerts,
        );
      }
    }
  }

  // Per-plate seam continuity (brief §9.3, unchanged) — measured for EVERY
  // successfully-registered plate, not just the reference. This is also
  // where a hair lock crossing a seam (brief §10.2 clause 3 / §8.4-5) shows
  // up as a concrete number, per plate.
  const seams = seamOrdinatesPx();
  const seamReports = [];
  for (const p of plates) {
    for (let i = 0; i < seams.length - 1; i++) {
      const seamY = seams[i].bottom; // == seams[i + 1].top
      const report = measureSeamContinuity(p.portrait, seamY - 1, p.portrait, seamY);
      seamReports.push({
        seed: p.seed,
        between: `${seams[i].id}/${seams[i + 1].id}`,
        ...report,
      });
    }
  }
  const failedSeams = seamReports.filter((r) => !r.pass);
  for (const r of failedSeams) {
    problems.push(`seed ${r.seed}: seam ${r.between} FAILED — ${JSON.stringify(r.values)}`);
  }
  for (const r of seamReports.filter((r) => r.alerts.length > 0)) {
    console.warn(`[slice-portrait-plate] ⚠ seed ${r.seed}: ${r.between} in alert zone:`, r.alerts);
  }

  if (problems.length > 0 || plates.length < VARIANTS_PER_BAND) {
    console.error(
      `[slice-portrait-plate] REJECTED — batch fails (${plates.length}/${VARIANTS_PER_BAND} ` +
        `plates registered, ${problems.length} problem(s)):`,
    );
    for (const p of problems) console.error(`  ✗ ${p}`);
    throw new Error(
      "batch rejected — see above; the WHOLE batch must be regenerated (ADR-0080 D5, scaled " +
        "to N plates) — do not regenerate a single seed in place (brief §10 anti-cherry-picking " +
        "clause).",
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const { id, top, bottom } of seams) {
    const height = bottom - top;
    for (let i = 0; i < plates.length; i++) {
      const rgb = bandRGB(plates[i].portrait, top, bottom, height);
      const png = encodePngRGB(PORTRAIT_WIDTH, height, rgb);
      const name = variantFileName(id, i);
      fs.writeFileSync(path.join(OUT_DIR, name), png);
      written.push(png);
    }
  }

  const checksum = `sha256:${sha256Hex(plates.map((p) => p.buf))}`;
  // Persist every plate's A0/A1/A2 measurements + the inter-plate
  // reproducibility report alongside the manifest — the numbers behind the
  // "same seams land on the same face" claim, not just the claim.
  writeManifest(checksum, {
    registration: plates.map((p) => ({
      seed: p.seed,
      crownY: p.contour.crownY,
      chinY: p.contour.chinY,
      axisX: p.contour.axisX,
      a1Y: p.controls.a1Y,
      a2Y: p.controls.a2Y,
      tiltPx: p.controls.tiltPx,
    })),
    interPlateReproducibility: interPlateReports,
  });
  console.log(
    `[slice-portrait-plate] wrote ${written.length} PNGs from ${plates.length} plates + ` +
      `manifest (checksum ${checksum})`,
  );
}

/** Absolute portrait-crop region within a fetched PLATE, in plate-absolute
 * coordinates — the same window every registration/measurement function
 * below operates on. Shared so `runReal`, `runExplore` and tests all derive
 * it identically instead of re-deriving it slightly differently. */
function portraitRegion() {
  return {
    xFrom: PLATE_MARGIN_PX,
    xTo: PLATE_MARGIN_PX + PORTRAIT_WIDTH,
    yFrom: PLATE_MARGIN_PX,
    yTo: PLATE_MARGIN_PX + PORTRAIT_HEIGHT,
  };
}

// ── Exploration mode (Bertrand, 2026-08-06) ──────────────────────────────
// "le visage doit toujours être à peu près proportionné de la même façon...
// il te suffit de générer N visages différents, en entier et non bande par
// bande, PUIS ENSUITE tu découpes les bandes" — the `kontext` img2img
// derivation this file's earlier `runControlDerivative`/`--control-
// derivative` mode existed to gate is ABANDONED along with it: there is no
// "derivative" anymore to validate before deriving 23 more, just N
// independent whole-face draws from the SAME prompt family with different
// seeds. This mode exists for ONE purpose right now — "essaie de lancer la
// création de deux visages différents pour voir" — and is deliberately NOT
// production: it never writes to `public/assets/`, never touches the
// manifest/checksum, and never FAILS the job on a measurement problem (it
// reports what it finds, best-effort, using the SAME production detectors
// as `runReal` — this is reconnaissance on real output, not a weaker
// re-implementation of the gate). `runReal`'s guards are untouched.
const EXPLORE_OUT_DIR = path.resolve(ROOT, "scripts/.dbg-portrait-explore");

function assembleExplorePrompt() {
  return `${PORTRAIT_PROMPT_FAMILY.opening}${PORTRAIT_PROMPT_FAMILY.prompt}${PORTRAIT_PROMPT_FAMILY.style}`;
}

function buildExploreUrl(seed) {
  return fluxUrl(assembleExplorePrompt(), seed, PLATE_WIDTH, PLATE_HEIGHT);
}

// RE-PANEL 2026-08-06: the rendered images had nothing to do with the
// prompt (photorealistic women wearing crowns, vs. the requested flat ink
// fanzine drawing of a head) — Bertrand wants the FACT, not a guess,
// between "the service ignored our prompt" and "we didn't send what we
// think we sent". These are the two things that answer that: the exact
// request URL (so it can be pasted into a browser and compared) and any
// response header that signals a cached response (the second run
// "generated" two plates in one second — a cache, key unknown).
const CACHE_HEADER_PATTERN = /^(x-cache|age|cf-cache-status)$/i;
export function extractCacheHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (CACHE_HEADER_PATTERN.test(key)) out[key] = value;
  }
  return out;
}

/** Best-effort registration measurement for the exploration report: never
 * throws. Calls the SAME production detectors `runReal` uses
 * (`detectSkullContour`, `measureControlAnchors`) — this mode reports what
 * they find rather than weakening them; a plate that fails registration is
 * reported as "not found" with the real abort message, not silently
 * skipped or waved through. */
export function measureExploreBestEffort(plate) {
  const region = portraitRegion();
  let contour;
  try {
    contour = detectSkullContour(plate, region);
  } catch (e) {
    return { contourFound: false, contourError: e.message };
  }
  try {
    const controls = measureControlAnchors(plate, contour);
    return { contourFound: true, ...contour, controls, controlsError: null };
  } catch (e) {
    return { contourFound: true, ...contour, controls: null, controlsError: e.message };
  }
}

/** Exploration mode (NOT production): generates `count` WHOLE-face plates
 * from the SAME prompt family with different seeds (default: the prompt
 * family's own pinned seed, +1 per plate — pass `seeds` to override), and
 * writes the raw PNGs plus a JSON measurement report to `EXPLORE_OUT_DIR` —
 * never `public/assets/`, never the manifest. Reports crown/chin/axis and
 * A1/A2 per plate, and the raw pairwise delta between every pair of
 * successfully-measured plates, WITHOUT categorising it pass/alert/fail:
 * `INTER_PLATE_TOLERANCE` (brief §10.3) was calibrated for a `kontext`
 * img2img derivative reproducing a fixed hero, not for N independently-
 * seeded FLUX draws — reusing those thresholds here would imply a verdict
 * this mode has no calibration to support. Never throws on a measurement
 * problem; only a genuine fetch/prompt-gate failure aborts the whole run. */
export async function runExplore(count, { seeds } = {}) {
  if (PORTRAIT_PROMPT_FAMILY.pending) {
    throw new Error(
      "PORTRAIT_PROMPT_FAMILY.pending is still true — concept-artist has not authored the " +
        "plate prompt yet (art brief §7.1). Refusing to spend a FLUX call on empty prose.",
    );
  }
  const { errors } = lintPromptFamily(PORTRAIT_PROMPT_FAMILY);
  if (errors.length > 0) {
    throw new Error(`PORTRAIT_PROMPT_FAMILY failed the prompt gate:\n${errors.join("\n")}`);
  }
  const plateSeeds =
    seeds ?? Array.from({ length: count }, (_, i) => PORTRAIT_PROMPT_FAMILY.seed + i);

  fs.mkdirSync(EXPLORE_OUT_DIR, { recursive: true });
  const assembledPrompt = assembleExplorePrompt();
  const results = [];
  for (const seed of plateSeeds) {
    const requestUrl = buildExploreUrl(seed);
    console.log(`[slice-portrait-plate] [explore] seed ${seed} — request URL:`);
    console.log(`  ${requestUrl}`);
    console.log(`[slice-portrait-plate] [explore] seed ${seed} — assembled prompt:`);
    console.log(`  ${assembledPrompt}`);
    const rawBuf = await fetchWithRetry(requestUrl);
    const responseHeaders = {
      "content-type": rawBuf.contentType ?? null,
      "content-length": rawBuf.responseHeaders?.["content-length"] ?? null,
      ...extractCacheHeaders(rawBuf.responseHeaders),
    };
    const buf = await ensurePngBuffer(rawBuf);
    const plate = PNG.sync.read(buf);
    const file = path.join(EXPLORE_OUT_DIR, `face-seed-${seed}.png`);
    fs.writeFileSync(file, buf);
    const byteSize = buf.length;
    const shortHash = sha256Hex([buf]).slice(0, 12);
    console.log(
      `[slice-portrait-plate] [explore] seed ${seed} — response headers: ` +
        `${JSON.stringify(responseHeaders)}`,
    );
    console.log(
      `[slice-portrait-plate] [explore] seed ${seed} — ${byteSize} bytes, sha256:${shortHash}`,
    );
    const measurement = measureExploreBestEffort(plate);
    results.push({
      seed,
      requestUrl,
      width: plate.width,
      height: plate.height,
      file,
      byteSize,
      shortHash,
      responseHeaders,
      ...measurement,
    });
    console.log(
      `[slice-portrait-plate] [explore]   ${plate.width}x${plate.height} — contour ` +
        (measurement.contourFound
          ? `crownY=${measurement.crownY} chinY=${measurement.chinY} ` +
            `axisX=${measurement.axisX.toFixed(1)}` +
            (measurement.controlsError ? ` (controls: ${measurement.controlsError})` : "")
          : `NOT FOUND (${measurement.contourError})`),
    );
  }

  const identicalImages =
    results.length > 1 && results.every((r) => r.shortHash === results[0].shortHash);
  if (identicalImages) {
    console.warn(
      "[slice-portrait-plate] [explore] ⚠ every plate has the SAME sha256 — bit-for-bit " +
        "identical images (a cache hit, not N distinct generations).",
    );
  }

  const pairwise = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i];
      const b = results[j];
      // Byte identity is checked independently of whether registration
      // succeeded — a cached/duplicate response is a fact about the bytes,
      // not about whether the contour happened to be measurable.
      const entry = { seeds: [a.seed, b.seed], identical: a.shortHash === b.shortHash };
      if (a.contourFound && b.contourFound) {
        entry.crownDeltaPx = Math.abs(a.crownY - b.crownY);
        entry.chinDeltaPx = Math.abs(a.chinY - b.chinY);
        entry.axisDeltaPx = Math.abs(a.axisX - b.axisX);
      }
      pairwise.push(entry);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    promptSeed: PORTRAIT_PROMPT_FAMILY.seed,
    assembledPrompt,
    note:
      "Reconnaissance only (Bertrand, 2026-08-06) — no pass/alert/fail verdict: " +
      "INTER_PLATE_TOLERANCE was calibrated for a kontext derivative vs a hero, not for " +
      "independently-seeded whole-face draws. Look at the images. requestUrl is pasteable into " +
      "a browser to compare what it renders against what was recorded here.",
    identicalImages,
    plates: results.map(
      ({
        seed,
        requestUrl,
        width,
        height,
        file,
        byteSize,
        shortHash,
        responseHeaders,
        contourFound,
        crownY,
        chinY,
        axisX,
        coverageRatio,
        contourError,
        controls,
        controlsError,
      }) => ({
        seed,
        requestUrl,
        width,
        height,
        file: path.relative(ROOT, file),
        byteSize,
        shortHash,
        responseHeaders,
        contour: contourFound ? { crownY, chinY, axisX, coverageRatio } : { error: contourError },
        controls: controls ?? (controlsError ? { error: controlsError } : null),
      }),
    ),
    pairwise,
  };
  const reportFile = path.join(EXPLORE_OUT_DIR, "report.json");
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `[slice-portrait-plate] [explore] wrote ${results.length} plate(s) + report to ` +
      `${path.relative(ROOT, EXPLORE_OUT_DIR)}`,
  );
  return report;
}

// ── CLI ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  const efi = args.indexOf("--explore-faces");
  if (efi !== -1) {
    const count = Number(args[efi + 1]);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("--explore-faces requires a positive integer count (e.g. --explore-faces 2)");
    }
    await runExplore(count);
    return;
  }

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
