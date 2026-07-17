import { describe, it, expect } from "vitest";
import { misaligned, ALIGN_TOL } from "../alignment.mjs";

/** A measured opening centred at 0.5 with an 0.08 width. */
const opening = { x: 0.5, w: 0.08 };

describe("misaligned", () => {
  it("returns null when the frame matches the opening", () => {
    expect(misaligned({ x: 0.5, w: 0.08 }, opening, ALIGN_TOL)).toBe(null);
  });

  it("passes just inside the x tolerance", () => {
    expect(misaligned({ x: 0.5 + ALIGN_TOL * 0.99, w: 0.08 }, opening, ALIGN_TOL)).toBe(null);
  });

  it("fails just outside the x tolerance", () => {
    expect(misaligned({ x: 0.5 + ALIGN_TOL * 1.01, w: 0.08 }, opening, ALIGN_TOL)).toBe("x");
  });

  it("passes just inside the w tolerance", () => {
    expect(misaligned({ x: 0.5, w: 0.08 + ALIGN_TOL * 0.99 }, opening, ALIGN_TOL)).toBe(null);
  });

  it("fails just outside the w tolerance", () => {
    expect(misaligned({ x: 0.5, w: 0.08 + ALIGN_TOL * 1.01 }, opening, ALIGN_TOL)).toBe("w");
  });

  it("reports x before w when both are off", () => {
    expect(misaligned({ x: 0.6, w: 0.2 }, opening, ALIGN_TOL)).toBe("x");
  });
});
