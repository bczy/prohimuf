import type { CSSProperties, JSX } from "react";
import { livesColor, splitHearts } from "./derivations";
import styles from "./LivesReadout.module.css";

/**
 * Lives readout (♥ hearts); the ink goes pink on the last life (view mapping).
 *
 * Lives are fractional (quarter-heart steps — enemy return fire costs 0.25 to 1
 * heart depending on the shooter's archetype), so the readout draws N full
 * glyphs plus, when there is a remainder, one partially-filled glyph: a dimmed
 * ♥ with a solid copy clipped to the remaining fraction laid over it. The
 * fraction travels as an inline CSS custom property (ADR-0046 — dynamic values
 * are inline custom properties, the styling itself stays in the CSS Module).
 *
 * At full (integral) health the markup is exactly the plain glyph run, so the
 * readout still reads "♥♥♥" for a 3-heart start.
 */
export function LivesReadout({ lives }: { lives: number }): JSX.Element {
  const { full, partial } = splitHearts(lives);

  return (
    <div className={styles.item}>
      <span className={styles.label}>vies</span>
      <span className={styles.value} style={{ color: livesColor(lives) }}>
        {"♥".repeat(full)}
        {partial > 0 && (
          <span className={styles.partial} style={{ "--fill": partial } as CSSProperties}>
            <span className={styles.partialEmpty} aria-hidden="true">
              ♥
            </span>
            <span className={styles.partialFill} aria-hidden="true">
              ♥
            </span>
          </span>
        )}
      </span>
    </div>
  );
}
