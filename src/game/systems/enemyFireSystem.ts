import type { Bullet } from "@game/types/bullet";
import type { Vec2 } from "@game/types/vector";

// ADR-0064 — Enemy return fire becomes directional. This module owns the two
// pure primitives the state machine calls when an enemy enters the SHOOTING
// state:
//
//   - spawnEnemyBullet(...)  — build a Bullet whose velocity points from the
//     shooter toward (target + jitter), scaled by speed. The bullet visibly
//     travels FROM the enemy TOWARD the player, not straight down.
//   - sampleDiscJitter(rng, radius) — uniform 2D sample inside a disc of the
//     given radius, used to add "relative accuracy" to the aim (a fraction of
//     shots miss the player-hit centre so the game stays fair).
//
// Both are pure — no React, no Three, no Math.random. The RNG is injected so
// tests are deterministic.

// Default aim jitter radius (world units). Roughly the diameter of the
// player-hit disc, so aim inside the jitter volume can either graze or miss —
// keeps the shooter menacing without being a guaranteed kill.
export const AIM_JITTER_RADIUS = 1.2;

// Minimal RNG contract: any function returning a uniform value in [0, 1). The
// game passes an existing seeded PRNG; tests pass a scripted sequence.
export type Rng = () => number;

/**
 * Uniform sample inside a disc of the given radius, using inverse-CDF on the
 * radius (√u) to avoid the classic "square-root missing" clumping at the
 * centre. Two calls to `rng` per sample.
 */
export function sampleDiscJitter(rng: Rng, radius: number): Vec2 {
  const r = radius * Math.sqrt(rng());
  const theta = rng() * 2 * Math.PI;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

/**
 * Build a Bullet whose velocity is a unit vector from `origin` to
 * `target + jitter`, scaled by `speed`. The jitter is caller-provided so the
 * function stays pure; callers usually get it from `sampleDiscJitter`.
 *
 * Degenerate cases: if the aim point coincides with the origin (zero vector),
 * we fall back to the legacy downward velocity so a stuck bullet never spawns.
 */
export function spawnEnemyBullet(
  id: number,
  origin: Vec2,
  target: Vec2,
  jitter: Vec2,
  speed: number,
): Bullet {
  const aimX = target.x + jitter.x;
  const aimY = target.y + jitter.y;
  const dx = aimX - origin.x;
  const dy = aimY - origin.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const vx = len > 0 ? (dx / len) * speed : 0;
  const vy = len > 0 ? (dy / len) * speed : -speed;
  return {
    id,
    position: { x: origin.x, y: origin.y },
    velocity: { x: vx, y: vy },
    fromPlayer: false,
  };
}
