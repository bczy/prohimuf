#!/usr/bin/env node
/**
 * Chroma-key the foreground layer: the foreground art is generated with a flat
 * magenta background (see levelArt.json foreground prompts). Remove magenta
 * pixels (make them transparent) so only the ironwork/railings remain, to be
 * composited in front of the cops.
 *
 * Operates in place on public/assets/levels/<id>/foreground.png.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LEVELS_DIR = path.resolve(ROOT, "public/assets/levels");

// A pixel counts as background if it's magenta-ish: strong red+blue, weak green.
function isMagenta(r, g, b) {
  return r > 110 && b > 110 && g < Math.min(r, b) * 0.62;
}

async function cutout(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  let cleared = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (isMagenta(d[i], d[i + 1], d[i + 2])) {
      d[i + 3] = 0;
      cleared++;
    }
  }
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
