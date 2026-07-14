import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { PaperSheet, STOCK, INK, MASTHEAD, MarkerCircle, useRovingIndex } from "@render/ui/print";
import { FlyerWall } from "./menu/FlyerWall";
import { ScoresUne } from "./menu/ScoresUne";
import { OptionsColophon } from "./menu/OptionsColophon";

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

const BODY_FONT = "'Courier New', Courier, monospace";
const DISPLAY_FONT = "'Impact', 'Arial Narrow', sans-serif";

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

  const active = RUBRIQUES[roving.index]?.key ?? "levels";

  return (
    <PaperSheet stock={STOCK.shell}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Running masthead */}
        <div
          style={{
            padding: "12px 16px 8px",
            borderBottom: `1px solid ${INK.black}`,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: "32px",
              color: INK.full,
              letterSpacing: "0.04em",
            }}
          >
            MUF
          </div>
          <div
            style={{
              fontFamily: BODY_FONT,
              fontSize: "10px",
              color: INK.black,
              letterSpacing: "0.25em",
            }}
          >
            {MASTHEAD.running}
          </div>
        </div>

        {/* Sommaire — hand-inked index, marker-circled active rubrique (no yellow fill) */}
        <div
          ref={navRef}
          role="tablist"
          onFocus={() => {
            setFocusWithin(true);
          }}
          onBlur={(e) => {
            if (!navRef.current?.contains(e.relatedTarget as Node | null)) {
              setFocusWithin(false);
            }
          }}
          style={{
            display: "flex",
            gap: "8px",
            padding: "8px 16px",
            borderBottom: `1px solid ${INK.black}`,
            flexShrink: 0,
          }}
        >
          {RUBRIQUES.map((r, i) => {
            const isActive = active === r.key;
            return (
              <MarkerCircle key={r.key} active={focusWithin && roving.index === i} ink={INK.black}>
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
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
                  style={{
                    minHeight: "44px",
                    padding: "8px 14px",
                    background: "transparent",
                    color: INK.black,
                    border: "none",
                    borderBottom: `3px solid ${isActive ? INK.black : "transparent"}`,
                    cursor: "pointer",
                    fontFamily: BODY_FONT,
                    fontSize: "13px",
                    letterSpacing: "0.2em",
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {r.label}
                </button>
              </MarkerCircle>
            );
          })}
        </div>

        {/* Active rubrique surface */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {active === "levels" && <FlyerWall unlockedLevels={unlockedLevels} onPlay={onPlay} />}
          {active === "scores" && <ScoresUne unlockedLevels={unlockedLevels} />}
          {active === "prefs" && <OptionsColophon prefs={prefs} onSave={onSavePrefs} />}
        </div>
      </div>
    </PaperSheet>
  );
}
