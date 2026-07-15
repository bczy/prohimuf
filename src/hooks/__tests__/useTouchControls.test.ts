import { describe, expect, it } from "vitest";
import { MAX_ZOOM_FRACTION, MIN_ZOOM_FRACTION, nextZoomFraction } from "@hooks/useTouchControls";

describe("nextZoomFraction", () => {
  it("keeps the committed zoom when the spread is unchanged", () => {
    expect(nextZoomFraction(1, 0.4, 0.4)).toBe(1);
    expect(nextZoomFraction(0.75, 0.4, 0.4)).toBe(0.75);
  });

  it("zooms out as the fingers pinch together, down to the 2× floor", () => {
    // Halving the spread halves the zoom fraction.
    expect(nextZoomFraction(1, 0.4, 0.2)).toBe(0.5);
    // Pinching further cannot pass MIN_ZOOM_FRACTION (2× out).
    expect(nextZoomFraction(1, 0.4, 0.1)).toBe(MIN_ZOOM_FRACTION);
  });

  it("zooms back in as the fingers spread apart, capped at the base zoom", () => {
    expect(nextZoomFraction(0.5, 0.2, 0.3)).toBeCloseTo(0.75, 5);
    // Spreading past the base framing cannot exceed MAX_ZOOM_FRACTION.
    expect(nextZoomFraction(0.8, 0.2, 0.4)).toBe(MAX_ZOOM_FRACTION);
  });

  it("scales from the committed zoom so successive pinches compose", () => {
    // Starting already half-out, spreading 1.5× lands at 0.75, not back at 1.
    expect(nextZoomFraction(0.5, 0.2, 0.3)).toBeCloseTo(0.75, 5);
  });

  it("is a no-op when the start spread is degenerate", () => {
    expect(nextZoomFraction(0.7, 0, 0.3)).toBe(0.7);
  });

  it("bounds are the expected [0.5, 1] window", () => {
    expect(MIN_ZOOM_FRACTION).toBe(0.5);
    expect(MAX_ZOOM_FRACTION).toBe(1);
  });
});
