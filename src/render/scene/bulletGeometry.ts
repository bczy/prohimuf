import { Vector3, type Object3D } from "three";

// Shared procedural-fallback geometry + model-calibration constants for BOTH the
// enemy return-fire bullet (BulletSprite.tsx) and the player's own visual shot
// (ImpactEffects.tsx — ADR-0040 amendment, a render-transient tracer). Both fire
// the exact same physical bullet (public/assets/models/bullet.glb once loaded,
// see bulletModel.ts); centralising the fallback dimensions and MODEL_SCALE
// calibration here keeps the two call sites from drifting apart.

export const BULLET_BODY_LENGTH = 0.28;
export const BULLET_BODY_RADIUS = 0.06;
export const BULLET_CAP_RADIUS = 0.08;

// The cylinderGeometry's principal axis in Three is +Y; FORWARD is the local
// axis each caller rotates FROM onto the bullet's actual travel direction. A
// fresh Vector3 per call — callers must not share/mutate a single cached
// instance across bullet slots.
export function bulletForwardAxis(): Vector3 {
  return new Vector3(0, 1, 0);
}

// Uniform scale applied to a cloned generated-model instance so it reads at
// roughly the same on-screen size as the procedural cylinder+cap it replaces.
// Measured against the shipped GLB (unscaled bbox 0.463 × 0.469 × 1.882) versus
// BULLET_BODY_LENGTH + BULLET_CAP_RADIUS = 0.36 long: 0.36 / 1.882 ≈ 0.19.
export const BULLET_MODEL_SCALE = 0.19;

// The bullet's depth velocity, as a multiple of its in-plane speed. A round flies
// a straight 3D line from its window to the player, so alongside the (vx, vy) the
// game plane tracks it also covers the gap between the facade and the player —
// this is that third leg. It is expressed as a RATIO of the in-plane speed, not
// an absolute world distance, so the resulting direction depends only on the
// bullet's own velocity: fixed at spawn, identical every frame of the flight, and
// unaffected by camera panning.
//
// Every round travels at BULLET_SPEED, so this ratio pins the SAME angle off the
// camera axis for all of them (only the azimuth differs) — the foreshortening is
// uniform across the screen. At 3.0 the round sits ~18° off dead-on: seen
// essentially nose-first, but with just enough body showing to read as a bullet
// rather than a featureless disc.
export const BULLET_DEPTH_RATIO = 3.0;

// The shipped GLB's long axis is +Z, NOT the +Y of `bulletForwardAxis()` (the
// procedural cylinder's axis). Left uncorrected, a clone points into the screen
// depth and an orthographic camera renders it end-on — the bug that made the
// generated bullet read as a ~12px dot instead of a projectile. Every clone must
// be aligned once, at attach time, so both meshes share the +Y convention and the
// per-frame travel-direction quaternion applies identically to either.
export function alignGeneratedBulletModel(clone: Object3D): void {
  clone.rotation.x = -Math.PI / 2;
}

// Depth + draw order for EVERY bullet in the game — the enemy's return fire, the
// player's own shot and the QTE captor/accomplice round all read as the same
// physical object, so they share one depth convention rather than three.
//
// The whole street stack sits at z 0.5..0.7 and renderOrder 4..5.75 (kerb rows,
// facade ironwork, delivery van, courier — see STREET_DEPTH in streetDepth.ts),
// and the boss-QTE effects at renderOrder 20. At the old z 0.5 an
// incoming round was drawn BEHIND balcony railings and shutters — exactly
// backwards for the one object flying at the player's face. z 8 wins the depth
// test against every world object; the renderOrder wins the transparent-draw
// ordering too. Only the camera-attached hit flash stays in front.
export const BULLET_Z = 8;
export const BULLET_RENDER_ORDER = 4096;

/**
 * Clone the shared generated bullet model and parent it to `group`, applying the
 * three corrections every call site needs: the +Z→+Y axis alignment, the
 * calibration scale, and the scene-wide renderOrder (which is per-Object3D in
 * Three and therefore NOT inherited from the parent group — it must be stamped
 * across the whole subtree).
 *
 * Returns the clone so a caller can keep its own handle on it.
 */
export function attachBulletModel(group: Object3D, model: Object3D): Object3D {
  const clone = model.clone(true);
  alignGeneratedBulletModel(clone);
  clone.scale.setScalar(BULLET_MODEL_SCALE);
  clone.traverse((o) => {
    o.renderOrder = BULLET_RENDER_ORDER;
  });
  group.add(clone);
  return clone;
}
