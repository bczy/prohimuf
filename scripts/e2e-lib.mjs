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
 *   - enterMenuFromTitle(page)        — TITLE cover → single-action entry → MENU shell.
 *   - dismissNarrative(page)          — clear the pre-level "Passer" interstitial.
 *   - seedDeterminism(page, ids, o)   — addInitScript: freeze cops + mute + unlock (+ crt off by default).
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

// Pre-game entry markers (ADR-0021). Cold load lands on the TITLE cover; a single
// action enters the MENU. The issue label is title-only (both TITLE and MENU render
// the "MUF" logo), so it disambiguates the two; the running masthead is menu-only.
export const TITLE_MARKER = "★ HIVER 1998 ★"; // src/render/ui/TitleScreen.tsx ISSUE_LABEL
export const MENU_MASTHEAD = "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998"; // print/tokens.ts MASTHEAD.running

/**
 * Advance the new pre-game entry flow (ADR-0021): assert the TITLE cover is up,
 * perform the single-action entry (click the cover, exercising the real pointer
 * handler), then wait for the MENU shell to mount. Every consumer that used to
 * treat the "MUF" logo as a menu signal MUST call this first — "MUF" now also
 * renders on the TITLE cover, so waiting on it alone leaves the app sitting on the
 * cover while a subsequent level-name click times out. Clicks the title-only
 * issue label, which lives inside the interactive surface and clear of the
 * FullscreenButton chrome (`[data-muf-ui]`).
 *
 * The NIVEAUX flyer wall arms a brief click-through lockout on mount (the guard
 * against a title double-click falling through to a freshly mounted flyer); we
 * wait for its `data-flyers-armed="true"` signal so a subsequent flyer click is
 * actually honoured instead of being swallowed by that lockout.
 */
export async function enterMenuFromTitle(page, { timeout = 20000 } = {}) {
  const marker = page.getByText(TITLE_MARKER, { exact: true }).first();
  await marker.waitFor({ timeout });
  await marker.click({ timeout });
  await page.getByText(MENU_MASTHEAD, { exact: true }).first().waitFor({ timeout });
  await page.locator('[data-flyers-armed="true"]').first().waitFor({ timeout });
}

/**
 * The pre-level narrative interstitial has a "Passer" (skip) button; clear it so
 * we reach the actual gameplay canvas. Mirrors screenshot-preview.mjs.
 *
 * The asset-preload loading screen (gate) can now sit between the level click and
 * the narrative, so this polls a bounded window instead of deciding on the first
 * frame (the old fixed-iteration loop broke the instant no "Passer" was visible —
 * i.e. while the loader was still up — and never dismissed the narrative that
 * appeared afterwards). It clicks "Passer" whenever it shows and stops as soon as
 * the gameplay canvas has mounted (narrative dismissed, or the level has none).
 */
export async function dismissNarrative(page) {
  const canvas = page.locator("canvas").first();
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await canvas.isVisible().catch(() => false)) return;
    const skip = page.getByRole("button", { name: "Passer" });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click().catch(() => undefined);
    }
    await sleep(300);
  }
}

/**
 * Seed a deterministic, headless-friendly run BEFORE the app boots:
 *   - freeze cops VISIBLE (never SHOOTING) so scenes are static & no damage,
 *   - mute audio, force 3 lives / normal difficulty,
 *   - unlock every level so any level can be entered directly,
 *   - pin the CRT post-process (`prefs.crt`) explicitly.
 * `levelIds` comes from loadLevelManifest so the unlock set stays in sync with
 * levelArt.json (never a hardcoded list).
 *
 * `crt` defaults to **false**: the app default (prefsSystem `DEFAULT_PREFS.crt`)
 * is true, but the CRT pass is animated grain/flicker + a multiplicative scanline
 * comb + bloom (ADR-0031) — inherently non-deterministic and, over a capture, it
 * masks constant-alpha-plate regressions and drives the pixel gates with noise.
 * A deterministic/static seed therefore turns it OFF by default. The one flow
 * that must still compile+exercise the CRT shaders under SwiftShader (e2e-ingame,
 * the ADR-0031 publish guard) opts back in with `{ crt: true }`.
 */
export async function seedDeterminism(page, levelIds, { crt = false } = {}) {
  await page.addInitScript(
    ({ ids, crt }) => {
      // Freeze cops so the scene is static/deterministic (matches screenshot-preview).
      window.__MUF_FREEZE_COPS__ = true;
      try {
        localStorage.setItem("muf_progress", JSON.stringify(ids));
        localStorage.setItem(
          "muf_prefs",
          JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal", crt }),
        );
      } catch {
        // ignore storage failures
      }
    },
    { ids: levelIds, crt },
  );
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
