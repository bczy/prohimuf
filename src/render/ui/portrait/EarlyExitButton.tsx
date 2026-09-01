import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX, MouseEvent as ReactMouseEvent } from "react";
import { EXIT_ARIA_LABEL, EXIT_ARMED_ANNOUNCE, EXIT_ARMED_LABEL, EXIT_LABEL } from "./copy";
import styles from "./EarlyExitButton.module.css";

/**
 * The arming window (gate A17 / UX §2.8.3). It is IHM sub-state — it exists
 * nowhere in `PortraitScene`, it modifies no board, and the chrono keeps emptying
 * behind it (a pause would make this a "freeze time to think" button, which is the
 * one thing A17 forbids). That is why the number lives in the render layer and not
 * beside gate §3's tuning: it times a widget, not the game.
 */
export const ARM_WINDOW_MS = 2000;

export interface EarlyExitButtonProps {
  readonly isMobile: boolean;
  /** Fired when the exit is confirmed — the caller dispatches `ABANDON`. */
  readonly onExit: () => void;
  /** Input is frozen once the scene resolves (UX §2.5 point 1). */
  readonly disabled: boolean;
}

/**
 * Early exit — « ça part comme ça » (UX §2.8, fiction §6.2).
 *
 * **It is not a CTA and must never grow into one.** No filled background, no glow,
 * no full-width pill, corner of the HUD, out of the target↔bands reading axis,
 * never the default focus. What makes it legal under the anti-CTA criterion (gate
 * A17c) is its FUNCTION: it resolves at the current board exactly like the buzzer,
 * so it can never produce `IDENTIFIED` — a 4/4 board would already have resolved
 * on the entry that produced it.
 *
 * Two confirmation regimes, asymmetric on purpose (UX §2.8.4):
 * - **pointer**: first press arms for 2 s, second press on the same target fires.
 *   A thumb mistap in the corner of a landscape screen costs the whole scene,
 *   definitively.
 * - **keyboard**: `Enter`/`Space` on the focused button fires in ONE press. A
 *   timed two-step is hostile to screen readers and to motor impairment — stacking
 *   temporal precision on spatial precision would trade a mistap problem for a
 *   worse accessibility problem. `event.detail === 0` is how the DOM tells us the
 *   activation came from the keyboard rather than from a real pointer.
 *
 * `Escape` follows the keyboard regime too, but it is a window-level binding and
 * belongs to `usePortraitGestures` — not to this component.
 */
export function EarlyExitButton({ isMobile, onExit, disabled }: EarlyExitButtonProps): JSX.Element {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const disarm = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setArmed(false);
  }, []);

  useEffect(() => disarm, [disarm]);

  // Resolution freezes every input path, arming included.
  useEffect(() => {
    if (disabled) disarm();
  }, [disabled, disarm]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>): void => {
      if (disabled) return;
      // detail === 0 ⇒ keyboard activation: deliberate by construction, fires at once.
      if (event.detail === 0) {
        disarm();
        onExit();
        return;
      }
      if (armed) {
        disarm();
        onExit();
        return;
      }
      setArmed(true);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        // Disarming is silent but VISIBLE: a player coming back late must not find
        // the target still armed and get a result they did not expect (UX §2.8.3bis).
        setArmed(false);
      }, ARM_WINDOW_MS);
    },
    [armed, disabled, disarm, onExit],
  );

  const device = isMobile ? "mobile" : "desktop";

  // `aria-pressed` below is the ONE of the whole scene, and it is a transient state
  // of THIS button — never a band state, which gate A8/A16 forbids exposing. It is
  // absent at rest rather than `"false"`, so the attribute's mere presence in the
  // DOM cannot be cited as a per-band precedent.
  return (
    <>
      <button
        type="button"
        className={styles.root}
        data-armed={armed ? "true" : "false"}
        aria-label={EXIT_ARIA_LABEL}
        aria-pressed={armed ? true : undefined}
        disabled={disabled}
        onClick={handleClick}
      >
        <span className={styles.glyph} aria-hidden="true" />
        <span className={styles.label}>
          {armed ? EXIT_ARMED_LABEL[device] : EXIT_LABEL[device]}
        </span>
      </button>
      {/*
       * The arming is announced once, and only on the pointer path — the keyboard
       * path resolves immediately, so it has no intermediate state to describe.
       */}
      <span className={styles.srOnly} aria-live="polite">
        {armed ? EXIT_ARMED_ANNOUNCE : ""}
      </span>
    </>
  );
}
