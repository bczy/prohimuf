import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { LEVELS, FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { loadScores } from "@game/systems/highScoreSystem";
import { PaperSheet, STOCK, INK, MARK, MarkerCircle, useRovingIndex } from "@render/ui/print";

/**
 * SCORES — the PARIS-MINUIT journal UNE (UX §2.4). The per-level high-score view is
 * a fictional establishment night-tabloid: masthead + édition switch + a classement
 * rendered as an article, not an HTML table. Newsprint ground + a single rose accent
 * (§4.5). Copy verbatim from deck §3. Read-only: Enter is a no-op; ←/→ switch édition.
 */

interface ScoresUneProps {
  unlockedLevels: ReadonlySet<string>;
}

const BODY_FONT = "'Courier New', Courier, monospace";
const DISPLAY_FONT = "'Impact', 'Arial Narrow', sans-serif";
const ROSE = STOCK.rose;

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
      stock={STOCK.newsprint}
      fullBleed={false}
      style={{ padding: "18px 20px", fontFamily: BODY_FONT, color: INK.black }}
    >
      {/* Masthead (deck §3.1) */}
      <div style={{ borderBottom: `3px double ${INK.black}`, paddingBottom: "8px" }}>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: "40px",
            letterSpacing: "0.04em",
            textAlign: "center",
            // Single rose accent — masthead only (§4.5). A flat ink shadow, not glow.
            textShadow: `2px 2px 0 ${ROSE}`,
          }}
        >
          PARIS-MINUIT
        </div>
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", textAlign: "center" }}>
          LE QUOTIDIEN QUI VEILLE · 1F50 · 1998
        </div>
      </div>

      {/* Édition switch (kept level selector, reframed) */}
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
        style={{ display: "flex", gap: "6px", margin: "12px 0", flexWrap: "wrap" }}
      >
        {editions.map((l, i) => {
          const active = selected.id === l.id;
          return (
            <MarkerCircle key={l.id} active={focusWithin && roving.index === i} ink={INK.black}>
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
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
                  padding: "6px 12px",
                  background: "transparent",
                  color: INK.black,
                  border: `1px solid ${INK.black}`,
                  borderBottomWidth: active ? "3px" : "1px",
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {l.name}
              </button>
            </MarkerCircle>
          );
        })}
      </div>

      <div style={{ fontSize: "10px", letterSpacing: "0.15em", fontWeight: 700 }}>
        RUBRIQUE FAITS DIVERS — {selected.name}
      </div>

      {scores.length === 0 || top === undefined ? (
        // Empty state (deck §3.4) — "no news" standfirst, keeps the meaning.
        <div style={{ textAlign: "center", padding: "36px 8px" }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: "26px", letterSpacing: "0.03em" }}>
            AUCUN MÉFAIT SIGNALÉ
          </div>
          <div style={{ fontSize: "12px", marginTop: "8px" }}>
            La rue a été calme. Pour l'instant.
          </div>
        </div>
      ) : (
        <>
          {/* Lead story from scores[0] (deck §3.2) */}
          <div
            style={{
              margin: "12px 0",
              borderBottom: `1px solid ${INK.black}`,
              paddingBottom: "10px",
            }}
          >
            <div style={{ fontSize: "10px", letterSpacing: "0.2em" }}>
              NOTRE ENVOYÉ SPÉCIAL Y ÉTAIT
            </div>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: "30px", letterSpacing: "0.02em" }}>
              NUIT BLANCHE : {top.score}
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              {top.wave} vagues de bleus, et le son a tenu.
            </div>
          </div>

          {/* Classement (deck §3.3) — # / BUTIN / ASSAUTS / NUIT DU */}
          <div
            style={{
              display: "flex",
              fontSize: "10px",
              letterSpacing: "0.15em",
              fontWeight: 700,
              borderBottom: `1px solid ${INK.black}`,
              paddingBottom: "4px",
            }}
          >
            <span style={{ width: "36px" }}>N°</span>
            <span style={{ flex: 1 }}>BUTIN</span>
            <span style={{ width: "72px" }}>ASSAUTS</span>
            <span style={{ width: "96px" }}>NUIT DU</span>
          </div>
          {scores.map((s, i) => {
            const row = (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "13px",
                  padding: "5px 0",
                  borderBottom: `1px solid rgba(20,18,16,0.25)`,
                  color: i === 0 ? MARK.green : INK.black,
                }}
              >
                <span style={{ width: "36px" }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: "16px" }}>{s.score}</span>
                <span style={{ width: "72px" }}>{s.wave}</span>
                <span style={{ width: "96px" }}>{s.date.slice(0, 10)}</span>
              </div>
            );
            return i === 0 ? (
              <MarkerCircle key={i} active ink={MARK.green}>
                {row}
              </MarkerCircle>
            ) : (
              <div key={i}>{row}</div>
            );
          })}
        </>
      )}
    </PaperSheet>
  );
}
