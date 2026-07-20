import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import type { HudWeapon } from "./types";
import { weaponGlyph, isLowStock } from "./derivations";
import styles from "./WeaponReadout.module.css";

/**
 * Active-weapon readout (ADR-0052 §6.2) — a fuel gauge, not a tension meter (N2):
 * the A/B/C glyph plus the special stock. Rules:
 *  - base (∞) shows the ∞ symbol with NO counter, NO red, NO blink, ever (W4/AC11);
 *  - a special shows its numeric stock, which blinks in the last ~20 % (fuel warning,
 *    `isLowStock` reads the start-stock denominator from the game data table);
 *  - the tick a special empties and auto-returns to base, a one-shot empty-flash
 *    fires the SAME frame as the return (W3/AC10) — the player never discovers the
 *    return by a silently-failed shot. Driven by `emptyNonce` (the drained
 *    `weaponEmpty` transient); the flash element re-keys on each bump to replay the
 *    animation, mirroring App's lifeFlash red-vignette pattern.
 *
 * Print-system idiom (ADR-0021/§2bis): ink on the paper strip, ZERO glow.
 */
export function WeaponReadout({
  weapon,
  emptyNonce,
}: {
  weapon: HudWeapon;
  emptyNonce: number;
}): JSX.Element {
  const isBase = weapon.active === "base";
  const low = isLowStock(weapon.active, weapon.stock);

  // Replay the empty-flash on each nonce bump (one-shot animation via a fresh key).
  const [flashKey, setFlashKey] = useState(0);
  const prevNonce = useRef(emptyNonce);
  useEffect(() => {
    if (emptyNonce !== prevNonce.current) {
      prevNonce.current = emptyNonce;
      setFlashKey((k) => k + 1);
    }
  }, [emptyNonce]);

  return (
    <div className={styles.item}>
      <span className={styles.label}>arme</span>
      <div className={styles.readout}>
        <span className={styles.glyph}>{weaponGlyph(weapon.active)}</span>
        {isBase ? (
          <span className={styles.infinity}>∞</span>
        ) : (
          <span className={low ? styles.stockLow : styles.stock}>
            {Number.isFinite(weapon.stock) ? Math.max(0, Math.round(weapon.stock)) : 0}
          </span>
        )}
      </div>
      {flashKey > 0 && <div key={flashKey} className={styles.emptyFlash} aria-hidden="true" />}
    </div>
  );
}
