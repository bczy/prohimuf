#!/usr/bin/env node
/**
 * Style demo generator — produces a small representative set of assets
 * rendered in several UNIFIED art directions, so we can pick a cohesive
 * look before regenerating the whole game.
 *
 * Output: demo/graphics-styles/<style>/<subject>.png
 *
 * Usage:
 *   node scripts/generate-style-demo.mjs
 *   node scripts/generate-style-demo.mjs --style fanzine
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../demo/graphics-styles");

// ── Representative subjects (one per visual category the game uses) ──────────
const SUBJECTS = [
  {
    name: "01_background",
    category: "Jeu en action — fond de façade",
    prompt:
      "Paris street building facade at night, 90s underground rave scene, ground-floor shop with a lit neon sign, several windows some lit some dark, empty sidewalk, side-scroller game background, flat 2D, full width composition",
    width: 768,
    height: 384,
  },
  {
    name: "02_enemy",
    category: "Jeu en action — ennemi (flic en civil)",
    prompt:
      "single menacing plainclothes french cop standing, holding a walkie-talkie radio, full body, front view, centered on a plain flat background, video game character sprite, flat 2D",
    width: 320,
    height: 320,
  },
  {
    name: "03_player",
    category: "Personnage — le joueur (raver à capuche)",
    prompt:
      "young raver wearing a grey hoodie and a big backpack, standing idle, full body, front view, centered on a plain flat background, video game character sprite, flat 2D",
    width: 384,
    height: 384,
  },
  {
    name: "04_tile_shop",
    category: "Tuile d'immeuble — devanture boucherie",
    prompt:
      "small parisian butcher shop storefront at night with a lit sign, seamless square building tile, front view flat elevation, flat 2D game texture",
    width: 320,
    height: 320,
  },
  {
    name: "05_ui_cover",
    category: "Écran / UI — affiche écran-titre",
    prompt:
      "poster cover for a 90s Paris underground rave video game, dramatic city night scene, empty banner space at the top for a title, portrait composition, flat 2D",
    width: 448,
    height: 640,
  },
];

// ── Unified art directions (style suffix appended to every subject) ─────────
const STYLES = {
  fanzine: {
    label: "A — Fanzine photocopié N&B + néon acide",
    suffix:
      ", high-contrast black and white photocopy fanzine aesthetic, riso print, bold halftone dots, screenprinted ink, one single acid-magenta neon accent color, grainy xerox texture, rough hand-made 90s underground zine look, flat 2D, no gradients",
  },
  pixel: {
    label: "B — Pixel-art néon 16-bit",
    suffix:
      ", 16-bit pixel art, crisp clean pixels, cohesive limited neon-night palette of dark blue magenta and cyan, dithering, retro SNES era game sprite, flat 2D, no photorealism",
  },
  neonoir: {
    label: "C — Vectoriel flat / néo-noir",
    suffix:
      ", bold flat vector illustration, cel-shaded with clean thick outlines, neo-noir night palette of deep blues and blacks, cyan and magenta neon rim lighting, modern graphic novel style, flat 2D, no photorealism",
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function generate(prompt, width, height, retries = 5) {
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}`;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 8000;
        console.log(`  [retry ${i + 1}] ${e.message} — wait ${wait / 1000}s`);
        await sleep(wait);
      } else throw e;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--style");
  const only = idx !== -1 ? args[idx + 1] : null;
  const styleKeys = only ? [only] : Object.keys(STYLES);

  for (const key of styleKeys) {
    const style = STYLES[key];
    if (!style) {
      console.error(`Unknown style "${key}". Options: ${Object.keys(STYLES).join(", ")}`);
      process.exit(1);
    }
    const dir = path.join(OUTPUT_DIR, key);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n=== STYLE ${style.label} ===`);
    for (const s of SUBJECTS) {
      const out = path.join(dir, `${s.name}.png`);
      if (fs.existsSync(out)) {
        console.log(`  [skip] ${key}/${s.name}`);
        continue;
      }
      console.log(`  [gen]  ${key}/${s.name} — ${s.category}`);
      try {
        const buf = await generate(s.prompt + style.suffix, s.width, s.height);
        fs.writeFileSync(out, buf);
        console.log(`  [ok]   ${key}/${s.name} (${buf.length} bytes)`);
      } catch (e) {
        console.log(`  [fail] ${key}/${s.name} — ${e.message}`);
      }
      await sleep(2000);
    }
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
