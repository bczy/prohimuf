import type { CSSProperties, JSX, ReactNode } from "react";
import { INK } from "./tokens";

export interface PaperSheetProps {
  /** A `STOCK.*` value — the solid paper ground. */
  stock: string;
  /** Fixed `inset: 0` full-viewport ground (default) vs a contained relative block. */
  fullBleed?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

// Dot-screen halftone stand-in (§2bis.1): a fine radial-gradient tile, 3px pitch.
const DOT_SCREEN = "radial-gradient(circle, rgba(20,18,16,0.16) 0.5px, transparent 0.9px)";

// Toner speckle (~2% coverage) — inline-SVG feTurbulence data-URI, encoded for url().
const TONER_SPECKLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.1 0.3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23t)'/%3E%3C/svg%3E\")";

// Fold streaks — 2 faint diagonal lighter bands (not a repeating scanline).
const FOLD_STREAKS =
  "linear-gradient(103deg, transparent 0 31%, rgba(255,255,255,0.05) 31.5% 32%, transparent 32.5% 66%, rgba(255,255,255,0.045) 66.5% 67%, transparent 67.5% 100%)";

const OVERLAY_BASE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

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
  const base: CSSProperties = fullBleed
    ? { position: "fixed", inset: 0 }
    : { position: "relative" };
  return (
    <div
      style={{
        ...base,
        background: stock,
        color: INK.black,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        aria-hidden={true}
        style={{ ...OVERLAY_BASE, backgroundImage: DOT_SCREEN, backgroundSize: "3px 3px" }}
      />
      <div
        aria-hidden={true}
        style={{ ...OVERLAY_BASE, backgroundImage: TONER_SPECKLE, mixBlendMode: "multiply" }}
      />
      <div aria-hidden={true} style={{ ...OVERLAY_BASE, background: FOLD_STREAKS }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
