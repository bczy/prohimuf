import type { CSSProperties, JSX, ReactNode } from "react";
import styles from "./PaperSheet.module.css";
import { cx } from "../controls";

export interface PaperSheetProps {
  /** A `STOCK.*` value — the solid paper ground. */
  stock: string;
  /** Fixed `inset: 0` full-viewport ground (default) vs a contained relative block. */
  fullBleed?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * The print ground for any pre-game surface: solid stock + dot-screen halftone +
 * toner speckle + fold streaks. Zero glow — no box-shadow, no text-shadow, no
 * backdrop-filter, no CRT scanline (art-direction §2bis). Static, so nothing to
 * drop under prefers-reduced-motion.
 */
export function PaperSheet({
  stock,
  fullBleed = true,
  children,
  style,
}: PaperSheetProps): JSX.Element {
  // CSS custom property for the paper stock color, merged with any additional styles.
  const sheetStyle: CSSProperties = {
    "--paper-stock": stock,
    ...style,
  } as CSSProperties;

  return (
    <div
      className={cx(styles.sheet, fullBleed ? styles.fullBleed : styles.contained)}
      style={sheetStyle}
    >
      <div aria-hidden={true} className={styles.dotScreen} />
      <div aria-hidden={true} className={styles.toner} />
      <div aria-hidden={true} className={styles.foldStreaks} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
