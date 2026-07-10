import type { JSX } from "react";

const NEON_YELLOW = "#ffe600";

/**
 * Full-screen blocker shown on mobile while the device is in portrait
 * (ADR-0003). The game underneath is paused; rotating to landscape resumes.
 */
export function RotateOverlay(): JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />
      <style>{`@keyframes mufRotateHint{0%,25%{transform:rotate(0deg)}60%,100%{transform:rotate(90deg)}}`}</style>
      <div
        style={{
          fontSize: "64px",
          animation: "mufRotateHint 1.8s ease-in-out infinite alternate",
        }}
      >
        📱
      </div>
      <div
        style={{
          fontFamily: "Impact, sans-serif",
          fontSize: "32px",
          color: NEON_YELLOW,
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
          color: "#888",
          letterSpacing: "0.15em",
        }}
      >
        muf se joue en paysage
      </div>
    </div>
  );
}
