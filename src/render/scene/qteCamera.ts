// Pure camera maths for the hostage-taker QTE zoom (ADR-0030). DOM-free, no
// React/Three: the QTE cinematic camera "feel" (progressive zoom-in onto the
// captor, then a smooth restore to the pre-QTE framing) lives here so it is
// unit-testable without a canvas. The render bridge (`useGameLoop`) reads the
// game's QTE phase/timers and drives the orthographic camera from these helpers.

import { clamp01 } from "./hostageCue";
import type { QtePhase } from "@game/types/hostageQte";

/**
 * How much closer the camera pushes at full zoom, relative to the pre-QTE zoom.
 * A NEW render-only constant (the game owns no camera values): ~2.4× frames the
 * captor + hostage composite tightly while keeping both gauges readable.
 */
export const QTE_ZOOM_FACTOR = 2.4;

/** Seconds the camera takes to ease back to its pre-QTE framing once the QTE ends. */
export const QTE_RESTORE_SECONDS = 0.6;

/**
 * Fraction of the captor→door gap the follow camera LEADS by (ADR-0034 D1, UX
 * spec D1.4): the diegetic clock only reads if the porte-cochère stays in frame
 * beside the retreating captor, so the framing point is nudged off the captor
 * toward the door — enough to keep the goal line on-screen without de-centring
 * the captor the player is aiming at.
 */
export const QTE_DOOR_LEAD = 0.35;

/**
 * World-unit cap on that lead so a distant door at the start of the retreat can
 * never push the captor to the frame edge. The door slides fully into view as
 * the captor closes the gap (the lead is a fraction of a shrinking distance).
 */
export const QTE_DOOR_LEAD_MAX = 1.4;

/** An orthographic-camera pose: zoom + centre (world x/y). */
export interface CamPose {
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
}

/** Smoothstep ease on [0,1]: flat at both ends, monotonic in between. */
export function qteEase(t: number): number {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Zoom-in progress in [0,1] for the current QTE phase: eased 0→1 across the
 * ZOOMING window (from `zoomRemaining`/`zoomSeconds`), then pinned at 1 for the
 * ACTIVE / WON / LOST phases (fully zoomed while the player shoots and the result
 * holds). Any other phase reads 0 (not zoomed).
 */
export function qteZoomInProgress(
  phase: QtePhase,
  zoomRemaining: number,
  zoomSeconds: number,
): number {
  if (phase === "ZOOMING") {
    const raw = zoomSeconds > 0 ? 1 - zoomRemaining / zoomSeconds : 1;
    return qteEase(raw);
  }
  if (phase === "ACTIVE" || phase === "WON" || phase === "LOST") return 1;
  return 0;
}

/**
 * The camera pose at zoom-in progress `p` (0 = pre-QTE `base`, 1 = fully zoomed
 * onto `anchor` at `base.zoom × QTE_ZOOM_FACTOR`). `p` is expected pre-eased (see
 * `qteZoomInProgress`); this is a plain lerp so the endpoints are exact.
 */
export function qtePose(base: CamPose, anchor: { x: number; y: number }, p: number): CamPose {
  const k = clamp01(p);
  return {
    zoom: lerp(base.zoom, base.zoom * QTE_ZOOM_FACTOR, k),
    x: lerp(base.x, anchor.x, k),
    y: lerp(base.y, anchor.y, k),
  };
}

/**
 * The world point the follow camera frames during the QTE (ADR-0034 D1): the
 * live captor `anchor` nudged toward the `porteCochere` by `QTE_DOOR_LEAD` of
 * the gap, capped at `QTE_DOOR_LEAD_MAX` world units per axis, so BOTH the
 * moving captor and the goal line stay legible as the tableau retreats. Feed the
 * result as the `qtePose` target (base→here across the zoom; pinned here while
 * ACTIVE), so the camera tracks the anchor for free and the door never leaves
 * frame. Pure: the render bridge applies it, this only computes the point.
 */
export function qteFollowTarget(
  anchor: { x: number; y: number },
  porteCochere: { x: number; y: number },
): { x: number; y: number } {
  const lead = (from: number, to: number): number => {
    const nudge = (to - from) * QTE_DOOR_LEAD;
    const capped = Math.max(-QTE_DOOR_LEAD_MAX, Math.min(QTE_DOOR_LEAD_MAX, nudge));
    return from + capped;
  };
  return { x: lead(anchor.x, porteCochere.x), y: lead(anchor.y, porteCochere.y) };
}

/**
 * The camera pose while easing back from the zoomed `from` pose to the pre-QTE
 * `base` over restore progress `p` (0 = `from`, 1 = `base`). Eased so the restore
 * decelerates into the resumed scene. At `p >= 1` it returns `base` exactly.
 */
export function qteRestorePose(from: CamPose, base: CamPose, p: number): CamPose {
  const k = qteEase(p);
  return {
    zoom: lerp(from.zoom, base.zoom, k),
    x: lerp(from.x, base.x, k),
    y: lerp(from.y, base.y, k),
  };
}
