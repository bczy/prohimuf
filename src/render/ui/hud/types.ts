import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";
import type { QtePhase } from "@game/types/hostageQte";
import type { WeaponKind } from "@game/types/weapon";

/*
 * DOM-HUD view types, extracted from HUD.tsx (ADR-0046) to drop the type-only import
 * cycle: the widgets under `./hud/` need these shapes but must not import the HUD
 * component. `HUD.tsx` re-exports them, so external consumers keep importing from
 * `@render/ui/HUD` unchanged. Pure type declarations — no functions, no game rule.
 */

export interface HudTargetIndicator {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/** Delivery state surfaced to the DOM HUD (read from the state ref, not per frame). */
export interface HudDelivery {
  phase: DeliveryPhase;
  integrity: number;
  integrityMax: number;
}

/**
 * Hostage-taker QTE state surfaced to the DOM HUD (the static duel), read from the
 * state ref. Only the two set-piece stamps remain on the HUD — the "OTAGE" zoom
 * banner (`warning`) and the WON/LOST verdict (`phase`). The captor-HP, countdown
 * and hostage-HP gauges left the screen (UX spec §1): the duel is binary and the
 * sole clock is the blown-peeks count, surfaced diegetically in-world (Flag B),
 * never as a HUD bar.
 */
export interface HudHostageQte {
  phase: QtePhase;
  warning: boolean;
}

/**
 * Boss-QTE state surfaced to the DOM HUD — the "le Commandant" health bar (ADR-0051).
 * Present only while the boss QTE holds the scene (`isBossQteActive`); `undefined`
 * otherwise, so the bar never renders orphaned. Bertrand's 2026-07-19 override of the
 * §0 diegetic-only ruling (`docs/game-design/ux/spec-boss-qte-hp-read.md`): a HUD HP bar
 * ships IN ADDITION to the diegetic posture / phase-break-pulse reads. Read-only view
 * values already exposed by `bossQteSystem.ts` — the render never re-encodes a rule; the
 * per-phase segment ticks come straight from `phaseCount` (thresholds derived by the
 * pure `phaseIndexAt`, ADR-0051 D5), never re-computed here.
 */
export interface HudBossQte {
  /** Boss hit points remaining (0…bossHpMax). Drives the bar fill. */
  bossHp: number;
  /** The boss's full HP (the bar's denominator). */
  bossHpMax: number;
  /** Number of HP phases — segments the bar at the phase thresholds (16/8 for 24/3). */
  phaseCount: number;
}

/**
 * Active-weapon state surfaced to the DOM HUD (ADR-0052 §6.2). Read-only view value
 * mirrored from `GameState.weapon`; the game owns the rule (stock/burst/auto-return).
 * The HUD renders it as a fuel gauge (glyph + stock), never a tension meter (N2/W4).
 */
export interface HudWeapon {
  /** Active weapon kind — drives the A/B/C glyph. */
  active: WeaponKind;
  /** Remaining stock; `Infinity` for `base` (rendered ∞, never a counter/red/blink). */
  stock: number;
}

export interface HudData {
  score: number;
  lives: number;
  timeRemaining: number;
  phase: Phase;
  wave: number;
  // Continuous energy stat 0–100 (ADR-0030 D5): the hostage taker's bavure /
  // timeout penalties drain it. Read-only view value; the game owns the rule.
  energy: number;
  levelName?: string;
  isHighScore?: boolean;
  targetIndicator?: HudTargetIndicator | undefined;
  delivery?: HudDelivery | undefined;
  hostageQte?: HudHostageQte | undefined;
  bossQte?: HudBossQte | undefined;
  // Active weapon + special stock (ADR-0052). Absent only on the pre-tick initial
  // HUD before the first loop tick populates it; the readout defaults to base/∞.
  weapon?: HudWeapon | undefined;
  // Monotonic counter bumped the tick a special empties and auto-returns to base
  // (the `weaponEmpty` transient, drained by useGameLoop). Drives the same-frame
  // HUD empty-flash (W3/AC10) — the widget re-keys its flash on each change.
  weaponEmptyNonce?: number | undefined;
}
