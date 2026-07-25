import { describe, it, expect } from "vitest";
import { ACID_HUES, LAMP_WARM, SUBTLE_OPACITY_MAX, acidHue, neonSignageFor } from "../neonSignage";

describe("acidHue", () => {
  it("cycles the acid triad", () => {
    expect(acidHue(0)).toBe(ACID_HUES[0]);
    expect(acidHue(1)).toBe(ACID_HUES[1]);
    expect(acidHue(2)).toBe(ACID_HUES[2]);
    expect(acidHue(3)).toBe(ACID_HUES[0]);
  });

  it("folds out-of-range indices back into the triad", () => {
    expect(acidHue(-1)).toBe(ACID_HUES[2]);
    expect(acidHue(-4)).toBe(ACID_HUES[2]);
    expect(acidHue(1.9)).toBe(ACID_HUES[1]);
  });
});

describe("neonSignageFor", () => {
  it("gives the réverbère the warm sodium hue, never an acid one", () => {
    for (let i = 0; i < 6; i++) {
      expect(neonSignageFor("lamppost", i)?.color).toBe(LAMP_WARM);
    }
  });

  it("mixes acid hues along the street so neighbours never match", () => {
    const a = neonSignageFor("streetSign", 0);
    const b = neonSignageFor("streetSign", 1);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.color).not.toBe(b?.color);
  });

  it("is deterministic in the prop index", () => {
    expect(neonSignageFor("streetSign", 4)).toEqual(neonSignageFor("streetSign", 4));
  });

  it("keeps métal/rebut emitters strictly subtler than the signage ones", () => {
    const sign = neonSignageFor("streetSign", 0);
    for (const kind of ["parkingMeter", "bollard", "scooter"] as const) {
      const spec = neonSignageFor(kind, 0);
      expect(spec).not.toBeNull();
      expect(spec?.opacity).toBeLessThanOrEqual(SUBTLE_OPACITY_MAX);
      expect(spec?.opacity ?? 1).toBeLessThan(sign?.opacity ?? 0);
    }
  });

  it("leaves the feu tricolore to its own lit-lens overlay", () => {
    expect(neonSignageFor("trafficLight", 0)).toBeNull();
  });

  it("returns null for non-emitting props", () => {
    expect(neonSignageFor("bench", 0)).toBeNull();
    expect(neonSignageFor("wallaceFountain", 0)).toBeNull();
  });

  it("keeps every glow inside its prop's plane footprint", () => {
    for (const kind of ["lamppost", "streetSign", "parkingMeter", "bollard", "scooter"] as const) {
      const spec = neonSignageFor(kind, 0);
      expect(spec).not.toBeNull();
      if (spec === null) continue;
      expect(spec.opacity).toBeGreaterThan(0);
      expect(spec.size).toBeGreaterThan(0);
      expect(Math.abs(spec.y) + spec.size / 2).toBeLessThanOrEqual(0.75);
    }
  });
});
