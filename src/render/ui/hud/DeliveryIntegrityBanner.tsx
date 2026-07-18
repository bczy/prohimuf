import type { JSX } from "react";
import type { HudDelivery } from "./types";
import { MARK } from "@render/ui/print";
import { cx } from "./cx";
import { integrityColor } from "./derivations";
import styles from "./DeliveryIntegrityBanner.module.css";

/**
 * Delivery set-piece: the centred "LIVRAISON" call-out banner with its integrity
 * gauge while DELIVERING, and the SUCCESS/FAILED verdict stamp. The gauge fill %/hue
 * flow inline as custom properties; the verdict ink stays inline.
 */
export function DeliveryIntegrityBanner({
  delivery,
}: {
  delivery: HudDelivery | undefined;
}): JSX.Element | null {
  const deliveryPhase = delivery?.phase;
  const deliveryFill =
    delivery !== undefined && delivery.integrityMax > 0 && Number.isFinite(delivery.integrity)
      ? Math.max(0, Math.min(1, delivery.integrity / delivery.integrityMax))
      : 0;

  return (
    <>
      {deliveryPhase === "DELIVERING" && (
        <div className={styles.deliveryBanner}>
          <span className={cx(styles.chip, styles.chipDelivering)}>
            LIVRAISON — PROTÉGEZ LE VÉHICULE !
          </span>
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
