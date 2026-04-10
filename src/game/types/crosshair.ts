import type { Vec2 } from "@game/types/vector";

export interface Crosshair {
  readonly position: Vec2; // normalized [0..1]
}
