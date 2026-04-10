#!/usr/bin/env node
/**
 * Tile sprite generator — Underground Paris
 * Sources (tried in order):
 *   1. Hugging Face Inference API (FLUX.1-schnell) — fast, free with HF_TOKEN env var
 *   2. Pollinations.ai — free, no API key, rate-limited
 *
 * Usage:
 *   node scripts/generate-tiles.mjs
 *   node scripts/generate-tiles.mjs --tile tile_wall
 *   node scripts/generate-tiles.mjs --source pollinations
 *   node scripts/generate-tiles.mjs --source huggingface
 *   node scripts/generate-tiles.mjs --list
 *
 * HF_TOKEN env var optional but recommended (avoids rate limits):
 *   HF_TOKEN=hf_xxx node scripts/generate-tiles.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/assets/tiles");

const BASE_STYLE =
  "flat 2D game tile texture, dark night scene, fanzine photocopied style, neon accent, 90s Paris building facade, pixel-crisp edges, no text, no watermark, seamless edges";

const TILES = [
  {
    name: "tile_wall",
    description: "Solid wall — Haussmann plaster",
    prompt: `Parisian Haussmann stone wall tile, aged dark grey plaster, subtle cracks, night lighting. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_window_dark",
    description: "Dark window — shutters, no light",
    prompt: `Building window tile, dark interior, wooden shutters half-closed, iron railing, no light inside, night. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_window_lit",
    description: "Lit window — warm neon glow inside",
    prompt: `Building window tile, warm orange neon light inside, silhouette behind frosted glass, night scene. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_rooftop",
    description: "Rooftop edge — zinc, chimneys",
    prompt: `Parisian rooftop tile edge, zinc roof detail, chimney stack, attic window, night sky, silhouette. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "tile_door",
    description: "Ground floor door — heavy wood",
    prompt: `Parisian building entrance door tile, heavy wooden double door, stone surround, interphone, steps, night. ${BASE_STYLE}`,
    width: 128,
    height: 256,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location, options).then(resolve).catch(reject);
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
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Source: Pollinations.ai ───────────────────────────────────────────────────

async function generatePollinations(tile, retries = 4) {
  const encoded = encodeURIComponent(tile.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${tile.width}&height=${tile.height}&nologo=true&model=flux&seed=${seed}`;

  for (let i = 0; i < retries; i++) {
    try {
      const buf = await fetchUrl(url);
      if (buf.length < 2000) throw new Error("response too small (probably error image)");
      return buf;
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 20000;
        console.log(`  [pollinations retry ${i + 1}] ${e.message} — waiting ${wait / 1000}s`);
        await sleep(wait);
      } else {
        throw e;
      }
    }
  }
}

// ── Source: Hugging Face Inference API (FLUX.1-schnell) ──────────────────────

async function generateHuggingFace(tile, retries = 3) {
  const HF_TOKEN = process.env.HF_TOKEN ?? "";
  const model = "black-forest-labs/FLUX.1-schnell";
  const url = `https://api-inference.huggingface.co/models/${model}`;

  const body = JSON.stringify({
    inputs: tile.prompt,
    parameters: { width: tile.width, height: tile.height, num_inference_steps: 4 },
  });

  const headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
  };

  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    method: "POST",
    headers,
    body,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const buf = await fetchUrl(url, options);
      if (buf.length < 2000) throw new Error("response too small");
      // Check it's actually an image (starts with PNG or JPEG magic bytes)
      const isPng = buf[0] === 0x89 && buf[1] === 0x50;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
      if (!isPng && !isJpeg) throw new Error("response is not a valid image");
      return buf;
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 10000;
        console.log(`  [huggingface retry ${i + 1}] ${e.message} — waiting ${wait / 1000}s`);
        await sleep(wait);
      } else {
        throw e;
      }
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function generateTile(tile, source) {
  const outPath = path.join(OUTPUT_DIR, `${tile.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${tile.name} — already exists`);
    return;
  }
  console.log(`  [gen]  ${tile.name} (${source}) — ${tile.description}`);

  let buf = null;

  if (source === "huggingface" || source === "auto") {
    try {
      buf = await generateHuggingFace(tile);
      console.log(`  [ok]   ${tile.name} via huggingface (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [warn] huggingface failed: ${e.message}`);
      if (source === "auto") {
        console.log(`  [try]  falling back to pollinations…`);
      }
    }
  }

  if (buf === null && (source === "pollinations" || source === "auto")) {
    try {
      buf = await generatePollinations(tile);
      console.log(`  [ok]   ${tile.name} via pollinations (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] pollinations failed: ${e.message}`);
    }
  }

  if (buf !== null) {
    fs.writeFileSync(outPath, buf);
    console.log(`  [saved] → public/assets/tiles/${tile.name}.png`);
  } else {
    console.log(`  [skip] ${tile.name} — all sources failed`);
  }

  await sleep(2000);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available tiles:");
    TILES.forEach((t) => console.log(`  ${t.name.padEnd(24)} ${t.description}`));
    return;
  }

  const sourceArg = args.indexOf("--source");
  const source = sourceArg !== -1 ? (args[sourceArg + 1] ?? "auto") : "auto";
  console.log(`Source: ${source}${source === "huggingface" && !process.env.HF_TOKEN ? " (no HF_TOKEN — may be rate limited)" : ""}`);

  const targetIdx = args.indexOf("--tile");
  const target = targetIdx !== -1 ? args[targetIdx + 1] : null;
  const toGenerate = target ? TILES.filter((t) => t.name === target) : TILES;

  if (target && toGenerate.length === 0) {
    console.error(`Tile "${target}" not found. Use --list.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`\nGenerating ${toGenerate.length} tile(s) → public/assets/tiles/\n`);

  for (const tile of toGenerate) {
    await generateTile(tile, source);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
