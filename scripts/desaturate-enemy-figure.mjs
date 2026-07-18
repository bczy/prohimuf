#!/usr/bin/env node
/**
 * FULL-FIGURE DESATURATION — post-key, post-despill final pass for the `enemies` pochoir
 * set on the magenta (#FF3CDC) chroma ground (2026-07-18 black→magenta migration,
 * docs/handoffs/story-enemy-chroma-migration.md).
 *
 * ── The defect this closes ────────────────────────────────────────────────────────────
 * despill-enemy-fringe.mjs suppresses magenta spill in a BFS band around the alpha edge —
 * bounded geometry, surgical by design. But the checkpoint sweep (magenta chroma
 * migration, re-check 2026-07-18) found FLUX also bleeds magenta INTERNALLY: franc pixels
 * measuring near (233,83,144) sitting deep inside the jacket ink, several px clear of any
 * transparent neighbour (worst on enemy_sprite frame 1, seed 4801) — true generation
 * contamination, not edge spill, so the edge-band despill structurally cannot reach it.
 *
 * ── Why full-figure desaturation is SAFE here (and would NOT be on another family) ────
 * Bertrand's call (2026-07-18): the `enemies` pochoir family is B&W BY DEFINITION — the
 * gated style prompt itself says "the figure inked paper-white, pale grey and black" and
 * the runtime engine applies its own per-archetype tint + neon rim on top (see
 * src/render/scene — the sprite ships neutral on purpose). So there is NO legitimate
 * chromatic pixel anywhere on an opaque figure pixel in this family: every non-neutral
 * pixel IS contamination, edge or interior, and can be flattened to luma without risking
 * real content. This reasoning is family-specific — do NOT reuse this script on a family
 * whose prompt bakes in real colour (e.g. `enemy_bonus`'s deliberate golden glow, EXCLUDED
 * below by name; any future colour-coded archetype).
 *
 * ── The fix: per-pixel luma flatten, alpha untouched ──────────────────────────────────
 * Every pixel with alpha > 0 (opaque AND partially-transparent edge/AA pixels — a
 * semi-transparent pixel can carry the same magenta tint blended into its edge, and the
 * anti-aliased rim is exactly where spill concentrates) gets R=G=B=luma via the same
 * Rec.601 weights already used elsewhere in this pipeline (cutout-enemies.mjs's
 * groundLum, retouch-flatten-enemy-background.mjs family) for consistency across scripts.
 * This is a strict superset of despill-enemy-fringe.mjs's edge-band clamp — despill only
 * trims the EXCESS over g within a bounded band; this flattens every channel to luma
 * everywhere alpha>0. Keep despill in the pipeline anyway (cheap, harmless, and still the
 * mechanism of record for a future non-B&W family) — this stage supersedes its RESULT on
 * `enemies`, not its role in the pipeline.
 *
 * Idempotent: r=g=b=luma has zero further tint by construction, so a re-run recomputes the
 * same luma (integer round of a fixed input) and writes the same bytes.
 *
 * ── Exclusion ──────────────────────────────────────────────────────────────────────────
 * `enemy_bonus.png` (and any future enemy_bonus_f<N>.png frame) is the deliberate glowing
 * golden non-hostile bonus figure — EXCLUDED by filename, never touched by this script.
 *
 * Pipeline position (6th and last stage, after despill):
 *   1. retouch-flatten-enemy-background.mjs --target=magenta
 *   2. cutout-enemies.mjs
 *   3. sweep-enemy-speckle.mjs
 *   4. fill-sprite-holes.mjs
 *   5. despill-enemy-fringe.mjs
 *   6. desaturate-enemy-figure.mjs             (this script)
 *
 * Requires @napi-rs/canvas (same install as every sibling script):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/desaturate-enemy-figure.mjs                # every enemy_*.png except enemy_bonus*
 *   node scripts/desaturate-enemy-figure.mjs a.png b.png     # explicit files (still exclusion-checked)
 *   node scripts/desaturate-enemy-figure.mjs --check         # detect-only, exit 1 if any px would change
 *   ASSET_DIR=… node scripts/desaturate-enemy-figure.mjs     # override target dir
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

// Deliberate-colour exception: the golden bonus figure (and any future colour-coded
// archetype added the same way) is never a candidate, batch OR explicit-file mode.
const EXCLUDE_RE = /^enemy_bonus(_f\d+)?\.png$/;

/**
 * Flatten every alpha>0 pixel to R=G=B=luma (Rec.601: 0.3R + 0.59G + 0.11B, rounded),
 * matching the luma weights already used elsewhere in this pipeline. Pure — does not
 * mutate `d` directly; call `applyDesaturation` to write. Returns the count of pixels
 * that would actually change (already-neutral pixels are skipped).
 */
export function desaturateFigure({ W, H, d }) {
  const N = W * H;
  let changed = 0;
  for (let p = 0; p < N; p++) {
    const o = p * 4;
    if (d[o + 3] === 0) continue; // fully transparent — never touched
    const r = d[o];
    const g = d[o + 1];
    const b = d[o + 2];
    if (r === g && g === b) continue; // already neutral
    const luma = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
    d[o] = luma;
    d[o + 1] = luma;
    d[o + 2] = luma;
    changed++;
  }
  return changed;
}

async function desaturateFile(file, { checkOnly }) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const before = Uint8Array.from(d);

  const changed = desaturateFigure({ W, H, d });

  if (checkOnly) {
    console.log(`  ${String(changed).padStart(6)}  ${path.basename(file)}`);
    return changed;
  }
  if (changed === 0) {
    console.log(`[ok ] ${path.basename(file)} — already neutral (${W}x${H})`);
    return 0;
  }

  // Self-check: alpha never changes; every alpha>0 pixel ends up r=g=b.
  let violations = 0;
  for (let p = 0; p < W * H; p++) {
    const o = p * 4;
    if (d[o + 3] !== before[o + 3]) {
      violations++;
      continue;
    }
    if (d[o + 3] > 0 && (d[o] !== d[o + 1] || d[o + 1] !== d[o + 2])) violations++;
  }
  if (violations > 0) {
    console.error(
      `Fatal: ${path.basename(file)} — ${violations} surgical violation(s); NOT writing.`,
    );
    process.exit(1);
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(
    `[fix] ${path.basename(file)} — desaturated ${changed}px (${((changed / (W * H)) * 100).toFixed(1)}%), self-check clean`,
  );
  return changed;
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes("--check");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const allFiles =
    fileArgs.length > 0
      ? fileArgs.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync(ASSET_DIR)
          .filter((f) => /^enemy_.*\.png$/.test(f))
          .map((f) => path.join(ASSET_DIR, f));
  if (allFiles.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  const files = [];
  for (const f of allFiles) {
    if (EXCLUDE_RE.test(path.basename(f))) {
      console.log(`  skip ${path.basename(f)} — excluded (deliberate colour, e.g. enemy_bonus)`);
      continue;
    }
    files.push(f);
  }
  if (checkOnly) console.log("WOULD-DESATURATE (px)");
  let dirty = false;
  let total = 0;
  for (const f of files) {
    const n = await desaturateFile(f, { checkOnly });
    total += n;
    if (n > 0) dirty = true;
  }
  if (checkOnly) {
    console.log(`  ${String(total).padStart(6)}  TOTAL`);
    if (dirty) {
      console.error("\n[--check] non-neutral pixels present on the enemies set — FAIL");
      process.exit(1);
    }
    console.log("\n[--check] every eligible sprite already neutral — PASS");
  } else {
    console.log("done.");
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[desaturate-enemy-figure] Fatal:", e.message);
    process.exit(1);
  });
}
