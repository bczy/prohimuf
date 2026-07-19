import type { CSSProperties, JSX } from "react";
import styles from "./TapeCorner.module.css";

export type Corner = "tl" | "tr" | "bl" | "br";

export interface TapeCornerProps {
  /** Which corners get a tape pin (default all four). */
  corners?: readonly Corner[];
}

const ALL_CORNERS: readonly Corner[] = ["tl", "tr", "bl", "br"];

// CSS custom properties for per-corner positioning and rotation.
const CORNER_VARS: Record<Corner, CSSProperties> = {
  tl: {
    "--tape-top": "-9px",
    "--tape-left": "-14px",
    "--tape-transform": "rotate(-42deg)",
  } as CSSProperties,
  tr: {
    "--tape-top": "-9px",
    "--tape-right": "-14px",
    "--tape-transform": "rotate(42deg)",
  } as CSSProperties,
  bl: {
    "--tape-bottom": "-9px",
    "--tape-left": "-14px",
    "--tape-transform": "rotate(44deg)",
  } as CSSProperties,
  br: {
    "--tape-bottom": "-9px",
    "--tape-right": "-14px",
    "--tape-transform": "rotate(-44deg)",
  } as CSSProperties,
};

/**
 * Tape-pin corners for the front / selected flyer. Translucent masking-tape strips
 * with a faint ink keyline, rotated across each corner. Zero glow.
 */
export function TapeCorner({ corners = ALL_CORNERS }: TapeCornerProps): JSX.Element {
  return (
    <>
      {corners.map((c) => (
        <div
          key={c}
          aria-hidden={true}
          className={styles.tape}
          // Per-corner offset + rotation, selected by prop (the only dynamic bit).
          style={CORNER_VARS[c]}
        />
      ))}
    </>
  );
}
