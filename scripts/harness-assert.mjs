#!/usr/bin/env node
/**
 * D2 — scripted play-through assertions (ADR-0005, re-scoped 2026-07-18 amendment).
 *
 * Drives real canvas input through the production build in `__MUF_PLAY__` mode
 * and asserts state DELTAS read through the sanctioned, read-only seam
 * (`window.__MUF_STATE__()`, installed in `src/hooks/useGameLoop.ts`). No game
 * rule and no render internal is touched — this script only reads `GameState` /
 * `HudData` snapshots and dispatches real mouse input, per the boundary rule.
 *
 * Two aim-INDEPENDENT assertions (energy starts at 100 and is moved ONLY by the
 * hostage QTE per `src/game/systems/stateMachine.ts`, so every delta below is
 * exact and deterministic — no tolerance needed):
 *
 *   D2-A — belliard PANIC shot: firing once while `qte.phase === "ZOOMING"`
 *          drains `energy` by exactly `QTE_PANIC_SHOT` (−6), aim-independent
 *          (a panic shot is penalised regardless of where it lands), and never
 *          moves `score`. Control: belliard authors no accomplice, so
 *          `qte.accomplice` must be `null` throughout.
 *   D2-B — vitry ACCOMPLICE (ADR-0036): with the captor's own counter-fire
 *          suppressed by the presence of an accomplice (INVARIANT P3-ACC), and
 *          ZERO player fire, `energy` still drops — in exact multiples of
 *          `ACCOMPLICE_SHOT_DAMAGE` (−8) — on the accomplice's own cadence,
 *          while `qte.captorHp` stays at its seeded 3 (no ring hit is possible
 *          without firing).
 *
 * The withdrawn `car` and the retired street `hostage_taker` (superseded by the
 * cinematic QTE) carry no assertions here — see the ADR-0005 amendment.
 *
 * Input: `PREVIEW_URL` — a running server URL including the base (matches every
 * other e2e-*.mjs script; driven by `.github/actions/e2e-ingame` in CI).
 * Exit: 0 when both D2-A and D2-B hold; 1 otherwise (with the failing deltas
 * printed).
 */
import { chromium } from "playwright";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  pollState,
  seedPlay,
  sleep,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1;
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const QTE_TIMEOUT = 25000; // trigger @10-12s + zoom 2s, generous CI margin
const SHOT_SETTLE_MS = 3000; // accomplice cadence is 2.8s — bound the first-shot wait a little above it

// Mirrored magnitudes (qteSystem.ts) — NOT imported: this script stays outside
// src/game on purpose (a harness reads state through the seam, never a game
// module directly, per the boundary rule).
const QTE_PANIC_SHOT = -6;
const ACCOMPLICE_SHOT_DAMAGE = -8;
const ENERGY_INITIAL = 100;
const SEEDED_CAPTOR_HP = 3;

async function enterLevel(page, level) {
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(level.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });
}

/** D2-A — belliard: one shot during ZOOMING drains exactly QTE_PANIC_SHOT. */
async function assertBelliardPanic(context, levelIds, belliard) {
  const page = await context.newPage();
  await seedPlay(page, levelIds);
  console.log(`[D2-A] entering "${belliard.name}", waiting for qte.phase === "ZOOMING"…`);
  await enterLevel(page, belliard);

  const zooming = await pollState(
    page,
    (s) => s.game.qte !== null && s.game.qte.phase === "ZOOMING",
    { timeout: QTE_TIMEOUT },
  );
  if (zooming.game.qte.accomplice !== null) {
    throw new Error(
      `D2-A control failed: belliard authors no accomplice, but qte.accomplice = ${JSON.stringify(zooming.game.qte.accomplice)}`,
    );
  }
  const baselineEnergy = zooming.game.energy;
  const baselineScore = zooming.game.score;
  console.log(
    `[D2-A] ZOOMING reached (energy=${String(baselineEnergy)}, score=${String(baselineScore)}, accomplice=null ok) — firing one shot`,
  );

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box === null) throw new Error("D2-A: canvas has no bounding box");
  // Aim is irrelevant during ZOOMING (tickQte charges QTE_PANIC_SHOT regardless
  // of impactPoint) — click dead centre to prove that, not to target anything.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Catch the FIRST energy transition after the click — tightly scoped so a
  // slow poll can't accidentally straddle a later ACTIVE-phase event too.
  const after = await pollState(page, (s) => s.game.energy !== baselineEnergy, {
    timeout: 3000,
    interval: 40,
  });

  const expectedEnergy = Math.max(0, baselineEnergy + QTE_PANIC_SHOT);
  const problems = [];
  if (after.game.energy !== expectedEnergy) {
    problems.push(
      `game.energy ${String(after.game.energy)} !== expected ${String(expectedEnergy)} (baseline ${String(baselineEnergy)}, delta should be ${String(QTE_PANIC_SHOT)})`,
    );
  }
  if (after.hud === null || after.hud.energy !== expectedEnergy) {
    problems.push(`hud.energy ${String(after.hud?.energy)} !== expected ${String(expectedEnergy)}`);
  }
  if (after.game.score !== baselineScore) {
    problems.push(
      `game.score ${String(after.game.score)} !== baseline ${String(baselineScore)} (the QTE must never move score)`,
    );
  }
  await page.close();
  if (problems.length > 0) {
    throw new Error(`D2-A (belliard PANIC) FAILED:\n  ${problems.join("\n  ")}`);
  }
  console.log(
    `[D2-A] PASSED — energy ${String(baselineEnergy)} → ${String(after.game.energy)} (Δ${String(QTE_PANIC_SHOT)}), score unchanged`,
  );
}

/** D2-B — vitry: with zero player fire, only the accomplice moves energy. */
async function assertVitryAccomplice(context, levelIds, vitry) {
  const page = await context.newPage();
  await seedPlay(page, levelIds);
  console.log(`[D2-B] entering "${vitry.name}", waiting for qte.phase === "ACTIVE"…`);
  await enterLevel(page, vitry);

  const active = await pollState(
    page,
    (s) => s.game.qte !== null && s.game.qte.phase === "ACTIVE",
    { timeout: QTE_TIMEOUT },
  );
  if (active.game.qte.accomplice === null) {
    throw new Error(
      "D2-B FAILED: vitry.hostageQte.accomplice must be authored (ADR-0036), but qte.accomplice is null",
    );
  }
  if (active.game.energy !== ENERGY_INITIAL) {
    throw new Error(
      `D2-B FAILED: energy already moved before ACTIVE (${String(active.game.energy)} !== ${String(ENERGY_INITIAL)}) — the QTE's own trigger/zoom must never charge energy without a shot`,
    );
  }
  console.log(
    "[D2-B] ACTIVE reached, accomplice present, energy still 100 — firing NOTHING, waiting for the accomplice's own shot…",
  );

  // Zero mouse input for the whole assertion: the accomplice must be the sole
  // energy mover while `qte.accomplice !== null` (INVARIANT P3-ACC).
  const dropped = await pollState(
    page,
    (s) => s.game.qte !== null && s.game.energy !== ENERGY_INITIAL,
    { timeout: SHOT_SETTLE_MS + 20000, interval: 100 },
  );

  const drop = ENERGY_INITIAL - dropped.game.energy;
  const problems = [];
  if (drop <= 0 || drop % Math.abs(ACCOMPLICE_SHOT_DAMAGE) !== 0) {
    problems.push(
      `energy drop ${String(drop)} is not a strictly-positive multiple of ${String(Math.abs(ACCOMPLICE_SHOT_DAMAGE))} (ACCOMPLICE_SHOT_DAMAGE)`,
    );
  }
  if (dropped.game.qte.captorHp !== SEEDED_CAPTOR_HP) {
    problems.push(
      `qte.captorHp ${String(dropped.game.qte.captorHp)} !== ${String(SEEDED_CAPTOR_HP)} (no ring hit is possible with zero player fire)`,
    );
  }
  await page.close();
  if (problems.length > 0) {
    throw new Error(`D2-B (vitry ACCOMPLICE) FAILED:\n  ${problems.join("\n  ")}`);
  }
  console.log(
    `[D2-B] PASSED — energy ${String(ENERGY_INITIAL)} → ${String(dropped.game.energy)} (drop ${String(drop)}, captorHp intact, no bavure)`,
  );
}

async function main() {
  const { levels, levelIds } = loadLevelManifest(ROOT);
  const belliard = levels.find((l) => l.id === "belliard");
  const vitry = levels.find((l) => l.id === "vitry");
  if (belliard === undefined || vitry === undefined) {
    throw new Error('levelArt.json must declare both "belliard" and "vitry"');
  }

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });

  let failure = null;
  try {
    await assertBelliardPanic(context, levelIds, belliard);
    // Small gap so the second page's harness init script isn't racing the first
    // page's teardown on a constrained CI runner.
    await sleep(200);
    await assertVitryAccomplice(context, levelIds, vitry);
  } catch (e) {
    failure = e;
  }

  await browser.close();

  if (failure !== null) {
    console.error(`[harness-assert] FAILED: ${failure.message}`);
    process.exit(1);
  }
  console.log("[harness-assert] PASSED — D2-A (belliard PANIC) + D2-B (vitry ACCOMPLICE)");
}

main().catch((e) => {
  console.error("[harness-assert] Fatal:", e.message);
  process.exit(1);
});
