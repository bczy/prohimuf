import { describe, it, expect } from "vitest";
import {
  sampleDiscJitter,
  makeBulletRng,
  AIM_JITTER_RADIUS,
  type Rng,
} from "@game/systems/enemyFireSystem";

// Deterministic scripted RNG — pops predefined values so the tests never rely
// on Math.random. Keeps the pure-layer boundary honest.
function scriptedRng(values: number[]): Rng {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe("enemyFireSystem.sampleDiscJitter", () => {
  it("returns a sample within the disc for any RNG output in [0, 1)", () => {
    const values: number[] = [];
    for (let k = 0; k <= 20; k++) values.push(k / 20);
    const rng = scriptedRng(values);
    for (let i = 0; i < 10; i++) {
      const s = sampleDiscJitter(rng, AIM_JITTER_RADIUS);
      const r = Math.sqrt(s.x * s.x + s.y * s.y);
      expect(r).toBeLessThanOrEqual(AIM_JITTER_RADIUS + 1e-9);
    }
  });

  it("returns (0, 0) when the RNG yields 0 (radius factor sqrt(0) = 0)", () => {
    const rng = scriptedRng([0, 0]);
    const s = sampleDiscJitter(rng, 5);
    expect(s.x).toBeCloseTo(0, 12);
    expect(s.y).toBeCloseTo(0, 12);
  });

  it("consumes two RNG calls per sample (radius then angle)", () => {
    let calls = 0;
    const rng: Rng = () => {
      calls += 1;
      return 0.5;
    };
    sampleDiscJitter(rng, 1);
    expect(calls).toBe(2);
  });

  it("uses sqrt(u) for the radius (avoids centre clumping)", () => {
    // With u = 0.25, radius factor should be sqrt(0.25) = 0.5 (not 0.25).
    // theta = 0 => point at (radius, 0) = (0.5 * R, 0).
    const rng = scriptedRng([0.25, 0]);
    const s = sampleDiscJitter(rng, 2);
    expect(s.x).toBeCloseTo(1, 6);
    expect(s.y).toBeCloseTo(0, 6);
  });
});

describe("enemyFireSystem.makeBulletRng", () => {
  it("is deterministic: the same seed pair replays the same sequence", () => {
    const a = makeBulletRng(7, 3);
    const b = makeBulletRng(7, 3);
    for (let i = 0; i < 8; i++) expect(a()).toBe(b());
  });

  it("yields values in [0, 1)", () => {
    const rng = makeBulletRng(11, 5);
    for (let i = 0; i < 200; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("decorrelates two shooters firing on the same tick", () => {
    // Same bullet id, different enemy id => different first sample, so two
    // windows firing on one tick do not share an aim offset.
    expect(makeBulletRng(4, 1)()).not.toBe(makeBulletRng(4, 2)());
  });
});
