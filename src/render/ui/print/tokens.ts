/**
 * Pre-game print-token single source (AC3 / ADR-0021 D3 / art-direction §2bis.1).
 *
 * Presentation truth for the "loi de l'imprimé": paper stocks, ink, semantic marker
 * inks, masthead strings, deterministic flyer geometry and motion durations. Consumed
 * ONLY by render surfaces (`src/render/ui/**`). Holds no React and no game rule — the
 * render layer's own style source of truth. Every hex is the exact §2bis.1 anchor; no
 * pre-game surface may re-declare a stock/ink/marker hex or a masthead string.
 */

// Paper stocks — fluo copier card + newsprint grounds. Black ink clears WCAG AA
// (>=4.5:1) on every stock; the fluo cards sit at AA, not AAA (rose 6.14:1, orange
// 6.68:1), while >=7:1 (AAA) holds only on newsprint/manila.
export const STOCK = {
  jaune: "#F1EC1F", // TITLE cover only
  rose: "#FF4FA3", // flyer Belliard (playable idx 0); UNE masthead accent
  vert: "#B7F32B", // flyer Stalingrad (playable idx 1)
  orange: "#F5762A", // flyer Vitry (playable idx 2); OPTIONS colophon
  manila: "#ECE7DA", // tutorial "mode d'emploi" sheet
  newsprint: "#E9E3D2", // SCORES UNE ground; narrative/briefing ground
  shell: "#D7D2C6", // NIVEAUX flyer-wall backing
} as const;

// Typography — embedded self-hosted webfonts (OFL 1.1, see `src/assets/fonts/`, registered
// by `fonts.css` imported in `main.tsx`). Each stack leads with the bundled face and falls
// back to the former system stack so text renders before `font-display: swap` resolves and
// on a load failure. Single source: no UI surface may re-declare a font stack (art-direction
// §Typographie — the "display webfont" + "handwriting webfont" fast-follows, now landed).
export const FONT = {
  display: "'Anton', Impact, 'Arial Narrow', sans-serif", // ransom-note / flyer headlines
  mono: "'Courier Prime', 'Courier New', Courier, monospace", // typewriter body + HUD
  hand: "'Caveat', cursive", // felt-tip flyer annotations
} as const;

// Ink.
export const INK = {
  black: "#141210", // body, Courier blocks, rules, keylines
  full: "#000000", // display/ransom headlines + stamp fills
} as const;

// Marker / stamp inks (semantic — always with an ink-black keyline + distinct shape).
export const MARK = {
  green: "#2FA84F", // FACILE · record / rank-1 circle
  orange: "#E8641E", // NORMAL (middle tier)
  pink: "#D62A7A", // DIFFICILE
} as const;

// In-game HUD accent — NOT a print marker ink: the acid neon of the game world,
// drawn OVER the 3D scene only (never on a pre-game paper surface), always with
// an ink-black keyline, flat fill, zero glow (§2bis).
export const ACID = {
  yellow: "#FFE600", // off-screen target arrows
} as const;

// Masthead strings (copy-deck §5.1) — single-sourced; kills the divergent per-file mastheads.
export const MASTHEAD = {
  full: "UNDERGROUND PARIS · FANZINE CLANDESTIN · N°23 · NE SE VEND PAS", // cover
  running: "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998", // menu/narrative header
} as const;

// Short-landscape breakpoint (ADR-0024). Catches phones on their side (viewport
// height 360–430px); never laptops/tablets (>=640px tall). Height — not width — is
// the constraint, so the query gates on `max-height`. `(pointer: coarse)` scopes the
// reflow to touch devices so a mouse desktop stays byte-identical by construction.
export const SHORT_LANDSCAPE_MAX_H = 480;
export const SHORT_LANDSCAPE_MEDIA = `(orientation: landscape) and (max-height: ${SHORT_LANDSCAPE_MAX_H.toString()}px) and (pointer: coarse)`;

// Flyer stock rotation by PLAYABLE index (tutorial uses STOCK.manila, not this rotation).
export const FLYER_STOCK_BY_PLAYABLE_INDEX = [STOCK.rose, STOCK.vert, STOCK.orange] as const;

// Deterministic pile geometry (UX §3.2) — indexed by list position, NEVER Math.random.
export const FLYER_REST_ROTATION_DEG = [-3, 2, -1.5, 3, -2] as const;
export const FLYER_JITTER_PX = [-8, 8, -4, 6, -6] as const;
export const MAX_TILT_DEG = 3;

// Motion tokens (ms) — all forced to 0 under prefers-reduced-motion except the typewriter.
export const MOTION = {
  titleToMenu: 280,
  flyerPull: 140,
  rubriqueSwitch: 200,
  markerDraw: 90,
  charDelayMs: 28, // reuse the shipped NarrativeScreen value (consistency)
  cursorBlinkMs: 850,
  lockedShakeMs: 180,
} as const;
