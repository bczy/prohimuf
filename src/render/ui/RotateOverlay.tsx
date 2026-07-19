import type { JSX } from "react";
import { PaperSheet, STOCK, INK } from "@render/ui/print";
import styles from "./RotateOverlay.module.css";

/**
 * Full-screen blocker shown on mobile while the device is in portrait
 * (ADR-0003). The game underneath is paused; rotating to landscape resumes.
 * Reskinned into the print system (ADR-0021): paper ground + black ink, an inked
 * phone/rotate glyph instead of the 📱 emoji, no scanlines, zero glow. Behaviour
 * (portrait-only, pauses underneath) is unchanged.
 */
export function RotateOverlay(): JSX.Element {
  return (
    <PaperSheet stock={STOCK.shell} style={{ zIndex: 200 }}>
      <div className={styles.stack}>
        {/* Inked phone/rotate glyph (inline SVG, no emoji, no glow) */}
        <svg
          className={styles.rotateGlyph}
          width="72"
          height="72"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <rect
            x="16"
            y="6"
            width="16"
            height="36"
            rx="3"
            fill="none"
            stroke={INK.black}
            strokeWidth="2.5"
          />
          <line x1="16" y1="12" x2="32" y2="12" stroke={INK.black} strokeWidth="2" />
          <line x1="16" y1="36" x2="32" y2="36" stroke={INK.black} strokeWidth="2" />
          <circle cx="24" cy="39" r="1.4" fill={INK.black} />
        </svg>
        <div className={styles.title}>TOURNEZ VOTRE APPAREIL</div>
        <div className={styles.caption}>muf se joue en paysage</div>
      </div>
    </PaperSheet>
  );
}
