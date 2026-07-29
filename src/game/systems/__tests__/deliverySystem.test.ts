import { describe, it, expect } from "vitest";
import {
  tickDelivery,
  seedDeliveryVehicle,
  VEHICLE_SPEED,
  VEHICLE_MARGIN,
  DAMAGE_PER_ASSAILANT_PER_SECOND,
} from "@game/systems/deliverySystem";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { CourierField } from "@game/systems/courierSystem";

const FIELD: CourierField = { halfWidth: 40, streetY: -5 };

const SPEC: DeliverySpec = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 500,
  entrySide: "left",
  stopPosition: { x: 0, y: -5 },
};

/** A vehicle forced into a given phase for targeted assertions. */
function at(overrides: Partial<DeliveryVehicle>): DeliveryVehicle {
  return {
    phase: "IDLE",
    position: SPEC.stopPosition,
    vehicleType: SPEC.vehicleType,
    integrity: SPEC.integrity,
    integrityMax: SPEC.integrity,
    windowRemaining: SPEC.windowSeconds,
    ...overrides,
  };
}

describe("seedDeliveryVehicle", () => {
  it("seeds IDLE with a full gauge from the spec", () => {
    const v = seedDeliveryVehicle(SPEC);
    expect(v).not.toBeNull();
    expect(v?.phase).toBe("IDLE");
    expect(v?.vehicleType).toBe("truck");
    expect(v?.integrity).toBe(100);
    expect(v?.integrityMax).toBe(100);
  });

  it("returns null when the level has no delivery", () => {
    expect(seedDeliveryVehicle(null)).toBeNull();
  });
});

describe("tickDelivery — scripted trigger (A2, determinism)", () => {
  it("stays IDLE before the scripted instant", () => {
    const v = at({ phase: "IDLE" });
    const r = tickDelivery(v, SPEC, SPEC.triggerAtElapsedSeconds - 0.001, 0, FIELD, 0.1);
    expect(r.vehicle).toBe(v); // untouched reference
    expect(r.vehicle.phase).toBe("IDLE");
    expect(r.scoreDelta).toBe(0);
  });

  it("enters (IDLE → INCOMING) exactly when elapsed crosses the trigger", () => {
    const r = tickDelivery(
      at({ phase: "IDLE" }),
      SPEC,
      SPEC.triggerAtElapsedSeconds,
      0,
      FIELD,
      0.1,
    );
    expect(r.vehicle.phase).toBe("INCOMING");
    // Placed at the left entry edge, off-screen.
    expect(r.vehicle.position.x).toBe(-(FIELD.halfWidth + VEHICLE_MARGIN));
    expect(r.vehicle.position.y).toBe(SPEC.stopPosition.y);
  });

  it("is deterministic: identical inputs give identical outputs (no RNG)", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 4, integrity: 50 });
    const a = tickDelivery(v, SPEC, 25, 2, FIELD, 0.1);
    const b = tickDelivery(v, SPEC, 25, 2, FIELD, 0.1);
    expect(a).toEqual(b);
  });
});

describe("tickDelivery — INCOMING (A1 movement)", () => {
  it("rolls toward the stop position along the street", () => {
    const v = at({ phase: "INCOMING", position: { x: -20, y: -5 } });
    const r = tickDelivery(v, SPEC, 25, 0, FIELD, 0.1);
    expect(r.vehicle.phase).toBe("INCOMING");
    expect(r.vehicle.position.x).toBeCloseTo(-20 + VEHICLE_SPEED * 0.1);
    expect(r.vehicle.position.y).toBe(-5);
  });

  it("arriving at the stop opens the DELIVERING window", () => {
    const v = at({ phase: "INCOMING", position: { x: -0.2, y: -5 } });
    const r = tickDelivery(v, SPEC, 25, 0, FIELD, 0.1);
    expect(r.vehicle.phase).toBe("DELIVERING");
    expect(r.vehicle.position).toEqual(SPEC.stopPosition);
    expect(r.vehicle.windowRemaining).toBe(SPEC.windowSeconds);
    expect(r.scoreDelta).toBe(0);
  });
});

describe("tickDelivery — DELIVERING damage (A3)", () => {
  it("no assailants → integrity is untouched", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 100 });
    const r = tickDelivery(v, SPEC, 25, 0, FIELD, 0.5);
    expect(r.vehicle.integrity).toBe(100);
    expect(r.vehicle.phase).toBe("DELIVERING");
  });

  it("assailants chip the gauge: dmg = rate × assailants × delta", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 100 });
    const r = tickDelivery(v, SPEC, 25, 3, FIELD, 0.5);
    expect(r.vehicle.integrity).toBeCloseTo(100 - DAMAGE_PER_ASSAILANT_PER_SECOND * 3 * 0.5);
    expect(r.scoreDelta).toBe(0);
  });

  // AC1 (spec-delivery-van-assault Rev.2 §5): the tuned rate is 9/s per assailant,
  // so the full assault (DELIVERY_ASSAILANTS = 2) costs 18 integrity per second.
  it("AC1: 2 assailants for 1 s take a 100 gauge to 82 (rate 9/s/assailant)", () => {
    expect(DAMAGE_PER_ASSAILANT_PER_SECOND).toBe(9);
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 100 });
    const r = tickDelivery(v, SPEC, 25, 2, FIELD, 1);
    expect(r.vehicle.integrity).toBeCloseTo(82);
  });

  it("counts down the window while it survives", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 100 });
    const r = tickDelivery(v, SPEC, 25, 1, FIELD, 0.5);
    expect(r.vehicle.windowRemaining).toBeCloseTo(4.5);
  });
});

describe("tickDelivery — SUCCESS + bonus (A4)", () => {
  it("surviving the window → SUCCESS with scoreDelta === bonus (once)", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 0.05, integrity: 40 });
    const r = tickDelivery(v, SPEC, 30, 1, FIELD, 0.1);
    expect(r.vehicle.phase).toBe("SUCCESS");
    expect(r.vehicle.integrity).toBeGreaterThan(0);
    expect(r.scoreDelta).toBe(SPEC.bonus);
  });

  it("bonus is not re-awarded on subsequent SUCCESS ticks (idempotent)", () => {
    const v = at({ phase: "SUCCESS", position: SPEC.stopPosition, integrity: 40 });
    const r = tickDelivery(v, SPEC, 31, 0, FIELD, 0.1);
    expect(r.scoreDelta).toBe(0);
  });

  it("departs after SUCCESS and eventually goes GONE", () => {
    let v = at({ phase: "SUCCESS", position: SPEC.stopPosition, integrity: 40 });
    for (let i = 0; i < 2000 && v.phase !== "GONE"; i++) {
      v = tickDelivery(v, SPEC, 40, 0, FIELD, 0.1).vehicle;
    }
    expect(v.phase).toBe("GONE");
  });
});

describe("tickDelivery — FAILED, no bonus / no malus (A5)", () => {
  it("integrity hitting zero → FAILED, scoreDelta 0", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 1 });
    // Enough shooters/delta to drain the gauge this tick.
    const r = tickDelivery(v, SPEC, 25, 5, FIELD, 1);
    expect(r.vehicle.phase).toBe("FAILED");
    expect(r.vehicle.integrity).toBe(0);
    expect(r.scoreDelta).toBe(0);
  });

  it("integrity is clamped at zero (never negative)", () => {
    const v = at({ phase: "DELIVERING", windowRemaining: 5, integrity: 1 });
    const r = tickDelivery(v, SPEC, 25, 100, FIELD, 1);
    expect(r.vehicle.integrity).toBe(0);
  });

  it("a FAILED vehicle flees and never awards a bonus", () => {
    let v = at({ phase: "FAILED", position: SPEC.stopPosition, integrity: 0 });
    let totalScore = 0;
    for (let i = 0; i < 2000 && v.phase !== "GONE"; i++) {
      const r = tickDelivery(v, SPEC, 40, 0, FIELD, 0.1);
      v = r.vehicle;
      totalScore += r.scoreDelta;
    }
    expect(v.phase).toBe("GONE");
    expect(totalScore).toBe(0);
  });
});

describe("tickDelivery — GONE is terminal", () => {
  it("stays GONE with no score and the same reference", () => {
    const v = at({ phase: "GONE" });
    const r = tickDelivery(v, SPEC, 99, 5, FIELD, 0.1);
    expect(r.vehicle).toBe(v);
    expect(r.scoreDelta).toBe(0);
  });
});

describe("tickDelivery — right-entry mirror", () => {
  const RIGHT: DeliverySpec = { ...SPEC, entrySide: "right", stopPosition: { x: -2, y: -4.5 } };

  it("enters from the right edge and rolls left", () => {
    const r = tickDelivery(at({ phase: "IDLE" }), RIGHT, 25, 0, FIELD, 0.1);
    expect(r.vehicle.phase).toBe("INCOMING");
    expect(r.vehicle.position.x).toBe(FIELD.halfWidth + VEHICLE_MARGIN);
    const rolled = tickDelivery(r.vehicle, RIGHT, 25, 0, FIELD, 0.1);
    expect(rolled.vehicle.position.x).toBeLessThan(r.vehicle.position.x);
  });
});

describe("tickDelivery — full scripted run", () => {
  it("IDLE → INCOMING → DELIVERING → SUCCESS → GONE with a single bonus", () => {
    let v = seedDeliveryVehicle(SPEC);
    expect(v).not.toBeNull();
    if (v === null) return;

    let elapsed = 0;
    let bonusTotal = 0;
    const seen = new Set<string>();
    // No shooters at all: the vehicle must survive and succeed.
    for (let i = 0; i < 5000 && v.phase !== "GONE"; i++) {
      elapsed += 0.1;
      const r = tickDelivery(v, SPEC, elapsed, 0, FIELD, 0.1);
      v = r.vehicle;
      bonusTotal += r.scoreDelta;
      seen.add(v.phase);
    }
    expect(seen.has("INCOMING")).toBe(true);
    expect(seen.has("DELIVERING")).toBe(true);
    expect(seen.has("SUCCESS")).toBe(true);
    expect(v.phase).toBe("GONE");
    expect(bonusTotal).toBe(SPEC.bonus); // exactly once
  });
});
