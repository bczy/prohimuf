import { describe, it, expect } from "vitest";
import {
  accumulateDrag,
  classifySwipe,
  DRAG_CRAN_DISTANCE,
  SWIPE_MAX_ANGLE_DEG,
  SWIPE_MAX_MS,
  SWIPE_MIN_DISTANCE,
} from "@game/systems/swipeGestureSystem";

/** dy that sits exactly `deg` off the horizontal for a given dx. */
function dyAt(dx: number, deg: number): number {
  return Math.abs(dx) * Math.tan((deg * Math.PI) / 180);
}

describe("classifySwipe — the boundaries are the test (ADR-0083 D2)", () => {
  it("names the direction of a clean horizontal swipe", () => {
    expect(classifySwipe(0.2, 0, 120)).toBe("right");
    expect(classifySwipe(-0.2, 0, 120)).toBe("left");
  });

  it("is inclusive at the distance threshold and exclusive below it", () => {
    expect(classifySwipe(SWIPE_MIN_DISTANCE, 0, 100)).toBe("right");
    expect(classifySwipe(SWIPE_MIN_DISTANCE - 1e-9, 0, 100)).toBe("none");
    expect(classifySwipe(-SWIPE_MIN_DISTANCE, 0, 100)).toBe("left");
  });

  it("accepts the diagonal up to the angle guard and refuses beyond it", () => {
    const dx = 0.2;
    expect(classifySwipe(dx, dyAt(dx, SWIPE_MAX_ANGLE_DEG - 0.5), 100)).toBe("right");
    expect(classifySwipe(dx, -dyAt(dx, SWIPE_MAX_ANGLE_DEG - 0.5), 100)).toBe("right");
    expect(classifySwipe(dx, dyAt(dx, SWIPE_MAX_ANGLE_DEG + 0.5), 100)).toBe("none");
    expect(classifySwipe(dx, -dyAt(dx, SWIPE_MAX_ANGLE_DEG + 0.5), 100)).toBe("none");
  });

  it("a vertical gesture is never a swipe", () => {
    expect(classifySwipe(0, 0.5, 100)).toBe("none");
    expect(classifySwipe(0.01, 0.5, 100)).toBe("none");
  });

  it("a gesture slower than SWIPE_MAX_MS is a drag, not a swipe", () => {
    expect(classifySwipe(0.3, 0, SWIPE_MAX_MS)).toBe("right");
    expect(classifySwipe(0.3, 0, SWIPE_MAX_MS + 1)).toBe("none");
  });

  it("is total — any non-finite or negative input yields none, never a throw", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(classifySwipe(bad, 0, 100)).toBe("none");
      expect(classifySwipe(0.3, bad, 100)).toBe("none");
      expect(classifySwipe(0.3, 0, bad)).toBe("none");
    }
    expect(classifySwipe(0.3, 0, -1)).toBe("none");
  });
});

describe("accumulateDrag — one cran per DRAG_CRAN_DISTANCE (ADR-0083 D2bis)", () => {
  it("crosses no cran below the threshold and exactly one at it", () => {
    expect(accumulateDrag(0, DRAG_CRAN_DISTANCE * 0.99).crans).toBe(0);
    expect(accumulateDrag(0, DRAG_CRAN_DISTANCE).crans).toBe(1);
    expect(accumulateDrag(0, -DRAG_CRAN_DISTANCE).crans).toBe(-1);
  });

  it("crosses several crans in one big move", () => {
    expect(accumulateDrag(0, DRAG_CRAN_DISTANCE * 3.5).crans).toBe(3);
    expect(accumulateDrag(0, -DRAG_CRAN_DISTANCE * 3.5).crans).toBe(-3);
  });

  it("no frame-rate dependence — 10 small moves equal 1 big move", () => {
    const travel = DRAG_CRAN_DISTANCE * 4.3;
    let carried = 0;
    let total = 0;
    for (let i = 0; i < 10; i += 1) {
      const step = accumulateDrag(carried, travel / 10);
      carried = step.carriedPx;
      total += step.crans;
    }
    expect(total).toBe(accumulateDrag(0, travel).crans);
  });

  it("monotone — dragging out and back returns to where it started, with no drift", () => {
    let carried = 0;
    let net = 0;
    for (const delta of [0.03, 0.05, 0.02, -0.04, -0.06]) {
      const step = accumulateDrag(carried, delta);
      carried = step.carriedPx;
      net += step.crans;
    }
    expect(net).toBe(0);
    expect(carried).toBeCloseTo(0, 12);
  });

  it("the carried remainder is always strictly inside one cran", () => {
    let carried = 0;
    for (const delta of [0.011, 0.077, -0.2, 0.5, -0.033]) {
      const step = accumulateDrag(carried, delta);
      carried = step.carriedPx;
      expect(Math.abs(carried)).toBeLessThan(DRAG_CRAN_DISTANCE);
    }
  });

  it("is total — a non-finite delta crosses no cran and preserves the remainder", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(accumulateDrag(0.02, bad)).toEqual({ crans: 0, carriedPx: 0.02 });
    }
    expect(accumulateDrag(NaN, DRAG_CRAN_DISTANCE).crans).toBe(1);
  });
});
