import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import type { IronworkStyle, WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { drawForegroundIronwork } from "./foregroundArt";

// Frame texture resolution: 2× the native facade art (1280×768) so the
// code-drawn ironwork stays crisp once the panel is magnified on screen
// (NearestFilter upscaling of a 1× texture read as chunky pixels).
const TEX_W = 2560;
const TEX_H = 1536;

/**
 * Build a transparent overlay texture: for each window zone, the level's
 * code-drawn foreground ironwork in the given {@link IronworkStyle}. Drawn in
 * facade-image space (y-down) so it lines up with the zones the cops sit in. The
 * actual drawing lives in {@link drawForegroundIronwork} so it can be reused by
 * offline preview scripts.
 */
function buildFrameTexture(
  zones: readonly WindowZone[],
  style: IronworkStyle,
  sillOffset: number,
): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;

  drawForegroundIronwork(g, zones, TEX_W, TEX_H, style, sillOffset);

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
}: Props): JSX.Element | null {
  const texture = useMemo(
    () => buildFrameTexture(zones, style, sillOffset),
    [zones, style, sillOffset],
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
    <mesh position={[0, 0, 0.5]} renderOrder={5}>
      <planeGeometry args={[facadeW, facadeH]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
