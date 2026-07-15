import { describe, expect, it } from "vitest";
import { rimZoomCompensation } from "../enemyRimMaterial";

describe("rimZoomCompensation", () => {
  it("is 1 at the base zoom (no change to the current look)", () => {
    expect(rimZoomCompensation(4, 4)).toBe(1);
  });

  it("grows the margin as the camera zooms out, keeping screen width constant", () => {
    // Zoomed out 2× (cam at half the base): the world margin must double.
    expect(rimZoomCompensation(4, 2)).toBe(2);
    expect(rimZoomCompensation(3, 2)).toBeCloseTo(1.5, 5);
  });

  it("never shrinks the rim below its base width (clamped ≥ 1)", () => {
    // A zoom-IN past base would otherwise thin the rim — clamp holds it at 1.
    expect(rimZoomCompensation(4, 8)).toBe(1);
  });

  it("is safe when the camera zoom is degenerate", () => {
    expect(rimZoomCompensation(4, 0)).toBe(1);
  });
});
