#!/usr/bin/env node
/**
 * D3 — golden-screenshot visual regression (ADR-0005).
 *
 * Renders `stalingrad` and `vitry` — the two levels with NO `roster` field, so
 * ADR-0004 D2 promises they stay byte-for-byte unchanged for the same seed — in
 * the existing FROZEN static path (`window.__MUF_FREEZE_COPS__`, same
 * `seedDeterminism` used by `screenshot-preview.mjs` / `e2e-ingame.mjs`), and
 * pixel-diffs each against its committed baseline under `screenshots/golden/`.
 * Closes the render-side gap: the byte-for-byte promise is already asserted at
 * the logic layer (`src/game/systems/__tests__/levelRoster.test.ts`); this is
 * the visual layer.
 *
 * CAVEAT (ADR-0005 amendment, 2026-07-18): vitry now carries a `hostageQte`
 * that fires at `elapsedSeconds >= 10`. The golden is therefore explicitly the
 * PRE-QTE static frame — `SETTLE_MS` below MUST stay under 10s (it is 4s,
 * matching `screenshot-preview.mjs`'s `ENEMY_WAIT_MS`) so the QTE never
 * triggers during the settle and the frame stays deterministic.
 *
 * Tolerance policy: SwiftShader itself is deterministic run-to-run (many capture
 * pairs diff at exactly 0.000%), but the render is NOT literally pixel-static
 * under `__MUF_FREEZE_COPS__`: each synthetic cop keeps playing its 2-frame idle
 * flipbook (6fps, `gen-enemy-types.mjs`) off its OWN per-instance real-time clock
 * — freeze only pins `state`/`kind`/`timer`, never that render-local animation
 * clock — so a screenshot lands on an arbitrary flipbook phase every run. No CRT
 * (`crt: false`, the `seedDeterminism` default), so this ambient flipbook jitter
 * is the only noise source, but it is NOT sub-pixel: it is a real, if small and
 * expected, silhouette-sized delta across up to a few dozen sprites. A
 * per-channel delta of up to `GOLDEN_CHANNEL_TOLERANCE` (default 2) is treated
 * as equal (residual AA/rounding); the run REDS once the fraction of genuinely
 * differing pixels exceeds `GOLDEN_MAX_DIFF_FRACTION` (default 3%, both
 * env-tunable without a code change — same idiom as `check-halo-gradient.mjs`).
 * CALIBRATION (measured, 1280×720, this SwiftShader build): back-to-back runs
 * against a fixed baseline landed at {0.000%, 0.018%, 0.834%, 0.852%, 1.290%,
 * 1.306%, 1.307%} — an observed ceiling of ~1.31%. 3% keeps ~2× headroom above
 * that ceiling while staying far below what an actual regression (a missing
 * facade layer, a shifted layout, a broken texture) would move — those are
 * whole-frame-composition changes, not a handful of sprite silhouettes.
 *
 * Baselines: `screenshots/golden/level_stalingrad.png`,
 * `screenshots/golden/level_vitry.png` — COMMITTED. Regenerate deliberately
 * with:
 *
 *   UPDATE_GOLDEN=1 node scripts/harness-golden.mjs
 *
 * and EYEBALL the diff in the PR — a real, conscious art change is regenerated;
 * a regression must never be rubber-stamped through this flag. A missing
 * baseline is also written (first run), logged as SEEDED rather than PASS/FAIL
 * so an accidental first-run "green" is never mistaken for a real comparison.
 *
 * Input: `PREVIEW_URL` — a running server URL including the base.
 * Output: `screenshots/golden-candidate-<id>.png` (always, for review) plus the
 * baseline writes above when seeding/updating.
 * Exit: 0 when both levels match (or a baseline was (re)seeded); 1 on a diff
 * over tolerance or a frame-size mismatch.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import {
  SWIFTSHADER_ARGS,
  decodePng,
  diffPixelFraction,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  seedDeterminism,
  sleep,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const GOLDEN_DIR = path.join(OUT_DIR, "golden");

const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const VIEWPORT = { width: 1280, height: 720 }; // matches e2e-ingame.mjs — keeps baselines small
const DEVICE_SCALE = 1;
// Frozen-mode settle (matches screenshot-preview.mjs's ENEMY_WAIT_MS). MUST stay
// under vitry's hostageQte trigger (elapsed 10s) so the golden is the
// deterministic PRE-QTE frame — see the module doc's CAVEAT.
const SETTLE_MS = 4000;

const CHANNEL_TOLERANCE = numEnv("GOLDEN_CHANNEL_TOLERANCE", 2);
// 3% — see the module doc's CALIBRATION note (measured ceiling ~1.31% from the
// enemy idle-flipbook's per-run phase, not from SwiftShader non-determinism).
const MAX_DIFF_FRACTION = numEnv("GOLDEN_MAX_DIFF_FRACTION", 0.03);

const LEVEL_IDS = ["stalingrad", "vitry"];
const UPDATE = process.env.UPDATE_GOLDEN === "1";

function numEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function captureLevel(context, level, levelIds) {
  const page = await context.newPage();
  // crt:false is the seedDeterminism default; spelled out here since D3's whole
  // tolerance policy depends on there being no animated CRT pass to fight.
  await seedDeterminism(page, levelIds, { crt: false });
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(level.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
  await sleep(SETTLE_MS);
  const buffer = await page.screenshot();
  await page.close();
  return buffer;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });

  const { levels, levelIds } = loadLevelManifest(ROOT);
  const targets = LEVEL_IDS.map((id) => {
    const level = levels.find((l) => l.id === id);
    if (level === undefined) throw new Error(`levelArt.json is missing level "${id}"`);
    return level;
  });

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });

  const results = [];
  for (const level of targets) {
    console.log(
      `[harness-golden] capturing "${level.name}" (frozen, ${String(SETTLE_MS)}ms settle)…`,
    );
    const buffer = await captureLevel(context, level, levelIds);
    fs.writeFileSync(path.join(OUT_DIR, `golden-candidate-${level.id}.png`), buffer);

    const goldenPath = path.join(GOLDEN_DIR, `level_${level.id}.png`);
    if (UPDATE || !fs.existsSync(goldenPath)) {
      fs.writeFileSync(goldenPath, buffer);
      console.log(
        `[harness-golden] ${UPDATE ? "UPDATED" : "SEEDED"} baseline → ${path.relative(ROOT, goldenPath)} (eyeball the diff before committing)`,
      );
      results.push({ id: level.id, pass: true, seeded: true });
      continue;
    }

    let diffFraction = null;
    let sizeError = null;
    try {
      const golden = await decodePng(fs.readFileSync(goldenPath));
      const candidate = await decodePng(buffer);
      diffFraction = diffPixelFraction(golden, candidate, { channelTolerance: CHANNEL_TOLERANCE });
    } catch (e) {
      sizeError = e;
    }
    const pass = sizeError === null && diffFraction !== null && diffFraction <= MAX_DIFF_FRACTION;
    console.log(
      `[harness-golden] "${level.name}" ${pass ? "PASS" : "FAIL"} — ` +
        (sizeError
          ? sizeError.message
          : `diff ${(diffFraction * 100).toFixed(3)}% (floor ${(MAX_DIFF_FRACTION * 100).toFixed(2)}%, tolerance ±${String(CHANNEL_TOLERANCE)}/channel)`),
    );
    results.push({ id: level.id, pass, diffFraction, sizeError });
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error("[harness-golden] FAILED:");
    for (const f of failed) {
      console.error(
        `  ✗ ${f.id}: ${f.sizeError ? f.sizeError.message : `diff ${((f.diffFraction ?? 0) * 100).toFixed(3)}%`}`,
      );
    }
    console.error(
      "[harness-golden] to regenerate baselines after a DELIBERATE art change: " +
        "UPDATE_GOLDEN=1 node scripts/harness-golden.mjs — then eyeball the diff in the PR before committing.",
    );
    process.exit(1);
  }
  console.log("[harness-golden] PASSED — stalingrad + vitry match their committed goldens");
}

main().catch((e) => {
  console.error("[harness-golden] Fatal:", e.message);
  process.exit(1);
});
