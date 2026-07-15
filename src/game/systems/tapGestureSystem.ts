/**
 * Pure input-interpretation rules for mobile touch taps (the shoot gestures). No DOM, no
 * React — `useTouchControls` (the bridge) feeds raw touch timing/positions through these to
 * decide what fires. A one-finger double-tap is a second shoot input beside the two-finger
 * tap: two short, still taps close in time AND space fire one shot at the second tap's point.
 */

/** A touch counts as a tap (never a drag/pan) only if it is short (≤ ms) and still (≤ drift). */
export const TAP_MAX_MS = 300;
export const TAP_MAX_DRIFT = 0.03;
/** Two one-finger taps pair into a double-tap only if close in time AND normalized distance. */
export const DOUBLE_TAP_MAX_GAP_MS = 300;
export const DOUBLE_TAP_MAX_DIST = 0.12;

/** A completed one-finger touch reduced to when and where it lifted (normalized coords). */
export interface Tap {
  readonly t: number;
  readonly x: number;
  readonly y: number;
}

/** A one-finger touch fires nothing unless it was short and still — otherwise it's a drag. */
export function isTapGesture(durationMs: number, drift: number): boolean {
  return durationMs <= TAP_MAX_MS && drift <= TAP_MAX_DRIFT;
}

/** True when `current` pairs with `prev` into a double-tap — close in time AND space. */
export function isDoubleTap(prev: Tap | null, current: Tap): boolean {
  if (prev === null) return false;
  return (
    current.t - prev.t <= DOUBLE_TAP_MAX_GAP_MS &&
    Math.hypot(current.x - prev.x, current.y - prev.y) <= DOUBLE_TAP_MAX_DIST
  );
}
