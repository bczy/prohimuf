import type { JSX } from "react";
import { energyColor } from "./derivations";
import styles from "./EnergyGauge.module.css";

/**
 * Energy readout (0–100) with the value chip and its fill gauge. The fill % and the
 * state-driven hue flow as inline CSS custom properties the class reads; the
 * transition duration stays inline (per-gauge, not a token — a gauge-specific
 * easing preference, not shared).
 */
export function EnergyGauge({ energy }: { energy: number }): JSX.Element {
  // Clamp AND guard non-finite: a NaN stat would make the gauge width `NaN%`, an
  // invalid CSS value the browser silently drops (gauge renders empty).
  const energyFill = Number.isFinite(energy) ? Math.max(0, Math.min(100, energy)) : 0;
  const energyHue = energyColor(energyFill);

  return (
    <div className={styles.item}>
      <span className={styles.label}>énergie</span>
      <div className={styles.energyWrap}>
        {/* State-driven ink colour (energyColor ramp) stays inline — no static token equivalent. */}
        <span className={styles.energyValue} style={{ color: energyHue }}>
          ⚡{Math.round(energyFill)}
        </span>
        <div className={styles.energyTrack}>
          {/* State-driven fill % and hue flow as CSS variables; transition is per-gauge
              (120ms), not shared, so it stays inline with the computed values. */}
          <div
            className={styles.gaugeFill}
            style={
              {
                "--gauge-fill": `${String(energyFill)}%`,
                "--gauge-hue": energyHue,
                transition: "width 120ms linear",
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
