import type { CSSProperties, JSX } from "react";
import { INK } from "./tokens";

export type Corner = "tl" | "tr" | "bl" | "br";

export interface TapeCornerProps {
  /** Which corners get a tape pin (default all four). */
  corners?: readonly Corner[];
}

const ALL_CORNERS: readonly Corner[] = ["tl", "tr", "bl", "br"];

const CORNER_STYLE: Record<Corner, CSSProperties> = {
  tl: { top: "-9px", left: "-14px", transform: "rotate(-42deg)" },
  tr: { top: "-9px", right: "-14px", transform: "rotate(42deg)" },
  bl: { bottom: "-9px", left: "-14px", transform: "rotate(44deg)" },
  br: { bottom: "-9px", right: "-14px", transform: "rotate(-44deg)" },
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
          style={{
            position: "absolute",
            width: "48px",
            height: "18px",
            background: "rgba(236,231,218,0.72)",
            borderTop: `1px solid ${INK.black}`,
            borderBottom: `1px solid ${INK.black}`,
            opacity: 0.85,
            pointerEvents: "none",
            ...CORNER_STYLE[c],
          }}
        />
      ))}
    </>
  );
}
