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
      console.log(`  [gen]  ${level.id}/${layer}.png`);
      try {
        const baseLayer = layer.startsWith("facade_") ? "facade" : layer;
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
        const buf = await generate(prompt, sizes[baseLayer]);
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
