#!/usr/bin/env node
/**
 * Desaturate the Belliard tronçon tiles to B&W (Rec.601), in place.
 *
 * WHY: the tronçon tiles' COMPOSITION is what matters and it is right in the
 * committed img2img art — self-contained buildings that end naturally with
 * transparent sky margins on both sides (NOT cut at the frame edge). A FLUX
 * text-to-image regen loses that framing (the model fills the frame edge to
 * edge). The v2 art's ONLY flaw was colour. So the correct fix is the one the
 * `levels` family always lacked (postProcess desaturates only `vehicles`):
 * keep the img2img framing and just strip the colour. This script IS that step.
 *
 * Idempotent: re-running on already-neutral pixels is a no-op.
 *
 *   node scripts/desat-troncons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.resolve(process.cwd(), "public/assets/levels/belliard");
const TILES = ["troncon-a.png", "troncon-b.png", "troncon-c.png"];

async function desat(file) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(path.join(DIR, file));
  const w = img.width;
  const h = img.height;
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const p = data.data;
  let changed = 0;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue; // keep transparency
    const y = Math.round(0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]);
    if (p[i] !== y || p[i + 1] !== y || p[i + 2] !== y) changed++;
    p[i] = p[i + 1] = p[i + 2] = y;
  }
  ctx.putImageData(data, 0, 0);
  fs.writeFileSync(path.join(DIR, file), cv.toBuffer("image/png"));
  console.log(`  ${file} (${w}x${h}) — desaturated ${changed} px`);
}

async function main() {
  console.log(`Desaturating tronçons → ${DIR}\n`);
  for (const f of TILES) {
    if (!fs.existsSync(path.join(DIR, f))) {
      console.log(`  [skip] ${f} (missing)`);
      continue;
    }
    await desat(f);
  }
  console.log("\ndone.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
