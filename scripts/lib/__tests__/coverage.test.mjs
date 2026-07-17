import { describe, it, expect } from "vitest";
import {
  coverStrips,
  coverDefects,
  UNDERCOVER_DENS,
  OVERCOVER_DENS,
  EXT_FRAC,
  INT_FRAC,
} from "../coverage.mjs";

/** A frame centred at 0.5 with width 0.08 (edges 0.46 / 0.54). */
const frame = { x: 0.5, w: 0.08 };

describe("coverStrips", () => {
  it("places exterior strips outside and interior strips inside the frame edges", () => {
    const s = coverStrips(frame, 0, 1);
    const fl = 0.46;
    const fr = 0.54;
    const extW = EXT_FRAC * frame.w;
    const intW = INT_FRAC * frame.w;
    expect(s.extLeft).toEqual([fl - extW, fl]);
    expect(s.extRight).toEqual([fr, fr + extW]);
    expect(s.intLeft).toEqual([fl, fl + intW]);
    expect(s.intRight).toEqual([fr - intW, fr]);
    // interior strips sit strictly inside the frame span
    expect(s.intLeft[0]).toBeGreaterThanOrEqual(fl);
    expect(s.intRight[1]).toBeLessThanOrEqual(fr);
  });

  it("clamps the left exterior strip at a near neighbour boundary (bounded case)", () => {
    // A left neighbour whose inner boundary sits at 0.45 — closer than fl-extW=0.432.
    const s = coverStrips(frame, 0.45, 1);
    expect(s.extLeft[0]).toBe(0.45); // clamped by the neighbour, not fl-extW
    expect(s.extLeft[1]).toBe(0.46); // still ends at the frame's left edge
    // the right side is unaffected by a LEFT neighbour bound
    expect(s.extRight).toEqual([0.54, 0.54 + EXT_FRAC * frame.w]);
  });

  it("clamps the right exterior strip at a near neighbour boundary (bounded case)", () => {
    const s = coverStrips(frame, 0, 0.55);
    expect(s.extRight[1]).toBe(0.55);
    expect(s.extRight[0]).toBe(0.54);
  });

  it("collapses an exterior strip to empty when the neighbour boundary crosses the edge", () => {
    // leftBound past the frame's own left edge ⇒ x0 >= x1 (empty, sampled as 0 warm).
    const s = coverStrips(frame, 0.47, 1);
    expect(s.extLeft[0]).toBeGreaterThanOrEqual(s.extLeft[1]);
  });
});

describe("coverDefects", () => {
  const ok = { extLeft: 0.02, extRight: 0.02, intLeft: 0.9, intRight: 0.9 };

  it("returns [] when both edges match the art", () => {
    expect(coverDefects(ok)).toEqual([]);
  });

  it("flags UNDERCOVER on the side whose exterior strip is lit past the threshold", () => {
    expect(coverDefects({ ...ok, extLeft: UNDERCOVER_DENS + 0.01 })).toEqual(["UNDERCOVER(left)"]);
    expect(coverDefects({ ...ok, extRight: UNDERCOVER_DENS + 0.01 })).toEqual([
      "UNDERCOVER(right)",
    ]);
  });

  it("does NOT flag UNDERCOVER just below the threshold", () => {
    expect(coverDefects({ ...ok, extLeft: UNDERCOVER_DENS - 0.01 })).toEqual([]);
  });

  it("flags OVERCOVER on the side whose interior strip is dark below the threshold", () => {
    expect(coverDefects({ ...ok, intLeft: OVERCOVER_DENS - 0.01 })).toEqual(["OVERCOVER(left)"]);
    expect(coverDefects({ ...ok, intRight: OVERCOVER_DENS - 0.01 })).toEqual(["OVERCOVER(right)"]);
  });

  it("does NOT flag OVERCOVER at or above the threshold", () => {
    expect(coverDefects({ ...ok, intLeft: OVERCOVER_DENS })).toEqual([]);
  });

  it("reports both sides when both exterior strips are lit", () => {
    expect(coverDefects({ extLeft: 0.5, extRight: 0.5, intLeft: 0.9, intRight: 0.9 })).toEqual([
      "UNDERCOVER(left)",
      "UNDERCOVER(right)",
    ]);
  });

  it("honours per-level threshold overrides", () => {
    // With a raised under threshold, a formerly-flagged strip passes.
    expect(coverDefects({ ...ok, extLeft: 0.3 }, { underDens: 0.4 })).toEqual([]);
  });

  it("guards non-finite densities with a defect reason, never []", () => {
    expect(coverDefects({ ...ok, extLeft: Number.NaN })).toEqual(["nan"]);
    expect(
      coverDefects({ extLeft: 0.02, extRight: Infinity, intLeft: 0.9, intRight: 0.9 }),
    ).toEqual(["nan"]);
  });
});
