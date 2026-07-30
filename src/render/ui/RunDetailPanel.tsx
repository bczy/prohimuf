import type { JSX } from "react";
import type { RunSummary } from "@game/types/runStats";
import {
  DETAIL_LABELS,
  DURATION_NOTE,
  END_CAUSE_LABELS,
  formatDelivery,
  formatDuration,
  formatHeartsLostDetail,
  formatPickups,
  formatScore,
} from "./runStatsLabels";
import styles from "./RunDetailPanel.module.css";

export interface RunDetailPanelProps {
  /** The finished run, derived by the pure layer (`buildRunSummary`). */
  summary: RunSummary;
  /** DOM id — the disclosure button's `aria-controls` target. */
  id: string;
}

/**
 * The opt-in detail of the run: EXACTLY the 7 lines of spec D3.1, in that imposed
 * order (the loop's three verbs, then the meta lines). Lines 2/3/5 repeat the
 * headline row and line 6 repeats the end-cause subhead ON PURPOSE (D3.2, gate R3):
 * the detail is the block a playtester reads aloud or pastes, so it must be
 * complete and self-standing. This is not a duplication bug to "clean up" later.
 *
 * Rendered as a `<dl>`: one term + one value per line, stacked on mobile landscape
 * (height is the scarce axis, UX §1.3) and paired two-up once the viewport is roomy.
 * The panel is mounted/unmounted by its disclosure button, with no transition at
 * all — so `prefers-reduced-motion` needs no special case (A6 holds by construction).
 */
export function RunDetailPanel({ summary, id }: RunDetailPanelProps): JSX.Element {
  const lines: readonly {
    readonly label: string;
    readonly note?: string;
    readonly value: string;
  }[] = [
    { label: DETAIL_LABELS.pickups, value: formatPickups(summary.pickups) },
    { label: DETAIL_LABELS.delivery, value: formatDelivery(summary.delivery) },
    { label: DETAIL_LABELS.damage, value: formatHeartsLostDetail(summary.heartsLost) },
    {
      label: DETAIL_LABELS.duration,
      note: DURATION_NOTE,
      value: formatDuration(summary.durationSeconds),
    },
    { label: DETAIL_LABELS.score, value: formatScore(summary.score) },
    { label: DETAIL_LABELS.endCause, value: END_CAUSE_LABELS[summary.endCause] },
    { label: DETAIL_LABELS.wave, value: String(summary.wave) },
  ];

  return (
    <dl id={id} className={styles.panel}>
      {lines.map((line) => (
        <div key={line.label} className={styles.row}>
          <dt className={styles.term}>
            {line.label}
            {line.note !== undefined && <span className={styles.note}>{line.note}</span>}
          </dt>
          <dd className={styles.value}>{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}
