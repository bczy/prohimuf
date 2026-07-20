#!/usr/bin/env node
/**
 * Generate the LOOT crate sprite (story-loot-crate-sidewalk, ADR-0056) — the
 * street-level wooden crate that replaces `LootCrate.tsx`'s code-drawn
 * placeholder when the generated PNG is present (ADR-0049 generated-with-
 * procedural-fallback idiom: a missing/404 asset keeps the drawn box, this
 * script never needs to produce a placeholder itself).
 *
 * House style: SAME printing run as `vehicles` (photocopied fanzine B&W,
 * `loot.opening`/`loot.style` are byte-identical to `vehicles.opening`/
 * `vehicles.style` — see levelArt.json `loot.$comment`) — generated on a flat
 * SATURATED CHROMA-KEY ground (magenta #FF3CDC) and keyed to transparency with
 * the same corner-adaptive edge flood-fill `cutout-enemies.mjs` uses for
 * vehicles (ground-adaptive: it already handles a magenta ground, no change
 * needed there), then desaturated with the SAME Rec.601 luma pass
 * `gen-vehicle-sprites.mjs` uses to kill the magenta ground-cast bled into the
 * monochrome interior (reused here, not duplicated).
 *
 * Single source of truth: the `loot` block of src/game/levels/levelArt.json
 * (opening/style/per-type prompt/seed/size/asset). Add or tune a crate type
 * THERE, never here — this script only assembles + fetches + keys.
 *
 * Naming contract (renderer aligns on this, ADR-0056 D5):
 *   public/assets/loot/crate.png   (loaded by LootCrate.tsx via `levelArt.loot`)
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to
 * regenerate. Network image generation (Pollinations/FLUX) is usually blocked
 * in the local sandbox, so this normally runs in CI
 * (.github/workflows/gen-loot-sprites.yml).
 *
 * Usage:
 *   node scripts/gen-loot-sprites.mjs               # generate missing (network FLUX)
 *   FORCE=1 node scripts/gen-loot-sprites.mjs        # regenerate all (network FLUX)  [CI]
 *   node scripts/gen-loot-sprites.mjs --asset crate  # one type only
 *   node scripts/gen-loot-sprites.mjs --list         # list defined loot types
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { fluxUrl, fetchWithRetry, sleep } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";
import { parseAssetArgs } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, process.env.LEVEL_ART ?? "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Load the loot definitions from levelArt.json (single source) ────────────
// Prompt assembly (identical contract to vehicles): `opening` (medium + view,
// front-loaded) + per-type `prompt` (subject/silhouette only) + the shared
// `style` chroma-key tail. `neonPhrase` stays empty (ADR 0011 analogue — the
// rim is drawn render-side, see levelArt.json `loot.$comment`); the per-type
// `neon` field is render metadata only and is never concatenated in.
export function loadLoot() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.loot;
  if (!block || !block.types) {
    throw new Error(`No "loot.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const opening = block.opening ?? "";
  const styleSuffix = block.style ?? "";
  return Object.entries(block.types).map(([type, def]) => {
    if (typeof def.asset !== "string" || def.asset.trim() === "") {
      throw new Error(`loot.types.${type}: "asset" must be a non-empty path`);
    }
    return {
      type,
      prompt: `${opening}${def.prompt ?? ""}${styleSuffix}`,
      width: def.size?.width ?? 256,
      height: def.size?.height ?? 192,
      // Pinned seed → reproducible rolls, reviewable diffs (REROLL=1 ignores it).
      seed: Number.isInteger(def.seed) && process.env.REROLL !== "1" ? def.seed : null,
      outFile: path.resolve(ROOT, "public", def.asset),
    };
  });
}

function generate(l) {
  const seed = l.seed ?? Math.floor(Math.random() * 99999);
  console.log(`  [seed] ${l.type} seed=${seed}${l.seed != null ? " (pinned)" : ""}`);
  return fetchWithRetry(fluxUrl(l.prompt, seed, l.width, l.height));
}

// ── Reuse the vehicle-set detours instead of duplicating them ───────────────
// cutout-enemies.mjs's flood-fill samples the ground colour from the corners
// (ground-adaptive), so it keys the loot magenta ground exactly as it already
// does for the vehicle set — no loot-specific branch needed.
async function tryCutout(file, type) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    console.log(`  [cutout-skip] ${type} — ${e.message} (chroma-key runs in CI)`);
  }
}

// Kills the magenta ground-cast bled into the monochrome interior — the exact
// pass gen-vehicle-sprites.mjs runs after its own cutout, reused (not copied)
// because the loot family is generated on the same chroma-key ground.
async function tryDesaturate(file, type) {
  try {
    const { desaturateFile } = await import("./gen-vehicle-sprites.mjs");
    const n = await desaturateFile(file);
    console.log(`  [gray] ${type} — desaturated ${n} px (Rec.601 luma)`);
  } catch (e) {
    console.log(`  [gray-skip] ${type} — ${e.message} (grayscale runs in CI)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const loot = loadLoot();
  const { list, target } = parseAssetArgs(args);

  if (list) {
    console.log("Defined loot types (from levelArt.json):");
    loot.forEach((l) =>
      console.log(
        `  ${l.type.padEnd(6)} ${l.width}x${l.height}  → ${path.relative(ROOT, l.outFile)}`,
      ),
    );
    return;
  }

  const todo = target ? loot.filter((l) => l.type === target) : loot;
  if (target && todo.length === 0) {
    console.error(`Loot type "${target}" not found. Use --list.`);
    process.exit(1);
  }

  console.log(`Loot sprites → public/assets/loot\n`);

  for (const l of todo) {
    if (skip(l.outFile, { force: FORCE, existsSync: fs.existsSync })) {
      console.log(`  [skip] ${l.type} (exists)`);
      continue;
    }

    console.log(`  [gen]  ${l.type}`);
    try {
      const buf = await generate(l);
      fs.mkdirSync(path.dirname(l.outFile), { recursive: true });
      fs.writeFileSync(l.outFile, buf);
      console.log(`  [ok]   ${l.type} (${buf.length} bytes) — keying background`);
      await tryCutout(l.outFile, l.type);
      await tryDesaturate(l.outFile, l.type);
    } catch (e) {
      console.log(`  [fail] ${l.type} — ${e.message} (will be generated in CI)`);
    }
    await sleep(2000);
  }

  console.log("\nDone.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
