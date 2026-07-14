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
 * A rubber-stamp / ballot mark. The keyline (border) is ALWAYS `INK.black` and the
 * LABEL text is ALWAYS `INK.black` so the mark reads on any stock even when its hue
 * nears the flyer ground (art-direction §2bis: every stamp carries a toner-black
 * keyline regardless of ink — critical for e.g. pink-on-orange — and mark ink never
 * carries small text). The mark colour `ink` is the hue tell only: a slim inner rule
 * (and, for `diagonal`, the strike). Shapes (box/oval/diagonal) are the redundant,
 * per-difficulty tell. Zero glow. A slight fixed rotation gives the stamped feel.
 */
export function Stamp({ label, ink, shape = "box", struck = false }: StampProps): JSX.Element {
  const box: CSSProperties = {
    position: "relative",
    display: "inline-block",
    padding: "3px 9px",
    border: `2px solid ${INK.black}`,
    borderRadius: shape === "oval" ? "50%" : "1px",
    color: INK.black,
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
      {/* Hue tell: a slim inner rule in the mark ink — no text rides the colour. */}
      <span
        aria-hidden={true}
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          bottom: "1.5px",
          height: "1.5px",
          background: ink,
          pointerEvents: "none",
        }}
      />
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
