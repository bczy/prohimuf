import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import type { JSX } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { usePortraitRobot } from "@hooks/usePortraitRobot";
import type { PortraitRobotState } from "@hooks/usePortraitRobot";
import { FACE_CATALOGUE } from "@game/portraits";
import {
  correctCount,
  revealBandStepSeconds,
  RESULT_HOLD_SECONDS,
  REVEAL_SECONDS_UNRESOLVED,
} from "@game/systems/portraitRobotSystem";

const TIMER_SECONDS = 35;

function mount(
  paused: boolean,
  reducedMotion = false,
): {
  state: () => PortraitRobotState;
  rerender: (paused: boolean) => void;
  unmount: () => void;
} {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  let latest: PortraitRobotState | null = null;
  const Probe = ({ paused: p }: { paused: boolean }): JSX.Element => {
    latest = usePortraitRobot({
      seed: 1998,
      timerSeconds: TIMER_SECONDS,
      paused: p,
      reducedMotion,
    });
    return createElement("div");
  };
  act(() => {
    root.render(createElement(Probe, { paused }));
  });
  return {
    state: () => {
      if (latest === null) throw new Error("hook never ran");
      return latest;
    },
    rerender: (p: boolean) => {
      act(() => {
        root.render(createElement(Probe, { paused: p }));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

/** Run frames until the chrono expires — and STOP there, so the reveal starts at 0. */
function runUntilResolved(h: { state: () => PortraitRobotState }): void {
  for (let i = 0; i < 1000; i += 1) {
    if (h.state().scene.phase === "RESOLVED") return;
    frame(100);
  }
  throw new Error("the chrono never expired");
}

/** Advance one animation frame's worth of wall clock and let React commit. */
function frame(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("usePortraitRobot", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("enters ACTIVE on a board that is 0/4 for the seed (gate A14)", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    const { scene, bands, targetBands } = h.state();
    expect(scene.phase).toBe("ACTIVE");
    expect(correctCount(scene.selection, scene.puzzle.truth)).toBe(0);
    expect(bands.map((b) => b.label)).toEqual(FACE_CATALOGUE.bands.map((b) => b.label));
    expect(bands.every((b) => b.src.endsWith(".png") && b.ordinal >= 1)).toBe(true);
    expect(targetBands).toHaveLength(4);
    // The reference face is the truth board, so it differs from an all-wrong start.
    expect(targetBands).not.toEqual(bands.map((b) => b.src));
    h.unmount();
  });

  it("drains the inbox through the frame fold — an intent lands, the chrono runs", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    const before = h.state().scene;
    act(() => {
      h.state().pushIntent({ kind: "CYCLE", band: "hair", delta: 1 });
    });
    frame(16);
    const after = h.state().scene;
    expect(after.selection[0]).not.toBe(before.selection[0]);
    expect(after.remainingSeconds).toBeLessThan(TIMER_SECONDS);
    h.unmount();
  });

  it("prefixes every band asset with BASE_URL, like the rest of src/render (panel M10)", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    const base = import.meta.env.BASE_URL;
    // Unprefixed, the 24 bands 404 on any sub-path deployment — i.e. on the branch
    // preview, which is the support of the art and UX reviews still owed.
    for (const band of h.state().bands) expect(band.src.startsWith(base)).toBe(true);
    for (const src of h.state().targetBands) expect(src.startsWith(base)).toBe(true);
    h.unmount();
  });

  /**
   * The reveal is asserted at INSTANTS, not in order.
   *
   * The previous version of this test only checked `doneAt > allCorrectedAt`, and that
   * ordering survives a timeline divided by two — which is exactly what shipped: a
   * rising accumulator compared to a `revealSeconds` the pure tick was DECREMENTING met
   * it halfway (2,6 s played as 1,3 s), and the per-band step, re-derived each frame off
   * the shrinking value, accelerated until the four corrections landed almost together.
   * Every assertion below names a moment on the clock.
   */
  it("plays the reveal on the canonical timeline — 0,45 s a band, hand-over at 4,8 s", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    // Expire the chrono: FAILED ⇒ revealSeconds 2,6 s + resultHoldSeconds 2,2 s.
    runUntilResolved(h);
    expect(h.state().scene.result?.outcome).toBe("FAILED");
    expect(h.state().revealDone).toBe(false);
    expect(h.state().bands.filter((b) => b.corrected)).toHaveLength(0);

    // Gate §3's timeline, read from `src/game` — the render layer authors none of it.
    const step = revealBandStepSeconds("FAILED");
    expect(step).toBeCloseTo(0.45, 10);
    const handover = REVEAL_SECONDS_UNRESOLVED + RESULT_HOLD_SECONDS;
    expect(handover).toBeCloseTo(4.8, 10);

    const samples: { elapsed: number; corrected: number; done: boolean }[] = [];
    for (let i = 0; i < 500 && !h.state().revealDone; i += 1) {
      frame(16);
      const s = h.state();
      samples.push({
        elapsed: s.scene.revealElapsed,
        corrected: s.bands.filter((b) => b.corrected).length,
        done: s.revealDone,
      });
    }
    expect(samples.at(-1)?.done).toBe(true);

    // The whole timeline, frame by frame: band k is corrected at k × 0,45 s, and the
    // phase hands over at 4,8 s — never before, never at half of it.
    for (const s of samples) {
      expect(s.corrected).toBe(Math.min(4, Math.floor(s.elapsed / step)));
      expect(s.done).toBe(s.elapsed >= handover);
    }
    // At 1,30 s — half the reveal, where the defect ended the phase — the walk is still
    // on its third band and nothing has handed over.
    const half = samples.filter((s) => s.elapsed <= REVEAL_SECONDS_UNRESOLVED / 2);
    expect(half.length).toBeGreaterThan(0);
    for (const s of half) {
      expect(s.done).toBe(false);
      expect(s.corrected).toBeLessThanOrEqual(2);
    }
    // The last correction lands at 1,80 s (4 × 0,45), not at 0,90 s.
    const allCorrected = samples.find((s) => s.corrected === 4);
    expect(allCorrected?.elapsed).toBeGreaterThanOrEqual(step * 4);
    expect(allCorrected?.elapsed).toBeLessThan(step * 4 + 0.1);
    // …and the complete face is then HELD, for the reveal's tail plus the result hold.
    const doneAt = samples.find((s) => s.done)?.elapsed ?? 0;
    expect(doneAt - (allCorrected?.elapsed ?? 0)).toBeGreaterThan(RESULT_HOLD_SECONDS);
    h.unmount();
  });

  it("cuts the walk under prefers-reduced-motion, without cutting the corrections", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false, true);
    runUntilResolved(h);
    // All four corrections are visible at once — the CONTENT is never what is removed.
    expect(h.state().bands.filter((b) => b.corrected)).toHaveLength(4);
    h.unmount();
  });

  it("freezes the reveal behind the pause — the verdict cannot commit unseen (panel M7)", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    runUntilResolved(h);
    const frozenAt = h.state().scene.revealElapsed;
    h.rerender(true);
    // A wall-clock timer kept running here: a rotation during the verdict committed the
    // modifier and the player never saw the result.
    frame(10000);
    expect(h.state().revealDone).toBe(false);
    // Not "less than the hand-over" — the clock did not advance one single tick behind
    // the overlay, after ten seconds of wall clock.
    expect(h.state().scene.revealElapsed).toBe(frozenAt);
    h.rerender(false);
    // Longer than `revealSeconds + resultHoldSeconds` (2,6 + 2,2), read as a whole.
    frame(6000);
    expect(h.state().revealDone).toBe(true);
    h.unmount();
  });

  it("clears the inbox on pause instead of buffering it (ADR-0079 D6)", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    const before = h.state().scene;
    h.rerender(true);
    act(() => {
      h.state().pushIntent({ kind: "CYCLE", band: "hair", delta: 1 });
    });
    frame(500);
    expect(h.state().scene.remainingSeconds).toBe(before.remainingSeconds);
    // Resuming must not replay the swipe made behind the overlay.
    h.rerender(false);
    frame(16);
    expect(h.state().scene.selection[0]).toBe(before.selection[0]);
    h.unmount();
  });
});
