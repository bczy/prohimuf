import type { JSX } from "react";

/**
 * Progressive loading screen shown while a screen's asset manifest warms
 * (story-asset-preloading). Presentational only — all progress logic lives in
 * `useAssetPreloader` / `App`. House style mirrors MainMenu: neon-yellow on a
 * dark ground, Impact/monospace, scanline overlay.
 */

const NEON_YELLOW = "#ffe600";
const NEON_GREEN = "#39ff14";

interface Props {
  /** What is loading — e.g. "MENU", a level name, or "Tutoriel". */
  label: string;
  /** 0..1 fraction settled. */
  progress: number;
}

const root: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(rgba(10,7,26,0.9) 0%, rgba(10,6,24,1) 100%), #05030f",
  color: "#fff",
  fontFamily: "'Impact', 'Arial Narrow', sans-serif",
  userSelect: "none",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "18px",
};

const scanlines: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
  pointerEvents: "none",
};

export function LoadingScreen({ label, progress }: Props): JSX.Element {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div style={root}>
      <div style={scanlines} />

      <div
        style={{
          fontSize: "40px",
          letterSpacing: "0.08em",
          textShadow: `2px 2px 0 ${NEON_YELLOW}`,
        }}
      >
        CHARGEMENT…
      </div>

      <div
        style={{
          fontFamily: "monospace",
          fontSize: "13px",
          letterSpacing: "0.3em",
          color: NEON_YELLOW,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          width: "min(60vw, 420px)",
          height: "14px",
          border: `1px solid ${NEON_YELLOW}`,
          background: "rgba(6,4,16,0.62)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${String(pct)}%`,
            background: NEON_YELLOW,
            transition: "width 0.15s linear",
          }}
        />
      </div>

      <div style={{ fontFamily: "monospace", fontSize: "16px", color: NEON_GREEN }}>{pct}%</div>
    </div>
  );
}
