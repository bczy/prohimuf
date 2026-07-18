#!/usr/bin/env node
/**
 * Ad-hoc kontext reference-conditioned asset iteration (ADR-0044).
 *
 * A one-shot CLI: drop a reference image, describe the target, get one
 * `kontext` img2img generation conditioned on it — for exploring vehicles,
 * enemies and level/backdrop art WITHOUT authoring a levelArt.json entry.
 * Not a manifest-driven family generator like gen-vehicle-sprites.mjs /
 * gen-enemy-types.mjs — this is the exploratory single-asset counterpart.
 *
 * `--ref` is either a repo-relative path (turned into a raw.githubusercontent.com
 * URL at the checked-out SHA — Pollinations fetches it SERVER-SIDE, so it must
 * be a public, already-committed-and-pushed file) or a full `https://` URL,
 * passed through unchanged (any other scheme is rejected).
 *
 * Post-processing by `--family` reuses the existing per-family pipeline:
 *   - vehicles → chroma-key cutout (cutout-enemies.mjs) then Rec.601
 *     desaturation (gen-vehicle-sprites.mjs), both soft-skipped if
 *     @napi-rs/canvas is unavailable.
 *   - enemies  → chroma-key cutout only.
 *   - levels   → none (full-bleed backdrops).
 *
 * Network image generation (Pollinations) is normally blocked in the local
 * sandbox, so a failed fetch there is a soft-skip — the real generation runs
 * in CI via .github/workflows/gen-from-reference.yml. In CI, however, that
 * generation IS the job: a failed fetch is FATAL (exit 1) so the run never
 * reports a green check having produced nothing (see isCI below).
 *
 * Usage:
 *   node scripts/gen-from-reference.mjs \
 *     --ref references/moto-photo.jpg \
 *     --prompt "same silhouette, side profile, pixel art" \
 *     --out public/assets/vehicles/moto.png \
 *     --family vehicles --seed 12345 [--size 256x160] [--style ", extra style tail"]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { fetchWithRetry, kontextUrl } from "./lib/pollinations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const REPO = process.env.GITHUB_REPOSITORY ?? "bczy/prohimuf";
const SHA = process.env.GITHUB_SHA ?? "main";

// True when running under CI (GitHub Actions sets both). The soft-skip on a
// failed fetch only makes sense in the local sandbox, where the network is
// blocked and CI does the real generation; in CI a failed fetch must fail the
// run, not soft-return into a green check that generated nothing.
export function isCI(env = process.env) {
  return env.CI === "true" || env.GITHUB_ACTIONS === "true";
}

// A repo-relative path becomes a raw.githubusercontent.com URL at the checked-out
// SHA (mirrors frame1RawUrl in gen-enemy-types.mjs); a full https:// URL passes
// through unchanged. Any other scheme (http://, file://, …) is rejected — the ref
// is fetched server-side by Pollinations, so it must be https.
export function resolveRefUrl(ref) {
  if (/^https:\/\//i.test(ref)) return ref;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(ref)) {
    throw new Error(`--ref URL must be https://, got "${ref}"`);
  }
  return `https://raw.githubusercontent.com/${REPO}/${SHA}/${ref}`;
}

export function parseSize(size) {
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) throw new Error(`--size must be "<width>x<height>", got "${size}"`);
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (width <= 0 || height <= 0 || width > 2048 || height > 2048) {
    throw new Error(`--size dimensions must be 1-2048, got "${size}"`);
  }
  return { width, height };
}

// --out is repo-relative but user-supplied — refuse anything that resolves
// outside ROOT (absolute path, ../ escape).
export function resolveOutFile(out) {
  const p = path.resolve(ROOT, out);
  if (p !== ROOT && !p.startsWith(ROOT + path.sep)) {
    throw new Error(`--out escapes repo root, got "${out}"`);
  }
  return p;
}

// Chroma-key cutout, soft-skipped when @napi-rs/canvas is unavailable (mirrors
// tryCutout in gen-vehicle-sprites.mjs).
async function tryCutout(file, label) {
  try {
    const mod = await import("./cutout-enemies.mjs");
    await mod.cutout(file);
  } catch (e) {
    console.log(`  [cutout-skip] ${label} — ${e.message} (chroma-key runs in CI)`);
  }
}

// Rec.601 desaturation, soft-skipped when @napi-rs/canvas is unavailable
// (mirrors tryDesaturate in gen-vehicle-sprites.mjs).
async function tryDesaturate(file, label) {
  try {
    const mod = await import("./gen-vehicle-sprites.mjs");
    const n = await mod.desaturateFile(file);
    console.log(`  [gray] ${label} — desaturated ${n} px (Rec.601 luma)`);
  } catch (e) {
    console.log(`  [gray-skip] ${label} — ${e.message} (grayscale runs in CI)`);
  }
}

async function postProcess(file, family) {
  if (family === "vehicles") {
    await tryCutout(file, family);
    await tryDesaturate(file, family);
  } else if (family === "enemies") {
    await tryCutout(file, family);
  }
  // levels: no post-processing (full-bleed backdrops).
}

function parseArgs(argv) {
  const args = argv.slice(2);
  // Returns null for an absent flag AND for a flag immediately followed by
  // another flag (e.g. `--ref --prompt "x"`) so a missing value never
  // silently swallows the next option.
  const get = (flag) => {
    const i = args.indexOf(flag);
    if (i === -1) return null;
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) return null;
    return next;
  };

  const ref = get("--ref");
  const prompt = get("--prompt");
  const out = get("--out");
  const family = get("--family");
  const seedRaw = get("--seed");
  const sizeRaw = get("--size");
  const size = sizeRaw && sizeRaw.length > 0 ? sizeRaw : "256x256";
  const style = get("--style") ?? "";

  if (!ref || !prompt || !out || !family) {
    console.error(
      "usage: node scripts/gen-from-reference.mjs --ref <path|url> --prompt <text> " +
        "--out <path> --family <vehicles|enemies|levels> --seed <int> [--size WxH] [--style <text>]",
    );
    process.exit(2);
  }
  if (!["vehicles", "enemies", "levels"].includes(family)) {
    console.error(`--family must be one of vehicles|enemies|levels, got "${family}"`);
    process.exit(2);
  }
  const seed = Number(seedRaw);
  if (!Number.isInteger(seed) || seed <= 0) {
    console.error(`--seed must be a positive integer, got "${seedRaw ?? "(absent)"}"`);
    process.exit(2);
  }

  return { ref, prompt: `${prompt}${style}`, out, family, seed, ...parseSize(size) };
}

async function main() {
  const { ref, prompt, out, family, seed, width, height } = parseArgs(process.argv);

  let outFile;
  try {
    outFile = resolveOutFile(out);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  const refUrl = resolveRefUrl(ref);

  console.log(`gen-from-reference — family=${family} seed=${seed} ref=${refUrl}`);
  console.log(`  [gen]  ${out} — strategy=KONTEXT img2img`);

  const url = kontextUrl(prompt, seed, width, height, refUrl);
  let buf;
  try {
    buf = await fetchWithRetry(url);
  } catch (err) {
    // In CI this generation is the whole job: a failed fetch must fail the run
    // (::error:: annotation + exit 1) so a green check never lies about having
    // produced an asset. Only the local sandbox — where the network is blocked
    // and CI does the real pass — soft-skips.
    if (isCI()) {
      console.error(`::error::gen-from-reference failed for ${out} — ${err.message}`);
      process.exit(1);
    }
    console.log(`  [skip] ${out} — ${err.message} (network blocked; real generation runs in CI)`);
    return;
  }

  // Write/post-process errors are not "network unavailable in the sandbox" —
  // let them propagate to the top-level fatal handler (exit 1).
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buf);
  console.log(`  [ok]   ${out} (${buf.length} bytes)`);
  await postProcess(outFile, family);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
