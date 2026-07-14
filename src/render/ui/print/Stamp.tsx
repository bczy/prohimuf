import type { CSSProperties, JSX } from "react";
import { INK } from "./tokens";

export type StampShape = "box" | "oval" | "diagonal";

export interface StampProps {
  label: string;
  /** An `INK.*` or `MARK.*` value — the stamp's mark colour. */
  ink: string;
  /** Distinct shape per semantic (default "box"). */
  shape?: StampShape;
  /** Struck-through (e.g. a dead/locked info-line). */
  struck?: boolean;
}

/**
 * A rubber-stamp / ballot mark. The mark colour is `ink`; a toner-black keyline
 * (outline) rings it so the mark reads even when its hue nears the flyer stock
 * (art-direction §2bis). Zero glow. A slight fixed rotation gives the stamped feel.
 */
export function Stamp({ label, ink, shape = "box", struck = false }: StampProps): JSX.Element {
  const box: CSSProperties = {
    position: "relative",
    display: "inline-block",
    padding: "3px 9px",
    border: `2px solid ${ink}`,
    outline: `1px solid ${INK.black}`,
    outlineOffset: "1px",
    borderRadius: shape === "oval" ? "50%" : "1px",
    color: ink,
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textDecoration: struck ? "line-through" : "none",
    transform: `rotate(${shape === "diagonal" ? "-8" : "-4"}deg)`,
  };
  return (
    <span style={box}>
      {label}
      {shape === "diagonal" && (
        <span
          aria-hidden={true}
          style={{
            position: "absolute",
            left: "-6%",
            right: "-6%",
            top: "50%",
            height: "2px",
            background: ink,
            transform: "rotate(-14deg)",
            pointerEvents: "none",
          }}
        />
      )}
    </span>
  );
}
