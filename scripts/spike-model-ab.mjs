#!/usr/bin/env node
/**
 * SPIKE — image-model A/B for the courier `rider` flipbook (throwaway eval, NOT
 * production art). Answers one question: since the pipeline was built on FLUX,
 * is another Pollinations model materially better for OUR hardest problem —
 * keeping the SAME character consistent across the 6 pedal-stroke frames?
 *
 * It regenerates the exact `courier.rider` set from src/game/levels/levelArt.json
 * across several models, two comparison tracks, and drops the raw outputs under
 * spike-out/ for the art gate (lead-art + game-graphist) to judge at real
 * in-game size. Nothing here is chroma-keyed or committed as game art: keying is
 * identical model-agnostic downstream work, so the honest model comparison is the
 * RAW output. The matte-black background is already asked for in the style block,
 * so the raw frames read fine side by side.
 *
 * Two tracks (a model is classified by REF_MODELS below):
 *   A. TEXT-TO-IMAGE, seed-pinned — an EXACT mirror of production
 *      (gen-courier-sprites.mjs): each frame = `opening + prompt + ", " + clause
 *      + style` under the layer's single pinned seed. Tests whether a newer t2i
 *      model holds the character better than FLUX under the current strategy.
 *   B. REFERENCE-CONDITIONED (img2img) — mirrors the enemy pipeline's proven
 *      kontext path (gen-enemy-types.mjs §"KONTEXT img2img"): frame 1 IS the
 *      committed rider.png (copied in for side-by-side); frames 2..N are edited
 *      FROM that frame via `image=<rider.png raw URL>` with a pose-delta prompt.
 *      Tests the real hypothesis: derive poses from a locked reference instead of
 *      praying on a pinned seed.
 *
 * Network image generation (Pollinations) is BLOCKED in the local sandbox, so
 * this only does real work in CI (.github/workflows/spike-model-ab.yml). Every
 * model is PROBED with one cheap 64px call before any full-size spend; a model
 * whose ID Pollinations does not serve (e.g. `flux.2`, which is not a Pollinations
 * ID) 404s the probe and is SKIPPED, never failing the whole run.
 *
 * Usage (CI, workflow_dispatch):
 *   node scripts/spike-model-ab.mjs
 *   MODELS=flux,zimage,qwen-image,kontext,nanobanana-pro node scripts/spike-model-ab.mjs
 *   FRAMES=4 node scripts/spike-model-ab.mjs        # cap frames per model (cost)
 * Local (no network):
 *   node scripts/spike-model-ab.mjs --list          # print the plan, spend nothing
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const OUT_ROOT = path.resolve(ROOT, "spike-out", "rider");
const LIST_ONLY = process.argv.includes("--list");

// Default set: FLUX baseline · zimage (the current Pollinations default) ·
// qwen-image (linework/text candidate) · kontext + nanobanana-pro (the two
// reference-conditioned hypotheses). `flux.2` is intentionally absent — it is
// not a Pollinations model ID; add it via MODELS= to watch it get probe-skipped.
// A push-triggered run passes MODELS="" (workflow_dispatch inputs are empty on
// push), so treat an empty/whitespace env as UNSET and let this default win —
// `?? ` alone would keep the empty string and generate zero models.
const DEFAULT_MODELS = "flux,zimage,qwen-image,kontext,nanobanana-pro";
const MODELS = (process.env.MODELS?.trim() ? process.env.MODELS : DEFAULT_MODELS)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Models that consume a reference image via `image=` (track B). Everything else
// is treated as pure text-to-image (track A).
const REF_MODELS = new Set(["kontext", "nanobanana", "nanobanana-2", "nanobanana-pro"]);

// Raw URL of the committed frame-1 rider.png — the img2img `image=` source, the
// same mechanism the enemy pipeline uses. In CI these resolve to the exact
// checked-out commit (rider.png IS committed there, so the reference exists).
const REPO = process.env.GITHUB_REPOSITORY ?? "bczy/prohimuf";
const SHA = process.env.GITHUB_SHA ?? "main";
const RIDER_REF_URL = `https://raw.githubusercontent.com/${REPO}/${SHA}/public/assets/courier/rider.png`;
const RIDER_LOCAL = path.resolve(ROOT, "public/assets/courier/rider.png");

// ── Load the rider layer (single source of truth, same as gen-courier) ────────
function loadRider() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const c = json.courier;
  const r = c?.layers?.rider;
  if (!r) throw new Error("No courier.layers.rider block in levelArt.json");
  const opening = c.opening ?? "";
  const style = c.style ?? "";
  const cellW = c.size?.width ?? 256;
  const cellH = c.size?.height ?? 256;
  const cap = Number(process.env.FRAMES) || r.frames.length;
  const frames = r.frames.slice(0, cap);
  return {
    seed: r.seed,
    prompt: r.prompt,
    opening,
    style,
    cellW,
    cellH,
    frames,
    // Production t2i prompt per frame (exact mirror of gen-courier-sprites.mjs).
    t2iPrompts: frames.map((clause) => `${opening}${r.prompt}, ${clause}${style}`),
    // img2img pose-delta prompt (exact mirror of gen-enemy-types.mjs kontext).
    refPrompts: frames.map(
      (clause) => `same character, same pixel art style, same framing and scale, ${clause}${style}`,
    ),
  };
}

// ── Pollinations fetch (mirrors gen-enemy-types.mjs: bounded redirects/retry) ──
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function fetchImage(url, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        if (depth >= 5) return reject(new Error("too many redirects"));
        if (!res.headers.location) return reject(new Error(`HTTP ${res.statusCode} no Location`));
        return fetchImage(new URL(res.headers.location, url).href, depth + 1)
          .then(resolve)
          .catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(120000, () => req.destroy(new Error("response timeout (120s)")));
  });
}
async function fetchWithRetry(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 6000;
        console.log(`    [retry ${i + 1}] ${e.message} — wait ${wait / 1000}s`);
        await sleep(wait);
      } else throw e;
    }
  }
}

// enhance=false + private=true: same load-bearing flags as production (art bible
// §3.11) so the verbatim style block is not rewritten by Pollinations' enhancer.
function imgUrl({ prompt, model, seed, width, height, imageUrl }) {
  let u =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&nologo=true&model=${encodeURIComponent(model)}` +
    `&seed=${seed}&enhance=false&private=true`;
  if (imageUrl) u += `&image=${encodeURIComponent(imageUrl)}`;
  return u;
}

// ── Per-model generation ──────────────────────────────────────────────────────
async function runModel(model, R) {
  const isRef = REF_MODELS.has(model);
  const outDir = path.join(OUT_ROOT, model);
  fs.mkdirSync(outDir, { recursive: true });
  const track = isRef ? "B:ref-conditioned(img2img)" : "A:t2i seed-pinned";
  console.log(`\n=== ${model}  [${track}] ===`);

  // PROBE: one cheap 64px call. A model ID Pollinations doesn't serve 404s here,
  // and we skip it instead of burning full-size spend / failing the run.
  try {
    const probe = imgUrl({
      prompt: "probe",
      model,
      seed: R.seed,
      width: 64,
      height: 64,
      imageUrl: isRef ? RIDER_REF_URL : undefined,
    });
    await fetchWithRetry(probe, 2);
    console.log(`  [probe-ok] ${model} is served`);
  } catch (e) {
    console.log(`  [probe-skip] ${model} — ${e.message} (model not served; skipping)`);
    return { model, track, skipped: true, reason: e.message, frames: [] };
  }

  const written = [];
  for (let i = 0; i < R.frames.length; i++) {
    const out = path.join(outDir, `frame${i + 1}.png`);
    // Track B frame 1 = the committed reference itself (side-by-side anchor).
    if (isRef && i === 0) {
      fs.copyFileSync(RIDER_LOCAL, out);
      console.log(`  [ref]  frame1 = committed rider.png (${fs.statSync(out).size} bytes)`);
      written.push("frame1.png");
      continue;
    }
    const url = imgUrl({
      prompt: isRef ? R.refPrompts[i] : R.t2iPrompts[i],
      model,
      seed: R.seed,
      width: R.cellW,
      height: R.cellH,
      imageUrl: isRef ? RIDER_REF_URL : undefined,
    });
    try {
      const buf = await fetchWithRetry(url);
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   frame${i + 1} (${buf.length} bytes)`);
      written.push(`frame${i + 1}.png`);
    } catch (e) {
      console.log(`  [fail] frame${i + 1} — ${e.message}`);
    }
  }
  return { model, track, skipped: false, frames: written };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const R = loadRider();
  console.log(`SPIKE model A/B — courier.rider · ${R.frames.length} frames · seed=${R.seed}`);
  console.log(`Models: ${MODELS.join(", ")}`);
  console.log(`Reference (track B img2img source): ${RIDER_REF_URL}`);

  if (LIST_ONLY) {
    console.log("\n--list (no network, no spend):");
    for (const m of MODELS) {
      const isRef = REF_MODELS.has(m);
      console.log(`  ${m}  → track ${isRef ? "B (img2img)" : "A (t2i)"}`);
    }
    console.log("\nSample t2i prompt (frame 1):\n  " + R.t2iPrompts[0]);
    console.log(
      "\nSample img2img prompt (frame 2):\n  " + (R.refPrompts[1] ?? "(needs >=2 frames)"),
    );
    return;
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const results = [];
  for (const model of MODELS) {
    try {
      results.push(await runModel(model, R));
    } catch (e) {
      console.log(`  [model-error] ${model} — ${e.message}`);
      results.push({ model, track: "?", skipped: true, reason: e.message, frames: [] });
    }
  }

  // Text manifest so the outcome is reviewable without opening every PNG.
  const lines = [
    "# Spike — image-model A/B (courier rider flipbook)",
    "",
    `Subject: \`courier.rider\` · ${R.frames.length} frames · seed \`${R.seed}\``,
    `Reference (track B): \`${RIDER_REF_URL}\``,
    "",
    "| Model | Track | Result | Frames |",
    "| ----- | ----- | ------ | ------ |",
    ...results.map(
      (r) =>
        `| \`${r.model}\` | ${r.track} | ${r.skipped ? `skipped (${r.reason})` : "generated"} | ${r.frames.length}/${R.frames.length} |`,
    ),
    "",
    "Raw model output (NOT chroma-keyed, NOT production art). Judge character",
    "consistency across frames of each model, then compare models. Track A = current",
    "seed-pinned strategy; track B = reference-conditioned from the committed frame 1.",
    "",
  ];
  fs.writeFileSync(path.join(ROOT, "spike-out", "SPIKE.md"), lines.join("\n"));
  console.log(
    `\nWrote spike-out/SPIKE.md (${results.filter((r) => !r.skipped).length} models generated)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
