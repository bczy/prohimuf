/**
 * Shared helpers for the E2E smoke gates (e2e-home / e2e-ingame / e2e-delivery).
 *
 * These scripts drive the PRODUCTION build in headless Chromium via raw
 * playwright (NOT @playwright/test) so they can run as plain `node` scripts in
 * CI with a server already serving the build at PREVIEW_URL. This module holds
 * the pieces they all share so behaviour (freeze/mute seed, level list, the
 * same-origin failure gate, the SwiftShader launch args) stays identical and is
 * defined once:
 *
 *   - dismissNarrative(page)          — clear the pre-level "Passer" interstitial.
 *   - seedDeterminism(page, ids)      — addInitScript: freeze cops + mute + unlock.
 *   - loadLevelManifest(root)         — level list/ids from levelArt.json (SoT).
 *   - createFailedResponseCollector() — same-origin >=400 response collector.
 *   - SWIFTSHADER_ARGS                — software-WebGL chromium launch args (no GPU).
 *   - IGNORED_PATHS                   — requests never treated as failures.
 */
import fs from "fs";
import path from "path";

/** Relative path of the shared level-art manifest (single source of truth). */
export const LEVEL_ART_PATH = "src/game/levels/levelArt.json";

// Requests we never treat as failures: the browser asks for /favicon.ico even
// though the app declares none, and that 404 is not a regression.
export const IGNORED_PATHS = ["/favicon.ico"];

// No GPU in CI — force software WebGL so the R3F canvas actually renders. Shared
// verbatim with scripts/screenshot-preview.mjs so the render path is identical.
export const SWIFTSHADER_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Read the shared level-art manifest and derive the level list + ids. This is
 * the ONLY place the level set is defined for the harness (mirrors the app,
 * which reads the same file), so adding a level in levelArt.json is enough.
 */
export function loadLevelManifest(root = process.cwd()) {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(root, LEVEL_ART_PATH), "utf8"));
  const levels = manifest.levels.map((l) => ({ id: l.id, name: l.name }));
  return { manifest, levels, levelIds: levels.map((l) => l.id) };
}

/**
 * The pre-level narrative interstitial has a "Passer" (skip) button; clear it so
 * we reach the actual gameplay canvas. Mirrors screenshot-preview.mjs.
 */
export async function dismissNarrative(page) {
  for (let i = 0; i < 8; i++) {
    const skip = page.getByRole("button", { name: "Passer" });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click().catch(() => undefined);
      await sleep(400);
    } else {
      break;
    }
  }
}

/**
 * Seed a deterministic, headless-friendly run BEFORE the app boots:
 *   - freeze cops VISIBLE (never SHOOTING) so scenes are static & no damage,
 *   - mute audio, force 3 lives / normal difficulty,
 *   - unlock every level so any level can be entered directly.
 * `levelIds` comes from loadLevelManifest so the unlock set stays in sync with
 * levelArt.json (never a hardcoded list).
 */
export async function seedDeterminism(page, levelIds) {
  await page.addInitScript((ids) => {
    // Freeze cops so the scene is static/deterministic (matches screenshot-preview).
    window.__MUF_FREEZE_COPS__ = true;
    try {
      localStorage.setItem("muf_progress", JSON.stringify(ids));
      localStorage.setItem(
        "muf_prefs",
        JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal" }),
      );
    } catch {
      // ignore storage failures
    }
  }, levelIds);
}

/**
 * Collect same-origin responses with a >=400 status (asset & base-path config
 * guard). Third-party requests and IGNORED_PATHS are ignored. Attach the
 * returned `onResponse` to `page.on("response", ...)`; read `failed` after.
 */
export function createFailedResponseCollector(origin) {
  const failed = [];
  const onResponse = (res) => {
    const url = res.url();
    if (!url.startsWith(origin)) return; // ignore any third-party request
    if (IGNORED_PATHS.some((p) => new URL(url).pathname.endsWith(p))) return;
    if (res.status() >= 400) failed.push(`${res.status()} ${url}`);
  };
  return { failed, onResponse };
}
