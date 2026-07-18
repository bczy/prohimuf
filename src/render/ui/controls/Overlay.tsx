import type { HTMLAttributes, JSX, ReactNode } from "react";
import { cx } from "./cx";
import styles from "./Overlay.module.css";

export interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * The repeated pre-game overlay frame (ADR-0046): a `position: fixed; inset: 0`
 * flex box centred on both axes. Used for the PAUSE modal backdrop and the END
 * full-screen. Surface-specific bits (backdrop rgba/blur, solid stock ground,
 * flex-direction, z-index, click handling) come through `className` (a composed
 * modifier) and standard div props — this owns only the shared box. Zero glow.
 */
export function Overlay({ className, children, ...rest }: OverlayProps): JSX.Element {
  return (
    <div className={cx(styles.overlay, className)} {...rest}>
      {children}
    </div>
  );
}
