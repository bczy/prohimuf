#!/usr/bin/env node
/**
 * Generate the Rue Belliard **foreground** (and, if ever needed, sky) layer as
 * FLUX text-to-image — the overlay families whose composition is fine as a
 * framed subject on a keyable ground.
 *
 * TRONÇONS ARE NOT GENERATED HERE. Their COMPOSITION (self-contained buildings
 * that end naturally with transparent sky margins, never cut at the frame edge)
 * is right in the committed img2img art and a FLUX text-to-image regen loses it
 * (the model fills the frame edge to edge). The tronçons' only flaw was colour,
 * fixed by scripts/desat-troncons.mjs (keep the img2img framing, strip colour).
 * See docs/art-direction/prompt-drafts/level-belliard-decor-v3.md §0.
 *
 * WHY NOT gen-level-art.mjs: its manifest `style` tail is colour pixel-art and
 * would re-introduce colour. This script appends NO style tail, `enhance=false`,
 * pinned seeds. Prompts come from the manifest (belliard.prompts), already gated.
 *
 * Lot: foreground (magenta chroma-key ground → cut by cutout-foreground.mjs).
 * sky is the owner's separate task; ground.png (v6) and street.png are kept.
 *
 *   node scripts/gen-belliard-decor.mjs --dry-run
 *   FORCE=1 node scripts/gen-belliard-decor.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fluxUrl, fetchWithRetry, sleep } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, "public/assets/levels/belliard");
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");
const LEVEL_ID = "belliard";

const FOREGROUND_SEED = 7130;

/**
 * Pure planner: turn the manifest into the concrete generation plan (no network,
 * no fs writes). Exported for the unit test.
 * @returns {{file:string, prompt:string, seed:number, width:number, height:number}[]}
 */
export function planBelliardAssets(manifest) {
  const level = (manifest.levels ?? []).find((l) => l.id === LEVEL_ID);
  if (!level) throw new Error(`level "${LEVEL_ID}" not found in manifest`);
  const sizes = manifest.sizes ?? {};
  return [
    {
      file: "foreground.png",
      prompt: level.prompts.foreground,
      seed: FOREGROUND_SEED,
      width: sizes.foreground.width,
      height: sizes.foreground.height,
    },
  ];
}

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force") || process.env.FORCE === "1";
  const dryRun = argv.includes("--dry-run") || argv.includes("--list");

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const plan = planBelliardAssets(manifest);

  if (dryRun) {
    console.log("Belliard décor generated lot (FLUX text-to-image, no style tail):\n");
    for (const a of plan) {
      console.log(
        `  ${a.file.padEnd(16)} seed=${a.seed}  ${a.width}x${a.height}  ${a.prompt.trim().split(/\s+/).length} words`,
      );
    }
    console.log("\n  tronçons: NOT here — img2img framing + scripts/desat-troncons.mjs.");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating Belliard décor → ${OUT_DIR}${force ? " (force)" : ""}\n`);
  for (const a of plan) {
    const out = path.join(OUT_DIR, a.file);
    if (skip(out, { force, existsSync: fs.existsSync })) {
      console.log(`  [skip] ${a.file} (exists)`);
      continue;
    }
    console.log(`  [gen]  ${a.file} (seed ${a.seed}, ${a.width}x${a.height})`);
    try {
      const buf = await fetchWithRetry(fluxUrl(a.prompt, a.seed, a.width, a.height));
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   ${a.file} (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] ${a.file} — ${e.message}`);
    }
    await sleep(2000);
  }
  console.log("\ndone.");
}

// Run only when invoked directly, so the test can import the pure planner.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
