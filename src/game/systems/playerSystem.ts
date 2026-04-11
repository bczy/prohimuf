import type { Player } from "@game/types/player";
import type { TopdownInput } from "@game/types/topdownState";
import type { SolidRect } from "@game/maps/topdown_test";
import { addVec2, normalizeVec2, scaleVec2 } from "@game/systems/vec2";

export const PLAYER_SPEED = 5;
const PLAYER_RADIUS = 0.4;

interface MapBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export function collidesWithRect(px: number, py: number, rect: SolidRect): boolean {
  return (
    Math.abs(px - rect.x) < rect.w + PLAYER_RADIUS && Math.abs(py - rect.y) < rect.h + PLAYER_RADIUS
  );
}

export function resolveCollision(
  px: number,
  py: number,
  prevX: number,
  prevY: number,
  rects: readonly SolidRect[],
): { x: number; y: number } {
  let x = px;
  let y = py;

  for (const rect of rects) {
    if (!collidesWithRect(x, y, rect)) continue;
    // Try sliding along X axis only
    if (!collidesWithRect(prevX, y, rect)) {
      x = prevX;
    } else if (!collidesWithRect(x, prevY, rect)) {
      // Try sliding along Y axis only
      y = prevY;
    } else {
      // Full block
      x = prevX;
      y = prevY;
    }
  }

  return { x, y };
}

export function movePlayer(
  player: Player,
  input: TopdownInput,
  delta: number,
  bounds: MapBounds,
  solidRects: readonly SolidRect[] = [],
): Player {
  const dir = {
    x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    y: (input.up ? 1 : 0) - (input.down ? 1 : 0),
  };

  const normalized = normalizeVec2(dir);
  const velocity = scaleVec2(normalized, PLAYER_SPEED);
  const displacement = scaleVec2(velocity, delta);
  const raw = addVec2(player.position, displacement);

  // Clamp to map bounds
  const clamped = {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, raw.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, raw.y)),
  };

  // Resolve wall collisions
  const resolved = resolveCollision(
    clamped.x,
    clamped.y,
    player.position.x,
    player.position.y,
    solidRects,
  );

  return { ...player, position: resolved, velocity };
}
