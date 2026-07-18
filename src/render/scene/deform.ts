/**
 * Pure, DOM-free, Three-free procedural sprite deformation — the twin of
 * {@link ./flipbook}. Where `flipbookFrame` maps a clock to *which baked frame*,
 * this maps a clock to *how to transform one static plane*: the "procedural mesh
 * deformation" track of the two-track recommendation in
 * `docs/research/research-2d-sprite-animation.md` (§Recommendation, track 1).
 *
 * Two motions are modelled, one per SPIKE element:
 *
 * - {@link recoilTransform}: a one-shot, eased **idle→action→idle** gun kick. At
 *   `elapsed = 0` (and once the kick is spent) it is the identity; it snaps out
 *   fast near the start then eases back to rest — the enemy gun recoil.
 * - {@link wheelAngle}: a looping, monotonic-then-wrapping **rotation angle** in
 *   radians for the courier wheel. Advances linearly with time, wraps every
 *   revolution.
 *
 * Both mirror `flipbookFrame`'s degenerate-input contract: a non-finite / negative
 * clock, non-positive rate, or non-positive duration collapses to the identity
 * (no motion) rather than emitting a NaN transform that would corrupt the mesh.
 *
 * NO React, NO Three, NO DOM — trivially unit-tested, boundary-safe (render lane).
 */

/** Affine transform params applied to a single sprite plane. Angles in radians. */
export interface DeformTransform {
  /** World-unit horizontal offset added to the plane position. */
  offsetX: number;
  /** World-unit vertical offset added to the plane position. */
  offsetY: number;
  /** Rotation about the plane's Z axis, in radians. */
  rotate: number;
  /** Multiplicative horizontal scale (1 = unchanged). */
  scaleX: number;
  /** Multiplicative vertical scale (1 = unchanged). */
  scaleY: number;
}

/** The no-op transform: a fresh object each call so callers may mutate safely. */
export function identityTransform(): DeformTransform {
  return { offsetX: 0, offsetY: 0, rotate: 0, scaleX: 1, scaleY: 1 };
}

/** Tunables for the one-shot recoil kick. All magnitudes are world units / radians. */
export interface RecoilParams {
  /** Full kick+settle duration in seconds; the transform is identity for elapsed ≥ this. */
  duration: number;
  /** Peak horizontal kick magnitude, applied opposite the aim direction. */
  kick: number;
  /** Peak upward jolt (the gun rides up as it fires). */
  lift: number;
  /** Peak backward barrel tilt in radians, signed by aim direction. */
  tilt: number;
  /** Peak vertical squash as a fraction in [0,1] (0 = none). */
  squash: number;
}

// Fraction of the duration at which the kick reaches its peak: fast snap out, slow
// settle back. Kept small so the "action" reads as an instantaneous jolt.
const RECOIL_PEAK = 0.25;

/**
 * Eased 0→1→0 envelope for the recoil. Rises with an ease-out (fast, decelerating)
 * to 1 at `RECOIL_PEAK`, then settles with an ease-in (fast start, slow finish)
 * back to 0 at p = 1. Outside [0,1] it is 0 (the identity pose).
 */
function recoilEnvelope(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  if (p < RECOIL_PEAK) {
    const x = p / RECOIL_PEAK; // 0→1 over the rise
    return 1 - (1 - x) * (1 - x); // ease-out: snap out
  }
  const x = (p - RECOIL_PEAK) / (1 - RECOIL_PEAK); // 0→1 over the settle
  return (1 - x) * (1 - x); // ease-in: recoil settles back to rest
}

/**
 * One-shot eased recoil kick for a gun-firing sprite (idle→action→idle).
 *
 * `elapsed` is time since the shot began (e.g. the per-state anim clock, reset to
 * 0 on entering SHOOTING). `aimDirX` is the horizontal aim sign (≥0 → aims right,
 * kicks left; <0 → aims left, kicks right). Returns the identity when the kick is
 * not active (elapsed 0, spent, or degenerate input).
 */
export function recoilTransform(
  elapsed: number,
  aimDirX: number,
  params: RecoilParams,
): DeformTransform {
  if (!Number.isFinite(elapsed) || elapsed < 0) return identityTransform();
  if (!Number.isFinite(aimDirX)) return identityTransform();
  if (params.duration <= 0) return identityTransform();

  const env = recoilEnvelope(elapsed / params.duration);
  if (env === 0) return identityTransform();

  const dir = aimDirX >= 0 ? 1 : -1;
  return {
    offsetX: -dir * params.kick * env,
    offsetY: params.lift * env,
    rotate: dir * params.tilt * env,
    scaleX: 1,
    scaleY: 1 - params.squash * env,
  };
}

const TAU = Math.PI * 2;

/**
 * Looping wheel rotation angle in radians, monotonic within each revolution then
 * wrapping to [0, 2π). `revsPerSecond` sets the spin rate; `phase` (in revolutions)
 * de-syncs sprites that share a clock. Collapses to 0 (no rotation) for a
 * degenerate clock, non-positive rate, or non-finite phase — matching
 * `flipbookFrame`'s guard on a non-positive fps.
 */
export function wheelAngle(elapsed: number, revsPerSecond: number, phase = 0): number {
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  if (!Number.isFinite(revsPerSecond) || revsPerSecond <= 0) return 0;
  const ph = Number.isFinite(phase) ? phase : 0;
  const revs = elapsed * revsPerSecond + ph;
  const frac = revs - Math.floor(revs); // fractional revolution in [0,1)
  return frac * TAU;
}
