#!/usr/bin/env node
/**
 * COPYABLE SKELETON — not an executable meta-harness (ADR-0007 D1/D3).
 *
 * This file is never imported and never run. A human copies it to
 * scripts/gen-<thing>.mjs, deletes this header, and fills in the blanks —
 * see "Anatomy of a harness" in scripts/SCRIPTS.md for the checklist this
 * mirrors. It exists so the next asset-generator author starts from the
 * shared primitives instead of re-deriving (or re-copy-pasting) them.
 *
 * DO NOT turn this into a generator that emits scripts from a descriptor —
 * that re-opens the meta-harness question ADR-0007 already rejected.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sleep, fetchWithRetry, fluxUrl, buildRequestUrl } from "./pollinations.mjs";
import { skip } from "./idempotent.mjs";
import { parseAssetArgs } from "./cli.mjs";
// Only if this harness also chroma-keys a flat generated background:
// import { chromaKey } from "./cutout.mjs";
// Only if this harness resolves a promoted hero (ADR-0043):
// import { loadHeroRegistry, heroForSlot, heroRawUrl, resolveRepoSha } from "./heroes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets/<thing>");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Load the descriptor list from levelArt.json (single source of truth) ────
// Add/tune an item THERE, never in this script (mirrors every existing
// generator — gen-vehicle-sprites.mjs, gen-enemy-types.mjs, …).
function loadItems() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json["<thing>"];
  if (!block || !block.types) {
    throw new Error(`No "<thing>.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  return Object.entries(block.types).map(([key, def]) => {
    // Fail fast on a malformed manifest entry — never serialize a broken URL.
    if (!Number.isInteger(def?.seed) || def.seed <= 0) {
      throw new Error(`<thing>.types.${key}: missing or non-positive integer "seed"`);
    }
    return {
      key,
      seed: def.seed,
      prompt: def.prompt ?? "",
      width: def.size?.width ?? 256,
      height: def.size?.height ?? 256,
    };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const { list, target } = parseAssetArgs(args);
  let items = loadItems();

  if (list) {
    console.log("Defined <thing> items (from levelArt.json):");
    items.forEach((it) => console.log(`  ${it.key.padEnd(24)} ${it.width}x${it.height}`));
    return;
  }

  if (target) {
    items = items.filter((it) => it.key === target);
    if (items.length === 0) {
      console.error(`<thing> "${target}" not found. Use --list.`);
      process.exit(1);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`<Thing> sprites → ${path.relative(ROOT, OUT_DIR)}\n`);

  for (const it of items) {
    const out = path.join(OUT_DIR, `${it.key}.png`);
    if (skip(out, { force: FORCE, existsSync: fs.existsSync })) {
      console.log(`  [skip] ${it.key} (exists)`);
      continue;
    }
    console.log(`  [gen]  ${it.key}`);
    try {
      const url = buildRequestUrl({
        prompt: it.prompt,
        seed: it.seed,
        width: it.width,
        height: it.height,
      });
      const buf = await fetchWithRetry(url);
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   ${it.key} (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] ${it.key} — ${e.message} (will be generated in CI)`);
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
