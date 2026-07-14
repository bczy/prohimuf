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
 * Since the pre-game redesign (ADR-0020) a cold load lands on the new TITLE
 * zine-cover, and a single action enters the MENU (the zine interior with the
 * NIVEAUX flyer wall / SCORES UNE / OPTIONS colophon). This script drives that
 * new flow: assert the title renders, perform the single-action entry, then
 * assert the menu shell renders.
 *
 * Hard gates (exit 1 on failure):
 *   - the TITLE cover renders (the "MUF" logo + the subtitle tagline),
 *   - a single action (click on the cover) advances to the MENU,
 *   - the MENU shell renders (running masthead + NIVEAUX/SCORES/OPTIONS rubriques),
 *   - every level `name` from levelArt.json is visible as a flyer,
 *   - the first level (default-unlocked) does NOT show the "LIGNE FERMÉE" marker,
 *   - the SCORES rubrique renders its empty-state, the OPTIONS rubrique its settings,
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
import {
  createFailedResponseCollector,
  enterMenuFromTitle,
  loadLevelManifest,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-home.png");

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// Locked-flyer stamp (menu/LevelFlyer.tsx LOCKED_COPY.badge), shown only when !unlocked.
// The TITLE_SUBTITLE / MENU_MASTHEAD markers live in e2e-lib.mjs (enterMenuFromTitle).
const LOCKED_MARKER = "LIGNE FERMÉE";

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

    // Cold load lands on the TITLE cover (ADR-0020); the "MUF" logo proves the
    // React app booted and its bundle resolved.
    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });

    // TITLE cover → single-action entry → MENU shell (shared helper owns the
    // assert-subtitle → click → wait-masthead sequence and its marker strings).
    await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
    console.log("[e2e] TITLE cover entered → MENU shell mounted");

    // The three rubriques are present in the shell.
    for (const rubrique of ["NIVEAUX", "SCORES", "OPTIONS"]) {
      await page.getByRole("tab", { name: rubrique }).waitFor({ timeout: RENDER_TIMEOUT });
    }
    console.log("[e2e] MENU rubriques rendered (NIVEAUX/SCORES/OPTIONS)");

    // Every level from the manifest appears as a flyer (playable or locked).
    for (const level of levels) {
      await page
        .getByText(level.name, { exact: true })
        .first()
        .waitFor({ timeout: RENDER_TIMEOUT });
    }
    console.log(`[e2e] all ${String(levels.length)} level name(s) visible`);

    // The first level is unlocked by default → its flyer must NOT carry the
    // locked stamp. Scope the check to the flyer (the role=button that holds the
    // level name).
    const firstFlyer = page.getByRole("button").filter({ hasText: firstLevel.name }).first();
    const firstFlyerText = await firstFlyer.innerText();
    if (firstFlyerText.includes(LOCKED_MARKER)) {
      throw new Error(`first level "${firstLevel.name}" is shown as ${LOCKED_MARKER}`);
    }
    console.log(`[e2e] first level "${firstLevel.name}" unlocked (no ${LOCKED_MARKER})`);

    // SCORES rubrique renders its journal empty-state (fresh storage → no scores).
    await page.getByRole("tab", { name: "SCORES" }).click({ timeout: RENDER_TIMEOUT });
    await page.getByText("AUCUN MÉFAIT SIGNALÉ").first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log("[e2e] SCORES rubrique empty-state renders");

    // OPTIONS rubrique renders its colophon settings (masthead + difficulty row).
    await page.getByRole("tab", { name: "OPTIONS" }).click({ timeout: RENDER_TIMEOUT });
    await page.getByText("OURS", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
    await page.getByText("PRESSION", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log("[e2e] OPTIONS rubrique settings render");
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
