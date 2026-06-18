import type { JSX } from "react";
import { useMemo } from "react";
import { CanvasTexture } from "three";
import type { WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";

// Native facade resolution to draw the frame texture at (matches the art).
const TEX_W = 1280;
const TEX_H = 768;
const IRON = "#0b0912";

/**
 * Build a transparent overlay texture: for each window zone, a wrought-iron
 * frame + mullion cross and a balcony railing across the lower half. Drawn in
 * facade-image space (y-down) so it lines up with the zones the cops sit in.
 */
function buildFrameTexture(zones: readonly WindowZone[]): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d");
  if (g === null) return null;

  g.clearRect(0, 0, TEX_W, TEX_H);
  const lw = Math.max(2, TEX_W * 0.0045);

  for (const z of zones) {
    const ww = z.w * TEX_W;
    const hh = z.h * TEX_H;
    const left = z.x * TEX_W - ww / 2;
    const top = z.y * TEX_H - hh / 2;
    const cx = z.x * TEX_W;
    const cy = z.y * TEX_H;

    // Window frame + mullion cross
    g.strokeStyle = IRON;
    g.lineWidth = lw;
    g.strokeRect(left, top, ww, hh);
    g.lineWidth = lw * 0.55;
    g.beginPath();
    g.moveTo(cx, top);
    g.lineTo(cx, top + hh);
    g.moveTo(left, cy);
    g.lineTo(left + ww, cy);
    g.stroke();

    // Balcony railing across the lower part, slightly wider than the window and
    // extending below the sill — this is the bit that passes in front of cops.
    const railLeft = left - ww * 0.05;
    const railW = ww * 1.1;
    const railTop = cy + hh * 0.12;
    const railBottom = top + hh + hh * 0.18;
    g.fillStyle = IRON;
    g.fillRect(railLeft, railTop, railW, lw * 1.3); // top rail
    g.fillRect(railLeft, railBottom - lw, railW, lw); // bottom rail
    const balusters = Math.max(5, Math.round(railW / (TEX_W * 0.011)));
    for (let i = 0; i <= balusters; i++) {
      const bx = railLeft + railW * (i / balusters);
      g.fillRect(bx - lw * 0.3, railTop, lw * 0.6, railBottom - railTop);
    }
  }

  const tex = new CanvasTexture(canvas);
  applyPixelFilter(tex);
  tex.needsUpdate = true;
  return tex;
}

interface Props {
  zones: readonly WindowZone[];
  facadeW: number;
  facadeH: number;
}

/**
 * Foreground décor layer: window bars and iron railings rendered in front of
 * the cops (z above the enemies), so they read as standing behind the windows.
 */
export function ForegroundFrames({ zones, facadeW, facadeH }: Props): JSX.Element | null {
  const texture = useMemo(() => buildFrameTexture(zones), [zones]);
  if (texture === null) return null;
  return (
    <mesh position={[0, 0, 0.5]} renderOrder={5}>
      <planeGeometry args={[facadeW, facadeH]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
