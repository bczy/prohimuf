import type { JSX } from "react";
import styles from "./HUD.module.css";
import { ScoreReadout } from "./hud/ScoreReadout";
import { WaveReadout } from "./hud/WaveReadout";
import { TimerReadout } from "./hud/TimerReadout";
import { LivesReadout } from "./hud/LivesReadout";
import { EnergyGauge } from "./hud/EnergyGauge";
import { WeaponReadout } from "./hud/WeaponReadout";
import { DeliveryIntegrityBanner } from "./hud/DeliveryIntegrityBanner";
import { HostageQteOverlay, isQteSetPieceVisible } from "./hud/HostageQteOverlay";
import { OffscreenArrowIndicator } from "./hud/OffscreenArrowIndicator";
import { PhaseMessageBanner } from "./hud/PhaseMessageBanner";
import { BossHpBar } from "./hud/BossHpBar";
import { PhotoHud } from "./photo/PhotoHud";

// HUD view types now live in ./hud/types (drops the type-only import cycle: widgets
// import the shapes from there, not from this component). Re-exported so external
// consumers keep importing them from `@render/ui/HUD` unchanged.
export type {
  HudData,
  HudDelivery,
  HudHostageQte,
  HudBossQte,
  HudPhotoQte,
  HudTargetIndicator,
} from "./hud/types";
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
        {/* Active-weapon fuel gauge (ADR-0055). Defaults to base/∞ before the first
            loop tick populates `data.weapon`. */}
        <WeaponReadout
          weapon={data.weapon ?? { active: "base", stock: Number.POSITIVE_INFINITY }}
          emptyNonce={data.weaponEmptyNonce ?? 0}
        />
      </div>

      {/* Rendered before the delivery banner: both are center-anchored fixed
          siblings near y=58, and the enlarged up-arrow overlaps the banner's track —
          the delivery readout must paint on top of the direction cue. */}
      {/* Hidden for the whole QTE set-piece (zoom → duel → verdict): the scene is
          frozen on the tableau, so the direction cue is meaningless there and the
          enlarged arrows would poke into it. Back as soon as the verdict clears. The
          BOSS QTE (ADR-0051) freezes the scene on the same locked camera, so gate on it
          too — `bossQte` is undefined exactly while it is inactive (Tony story-2 UX). */}
      {/* The PHOTO set-piece (ADR-0077) is the third frozen-scene block and takes the same
          gate: the world is not only frozen there, it is switched OFF behind an opaque
          plate, so an arrow pointing at an enemy nobody can see or shoot is pure noise
          over the viewfinder. `photoQte` is undefined exactly while it is inactive. */}
      {!isQteSetPieceVisible(data.hostageQte) &&
        data.bossQte === undefined &&
        data.photoQte === undefined && (
          <OffscreenArrowIndicator targetIndicator={data.targetIndicator} />
        )}

      {/* The banner also carries the off-screen cue toward the delivery point
          (telegraph spec D2.3): anchored on the objective's own call-out, NOT on the
          edge ring above — that ring means "nearest enemy to shoot". */}
      <DeliveryIntegrityBanner
        delivery={data.delivery}
        deliveryDirection={data.deliveryDirection}
      />

      <HostageQteOverlay hostageQte={data.hostageQte} />

      {/* Boss-QTE HP bar (ADR-0051) — only while the boss QTE holds the scene
          (`bossQte` present); renders null otherwise (no orphan HUD). */}
      <BossHpBar bossQte={data.bossQte} />

      {/* Photo set-piece diegetic dress (UX §2) — film counter, suspicion needle and the
          engraved focal label. Renders null while the set-piece is not holding the scene. */}
      <PhotoHud photoQte={data.photoQte} />

      <PhaseMessageBanner phase={data.phase} />
    </>
  );
}
