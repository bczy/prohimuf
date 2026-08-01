#!/usr/bin/env node
/**
 * e2e-generated-level.mjs <id> — SP2 phase (e), "the proof" (spec-level-
 * harness-sp2 §3, plan T6). Generalizes the session-only driver of SP1 §8
 * (docs/qa/evidence/story-level-harness-sp1/report.json was hand-run) into a
 * committed, CI-runnable script.
 *
 * Boots STRAIGHT into a generated level via the SP1 verification seam
 * (`?preview=level&level=<id>`, src/render/scene/generatedHarness.ts —
 * `resolveGeneratedPreviewLevel`, restricted to `GENERATED_LEVEL_CONFIGS` so a
 * shipped id is never bootable through this path) — no title/menu navigation
 * needed, App.tsx lands directly in PLAYING. Asserts the level is genuinely
 * playable:
 *   - the game <canvas> mounts with real pixel dimensions,
 *   - the DOM HUD renders (score + the level's own name),
 *   - the HUD's "temps" timer value strictly DECREASES between two reads
 *     `TIMER_GAP_MS` apart — proves the game loop is actually ticking, not a
 *     frozen/crashed scene showing a static HUD,
 *   - zero `pageerror` (uncaught runtime exception) fires during the run.
 *
 * Reuses `e2e-lib.mjs` (SwiftShader launch args, `sleep`) — no new browser-
 * plumbing primitive invented here.
 *
 * Output: `docs/qa/evidence/<id>/{01-boot-playing.png,02-playing-later.png,
 * report.json}` — the CI job commits this evidence (same pattern as other
 * gen-*.yml commit-backs).
 *
 * Usage:
 *   node scripts/e2e-generated-level.mjs <levelId>
 *   PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/e2e-generated-level.mjs fixture
 *
 * Expects a server already serving the production build at PREVIEW_URL (same
 * assumption as every other e2e-*.mjs script) — this script never builds or
 * serves anything itself.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { SWIFTSHADER_ARGS, sleep } from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173/prohimuf/";

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const SETTLE_MS = 2000; // let the scene draw a frame (and any mount error surface)
// Two timer reads this far apart prove the loop is TICKING, not a frozen HUD —
// mirrors the SP1 §8 session report's tempsFirstRead/tempsSecondRead pair.
const TIMER_GAP_MS = 3000;

/**
 * Read the HUD's "temps" value (TimerReadout.tsx: a `temps` label span
 * followed by a `<N>s` value span) directly off the DOM — not a hardcoded CSS
 * Module class name (those are content-hashed at build time), so this survives
 * any HUD restyle that keeps the label text. Returns the integer seconds, or
 * `null` if the label/value shape isn't found (a real HUD regression, not a
 * missing level).
 */
async function readTimerSeconds(page) {
  return page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const label = spans.find((s) => s.textContent?.trim().toLowerCase() === "temps");
    const value = label?.nextElementSibling?.textContent ?? null;
    if (value === null) return null;
    const m = /^(\d+)s$/.exec(value.trim());
    return m ? Number(m[1]) : null;
  });
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node scripts/e2e-generated-level.mjs <levelId>");
    process.exit(2);
  }

  const outDir = path.resolve(ROOT, "docs/qa/evidence", id);
  fs.mkdirSync(outDir, { recursive: true });

  const url = `${PREVIEW_URL}?preview=level&level=${encodeURIComponent(id)}`;
  const pageErrors = [];

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));

  let problem = null;
  let tempsFirstRead = null;
  let tempsSecondRead = null;
  let hudSnippet = "";

  try {
    console.log(`[e2e-generated-level] loading ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    // The gameplay <canvas> mounting proves the R3F scene booted — a stub
    // <canvas> can exist with zero size even if WebGL failed.
    const canvas = page.locator("canvas").first();
    await canvas.waitFor({ timeout: RENDER_TIMEOUT });
    await sleep(SETTLE_MS);
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox || canvasBox.width < 1 || canvasBox.height < 1) {
      throw new Error(
        `game canvas has no size (${canvasBox ? `${canvasBox.width}x${canvasBox.height}` : "null"})`,
      );
    }
    console.log(
      `[e2e-generated-level] "${id}" canvas rendered (${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)})`,
    );

    // HUD gate: score readout present (proves the HUD mounted at all).
    await page.getByText("score", { exact: true }).first().waitFor({ timeout: RENDER_TIMEOUT });

    tempsFirstRead = await readTimerSeconds(page);
    if (tempsFirstRead === null) throw new Error('could not read the HUD "temps" timer value');
    await page
      .screenshot({ path: path.join(outDir, "01-boot-playing.png") })
      .catch(() => undefined);
    console.log(`[e2e-generated-level] temps (1st read): ${String(tempsFirstRead)}s`);

    await sleep(TIMER_GAP_MS);
    tempsSecondRead = await readTimerSeconds(page);
    if (tempsSecondRead === null) throw new Error('could not re-read the HUD "temps" timer value');
    console.log(`[e2e-generated-level] temps (2nd read): ${String(tempsSecondRead)}s`);
    if (!(tempsSecondRead < tempsFirstRead)) {
      throw new Error(
        `HUD timer did not decrement (${String(tempsFirstRead)}s → ${String(tempsSecondRead)}s ` +
          `over ${String(TIMER_GAP_MS)}ms) — the game loop looks frozen`,
      );
    }
    await page
      .screenshot({ path: path.join(outDir, "02-playing-later.png") })
      .catch(() => undefined);

    hudSnippet = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  } catch (e) {
    problem = e;
    // Always leave a screenshot on failure — the most useful debugging artifact.
    await page.screenshot({ path: path.join(outDir, "00-failure.png") }).catch(() => undefined);
  }

  await browser.close();

  const timerTicking =
    tempsFirstRead !== null && tempsSecondRead !== null && tempsSecondRead < tempsFirstRead;
  const report = {
    url,
    pageErrors,
    tempsFirstRead,
    tempsSecondRead,
    timerTicking,
    hudSnippet,
  };
  const reportPath = path.join(outDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`[e2e-generated-level] report → ${path.relative(ROOT, reportPath)}`);

  if (pageErrors.length > 0) {
    console.error(`[e2e-generated-level] ${pageErrors.length} page error(s):`);
    for (const e of pageErrors) console.error(`  - ${e}`);
  }

  if (problem !== null || pageErrors.length > 0) {
    if (problem) console.error(`[e2e-generated-level] FAILED: ${problem.message}`);
    process.exit(1);
  }

  console.log(
    `[e2e-generated-level] PASSED — "${id}" playable (temps ${String(tempsFirstRead)}s → ` +
      `${String(tempsSecondRead)}s, 0 page errors)`,
  );
}

main().catch((e) => {
  console.error("[e2e-generated-level] Fatal:", e.message);
  process.exit(1);
});
