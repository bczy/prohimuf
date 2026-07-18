import type { JSX } from "react";
import styles from "./WaveReadout.module.css";

/** Wave counter readout. */
export function WaveReadout({ wave }: { wave: number }): JSX.Element {
  return (
    <div className={styles.item}>
      <span className={styles.label}>vague</span>
      <span className={styles.value}>{wave}</span>
    </div>
  );
}
