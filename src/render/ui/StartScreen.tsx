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
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Photocopied grain scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />

      {/* Neon corner decorations */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 60,
          height: 60,
          borderTop: "3px solid #ffe600",
          borderLeft: "3px solid #ffe600",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 60,
          height: 60,
          borderTop: "3px solid #ffe600",
          borderRight: "3px solid #ffe600",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          width: 60,
          height: 60,
          borderBottom: "3px solid #ffe600",
          borderLeft: "3px solid #ffe600",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 60,
          height: 60,
          borderBottom: "3px solid #ffe600",
          borderRight: "3px solid #ffe600",
        }}
      />

      {/* Fanzine header strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "#ffe600",
          padding: "4px 12px",
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#000",
          letterSpacing: "0.3em",
          textAlign: "center",
        }}
      >
        UNDERGROUND PARIS — FANZINE CLANDESTIN — N°1 — GRATUIT
      </div>

      <div style={{ position: "relative", textAlign: "center", padding: "0 40px" }}>
        {/* Issue label */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#ff2d9b",
            letterSpacing: "0.4em",
            marginBottom: "16px",
            textTransform: "uppercase",
          }}
        >
          ★ Hiver 1998 ★
        </div>

        {/* Main title */}
        <div
          style={{
            fontFamily: "Impact, 'Arial Narrow', sans-serif",
            fontSize: "clamp(80px, 14vw, 160px)",
            color: "#fff",
            lineHeight: 0.9,
            letterSpacing: "0.05em",
            textShadow: "4px 4px 0 #ffe600, -2px -2px 0 #ff2d9b",
          }}
        >
          MUF
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: "clamp(14px, 2.5vw, 26px)",
            color: "#ffe600",
            letterSpacing: "0.15em",
            marginTop: "8px",
            textTransform: "uppercase",
          }}
        >
          Paris Rave Clandestin
        </div>

        {/* Year tag */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#666",
            marginTop: "6px",
            letterSpacing: "0.2em",
          }}
        >
          1998 — Banlieues & Arrondissements
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "2px",
            background: "#ffe600",
            margin: "24px 0",
            opacity: 0.6,
          }}
        />

        {/* Teaser lines — fanzine style */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#aaa",
            lineHeight: 1.8,
            letterSpacing: "0.05em",
            textAlign: "left",
          }}
        >
          <span style={{ color: "#ff6600" }}>►</span> Tireurs aux fenêtres : qui sont-ils ?<br />
          <span style={{ color: "#ff6600" }}>►</span> Carte exclusive : Stalingrad — 19e
          <br />
          <span style={{ color: "#ff6600" }}>►</span> Survive. Livre. Esquive.
        </div>

        {/* CTA */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#39ff14",
            marginTop: "40px",
            letterSpacing: "0.15em",
            textShadow: "0 0 10px #39ff14",
            animation: "blink 1s step-start infinite",
          }}
        >
          [ CLIQUER POUR ENTRER ]
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
