/**
 * Facade intra-panel stretch geometry (ADR-0028 cycle 3 — render-side stretch
 * parity). Each facade panel image is drawn wider than its nominal panel width
 * so neighbouring panels overlap and crossfade at the seam. The railing overlay
 * and the enemy slots must follow that exact stretch, or they drift up to
 * `BLEND/2 = 4%` of a panel width toward the panel edges (perfect at centre,
 * worst at the edges). This module is the single source of truth for the
 * stretch factor and the world-X remap used by `LevelBackdrop`,
 * `ForegroundFrames` and `GameScene`.
 *
 * ADR-0048 generalizes this to a per-tile stretch: {@link stretchAboutCentre}
 * scales a world X about ANY tile centre by ANY draw-scale, so the same remap
 * serves both the fixed equal-width `single-facade` panels (draw-scale
 * {@link FACADE_DRAW_SCALE}, the seam is a feathered overlap) and the
 * variable-width `troncon-sequence` tiles (draw-scale 1 — the seam is a real
 * transparent gap, so there is nothing to stretch).
 */

import type { BackdropLayout } from "@game/levels/levelArt";

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

/**
 * Scale `worldX`'s offset from a given tile centre by `drawScale` — the
 * mode-agnostic generalization of {@link applyFacadeStretchX} (ADR-0048). The
 * caller supplies the tile's own `centreX` (no floor-based panel classification),
 * so it works for the variable-width tronçon tiles too. For a `single-facade`
 * panel this is numerically identical to `applyFacadeStretchX(worldX, panelW,
 * panels)` (same centre, same factor); for a `troncon-sequence` tile `drawScale`
 * is 1, so it is the identity.
 */
export function stretchAboutCentre(worldX: number, centreX: number, drawScale: number): number {
  return centreX + (worldX - centreX) * drawScale;
}

/**
 * The facade horizontal draw-scale for a backdrop mode (ADR-0048): the
 * `single-facade` panels are drawn at {@link FACADE_DRAW_SCALE} so neighbours
 * overlap and the left-edge feather crossfades the seam; the `troncon-sequence`
 * tiles are drawn at native width (1) — the seam is a transparent sky gap, not a
 * stretched overlap. Draw-scale is a render concern, so it lives here, NOT in the
 * pure `BackdropLayout` geometry.
 */
export function facadeDrawScale(mode: BackdropLayout["mode"]): number {
  return mode === "single-facade" ? FACADE_DRAW_SCALE : 1;
}

/** One drawable backdrop plane derived from a {@link BackdropLayout} tile. */
export interface BackdropPane {
  /** Image basename under `assets/levels/<id>/` (no extension). */
  readonly file: string;
  /** World X of the tile (plane) centre. */
  readonly centreX: number;
  /** Native tile width in world units (street band width, slot basis). */
  readonly width: number;
  /** Horizontal draw-scale of the facade plane (see {@link facadeDrawScale}). */
  readonly drawScale: number;
  /** Whether the facade plane's left edge is alpha-feathered to crossfade the
   *  seam. Only the interior `single-facade` panels feather; tronçon tiles never
   *  do (their seam is a real transparent gap the parallax sky shows through). */
  readonly feather: boolean;
}

/**
 * The render-side plane list for a backdrop layout (ADR-0048): one pane per tile,
 * carrying the draw-scale and feather flag `LevelBackdrop` needs on top of the
 * pure geometry. Keeps the single-facade path byte-identical (draw-scale 1.08,
 * feather on every panel after the first) while the tronçon path draws native,
 * un-feathered planes.
 */
export function backdropPanes(layout: BackdropLayout): BackdropPane[] {
  const single = layout.mode === "single-facade";
  const drawScale = facadeDrawScale(layout.mode);
  return layout.tiles.map((tile, i) => ({
    file: tile.file,
    centreX: tile.centreX,
    width: tile.width,
    drawScale,
    feather: single && i > 0,
  }));
}
