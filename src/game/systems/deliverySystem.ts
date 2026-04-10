import type { Player } from "@game/types/player";
import type { DeliveryState } from "@game/types/delivery";
import { distanceVec2 } from "@game/systems/vec2";

export function checkPickup(player: Player, delivery: DeliveryState): DeliveryState {
  if (delivery.cargoPickedUp) return delivery;
  const dist = distanceVec2(player.position, delivery.pickup.position);
  if (dist > delivery.pickup.radius) return delivery;
  return { ...delivery, cargoPickedUp: true };
}

export function checkDelivery(player: Player, delivery: DeliveryState): DeliveryState {
  if (!delivery.cargoPickedUp) return delivery;
  if (delivery.cargoDelivered) return delivery;
  const dist = distanceVec2(player.position, delivery.delivery.position);
  if (dist > delivery.delivery.radius) return delivery;
  return { ...delivery, cargoDelivered: true };
}
