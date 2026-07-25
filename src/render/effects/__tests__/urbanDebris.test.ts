import { describe, it, expect } from "vitest";
import { DEBRIS_KINDS, debrisY, makeDebris, stepDebris } from "../urbanDebris";

/** Deterministic RNG: cycles a fixed sequence so every assertion is reproducible. */
function seq(values: readonly number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i++;
    return v;
  };
}

const HALF = 10;

describe("makeDebris", () => {
  it("scatters items across the street and keeps every kind in range", () => {
    const rand = Math.random;
    for (let i = 0; i < 200; i++) {
      const d = makeDebris(rand, HALF, 0);
      expect(d.x).toBeGreaterThanOrEqual(-HALF);
      expect(d.x).toBeLessThanOrEqual(HALF);
      expect(d.kind).toBeGreaterThanOrEqual(0);
      expect(d.kind).toBeLessThan(DEBRIS_KINDS);
      expect(d.size).toBeGreaterThan(0);
      expect(Math.abs(d.vx)).toBeGreaterThan(0);
    }
  });

  it("gives items both travel directions", () => {
    const rand = Math.random;
    const dirs = new Set<number>();
    for (let i = 0; i < 200; i++) dirs.add(Math.sign(makeDebris(rand, HALF, 0).vx));
    expect(dirs.has(1)).toBe(true);
    expect(dirs.has(-1)).toBe(true);
  });

  it("staggers each item's own clock so the field never pulses in unison", () => {
    const rand = Math.random;
    const clocks = new Set(
      Array.from({ length: 40 }, () => makeDebris(rand, HALF, 0).t.toFixed(4)),
    );
    expect(clocks.size).toBeGreaterThan(1);
  });

  it("is deterministic for a given RNG sequence", () => {
    const a = makeDebris(seq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]), HALF, 2);
    const b = makeDebris(seq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]), HALF, 2);
    expect(a).toEqual(b);
  });
});

describe("stepDebris", () => {
  const base = makeDebris(seq([0.5]), HALF, 0);

  it("advances position, rotation and the item's own clock", () => {
    const next = stepDebris(base, 0.05, HALF);
    expect(next.x).not.toBe(base.x);
    expect(next.t).toBeCloseTo(base.t + 0.05, 9);
    expect(next.rot).toBeCloseTo(base.rot + base.spin * 0.05, 9);
  });

  it("never mutates the input", () => {
    const snapshot = { ...base };
    stepDebris(base, 0.05, HALF);
    expect(base).toEqual(snapshot);
  });

  it("keeps every item inside the street however long it runs", () => {
    let d = { ...base, vx: 3.3 };
    for (let i = 0; i < 5000; i++) {
      d = stepDebris(d, 1 / 60, HALF);
      expect(d.x).toBeGreaterThanOrEqual(-HALF);
      expect(d.x).toBeLessThanOrEqual(HALF);
    }
  });

  it("wraps left-bound items to the right edge too", () => {
    let d = { ...base, x: -HALF + 0.01, vx: -2 };
    d = stepDebris(d, 0.5, HALF);
    expect(d.x).toBeGreaterThan(0); // came back in from the right
  });

  it("survives an overshoot larger than the whole street", () => {
    const d = stepDebris({ ...base, x: 0, vx: 1000 }, 0.1, HALF);
    expect(d.x).toBeGreaterThanOrEqual(-HALF);
    expect(d.x).toBeLessThanOrEqual(HALF);
  });

  it("clamps a stalled frame so the field cannot teleport", () => {
    const slow = stepDebris({ ...base, x: 0, vx: 1 }, 5, HALF);
    const capped = stepDebris({ ...base, x: 0, vx: 1 }, 0.1, HALF);
    expect(slow.x).toBeCloseTo(capped.x, 9);
  });

  it("is a no-op on a frozen clock (delta 0) — the reduced-motion / pause freeze", () => {
    expect(stepDebris(base, 0, HALF)).toBe(base);
    expect(stepDebris(base, Number.NaN, HALF)).toBe(base);
    expect(stepDebris(base, -1, HALF)).toBe(base);
  });

  it("advances items independently", () => {
    const a = makeDebris(seq([0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.5]), HALF, 0);
    const b = makeDebris(seq([0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4, 0.5]), HALF, 0);
    const a1 = stepDebris(a, 0.1, HALF);
    const b1 = stepDebris(b, 0.1, HALF);
    expect(a1.x - a.x).not.toBeCloseTo(b1.x - b.x, 6);
  });
});

describe("debrisY", () => {
  it("stays inside the item's own bob amplitude", () => {
    let d = makeDebris(seq([0.3, 0.6, 0.2, 0.9, 0.4, 0.1, 0.8, 0.5, 0.7]), HALF, 1.5);
    for (let i = 0; i < 400; i++) {
      d = stepDebris(d, 1 / 60, HALF);
      expect(Math.abs(debrisY(d) - d.y)).toBeLessThanOrEqual(d.bobAmp + 1e-9);
    }
  });

  it("is a pure function of the item's clock", () => {
    const d = makeDebris(seq([0.5]), HALF, 0);
    expect(debrisY(d)).toBe(debrisY({ ...d }));
  });
});
