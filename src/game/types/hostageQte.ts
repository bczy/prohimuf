import type { Vec2 } from "@game/types/vector";

/**
 * Hostage-taker cinematic QTE — "Le duel de la porte cochère" (ADR-0034, F1+F2).
 * When triggered, the rest of the scene freezes and the camera zooms onto the
 * captor. He then RETREATS toward a porte cochère dragging the hostage: the
 * distance to the door is the sole clock (reaching it = failure). He alternates
 * `COVERED` (human shield, unshootable) and brief telegraphed `PEEKING`
 * exposures — during which he ALSO fires at the player. The only kill route is a
 * head hit during a peek; energy is the sole outcome currency. Types only: zero
 * React/Three, zero functions. The rules live in `qteSystem.ts`.
 *
 * Reworks the ADR-0030 static tableau: the captor health bar, `PART_DAMAGE`
 * body-part table, and the `windowSeconds` countdown all leave the contract.
 */

/**
 * Life-cycle of the QTE. Strictly forward-only:
 * `ZOOMING → ACTIVE → (WON | LOST) → DONE`. `DONE` persists so the QTE fires
 * exactly once per level. (Kept from ADR-0030.)
 */
export type QtePhase = "ZOOMING" | "ACTIVE" | "WON" | "LOST" | "DONE";

/**
 * The captor's sub-state during `ACTIVE` (ADR-0034 D2). `COVERED`: dragging the
 * hostage backward as a living shield — no valid kill zone. `PEEKING`: a brief,
 * telegraphed head exposure beside the hostage — the sole shootable moment, and
 * (D3) the moment he fires back.
 */
export type CaptorStance = "COVERED" | "PEEKING";

/**
 * What a QTE shot resolves to (ADR-0034 D4). `head` is returned ONLY while the
 * captor is `PEEKING` (the sole kill route) and is spatially disjoint from the
 * `hostage` band (G6). `body` is any captor-body hit (a small energy drain);
 * `hostage` is a bavure (heavy penalty); `miss` is empty space.
 */
export type QteZone = "head" | "body" | "hostage" | "miss";

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
  /** Captor START world position — the point the camera establishes on. */
  readonly anchor: Vec2;
  /** The door world point. The captor reaching it (retreat) loses the QTE (D1). */
  readonly porteCochere: Vec2;
  /** Retreat speed toward the door, world units/second — the sole clock (D1). */
  readonly retreatSpeed: number;
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
}

/**
 * Runtime state of the (single) QTE. What the render lane reads to drive the
 * following camera, the moving tableau and the peek tell. `null` until triggered;
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
   * LIVE captor world position — advanced toward `porteCochere` each tick during
   * `ACTIVE` (reusing the `Courier` `{x,y,dir,speed}` movement model). The camera
   * follows this; the distance to the door IS the diegetic timer.
   */
  readonly anchor: Vec2;
  /** Retreat direction along x (reuses `Courier` `dir`). */
  readonly dir: 1 | -1;
  /** Retreat speed, world units/second (from the spec). */
  readonly speed: number;
  /** The door world point — reaching it loses the QTE; also the distance-timer end. */
  readonly porteCochere: Vec2;
  /**
   * `COVERED` segment length between peeks, in seconds — the runtime mirror of
   * `QteSpec.peekCadenceSeconds` (copied at `createQte`, exactly as `dir`/`speed`/
   * `porteCochere` are). The tick has only the runtime record and needs it to reset
   * `stanceRemaining` on every `PEEKING → COVERED` close. Asserted ≥ `TELEGRAPH_LEAD_SECONDS`.
   */
  readonly peekCadenceSeconds: number;
  /**
   * `PEEKING` exposure length, in seconds — the runtime mirror of
   * `QteSpec.peekDurationSeconds`, already clamped up to `PEEK_EXPOSURE_FLOOR` at
   * `createQte` (G5: "clamp the runtime exposure before it reaches the tick"). The
   * tick resets `stanceRemaining` to it on every `COVERED → PEEKING` open.
   */
  readonly peekDurationSeconds: number;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Brief hold in WON/LOST before DONE (so the result reads on screen). */
  readonly resultRemaining: number;
  /** The "OTAGE" warning is shown (true during ZOOMING). */
  readonly warning: boolean;
}
