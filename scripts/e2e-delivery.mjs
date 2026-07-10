#!/usr/bin/env node
/**
 * E2E smoke test — DELIVERY loop ("Livrer" = protect the delivery vehicle).
 *
 * Purpose: the render smoke (e2e-ingame) only proves the scene mounts; it never
 * exercises the scripted delivery beat. This gate boots the production build,
 * enters belliard, and watches one full delivery play out end to end — the
 * banner, the vehicle sprite loading, and the success resolution — so a broken
 * delivery state machine, a missing vehicle asset, or a HUD regression is caught
 * before release.
 *
 * Determinism (why success is guaranteed): cops are frozen VISIBLE and never
 * enter SHOOTING (window.__MUF_FREEZE_COPS__), so the delivery takes zero damage
 * → integrity stays full → the window closes on SUCCESS every run. Audio is
 * muted. No new src hooks and no new window.__MUF_* flags are introduced
 * (architect ruling): this drives the real, shipped game only.
 *
 * belliard's delivery (src/game/levels/levels.ts → deliveries[0]): vehicleType
 * "truck", triggerAtElapsedSeconds 20, windowSeconds 8. The truck sprite path is
 * read from levelArt.json (vehicles.types.truck.asset) so it tracks the manifest.
 *
 * Hard gates (exit 1 on any):
 *   - the DELIVERING banner appears within (trigger + 15s) of the scene mounting,
 *   - a 2xx same-origin response for the vehicle sprite asset is observed,
 *   - the SUCCESS banner appears after the delivery window,
 *   - zero uncaught runtime error (pageerror) during the run.
 *
 * Drives the built site in headless Chromium with SwiftShader (no GPU in CI).
 * Expects a server serving the production build at PREVIEW_URL.
 *
 * Output: screenshots/e2e-delivery.png (uploaded as a CI artifact for review).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  loadLevelManifest,
  seedDeterminism,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const SHOT = path.join(OUT_DIR, "e2e-delivery.png");

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1;
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// belliard's scripted delivery (src/game/levels/levels.ts, deliveries[0]).
const LEVEL_ID = "belliard";
const TRIGGER_S = 20;
const WINDOW_S = 8;
const VEHICLE_TYPE = "truck";

// HUD banner strings (src/render/ui/HUD.tsx).
const BANNER_DELIVERING = "LIVRAISON — PROTÉGEZ LE VÉHICULE !";
const BANNER_SUCCESS = "LIVRAISON SÉCURISÉE";

// Generous but bounded: the vehicle must roll in and reach DELIVERING within
// (trigger + 15s) of the scene mounting; SUCCESS follows once the window closes.
const BANNER_TIMEOUT = (TRIGGER_S + 15) * 1000;
const SUCCESS_TIMEOUT = (WINDOW_S + 15) * 1000;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { levels, levelIds, manifest } = loadLevelManifest(ROOT);
  const level = levels.find((l) => l.id === LEVEL_ID) ?? levels[0];
  if (level === undefined) throw new Error("levelArt.json declares no levels");

  const vehicleAsset = manifest.vehicles?.types?.[VEHICLE_TYPE]?.asset;
  if (typeof vehicleAsset !== "string" || vehicleAsset.length === 0) {
    throw new Error(`levelArt.json has no vehicles.types.${VEHICLE_TYPE}.asset`);
  }

  const origin = new URL(PREVIEW_URL).origin;
  const pageErrors = [];
  let vehicleAssetOk = false; // observed a 2xx for the vehicle sprite

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  await seedDeterminism(page, levelIds);

  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    const url = res.url();
    if (!url.startsWith(origin)) return;
    if (!new URL(url).pathname.endsWith(vehicleAsset)) return;
    if (res.status() >= 200 && res.status() < 300) vehicleAssetOk = true;
  });

  let runError = null;
  try {
    console.log(`[e2e-delivery] loading ${PREVIEW_URL}`);
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });

    console.log(`[e2e-delivery] entering level "${level.name}"`);
    await page.getByText(level.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
    await dismissNarrative(page);

    await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
    console.log(`[e2e-delivery] scene mounted — waiting for delivery (trigger ~${TRIGGER_S}s)`);

    // The DELIVERING banner proves the vehicle rolled in and opened its window.
    await page.getByText(BANNER_DELIVERING).first().waitFor({ timeout: BANNER_TIMEOUT });
    console.log("[e2e-delivery] DELIVERING banner shown");

    // Snapshot the active delivery before it resolves.
    await page.screenshot({ path: SHOT }).catch(() => undefined);

    // Frozen cops never shoot → full integrity → the window closes on SUCCESS.
    await page.getByText(BANNER_SUCCESS).first().waitFor({ timeout: SUCCESS_TIMEOUT });
    console.log("[e2e-delivery] SUCCESS banner shown");

    // Capture the resolved success state as the final artifact.
    await page.screenshot({ path: SHOT }).catch(() => undefined);
  } catch (e) {
    runError = e;
    await page.screenshot({ path: SHOT }).catch(() => undefined);
  }

  console.log(`[e2e-delivery] screenshot → ${path.relative(ROOT, SHOT)}`);
  await browser.close();

  const problems = [];
  if (runError !== null) {
    problems.push(`delivery did not complete: ${runError.message}`);
  }
  if (!vehicleAssetOk) {
    problems.push(`no 2xx response observed for vehicle sprite (${vehicleAsset})`);
  }
  if (pageErrors.length > 0) {
    problems.push(`runtime error(s) during delivery:\n  ${pageErrors.join("\n  ")}`);
  }

  if (problems.length > 0) {
    console.error("[e2e-delivery] FAILED:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }

  console.log("[e2e-delivery] PASSED — delivery loop reaches SUCCESS on belliard");
}

main().catch((e) => {
  console.error("[e2e-delivery] Fatal:", e.message);
  process.exit(1);
});
