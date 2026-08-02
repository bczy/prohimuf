import type { CSSProperties, JSX } from "react";
import type { HudPhotoQte } from "@render/ui/hud/types";
import { cx } from "@render/ui/hud/cx";
import styles from "./PhotoHud.module.css";

/**
 * The photo set-piece's DIEGETIC dress (UX §2): the camera's own three instruments, drawn
 * over the telephoto surface. Not a HUD bar stack — a 1998 SLR's dials
 * (`spec-hostage-qte-hud-readability.md` D1: diegetic reads over abstract bars).
 *
 * - **Film counter** (top-left, §2.1): the mechanical exposure-count window. The ONLY
 *   numeral on this HUD, visible in both postures, decrementing on every release.
 * - **Suspicion needle** (top-right, §2.2): an analogue needle whose ANGLE is the whole
 *   read. **T-4, binding:** this is NOT a light meter — no lux/EV marking, no aperture or
 *   sun glyph, no exposure vocabulary anywhere in this dress. It reads shutter-noise
 *   against the sound cover, and a player taught "shoot where it's bright" has been lied
 *   to by the dress. The far-end risk band is a HATCH (shape), so the read survives
 *   grayscale (A6) and never depends on hue.
 * - **Focal label** (§4.2 fiction): the engraved millimetre value.
 *
 * **A7 — no numeral for suspicion, sway or the hold timer, anywhere**: the needle has no
 * scale numbers and its value never reaches the DOM as text. The render adds no rule: the
 * needle draws `suspicion / suspicionMax` as handed over, and it visibly holds still while
 * `LOWERED` because the TICK freezes the value there (spec §1.2) — there is no render-side
 * posture branch on the needle, and there must never be one.
 */
export function PhotoHud({ photoQte }: { photoQte: HudPhotoQte | undefined }): JSX.Element | null {
  if (photoQte === undefined) return null;

  const span = photoQte.suspicionMax > 0 ? photoQte.suspicion / photoQte.suspicionMax : 0;
  const fraction = Number.isFinite(span) ? Math.max(0, Math.min(1, span)) : 0;
  // The needle sweeps a 90° arc, -45° (rest) → +45° (spotted).
  const angleDeg = -45 + fraction * 90;

  return (
    <div className={styles.dress}>
      {/* Film counter — the sole moment-to-moment "how many chances left" read (§2.1).
          `POSES` is the dial's engraved caption, not a second readout (T-6). */}
      <div className={styles.counter}>
        <span className={styles.caption}>poses</span>
        <span className={styles.counterWindow}>{photoQte.film}</span>
      </div>

      {/* Suspicion — needle only, no numeral, no exposure vocabulary (T-4/A7). */}
      <div
        className={styles.dial}
        role="img"
        aria-label="suspicion"
        style={{ "--needle-angle": `${angleDeg.toFixed(2)}deg` } as CSSProperties}
      >
        <span aria-hidden={true} className={styles.dialArc} />
        {/* Risk band at the far end — a HATCH, the redundant shape tell (§3.3). */}
        <span aria-hidden={true} className={styles.dialRisk} />
        <span
          aria-hidden={true}
          className={styles.needle}
          // Per-gauge value transition, inline like the shipped energy gauge: it eases the
          // needle between two tick values, it is not a decorative animation.
          style={{ transition: "transform 120ms linear" }}
        />
        <span aria-hidden={true} className={styles.needlePivot} />
      </div>

      {/* Engraved focal ring value (fiction §4.2) — the "300 mm" of the long lens. */}
      <div className={cx(styles.focal, styles.caption)}>{Math.round(photoQte.focalMm)} mm</div>
    </div>
  );
}
