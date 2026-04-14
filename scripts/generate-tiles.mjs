#!/usr/bin/env node
/**
 * Tile sprite generator — Underground Paris
 * Sources (tried in order):
 *   1. Hugging Face Inference API (FLUX.1-schnell) — fast,
 free with HF_TOKEN env var
 *   2. Pollinations.ai — free,
 no API key,
 rate-limited
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
const OUTPUT_DIR = path.resolve(__dirname,
 "../public/assets/tiles");

const BASE_STYLE =
  "flat 2D game tile texture,
 dark night scene,
 fanzine photocopied style,
 neon accent,
 90s Paris building facade,
 pixel-crisp edges,
 no text,
 no watermark,
 seamless edges";

const TILES = [
  // ── Walls ────────────────────────────────────────────────────────────────────
  {
    name: "tile_wall",

    description: "Solid wall — Haussmann plaster",

    prompt: `Parisian Haussmann stone wall tile,
 aged dark grey plaster,
 subtle cracks,
 night lighting. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_cracked",

    description: "Wall — cracked and weathered",

    prompt: `Parisian building wall tile,
 heavily cracked plaster exposing brick underneath,
 peeling paint,
 urban decay,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_graffiti",

    description: "Wall — graffiti tags",

    prompt: `Urban building wall tile,
 spray-painted graffiti tags,
 stencil art,
 rave flyers pasted and torn,
 90s Paris banlieue,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_graffiti_large",

    description: "Wall — large graffiti piece",

    prompt: `Urban wall tile,
 large graffiti wildstyle piece,
 acid neon colors on dark stone,
 90s Paris subway style,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_poster",

    description: "Wall — rave flyers pasted",

    prompt: `Building wall tile covered in photocopied rave flyers,
 torn and overlapping posters,
 paste-up collage,
 90s Paris underground,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_brick",

    description: "Wall — exposed brick,
 banlieue",

    prompt: `Banlieue building wall tile,
 exposed red brick,
 crumbling mortar,
 industrial Paris suburb aesthetic,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_concrete",

    description: "Wall — brutalist concrete",

    prompt: `Brutalist concrete wall tile,
 raw cast concrete texture,
 formwork marks,
 70s housing estate Paris,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_tiles_facade",

    description: "Wall — ceramic facade tiles",

    prompt: `Parisian building facade ceramic tile cladding,
 small square ceramic tiles,
 grimy and cracked,
 typical 50s Paris apartment,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_ivy",

    description: "Wall — ivy-covered stone",

    prompt: `Stone wall tile with wild ivy growing across it,
 dark leaves at night,
 moisture and moss,
 old Paris courtyard. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_wall_stained",

    description: "Wall — water-stained plaster",

    prompt: `Plaster wall tile,
 heavy water staining from above,
 rust streaks,
 mildew marks,
 degraded Parisian building,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },


  // ── Windows ──────────────────────────────────────────────────────────────────
  {
    name: "tile_window_dark",

    description: "Window — shutters closed,
 no light",

    prompt: `Building window tile,
 dark interior,
 wooden shutters half-closed,
 iron railing,
 no light inside,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_lit",

    description: "Window — warm neon glow inside",

    prompt: `Building window tile,
 warm orange neon light inside,
 silhouette behind frosted glass,
 night scene. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_tv",

    description: "Window — TV flickering inside",

    prompt: `Building window tile,
 blue flickering TV light inside at night,
 no curtains,
 silhouette watching screen,
 90s. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_open",

    description: "Window — open,
 curtains blowing",

    prompt: `Building window tile,
 open window with curtains blowing in night breeze,
 warm interior light,
 Paris summer night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_boarded",

    description: "Window — boarded up with planks",

    prompt: `Building window tile,
 boarded up with rough planks of wood,
 nails visible,
 abandoned building,
 urban decay. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_bars",

    description: "Window — iron bars,
 rez-de-chaussée",

    prompt: `Ground floor building window tile,
 heavy iron security bars,
 dark interior,
 security grille,
 urban Paris. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_neon_sign",

    description: "Window — shop with neon sign",

    prompt: `Shop window tile at night,
 neon sign glow from inside,
 reflections on glass,
 90s Paris commercial building. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_window_small",

    description: "Window — small mansard attic window",

    prompt: `Small attic mansard window tile,
 zinc surround,
 tiny porthole style,
 rooftop level,
 night Paris silhouette. ${BASE_STYLE}`,

    width: 128,

    height: 64,

  },

  {
    name: "tile_window_shutters_open",

    description: "Window — volets ouverts,
 lumière froide",

    prompt: `Building window tile,
 green wooden shutters folded open,
 cold blue light inside,
 urban Paris,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },


  // ── Balconies ────────────────────────────────────────────────────────────────
  {
    name: "tile_balcony",

    description: "Balcony — wrought iron railing",

    prompt: `Parisian building balcony tile,
 decorative wrought iron railing,
 stone balustrade,
 narrow ledge,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_balcony_plants",

    description: "Balcony — with potted plants",

    prompt: `Parisian balcony tile,
 wrought iron railing,
 potted plants and herbs,
 laundry hanging,
 lived-in feel,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_balcony_laundry",

    description: "Balcony — laundry line hanging",

    prompt: `Building balcony tile,
 clothesline with laundry hanging,
 bra socks shirts flapping,
 urban Paris night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },


  // ── Rooftops ─────────────────────────────────────────────────────────────────
  {
    name: "tile_rooftop",

    description: "Rooftop — zinc,
 chimneys",

    prompt: `Parisian rooftop tile edge,
 zinc roof detail,
 chimney stack,
 attic window,
 night sky,
 silhouette. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_rooftop_satellite",

    description: "Rooftop — satellite dishes",

    prompt: `Parisian rooftop tile,
 multiple satellite dishes mounted,
 TV antennas,
 zinc roof,
 90s Paris skyline,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_rooftop_water_tower",

    description: "Rooftop — water tower",

    prompt: `Parisian building rooftop tile with wooden water tower structure,
 zinc surround,
 night sky silhouette. ${BASE_STYLE}`,

    width: 128,

    height: 256,

  },

  {
    name: "tile_rooftop_skylight",

    description: "Rooftop — velux skylight glowing",

    prompt: `Zinc rooftop tile with glowing velux skylight window,
 warm light escaping,
 night scene. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_rooftop_parapet",

    description: "Rooftop — stone parapet ledge",

    prompt: `Parisian building stone parapet wall tile,
 top ledge,
 chipped stone,
 iron finial details,
 night sky. ${BASE_STYLE}`,

    width: 128,

    height: 64,

  },


  // ── Doors & Entrances ────────────────────────────────────────────────────────
  {
    name: "tile_door",

    description: "Door — heavy wooden double door",

    prompt: `Parisian building entrance door tile,
 heavy wooden double door,
 stone surround,
 interphone,
 steps,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 256,

  },

  {
    name: "tile_door_metal",

    description: "Door — industrial metal fire door",

    prompt: `Industrial metal fire door tile,
 painted gray,
 push bar,
 no window,
 warehouse or squat entrance,
 90s Paris. ${BASE_STYLE}`,

    width: 128,

    height: 256,

  },

  {
    name: "tile_door_coded",

    description: "Door — coded entry with digicode",

    prompt: `Parisian apartment building door tile,
 digicode keypad on wall,
 interphone,
 metal door,
 coded entry,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 256,

  },

  {
    name: "tile_door_graffiti",

    description: "Door — tagged with graffiti",

    prompt: `Building entrance door tile,
 heavily tagged with spray graffiti,
 torn flyers pasted on,
 urban decay,
 squat aesthetic. ${BASE_STYLE}`,

    width: 128,

    height: 256,

  },


  // ── Ground Level ─────────────────────────────────────────────────────────────
  {
    name: "tile_shopfront_closed",

    description: "Shop — metal shutter closed",

    prompt: `Ground floor shop tile,
 metal rolling shutter pulled down,
 graffiti tags on shutter,
 night time. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_shopfront_bar",

    description: "Shop — bar café,
 lights on",

    prompt: `Ground floor bar cafe tile,
 neon sign glowing,
 window steamed up,
 90s Paris zinc bar,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },

  {
    name: "tile_basement_window",

    description: "Basement — frosted half-window",

    prompt: `Below-ground basement frosted glass window tile,
 metal bars,
 partially buried,
 dim light within,
 Paris cellar. ${BASE_STYLE}`,

    width: 128,

    height: 64,

  },

  {
    name: "tile_garage_door",

    description: "Garage — rolling metal gate",

    prompt: `Building garage rolling metal gate tile,
 corrugated metal,
 handles,
 oil stains on ground,
 Paris building. ${BASE_STYLE}`,

    width: 128,

    height: 128,

  },


  // ── Special / Atmospheric ────────────────────────────────────────────────────
  {
    name: "tile_drainpipe",

    description: "Drainpipe — zinc vertical",

    prompt: `Building exterior zinc drainpipe tile,
 vertical pipe running down wall,
 brackets,
 aged patina,
 Paris facade. ${BASE_STYLE}`,

    width: 32,

    height: 128,

  },

  {
    name: "tile_vent_grate",

    description: "Vent — metal wall grate",

    prompt: `Metal ventilation grate tile on building wall,
 rusty iron,
 dark beyond,
 industrial Paris building. ${BASE_STYLE}`,

    width: 64,

    height: 64,

  },

  {
    name: "tile_street_lamp",

    description: "Street lamp — Parisian lamp post",

    prompt: `Parisian street lamp tile,
 art nouveau iron post,
 warm orange sodium light,
 glowing orb,
 night street. ${BASE_STYLE}`,

    width: 64,

    height: 256,

  },

  {
    name: "tile_corner_pillar",

    description: "Corner — stone pillar with carvings",

    prompt: `Parisian building corner stone pillar tile,
 carved decorative details,
 haussmann ornamental plaster,
 night. ${BASE_STYLE}`,

    width: 64,

    height: 128,

  },

  {
    name: "tile_cornice",

    description: "Cornice — decorative plaster border",

    prompt: `Parisian building facade cornice tile,
 decorative plaster frieze,
 egg-and-dart molding,
 Haussmann detail,
 night. ${BASE_STYLE}`,

    width: 128,

    height: 32,

  },

];

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r,
 ms));
}

function fetchUrl(url,
 options = {}) {
  return new Promise((resolve,
 reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(url,
 options,
 (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location,
 options).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data",
 (c) => chunks.push(c));
      res.on("end",
 () => resolve(Buffer.concat(chunks)));
    });
    req.on("error",
 reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Source: Pollinations.ai ───────────────────────────────────────────────────

async function generatePollinations(tile,
 retries = 4) {
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

async function generateHuggingFace(tile,
 retries = 3) {
  const HF_TOKEN = process.env.HF_TOKEN ?? "";
  const model = "black-forest-labs/FLUX.1-schnell";
  const url = `https://api-inference.huggingface.co/models/${model}`;

  const body = JSON.stringify({
    inputs: tile.prompt,

    parameters: { width: tile.width,
 height: tile.height,
 num_inference_steps: 4 },

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
      const buf = await fetchUrl(url,
 options);
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

async function generateTile(tile,
 source) {
  const outPath = path.join(OUTPUT_DIR,
 `${tile.name}.png`);
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
    fs.writeFileSync(outPath,
 buf);
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

  fs.mkdirSync(OUTPUT_DIR,
 { recursive: true });
  console.log(`\nGenerating ${toGenerate.length} tile(s) → public/assets/tiles/\n`);

  for (const tile of toGenerate) {
    await generateTile(tile,
 source);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:",
 err.message);
  process.exit(1);
});
