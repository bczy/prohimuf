/**
 * Facade intra-panel stretch geometry (ADR-0028 cycle 3 — render-side stretch
 * parity). Each facade panel image is drawn wider than its nominal panel width
 * so neighbouring panels overlap and crossfade at the seam. The railing overlay
 * and the enemy slots must follow that exact stretch, or they drift up to
 * `BLEND/2 = 4%` of a panel width toward the panel edges (perfect at centre,
 * worst at the edges). This module is the single source of truth for the
 * stretch factor and the world-X remap used by `LevelBackdrop`,
 * `ForegroundFrames` and `GameScene`.
 */

/**
 * Seam-crossfade overlap: adjacent facade panels overlap by this fraction of a
 * panel, and the front panel's left edge is alpha-feathered, so each join
 * crossfades away instead of showing a hard vertical line.
 */
export const BLEND = 0.08;

/** Horizontal scale each facade panel image is drawn at, about its panel centre. */
export const FACADE_DRAW_SCALE = 1 + BLEND;

/**
 * World X of the centre of the panel that `worldX` falls in. Panels tile
 * horizontally, centred on the origin, so panel `p` sits at
 * `(p − (panels−1)/2)·panelW`; the panel index is recovered geometrically from
 * `worldX` (nominal, exact-pitch classification).
 */
function panelCentreX(worldX: number, panelW: number, panels: number): number {
  const globalXNorm = worldX / (panelW * panels) + 0.5;
  const p = Math.floor(globalXNorm * panels);
  return (p - (panels - 1) / 2) * panelW;
}

/**
 * Stretch an exact-pitch world X out to the facade-image draw position: scale
 * its offset from its panel centre by {@link FACADE_DRAW_SCALE}. This realigns a
 * slot centre (or a per-panel local point) with the stretched facade image.
 * Exact inverse of {@link invertFacadeStretchX}.
 */
export function applyFacadeStretchX(worldX: number, panelW: number, panels: number): number {
  const centre = panelCentreX(worldX, panelW, panels);
  return centre + (worldX - centre) * FACADE_DRAW_SCALE;
}

/**
 * Undo {@link applyFacadeStretchX}: recover the exact-pitch world X from a
 * stretched (facade-image) world X, by unscaling its offset from its panel
 * centre. Exact inverse of {@link applyFacadeStretchX}.
 */
export function invertFacadeStretchX(worldX: number, panelW: number, panels: number): number {
  const centre = panelCentreX(worldX, panelW, panels);
  return centre + (worldX - centre) / FACADE_DRAW_SCALE;
}
