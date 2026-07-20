import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import {
  PaperSheet,
  STOCK,
  MASTHEAD,
  useRovingIndex,
  SHORT_LANDSCAPE_MEDIA,
} from "@render/ui/print";
import { SelectableListItem, cx } from "./controls";
import { FlyerWall } from "./menu/FlyerWall";
import { ScoresUne } from "./menu/ScoresUne";
import { OptionsColophon } from "./menu/OptionsColophon";
import styles from "./MainMenu.module.css";

/**
 * MENU — the zine interior shell (ADR-0021, UX §2.2). A running masthead + a
 * hand-inked *sommaire* (replacing the glowing yellow TabBar) over three rubrique
 * surfaces: NIVEAUX (flyer wall), SCORES (PARIS-MINUIT UNE), OPTIONS (OURS colophon).
 * Zero glow; paper-shell ground so the flyers pop (§4.5). Props are unchanged so the
 * App.tsx wiring stays compatible.
 */

interface Props {
  unlockedLevels: ReadonlySet<string>;
  prefs: Prefs;
  onPlay: (levelId: string) => void;
  onSavePrefs: (prefs: Prefs) => void;
}

const RUBRIQUES = [
  { key: "levels", label: "NIVEAUX" },
  { key: "scores", label: "SCORES" },
  { key: "prefs", label: "OPTIONS" },
] as const;

export function MainMenu({ unlockedLevels, prefs, onPlay, onSavePrefs }: Props): JSX.Element {
  const [focusWithin, setFocusWithin] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const roving = useRovingIndex(RUBRIQUES.length, { axis: "horizontal", wrap: true });

  useEffect(() => {
    if (navRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  // Mount-only: land keyboard focus on the active rubrique tab so the marker ring is
  // visible without a blind Tab. Empty deps keep it from stealing focus on switches;
  // the initial roving.index is the deterministic default (0 → NIVEAUX).
  const mountFocusRef = useRef(false);
  useEffect(() => {
    if (mountFocusRef.current) return;
    mountFocusRef.current = true;
    itemRefs.current[roving.index]?.focus();
  }, [roving.index]);

  const active = RUBRIQUES[roving.index]?.key ?? "levels";

  return (
    <PaperSheet stock={STOCK.shell}>
      <style>{`
        /* Short-landscape (ADR-0024): the standalone running-masthead band is the
           "SPA header" one tap after the cover — hide it and surface a compact MUF
           mark inside the sommaire strip, so the flyers own the height. Portrait /
           desktop keep the full masthead via the var() fallbacks. */
        @media ${SHORT_LANDSCAPE_MEDIA}{
          .muf-menu-shell{
            --muf-menu-masthead-display: none;
            --muf-menu-mark-display: inline-block;
          }
        }
      `}</style>
      <div className={cx("muf-menu-shell", styles.shell)}>
        {/* Running masthead (hidden in short-landscape; the MUF mark below stands in) */}
        <div
          className={styles.masthead}
          style={{ display: "var(--muf-menu-masthead-display, flex)" }}
        >
          <div className={styles.mark}>MUF</div>
          <div className={styles.mastheadText}>{MASTHEAD.running}</div>
        </div>

        {/* Sommaire — hand-inked index, marker-circled active rubrique (no yellow fill) */}
        <div
          ref={navRef}
          role="tablist"
          onFocus={() => {
            setFocusWithin(true);
          }}
          onBlur={(e) => {
            if (!navRef.current?.contains(e.relatedTarget)) {
              setFocusWithin(false);
            }
          }}
          className={styles.sommaire}
        >
          {/* Compact identity mark — only shown in short-landscape, where the full
              masthead band above is collapsed. Decorative (Escape → TITLE still works). */}
          <span
            aria-hidden={true}
            className={styles.compactMark}
            style={{ display: "var(--muf-menu-mark-display, none)" }}
          >
            MUF
          </span>
          {RUBRIQUES.map((r, i) => {
            const isActive = active === r.key;
            return (
              <SelectableListItem
                key={r.key}
                active={focusWithin && roving.index === i}
                buttonRef={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="tab"
                aria-selected={isActive}
                tabIndex={roving.index === i ? 0 : -1}
                onKeyDown={roving.onKeyDown}
                onFocus={() => {
                  roving.setIndex(i);
                }}
                onClick={() => {
                  roving.setIndex(i);
                }}
                className={cx(styles.tab, isActive ? styles.tabActive : styles.tabIdle)}
              >
                {r.label}
              </SelectableListItem>
            );
          })}
        </div>

        {/* Active rubrique surface */}
        <div className={styles.rubriques}>
          {active === "levels" && (
            <FlyerWall
              unlockedLevels={unlockedLevels}
              onPlay={onPlay}
              prefs={prefs}
              onSavePrefs={onSavePrefs}
            />
          )}
          {active === "scores" && <ScoresUne unlockedLevels={unlockedLevels} />}
          {active === "prefs" && <OptionsColophon prefs={prefs} onSave={onSavePrefs} />}
        </div>
      </div>
    </PaperSheet>
  );
}
