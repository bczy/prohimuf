#!/usr/bin/env node
/**
 * Generate big per-level backdrop art (Style B pixel art) as separate layers
 * — sky / facade / street — for light parallax. One set of files per level.
 *
 * Prompts, sizes and the level list all come from the single manifest at
 * src/game/levels/levelArt.json (shared with the app), so adding a level is a
 * one-place change. Images come from the pollinations.ai text-to-image
 * endpoint (same pipeline as the other asset scripts).
 *
 * By default only missing files are generated, so reruns are stable. Pass
 * --force (or FORCE=1) to regenerate everything.
 *
 * Output: public/assets/levels/<id>/{sky,facade,street}.png
 *
 * node scripts/gen-level-art.mjs --list          # list level ids + their layer files (no network)
 * node scripts/gen-level-art.mjs --asset <id>    # restrict the run to one level id
 * node scripts/gen-level-art.mjs --paths         # print the exact relative file paths THIS run
 *                                                 # would write (LAYERS ∩ each level's authored
 *                                                 # `prompts` keys), one per line, no network.
 *                                                 # Machine-readable single source of truth for
 *                                                 # gen-level-art.yml's regenerate=true path, which
 *                                                 # scopes its purge to exactly this set instead of
 *                                                 # `rm -rf`-ing the whole tree (stage-6 triage E1 —
 *                                                 # a blanket purge used to also delete files this
 *                                                 # script has never produced and never will, e.g.
 *                                                 # belliard's hand-authored troncon-*.png/ground.png).
 */
import fs from "fs";
import path from "path";
import { fluxUrl, fetchWithRetry } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";
import { parseAssetArgs } from "./lib/cli.mjs";

const ROOT = process.cwd();
const OUT_ROOT = path.resolve(ROOT, "public/assets/levels");
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");

const ARGV = process.argv.slice(2);
const FORCE = ARGV.includes("--force") || process.env.FORCE === "1";
// The decor repeats ONE facade image across all panels (so the window-zone grid
// lines up everywhere), so only a single facade layer is generated per level.
const LAYERS = ["sky", "facade", "street", "foreground"];

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const { style, sizes, levels } = manifest;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pollinations/FLUX fetch (URL build + retry) now shared via
// scripts/lib/pollinations.mjs. private=true keeps the backdrops out of the
// public Pollinations feed; enhance=false is load-bearing (art bible §3.11) —
// the enhancer's LLM rewrite destroys the verbatim style block; safe=false
// pins the NSFW filter off so the house register is never silently rejected
// if the server default flips (all baked into fluxUrl).
function generate(prompt, size) {
  const seed = Math.floor(Math.random() * 99999);
  return fetchWithRetry(fluxUrl(prompt + ", " + style, seed, size.width, size.height));
}

// ── Enforce the declared pixel size (pipeline bug found in the niveau-final
// batch, dev-tooling-assets 2026-07-21) ──────────────────────────────────────
// Diagnosis: this was NOT a niveau-final-specific size-config leak — the
// `?width=&height=` query IS built correctly from `sizes[baseLayer]` above for
// every level (confirmed: niveau-final reads the exact same shared
// `sizes.facade`/`sizes.foreground` object every other level does, no default
// leaked). The drift is upstream: Pollinations' `flux` model silently returns
// a SMALLER resolution than requested regardless of the query params —
// measured on every already-committed level PNG (belliard/stalingrad/vitry
// facade/foreground, not just niveau-final's): every one of them decodes to
// 991x594, never the declared 1280x768 (aspect preserved, ~0.77x linear
// scale-down — consistent with an upstream max-pixel-area cap around
// 768x768's ~590K px). This was invisible until now because nothing in the
// pipeline (nor e2e-assets.mjs's byte-size floor) ever checked actual decoded
// pixel dimensions against the manifest. Fix: resize the fetched buffer to
// EXACTLY the requested size before writing, so the committed PNG's real
// pixel dimensions always match `sizes[baseLayer]` (levelArt.ts's
// FACADE_ASPECT and the render's plane sizing both derive world-space
// geometry from the DECLARED size, not the file's own dimensions — a
// mismatch is a silent, if usually tiny, stretch).
//
// Best-effort: @napi-rs/canvas is a devDependency, but network generation only
// ever runs where the workflow installs it first (gen-level-art.yml installs
// it before this step); if it's unavailable for any reason, fall back to
// writing the raw buffer unresized rather than crashing — matches the
// project's "generate only, never hard-fail locally" convention (mirrors the
// try/catch detours in gen-hostage-sprites.mjs / gen-boss-sprites.mjs).
async function normalizeSize(buf, size) {
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const img = await loadImage(buf);
    if (img.width === size.width && img.height === size.height) return buf;
    console.log(
      `  [resize] ${img.width}x${img.height} → ${size.width}x${size.height} ` +
        `(Pollinations returned a different resolution than requested)`,
    );
    const canvas = createCanvas(size.width, size.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size.width, size.height);
    return canvas.toBuffer("image/png");
  } catch (e) {
    console.log(`  [resize-skip] ${e.message} (runs in CI)`);
    return buf;
  }
}

async function main() {
  const { list, target } = parseAssetArgs(ARGV);

  if (list) {
    console.log("Defined levels (from levelArt.json):");
    for (const level of levels) {
      console.log(
        `  ${level.id.padEnd(12)} → ${LAYERS.map((l) => `${level.id}/${l}.png`).join(", ")}`,
      );
    }
    return;
  }

  const todo = target ? levels.filter((l) => l.id === target) : levels;
  if (target && todo.length === 0) {
    console.error(`Level "${target}" not found. Use --list.`);
    process.exit(1);
  }

  if (ARGV.includes("--paths")) {
    // Same LAYERS ∩ prompts-present gate the generation loop below uses, so
    // this can never drift from what the generator actually writes. Plain
    // relative paths, one per line — nothing else on stdout — so a caller can
    // consume it directly (e.g. `while IFS= read -r f; do ...; done`).
    for (const level of todo) {
      for (const layer of LAYERS) {
        if (level.prompts[layer] !== undefined) {
          console.log(path.posix.join("public/assets/levels", level.id, `${layer}.png`));
        }
      }
    }
    return;
  }

  console.log(`Generating level art → ${OUT_ROOT}${FORCE ? " (force)" : ""}\n`);
  for (const level of todo) {
    const dir = path.join(OUT_ROOT, level.id);
    fs.mkdirSync(dir, { recursive: true });
    for (const layer of LAYERS) {
      const file = path.join(dir, `${layer}.png`);
      if (skip(file, { force: FORCE, existsSync: fs.existsSync })) {
        console.log(`  [skip] ${level.id}/${layer}.png (exists)`);
        continue;
      }
      const baseLayer = layer.startsWith("facade_") ? "facade" : layer;
      // Interior venues (e.g. niveau-final's l'Éden hall) legitimately drop
      // sky/street — there is no exterior for them to depict (lead-art PROMPT
      // GATE, "layer set with sky/street DROPPED for the interior"). Skip
      // cleanly rather than sending FLUX a broken "${undefined}, ..." prompt.
      if (level.prompts[baseLayer] === undefined) {
        console.log(`  [skip] ${level.id}/${layer}.png (no prompts.${baseLayer} — layer dropped)`);
        continue;
      }
      console.log(`  [gen]  ${level.id}/${layer}.png`);
      try {
        // All facade panels are sections of ONE continuous terrace so they abut
        // seamlessly: force level/aligned floor lines + cornice and a flat,
        // straight-on elevation. Different seeds keep each panel distinct.
        const continuity =
          ", one section of a single long continuous parisian haussmann terrace," +
          " every horizontal floor line, balcony row and the top roof cornice perfectly level" +
          " and aligned straight across, flat front elevation seen perfectly straight on, no" +
          " perspective, the left and right edges continue seamlessly into the neighbouring buildings";
        const suffix = baseLayer === "facade" ? continuity : "";
        const prompt = `${level.prompts[baseLayer]}${suffix}, ${level.label}`;
        const raw = await generate(prompt, sizes[baseLayer]);
        const buf = await normalizeSize(raw, sizes[baseLayer]);
        fs.writeFileSync(file, buf);
        console.log(`  [ok]   ${level.id}/${layer}.png (${buf.length} bytes)`);
      } catch (e) {
        console.log(`  [fail] ${level.id}/${layer}.png — ${e.message}`);
      }
      await sleep(2000);
    }
  }
  console.log("\ndone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
