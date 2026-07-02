import type { Cargo } from "@game/types/cargo";
import type { Vec2 } from "@game/types/vector";
import type { PointHitEvent } from "@game/types/feedback";
import { distanceVec2 } from "@game/systems/vec2";

/** Proximity, in world units, for the crosshair to grab or drop the cargo. */
export const DELIVERY_RADIUS = 1.5;
/** Score bonus granted when the cargo reaches its depot. */
export const DELIVERY_BONUS = 10;

export interface DeliveryResult {
  /** The cargo after this tick (unchanged when nothing happens). */
  readonly cargo: Cargo;
  /** Score awarded this tick (> 0 only on delivery). */
  readonly scoreDelta: number;
  /** True on the tick the cargo is collected. */
  readonly justPickedUp: boolean;
  /** True on the tick the cargo is delivered. */
  readonly justDelivered: boolean;
  /** World-anchored feedback for pickup / delivery (transient). */
  readonly events: readonly PointHitEvent[];
}

const NO_CHANGE = (cargo: Cargo): DeliveryResult => ({
  cargo,
  scoreDelta: 0,
  justPickedUp: false,
  justDelivered: false,
  events: [],
});

/**
 * Pure state-in / state-out delivery step. Given the cargo and the crosshair's
 * world position (same conversion `fireBullet` uses), advances the delivery leg
 * by proximity:
 *  - TO_PICKUP + near `pickup`  → CARRYING (justPickedUp).
 *  - CARRYING  + near `depot`   → DELIVERED (justDelivered, scoreDelta bonus).
 * DELIVERED is terminal: no further transitions or score. Anything else is a
 * no-op with the cargo returned untouched.
 */
export function tickDelivery(
  cargo: Cargo,
  crosshairWorld: Vec2,
  radius: number = DELIVERY_RADIUS,
): DeliveryResult {
  if (cargo.status === "TO_PICKUP" && distanceVec2(crosshairWorld, cargo.pickup) <= radius) {
    return {
      cargo: { ...cargo, status: "CARRYING" },
      scoreDelta: 0,
      justPickedUp: true,
      justDelivered: false,
      events: [
        { x: cargo.pickup.x, y: cargo.pickup.y, scoreDelta: 0, livesDelta: 0, timeDelta: 0 },
      ],
    };
  }

  if (cargo.status === "CARRYING" && distanceVec2(crosshairWorld, cargo.depot) <= radius) {
    return {
      cargo: { ...cargo, status: "DELIVERED" },
      scoreDelta: DELIVERY_BONUS,
      justPickedUp: false,
      justDelivered: true,
      events: [
        {
          x: cargo.depot.x,
          y: cargo.depot.y,
          scoreDelta: DELIVERY_BONUS,
          livesDelta: 0,
          timeDelta: 0,
        },
      ],
    };
  }

  return NO_CHANGE(cargo);
}
