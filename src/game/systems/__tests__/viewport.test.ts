import { describe, it, expect } from "vitest";
import { isOnScreen } from "@game/systems/viewport";
import { VIEW_W, VIEW_H } from "@game/systems/crosshairSystem";

describe("isOnScreen", () => {
  it("a point at the camera centre is on screen", () => {
    expect(isOnScreen({ x: 0, y: 0 })).toBe(true);
  });

  it("a point beyond the horizontal half-view is off screen", () => {
    expect(isOnScreen({ x: VIEW_W / 2 + 0.01, y: 0 })).toBe(false);
    expect(isOnScreen({ x: -(VIEW_W / 2) - 0.01, y: 0 })).toBe(false);
  });

  it("a point beyond the vertical half-view is off screen", () => {
    expect(isOnScreen({ x: 0, y: VIEW_H / 2 + 0.01 })).toBe(false);
    expect(isOnScreen({ x: 0, y: -(VIEW_H / 2) - 0.01 })).toBe(false);
  });

  it("the exact edge counts as on screen (inclusive bounds)", () => {
    expect(isOnScreen({ x: VIEW_W / 2, y: VIEW_H / 2 })).toBe(true);
  });

  it("follows the camera: panning brings a far point into view", () => {
    const far = { x: 14, y: 0 };
    expect(isOnScreen(far)).toBe(false);
    expect(isOnScreen(far, 14)).toBe(true);
  });

  it("follows the camera vertically", () => {
    const high = { x: 0, y: 9 };
    expect(isOnScreen(high)).toBe(false);
    expect(isOnScreen(high, 0, 9)).toBe(true);
  });

  it("honours an explicit view size (zoomed-out framing sees further)", () => {
    const p = { x: 12, y: 0 };
    expect(isOnScreen(p, 0, 0, VIEW_W, VIEW_H)).toBe(false);
    expect(isOnScreen(p, 0, 0, 30, VIEW_H)).toBe(true);
  });

  it("a NaN coordinate is off screen (fail-safe)", () => {
    expect(isOnScreen({ x: Number.NaN, y: 0 })).toBe(false);
    expect(isOnScreen({ x: 0, y: Number.NaN })).toBe(false);
  });
});
