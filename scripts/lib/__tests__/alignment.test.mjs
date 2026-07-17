import { describe, it, expect } from "vitest";
import { misaligned, ALIGN_TOL } from "../alignment.mjs";

/** A measured opening centred at 0.5 with an 0.08 width (edges 0.46 / 0.54). */
const opening = { x: 0.5, w: 0.08 };

// Build a frame that shifts ONLY the left edge by `d` (right edge held on the opening).
const shiftLeftEdge = (d) => ({ x: 0.5 + d / 2, w: 0.08 - d });
// Build a frame that shifts ONLY the right edge by `d` (left edge held on the opening).
const shiftRightEdge = (d) => ({ x: 0.5 + d / 2, w: 0.08 + d });

describe("misaligned", () => {
  it("returns null when the frame matches the opening", () => {
    expect(misaligned({ x: 0.5, w: 0.08 }, opening, ALIGN_TOL)).toBe(null);
  });

  it("passes just inside the left-edge tolerance", () => {
    expect(misaligned(shiftLeftEdge(ALIGN_TOL * 0.99), opening, ALIGN_TOL)).toBe(null);
  });

  it("fails just outside the left-edge tolerance", () => {
    expect(misaligned(shiftLeftEdge(ALIGN_TOL * 1.01), opening, ALIGN_TOL)).toBe("left");
  });

  it("passes just inside the right-edge tolerance", () => {
    expect(misaligned(shiftRightEdge(ALIGN_TOL * 0.99), opening, ALIGN_TOL)).toBe(null);
  });

  it("fails just outside the right-edge tolerance", () => {
    expect(misaligned(shiftRightEdge(ALIGN_TOL * 1.01), opening, ALIGN_TOL)).toBe("right");
  });

  it("reports a negative left-edge offset (edge shifted inward)", () => {
    expect(misaligned(shiftLeftEdge(-ALIGN_TOL * 1.01), opening, ALIGN_TOL)).toBe("left");
  });

  it("reports both edges when a centre shift drives them both out", () => {
    // A pure centre shift by 2·tol moves both edges by 2·tol.
    expect(misaligned({ x: 0.5 + 2 * ALIGN_TOL, w: 0.08 }, opening, ALIGN_TOL)).toBe("left+right");
  });

  it("passes at exactly the tolerance (strict >, equality passes)", () => {
    // Zero-width degenerate frame/opening: both edge deltas are exactly ALIGN_TOL
    // (bit-identical, no float drift), so `> tol` is false and equality passes.
    expect(misaligned({ x: ALIGN_TOL, w: 0 }, { x: 0, w: 0 }, ALIGN_TOL)).toBe(null);
  });

  it("guards non-finite inputs with a defect reason, never null", () => {
    expect(misaligned({ x: Number.NaN, w: 0.08 }, opening, ALIGN_TOL)).toBe("nan");
    expect(misaligned({ x: 0.5, w: 0.08 }, { x: Infinity, w: 0.08 }, ALIGN_TOL)).toBe("nan");
    expect(misaligned({ x: 0.5 }, opening, ALIGN_TOL)).toBe("nan");
  });
});
