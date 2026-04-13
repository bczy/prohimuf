import { useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";

const NEON_YELLOW = "#ffe600";
const NEON_GREEN = "#39ff14";

interface Props {
  prefs: Prefs;
  onResume: () => void;
  onMenu: () => void;
  onSavePrefs: (p: Prefs) => void;
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#888",
          marginBottom: "4px",
          letterSpacing: "0.15em",
        }}
      >
        {label} — {Math.round(value * 100)}%
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => {
          onChange(Number(e.target.value) / 100);
        }}
        style={{ width: "100%", accentColor: NEON_YELLOW }}
      />
    </div>
  );
}

export function PauseScreen({ prefs, onResume, onMenu, onSavePrefs }: Props): JSX.Element {
  const [local, setLocal] = useState(prefs);

  function update(patch: Partial<Prefs>): void {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onSavePrefs(updated);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          border: `2px solid ${NEON_YELLOW}`,
          padding: "32px",
          width: "min(420px, 90vw)",
          background: "#000",
          position: "relative",
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

        <div style={{ position: "relative" }}>
          {/* Title */}
          <div
            style={{
              fontFamily: "Impact, sans-serif",
              fontSize: "36px",
              color: NEON_YELLOW,
              letterSpacing: "0.1em",
              marginBottom: "24px",
            }}
          >
            PAUSE
          </div>

          {/* Options */}
          <Slider
            label="VOLUME SFX"
            value={local.soundVolume}
            onChange={(v) => {
              update({ soundVolume: v });
            }}
          />
          <Slider
            label="VOLUME MUSIQUE"
            value={local.musicVolume}
            onChange={(v) => {
              update({ musicVolume: v });
            }}
          />

          {/* Separator */}
          <div style={{ height: 1, background: "#222", margin: "20px 0" }} />

          {/* Action buttons */}
          <button
            onClick={onResume}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              background: NEON_YELLOW,
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "13px",
              letterSpacing: "0.2em",
            }}
          >
            ▶ REPRENDRE
          </button>
          <button
            onClick={onMenu}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "transparent",
              color: NEON_GREEN,
              border: `1px solid ${NEON_GREEN}`,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "13px",
              letterSpacing: "0.2em",
            }}
          >
            ← RETOUR AU MENU
          </button>

          {/* ESC hint */}
          <div
            style={{
              marginTop: "16px",
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#444",
              textAlign: "center",
              letterSpacing: "0.15em",
            }}
          >
            [ESC] pour reprendre
          </div>
        </div>
      </div>
    </div>
  );
}
