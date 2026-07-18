import type { JSX } from "react";
import styles from "./ScoreReadout.module.css";

/** Score ticker readout (zero-padded) with the optional ★HI high-score flag. */
export function ScoreReadout({
  score,
  isHighScore,
}: {
  score: number;
  isHighScore: boolean;
}): JSX.Element {
  return (
    <div className={styles.item}>
      <span className={styles.label}>score</span>
      <div className={styles.scoreRow}>
        <span className={styles.value}>{String(score).padStart(4, "0")}</span>
        {isHighScore && <span className={styles.hiFlag}>★HI</span>}
      </div>
    </div>
  );
}
