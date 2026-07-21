#!/usr/bin/env node
/**
 * Generate the QTE boss ("le Commandant") figure + hall-prop sprites (ADR-0051
 * boss encounter system, ADR-0052 differentiation levers, ADR-0053 niveau-final
 * live-ship). Nine entries: 7 commander poses (square 256x256) + the two
 * Niveau-Final hall props — `lustre` (portrait 320x512) and `speaker_wall`
 * (landscape 512x320), per-type `size` overrides ([S13]). Same black-ground
 * pixel-sprite recipe as the enemies/hostages sets, generated on a flat matte
 * black (#000000) then chroma-keyed to transparency with the shared
 * corner-adaptive edge flood-fill (cutout-enemies.mjs).
 *
 * Single source of truth: the `boss` block of src/game/levels/levelArt.json
 * (prompt, seed, per-entry `size` override, `asset` path). Add or tune a
 * figure/prop THERE, never in this script. The block deliberately lives BESIDE
 * `enemies`, same as `hostages` (ADR-0030): its keys must not enter the
 * ARCHETYPES-derived enemies.types register (levelArt.consistency gate) — the
 * Commandant is a plein-pied QTE-only figure, never a shootable window
 * archetype.
 *
 * Naming contract: public/assets/boss/<key>.png (mirrors the hostage/<key>.png
 * convention). Zero render consumer exists today (ADR-0053 D6 — render
 * integration is a deferred follow-up pass); this script only needs to produce
 * the files at the paths the manifest declares.
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to
 * regenerate. Network image generation (Pollinations/FLUX) is blocked in the
 * local sandbox, so this normally runs in CI
 * (.github/workflows/gen-boss-sprites.yml).
 *
 * Usage:
 *   node scripts/gen-boss-sprites.mjs                             # generate missing (network FLUX)
 *   FORCE=1 node scripts/gen-boss-sprites.mjs                     # regenerate all  [CI]
 *   node scripts/gen-boss-sprites.mjs --asset commander_shielded  # one figure only
 *   node scripts/gen-boss-sprites.mjs --list                      # list defined figures
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fluxUrl, fetchWithRetry } from "./lib/pollinations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Load the boss definitions from levelArt.json (single source) ────────────
function loadBossFigures() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.boss;
  if (!block || !block.types) {
    throw new Error(`No "boss.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const styleSuffix = block.style ?? "";
  const blockWidth = block.size?.width ?? 256;
  const blockHeight = block.size?.height ?? 256;
  return Object.entries(block.types).map(([key, def]) => {
    if (!Number.isInteger(def.seed) || def.seed <= 0) {
      throw new Error(`boss.types.${key}: "seed" must be a positive integer (pinned rolls)`);
    }
    if (typeof def.asset !== "string" || def.asset.trim() === "") {
      throw new Error(`boss.types.${key}: "asset" must be a non-empty path`);
    }
    // Per-entry `size` override ([S13], nearForegroundArt.types precedent): the
    // 7 humanoid figures share the block-default square canvas; `lustre`
    // (portrait) and `speaker_wall` (landscape) each carry their own
    // natural-aspect size.
    const width = def.size?.width ?? blockWidth;
    const height = def.size?.height ?? blockHeight;
    return {
      key,
      // Prompt assembly contract (docs/art-direction.md): subject/silhouette
      // first, then the shared style tail verbatim for family consistency.
      prompt: `${def.prompt}${styleSuffix}`,
      width,
      height,
      seed: def.seed,
      outFile: path.resolve(ROOT, "public", def.asset),
    };
  });
}

// ── Pollinations / FLUX fetch now shared via scripts/lib/pollinations.mjs ────
function generate(fig) {
  console.log(`  [seed] ${fig.key} seed=${fig.seed} (pinned)`);
  return fetchWithRetry(fluxUrl(fig.prompt, fig.seed, fig.width, fig.height));
}

// ── Reuse the enemy edge flood-fill detour (black-ground key) ────────────────
async function tryCutout(file, key) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    console.log(`  [cutout-skip] ${key} — ${e.message} (chroma-key runs in CI)`);
  }
}

// ── Deterministic despeckle (shared sweep from retouch-sprites.mjs) ───────────
// The black-ground key leaves a handful of tiny opaque debris islands around the
// figure/prop; the integrity gate's SPECKLE BUDGET (≤ 4 comps < 12px) rejects
// them. Sweep every non-dominant sub-speckle component after the cutout so each
// entry ships clean — same scripted-retouch idiom as gen-hostage-sprites.mjs.
async function tryDespeckle(file, key) {
  try {
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
    console.log(`  [despeckle] ${key} — removed ${removedComps} comp / ${removedPx}px`);
  } catch (e) {
    console.log(`  [despeckle-skip] ${key} — ${e.message} (runs in CI)`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const figures = loadBossFigures();

  if (args.includes("--list")) {
    for (const f of figures) {
      console.log(
        `${f.key.padEnd(24)} ${String(f.width).padStart(4)}x${f.height}  seed=${f.seed}  ${path.relative(ROOT, f.outFile)}`,
      );
    }
    return;
  }

  const assetIdx = args.indexOf("--asset");
  const only = assetIdx !== -1 ? args[assetIdx + 1] : null;
  const targets = only ? figures.filter((f) => f.key === only) : figures;
  if (targets.length === 0) {
    throw new Error(`Unknown boss key "${only}" (see --list)`);
  }

  for (const f of targets) {
    if (!FORCE && fs.existsSync(f.outFile)) {
      console.log(`[skip] ${f.key} — ${path.relative(ROOT, f.outFile)} exists (FORCE=1 to redo)`);
      continue;
    }
    console.log(`[gen ] ${f.key} ${f.width}x${f.height}`);
    const buf = await generate(f);
    fs.mkdirSync(path.dirname(f.outFile), { recursive: true });
    fs.writeFileSync(f.outFile, buf);
    console.log(`  [ok ] wrote ${path.relative(ROOT, f.outFile)} (${buf.length} bytes)`);
    await tryCutout(f.outFile, f.key);
    await tryDespeckle(f.outFile, f.key);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
