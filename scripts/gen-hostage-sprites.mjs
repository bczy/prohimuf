#!/usr/bin/env node
/**
 * Generate the QTE hostage figures (ADR-0030) — today the single `girl`, the
 * cartel boss's daughter the captor holds in front of him. House style: same
 * black-ground pixel-sprite recipe as the enemies set, generated on a flat
 * matte black (#000000) then chroma-keyed to transparency with the shared
 * corner-adaptive edge flood-fill (cutout-enemies.mjs).
 *
 * Single source of truth: the `hostages` block of
 * src/game/levels/levelArt.json (prompt, seed, size, output path). Add or tune
 * a figure THERE, never in this script. The block deliberately lives BESIDE
 * `enemies`: its keys must not enter the ARCHETYPES-derived enemies.types
 * register (levelArt.consistency gate), because the hostage is not a shootable
 * window archetype — she is the QTE's protected figure.
 *
 * Naming contract (renderer aligns on this):
 *   public/assets/hostage/<key>.png   (loaded by src/render/scene/hostageTextures.ts)
 * The hostage/ subdirectory keeps these files OUT of the enemy_ batch globs
 * (cutout/solidify walk public/assets/enemy_*.png only).
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to
 * regenerate. Network image generation (Pollinations/FLUX) is blocked in the
 * local sandbox, so this normally runs in CI
 * (.github/workflows/gen-hostage-sprites.yml).
 *
 * Usage:
 *   node scripts/gen-hostage-sprites.mjs               # generate missing (network FLUX)
 *   FORCE=1 node scripts/gen-hostage-sprites.mjs       # regenerate all  [CI]
 *   node scripts/gen-hostage-sprites.mjs --asset girl  # one figure only
 *   node scripts/gen-hostage-sprites.mjs --list        # list defined figures
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fluxUrl, fetchWithRetry } from "./lib/pollinations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Supplemental in-script families (temporary render-lane bridge) ───────────
// The ACCOMPLICE — the second armed figure in the peak-difficulty QTE (F4 /
// ADR-0036, dev-r3f-render lane) — needs its own sprite family so a CI art run
// can generate it. Its dedicated art BELONGS in the `hostages` block of
// levelArt.json beside `girl` (the single source of truth), but that file is
// owned by the dev-tooling-assets lane and this render-lane change cannot edit
// it. So the family is defined HERE as a TEMPORARY bridge until dev-tooling-
// assets promotes it into levelArt.json hostages.types (this list then goes
// away — a key already present in levelArt.json wins and the in-script copy is
// skipped, so there is never a duplicate). Two poses mirror the enemy
// idle/shooting split the renderer falls back on (accompliceTextures.ts): a
// gun-lowered IDLE and a gun-raised AIM. Prompts are PLACEHOLDERS pending the
// narrative-designer's answer to "who is the second armed figure in Vitry".
const SUPPLEMENTAL_FAMILIES = {
  accomplice: {
    asset: "assets/hostage/accomplice.png",
    seed: 5127,
    prompt:
      "a menacing armed man standing guard, long dark coat over a dark turtleneck, shaved head, a pistol held down at his side pointed at the floor, cold watchful stance, facing forward",
  },
  accomplice_aim: {
    asset: "assets/hostage/accomplice_aim.png",
    seed: 5128,
    prompt:
      "a menacing armed man raising a pistol to aim straight ahead at the viewer, arm extended, long dark coat over a dark turtleneck, shaved head, muzzle raised, tense firing stance, facing forward",
  },
};

// ── Load the hostage definitions from levelArt.json (single source) ──────────
function loadHostages() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.hostages;
  if (!block || !block.types) {
    throw new Error(`No "hostages.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const styleSuffix = block.style ?? "";
  const width = block.size?.width ?? 256;
  const height = block.size?.height ?? 256;
  const toFamily = (key, def, source) => {
    if (!Number.isInteger(def.seed) || def.seed <= 0) {
      throw new Error(`${source}.${key}: "seed" must be a positive integer (pinned rolls)`);
    }
    if (typeof def.asset !== "string" || def.asset.trim() === "") {
      throw new Error(`${source}.${key}: "asset" must be a non-empty path`);
    }
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
  };
  const fromLevelArt = Object.entries(block.types).map(([key, def]) =>
    toFamily(key, def, "hostages.types"),
  );
  // Append the supplemental families whose key levelArt.json does NOT already
  // define (once promoted there, the in-script copy drops out — no duplicate).
  const known = new Set(Object.keys(block.types));
  const supplemental = Object.entries(SUPPLEMENTAL_FAMILIES)
    .filter(([key]) => !known.has(key))
    .map(([key, def]) => toFamily(key, def, "supplemental"));
  return [...fromLevelArt, ...supplemental];
}

// ── Pollinations / FLUX fetch now shared via scripts/lib/pollinations.mjs ────
function generate(h) {
  console.log(`  [seed] ${h.key} seed=${h.seed} (pinned)`);
  return fetchWithRetry(fluxUrl(h.prompt, h.seed, h.width, h.height));
}

// ── Reuse the enemy edge flood-fill detour (black-ground key) ─────────────────
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
// figure; the integrity gate's SPECKLE BUDGET (≤ 4 comps < 12px) rejects them.
// Sweep every non-dominant sub-speckle component after the cutout so the figure
// ships clean — same scripted-retouch idiom as the courier spokes.
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
  const hostages = loadHostages();

  if (args.includes("--list")) {
    for (const h of hostages) {
      console.log(`${h.key.padEnd(8)} seed=${h.seed}  ${path.relative(ROOT, h.outFile)}`);
    }
    return;
  }

  const assetIdx = args.indexOf("--asset");
  const only = assetIdx !== -1 ? args[assetIdx + 1] : null;
  const targets = only ? hostages.filter((h) => h.key === only) : hostages;
  if (targets.length === 0) {
    throw new Error(`Unknown hostage key "${only}" (see --list)`);
  }

  for (const h of targets) {
    if (!FORCE && fs.existsSync(h.outFile)) {
      console.log(`[skip] ${h.key} — ${path.relative(ROOT, h.outFile)} exists (FORCE=1 to redo)`);
      continue;
    }
    console.log(`[gen ] ${h.key} ${h.width}x${h.height}`);
    const buf = await generate(h);
    fs.mkdirSync(path.dirname(h.outFile), { recursive: true });
    fs.writeFileSync(h.outFile, buf);
    console.log(`  [ok ] wrote ${path.relative(ROOT, h.outFile)} (${buf.length} bytes)`);
    await tryCutout(h.outFile, h.key);
    await tryDespeckle(h.outFile, h.key);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
