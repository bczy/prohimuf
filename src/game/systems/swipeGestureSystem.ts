/**
 * Pure gesture CLASSIFICATION for the portrait-robot bands (ADR-0081 D2/D2bis). The
 * `tapGestureSystem.ts` precedent, extended: this module knows what a swipe and a drag
 * *are*; it has no opinion on what they *mean*. The mapping to `PortraitIntent` lives in
 * `src/hooks/usePortraitGestures.ts`, and no gesture literal ever crosses into the game's
 * intent vocabulary (ADR-0081 D1).
 *
 * Coordinates are NORMALISED (0..1 of the viewport), never DOM pixels. No React, no DOM.
 *
 * ## The three numbers below are `ux-designer` round-2 tuning, not architecture
 *
 * `SWIPE_MIN_DISTANCE`, `SWIPE_MAX_ANGLE_DEG` and `DRAG_CRAN_DISTANCE` are named
 * constants precisely so round 2 can land its values without touching a structural
 * decision (ADR-0081 D3). The values here are **provisional defaults** that make the
 * gesture usable on both device classes today; changing one is a one-line data edit and
 * the boundary tests below hold at any value.
 */

/** Minimum horizontal travel, normalised, before a swipe counts as intentional. */
export const SWIPE_MIN_DISTANCE = 0.06;

/**
 * Maximum angle off the horizontal, in degrees — the diagonal-ambiguity guard A4-bis
 * asked to *quantify* rather than reject. Beyond it the gesture is a scroll, not a swipe.
 */
export const SWIPE_MAX_ANGLE_DEG = 30;

/** A swipe is terminal and quick; a slower travel is a drag, judged by `accumulateDrag`. */
export const SWIPE_MAX_MS = 600;

/** Normalised travel per cran of a desktop drag (ADR-0081 D2bis, B3). */
export const DRAG_CRAN_DISTANCE = 0.08;

export type SwipeDirection = "left" | "right" | "none";

/**
 * Judge a FINISHED gesture. Total: any non-finite input, any too-short, too-slow or
 * too-diagonal travel is `"none"` — the classifier's job is to be sure, because a
 * misfire is a wrong band under a chrono and a swallowed swipe reads as "the screen
 * froze".
 */
export function classifySwipe(dx: number, dy: number, dtMs: number): SwipeDirection {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dtMs)) return "none";
  if (dtMs < 0 || dtMs > SWIPE_MAX_MS) return "none";
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return "none";
  const angleDeg = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
  if (angleDeg > SWIPE_MAX_ANGLE_DEG) return "none";
  return dx > 0 ? "right" : "left";
}

/** How many whole crans a drag crossed, and the sub-cran remainder to carry forward. */
export interface DragAccumulation {
  readonly crans: number;
  readonly carriedPx: number;
}

/**
 * Fold one pointer-move delta into a carried remainder (ADR-0081 D2bis). A swipe is
 * terminal, a drag is continuous — `classifySwipe` answers a question about a finished
 * gesture and cannot serve here, which is why this is a second function and not a third
 * threshold.
 *
 * Two properties a drag needs and a swipe never did, both pinned by test:
 * - **monotonicity** — dragging out and back returns you to where you started, no drift;
 * - **no frame-rate dependence** — ten small moves and one big move of the same total
 *   travel produce the same cran count.
 *
 * Total: a non-finite delta crosses no cran and leaves the remainder untouched.
 */
export function accumulateDrag(carriedPx: number, deltaPx: number): DragAccumulation {
  const carried = Number.isFinite(carriedPx) ? carriedPx : 0;
  if (!Number.isFinite(deltaPx)) return { crans: 0, carriedPx: carried };
  const total = carried + deltaPx;
  const crans = Math.trunc(total / DRAG_CRAN_DISTANCE);
  return { crans, carriedPx: total - crans * DRAG_CRAN_DISTANCE };
}
