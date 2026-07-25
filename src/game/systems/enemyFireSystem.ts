import type { Vec2 } from "@game/types/vector";

// Aim jitter for enemy return fire. `aimBulletVelocity` (bulletSystem) points a
// bullet exactly at the player, which makes every shot a guaranteed hit unless
// the player pans away. This module offsets the aim point by a small random
// vector so a fair fraction of shots graze or miss — the shooter stays menacing
// without being lethal on sight.
//
// Pure: no React, no Three, no Math.random. The RNG is injected so the state
// machine stays deterministic under Vitest.

// Aim jitter radius (world units). Roughly the diameter of the player-hit disc,
// so an aim point inside the jitter volume can either graze or miss.
export const AIM_JITTER_RADIUS = 1.2;

// Minimal RNG contract: any function returning a uniform value in [0, 1).
export type Rng = () => number;

/**
 * Uniform sample inside a disc of the given radius. Uses inverse-CDF on the
 * radius (√u) to avoid the classic "square-root missing" clumping at the
 * centre. Consumes two `rng` calls per sample (radius, then angle).
 */
export function sampleDiscJitter(rng: Rng, radius: number): Vec2 {
  const r = radius * Math.sqrt(rng());
  const theta = rng() * 2 * Math.PI;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

/**
 * Splitmix32 PRNG seeded from a bullet id and its shooter's enemy id. Same
 * seed pair ⇒ same sequence, so aim jitter is reproducible in tests and
 * independent of frame timing. Folding both ids means two shooters firing on
 * the same tick draw different samples.
 */
export function makeBulletRng(bulletId: number, enemyId: number): Rng {
  let s = (bulletId * 0x9e3779b1 + enemyId * 0x85ebca6b) >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    return z / 0x1_0000_0000;
  };
}
