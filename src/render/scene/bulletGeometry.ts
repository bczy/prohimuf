import { Vector3 } from "three";

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
// Calibrated with model-viewer.html against the real generated GLB (unscaled
// bbox ~0.517 × 1.888 × 0.518, tall axis = Y) against BULLET_BODY_LENGTH +
// BULLET_CAP_RADIUS = 0.36 tall: 0.36 / 1.888 ≈ 0.19.
export const BULLET_MODEL_SCALE = 0.19;
