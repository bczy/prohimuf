import type { JSX } from "react";
import styles from "./VuMeter.module.css";

export interface VuMeterProps {
  /** Row title — also the slider's accessible name. */
  label: string;
  /** Sub-label caption. */
  hint: string;
  /** Current value, 0..1. */
  value: number;
  /** Commit a new 0..1 value. */
  onChange: (v: number) => void;
}

/**
 * The shared inked VU-meter slider (ADR-0054 §4): a native `<input type="range">`
 * under the print skin, so it keeps its implicit `role="slider"` + value announcement.
 * ≥44px row height. Rules relocated verbatim from OptionsColophon.module.css.
 */
export function VuMeter({ label, hint, value, onChange }: VuMeterProps): JSX.Element {
  const pct = Math.round(value * 100);
  return (
    <div className={styles.vuMeter}>
      <div className={styles.optLabel}>
        {label} — {pct}%
      </div>
      <div className={styles.optHint}>{hint}</div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        aria-label={label}
        onChange={(e) => {
          onChange(Number(e.target.value) / 100);
        }}
        className={styles.slider}
      />
    </div>
  );
}
