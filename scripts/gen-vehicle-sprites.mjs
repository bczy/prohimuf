#!/usr/bin/env node
/**
 * Generate the delivery-vehicle sprites (truck / car / moto) for the scripted
 * "protect the delivery" beat. Side-profile view — they roll horizontally down
 * the street lane where the couriers run — in the house style: pure photocopied
 * fanzine B&W (the neon rim is drawn render-side per ADR 0011, no longer baked
 * into the sprite), generated on a flat SATURATED CHROMA-KEY ground (bright
 * magenta #FF3CDC, authored in levelArt.json `vehicles.style`) that is then keyed
 * to transparency. Serge's keying switch off #000000: B&W-on-black gets
 * flood-eaten; the saturated key keys cleanly. Keying reuses the corner-adaptive
 * edge flood-fill in cutout-enemies.mjs (imported below) — it samples the ground
 * colour from the corners, so it handles ANY flat ground (verified on magenta),
 * and a pure-B&W body is maximally distant from magenta so it is never eaten.
 *
 * Single source of truth: the `vehicles` block of
 * src/game/levels/levelArt.json (prompts, sizes, neon accent, output path).
 * Add/tune a vehicle there, never here.
 *
 * Naming contract (renderer + gameplay lanes align on this):
 *   public/assets/vehicles/{truck,car,moto}.png   (vehicleType "truck"|"car"|"moto")
 *
 * Hero lock (ADR-0043): when `references/approved/heroes.json` has a reigning
 * hero for a vehicle type, generation switches from flux to `kontext` img2img
 * conditioned on that frozen reference (same-slot STRONG lock) — see
 * `resolveHeroImageUrl` below. No hero declared ⇒ exactly today's behaviour.
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to
 * regenerate everything. Network image generation (Pollinations/FLUX) is often
 * blocked in the local sandbox, so this normally runs in CI. When the network
 * is unavailable you can still fill the slots with dependency-free procedural
 * placeholders (--placeholder / PLACEHOLDER=1) so the render is not empty.
 *
 * Usage:
 *   node scripts/gen-vehicle-sprites.mjs                # generate missing (network FLUX)
 *   FORCE=1 node scripts/gen-vehicle-sprites.mjs        # regenerate all (network FLUX)  [CI]
 *   node scripts/gen-vehicle-sprites.mjs --placeholder  # write procedural placeholders (no network)
 *   node scripts/gen-vehicle-sprites.mjs --asset truck  # one type only
 *   node scripts/gen-vehicle-sprites.mjs --reprocess    # desaturate existing PNGs in place (no regen)
 *   node scripts/gen-vehicle-sprites.mjs --list         # list defined vehicles
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath, pathToFileURL } from "url";
import { sleep, fetchWithRetry, buildRequestUrl } from "./lib/pollinations.mjs";
import { loadHeroRegistry, heroForSlot, heroRawUrl, resolveRepoSha } from "./lib/heroes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets/vehicles");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// ── Load the vehicle definitions from levelArt.json (single source) ──────────
// Prompt assembly contract (owned by the concept-artist lane, see
// docs/art-direction.md): `opening` (medium+view, front-loaded — FLUX weighs
// early tokens most) + per-type `prompt` (subject/silhouette only) + the
// shared `style` block, verbatim across the set for family consistency.
//
// ADR 0011 (render-side neon rim): `neonPhrase` is RETIRED — baked neon flooded
// the FLUX body, so vehicles are generated PURE B&W and the rim is drawn at
// runtime in src/render. The slot is now empty/absent and injects NOTHING. The
// per-type `neon` field is kept as RENDER METADATA (name → hue for the runtime
// rim); it is deliberately NOT concatenated into the prompt. If a future baked
// pipeline is ever wired, a non-empty `neonPhrase` with a {neon}/{hex} template
// would resolve here again — but the default when the slot is absent stays EMPTY
// so we never silently re-inject the flood token.
const NEON_HEX = {
  orange: "#FF8C14",
  cyan: "#28F0FF",
  magenta: "#FF3CDC",
  green: "#78FF3C",
};

function loadVehicles() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.vehicles;
  if (!block || !block.types) {
    throw new Error(`No "vehicles.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const opening = block.opening ?? "";
  const styleSuffix = block.style ?? "";
  // ADR 0011: default EMPTY (not a baked-neon phrase) when absent, and an empty
  // string is honoured as-is → the assembled prompt injects no neon token.
  const neonPhrase = block.neonPhrase ?? "";
  return Object.entries(block.types).map(([type, def]) => {
    // `neon` is render metadata only; when neonPhrase is empty this resolves to
    // an empty string and nothing is added to the prompt.
    const neon = def.neon ?? "cyan";
    const neonPart = neonPhrase
      .replaceAll("{neon}", neon)
      .replaceAll("{hex}", NEON_HEX[neon] ?? NEON_HEX.cyan);
    return {
      type,
      prompt: `${opening}${def.prompt}${neonPart}${styleSuffix}`,
      width: def.size?.width ?? 256,
      height: def.size?.height ?? 160,
      neon,
      // Pinned seed → reproducible rolls, reviewable diffs (REROLL=1 ignores it).
      seed: Number.isInteger(def.seed) && process.env.REROLL !== "1" ? def.seed : null,
    };
  });
}

// ── Pollinations / FLUX fetch — via the shared lib (ADR-0043), no private copy ──
// sleep/fetchImage/fetchWithRetry used to be duplicated here (drifted from
// gen-enemy-types.mjs's copies); both generators now share one implementation.

// Hero resolution (ADR-0043 §2, same-slot STRONG kontext lock). ALWAYS
// hero-locked when a hero is declared — the REROLL=1 "ignore the reigning
// hero" bypass lives ONLY in `generate()`'s wrapper below (MINEUR-3), so this
// shared resolver (and `planVehicleRequest`, which is also the guard's
// planning path) stays env-independent.
function resolveHeroImageUrl(type, registry, repo, sha) {
  const hero = heroForSlot(registry, "vehicles", type);
  return hero ? heroRawUrl(hero.approved, { repo, sha }) : undefined;
}

// One per-vehicle descriptor builder — `planRequests` AND `generate()` both
// consume this SAME function, so scripts/check-hero-wiring.mjs (ADR-0043
// Layer B) verifies the EXECUTED request a real run sends, not a parallel
// reconstruction (MAJEUR-2). `seed` is threaded in by the caller
// (`planRequests`'s planning seed vs `generate()`'s runtime seed) — it never
// changes `image=` (seed-independent, see loadVehicles above).
function planVehicleRequest(v, { repo, sha, registry, seed }) {
  const imageUrl = resolveHeroImageUrl(v.type, registry, repo, sha);
  return {
    type: v.type,
    imageUrl,
    url: buildRequestUrl({ prompt: v.prompt, seed, width: v.width, height: v.height, imageUrl }),
  };
}

// Pure, network-free: the exact per-vehicle request URL `generate()` below
// would send, so scripts/check-hero-wiring.mjs (ADR-0043 Layer B) can assert a
// declared hero really reaches `image=` WITHOUT spending a network call.
// Generation and the guard both go through buildRequestUrl — they cannot
// diverge.
export function planRequests({ repo, sha, registry } = {}) {
  const resolved = resolveRepoSha({ repo, sha });
  const reg = registry ?? loadHeroRegistry(ROOT);
  return loadVehicles().map((v) => {
    // Planning-only seed substitute — a real run picks a fresh random seed
    // when unpinned; harmless because `image=` never depends on seed.
    const seed = v.seed ?? 1;
    return planVehicleRequest(v, { repo: resolved.repo, sha: resolved.sha, registry: reg, seed });
  });
}

async function generate(v) {
  const registry = loadHeroRegistry(ROOT);
  const { repo, sha } = resolveRepoSha();
  const seed = v.seed ?? Math.floor(Math.random() * 99999);
  // REROLL=1 intentionally ignores the reigning hero for THIS exploration
  // run — locking a fresh design attempt onto the OLD hero via kontext would
  // defeat the point (the whole reason to reroll). This is the ONLY place
  // that bypass exists; `planVehicleRequest` above always returns the
  // hero-locked plan, so the guard's wiring check stays env-independent.
  //
  // enhance=false is load-bearing: Pollinations' enhancer rewrites the prompt
  // through an LLM and destroys the verbatim shared style block the set
  // consistency depends on. private=true keeps assets out of the public feed.
  const { imageUrl, url } =
    process.env.REROLL === "1"
      ? {
          imageUrl: undefined,
          url: buildRequestUrl({ prompt: v.prompt, seed, width: v.width, height: v.height }),
        }
      : planVehicleRequest(v, { repo, sha, registry, seed });
  console.log(
    `  [seed] ${v.type} seed=${seed}${v.seed != null ? " (pinned)" : ""}` +
      (imageUrl ? " — hero-locked (KONTEXT)" : ""),
  );
  return fetchWithRetry(url);
}

// ── Dependency-free PNG writer (8-bit RGBA) for procedural placeholders ───────
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

const NEON_RGB = {
  orange: [255, 140, 20],
  cyan: [40, 240, 255],
  magenta: [255, 60, 220],
  green: [120, 255, 60],
};

// Draw a recognisable side-profile placeholder: dark body + wheels with a
// bright neon rim on a transparent background (already "cut out", no keying
// needed). Distinct proportions per type read as truck / car / moto.
function drawPlaceholder(v) {
  const W = v.width;
  const H = v.height;
  const px = Buffer.alloc(W * H * 4); // transparent
  const [nr, ng, nb] = NEON_RGB[v.neon] ?? NEON_RGB.cyan;
  const BODY = [26, 26, 30];

  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const o = (y * W + x) * 4;
    px[o] = r;
    px[o + 1] = g;
    px[o + 2] = b;
    px[o + 3] = a;
  };
  const fillRect = (x0, y0, x1, y1, r, g, b) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, r, g, b, 255);
  };
  const strokeRect = (x0, y0, x1, y1, r, g, b, t = 3) => {
    fillRect(x0, y0, x1, y0 + t - 1, r, g, b);
    fillRect(x0, y1 - t + 1, x1, y1, r, g, b);
    fillRect(x0, y0, x0 + t - 1, y1, r, g, b);
    fillRect(x1 - t + 1, y0, x1, y1, r, g, b);
  };
  const disc = (cx, cy, rad, r, g, b) => {
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++)
        if (x * x + y * y <= rad * rad) set(cx + x, cy + y, r, g, b, 255);
  };
  const ring = (cx, cy, rad, r, g, b) => {
    const inner = (rad - 3) * (rad - 3);
    const outer = rad * rad;
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++) {
        const d = x * x + y * y;
        if (d <= outer && d >= inner) set(cx + x, cy + y, r, g, b, 255);
      }
  };

  const wheelR = Math.round(H * 0.16);
  const wheelY = H - wheelR - 4;
  const wheel = (cx) => {
    disc(cx, wheelY, wheelR, BODY[0], BODY[1], BODY[2]);
    ring(cx, wheelY, wheelR, nr, ng, nb);
  };

  if (v.type === "truck") {
    const bx0 = Math.round(W * 0.06);
    const bx1 = Math.round(W * 0.94);
    const boxTop = Math.round(H * 0.14);
    const cabX = Math.round(W * 0.72);
    // cargo box
    fillRect(bx0, boxTop, cabX, wheelY, BODY[0], BODY[1], BODY[2]);
    strokeRect(bx0, boxTop, cabX, wheelY, nr, ng, nb);
    // cab (lower, to the right)
    const cabTop = Math.round(H * 0.34);
    fillRect(cabX, cabTop, bx1, wheelY, BODY[0], BODY[1], BODY[2]);
    strokeRect(cabX, cabTop, bx1, wheelY, nr, ng, nb);
    wheel(Math.round(W * 0.24));
    wheel(Math.round(W * 0.82));
  } else if (v.type === "car") {
    const bx0 = Math.round(W * 0.06);
    const bx1 = Math.round(W * 0.94);
    const bodyTop = Math.round(H * 0.42);
    const roofX0 = Math.round(W * 0.3);
    const roofX1 = Math.round(W * 0.72);
    const roofTop = Math.round(H * 0.2);
    fillRect(bx0, bodyTop, bx1, wheelY, BODY[0], BODY[1], BODY[2]);
    fillRect(roofX0, roofTop, roofX1, bodyTop, BODY[0], BODY[1], BODY[2]);
    strokeRect(bx0, bodyTop, bx1, wheelY, nr, ng, nb);
    strokeRect(roofX0, roofTop, roofX1, bodyTop + 2, nr, ng, nb);
    wheel(Math.round(W * 0.26));
    wheel(Math.round(W * 0.74));
  } else {
    // moto
    const bodyTop = Math.round(H * 0.46);
    const bx0 = Math.round(W * 0.16);
    const bx1 = Math.round(W * 0.84);
    fillRect(bx0, bodyTop, bx1, wheelY - wheelR, BODY[0], BODY[1], BODY[2]);
    strokeRect(bx0, bodyTop, bx1, wheelY - wheelR, nr, ng, nb, 2);
    // top box on the back
    const boxTop = Math.round(H * 0.28);
    fillRect(bx1 - Math.round(W * 0.14), boxTop, bx1, bodyTop, BODY[0], BODY[1], BODY[2]);
    strokeRect(bx1 - Math.round(W * 0.14), boxTop, bx1, bodyTop, nr, ng, nb, 2);
    wheel(Math.round(W * 0.22));
    wheel(Math.round(W * 0.78));
  }

  return encodePng(W, H, px);
}

// ── Reuse the enemy edge flood-fill detour when possible ─────────────────────
async function tryCutout(file, type) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    console.log(`  [cutout-skip] ${type} — ${e.message} (chroma-key runs in CI)`);
  }
}

// ── Deterministic GRAYSCALE pass (companion to the magenta-key ground) ─────────
// Serge's technical pass: the magenta cut is perfect, but the saturated ground
// bled a crimson/magenta CAST into the monochrome interiors (violating "fully
// black and white"). This kills that spill AT THE SOURCE, every run: after the
// chroma-key, replace each remaining (non-transparent) pixel's RGB with its
// luminance, preserving alpha. Formula = Rec.601 luma (Y = 0.299R + 0.587G +
// 0.114B) — the standard perceptual grey for sRGB-ish content; the exact weights
// are immaterial once R=G=B, what matters is that saturation collapses to 0.
// Uses @napi-rs/canvas (already the pipeline's decoder, via cutout-enemies.mjs).
export async function desaturateFile(file) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  let touched = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // leave keyed-out (transparent) pixels alone
    const y = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = y;
    d[i + 1] = y;
    d[i + 2] = y;
    touched++;
  }
  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  return touched;
}

// Main-flow wrapper — skip gracefully when the decoder is unavailable in the
// sandbox (mirrors tryCutout; the real pass runs in CI).
async function tryDesaturate(file, type) {
  try {
    const n = await desaturateFile(file);
    console.log(`  [gray] ${type} — desaturated ${n} px (Rec.601 luma)`);
  } catch (e) {
    console.log(`  [gray-skip] ${type} — ${e.message} (grayscale runs in CI)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const vehicles = loadVehicles();

  if (args.includes("--list")) {
    console.log("Defined vehicles (from levelArt.json):");
    vehicles.forEach((v) =>
      console.log(`  ${v.type.padEnd(6)} ${v.width}x${v.height}  → assets/vehicles/${v.type}.png`),
    );
    return;
  }

  const placeholder = args.includes("--placeholder") || process.env.PLACEHOLDER === "1";
  const ti = args.indexOf("--asset");
  const target = ti !== -1 ? args[ti + 1] : null;
  const todo = target ? vehicles.filter((v) => v.type === target) : vehicles;
  if (target && todo.length === 0) {
    console.error(`Vehicle "${target}" not found. Use --list.`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // --reprocess: apply the deterministic grayscale pass to the EXISTING committed
  // PNGs in place, no regeneration. Pinned seeds make a CI regen produce identical
  // art anyway, so reprocessing locally kills the magenta ground-cast without
  // spending a paid FLUX batch. Requires the decoder (@napi-rs/canvas); errors
  // loudly if the desaturation cannot run (unlike the main-flow soft-skip).
  if (args.includes("--reprocess")) {
    console.log(`Reprocess (grayscale) → ${path.relative(ROOT, OUT_DIR)}\n`);
    for (const v of todo) {
      const out = path.join(OUT_DIR, `${v.type}.png`);
      if (!fs.existsSync(out)) {
        console.log(`  [skip] ${v.type} (no PNG on disk)`);
        continue;
      }
      const n = await desaturateFile(out);
      console.log(`  [reproc] ${v.type} — desaturated ${n} px → ${path.relative(ROOT, out)}`);
    }
    console.log("\nDone (reprocess).");
    return;
  }

  console.log(
    `Vehicle sprites → ${path.relative(ROOT, OUT_DIR)}${placeholder ? " (placeholder mode)" : ""}\n`,
  );

  for (const v of todo) {
    const out = path.join(OUT_DIR, `${v.type}.png`);
    if (!FORCE && fs.existsSync(out)) {
      console.log(`  [skip] ${v.type} (exists)`);
      continue;
    }

    if (placeholder) {
      fs.writeFileSync(out, drawPlaceholder(v));
      console.log(`  [ph]   ${v.type} — procedural placeholder written`);
      continue;
    }

    console.log(`  [gen]  ${v.type}`);
    try {
      const buf = await generate(v);
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   ${v.type} (${buf.length} bytes) — keying background`);
      await tryCutout(out, v.type);
      // Kill the magenta ground-cast bled into the monochrome interiors.
      await tryDesaturate(out, v.type);
    } catch (e) {
      console.log(`  [fail] ${v.type} — ${e.message} (will be generated in CI)`);
    }
    await sleep(2000);
  }

  console.log("\nDone.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
