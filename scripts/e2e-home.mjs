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
 *   - the menu renders (title "MUF", tagline, "NIVEAUX" tab),
 *   - no same-origin request 404s/5xxs (asset & base-path config guard).
 * Soft signal: console/page errors are logged but do not fail the deploy.
 *
 * Output: screenshots/e2e-home.png (uploaded as a CI artifact for review).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-home.png");

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// Requests we never treat as failures: the browser asks for /favicon.ico even
// though the app declares none, and that 404 is not a regression.
const IGNORED_PATHS = ["/favicon.ico"];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const origin = new URL(PREVIEW_URL).origin;
  const consoleErrors = [];
  const failedRequests = [];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("response", (res) => {
    const url = res.url();
    if (!url.startsWith(origin)) return; // ignore any third-party request
    if (IGNORED_PATHS.some((p) => new URL(url).pathname.endsWith(p))) return;
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${url}`);
  });

  let renderError = null;
  try {
    console.log(`[e2e] loading ${PREVIEW_URL}`);
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    // The menu mounting proves the React app booted and its bundle resolved.
    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });
    await page.getByText("UNDERGROUND PARIS — 1998").first().waitFor({ timeout: RENDER_TIMEOUT });
    await page.getByText("NIVEAUX").first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log("[e2e] home screen rendered (title + tagline + NIVEAUX tab)");
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
