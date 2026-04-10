import { describe, it, expect } from "vitest";
import { addVec2, scaleVec2, distanceVec2, normalizeVec2 } from "../vec2";
import type { Vec2 } from "@game/types/vector";

describe("addVec2", () => {
  it("adds two vectors component-wise", () => {
    expect(addVec2({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });
  it("handles negative components", () => {
    expect(addVec2({ x: -5, y: 3 }, { x: 5, y: -3 })).toEqual({ x: 0, y: 0 });
  });
});

describe("scaleVec2", () => {
  it("scales a vector by a scalar", () => {
    expect(scaleVec2({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });
  it("scaling by 0 returns the zero vector", () => {
    expect(scaleVec2({ x: 99, y: -12 }, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe("distanceVec2", () => {
  it("computes Euclidean distance (3-4-5 triangle)", () => {
    expect(distanceVec2({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it("distance from a point to itself is 0", () => {
    const p: Vec2 = { x: 7, y: -3 };
    expect(distanceVec2(p, p)).toBe(0);
  });
});

describe("normalizeVec2", () => {
  it("returns a unit vector for a non-zero vector", () => {
    const n = normalizeVec2({ x: 3, y: 4 });
    expect(Math.sqrt(n.x * n.x + n.y * n.y)).toBeCloseTo(1, 10);
  });
  it("normalizing the zero vector returns zero vector (no NaN)", () => {
    expect(normalizeVec2({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});
