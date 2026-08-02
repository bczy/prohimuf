/**
 * The determinism kernel of the QTE family (ADR-0034 Rev. 3 motion model, techplan D-H).
 *
 * These two functions were duplicated, byte-identical in body, in `qteSystem.ts` and
 * `bossQteSystem.ts`. The photo set-piece's sway is the THIRD consumer of the same
 * closed-form hashed-waypoint model, so they live here once instead of being forked again —
 * a silent fork of the shared skeleton is exactly what ADR-0077's Consequences hand to the
 * review panel.
 *
 * Both are pure and closed-form: NO `Math.random`, NO `Date.now`, NO per-tick PRNG cursor.
 * That is what makes a replay byte-identical and framerate-independent (F11).
 *
 * Golden vectors: `__tests__/hash.test.ts`. The shipped wander seeds (19940715, 19991232)
 * are pinned there, so a single moved bit reddens this file's own suite as well as the
 * hostage/boss ones.
 */

/** Cheap 32-bit integer hash (FNV-1a mix + avalanche) of three integers → uint32. */
export function hash32(a: number, b: number, c: number): number {
  let h = 2166136261 >>> 0;
  h = Math.imul(h ^ (a >>> 0), 16777619);
  h = Math.imul(h ^ (b >>> 0), 16777619);
  h = Math.imul(h ^ (c >>> 0), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Smoothstep 3u²−2u³ (zero velocity at u=0 and u=1 → the deceleration firing window). */
export function smoothstep(u: number): number {
  return u * u * (3 - 2 * u);
}
