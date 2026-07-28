import { describe, it, expect } from "vitest";
import { computeDeliveryDirection } from "@hooks/useGameLoop";
import { isOnScreen } from "@game/systems/viewport";
import type { DeliveryPhase, DeliverySpec, DeliveryVehicle } from "@game/types/delivery";

/**
 * Off-screen direction cue toward the delivery point (telegraph spec D2, AC A4-A7).
 *
 * The cue is a VIEW derivation, but it carries a fairness invariant: it must be on
 * exactly when the delivery point is outside the frame the game itself measures
 * (ADR-0071's `isOnScreen`), on every device class. These tests pin that invariant
 * plus the two corrections that make it true — T-1 (live viewport, never the 18/12
 * defaults) and T-2 (anchored on `stopPosition`, not on the rolling van).
 */

// Vitry-shaped spec: entry LEFT, rendez-vous at x = +2 (the two are on opposite
// sides of the street — the case T-2 exists for).
const SPEC: DeliverySpec = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 300,
  entrySide: "left",
  stopPosition: { x: 2, y: -1 },
};

function vehicle(phase: DeliveryPhase, x = 2): DeliveryVehicle {
  return {
    phase,
    position: { x, y: -1 },
    vehicleType: "truck",
    integrity: 100,
    integrityMax: 100,
    windowRemaining: phase === "DELIVERING" ? 8 : 0,
  };
}

// Desktop framing (the `isOnScreen` defaults) and the mobile MOBILE_ZOOM_FACTOR 1.7
// crop of the same screen — the divergence T-1 is about.
const DESKTOP = { w: 18, h: 12 };
const MOBILE = { w: 18 / 1.7, h: 12 / 1.7 };

describe("computeDeliveryDirection — activation window", () => {
  it("is absent on a level with no delivery", () => {
    expect(
      computeDeliveryDirection(
        { deliverySpec: null, deliveryVehicle: null },
        -30,
        0,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toBeUndefined();
  });

  it.each<DeliveryPhase>(["IDLE", "SUCCESS", "FAILED", "GONE"])(
    "is absent outside the in-flight window (%s), even with the point off frame",
    (phase) => {
      expect(
        computeDeliveryDirection(
          { deliverySpec: SPEC, deliveryVehicle: vehicle(phase) },
          -30,
          0,
          DESKTOP.w,
          DESKTOP.h,
        ),
      ).toBeUndefined();
    },
  );

  // A4/A6: both in-flight phases behave identically.
  it.each<DeliveryPhase>(["INCOMING", "DELIVERING"])(
    "points at the delivery point while %s and off frame",
    (phase) => {
      expect(
        computeDeliveryDirection(
          { deliverySpec: SPEC, deliveryVehicle: vehicle(phase) },
          -30,
          0,
          DESKTOP.w,
          DESKTOP.h,
        ),
      ).toEqual({ up: false, down: false, left: false, right: true });
    },
  );

  // A5: framed ⇒ no glyph at all (not a glyph with four `false`s).
  it.each<DeliveryPhase>(["INCOMING", "DELIVERING"])(
    "is absent while %s once the point is framed",
    (phase) => {
      expect(
        computeDeliveryDirection(
          { deliverySpec: SPEC, deliveryVehicle: vehicle(phase) },
          2,
          -1,
          DESKTOP.w,
          DESKTOP.h,
        ),
      ).toBeUndefined();
    },
  );

  it("treats a point exactly on the frame edge as framed, like isOnScreen", () => {
    // stop.x - camera.x === viewW / 2 exactly.
    const cameraX = SPEC.stopPosition.x - DESKTOP.w / 2;
    expect(isOnScreen(SPEC.stopPosition, cameraX, -1, DESKTOP.w, DESKTOP.h)).toBe(true);
    expect(
      computeDeliveryDirection(
        { deliverySpec: SPEC, deliveryVehicle: vehicle("DELIVERING") },
        cameraX,
        -1,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toBeUndefined();
  });
});

describe("computeDeliveryDirection — bearing per axis (A4/A7)", () => {
  it("lights the horizontal axis alone when only X is off frame", () => {
    expect(
      computeDeliveryDirection(
        { deliverySpec: SPEC, deliveryVehicle: vehicle("INCOMING") },
        25,
        -1,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toEqual({ up: false, down: false, left: true, right: false });
  });

  // A7 (ADR-0008 two-axis pan): a Y-only pan must NOT invent a horizontal glyph.
  it("lights the vertical axis alone when only Y is off frame", () => {
    expect(
      computeDeliveryDirection(
        { deliverySpec: SPEC, deliveryVehicle: vehicle("INCOMING") },
        2,
        12,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toEqual({ up: false, down: true, left: false, right: false });

    expect(
      computeDeliveryDirection(
        { deliverySpec: SPEC, deliveryVehicle: vehicle("INCOMING") },
        2,
        -14,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toEqual({ up: true, down: false, left: false, right: false });
  });

  it("lights one glyph per axis when both are off frame", () => {
    expect(
      computeDeliveryDirection(
        { deliverySpec: SPEC, deliveryVehicle: vehicle("INCOMING") },
        -30,
        12,
        DESKTOP.w,
        DESKTOP.h,
      ),
    ).toEqual({ up: false, down: true, left: false, right: true });
  });
});

describe("computeDeliveryDirection — the two gated corrections", () => {
  /**
   * T-1: the cue must read the LIVE viewport. Same camera, same point: framed on
   * desktop, off frame under the mobile 1.7 crop. Called with `isOnScreen`'s 18/12
   * defaults the cue would claim "framed" for a point the game counts as off frame
   * — the two disagreeing on exactly the device class the fairness argument is for.
   */
  it("agrees with isOnScreen on the LIVE viewport, mobile crop included", () => {
    const spec: DeliverySpec = { ...SPEC, stopPosition: { x: 6, y: 0 } };
    const state = { deliverySpec: spec, deliveryVehicle: vehicle("DELIVERING", 6) };

    expect(isOnScreen(spec.stopPosition, 0, 0, DESKTOP.w, DESKTOP.h)).toBe(true);
    expect(computeDeliveryDirection(state, 0, 0, DESKTOP.w, DESKTOP.h)).toBeUndefined();

    expect(isOnScreen(spec.stopPosition, 0, 0, MOBILE.w, MOBILE.h)).toBe(false);
    expect(computeDeliveryDirection(state, 0, 0, MOBILE.w, MOBILE.h)).toEqual({
      up: false,
      down: false,
      left: false,
      right: true,
    });
  });

  /**
   * T-2: anchored on the rendez-vous, not on the rolling van. During `INCOMING` the
   * van is at the entry edge (Vitry: x ≈ −44, outside the ±31 pan clamp) while the
   * rendez-vous is at x = +2 — the opposite bearing. The actionable instruction is
   * "go to the delivery point".
   */
  it("points at the stop position, not at the van's roll-in position", () => {
    const cue = computeDeliveryDirection(
      { deliverySpec: SPEC, deliveryVehicle: vehicle("INCOMING", -44) },
      -20,
      -1,
      DESKTOP.w,
      DESKTOP.h,
    );
    expect(cue).toEqual({ up: false, down: false, left: false, right: true });
    // Same instant, same camera, anchored on the van instead: the OPPOSITE bearing —
    // it would have sent the player away from the rendez-vous, off the pan clamp.
    const vanAnchored = computeDeliveryDirection(
      {
        deliverySpec: { ...SPEC, stopPosition: { x: -44, y: -1 } },
        deliveryVehicle: vehicle("INCOMING", -44),
      },
      -20,
      -1,
      DESKTOP.w,
      DESKTOP.h,
    );
    expect(vanAnchored).toEqual({ up: false, down: false, left: true, right: false });
  });
});
