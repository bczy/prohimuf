#!/usr/bin/env node
/**
 * Generate the street-courier (livreur) LAYERED flipbook sprites — a delivery
 * BIKE (wheel rotation) drawn UNDER a RIDER (pedaling cycle), composited as two
 * stacked planes render-side (src/render/scene/CourierSprite.tsx, ADR 0016/0017).
 *
 * PER-FRAME GENERATION (ADR 0017, amended). Each frame is ONE dedicated FLUX
 * image: the layer's base prompt + that frame's pose clause, under the layer's
 * SINGLE pinned seed (same seed + near-identical prompt => stable composition
 * for a rigid subject, so only the described delta moves). The whole subject
 * appears in every image — nothing is ever sliced out of a larger picture.
 * (The original strip-and-slice strategy was retired after two CI iterations:
 * FLUX would not respect per-cell containment and subjects were cut across
 * cells.) Each PNG is chroma-keyed per file (cutout-enemies.mjs cutout(), the
 * same black-ground keyer the enemies use). Frame consistency depends on the
 * shared seed, so a layer stays ATOMIC: if ANY of its frame files is missing
 * (or FORCE=1), ALL its frames regenerate together.
 *
 * Single source of truth: the `courier` block of src/game/levels/levelArt.json
 * (opening, style, size, per-layer seed/prompt/frames/scale/offsetY). Add or tune
 * a layer THERE, never in this script (mirrors gen-vehicle-sprites.mjs reading
 * `vehicles` and gen-enemy-types.mjs reading `enemies`).
 *
 * Files (frame 1 unsuffixed, frame N>=2 gets an `_f<N>` suffix inserted before
 * `.png`): public/assets/courier/<layer>.png + <layer>_f2..<layer>_fN.png.
 *
 * Network image generation (Pollinations/FLUX) is normally blocked in the local
 * sandbox, so this normally runs in CI (.github/workflows/gen-courier-sprites.yml,
 * which installs @napi-rs/canvas BEFORE the generator — slicing hard-requires it).
 * When the network is unavailable you can still fill the slots with
 * dependency-free PROCEDURAL placeholders (--placeholder / PLACEHOLDER=1) so the
 * composite render is not empty; those are for local testing only, never committed.
 *
 * Usage:
 *   node scripts/gen-courier-sprites.mjs                 # generate missing layers (network FLUX)
 *   FORCE=1 node scripts/gen-courier-sprites.mjs         # regenerate ALL layers (network FLUX)  [CI]
 *   node scripts/gen-courier-sprites.mjs --layer bike    # restrict to one layer (art-gate iteration)
 *   node scripts/gen-courier-sprites.mjs --placeholder   # write procedural placeholder frames (no network)
 *   node scripts/gen-courier-sprites.mjs --list          # list defined layers + frame files
 */
import fs from "fs";
import path from "path";
import https from "https";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets/courier");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Load the courier layer definitions from levelArt.json (single source) ─────
// Fails fast on any contract violation so a malformed manifest never serializes
// a broken FLUX URL (mirrors loadEnemies' fail-fast seed guard).
//
// Per-frame prompt assembly (the exact string sent to FLUX, one call per frame):
//   opening + prompt + ", " + frames[i] + style
// Every frame of a layer shares the SAME pinned seed so the composition stays
// stable and only the pose clause moves.
function loadCourier() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.courier;
  if (!block || !block.layers) {
    throw new Error(`No "courier.layers" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const opening = block.opening ?? "";
  const style = block.style ?? "";
  if (typeof opening !== "string" || !opening.trim()) {
    throw new Error(
      "courier.opening: missing or empty — it is interpolated into every paid prompt",
    );
  }
  if (typeof style !== "string" || !style.trim()) {
    throw new Error("courier.style: missing or empty — it is interpolated into every paid prompt");
  }
  const cellW = block.size?.width ?? 256;
  const cellH = block.size?.height ?? 256;

  const layers = Object.entries(block.layers).map(([name, def]) => {
    if (!Number.isInteger(def?.seed) || def.seed <= 0) {
      throw new Error(`courier.layers.${name}: missing or non-positive integer "seed"`);
    }
    const prompt = def.prompt ?? "";
    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new Error(`courier.layers.${name}: missing or empty "prompt"`);
    }
    const frames = def.frames;
    // Same 2..8 bound the prompt gate and the consistency test enforce — the
    // three validators must agree on what a valid layer is.
    if (!Array.isArray(frames) || frames.length < 2 || frames.length > 8) {
      throw new Error(`courier.layers.${name}: "frames" must be an array of 2-8 pose clauses`);
    }
    frames.forEach((c, i) => {
      if (typeof c !== "string" || !c.trim()) {
        throw new Error(`courier.layers.${name}: frames[${i}] must be a non-empty pose clause`);
      }
    });

    // Per-frame file list: frame 1 unsuffixed, frame N>=2 gets `_f<N>` inserted
    // before the extension (courier layer keys carry NO `enemy_` prefix, so the
    // enemy batch glob /^enemy_.*\.png$/ never touches these files).
    const files = frames.map((_, i) => (i === 0 ? `${name}.png` : `${name}_f${i + 1}.png`));
    // One full prompt per frame: whole subject in every image, only the pose
    // clause varies, seed shared across the layer.
    const framePrompts = frames.map((clause) => `${opening}${prompt}, ${clause}${style}`);

    return {
      name,
      asset: def.asset ?? `assets/courier/${name}.png`,
      seed: def.seed,
      prompt,
      frames,
      scale: def.scale ?? 1.0,
      offsetY: def.offsetY ?? 0.0,
      cellW,
      cellH,
      files,
      framePrompts,
    };
  });

  return { opening, style, layers };
}

// ── Pollinations / FLUX fetch helpers (mirror gen-enemy-types.mjs) ────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Bounded redirects + a socket timeout so a stalled Pollinations response can
// never hang the paid CI job until the runner's 6h kill.
function fetchImage(url, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        if (depth >= 5) {
          reject(new Error("too many redirects"));
          return;
        }
        if (!res.headers.location) {
          reject(new Error(`HTTP ${res.statusCode} without a Location header`));
          return;
        }
        fetchImage(new URL(res.headers.location, url).href, depth + 1)
          .then(resolve)
          .catch(reject);
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
    req.setTimeout(120000, () => req.destroy(new Error("response timeout (120s)")));
  });
}

async function fetchWithRetry(url, retries = 5) {
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

// enhance=false is load-bearing (art bible §3.11): Pollinations' enhancer rewrites
// the prompt through an LLM and destroys the verbatim style block the set
// consistency depends on. private=true keeps assets out of the public feed.
function fluxUrl(prompt, seed, width, height) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}&enhance=false&private=true&safe=false`;
}

// ── Reuse the enemy edge flood-fill keyer per sliced frame ────────────────────
// The strip is generated on the shared black ground, so each sliced cell is keyed
// with the same cutout() the enemies use. Soft-skip when @napi-rs/canvas is absent
// (the real key runs in CI); slicing itself HARD-requires the decoder, so if we
// reach here the module is already loadable — this guard is belt-and-braces.
async function tryCutout(file, name) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    // Only an absent decoder is a benign skip (local sandbox). Any OTHER cutout
    // failure means a sliced frame could not be keyed — rethrow so the run fails
    // loudly instead of committing an un-keyed black-square frame.
    if (e.code === "ERR_MODULE_NOT_FOUND") {
      console.log(`  [cutout-skip] ${name} — decoder absent (chroma-key runs in CI)`);
      return;
    }
    throw e;
  }
}

// ── Dependency-free PNG writer (8-bit RGBA) for procedural placeholders ────────
// Identical detour to gen-vehicle-sprites.mjs so `yarn dev` shows a moving courier
// before CI runs. Placeholders are already transparent (no keying step needed).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const FIGURE = [220, 220, 230]; // pale grey, matches the "light grey white" house figure tone

// Tiny drawing surface over a transparent RGBA buffer.
function surface(W, H) {
  const px = Buffer.alloc(W * H * 4); // transparent
  const set = (x, y, r, g, b) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const o = (y * W + x) * 4;
    px[o] = r;
    px[o + 1] = g;
    px[o + 2] = b;
    px[o + 3] = 255;
  };
  return {
    px,
    fillRect(x0, y0, x1, y1, [r, g, b]) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, r, g, b);
    },
    ring(cx, cy, rad, [r, g, b], t = 3) {
      const inner = (rad - t) * (rad - t);
      const outer = rad * rad;
      for (let y = -rad; y <= rad; y++)
        for (let x = -rad; x <= rad; x++) {
          const d = x * x + y * y;
          if (d <= outer && d >= inner) set(cx + x, cy + y, r, g, b);
        }
    },
    // Spoke from the hub out to the rim at the given angle.
    spoke(cx, cy, rad, ang, [r, g, b]) {
      for (let s = 0; s <= rad; s++) set(cx + Math.cos(ang) * s, cy + Math.sin(ang) * s, r, g, b);
    },
  };
}

// bike cell: two spoked wheels whose 3 spokes rotate 0°/120°/240° per frame,
// joined by a simple frame line — enough to read as a rolling bicycle in a flip.
function drawBikePlaceholder(i, W, H) {
  const s = surface(W, H);
  const rad = Math.round(H * 0.16);
  const cy = Math.round(H * 0.7);
  const rearX = Math.round(W * 0.3);
  const frontX = Math.round(W * 0.7);
  const rot = (i * 120 * Math.PI) / 180;
  for (const cx of [rearX, frontX]) {
    s.ring(cx, cy, rad, FIGURE, 3);
    for (let k = 0; k < 3; k++) s.spoke(cx, cy, rad - 2, rot + (k * 2 * Math.PI) / 3, FIGURE);
  }
  // frame: chainstay + seat/head tubes, a crude step-through triangle.
  s.fillRect(rearX, cy - 2, frontX, cy + 1, FIGURE);
  const topY = Math.round(H * 0.44);
  s.fillRect(rearX, topY, rearX + 2, cy, FIGURE); // seat tube
  s.fillRect(frontX - 2, topY, frontX, cy, FIGURE); // head tube
  s.fillRect(rearX, topY, frontX, topY + 2, FIGURE); // top run
  return encodePng(W, H, s.px);
}

// rider cell: a blocky standing figure (helmet, backpack, leaning torso) whose two
// legs swap extended/folded per frame — the pedaling stride the strip encodes.
function drawRiderPlaceholder(i, W, H) {
  const s = surface(W, H);
  const cx = Math.round(W * 0.5);
  // head + helmet
  s.fillRect(cx - 14, Math.round(H * 0.2), cx + 12, Math.round(H * 0.3), FIGURE);
  // backpack (behind the shoulders, to the left = rear)
  s.fillRect(cx - 30, Math.round(H * 0.28), cx - 14, Math.round(H * 0.5), FIGURE);
  // torso, leaning forward (top narrower toward the right)
  s.fillRect(cx - 14, Math.round(H * 0.3), cx + 14, Math.round(H * 0.58), FIGURE);
  // arm reaching down-forward to the bars
  s.fillRect(cx + 8, Math.round(H * 0.34), cx + 26, Math.round(H * 0.4), FIGURE);
  s.fillRect(cx + 20, Math.round(H * 0.34), cx + 26, Math.round(H * 0.56), FIGURE);
  // legs: swap which is extended (down) vs folded (up) on alternating frames.
  const hipY = Math.round(H * 0.58);
  const downY = Math.round(H * 0.82);
  const midY = Math.round(H * 0.7);
  const extendedFront = i % 2 === 0;
  const frontLeg = extendedFront ? downY : midY;
  const backLeg = extendedFront ? midY : downY;
  s.fillRect(cx + 2, hipY, cx + 10, frontLeg, FIGURE); // front leg
  s.fillRect(cx - 10, hipY, cx - 2, backLeg, FIGURE); // back leg
  return encodePng(W, H, s.px);
}

function drawPlaceholderCells(layer) {
  const draw = layer.name === "bike" ? drawBikePlaceholder : drawRiderPlaceholder;
  return layer.frames.map((_, i) => draw(i, layer.cellW, layer.cellH));
}

// ── Atomic layer regeneration: skip only when EVERY frame file exists ─────────
// Returns null when the layer can be skipped, otherwise the loud reason string.
function regenReason(layer) {
  if (FORCE) return "FORCE=1";
  const missing = layer.files.find((f) => !fs.existsSync(path.join(OUT_DIR, f)));
  return missing ? `${missing} missing; layer is atomic` : null;
}

// Fetch every frame of a layer — one FLUX call per frame under the layer's
// shared pinned seed, the whole subject in every image. Collects ALL buffers
// before returning so the caller can write them atomically — a failed fetch
// leaves nothing half-written.
async function fetchLayerFrames(layer) {
  const cells = [];
  for (let i = 0; i < layer.framePrompts.length; i++) {
    console.log(
      `  [gen]  ${layer.files[i]} — frame ${i + 1}/${layer.frames.length} (flux, seed=${layer.seed})`,
    );
    cells.push(
      await fetchWithRetry(fluxUrl(layer.framePrompts[i], layer.seed, layer.cellW, layer.cellH)),
    );
    await sleep(2000);
  }
  return cells;
}

async function main() {
  const args = process.argv.slice(2);
  let { layers } = loadCourier();

  // --layer <name>: restrict the run to one layer (art-gate iteration flow —
  // e.g. rework the bike while the rider is on hold).
  const layerFlag = args.indexOf("--layer");
  if (layerFlag !== -1) {
    const wanted = args[layerFlag + 1];
    layers = layers.filter((l) => l.name === wanted);
    if (layers.length === 0) {
      throw new Error(`--layer ${wanted}: no such layer in courier.layers`);
    }
  }

  if (args.includes("--list")) {
    console.log("Defined courier layers (from levelArt.json):");
    for (const l of layers) {
      console.log(
        `  ${l.name.padEnd(6)} ${l.frames.length} frames ${l.cellW}x${l.cellH}  → ${l.files.join(", ")}`,
      );
    }
    return;
  }

  const placeholder = args.includes("--placeholder") || process.env.PLACEHOLDER === "1";
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `Courier layered flipbook → ${path.relative(ROOT, OUT_DIR)}${placeholder ? " (placeholder mode)" : ""}\n`,
  );

  // Track per-layer failures: CI is the ONLY place FLUX is reachable, so a
  // swallowed failure here would commit a partial layer set with a green run.
  let failures = 0;
  for (const layer of layers) {
    const reason = regenReason(layer);
    if (!reason) {
      console.log(`  [skip] ${layer.name} (all ${layer.files.length} frames exist)`);
      continue;
    }
    console.log(`  [regen-all] ${layer.name} — ${reason}`);

    // Collect ALL frame buffers first, then write — never a half-written layer.
    let cells;
    if (placeholder) {
      cells = drawPlaceholderCells(layer);
    } else {
      try {
        cells = await fetchLayerFrames(layer);
      } catch (e) {
        console.log(`  [fail] ${layer.name} — frame fetch failed: ${e.message}; nothing written`);
        failures++;
        continue;
      }
    }

    // Atomic write: every frame of the layer is (over)written together.
    layer.files.forEach((f, i) => {
      fs.writeFileSync(path.join(OUT_DIR, f), cells[i]);
    });
    console.log(
      `  [ok]   ${layer.name} — wrote ${layer.files.length} frames: ${layer.files.join(", ")}`,
    );

    if (!placeholder) {
      for (const f of layer.files) await tryCutout(path.join(OUT_DIR, f), layer.name);
      await sleep(2000);
    }
  }

  console.log("\nDone.");
  if (failures > 0) {
    console.error(
      `${failures} layer(s) failed to generate — exiting non-zero so a partial set can never commit green.`,
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
