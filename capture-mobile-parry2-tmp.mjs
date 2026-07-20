#!/usr/bin/env node
import { chromium } from "playwright";
import { seedPlay, readState, SWIFTSHADER_ARGS, loadLevelManifest } from "/home/user/prohimuf/scripts/e2e-lib.mjs";
const ROOT = "/home/user/prohimuf";
const BASE = "http://localhost:4173/prohimuf/";
const OUT = "/tmp/claude-0/-home-user-prohimuf/3e9f8383-6903-5cf8-aaf6-43ee0cd90b6b/scratchpad";
const VIEWPORT = { width: 844, height: 390 };
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const { levelIds } = loadLevelManifest(ROOT);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = (q) => q.game.bossQte;
async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
    args: SWIFTSHADER_ARGS,
  });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, hasTouch: true, userAgent: UA });
  const page = await context.newPage();
  await seedPlay(page, levelIds);
  await page.goto(`${BASE}?preview=boss&at=phase2&blownImmune=1`, { waitUntil: "networkidle" });
  await page.locator("canvas").first().waitFor({ timeout: 20000 });
  let capturedExposed=false, capturedTele=false;
  const deadline = Date.now()+60000;
  while (Date.now()<deadline && (!capturedExposed||!capturedTele)) {
    const s = await readState(page);
    if (s && b(s)) {
      if (b(s).chargedWindow && b(s).stance==="EXPOSED" && !capturedExposed) {
        await page.screenshot({path:`${OUT}/mobile-parry-EXPOSED.png`});
        capturedExposed=true;
      }
      if (b(s).chargedWindow && b(s).telegraphActive && !capturedTele) {
        await page.screenshot({path:`${OUT}/mobile-parry-telegraphActive2.png`});
        capturedTele=true;
      }
    }
    await sleep(80);
  }
  console.log("exposed",capturedExposed,"tele",capturedTele);
  await browser.close();
}
main();
