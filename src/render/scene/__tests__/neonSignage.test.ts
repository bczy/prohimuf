import { describe, it, expect } from "vitest";
import { ACID_HUES, LAMP_WARM, acidHue, neonSignageFor } from "../neonSignage";

/** The bible's §2 law 1 anchored accents (docs/art-direction.md). */
const BIBLE_ACCENTS = ["#FF8C14", "#28F0FF", "#FF3CDC", "#78FF3C"];

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

  it("only ever emits hues anchored in the bible (§2 law 1)", () => {
    for (const hue of ACID_HUES) expect(BIBLE_ACCENTS).toContain(hue);
  });
});

describe("neonSignageFor", () => {
  it("gives the réverbère the warm sodium hue, never an acid one", () => {
    for (let i = 0; i < 6; i++) {
      expect(neonSignageFor("lamppost", i)?.color).toBe(LAMP_WARM);
    }
  });

  it("advances the acid hue on every step of the emitter index", () => {
    // The guarantee is a deterministic CYCLE over the index — consecutive indices
    // differ. It is NOT "adjacent props on screen never match": emitter indices are
    // not necessarily consecutive, so two neighbours may share a hue.
    const a = neonSignageFor("streetSign", 0);
    const b = neonSignageFor("streetSign", 1);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.color).not.toBe(b?.color);
    // …and the cycle closes: index 3 is back on index 0's hue.
    expect(neonSignageFor("streetSign", 3)?.color).toBe(a?.color);
  });

  it("is deterministic in the prop index", () => {
    expect(neonSignageFor("streetSign", 4)).toEqual(neonSignageFor("streetSign", 4));
  });

  it("does NOT light décor props that emit nothing in the fiction (art gate E1)", () => {
    // Dropped emitters: an additive disc on them is emission, not reflection, and
    // it spends the « ce qui brille est interactif » contract. `scooter` also wears
    // the delivery-vehicle silhouette, whose interaction signal is a neon rim.
    for (const kind of ["parkingMeter", "bollard", "scooter"] as const) {
      expect(neonSignageFor(kind, 0)).toBeNull();
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
    for (const kind of ["lamppost", "streetSign"] as const) {
      const spec = neonSignageFor(kind, 0);
      expect(spec).not.toBeNull();
      if (spec === null) continue;
      expect(spec.opacity).toBeGreaterThan(0);
      expect(spec.size).toBeGreaterThan(0);
      expect(Math.abs(spec.y) + spec.size / 2).toBeLessThanOrEqual(0.75);
      expect(Math.abs(spec.x) + spec.size / 2).toBeLessThanOrEqual(0.75);
    }
  });
});
