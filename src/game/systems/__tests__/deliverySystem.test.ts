import { describe, it, expect } from "vitest";
import { checkPickup, checkDelivery } from "@game/systems/deliverySystem";
import type { Player } from "@game/types/player";
import type { DeliveryPoint, DeliveryState } from "@game/types/delivery";

const PICKUP: DeliveryPoint = { id: "pickup", position: { x: -12, y: 0 }, radius: 1.5 };
const DELIVERY: DeliveryPoint = { id: "delivery", position: { x: 12, y: 0 }, radius: 1.5 };

const freshDelivery: DeliveryState = {
  pickup: PICKUP,
  delivery: DELIVERY,
  cargoPickedUp: false,
  cargoDelivered: false,
};
const cargoHeld: DeliveryState = { ...freshDelivery, cargoPickedUp: true };

describe("checkPickup", () => {
  it("cargoPickedUp=true si player dans rayon pickup", () => {
    const player: Player = {
      position: { x: -12, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: false,
    };
    const result = checkPickup(player, freshDelivery);
    expect(result.cargoPickedUp).toBe(true);
  });

  it("no-op si player hors du rayon", () => {
    const player: Player = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: false,
    };
    const result = checkPickup(player, freshDelivery);
    expect(result.cargoPickedUp).toBe(false);
    expect(result).toBe(freshDelivery);
  });

  it("no-op si déjà récupéré", () => {
    const player: Player = {
      position: { x: -12, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: true,
    };
    const result = checkPickup(player, cargoHeld);
    expect(result).toBe(cargoHeld);
  });
});

describe("checkDelivery", () => {
  it("cargoDelivered=true si cargoPickedUp=true et player dans rayon delivery", () => {
    const player: Player = {
      position: { x: 12, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: true,
    };
    const result = checkDelivery(player, cargoHeld);
    expect(result.cargoDelivered).toBe(true);
  });

  it("no-op si hasCargo=false (cargoPickedUp=false)", () => {
    const player: Player = {
      position: { x: 12, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: false,
    };
    const result = checkDelivery(player, freshDelivery);
    expect(result.cargoDelivered).toBe(false);
    expect(result).toBe(freshDelivery);
  });

  it("no-op si player hors du rayon delivery", () => {
    const player: Player = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: true,
    };
    const result = checkDelivery(player, cargoHeld);
    expect(result.cargoDelivered).toBe(false);
    expect(result).toBe(cargoHeld);
  });

  it("no-op si déjà livré", () => {
    const alreadyDelivered: DeliveryState = { ...cargoHeld, cargoDelivered: true };
    const player: Player = {
      position: { x: 12, y: 0 },
      velocity: { x: 0, y: 0 },
      hasCargo: true,
    };
    const result = checkDelivery(player, alreadyDelivered);
    expect(result).toBe(alreadyDelivered);
  });
});
