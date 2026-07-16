import type { JSX } from "react";
import { useMemo } from "react";
import { CanvasTexture } from "three";
import type { IronworkStyle, WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { drawForegroundIronwork } from "./foregroundArt";

// Native facade resolution to draw the frame texture at (matches the art).
const TEX_W = 1280;
const TEX_H = 768;

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
): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;

  drawForegroundIronwork(g, zones, TEX_W, TEX_H, style);

  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  tex.needsUpdate = true;
  return tex;
}

interface Props {
  zones: readonly WindowZone[];
  facadeW: number;
  facadeH: number;
  style: IronworkStyle;
}

/**
 * Foreground décor layer: window bars and iron railings rendered in front of
 * the cops (z above the enemies), so they read as standing behind the windows.
 */
export function ForegroundFrames({ zones, facadeW, facadeH, style }: Props): JSX.Element | null {
  const texture = useMemo(() => buildFrameTexture(zones, style), [zones, style]);
  if (texture === null) return null;
  return (
    <mesh position={[0, 0, 0.5]} renderOrder={5}>
      <planeGeometry args={[facadeW, facadeH]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
