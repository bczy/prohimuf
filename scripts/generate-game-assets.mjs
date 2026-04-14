#!/usr/bin/env node
/**
 * Game asset generator — Prohibition remake
 * Generates specific game assets for public/assets/
 * Uses Pollinations.ai (free,
 no API key required)
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
const OUTPUT_DIR = path.resolve(__dirname,
 "../public/assets");

const ASSETS = [
  // ── Facade backgrounds ───────────────────────────────────────────────────────
  {
    name: "facade_bg",

    description: "Facade building — night background (variant 1)",

    prompt:
      "Paris building facade at night,
 90s rave scene,
 brutalist concrete wall,
 dark windows,
 photocopied fanzine style,
 high contrast black and white with acid neon accents,
 grainy texture,
 flat 2D,
 game background",

    width: 1024,

    height: 512,

  },

  {
    name: "facade_bg_haussmann",

    description: "Facade building — Haussmann stone (variant 2)",

    prompt:
      "Classic Haussmann Parisian building facade at night,
 stone columns,
 ornate balconies,
 varied windows lit and dark,
 90s Paris,
 photocopied fanzine style,
 high contrast black white neon accents,
 flat 2D game background",

    width: 1024,

    height: 512,

  },

  {
    name: "facade_bg_banlieue",

    description: "Facade building — banlieue HLM (variant 3)",

    prompt:
      "90s Paris banlieue HLM social housing tower facade at night,
 graffiti tags,
 broken windows,
 satellite dishes,
 fanzine photocopy style,
 high contrast black white cyan neon accents,
 flat 2D game background",

    width: 1024,

    height: 512,

  },

  {
    name: "facade_bg_warehouse",

    description: "Facade building — warehouse squat (variant 4)",

    prompt:
      "Abandoned Paris warehouse squat facade at night,
 large industrial windows,
 rust,
 rave posters pasted on walls,
 makeshift rave venue,
 fanzine photocopied style,
 high contrast black white orange neon,
 flat 2D game background",

    width: 1024,

    height: 512,

  },

  {
    name: "facade_bg_mixed",

    description: "Facade building — mixed storefronts ground level (variant 5)",

    prompt:
      "Paris mixed-use building facade at night,
 ground floor bars and shops with neon signs,
 shuttered storefronts,
 upper floors residential,
 90s street scene,
 fanzine style,
 high contrast black white neon,
 flat 2D game background",

    width: 1024,

    height: 512,

  },


  // ── Enemy sprites — standing ─────────────────────────────────────────────────
  {
    name: "enemy_sprite",

    description: "Enemy — undercover cop standing (variant 1)",

    prompt:
      "Paris 90s undercover cop,
 plain clothes,
 standing in window,
 fanzine photocopy style,
 high contrast black white,
 neon yellow glow outline,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_sprite_2",

    description: "Enemy — plainclothes detective standing (variant 2)",

    prompt:
      "Paris 90s plainclothes detective,
 trench coat,
 arms crossed,
 standing in dark window,
 fanzine photocopy style,
 high contrast black white,
 neon cyan glow outline,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_sprite_3",

    description: "Enemy — BAC officer standing (variant 3)",

    prompt:
      "Paris 90s BAC police officer,
 dark uniform,
 cap,
 standing menacing in window,
 fanzine photocopy style,
 high contrast black white,
 neon red glow outline,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_sprite_4",

    description: "Enemy — RG agent standing (variant 4)",

    prompt:
      "Paris 90s RG intelligence agent,
 suit and tie,
 binoculars lowered,
 standing watching from window,
 fanzine photocopy style,
 high contrast black white,
 neon purple glow outline,
 flat sprite,
 game character,
 transparent bg",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_sprite_5",

    description: "Enemy — CRS riot police standing (variant 5)",

    prompt:
      "Paris 90s CRS riot police officer,
 full riot gear,
 helmet visor up,
 baton at side,
 standing in window,
 fanzine photocopy style,
 high contrast black white,
 neon orange glow outline,
 flat sprite,
 transparent bg",

    width: 128,

    height: 128,

  },


  // ── Enemy sprites — alert ────────────────────────────────────────────────────
  {
    name: "enemy_alert",

    description: "Enemy — spotted player,
 alert pose",

    prompt:
      "Paris 90s cop in window,
 alert pose,
 pointing finger,
 leaning forward,
 just spotted something,
 fanzine photocopy style,
 high contrast black white,
 bright white flash glow,
 flat sprite,
 transparent bg",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_radio",

    description: "Enemy — calling backup on radio",

    prompt:
      "Paris 90s undercover cop in window,
 radio to mouth,
 calling backup,
 urgent expression,
 fanzine photocopy style,
 high contrast black white,
 static electricity yellow glow,
 flat sprite,
 transparent bg",

    width: 128,

    height: 128,

  },


  // ── Enemy sprites — shooting ──────────────────────────────────────────────────
  {
    name: "enemy_shooting",

    description: "Enemy — undercover cop shooting (variant 1)",

    prompt:
      "Paris 90s undercover cop shooting gun from window,
 fanzine photocopy style,
 high contrast black white,
 orange neon glow,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_shooting_2",

    description: "Enemy — plainclothes detective shooting (variant 2)",

    prompt:
      "Paris 90s plainclothes detective firing pistol sideways from window,
 fanzine photocopy style,
 high contrast black white,
 cyan neon glow,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_shooting_3",

    description: "Enemy — BAC officer shooting (variant 3)",

    prompt:
      "Paris 90s BAC police officer shooting from window,
 two-handed grip,
 fanzine photocopy style,
 high contrast black white,
 red neon glow,
 flat sprite,
 game character,
 no background transparent",

    width: 128,

    height: 128,

  },

  {
    name: "enemy_shooting_4",

    description: "Enemy — RG agent shooting (variant 4)",

    prompt:
      "Paris 90s RG intelligence agent firing from window,
 silenced pistol,
 calm expression,
 fanzine photocopy style,
 high contrast black white,
 purple neon muzzle flash,
 flat sprite,
 transparent bg",

    width: 128,

    height: 128,

  },


  // ── Player in-game ───────────────────────────────────────────────────────────
  {
    name: "player_ingame_idle",

    description: "Player in-game — small sprite idle",

    prompt:
      "Small 2D courier character sprite,
 hoodie and backpack,
 standing idle,
 bottom-up view,
 fanzine photocopy style,
 high contrast black white,
 green neon glow,
 flat sprite,
 transparent background",

    width: 64,

    height: 64,

  },

  {
    name: "player_ingame_walk",

    description: "Player in-game — small sprite walking",

    prompt:
      "Small 2D courier character sprite,
 hoodie and backpack,
 mid-walk pose,
 fanzine photocopy style,
 high contrast black white,
 green neon outline,
 flat sprite,
 transparent background",

    width: 64,

    height: 64,

  },


  // ── Projectiles & Effects ────────────────────────────────────────────────────
  {
    name: "crosshair",

    description: "Crosshair UI element — acid green",

    prompt:
      "Targeting crosshair circle,
 fanzine screen print style,
 acid green neon color,
 flat 2D,
 transparent background,
 game UI element",

    width: 64,

    height: 64,

  },

  {
    name: "crosshair_red",

    description: "Crosshair UI element — red (enemy lock-on)",

    prompt:
      "Targeting crosshair circle,
 red neon color,
 locked-on enemy indicator,
 fanzine screen print style,
 flat 2D,
 transparent background,
 game UI",

    width: 64,

    height: 64,

  },

  {
    name: "bullet_player",

    description: "Player bullet tracer sprite",

    prompt:
      "Yellow neon bullet tracer,
 fanzine style,
 glowing yellow dot,
 transparent background,
 game sprite",

    width: 16,

    height: 16,

  },

  {
    name: "bullet_enemy",

    description: "Enemy bullet tracer sprite",

    prompt:
      "Red neon bullet tracer,
 fanzine style,
 glowing red dot with trail,
 transparent background,
 enemy game sprite",

    width: 16,

    height: 16,

  },

  {
    name: "fx_explosion",

    description: "Explosion effect sprite",

    prompt:
      "Small explosion burst effect sprite,
 fanzine photocopy style,
 white flash with orange neon streaks,
 flat 2D,
 transparent background,
 game visual effect",

    width: 64,

    height: 64,

  },

  {
    name: "fx_hit",

    description: "Hit impact spark effect",

    prompt:
      "Impact hit spark effect sprite,
 star burst flash,
 white and yellow neon,
 fanzine style,
 flat 2D,
 transparent background,
 game hit effect",

    width: 32,

    height: 32,

  },

  {
    name: "fx_smoke",

    description: "Smoke cloud effect",

    prompt:
      "Small smoke cloud puff sprite,
 grey and black,
 fanzine photocopy grainy style,
 flat 2D,
 transparent background,
 game effect",

    width: 64,

    height: 64,

  },


  // ── HUD elements ─────────────────────────────────────────────────────────────
  {
    name: "hud_heart",

    description: "HUD — heart / life indicator",

    prompt:
      "Heart life icon,
 fanzine hand-drawn style,
 thick outline,
 neon red fill,
 flat 2D,
 transparent background,
 game HUD element",

    width: 32,

    height: 32,

  },

  {
    name: "hud_skull",

    description: "HUD — skull / death indicator",

    prompt:
      "Skull icon,
 fanzine punk style,
 thick outline,
 white on black,
 flat 2D,
 transparent background,
 game HUD death indicator",

    width: 32,

    height: 32,

  },

  {
    name: "hud_siren",

    description: "HUD — police siren icon",

    prompt:
      "Police siren light icon,
 fanzine photocopy style,
 alternating red and blue neon,
 flat 2D,
 transparent background,
 game HUD alarm indicator",

    width: 32,

    height: 32,

  },

  {
    name: "hud_vinyl",

    description: "HUD — vinyl record progress icon",

    prompt:
      "Vinyl record icon,
 fanzine hand-drawn style,
 thick outline,
 flat 2D,
 transparent background,
 game HUD collectible indicator",

    width: 32,

    height: 32,

  },

];

function sleep(ms) {
  return new Promise((r) => setTimeout(r,
 ms));
}

function fetchImage(url) {
  return new Promise((resolve,
 reject) => {
    https
      .get(url,
 (res) => {
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
        res.on("data",
 (chunk) => chunks.push(chunk));
        res.on("end",
 () => resolve(Buffer.concat(chunks)));
      })
      .on("error",
 reject);
  });
}

async function generateImage(asset,
 retries = 5) {
  const encodedPrompt = encodeURIComponent(asset.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${asset.width}&height=${asset.height}&nologo=true&model=flux&seed=${seed}`;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  [fetch] ${url.slice(0,
 80)}...`);
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
  const outPath = path.join(OUTPUT_DIR,
 `${asset.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${asset.name} — already exists`);
    return;
  }
  console.log(`\n  [gen]  ${asset.name} — ${asset.description}`);
  try {
    const imageBuffer = await generateImage(asset);
    fs.writeFileSync(outPath,
 imageBuffer);
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

  fs.mkdirSync(OUTPUT_DIR,
 { recursive: true });

  console.log(`Generating ${toGenerate.length} asset(s) → public/assets/\n`);
  for (const asset of toGenerate) {
    await generateAsset(asset);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:",
 err.message);
  process.exit(1);
});
