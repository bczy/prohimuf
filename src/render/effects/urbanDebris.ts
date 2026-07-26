/**
 * Pure, DOM-free motion model for the street's blowing debris (papiers, feuilles,
 * rebuts) — the sprite half of the "mouvement urbain" ambience.
 *
 * Every item carries its OWN clock, direction, speed, bob and spin, drawn once at
 * construction from an injected RNG: the brief's « chaque item a timing/vitesse/
 * direction aléatoire indépendant ». Nothing here is shared or phase-locked, so a
 * street never reads as a marching formation.
 *
 * Purely presentational: it drives no entity, is never a target, and reads no game
 * state. It is a pure step function so the wrap/bounds invariants unit-test without
 * a browser — same contract as `deform.ts` and `nearParallax.ts`.
 */

/** Number of debris silhouettes available (paper scrap, leaf). */
export const DEBRIS_KINDS = 2;

/**
 * Debris baseline, facade-normalized and y-down. The band has to clear TWO bounds:
 *
 *  - BELOW: the camera can never look lower than `-facadeH/2`. `GameScene` clamps
 *    the pan to `rangeY = (facadeH - viewH)/2`, so the lowest world y ever framed is
 *    `-rangeY - viewH/2 = -facadeH/2` — for `WORLD_HEIGHT = 12`, y = -6. The first
 *    cut used 1.02 ⇒ baseline -6.24, items in [-6.39, -5.89]: the whole band sat
 *    under that floor and was invisible on stalingrad (only belliard saw fragments,
 *    and only at full bottom pan, because its 0.85 dezoom widens the view past the
 *    facade). Reviewer finding, 2026-07-25.
 *  - ABOVE: it must stay under the actors. The couriers ride at `-facadeH*0.4`
 *    (y = -4.8); this band tops out well below that.
 */
export const DEBRIS_LINE = 0.965;
/** Per-item vertical scatter around the baseline (world units). */
export const DEBRIS_SPAWN_DY_MIN = -0.15;
export const DEBRIS_SPAWN_DY_MAX = 0.35;
/** Bob amplitude bounds (world units) — the drawn y never leaves `y ± bobAmp`. */
export const DEBRIS_BOB_AMP_MIN = 0.04;
export const DEBRIS_BOB_AMP_MAX = 0.22;

/** World y of the debris baseline for a facade of height `facadeH`. */
export function debrisBaselineY(facadeH: number): number {
  return (0.5 - DEBRIS_LINE) * facadeH;
}

/**
 * The extreme world-y a debris item can ever occupy — baseline scatter plus the
 * widest bob. `bottom` is what must stay above the camera's `-facadeH/2` floor.
 */
export function debrisBandExtent(facadeH: number): {
  readonly top: number;
  readonly bottom: number;
} {
  const base = debrisBaselineY(facadeH);
  return {
    top: base + DEBRIS_SPAWN_DY_MAX + DEBRIS_BOB_AMP_MAX,
    bottom: base + DEBRIS_SPAWN_DY_MIN - DEBRIS_BOB_AMP_MAX,
  };
}

export interface DebrisItem {
  /** World position. `x` scrolls and wraps; `y` is the item's BASELINE (the bob
   *  is applied on read, see {@link debrisY}, so it never accumulates drift). */
  readonly x: number;
  readonly y: number;
  /** World units per second along x. Sign carries the item's travel direction. */
  readonly vx: number;
  /** Vertical bob: amplitude (world), frequency (Hz) and an independent phase. */
  readonly bobAmp: number;
  readonly bobHz: number;
  readonly bobPhase: number;
  /** Tumble, radians per second, and the accumulated angle. */
  readonly spin: number;
  readonly rot: number;
  /** The item's own elapsed clock, seconds. */
  readonly t: number;
  /** World size of the sprite quad. */
  readonly size: number;
  /** Which silhouette to draw, `0..DEBRIS_KINDS-1`. */
  readonly kind: number;
}

/** Frame-time ceiling: a stalled/2 fps sandbox frame must not teleport the field. */
const MAX_STEP = 0.1;

/**
 * Build one item with fully independent parameters.
 *
 * @param rand      RNG in `[0,1)` — injected so tests are deterministic (and so the
 *                  caller decides whether the field is seeded or `Math.random`).
 * @param halfWidth Half the street width; the item is scattered across it.
 * @param baseY     Baseline world Y for the row this item belongs to.
 */
export function makeDebris(rand: () => number, halfWidth: number, baseY: number): DebrisItem {
  const between = (a: number, b: number): number => a + rand() * (b - a);
  // Direction is its own coin flip, so items cross each other rather than stream.
  const dir = rand() < 0.5 ? -1 : 1;
  return {
    x: between(-halfWidth, halfWidth),
    y: baseY + between(DEBRIS_SPAWN_DY_MIN, DEBRIS_SPAWN_DY_MAX),
    vx: dir * between(0.5, 2.1),
    bobAmp: between(DEBRIS_BOB_AMP_MIN, DEBRIS_BOB_AMP_MAX),
    bobHz: between(0.35, 1.4),
    bobPhase: rand(),
    spin: between(-2.4, 2.4),
    rot: between(0, Math.PI * 2),
    t: between(0, 10), // staggered start so the field never pulses in unison
    size: between(0.16, 0.34),
    kind: Math.min(DEBRIS_KINDS - 1, Math.floor(rand() * DEBRIS_KINDS)),
  };
}

/**
 * Advance one item by `dt` seconds, wrapping it around the street.
 *
 * @param halfWidth Wrap boundary: an item leaving one edge re-enters at the other,
 *                  so the on-screen population is constant and no item is ever lost.
 * @returns A new item; the input is never mutated.
 */
export function stepDebris(item: DebrisItem, dt: number, halfWidth: number): DebrisItem {
  const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, MAX_STEP) : 0;
  if (step === 0) return item;
  const span = halfWidth > 0 ? halfWidth * 2 : 0;
  let x = item.x + item.vx * step;
  if (span > 0) {
    // Modulo-based wrap: correct even if one step overshoots the whole street.
    x = (((x + halfWidth) % span) + span) % span;
    x -= halfWidth;
  }
  return { ...item, x, rot: item.rot + item.spin * step, t: item.t + step };
}

/** The item's DRAWN y: baseline plus its own bob. Bounded by `y ± bobAmp`. */
export function debrisY(item: DebrisItem): number {
  return item.y + Math.sin((item.bobHz * item.t + item.bobPhase) * Math.PI * 2) * item.bobAmp;
}
