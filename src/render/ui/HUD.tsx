import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";
import type { QtePhase } from "@game/types/hostageQte";
import styles from "./HUD.module.css";
import { ScoreReadout } from "./hud/ScoreReadout";
import { WaveReadout } from "./hud/WaveReadout";
import { TimerReadout } from "./hud/TimerReadout";
import { LivesReadout } from "./hud/LivesReadout";
import { EnergyGauge } from "./hud/EnergyGauge";
import { DeliveryIntegrityBanner } from "./hud/DeliveryIntegrityBanner";
import { HostageQteOverlay } from "./hud/HostageQteOverlay";
import { OffscreenArrowIndicator } from "./hud/OffscreenArrowIndicator";
import { PhaseMessageBanner } from "./hud/PhaseMessageBanner";

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

/**
 * In-game HUD — the print system carried into gameplay (ADR-0021 / art-direction §2bis).
 * A solid paper ticker strip in ink, no neon and ZERO glow (no text-shadow, box-shadow
 * or drop-shadow). Urgency is spoken with the semantic marker inks (MARK.*), never light;
 * transient call-outs are stamped paper chips so they read over any scene without a halo.
 *
 * Thin composition (P2): each readout/overlay is its own widget under `./hud/`, with a
 * co-located CSS Module (ADR-0046). The render-side ramp/derivation functions live in
 * `./hud/derivations.ts` (view mapping, never in `src/game`, never in CSS). This file
 * only wires the widgets and owns the top ticker strip container + the `niveau` item.
 */
export function HUD({ data }: { data: HudData }): JSX.Element {
  return (
    <>
      <div className={styles.hud}>
        <ScoreReadout score={data.score} isHighScore={data.isHighScore === true} />
        {data.levelName !== undefined && (
          <div className={styles.item}>
            <span className={styles.label}>niveau</span>
            <span className={styles.levelName}>{data.levelName}</span>
          </div>
        )}
        <WaveReadout wave={data.wave} />
        <TimerReadout timeRemaining={data.timeRemaining} />
        <LivesReadout lives={data.lives} />
        <EnergyGauge energy={data.energy} />
      </div>

      <DeliveryIntegrityBanner delivery={data.delivery} />

      <HostageQteOverlay hostageQte={data.hostageQte} />

      <OffscreenArrowIndicator targetIndicator={data.targetIndicator} />

      <PhaseMessageBanner phase={data.phase} />
    </>
  );
}
