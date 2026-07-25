/**
 * The street depth stack: ONE table for the layers that share the road plane —
 * the two near-foreground kerb rows (ADR-0047), the couriers and the delivery
 * vehicle — plus the facade-overlay ceiling they must clear. Every material down
 * here is `transparent` + `depthWrite:false`, so paint order is governed by
 * `renderOrder` alone; the `z` values only keep the world-space depth story
 * coherent with that paint order (and disambiguate co-located planes such as the
 * traffic-light overlay).
 *
 * Order (back → front), Bertrand-directed 2026-07-25 (ADR-0047 amendment 4):
 *
 * | layer                   | renderOrder | z     |
 * | ----------------------- | ----------- | ----- |
 * | far kerb row            | 4           | 0.60  |
 * | facade overlays (ceil.) | 5           | 0.50  |
 * | courier (vélo)          | 5.5         | 0.65  |
 * | near kerb row           | 5.75        | 0.70  |
 * | delivery van rim        | 6           | 0.71  |
 * | delivery van            | 7           | 0.72  |
 *
 * The courier now rides BETWEEN the two prop rows: the far row never masks it,
 * the near row MAY partially mask it (explicit arbitration: depth ambiance over
 * total target legibility — this reverses ADR-0047 finding #8 for the near row).
 * The delivery van stays in front of the whole décor.
 *
 * WHY THE COURIER SITS AT 5.5 AND NOT AT A SLOT BELOW 5. `ForegroundFrames` and
 * `WindowGrilles` are balcony/grille overlays PAINTED ON THE FACADE at z 0.5 —
 * i.e. physically BEHIND every street actor (z >= 0.6) — but they own renderOrder
 * 5. Since they are transparent + depthWrite:false in the same sort list, a
 * courier at 4.5 would be painted OVER by them: on `vitry` the opaque HLM balcony
 * slab reaches world y -4.17..-4.55 while the couriers ride at streetY -4.8 with a
 * 2.6-unit sprite, so the slab lands squarely on the rider's head and shoulders.
 * Both street-actor slots therefore stay strictly ABOVE `facadeOverlay` and
 * strictly BELOW the van rim (6): 5.5 / 5.75.
 *
 * The fractional slots are deliberate: 5.5 and 5.75 are unused elsewhere in the
 * scene, so the courier and the near row each get an unambiguous slot without
 * renumbering the facade overlays (5) or the vehicle/hostage-QTE layers at 6..8.
 * Same device as ImpactEffects' 3.5 / 7.9 / 8.1.
 *
 * KNOWN, PRE-EXISTING (not introduced by this amendment): the FAR row keeps
 * renderOrder 4, i.e. BELOW the facade overlays, so a low far-row prop can still
 * be painted over by a deep balcony slab on `vitry`. Far-row props are décor, not
 * "Livrer" targets; lifting the whole row over the overlays is a visible art call
 * for Bertrand / senior-architect, deliberately out of scope here.
 *
 * Neighbours for context (owned by their own modules): backdrop panels 0..3,
 * impact marks 3.5, enemies + LootCrate 4, facade overlays 5, hostage QTE 6..8,
 * impact backing/explosion/flash 7.9/8/8.1, crosshair 16384. (`ForegroundImage`
 * defines a renderOrder-6 plane but is NOT mounted anywhere in the scene graph —
 * `ForegroundFrames`/`WindowGrilles` are the only real facade overlays.)
 */
export const STREET_DEPTH = {
  /** Far (back-of-road) kerb row — never masks the courier. */
  farRow: { order: 4, z: 0.6 },
  /**
   * NOT a street layer: the facade-attached overlay ceiling (`ForegroundFrames`,
   * `WindowGrilles`). Painted on the facade at z 0.5, so every street ACTOR must
   * sit strictly above this `order` or the ironwork paints over him.
   */
  facadeOverlay: { order: 5, z: 0.5 },
  /** The cyclist courier: between the two prop rows, above the facade overlays. */
  courier: { order: 5.5, z: 0.65 },
  /** Near (front) kerb row — MAY partially mask the courier. */
  nearRow: { order: 5.75, z: 0.7 },
  /** Delivery vehicle neon rim (DeliveryVehicleSprite owns the literals). */
  vehicleRim: { order: 6, z: 0.71 },
  /** Delivery vehicle body: in front of the entire décor. */
  vehicle: { order: 7, z: 0.72 },
} as const;

/**
 * Back-to-front reading of the STREET layers of {@link STREET_DEPTH}, used by the
 * layering test. `facadeOverlay` is excluded on purpose: it is a facade layer, so
 * its z (0.5) sits behind the whole street stack while its renderOrder cuts
 * through it — that inversion is the very thing this table exists to arbitrate.
 */
export const STREET_DEPTH_BACK_TO_FRONT = [
  "farRow",
  "courier",
  "nearRow",
  "vehicleRim",
  "vehicle",
] as const;

/** Street layers carrying a real ACTOR — must never be masked by the facade. */
export const STREET_ACTOR_LAYERS = ["courier", "vehicleRim", "vehicle"] as const;
