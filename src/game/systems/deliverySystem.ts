import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { CourierField } from "@game/systems/courierSystem";

/**
 * Pure state-in / state-out delivery step. Drives the vehicle's state machine
 * `IDLE → INCOMING → DELIVERING → (SUCCESS | FAILED) → GONE`:
 *  - `IDLE`: waits until the level's elapsed time crosses the scripted trigger,
 *    then places the vehicle at its entry edge and starts rolling in.
 *  - `INCOMING`: slides along the street toward `stopPosition.x`; on arrival →
 *    `DELIVERING` with a fresh window.
 *  - `DELIVERING`: each `SHOOTING` enemy chips the integrity gauge. Window
 *    survived with integrity > 0 → `SUCCESS` (`scoreDelta === bonus`, once).
 *    Integrity ≤ 0 → `FAILED` (no bonus, no penalty).
 *  - `SUCCESS` / `FAILED`: the vehicle departs along its travel direction until
 *    off-screen, then `GONE`.
 * Fully deterministic — no randomness anywhere.
 */

/** World units per second the vehicle rolls in and departs at. */
export const VEHICLE_SPEED = 8;
/** How far past the street half-width the vehicle spawns / vanishes. */
export const VEHICLE_MARGIN = 4;
/** Integrity lost per second, per enemy currently in the `SHOOTING` state. */
export const DAMAGE_PER_SHOOTER_PER_SECOND = 8;

export interface DeliveryTickResult {
  /** The vehicle after this tick (same reference when nothing changes). */
  readonly vehicle: DeliveryVehicle;
  /** Score awarded this tick (> 0 only on the `DELIVERING → SUCCESS` tick). */
  readonly scoreDelta: number;
}

/** Travel direction: entering from the left rolls right (+1), and vice-versa. */
function travelDir(spec: DeliverySpec): 1 | -1 {
  return spec.entrySide === "left" ? 1 : -1;
}

/** Off-screen x the vehicle enters from. */
function entryEdgeX(field: CourierField, spec: DeliverySpec): number {
  const edge = field.halfWidth + VEHICLE_MARGIN;
  return spec.entrySide === "left" ? -edge : edge;
}

/** Off-screen x the vehicle departs toward (the opposite edge). */
function exitEdgeX(field: CourierField, spec: DeliverySpec): number {
  const edge = field.halfWidth + VEHICLE_MARGIN;
  return spec.entrySide === "left" ? edge : -edge;
}

/**
 * Seed the runtime vehicle from its authored spec (or `null` when the level has
 * no delivery). Starts `IDLE` at the stop position with a full gauge.
 */
export function seedDeliveryVehicle(spec: DeliverySpec | null): DeliveryVehicle | null {
  if (spec === null) return null;
  return {
    phase: "IDLE",
    position: spec.stopPosition,
    vehicleType: spec.vehicleType,
    integrity: spec.integrity,
    integrityMax: spec.integrity,
    windowRemaining: spec.windowSeconds,
  };
}

export function tickDelivery(
  vehicle: DeliveryVehicle,
  spec: DeliverySpec,
  elapsedSeconds: number,
  shootingCount: number,
  field: CourierField,
  delta: number,
): DeliveryTickResult {
  const dir = travelDir(spec);

  switch (vehicle.phase) {
    case "IDLE": {
      // Scripted, non-random trigger: fire once elapsed time crosses the mark.
      if (elapsedSeconds < spec.triggerAtElapsedSeconds) {
        return { vehicle, scoreDelta: 0 };
      }
      return {
        vehicle: {
          ...vehicle,
          phase: "INCOMING",
          position: { x: entryEdgeX(field, spec), y: spec.stopPosition.y },
        },
        scoreDelta: 0,
      };
    }

    case "INCOMING": {
      const nextX = vehicle.position.x + dir * VEHICLE_SPEED * delta;
      const arrived = dir === 1 ? nextX >= spec.stopPosition.x : nextX <= spec.stopPosition.x;
      if (arrived) {
        return {
          vehicle: {
            ...vehicle,
            phase: "DELIVERING",
            position: { x: spec.stopPosition.x, y: spec.stopPosition.y },
            windowRemaining: spec.windowSeconds,
          },
          scoreDelta: 0,
        };
      }
      return {
        vehicle: { ...vehicle, position: { x: nextX, y: spec.stopPosition.y } },
        scoreDelta: 0,
      };
    }

    case "DELIVERING": {
      const damage = DAMAGE_PER_SHOOTER_PER_SECOND * shootingCount * delta;
      const integrity = Math.max(0, vehicle.integrity - damage);
      const windowRemaining = vehicle.windowRemaining - delta;

      if (integrity <= 0) {
        // Disabled → the vehicle flees. No bonus, no malus.
        return {
          vehicle: { ...vehicle, phase: "FAILED", integrity: 0, windowRemaining: 0 },
          scoreDelta: 0,
        };
      }
      if (windowRemaining <= 0) {
        // Survived the whole window → success, bonus applied exactly once.
        return {
          vehicle: { ...vehicle, phase: "SUCCESS", integrity, windowRemaining: 0 },
          scoreDelta: spec.bonus,
        };
      }
      return {
        vehicle: { ...vehicle, integrity, windowRemaining },
        scoreDelta: 0,
      };
    }

    case "SUCCESS":
    case "FAILED": {
      const exitX = exitEdgeX(field, spec);
      const nextX = vehicle.position.x + dir * VEHICLE_SPEED * delta;
      const gone = dir === 1 ? nextX >= exitX : nextX <= exitX;
      if (gone) {
        return {
          vehicle: { ...vehicle, phase: "GONE", position: { x: exitX, y: vehicle.position.y } },
          scoreDelta: 0,
        };
      }
      return {
        vehicle: { ...vehicle, position: { x: nextX, y: vehicle.position.y } },
        scoreDelta: 0,
      };
    }

    case "GONE":
      return { vehicle, scoreDelta: 0 };
  }
}
