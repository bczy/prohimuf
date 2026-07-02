import type { Vec2 } from "@game/types/vector";

/**
 * The single delivery cargo of the core loop `Récupérer → Livrer → Éviter`.
 * A cargo waits at `pickup`, is carried once the crosshair grazes it, then is
 * dropped at `depot`. Types only — zero React/Three, zero functions.
 */
export type CargoStatus = "TO_PICKUP" | "CARRYING" | "DELIVERED";

export interface Cargo {
  /** Current leg of the delivery. */
  readonly status: CargoStatus;
  /** World position where the cargo is collected (visible while TO_PICKUP). */
  readonly pickup: Vec2;
  /** World position where the cargo is dropped off (armed while CARRYING). */
  readonly depot: Vec2;
}
