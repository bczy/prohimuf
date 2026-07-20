// Pure camera maths for the hostage-taker QTE zoom (ADR-0030). DOM-free, no
// React/Three: the QTE cinematic camera "feel" (progressive zoom-in onto the
// captor, then a smooth restore to the pre-QTE framing) lives here so it is
// unit-testable without a canvas. The render bridge (`useGameLoop`) reads the
// game's QTE phase/timers and drives the orthographic camera from these helpers.

import { clamp01 } from "./hostageCue";
import type { QtePhase } from "@game/types/hostageQte";
import type { BossQtePhase } from "@game/types/bossQte";

/**
 * How much closer the camera pushes at full zoom, relative to the pre-QTE zoom.
 * A NEW render-only constant (the game owns no camera values): ~2.4× frames the
 * captor + hostage composite tightly while keeping both gauges readable.
 */
export const QTE_ZOOM_FACTOR = 2.4;

/**
 * Mobile boss-zoom framing LIFT (world units, POSITIVE) — senior-architect ruling §21. On mobile
 * the effective boss zoom (`MOBILE_ZOOM_FACTOR × QTE_ZOOM_FACTOR`) maps the vital band (anchor.y +
 * ~0.8 ± wander) to more screen px, so the boss head rides up UNDER the fixed-CSS-footprint
 * `BossHpBar` (a DOM overlay that cannot be drawn under). The bridge (`useGameLoop`) applies this
 * as a positive lift of the camera TARGET above the boss anchor (boss-only, mobile-only) so the
 * whole tableau drops on screen and the vital band clears the bar's bottom edge. NOT a zoom bump
 * (that pushes the head further up). Coupled to the bar's fixed footprint (`BossHpBar.module.css`
 * `top:58px` + height); revisit if `MOBILE_ZOOM_FACTOR`, the bar's `top`, or the anchor moves.
 * Magnitude calibrated on real 844×390 captures: enough that the full vital band clears the bar
 * with margin, bounded so the limb ring / lower body stay on the short mobile-landscape frame.
 */
export const BOSS_MOBILE_FRAME_LIFT = 0.7;

/** Seconds the camera takes to ease back to its pre-QTE framing once the QTE ends. */
export const QTE_RESTORE_SECONDS = 0.6;

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
  phase: QtePhase | BossQtePhase,
  zoomRemaining: number,
  zoomSeconds: number,
): number {
  if (phase === "ZOOMING") {
    const raw = zoomSeconds > 0 ? 1 - zoomRemaining / zoomSeconds : 1;
    return qteEase(raw);
  }
  if (phase === "ACTIVE" || phase === "FINISHER" || phase === "WON" || phase === "LOST") return 1;
  return 0;
}

/**
 * The camera pose at zoom-in progress `p` (0 = pre-QTE `base`, 1 = fully zoomed
 * onto the STATIC `anchor` at `base.zoom × QTE_ZOOM_FACTOR`). `p` is expected
 * pre-eased (see `qteZoomInProgress`); this is a plain lerp so the endpoints are
 * exact. The captor never moves (the static duel), so the target is the fixed
 * `qte.anchor` — the camera zooms in and HOLDS (ADR-0030, no follow).
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
