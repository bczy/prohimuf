#!/usr/bin/env node
/**
 * BELLIARD DECOR RETOUCH — Serge (game-graphist) TECHNICAL PASS, scripted fix.
 *
 * Fixes the three lead-art AUDIT verdicts against `public/assets/levels/belliard/`
 * (foreground.png, ground.png, street.png), and ONLY those three files — the
 * tronçons regenerate separately, sky.png/facade.png (legacy) are untouched, and
 * `src/game/levels/levelArt.json` is not touched (no prompt/data change, pure pixel
 * retouch on already-generated PNGs).
 *
 * ── [1] foreground.png — MAJEUR: chroma-key magenta raté ───────────────────────────
 * The committed ironwork render is a genuine blue↔magenta DUOTONE (FLUX painted a
 * gradient cast across the whole silhouette, not flat "thick black ironwork" on flat
 * magenta), so `cutout-foreground.mjs`'s narrow test (`r>110 && b>110 &&
 * g<min(r,b)*0.62`) only caught the brightest magenta and left two problems:
 *   (a) un-keyed magenta enclaves between balusters / behind window glazing (should
 *       be see-through — the whole point of an openwork railing);
 *   (b) the surviving ironwork itself carries a blue tint instead of reading black.
 * Both are the SAME root defect (an un-corrected colour cast) fixed by ONE combined
 * pass, in this order:
 *   STEP A — WIDEN THE KEY. Reclassify any opaque pixel as background using
 *     `magentaScore = min(r,b) - g` (min(r,b) elevated well above g is the signature
 *       of every magenta/pink/violet sample measured on this asset; the pure blue-cast
 *       ironwork pixels score ~0 because r≈g there). Threshold 35 was picked by a
 *       sweep (15/20/25/30/35/40/45/50) that tracked the resulting silhouette's
 *       dominant-component ratio and bbox — 35 is the first point past the
 *       fragmentation cliff (domRatio jumps from 0.92 at 15-20 to 0.998 at 35, see
 *       CALIBRATION below) while still clearing the visually-obvious enclaves.
 *   STEP B — SPECKLE SWEEP. Widening the key orphans a few tiny ironwork fragments
 *     (thin bar segments that lost their connecting pixels) into their own tiny
 *     components — all measured ≤ 69px on this 991×594 canvas (i.e. sub-pixel at
 *     game size). Clear every non-dominant 4-conn opaque component below
 *     FOREGROUND_SPECKLE_MAX_PX so the silhouette is exactly the one clean mesh.
 *   STEP C — DESATURATE. Every surviving opaque pixel → Rec.601 luma (r=g=b),
 *     killing the blue/magenta duotone cast outright — this also means ANY residual
 *     fringe hue on an anti-aliased edge pixel (whatever its exact colour) disappears
 *     unconditionally, because "grey" has no hue left to fringe with.
 * SILHOUETTE-INTEGRITY GUARD (the "STOP if the re-key breaks the silhouette" rule):
 *   after A+B, the dominant opaque component's pixel-dominance ratio must stay
 *   ≥ FOREGROUND_MIN_DOMINANCE and its outer bbox must not shrink by more than
 *   FOREGROUND_MAX_BBOX_SHRINK_PX on any side vs the ORIGINAL (pre-retouch) bbox.
 *   Either guard failing ABORTS with a non-zero exit and writes NOTHING — the asset
 *   routes to regeneration, per the graphiste fiche, instead of shipping a punched
 *   silhouette.
 *
 * ── [2]+[3] ground.png / street.png — CONDITIONNEL: "xerox N&B" pass ───────────────
 * Both assets are currently photographic (soft photo gradients/texture) instead of
 * the house "photocopied 1990s fanzine" register (docs/art-direction.md §1); the
 * NIGHT VALUE is correct and must be PRESERVED, not brightened. One shared pass:
 *   1. Desaturate (Rec.601 luma) — kills the residual colour cast. On street.png this
 *      also removes the ONLY red content found: a single coherent ~27×31px warm
 *      window-glow blob at top-left (bbox [77,9,104,40], 518px) — NOT scattered
 *      "moucheté" noise (a full-image outlier sweep at several thresholds found zero
 *      isolated red flecks over the asphalt body itself; the audit's "moucheté rouge
 *      résiduel" is this one blob reading as a stray fleck at QTE display size). The
 *      blanket desaturation removes it along with every other cast, no special-cased
 *      inpainting needed.
 *   2. Contrast, pivoted at the image's OWN pre-pass mean luma (not 128) — this is
 *      what guarantees "sans éclaircir la valeur générale nuit": stretching around the
 *      image's own mean can only hold the mean flat or LOWER it (clamping crushes
 *      shadows to 0 and blows highlights to 255, both saturate-only moves; a pivot at
 *      128 would have net-brightened these two night-dark, below-128-mean assets).
 *      Measured: ground.png meanLuma 81.5→77.3, street.png 32.1→30.7 — both DOWN.
 *   3. Deterministic "toner" texture — a clumpy multiply-only grain (block noise,
 *      seeded, darken-only so it can never brighten) plus a faint Bayer 4×4 dot-screen
 *      (also multiply-only), matching the bible's toner-grain law (§2bis.1: "clumpy,
 *      not uniform... never a lightening/screen pass"). Amplitudes tuned down from an
 *      initial pass (halftoneAmp 0.08→0.035) after a 4× zoom crop showed the Bayer
 *      grid reading as a mechanical checkerboard rather than photocopy grain — 0.035
 *      keeps the dot-screen as a faint secondary cue under the primary clumpy grain.
 *
 * Both files are gitignored-free binaries — retouched IN PLACE, recoverable via git
 * (no .bak; `git diff`/`git checkout` on origin/main is the undo path).
 *
 * ── Idempotency ──────────────────────────────────────────────────────────────────
 * foreground.png's rekey+desaturate+sweep is a TRUE fixed point: on a re-run every
 * surviving pixel is already grey (score = r-g = 0, never > threshold) and there is
 * no debris left to sweep, so a second run changes nothing.
 * ground.png/street.png's xerox pass is NOT a fixed point (contrast + grain are lossy
 * stylizations, re-applying would double-crush and double-darken) — like
 * `retouch-flash-halos.mjs` / `retouch-flatten-enemy-background.mjs` this is a
 * **human-run pass, not a CI gate**. It guards against an accidental double-run: if
 * the target's mean saturation is already below XEROX_ALREADY_DONE_SAT_MAX, the
 * script SKIPS (pass --force to override deliberately).
 *
 * Requires @napi-rs/canvas (same install pattern as every sibling retouch script):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/retouch-belliard-decor.mjs                 # all three assets
 *   node scripts/retouch-belliard-decor.mjs foreground.png   # one asset by basename
 *   node scripts/retouch-belliard-decor.mjs --force ground.png street.png
 * Exit: 0 on success; 1 on a fatal error or a silhouette-integrity guard failure.
 *
 * ── CALIBRATION — foreground.png (991×594), measured pre-retouch ───────────────────
 *   baseline (pre-retouch) opaque=439713px, 1 dominant comp (438816px, domRatio .998),
 *     bbox [21,32,990,558], 159 tiny pre-existing debris comps (≤387px, sum 897px)
 *   magentaScore threshold sweep (cleared px / domRatio / bbox):
 *     15 → 160638 cleared, domRatio .924 (FRAGMENTS — rejected)
 *     20 → 144516 cleared, domRatio .923 (FRAGMENTS — rejected)
 *     25 → 127414 cleared, domRatio .990, bbox [27,35,975,555]
 *     30 → 109304 cleared, domRatio .997, bbox [26,35,976,556]
 *     35 → 89851 cleared,  domRatio .9983, bbox [26,34,976,556]  ← CHOSEN
 *     40 → 69742 cleared,  domRatio .998,  bbox [25,34,977,556]
 *   post-key (thresh=35) non-dominant components: 45 comps, sum 587px, max 69px —
 *     all cleared by the FOREGROUND_SPECKLE_MAX_PX=90 sweep.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_DIR = path.resolve(ROOT, "public/assets/levels/belliard");

const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;

const NEIGHBOURS4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * 4-connected labelling of an opaque mask (Uint8Array, 1=opaque). Returns components
 * sorted by size descending, each `{ n, bbox: [minX,minY,maxX,maxY], pixels }`.
 */
function labelComponents(W, H, opaque) {
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let p = 0; p < W * H; p++) {
    if (!opaque[p] || label[p] !== -1) continue;
    const id = comps.length;
    const stack = [p];
    label[p] = id;
    const pixels = [];
    let minX = W;
    let maxX = -1;
    let minY = H;
    let maxY = -1;
    while (stack.length) {
      const q = stack.pop();
      pixels.push(q);
      const x = q % W;
      const y = (q / W) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const [dx, dy] of NEIGHBOURS4) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (opaque[np] && label[np] === -1) {
          label[np] = id;
          stack.push(np);
        }
      }
    }
    comps.push({ n: pixels.length, bbox: [minX, minY, maxX, maxY], pixels });
  }
  comps.sort((a, b) => b.n - a.n);
  return comps;
}

function opaqueMask(W, H, d) {
  const mask = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) mask[p] = d[p * 4 + 3] !== 0 ? 1 : 0;
  return mask;
}

// ─────────────────────────────────────────────────────────────────────────────────
// [1] foreground.png — widen key + desaturate + speckle sweep
// ─────────────────────────────────────────────────────────────────────────────────

const FOREGROUND_MAGENTA_SCORE_THRESHOLD = 35; // min(r,b) - g ; see CALIBRATION above
const FOREGROUND_SPECKLE_MAX_PX = 90; // > measured max orphan (69px), < any real structure
const FOREGROUND_MIN_DOMINANCE = 0.995;
const FOREGROUND_MAX_BBOX_SHRINK_PX = 20;

/** Pure: widen the chroma-key. Clears alpha on any opaque pixel whose
 * min(r,b)-g exceeds the threshold. Returns the count cleared. */
export function rekeyForegroundMagenta(
  { W, H, d },
  threshold = FOREGROUND_MAGENTA_SCORE_THRESHOLD,
) {
  let cleared = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (d[i + 3] === 0) continue;
    const score = Math.min(d[i], d[i + 2]) - d[i + 1];
    if (score > threshold) {
      d[i + 3] = 0;
      cleared++;
    }
  }
  return cleared;
}

/** Pure: r=g=b=luma on every opaque pixel. Returns the count changed. */
export function desaturateOpaque({ W, H, d }) {
  let changed = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (d[i + 3] === 0) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    if (r === g && g === b) continue;
    const l = Math.round(lum(r, g, b));
    d[i] = l;
    d[i + 1] = l;
    d[i + 2] = l;
    changed++;
  }
  return changed;
}

/** Pure: clear every non-dominant 4-conn opaque component below maxPx. */
export function sweepSpeckle({ W, H, d }, maxPx) {
  const mask = opaqueMask(W, H, d);
  const comps = labelComponents(W, H, mask);
  let removedComps = 0;
  let removedPx = 0;
  for (let c = 1; c < comps.length; c++) {
    if (comps[c].n < maxPx) {
      for (const p of comps[c].pixels) d[p * 4 + 3] = 0;
      removedComps++;
      removedPx += comps[c].n;
    }
  }
  return { removedComps, removedPx };
}

async function processForeground(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const view = { W, H, d };

  const baselineComps = labelComponents(W, H, opaqueMask(W, H, d));
  const baselineBbox = baselineComps[0].bbox;

  const cleared = rekeyForegroundMagenta(view);
  const desaturated = desaturateOpaque(view);
  const { removedComps, removedPx } = sweepSpeckle(view, FOREGROUND_SPECKLE_MAX_PX);

  const afterComps = labelComponents(W, H, opaqueMask(W, H, d));
  const totalOpaque = afterComps.reduce((a, c) => a + c.n, 0);
  const domRatio = afterComps[0].n / totalOpaque;
  const bbox = afterComps[0].bbox;
  // Each side of the bbox can only move INWARD as pixels are cleared (left/top grow,
  // right/bottom shrink); measure how far in px, per side, vs the pre-retouch bbox.
  const shrinkLeft = Math.max(0, bbox[0] - baselineBbox[0]);
  const shrinkTop = Math.max(0, bbox[1] - baselineBbox[1]);
  const shrinkRight = Math.max(0, baselineBbox[2] - bbox[2]);
  const shrinkBottom = Math.max(0, baselineBbox[3] - bbox[3]);
  const maxShrink = Math.max(shrinkLeft, shrinkTop, shrinkRight, shrinkBottom);

  console.log(
    `  foreground.png (${W}x${H}) — rekeyed ${cleared}px, desaturated ${desaturated}px, ` +
      `speckle removed ${removedComps} comp / ${removedPx}px`,
  );
  console.log(
    `    silhouette check: domRatio=${domRatio.toFixed(4)} bbox=${JSON.stringify(bbox)} ` +
      `(baseline ${JSON.stringify(baselineBbox)}, max shrink ${maxShrink}px)`,
  );

  if (domRatio < FOREGROUND_MIN_DOMINANCE) {
    throw new Error(
      `SILHOUETTE-INTEGRITY GUARD FAILED: dominant-component ratio ${domRatio.toFixed(4)} ` +
        `< ${FOREGROUND_MIN_DOMINANCE} — the re-key fragmented the ironwork. STOP: routes to ` +
        `regeneration, nothing written.`,
    );
  }
  if (maxShrink > FOREGROUND_MAX_BBOX_SHRINK_PX) {
    throw new Error(
      `SILHOUETTE-INTEGRITY GUARD FAILED: outer bbox shrank ${maxShrink}px ` +
        `(> ${FOREGROUND_MAX_BBOX_SHRINK_PX}px budget) — the re-key ate into the silhouette. ` +
        `STOP: routes to regeneration, nothing written.`,
    );
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log("    OK — written.");
}

// ─────────────────────────────────────────────────────────────────────────────────
// [2]+[3] ground.png / street.png — xerox N&B pass
// ─────────────────────────────────────────────────────────────────────────────────

const XEROX_CONTRAST = 1.35; // pivoted at the image's OWN mean — see header
const XEROX_HALFTONE_AMP = 0.035; // faint Bayer 4x4 dot-screen, multiply-only
const XEROX_GRAIN_AMP = 0.14; // clumpy toner grain, multiply-only (darken-only)
const XEROX_GRAIN_BLOCK = 3; // px per grain block — bigger clumps, not fine snow
const XEROX_ALREADY_DONE_SAT_MAX = 3; // mean(max-min) below this ⇒ already achromatic

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Deterministic PRNG (mulberry32) — never Math.random, so the grain is reproducible. */
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mean channel saturation (max-min) over opaque pixels — used to detect an
 * already-desaturated image (skip guard) and to log the before-state. */
export function meanSaturation({ W, H, d }) {
  let sum = 0;
  let n = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (d[i + 3] === 0) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    sum += Math.max(r, g, b) - Math.min(r, g, b);
    n++;
  }
  return n === 0 ? 0 : sum / n;
}

/**
 * Desaturate → contrast (pivoted at the image's OWN pre-pass mean, so it can only
 * hold or LOWER the mean, never brighten) → clumpy multiply-only grain → faint
 * multiply-only Bayer dot-screen. Mutates `d` in place. Returns before/after mean luma.
 */
export function xeroxPass({ W, H, d }, seed) {
  let sum = 0;
  let n = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (d[i + 3] === 0) continue;
    const l = lum(d[i], d[i + 1], d[i + 2]);
    d[i] = l;
    d[i + 1] = l;
    d[i + 2] = l;
    sum += l;
    n++;
  }
  const meanBefore = n === 0 ? 0 : sum / n;

  const rand = mulberry32(seed);
  const bw = Math.ceil(W / XEROX_GRAIN_BLOCK);
  const bh = Math.ceil(H / XEROX_GRAIN_BLOCK);
  const blockNoise = new Float32Array(bw * bh);
  for (let i = 0; i < blockNoise.length; i++) blockNoise[i] = rand() * 2 - 1; // [-1,1]

  let sumAfter = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const i = p * 4;
      if (d[i + 3] === 0) continue;
      let v = d[i];
      v = meanBefore + (v - meanBefore) * XEROX_CONTRAST; // contrast, pivoted at own mean
      const bx = (x / XEROX_GRAIN_BLOCK) | 0;
      const by = (y / XEROX_GRAIN_BLOCK) | 0;
      const noise = blockNoise[by * bw + bx];
      const grainMul = 1 - XEROX_GRAIN_AMP * Math.max(0, -noise); // darken-only
      v *= grainMul;
      const bv = BAYER4[y % 4][x % 4] / 15;
      const dotMul = 1 - XEROX_HALFTONE_AMP * bv; // darken-only
      v *= dotMul;
      v = Math.max(0, Math.min(255, Math.round(v)));
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      sumAfter += v;
    }
  }
  const meanAfter = n === 0 ? 0 : sumAfter / n;
  return { meanBefore, meanAfter };
}

async function processXerox(file, seed, { force }) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const view = { W, H, d };

  const satBefore = meanSaturation(view);
  if (satBefore < XEROX_ALREADY_DONE_SAT_MAX && !force) {
    console.log(
      `  ${path.basename(file)} — already achromatic (meanSat=${satBefore.toFixed(1)}), ` +
        `skip (pass --force to re-bake).`,
    );
    return;
  }

  const { meanBefore, meanAfter } = xeroxPass(view, seed);

  if (meanAfter > meanBefore + 0.5) {
    throw new Error(
      `${path.basename(file)}: xerox pass LIGHTENED the mean luma (${meanBefore.toFixed(1)} → ` +
        `${meanAfter.toFixed(1)}) — violates "sans éclaircir la valeur générale nuit". Nothing written.`,
    );
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(
    `  ${path.basename(file)} (${W}x${H}) — meanSat ${satBefore.toFixed(1)}→0, ` +
      `meanLuma ${meanBefore.toFixed(1)}→${meanAfter.toFixed(1)} (never lightened). OK — written.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────────

const XEROX_SEEDS = { "ground.png": 1001, "street.png": 1002 };

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const targets =
    fileArgs.length > 0
      ? fileArgs.map((a) => path.basename(a))
      : ["foreground.png", "ground.png", "street.png"];

  for (const name of targets) {
    const file = path.join(LEVEL_DIR, name);
    if (!fs.existsSync(file)) {
      console.log(`  MISSING ${name}`);
      continue;
    }
    if (name === "foreground.png") {
      await processForeground(file);
    } else if (name === "ground.png" || name === "street.png") {
      await processXerox(file, XEROX_SEEDS[name], { force });
    } else {
      console.log(`  skip ${name} — not a belliard-decor retouch target`);
    }
  }
  console.log("done.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[retouch-belliard-decor] Fatal:", e.message);
    process.exit(1);
  });
}
