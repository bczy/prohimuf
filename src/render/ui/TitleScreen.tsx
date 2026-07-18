import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties, JSX } from "react";
import { INK, FONT, MASTHEAD, MOTION, STOCK, SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
import { MarkerCircle, PaperSheet } from "@render/ui/print";

interface TitleScreenProps {
  onEnter: () => void;
}

// Copy verbatim from the copy deck §1 (narrative-owned; do not paraphrase).
const ISSUE_LABEL = "★ HIVER 1998 ★";
const YEAR_TAG = "1998 · PÉRIPHÉRIE & ARRONDISSEMENTS";
const TEASERS = [
  "► Les toits parlent. Les fenêtres tirent.",
  "► Un colis. Une sono. Zéro adresse.",
  "► Récupère · Livre · Esquive",
] as const;
const INFOLINE_ROW = "☎ INFO-LINE · 08 36 23 98 23";
const CTA = "[ COMPOSE L'INFO-LINE ]";
const MICROCOPY = "le répondeur donne le point de RV";

const mono = FONT.mono;

/**
 * TITLE surface (ADR-0021 D1) — the zine cover on `STOCK.shell`. Single-action entry:
 * the whole surface is the hit target; a click / tap / printable key / Enter / Space /
 * Escape fires `onEnter()` immediately (no dwell, AC5). Events whose target is inside
 * `[data-muf-ui]` are excluded so tapping / activating the FullscreenButton never skips
 * into the menu (UX §5). Zero glow — the only pulse is the typewriter cursor.
 */
export function TitleScreen({ onEnter }: TitleScreenProps): JSX.Element {
  const ctaRef = useRef<HTMLDivElement>(null);

  const enter = useCallback((): void => {
    onEnter();
  }, [onEnter]);

  // Keyboard entry (global): any printable key OR Enter/Space/Escape. Modifier-only
  // presses and events targeting menu chrome (`[data-muf-ui]`) are ignored.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent): void {
      if (e.target instanceof Element && e.target.closest("[data-muf-ui]") !== null) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const isEntryKey =
        e.key === "Enter" || e.key === " " || e.key === "Escape" || e.key.length === 1;
      if (!isEntryKey) return;
      e.preventDefault();
      enter();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [enter]);

  // Focus the infoline affordance on mount so a keyboard user sees the marker ring.
  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  function handlePointer(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target instanceof Element && e.target.closest("[data-muf-ui]") !== null) return;
    enter();
  }

  return (
    <PaperSheet stock={STOCK.shell} style={{ userSelect: "none" }}>
      <style>{`
        @keyframes mufTitleBlink{0%,100%{opacity:1}50%{opacity:0}}
        /* Short-landscape (ADR-0024): keep the single centered column but shrink the
           wordmark and hide the secondary lines (year tag, divider, teasers, microcopy)
           so everything fits without scrolling and the CTA stays on-screen. Unmatched
           viewports use the var() fallbacks and keep the shipped portrait layout. */
        @media ${SHORT_LANDSCAPE_MEDIA}{
          .muf-title-surface{
            --muf-title-pad: 20px 40px;
            --muf-wordmark-size: clamp(44px, 12vh, 84px);
            --muf-yeartag-display: none;
            --muf-divider-display: none;
            --muf-teasers-display: none;
            --muf-microcopy-display: none;
          }
        }
      `}</style>

      {/* Masthead strip — printed ink bar (single-sourced string). */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: INK.full,
          color: STOCK.shell,
          padding: "4px 12px",
          fontFamily: mono,
          fontSize: "10px",
          letterSpacing: "0.28em",
          textAlign: "center",
          zIndex: 2,
          // Let clicks fall through to the cover below so the whole surface stays the hit target.
          pointerEvents: "none",
        }}
      >
        {MASTHEAD.full}
      </div>

      {/* Interactive surface: whole cover is the hit target — a single centered column
          (identity, then the info-line CTA). Short-landscape shrinks the wordmark and
          hides the secondary lines via the class rules above. */}
      <div
        role="button"
        aria-label={CTA}
        tabIndex={-1}
        onClick={handlePointer}
        className="muf-title-surface"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--muf-title-pad, 48px 40px)",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <div style={infoStyle(INK.black, "11px", "0.4em")}>{ISSUE_LABEL}</div>

        <div
          style={{
            fontFamily: FONT.display,
            fontSize: "var(--muf-wordmark-size, clamp(80px, 14vw, 160px))",
            lineHeight: 0.9,
            letterSpacing: "0.05em",
            color: INK.full,
            marginTop: "8px",
          }}
        >
          MUF
        </div>

        <div
          style={{
            ...infoStyle(INK.black, "12px", "0.2em", 6),
            display: "var(--muf-yeartag-display, block)",
          }}
        >
          {YEAR_TAG}
        </div>

        <div
          style={{
            width: "min(420px, 80%)",
            height: 2,
            background: INK.black,
            margin: "22px 0",
            display: "var(--muf-divider-display, block)",
          }}
        />

        <div
          style={{
            fontFamily: mono,
            fontSize: "12px",
            lineHeight: 1.9,
            letterSpacing: "0.04em",
            color: INK.black,
            textAlign: "left",
            display: "var(--muf-teasers-display, block)",
          }}
        >
          {TEASERS.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div style={infoStyle(INK.black, "13px", "0.14em", 28)}>{INFOLINE_ROW}</div>

        {/* Infoline CTA — the visible affordance + focus target + typewriter cursor. */}
        <div style={{ marginTop: 20 }}>
          <MarkerCircle active={true}>
            <div
              ref={ctaRef}
              tabIndex={0}
              style={{
                fontFamily: mono,
                fontSize: "15px",
                letterSpacing: "0.16em",
                color: INK.black,
                padding: "8px 14px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {CTA}
              <span
                aria-hidden={true}
                style={{
                  display: "inline-block",
                  width: 9,
                  height: "1em",
                  marginLeft: 4,
                  background: INK.black,
                  verticalAlign: "text-bottom",
                  animation: `mufTitleBlink ${MOTION.cursorBlinkMs.toString()}ms step-start infinite`,
                }}
              />
            </div>
          </MarkerCircle>
        </div>

        <div
          style={{
            ...infoStyle(INK.black, "11px", "0.08em", 14),
            display: "var(--muf-microcopy-display, block)",
          }}
        >
          {MICROCOPY}
        </div>
      </div>
    </PaperSheet>
  );
}

function infoStyle(
  color: string,
  fontSize: string,
  letterSpacing: string,
  marginTop = 0,
): CSSProperties {
  return {
    fontFamily: mono,
    fontSize,
    letterSpacing,
    color,
    marginTop,
    textTransform: "uppercase",
  };
}
