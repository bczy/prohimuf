import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { HitEvent, ImpactEvent, PointHitEvent } from "@game/types/feedback";

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
  // Seconds elapsed since the level started (drives the scripted delivery
  // trigger). Deterministic accumulator, independent of `timeRemaining`.
  readonly elapsedSeconds: number;
  // Count of `countsAsTarget` enemies neutralised so far. THE win gate is
  // `kills >= enemiesToWin` — never the score (so the delivery bonus, which
  // lands in `score`, can never trigger victory on its own).
  readonly kills: number;
  // Street couriers (livreurs) crossing the level, with a countdown to the next
  // entry and a running total spawned (drives id + entry direction).
  readonly couriers: readonly Courier[];
  readonly courierTimer: number;
  readonly couriersSpawned: number;
  // Scripted vehicle delivery (core loop `Livrer` — protect the vehicle).
  // `deliverySpec` is the authored data for this level (null = no delivery);
  // `deliveryVehicle` is its runtime state the render lane draws (phase,
  // world position, vehicleType, integrity, integrityMax, windowRemaining).
  readonly deliverySpec: DeliverySpec | null;
  readonly deliveryVehicle: DeliveryVehicle | null;
  // Takedown effects from the latest tick (transient; for floating feedback).
  readonly feedback?: readonly HitEvent[];
  // Courier-hit penalties this tick, anchored to world positions (transient).
  readonly pointFeedback?: readonly PointHitEvent[];
  // Player-shot impacts from the latest tick (transient; drives render effects
  // — explosion, wall marks). 0 or 1 element (one shot per tick).
  readonly impactEvents?: readonly ImpactEvent[];
}
