import type { JSX } from "react";
import { useMemo } from "react";
import { CanvasTexture } from "three";
import type { WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";

// Native facade resolution to draw the frame texture at (matches the art).
const TEX_W = 1280;
const TEX_H = 768;
const IRON = "rgba(9,7,18,0.88)";
const HILIGHT = "rgba(150,150,180,0.32)";

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

    // Light window framing (delimits the opening without caging it): thin
    // semi-transparent box + a single mullion cross.
    g.strokeStyle = "rgba(10,8,18,0.42)";
    g.lineWidth = lw * 0.5;
    g.strokeRect(left, top, ww, hh);
    g.lineWidth = lw * 0.32;
    g.beginPath();
    g.moveTo(cx, top);
    g.lineTo(cx, top + hh);
    g.moveTo(left, cy);
    g.lineTo(left + ww, cy);
    g.stroke();

    // Wrought-iron balcony railing — the real foreground element, crossing in
    // front of the cop's lower body. Top + mid + bottom rails, thin round
    // balusters (left-edge sheen for a cylindrical look) and spear finials.
    const railLeft = left - ww * 0.05;
    const railW = ww * 1.1;
    const railTop = cy + hh * 0.2;
    const railBottom = top + hh + hh * 0.22;
    const midY = (railTop + railBottom) / 2;

    g.fillStyle = IRON;
    g.fillRect(railLeft, railTop, railW, lw * 1.5); // top rail
    g.fillRect(railLeft, midY - lw * 0.4, railW, lw * 0.8); // ornate mid rail
    g.fillRect(railLeft, railBottom - lw, railW, lw); // bottom rail
    g.fillStyle = HILIGHT;
    g.fillRect(railLeft, railTop, railW, Math.max(1, lw * 0.35)); // top-rail sheen

    const balusters = Math.max(6, Math.round(railW / (TEX_W * 0.012)));
    const bw = lw * 0.5;
    for (let i = 0; i <= balusters; i++) {
      const bx = railLeft + railW * (i / balusters);
      g.fillStyle = IRON;
      g.fillRect(bx - bw / 2, railTop, bw, railBottom - railTop); // baluster
      g.fillRect(bx - bw * 0.4, railTop - lw * 1.1, bw * 0.8, lw * 1.1); // spear finial
      g.fillStyle = HILIGHT;
      g.fillRect(bx - bw / 2, railTop, Math.max(1, bw * 0.34), railBottom - railTop); // sheen
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
