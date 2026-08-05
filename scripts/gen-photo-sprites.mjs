#!/usr/bin/env node
/**
 * Generate the QTE photo paparazzi set-piece art (STORY-QTE-PHOTO-PAPARAZZI, host level
 * belliard) — lead-art PROMPT GATE PASS docs/art-direction/gates/photo-qte-setpiece-prompt-gate.md
 * (R1/R2/E1/E2/E3 applied verbatim by concept-artist) + the resolution RULING
 * docs/art-direction/gates/photo-qte-resolution-and-sweep-ruling.md (sizes, seams, sweep).
 *
 * Single source of truth: the `photoQte` block of src/game/levels/levelArt.json — the
 * `plate`/`types.*` prompt/style/opening strings are concept-artist's (NEVER edited here);
 * `asset`/`size`/`seed`/`pxPerSu`/`sourceCrop` are dev-tooling-assets' (this script's own).
 *
 * EIGHT PNGs, not nine (ruling §1.5): `plate` (opaque, no key) + 4 pose sprites + 3 stamps,
 * all chroma-keyed magenta #FF3CDC except the plate. The `sheet` prompt string in
 * levelArt.json is kept for the gate record but is NEVER dispatched here — the resolution
 * ruling supersedes the raster contact sheet with a zero-asset two-layer DOM composite
 * (plate crop + pose crop), so generating it would ship an asset nobody draws.
 *
 * GENERATION METHOD (ruling §2 / gate §4):
 *   - `plate` — EDIT FROM THE VALIDATED REFERENCE (Bertrand-decided route, 2026-08,
 *     superseding two prior diagnoses — see below): `plate-v2-reference.png` (the shipped
 *     v2 night render — still EYE-LEVEL, Bertrand's known open defect, but its props and
 *     register are explicitly signed off, "pas mal du tout") is committed and never
 *     regenerated from scratch again; the edit is asked to CHANGE the camera to a plunging
 *     dormer POV while keeping that art, not to draw a new street. `kontext` img2img via
 *     the multipart POST
 *     /v1/images/edits (`editImagePaid`, lib/pollinations.mjs — uploads the reference bytes
 *     directly, no URL at all, so no query-string length ceiling to hit) edits THAT PNG
 *     using `block.plateEdit`, a SHORT IMPERATIVE edit instruction (concept-artist's,
 *     framing clause first) — not a from-scratch generation prompt. `loadPhotoQte()` throws
 *     if `plateAsset.editReference` is wired but `block.plateEdit` isn't yet: half-wired is
 *     a setup error, not something to roll on a guess.
 *     HISTORY, because every earlier diagnosis was wrong and the record matters more than
 *     tidying it away: (1) v1-v6 conditioned on the FRONTAL street-wide.png elevation crop
 *     and shipped street-level despite a dormer-POV prompt — diagnosed as "conditioning
 *     beats text", fixed by a flux-then-kontext two-stage split (still in `generate()` as
 *     `twoStagePlate`, dormant, kept for a future full-regeneration need). (2) Stage 1 of
 *     that split — flux, dormer prompt, ZERO conditioning — ALSO shipped street-level,
 *     disproving diagnosis (1): the framing clause simply isn't honoured by a from-scratch
 *     roll. Bertrand then dropped the dormer angle for a plain-pied POV on FICTION grounds
 *     (spec-photo-qte-fiction.md §2.1 Rev.5 — better signals for the mechanic, not an art
 *     limitation), settling on editing the validated v2 render. (3) A single combined edit
 *     asking for three things at once (clear the pavement, blank two signs, add a terrace)
 *     applied NONE of them — too timid, kontext read "preserve" and not "transform"
 *     (`a4f4f82e`). Route now: `editChain`, below — ONE VARIABLE PER EDIT, each stage
 *     committed and reviewed before the next fires (no strength/guidance/fidelity knob
 *     exists on this endpoint per APIDOCS.md — checked, not assumed — so the isolation
 *     comes from the chain, not from a dial).
 *     `editChain` (`plateAsset.editChain` in levelArt.json) replaces the single-edit route
 *     above when present: an ARRAY of stages, each editing the PREVIOUS stage's own
 *     committed output, each its own `prompt*Key` (throwing if that key isn't written).
 *     THREE stages as of `c95393e5`, not two — `plate_edit_a` (clear the pavement) was
 *     found, on review, to have also blanked every glazed surface (shop windows, upper-
 *     floor windows) and dropped the validated scooter/bicycle: one instruction ("clear
 *     the people out of the street") over-generalised from "the people" to "the street",
 *     wiping a whole CLASS of surfaces with no force/fidelity knob to hold it back. Split
 *     into `plate_edit_a` (pavement only, named props kept explicitly) then `plate_edit_a2`
 *     (sign bands only, same "keep by name" discipline), THEN `plate` (terrace, on `_a2`'s
 *     output). `plate-edit-a.png` from any prior single-edit-A run is a KNOWN-REGRESSED
 *     asset — never a reference for anything past this file's own `plate_edit_a2` stage.
 *   - The 4 pose sprites + 3 stamps — plain `flux` text-to-image on the shared
 *     opening+prompt+style assembly (bible §3.9), chroma-keyed magenta after generation.
 *
 * Mobile variants are NEVER a second generation run (ruling §1.6): the desktop PNG is
 * downsampled by THIS script's `--downsample-mobile` pass, in place beside the desktop file
 * as `<key>_mobile.png` (asset contract for the render lane).
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to regenerate.
 * Network image generation (Pollinations/FLUX) is normally blocked in the local sandbox, so
 * this runs for real in CI. A failed fetch there is a soft-skip locally.
 *
 * Usage:
 *   node scripts/gen-photo-sprites.mjs --make-crop     # produce + commit the plate source crop (once)
 *   node scripts/gen-photo-sprites.mjs                 # generate missing (network FLUX/kontext)
 *   FORCE=1 node scripts/gen-photo-sprites.mjs          # regenerate all                    [CI]
 *   node scripts/gen-photo-sprites.mjs --asset plate    # one asset only
 *   node scripts/gen-photo-sprites.mjs --downsample-mobile   # write <key>_mobile.png from committed desktop PNGs
 *   node scripts/gen-photo-sprites.mjs --list          # list defined assets
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { fluxUrl, genPaidUrl, editImagePaid, fetchWithRetry } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";
import { parseAssetArgs } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// x_norm 0.30-0.45 of the shipped street-wide.png (6418 x 1248), full height —
// gate C1: "source crop of the SHIPPED street-wide.png ... committed as a reference file
// and its path recorded in the draft, so the plate is reproducible." Kept for provenance/
// `--make-crop` only — no longer fed into `generate()` (two-stage plate, see file header:
// conditioning the plate on this FRONTAL elevation is what fought the dormer-POV prompt).
const SOURCE_CROP_X_NORM = { from: 0.3, to: 0.45 };
const SOURCE_STREET_WIDE = "assets/levels/belliard/street-wide.png";

// ── Load the photoQte definitions from levelArt.json (single source) ─────────
// `photoQte.plate` is the concept-artist's gate-owned prompt STRING; the sibling
// `photoQte.plateAsset` is dev-tooling-assets' structure object (asset/size/seed/
// sourceCrop) — kept as two distinct keys precisely so a structure edit never shadows
// the gated prompt text (or vice versa).
function loadPhotoQte() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.photoQte;
  if (!block) throw new Error(`No "photoQte" block in ${path.relative(ROOT, LEVEL_ART)}`);
  if (typeof block.plate !== "string") {
    throw new Error("photoQte.plate must be the concept-artist's prompt string");
  }
  const opening = block.opening ?? "";
  const styleSuffix = block.style ?? "";

  const assets = [];

  // The plate: no shared opening/style (it is a full standalone décor prompt, gate §1),
  // opaque, kontext img2img from the committed source crop.
  const plateAsset = block.plateAsset;
  if (plateAsset?.asset === undefined) {
    throw new Error("photoQte.plateAsset: no asset/size/seed wired yet (structure fields missing)");
  }
  if (plateAsset.editChain) {
    // ONE VARIABLE PER EDIT (Bertrand-decided route, 2026-08, superseding the single
    // combined edit): a single kontext pass asked for three things at once (clear the
    // pavement, blank two signs, add a terrace) and applied none of them cleanly — too
    // timid, it read "preserve" and not "transform" (a4f4f82e). Splitting into a CHAIN of
    // single-variable edits, each one committed and reviewable before the next fires, so
    // a failure is isolated to the one variable that moved. Each stage throws if its own
    // prompt key isn't written yet — same discipline as the single-edit case below, just
    // per stage instead of once.
    for (const stage of plateAsset.editChain) {
      if (typeof block[stage.promptKey] !== "string") {
        throw new Error(
          `photoQte.plateAsset.editChain references photoQte.${stage.promptKey}, which is not ` +
            `written yet — do not dispatch this stage until it lands.`,
        );
      }
      assets.push({
        key: stage.key,
        prompt: block[stage.promptKey],
        width: plateAsset.size.width,
        height: plateAsset.size.height,
        seed: plateAsset.seed,
        outFile: path.resolve(ROOT, "public", stage.asset),
        editReference: path.resolve(ROOT, "public", stage.reference),
        opaque: true,
        mobile: false,
      });
    }
  } else {
    // editReference wired but the edit instruction not yet written is a SETUP error, not a
    // silent fall-through to the dormant from-scratch route — concept-artist is authoring
    // `plateEdit` (short, imperative, framing clause first); do not roll on a guess meanwhile.
    if (plateAsset.editReference !== undefined && typeof block.plateEdit !== "string") {
      throw new Error(
        "photoQte.plateAsset.editReference is wired but photoQte.plateEdit (the concept-artist's " +
          "edit instruction) is not written yet — do not dispatch the plate until it lands.",
      );
    }
    assets.push({
      key: "plate",
      prompt: plateAsset.editReference ? block.plateEdit : block.plate,
      width: plateAsset.size.width,
      height: plateAsset.size.height,
      seed: plateAsset.seed,
      outFile: path.resolve(ROOT, "public", plateAsset.asset),
      // editReference set → single kontext edit of the validated v2 render. Otherwise
      // twoStagePlate (dormant fallback for a future full regeneration — see header).
      editReference: plateAsset.editReference
        ? path.resolve(ROOT, "public", plateAsset.editReference)
        : undefined,
      twoStagePlate: !plateAsset.editReference,
      opaque: true, // no chroma-key, no mobile variant (ruling §1.1 — one asset, both viewports)
      mobile: false,
    });
  }

  const types = block.types ?? {};
  for (const [key, def] of Object.entries(types)) {
    if (def.asset === undefined) continue; // e.g. a future pending entry, skip rather than fail
    const isStamp = key.startsWith("stamp_");
    assets.push({
      key,
      prompt: `${opening}${def.prompt}${styleSuffix}`,
      width: def.size?.width ?? 256,
      height: def.size?.height ?? 256,
      seed: def.seed,
      outFile: path.resolve(ROOT, "public", def.asset),
      opaque: false, // chroma-keyed magenta
      mobile: !isStamp, // stamps composite at native size on the sheet, no mobile fork needed
    });
  }
  return assets;
}

// ── Make + commit the plate's source crop (run once, not part of normal generation) ──
async function makeCrop() {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const plateAsset = json.photoQte.plateAsset;
  if (plateAsset?.sourceCrop === undefined) {
    throw new Error("photoQte.plateAsset.sourceCrop not wired in levelArt.json");
  }
  const src = path.resolve(ROOT, "public", SOURCE_STREET_WIDE);
  const img = await loadImage(src);
  const x0 = Math.round(img.width * SOURCE_CROP_X_NORM.from);
  const x1 = Math.round(img.width * SOURCE_CROP_X_NORM.to);
  const w = x1 - x0;
  const h = img.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x0, 0, w, h, 0, 0, w, h);
  const out = path.resolve(ROOT, "public", plateAsset.sourceCrop);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(
    `[make-crop] ${path.relative(ROOT, out)} — ${w}x${h}px, x_norm ${SOURCE_CROP_X_NORM.from}-${SOURCE_CROP_X_NORM.to} of ${path.relative(ROOT, src)} (${img.width}x${img.height})`,
  );
}

// The plate's model on the PAID gen.pollinations.ai farm. `kontext` is the gate-mandated
// choice (img2img street-continuity conditioning, ruling §2). Overridable for a one-off A/B
// against another paid image-editing model that also accepts `image=` (e.g. `nanobanana-2`,
// `seedream-pro`) WITHOUT touching this file — a Bertrand-sanctioned re-roll, not a default.
const PLATE_MODEL = process.env.PLATE_MODEL || "kontext";

// img2img EDIT models on the paid farm (kontext, and nanobanana-2 tried as an A/B) do NOT
// honour the requested width/height for an edit — both were observed returning a non-PNG at
// their own fixed edit resolution (kontext: JPEG 1024x1024) regardless of the `width`/`height`
// query params, undocumented behaviour that contradicts APIDOCS.md's per-param table. Rather
// than keep guessing at a model that might respect arbitrary pixel dims (none of the
// documented img2img-capable models — kontext, gptimage, seedream, klein, nanobanana —
// promise it), the dimension CONTRACT is restored the same way `--downsample-mobile` already
// does it in this file: an explicit, logged resize pass after generation, never a silent
// write of whatever shape the provider felt like returning.
async function resizeToTarget(buf, width, height, label) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(buf);
  if (img.width === width && img.height === height) return buf; // already exact — no-op
  console.log(
    `  [resize] ${label} — provider returned ${img.width}x${img.height} → stretched to ${width}x${height}`,
  );
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toBuffer("image/png");
}

// kontext's edit endpoint always returns a FIXED SQUARE resolution (observed 1024x1024,
// see resizeToTarget's comment above) regardless of the reference's own aspect ratio. The
// plate is 16:9 (2048x1152) — feeding that straight in and then stretching the square
// result back to 16:9 is a NON-UNIFORM stretch (2x horizontal, 1.125x vertical), which
// warps every straight line in the composition and is the likely reason a "single
// variable" edit (add a terrace, remove eight pedestrians, blank two signs) came back with
// none of the three applied cleanly: the model edited an already-distorted square, not the
// validated reference. Pad-to-square before upload / crop-back-to-aspect after replaces
// that anisotropic stretch with a uniform one on the padded-out canvas only, so the
// reference's own proportions are never non-uniformly scaled.
async function padToSquare(buf) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(buf);
  const side = Math.max(img.width, img.height);
  const canvas = createCanvas(side, side);
  const ctx = canvas.getContext("2d");
  // Pad colour is the plate's own black night sky/asphalt register, not an arbitrary
  // matte — an inert seam instead of a visible border the model might try to "explain".
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, side, side);
  const dx = Math.round((side - img.width) / 2);
  const dy = Math.round((side - img.height) / 2);
  ctx.drawImage(img, dx, dy);
  return { buf: canvas.toBuffer("image/png"), dx, dy, origW: img.width, origH: img.height, side };
}

async function cropPadded(buf, pad, targetW, targetH, label) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(buf);
  if (img.width !== img.height) {
    // Not the fixed-square edit response this crop assumes — fall through to the generic
    // (still-logged) resize rather than crop against a wrong scale factor.
    return resizeToTarget(buf, targetW, targetH, label);
  }
  const scale = img.width / pad.side;
  const cropX = Math.round(pad.dx * scale);
  const cropY = Math.round(pad.dy * scale);
  const cropW = Math.round(pad.origW * scale);
  const cropH = Math.round(pad.origH * scale);
  console.log(
    `  [crop] ${label} — provider returned ${img.width}x${img.height} square (padded ` +
      `${pad.side}x${pad.side}) → cropped back to the ${pad.origW}x${pad.origH} content ` +
      `region, resized to ${targetW}x${targetH}`,
  );
  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
  return canvas.toBuffer("image/png");
}

// ── Generation (flux, or kontext-edit / two-stage flux+kontext for the plate) ──
async function generate(a) {
  if (a.editReference) {
    // Single kontext edit of the ALREADY-VALIDATED reference (current plate route — see
    // file header). No fallback to a from-scratch roll on failure: that route is exactly
    // the one Bertrand moved off of, so an edit failure surfaces as a loud [fail] in main()
    // instead of silently reverting to it.
    console.log(
      `  [seed] ${a.key} seed=${a.seed} (pinned) — ${PLATE_MODEL} edit (paid, multipart), ` +
        `ref=${path.relative(ROOT, a.editReference)}`,
    );
    const refBuf = fs.readFileSync(a.editReference);
    const pad = await padToSquare(refBuf);
    console.log(
      `  [pad] ${a.key} — ${pad.origW}x${pad.origH} padded to ${pad.side}x${pad.side} ` +
        `square before upload (kontext edits always return a fixed square — avoids the ` +
        `anisotropic stretch a direct 16:9 upload would need on the way back)`,
    );
    const buf = await editImagePaid({
      prompt: a.prompt,
      seed: a.seed,
      width: pad.side,
      height: pad.side,
      model: PLATE_MODEL,
      imageBuf: pad.buf,
    });
    return await cropPadded(buf, pad, a.width, a.height, `${a.key} (edit ${PLATE_MODEL})`);
  }
  if (a.twoStagePlate) {
    // Stage 1 — plain flux, TEXT ONLY, no `image=`: the model's hands are free on
    // composition/angle, nothing to contradict (see file header for why this is split
    // out of the kontext pass). Not written to disk unless Stage 2 fails outright.
    console.log(
      `  [seed] ${a.key} seed=${a.seed} (pinned) — stage 1: flux text-only (paid), angle-free`,
    );
    const stage1 = await fetchWithRetry(
      genPaidUrl({
        prompt: a.prompt,
        seed: a.seed,
        width: a.width,
        height: a.height,
        model: "flux",
      }),
    );
    const stage1Resized = await resizeToTarget(
      stage1,
      a.width,
      a.height,
      `${a.key} (stage 1 flux)`,
    );

    // Stage 2 — kontext img2img conditioned on STAGE 1'S OWN bytes, via the multipart
    // POST /v1/images/edits (editImagePaid) rather than a GET `image=<data-URI>` — stage 1
    // is not pushed to the remote yet within this same run, so raw.githubusercontent.com
    // cannot see it, and a 2048x1152 PNG base64-encoded into a query string blows past the
    // server's URL length limit (observed: HTTP 414 in CI, run 8). Same prompt text:
    // kontext's job is a same-composition style refinement, not an angle negotiation.
    console.log(
      `  [seed] ${a.key} seed=${a.seed} (pinned) — stage 2: ${PLATE_MODEL} img2img (paid, multipart), ref=stage 1 render`,
    );
    try {
      const stage2 = await editImagePaid({
        prompt: a.prompt,
        seed: a.seed,
        width: a.width,
        height: a.height,
        model: PLATE_MODEL,
        imageBuf: stage1Resized,
      });
      return await resizeToTarget(stage2, a.width, a.height, `${a.key} (stage 2 ${PLATE_MODEL})`);
    } catch (e) {
      // Pre-authorised fallback: ship Stage 1 as-is rather than a broken/mushy Stage 2 —
      // Stage 1 already carries the correct angle (the ELIMINATORY criterion), it just
      // misses the kontext style refinement. Loud on purpose (::warning:: GH Actions
      // annotation), so a silent fallback doesn't quietly ship the unrefined stage again.
      console.warn(
        `::warning::${a.key}: stage 2 (${PLATE_MODEL} img2img, paid) FAILED (${e.message}) — ` +
          `shipping stage 1 (flux text-only) unrefined. Angle is correct; style refinement is ` +
          `missing — verify against the gate before merge.`,
      );
      return stage1Resized;
    }
  }
  console.log(`  [seed] ${a.key} seed=${a.seed} (pinned) — flux`);
  return fetchWithRetry(fluxUrl(a.prompt, a.seed, a.width, a.height));
}

// Read width/height straight out of the PNG IHDR chunk (bytes 16-23, big-endian) —
// no image-decoding dependency needed just to police dimensions.
function pngDimensions(buf) {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Pollinations' anonymous tier silently halves any request above ~1024px on a
// side instead of erroring — that is how the plate shipped at 1024x576 instead
// of the decided 2048x1152 without anyone noticing. `kontext` on the PAID
// gen.pollinations.ai farm has its OWN silent mismatch: img2img edits come back
// as a JPEG at the model's own fixed edit resolution (observed: 1024x1024,
// ignoring the requested 2048x1152 entirely) instead of erroring — a second,
// distinct instance of the same failure shape, this time also the WRONG FORMAT
// (every downstream step — chroma-key, despeckle, the DOM plate/pose composite —
// assumes a real PNG). Refuse to ship a mismatched OR non-PNG asset instead of
// writing it quietly; the caller lets this throw all the way out so the whole
// run fails loudly (CI job red) rather than soft-skipping.
function assertDimensions(a, buf) {
  const dims = pngDimensions(buf);
  if (!dims) {
    throw new Error(
      `${a.key}: provider response is not a PNG (no IHDR chunk found in the first 24 bytes) — ` +
        `refusing to write it as a .png (kontext img2img on the paid farm can return a JPEG at ` +
        `its own fixed edit resolution instead of honouring width/height; investigate before retrying).`,
    );
  }
  if (dims.width !== a.width || dims.height !== a.height) {
    throw new Error(
      `${a.key}: provider returned ${dims.width}x${dims.height}px but ${a.width}x${a.height}px ` +
        `was requested — refusing to write a silently downscaled/resized asset (Pollinations halves ` +
        `oversized requests on the anonymous tier and kontext img2img can ignore width/height on the ` +
        `paid farm; set POLLINATIONS_TOKEN or investigate before retrying).`,
    );
  }
}

// ── Post-processing: chroma-key cutout (7 of 8 assets; plate stays opaque) ────
async function tryCutout(file, key) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    console.log(`  [cutout-skip] ${key} — ${e.message} (chroma-key runs in CI)`);
  }
}

// ── Deterministic despeckle (shared sweep from retouch-sprites.mjs) ───────────
// The chroma-key leaves a handful of tiny opaque debris islands around the figure; the
// integrity gate's SPECKLE BUDGET (<= 4 comps < 12px) rejects them — same idiom as
// gen-hostage-sprites.mjs's tryDespeckle.
export async function despeckleFile(file) {
  const { sweepSpeckle } = await import("./retouch-sprites.mjs");
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const { removedComps, removedPx } = sweepSpeckle({ W, H, d: image.data });
  if (removedComps > 0) {
    ctx.putImageData(image, 0, 0);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
  }
  return { removedComps, removedPx };
}

async function tryDespeckle(file, key) {
  try {
    const { removedComps, removedPx } = await despeckleFile(file);
    console.log(`  [despeckle] ${key} — removed ${removedComps} comp / ${removedPx}px`);
  } catch (e) {
    console.log(`  [despeckle-skip] ${key} — ${e.message} (runs in CI)`);
  }
}

// ── Mobile downsample (pipeline resize, never a second generation — ruling §1.6) ──
async function downsampleMobile(a) {
  if (!a.mobile) return;
  if (!fs.existsSync(a.outFile)) return;
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(a.outFile);
  const w = Math.round(img.width / 2);
  const h = Math.round(img.height / 2);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const out = a.outFile.replace(/\.png$/, "_mobile.png");
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(`  [mobile] ${a.key} — ${w}x${h} → ${path.relative(ROOT, out)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--make-crop")) {
    await makeCrop();
    return;
  }

  const assets = loadPhotoQte();
  const { list, target } = parseAssetArgs(args);

  if (list) {
    for (const a of assets) {
      console.log(
        `${a.key.padEnd(16)} ${a.width}x${a.height}  seed=${a.seed}  ${path.relative(ROOT, a.outFile)}`,
      );
    }
    return;
  }

  if (args.includes("--downsample-mobile")) {
    for (const a of assets) await downsampleMobile(a);
    return;
  }

  // Maintenance pass: re-run the despeckle sweep on ALREADY-COMMITTED PNGs in place, no
  // regeneration (pinned seeds make a CI regen produce identical art anyway) — mirrors
  // gen-vehicle-sprites.mjs's `--reprocess`.
  if (args.includes("--despeckle-only")) {
    for (const a of assets) {
      if (a.opaque || !fs.existsSync(a.outFile)) continue;
      await tryDespeckle(a.outFile, a.key);
    }
    return;
  }

  const todo = target ? assets.filter((a) => a.key === target) : assets;
  if (target && todo.length === 0) {
    console.error(`Unknown photoQte asset "${target}". Use --list.`);
    process.exit(1);
  }

  for (const a of todo) {
    if (skip(a.outFile, { force: FORCE, existsSync: fs.existsSync })) {
      console.log(`[skip] ${a.key} — ${path.relative(ROOT, a.outFile)} exists (FORCE=1 to redo)`);
      continue;
    }
    console.log(`[gen ] ${a.key} ${a.width}x${a.height}`);
    let buf;
    try {
      buf = await generate(a);
    } catch (e) {
      console.log(`[fail] ${a.key} — ${e.message} (will be generated in CI)`);
      continue;
    }
    // Deliberately NOT caught alongside the network fetch above: a dimension
    // mismatch is not a transient network flake to soft-skip, it is a defect
    // in what the provider sent back — it must fail the run, not be silently
    // swallowed as "will be generated in CI".
    assertDimensions(a, buf);
    fs.mkdirSync(path.dirname(a.outFile), { recursive: true });
    fs.writeFileSync(a.outFile, buf);
    console.log(`  [ok ] wrote ${path.relative(ROOT, a.outFile)} (${buf.length} bytes)`);
    if (!a.opaque) {
      await tryCutout(a.outFile, a.key);
      await tryDespeckle(a.outFile, a.key);
    }
    await downsampleMobile(a);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
