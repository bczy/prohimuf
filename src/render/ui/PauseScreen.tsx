import { useState } from "react";
import type { CSSProperties, JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { Overlay, cx } from "./controls";
import { OptionsControls } from "./menu/OptionsControls";
import styles from "./PauseScreen.module.css";

interface Props {
  prefs: Prefs;
  onResume: () => void;
  onMenu: () => void;
  onSavePrefs: (p: Prefs) => void;
}

// Match the ballot X-stamp badge to the pause card's grey stock (not the colophon orange).
const OPTIONS_STYLE = { "--ballot-stamp-bg": "var(--stock-shell)" } as CSSProperties;

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
        <div className={styles.inner}>
          {/* Title */}
          <div className={styles.title}>PAUSE</div>

          {/* Options — the shared body (ADR-0054 §4), same rows/labels/a11y as OPTIONS. */}
          <OptionsControls
            prefs={local}
            onChange={update}
            runScopedNote="prend effet à la prochaine partie"
            style={OPTIONS_STYLE}
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
