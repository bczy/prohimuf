import type { CameraPan } from "@game/types/cameraPan";

// Exponential damping rate λ (s⁻¹): higher = the flick dies faster.
export const PAN_DAMPING = 4;
// Below this speed (world units/s) the glide snaps to a deterministic rest.
export const PAN_REST_EPSILON = 0.05;

function clampAxis(v: number, range: number): number {
  return Math.max(-range, Math.min(range, v));
}

/**
 * One axis of the exponential glide shared by `tickCameraPan` and the released
 * axes of `driveEdgeScroll`. `v' = v·e^(−λ·dt)` keeps decay frame-rate
 * independent; hitting the clamp OR dropping below the rest epsilon zeroes this
 * axis's velocity so it settles deterministically without rubbing the bound.
 */
function glideAxis(p: number, v: number, dt: number, range: number): { p: number; v: number } {
  let vel = v * Math.exp(-PAN_DAMPING * dt);
  const unclamped = p + vel * dt;
  const clamped = clampAxis(unclamped, range);
  if (clamped !== unclamped || Math.abs(vel) < PAN_REST_EPSILON) vel = 0;
  return { p: clamped, v: vel };
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
  const x = glideAxis(pan.x, pan.vx, dt, range.x);
  const y = glideAxis(pan.y, pan.vy, dt, range.y);
  return { x: x.p, y: y.p, vx: x.v, vy: y.v };
}

/**
 * Normalised edge-scroll intent for one axis. `pos` is the pointer position in [0,1]
 * (0 = left/top edge). Returns 0 outside the edge zones; inside a zone the magnitude
 * ramps linearly from 0 at the inner boundary to 1 at the screen edge. Sign: negative
 * in the pos < edgeZone zone, positive in the pos > 1 - edgeZone zone. Result clamped
 * to [-1, 1] (pos may land exactly on 0/1 or slightly outside from clamped input).
 */
export function edgeScrollRamp(pos: number, edgeZone: number): number {
  if (pos < edgeZone) return clampAxis((pos - edgeZone) / edgeZone, 1);
  if (pos > 1 - edgeZone) return clampAxis((pos - (1 - edgeZone)) / edgeZone, 1);
  return 0;
}

/** Direct edge-scroll control for one axis: velocity is the raw ramp intent scaled
 * to `maxSpeed`, kept as-is even at the clamp so releasing the edge glides from the
 * current speed; only the integrated position is bounded to ±range. */
function driveAxis(
  p: number,
  ramp: number,
  maxSpeed: number,
  dt: number,
  range: number,
): { p: number; v: number } {
  const v = ramp * maxSpeed;
  return { p: clampAxis(p + v * dt, range), v };
}

/**
 * Advance a CameraPan one frame from a per-axis ramp intent (each in [-1,1], from
 * edgeScrollRamp). Axis with ramp !== 0: direct control — velocity = ramp * maxSpeed,
 * position integrates by dt and clamps to ±range (velocity is KEPT so releasing the
 * edge glides from the current speed). Axis with ramp === 0: glide exactly like
 * tickCameraPan (exponential decay with PAN_DAMPING, PAN_REST_EPSILON snap-to-rest,
 * hitting the clamp kills only that axis's velocity). Axes are independent.
 *
 * At full rest (no intent, no velocity, position within ±range) the same pan
 * object is returned, like tickCameraPan: the caller runs this every rendered
 * frame and the dominant state (pointer mid-screen, camera still) must not
 * allocate. A rest position pushed out of bounds by a range change (resize)
 * fails the in-range check and re-clamps through the glide branch.
 */
export function driveEdgeScroll(
  pan: CameraPan,
  ramp: { x: number; y: number },
  maxSpeed: number,
  dt: number,
  range: { x: number; y: number },
): CameraPan {
  if (
    ramp.x === 0 &&
    ramp.y === 0 &&
    pan.vx === 0 &&
    pan.vy === 0 &&
    Math.abs(pan.x) <= range.x &&
    Math.abs(pan.y) <= range.y
  ) {
    return pan;
  }
  const x =
    ramp.x !== 0
      ? driveAxis(pan.x, ramp.x, maxSpeed, dt, range.x)
      : glideAxis(pan.x, pan.vx, dt, range.x);
  const y =
    ramp.y !== 0
      ? driveAxis(pan.y, ramp.y, maxSpeed, dt, range.y)
      : glideAxis(pan.y, pan.vy, dt, range.y);
  return { x: x.p, y: y.p, vx: x.v, vy: y.v };
}
