#!/usr/bin/env node
/**
 * E2E smoke test — home screen ("écran d'accueil" = MainMenu).
 *
 * Purpose: catch BUILD and DEPLOY-CONFIG regressions before publishing to
 * GitHub Pages. The menu is pure DOM (no WebGL canvas), so this is fast and
 * deterministic, yet it exercises the whole production bundle under its real
 * deploy base path. The base-path bug that served a 404 instead of the game
 * would have been caught here: a wrong `base` makes the JS/CSS and the fanzine
 * facade background 404, and the menu never renders.
 *
 * Drives the built site in headless Chromium. Expects a server already serving
 * the production build at PREVIEW_URL (the URL must include the deploy base,
 * e.g. http://127.0.0.1:4173/prohimuf/ or .../prohimuf/preview/<branch>/).
 *
 * Hard gates (exit 1 on failure):
 *   - the menu renders (title "MUF", tagline, tabs NIVEAUX/SCORES/OPTIONS),
 *   - every level `name` from levelArt.json is visible in the list,
 *   - the first level (default-unlocked) does NOT show the "VERROUILLÉ" marker,
 *   - the SCORES tab renders its empty-state, the OPTIONS tab its settings,
 *   - no same-origin request 404s/5xxs (asset & base-path config guard).
 * Soft signal: console/page errors are logged but do not fail the deploy.
 *
 * Note: this run is intentionally NOT seeded (no muf_progress), so the default
 * unlock state applies — only the first level is unlocked, which is exactly the
 * state the lock-marker assertion checks.
 *
 * Output: screenshots/e2e-home.png (uploaded as a CI artifact for review).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { createFailedResponseCollector, loadLevelManifest } from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-home.png");

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

const LOCKED_MARKER = "VERROUILLÉ"; // MainMenu.tsx LevelCard, shown only when !unlocked

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { levels } = loadLevelManifest(ROOT);
  const firstLevel = levels[0];
  if (firstLevel === undefined) throw new Error("levelArt.json declares no levels");

  const origin = new URL(PREVIEW_URL).origin;
  const consoleErrors = [];
  const { failed: failedRequests, onResponse } = createFailedResponseCollector(origin);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("response", onResponse);

  let renderError = null;
  try {
    console.log(`[e2e] loading ${PREVIEW_URL}`);
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    // The menu mounting proves the React app booted and its bundle resolved.
    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
    await page.getByText("UNDERGROUND PARIS — 1998").first().waitFor({ timeout: RENDER_TIMEOUT });

    // All three tabs present.
    for (const tab of ["NIVEAUX", "SCORES", "OPTIONS"]) {
      await page.getByRole("button", { name: tab }).waitFor({ timeout: RENDER_TIMEOUT });
    }
    console.log("[e2e] home screen rendered (title + tagline + NIVEAUX/SCORES/OPTIONS)");

    // Every level from the manifest appears as a card.
    for (const level of levels) {
      await page
        .getByText(level.name, { exact: true })
        .first()
        .waitFor({ timeout: RENDER_TIMEOUT });
    }
    console.log(`[e2e] all ${String(levels.length)} level name(s) visible`);

    // The first level is unlocked by default → its card must NOT show the lock
    // marker. Scope the check to the card (ancestor of the level-name element).
    const firstCard = page
      .getByText(firstLevel.name, { exact: true })
      .first()
      .locator("xpath=ancestor::div[3]");
    const firstCardText = await firstCard.innerText();
    if (firstCardText.includes(LOCKED_MARKER)) {
      throw new Error(`first level "${firstLevel.name}" is shown as ${LOCKED_MARKER}`);
    }
    console.log(`[e2e] first level "${firstLevel.name}" unlocked (no ${LOCKED_MARKER})`);

    // SCORES tab renders its empty-state (fresh storage → no scores).
    await page.getByRole("button", { name: "SCORES" }).click({ timeout: RENDER_TIMEOUT });
    await page.getByText("AUCUN SCORE ENREGISTRÉ").first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log("[e2e] SCORES tab empty-state renders");

    // OPTIONS tab renders its settings (volume + difficulty labels).
    await page.getByRole("button", { name: "OPTIONS" }).click({ timeout: RENDER_TIMEOUT });
    await page.getByText("VOLUME SFX").first().waitFor({ timeout: RENDER_TIMEOUT });
    await page.getByText("DIFFICULTÉ").first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log("[e2e] OPTIONS tab settings render");
  } catch (e) {
    renderError = e;
  }

  // Always capture the screenshot — a failure shot is the most useful artifact.
  await page.screenshot({ path: SHOT }).catch(() => undefined);
  console.log(`[e2e] screenshot → ${path.relative(ROOT, SHOT)}`);

  await browser.close();

  // Soft signal: surface runtime errors without blocking the deploy on them.
  if (consoleErrors.length > 0) {
    console.warn(`[e2e] ${consoleErrors.length} console/page error(s):`);
    for (const e of consoleErrors) console.warn(`  - ${e}`);
  }

  const problems = [];
  if (renderError !== null) {
    problems.push(`home screen did not render: ${renderError.message}`);
  }
  if (failedRequests.length > 0) {
    problems.push(`failed same-origin request(s):\n  ${failedRequests.join("\n  ")}`);
  }

  if (problems.length > 0) {
    console.error("[e2e] FAILED:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }

  console.log("[e2e] PASSED — home screen healthy under base path");
}

main().catch((e) => {
  console.error("[e2e] Fatal:", e.message);
  process.exit(1);
});
