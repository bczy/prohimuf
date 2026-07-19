import type { JSX } from "react";
import type { HudBossQte } from "./types";
import { integrityColor } from "./derivations";
import styles from "./BossHpBar.module.css";

/**
 * Boss-QTE health bar — "le Commandant" (ADR-0051). Renders ONLY while the boss QTE
 * holds the scene (`bossQte !== undefined`), so it never lingers as an orphaned HUD
 * element. Bertrand's 2026-07-19 override of the diegetic-only §0 ruling
 * (`docs/game-design/ux/spec-boss-qte-hp-read.md`): this bar ships IN ADDITION to the
 * diegetic posture / phase-break-pulse reads (D1-D3 unchanged).
 *
 * A centred paper call-out matching the delivery-integrity banner vocabulary (a chip
 * label over a keylined track). The fill %/hue flow inline as custom properties the
 * class reads (same gauge shape as `EnergyGauge` / `DeliveryIntegrityBanner`); the ink
 * warms green→orange→pink as HP drains (the shared `integrityColor` ramp — a health bar
 * draining warm is the same semantic as the vehicle integrity gauge). The bar is
 * segmented at the phase thresholds (derived purely from `phaseCount` — evenly spaced,
 * i/phaseCount — matching the HP thresholds the game owns; the render never re-encodes
 * them). No game rule is decided here — every value is read from `bossQteSystem` state.
 */
export function BossHpBar({ bossQte }: { bossQte: HudBossQte | undefined }): JSX.Element | null {
  if (bossQte === undefined) return null;

  const { bossHp, bossHpMax, phaseCount } = bossQte;
  // Clamp AND guard non-finite: a NaN would make the fill width `NaN%`, an invalid CSS
  // value the browser silently drops (bar renders empty).
  const fill01 =
    bossHpMax > 0 && Number.isFinite(bossHp) ? Math.max(0, Math.min(1, bossHp / bossHpMax)) : 0;
  // Interior phase dividers: phaseCount − 1 ticks at i/phaseCount (24 HP / 3 phases →
  // 33 % and 67 %, the 8/16 thresholds). Guard a degenerate phaseCount (< 2 → none).
  const dividerCount = Number.isFinite(phaseCount) ? Math.max(0, Math.floor(phaseCount) - 1) : 0;

  return (
    <div className={styles.bossBar}>
      <span className={styles.label}>— LE COMMANDANT —</span>
      <div className={styles.track}>
        <div
          className={styles.gaugeFill}
          style={
            {
              "--gauge-fill": `${String(fill01 * 100)}%`,
              "--gauge-hue": integrityColor(fill01),
              transition: "width 120ms linear",
            } as React.CSSProperties
          }
        />
        {Array.from({ length: dividerCount }, (_, i) => (
          <div
            key={i}
            className={styles.divider}
            style={{ left: `${String(((i + 1) / phaseCount) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
