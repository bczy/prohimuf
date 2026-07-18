import type { JSX } from "react";
import { timeColor } from "./derivations";
import styles from "./TimerReadout.module.css";

/** Time-remaining readout; the ink warms as the clock runs down (view mapping). */
export function TimerReadout({ timeRemaining }: { timeRemaining: number }): JSX.Element {
  return (
    <div className={styles.item}>
      <span className={styles.label}>temps</span>
      <span className={styles.value} style={{ color: timeColor(timeRemaining) }}>
        {Math.ceil(timeRemaining)}s
      </span>
    </div>
  );
}
