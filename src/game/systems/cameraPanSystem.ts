import type { CameraPan } from "@game/types/cameraPan";

// Exponential damping rate λ (s⁻¹): higher = the flick dies faster.
export const PAN_DAMPING = 4;
// Below this speed (world units/s) the glide snaps to a deterministic rest.
export const PAN_REST_EPSILON = 0.05;

function clampX(x: number, rangeX: number): number {
  return Math.max(-rangeX, Math.min(rangeX, x));
}

export function createCameraPan(): CameraPan {
  return { x: 0, vx: 0 };
}

/** Direct follow while a finger is down; dragging cancels any ongoing glide. */
export function applyDrag(pan: CameraPan, worldDeltaX: number, rangeX: number): CameraPan {
  return { x: clampX(pan.x + worldDeltaX, rangeX), vx: 0 };
}

/** Seed inertia from the flick velocity captured at touch release. */
export function releaseFlick(pan: CameraPan, worldVelocityX: number): CameraPan {
  return { x: pan.x, vx: worldVelocityX };
}

/**
 * Advance the glide one frame. The exponential form `vx' = vx·e^(−λ·dt)` makes
 * the decay independent of frame rate; hitting a level bound kills the
 * velocity so the camera never rubs against the clamp.
 */
export function tickCameraPan(pan: CameraPan, dt: number, rangeX: number): CameraPan {
  if (pan.vx === 0) return pan;
  let vx = pan.vx * Math.exp(-PAN_DAMPING * dt);
  const unclamped = pan.x + vx * dt;
  const x = clampX(unclamped, rangeX);
  if (x !== unclamped || Math.abs(vx) < PAN_REST_EPSILON) vx = 0;
  return { x, vx };
}
