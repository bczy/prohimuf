import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";

export interface TopdownHudData {
  phase: Phase;
  hasCargo: boolean;
  detectionLevel: number;
}

export interface HudData {
  score: number;
  lives: number;
  timeRemaining: number;
  phase: Phase;
  wave: number;
}

// Neon accent colors (guidelines: jaune fluo, rose fuchsia, vert acide, orange brûlé)
const NEON_GREEN = "#39ff14";
const NEON_YELLOW = "#ffe600";
const NEON_PINK = "#ff2d9b";
const NEON_ORANGE = "#ff6600";

function phaseMessage(phase: Phase): { text: string; color: string } | null {
  switch (phase) {
    case "GAME_OVER":
      return { text: "— INTERPELLÉ —", color: NEON_PINK };
    case "LEVEL_COMPLETE":
      return { text: "— LA RAVE A EU LIEU —", color: NEON_GREEN };
    default:
      return null;
  }
}

const hudStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  pointerEvents: "none",
  userSelect: "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "6px 12px",
  // Fanzine newspaper strip
  background: "rgba(0,0,0,0.85)",
  borderBottom: `2px solid ${NEON_YELLOW}`,
  fontFamily: "'Impact', 'Arial Narrow', sans-serif",
  letterSpacing: "0.08em",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#888",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  fontFamily: "monospace",
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: "22px",
  color,
  lineHeight: 1,
});

export function HUD({ data }: { data: HudData }): JSX.Element {
  const msg = phaseMessage(data.phase);
  const timeColor =
    data.timeRemaining < 20 ? NEON_PINK : data.timeRemaining < 40 ? NEON_ORANGE : NEON_GREEN;
  const livesColor = data.lives <= 1 ? NEON_PINK : NEON_YELLOW;

  return (
    <>
      <div style={hudStyle}>
        {/* Score */}
        <div style={itemStyle}>
          <span style={labelStyle}>score</span>
          <span style={valueStyle(NEON_YELLOW)}>{String(data.score).padStart(4, "0")}</span>
        </div>

        {/* Wave — centre */}
        <div style={itemStyle}>
          <span style={labelStyle}>vague</span>
          <span style={valueStyle(NEON_GREEN)}>{data.wave}</span>
        </div>

        {/* Time */}
        <div style={itemStyle}>
          <span style={labelStyle}>temps</span>
          <span style={valueStyle(timeColor)}>{Math.ceil(data.timeRemaining)}s</span>
        </div>

        {/* Lives — right */}
        <div style={itemStyle}>
          <span style={labelStyle}>vies</span>
          <span style={valueStyle(livesColor)}>{"♥".repeat(Math.max(0, data.lives))}</span>
        </div>
      </div>

      {/* Phase overlay message — fanzine style */}
      {msg !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "72px",
              color: msg.color,
              letterSpacing: "0.1em",
              textShadow: `0 0 20px ${msg.color}, 0 0 40px ${msg.color}`,
              transform: "rotate(-3deg)",
            }}
          >
            {msg.text}
          </div>
        </div>
      )}
    </>
  );
}
