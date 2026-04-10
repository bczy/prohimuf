import type { JSX } from "react";

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
        background: "#000000",
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
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#ffffff",
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
            color: "#ffffff",
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
            color: "#ffdd00",
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
            color: "#39ff14",
            marginTop: "48px",
            animation: "blink 1s step-start infinite",
          }}
        >
          [ CLIQUER POUR RECOMMENCER ]
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
