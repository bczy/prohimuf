import type { JSX, ReactNode } from "react";
import { INK } from "./tokens";

export interface MarkerCircleProps {
  /** Draw the ink when the wrapped item is focused / selected. */
  active: boolean;
  /** Mark colour (default `INK.black`). */
  ink?: string;
  children: ReactNode;
}

/**
 * An always-visible inked focus/selection ellipse (art-direction §2bis: keyboard
 * focus is never invisible). When `active`, a hand-inked ellipse is drawn around the
 * wrapped content via an inline SVG with a non-scaling stroke. Zero glow.
 */
export function MarkerCircle({
  active,
  ink = INK.black,
  children,
}: MarkerCircleProps): JSX.Element {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {active && (
        <svg
          aria-hidden={true}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: "-8px",
            left: "-12px",
            width: "calc(100% + 24px)",
            height: "calc(100% + 16px)",
            pointerEvents: "none",
            overflow: "visible",
            transform: "rotate(-1.5deg)",
          }}
        >
          <ellipse
            cx="50"
            cy="50"
            rx="47"
            ry="43"
            fill="none"
            stroke={ink}
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </span>
  );
}
