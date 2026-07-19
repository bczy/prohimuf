import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { PaperSheet, STOCK, INK, FONT, useRovingIndex } from "@render/ui/print";
import { SelectableListItem, cx } from "../controls";
import styles from "./OptionsColophon.module.css";

/**
 * OPTIONS — the OURS / colophon (UX §2.5, deck §4). The zine back page: sliders are
 * inked VU meters, toggles are ballot boxes with an X-stamp. Orange colophon stock
 * (§4.5), zero glow. All writes go through the existing `onSave` (Prefs schema
 * byte-unchanged, AC4). Copy verbatim from deck §4.
 */

interface OptionsColophonProps {
  prefs: Prefs;
  onSave: (prefs: Prefs) => void;
}

const COLOPHON_LINES = [
  "UNDERGROUND PARIS — fanzine clandestin",
  "Rédaction : DISPATCH · KENZA · MUF",
  "Tirage : 23 exemplaires photocopiés",
  "Ne se vend pas. Ne se jette pas. Se passe.",
  "Ni pub, ni logo, ni adresse.",
] as const;

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

interface BallotOption {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function OptionsColophon({ prefs, onSave }: OptionsColophonProps): JSX.Element {
  const [local, setLocal] = useState(prefs);

  function update(patch: Partial<Prefs>): void {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onSave(updated);
  }

  const livesOptions: BallotOption[] = LIVES.map((n) => ({
    key: String(n),
    label: String(n),
    selected: local.lives === n,
    onSelect: () => {
      update({ lives: n });
    },
  }));

  const difficultyOptions: BallotOption[] = DIFFICULTIES.map((d) => ({
    key: d.value,
    label: d.label,
    selected: local.difficulty === d.value,
    onSelect: () => {
      update({ difficulty: d.value });
    },
  }));

  const crtOptions: BallotOption[] = CRT_CHOICES.map((c) => ({
    key: c.label,
    label: c.label,
    selected: local.crt === c.value,
    onSelect: () => {
      update({ crt: c.value });
    },
  }));

  return (
    <PaperSheet
      stock={STOCK.orange}
      fullBleed={false}
      style={{ padding: "18px 20px", fontFamily: FONT.mono, color: INK.black, maxWidth: "560px" }}
    >
      <div className={styles.title}>OURS</div>
      <div className={styles.subtitle}>l'ours du fanzine · réglages</div>

      {/* Colophon body (static block) */}
      <div className={styles.colophon}>
        {COLOPHON_LINES.map((line) => (
          <div key={line} className={styles.colophonLine}>
            {line}
          </div>
        ))}
      </div>

      <VuMeter
        label="BRUITS DE RUE"
        hint="tirs & sirènes"
        value={local.soundVolume}
        onChange={(v) => {
          update({ soundVolume: v });
        }}
      />
      <VuMeter
        label="LA SONO"
        hint="le son du système"
        value={local.musicVolume}
        onChange={(v) => {
          update({ musicVolume: v });
        }}
      />

      <BallotRow label="VIES" hint="combien de fois tu te relèves" options={livesOptions} />
      <BallotRow
        label="PRESSION"
        hint="à quel point les flics te collent"
        options={difficultyOptions}
      />
      <BallotRow label="TUBE CATHODIQUE" hint="scanlines & courbure d'écran" options={crtOptions} />
    </PaperSheet>
  );
}

function VuMeter({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div className={styles.vuMeter}>
      <div className={styles.optLabel}>
        {label} — {Math.round(value * 100)}%
      </div>
      <div className={styles.optHint}>{hint}</div>
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

function BallotRow({
  label,
  hint,
  options,
}: {
  label: string;
  hint: string;
  options: BallotOption[];
}): JSX.Element {
  const [focusWithin, setFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const roving = useRovingIndex(options.length, {
    axis: "horizontal",
    wrap: true,
    onActivate: (i) => {
      options[i]?.onSelect();
    },
  });

  useEffect(() => {
    if (containerRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  return (
    <div className={styles.ballotRow}>
      <div className={styles.optLabel}>{label}</div>
      <div className={styles.optHint}>{hint}</div>
      <div
        ref={containerRef}
        onFocus={() => {
          setFocusWithin(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
            setFocusWithin(false);
          }
        }}
        className={styles.ballots}
      >
        {options.map((opt, i) => (
          <SelectableListItem
            key={opt.key}
            active={focusWithin && roving.index === i}
            buttonRef={(el) => {
              itemRefs.current[i] = el;
            }}
            tabIndex={roving.index === i ? 0 : -1}
            onKeyDown={roving.onKeyDown}
            onFocus={() => {
              roving.setIndex(i);
            }}
            onClick={opt.onSelect}
            className={cx(styles.ballot, opt.selected && styles.ballotSelected)}
          >
            {opt.label}
            {opt.selected && (
              <span aria-hidden="true" className={styles.xstamp}>
                ✕
              </span>
            )}
          </SelectableListItem>
        ))}
      </div>
    </div>
  );
}
