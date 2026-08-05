import { describe, it, expect } from "vitest";
import type { PortraitScene } from "@game/types/portraitRobot";
import {
  applyPortraitIntent,
  createPortraitScene,
  portraitRevealProgress,
  revealBandStepSeconds,
  tickPortraitScene,
  PORTRAIT_BAND_ORDER,
  RESULT_HOLD_SECONDS,
  REVEAL_HOLD_TAIL_SECONDS,
  REVEAL_SECONDS_IDENTIFIED,
  REVEAL_SECONDS_UNRESOLVED,
} from "@game/systems/portraitRobotSystem";
import { TEST_CATALOGUE, at } from "@game/systems/__tests__/portraitFixtures";

/**
 * The reveal TIMELINE, asserted as INSTANTS (gate §3, A15, story AC4).
 *
 * Panel run-2 let two blocking defects through with a green suite because the only
 * reveal test asserted an ORDER (`doneAt > allCorrectedAt`): the reveal played at half
 * its canonical duration and the 2,2 s result hold had been deleted outright, and both
 * satisfy "A happens before B". So every assertion here is a MOMENT — the second at
 * which something flips — compared to the canon, at a stated tolerance. An ordering
 * assertion is worth nothing on a timeline; only a duration is.
 *
 * Canon: reveal 2,6 s (`PARTIAL`/`FAILED`) · 1,4 s (`IDENTIFIED`) · 4 verdicts at
 * ~0,45 s · 0,8 s of tail · result hold 2,2 s, all issues.
 */

const TIMER = 35;
const DT = 1 / 60;
/** One frame: the resolution of a per-frame simulation, and the honest tolerance for it. */
const FRAME_TOLERANCE = DT + 1e-9;

/** A scene resolved by chrono expiry with `n` bands correct — 4 ⇒ IDENTIFIED, 2 ⇒ FAILED. */
function resolvedWith(n: number, seed = 7): PortraitScene {
  const base = createPortraitScene(TEST_CATALOGUE, seed, TIMER);
  const selection = base.puzzle.truth.map((slot, i) =>
    i < n ? slot : at(base.puzzle.initialSelection, i),
  );
  const nearlyExpired: PortraitScene = { ...base, selection, remainingSeconds: 1e-9 };
  // `IDENTIFIED` at 4/4 is a post-condition of the reducer, so a 4/4 board is resolved by
  // the intent that completes it; either path lands on the same `resolvePortraitScene`.
  const resolved = tickPortraitScene(nearlyExpired, 1);
  expect(resolved.phase).toBe("RESOLVED");
  return resolved;
}

interface Timeline {
  /** Elapsed seconds at which each band's verdict first showed, in flip order. */
  readonly bandFlips: readonly number[];
  /** Elapsed seconds at which the reveal ended and the result hold began. */
  readonly holdStart: number;
  /** Elapsed seconds at which the phase became ready to hand over. */
  readonly handover: number;
}

/** Run the scene frame by frame and record WHEN each thing happens. */
function playOut(start: PortraitScene, reducedMotion = false): Timeline {
  let scene = start;
  let elapsed = 0;
  let bands = portraitRevealProgress(scene, reducedMotion).revealedBands;
  const bandFlips: number[] = Array.from({ length: bands }, () => 0);
  let holdStart = Number.NaN;
  let handover = Number.NaN;

  for (let i = 0; i < 1200 && Number.isNaN(handover); i += 1) {
    scene = tickPortraitScene(scene, DT);
    elapsed += DT;
    const p = portraitRevealProgress(scene, reducedMotion);
    while (bands < p.revealedBands) {
      bandFlips.push(elapsed);
      bands += 1;
    }
    if (p.stage !== "REVEALING" && Number.isNaN(holdStart)) holdStart = elapsed;
    if (p.handoverReady) handover = elapsed;
  }
  return { bandFlips, holdStart, handover };
}

describe("gate §3 / AC4 — the reveal lasts its canonical duration", () => {
  it("PARTIAL/FAILED: the reveal is 2,6 s and the hold is 2,2 s after it", () => {
    const t = playOut(resolvedWith(2));
    expect(t.holdStart).toBeCloseTo(REVEAL_SECONDS_UNRESOLVED, 1);
    expect(t.holdStart).toBeGreaterThanOrEqual(REVEAL_SECONDS_UNRESOLVED);
    expect(t.holdStart - REVEAL_SECONDS_UNRESOLVED).toBeLessThanOrEqual(FRAME_TOLERANCE);
    // The 1,3 s of the run-2 defect is more than 2,6 − 0,2: a halved reveal fails here.
    expect(Math.abs(t.holdStart - 2.6)).toBeLessThanOrEqual(0.2);
    expect(t.handover - t.holdStart).toBeCloseTo(RESULT_HOLD_SECONDS, 1);
    expect(t.handover).toBeCloseTo(2.6 + 2.2, 1);
  });

  it("IDENTIFIED: the reveal is 1,4 s and the hold is still 2,2 s", () => {
    const t = playOut(resolvedWith(4));
    expect(t.holdStart).toBeCloseTo(REVEAL_SECONDS_IDENTIFIED, 1);
    expect(Math.abs(t.holdStart - 1.4)).toBeLessThanOrEqual(0.15);
    expect(t.handover - t.holdStart).toBeCloseTo(RESULT_HOLD_SECONDS, 1);
    expect(t.handover).toBeCloseTo(1.4 + 2.2, 1);
  });

  it("the result hold is 2,2 s on BOTH issues — A15 re-tunes the reveal, never the hold", () => {
    const lost = playOut(resolvedWith(2));
    const won = playOut(resolvedWith(4));
    for (const t of [lost, won]) {
      expect(t.handover - t.holdStart).toBeCloseTo(RESULT_HOLD_SECONDS, 1);
      // The deleted hold of run-2 showed the stamp for 0,7 s. 2,2 s or nothing.
      expect(t.handover - t.holdStart).toBeGreaterThan(2.0);
    }
  });
});

describe("gate §3 — the reptation walks 4 verdicts at ~0,45 s", () => {
  it("PARTIAL/FAILED: four flips, evenly spaced, 0,45 s apart", () => {
    const step = revealBandStepSeconds("FAILED");
    expect(step).toBeCloseTo(0.45, 10);

    const { bandFlips } = playOut(resolvedWith(2));
    expect(bandFlips).toHaveLength(PORTRAIT_BAND_ORDER.length);
    bandFlips.forEach((instant, i) => {
      expect(instant).toBeCloseTo(step * (i + 1), 1);
      expect(Math.abs(instant - step * (i + 1))).toBeLessThanOrEqual(FRAME_TOLERANCE);
    });
    // The defect that made the four bands land almost together: an accelerating step.
    // Every INTERVAL is the same, and none of them collapses.
    for (let i = 1; i < bandFlips.length; i += 1) {
      expect(at(bandFlips, i) - at(bandFlips, i - 1)).toBeCloseTo(step, 1);
    }
  });

  it("REVEAL_HOLD_TAIL_SECONDS is honoured: 0,8 s between the last flip and the hold", () => {
    const t = playOut(resolvedWith(2));
    const lastFlip = at(t.bandFlips, t.bandFlips.length - 1);
    expect(lastFlip).toBeCloseTo(REVEAL_SECONDS_UNRESOLVED - REVEAL_HOLD_TAIL_SECONDS, 1);
    expect(t.holdStart - lastFlip).toBeCloseTo(REVEAL_HOLD_TAIL_SECONDS, 1);
  });

  it("IDENTIFIED: no reptation at all — the four stamps land together at t=0", () => {
    expect(revealBandStepSeconds("IDENTIFIED")).toBe(0);
    const resolved = resolvedWith(4);
    expect(portraitRevealProgress(resolved).revealedBands).toBe(PORTRAIT_BAND_ORDER.length);
    // Nothing flips DURING the 1,4 s: they were all already shown.
    expect(playOut(resolved).bandFlips).toHaveLength(PORTRAIT_BAND_ORDER.length);
    expect(playOut(resolved).bandFlips.every((t) => t === 0)).toBe(true);
  });

  it("reducedMotion cuts the WALK, never the DURATIONS (ADR-0054 §3)", () => {
    const resolved = resolvedWith(2);
    expect(portraitRevealProgress(resolved, true).revealedBands).toBe(PORTRAIT_BAND_ORDER.length);
    const t = playOut(resolved, true);
    expect(t.holdStart).toBeCloseTo(REVEAL_SECONDS_UNRESOLVED, 1);
    expect(t.handover - t.holdStart).toBeCloseTo(RESULT_HOLD_SECONDS, 1);
  });
});

describe("the contract that makes the run-2 defect inexpressible", () => {
  it("revealSeconds is a DURATION: constant from resolution to hand-over", () => {
    let scene = resolvedWith(2);
    expect(scene.revealSeconds).toBe(REVEAL_SECONDS_UNRESOLVED);
    for (let i = 0; i < 600; i += 1) {
      scene = tickPortraitScene(scene, DT);
      expect(scene.revealSeconds).toBe(REVEAL_SECONDS_UNRESOLVED);
      expect(scene.resultHoldSeconds).toBe(RESULT_HOLD_SECONDS);
    }
  });

  it("revealElapsed is an ACCUMULATOR: monotone rising, clamped at reveal + hold", () => {
    let scene = resolvedWith(2);
    for (let i = 0; i < 600; i += 1) {
      const next = tickPortraitScene(scene, DT);
      expect(next.revealElapsed).toBeGreaterThanOrEqual(scene.revealElapsed);
      scene = next;
    }
    expect(scene.revealElapsed).toBe(REVEAL_SECONDS_UNRESOLVED + RESULT_HOLD_SECONDS);
    // Clamped, and identical afterwards: an over-run cannot push it past the total.
    expect(tickPortraitScene(scene, 1e6)).toBe(scene);
  });

  it("the stages are forward-only: NONE → REVEALING → HOLDING → DONE", () => {
    const rank = { NONE: 0, REVEALING: 1, HOLDING: 2, DONE: 3 };
    let scene = createPortraitScene(TEST_CATALOGUE, 7, TIMER);
    expect(portraitRevealProgress(scene).stage).toBe("NONE");
    expect(portraitRevealProgress(scene).handoverReady).toBe(false);

    scene = resolvedWith(2);
    let seen = rank[portraitRevealProgress(scene).stage];
    for (let i = 0; i < 600; i += 1) {
      scene = tickPortraitScene(scene, DT);
      const r = rank[portraitRevealProgress(scene).stage];
      expect(r).toBeGreaterThanOrEqual(seen);
      seen = r;
    }
    expect(seen).toBe(rank.DONE);
  });

  it("PAUSE stops the whole tableau: no dt, no progress, no hand-over", () => {
    let scene = resolvedWith(2);
    for (let i = 0; i < 60; i += 1) scene = tickPortraitScene(scene, DT);
    const frozen = scene;
    for (let i = 0; i < 600; i += 1) scene = tickPortraitScene(scene, 0);
    expect(scene).toBe(frozen);
    expect(portraitRevealProgress(scene).handoverReady).toBe(false);
  });

  it("an ABANDON-resolved scene gets the same timeline as an expiry", () => {
    const base = createPortraitScene(TEST_CATALOGUE, 7, TIMER);
    const abandoned = applyPortraitIntent(base, { kind: "ABANDON" });
    expect(abandoned.result?.outcome).toBe("FAILED");
    const t = playOut(abandoned);
    expect(t.holdStart).toBeCloseTo(REVEAL_SECONDS_UNRESOLVED, 1);
    expect(t.handover).toBeCloseTo(REVEAL_SECONDS_UNRESOLVED + RESULT_HOLD_SECONDS, 1);
  });
});
