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
 * resting wordmark (chrome fill, ink-black contour); only the way the letters arrive —
 * and, since 2026-07-25, how long it takes (see the TITLE reveal budget test) — differs:
 *   spray — an aerosol mist lands wide and soft, then bites into each letter in turn;
 *   paint — a hand fills each letter line by line, one colour per pass, pausing between
 *           strokes: the slow one, and the only one that reads as a gesture;
 *   blast — one detonation, and a cloud of drifting puffs that clears off the word.
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

/**
 * ONE puff of the blast's smoke: where it starts (em, from the wordmark's centre), how big
 * it is, where it drifts to, how much it grows on the way, how dark it gets at its peak, and
 * the slice of the cloud's window it lives in — the same six behaviours the boss veil gives
 * its particles (`createSmokeField`, `src/render/scene/smokeParticles.ts`).
 */
type SmokePuff = readonly [
  x: number,
  y: number,
  size: number,
  driftX: number,
  driftY: number,
  grow: number,
  peak: number,
  delay: number,
  life: number,
];

/**
 * The blast's smoke, as a fixed field of drifting puffs (the boss veil's model, ported to
 * the DOM — see `.smoke` in TitleScreen.module.css). Drawn ONCE, offline, from the boss
 * field's own spawn ranges over a 6×3 stratified grid so the cloud has no bald spot at its
 * peak — the dispersal only reads as a reveal if the wordmark was actually hidden. Baked in
 * as a table rather than drawn at mount: the cover must not shuffle its cloud on every
 * visit, and the render path stays free of `Math.random` (the FLYER_*_SEED discipline).
 */
const SMOKE_PUFFS: readonly SmokePuff[] = [
  [-1.22, -0.17, 1.16, -0.48, -0.65, 1.62, 0.83, 0.1, 0.68],
  [-0.71, -0.23, 0.9, -0.62, -1.19, 1.55, 0.79, 0.03, 0.97],
  [-0.35, -0.29, 1.02, -0.28, -0.63, 1.51, 0.84, 0.1, 0.75],
  [0.33, -0.24, 1.1, 0.24, -1.02, 1.68, 0.67, 0.07, 0.8],
  [0.65, -0.19, 1.19, 0.31, -0.61, 1.79, 0.74, 0.06, 0.92],
  [1.05, -0.19, 1.04, 0.02, -0.69, 1.53, 0.68, 0.03, 0.95],
  [-1.26, 0.14, 1.04, -0.45, -0.57, 1.89, 0.7, 0.04, 0.71],
  [-0.73, 0.08, 1.03, -0.16, -0.87, 1.46, 0.91, 0.07, 0.83],
  [-0.31, 0.0, 1.1, -0.2, -0.66, 1.3, 0.73, 0.1, 0.82],
  [0.23, 0.08, 0.87, 0.01, -0.5, 1.52, 0.88, 0.1, 0.78],
  [0.87, 0.09, 0.96, -0.08, -0.49, 1.83, 0.92, 0.01, 0.73],
  [1.3, 0.06, 1.19, -0.01, -0.86, 1.47, 0.68, 0.06, 0.94],
  [-1.27, 0.28, 0.92, -0.34, -0.9, 1.91, 0.89, 0.02, 0.7],
  [-0.84, 0.27, 0.87, -0.6, -0.63, 1.87, 0.68, 0.1, 0.86],
  [-0.33, 0.28, 1.06, -0.49, -0.71, 1.66, 0.75, 0.04, 0.8],
  [0.31, 0.35, 0.89, 0.31, -0.97, 1.42, 0.78, 0.02, 0.97],
  [0.8, 0.25, 1.14, 0.0, -0.5, 1.42, 0.83, 0.05, 0.76],
  [1.11, 0.37, 0.82, -0.25, -0.98, 1.68, 0.71, 0.08, 0.72],
];

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
              so DOM order decides), and only for the variant that has one. Each puff drifts
              on its own clock (see `.puff`); the container only holds them and screens the
              cloud through the print halftone. */}
          {animation === "blast" && (
            <span aria-hidden={true} data-muf-title-smoke={true} className={styles.smoke}>
              {SMOKE_PUFFS.map((puff) => (
                <span key={puff.join()} className={styles.puff} style={puffVars(puff)} />
              ))}
            </span>
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

// One puff's behaviour, handed to `.puff` as inline custom properties: geometry in `em` so
// the cloud scales with the wordmark, life/delay as fractions of the blast's motion token
// (ADR-0046 — a per-instance value has no business in the global token bridge).
function puffVars([x, y, size, driftX, driftY, grow, peak, delay, life]: SmokePuff): CSSProperties {
  return {
    "--puff-x": `${x.toString()}em`,
    "--puff-y": `${y.toString()}em`,
    "--puff-size": `${size.toString()}em`,
    "--puff-dx": `${driftX.toString()}em`,
    "--puff-dy": `${driftY.toString()}em`,
    "--puff-grow": grow.toString(),
    "--puff-peak": peak.toString(),
    "--puff-delay": delay.toString(),
    "--puff-life": life.toString(),
  } as CSSProperties;
}

// Per-line variable typography; static font/colour/transform live in styles.info.
function infoVars(fontSize: string, letterSpacing: string, marginTop = 0): CSSProperties {
  return { fontSize, letterSpacing, marginTop };
}
