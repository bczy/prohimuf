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

export function crosshairToWorld(crosshair: Crosshair, viewW: number, viewH: number): Vec2 {
  return {
    x: (crosshair.position.x - 0.5) * viewW || 0,
    y: -(crosshair.position.y - 0.5) * viewH || 0,
  };
}
