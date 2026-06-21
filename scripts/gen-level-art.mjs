#!/usr/bin/env node
/**
 * Generate big per-level backdrop art (Style B pixel art) as separate layers
 * — sky / facade / street — for light parallax. One set of files per level.
 *
 * Prompts, sizes and the level list all come from the single manifest at
 * src/game/levels/levelArt.json (shared with the app), so adding a level is a
 * one-place change. Images come from the pollinations.ai text-to-image
 * endpoint (same pipeline as the other asset scripts).
 *
 * By default only missing files are generated, so reruns are stable. Pass
 * --force (or FORCE=1) to regenerate everything.
 *
 * Output: public/assets/levels/<id>/{sky,facade,street}.png
 */
import fs from "fs";
import path from "path";
import https from "https";

const ROOT = process.cwd();
const OUT_ROOT = path.resolve(ROOT, "public/assets/levels");
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");

const FORCE = process.argv.includes("--force") || process.env.FORCE === "1";
// The decor repeats ONE facade image across all panels (so the window-zone grid
// lines up everywhere), so only a single facade layer is generated per level.
const LAYERS = ["sky", "facade", "street", "foreground"];

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const { style, sizes, levels } = manifest;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchImage(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generate(prompt, size, retries = 5) {
  const seed = Math.floor(Math.random() * 99999);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", " + style)}` +
    `?width=${size.width}&height=${size.height}&nologo=true&model=flux&seed=${seed}`;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) await sleep((i + 1) * 8000);
      else throw e;
    }
  }
}

async function main() {
  console.log(`Generating level art → ${OUT_ROOT}${FORCE ? " (force)" : ""}\n`);
  for (const level of levels) {
    const dir = path.join(OUT_ROOT, level.id);
    fs.mkdirSync(dir, { recursive: true });
    for (const layer of LAYERS) {
      const file = path.join(dir, `${layer}.png`);
      if (!FORCE && fs.existsSync(file)) {
        console.log(`  [skip] ${level.id}/${layer}.png (exists)`);
        continue;
      }
      console.log(`  [gen]  ${level.id}/${layer}.png`);
      try {
        const baseLayer = layer.startsWith("facade_") ? "facade" : layer;
        // All facade panels are sections of ONE continuous terrace so they abut
        // seamlessly: force level/aligned floor lines + cornice and a flat,
        // straight-on elevation. Different seeds keep each panel distinct.
        const continuity =
          ", one section of a single long continuous parisian haussmann terrace," +
          " every horizontal floor line, balcony row and the top roof cornice perfectly level" +
          " and aligned straight across, flat front elevation seen perfectly straight on, no" +
          " perspective, the left and right edges continue seamlessly into the neighbouring buildings";
        const suffix = baseLayer === "facade" ? continuity : "";
        const prompt = `${level.prompts[baseLayer]}${suffix}, ${level.label}`;
        const buf = await generate(prompt, sizes[baseLayer]);
        fs.writeFileSync(file, buf);
        console.log(`  [ok]   ${level.id}/${layer}.png (${buf.length} bytes)`);
      } catch (e) {
        console.log(`  [fail] ${level.id}/${layer}.png — ${e.message}`);
      }
      await sleep(2000);
    }
  }
  console.log("\ndone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
