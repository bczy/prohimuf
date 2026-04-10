import type { Vec2 } from "@game/types/vector";

export interface Player {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly hasCargo: boolean;
}

export function createPlayer(position: Vec2): Player {
  return { position, velocity: { x: 0, y: 0 }, hasCargo: false };
}
