import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";

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
}
