import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";
import type { QtePhase } from "@game/types/hostageQte";

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
}
