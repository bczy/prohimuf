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
 *   - `plate` — KONTEXT img2img, conditioned on a COMMITTED crop of the shipped
 *     assets/levels/belliard/street-wide.png around x_norm 0.30-0.45 (continuity is a gate
 *     criterion, not a style note), via the PAID gen.pollinations.ai render farm (same
 *     Bearer POLLINATIONS_TOKEN, `genPaidUrl` from lib/pollinations.mjs — the exact method
 *     gen-street-paid.mjs uses to produce the shipped street-wide.png, not duplicated here).
 *     The anonymous image.pollinations.ai tier refuses `kontext` outright ("kontext model is
 *     only available on enter.pollinations.ai") AND silently halves any request above
 *     ~1024px — gen.pollinations.ai does neither: it accepts `kontext` for a real Bearer
 *     account and honours width/height exactly, so img2img conditioning and the decided
 *     2048x1152 resolution are NOT a trade-off here (confirmed against the live
 *     pollinations/APIDOCS.md `image` param table: kontext/gptimage/seedream/klein/nanobanana
 *     all accept a reference `image=` URL on this endpoint). Pinned seed, private, high
 *     quality. Plain `flux` on the paid endpoint (still exact-res, still no anonymous
 *     downscale, but WITHOUT the street-seam conditioning) is the pre-authorised fallback if
 *     kontext errors or returns mushy/over-locked art. CAP: 2 batches FOR THE PLATE (kontext,
 *     then the flux fallback — exactly what `generate()` below does, no further re-roll) —
 *     past that, options go to Bertrand, not more rolls (gate §4 C4; the cap is scoped to the
 *     plate's own generation method, not to the 8-asset set as a whole). The crop itself is
 *     produced ONCE by `--make-crop` and committed (reproducible, never regenerated per-run).
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
import { fluxUrl, genPaidUrl, fetchWithRetry } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";
import { parseAssetArgs } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

const REPO = process.env.GITHUB_REPOSITORY ?? "bczy/prohimuf";
const SHA = process.env.GITHUB_SHA ?? "main";

// x_norm 0.30-0.45 of the shipped street-wide.png (6418 x 1248), full height —
// gate C1: "source crop of the SHIPPED street-wide.png ... committed as a reference file
// and its path recorded in the draft, so the plate is reproducible."
const SOURCE_CROP_X_NORM = { from: 0.3, to: 0.45 };
const SOURCE_STREET_WIDE = "assets/levels/belliard/street-wide.png";

function rawUrl(repoRelativePath) {
  return `https://raw.githubusercontent.com/${REPO}/${SHA}/${repoRelativePath}`;
}

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
  assets.push({
    key: "plate",
    prompt: block.plate,
    width: plateAsset.size.width,
    height: plateAsset.size.height,
    seed: plateAsset.seed,
    outFile: path.resolve(ROOT, "public", plateAsset.asset),
    sourceCrop: plateAsset.sourceCrop,
    opaque: true, // no chroma-key, no mobile variant (ruling §1.1 — one asset, both viewports)
    mobile: false,
  });

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

// ── Generation (flux, or kontext img2img for the plate via the PAID farm) ────
async function generate(a) {
  if (a.sourceCrop) {
    // `sourceCrop` (like `asset`) is stored relative to public/ in levelArt.json, but the
    // committed file lives at repo path public/<sourceCrop> — rawUrl() needs that full repo
    // path, not the public/-relative one, or raw.githubusercontent.com 404s (root cause of
    // every "kontext img2img FAILED ... HTTP 404" seen in CI so far: the URL pointed at
    // <repo>/<sha>/assets/photoqte/plate-source-crop.png, missing the public/ segment where
    // the file actually is).
    const imageUrl = rawUrl(`public/${a.sourceCrop}`);
    console.log(
      `  [seed] ${a.key} seed=${a.seed} (pinned) — ${PLATE_MODEL} img2img (paid), ref=${imageUrl}`,
    );
    try {
      return await fetchWithRetry(
        genPaidUrl({
          prompt: a.prompt,
          seed: a.seed,
          width: a.width,
          height: a.height,
          model: PLATE_MODEL,
          imageUrl,
        }),
      );
    } catch (e) {
      // Gate §4 C4 — pre-authorised fallback: plain `flux` on the SAME paid endpoint (still
      // exact-res, still no anonymous-tier downscale). Loud on purpose (::warning:: GH Actions
      // annotation, not just a console.log line): the fallback drops the street-continuity
      // conditioning that IS the plate's ELIMINATORY gate criterion, so a silent fallback
      // previously shipped a decor with no seam and nobody noticed until review.
      const msg =
        `${a.key}: ${PLATE_MODEL} img2img (paid) FAILED (${e.message}) — falling back to ` +
        `flux text-to-image on the same paid endpoint. This is the pre-authorised fallback ` +
        `(gate §4 C4) but the shipped asset then has NO street-continuity conditioning` +
        (a.key === "plate" ? " (an ELIMINATORY criterion for the plate)" : "") +
        ` — verify the result against the gate before merge.`;
      console.warn(`::warning::${msg}`);
      return fetchWithRetry(
        genPaidUrl({
          prompt: a.prompt,
          seed: a.seed,
          width: a.width,
          height: a.height,
          model: "flux",
        }),
      );
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
