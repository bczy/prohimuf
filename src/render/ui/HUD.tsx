import type { JSX } from "react";
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

// HUD view types now live in ./hud/types (drops the type-only import cycle: widgets
// import the shapes from there, not from this component). Re-exported so external
// consumers keep importing them from `@render/ui/HUD` unchanged.
export type { HudData, HudDelivery, HudHostageQte, HudTargetIndicator } from "./hud/types";
import type { HudData } from "./hud/types";

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

      {/* Rendered before the delivery banner: both are center-anchored fixed
          siblings near y=58, and the enlarged up-arrow overlaps the banner's track —
          the delivery readout must paint on top of the direction cue. */}
      <OffscreenArrowIndicator targetIndicator={data.targetIndicator} />

      <DeliveryIntegrityBanner delivery={data.delivery} />

      <HostageQteOverlay hostageQte={data.hostageQte} />

      <PhaseMessageBanner phase={data.phase} />
    </>
  );
}
