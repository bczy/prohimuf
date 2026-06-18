#!/usr/bin/env node
/**
 * Preview harness: drive the built game in a real (headless) browser and grab
 * high-resolution screenshots of the menu and every level in play, then stitch
 * them into a single contact sheet for quick review.
 *
 * Level list comes from the shared manifest (src/game/levels/levelArt.json).
 * Runs in CI (GitHub Actions) where a Chromium binary is available. Expects a
 * server already serving the production build at PREVIEW_URL.
 *
 * Output: screenshots/*.png  (+ screenshots/overview.png)
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");

// 16:9 at 2x device scale → 3840×2160 PNGs ("grosses images" for definition).
const VIEWPORT = { width: 1920, height: 1080 };
const DEVICE_SCALE = 2;
const ENEMY_WAIT_MS = 15000; // let cops appear in the windows before the shot

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "src/game/levels/levelArt.json"), "utf8"),
);
const LEVELS = manifest.levels.map((l) => ({ id: l.id, name: l.name }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function captureLevel(context, level, withMenu) {
  const page = await context.newPage();
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

  if (withMenu) {
    await page.screenshot({ path: path.join(OUT_DIR, "00_menu.png") });
    console.log("  captured 00_menu.png");
  }

  await page.getByText(level.name, { exact: true }).first().click();
  await dismissNarrative(page);

  await page.locator("canvas").first().waitFor({ timeout: 20000 });
  await sleep(ENEMY_WAIT_MS);

  await page.screenshot({ path: path.join(OUT_DIR, `level_${level.id}.png`) });
  console.log(`  captured level_${level.id}.png`);
  await page.close();
}

// Stitch the captured shots into one labelled contact sheet.
async function buildContactSheet() {
  let canvasMod;
  try {
    canvasMod = await import("@napi-rs/canvas");
  } catch {
    console.log("  (skip contact sheet — @napi-rs/canvas unavailable)");
    return;
  }
  const { createCanvas, loadImage } = canvasMod;

  const shots = ["00_menu.png", ...LEVELS.map((l) => `level_${l.id}.png`)].filter((f) =>
    fs.existsSync(path.join(OUT_DIR, f)),
  );
  if (shots.length === 0) return;

  const cols = 2;
  const rows = Math.ceil(shots.length / cols);
  const cellW = 960;
  const cellH = 540;
  const pad = 24;
  const label = 34;
  const W = cols * cellW + (cols + 1) * pad;
  const H = rows * (cellH + label) + (rows + 1) * pad;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < shots.length; i++) {
    const img = await loadImage(path.join(OUT_DIR, shots[i]));
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = pad + c * (cellW + pad);
    const y = pad + r * (cellH + label + pad);
    ctx.fillStyle = "#ffe600";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(shots[i].replace(".png", ""), x, y + 24);
    ctx.drawImage(img, x, y + label, cellW, cellH);
  }

  fs.writeFileSync(path.join(OUT_DIR, "overview.png"), canvas.toBuffer("image/png"));
  console.log(`  wrote overview.png (${shots.length} shots)`);
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
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });

  for (let i = 0; i < LEVELS.length; i++) {
    console.log(`[level] ${LEVELS[i].name}`);
    try {
      await captureLevel(context, LEVELS[i], i === 0);
    } catch (e) {
      console.error(`  failed ${LEVELS[i].id}: ${e.message}`);
    }
  }

  await browser.close();
  await buildContactSheet();

  const produced = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
  if (produced.length === 0) throw new Error("no screenshots were produced");
  console.log(`done — ${produced.length} screenshot(s): ${produced.join(", ")}`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
