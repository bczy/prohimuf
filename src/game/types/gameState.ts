import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { HitEvent } from "@game/types/feedback";

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
  // Takedown effects from the latest tick (transient; for floating feedback).
  readonly feedback?: readonly HitEvent[];
}
