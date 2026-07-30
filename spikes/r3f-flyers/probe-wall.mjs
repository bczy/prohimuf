import { chromium } from "playwright";

const URL = "http://localhost:4180/prohimuf/spikes/r3f-flyers/wall.html";
const OUT =
  "/private/tmp/claude-502/-Users-bertrand-coizy-git-perso-prohimuf/a864b394-18d0-441c-8ce2-185c08432f8c/scratchpad";

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox"],
});
// Big viewport + deviceScaleFactor so the zoom crops are genuinely detailed, not upscaled.
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
});

const logs = [];
page.on("console", (m) => {
  if (m.type() === "error") logs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => {
  logs.push(`[PAGEERROR] ${e.message}`);
});

await page.goto(URL, { waitUntil: "networkidle" });
await new Promise((r) => setTimeout(r, 5000));

await page.screenshot({ path: `${OUT}/probe-settled.png` });

// Zoom on BELLIARD (tear, 2nd card) and STALINGRAD (slit, 3rd card).
await page.screenshot({
  path: `${OUT}/probe-tear.png`,
  clip: { x: 430, y: 230, width: 300, height: 420 },
});
await page.screenshot({
  path: `${OUT}/probe-slit.png`,
  clip: { x: 640, y: 330, width: 320, height: 340 },
});

console.log("errors:", logs.length ? logs.join("\n") : "(none)");
await browser.close();
