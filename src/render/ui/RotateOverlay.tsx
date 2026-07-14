import type { JSX } from "react";
import { PaperSheet, STOCK, INK } from "@render/ui/print";

/**
 * Full-screen blocker shown on mobile while the device is in portrait
 * (ADR-0003). The game underneath is paused; rotating to landscape resumes.
 * Reskinned into the print system (ADR-0020): paper ground + black ink, an inked
 * phone/rotate glyph instead of the 📱 emoji, no scanlines, zero glow. Behaviour
 * (portrait-only, pauses underneath) is unchanged.
 */
export function RotateOverlay(): JSX.Element {
  return (
    <PaperSheet stock={STOCK.newsprint} style={{ zIndex: 200 }}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <style>{`
        @keyframes mufRotateHint { 0%,25% { transform: rotate(0deg); } 60%,100% { transform: rotate(90deg); } }
        @media (prefers-reduced-motion: reduce) { .muf-rotate-glyph { animation: none !important; } }
      `}</style>
        {/* Inked phone/rotate glyph (inline SVG, no emoji, no glow) */}
        <svg
          className="muf-rotate-glyph"
          width="72"
          height="72"
          viewBox="0 0 48 48"
          aria-hidden="true"
          style={{ animation: "mufRotateHint 1.8s ease-in-out infinite alternate" }}
        >
          <rect
            x="16"
            y="6"
            width="16"
            height="36"
            rx="3"
            fill="none"
            stroke={INK.black}
            strokeWidth="2.5"
          />
          <line x1="16" y1="12" x2="32" y2="12" stroke={INK.black} strokeWidth="2" />
          <line x1="16" y1="36" x2="32" y2="36" stroke={INK.black} strokeWidth="2" />
          <circle cx="24" cy="39" r="1.4" fill={INK.black} />
        </svg>
        <div
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: "32px",
            color: INK.full,
            letterSpacing: "0.1em",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          TOURNEZ VOTRE APPAREIL
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: INK.black,
            letterSpacing: "0.15em",
          }}
        >
          muf se joue en paysage
        </div>
      </div>
    </PaperSheet>
  );
}
