import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";
import { cx } from "./cx";
import { phaseMessage } from "./derivations";
import styles from "./PhaseMessageBanner.module.css";

/** End-of-level centred stamp (GAME_OVER / LEVEL_COMPLETE); ink stays inline. */
export function PhaseMessageBanner({ phase }: { phase: Phase }): JSX.Element | null {
  const msg = phaseMessage(phase);
  if (msg === null) return null;

  return (
    <div className={styles.centerOverlay}>
      <div className={cx(styles.chip, styles.chipMessage)} style={{ color: msg.color }}>
        {msg.text}
      </div>
    </div>
  );
}
