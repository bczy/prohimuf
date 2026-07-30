import { useEffect, useId, useRef, useState } from "react";
import type { JSX, MouseEvent } from "react";
import type { FunnelState, RunSummary } from "@game/types/runStats";
import { detectMobile } from "@utils/platform";
import { useRunReport } from "@hooks/useRunReport";
import { Overlay, cx } from "./controls";
import { RunDetailPanel } from "./RunDetailPanel";
import {
  HEADLINE_LABELS,
  formatDelivery,
  formatEndCause,
  formatHeartsLost,
  formatScore,
} from "./runStatsLabels";
import styles from "./EndScreen.module.css";

export interface EndScreenProps {
  phase: "GAME_OVER" | "LEVEL_COMPLETE";
  /** The finished run, derived by the pure layer — never `GameState.stats` (D6). */
  summary: RunSummary;
  /** Funnel state at run end; travels into the export payload only (UX §4). */
  funnel: FunnelState;
  /** Level identity — known by the shell, attached at report-build time (D1). */
  levelId: string;
  onRestart: () => void;
}

const COPY_LABEL = "[ COPIER MON RAPPORT ]";
const COPIED_LABEL = "[ ✓ RAPPORT COPIÉ ]";
// Device-worded fallback (ADR-0015 discipline reused, not re-litigated): no
// keyboard-shortcut text on a device with no keyboard. Both strings stay in sync.
const FAILED_LABEL_DESKTOP = "[ ⚠ COPIE AUTO INDISPONIBLE — SÉLECTIONNE ET COPIE (⌘/CTRL+C) ]";
const FAILED_LABEL_MOBILE = "[ ⚠ COPIE AUTO INDISPONIBLE — SÉLECTIONNE LE TEXTE ET COPIE-LE ]";
const COPIED_ANNOUNCEMENT = "Rapport copié dans le presse-papier";
const FAILED_ANNOUNCEMENT =
  "Copie automatique indisponible. Le rapport est affiché ci-dessous, sélectionne-le et copie-le.";

export function EndScreen({
  phase,
  summary,
  funnel,
  levelId,
  onRestart,
}: EndScreenProps): JSX.Element {
  const isGameOver = phase === "GAME_OVER";
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = useId();
  const { status, payload, copy } = useRunReport(summary, funnel, levelId);
  // The AC5 fallback pre-selects ONCE per revealed payload. An inline `ref`
  // arrow would be a new function on every render, so React would re-invoke it
  // (null, then the element) on EVERY re-render — re-selecting and stealing the
  // focus each time the detail panel toggles, the aria-live text changes or the
  // 2.5 s feedback timer expires. Keyed on the payload VALUE: the same string
  // across re-renders is one selection, a new copy attempt is a new one.
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (payload === null) return;
    fallbackRef.current?.select();
  }, [payload]);

  const label = isGameOver ? "— UNE —" : "— SUCCÈS —";
  const title = isGameOver ? "LE LIVREUR DU 19ÈME INTERPELLÉ" : "LA RAVE A EU LIEU";
  const failedLabel = detectMobile() ? FAILED_LABEL_MOBILE : FAILED_LABEL_DESKTOP;
  const exportLabel =
    status === "copied" ? COPIED_LABEL : status === "failed" ? failedLabel : COPY_LABEL;
  const announcement =
    status === "copied" ? COPIED_ANNOUNCEMENT : status === "failed" ? FAILED_ANNOUNCEMENT : "";

  return (
    <Overlay onClick={onRestart} className={styles.screen}>
      {/* grain overlay — rgba gradient with no clean token stays inline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(20,18,16,0.04) 0px, rgba(20,18,16,0.04) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      <div className={styles.content}>
        <div className={styles.label}>{label}</div>

        <div className={styles.title}>{title}</div>

        {/*
         * THE single non-closing controls block (gate R1, UX §1.4). Everything
         * interactive — plus the end-cause subhead and the headline row — lives
         * inside this one rectangle, which carries ≥24px of INERT padding on all
         * four sides. Any input landing anywhere in it, on a control or in the
         * padding, is consumed here and never reaches `onRestart`; the near-miss
         * tap that a bare per-button stopPropagation would have dismissed on
         * (D3.5.2) lands in the padding and is swallowed too. Everything OUTSIDE
         * the block — background, label, title, the prompt below — still dismisses
         * exactly as today, so story AC9 keeps its single-action restart.
         */}
        <div
          className={styles.controls}
          onClick={(e: MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
          }}
        >
          {/*
           * End-of-run cause at 0 input (gate R5, guidelines §5 rule 4): three of
           * the five causes share the same GAME_OVER phase, and the title is not a
           * reason. Subordinate to the title, NEVER colour-coded by outcome
           * (gate Q7), and NOT a fourth headline slot — the row below still holds
           * exactly three.
           */}
          <div className={styles.endCause}>{formatEndCause(summary.endCause)}</div>

          <div className={styles.headlineRow}>
            <div className={styles.slot}>
              <span className={styles.slotLabel}>{HEADLINE_LABELS.score}</span>
              <span className={styles.slotValue}>{formatScore(summary.score)}</span>
            </div>
            {/*
             * H2 is NOT a short numeric slot (gate R2): its worst realistic string
             * is `INTERROMPUE — intégrité 100 %`. Its column takes twice the
             * horizontal budget of H1/H3 and its value wraps inside the slot when
             * the width runs out — it never truncates and never shrinks below the
             * row's own size (both explicitly forbidden, UX §1.2c).
             */}
            <div className={cx(styles.slot, styles.slotWide)}>
              <span className={styles.slotLabel}>{HEADLINE_LABELS.delivery}</span>
              <span className={styles.slotValue}>{formatDelivery(summary.delivery)}</span>
            </div>
            <div className={styles.slot}>
              <span className={styles.slotLabel}>{HEADLINE_LABELS.damage}</span>
              <span className={styles.slotValue}>{formatHeartsLost(summary.heartsLost)}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.control}
            aria-expanded={detailOpen}
            aria-controls={detailId}
            onClick={() => {
              setDetailOpen((open) => !open);
            }}
          >
            {`[ ${detailOpen ? "▴" : "▾"} DÉTAIL DE LA COURSE ]`}
          </button>

          {detailOpen && <RunDetailPanel summary={summary} id={detailId} />}

          <button type="button" className={styles.control} onClick={copy}>
            {exportLabel}
          </button>

          {/* The visual label swap is invisible to assistive tech (UX A4). */}
          <span className={styles.srOnly} aria-live="polite">
            {announcement}
          </span>

          {payload !== null && (
            <textarea className={styles.fallback} readOnly value={payload} ref={fallbackRef} />
          )}
        </div>

        <div className={styles.prompt}>[ CLIQUER POUR RETOURNER AU MENU ]</div>
      </div>
    </Overlay>
  );
}
