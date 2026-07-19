import type { JSX } from "react";
import type { HudHostageQte } from "./types";
import { MARK } from "@render/ui/print";
import { cx } from "./cx";
import styles from "./HostageQteOverlay.module.css";

/**
 * Hostage-taker QTE set-piece stamps: the dim vignette wash over the frozen scene,
 * the "OTAGE" warning stamp, and the WON/LOST verdict. Only the two set-piece stamps
 * remain on the HUD (UX spec §1) — no captor-HP/countdown/hostage-HP gauges.
 */
/**
 * True while the QTE set-piece owns the screen (zoom, duel, verdict). Shared with
 * HUD.tsx, which hides the off-screen arrow ring for exactly this window — the
 * frozen duel has no steerable target, and the arrows would poke into the tableau.
 */
export function isQteSetPieceVisible(hostageQte: HudHostageQte | undefined): boolean {
  const qtePhase = hostageQte?.phase;
  return (
    qtePhase === "ZOOMING" || qtePhase === "ACTIVE" || qtePhase === "WON" || qtePhase === "LOST"
  );
}

export function HostageQteOverlay({
  hostageQte,
}: {
  hostageQte: HudHostageQte | undefined;
}): JSX.Element | null {
  const qtePhase = hostageQte?.phase;

  if (!isQteSetPieceVisible(hostageQte) || hostageQte === undefined) return null;

  return (
    <>
      {/* Dim wash over the frozen scene — a soft vignette that keeps the
          centred, zoomed captor readable (transparent core). The bottom-centre
          gauge stack is intentionally GONE (UX spec §1): the sole clock is the
          blown-peeks count, read diegetically in-world (Flag B), no HUD
          surrogate. The rgba is INK-black at partial alpha — a gradient literal
          with no clean token, so it stays inline (not re-declared in CSS). */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(20,18,16,0) 42%, rgba(20,18,16,0.5) 100%)",
        }}
      />

      {hostageQte.warning && (
        <div className={styles.centerOverlay}>
          <div className={cx(styles.chip, styles.chipOtage)}>OTAGE</div>
        </div>
      )}

      {(qtePhase === "WON" || qtePhase === "LOST") && (
        // The verdict is the payoff of the whole set-piece: a big centred
        // stamp (same register as the OTAGE warning / end-of-level message)
        // over the zoomed tableau, not a small ticker chip nobody reads.
        <div className={styles.centerOverlay}>
          <div
            className={cx(styles.chip, styles.chipVerdict)}
            style={{ color: qtePhase === "WON" ? MARK.green : MARK.pink }}
          >
            {qtePhase === "WON" ? "OTAGE SAUVÉE" : "OTAGE PERDUE"}
          </div>
        </div>
      )}
    </>
  );
}
