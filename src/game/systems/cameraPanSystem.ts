import type { CameraPan } from "@game/types/cameraPan";

// Exponential damping rate λ (s⁻¹): higher = the flick dies faster.
export const PAN_DAMPING = 4;
// Below this speed (world units/s) the glide snaps to a deterministic rest.
export const PAN_REST_EPSILON = 0.05;

function clampAxis(v: number, range: number): number {
  return Math.max(-range, Math.min(range, v));
}

export function createCameraPan(): CameraPan {
  return { x: 0, y: 0, vx: 0, vy: 0 };
}

/** Direct follow while a finger is down; dragging cancels any ongoing glide. */
export function applyDrag(
  pan: CameraPan,
  worldDelta: { x: number; y: number },
  range: { x: number; y: number },
): CameraPan {
  return {
    x: clampAxis(pan.x + worldDelta.x, range.x),
    y: clampAxis(pan.y + worldDelta.y, range.y),
    vx: 0,
    vy: 0,
  };
}

/** Seed inertia from the flick velocity captured at touch release. */
export function releaseFlick(pan: CameraPan, worldVelocity: { x: number; y: number }): CameraPan {
  return { x: pan.x, y: pan.y, vx: worldVelocity.x, vy: worldVelocity.y };
}

/**
 * Advance the glide one frame. The exponential form `v' = v·e^(−λ·dt)` makes
 * the decay independent of frame rate; hitting a level bound kills ONLY that
 * axis's velocity so the camera never rubs against the clamp while the other
 * axis keeps gliding freely.
 */
export function tickCameraPan(
  pan: CameraPan,
  dt: number,
  range: { x: number; y: number },
): CameraPan {
  if (pan.vx === 0 && pan.vy === 0) return pan;
  const decay = Math.exp(-PAN_DAMPING * dt);

  let vx = pan.vx * decay;
  const unclampedX = pan.x + vx * dt;
  const x = clampAxis(unclampedX, range.x);
  if (x !== unclampedX || Math.abs(vx) < PAN_REST_EPSILON) vx = 0;

  let vy = pan.vy * decay;
  const unclampedY = pan.y + vy * dt;
  const y = clampAxis(unclampedY, range.y);
  if (y !== unclampedY || Math.abs(vy) < PAN_REST_EPSILON) vy = 0;

  return { x, y, vx, vy };
}
