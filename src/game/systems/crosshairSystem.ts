import type { Crosshair } from "@game/types/crosshair";
import type { Vec2 } from "@game/types/vector";

export function moveCrosshair(mouseX: number, mouseY: number): Crosshair {
  return {
    position: {
      x: Math.max(0, Math.min(1, mouseX)),
      y: Math.max(0, Math.min(1, mouseY)),
    },
  };
}

export const VIEW_W = 18;
export const VIEW_H = 12;

/**
 * Convert a normalised crosshair position into world space, under the current
 * camera pan. The single source of truth for aiming (ADR-0002, ADR-0008) —
 * shots, the crosshair sprite and the HUD target indicator all flow through it.
 */
export function crosshairToWorld(
  crosshair: Crosshair,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  viewW = VIEW_W,
  viewH = VIEW_H,
): Vec2 {
  return {
    x: (crosshair.position.x - 0.5) * viewW + cameraOffsetX || 0,
    y: -(crosshair.position.y - 0.5) * viewH + cameraOffsetY || 0,
  };
}
