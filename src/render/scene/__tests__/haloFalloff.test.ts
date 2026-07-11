import { describe, it, expect } from "vitest";
import { applyHaloFalloff, ALPHA_THRESHOLD } from "../haloFalloff";

/**
 * Pure, DOM-free coverage of the neon-rim alpha falloff (ADR-0011,
 * story-halo-alpha-composite-gate). These are the mechanical regression lock for
 * the bug Bertrand hit: a binary-alpha halo with no gradient. A flat {0, 255}
 * output would fail (a) and (b).
 */
describe("applyHaloFalloff", () => {
  // A single horizontal row: pixels 0..3 opaque (alpha 255), 4..7 transparent.
  // Clean orthogonal distances make the expected gradient exactly predictable.
  const buildRow = (): { alpha: number[]; width: number; height: number } => ({
    alpha: [255, 255, 255, 255, 0, 0, 0, 0],
    width: 8,
    height: 1,
  });

  it("(a) produces intermediate alpha values in the margin band", () => {
    const { alpha, width, height } = buildRow();
    const out = applyHaloFalloff(alpha, width, height, 3);
    const intermediate = Array.from(out).filter((v) => v > 0 && v < 255);
    expect(intermediate.length).toBeGreaterThan(0);
  });

  it("(b) decreases monotonically with distance from the opaque edge", () => {
    const { alpha, width, height } = buildRow();
    const out = applyHaloFalloff(alpha, width, height, 3);
    // Walk outward from the last opaque pixel (index 3) to the far edge.
    const band = Array.from(out).slice(3);
    for (let i = 1; i < band.length; i++) {
      expect(band[i]).toBeLessThanOrEqual(band[i - 1] ?? 0);
    }
    // And it genuinely steps down (not a flat plate) at least once.
    const droppedSomewhere = band.some((v, i) => i > 0 && v < (band[i - 1] ?? 0));
    expect(droppedSomewhere).toBe(true);
  });

  it("(c) is fully transparent at and beyond marginPx", () => {
    const { alpha, width, height } = buildRow();
    const margin = 3;
    const out = applyHaloFalloff(alpha, width, height, margin);
    // Distance from nearest opaque (index 3): index 6 -> 3px (== margin),
    // index 7 -> 4px (> margin). Both must be zero.
    expect(out[6]).toBe(0);
    expect(out[7]).toBe(0);
  });

  it("(d) opaque source pixels keep their own alpha", () => {
    // Mixed opaque alphas above the threshold must be preserved verbatim.
    const alpha = [255, 200, 40, 0, 0];
    const out = applyHaloFalloff(alpha, 5, 1, 3);
    expect(out[0]).toBe(255);
    expect(out[1]).toBe(200);
    expect(out[2]).toBe(40);
    // Sanity: 40 is above the threshold, so it is treated as opaque, not faded.
    expect(40).toBeGreaterThan(ALPHA_THRESHOLD);
  });

  it("(d') sub-threshold fringe pixels seed the halo rather than staying solid", () => {
    // A faint (<= threshold) pixel is transparent for halo purposes: it must be
    // recomputed by the falloff, not kept at its source value.
    const alpha = [255, ALPHA_THRESHOLD, 0, 0];
    const out = applyHaloFalloff(alpha, 4, 1, 3);
    expect(out[1]).not.toBe(ALPHA_THRESHOLD);
  });

  it("(e) handles an empty buffer safely", () => {
    const out = applyHaloFalloff([], 0, 0, 3);
    expect(out.length).toBe(0);
  });

  it("(e) with zero margin keeps opaque alpha and zeroes the rest", () => {
    const alpha = [255, 0, 0, 0];
    const out = applyHaloFalloff(alpha, 4, 1, 0);
    expect(out[0]).toBe(255);
    expect(out[1]).toBe(0);
    expect(out[2]).toBe(0);
    expect(out[3]).toBe(0);
  });

  it("(e) with no opaque pixels leaves everything transparent", () => {
    const alpha = [0, 0, 0, 0];
    const out = applyHaloFalloff(alpha, 4, 1, 3);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it("radiates a 2D gradient that fades outward on both axes", () => {
    // 7x7 grid, single opaque pixel at centre (3,3). Corners are furthest.
    const width = 7;
    const height = 7;
    const alpha = new Array<number>(width * height).fill(0);
    alpha[3 * width + 3] = 255;
    const out = applyHaloFalloff(alpha, width, height, 4);

    const at = (x: number, y: number): number => out[y * width + x] ?? 0;
    // Centre keeps full alpha; immediate orthogonal neighbour is brighter than
    // the one two steps out; the far corner is dark.
    expect(at(3, 3)).toBe(255);
    expect(at(4, 3)).toBeGreaterThan(at(5, 3));
    expect(at(3, 4)).toBeGreaterThan(at(3, 5));
    expect(at(0, 0)).toBe(0);
  });
});
