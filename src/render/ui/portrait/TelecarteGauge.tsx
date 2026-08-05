import type { CSSProperties, JSX } from "react";
import type { PortraitPalier } from "@game/types/portraitRobot";
import { GAUGE_LABEL, PALIER_VALUETEXT } from "./copy";
import styles from "./TelecarteGauge.module.css";

export interface TelecarteGaugeProps {
  /** Seconds left on the scene's chrono — internal value, NEVER rendered (gate A6/A13). */
  readonly remainingSeconds: number;
  /** The chrono's starting value, i.e. the gauge's full extent. */
  readonly timerSeconds: number;
  /** Tension threshold reached, read off the scene — the gauge derives no threshold of its own. */
  readonly palier: PortraitPalier;
  /** `true` once the scene is resolved: the ink stops leaving, the outline stays (art brief §4bis). */
  readonly frozen: boolean;
}

/**
 * The télécarte gauge (gate A13 / ADR-0082 D4/D5).
 *
 * A card that EMPTIES, not a counter that decrements: the ink leaves, the outline
 * stays. It renders **no number, no unit, no segment** — the only thing that
 * crosses into the DOM is a `0..1` ratio, as an inline CSS custom property
 * (ADR-0046's one sanctioned escape hatch for a runtime value).
 *
 * The palier styling comes from `scene.palier`, never from a comparison this
 * component makes: a `remainingSeconds <= 10` here would restyle on a frame of its
 * own and, worse, would be the template for an `aria-live` firing every frame
 * (ADR-0079 D9).
 *
 * `aria-valuenow` carries the seconds because a screen-reader user navigating to
 * the element deserves the state on demand; `aria-valuetext` overrides how it is
 * SPOKEN with a qualitative step (UX §5.5.3), so no number is ever read aloud
 * either. That asymmetry is deliberate, not an oversight.
 */
export function TelecarteGauge({
  remainingSeconds,
  timerSeconds,
  palier,
  frozen,
}: TelecarteGaugeProps): JSX.Element {
  const ratio = timerSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / timerSeconds)) : 0;

  return (
    <div className={styles.root} data-palier={palier} data-frozen={frozen ? "true" : "false"}>
      <span className={styles.label}>{GAUGE_LABEL}</span>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={GAUGE_LABEL}
        aria-valuemin={0}
        aria-valuemax={timerSeconds}
        aria-valuenow={remainingSeconds}
        aria-valuetext={PALIER_VALUETEXT[palier]}
        style={{ "--gauge-ratio": ratio } as CSSProperties}
      >
        <div className={styles.ink} />
      </div>
    </div>
  );
}
