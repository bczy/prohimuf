import type { Vec2 } from "@game/types/vector";

export interface Bullet {
  readonly id: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly fromPlayer: boolean;
}
