#!/usr/bin/env node
/**
 * D1 — motion capture mode (ADR-0005, re-scoped 2026-07-18 amendment).
 *
 * Boots `belliard` in `__MUF_PLAY__` (un-frozen) mode and records a short
 * multi-frame strip of the two surviving "motion to review by eye" beats:
 *
 *   (a) the courier (livreur) traversing the street — enter → cross → cull,
 *   (b) the QTE cinematic — the ZOOMING camera push onto the static anchor,
 *       then the COVERED↔PEEKING telegraphed cadence with the wandering ring.
 *
 * The withdrawn `car` (trailing-side muzzle flash / `dir` mirror,
 * story-car-drive-by AC5/AC6) carries no assertion here — see the ADR-0005
 * amendment. The strip is written to `screenshots/motion-belliard.png` — an
 * ARTIFACT, reviewed by eye (in particular (b)'s zoom-in perceptibility is a
 * by-eye call, not asserted).
 *
 * NON-VACUOUS by construction: alongside the coarser screenshots, this script
 * polls `window.__MUF_STATE__()` at a fine cadence for the whole run and FAILS
 * (exit 1) unless BOTH hold somewhere in that trace:
 *   (i)  some courier's world x advanced monotonically (in its own travel
 *        direction) between two consecutive state samples — proves (a);
 *   (ii) a `COVERED` sample with `telegraphActive === true` is immediately
 *        followed by a `PEEKING` sample — the G4 telegraph tell firing right
 *        before the exposure it warns of — proves the "peek" half of (b) (the
 *        re-pointed story-hostage-taker AC8 "execution countdown cue rising
 *        before it fires").
 *
 * Input: `PREVIEW_URL` — a running server URL including the base.
 * Output: `screenshots/motion-belliard.png`.
 * Exit: 0 when both invariants are observed in the trace; 1 otherwise.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import {
  SWIFTSHADER_ARGS,
  dismissNarrative,
  enterMenuFromTitle,
  loadLevelManifest,
  readState,
  seedPlay,
  sleep,
  stitchLabeledStrip,
} from "./e2e-lib.mjs";

const ROOT = process.cwd();
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:4173/prohimuf/";
const OUT_DIR = path.resolve(ROOT, "screenshots");
const OUT_FILE = path.join(OUT_DIR, "motion-belliard.png");

const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 1;
const NAV_TIMEOUT = 30000;
const RENDER_TIMEOUT = 20000;

// State-only poll cadence: fine enough (≪ the 0.35s G4 telegraph window, and
// ≪ the courier's several-second crossing) to catch both invariants between
// the coarser screenshots below.
const STATE_POLL_MS = 120;
// Screenshot cadence for the reviewable strip (visual artifact only).
const SHOT_INTERVAL_MS = 2000;
// belliard's hostageQte: trigger @12s + zoom 2s (ACTIVE @14s) + 2 full
// COVERED↔PEEKING cycles (1.5s + 1.5s each) + margin. Budgeted in GAME time —
// CI's SwiftShader advances game time at ~0.4x wall time, so a wall-clock
// duration under-records there. The wall cap only bounds a hung page.
const RUN_GAME_SECONDS = 21;
const RUN_WALL_CAP_MS = 180000;

const COURIER_ADVANCE_EPS = 0.05; // world units; kills float/rounding noise

/** (i) Some courier's x advanced monotonically (own direction) between samples. */
function checkCourierTraversal(trace) {
  for (let i = 1; i < trace.length; i++) {
    const prev = trace[i - 1].game.couriers;
    const cur = trace[i].game.couriers;
    for (const c of cur) {
      const before = prev.find((p) => p.id === c.id);
      if (before === undefined) continue;
      const advance = (c.x - before.x) * c.dir;
      if (advance > COURIER_ADVANCE_EPS) {
        return { ok: true, courierId: c.id, advance, atMs: trace[i].tMs };
      }
    }
  }
  return { ok: false };
}

/**
 * (ii) Two independent facts, each robust to the sampling cadence: a
 * COVERED→PEEKING transition (1.5s-scale, safe at any sane poll rate) and the
 * G4 tell observed armed at least once. Requiring the tell on the exact sample
 * BEFORE the peek would make the guard a coin flip — the telegraph window is
 * only 0.35s of game time, narrower than a slow CI sampling interval.
 */
function checkTelegraphPeek(trace) {
  let transitionAtMs = null;
  let tellAtMs = null;
  for (let i = 0; i < trace.length; i++) {
    const curQte = trace[i].game.qte;
    if (curQte === null) continue;
    if (tellAtMs === null && curQte.telegraphActive === true) tellAtMs = trace[i].tMs;
    if (transitionAtMs === null && i > 0) {
      const prevQte = trace[i - 1].game.qte;
      if (prevQte !== null && prevQte.stance === "COVERED" && curQte.stance === "PEEKING") {
        transitionAtMs = trace[i].tMs;
      }
    }
  }
  if (transitionAtMs !== null && tellAtMs !== null) {
    return { ok: true, atMs: transitionAtMs, tellAtMs };
  }
  return { ok: false, transitionAtMs, tellAtMs };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { levels, levelIds } = loadLevelManifest(ROOT);
  const belliard = levels.find((l) => l.id === "belliard");
  if (belliard === undefined) throw new Error('levelArt.json must declare "belliard"');

  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });
  const page = await context.newPage();

  await seedPlay(page, levelIds);
  console.log(`[harness-motion] entering "${belliard.name}" in play mode…`);
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  await enterMenuFromTitle(page, { timeout: RENDER_TIMEOUT });
  await page.getByText(belliard.name, { exact: true }).first().click({ timeout: RENDER_TIMEOUT });
  await dismissNarrative(page);
  await page.locator("canvas").first().waitFor({ timeout: RENDER_TIMEOUT });

  console.log(
    `[harness-motion] recording ${String(RUN_GAME_SECONDS)}s of GAME time (courier traversal + QTE zoom/telegraph/peek)…`,
  );
  const trace = [];
  const frames = [];
  const framePromises = [];
  const start = Date.now();
  let lastShotAt = -Infinity;
  let gameElapsed = 0;
  let shotInFlight = false;
  while (gameElapsed < RUN_GAME_SECONDS && Date.now() - start < RUN_WALL_CAP_MS) {
    const tMs = Date.now() - start;
    const snap = await readState(page);
    if (snap !== null) gameElapsed = snap.game.elapsedSeconds;
    if (snap !== null) trace.push({ tMs, game: snap.game });
    // Fire-and-forget screenshots: a SwiftShader full-page capture takes ~2s,
    // and awaiting it inline starved the state poll below the 0.35s G4 tell
    // window (34 samples over 74s, observed on CI). State sampling must keep
    // its own cadence; frames are collected after the loop.
    if (!shotInFlight && tMs - lastShotAt >= SHOT_INTERVAL_MS) {
      shotInFlight = true;
      lastShotAt = tMs;
      const qte = snap?.game.qte ?? null;
      const label = `t=${(tMs / 1000).toFixed(1)}s${qte ? ` ${qte.phase}/${qte.stance}` : ""}`;
      framePromises.push(
        page
          .screenshot()
          .then((buffer) => {
            frames.push({ buffer, label });
          })
          .catch(() => {})
          .finally(() => {
            shotInFlight = false;
          }),
      );
    }
    await sleep(STATE_POLL_MS);
  }
  await Promise.all(framePromises);

  await browser.close();

  const courier = checkCourierTraversal(trace);
  const telegraph = checkTelegraphPeek(trace);

  console.log(
    `[harness-motion] state samples=${String(trace.length)} strip frames=${String(frames.length)}`,
  );
  console.log(
    `[harness-motion] (i)  courier traversal:  ${
      courier.ok
        ? `PASS (courier #${String(courier.courierId)}, Δx=${courier.advance.toFixed(2)} @${String(courier.atMs)}ms)`
        : "FAIL — no monotonic courier advance observed in the trace"
    }`,
  );
  console.log(
    `[harness-motion] (ii) G4 telegraph→PEEK: ${
      telegraph.ok
        ? `PASS (transition @${String(telegraph.atMs)}ms, tell @${String(telegraph.tellAtMs)}ms)`
        : `FAIL — transition ${telegraph.transitionAtMs === null ? "NOT observed" : `@${String(telegraph.transitionAtMs)}ms`}, ` +
          `tell ${telegraph.tellAtMs === null ? "NOT observed" : `@${String(telegraph.tellAtMs)}ms`}`
    }`,
  );

  if (frames.length > 0) {
    const strip = await stitchLabeledStrip(frames, { cols: 4, cellW: 480, cellH: 270 });
    fs.writeFileSync(OUT_FILE, strip);
    console.log(
      `[harness-motion] wrote ${path.relative(ROOT, OUT_FILE)} (${String(frames.length)} frames) — by-eye review, ` +
        `in particular the ZOOMING camera push-in (not asserted mechanically)`,
    );
  }

  if (!courier.ok || !telegraph.ok) {
    console.error("[harness-motion] FAILED — the seam guard could not confirm both invariants");
    process.exit(1);
  }
  console.log("[harness-motion] PASSED");
}

main().catch((e) => {
  console.error("[harness-motion] Fatal:", e.message);
  process.exit(1);
});
