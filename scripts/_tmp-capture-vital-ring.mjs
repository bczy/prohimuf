import { chromium } from "playwright-core";

const SWIFTSHADER_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

const BASE = "http://localhost:4321";
const OUT = "/home/user/prohimuf/docs/qa/evidence/story-boss-qte-differentiation";

async function readState(page) {
  return page.evaluate(() => {
    const w = window;
    if (typeof w.__MUF_STATE__ !== "function") return null;
    return w.__MUF_STATE__();
  });
}

async function pollState(page, predicate, { timeout = 20000, interval = 200 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const s = await readState(page);
    if (s && predicate(s)) return s;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("pollState timeout");
}

async function capture({ viewport, dpr, ua, out, label }) {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    headless: true,
    args: [...SWIFTSHADER_ARGS, "--headless=new"],
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
    userAgent: ua,
  });
  await context.addInitScript(() => {
    window.__MUF_PLAY__ = true;
    try {
      localStorage.setItem(
        "muf_prefs",
        JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal", crt: false }),
      );
    } catch {
      // ignore
    }
  });
  const page = await context.newPage();
  page.on("console", (msg) => console.log(`[${label}][console:${msg.type()}]`, msg.text()));
  page.on("pageerror", (err) => console.log(`[${label}][pageerror]`, err));
  await page.goto(`${BASE}/?preview=boss&at=phase2&blownImmune=1`, { waitUntil: "load" });

  // wait for the harness + game loop to install and reach phase2 ACTIVE with both rings live
  const state = await pollState(
    page,
    (s) => {
      const q = s?.game?.bossQte;
      return (
        q &&
        q.phase === "ACTIVE" &&
        q.phaseIndex >= 1 &&
        q.stance === "EXPOSED"
      );
    },
    { timeout: 30000 },
  );

  console.log(`[${label}] state at capture:`, JSON.stringify({
    phase: state.game.bossQte.phase,
    phaseIndex: state.game.bossQte.phaseIndex,
    stance: state.game.bossQte.stance,
    telegraphActive: state.game.bossQte.telegraphActive,
    chargedWindow: state.game.bossQte.chargedWindow,
    smokeActive: state.game.bossQte.smokeActive,
  }));

  // let a couple frames settle so both rings render this tick
  await page.waitForTimeout(150);

  await page.screenshot({ path: `${OUT}/${out}`, fullPage: false });
  await browser.close();
}

async function main() {
  await capture({
    viewport: { width: 1280, height: 720 },
    dpr: 2,
    ua: undefined,
    out: "36-vital-ring-011-desktop.png",
    label: "desktop",
  });
  await capture({
    viewport: { width: 844, height: 390 },
    dpr: 3,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    out: "37-vital-ring-011-mobile.png",
    label: "mobile",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
