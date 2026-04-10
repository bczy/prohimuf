import type { Vec2 } from "@game/types/vector";

export interface DeliveryPoint {
  readonly id: string;
  readonly position: Vec2;
  readonly radius: number;
}

export interface DeliveryState {
  readonly pickup: DeliveryPoint;
  readonly delivery: DeliveryPoint;
  readonly cargoPickedUp: boolean;
  readonly cargoDelivered: boolean;
}
