import { describe, it, expect } from "vitest";
import { flipbookFrame } from "../flipbook";

/**
 * Pure, DOM-free coverage of the enemy flipbook frame selector
 * (story-enemy-sprite-flipbook). Locks the 1-based indexing, the loop
 * wrap-around, fps scaling, and the degenerate-input guards that keep a
 * still-generating (`_f2` missing) or malformed sprite pinned on frame 1.
 *
 * Times use exact binary fractions (0.25, 0.5, …) so `elapsed * fps` lands on an
 * integer boundary with no float drift — the frame index is then exact.
 */
describe("flipbookFrame", () => {
  it("returns 1-based frames and wraps around the loop", () => {
    // fps 4, 3 frames: each 0.25s advances one frame, wrapping at frame 3.
    expect(flipbookFrame(0, 3, 4)).toBe(1);
    expect(flipbookFrame(0.25, 3, 4)).toBe(2);
    expect(flipbookFrame(0.5, 3, 4)).toBe(3);
    expect(flipbookFrame(0.75, 3, 4)).toBe(1); // wrap
    expect(flipbookFrame(1.0, 3, 4)).toBe(2); // second loop
  });

  it("is exact at a frame boundary (elapsed === 1 / fps)", () => {
    // The instant one frame's worth of time has elapsed flips to frame 2.
    expect(flipbookFrame(1 / 4, 3, 4)).toBe(2);
    expect(flipbookFrame(2 / 4, 3, 4)).toBe(3);
  });

  it("holds frame 1 for a single-frame (idle-only) sprite", () => {
    expect(flipbookFrame(0, 1, 6)).toBe(1);
    expect(flipbookFrame(10, 1, 6)).toBe(1);
    expect(flipbookFrame(0, 0, 6)).toBe(1);
  });

  it("scales with fps: higher fps advances faster for the same clock", () => {
    // Same 0.25s clock: fps 4 -> 1 step (frame 2); fps 8 -> 2 steps (frame 3).
    expect(flipbookFrame(0.25, 3, 4)).toBe(2);
    expect(flipbookFrame(0.25, 3, 8)).toBe(3);
  });

  it("returns 1 for non-positive fps", () => {
    expect(flipbookFrame(0.5, 3, 0)).toBe(1);
    expect(flipbookFrame(0.5, 3, -4)).toBe(1);
  });

  it("returns 1 for negative or non-finite elapsed", () => {
    expect(flipbookFrame(-1, 3, 4)).toBe(1);
    expect(flipbookFrame(NaN, 3, 4)).toBe(1);
    expect(flipbookFrame(Infinity, 3, 4)).toBe(1);
    expect(flipbookFrame(-Infinity, 3, 4)).toBe(1);
  });
});
