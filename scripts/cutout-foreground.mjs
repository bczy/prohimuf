#!/usr/bin/env node
/**
 * Chroma-key the foreground layer: the foreground art is generated with a flat
 * magenta background (see levelArt.json foreground prompts, "solid flat
 * uniform bright magenta (#FF3CDC) chroma-key background"). Remove magenta
 * pixels (make them transparent) so only the ironwork/railings remain, to be
 * composited in front of the cops.
 *
 * Operates in place on public/assets/levels/<id>/foreground.png.
 *
 * Keying (ADR-0007): the flat magenta ground has no legitimate near-magenta
 * subject pixel to protect (the ironwork is pure black-and-white per house
 * style), so this uses the shared, connectivity-free `chromaKey` primitive
 * (scripts/lib/cutout.mjs) directly — a single global "clear everything close
 * enough to the key colour" pass, unlike cutout-enemies.mjs's border-flood
 * (which must preserve enclosed dark subject regions).
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { chromaKey } from "./lib/cutout.mjs";

const ROOT = process.cwd();
const LEVELS_DIR = path.resolve(ROOT, "public/assets/levels");

// #FF3CDC, the exact chroma-key colour authored in levelArt.json's vehicle
// style block and matched by the foreground prompts' "bright magenta".
const MAGENTA_KEY = { r: 255, g: 60, b: 220 };
// Measured against all 3 committed foreground.png: the closest already-opaque
// (ironwork) pixel sits ~82 units from MAGENTA_KEY (belliard/stalingrad) / ~103
// (vitry) in squared-then-rooted RGB distance — comfortably clear of this
// threshold, so re-running the cutout on already-keyed art clears 0 px
// (byte-identical, proven in scripts/lib/__tests__/cutout.test.mjs's spirit).
const THRESHOLD_SQ = 65 * 65;

async function cutout(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const cleared = chromaKey(image, MAGENTA_KEY, THRESHOLD_SQ);
  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`  cut ${path.basename(path.dirname(file))}/foreground.png (${cleared} px cleared)`);
}

async function main() {
  if (!fs.existsSync(LEVELS_DIR)) {
    console.log("no levels dir");
    return;
  }
  const files = fs
    .readdirSync(LEVELS_DIR)
    .map((id) => path.join(LEVELS_DIR, id, "foreground.png"))
    .filter((f) => fs.existsSync(f));
  if (files.length === 0) {
    console.log("no foreground.png found");
    return;
  }
  for (const f of files) await cutout(f);
  console.log("done.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
