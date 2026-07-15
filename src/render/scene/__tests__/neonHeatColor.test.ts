import { describe, it, expect } from "vitest";
import { heatColor, heatProgress } from "../neonHeatColor";

/**
 * Pure, DOM-free coverage of the enemy heat-rim ramp (ADR-0025). Locks the
 * feedback contract: green at pop-up, a wide orange plateau, red as the window
 * closes, with clamping at the ends.
 */
describe("heatColor", () => {
  const GREEN: [number, number, number] = [0x78 / 255, 0xff / 255, 0x3c / 255];
  const ORANGE: [number, number, number] = [0xff / 255, 0x8c / 255, 0x14 / 255];
  const RED: [number, number, number] = [0xff / 255, 0x30 / 255, 0x30 / 255];

  type Triple = readonly [number, number, number];
  const near = (got: Triple, want: Triple): void => {
    expect(got[0]).toBeCloseTo(want[0], 5);
    expect(got[1]).toBeCloseTo(want[1], 5);
    expect(got[2]).toBeCloseTo(want[2], 5);
  };

  it("(a) is green at progress 0", () => {
    near(heatColor(0), GREEN);
  });

  it("(b) is red at progress 1", () => {
    near(heatColor(1), RED);
  });

  it("(c) holds a flat orange plateau across the middle band", () => {
    near(heatColor(0.35), ORANGE);
    near(heatColor(0.5), ORANGE);
    near(heatColor(0.7), ORANGE);
  });

  it("(d) shifts hotter monotonically: R non-decreasing, then G falls toward red", () => {
    const samples = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1].map((t) => heatColor(t));
    for (let i = 1; i < samples.length; i++) {
      const r = samples[i]?.[0] ?? 0;
      const rPrev = samples[i - 1]?.[0] ?? 0;
      expect(r).toBeGreaterThanOrEqual(rPrev - 1e-9);
    }
    // Green channel drops from the orange plateau to red as danger rises.
    const gPlateau = heatColor(0.7)[1];
    const gRed = heatColor(1)[1];
    expect(gRed).toBeLessThan(gPlateau);
  });

  it("(e) clamps out-of-range progress to the green/red ends", () => {
    near(heatColor(-1), heatColor(0));
    near(heatColor(2), heatColor(1));
  });
});

describe("heatProgress", () => {
  const VD = 3.2; // a representative visibleDuration

  it("is 0 while appearing (just popped up → green)", () => {
    expect(heatProgress("APPEARING", 0.1, VD)).toBe(0);
  });

  it("ramps 0→1 across the visible window as the countdown drains", () => {
    expect(heatProgress("VISIBLE", VD, VD)).toBeCloseTo(0, 5); // fresh
    expect(heatProgress("VISIBLE", VD / 2, VD)).toBeCloseTo(0.5, 5); // halfway
    expect(heatProgress("VISIBLE", 0, VD)).toBeCloseTo(1, 5); // expiring
  });

  it("clamps a timer above the duration to 0 (no negative progress)", () => {
    expect(heatProgress("VISIBLE", VD * 2, VD)).toBe(0);
  });

  it("is fully hot (1) while shooting or hit", () => {
    expect(heatProgress("SHOOTING", 0.2, VD)).toBe(1);
    expect(heatProgress("HIT", 0.1, VD)).toBe(1);
  });

  it("guards a zero/absent visible duration against NaN", () => {
    expect(heatProgress("VISIBLE", 1, 0)).toBe(0);
  });

  it("is 0 for hidden/dead slots", () => {
    expect(heatProgress("HIDDEN", 0, VD)).toBe(0);
    expect(heatProgress("DEAD", 0, VD)).toBe(0);
  });
});
