// Pure, Three-free helpers for the near-foreground parallax layer (ADR-0047).
// Co-located with a vitest spec, mirroring the deriveCrtParams / markRing
// precedent, so the two load-bearing invariants — reduced-motion clamping the
// layer to the facade (S = 1×), and the bottom band staying below the lowest
// window row (non-occlusion by construction) — are locked in-PR without a live
// R3F scene. The reduced-motion signal is threaded into NearForeground.tsx as a
// prop (the shared union from useReducedMotionRoot, ADR-0052 §3), exactly as
// CrtPass.tsx keeps the OS read out of deriveCrtParams.

import { WORLD_HEIGHT, type WindowZone } from "@game/levels/levelArt";

// Clearance below the lowest window's bottom edge, in facade-normalized units
// (y-down), before the near-foreground band may begin. Spec D1.2/AC1 gates this
// clearance at 0.8 world-units; normalized against the facade height it is
// 0.8 / WORLD_HEIGHT (≈ 0.0667). The one gap constant; everything else is
// derived from the level's own window zones.
export const NEAR_BAND_MARGIN = 0.8 / WORLD_HEIGHT;

// Mobile parallax cap (UX D9.4): the on-screen differential amplitude on mobile
// must stay ≤ 0.7× the desktop amount. Applied multiplicatively to the engine
// factor so e.g. Stalingrad's -0.24 becomes -0.168 (< 0.7 × 0.30 = 0.21).
export const MOBILE_PARALLAX_SCALE = 0.7;

// Fallback band top when a level declares no window zones (degenerate — the
// layer only mounts for levels that carry both zones and a nearForeground). Kept
// in the lower half so a stray render still confines the props to the bottom.
const NEAR_BAND_FALLBACK_TOP = 0.6;

/**
 * The engine parallax factor actually applied to the layer group this frame.
 * Mirrors {@link deriveCrtParams}'s reduced-motion gate: a
 * `prefers-reduced-motion` viewer gets `0` (the layer tracks the facade, on-screen
 * speed S = 1×, so it stays visible with the composition unchanged — UX D2);
 * otherwise the (already core-clamped, negative) factor passes through, scaled by
 * {@link MOBILE_PARALLAX_SCALE} on mobile to honour the ≤ 0.7× cap (UX D9.4).
 */
export function deriveNearParallaxFactor(
  factor: number,
  reducedMotion: boolean,
  isMobile = false,
): number {
  if (reducedMotion) return 0;
  return isMobile ? factor * MOBILE_PARALLAX_SCALE : factor;
}

/**
 * Top edge (facade-normalized, y-down) of the near-foreground bottom band: the
 * lowest window's bottom edge (`max(y + h/2)`) plus {@link NEAR_BAND_MARGIN}.
 * Every object plane's top must sit at or below this line, which — because the
 * value is strictly under every window row — makes non-occlusion of the
 * windows/cops provable rather than tuned. Degenerate (no zones) ⇒ a safe
 * lower-half fallback.
 */
export function nearForegroundBandTop(zones: readonly WindowZone[]): number {
  if (zones.length === 0) return NEAR_BAND_FALLBACK_TOP;
  let lowestBottom = Number.NEGATIVE_INFINITY;
  for (const z of zones) {
    const bottom = z.y + z.h / 2;
    if (bottom > lowestBottom) lowestBottom = bottom;
  }
  return lowestBottom + NEAR_BAND_MARGIN;
}
