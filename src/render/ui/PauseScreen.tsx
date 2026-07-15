import { useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { STOCK, INK } from "@render/ui/print";

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
          color: "#555",
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
        style={{ width: "100%", accentColor: INK.black }}
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
        background: "rgba(215,210,198,0.90)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          border: `2px solid ${INK.black}`,
          padding: "32px",
          width: "min(420px, 90vw)",
          background: STOCK.shell,
          position: "relative",
        }}
      >
        {/* Scanlines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, rgba(20,18,16,0.03) 0px, rgba(20,18,16,0.03) 1px, transparent 1px, transparent 3px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          {/* Title */}
          <div
            style={{
              fontFamily: "Impact, sans-serif",
              fontSize: "36px",
              color: INK.full,
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
          <div style={{ height: 1, background: "rgba(20,18,16,0.25)", margin: "20px 0" }} />

          {/* Action buttons */}
          <button
            onClick={onResume}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              background: INK.full,
              color: STOCK.shell,
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
              color: INK.black,
              border: `1px solid ${INK.black}`,
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
              color: "#555",
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
