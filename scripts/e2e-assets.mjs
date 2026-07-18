#!/usr/bin/env node
/**
 * E2E asset gate — verify the BUILT bundle actually ships the level & vehicle
 * art it declares. NO browser: plain node over the dist/ directory.
 *
 * Purpose: the render smoke (e2e-ingame) tolerates missing art on purpose — the
 * scene falls back to flat colours so `yarn dev` works with no assets. That
 * means a build could ship with empty/placeholder PNGs and still render. This
 * gate closes that hole by deriving every expected asset path from the single
 * source of truth (src/game/levels/levelArt.json) and asserting each file:
 *   - exists in dist/, AND
 *   - is >= MIN_BYTES (a generic 5KB floor that catches empty/placeholder/0-byte
 *     files without pinning a specific size — real FLUX art is far larger).
 *
 * Expected assets, per levelArt.json:
 *   - each level → assets/levels/<id>/{sky,facade,street,foreground}.png
 *     (the four layers scripts/gen-level-art.mjs generates per level),
 *   - each vehicle → vehicles.types[*].asset (assets/vehicles/{truck,car,moto}.png).
 *
 * Sequencing note (PM flag): vehicle sprites are regenerated later in this PR.
 * The threshold is deliberately generic (>= 5KB) so a finalization pass can
 * re-run this gate against the kept PNGs without a threshold change.
 *
 * Usage: node scripts/e2e-assets.mjs   (DIST_DIR env overrides the dist dir)
 * Exit: non-zero listing every offender; 0 when all assets are present & sized.
 */
import fs from "fs";
import path from "path";
import { loadLevelManifest } from "./e2e-lib.mjs";

const ROOT = process.cwd();
const DIST_DIR = path.resolve(ROOT, process.env.DIST_DIR ?? "dist");
const MIN_BYTES = 5 * 1024; // 5KB floor — catches empty/placeholder art.

// The four backdrop layers gen-level-art.mjs produces for every level.
const LAYERS = [ "facade", "street", "foreground"];

function expectedAssetPaths(manifest) {
  const rels = [];
  for (const level of manifest.levels) {
    for (const layer of LAYERS) {
      rels.push(`assets/levels/${level.id}/${layer}.png`);
    }
  }
  const types = manifest.vehicles?.types ?? {};
  for (const key of Object.keys(types)) {
    const asset = types[key]?.asset;
    if (typeof asset === "string" && asset.length > 0) rels.push(asset);
  }
  return rels;
}

function main() {
  const { manifest } = loadLevelManifest(ROOT);

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[e2e-assets] FAILED: dist dir not found: ${DIST_DIR}`);
    console.error("[e2e-assets] run `yarn build` first (or set DIST_DIR).");
    process.exit(1);
  }

  const expected = expectedAssetPaths(manifest);
  console.log(`[e2e-assets] checking ${String(expected.length)} asset(s) in ${DIST_DIR}`);

  const offenders = [];
  for (const rel of expected) {
    const abs = path.join(DIST_DIR, rel);
    if (!fs.existsSync(abs)) {
      offenders.push(`missing    ${rel}`);
      continue;
    }
    const size = fs.statSync(abs).size;
    if (size < MIN_BYTES) {
      offenders.push(`too small  ${rel} (${String(size)}B < ${String(MIN_BYTES)}B)`);
      continue;
    }
    console.log(`  ok  ${rel} (${String(size)}B)`);
  }

  if (offenders.length > 0) {
    console.error(`[e2e-assets] FAILED — ${String(offenders.length)} asset issue(s):`);
    for (const o of offenders) console.error(`  ✗ ${o}`);
    process.exit(1);
  }

  console.log(`[e2e-assets] PASSED — all ${String(expected.length)} assets present & >= 5KB`);
}

main();
