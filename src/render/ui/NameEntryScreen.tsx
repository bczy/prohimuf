import { useEffect, useId, useRef, useState } from "react";
import type { JSX, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent } from "react";
import { sanitizeName, MAX_NAME_LENGTH } from "@game/systems/highScoreSystem";
import { PaperSheet, STOCK, INK, FONT } from "@render/ui/print";
import styles from "./NameEntryScreen.module.css";

export interface NameEntryScreenProps {
  /** Final score of the qualifying run (display only — App holds the save triple). */
  score: number;
  /** Wave reached (display only). */
  wave: number;
  /** Pre-fill from `loadPlayerName()` (already sanitised; may be `""`). */
  initialName: string;
  /** Sign the score. `name` is sanitised; an empty string persists the anonymous fallback. */
  onSubmit: (name: string) => void;
  /** Skip (PASSER / Escape) — the score still saves, with no byline. */
  onSkip: () => void;
}

/**
 * NAME_ENTRY (M1, ADR-0052 §2, UX spec §2) — the typed byline slot on the PARIS-MINUIT
 * UNE. Reached only when the run is a high score; reuses the gated newsprint/rose print
 * system (masthead, `NOTRE ENVOYÉ SPÉCIAL` byline convention) rather than an arcade
 * initials wheel. A native `<input>` styled as the typed line: real keyboard/IME/mobile
 * virtual-keyboard support, screen-reader-legible, no custom widget to relearn.
 *
 * Input is clamped live to `MAX_NAME_LENGTH` and control-stripped via the pure
 * `sanitizeName`; the pure layer sanitises again on save, so the leaderboard row can
 * never render anything but plain text. Enter (form submit) or `[ SIGNER ]` signs;
 * `[ PASSER ]` or Escape skips. Static: the only motion is the native caret blink, which
 * the print system already zeroes under `prefers-reduced-motion`.
 */
export function NameEntryScreen({
  score,
  wave,
  initialName,
  onSubmit,
  onSkip,
}: NameEntryScreenProps): JSX.Element {
  const inputId = useId();
  const [name, setName] = useState(() => sanitizeName(initialName));
  const inputRef = useRef<HTMLInputElement>(null);

  // A11y (AC7): focus lands in the byline on mount and selects the pre-filled tag, so a
  // returning player re-signs with one Enter or types straight over it.
  useEffect(() => {
    const el = inputRef.current;
    if (el === null) return;
    el.focus();
    el.select();
  }, []);

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    onSubmit(name);
  };

  // Escape is the keyboard mirror of [ PASSER ] (skippable in one action, AC1).
  const handleKeyDown = (e: ReactKeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      onSkip();
    }
  };

  return (
    <PaperSheet stock={STOCK.newsprint} style={{ fontFamily: FONT.mono, color: INK.black }}>
      <div className={styles.screen}>
        <form className={styles.article} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className={styles.masthead}>
            <div className={styles.wordmark}>PARIS-MINUIT</div>
            <div className={styles.subtitle}>LE QUOTIDIEN QUI VEILLE · 1F50 · 1998</div>
          </div>

          <div className={styles.kicker}>
            <span aria-hidden="true" className={styles.star}>
              ★
            </span>{" "}
            ENTRÉE AU CLASSEMENT
          </div>
          <div className={styles.lead}>NUIT BLANCHE : {score}</div>
          <div className={styles.subline}>{wave} vagues de bleus, et le son a tenu.</div>

          <label htmlFor={inputId} className={styles.label}>
            NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT :
          </label>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.input}
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              setName(sanitizeName(e.currentTarget.value));
            }}
          />

          <div className={styles.actions}>
            <button type="submit" className={styles.signer}>
              [ SIGNER ]
            </button>
            <button type="button" className={styles.passer} onClick={onSkip}>
              [ PASSER ]
            </button>
          </div>
        </form>
      </div>
    </PaperSheet>
  );
}
