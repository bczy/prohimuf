import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { CHROME, MASTHEAD, MOTION, STOCK, SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
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

// The wordmark, one entry per letter the reveal animates (see TitleScreen.module.css).
const WORDMARK = ["M", "U", "F"] as const;

/**
 * The three ways the cover can paint its wordmark. One is drawn at each mount, so the
 * same player meets a different cover on a second visit. All three end on the SAME
 * resting wordmark (chrome fill, ink-black contour) and share the same ~2s budget —
 * only the way the letters arrive differs:
 *   spray — an aerosol mist lands wide and soft, then bites into each letter in turn;
 *   paint — the can traces each glyph, dab by dab, along a predetermined path;
 *   blast — one detonation, and a halftone cloud that disperses off the finished word.
 */
export type TitleAnimation = "spray" | "paint" | "blast";

/**
 * Equiprobable draw over the three variants. The RNG is injected (the `makeDebris`
 * idiom) so the partition is unit-testable without stubbing globals, and the final
 * `return` is total: a `rand()` of exactly 1 — or a NaN from a broken stub — still
 * yields a real variant instead of `undefined`.
 */
export function pickTitleAnimation(rand: () => number): TitleAnimation {
  const draw = rand();
  if (draw < 1 / 3) return "spray";
  if (draw < 2 / 3) return "paint";
  return "blast";
}

// Chrome band tones, handed to the CSS module as inline custom properties (ADR-0046: a
// value with a single consumer flows inline rather than into the global token bridge).
const CHROME_VARS = {
  "--chrome-hi": CHROME.hi,
  "--chrome-mid": CHROME.mid,
  "--chrome-lo": CHROME.lo,
  "--chrome-edge": CHROME.edge,
} as CSSProperties;

/**
 * TITLE surface (ADR-0021 D1) — the zine cover on `STOCK.shell`. Single-action entry:
 * the whole surface is the hit target; a click / tap / printable key / Enter / Space /
 * Escape fires `onEnter()` immediately (no dwell, AC5). Events whose target is inside
 * `[data-muf-ui]` are excluded so tapping / activating the FullscreenButton never skips
 * into the menu (UX §5). Zero glow — the only pulse is the typewriter cursor.
 */
export function TitleScreen({ onEnter }: TitleScreenProps): JSX.Element {
  const ctaRef = useRef<HTMLDivElement>(null);
  // Drawn ONCE per mount (lazy initialiser), never per render — a re-render must not
  // restart the cover with a different animation. Cosmetic randomness in the render
  // layer, the same licence UrbanMotion's debris field takes; nothing in `src/game`
  // observes it, so no seeded PRNG is owed.
  const [animation] = useState<TitleAnimation>(() => pickTitleAnimation(Math.random));

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

  // Jaune stock — TITLE only (art-direction §2bis.1 pins the fluo copier card to the cover;
  // every other pre-game surface stays on newsprint/shell).
  return (
    <PaperSheet stock={STOCK.jaune} style={{ userSelect: "none" }}>
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

        {/* Wordmark — painted on the moment the cover shows, by whichever of the three
            variants was drawn (the class picks the keyframes; `data-muf-title-anim` is
            the stable hook for tests and the screenshot harness). Each span carries its
            stagger index and its `data-char` (which feeds the chrome-fill clone).
            Purely declarative: no timer, no per-frame state, so a reduced-motion user
            gets the finished wordmark from the very first paint. */}
        <div
          className={cx(styles.wordmark, styles[animation])}
          data-muf-title-anim={animation}
          style={{
            ...CHROME_VARS,
            fontSize: "var(--muf-wordmark-size, clamp(80px, 14vw, 160px))",
          }}
        >
          {WORDMARK.map((char, i) => (
            // Two nested spans, because the can's mist and the letter's ink must fade
            // INDEPENDENTLY (a parent's opacity would take its children with it): the outer
            // cell owns layout + the overspray it paints in ::after, the inner one owns the
            // ink (contour + chrome clone) and is what every variant actually reveals.
            <span
              key={char}
              className={styles.letter}
              style={{ "--muf-letter-index": i.toString() } as CSSProperties}
            >
              <span data-char={char} className={styles.glyph}>
                {char}
              </span>
            </span>
          ))}
          {/* Detonation cloud — LAST so it paints over the letters (both are positioned,
              so DOM order decides), and only for the variant that has one. */}
          {animation === "blast" && (
            <span aria-hidden={true} data-muf-title-smoke={true} className={styles.smoke} />
          )}
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
