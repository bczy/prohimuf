import type { JSX } from "react";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps): JSX.Element {
  return (
    <div
      onClick={onStart}
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
            fontFamily: "Impact, sans-serif",
            fontSize: "120px",
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "0.05em",
          }}
        >
          MUF
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
            marginTop: "8px",
            letterSpacing: "0.1em",
          }}
        >
          Paris Rave Clandestin — 1998
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
          [ CLIQUER POUR JOUER ]
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
