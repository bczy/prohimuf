import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { LEVELS, FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { loadScores } from "@game/systems/highScoreSystem";
import { PaperSheet, STOCK, INK, FONT, MARK, MarkerCircle, useRovingIndex } from "@render/ui/print";
import { SelectableListItem, cx } from "../controls";
import styles from "./ScoresUne.module.css";

/**
 * SCORES — the PARIS-MINUIT journal UNE (UX §2.4). The per-level high-score view is
 * a fictional establishment night-tabloid: masthead + édition switch + a classement
 * rendered as an article, not an HTML table. Newsprint ground + a single rose accent
 * (§4.5). Copy verbatim from deck §3. Read-only: Enter is a no-op; ←/→ switch édition.
 */

interface ScoresUneProps {
  unlockedLevels: ReadonlySet<string>;
}

export function ScoresUne({ unlockedLevels }: ScoresUneProps): JSX.Element {
  // Same filter as the shipped ScoresTab: unlocked, non-tutorial levels.
  const editions: LevelConfig[] = LEVELS.filter(
    (l) => l.kind !== "tutorial" && unlockedLevels.has(l.id),
  );

  const [focusWithin, setFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const roving = useRovingIndex(Math.max(editions.length, 1), {
    axis: "horizontal",
    wrap: true,
  });

  useEffect(() => {
    if (containerRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  const selected = editions[roving.index] ?? editions[0] ?? FIRST_PLAYABLE_LEVEL;
  const scores = loadScores(selected.id);
  const top = scores[0];

  return (
    <PaperSheet
      stock={STOCK.shell}
      fullBleed={false}
      style={{ padding: "18px 20px", fontFamily: FONT.mono, color: INK.black }}
    >
      {/* Masthead (deck §3.1) */}
      <div className={styles.masthead}>
        <div className={styles.wordmark}>PARIS-MINUIT</div>
        <div className={styles.subtitle}>LE QUOTIDIEN QUI VEILLE · 1F50 · 1998</div>
      </div>

      {/* Édition switch (kept level selector, reframed) */}
      <div
        ref={containerRef}
        onFocus={() => {
          setFocusWithin(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget)) {
            setFocusWithin(false);
          }
        }}
        className={styles.editions}
      >
        {editions.map((l, i) => {
          const active = selected.id === l.id;
          return (
            <SelectableListItem
              key={l.id}
              active={focusWithin && roving.index === i}
              buttonRef={(el) => {
                itemRefs.current[i] = el;
              }}
              tabIndex={roving.index === i ? 0 : -1}
              onKeyDown={roving.onKeyDown}
              onFocus={() => {
                roving.setIndex(i);
              }}
              onClick={() => {
                roving.setIndex(i);
              }}
              className={cx(styles.edition, active ? styles.editionActive : styles.editionIdle)}
            >
              {l.name}
            </SelectableListItem>
          );
        })}
      </div>

      <div className={styles.rubrique}>RUBRIQUE FAITS DIVERS — {selected.name}</div>

      {scores.length === 0 || top === undefined ? (
        // Empty state (deck §3.4) — "no news" standfirst, keeps the meaning.
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>AUCUN MÉFAIT SIGNALÉ</div>
          <div className={styles.emptyText}>La rue a été calme. Pour l'instant.</div>
        </div>
      ) : (
        <>
          {/* Lead story from scores[0] (deck §3.2) */}
          <div className={styles.lead}>
            <div className={styles.leadKicker}>NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT</div>
            <div className={styles.leadTitle}>NUIT BLANCHE : {top.score}</div>
            <div className={styles.leadText}>{top.wave} vagues de bleus, et le son a tenu.</div>
          </div>

          {/* Classement (deck §3.3) — # / BUTIN / ASSAUTS / NUIT DU */}
          <div className={styles.tableHead}>
            <span className={styles.colNum}>N°</span>
            <span className={styles.colButin}>BUTIN</span>
            <span className={styles.colAssauts}>ASSAUTS</span>
            <span className={styles.colNuit}>NUIT DU</span>
          </div>
          {scores.map((s, i) => {
            const isTop = i === 0;
            // rank-1 highlight WITHOUT an inline-block wrapper: the row stays a
            // full-width block so every column aligns. The green is a keyline/accent
            // only — an inset left rule (no layout shift) plus a circled rank NUMBER —
            // never small body text on newsprint (2.40:1). Row text is INK.black. The
            // hairline rgba (ink at 0.25α, no clean token) stays inline.
            return (
              <div
                key={i}
                className={cx(styles.row, isTop && styles.rowTop)}
                style={{ borderBottom: "1px solid rgba(20,18,16,0.25)" }}
              >
                <span className={styles.colNum}>
                  {isTop ? (
                    <MarkerCircle active ink={MARK.green}>
                      <span>{i + 1}</span>
                    </MarkerCircle>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={cx(styles.colButin, styles.scoreCell)}>{s.score}</span>
                <span className={styles.colAssauts}>{s.wave}</span>
                <span className={styles.colNuit}>{s.date.slice(0, 10)}</span>
              </div>
            );
          })}
        </>
      )}
    </PaperSheet>
  );
}
