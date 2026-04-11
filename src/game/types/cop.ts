import type { Vec2 } from "@game/types/vector";

export type CopState = "PATROLLING" | "ALERT" | "CHASE";

export interface Cop {
  readonly id: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly state: CopState;
  readonly waypointIndex: number;
  readonly alertTimer: number;
}

export function createCop(id: number, startPosition: Vec2): Cop {
  return {
    id,
    position: startPosition,
    direction: { x: 1, y: 0 },
    state: "PATROLLING",
    waypointIndex: 0,
    alertTimer: 0,
  };
}
