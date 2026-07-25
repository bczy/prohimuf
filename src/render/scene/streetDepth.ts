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
 * | ambient street motion   | 3.6         | 0.40+ |
 * | far kerb row            | 4           | 0.60  |
 * | facade overlays (ceil.) | 5           | 0.50  |
 * | delivery van rim        | 5.2         | 0.61  |
 * | delivery van            | 5.25        | 0.62  |
 * | courier (vélo)          | 5.5         | 0.65  |
 * | near kerb row           | 5.75        | 0.70  |
 * | QTE entity aura         | 5.9         | 0.48  |
 *
 * THE TWO DIRECTIVES THIS TABLE ENCODES.
 *  1. « le cycliste est en premier plan… il devrait être dans la première et la
 *     seconde ligne de props » — the courier rides BETWEEN the two prop rows:
 *     the far row never masks it, the near row MAY partially mask it.
 *  2. « le cycliste devrait être aussi devant le camion, là il passe derrière »
 *     — the courier is painted AFTER the delivery van.
 *
 * ASSUMED CONSEQUENCE: the van now passes BEHIND the near row too. `vehicle <
 * courier < nearRow` leaves no other arrangement — the van cannot be in front of
 * the near props while staying behind a courier that is itself behind them. In
 * depth terms this reads straight: the near props are the closest plane, the van
 * is the street actor furthest from the kerb, the cyclist rides between them. So
 * the near row may now partially mask BOTH "Livrer" targets (courier AND van);
 * that is Bertrand's explicit arbitration — depth ambiance over total target
 * legibility (ADR-0047 amendment 4).
 *
 * WHY EVERY ACTOR SITS ABOVE SLOT 5 AND NOT BELOW. `ForegroundFrames` and
 * `WindowGrilles` are balcony/grille overlays PAINTED ON THE FACADE at z 0.5 —
 * i.e. physically BEHIND every street actor (z >= 0.6) — but they own renderOrder
 * 5. Since they are transparent + depthWrite:false in the same sort list, an
 * actor at 4.5 would be painted OVER by them: on `vitry` the opaque HLM balcony
 * slab reaches world y -4.17..-4.55 while the couriers ride at streetY -4.8 with a
 * 2.6-unit sprite, so the slab lands squarely on the rider's head and shoulders.
 * Van and courier alike are street ACTORS, not facade elements, so every actor
 * slot stays strictly ABOVE `facadeOverlay` (5) and strictly BELOW `nearRow`.
 *
 * The fractional slots are deliberate: 5.2 / 5.25 / 5.5 / 5.75 are unused
 * elsewhere in the scene, so each layer gets an unambiguous slot without
 * renumbering the facade overlays (5) or the hostage-QTE layers at 6..8. Same
 * device as ImpactEffects' 3.5 / 7.9 / 8.1. The van rim keeps the same RELATIVE
 * geometry as before — one slot immediately below its body and z - 0.01 — so the
 * additive glow still reads as a halo drawn behind the sprite; only the absolute
 * numbers moved (6/7 → 5.2/5.25, z 0.71/0.72 → 0.61/0.62).
 *
 * THE TWO SLOTS OUTSIDE THE ROAD PLANE, and why they are in this table anyway.
 *  - `ambient` (3.6) - `UrbanMotion`'s vent steam and blowing litter. Deliberately
 *    the LOWEST street-adjacent band: above the facade panels (0..3) and strictly
 *    below every actor and target, so no ambient pixel can mask something the
 *    player must hit or must not hit.
 *  - `qteAura` (5.9) - the contact shadow + energy rim drawn under the hostage-QTE
 *    captor and the boss (`entityAura.ts`). Their bodies hold 6/7, so the aura needs
 *    a slot immediately below its host - the same "rim one slot under its body"
 *    idiom as `vehicleRim`/`vehicle` - while still clearing EVERY layer above
 *    `facadeOverlay`. It first shipped at 5, which TIED the facade overlays and sat
 *    below the van (5.2/5.25), the courier (5.5) and the near row (5.75): all four
 *    are painted AFTER it while its own host body is painted at 6, so the ironwork
 *    and a QTE-frozen courier bit into the rim. Architect finding I1.
 *
 * Both are listed here because THIS TABLE IS THE BAND REGISTRY. Omitting them is
 * what let slot 5 look free in the first place: a band nobody wrote down cannot be
 * reasoned about by the next lane.
 *
 * KNOWN, PRE-EXISTING (not introduced by this amendment): the FAR row keeps
 * renderOrder 4, i.e. BELOW the facade overlays, so a low far-row prop can still
 * be painted over by a deep balcony slab on `vitry`. Far-row props are décor, not
 * "Livrer" targets; lifting the whole row over the overlays is a visible art call
 * for Bertrand / senior-architect, deliberately out of scope here.
 *
 * Neighbours for context (owned by their own modules): backdrop panels 0..3,
 * impact marks 3.5, ambient street motion 3.6, enemies + LootCrate (and its own
 * aura) 4, facade overlays 5, QTE auras 5.9, hostage QTE 6..8, impact
 * backing/explosion/flash 7.9/8/8.1, crosshair 16384. (`ForegroundImage`
 * defines a renderOrder-6 plane but is NOT mounted anywhere in the scene graph —
 * `ForegroundFrames`/`WindowGrilles` are the only real facade overlays.)
 */
export const STREET_DEPTH = {
  /** Far (back-of-road) kerb row — never masks a street actor. */
  farRow: { order: 4, z: 0.6 },
  /**
   * NOT a street layer: the facade-attached overlay ceiling (`ForegroundFrames`,
   * `WindowGrilles`). Painted on the facade at z 0.5, so every street ACTOR must
   * sit strictly above this `order` or the ironwork paints over him.
   */
  facadeOverlay: { order: 5, z: 0.5 },
  /** Delivery vehicle neon rim — one slot behind its body, z - 0.01. */
  vehicleRim: { order: 5.2, z: 0.61 },
  /** Delivery vehicle body: above the facade ironwork, BEHIND the courier. */
  vehicle: { order: 5.25, z: 0.62 },
  /** The cyclist courier: in front of the van, behind the near prop row. */
  courier: { order: 5.5, z: 0.65 },
  /** Near (front) kerb row — MAY partially mask the courier AND the van. */
  nearRow: { order: 5.75, z: 0.7 },
  /**
   * NOT a street layer: the ambient-motion band (`UrbanMotion` — vent steam and
   * blowing litter). Held BELOW every actor and target on purpose. Its `z` varies
   * per sub-layer (litter 0.42, vent plumes 0.40), so only `order` is load-bearing.
   */
  ambient: { order: 3.6, z: 0.4 },
  /**
   * NOT a street layer: the hostage-QTE captor's and the boss's contact shadow +
   * energy rim. One slot under their bodies (6/7) and above everything the street
   * stack paints, so no décor can bite the rim. `z` is the rim plane — both hosts
   * sit at 0.5, so the rim is 0.48 and the shadow one hundredth behind it.
   */
  qteAura: { order: 5.9, z: 0.48 },
} as const;

/**
 * Back-to-front reading of the STREET layers of {@link STREET_DEPTH}, used by the
 * layering test. `facadeOverlay` is excluded on purpose: it is a facade layer, so
 * its z (0.5) sits behind the whole street stack while its renderOrder cuts
 * through it — that inversion is the very thing this table exists to arbitrate.
 */
export const STREET_DEPTH_BACK_TO_FRONT = [
  "farRow",
  "vehicleRim",
  "vehicle",
  "courier",
  "nearRow",
] as const;

/** Street layers carrying a real ACTOR — must never be masked by the facade. */
export const STREET_ACTOR_LAYERS = ["courier", "vehicleRim", "vehicle"] as const;
