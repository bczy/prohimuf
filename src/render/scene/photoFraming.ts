// Pure PROJECTION maths for the photo set-piece's telephoto surface. DOM-free, no
// React/Three, so the framing is unit-testable without a canvas — same posture as
// `qteCamera.ts` for the hostage duel.
//
// This module maps PLATE space (scene units, authored by `src/game`) onto the drawn
// full-screen frame. It carries NO game rule: it never tests containment, never derives
// a bracket state, never re-evaluates the subject box (techplan D-C/§6 Lane B). It is
// given boxes the tick already produced and returns where to paint them.

import type { Box, PhotoSceneView, PlateExtent } from "@render/ui/photo/photoSeam";

/** A rectangle in the drawn frame's normalised space: origin top-left, y DOWN, 0..1. */
export interface FrameRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * The plate region actually drawn this frame (UX §1.4 / spec §1.2 "View" row):
 * `LOWERED` shows the WHOLE plate (the wide reacquire preview), `RAISED` shows the
 * viewfinder rect the tick computed — sway included, because sway is already inside
 * `view.viewfinder`. The render adds no motion of its own (and no screen shake, spec
 * §6.1), and adds no second reduced-motion branch (techplan §6 Lane B).
 */
export function drawnPlateRegion(view: PhotoSceneView, plate: PlateExtent): Box {
  if (view.posture === "RAISED") return view.viewfinder;
  return { cx: plate.w / 2, cy: plate.h / 2, w: plate.w, h: plate.h };
}

/**
 * Project a plate-space box into the drawn region's normalised frame. Plate space is
 * y-UP (spec §0: `y ∈ [0, 56.25]` bottom→top); the returned rect is y-DOWN, the DOM
 * and texture-UV convention every consumer here uses.
 *
 * Degenerate regions (zero/non-finite extent) return a zero-size rect at the frame
 * centre rather than `NaN`: a NaN width silently drops the element in CSS, which would
 * make a bug invisible exactly where the player is reading the frame.
 */
export function projectBox(box: Box, region: Box): FrameRect {
  if (!(region.w > 0) || !(region.h > 0)) return { x: 0.5, y: 0.5, w: 0, h: 0 };
  const x = (box.cx - box.w / 2 - (region.cx - region.w / 2)) / region.w;
  // y flip: plate-space top edge (cy + h/2) becomes the frame's smallest y.
  const y = (region.cy + region.h / 2 - (box.cy + box.h / 2)) / region.h;
  return { x, y, w: box.w / region.w, h: box.h / region.h };
}

/**
 * UV rect (three.js `Texture.offset`/`repeat` convention, y-UP, origin bottom-left) for
 * the plate texture cropped to the drawn region. `offset` is the region's bottom-left
 * corner as a fraction of the plate; `repeat` its size.
 */
export function plateUvRect(
  region: Box,
  plate: { readonly w: number; readonly h: number },
): {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly repeatX: number;
  readonly repeatY: number;
} {
  if (!(plate.w > 0) || !(plate.h > 0)) {
    return { offsetX: 0, offsetY: 0, repeatX: 1, repeatY: 1 };
  }
  return {
    offsetX: (region.cx - region.w / 2) / plate.w,
    offsetY: (region.cy - region.h / 2) / plate.h,
    repeatX: region.w / plate.w,
    repeatY: region.h / plate.h,
  };
}

/**
 * Corner-bracket arm length, as a fraction of the drawn frame, for an AF frame of
 * normalised size `rect`. The arms are a fixed FRACTION of the bracketed box (a real
 * AF frame's corners scale with the frame), clamped so a very small or very large
 * subject still reads as four corners rather than as a full rectangle or four dots.
 */
export const BRACKET_ARM_FRACTION = 0.28;
export const BRACKET_ARM_MIN = 0.02;
export const BRACKET_ARM_MAX = 0.09;

export function bracketArm(rect: FrameRect): number {
  const raw = Math.min(rect.w, rect.h) * BRACKET_ARM_FRACTION;
  if (!Number.isFinite(raw)) return BRACKET_ARM_MIN;
  return Math.max(BRACKET_ARM_MIN, Math.min(BRACKET_ARM_MAX, raw));
}
