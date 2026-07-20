#!/usr/bin/env node
import { chromium } from "playwright";
import { seedPlay, readState, SWIFTSHADER_ARGS, loadLevelManifest } from "/home/user/prohimuf/scripts/e2e-lib.mjs";

const ROOT = "/home/user/prohimuf";
const BASE = "http://localhost:4173/prohimuf/";
const OUT = "/tmp/claude-0/-home-user-prohimuf/3e9f8383-6903-5cf8-aaf6-43ee0cd90b6b/scratchpad";
const VIEWPORT = { width: 1280, height: 720 };
const { levelIds } = loadLevelManifest(ROOT);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = (q) => q.game.bossQte;

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
    args: SWIFTSHADER_ARGS,
  });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await seedPlay(page, levelIds);
  await page.goto(`${BASE}?preview=boss&at=phase2&blownImmune=1`, { waitUntil: "networkidle" });
  await page.locator("canvas").first().waitFor({ timeout: 20000 });

  const seen = new Set();
  let capturedExposed = false, capturedTelegraph = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && (!capturedExposed || !capturedTelegraph)) {
    const s = await readState(page);
    if (s && b(s)) {
      const key = `${b(s).chargedWindow}|${b(s).telegraphActive}|${b(s).stance}`;
      if (!seen.has(key)) { seen.add(key); console.log("state:", key); }
      if (b(s).chargedWindow && b(s).stance === "EXPOSED" && !capturedExposed) {
        await page.screenshot({ path: `${OUT}/parry-phase2-EXPOSED-live.png` });
        capturedExposed = true;
        console.log("  -> captured EXPOSED live parry window");
      }
      if (b(s).chargedWindow && b(s).telegraphActive && !capturedTelegraph) {
        await page.screenshot({ path: `${OUT}/parry-phase2-telegraphActive.png` });
        capturedTelegraph = true;
        console.log("  -> captured telegraphActive charged windup");
      }
    }
    await sleep(80);
  }
  console.log("done. exposed=", capturedExposed, "telegraph=", capturedTelegraph);
  await browser.close();
}
main();
