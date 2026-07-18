#!/usr/bin/env node
/**
 * BACKGROUND-FLATTEN RETOUCH — pre-key spatial isolation of the `enemies` pochoir set's
 * background, so the existing chroma-key (`cutout-enemies.mjs`) can do its job.
 *
 * ── The defect (docs/art-direction/prompt-drafts/enemies.md "Blocage keying") ─────────
 * The gated pochoir/xerox style prompt reliably makes FLUX pose a SCANNED PAGE instead of
 * a void: a lighter/off-tone paper-edge/vignette ring around the whole frame (measured
 * ring width ≤ 10px on the calibration set below), regardless of the target ground
 * colour — first diagnosed on a matte-black ground (enemy_biker measured a corner ~
 * (50,48,49), not (0,0,0)), and RE-CONFIRMED after the black→magenta chroma migration
 * (2026-07-18, root-cause fix for the black-ink-on-black-ground "bite" — see
 * docs/handoffs/story-enemy-chroma-migration.md): a fresh magenta (#FF3CDC) roll measured
 * corner distance-to-target 106→151, the SAME paper-edge defect, just against a different
 * hex. So this script targets a CONFIGURABLE ground colour (TARGET_COLOR, black or
 * magenta today) rather than assuming black.
 *
 * ── The fix: two SPATIAL passes, neither a global threshold ──────────────────────────
 *   1. EDGE INSET — force a fixed-width band along the image borders to TARGET_COLOR,
 *      UNCONDITIONALLY. This is safe only because it is bounded by MEASURED GEOMETRY, not
 *      colour: every prompt in this family renders a "centered game sprite" with tens of
 *      px of margin (see the calibration table), and the worst observed ring width is
 *      10px, so INSET_PX=14 clears the ring with margin while staying far short of any
 *      figure's bbox. This is what actually solves the "torn paper" ring: the transition
 *      from the bright edge down to the interior tone is sometimes a single-pixel CLIFF
 *      (e.g. enemy_biker: 225→89→38 across 2px) too steep for any local-tolerance walk to
 *      cross safely (a tolerance wide enough to cross it is also wide enough to leak into
 *      the figure — proven below), so the ring is handled by fixed geometry instead.
 *   2. SPATIAL FLOOD, PER-STEP LOCAL TOLERANCE — a border-connected flood-fill, seeded
 *      from the (now flat) inset band + the raw image edges, that mops up the remaining
 *      GENTLE interior background variation (grain speckle, soft vignette residue). Each
 *      candidate pixel is compared to the NEIGHBOUR that is pulling it in (not to one
 *      global reference), so the fill can walk a slow gradient but is walled by a genuine
 *      high-contrast jump — exactly the "bold flat high-contrast silhouette" the pochoir
 *      prompt itself mandates. STEP_TOL=20 is calibrated LOW: at 60 the flood leaked
 *      straight through the figure's own toner-grain shading and shattered every sample
 *      into dozens of fragments (see CALIBRATION below) — the failure mode the brief calls
 *      out ("l'encre grise du pochoir ≈ fond gris"). 20 stays comfortably under the
 *      smallest measured true silhouette jump (~90) while still crossing the background's
 *      own grain noise (≤ ~50 typical, with rare spikes the flood simply leaves as
 *      sub-pixel un-flattened flecks — cleaned by the existing keying-debris speckle sweep
 *      downstream, not by this script).
 *
 * ── Bottom edge: STILL never seeded or inset, on EITHER ground — this is a GEOMETRY
 * guard, not a colour one ─────────────────────────────────────────────────────────────
 * First attempt at the magenta migration reasoned "black ink is ~300 Euclidean-RGB from
 * #FF3CDC, so the flood can't mistake it for ground" and enabled bottom seeding — WRONG,
 * measured and reverted. The two stages have different hazards:
 *   • The per-step FLOOD (stage 2) is colour-gated and the reasoning above is correct FOR
 *     IT — it cannot cross into dark ink from a genuinely-magenta parent.
 *   • The EDGE INSET (stage 1) and the raw-edge seed fallback are BLIND — they force-paint
 *     every pixel in the geometric band/on the border regardless of its colour. If a
 *     figure's foot/trouser pixel sits inside that band (which happens: enemy_sprite_f2's
 *     legs run close to the bottom edge), the blind inset paints it TARGET_COLOR outright,
 *     and that wrongly-painted-magenta pixel then becomes a valid FLOOD SEED itself,
 *     bootstrapping a leak that eats connected dark-ink regions using ITS OWN (wrong) local
 *     colour as reference. Measured on the fresh magenta enemy_sprite_f2 roll: the geometric
 *     bottom inset painted straight over both trouser legs before any flood ran.
 *   • A colour GATE on the inset (only force-paint if already close-ish to TARGET_COLOR)
 *     cannot fix this either — measured on the same roll, the torn-paper RING residue
 *     spans Euclidean distance 69→293 from #FF3CDC (near-magenta blends AND near-white
 *     cream fragments), which fully overlaps and exceeds the darkest figure ink's distance
 *     (172→198). No threshold separates "ring" from "ink" by colour alone.
 * So bottom stays geometry-excluded unconditionally, exactly as on black — this is NOT the
 * chroma-migration's problem to fix. The bottom-left/bottom-right corner PATCHES are still
 * reached and flattened because the full-height L/R inset columns cover them laterally
 * (unchanged from the black-ground behaviour). The coordinator's "re-enable bottom
 * seeding" note is about `cutout-enemies.mjs`'s OWN keyer seed loop, a DIFFERENT and
 * genuinely colour-gated mechanism (`pushIf` tests distance-to-sampled-ground before ever
 * treating a border pixel as ground) — see that script for the actual fix.
 *
 * ── This is ONLY stage 1 of a pipeline (stage count depends on target — see below) ────
 * Painting the ground flat is necessary but not sufficient. Run, IN ORDER:
 *   1. node scripts/retouch-flatten-enemy-background.mjs --target=magenta <files>
 *   2. node scripts/cutout-enemies.mjs <files>                     (existing keyer,
 *      corner-adaptive — keys whatever flat colour it samples, magenta included)
 *   3. node scripts/sweep-enemy-speckle.mjs <files>                (existing sweepSpeckle,
 *      generic wrapper — the pochoir/xerox "torn scratch" grain the style prompt bakes in
 *      survives keying as a scatter of tiny (<12px) opaque islands hugging the silhouette;
 *      needed on both grounds.)
 *   4. node scripts/fill-sprite-holes.mjs <files>                  (existing solidify —
 *      REQUIRED on a BLACK ground: driving the keyer's sampled ground to exact (0,0,0)
 *      makes its own near-black thresholds more likely to also key out the pochoir's deep
 *      shadow ink, porosifying the figure. On MAGENTA this class of defect is gone by
 *      construction — see CALIBRATION for the re-measured dominance with this stage
 *      SKIPPED — but running it is still harmless/idempotent if any residual porosity
 *      shows up on a future roll; judge per-batch from the integrity gate.)
 * check-sprite-integrity.mjs is the mechanical floor after the last stage; a human/agent
 * visual sweep on a NON-target-colour composite (cyan on a magenta ground — magenta-on-
 * magenta fringe is invisible on a magenta composite) is still required per
 * game-graphist.md before Nico's asset gate — see CALIBRATION for the measured before/after.
 *
 * Mutates ONLY the RGB channels of pixels it paints (alpha untouched — this runs on
 * still-fully-opaque, freshly generated PNGs, before any keying). Idempotent: a
 * re-run finds the inset band and flood region already at TARGET_COLOR — dist-to-parent 0
 * ≤ STEP_TOL — so it repaints the same pixels the same colour → byte-identical.
 *
 * Requires @napi-rs/canvas (same install as every sibling retouch/cutout script):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/retouch-flatten-enemy-background.mjs                     # black target, every enemy_*.png
 *   node scripts/retouch-flatten-enemy-background.mjs --target=magenta    # #FF3CDC target
 *   node scripts/retouch-flatten-enemy-background.mjs --target=magenta a.png b.png
 *   ASSET_DIR=… node scripts/retouch-flatten-enemy-background.mjs         # override target dir
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

// Ground colour presets. magenta is the pipeline's proven chroma (#FF3CDC — vehicles,
// foregrounds; NOT #FF00FF, see docs/handoffs/story-enemy-chroma-migration.md's PROMPT
// GATE condition). Bottom stays geometry-excluded for BOTH — see the header note above.
// pocketFill enables the magenta-tint enclosed-pocket pass (magenta only — see
// fillTintedPockets below); meaningless for a neutral black target.
const TARGET_PRESETS = {
  black: { rgb: [0, 0, 0], pocketFill: false },
  magenta: { rgb: [0xff, 0x3c, 0xdc], pocketFill: true },
};

// Magenta-tint test: sum of the positive (r-g) and (b-g) differences. #FF3CDC itself
// scores ~355; neutral pochoir ink (grey/black/white, r≈g≈b) scores ≈0. Calibrated on the
// checkpoint sample (2026-07-18 chroma-migration retest): heavily blended enclosed
// residue pockets (a crotch/inseam gap FLUX rendered as desaturated magenta-pink instead
// of a clean cut) measured tint 116-208; genuine dark ink (lum<60) measured tint 0-1 on
// every sample. 40 sits with wide margin on both sides.
const TINT_THRESH = 40;

// Fixed-geometry ring guard (px). Calibrated on the 5-file hard-case sample (enemy_sprite,
// _2, _3, enemy_biker, enemy_shooting): measured worst-case ring width top=5 left=9
// right=9 (enemy_biker); every sample's figure sits with generous (>40px) margin from
// every border, so 14 clears the worst ring with margin and stays far short of any
// figure. Re-measure (scripts/lib — or the ring-width probe in the retouch's PR) before
// trusting this constant on a sprite family with tighter framing.
export const INSET_PX = 14;

// Per-STEP local-tolerance flood (Euclidean RGB distance from the flood-parent pixel,
// NOT a global reference). Calibrated LOW deliberately: at 60 the flood crossed the
// figure's own toner-grain shading and shattered every sample (dominance dropped to
// 71-96%, see CALIBRATION on the black-ground set). RE-CALIBRATED DOWN TWICE on the
// magenta migration: 20 → 15 (enemy_sprite_f2, seed 4801 frame 2 — leg pixels
// flood-reachable at 18, safe at 17 and below), then 15 → 6 (enemy_sprite, SAME seed
// frame 1 — an EVEN SOFTER leg-to-ground edge in this specific roll: leg pixels stayed
// flood-reachable all the way down to STEP_TOL 8, only becoming safe at 6). The two
// frames of the historical bite seed needed different tolerances, underlining that this
// constant is a per-roll safety margin, not a fixed physical quantity — 6 is the CURRENT
// calibration floor from the worst roll measured so far; a future roll could push it
// lower still. The INSET (unconditional geometry, not colour) does the bulk of the
// corner-flattening work regardless of STEP_TOL, so lowering this constant only means
// MORE residue is left for the downstream pocket-fill / speckle-sweep / solidify stages
// to mop up — never a reason to trade figure safety for a cleaner background in one pass.
export const STEP_TOL = 6;

function dist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Compute the background mask (Uint8Array, 1 = paint TARGET_COLOR) for one decoded RGBA
 * buffer. Pure — does not mutate `d`. Exported for unit testing.
 *
 * Stage 1: unconditional geometric inset (top + left + right ONLY — see the header note
 * on why bottom stays excluded on every ground colour, black or magenta).
 * Stage 2: per-step local-tolerance flood from that seed, plus the raw top/left/right
 * image edges (belt-and-braces — matters only if insetPx is ever set to 0).
 */
export function computeBackgroundMask(
  { W, H, d },
  { insetPx = INSET_PX, stepTol = STEP_TOL } = {},
) {
  const N = W * H;
  const bg = new Uint8Array(N);

  // Stage 1 — geometric inset seed (top + left + right; bottom NEVER — geometry hazard,
  // not a colour one, see the header note).
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < insetPx || x >= W - insetPx || y < insetPx) bg[y * W + x] = 1;
    }
  }

  // Stage 2 — per-step local-tolerance flood.
  const visited = Uint8Array.from(bg);
  const stack = [];
  for (let p = 0; p < N; p++) if (bg[p]) stack.push(p);
  // Raw edge seeds (top/left/right) in case insetPx is 0 in a test/override.
  for (let x = 0; x < W; x++) {
    const p = x;
    if (!visited[p]) {
      visited[p] = 1;
      bg[p] = 1;
      stack.push(p);
    }
  }
  for (let y = 0; y < H; y++) {
    for (const p of [y * W, y * W + (W - 1)]) {
      if (!visited[p]) {
        visited[p] = 1;
        bg[p] = 1;
        stack.push(p);
      }
    }
  }

  const px = (p) => [d[p * 4], d[p * 4 + 1], d[p * 4 + 2]];
  const pushIf = (p, parent) => {
    if (visited[p]) return;
    visited[p] = 1;
    const [r, g, b] = px(p);
    const [pr, pg, pb] = px(parent);
    if (dist(r, g, b, pr, pg, pb) <= stepTol) {
      bg[p] = 1;
      stack.push(p);
    }
  };
  while (stack.length) {
    const p = stack.pop();
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) pushIf(p - 1, p);
    if (x < W - 1) pushIf(p + 1, p);
    if (y > 0) pushIf(p - W, p);
    if (y < H - 1) pushIf(p + W, p);
  }

  return bg;
}

/** Paint every masked pixel `rgb` (RGB only; alpha untouched). Mutates `d`. */
export function paintColor(d, mask, rgb) {
  let painted = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue;
    d[p * 4] = rgb[0];
    d[p * 4 + 1] = rgb[1];
    d[p * 4 + 2] = rgb[2];
    painted++;
  }
  return painted;
}

/**
 * MAGENTA-TINT ENCLOSED-POCKET FILL — catches ground residue the border-connected flood
 * can never reach: a gap between limbs (crotch/inseam, armpit) that FLUX rendered as a
 * heavily blended/desaturated magenta-pink smear instead of a clean cut. It sits deep
 * inside the silhouette, walled off from every border by genuine dark ink (e.g. a crotch
 * shadow), so `computeBackgroundMask`'s flood — border-connected by construction — never
 * reaches it, and its colour is often far enough (Euclidean dist 100-150+) from #FF3CDC
 * that a plain distance-to-target test misses it too. Its one reliable signature is HUE:
 * it stays magenta-TINTED (r,b elevated over g) however desaturated, while genuine
 * pochoir ink — grey, white, or black by the style's own "two-tone" law — is neutral
 * (r≈g≈b) regardless of luminance (see TINT_THRESH calibration above).
 *
 * Two independent guards, mirroring cutout-enemies.mjs's enclosed-island pass and
 * retouch-flash-halos.mjs's ERASE_ISLANDS (same family of "safe by construction" checks):
 *   1. TOPOLOGY — operates on 4-connected components of the NOT-yet-flattened pixel set.
 *      The LARGEST such component is, by construction, the figure (dominant blob covers
 *      thousands of px; a residue pocket a few hundred at most) and is NEVER a candidate.
 *      Every remaining (non-dominant) component is a candidate regardless of size — this
 *      is the crotch pocket's whole class, not a speckle budget.
 *   2. HUE — within the candidate components, only pixels whose tint exceeds TINT_THRESH
 *      are filled; a component's neutral (ink) pixels are left alone even if the
 *      component as a whole qualifies, so a true dark ink island that happens to be
 *      non-dominant (rare, but possible on a fragmented roll) keeps its neutral pixels.
 *
 * Runs over `confirmed` (the border flood's converged "already painted TARGET_COLOR"
 * mask) and the live pixel buffer `d`. Mutates `d` AND `confirmed` (newly filled pixels
 * join the confirmed-bg set, so a caller re-running the border flood afterward — not
 * needed today, cheap insurance — sees them as already flat). Returns the count filled.
 */
export function fillTintedPockets({ W, H, d }, confirmed, rgb, { tintThresh = TINT_THRESH } = {}) {
  const N = W * H;
  const tint = (p) => {
    const r = d[p * 4];
    const g = d[p * 4 + 1];
    const b = d[p * 4 + 2];
    return Math.max(0, r - g) + Math.max(0, b - g);
  };

  // Label 4-connected components of the "not yet confirmed background" set.
  const label = new Int32Array(N).fill(-1);
  const comps = []; // { pixels: number[] }
  for (let start = 0; start < N; start++) {
    if (confirmed[start] || label[start] !== -1) continue;
    const id = comps.length;
    const pixels = [];
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      const x = p % W;
      const y = (p / W) | 0;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < W - 1 ? p + 1 : -1,
        y > 0 ? p - W : -1,
        y < H - 1 ? p + W : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || confirmed[n] || label[n] !== -1) continue;
        label[n] = id;
        stack.push(n);
      }
    }
    comps.push(pixels);
  }
  if (comps.length === 0) return 0;

  // The largest component is the figure — never a candidate, regardless of tint content
  // (protects true dark ink AND any legitimately warm/skin-toned figure detail, since
  // those are always part of the single dominant connected mass, never their own
  // component).
  let dominantIdx = 0;
  for (let i = 1; i < comps.length; i++)
    if (comps[i].length > comps[dominantIdx].length) dominantIdx = i;

  let filled = 0;
  for (let i = 0; i < comps.length; i++) {
    if (i === dominantIdx) continue;
    for (const p of comps[i]) {
      if (tint(p) < tintThresh) continue; // neutral pixel inside a candidate component — spare it
      d[p * 4] = rgb[0];
      d[p * 4 + 1] = rgb[1];
      d[p * 4 + 2] = rgb[2];
      confirmed[p] = 1;
      filled++;
    }
  }
  return filled;
}

async function flattenFile(file, { rgb, pocketFill }) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);

  // Iterate to a FIXED POINT (required for idempotency — verified NOT idempotent in a
  // single pass, see CALIBRATION). The per-step flood compares a candidate to whichever
  // neighbour's DFS stack order discovers it first; once that neighbour is repainted
  // TARGET_COLOR, a handful of genuinely borderline (~20-25 dist) pixels can newly qualify
  // on the next pass (measured: +13px on enemy_biker's 2nd pass, +0 on the 3rd). Looping
  // here until a round paints 0 NEW pixels (mirrors bridgeHip's fixed-point loop in
  // retouch-sprites.mjs) drives the retouch to convergence WITHIN this run, so a later
  // re-run starts from the converged state, recomputes the SAME mask, and repaints the
  // same pixels the same colour → byte-identical.
  const confirmed = new Uint8Array(W * H);
  let painted = 0;
  for (;;) {
    const mask = computeBackgroundMask({ W, H, d: image.data });
    let newCount = 0;
    for (let p = 0; p < mask.length; p++) if (mask[p] && !confirmed[p]) newCount++;
    if (newCount === 0) break;
    paintColor(image.data, mask, rgb);
    for (let p = 0; p < mask.length; p++) if (mask[p]) confirmed[p] = 1;
    painted += newCount;
  }

  // Enclosed-pocket fill (magenta only) — see fillTintedPockets. Runs to a fixed point:
  // filling a pocket can occasionally re-expose a fresh dominant-component boundary (rare
  // on this calibration set, cheap to loop).
  let pocketPx = 0;
  if (pocketFill) {
    for (;;) {
      const n = fillTintedPockets({ W, H, d: image.data }, confirmed, rgb);
      if (n === 0) break;
      pocketPx += n;
    }
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(
    `  flatten ${path.basename(file)} (${W}x${H}) — painted ${painted}px border-flood` +
      (pocketFill ? ` + ${pocketPx}px tinted-pocket` : ``) +
      ` (${(((painted + pocketPx) / (W * H)) * 100).toFixed(1)}%)`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find((a) => a.startsWith("--target="));
  const targetName = targetArg ? targetArg.slice("--target=".length) : "black";
  const preset = TARGET_PRESETS[targetName];
  if (!preset) {
    throw new Error(
      `--target must be one of ${Object.keys(TARGET_PRESETS).join(", ")}, got "${targetName}"`,
    );
  }
  const fileArgs = args.filter((a) => !a.startsWith("--"));
  const files =
    fileArgs.length > 0
      ? fileArgs.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync(ASSET_DIR)
          .filter((f) => /^enemy_.*\.png$/.test(f))
          .map((f) => path.join(ASSET_DIR, f));
  if (files.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  console.log(
    `target=${targetName} (#${preset.rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}) pocketFill=${preset.pocketFill}`,
  );
  for (const f of files) await flattenFile(f, { rgb: preset.rgb, pocketFill: preset.pocketFill });
  console.log("done.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[retouch-flatten-enemy-background] Fatal:", e.message);
    process.exit(1);
  });
}

/*
 * CALIBRATION TABLE — 5-file hard-case sample, fresh generation (levelArt.json seeds
 * 4801/4822/4803/4809/4804), measured this pass.
 *
 *   Corner-patch luminance (10x10 mean, PASS < 24), RAW generation:
 *     enemy_sprite    max=113.6   enemy_sprite_2  max=37.6   enemy_sprite_3  max=83.6
 *     enemy_biker     max=194.4   enemy_shooting  max=82.9        — 5/5 FAIL (as diagnosed)
 *
 *   Ring width probe (dist<=30 from a robust interior-median reference; px):
 *     enemy_biker      L=9  R=9  T=5  B=5    enemy_shooting  L=2  R=4  T=0  B=0
 *     enemy_sprite     L=7  R=7  T=5  (B blocked by feet, not ring)
 *     enemy_sprite_2   L=1  R=1  T=1  B=1    enemy_sprite_3  L=4  R=3  T=0  B=10
 *   → worst 9px, INSET_PX=14 clears every case with margin.
 *
 *   STEP_TOL sensitivity (why 20, not 60): at STEP_TOL=60 (no inset), the flood leaked
 *   through the figure's own dark ink/shading and every sample fragmented into dozens of
 *   disconnected islands (visually confirmed on a magenta composite — figures reduced to
 *   scattered fragments). At STEP_TOL=20 with the inset in place, all 5 samples stayed
 *   visually and mechanically intact (see below).
 *
 *   Corner-patch luminance AFTER this retouch (pre-key): all 5 files max=0.0 → PASS.
 *
 *   check-sprite-integrity.mjs AFTER the FULL 4-stage pipeline (this script →
 *   cutout-enemies.mjs → sweep-enemy-speckle.mjs → fill-sprite-holes.mjs):
 *     enemy_biker      dominance 97.70%  speckle 0  semi 0  → PASS
 *     enemy_shooting   dominance 98.62%  speckle 0  semi 0  → PASS
 *     enemy_sprite     dominance 98.41%  speckle 0  semi 0  → PASS
 *     enemy_sprite_2   dominance 98.52%  speckle 0  semi 0  → PASS
 *     enemy_sprite_3   dominance 99.52%  speckle 0  semi 0  → PASS
 *   Before fill-sprite-holes.mjs, dominance was as low as 71-99% (a large dark-shadow
 *   fold — legitimate pochoir ink, verified on the pre-key RGB buffer to be UNTOUCHED by
 *   this script — got eaten by cutout-enemies.mjs's own near-black thresholds once the
 *   sampled ground became literally (0,0,0); this is exactly the "grey ink ≈ grey ground"
 *   hazard the brief warns about, now manifesting one stage downstream. fill-sprite-
 *   holes.mjs's existing solidify pass is the sanctioned, already-approved remedy — see
 *   the pipeline note above — not a bespoke fix added here.
 *
 *   Visual sweep (magenta composite, real 64px game-scale downscale): all 5 silhouettes
 *   read clean and solid, no visible fringe/holes at game size. enemy_shooting.png keeps
 *   a jagged torn-coat-hem edge near the belt at 256px (verified against the RAW
 *   generation: the same torn ink shape was already there, simply invisible on the
 *   original dark-on-dark background) — a legitimate stylistic pochoir/xerox edge, not an
 *   anatomy hole (no floating/severed limb), invisible at 64px game scale; flagged as a
 *   SOFT edge-hygiene note for a future retouch-flash-halos.mjs-style pass, not a block.
 */
