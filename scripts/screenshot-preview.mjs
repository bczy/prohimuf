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
import { enterMenuFromTitle, waitForFlyerWallSettled } from "./e2e-lib.mjs";

const ROOT = process.cwd();
const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");

// 16:9 at 2x device scale → 3840×2160 PNGs ("grosses images" for definition).
const VIEWPORT = { width: 1920, height: 1080 };
const DEVICE_SCALE = 2;
const ENEMY_WAIT_MS = 4000; // cops are frozen VISIBLE (see addInitScript), so a short settle is enough

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
    // Freeze cops VISIBLE so every capture reliably shows them at full size.
    window.__MUF_FREEZE_COPS__ = true;
    try {
      localStorage.setItem("muf_progress", JSON.stringify(["belliard", "stalingrad", "vitry"]));
      // crt:false — the CRT post-process (animated grain/flicker + scanline comb +
      // bloom, ADR-0031) would contaminate every art artifact in the contact sheet;
      // captures must show the flat scene, not the CRT overlay.
      localStorage.setItem(
        "muf_prefs",
        JSON.stringify({
          soundVolume: 0,
          musicVolume: 0,
          lives: 3,
          difficulty: "normal",
          crt: false,
        }),
      );
    } catch {
      // ignore storage failures
    }
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Cold load lands on the TITLE cover (ADR-0021); enter the MENU before the
  // withMenu capture / level click — "MUF" alone no longer means "on the menu"
  // (shared helper, in sync with the e2e gates).
  await enterMenuFromTitle(page);

  if (withMenu) {
    // Hold until the flyer-wall entrance has actually finished, not for a duration
    // guessed from its stagger and length (see waitForFlyerWallSettled).
    //
    // Isolated on purpose: this menu capture is a BYSTANDER in this function, whose real
    // job is the level shot below. Letting the settle wait throw here would abort before
    // the level click and silently drop `level_<first>.png`, which nothing else in the
    // script re-attempts — a cosmetic wait must not be able to cost an unrelated capture.
    // Two separate catches, not one around both: a single block would report a disk or
    // page-crash failure in `screenshot()` as "flyer wall never settled", sending the
    // next engineer after a phantom animation-timing bug.
    let settled = true;
    try {
      await waitForFlyerWallSettled(page);
    } catch (e) {
      settled = false;
      console.error(`  failed 00_menu.png (flyer wall never settled): ${e.message}`);
    }
    if (settled) {
      try {
        await page.screenshot({ path: path.join(OUT_DIR, "00_menu.png") });
        console.log("  captured 00_menu.png");
      } catch (e) {
        console.error(`  failed 00_menu.png (screenshot failed): ${e.message}`);
      }
    }
  }

  await page.getByText(level.name, { exact: true }).first().click();
  await dismissNarrative(page);

  await page.locator("canvas").first().waitFor({ timeout: 20000 });
  await sleep(ENEMY_WAIT_MS);

  await page.screenshot({ path: path.join(OUT_DIR, `level_${level.id}.png`) });
  console.log(`  captured level_${level.id}.png`);
  await page.close();
}

// Capture a front-end screen booted directly via the ?preview= hook (no play).
// `settleFlyers` additionally waits out the NIVEAUX entrance animation; the flat sleep
// covers the typewriter/backdrop, but only the flyer wall has a settle condition we can
// actually observe, so that screen waits on the real thing instead of a duration.
async function captureScreen(context, file, query, { settleFlyers = false } = {}) {
  const page = await context.newPage();
  const out = path.join(OUT_DIR, file);
  try {
    await page.goto(`${BASE_URL}${query}`, { waitUntil: "networkidle" });
    await sleep(2500); // let the typewriter / backdrop settle

    // A settle failure here just falls through to the outer catch, leaving whatever
    // `captureLevel` already wrote in place. That file is NOT stale: captureLevel now
    // waits for the same settle condition and skips its screenshot entirely when the
    // wait fails, so a mid-animation 00_menu.png can no longer exist. Deleting it on
    // this second, independent page load would therefore destroy a good capture over a
    // failure unrelated to animation timing (a slow runner, a hiccup on ?preview=menu).
    if (settleFlyers) await waitForFlyerWallSettled(page);

    await page.screenshot({ path: out });
    console.log(`  captured ${file}`);
  } catch (e) {
    console.error(`  failed ${file}: ${e.message}`);
  } finally {
    await page.close();
  }
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

  const shots = [
    "00_title.png",
    "00_menu.png",
    "01_narrative.png",
    "02_tutorial_desktop.png",
    "03_tutorial_mobile.png",
    ...LEVELS.map((l) => `level_${l.id}.png`),
    "09_end.png",
  ].filter((f) => fs.existsSync(path.join(OUT_DIR, f)));
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

  // Pre-game surfaces booted directly via the preview hook (deterministic —
  // the ?preview=menu shot is the authoritative menu capture and overwrites the
  // one grabbed while driving through the UI during the level loop).
  console.log("[screen] title");
  await captureScreen(context, "00_title.png", "?preview=title");
  console.log("[screen] menu");
  await captureScreen(context, "00_menu.png", "?preview=menu", { settleFlyers: true });

  console.log("[screen] narrative");
  await captureScreen(context, "01_narrative.png", "?preview=narrative");
  console.log("[screen] tutorial (desktop)");
  await captureScreen(context, "02_tutorial_desktop.png", "?preview=tutorial");
  console.log("[screen] end");
  await captureScreen(context, "09_end.png", "?preview=end");

  // The tutorial forks by device (ADR-0015); render the mobile script under a
  // mobile UA so detectMobile() picks the phone variant. Landscape viewport
  // keeps the RotateOverlay hidden.
  console.log("[screen] tutorial (mobile)");
  const mobileContext = await browser.newContext({
    viewport: VIEWPORT, // landscape → the RotateOverlay stays hidden
    deviceScaleFactor: DEVICE_SCALE,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  await captureScreen(mobileContext, "03_tutorial_mobile.png", "?preview=tutorial");
  await mobileContext.close();

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
