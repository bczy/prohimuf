import { useEffect, useRef } from "react";
import type { JSX } from "react";
import type { PhotoCta, PhotoFrameRecord, PhotoSheetView } from "./photoSeam";
import { cx } from "@render/ui/hud/cx";
import styles from "./ContactSheet.module.css";

/**
 * The planche contact — the set-piece's SECOND beat (ADR-0077 D8): the only surface that
 * ever discloses a verdict. Photocopy B&W fanzine treatment, 2×3 grid at the authored
 * `filmCount = 6`, no scroll and no pagination (UX §4.1).
 *
 * The render decides NOTHING here. The outcome is not re-derived from `frames` and the CTA
 * shape is not inferred from a stamp count: `leavingCta` (continue on a MASTER roll,
 * decline without) and `retryOffered` (the mission-scoped attempt budget, spec §1.3.a) are
 * the tick's calls, handed over by `photoSheetView`; this component draws them.
 */

/** The shipped strings (fiction §4.3). Roles are `continue` / `retry` / `decline`. */
const LABEL_CONTINUE = "[ CONTINUER ]";
const LABEL_RETRY = "[ RECOMMENCER ]";
const LABEL_DECLINE = "[ LAISSER TOMBER ]";

/**
 * Verdict stamps (UX §4.2): three marks told apart by SHAPE and TEXT, never by hue, so a
 * grayscale capture separates all three (A13). The reject thumbnail is additionally
 * degraded (see `.thumbRejected`) so the reject reads even past the glyph.
 */
const STAMP_LABEL: Record<PhotoFrameRecord["verdict"], string> = {
  MASTER: "LA PREUVE",
  BONUS: "BONUS",
  REJECTED: "RATÉE",
};

/**
 * An UNEXPOSED window (T-11). A roll can reach the sheet with fewer frames than it had
 * film — a `SCENE_END` at zero releases reaches it with NONE — and that state is a real
 * outcome of the passive-failure route, not an error: the sheet then shows the full roll
 * of empty windows and the correct CTA, never a blank screen. The empty window is also
 * the diagnostic ("you never pressed"), which is the whole point of the sheet on a
 * failed attempt (spec §1.1).
 */
function EmptyWindow({ ordinal }: { ordinal: number }): JSX.Element {
  return (
    <li className={cx(styles.cell, styles.cellEmpty)}>
      <div className={styles.thumbEmpty} aria-hidden={true} />
      <span className={styles.ordinal}>{ordinal}</span>
    </li>
  );
}

function Thumb({ frame }: { frame: PhotoFrameRecord }): JSX.Element {
  const rejected = frame.verdict === "REJECTED";
  return (
    <li className={styles.cell}>
      <div
        className={cx(styles.thumb, rejected ? styles.thumbRejected : undefined)}
        aria-hidden={true}
      />
      <span
        className={cx(
          styles.stamp,
          frame.verdict === "MASTER" ? styles.stampMaster : undefined,
          frame.verdict === "BONUS" ? styles.stampBonus : undefined,
          rejected ? styles.stampRejected : undefined,
        )}
      >
        {STAMP_LABEL[frame.verdict]}
      </span>
      <span className={styles.ordinal}>{frame.ordinal}</span>
    </li>
  );
}

export function ContactSheet({
  sheet,
  filmCount,
  onCta,
}: {
  sheet: PhotoSheetView | null;
  /**
   * The roll's authored size (`spec.filmCount`), threaded from the state ref — authored
   * data, never a render constant and never inferred from the frames drawn. It fixes the
   * grid at one full roll so a truncated or empty sheet keeps its shape (T-11).
   */
  filmCount: number;
  onCta: (cta: PhotoCta) => void;
}): JSX.Element | null {
  const retryRef = useRef<HTMLButtonElement | null>(null);
  const leavingRef = useRef<HTMLButtonElement | null>(null);

  const retryOffered = sheet?.retryOffered === true;
  useEffect(() => {
    // Initial keyboard/gamepad focus lands on `[ RECOMMENCER ]` while it is offered
    // (techplan §6 Lane B); once the attempt budget is spent the leaving control is
    // alone and takes the focus. Either way the player is never focus-trapped and the
    // leaving control is always ONE press away (spec §1.3).
    const target = retryOffered ? retryRef.current : leavingRef.current;
    target?.focus();
  }, [retryOffered, sheet !== null]);

  if (sheet === null) return null;

  const blanks = Array.from(
    { length: Math.max(0, Math.floor(filmCount) - sheet.frames.length) },
    (_, i) => sheet.frames.length + i + 1,
  );
  const leavingLabel = sheet.leavingCta === "continue" ? LABEL_CONTINUE : LABEL_DECLINE;

  return (
    <div className={styles.screen} role="dialog" aria-modal="true" aria-label="planche contact">
      <div className={styles.sheet}>
        <h2 className={styles.masthead}>planche contact</h2>

        {/* 2×3 at the ratified filmCount = 6 — the three columns come from the grid, never
            from a JS split, so a different authored film count reflows instead of
            breaking (UX §4.1). A truncated SPOTTED roll — or an untouched one — keeps the
            full roll of windows, the missing ones simply unexposed (T-11). */}
        <ul className={styles.grid}>
          {sheet.frames.map((frame) => (
            <Thumb key={frame.ordinal} frame={frame} />
          ))}
          {blanks.map((ordinal) => (
            <EmptyWindow key={`blank-${String(ordinal)}`} ordinal={ordinal} />
          ))}
        </ul>

        {/*
         * R2-5, verbatim: a MASTER roll shows EXACTLY ONE control; the no-master branch
         * shows two PEERS on the same row — same size, same treatment, same type scale,
         * neither styled primary — both ≥44×44 px with visible spacing, never nested,
         * never behind a confirmation, never on a second screen. Which branch is drawn is
         * the tick's `retryOffered`, never a render-side count of the stamps.
         */}
        <div className={styles.ctaRow}>
          {retryOffered && (
            <button
              ref={retryRef}
              type="button"
              className={styles.cta}
              onClick={() => {
                onCta("retry");
              }}
            >
              {LABEL_RETRY}
            </button>
          )}
          <button
            ref={leavingRef}
            type="button"
            className={styles.cta}
            onClick={() => {
              onCta(sheet.leavingCta);
            }}
          >
            {leavingLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
