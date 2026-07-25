#!/usr/bin/env node
/**
 * Generate the enemy-bullet 3D model (ADR-0065) — a real textured GLB to replace
 * `BulletSprite.tsx`'s code-drawn cylinder+cap placeholder when present (ADR-0049
 * generated-with-procedural-fallback idiom: a missing/404 asset keeps the
 * procedural mesh, this script never needs to produce a placeholder itself).
 *
 * Single asset (not a per-type family like vehicles/enemies), so the prompt/seed
 * live here as local constants rather than in `levelArt.json` — there is no
 * shared style block or multi-type lint to justify a new JSON block for one file.
 *
 * Network 3D generation (Pollinations `gen.pollinations.ai/3d`, `hyper3d-rodin`
 * model) is CI-only: the endpoint requires an API key (401 with none; unlike the
 * flux 2D endpoint there is no anonymous tier), so `POLLINATIONS_TOKEN` MUST be
 * set (.github/workflows/gen-bullet-3d.yml supplies the repo secret).
 *
 * Naming contract (renderer aligns on this, `src/render/scene/bulletModel.ts`):
 *   public/assets/models/bullet.glb
 *
 * Only a MISSING file is generated, so re-runs are cheap; set FORCE=1 to
 * regenerate.
 *
 * Usage:
 *   node scripts/gen-bullet-3d.mjs          # generate if missing (network, needs POLLINATIONS_TOKEN)
 *   FORCE=1 node scripts/gen-bullet-3d.mjs   # regenerate  [CI]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gen3dUrl, fetchWithRetry } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "public/assets/models");
const OUT_FILE = path.join(OUT_DIR, "bullet.glb");
const FORCE = process.env.FORCE === "1";

// Silhouette-first, positively-described (house-style contract, docs/art-direction.md
// §3): a small, plain brass-cased pistol bullet — no scene, no ground, no hands —
// low-poly so it stays legible at in-game projectile scale (a few centimetres on
// screen). Deliberately NOT photoreal-detailed (a hyper-detailed casing would just
// alias away at that size); "clean matte brass, slight wear" gives the material
// group something to key emissive/metalness overrides onto render-side without
// fighting a baked glossy highlight.
const PROMPT =
  "a single low-poly pistol bullet, brass cartridge case with a pointed copper-jacketed tip, " +
  "the tip a warm reddish-orange copper metal (not pink, not grey lead), " +
  "clean matte metal material, simple rounded cylindrical shape, isolated object, " +
  "no scene, no ground plane, no hands, no background";
// pinned; bump to re-roll deterministically. Must stay <= 65535 — hyper3d-rodin
// proxies to fal.ai's Hyper3D Rodin model, which rejects (HTTP 422) any larger
// seed ("Input should be less than or equal to 65535"), unlike the flux 2D
// endpoint's seeds elsewhere in this repo which have no such ceiling.
// Bumped from 6064: first roll's tip read as a dull pink lead rather than
// copper — re-rolled with a prompt calling out copper explicitly.
const SEED = 6065;

function isGlb(buf) {
  // glTF binary container: 4-byte magic "glTF" at offset 0 (little-endian 0x46546C67).
  return buf.length >= 4 && buf.readUInt32LE(0) === 0x46546c67;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (skip(OUT_FILE, { force: FORCE, existsSync: fs.existsSync })) {
    console.log(`skip (exists): ${path.relative(ROOT, OUT_FILE)}`);
    return;
  }

  if (!process.env.POLLINATIONS_TOKEN?.trim()) {
    console.error(
      "POLLINATIONS_TOKEN is required for the 3D endpoint (no anonymous tier) — " +
        "set it or run via .github/workflows/gen-bullet-3d.yml (repo secret).",
    );
    process.exitCode = 1;
    return;
  }

  const url = gen3dUrl(PROMPT, SEED);
  console.log(`generating: ${path.relative(ROOT, OUT_FILE)}`);
  const buf = await fetchWithRetry(url);
  if (!isGlb(buf)) {
    throw new Error(
      `response for ${path.relative(ROOT, OUT_FILE)} is not a valid GLB (bad magic header) — ` +
        `likely an error JSON body; first bytes: ${buf.subarray(0, 80).toString("utf8")}`,
    );
  }
  fs.writeFileSync(OUT_FILE, buf);
  console.log(`wrote: ${path.relative(ROOT, OUT_FILE)} (${buf.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
