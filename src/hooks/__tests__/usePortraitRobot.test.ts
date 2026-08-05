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

function mount(paused: boolean): {
  state: () => PortraitRobotState;
  rerender: (paused: boolean) => void;
  unmount: () => void;
} {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  let latest: PortraitRobotState | null = null;
  const Probe = ({ paused: p }: { paused: boolean }): JSX.Element => {
    latest = usePortraitRobot({ seed: 1998, timerSeconds: TIMER_SECONDS, paused: p });
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
