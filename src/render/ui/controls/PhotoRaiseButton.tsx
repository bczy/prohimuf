import { useState } from "react";
import type { JSX, RefObject } from "react";
import type { PhotoControlChannel } from "@hooks/useGameLoop";
import styles from "./PhotoRaiseButton.module.css";

/**
 * The mobile raise/lower control (UX §1.4, correction T-2) — **mobile only**: desktop holds
 * Space and never renders this.
 *
 * Tap-to-toggle, not hold. That is the whole point of T-2: a held button cost a third
 * sustained contact on a hand-held landscape phone (raise thumb + pan + pinch/tap), and a
 * thumb that drifted off silently disarmed the shutter for 0.40 s at the worst moment. A
 * toggle adds **zero** sustained contacts, so framing + zooming + shooting never needs more
 * than the two the canvas gesture layer already multiplexes.
 *
 * It writes the LATCH and nothing else: `PhotoControlChannel.raiseToggle`. The posture
 * itself is the pure layer's (`raiseIntent` → `RAISED`/`LOWERED`, D-B), which is why the
 * icon here is driven by `posture` read back from the tick rather than by the local latch —
 * if the bridge clears the latch on pause (T-5), the icon follows the truth, not the tap.
 *
 * Accessibility: ≥56 px (the recommended target above the 44 px floor — a mis-tap mid-reframe
 * costs exactly what the round-1 drift-off cost), two code-drawn icon states (ADR-0020
 * precedent, no copy), both legible in grayscale — no colour-only tell (A3bis/A6). Carries
 * `data-muf-ui` so the touch gesture layer exempts it from `preventDefault` (frozen
 * cross-lane contract).
 */
export function PhotoRaiseButton({
  channelRef,
  posture,
}: {
  channelRef: RefObject<PhotoControlChannel>;
  /** The tick's posture — the single source of the icon state. */
  posture: "LOWERED" | "RAISED";
}): JSX.Element {
  // Re-render on tap so the pressed state is felt immediately; the icon still follows
  // `posture`, so a latch the bridge cleared can never leave a lying icon on screen.
  const [, bumpPressed] = useState(0);
  const raised = posture === "RAISED";

  return (
    <button
      type="button"
      className={styles.button}
      data-muf-ui
      aria-pressed={raised}
      aria-label={raised ? "Baisser l'appareil" : "Lever l'appareil"}
      onClick={() => {
        channelRef.current.raiseToggle = !channelRef.current.raiseToggle;
        bumpPressed((n) => n + 1);
      }}
    >
      {/* Code-drawn icon, two states told apart by SHAPE: the camera body at the eye
          (raised: viewfinder up, framing lines out) vs at the chest (lowered: body low,
          strap slack). No copy, no colour tell. */}
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden={true} focusable="false">
        {raised ? (
          <g className={styles.glyph}>
            {/* Body held up at eye level, with the two framing lines of an active finder. */}
            <rect x="7" y="10" width="20" height="13" rx="1.5" />
            <circle cx="17" cy="16.5" r="4.5" />
            <path d="M11 7h5" />
            <path d="M2 9l4 3M32 9l-4 3" />
          </g>
        ) : (
          <g className={styles.glyph}>
            {/* Body hanging low, strap slack: same object, unmistakably not at the eye. */}
            <rect x="7" y="18" width="20" height="11" rx="1.5" />
            <circle cx="17" cy="23.5" r="3.5" />
            <path d="M9 18C9 11 13 6 17 6s8 5 8 12" />
          </g>
        )}
      </svg>
    </button>
  );
}
