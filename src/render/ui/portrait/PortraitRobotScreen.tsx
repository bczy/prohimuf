import type { CSSProperties, JSX, RefObject } from "react";
import type {
  PortraitBandId,
  PortraitIntent,
  PortraitScene,
} from "@game/types/portraitRobot";
import {
  BAND_TEST_ID,
  LOCK_LINE,
  OUTCOME_STAMP,
  PALIER_LINE,
  SCREEN_TITLE,
  SUPERTITLE,
  TARGET_ALT,
  bandGroupLabel,
  chevronLabel,
  variantCounter,
} from "./copy";
import { EarlyExitButton } from "./EarlyExitButton";
import { TelecarteGauge } from "./TelecarteGauge";
import styles from "./PortraitRobotScreen.module.css";

/**
 * Band heights from the Figma (UX §9.1/§9.2), forked by DEVICE CLASS and not by a
 * CSS breakpoint: ADR-0003 decides the device once, at boot, and ADR-0046 forbids a
 * breakpoint literal in the `.module.css`. They travel as one inline custom
 * property.
 */
const BAND_HEIGHT_PX: Readonly<Record<"desktop" | "mobile", number>> = {
  mobile: 68,
  desktop: 60,
};

/** What the screen needs to DRAW one band. No correctness field exists, by design (gate A16). */
export interface PortraitBandView {
  readonly id: PortraitBandId;
  /** Player-facing label from the catalogue (`LA COUPE` …) — never the internal id. */
  readonly label: string;
  /** BASE-relative asset of the currently selected variant. */
  readonly src: string;
  /** 1-based position of the selection among the band's slots — state legibility only. */
  readonly ordinal: number;
  readonly total: number;
}

export interface PortraitRobotScreenProps {
  readonly scene: PortraitScene;
  /** Four bands in draw order, resolved from the catalogue by `usePortraitRobot`. */
  readonly bands: readonly PortraitBandView[];
  /** The reference portrait — « la page 23 ». */
  readonly targetSrc: string;
  /** Device class (ADR-0003), decided once at boot by the shell. */
  readonly isMobile: boolean;
  /** Every player request leaves here as an intent; the screen never mutates a scene. */
  readonly onIntent: (intent: PortraitIntent) => void;
  /**
   * Handed to `usePortraitGestures`, which owns the pointer listeners and needs the
   * element itself (`setPointerCapture`). The screen draws the surface; it does not
   * classify a gesture.
   */
  readonly bandStackRef?: RefObject<HTMLDivElement | null>;
}

/**
 * PORTRAIT-ROBOT — « TÊTE À CONNAÎTRE » (ADR-0079 D1, ADR-0081 D4).
 *
 * A pure DOM screen: no `<Canvas>`, no Three, no `CrtPass`. It renders a
 * `PortraitScene` and emits `PortraitIntent`s, and it holds no rule — the chrono,
 * the paliers, the two `revealSeconds` and the verdict are all read off the scene,
 * because a `switch` on the outcome here would put gate §3's numbers in the render
 * layer (ADR-0079 A5 at a smaller scale).
 *
 * Three things this component must never grow, each of them a blocking finding at
 * the panel rather than a taste call:
 *
 * 1. **No validation act.** No button, no `Enter` binding, no long-press "confirm".
 *    The scene resolves by itself at 4/4 (ADR-0079 D8.1); the early exit resolves
 *    at the CURRENT board and can never yield `IDENTIFIED`.
 * 2. **No per-band feedback, in any form** — no tint, no check, no border, no
 *    `aria` hint, no timing tell (gate A16). The scene grants exactly one signal
 *    and it is global and terminal: the phase ending. The per-band `{n} sur
 *    {total}` counter is state legibility, and it says nothing about correctness.
 * 3. **No digit on the chrono.** The gauge is a `0..1` ratio; paliers are read off
 *    `scene.palier`, never off a comparison made here.
 *
 * The four bands are ONE CONTINUOUS SURFACE: no gap, no seam, no separator rule,
 * at the exact gabarit of the target portrait beside it (Bertrand, UX §0 bis /
 * §2.3.4). A 1px gap here breaks the read of the face, which is the whole scene.
 * The anti-drift guard the old 8px gap carried lives in the gesture hook now
 * (pointerdown band lock + two-phase hysteresis), not in the layout.
 */
export function PortraitRobotScreen({
  scene,
  bands,
  targetSrc,
  isMobile,
  onIntent,
  bandStackRef,
}: PortraitRobotScreenProps): JSX.Element {
  const resolved = scene.phase === "RESOLVED";
  const outcome = scene.result?.outcome ?? null;
  const device = isMobile ? "mobile" : "desktop";

  return (
    <div
      className={styles.root}
      data-device={device}
      style={{ "--band-height": `${String(BAND_HEIGHT_PX[device])}px` } as CSSProperties}
    >
      <header className={styles.hud}>
        <h1 className={styles.title}>{SCREEN_TITLE}</h1>
        <TelecarteGauge
          remainingSeconds={scene.remainingSeconds}
          timerSeconds={scene.timerSeconds}
          palier={scene.palier}
          frozen={resolved}
        />
        <EarlyExitButton
          isMobile={isMobile}
          disabled={resolved}
          onExit={() => {
            onIntent({ kind: "ABANDON" });
          }}
        />
      </header>

      <div className={styles.stage}>
        <figure className={styles.target}>
          <img className={styles.targetImage} src={targetSrc} alt={TARGET_ALT} />
          <figcaption className={styles.supertitle}>{SUPERTITLE}</figcaption>
        </figure>

        {/*
         * The joined surface. `data-locked` carries the ONE feedback of the scene:
         * the ambient hairline becomes a thick full frame around the WHOLE stack —
         * a change of shape and thickness, never of hue alone (UX §2.5, §5.2).
         */}
        <div
          ref={bandStackRef}
          className={styles.stack}
          data-locked={outcome === "IDENTIFIED" ? "true" : "false"}
        >
          {bands.map((band) => (
            <div
              key={band.id}
              className={styles.band}
              role="group"
              data-band={BAND_TEST_ID[band.id]}
              aria-label={bandGroupLabel(band.label, band.ordinal, band.total)}
            >
              <span className={styles.bandLabel}>{band.label}</span>
              <button
                type="button"
                className={styles.chevron}
                aria-label={chevronLabel(-1, band.label)}
                disabled={resolved}
                onClick={() => {
                  onIntent({ kind: "CYCLE", band: band.id, delta: -1 });
                }}
              >
                <span aria-hidden="true">◁</span>
              </button>
              <img className={styles.bandImage} src={band.src} alt="" draggable={false} />
              <button
                type="button"
                className={styles.chevron}
                aria-label={chevronLabel(1, band.label)}
                disabled={resolved}
                onClick={() => {
                  onIntent({ kind: "CYCLE", band: band.id, delta: 1 });
                }}
              >
                <span aria-hidden="true">▷</span>
              </button>
              <span className={styles.counter}>{variantCounter(band.ordinal, band.total)}</span>
              {/* Stamps only exist once the scene is over, and only when all four
                  bands are right — four at once, never one band at a time. */}
              {outcome === "IDENTIFIED" && <span className={styles.stamp} aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>

      {/*
       * Two live regions, and exactly two. The polite one carries KENZA's palier
       * line; it changes when `scene.palier` changes — once per crossing, by
       * construction, because the palier is monotone state in the pure layer
       * (ADR-0079 D9) and not a comparison made here.
       */}
      <p className={styles.srOnly} aria-live="polite">
        {PALIER_LINE[scene.palier]}
      </p>
      {/* The assertive one carries the single terminal signal — the lock-in. */}
      <p className={styles.srOnly} aria-live="assertive">
        {outcome === "IDENTIFIED" ? LOCK_LINE : ""}
      </p>

      {outcome !== null && (
        <div className={styles.verdict} data-outcome={outcome}>
          <span className={styles.verdictStamp}>{OUTCOME_STAMP[outcome]}</span>
        </div>
      )}
    </div>
  );
}
