#!/usr/bin/env node
/**
 * Generate loot 3D models (GLB) from the validated reference directions:
 * - KEEP: 90s sportswear panel language, cash bundle realism
 * - DIG: monochrome street-carry, business clandestine attaché, rave flight-case
 *
 * Outputs:
 *   public/assets/models/loot/attache-case.glb
 *   public/assets/models/loot/backpack.glb
 *   public/assets/models/loot/flight-case.glb
 *   public/assets/models/loot/references.json   (attached reference sources + prompts)
 *
 * CI-only generation: Pollinations 3D endpoint requires POLLINATIONS_TOKEN.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gen3dUrl, fetchWithRetry } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "public/assets/models/loot");
const REF_FILE = path.join(OUT_DIR, "references.json");
const FORCE = process.env.FORCE === "1";

const STYLE_SUFFIX =
  "low-poly game asset, isolated object, no scene, no floor, no hands, no character, no text, no logo, no watermark, " +
  "readable silhouette, visible texture detail at game scale, clear material separation, no pure-black materials, no near-black albedo, use mid-gray to light-gray base tones";

const ASSETS = [
  {
    id: "attache-case",
    outFile: "attache-case.glb",
    seed: 6222,
    prompt:
      "a hard rectangular attache case, medium gray shell with subtle grain, brushed aluminum lower band, satin-chrome latches and hinges, dark gray polymer handle, subtle scratches and edge wear, discreet clandestine-courier look, " +
      STYLE_SUFFIX,
    references: ["https://en.wikipedia.org/wiki/Briefcase", "https://en.wikipedia.org/wiki/Zero_Halliburton"],
  },
  {
    id: "backpack",
    outFile: "backpack.glb",
    seed: 6223,
    prompt:
      "a medium urban backpack, medium graphite fabric body with clearly lighter gray side panels, visible woven nylon texture, stitched seams, dark gray straps with light gray webbing accents, practical 1990s street utility look, " +
      STYLE_SUFFIX,
    references: [
      "https://en.wikipedia.org/wiki/Eastpak",
      "https://en.wikipedia.org/wiki/JanSport",
      "https://archive.org/details/paris-tonkar-4-ans-de-graffitis",
    ],
  },
  {
    id: "flight-case",
    outFile: "flight-case.glb",
    seed: 6224,
    prompt:
      "a compact rave logistics flight case, medium charcoal birch-ply panels with visible wood grain, bright aluminum edge extrusions, steel corner protectors, recessed handle plate, visible rivets, slightly worn touring gear look, " +
      STYLE_SUFFIX,
    references: ["https://en.wikipedia.org/wiki/Road_case", "https://en.wikipedia.org/wiki/Technics_SL-1200"],
  },
];

function isGlb(buf) {
  return buf.length >= 4 && buf.readUInt32LE(0) === 0x46546c67;
}

function writeReferencesSidecar(generatedAt) {
  const payload = {
    generatedAt,
    source: "scripts/gen-loot-3d.mjs",
    selection: {
      bagTypes: ["attache case", "backpack", "flight case"],
      universes: ["A Monochrome Street", "B 90s Sportswear", "E Business Clandestine"],
      verdicts: {
        "monochrome street-carry": "DIG",
        "90s sportswear panel language": "KEEP",
        "business clandestine attache": "DIG",
        "rave logistics flight-case": "DIG",
        "cash bundle realism": "DEFERRED",
      },
    },
    assets: ASSETS.map((asset) => ({
      id: asset.id,
      file: `assets/models/loot/${asset.outFile}`,
      seed: asset.seed,
      prompt: asset.prompt,
      references: asset.references,
    })),
  };
  fs.writeFileSync(REF_FILE, JSON.stringify(payload, null, 2) + "\n");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!process.env.POLLINATIONS_TOKEN?.trim()) {
    console.error(
      "POLLINATIONS_TOKEN is required for the 3D endpoint (no anonymous tier) — " +
        "set it or run via .github/workflows/gen-loot-3d.yml (repo secret).",
    );
    process.exitCode = 1;
    return;
  }

  for (const asset of ASSETS) {
    const outFile = path.join(OUT_DIR, asset.outFile);
    if (skip(outFile, { force: FORCE, existsSync: fs.existsSync })) {
      console.log(`skip (exists): ${path.relative(ROOT, outFile)}`);
      continue;
    }

    const url = gen3dUrl(asset.prompt, asset.seed);
    console.log(`generating: ${path.relative(ROOT, outFile)}`);
    const buf = await fetchWithRetry(url);
    if (!isGlb(buf)) {
      throw new Error(
        `response for ${path.relative(ROOT, outFile)} is not a valid GLB (bad magic header) — ` +
          `likely an error JSON body; first bytes: ${buf.subarray(0, 80).toString("utf8")}`,
      );
    }
    fs.writeFileSync(outFile, buf);
    console.log(`wrote: ${path.relative(ROOT, outFile)} (${buf.length} bytes)`);
  }

  writeReferencesSidecar(new Date().toISOString());
  console.log(`wrote: ${path.relative(ROOT, REF_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
