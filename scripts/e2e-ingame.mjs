#!/usr/bin/env node
/**
 * E2E smoke test — IN-GAME scene ("la partie" = playable shooting-gallery).
 *
 * Purpose: catch RENDER regressions that the home-screen smoke (e2e-home.mjs)
 * cannot see. The menu is pure DOM, so a broken R3F/WebGL scene — a scene that
 * throws on mount, a canvas that never mounts, a shader/asset load that crashes
 * the game — still lets e2e-home pass while the actual game is unplayable. This
 * gate boots the production build, ENTERS a level for real, and fails if the
 * game scene does not render.
 *
 * Kept deliberately to ONE level (belliard) so it stays fast and deterministic
 * in CI. It is a gate, not a screenshot farm — the full per-level contact sheet
 * lives in scripts/screenshot-preview.mjs (preview.yml).
 *
 * Drives the built site in headless Chromium with WebGL via SwiftShader (no GPU
 * in CI). Expects a server already serving the production build at PREVIEW_URL
 * (the URL must include the deploy base, e.g. http://127.0.0.1:4173/prohimuf/).
 *
 * Hard gates (exit 1 on any):
 *   - the game <canvas> mounts AND has non-zero pixel dimensions (proves the R3F
 *     Canvas mounted and a WebGL context was acquired, not just an empty stub),
 *   - no uncaught runtime error (pageerror) fires while entering the game,
 *   - at least one screenshot is actually written to disk.
 * Soft signal: console errors are logged but do not, on their own, fail.
 *
 * Determinism: cops are frozen (window.__MUF_FREEZE_COPS__) and sound is muted
 * (muf_prefs), matching screenshot-preview.mjs.
 *
 * Output: screenshots/e2e-ingame.png (uploaded as a CI artifact for review).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-ingame.png");

// One canonical level is enough to prove the render path is alive. Belliard is
// the first/default-unlocked level; its display name must match levelArt.json.
const LEVEL_NAME = process.env.E2E_LEVEL_NAME ?? "Rue Belliard";

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1;
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const SETTLE_MS = 2000; // let the scene draw a frame (and any mount error surface)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The pre-level narrative interstitial has a "Passer" (skip) button; clear it so
// we reach the actual gameplay canvas. Mirrors screenshot-preview.mjs.
async function dismissNarrative(page) {
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const consoleErrors = [];
  const pageErrors = [];

  const browser = await chromium.launch({
    // No GPU in CI — force software WebGL so the R3F canvas actually renders.
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
    ],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    // Freeze cops so the scene is static/deterministic for the shot.
    window.__MUF_FREEZE_COPS__ = true;
    try {
      // Unlock levels and mute audio for a headless, deterministic run.
      localStorage.setItem("muf_progress", JSON.stringify(["belliard", "stalingrad", "vitry"]));
      localStorage.setItem(
        "muf_prefs",
        JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal" }),
      );
    } catch {
      // ignore storage failures
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  let renderError = null;
  let canvasBox = null;
  try {
    console.log(`[e2e-ingame] loading ${PREVIEW_URL}`);
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    // Menu must mount first (same signal as e2e-home) before we can enter a level.
    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });

    console.log(`[e2e-ingame] entering level "${LEVEL_NAME}"`);
    await page.getByText(LEVEL_NAME, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
    await dismissNarrative(page);

    // The gameplay <canvas> mounting proves the R3F scene booted.
    const canvas = page.locator("canvas").first();
    await canvas.waitFor({ timeout: RENDER_TIMEOUT });
    await sleep(SETTLE_MS);

    // A stub <canvas> can exist with zero size even if WebGL failed — require
    // real pixels so a dead scene cannot slip through.
    canvasBox = await canvas.boundingBox();
    if (!canvasBox || canvasBox.width < 1 || canvasBox.height < 1) {
      throw new Error(
        `game canvas has no size (${canvasBox ? `${canvasBox.width}x${canvasBox.height}` : "null"})`,
      );
    }
    console.log(
      `[e2e-ingame] game canvas rendered (${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)})`,
    );
  } catch (e) {
    renderError = e;
  }

  // Always capture — a failure shot is the most useful artifact.
  await page.screenshot({ path: SHOT }).catch(() => undefined);
  console.log(`[e2e-ingame] screenshot → ${path.relative(ROOT, SHOT)}`);

  await browser.close();

  if (consoleErrors.length > 0) {
    console.warn(`[e2e-ingame] ${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors) console.warn(`  - ${e}`);
  }

  const problems = [];
  if (renderError !== null) {
    problems.push(`game scene did not render: ${renderError.message}`);
  }
  // An uncaught exception while entering the game is a hard render regression.
  if (pageErrors.length > 0) {
    problems.push(`runtime error(s) on game load:\n  ${pageErrors.join("\n  ")}`);
  }
  // No screenshot on disk means the whole run collapsed — never pass silently.
  if (!fs.existsSync(SHOT) || fs.statSync(SHOT).size === 0) {
    problems.push("no in-game screenshot was produced");
  }

  if (problems.length > 0) {
    console.error("[e2e-ingame] FAILED:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }

  console.log("[e2e-ingame] PASSED — game scene renders under base path");
}

main().catch((e) => {
  console.error("[e2e-ingame] Fatal:", e.message);
  process.exit(1);
});
