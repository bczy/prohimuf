import type { CSSProperties, JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { BallotRow, VuMeter, cx } from "../controls";
import type { BallotChoice } from "../controls";
import styles from "./OptionsControls.module.css";

/**
 * The shared OPTIONS body (ADR-0052 §4): the ballot + VU rows sourced from the single
 * `Prefs` store, consumed by BOTH `OptionsColophon` (colophon chrome) and `PauseScreen`
 * (modal chrome). Each host keeps its own outer chrome and supplies its own row config
 * — Pause passes `runScopedNote` so VIES/PRESSION carry the false-affordance caveat, and
 * overrides `--ballot-stamp-bg` (via `style`) to match its grey stock.
 *
 * Controlled: the host owns the `Prefs` state + persistence; this component only maps
 * `prefs → rows` and reports edits through `onChange`. One source of truth for the row
 * set, labels, and the a11y contract, so the two surfaces can no longer drift.
 */
export interface OptionsControlsProps {
  prefs: Prefs;
  /** Report an edit as a partial `Prefs` patch; the host merges + persists. */
  onChange: (patch: Partial<Prefs>) => void;
  /**
   * Caveat rendered under the run-scoped rows (VIES, PRESSION). Pause passes the
   * "prend effet à la prochaine partie" copy; the colophon omits it.
   */
  runScopedNote?: string | undefined;
  /** Forwarded to the root (e.g. Pause sets `--ballot-stamp-bg`). */
  style?: CSSProperties;
  className?: string;
}

const DIFFICULTIES: readonly { value: Prefs["difficulty"]; label: string }[] = [
  { value: "easy", label: "FACILE" },
  { value: "normal", label: "NORMAL" },
  { value: "hard", label: "DIFFICILE" },
];

const LIVES = [1, 2, 3, 4, 5] as const;

const CRT_CHOICES: readonly { value: boolean; label: string }[] = [
  { value: true, label: "OUI" },
  { value: false, label: "NON" },
];

const REDUCED_MOTION_CHOICES: readonly { value: boolean; label: string }[] = [
  { value: true, label: "OUI" },
  { value: false, label: "NON" },
];

/**
 * Map the single `Prefs.reducedMotion` field to the MOUVEMENT RÉDUIT ballot choices
 * (ADR-0052 §3). `selected` reads straight from `prefs`; each `onSelect` reports the
 * `reducedMotion` patch through the shared `onChange` so both host surfaces stay in
 * lockstep. Exported pure so the write-through contract is unit-testable DOM-free
 * (mirrors `FlyerWall.buildPressionChoices`).
 */
export function buildReducedMotionChoices(
  prefs: Prefs,
  onChange: (patch: Partial<Prefs>) => void,
): BallotChoice[] {
  return REDUCED_MOTION_CHOICES.map((c) => ({
    key: c.label,
    label: c.label,
    selected: prefs.reducedMotion === c.value,
    onSelect: () => {
      onChange({ reducedMotion: c.value });
    },
  }));
}

export function OptionsControls({
  prefs,
  onChange,
  runScopedNote,
  style,
  className,
}: OptionsControlsProps): JSX.Element {
  const livesOptions: BallotChoice[] = LIVES.map((n) => ({
    key: String(n),
    label: String(n),
    selected: prefs.lives === n,
    onSelect: () => {
      onChange({ lives: n });
    },
  }));

  const difficultyOptions: BallotChoice[] = DIFFICULTIES.map((d) => ({
    key: d.value,
    label: d.label,
    selected: prefs.difficulty === d.value,
    onSelect: () => {
      onChange({ difficulty: d.value });
    },
  }));

  const crtOptions: BallotChoice[] = CRT_CHOICES.map((c) => ({
    key: c.label,
    label: c.label,
    selected: prefs.crt === c.value,
    onSelect: () => {
      onChange({ crt: c.value });
    },
  }));

  const reducedMotionOptions = buildReducedMotionChoices(prefs, onChange);

  return (
    <div className={cx(styles.root, className)} style={style}>
      <VuMeter
        label="BRUITS DE RUE"
        hint="tirs & sirènes"
        value={prefs.soundVolume}
        onChange={(v) => {
          onChange({ soundVolume: v });
        }}
      />
      <VuMeter
        label="LA SONO"
        hint="le son du système"
        value={prefs.musicVolume}
        onChange={(v) => {
          onChange({ musicVolume: v });
        }}
      />

      <BallotRow
        label="VIES"
        hint="combien de fois tu te relèves"
        options={livesOptions}
        note={runScopedNote}
      />
      <BallotRow
        label="PRESSION"
        hint="à quel point les flics te collent"
        options={difficultyOptions}
        note={runScopedNote}
      />
      <BallotRow label="TUBE CATHODIQUE" hint="scanlines & courbure d'écran" options={crtOptions} />
      <BallotRow
        label="MOUVEMENT RÉDUIT"
        hint="moins d'animations & de flashs"
        options={reducedMotionOptions}
      />
    </div>
  );
}
