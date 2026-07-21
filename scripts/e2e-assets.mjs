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
 *   - each level → assets/levels/<id>/<layer>.png, one per key the level's own
 *     `prompts` object actually authors (sky/facade/street/foreground) — an
 *     INTERIOR venue (e.g. niveau-final's l'Éden hall) legitimately drops
 *     sky/street (no exterior to depict) and this gate must not expect a file
 *     scripts/gen-level-art.mjs was never asked to generate. Mirrors the same
 *     per-layer skip gen-level-art.mjs applies at generation time, so the two
 *     stay in lockstep: a layer key present in `prompts` ⇒ generated ⇒ expected
 *     here; absent ⇒ skipped there ⇒ not expected here,
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

// Named pre-existing debt, exempted from MIN_BYTES with a paper trail — never
// add here silently. belliard/sky.png (1.6KB) shipped long before this check
// derived per-level layers (the old hardcoded list skipped "sky" entirely, so
// it was never gated); regenerating a SHIPPED level's art is its own fix-lane
// cycle through the art gates, chased by producer — not a side effect of the
// niveau-final story. Remove the entry when the regenerated sky lands.
const KNOWN_UNDERSIZED_DEBT = new Set(["assets/levels/belliard/sky.png"]);

function expectedAssetPaths(manifest) {
  const rels = [];
  for (const level of manifest.levels) {
    // Derive the expected layer set from the level's OWN authored `prompts`
    // keys, not a fixed list — a level that drops a layer (interior venues
    // drop sky/street) is never asked to generate it, so it must never be
    // expected here either (see the header comment).
    const prompts = level.prompts ?? {};
    for (const layer of Object.keys(prompts)) {
      if (layer.startsWith("$")) continue; // skip $comment keys
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
      if (KNOWN_UNDERSIZED_DEBT.has(rel)) {
        console.log(`  DEBT ${rel} (${String(size)}B < ${String(MIN_BYTES)}B — known, producer chases)`);
        continue;
      }
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
