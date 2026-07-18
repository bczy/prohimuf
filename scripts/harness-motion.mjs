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
// COVERED↔PEEKING cycles (1.5s + 1.5s each) + margin for CI scheduling jitter.
const RUN_DURATION_MS = 28000;

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

/** (ii) A COVERED(telegraphActive) sample immediately followed by PEEKING. */
function checkTelegraphPeek(trace) {
  for (let i = 1; i < trace.length; i++) {
    const prevQte = trace[i - 1].game.qte;
    const curQte = trace[i].game.qte;
    if (prevQte === null || curQte === null) continue;
    if (
      prevQte.stance === "COVERED" &&
      prevQte.telegraphActive === true &&
      curQte.stance === "PEEKING"
    ) {
      return { ok: true, atMs: trace[i].tMs };
    }
  }
  return { ok: false };
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
    `[harness-motion] recording ${String(RUN_DURATION_MS / 1000)}s (courier traversal + QTE zoom/telegraph/peek)…`,
  );
  const trace = [];
  const frames = [];
  const start = Date.now();
  let lastShotAt = -Infinity;
  while (Date.now() - start < RUN_DURATION_MS) {
    const tMs = Date.now() - start;
    const snap = await readState(page);
    if (snap !== null) trace.push({ tMs, game: snap.game });
    if (tMs - lastShotAt >= SHOT_INTERVAL_MS) {
      const buffer = await page.screenshot();
      const qte = snap?.game.qte ?? null;
      const label = `t=${(tMs / 1000).toFixed(1)}s${qte ? ` ${qte.phase}/${qte.stance}` : ""}`;
      frames.push({ buffer, label });
      lastShotAt = tMs;
    }
    await sleep(STATE_POLL_MS);
  }

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
        ? `PASS (@${String(telegraph.atMs)}ms)`
        : "FAIL — no COVERED(telegraphActive)→PEEKING transition observed in the trace"
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
