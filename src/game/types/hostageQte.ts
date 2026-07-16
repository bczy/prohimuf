import type { Vec2 } from "@game/types/vector";

/**
 * Hostage-taker cinematic QTE (ADR-0030). When triggered, the rest of the scene
 * freezes, the camera zooms onto the captor for `zoomSeconds`, then a
 * `windowSeconds` window opens in which the player shoots his body parts (each
 * more or less lethal) to drop his health bar before he executes the hostage —
 * the daughter of a cartel boss, who must be saved. Types only: zero React/Three,
 * zero functions. The rules live in `qteSystem.ts`.
 */

/**
 * Life-cycle of the QTE. Strictly forward-only:
 * `ZOOMING → ACTIVE → (WON | LOST) → DONE`. `DONE` persists so the QTE fires
 * exactly once per level.
 */
export type QtePhase = "ZOOMING" | "ACTIVE" | "WON" | "LOST" | "DONE";

/** The captor's aimable body parts, each with its own lethality (see PART_DAMAGE). */
export type QteBodyPart = "head" | "torso" | "arm" | "legs";

/** What a QTE shot resolves to: a captor body part, the hostage, or empty space. */
export type QteZone = QteBodyPart | "hostage" | "miss";

/**
 * Authored per-level QTE data (`LevelConfig.hostageQte`). Deterministic, scripted
 * — no randomness. One per level (MVP).
 */
export interface QteSpec {
  /** When the level's elapsed seconds cross this, the QTE fires (once). */
  readonly triggerAtElapsedSeconds: number;
  /** Captor health at the start (== captorHpMax at runtime). */
  readonly captorHp: number;
  /** Hostage health — several stray hits before she dies (== hostageHpMax). */
  readonly hostageHp: number;
  /** Progressive-zoom duration, in seconds (the "hostage" warning shows during it). */
  readonly zoomSeconds: number;
  /** The shootable window duration after the zoom, in seconds. */
  readonly windowSeconds: number;
  /** Score bonus granted once on a successful rescue (WON). */
  readonly bonusScore: number;
  /** Energy refund granted once on a successful rescue (WON). */
  readonly bonusEnergy: number;
  /** World point the camera zooms onto (the captor's position; same space as bullets). */
  readonly anchor: Vec2;
}

/**
 * Runtime state of the (single) QTE. What the render lane reads to drive the
 * zoom, the two gauges and the warning. `null` until triggered; then persists
 * through `DONE`.
 */
export interface HostageQte {
  readonly phase: QtePhase;
  /** Captor health bar (0 .. captorHpMax). */
  readonly captorHp: number;
  readonly captorHpMax: number;
  /** Hostage health (0 .. hostageHpMax); reaching 0 loses the QTE. */
  readonly hostageHp: number;
  readonly hostageHpMax: number;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Seconds left of the shootable window (windowSeconds → 0 during ACTIVE). */
  readonly windowRemaining: number;
  readonly windowSeconds: number;
  /** Brief hold in WON/LOST before DONE (so the result reads on screen). */
  readonly resultRemaining: number;
  /** World point being zoomed onto (from the spec). */
  readonly anchor: Vec2;
  /** The "OTAGE" warning is shown (true during ZOOMING). */
  readonly warning: boolean;
}
