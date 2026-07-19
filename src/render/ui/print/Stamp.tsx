import type { CSSProperties, JSX } from "react";
import styles from "./Stamp.module.css";

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
  // CSS custom properties for shape and struck variants — injected via inline style.
  const customProps: CSSProperties = {
    "--stamp-border-radius": shape === "oval" ? "50%" : "1px",
    "--stamp-text-decoration": struck ? "line-through" : "none",
    "--stamp-transform": `rotate(${shape === "diagonal" ? "-8" : "-4"}deg)`,
    "--stamp-ink": ink,
  } as CSSProperties;

  return (
    <span className={styles.box} style={customProps}>
      {label}
      {/* Hue tell: a slim inner rule in the mark ink — no text rides the colour. */}
      <span aria-hidden={true} className={styles.innerRule} />
      {shape === "diagonal" && <span aria-hidden={true} className={styles.diagonalStrike} />}
    </span>
  );
}
