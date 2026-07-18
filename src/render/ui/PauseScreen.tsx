import { useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { Overlay, cx } from "./controls";
import styles from "./PauseScreen.module.css";

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
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
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
        className={styles.slider}
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        {label} — {value ? "ON" : "OFF"}
      </div>
      <button
        onClick={() => {
          onChange(!value);
        }}
        className={cx(styles.toggle, value ? styles.toggleOn : styles.toggleOff)}
      >
        {value ? "◉ ACTIVÉ" : "○ DÉSACTIVÉ"}
      </button>
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
    <Overlay className={styles.backdrop} style={{ background: "rgba(215,210,198,0.90)" }}>
      <div className={styles.card}>
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

        <div className={styles.inner}>
          {/* Title */}
          <div className={styles.title}>PAUSE</div>

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
          <Toggle
            label="ÉCRAN CATHODIQUE"
            value={local.crt}
            onChange={(v) => {
              update({ crt: v });
            }}
          />

          {/* Separator (ink rgba hairline, no clean token -> inline) */}
          <div style={{ height: 1, background: "rgba(20,18,16,0.25)", margin: "20px 0" }} />

          {/* Action buttons */}
          <button onClick={onResume} className={cx(styles.action, styles.actionPrimary)}>
            ▶ REPRENDRE
          </button>
          <button onClick={onMenu} className={cx(styles.action, styles.actionSecondary)}>
            ← RETOUR AU MENU
          </button>

          {/* ESC hint */}
          <div className={styles.escHint}>[ESC] pour reprendre</div>
        </div>
      </div>
    </Overlay>
  );
}
