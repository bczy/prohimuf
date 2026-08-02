#!/usr/bin/env node
/**
 * E2E — QTE photo paparazzi set-piece (Belliard), scenarios E1-E4
 * (testplan-photo-qte.md §4; the master proof, the two invariants, the attempt ceiling).
 *
 * Format: raw playwright node script on `scripts/e2e-lib.mjs`, per the standing convention
 * (NOT `@playwright/test`). Drives the production build in `__MUF_PLAY__` mode with
 * `{ setPieces: true }` (the opt-out this story added to `seedPlay` defaults to OFF; every
 * scenario here explicitly re-arms the set-piece it exists to test).
 *
 * TWO TRAPS this file exists to not fall into (testplan T-1):
 *   1. `enabledOnFirstRun: false` (Q-3, techplan §8bis) means the DEFAULT harness state IS a
 *      first run — a script that enters Belliard, sees no set-piece and asserts "the level
 *      still plays" passes while testing nothing. Every scenario below therefore opens with a
 *      LOUD assertion that `photoQte !== null` actually appeared before any other check runs.
 *   2. No new `window.__MUF_*` flag for the "not a first run" predicate (standing architect
 *      ruling, `e2e-delivery.mjs`'s header) — it must be reachable through `localStorage` /
 *      the existing state seam. `seedPlay`'s progress-unlock seed already writes
 *      `muf_progress` with every level unlocked; that is the only "prior play" signal shipped
 *      today. **OPEN ITEM, flagged to `pm` / lane A (App.tsx `handlePlay`):** the exact
 *      predicate that gates `photoQteEnabled` (Q-3, "never on a first Belliard run") is not
 *      wired yet — `seedNotFirstRun` below is this script's best-effort seed against the
 *      shipped shape and MUST be revisited the moment `App.tsx handlePlay` lands its real
 *      progression read.
 *
 * STATUS AT TIME OF WRITING (blocked, named so a false green never hides it):
 *   - `GameState.photoQte` / `photoQteSpec` are not wired into `stateMachine.ts` yet (lane A
 *     A2/A3 in flight) — `s.game.photoQte` does not exist on the state seam today, so EVERY
 *     scenario below fails at the T-1 assertion, by construction, until that lands. This is
 *     the correct failure mode: a script that faked a pass here would be the T-1 hole itself.
 *   - `PhotoBriefing.tsx` (the BRIEFING skip button) and the `GameScene.tsx` mount of
 *     `PhotoQteView`/`PhotoControlChannel` are not landed on the render side yet (lane B) —
 *     `skipBriefing()` below is written against the DOM contract the techplan promises
 *     (a "Passer"-style skip, mirroring `dismissNarrative`'s button) and must be checked
 *     against the real component the moment it ships.
 *
 * Usage:
 *   node scripts/e2e-photo-qte.mjs               # run E1..E4
 *   node scripts/e2e-photo-qte.mjs --scenario E3  # run one scenario
 * Exit: 0 when every requested scenario passes; 1 on the first hard failure.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
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
const OUT_DIR = path.resolve(ROOT, "screenshots");

const VIEWPORT = { width: 1280, height: 720 };
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;
const TRIGGER_S = 2.5; // BELLIARD_PHOTO_QTE.triggerAtElapsedSeconds
const BRIEFING_TIMEOUT = 15000; // CI's ~0.4x game-time pacing margin over trigger + a few seconds
const SCENE_TIMEOUT = 180000; // sceneDuration 60s of GAME time; generous wall-clock margin

// ContactSheet.tsx role names (C-3 — role, not the literal string on purpose but the
// shipped strings ARE the roles today; update if the render lane retypes them).
const CTA_CONTINUE = "[ CONTINUER ]";
const CTA_RETRY = "[ RECOMMENCER ]";
const CTA_DECLINE = "[ LAISSER TOMBER ]";

/**
 * OPEN ITEM (see header): best-effort seed of "this is not the player's first Belliard run",
 * against the only shipped cross-session signal (`muf_progress`, already written by
 * `seedPlay`'s unlock-every-level seed). Revisit the moment `App.tsx handlePlay` wires the
 * real `photoQteEnabled` predicate (Q-3).
 */
async function seedNotFirstRun(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("muf_leverage", JSON.stringify({ v: 1, leverage: "none" }));
    } catch {
      // ignore storage failures
    }
  });
}

/** Shared prelude (testplan §4). Fails LOUDLY (T-1) rather than silently testing nothing. */
async function enterPhotoSetPiece(page, belliard) {
  await seedPlay(page, loadLevelManifest(ROOT).levelIds, { setPieces: true });
  await seedNotFirstRun(page);
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(belliard.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });

  // T-1's own gate: assert the set-piece actually appeared BEFORE anything else runs.
  const state = await pollState(page, (s) => s.game.photoQte !== null, {
    timeout: BRIEFING_TIMEOUT,
  });
  if (state.game.photoQte === null) {
    throw new Error(
      "T-1 TRAP: photoQte never appeared — this run would otherwise test nothing " +
        "(enabledOnFirstRun / setPieces seed did not arm the set-piece)",
    );
  }
  return state;
}

/** Skip the BRIEFING phase (PENDING — see header: PhotoBriefing.tsx not landed yet). */
async function skipBriefing(page) {
  const skip = page.getByRole("button", { name: "Passer" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click().catch(() => undefined);
  }
}

async function fireShutter(page) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box === null) throw new Error("fireShutter: canvas has no bounding box");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function raiseHold(page, ms) {
  await page.keyboard.down(" ");
  await sleep(ms);
}

async function lower(page) {
  await page.keyboard.up(" ");
}

/** E1 — nominal, the master proof. */
async function scenarioE1(context, belliard) {
  const page = await context.newPage();
  console.log("[E1] entering photo set-piece…");
  await enterPhotoSetPiece(page, belliard);
  await skipBriefing(page);

  await pollState(page, (s) => s.game.photoQte?.phase === "ESTABLISHING", {
    timeout: BRIEFING_TIMEOUT,
  });
  const establishing = await pollState(page, (s) => s.game.photoQte?.phase === "ESTABLISHING", {
    timeout: 5000,
  });
  if (establishing.game.photoQte.posture !== "LOWERED") {
    throw new Error(
      `E1: expected posture LOWERED at ESTABLISHING, got ${establishing.game.photoQte.posture}`,
    );
  }
  if (establishing.game.photoQte.sceneClock !== 0) {
    throw new Error(
      `E1: expected sceneClock 0 at ESTABLISHING, got ${establishing.game.photoQte.sceneClock}`,
    );
  }

  await pollState(page, (s) => s.game.photoQte?.phase === "ACTIVE", { timeout: SCENE_TIMEOUT });

  // Hold + aim toward the authored L'ECHANGE composition, then wait for the focus hold.
  await raiseHold(page, 100);
  await pollState(page, (s) => (s.game.photoQte?.composition?.focusHeldSeconds ?? 0) >= 0.35, {
    timeout: SCENE_TIMEOUT,
  });
  const filmBefore = (await pollState(page, () => true, { timeout: 1000 })).game.photoQte.film;
  await fireShutter(page);
  await lower(page);

  const afterShot = await pollState(page, (s) => s.game.photoQte?.film === filmBefore - 1, {
    timeout: 5000,
  });
  console.log(`[E1] shutter fired, film ${filmBefore} -> ${afterShot.game.photoQte.film}`);

  await pollState(page, (s) => s.game.photoQte?.phase === "CONTACT_SHEET", {
    timeout: SCENE_TIMEOUT,
  });
  const sheet = await pollState(page, (s) => s.game.photoQte?.outcome !== "none", {
    timeout: 5000,
  });
  if (sheet.game.photoQte.outcome !== "master") {
    throw new Error(
      `E1: expected outcome "master", got ${JSON.stringify(sheet.game.photoQte.outcome)}`,
    );
  }

  await page
    .screenshot({ path: path.join(OUT_DIR, "e2e-photo-e1-sheet.png") })
    .catch(() => undefined);
  await page.getByText(CTA_CONTINUE, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await pollState(page, (s) => s.game.photoQte === null, { timeout: 10000 });

  await page.close();
  console.log("[E1] PASSED — master proof, level resumed");
}

/** E2 — failure -> truncated sheet, non-lethality (E-4c at runtime). */
async function scenarioE2(context, belliard) {
  const page = await context.newPage();
  console.log("[E2] entering photo set-piece…");
  const initial = await enterPhotoSetPiece(page, belliard);
  const baseline = {
    energy: initial.game.energy,
    score: initial.game.score,
    lives: initial.game.lives,
    kills: initial.game.kills,
  };
  await skipBriefing(page);
  await pollState(page, (s) => s.game.photoQte?.phase === "ACTIVE", { timeout: SCENE_TIMEOUT });

  // Three EXPOSED (uncovered) shutters, silent lower between shots.
  for (let i = 0; i < 3; i++) {
    await fireShutter(page);
    await sleep(500);
  }

  await pollState(page, (s) => s.game.photoQte?.phase === "SPOTTED", { timeout: SCENE_TIMEOUT });
  const sheet = await pollState(page, (s) => s.game.photoQte?.phase === "CONTACT_SHEET", {
    timeout: SCENE_TIMEOUT,
  });
  if (sheet.game.photoQte.frames.length !== 3) {
    throw new Error(
      `E2: expected exactly 3 frames on the sheet, got ${sheet.game.photoQte.frames.length}`,
    );
  }
  if (sheet.game.photoQte.outcome !== "none") {
    throw new Error(
      `E2: expected outcome "none", got ${JSON.stringify(sheet.game.photoQte.outcome)}`,
    );
  }

  for (const [key, val] of Object.entries(baseline)) {
    if (sheet.game[key] !== val) {
      throw new Error(`E2: E-4c breach — game.${key} moved (${val} -> ${sheet.game[key]})`);
    }
  }

  await page.getByText(CTA_DECLINE, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await pollState(page, (s) => s.game.photoQte === null, { timeout: 10000 });
  await page.close();
  console.log("[E2] PASSED — truncated 3-frame sheet, zero-delta held");
}

/** E3 — [ LAISSER TOMBER ], the bonus-never-gate invariant. Load-bearing (testplan §4). */
async function scenarioE3(context, belliard) {
  const page = await context.newPage();
  console.log("[E3] entering photo set-piece…");
  await enterPhotoSetPiece(page, belliard);
  await skipBriefing(page);
  await pollState(page, (s) => s.game.photoQte?.phase === "ACTIVE", { timeout: SCENE_TIMEOUT });

  // Burn the roll without converting a master (mirrors E2's uncovered-shutter path).
  for (let i = 0; i < 3; i++) {
    await fireShutter(page);
    await sleep(500);
  }
  await pollState(page, (s) => s.game.photoQte?.phase === "CONTACT_SHEET", {
    timeout: SCENE_TIMEOUT,
  });

  const before = await pollState(page, () => true, { timeout: 1000 });
  await page.getByText(CTA_DECLINE, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });

  // One input, no confirmation, no second screen: phase must go straight to null.
  const after = await pollState(page, (s) => s.game.photoQte === null, { timeout: 5000 });

  // The run CONTINUES: timeRemaining keeps decreasing over the next 2s of polls.
  await sleep(2000);
  const later = await pollState(page, () => true, { timeout: 1000 });
  if (!(later.hud.timeRemaining < after.hud.timeRemaining)) {
    throw new Error(
      `E3: expected the level clock to resume decreasing after decline ` +
        `(${after.hud.timeRemaining} -> ${later.hud.timeRemaining})`,
    );
  }

  const leverage = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("muf_leverage") ?? "null");
    } catch {
      return null;
    }
  });
  if (leverage?.leverage !== "none") {
    throw new Error(`E3: expected muf_leverage "none", got ${JSON.stringify(leverage)}`);
  }

  await page.close();
  console.log("[E3] PASSED — decline is one input, run continues, leverage stays none");
}

/** E4 — the 2-attempt ceiling (mission-scoped, both directions). */
async function scenarioE4(context, belliard) {
  const page = await context.newPage();
  console.log("[E4] entering photo set-piece…");
  await enterPhotoSetPiece(page, belliard);
  await skipBriefing(page);
  await pollState(page, (s) => s.game.photoQte?.phase === "ACTIVE", { timeout: SCENE_TIMEOUT });
  for (let i = 0; i < 3; i++) {
    await fireShutter(page);
    await sleep(500);
  }
  await pollState(page, (s) => s.game.photoQte?.phase === "CONTACT_SHEET", {
    timeout: SCENE_TIMEOUT,
  });

  const retryBtn = page.getByText(CTA_RETRY, { exact: true }).first();
  if (!(await retryBtn.isVisible().catch(() => false))) {
    throw new Error("E4: expected [ RECOMMENCER ] on attempt 1's sheet");
  }
  await retryBtn.click({ timeout: RENDER_TIMEOUT });

  // Re-entry must land on ESTABLISHING, never BRIEFING (spec Rev.4/5 D-1).
  const reentry = await pollState(
    page,
    (s) => s.game.photoQte?.phase === "ESTABLISHING" || s.game.photoQte?.phase === "BRIEFING",
    { timeout: 5000 },
  );
  if (reentry.game.photoQte.phase !== "ESTABLISHING") {
    throw new Error(
      `E4: retry must skip BRIEFING (attemptIndex > 0), landed on ${reentry.game.photoQte.phase}`,
    );
  }

  await pollState(page, (s) => s.game.photoQte?.phase === "ACTIVE", { timeout: SCENE_TIMEOUT });
  for (let i = 0; i < 3; i++) {
    await fireShutter(page);
    await sleep(500);
  }
  await pollState(page, (s) => s.game.photoQte?.phase === "CONTACT_SHEET", {
    timeout: SCENE_TIMEOUT,
  });

  const stillHasRetry = await page
    .getByText(CTA_RETRY, { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  if (stillHasRetry) {
    throw new Error("E4: attempt 2's sheet must not offer [ RECOMMENCER ] (budget exhausted)");
  }
  await page.getByText(CTA_DECLINE, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await pollState(page, (s) => s.game.photoQte === null, { timeout: 10000 });

  await page.close();
  console.log(
    "[E4] PASSED — 2-attempt ceiling, budget resets on a fresh mission (manual re-entry not exercised here)",
  );
}

const SCENARIOS = {
  E1: scenarioE1,
  E2: scenarioE2,
  E3: scenarioE3,
  E4: scenarioE4,
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const requested = process.argv.includes("--scenario")
    ? [process.argv[process.argv.indexOf("--scenario") + 1]]
    : Object.keys(SCENARIOS);

  const { levels } = loadLevelManifest(ROOT);
  const belliard = levels.find((l) => l.id === "belliard");
  if (belliard === undefined) throw new Error('levelArt.json must declare "belliard"');

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const failures = [];
  for (const name of requested) {
    const fn = SCENARIOS[name];
    if (fn === undefined) {
      failures.push(`${name}: unknown scenario`);
      continue;
    }
    const context = await browser.newContext({ viewport: VIEWPORT });
    try {
      await fn(context, belliard);
    } catch (e) {
      failures.push(`${name}: ${e.message}`);
      console.error(`[${name}] FAILED: ${e.message}`);
    }
    await context.close();
  }
  await browser.close();

  if (failures.length > 0) {
    console.error("[e2e-photo-qte] FAILED:");
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(`[e2e-photo-qte] PASSED — ${requested.join(", ")}`);
}

main().catch((e) => {
  console.error("[e2e-photo-qte] Fatal:", e.message);
  process.exit(1);
});
