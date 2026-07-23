import { describe, it, expect } from "vitest";
import {
  spawnEnemyBullet,
  sampleDiscJitter,
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

describe("enemyFireSystem.spawnEnemyBullet", () => {
  it("velocity points from origin toward target when jitter is zero", () => {
    const b = spawnEnemyBullet(
      1,
      { x: 4, y: 3 }, // origin
      { x: 0, y: 0 }, // target
      { x: 0, y: 0 }, // no jitter
      10,
    );
    // Direction: (-4, -3) normalised = (-0.8, -0.6); × speed 10 = (-8, -6).
    expect(b.velocity.x).toBeCloseTo(-8, 6);
    expect(b.velocity.y).toBeCloseTo(-6, 6);
  });

  it("velocity magnitude equals the requested speed", () => {
    const b = spawnEnemyBullet(
      2,
      { x: -3, y: 5 },
      { x: 2, y: -1 },
      { x: 0.1, y: -0.2 },
      12,
    );
    const mag = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y);
    expect(mag).toBeCloseTo(12, 5);
  });

  it("position is set to the origin (bullet spawns AT the shooter)", () => {
    const b = spawnEnemyBullet(
      3,
      { x: -1.5, y: 4.2 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      8,
    );
    expect(b.position).toEqual({ x: -1.5, y: 4.2 });
  });

  it("id and fromPlayer flag are wired correctly (enemy bullet)", () => {
    const b = spawnEnemyBullet(42, { x: 1, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 0 }, 5);
    expect(b.id).toBe(42);
    expect(b.fromPlayer).toBe(false);
  });

  it("falls back to a downward velocity when aim coincides with origin", () => {
    // Degenerate: aim (target + jitter) equals origin ⇒ zero direction vector.
    // Contract: velocity becomes (0, -speed) so we never spawn a stuck bullet.
    const b = spawnEnemyBullet(4, { x: 2, y: -1 }, { x: 3, y: -2 }, { x: -1, y: 1 }, 9);
    expect(b.velocity.x).toBe(0);
    expect(b.velocity.y).toBe(-9);
  });

  it("bullet fired from top-right slot travels DOWN AND LEFT toward the player", () => {
    // Regression guard for the ADR-0064 bug: pre-ADR bullets always fell
    // straight down (velocity.x hard-coded to 0). After: aim toward origin.
    const b = spawnEnemyBullet(
      5,
      { x: 6, y: 4 }, // upper-right window
      { x: 0, y: 0 }, // player at origin
      { x: 0, y: 0 },
      10,
    );
    expect(b.velocity.x).toBeLessThan(0);
    expect(b.velocity.y).toBeLessThan(0);
  });
});

describe("enemyFireSystem.sampleDiscJitter", () => {
  it("returns a sample within the disc for any RNG output in [0, 1)", () => {
    // Sweep the RNG output space; every sample must land inside the disc.
    const values: number[] = [];
    for (let k = 0; k <= 20; k++) values.push(k / 20);
    const rng = scriptedRng(values);
    for (let i = 0; i < 10; i++) {
      const s = sampleDiscJitter(rng, AIM_JITTER_RADIUS);
      const r = Math.sqrt(s.x * s.x + s.y * s.y);
      expect(r).toBeLessThanOrEqual(AIM_JITTER_RADIUS + 1e-9);
    }
  });

  it("returns (0, 0) when the RNG yields 0 (radius factor √0 = 0)", () => {
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

  it("uses √u for the radius (avoids centre clumping)", () => {
    // With u = 0.25, radius factor should be √0.25 = 0.5 (not 0.25).
    // theta = 0 ⇒ point at (radius, 0) = (0.5 * R, 0).
    const rng = scriptedRng([0.25, 0]);
    const s = sampleDiscJitter(rng, 2);
    expect(s.x).toBeCloseTo(1, 6); // 0.5 * 2
    expect(s.y).toBeCloseTo(0, 6);
  });
});
