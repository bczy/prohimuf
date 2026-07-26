import type { JSX } from "react";
import type { HudDelivery, HudTargetIndicator } from "./types";
import { MARK } from "@render/ui/print";
import { ARROW_ROTATION, ArrowGlyphSvg } from "./arrowGlyph";
import { cx } from "./cx";
import { integrityColor } from "./derivations";
import styles from "./DeliveryIntegrityBanner.module.css";

/**
 * Direction cue toward the delivery rendez-vous (telegraph spec D2.3): at most two
 * glyphs — one per axis, the axes being pairwise exclusive by construction — hung
 * beside the chip, never at the screen edges (that ring means "nearest enemy").
 *
 * Zero motion by requirement (D3.3 / A9, correction T-4): the appearance and the
 * disappearance are discrete state changes, so this glyph does NOT inherit
 * `OffscreenArrowIndicator`'s ungated 120 ms opacity/transform fade — only its
 * shape token. `.directionGlyph` states `transition: none` unconditionally, which
 * holds in BOTH motion modes rather than only under `prefers-reduced-motion`.
 */
function DirectionGlyph({
  direction,
}: {
  direction: "up" | "down" | "left" | "right";
}): JSX.Element {
  return (
    <span className={styles.directionGlyph} style={{ transform: ARROW_ROTATION[direction] }}>
      <ArrowGlyphSvg />
    </span>
  );
}

/**
 * Delivery set-piece: the centred "LIVRAISON" call-out banner and the SUCCESS/FAILED
 * verdict stamp. The gauge fill %/hue flow inline as custom properties; the verdict
 * ink stays inline.
 *
 * The banner renders from the FIRST `INCOMING` tick (telegraph spec D1), not only
 * while `DELIVERING`: the player who learns the objective exists at the tick the
 * gauge starts draining cannot physically reach the van (guidelines rule 4/6). During
 * `INCOMING` the same chip + gauge track render with a distinct label and a full,
 * static gauge — integrity is still at max because damage is phase-gated, so the
 * existing fill computation already yields 1.0 with no new field. The container is
 * ONE element across both phases, so the `INCOMING → DELIVERING` swap changes the
 * chip's content without unmounting/remounting the banner (D1.3 — no flash/gap).
 */
export function DeliveryIntegrityBanner({
  delivery,
  deliveryDirection,
}: {
  delivery: HudDelivery | undefined;
  deliveryDirection?: HudTargetIndicator | undefined;
}): JSX.Element | null {
  const deliveryPhase = delivery?.phase;
  const inFlight = deliveryPhase === "INCOMING" || deliveryPhase === "DELIVERING";
  const deliveryFill =
    delivery !== undefined && delivery.integrityMax > 0 && Number.isFinite(delivery.integrity)
      ? Math.max(0, Math.min(1, delivery.integrity / delivery.integrityMax))
      : 0;

  return (
    <>
      {inFlight && (
        <div className={styles.deliveryBanner}>
          <div className={styles.chipRow}>
            {/* Distinguished by TEXT, not by hue (D3.1/A3): the two labels differ in
                copy, so the chip reads in grayscale. An `INCOMING`-vs-`DELIVERING`
                ink is reinforcement only and stays `lead-art`'s call — shipping one
                here would guess a hue against the shell stock's contrast floor. */}
            <span className={cx(styles.chip, styles.deliveryChip)}>
              {deliveryPhase === "INCOMING"
                ? "LIVRAISON EN APPROCHE"
                : "LIVRAISON — PROTÉGEZ LE VÉHICULE !"}
            </span>
            {deliveryDirection !== undefined && (
              <span className={styles.deliveryDirection}>
                {deliveryDirection.left && <DirectionGlyph direction="left" />}
                {deliveryDirection.right && <DirectionGlyph direction="right" />}
                {deliveryDirection.up && <DirectionGlyph direction="up" />}
                {deliveryDirection.down && <DirectionGlyph direction="down" />}
              </span>
            )}
          </div>
          <div className={styles.deliveryTrack}>
            <div
              className={styles.gaugeFill}
              style={
                {
                  "--gauge-fill": `${String(deliveryFill * 100)}%`,
                  "--gauge-hue": integrityColor(deliveryFill),
                  transition: "width 100ms linear",
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      )}

      {(deliveryPhase === "SUCCESS" || deliveryPhase === "FAILED") && (
        <div
          className={cx(styles.chip, styles.deliveryVerdict)}
          style={{ color: deliveryPhase === "SUCCESS" ? MARK.green : MARK.pink }}
        >
          {deliveryPhase === "SUCCESS" ? "LIVRAISON SÉCURISÉE" : "LIVRAISON PERDUE"}
        </div>
      )}
    </>
  );
}
