import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import type { JSX } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { usePortraitRobot } from "@hooks/usePortraitRobot";
import type { PortraitRobotState } from "@hooks/usePortraitRobot";
import { FACE_CATALOGUE } from "@game/portraits";
import { correctCount } from "@game/systems/portraitRobotSystem";

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

  it("walks the reveal band by band, then hands over — one clock, not a setTimeout", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const h = mount(false);
    // Expire the chrono: FAILED, revealSeconds = 2,6 s ⇒ 0,45 s per band + 0,8 s tail.
    runUntilResolved(h);

    // Immediately after the verdict nothing is corrected yet: the walk has not started.
    const corrected = () => h.state().bands.filter((b) => b.corrected).length;
    expect(h.state().revealDone).toBe(false);

    // Step through the reveal and record WHEN each thing happens, in frames.
    let allCorrectedAt = -1;
    let doneAt = -1;
    for (let i = 1; i <= 60 && doneAt === -1; i += 1) {
      frame(50);
      if (allCorrectedAt === -1 && corrected() === 4) allCorrectedAt = i;
      if (h.state().revealDone) doneAt = i;
    }
    // The walk happens (the bands are not corrected all at once on the first frame)…
    expect(allCorrectedAt).toBeGreaterThan(1);
    // …and the complete face is HELD after it, before the phase hands over.
    expect(doneAt).toBeGreaterThan(allCorrectedAt);
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
    h.rerender(true);
    // A wall-clock timer kept running here: a rotation during the verdict committed the
    // modifier and the player never saw the result.
    frame(10000);
    expect(h.state().revealDone).toBe(false);
    h.rerender(false);
    frame(3000);
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
