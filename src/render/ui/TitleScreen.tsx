import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties, JSX } from "react";
import { MASTHEAD, MOTION, STOCK, SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
import { MarkerCircle, PaperSheet } from "@render/ui/print";
import { cx } from "./controls/cx";
import styles from "./TitleScreen.module.css";

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

      {/* Masthead strip — printed ink bar (single-sourced string). Clicks fall through
          to the cover below (pointer-events: none) so the whole surface stays the hit target. */}
      <div className={styles.masthead}>{MASTHEAD.full}</div>

      {/* Interactive surface: whole cover is the hit target — a single centered column
          (identity, then the info-line CTA). Short-landscape shrinks the wordmark and
          hides the secondary lines via the class rules above. `padding` reads the
          media-toggled var (responsive), so it stays inline. */}
      <div
        role="button"
        aria-label={CTA}
        tabIndex={-1}
        onClick={handlePointer}
        className={cx("muf-title-surface", styles.surface)}
        style={{ padding: "var(--muf-title-pad, 48px 40px)" }}
      >
        <div className={styles.info} style={infoVars("11px", "0.4em")}>
          {ISSUE_LABEL}
        </div>

        <div
          className={styles.wordmark}
          style={{ fontSize: "var(--muf-wordmark-size, clamp(80px, 14vw, 160px))" }}
        >
          MUF
        </div>

        <div
          className={styles.info}
          style={{ ...infoVars("12px", "0.2em", 6), display: "var(--muf-yeartag-display, block)" }}
        >
          {YEAR_TAG}
        </div>

        <div className={styles.divider} style={{ display: "var(--muf-divider-display, block)" }} />

        <div className={styles.teasers} style={{ display: "var(--muf-teasers-display, block)" }}>
          {TEASERS.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div className={styles.info} style={infoVars("13px", "0.14em", 28)}>
          {INFOLINE_ROW}
        </div>

        {/* Infoline CTA — the visible affordance + focus target + typewriter cursor. */}
        <div style={{ marginTop: 20 }}>
          <MarkerCircle active={true}>
            <div ref={ctaRef} tabIndex={0} className={styles.cta}>
              {CTA}
              <span
                aria-hidden={true}
                className={styles.cursor}
                style={{
                  animation: `mufTitleBlink ${MOTION.cursorBlinkMs.toString()}ms step-start infinite`,
                }}
              />
            </div>
          </MarkerCircle>
        </div>

        <div
          className={styles.info}
          style={{
            ...infoVars("11px", "0.08em", 14),
            display: "var(--muf-microcopy-display, block)",
          }}
        >
          {MICROCOPY}
        </div>
      </div>
    </PaperSheet>
  );
}

// Per-line variable typography; static font/colour/transform live in styles.info.
function infoVars(fontSize: string, letterSpacing: string, marginTop = 0): CSSProperties {
  return { fontSize, letterSpacing, marginTop };
}
