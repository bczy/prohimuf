#!/usr/bin/env node
/**
 * Style B preview: drive the built game in a real (headless) browser and grab
 * high-resolution screenshots of the menu and each level in play, so the pixel
 * art can be reviewed with full WebGL lighting and live enemy sprites.
 *
 * Runs in CI (GitHub Actions) where a Chromium binary is available. Expects a
 * server already serving the production build at PREVIEW_URL.
 *
 * Output: screenshots/*.png
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

// 16:9 at 2x device scale → 3840×2160 PNGs ("grosses images" for definition).
const VIEWPORT = { width: 1920, height: 1080 };
const DEVICE_SCALE = 2;

const LEVELS = [
  { id: "belliard", name: "Rue Belliard" },
  { id: "stalingrad", name: "Stalingrad" },
  { id: "vitry", name: "Vitry — 94" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissNarrative(page) {
  // Pre-level narrative shows a "Passer" (skip) button; click it until gone.
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

async function captureLevel(context, level) {
  const page = await context.newPage();
  // Unlock every level and silence audio before the app boots.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("muf_progress", JSON.stringify(["belliard", "stalingrad", "vitry"]));
      localStorage.setItem(
        "muf_prefs",
        JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal" }),
      );
    } catch {
      // ignore storage failures
    }
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.getByText("MUF", { exact: true }).first().waitFor({ timeout: 20000 });

  // Capture the menu once (on the first level pass).
  if (level.id === LEVELS[0].id) {
    await page.screenshot({ path: path.join(OUT_DIR, "00_menu.png") });
    console.log("  captured 00_menu.png");
  }

  await page.getByText(level.name, { exact: true }).first().click();
  await dismissNarrative(page);

  // Wait for the WebGL canvas, then let enemies spawn before the shot.
  await page.locator("canvas").first().waitFor({ timeout: 20000 });
  await sleep(7000);

  const file = path.join(OUT_DIR, `level_${level.id}.png`);
  await page.screenshot({ path: file });
  console.log(`  captured level_${level.id}.png`);
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
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

  for (const level of LEVELS) {
    console.log(`[level] ${level.name}`);
    try {
      await captureLevel(context, level);
    } catch (e) {
      console.error(`  failed ${level.id}: ${e.message}`);
    }
  }

  await browser.close();

  const produced = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
  if (produced.length === 0) {
    throw new Error("no screenshots were produced");
  }
  console.log(`done — ${produced.length} screenshot(s): ${produced.join(", ")}`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
