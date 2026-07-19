import type { JSX } from "react";
import { livesColor } from "./derivations";
import styles from "./LivesReadout.module.css";

/** Lives readout (♥ hearts); the ink goes pink on the last life (view mapping). */
export function LivesReadout({ lives }: { lives: number }): JSX.Element {
  return (
    <div className={styles.item}>
      <span className={styles.label}>vies</span>
      {/* State-driven ink colour (livesColor ramp) stays inline — no static token equivalent. */}
      <span className={styles.value} style={{ color: livesColor(lives) }}>
        {"♥".repeat(Math.max(0, lives))}
      </span>
    </div>
  );
}
