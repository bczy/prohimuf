import type { JSX } from "react";
import { STOCK, INK } from "@render/ui/print";

interface EndScreenProps {
  phase: "GAME_OVER" | "LEVEL_COMPLETE";
  score: number;
  wave: number;
  onRestart: () => void;
}

export function EndScreen({ phase, score, wave, onRestart }: EndScreenProps): JSX.Element {
  const isGameOver = phase === "GAME_OVER";

  const label = isGameOver ? "— UNE —" : "— SUCCÈS —";
  const title = isGameOver ? "LE LIVREUR DU 19ÈME INTERPELLÉ" : "LA RAVE A EU LIEU";

  return (
    <div
      onClick={onRestart}
      style={{
        position: "fixed",
        inset: 0,
        background: STOCK.shell,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(20,18,16,0.04) 0px, rgba(20,18,16,0.04) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: INK.black,
            letterSpacing: "0.2em",
            marginBottom: "16px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: "64px",
            color: INK.full,
            lineHeight: 1,
            letterSpacing: "0.03em",
            maxWidth: "700px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            color: INK.black,
            marginTop: "24px",
            letterSpacing: "0.1em",
          }}
        >
          {`SCORE FINAL : ${String(score)} | VAGUE ${String(wave)}`}
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: INK.full,
            marginTop: "48px",
            animation: "blink 1s step-start infinite",
          }}
        >
          [ CLIQUER POUR RETOURNER AU MENU ]
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
