import type { Vec2 } from "@game/types/vector";

/**
 * Scripted vehicle delivery of the core loop `Livrer` (protect the vehicle).
 * Types only — zero React/Three, zero functions.
 *
 * A vehicle rolls onto the street lane (same space as couriers), stops to
 * deliver, and the player protects it from its own scripted assault: the two
 * enemies seated at the reserved window slots next to the stop position chip at
 * its integrity gauge, for as long as they are ALIVE, and nothing else does
 * (`deliveryAssault`). Survive the window → score bonus; integrity hits zero →
 * the vehicle flees (no bonus, no malus).
 */

/** Which vehicle sprite drives the delivery (shared key with the render lane). */
export type VehicleType = "truck" | "car" | "moto";

/**
 * Life-cycle of a delivery vehicle. Strictly forward-only:
 * `IDLE → INCOMING → DELIVERING → (SUCCESS | FAILED) → GONE`.
 */
export type DeliveryPhase = "IDLE" | "INCOMING" | "DELIVERING" | "SUCCESS" | "FAILED" | "GONE";

/**
 * Authored per-level delivery data (in `LevelConfig.deliveries`). Deterministic,
 * scripted — no randomness. MVP = one entry per level; the array is extensible.
 */
export interface DeliverySpec {
  /** Vehicle sprite / archetype (art keyed by this in the render lane). */
  readonly vehicleType: VehicleType;
  /**
   * Scripted trigger. When the level's elapsed time (seconds since start)
   * reaches this value, the vehicle enters. Fixed, not random.
   */
  readonly triggerAtElapsedSeconds: number;
  /** Integrity the vehicle starts with (== `integrityMax` at runtime). */
  readonly integrity: number;
  /** Duration of the `DELIVERING` window, in seconds. */
  readonly windowSeconds: number;
  /** Score bonus granted exactly once on `SUCCESS`. */
  readonly bonus: number;
  /** Street edge the vehicle rolls in from. */
  readonly entrySide: "left" | "right";
  /**
   * World-space position (same space as bullets / crosshair) where the vehicle
   * halts on the street to deliver. Ground level on the road lane.
   */
  readonly stopPosition: Vec2;
}

/**
 * Runtime state of the (single) delivery vehicle. What the render lane reads to
 * draw the vehicle and its integrity gauge.
 */
export interface DeliveryVehicle {
  /** Current life-cycle phase. */
  readonly phase: DeliveryPhase;
  /** World-space position (same space as bullets / crosshair). */
  readonly position: Vec2;
  /** Vehicle sprite / archetype. */
  readonly vehicleType: VehicleType;
  /** Current integrity gauge (0 .. `integrityMax`). */
  readonly integrity: number;
  /** Integrity gauge maximum (for drawing a 0..1 fill). */
  readonly integrityMax: number;
  /** Seconds left in the `DELIVERING` window (0 outside that phase). */
  readonly windowRemaining: number;
}
