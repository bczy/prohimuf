import { describe, expect, it } from "vitest";
import { hash32, smoothstep } from "@game/systems/hash";

/**
 * Golden vectors for the determinism kernel (techplan D-H). `hash32` and `smoothstep` were
 * duplicated byte-identically in `qteSystem.ts` and `bossQteSystem.ts`; the photo sway is
 * the third consumer, so they are extracted here rather than forked a third time.
 *
 * THIS TEST WAS WRITTEN BEFORE THE MOVE, against the shipped bodies: every number below is
 * an output of the code as it shipped. If the extraction changed one bit, this goes red —
 * and so do the shipped seed pins (19940715 / 19991232), which are also exercised here.
 */
describe("hash32", () => {
  const GOLDEN: readonly (readonly [number, number, number, number])[] = [
    [0, 0, 0, 4273165475],
    [1, 0, 0, 3004649725],
    [0, 1, 0, 1642685078],
    [0, 0, 1, 3278161989],
    // The two shipped wander seeds — the regression that guards the whole QTE family.
    [19940715, 0, 0, 3955941275],
    [19940715, 3, 7, 2651220381],
    [19991232, 0, 0, 1521728717],
    [19991232, 2, 11, 1060435010],
    [0xffffffff, 0xffffffff, 0xffffffff, 136049741],
  ];

  it.each(GOLDEN)("hash32(%i, %i, %i) === %i", (a, b, c, expected) => {
    expect(hash32(a, b, c)).toBe(expected);
  });

  it("returns a uint32 for every golden triple", () => {
    for (const [a, b, c] of GOLDEN) {
      const h = hash32(a, b, c);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("coerces its inputs through >>> 0, so -1 and 0xffffffff agree", () => {
    expect(hash32(-1, -1, -1)).toBe(hash32(0xffffffff, 0xffffffff, 0xffffffff));
  });

  it("is pure — the same triple always yields the same value", () => {
    expect(hash32(19940715, 3, 7)).toBe(hash32(19940715, 3, 7));
  });

  it("avalanches: neighbouring triples do not produce neighbouring outputs", () => {
    expect(Math.abs(hash32(0, 0, 0) - hash32(0, 0, 1))).toBeGreaterThan(1_000_000);
  });
});

describe("smoothstep", () => {
  it.each([
    [0, 0],
    [0.25, 0.15625],
    [0.5, 0.5],
    [0.75, 0.84375],
    [1, 1],
  ])("smoothstep(%f) === %f", (u, expected) => {
    expect(smoothstep(u)).toBeCloseTo(expected, 12);
  });

  it("has zero derivative at both ends (the deceleration firing window)", () => {
    const eps = 1e-6;
    expect(Math.abs(smoothstep(eps) - smoothstep(0)) / eps).toBeLessThan(1e-5);
    expect(Math.abs(smoothstep(1) - smoothstep(1 - eps)) / eps).toBeLessThan(1e-5);
  });

  it("is symmetric about u = 0.5", () => {
    for (const u of [0.1, 0.2, 0.37, 0.5]) {
      expect(smoothstep(u) + smoothstep(1 - u)).toBeCloseTo(1, 12);
    }
  });
});
