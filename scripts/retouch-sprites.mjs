#!/usr/bin/env node
/**
 * DETERMINISTIC PER-SPRITE RETOUCH — post-key geometry repair.
 *
 * Home of the scripted, re-runnable sprite retouches Serge (game-graphist) signs
 * off (game-graphist.md line 66: "retouch via script only … fringe cleanup, halo
 * clamp, alpha hardening"). This is POST-KEY GEOMETRY REPAIR — a different concern
 * from the KEYING/flood logic, which stays in the shared scripts/cutout-enemies.mjs
 * (ADR-0013 rejected a standalone retouch ONLY for the flood logic, to avoid forking
 * it; a hip-bridge + speckle sweep does not touch the flood and does not fork it).
 *
 * ── Why this exists (story-courier-cyclist-sprite-fix) ───────────────────────
 * FLUX never drew the courier's pelvis: the hip/crotch/upper-thigh band rendered as
 * paper-WHITE (opaque in origin/main, so the figure read solid even if anatomically
 * odd). The enclosed-island keying pass (ADR-0013) then measured that white as flat
 * ground and cleared it → an interior TRANSPARENT hole that visibly severs BOTH legs
 * from the torso at game size. Topologically the silhouette is still ONE component
 * (the legs hang on via the bike frame), so this is a VISUAL/readability defect, not
 * a fragmentation one — a documented per-sprite geometry repair, NOT a general filter.
 *
 * Two deterministic, idempotent operations, applied IN THIS ORDER (bridge FIRST so a
 * stray bridge pixel — none observed — is swept by the speckle pass):
 *
 *   1. HIP BRIDGE — close the anatomy hole with a FLAT, locally-sampled trouser
 *      aplat (no gradient/airbrush/highlight — a modelled patch would render more
 *      than the flat trouser around it and read as a repair). Sample the aplat from
 *      the sprite's own dark trouser pixels (never hardcode a colour); fill only the
 *      hip window pixels that are truly ENCLOSED by opaque-dark body on all four
 *      sides — so the legit bike-frame triangle and wheel spokes stay see-through.
 *   2. SPECKLE SWEEP — drop the keying-debris parasites (tiny non-dominant opaque
 *      components) left by the previous cycle's cutout, matching the budget the new
 *      integrity gate (scripts/check-sprite-integrity.mjs) enforces.
 *
 * Runs IN PLACE on public/assets/<sprite>. Deterministic + idempotent: a re-run
 * finds the hole already filled (0 bridged) and 0 parasites (0 swept) → byte-stable.
 *
 * This is NOT wired into CI: it is the explicit human-run in-place fix. Leaving it
 * out of the pipeline keeps check-sprite-integrity.mjs a TRUE gate. Note the gate
 * HARD-fails a regen only on KEYING DEBRIS beyond budget / subject fragmentation /
 * non-binary alpha — a re-opened hip hole ALONE passes HARD (the legs hang on via the
 * bike frame, dominance ~0.99) and shows only as a SOFT WARN, so a human must act on
 * that WARN and re-run this retouch. CI's no-args batch cutout SKIPS pre-keyed sprites
 * (ADR-0013), so the committed bytes stay stable after this runs once.
 *
 * Usage:
 *   node scripts/retouch-sprites.mjs                 # retouch every known sprite
 *   node scripts/retouch-sprites.mjs enemy_civilian.png   # one sprite by basename
 * Requires @napi-rs/canvas (same dep + install pattern as cutout-enemies.mjs):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 * Exit: 0 on success; 1 on a fatal error or a wheel-leak assertion failure.
 *
 * See the CALIBRATION TABLE at the bottom for the measured before/after numbers.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.resolve(ROOT, "public/assets");

// Shared speckle budget — a non-dominant 4-connected opaque component smaller than
// this many pixels is keying debris (at game size /4 an 11px island is < 1px: a hot
// speck of dirt). MUST match SPECKLE_MAX_SIZE_PX in check-sprite-integrity.mjs so
// the retouch produces exactly what the gate demands. 12 is conservative: a
// hypothetical 30px legitimately-detached element would survive.
const SPECKLE_MAX_SIZE_PX = 12;

// Luminance (Rec.601-ish) — the perceptual weight used everywhere in this file to
// tell dark trouser/body ink from pale highlights and ground.
const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;

// 4-CONNECTIVITY neighbour order (matches components.mjs / cutout-enemies.mjs /
// check-sprite-integrity.mjs). 4-conn is REQUIRED for the speckle sweep: an 8-conn
// labelling would merge the diagonally-linked keying-debris cluster near x199-206
// into one larger component that survives the < 12px budget (graphist's warning).
const NEIGHBOURS4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Per-sprite retouch spec. Every window/threshold is tuned to ONE sprite's measured
 * geometry — this is a documented per-sprite retouch, NOT a reusable filter. A
 * future enemy sprite that needs a bridge gets its OWN measured entry here.
 */
const RETOUCH_SPECS = {
  // ── enemy_civilian.png — the "livreur en vélo" (256x256) ──────────────────
  // Hip/crotch/upper-thigh reattachment. All coordinates measured on the current
  // committed sprite (Serge's PRE-PROD pass); origin/main had this band opaque-white.
  "enemy_civilian.png": {
    bridge: {
      // STEP 1 — sample the local trouser aplat. Mean RGB of OPAQUE pixels whose
      // luminance is below sampleLumMax, inside the sample window (the dark trouser
      // under the vest). Measured value ≈ (52,48,62) — dark desaturated blue-violet;
      // this is SAMPLED at runtime, the number is a reference comment only.
      sampleWin: { x0: 120, y0: 150, x1: 180, y1: 200 },
      sampleLumMax: 70,
      // STEP 2 — fill window: the hip/crotch/upper-thigh band UNDER the vest and
      // ABOVE the pedals. Deliberately excludes BOTH wheels (x < 95 rear, x > 190
      // front) and the bike-frame triangle below the saddle (y > 197).
      fillWin: { x0: 118, y0: 143, x1: 190, y1: 197 },
      // STEP 3 — enclosure rule: a pixel is filled ONLY IF it is currently
      // transparent AND enclosed by opaque-dark body (alpha!=0 AND lum < enclosureLumMax)
      // within maxGap px in ALL FOUR directions. This bridges torso→thigh and closes
      // the crotch, but never fills open background (right side) and never reaches the
      // wheel-spoke gaps (outside the window and not four-way dark-enclosed).
      maxGap: 30,
      enclosureLumMax: 90,
    },
    // Wheel-leak assertion: after the bridge, NO filled pixel may land on a wheel
    // (x < wheelMinX rear wheel, x > wheelMaxX front wheel) — the spokes stay
    // see-through. A violation aborts the retouch (never ship a wheel fill).
    wheelGuard: { minX: 95, maxX: 190 },
  },
};

/**
 * STEP 1 — mean RGB of the local dark trouser aplat. Pure. Sampled from the
 * sprite's own pixels so the patch matches the existing flat trouser exactly; never
 * a hardcoded literal. Throws if the sample window holds no dark opaque pixel (a
 * signal the sprite changed and the window needs re-measuring).
 */
export function sampleAplat({ W, H, d }, { sampleWin, sampleLumMax }) {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  for (let y = sampleWin.y0; y <= sampleWin.y1 && y < H; y++) {
    for (let x = sampleWin.x0; x <= sampleWin.x1 && x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] === 0) continue;
      if (lum(d[i], d[i + 1], d[i + 2]) < sampleLumMax) {
        sr += d[i];
        sg += d[i + 1];
        sb += d[i + 2];
        n++;
      }
    }
  }
  if (n === 0) throw new Error("sampleAplat: no dark opaque pixel in the sample window");
  return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
}

/**
 * STEP 2+3 — hip bridge. Pure, mutates `d` in place, returns the fill stats. Sets
 * the sampled aplat at alpha 255 (BINARY — no semi-transparency).
 *
 * Iterated to a FIXED POINT (this is what makes the retouch idempotent). A single
 * pass is NOT idempotent: the flat aplat we write is itself dark body (lum≈51 <
 * enclosureLumMax), so it enables neighbouring transparent pixels that were open on
 * one side to become four-way enclosed on the NEXT pass — a fresh re-run of the
 * whole script would then fill 45 more pixels and change the bytes. Iterating here
 * until no pixel is added drives the fill to convergence WITHIN this run, so a later
 * re-run starts from the converged state, finds nothing four-way-enclosed, and fills
 * 0 → byte-identical. Convergence is the mathematically correct "close the enclosed
 * hole" operation; the window bounds it (open-to-background pixels never gain a dark
 * body on the open side, so the patch cannot grow past the true hip cavity — verified:
 * the converged bbox equals the first-pass bbox, only 45 interior pixels are added).
 */
export function bridgeHip({ W, H, d }, { bridge }, aplat) {
  const { fillWin, maxGap, enclosureLumMax } = bridge;
  const isOpaqueDark = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = (y * W + x) * 4;
    return d[i + 3] !== 0 && lum(d[i], d[i + 1], d[i + 2]) < enclosureLumMax;
  };
  let filled = 0;
  let minX = W;
  let maxX = -1;
  let minY = H;
  let maxY = -1;
  for (;;) {
    // Compute the round's fill mask against the CURRENT alpha (a read pass, then a
    // write pass) so the result is scan-order independent within the round.
    const mask = new Uint8Array(W * H);
    let added = 0;
    for (let y = fillWin.y0; y <= fillWin.y1 && y < H; y++) {
      for (let x = fillWin.x0; x <= fillWin.x1 && x < W; x++) {
        const i = (y * W + x) * 4;
        if (d[i + 3] !== 0) continue; // only fill currently-transparent pixels
        // Enclosure: opaque-dark body within maxGap in EACH of the four directions.
        let left = false;
        let right = false;
        let up = false;
        let down = false;
        for (let k = 1; k <= maxGap; k++)
          if (isOpaqueDark(x - k, y)) {
            left = true;
            break;
          }
        for (let k = 1; k <= maxGap; k++)
          if (isOpaqueDark(x + k, y)) {
            right = true;
            break;
          }
        for (let k = 1; k <= maxGap; k++)
          if (isOpaqueDark(x, y - k)) {
            up = true;
            break;
          }
        for (let k = 1; k <= maxGap; k++)
          if (isOpaqueDark(x, y + k)) {
            down = true;
            break;
          }
        if (left && right && up && down) {
          mask[y * W + x] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          added++;
        }
      }
    }
    if (added === 0) break; // fixed point reached
    for (let p = 0; p < W * H; p++) {
      if (!mask[p]) continue;
      const i = p * 4;
      d[i] = aplat[0];
      d[i + 1] = aplat[1];
      d[i + 2] = aplat[2];
      d[i + 3] = 255;
      filled++;
    }
  }
  return { filled, bbox: filled ? [minX, minY, maxX, maxY] : null };
}

/**
 * SPECKLE SWEEP — 4-connected labelling of opaque components; clear (alpha 0) every
 * NON-dominant component smaller than SPECKLE_MAX_SIZE_PX. Pure, mutates `d`.
 * Returns the count of components removed and pixels cleared.
 */
export function sweepSpeckle({ W, H, d }) {
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let p = 0; p < W * H; p++) {
    if (d[p * 4 + 3] === 0 || label[p] !== -1) continue;
    const id = comps.length;
    const stack = [p];
    label[p] = id;
    const px = [];
    while (stack.length) {
      const q = stack.pop();
      px.push(q);
      const x = q % W;
      const y = (q / W) | 0;
      for (const [dx, dy] of NEIGHBOURS4) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (d[np * 4 + 3] !== 0 && label[np] === -1) {
          label[np] = id;
          stack.push(np);
        }
      }
    }
    comps.push(px);
  }
  comps.sort((a, b) => b.length - a.length); // index 0 = dominant silhouette
  let removedComps = 0;
  let removedPx = 0;
  for (let c = 1; c < comps.length; c++) {
    if (comps[c].length < SPECKLE_MAX_SIZE_PX) {
      for (const p of comps[c]) d[p * 4 + 3] = 0;
      removedComps++;
      removedPx += comps[c].length;
    }
  }
  return { removedComps, removedPx };
}

async function loadPixels(file) {
  let mod;
  try {
    mod = await import("@napi-rs/canvas");
  } catch {
    throw new Error(
      "@napi-rs/canvas is required for the retouch " +
        "(install: npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2)",
    );
  }
  const { loadImage, createCanvas } = mod;
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  return { W, H, d: image.data, canvas, ctx, image };
}

async function retouchFile(basename) {
  const spec = RETOUCH_SPECS[basename];
  if (!spec) {
    console.log(`  skip ${basename} — no retouch spec`);
    return;
  }
  const file = path.join(ASSETS_DIR, basename);
  if (!fs.existsSync(file)) {
    console.log(`  MISSING ${basename}`);
    return;
  }
  const px = await loadPixels(file);
  const view = { W: px.W, H: px.H, d: px.d };

  // STEP 1–3: bridge the hip anatomy hole with a locally-sampled flat aplat.
  const aplat = sampleAplat(view, spec.bridge);
  const { filled, bbox } = bridgeHip(view, spec, aplat);

  // Wheel-leak assertion — the bridge must never fill a wheel pixel.
  if (bbox) {
    const { minX, maxX } = spec.wheelGuard;
    if (bbox[0] < minX || bbox[2] > maxX) {
      throw new Error(
        `${basename}: bridge fill leaked into a wheel zone (bbox x [${bbox[0]}..${bbox[2]}], ` +
          `allowed [${minX}..${maxX}])`,
      );
    }
  }

  // SPECKLE SWEEP (after the bridge).
  const { removedComps, removedPx } = sweepSpeckle(view);

  px.ctx.putImageData(px.image, 0, 0);
  fs.writeFileSync(file, px.canvas.toBuffer("image/png"));

  console.log(
    `  retouch ${basename} (${px.W}x${px.H}) — aplat=(${aplat.join(",")}) ` +
      `bridged=${filled}px${bbox ? ` bbox=[${bbox.join(",")}]` : ""} ` +
      `speckle removed=${removedComps} comp / ${removedPx}px`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args.map((a) => path.basename(a)) : Object.keys(RETOUCH_SPECS);
  for (const t of targets) await retouchFile(t);
  console.log("done.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[retouch] Fatal:", e.message);
    process.exit(1);
  });
}

/*
 * CALIBRATION TABLE — enemy_civilian.png (256x256), measured before/after.
 *
 *   metric                                  BEFORE          AFTER
 *   opaque 4-conn components                69              1 (dominant only)
 *   dominant component size                 19469 px        20082 px (+611 bridge, +2px speckles absorbed)
 *   non-dominant parasites (< 12px)         68              0
 *   dominance ratio (largest / total)       ~0.99           1.00
 *   hip-band interior enclaves (> 40px)     3               0
 *       (224px[163,150,175,177], 110px[135,145,152,161], 103px[134,172,142,194])
 *   silhouette outer bbox (dominant)        [29,19,226,237] [29,19,226,237] UNCHANGED
 *   semi-transparent (0<alpha<255) pixels   0               0 (binary preserved)
 *   sampled trouser aplat                   —               (52,48,62)
 *   bridge fill bbox                         —              [134,143,190,197]
 *   wheel-zone leakage (x<95 or x>190)       —              0 px
 *
 * NOTE on 611 vs the graphist's prototype (566): the PRE-PROD prototype filled in a
 * SINGLE pass (566px) and assumed that was idempotent — it is not (see bridgeHip:
 * the flat aplat is dark body and enables 45 more pixels on a second pass). This
 * script iterates to a FIXED POINT (2 rounds, 611px) so the retouch is truly
 * idempotent; the converged bbox is identical to the prototype's, only 45 interior
 * pixels are added, so the visual read is unchanged.
 *
 * The bridge is purely INTERIOR (fills a land-locked transparent hole), so the outer
 * silhouette bbox is untouched. Idempotent: a re-run finds the hole opaque (0 bridged)
 * and 0 parasites (0 swept) → byte-identical output.
 *
 * CAUTION: the fill window x[118,190] / y[143,197], maxGap=30 and the sample window
 * are tuned to THIS sprite's geometry. This is a per-sprite retouch — a future enemy
 * sprite that needs a bridge gets its own measured RETOUCH_SPECS entry.
 *
 * The speckle threshold 12px also clears the ~47 pre-existing sub-3px noise comps that
 * origin/main carried; harmless, but it means the 'after' is CLEANER than the accepted
 * origin/main baseline (a strict byte-diff reviewer should expect this).
 */
