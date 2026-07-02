import { describe, it, expect } from "vitest";
import {
  tickDelivery,
  DELIVERY_RADIUS,
  DELIVERY_BONUS,
} from "@game/systems/deliverySystem";
import type { Cargo } from "@game/types/cargo";

const PICKUP = { x: -6, y: -3 };
const DEPOT = { x: 6, y: -3 };

const cargoAt = (status: Cargo["status"]): Cargo => ({
  status,
  pickup: PICKUP,
  depot: DEPOT,
});

describe("tickDelivery — pickup (A2)", () => {
  it("crosshair grazing the pickup takes the cargo (TO_PICKUP → CARRYING)", () => {
    const res = tickDelivery(cargoAt("TO_PICKUP"), PICKUP, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("CARRYING");
    expect(res.justPickedUp).toBe(true);
    expect(res.justDelivered).toBe(false);
    expect(res.scoreDelta).toBe(0);
  });

  it("picks up when just inside the radius", () => {
    const near = { x: PICKUP.x + DELIVERY_RADIUS - 0.01, y: PICKUP.y };
    const res = tickDelivery(cargoAt("TO_PICKUP"), near, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("CARRYING");
    expect(res.justPickedUp).toBe(true);
  });

  it("emits a world-anchored pickup feedback event at the pickup", () => {
    const res = tickDelivery(cargoAt("TO_PICKUP"), PICKUP, DELIVERY_RADIUS);
    expect(res.events).toHaveLength(1);
    expect(res.events[0]).toMatchObject({ x: PICKUP.x, y: PICKUP.y, scoreDelta: 0 });
  });

  it("does not pick up while the crosshair sits on the depot", () => {
    const res = tickDelivery(cargoAt("TO_PICKUP"), DEPOT, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("TO_PICKUP");
    expect(res.justPickedUp).toBe(false);
    expect(res.events).toHaveLength(0);
  });
});

describe("tickDelivery — delivery + bonus (A3)", () => {
  it("crosshair grazing the depot delivers the cargo with a score bonus", () => {
    const res = tickDelivery(cargoAt("CARRYING"), DEPOT, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("DELIVERED");
    expect(res.justDelivered).toBe(true);
    expect(res.justPickedUp).toBe(false);
    expect(res.scoreDelta).toBe(DELIVERY_BONUS);
    expect(res.scoreDelta).toBeGreaterThan(0);
  });

  it("emits a delivery feedback event carrying the bonus at the depot", () => {
    const res = tickDelivery(cargoAt("CARRYING"), DEPOT, DELIVERY_RADIUS);
    expect(res.events).toHaveLength(1);
    expect(res.events[0]).toMatchObject({ x: DEPOT.x, y: DEPOT.y, scoreDelta: DELIVERY_BONUS });
  });

  it("carrying near the pickup (not the depot) does not deliver", () => {
    const res = tickDelivery(cargoAt("CARRYING"), PICKUP, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("CARRYING");
    expect(res.justDelivered).toBe(false);
    expect(res.scoreDelta).toBe(0);
  });
});

describe("tickDelivery — idempotence once DELIVERED (A4)", () => {
  it("stays DELIVERED with no score even on the depot", () => {
    const res = tickDelivery(cargoAt("DELIVERED"), DEPOT, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("DELIVERED");
    expect(res.scoreDelta).toBe(0);
    expect(res.justDelivered).toBe(false);
    expect(res.justPickedUp).toBe(false);
    expect(res.events).toHaveLength(0);
  });

  it("returns the same cargo reference when nothing changes", () => {
    const cargo = cargoAt("DELIVERED");
    const res = tickDelivery(cargo, DEPOT, DELIVERY_RADIUS);
    expect(res.cargo).toBe(cargo);
  });
});

describe("tickDelivery — out of range (A5)", () => {
  it("far from the pickup leaves TO_PICKUP untouched", () => {
    const far = { x: PICKUP.x + DELIVERY_RADIUS + 1, y: PICKUP.y };
    const cargo = cargoAt("TO_PICKUP");
    const res = tickDelivery(cargo, far, DELIVERY_RADIUS);
    expect(res.cargo).toBe(cargo);
    expect(res.scoreDelta).toBe(0);
    expect(res.justPickedUp).toBe(false);
    expect(res.events).toHaveLength(0);
  });

  it("far from the depot leaves CARRYING untouched", () => {
    const far = { x: DEPOT.x, y: DEPOT.y + DELIVERY_RADIUS + 5 };
    const res = tickDelivery(cargoAt("CARRYING"), far, DELIVERY_RADIUS);
    expect(res.cargo.status).toBe("CARRYING");
    expect(res.scoreDelta).toBe(0);
    expect(res.justDelivered).toBe(false);
  });

  it("uses the default radius when none is supplied", () => {
    const res = tickDelivery(cargoAt("TO_PICKUP"), PICKUP);
    expect(res.cargo.status).toBe("CARRYING");
  });
});

describe("tickDelivery — full loop", () => {
  it("progresses TO_PICKUP → CARRYING → DELIVERED across ticks", () => {
    const picked = tickDelivery(cargoAt("TO_PICKUP"), PICKUP, DELIVERY_RADIUS);
    expect(picked.cargo.status).toBe("CARRYING");
    const delivered = tickDelivery(picked.cargo, DEPOT, DELIVERY_RADIUS);
    expect(delivered.cargo.status).toBe("DELIVERED");
    expect(delivered.scoreDelta).toBe(DELIVERY_BONUS);
  });
});
