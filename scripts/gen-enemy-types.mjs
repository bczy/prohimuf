#!/usr/bin/env node
/**
 * Generate the enemy sprite FLIPBOOK frames for every archetype (base cops,
 * riot/CRS, motorcycle cop, delivery civilian, bonus figure) in the same 16-bit
 * pixel-art style as the accepted set: light tones on a PURE BLACK background
 * (cutout-enemies.mjs keys the black to transparency afterwards; EnemySprite
 * tints per kind). Period-authentic Prohibition-1987 flips: 2 frames at 6 fps.
 *
 * Single source of truth: the `enemies` block of src/game/levels/levelArt.json
 * (style, size, per-type seed/prompt/frames). Add or tune an enemy THERE, never
 * in this script (mirrors gen-vehicle-sprites.mjs reading the `vehicles` block).
 *
 * Frame model (see the manifest `$comment`):
 *   - Keys are the EXACT base filename (asset root + legacy variant suffix), e.g.
 *     `enemy_sprite_2` = normal cop VARIANT 2.
 *   - `frames[0]` is ALWAYS "" → target file `<key>.png`. That committed
 *     unsuffixed PNG is frame 1 and is the accepted hero; it is only ever
 *     touched by FORCE=1 or by the matched-pair fallback below.
 *   - `frames[i>0]` is a short pose-delta clause → target file `<key>_f<i+1>.png`
 *     (the `_f` prefix disambiguates the frame index from the legacy `_2`/`_3`
 *     variant suffix, so `enemy_shooting_2_f2.png` = cop variant 2, shooting,
 *     frame 2). Only the pose clause varies between frames; `style` is appended
 *     verbatim to every prompt for family consistency.
 *
 * Frame ≥2 generation is two-tier (logged loudly per file):
 *   1. PRIMARY — `kontext` img2img (the style-lock tool, art bible §3.12): the
 *      committed frame-1 PNG is passed as the `image=` source so the extra frame
 *      is the SAME character in a new pose, not an independent roll.
 *   2. FALLBACK — matched flux pair: if kontext fails (non-200 after retries),
 *      frame 1 AND frame 2 are generated as a consistent pair from the pinned
 *      seed (base prompt vs base prompt + delta clause). This OVERWRITES the old
 *      frame 1; the pair goes through the human art gate in the PR.
 *
 * Only MISSING files are generated (FORCE=1 overrides), so accepted frame-1
 * sprites are never touched and re-runs are cheap. Existing frame-1 PNGs are all
 * committed, so in practice only the `_f2` files get generated. Network image
 * generation (Pollinations/FLUX) is normally blocked in the local sandbox, so a
 * failed fetch is logged per-asset and never crashes the run — real art is
 * produced in CI.
 *
 * Usage (CI): node scripts/gen-enemy-types.mjs && node scripts/cutout-enemies.mjs
 *   The cutout step runs after: the new `_f2` files match its `enemy_*.png` glob
 *   and get keyed; committed pre-keyed frame-1 files stay skipped (ADR 0013).
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// Raw URL of a committed frame-1 PNG — the kontext img2img `image=` source. In
// CI these resolve to the exact checked-out commit; locally they fall back to
// the repo default branch (harmless — the local sandbox has no network anyway).
const REPO = process.env.GITHUB_REPOSITORY ?? "bczy/prohimuf";
const SHA = process.env.GITHUB_SHA ?? "main";
function frame1RawUrl(key) {
  return `https://raw.githubusercontent.com/${REPO}/${SHA}/public/assets/${key}.png`;
}

// ── Load the enemy definitions from levelArt.json (single source) ────────────
function loadEnemies() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.enemies;
  if (!block || !block.types) {
    throw new Error(`No "enemies.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const styleSuffix = block.style ?? "";
  const width = block.size?.width ?? 256;
  const height = block.size?.height ?? 256;
  return Object.entries(block.types).map(([key, def]) => ({
    key,
    // Pinned seed → reproducible rolls, reviewable diffs (no Math.random()).
    seed: def.seed,
    prompt: def.prompt ?? "",
    frames: Array.isArray(def.frames) ? def.frames : [""],
    style: styleSuffix,
    width,
    height,
  }));
}

// ── Pollinations fetch helpers (mirrors gen-vehicle-sprites.mjs) ──────────────
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

// enhance=false is load-bearing (art bible §3.11): Pollinations' enhancer
// rewrites the prompt through an LLM and destroys the verbatim style block the
// set consistency depends on. private=true keeps assets out of the public feed.
function fluxUrl(prompt, seed, width, height) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}&enhance=false&private=true`;
}

// kontext img2img (art bible §3.12, style-lock): same query plus `image=` set to
// the committed frame-1 raw URL so the new pose stays the SAME character.
function kontextUrl(prompt, seed, width, height, imageUrl) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=kontext&seed=${seed}&enhance=false&private=true&image=${encodeURIComponent(
    imageUrl,
  )}`;
}

// ── Frame ≥2: kontext primary → matched-flux-pair fallback ───────────────────
async function generateExtraFrame(e, i, out) {
  const name = `${e.key}_f${i + 1}`;
  const clause = e.frames[i];

  // PRIMARY: kontext img2img from the committed frame 1.
  const kPrompt = `same character, same pixel art style, same framing and scale, ${clause}${e.style}`;
  const kUrl = kontextUrl(kPrompt, e.seed, e.width, e.height, frame1RawUrl(e.key));
  console.log(`  [gen]  ${name} — strategy=KONTEXT img2img (source ${e.key}.png)`);
  try {
    const buf = await fetchWithRetry(kUrl);
    fs.writeFileSync(out, buf);
    console.log(`  [ok]   ${name} via KONTEXT img2img (${buf.length} bytes)`);
    return;
  } catch (err) {
    console.log(`  [kontext-fail] ${name} — ${err.message}; FALLING BACK to matched flux pair`);
  }

  // FALLBACK: matched flux pair under the pinned seed. Regenerates frame 1 too so
  // the pose delta is consistent; OVERWRITES the committed frame 1 (goes through
  // the human art gate in the PR).
  const frame1Out = path.join(OUT_DIR, `${e.key}.png`);
  try {
    console.log(`  [gen]  ${name} — strategy=MATCHED FLUX PAIR (also overwrites ${e.key}.png)`);
    const buf1 = await fetchWithRetry(fluxUrl(`${e.prompt}${e.style}`, e.seed, e.width, e.height));
    fs.writeFileSync(frame1Out, buf1);
    console.log(
      `  [ok]   ${e.key} — frame 1 of matched pair (${buf1.length} bytes) — OVERWRITES committed art`,
    );
    const buf2 = await fetchWithRetry(
      fluxUrl(`${e.prompt}, ${clause}${e.style}`, e.seed, e.width, e.height),
    );
    fs.writeFileSync(out, buf2);
    console.log(`  [ok]   ${name} — frame 2 of matched pair (${buf2.length} bytes)`);
  } catch (err) {
    console.log(`  [fail] ${name} — matched pair failed: ${err.message} (will be generated in CI)`);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const enemies = loadEnemies();
  console.log(`Enemy-type flipbook sprites → ${OUT_DIR}\n`);

  for (const e of enemies) {
    for (let i = 0; i < e.frames.length; i++) {
      const name = i === 0 ? e.key : `${e.key}_f${i + 1}`;
      const out = path.join(OUT_DIR, `${name}.png`);

      if (!FORCE && fs.existsSync(out)) {
        console.log(`  [skip] ${name} (exists)`);
        continue;
      }

      if (i === 0) {
        // Frame 1: plain text2img (base prompt + shared style). Committed for the
        // whole set, so this only fires for a brand-new enemy or under FORCE=1.
        console.log(`  [gen]  ${name} — frame 1 (flux, seed=${e.seed})`);
        try {
          const buf = await fetchWithRetry(
            fluxUrl(`${e.prompt}${e.style}`, e.seed, e.width, e.height),
          );
          fs.writeFileSync(out, buf);
          console.log(`  [ok]   ${name} (${buf.length} bytes)`);
        } catch (err) {
          console.log(`  [fail] ${name} — ${err.message} (will be generated in CI)`);
        }
      } else {
        await generateExtraFrame(e, i, out);
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
