import { describe, it, expect } from "vitest";
import { moveCrosshair, crosshairToWorld } from "@game/systems/crosshairSystem";

describe("moveCrosshair", () => {
  it("stores normalized mouse position", () => {
    const c = moveCrosshair(0.5, 0.3);
    expect(c.position).toEqual({ x: 0.5, y: 0.3 });
  });

  it("clamps x and y to [0..1]", () => {
    const c = moveCrosshair(-0.1, 1.5);
    expect(c.position.x).toBe(0);
    expect(c.position.y).toBe(1);
  });
});

describe("crosshairToWorld", () => {
  it("maps center (0.5, 0.5) to world origin", () => {
    const c = moveCrosshair(0.5, 0.5);
    const w = crosshairToWorld(c, 20, 10);
    expect(w).toEqual({ x: 0, y: 0 });
  });

  it("maps (0, 0) to top-left world corner", () => {
    const c = moveCrosshair(0, 0);
    const w = crosshairToWorld(c, 20, 10);
    expect(w).toEqual({ x: -10, y: 5 });
  });
});
