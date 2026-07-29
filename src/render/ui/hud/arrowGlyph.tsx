import type { JSX } from "react";
import { INK, ACID } from "@render/ui/print";

/**
 * The HUD's off-screen arrow SHAPE — the shared glyph token (ADR-0046 discipline):
 * flat acid-yellow fill, ink-black keyline, zero blur/glow/shadow. A CSS triangle
 * can't take an outline, and these arrows need the keyline to read over the 3D scene.
 *
 * Deliberately carries the shape ONLY. Size, rotation, opacity, anchoring and any
 * motion stay with each consumer, so the two cues that use it (the nearest-enemy
 * aim-assist ring `OffscreenArrowIndicator`, and the delivery direction cue on
 * `DeliveryIntegrityBanner`) cannot inherit each other's behaviour — the delivery
 * cue is motionless by requirement (telegraph spec D3.3/A9, correction T-4) while
 * the ring keeps its shipped 120 ms opacity/scale fade.
 *
 * `width`/`height` 100%: the consumer's box is the single owner of the rendered
 * size; the viewBox scales the glyph to fill it. `display: block` — an inline svg
 * sits on the text baseline and drifts off the span's geometric centre, which is
 * also the rotation origin. `non-scaling-stroke`: strokeWidth is device px, so the
 * keyline holds the HUD's 2px ink-rule weight at every render size.
 */
export function ArrowGlyphSvg(): JSX.Element {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 34 34"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polygon
        points="3,13 18,13 18,7 31,17 18,27 18,21 3,21"
        fill={ACID.yellow}
        stroke={INK.black}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rotation that points the glyph (drawn pointing right) at each of the four bearings. */
export const ARROW_ROTATION = {
  right: "rotate(0deg)",
  down: "rotate(90deg)",
  left: "rotate(180deg)",
  up: "rotate(270deg)",
} as const;
