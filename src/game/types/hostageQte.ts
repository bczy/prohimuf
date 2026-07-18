import type { Vec2 } from "@game/types/vector";

/**
 * Hostage-taker cinematic QTE — the static duel (revises ADR-0034 after playtest).
 * When triggered, the rest of the scene freezes and the camera zooms onto the
 * captor, who stands STILL holding the hostage as a shield. He alternates
 * `COVERED` (unshootable) and brief telegraphed `PEEKING` exposures — during
 * which he ALSO fires at the player. A head hit during a peek is the only kill
 * route. Every peek that closes WITHOUT a clean headshot is a "blown" opening:
 * it drains energy and counts toward the captor executing the hostage — after
 * `maxBlownPeeks` blown peeks he kills her (the sole failure). Energy is the
 * outcome currency. Types only: zero React/Three, zero functions. The rules live
 * in `qteSystem.ts`.
 *
 * Supersedes ADR-0034 D1: the captor no longer RETREATS toward a porte cochère
 * (the moving anchor / distance clock read as "sliding on the floor" in play and
 * is removed). The clock is now the blown-peeks count, not distance.
 */

/**
 * Life-cycle of the QTE. Strictly forward-only:
 * `ZOOMING → ACTIVE → (WON | LOST) → DONE`. `DONE` persists so the QTE fires
 * exactly once per level. (Kept from ADR-0030.)
 */
export type QtePhase = "ZOOMING" | "ACTIVE" | "WON" | "LOST" | "DONE";

/**
 * The captor's sub-state during `ACTIVE` (ADR-0034 D2). `COVERED`: holding the
 * hostage as a living shield — no valid kill zone. `PEEKING`: a brief,
 * telegraphed head exposure beside the hostage — the sole shootable moment, and
 * (D3) the moment he fires back.
 */
export type CaptorStance = "COVERED" | "PEEKING";

/**
 * What a shot that MISSES the reticle ring resolves to (ADR-0034, spatial-colour
 * revision). Captor damage no longer flows through a head band — it flows through
 * a ring hit (see `RingZone`), so `"head"` is retired. `body` is a captor-body hit
 * off the ring (small energy drain); `hostage` is a bavure (heavy penalty); `miss`
 * is empty space.
 */
export type QteZone = "body" | "hostage" | "miss";

/**
 * The captor anatomy under the wandering reticle ring's centre (spatial-colour
 * model, Bertrand's hitbox diagram). `vital` = head/face (a ring hit here chips
 * the most HP → drawn GREEN); `limb` = torso + shoulders (chips less → YELLOW);
 * `off` = arms + legs + empty space, not vital/limb anatomy (a ring hit does 0 →
 * RED). The GAME owns this semantic zone; the render lane maps it to a colour —
 * the game never names a colour.
 */
export type RingZone = "vital" | "limb" | "off";

/**
 * Authored per-level QTE data (`LevelConfig.hostageQte`). Deterministic, scripted
 * — no randomness. One per level (MVP). Belliard-first (ADR-0004 precedent). The
 * per-level difficulty CURVE across levels is ADR-0035 (F3); this contract only
 * carries the fields, the invariant floors that clamp them live in `qteSystem.ts`.
 */
export interface QteSpec {
  /** When the level's elapsed seconds cross this, the QTE fires (once). */
  readonly triggerAtElapsedSeconds: number;
  /** Progressive-zoom duration, in seconds (the "OTAGE" banner shows during it). */
  readonly zoomSeconds: number;
  /** Captor world position — a STATIC point the camera zooms onto and holds. */
  readonly anchor: Vec2;
  /**
   * Number of blown peeks (a `PEEKING` closed without a clean headshot) that make
   * the captor execute the hostage → LOST. The sole failure clock (replaces the
   * removed retreat/distance clock). Integer ≥ 1, asserted in `createQte`.
   */
  readonly maxBlownPeeks: number;
  /**
   * `COVERED` duration between peeks, in seconds. Must be ≥ `TELEGRAPH_LEAD_SECONDS`
   * so every exposure is telegraphed (G4, asserted in code, not trusted from data).
   */
  readonly peekCadenceSeconds: number;
  /**
   * `PEEKING` exposure duration, in seconds. Clamped up to `PEEK_EXPOSURE_FLOOR`
   * at runtime so a peek is always answerable even at max difficulty (G5).
   */
  readonly peekDurationSeconds: number;
  /**
   * Authored seed for the head-target wander (deterministic, replay-safe). During
   * `PEEKING` the head kill-zone / reticle wanders as a PURE function of this seed,
   * the peek ordinal and the peek-elapsed time — never `Math.random`/`Date.now`.
   * Must be finite (asserted in `createQte`). Wander amplitude/speed are system
   * constants (`qteSystem.ts`); only the seed is authored per level (F3 may promote
   * the others to additive fields later).
   */
  readonly targetSeed: number;
  /**
   * Captor hit points (spatial-colour revision — reverses ADR-0034 D4's binary
   * duel). A shot that HITS the wandering ring chips this by the ring's zone-colour
   * (`vital` big, `limb` small, `off` none); reaching 0 wins the rescue. Integer ≥ 1,
   * asserted in `createQte`. Per-zone damage + the ring hit radius are system
   * constants (`qteSystem.ts`); only the HP total is authored per level (F3 seam).
   */
  readonly captorHp: number;
}

/**
 * Runtime state of the (single) QTE. What the render lane reads to drive the
 * static-zoom camera, the tableau and the peek tell. `null` until triggered;
 * then persists through `DONE`.
 */
export interface HostageQte {
  readonly phase: QtePhase;
  /** Captor sub-state during `ACTIVE` (`COVERED` while zooming/holding). */
  readonly stance: CaptorStance;
  /**
   * The G4 telegraph is showing: true during the last `TELEGRAPH_LEAD_SECONDS`
   * of a `COVERED` beat, cueing the imminent peek. The render lane draws the tell.
   */
  readonly telegraphActive: boolean;
  /** Seconds left in the current `stance` before it toggles. */
  readonly stanceRemaining: number;
  /**
   * Captor world position — STATIC. Copied once from the spec at `createQte` and
   * never mutated; the camera zooms onto it and holds (no follow).
   */
  readonly anchor: Vec2;
  /**
   * Current head kill-zone centre, ANCHOR-RELATIVE — the point the render draws the
   * reticle at and that `qteZoneAt` centres the `head` band on. During `PEEKING` it
   * wanders (bounded, G6-clamped clear of the hostage) via the seeded pure wander;
   * during `COVERED`/`ZOOMING` it rests at the neutral head point. Not literal
   * `(0,0)` — it is the head's resting spot so the wind-up tell draws at the head.
   */
  readonly targetOffset: Vec2;
  /**
   * Authored head-wander seed — the runtime mirror of `QteSpec.targetSeed` (copied once at
   * `createQte`, exactly as the peek durations / cap are). The tick has ONLY the runtime
   * record, so it needs the seed here to compute the pure `wander` offset each peek tick.
   * Finite (asserted in `createQte`, C6).
   */
  readonly targetSeed: number;
  /**
   * Blown peeks so far (a `PEEKING` that closed without a winning headshot).
   * Starts 0, +1 per such close. Reaching `maxBlownPeeks` loses the QTE
   * (execution). This IS the readable, diegetic clock — no HUD bar.
   */
  readonly blownPeeks: number;
  /**
   * The blown-peeks cap that triggers the execution — the runtime mirror of
   * `QteSpec.maxBlownPeeks` (copied at `createQte`, exactly as the peek durations
   * are). The tick reads only the runtime record.
   */
  readonly maxBlownPeeks: number;
  /**
   * `COVERED` segment length between peeks, in seconds — the runtime mirror of
   * `QteSpec.peekCadenceSeconds`. The tick resets `stanceRemaining` to it on every
   * `PEEKING → COVERED` close. Asserted ≥ `TELEGRAPH_LEAD_SECONDS`.
   */
  readonly peekCadenceSeconds: number;
  /**
   * `PEEKING` exposure length, in seconds — the runtime mirror of
   * `QteSpec.peekDurationSeconds`, already clamped up to `PEEK_EXPOSURE_FLOOR` at
   * `createQte` (G5). The tick resets `stanceRemaining` to it on every
   * `COVERED → PEEKING` open.
   */
  readonly peekDurationSeconds: number;
  /**
   * Captor hit points remaining (starts = `spec.captorHp`, never < 0). A ring hit
   * chips it by the ring's `ringZone` colour-damage; reaching 0 → WON. This is the
   * kill currency (spatial-colour revision); the blown-peeks count is the LOSS clock.
   */
  readonly captorHp: number;
  /**
   * The captor anatomy under the ring centre right now — a DERIVED cache (like
   * `targetOffset`), `= ringZoneAt(targetOffset)`, recomputed at each ACTIVE tick's
   * end from the same last-drawn offset. The render maps it to the ring colour and
   * the tick scores a ring hit against THIS value (colour-honesty: drawn colour ==
   * scored colour == ring position). Rests at `"off"` during COVERED/ZOOMING.
   */
  readonly ringZone: RingZone;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Brief hold in WON/LOST before DONE (so the result reads on screen). */
  readonly resultRemaining: number;
  /** The "OTAGE" warning is shown (true during ZOOMING). */
  readonly warning: boolean;
}
