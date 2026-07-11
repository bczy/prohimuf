#!/usr/bin/env node
/**
 * PREVIEW: vehicle neon halo, in-game composite (story-halo-alpha-composite-gate).
 *
 * Bertrand asked for eyes on the *composed in-game halo* — the neon rim exists
 * only at RUNTIME (ADR-0011, src/render/scene/vehicleNeon.ts), so the delivered
 * PNG shows nothing and the ASSET gate is blind to it. This tool boots the built
 * game, plays each level's scripted delivery until the vehicle + rim are on
 * screen, and captures review screenshots so the alpha-gradient falloff can be
 * eyeballed (and fed to lead-art's in-game composite gate, AC5/AC6).
 *
 * One pair per vehicle type, driven from the shipped levels:
 *   belliard  → truck  (orange)
 *   stalingrad→ car    (cyan)
 *   vitry     → moto   (magenta)
 * seedDeterminism unlocks every level and freezes cops VISIBLE, so each delivery
 * plays out deterministically to its DELIVERING window.
 *
 * For each type it writes:
 *   screenshots/preview-vehicle-<type>.png          full 1280×720 frame
 *   screenshots/preview-vehicle-<type>-closeup.png  crop around the vehicle
 * The close-up is cropped to the densest neon-hue cluster (the rim bbox, located
 * by scripts/check-halo-gradient.mjs); if the cluster can't be located it falls
 * back to a generous fixed crop of the street lane.
 *
 * This is a REVIEW tool, not a gate — it never exits non-zero on a bad-looking
 * halo (that judgement is the mechanical check in e2e-delivery.mjs + the lead-art
 * verdict). It exits non-zero only if it cannot drive a delivery at all.
 *
 * Drives the built site in headless Chromium with SwiftShader (no GPU). Expects a
 * server serving the production build at PREVIEW_URL (same convention as
 * e2e-delivery.mjs). Reuses SWIFTSHADER_ARGS / dismissNarrative /
 * loadLevelManifest / seedDeterminism from e2e-lib.mjs.
 *
 *   yarn build && yarn preview        # or: node_modules/.bin/vite preview ...
 *   PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/preview-vehicle-halo.mjs
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
import { checkHaloGradient } from "./check-halo-gradient.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1; // 1:1 so halo-bbox pixel coords map straight to a clip
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// HUD banner (src/render/ui/HUD.tsx) — proves the vehicle rolled in.
const BANNER_DELIVERING = "LIVRAISON — PROTÉGEZ LE VÉHICULE !";

// (levelId, vehicleType) pairs — one per shipped vehicle. triggerAtElapsedSeconds
// from src/game/levels/levels.ts drives the wait budget (trigger + 15s slack).
const PAIRS = [
  { levelId: "belliard", type: "truck", triggerS: 20 },
  { levelId: "stalingrad", type: "car", triggerS: 25 },
  { levelId: "vitry", type: "moto", triggerS: 18 },
];

async function capturePair(context, manifest, level, pair) {
  const type = pair.type;
  const neon = manifest.vehicles?.types?.[type]?.neon ?? "cyan";
  const bannerTimeout = (pair.triggerS + 15) * 1000;

  const fullShot = path.join(OUT_DIR, `preview-vehicle-${type}.png`);
  const closeShot = path.join(OUT_DIR, `preview-vehicle-${type}-closeup.png`);

  const page = await context.newPage();
  try {
    console.log(`\n[preview-halo] ${type} @ ${level.name} — loading ${PREVIEW_URL}`);
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
    await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });

    await page.getByText(level.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
    await dismissNarrative(page);
    await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });

    console.log(`[preview-halo] ${type} — waiting for delivery (trigger ~${pair.triggerS}s)`);
    await page.getByText(BANNER_DELIVERING).first().waitFor({ timeout: bannerTimeout });

    // Full frame — the artifact lead-art reviews.
    const buf = await page.screenshot({ path: fullShot });
    console.log(`[preview-halo] ${type} — full frame → ${path.relative(ROOT, fullShot)}`);

    // Close-up: locate the rim cluster via the halo checker's bbox, else fall
    // back to a generous fixed crop of the street lane (lower-centre band).
    let clip = {
      x: Math.round(VIEWPORT.width * 0.2),
      y: Math.round(VIEWPORT.height * 0.45),
      width: Math.round(VIEWPORT.width * 0.6),
      height: Math.round(VIEWPORT.height * 0.4),
    };
    try {
      const { metrics } = await checkHaloGradient({ buffer: buf, neon, quiet: true });
      const b = metrics.bbox;
      if (b.located) {
        const x = Math.max(0, b.x0);
        const y = Math.max(0, b.y0);
        clip = {
          x,
          y,
          width: Math.min(VIEWPORT.width - x, b.x1 - b.x0 + 1),
          height: Math.min(VIEWPORT.height - y, b.y1 - b.y0 + 1),
        };
        console.log(
          `[preview-halo] ${type} — rim cluster located, cropping [${clip.x},${clip.y} ${clip.width}x${clip.height}]`,
        );
      } else {
        console.log(`[preview-halo] ${type} — rim cluster not located, using street-lane crop`);
      }
    } catch (e) {
      console.log(`[preview-halo] ${type} — halo locate skipped (${e.message}); street-lane crop`);
    }

    await page.screenshot({ path: closeShot, clip });
    console.log(`[preview-halo] ${type} — close-up → ${path.relative(ROOT, closeShot)}`);
    return true;
  } catch (e) {
    await page.screenshot({ path: fullShot }).catch(() => undefined);
    console.error(`[preview-halo] ${type} — FAILED to reach delivery: ${e.message}`);
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { levels, levelIds, manifest } = loadLevelManifest(ROOT);

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  await seedDeterminism(context, levelIds);

  let failures = 0;
  for (const pair of PAIRS) {
    const level = levels.find((l) => l.id === pair.levelId);
    if (level === undefined) {
      console.error(`[preview-halo] levelArt.json has no level "${pair.levelId}" — skipping ${pair.type}`);
      failures++;
      continue;
    }
    const ok = await capturePair(context, manifest, level, pair);
    if (!ok) failures++;
  }

  await browser.close();

  if (failures > 0) {
    console.error(`\n[preview-halo] ${failures} vehicle preview(s) failed to reach delivery`);
    process.exit(1);
  }
  console.log(`\n[preview-halo] done — ${PAIRS.length} vehicle halo previews captured in ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((e) => {
  console.error("[preview-halo] Fatal:", e.message);
  process.exit(1);
});
