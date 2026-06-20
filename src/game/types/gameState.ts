import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { HitEvent, PointHitEvent } from "@game/types/feedback";

export type Phase = "PLAYING" | "GAME_OVER" | "LEVEL_COMPLETE";

export interface GameState {
  readonly phase: Phase;
  readonly crosshair: Crosshair;
  readonly enemies: readonly Enemy[];
  readonly bullets: readonly Bullet[];
  readonly score: number;
  readonly lives: number;
  readonly timeRemaining: number;
  readonly wave: number;
  // Street couriers (livreurs) crossing the level, with a countdown to the next
  // entry and a running total spawned (drives id + entry direction).
  readonly couriers: readonly Courier[];
  readonly courierTimer: number;
  readonly couriersSpawned: number;
  // Takedown effects from the latest tick (transient; for floating feedback).
  readonly feedback?: readonly HitEvent[];
  // Courier-hit penalties this tick, anchored to world positions (transient).
  readonly pointFeedback?: readonly PointHitEvent[];
}
