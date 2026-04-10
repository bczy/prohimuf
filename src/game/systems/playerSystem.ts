import type { Player } from "@game/types/player";
import type { TopdownInput } from "@game/types/topdownState";
import { addVec2, normalizeVec2, scaleVec2 } from "@game/systems/vec2";

export const PLAYER_SPEED = 5;

interface MapBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export function movePlayer(
  player: Player,
  input: TopdownInput,
  delta: number,
  bounds: MapBounds,
): Player {
  const dir = {
    x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    y: (input.up ? 1 : 0) - (input.down ? 1 : 0),
  };

  const normalized = normalizeVec2(dir);
  const velocity = scaleVec2(normalized, PLAYER_SPEED);
  const displacement = scaleVec2(velocity, delta);
  const raw = addVec2(player.position, displacement);

  const position = {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, raw.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, raw.y)),
  };

  return { ...player, position, velocity };
}
