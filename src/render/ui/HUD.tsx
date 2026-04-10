import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";

export interface HudData {
  score: number;
  lives: number;
  timeRemaining: number;
  phase: Phase;
  wave: number;
}

function phaseMessage(phase: Phase): string | null {
  switch (phase) {
    case "GAME_OVER":
      return "GAME OVER";
    case "LEVEL_COMPLETE":
      return "NIVEAU TERMINÉ !";
    default:
      return null;
  }
}

export function HUD({ data }: { data: HudData }): JSX.Element {
  const msg = phaseMessage(data.phase);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        padding: "8px 12px",
        color: "#ffffff",
        background: "rgba(0,0,0,0.6)",
        fontFamily: "monospace",
        fontSize: "14px",
        lineHeight: "1.6",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div>SCORE : {data.score}</div>
      <div>VIES : {data.lives}</div>
      <div>TEMPS : {Math.ceil(data.timeRemaining)}s</div>
      <div>VAGUE : {data.wave}</div>
      {msg !== null && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffdd00",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
