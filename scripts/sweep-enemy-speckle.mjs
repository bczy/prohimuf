#!/usr/bin/env node
/**
 * GENERIC KEYING-DEBRIS SWEEP — thin CLI wrapper around the sweepSpeckle primitive
 * already exported by scripts/retouch-sprites.mjs (drop every non-dominant 4-connected
 * opaque component smaller than SPECKLE_MAX_SIZE_PX). retouch-sprites.mjs's own CLI only
 * processes files with a RETOUCH_SPECS entry (its per-file bridge windows); this wrapper
 * runs the SAME exported, unforked function over an arbitrary file set so it can be used
 * as a standalone pipeline stage (e.g. after cutout-enemies.mjs, before
 * fill-sprite-holes.mjs) without inventing a bridge spec a file does not need.
 *
 * Needed for the `enemies` pochoir family specifically: once
 * retouch-flatten-enemy-background.mjs hands cutout-enemies.mjs a properly flattened
 * pure-black ground, the keyer's edge-flood pass leaves the pochoir/xerox "torn scratch"
 * grain as a scatter of tiny (<12px) opaque islands hugging the silhouette (dirt debris,
 * not anatomy) — see retouch-flatten-enemy-background.mjs's CALIBRATION for measured
 * counts. This sweep is what makes check-sprite-integrity.mjs's SPECKLE budget clause
 * pass; it does NOT touch the dominant figure or any real detached element above the
 * budget (12px).
 *
 * Deterministic + idempotent (sweepSpeckle only ever clears alpha; a re-run over an
 * already-swept file removes 0).
 *
 * Requires @napi-rs/canvas (same install as every sibling script):
 *   npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
 *
 * Usage:
 *   node scripts/sweep-enemy-speckle.mjs                # every public/assets/enemy_*.png
 *   node scripts/sweep-enemy-speckle.mjs a.png b.png    # explicit files
 *   ASSET_DIR=… node scripts/sweep-enemy-speckle.mjs    # override target dir
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sweepSpeckle } from "./retouch-sprites.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.resolve(ROOT, process.env.ASSET_DIR ?? "public/assets");

async function sweepFile(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const { removedComps, removedPx } = sweepSpeckle({ W, H, d: image.data });
  if (removedPx === 0) {
    console.log(`  ok ${path.basename(file)} — no keying debris`);
    return;
  }
  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`  swept ${path.basename(file)} — removed ${removedComps} comp / ${removedPx}px`);
}

async function main() {
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync(ASSET_DIR)
          .filter((f) => /^enemy_.*\.png$/.test(f))
          .map((f) => path.join(ASSET_DIR, f));
  if (files.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  for (const f of files) await sweepFile(f);
  console.log("done.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("[sweep-enemy-speckle] Fatal:", e.message);
    process.exit(1);
  });
}
