import type { CSSProperties, JSX } from "react";
import { tapeStripPath } from "./flyerGeometry";
import styles from "./TapeCorner.module.css";

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

// Translucent beige masking tape (§2bis.2 pt6): composited `multiply` (see the CSS) so the
// per-flyer fluo stock tints _through_ the strip as a darker, desaturated band — not opaque
// manila. rgba, no plain token (masking-tape beige is not a §2bis.1 stock), stays inline.
const TAPE_TINT = "rgba(214, 202, 170, 0.62)";
// Faint matte wrinkle (darkening only — zero sheen). Alpha of ink-black, not a re-declared hex.
const TAPE_WRINKLE = "rgba(20, 18, 16, 0.1)";

/**
 * Tape-pin corners for the front / selected flyer. Each pin is a real strip of translucent
 * masking tape: frayed only at the two tips, near-straight long sides, wrinkle lines running
 * across the width (parallel to the pull), no ink keyline. Matte, zero glow (§2bis.2 pt6).
 */
export function TapeCorner({ corners = ALL_CORNERS }: TapeCornerProps): JSX.Element {
  return (
    <>
      {corners.map((c) => {
        const strip = tapeStripPath(c);
        return (
          <svg
            key={c}
            aria-hidden={true}
            className={styles.tape}
            width={strip.length}
            height={strip.width}
            viewBox={`0 0 ${String(strip.length)} ${String(strip.width)}`}
            preserveAspectRatio="none"
            // Per-corner offset + rotation, selected by prop (unchanged CORNER_STYLE).
            style={CORNER_STYLE[c]}
          >
            <polygon points={strip.points} fill={TAPE_TINT} />
            {strip.wrinkles.map((x) => (
              <line
                key={x}
                x1={x}
                y1={1}
                x2={x}
                y2={strip.width - 1}
                stroke={TAPE_WRINKLE}
                strokeWidth={1}
              />
            ))}
          </svg>
        );
      })}
    </>
  );
}
