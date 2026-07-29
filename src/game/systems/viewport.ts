import type { Vec2 } from "@game/types/vector";
import { VIEW_W, VIEW_H } from "@game/systems/crosshairSystem";

/**
 * Is a world point inside the camera's visible rectangle?
 *
 * The camera is an axis-aligned window of `viewW × viewH` world units centred on
 * `(cameraOffsetX, cameraOffsetY)` — the same framing `crosshairToWorld` inverts,
 * so aiming and visibility share one definition of "on screen" (no second SoT).
 *
 * The test is on the POINT, not on a sprite's extent: a window slot whose centre
 * is inside the rectangle is on screen even when half its sprite is clipped by
 * the edge. Bounds are inclusive, so a point exactly on the edge counts as
 * visible. NaN coordinates fail both comparisons ⇒ off screen (fail-safe: an
 * enemy at an unknown position never gets to act).
 */
export function isOnScreen(
  point: Vec2,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  viewW = VIEW_W,
  viewH = VIEW_H,
): boolean {
  return (
    Math.abs(point.x - cameraOffsetX) <= viewW / 2 && Math.abs(point.y - cameraOffsetY) <= viewH / 2
  );
}
