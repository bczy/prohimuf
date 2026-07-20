import type { CSSProperties, JSX } from "react";
import { MASTHEAD, STOCK } from "@render/ui/print";
import { PaperSheet } from "@render/ui/print";
import { cx } from "./controls/cx";
import styles from "./LoadingScreen.module.css";

/**
 * Progressive loading screen shown while a screen's asset manifest warms
 * (story-asset-preloading). Presentational only — all progress logic lives in
 * `useAssetPreloader` / `App`.
 *
 * House style = the pre-game print system (ADR-0021 / art-direction §2bis): a
 * newsprint `PaperSheet` with the running masthead, Courier/Impact ink type, and
 * a "SOUS PRESSE" press-sheet metaphor — the bar is a black-keyline rule the ink
 * fills as the tirage is pulled. Zero glow / text-shadow / scanline (banned by
 * §2bis; PaperSheet supplies the dot-screen + toner texture).
 */

interface Props {
  /** What is loading — e.g. "MENU", a level name, or "Tutoriel". */
  label: string;
  /** 0..1 fraction settled. */
  progress: number;
}

// The per-line variable typography (static font/colour/transform live in styles.info).
function infoVars(fontSize: string, letterSpacing: string, marginTop = 0): CSSProperties {
  return { fontSize, letterSpacing, marginTop };
}

export function LoadingScreen({ label, progress }: Props): JSX.Element {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  // Zero-padded press-run counter reads as a printed folio (e.g. "042 %").
  const folio = String(pct).padStart(3, "0");

  return (
    <PaperSheet stock={STOCK.shell} style={{ userSelect: "none" }}>
      {/* The bar's width tracks real progress; smooth it, but honour reduced-motion
          (the rest of the print system forces its motion tokens to 0 there too). */}
      <style>{`.muf-load-fill{transition:width 0.12s linear}@media (prefers-reduced-motion: reduce){.muf-load-fill{transition:none}}:root[data-reduced-motion="true"] .muf-load-fill{transition:none}`}</style>

      {/* Masthead strip — printed ink bar (single-sourced running string). */}
      <div className={styles.masthead}>{MASTHEAD.running}</div>

      <div className={styles.body}>
        <div className={styles.info} style={infoVars("11px", "0.4em")}>
          ★ SOUS PRESSE ★
        </div>

        <div className={styles.wordmark} style={{ fontSize: "clamp(44px, 8vw, 84px)" }}>
          CHARGEMENT…
        </div>

        {/* The edition being pulled — target name under an ink rule. */}
        <div className={styles.info} style={infoVars("clamp(12px, 1.8vw, 16px)", "0.22em", 10)}>
          {label}
        </div>
        <div className={styles.rule} />

        {/* Press bar — black keyline the ink fills as the tirage is pulled. */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Chargement ${label}`}
          className={styles.bar}
        >
          <div className={cx("muf-load-fill", styles.fill)} style={{ width: `${String(pct)}%` }} />
        </div>

        <div className={styles.folio}>{folio} %</div>
      </div>
    </PaperSheet>
  );
}
