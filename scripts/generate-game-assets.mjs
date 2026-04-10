#!/usr/bin/env node
/**
 * Game asset generator — Prohibition remake
 * Generates specific game assets for public/assets/
 * Uses Pollinations.ai (free, no API key required)
 *
 * Usage:
 *   node scripts/generate-game-assets.mjs
 *   node scripts/generate-game-assets.mjs --asset facade_bg
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/assets");

const ASSETS = [
  {
    name: "facade_bg",
    description: "Facade building — background",
    prompt:
      "Paris building facade at night, 90s rave scene, brutalist concrete wall, dark windows, photocopied fanzine style, high contrast black and white with acid neon accents, grainy texture, flat 2D, game background",
    width: 1024,
    height: 512,
  },
  {
    name: "enemy_sprite",
    description: "Enemy sprite — undercover cop standing (variant 1)",
    prompt:
      "Paris 90s undercover cop, plain clothes, standing in window, fanzine photocopy style, high contrast black white, neon yellow glow outline, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "enemy_sprite_2",
    description: "Enemy sprite — plainclothes detective standing (variant 2)",
    prompt:
      "Paris 90s plainclothes detective, trench coat, arms crossed, standing in dark window, fanzine photocopy style, high contrast black white, neon cyan glow outline, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "enemy_sprite_3",
    description: "Enemy sprite — BAC officer standing (variant 3)",
    prompt:
      "Paris 90s BAC police officer, dark uniform, cap, standing menacing in window, fanzine photocopy style, high contrast black white, neon red glow outline, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "enemy_shooting",
    description: "Enemy sprite — undercover cop shooting (variant 1)",
    prompt:
      "Paris 90s undercover cop shooting gun from window, fanzine photocopy style, high contrast black white, orange neon glow, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "enemy_shooting_2",
    description: "Enemy sprite — plainclothes detective shooting (variant 2)",
    prompt:
      "Paris 90s plainclothes detective firing pistol sideways from window, fanzine photocopy style, high contrast black white, cyan neon glow, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "enemy_shooting_3",
    description: "Enemy sprite — BAC officer shooting (variant 3)",
    prompt:
      "Paris 90s BAC police officer shooting from window, two-handed grip, fanzine photocopy style, high contrast black white, red neon glow, flat sprite, game character, no background transparent",
    width: 128,
    height: 128,
  },
  {
    name: "crosshair",
    description: "Crosshair UI element",
    prompt:
      "Targeting crosshair circle, fanzine screen print style, acid green neon color, flat 2D, transparent background, game UI element",
    width: 64,
    height: 64,
  },
  {
    name: "bullet_player",
    description: "Player bullet sprite",
    prompt:
      "Yellow neon bullet tracer, fanzine style, glowing yellow dot, transparent background, game sprite",
    width: 16,
    height: 16,
  },
];

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
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function generateImage(asset, retries = 5) {
  const encodedPrompt = encodeURIComponent(asset.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${asset.width}&height=${asset.height}&nologo=true&model=flux&seed=${seed}`;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  [fetch] ${url.slice(0, 80)}...`);
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 15000;
        console.log(`  [retry ${i + 1}] ${e.message} — waiting ${wait / 1000}s...`);
        await sleep(wait);
      } else {
        throw e;
      }
    }
  }
}

async function generateAsset(asset) {
  const outPath = path.join(OUTPUT_DIR, `${asset.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${asset.name} — already exists`);
    return;
  }
  console.log(`\n  [gen]  ${asset.name} — ${asset.description}`);
  try {
    const imageBuffer = await generateImage(asset);
    fs.writeFileSync(outPath, imageBuffer);
    console.log(`  [ok]   saved → public/assets/${asset.name}.png (${imageBuffer.length} bytes)`);
  } catch (e) {
    console.log(`  [fail] ${asset.name} — ${e.message} (skipped)`);
  }
  await sleep(5000); // pause between assets to avoid rate limiting
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available assets:");
    ASSETS.forEach((a) => console.log(`  ${a.name.padEnd(24)} ${a.description}`));
    return;
  }

  const targetIndex = args.indexOf("--asset");
  const target = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const toGenerate = target ? ASSETS.filter((a) => a.name === target) : ASSETS;

  if (target && toGenerate.length === 0) {
    console.error(`Asset "${target}" not found. Use --list to see available assets.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${toGenerate.length} asset(s) → public/assets/\n`);
  for (const asset of toGenerate) {
    await generateAsset(asset);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
