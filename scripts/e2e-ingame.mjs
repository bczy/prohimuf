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
 * By default it enters ONLY the first level (belliard) so it stays fast and
 * deterministic in CI. Set E2E_ALL_LEVELS=1 to iterate EVERY level from
 * levelArt.json (enter → gate → reload) — a broader smoke for release builds.
 * The full per-level contact sheet still lives in scripts/screenshot-preview.mjs.
 *
 * Drives the built site in headless Chromium with WebGL via SwiftShader (no GPU
 * in CI). Expects a server already serving the production build at PREVIEW_URL
 * (the URL must include the deploy base, e.g. http://127.0.0.1:4173/prohimuf/).
 *
 * Hard gates (exit 1 on any):
 *   - the game <canvas> mounts AND has non-zero pixel dimensions (proves the R3F
 *     Canvas mounted and a WebGL context was acquired, not just an empty stub),
 *   - the DOM HUD shows the score, lives and the level name,
 *   - no uncaught runtime error (pageerror) fires while entering the game,
 *   - no same-origin request 404s/5xxs during the run (asset/base-path guard),
 *   - at least one screenshot is actually written to disk.
 * Soft signal: console errors are logged but do not, on their own, fail.
 *
 * Determinism: cops are frozen (window.__MUF_FREEZE_COPS__) and sound is muted
 * (muf_prefs), matching screenshot-preview.mjs. Unlike the capture gates, this
 * smoke seeds crt:true on purpose — it is the retained path that boots the CRT
 * post-process under SwiftShader so the ADR-0031 publish guard still exercises
 * the CRT shaders in CI.
 *
 * Output: screenshots/e2e-ingame.png (first level) [+ e2e-ingame-<id>.png each
 * additional level in E2E_ALL_LEVELS mode]. Uploaded as CI artifacts.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import {
  SWIFTSHADER_ARGS,
  createFailedResponseCollector,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-ingame.png"); // canonical (first level)

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1;
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const SETTLE_MS = 2000; // let the scene draw a frame (and any mount error surface)

const ALL_LEVELS = process.env.E2E_ALL_LEVELS === "1";
const LIVES = 3; // seeded via muf_prefs in seedDeterminism

// Per-level screenshot path: the first level keeps the canonical name so the CI
// artifact contract is unchanged; extra levels get a suffixed file.
function shotFor(index, id) {
  return index === 0 ? SHOT : path.join(OUT_DIR, `e2e-ingame-${id}.png`);
}

/** Enter one level from the menu and run the canvas + HUD gates. */
async function checkLevel(page, level, index) {
  console.log(`[e2e-ingame] entering level "${level.name}"`);
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

  // Cold load lands on the TITLE cover (ADR-0021). Perform the single-action
  // entry to reach the MENU before selecting a flyer — the "MUF" logo alone can't
  // distinguish TITLE from MENU (shared helper).
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });

  // Activate the level's flyer → play (through the pre-level narrative if any).
  await page.getByText(level.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);

  // The gameplay <canvas> mounting proves the R3F scene booted.
  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ timeout: RENDER_TIMEOUT });
  await sleep(SETTLE_MS);

  // A stub <canvas> can exist with zero size even if WebGL failed — require real
  // pixels so a dead scene cannot slip through.
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox || canvasBox.width < 1 || canvasBox.height < 1) {
    throw new Error(
      `game canvas has no size (${canvasBox ? `${canvasBox.width}x${canvasBox.height}` : "null"})`,
    );
  }
  console.log(
    `[e2e-ingame] "${level.name}" canvas rendered (${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)})`,
  );

  // HUD gate: the DOM overlay must show the score, the lives, and the level name.
  await page.getByText("score", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
  // Score seeds at 0, padded to 4 digits in the HUD.
  await page.getByText("0000", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
  // Lives seeded to 3 → three hearts.
  await page
    .getByText("♥".repeat(LIVES), { exact: true })
    .first()
    .waitFor({ timeout: RENDER_TIMEOUT });
  // Level name is surfaced to the HUD (App.tsx passes selectedLevel.name).
  await page.getByText(level.name, { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
  console.log(`[e2e-ingame] "${level.name}" HUD ok (score + ${String(LIVES)} lives + level name)`);

  const shot = shotFor(index, level.id);
  await page.screenshot({ path: shot }).catch(() => undefined);
  console.log(`[e2e-ingame] screenshot → ${path.relative(ROOT, shot)}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { levels, levelIds } = loadLevelManifest(ROOT);
  const first = levels[0];
  if (first === undefined) throw new Error("levelArt.json declares no levels");

  // Default: first level only. Optional single-level override by display name.
  // E2E_ALL_LEVELS=1: every level.
  let targets;
  if (ALL_LEVELS) {
    targets = levels;
  } else if (process.env.E2E_LEVEL_NAME !== undefined) {
    const named = levels.find((l) => l.name === process.env.E2E_LEVEL_NAME);
    targets = [named ?? first];
  } else {
    targets = [first];
  }

  const origin = new URL(PREVIEW_URL).origin;
  const consoleErrors = [];
  const pageErrors = [];
  const { failed: failedRequests, onResponse } = createFailedResponseCollector(origin);

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  // Unlock ids come from the manifest, never a hardcoded list.
  // crt: true — this smoke is the retained CRT-on path: it is the one gate that
  // must boot the CrtPass under SwiftShader so the ADR-0031 publish guard keeps
  // compiling+exercising the CRT shaders in CI (the capture gates seed crt:false).
  await seedDeterminism(page, levelIds, { crt: true });

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", onResponse);

  let renderError = null;
  try {
    console.log(`[e2e-ingame] loading ${PREVIEW_URL} (${String(targets.length)} level(s))`);
    for (let i = 0; i < targets.length; i++) {
      await checkLevel(page, targets[i], i);
    }
  } catch (e) {
    renderError = e;
    // Best-effort failure shot for the level we choked on.
    await page.screenshot({ path: SHOT }).catch(() => undefined);
  }

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
  // A same-origin 4xx/5xx means a missing asset or a broken base path.
  if (failedRequests.length > 0) {
    problems.push(`failed same-origin request(s):\n  ${failedRequests.join("\n  ")}`);
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
