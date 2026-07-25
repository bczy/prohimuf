import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import type { IronworkStyle, WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { drawForegroundIronwork, drawForegroundIronworkPerBuilding } from "./foregroundArt";
import { FACADE_DRAW_SCALE } from "./facadeLayout";
import { STREET_DEPTH } from "./streetDepth";

// Frame texture resolution: 2× the native facade art (1280×768) so the
// code-drawn ironwork stays crisp once the panel is magnified on screen
// (NearestFilter upscaling of a 1× texture read as chunky pixels).
const TEX_W = 2560;
const TEX_H = 1536;

/**
 * Build a transparent overlay texture: for each window zone, the code-drawn
 * foreground ironwork. Drawn in facade-image space (y-down) so it lines up with
 * the zones the cops sit in. The actual drawing lives in {@link drawForegroundIronwork}
 * so it can be reused by offline preview scripts. When `varyPerBuilding` is set,
 * the tile's zones are clustered into buildings and each building gets its own
 * wrought-iron style (multi-building tronçons); otherwise a single uniform
 * {@link IronworkStyle} is drawn.
 */
function buildFrameTexture(
  zones: readonly WindowZone[],
  style: IronworkStyle,
  sillOffset: number,
  varyPerBuilding: boolean,
  tileIndex: number,
): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;

  if (varyPerBuilding) {
    drawForegroundIronworkPerBuilding(g, zones, TEX_W, TEX_H, style, sillOffset, tileIndex);
  } else {
    drawForegroundIronwork(g, zones, TEX_W, TEX_H, style, sillOffset);
  }

  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  // The 2× texture can be MINIFIED on a DPR-1 desktop (panel ≈ viewport width
  // < 2560 px): plain NearestFilter would skip texels and render the thin bars
  // with uneven widths. Keep the crisp Nearest magnification (mobile zoom) but
  // filter minification through mipmaps.
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

interface Props {
  zones: readonly WindowZone[];
  facadeW: number;
  facadeH: number;
  style: IronworkStyle;
  /** Per-level drop of the railing base below the opening (fraction of zone height). */
  sillOffset: number;
  /**
   * Horizontal draw-scale of the facade plane this overlay tracks (ADR-0048).
   * Defaults to {@link FACADE_DRAW_SCALE} (the single-facade panel stretch);
   * tronçon tiles pass 1 (drawn at native width, no feather/stretch).
   */
  drawScale?: number;
  /**
   * When set, cluster this tile's zones into buildings by x-gap and draw a
   * different wrought-iron style per building (multi-building tronçons). Off ⇒
   * the whole tile draws in the single `style` (unchanged single-facade levels).
   */
  varyPerBuilding?: boolean;
  /** Backdrop-tile index — deterministic seed so repeated tronçon images vary. */
  tileIndex?: number;
}

/**
 * Foreground décor layer: window bars and iron railings rendered in front of
 * the cops (z above the enemies), so they read as standing behind the windows.
 */
export function ForegroundFrames({
  zones,
  facadeW,
  facadeH,
  style,
  sillOffset,
  drawScale = FACADE_DRAW_SCALE,
  varyPerBuilding = false,
  tileIndex = 0,
}: Props): JSX.Element | null {
  const texture = useMemo(
    () => buildFrameTexture(zones, style, sillOffset, varyPerBuilding, tileIndex),
    [zones, style, sillOffset, varyPerBuilding, tileIndex],
  );
  // Free the GPU texture (~16 MB per panel at 2×) when zones/style change or
  // the scene unmounts — R3F does not dispose prop-passed textures.
  useEffect(() => {
    if (texture === null) return;
    return () => {
      texture.dispose();
    };
  }, [texture]);
  if (texture === null) return null;
  return (
    // Scale the overlay plane by `drawScale` about the tile-group origin so the
    // railings track the facade image (drawn at the same stretch) pixel-for-pixel;
    // the texture content (zone → texture-x) is untouched. Single-facade panels
    // stretch by 1+BLEND; tronçon tiles pass 1 (native width, no feather).
    // Depth slot: STREET_DEPTH.facadeOverlay — this plane is PAINTED ON THE
    // FACADE (z 0.5), so it must stay strictly BELOW every street actor
    // (courier 5.5, delivery van 6/7), which are physically in front of it.
    <mesh
      position={[0, 0, STREET_DEPTH.facadeOverlay.z]}
      renderOrder={STREET_DEPTH.facadeOverlay.order}
    >
      <planeGeometry args={[facadeW * drawScale, facadeH]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
