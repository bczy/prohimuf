import { describe, it, expect } from "vitest";
import { ENERGY_EMPTY, ENERGY_FULL, ENERGY_HALF, energyGlowColor } from "../energyGlow";
import { STATE_AMBER, STATE_GREEN, STATE_RED } from "@render/scene/neonHeatColor";

const hex = (h: string): number[] => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
};

const expectClose = (got: readonly number[], want: readonly number[]): void => {
  got.forEach((c, i) => {
    expect(c).toBeCloseTo(want[i] ?? Number.NaN, 6);
  });
};

describe("energyGlowColor anchors", () => {
  it("reuses the codebase's ONE green/amber/red state triple (art gate G5)", () => {
    // No locally minted hexes: the first cut invented #00FF64/#FFD400/#FF3030, and
    // that red exists nowhere in the palette. Both ramps now move together.
    expect(ENERGY_FULL).toBe(STATE_GREEN);
    expect(ENERGY_HALF).toBe(STATE_AMBER);
    expect(ENERGY_EMPTY).toBe(STATE_RED);
  });

  it("anchors full and half energy on bible accents (§2 law 1)", () => {
    expect(["#FF8C14", "#28F0FF", "#FF3CDC", "#78FF3C"]).toContain(ENERGY_FULL);
    expect(["#FF8C14", "#28F0FF", "#FF3CDC", "#78FF3C"]).toContain(ENERGY_HALF);
  });
});

describe("energyGlowColor", () => {
  it("pins the three anchors", () => {
    expectClose(energyGlowColor(100), hex(ENERGY_FULL));
    expectClose(energyGlowColor(50), hex(ENERGY_HALF));
    expectClose(energyGlowColor(0), hex(ENERGY_EMPTY));
  });

  it("interpolates progressively — no plateau, no jump", () => {
    // Strictly monotonic green channel across the red → yellow half, and strictly
    // decreasing red channel across the yellow → green half.
    let prevG = -1;
    for (let e = 0; e <= 50; e += 5) {
      const g = energyGlowColor(e)[1];
      expect(g).toBeGreaterThan(prevG);
      prevG = g;
    }
    let prevR = 2;
    for (let e = 50; e <= 100; e += 5) {
      const r = energyGlowColor(e)[0];
      expect(r).toBeLessThan(prevR);
      prevR = r;
    }
  });

  it("sits between its bracketing anchors at a quarter point", () => {
    const q = energyGlowColor(25);
    const empty = hex(ENERGY_EMPTY);
    const half = hex(ENERGY_HALF);
    expect(q[1]).toBeGreaterThan(empty[1] ?? 1);
    expect(q[1]).toBeLessThan(half[1] ?? 0);
  });

  it("clamps out-of-range energy to the ramp ends", () => {
    expectClose(energyGlowColor(999), hex(ENERGY_FULL));
    expectClose(energyGlowColor(-40), hex(ENERGY_EMPTY));
  });

  it("treats a non-finite energy as empty rather than emitting NaN", () => {
    const c = energyGlowColor(Number.NaN);
    expectClose(c, hex(ENERGY_EMPTY));
  });

  it("returns a fresh tuple each call (callers may mutate)", () => {
    const a = energyGlowColor(100);
    const b = energyGlowColor(100);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it("stays inside the 0..1 gamut everywhere", () => {
    for (let e = -10; e <= 110; e += 1) {
      for (const c of energyGlowColor(e)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
