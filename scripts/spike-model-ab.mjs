#!/usr/bin/env node
/**
 * SPIKE — image-model A/B for the courier `rider` flipbook (throwaway eval, NOT
 * production art). Answers one question: since the pipeline was built on FLUX,
 * is another Pollinations model materially better for OUR hardest problem —
 * keeping the SAME character consistent across the 6 pedal-stroke frames?
 *
 * It regenerates the exact `courier.rider` set from src/game/levels/levelArt.json
 * across several models, two comparison tracks, and drops the outputs under
 * spike-out/ for the art gate (lead-art + game-graphist) to judge at real
 * in-game size. Nothing here is chroma-keyed or committed as game art: keying is
 * identical model-agnostic downstream work, so the honest model comparison is the
 * un-keyed frame. Pollinations serves JPEG, so each fetched buffer is decoded and
 * re-encoded to a TRUE lossless PNG (@napi-rs/canvas, the production keyer's
 * decoder) — run #2 shipped mislabeled JPEG-as-.png whose 4:2:0 fringe polluted
 * the read. The matte-black background is asked for in the style block, so the
 * frames read fine side by side.
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
 * this only does real work in CI (.github/workflows/spike-model-ab.yml, which
 * installs @napi-rs/canvas first for the re-encode). t2i models are PROBED with one
 * cheap 64px call before any full-size spend (an unserved ID 404s and is SKIPPED);
 * img2img models skip the probe (a tiny img2img probe 500'd unreliably in run #2).
 *
 * Usage (CI, workflow_dispatch):
 *   node scripts/spike-model-ab.mjs
 *   MODELS=flux,kontext,nanobanana-pro node scripts/spike-model-ab.mjs
 *   FRAMES=4 node scripts/spike-model-ab.mjs        # cap frames per model (cost)
 * Local (no network):
 *   node scripts/spike-model-ab.mjs --list          # print the plan, spend nothing
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchImage, modelUrl } from "./lib/pollinations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const OUT_ROOT = path.resolve(ROOT, "spike-out", "rider");
const LIST_ONLY = process.argv.includes("--list");

// Default set: FLUX baseline + the two reference-conditioned (img2img) candidates.
// `zimage`/`qwen-image` were dropped after run #2 proved Pollinations' anonymous
// GET API ignores `model` for them and serves byte-identical FLUX (testing a real
// t2i alternative needs the POST/authenticated path) — add them back via MODELS=
// if that path is ever wired. `flux.2` is not a Pollinations ID either.
// A push-triggered run passes MODELS="" (workflow_dispatch inputs are empty on
// push), so treat an empty/whitespace env as UNSET and let this default win —
// `?? ` alone would keep the empty string and generate zero models.
const DEFAULT_MODELS = "flux,kontext,nanobanana-pro";
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
  // FRAMES caps frames per model (documented max = the layer's own count). Clamp
  // to a positive integer in [1, N]; any junk (empty, 0, negative, NaN) → all N.
  const capRaw = Number(process.env.FRAMES);
  const cap =
    Number.isInteger(capRaw) && capRaw > 0 ? Math.min(capRaw, r.frames.length) : r.frames.length;
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

// ── Pollinations fetch (fetchImage from the shared lib; retry/backoff stay local) ──
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

// Pollinations serves JPEG bytes; saving them under a `.png` name yields a
// mislabeled file (JPEG magic FFD8) and 4:2:0 chroma fringe that contaminates any
// fine consistency/keying read. Decode + re-encode to a TRUE lossless PNG with
// @napi-rs/canvas — the exact decoder the production keyer (cutout-enemies.mjs)
// uses, so this matches the pipeline's pre-key format. The dep is installed in CI
// before this script; locally it is absent but generation never runs locally
// anyway (no network), so fall back to the raw buffer rather than crash.
let _canvasMod;
async function reencodePng(buf) {
  if (_canvasMod === undefined) {
    try {
      _canvasMod = await import("@napi-rs/canvas");
    } catch {
      _canvasMod = null;
    }
  }
  if (!_canvasMod) return buf;
  const img = await _canvasMod.loadImage(buf);
  const c = _canvasMod.createCanvas(img.width, img.height);
  c.getContext("2d").drawImage(img, 0, 0);
  return c.toBuffer("image/png");
}

// ── Per-model generation ──────────────────────────────────────────────────────
async function runModel(model, R) {
  const isRef = REF_MODELS.has(model);
  const outDir = path.join(OUT_ROOT, model);
  fs.mkdirSync(outDir, { recursive: true });
  const track = isRef ? "B:ref-conditioned(img2img)" : "A:t2i seed-pinned";
  console.log(`\n=== ${model}  [${track}] ===`);

  // PROBE (t2i only): one cheap 64px call to skip a model ID Pollinations does not
  // serve (404) without burning full-size spend. REF models skip the probe — a
  // 64px img2img call against a 256px reference 500'd for kontext in run #2 while
  // nanobanana passed, so the tiny probe is an unreliable gate for img2img; their
  // per-frame calls retry and fail gracefully on their own.
  if (!isRef) {
    try {
      const probe = modelUrl({ prompt: "probe", model, seed: R.seed, width: 64, height: 64 });
      await fetchWithRetry(probe, 2);
      console.log(`  [probe-ok] ${model} is served`);
    } catch (e) {
      // Only a 404 means the model ID is not served — then skip. Any other error
      // (500/timeout) may be a transient blip; do NOT drop the model on it — above
      // all the FLUX baseline the whole spike compares against — fall through and
      // let the per-frame calls (4 retries each) decide.
      if (/\b404\b/.test(e.message)) {
        console.log(`  [probe-skip] ${model} — ${e.message} (model not served; skipping)`);
        return { model, track, skipped: true, reason: e.message, frames: [], generated: 0 };
      }
      console.log(`  [probe-warn] ${model} — ${e.message} (transient? proceeding to generation)`);
    }
  }

  let generated = 0; // real fetched frames (excludes the copied ref frame1)
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
    const url = modelUrl({
      prompt: isRef ? R.refPrompts[i] : R.t2iPrompts[i],
      model,
      seed: R.seed,
      width: R.cellW,
      height: R.cellH,
      imageUrl: isRef ? RIDER_REF_URL : undefined,
    });
    try {
      const png = await reencodePng(await fetchWithRetry(url));
      fs.writeFileSync(out, png);
      console.log(`  [ok]   frame${i + 1} (${png.length} bytes, re-encoded PNG)`);
      written.push(`frame${i + 1}.png`);
      generated++;
    } catch (e) {
      console.log(`  [fail] frame${i + 1} — ${e.message}`);
    }
  }
  return { model, track, skipped: false, frames: written, generated };
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
      results.push({
        model,
        track: "?",
        skipped: true,
        reason: e.message,
        frames: [],
        generated: 0,
      });
    }
  }

  // Text manifest so the outcome is reviewable without opening every PNG. The
  // "Generated" column counts frames actually fetched from the model — NOT the
  // copied ref frame1 — so a track-B model that produced nothing real reads as
  // 0/N, not a misleading 1/N.
  const lines = [
    "# Spike — image-model A/B (courier rider flipbook)",
    "",
    `Subject: \`courier.rider\` · ${R.frames.length} frames · seed \`${R.seed}\``,
    `Reference (track B): \`${RIDER_REF_URL}\``,
    "",
    "| Model | Track | Result | Generated |",
    "| ----- | ----- | ------ | --------- |",
    ...results.map(
      (r) =>
        `| \`${r.model}\` | ${r.track} | ${r.skipped ? `skipped (${r.reason})` : "generated"} | ${r.generated}/${R.frames.length} |`,
    ),
    "",
    "Raw model output (NOT chroma-keyed, NOT production art). Judge character",
    "consistency across frames of each model, then compare models. Track A = current",
    "seed-pinned strategy; track B = reference-conditioned from the committed frame 1.",
    "",
  ];
  fs.writeFileSync(path.join(ROOT, "spike-out", "SPIKE.md"), lines.join("\n"));

  // Guard against a misleading "green" run: the workflow commit gate matches any
  // PNG under spike-out/, which a track-B model satisfies with just its copied
  // ref frame1 even when every real generation failed. If NOTHING was actually
  // generated across all models, fail loudly instead of committing only copies.
  const totalGenerated = results.reduce((s, r) => s + r.generated, 0);
  console.log(`\nWrote spike-out/SPIKE.md (${totalGenerated} frames generated across all models)`);
  if (totalGenerated === 0) {
    console.error(
      "No model produced a single generated frame — nothing to compare; failing the run.",
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
