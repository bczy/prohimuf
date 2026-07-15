import { describe, it, expect } from "vitest";
import { isTapGesture, isDoubleTap } from "../tapGestureSystem";

/**
 * Pure core of the mobile double-tap shoot (the second shoot input added beside the
 * two-finger tap). `useTouchControls` feeds raw touch timing/positions through these; the
 * DOM plumbing stays untested here. These lock what counts as a tap, and when two taps pair.
 */
describe("isTapGesture", () => {
  it("accepts a short, still touch", () => {
    expect(isTapGesture(120, 0.01)).toBe(true);
  });

  it("accepts the exact boundaries (≤ 300 ms, ≤ 0.03 drift)", () => {
    expect(isTapGesture(300, 0.03)).toBe(true);
  });

  it("rejects a slow touch (a lingering press, not a tap)", () => {
    expect(isTapGesture(360, 0.0)).toBe(false);
  });

  it("rejects a drifting touch (a drag/pan, not a tap)", () => {
    expect(isTapGesture(100, 0.08)).toBe(false);
  });
});

describe("isDoubleTap", () => {
  it("never pairs when there is no previous tap", () => {
    expect(isDoubleTap(null, { t: 1000, x: 0.5, y: 0.5 })).toBe(false);
  });

  it("pairs two taps close in time AND space", () => {
    const first = { t: 1000, x: 0.5, y: 0.5 };
    expect(isDoubleTap(first, { t: 1200, x: 0.52, y: 0.49 })).toBe(true);
  });

  it("does not pair when the second tap comes too late", () => {
    const first = { t: 1000, x: 0.5, y: 0.5 };
    expect(isDoubleTap(first, { t: 1400, x: 0.5, y: 0.5 })).toBe(false);
  });

  it("does not pair when the second tap lands too far away", () => {
    const first = { t: 1000, x: 0.2, y: 0.2 };
    expect(isDoubleTap(first, { t: 1100, x: 0.8, y: 0.8 })).toBe(false);
  });

  it("accepts the exact gap and distance boundaries", () => {
    const first = { t: 1000, x: 0.5, y: 0.5 };
    // gap = 300 ms, distance = 0.12 (dx = 0.12, dy = 0) — both on the inclusive edge.
    expect(isDoubleTap(first, { t: 1300, x: 0.62, y: 0.5 })).toBe(true);
  });
});
