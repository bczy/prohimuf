import { useEffect, useId, useRef, useState } from "react";
import type { JSX } from "react";
import { useRovingIndex } from "@render/ui/print";
import { SelectableListItem } from "./SelectableListItem";
import { cx } from "./cx";
import styles from "./BallotRow.module.css";

/** One mutually-exclusive choice in a ballot row. */
export interface BallotChoice {
  /** Stable React key. */
  key: string;
  /** Visible option text (also the X-stamped state when selected). */
  label: string;
  /** Whether this choice is the current value. */
  selected: boolean;
  /** Commit this choice. */
  onSelect: () => void;
}

export interface BallotRowProps {
  /** Row title — becomes the accessible name of the radiogroup. */
  label: string;
  /** Optional sub-label caption. */
  hint?: string;
  /** The 1-of-N choices. */
  options: BallotChoice[];
  /** Optional caveat rendered under the row (e.g. Pause's "prend effet…" note). */
  note?: string | undefined;
}

/**
 * The shared ballot primitive (ADR-0052 §4): a labelled `role="radiogroup"` of
 * X-stampable ballot boxes, arrow-roving with an always-visible marker-circle focus.
 * Owns the a11y contract once — `role="radiogroup"` on the row, `role="radio"` +
 * `aria-checked` on each box, ≥44×44px hit targets (`.ballot`), keyboard navigable —
 * so every consumer (OPTIONS colophon, Pause body, and the M2 `FlyerWall` PRESSION
 * header) inherits it. The X-stamp badge ground reads `--ballot-stamp-bg` (defaults to
 * the colophon orange stock) so a host on a different paper can match its own ground.
 */
export function BallotRow({ label, hint, options, note }: BallotRowProps): JSX.Element {
  const labelId = useId();
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
      <div id={labelId} className={styles.optLabel}>
        {label}
      </div>
      {hint !== undefined && <div className={styles.optHint}>{hint}</div>}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-labelledby={labelId}
        onFocus={() => {
          setFocusWithin(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget)) {
            setFocusWithin(false);
          }
        }}
        className={styles.ballots}
      >
        {options.map((opt, i) => (
          <SelectableListItem
            key={opt.key}
            role="radio"
            aria-checked={opt.selected}
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
      {note !== undefined && <div className={styles.note}>{note}</div>}
    </div>
  );
}
