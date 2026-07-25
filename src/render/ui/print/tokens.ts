/**
 * Pre-game print-token single source (AC3 / ADR-0021 D3 / art-direction §2bis.1).
 *
 * Presentation truth for the "loi de l'imprimé": paper stocks, ink, semantic marker
 * inks, masthead strings, deterministic flyer geometry and motion durations. Consumed
 * ONLY by render surfaces (`src/render/ui/**`). Holds no React and no game rule — the
 * render layer's own style source of truth. Every hex is the exact §2bis.1 anchor; no
 * pre-game surface may re-declare a stock/ink/marker hex or a masthead string.
 */
import type { Corner } from "./TapeCorner";

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
// on a load failure. Single source: no DOM UI surface may re-declare a font stack (art-direction
// §Typographie — the "display webfont" + "handwriting webfont" fast-follows, now landed). The
// one exception is `src/render/scene/FeedbackLayer.tsx`, which paints score/combo numerals on a
// 2D canvas where a `font-display: swap` webfont can't be used without `document.fonts.ready`
// orchestration; it keeps a system-font stack by design (scene layer, not DOM UI).
export const FONT = {
  display: "'Rubik Mono One', Impact, 'Arial Narrow', sans-serif", // techno-flyer headlines
  mono: "'Courier Prime', 'Courier New', Courier, monospace", // typewriter body + pre-game
  hand: "'Caveat', cursive", // felt-tip flyer annotations
  // In-game HUD ticker ONLY (lead-art pre-approved): IBM Plex Mono holds its stroke at
  // the 11–14px strip sizes where Courier Prime's thin hairlines break up. Falls back to
  // Courier Prime so the ticker still renders before swap / on a load failure. Menus and
  // the print system keep FONT.mono.
  hudMono: "'IBM Plex Mono', 'Courier Prime', 'Courier New', monospace",
} as const;

// Ink.
export const INK = {
  black: "#141210", // body, Courier blocks, rules, keylines
  full: "#000000", // display/ransom headlines + stamp fills
  mute: "#555555", // muted caption grey — Pause slider/toggle labels + ESC hint
} as const;

// Marker / stamp inks (semantic — always with an ink-black keyline + distinct shape).
export const MARK = {
  green: "#2FA84F", // FACILE · record / rank-1 circle
  orange: "#E8641E", // NORMAL (middle tier)
  pink: "#D62A7A", // DIFFICILE
} as const;

// Chrome / silver bands — the TITLE wordmark fill ONLY. NOT an ink and NOT a marker: the
// letter is still DEFINED by its ink-black contour (art-direction §2bis), the bands only
// fill the inside of that contour, so the cover stays "loi de l'imprimé" with one metallic
// accent. Four POSTERISED tones, laid down as hard stops (lead-art gate): a page whose
// identity is the degraded photocopy cannot carry the one object with a continuous ramp and
// a specular fold — a metal sticker run through a copier collapses to flat bands. Every tone
// stays inside the printable band: no near-white sheen on a light stock (§2bis.2). Neutral
// greys (no blue tint). Deliberately OUT of the applyPrintTokens bridge (single consumer):
// TitleScreen injects these as inline CSS custom properties on the wordmark — the ADR-0046
// escape hatch — so `--chrome-*` never becomes a global paint license.
export const CHROME = {
  hi: "#CFCCC3", // lightest printable band — toner grey, NOT a highlight
  mid: "#9E9B94", // body band
  lo: "#6E6C66", // shadow band under the fold
  edge: "#46443F", // the fold itself; stays clear of the ink-black contour
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

// Flyer paper materiality (art-direction §2bis.2, ADR-0049) — every value indexed by
// list position like FLYER_REST_ROTATION_DEG; NO Math.random anywhere in the render path.

// Half-A4 portrait cap — the single shared flyer width (UX flyer-wall-format §2, reconciled
// down from "~300–340px" at the 2026-07-19 design gate). Exposed to CSS as `--flyer-max-width`
// by applyPrintTokens.ts so the wrap-grid / narrow-column caps read one source of truth.
export const FLYER_MAX_WIDTH_PX = 280;

// Hand-cut edge (§2bis.2 pt2): the guillotine/scissor waver never exceeds ~3px, budgeted
// against the FLYER_MAX_WIDTH_PX × A5 reference box. FLYER_EDGE_SEED holds per-flyer inward
// deviation magnitudes (px), one entry per polygon vertex — same amplitude, different
// vertices, so the wall reads as one bad guillotine, not four treatments.
export const FLYER_EDGE_MAX_DEV_PX = 3;
export const FLYER_EDGE_SEED: readonly (readonly number[])[] = [
  [2.4, 1.2, 1.8, 2.1, 1.5, 2.7, 1.0, 2.2],
  [1.1, 2.6, 2.2, 1.4, 2.8, 1.7, 2.0, 1.3],
  [2.9, 1.5, 1.2, 2.4, 1.9, 2.2, 1.6, 2.8],
  [1.6, 2.1, 2.7, 1.3, 1.1, 2.5, 2.3, 1.8],
  [2.0, 1.4, 1.7, 2.6, 2.2, 1.2, 2.9, 1.5],
] as const;

// Dog-eared corner (§2bis.2 pt4): KEEP one folded corner — but only on a chosen few sheets
// (null = flat), so the fold reads as handling, not a uniform treatment.
export const FLYER_DOG_EAR_CORNER: readonly (Corner | null)[] = [null, "tr", null, "bl", null];

// Fold crease angle (§2bis.2 pt4): one sanctioned diagonal darkening streak per sheet, its
// angle fanning from a different handling grip per flyer.
export const FLYER_CREASE_ANGLE_DEG: readonly number[] = [103, 78, 116, 94, 70];

// Weathered subset (§2bis.2 pt4): only these indices get a SECOND parallel crease, so a
// fresh-vs-worn contrast runs across the wall instead of uniform wear.
export const FLYER_WEATHERED_INDICES: ReadonlySet<number> = new Set([1, 3]);

// Masking-tape geometry (§2bis.2 pt6): real proportions — wider, shorter than the old thin
// stroke. Strip WIDTH in px; the length that bridges the corner lives in flyerGeometry.
export const TAPE_WIDTH_PX = 30;

// Per-corner fray seed (§2bis.2 pt6): 1–2px jags at the two strip TIPS only (deterministic,
// no Math.random). Six magnitudes per corner — left tip [top, mid, bottom], right tip
// [top, mid, bottom] — consumed by tapeStripPath; long sides stay near-straight.
export const TAPE_FRAY_SEED: Record<Corner, readonly number[]> = {
  tl: [1.6, 0.6, 1.9, 0.8, 1.7, 1.1],
  tr: [0.9, 1.8, 1.2, 1.6, 0.7, 1.9],
  bl: [1.9, 1.0, 0.7, 1.4, 1.8, 0.6],
  br: [0.7, 1.5, 1.7, 1.0, 1.3, 1.8],
};

// The paint variant's rhythm, from the bottom up: a can lays ONE line, the arm travels to the
// start of the next one (no paint in the air), and once the letter is filled the writer swaps
// cans for the other colour and starts again. Everything below is derived from these four, so
// the whole gesture is retuned by moving one number — and the wordmark's total with it.
const TITLE_PAINT_LINES = 6; // spray lines per pass — the ladder in TitleScreen.module.css
const TITLE_PAINT_LINE_MS = 45; // one line, laid across the letter
const TITLE_PAINT_LINE_GAP_MS = 85; // …then the arm travels back: silence, no paint appears
const TITLE_PAINT_PASS_GAP_MS = 300; // between two colours: put one can down, pick the next up
const TITLE_PAINT_LETTER_GAP_MS = 200; // and the step across to the next letter
const TITLE_PAINT_PASSES = 2; // the ink contour, then the metal
const TITLE_PAINT_PASS_MS = TITLE_PAINT_LINES * (TITLE_PAINT_LINE_MS + TITLE_PAINT_LINE_GAP_MS);
const TITLE_PAINT_LETTER_MS = TITLE_PAINT_PASS_MS * TITLE_PAINT_PASSES + TITLE_PAINT_PASS_GAP_MS;

// Motion tokens (ms) — all forced to 0 under prefers-reduced-motion except the typewriter.
export const MOTION = {
  titleToMenu: 280,
  flyerPull: 140,
  rubriqueSwitch: 200,
  markerDraw: 90,
  charDelayMs: 28, // reuse the shipped NarrativeScreen value (consistency)
  cursorBlinkMs: 850,
  lockedShakeMs: 180,
  // TITLE wordmark reveal — ONE of three variants is drawn at each mount (see
  // `pickTitleAnimation`). Each variant gets its OWN budget (they are no longer held to a
  // single shared window: see the TITLE reveal budget test for why the parity was traded
  // away). All are killed (animation: none, wordmark shown at its resolved state) under
  // either reduced-motion trigger, in TitleScreen.module.css.
  //
  // "spray": one can-stroke per letter (well under the 1s/letter budget)…
  titleSprayMs: 620,
  // …and the gap between two strokes — the hand moving to the next letter. ≈ 2.02s.
  titleSprayStaggerMs: 700,
  // "paint": the can FILLS each letter line by line, and it lays one colour at a time — so a
  // letter takes one sweep per colour: the ink contour, then the metal (Bertrand,
  // 2026-07-25). The two halves of a line's slot — the spray, then the silence while the arm
  // travels — are what the rhythm is made of; the CSS derives its `--muf-line-on` overshoot
  // from their ratio (bound by the tokens test).
  titlePaintLineMs: TITLE_PAINT_LINE_MS,
  titlePaintLineGapMs: TITLE_PAINT_LINE_GAP_MS,
  // One pass = the six lines of one colour, travel time included.
  titlePaintPassMs: TITLE_PAINT_PASS_MS,
  // Pass 1 → pass 2, i.e. the first pass plus the can swap (the CSS reads it as a delay).
  titlePaintPassStepMs: TITLE_PAINT_PASS_MS + TITLE_PAINT_PASS_GAP_MS,
  // One letter, both passes and the swap between them…
  titlePaintMs: TITLE_PAINT_LETTER_MS,
  // …and the next letter only starts once the can has left this one: there is ONE can, so no
  // two letters — and no two lines — are ever being painted at the same instant. ≈ 5.98s for
  // the wordmark, the slowest of the three variants by design (see the budget test).
  titlePaintStaggerMs: TITLE_PAINT_LETTER_MS + TITLE_PAINT_LETTER_GAP_MS,
  // "blast": ONE detonation for the whole wordmark (no per-letter stagger) — the smoke
  // cloud's full life. Long enough for the puffs to visibly DRIFT (they are a particle
  // field now, not a dot screen: a cloud that never moves does not read as smoke).
  titleBlastMs: 2800,
  // …and the much shorter settle of the letters themselves, which are thrown out by the
  // blast and are already at rest behind the cloud long before it clears.
  titleBlastSettleMs: 520,
} as const;

// Typographic size scale (px) — NAMED from the sizes the HUD/menus already use
// (9/11/12/16/18/20/22/44/48/56), NOT a new grid. Monotonic: xs→displayXl. The
// `display*` tier is the ransom/headline register; the smaller steps are body/HUD.
export const FONT_SIZE = {
  xs: 9, // HUD micro-labels, colophon fine print
  sm: 11, // stamp / small body
  md: 12, // HUD level name
  base: 16, // delivery call-out chip
  lg: 18, // HUD energy value
  xl: 20, // delivery verdict chip
  xxl: 22, // HUD score / value
  display: 44, // OTAGE warning stamp
  displayLg: 48, // QTE verdict stamp
  displayXl: 56, // end-of-level phase stamp
} as const;

// Spacing scale (px) — NAMED from the gaps/padding steps already in use
// (4/6/8/12/16/24). One-off values outside this set (e.g. the 3px energy-column
// gap) stay as literals; the scale carries only the recurring steps.
export const SPACE = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const;

// Dominant keyline weight (px) — the 2px ink rule that borders the HUD strip, paper
// chips and gauge frames. Heavier one-off borders (3px stamps, 1px micro-gauges)
// stay as literals; this is the single named default.
export const KEYLINE_WIDTH = 2;

// Z-index scale — names the implicit stacking of the in-game HUD layers, which are
// separate `position: fixed` surfaces ordered only by DOM sequence today: the paper
// strip (hud) < the arrow/QTE-wash overlays (overlay) < the centred set-piece stamps
// (modal). Sits BELOW the pre-game chrome (pause 100 / rotate 200 / fullscreen 300).
export const Z = {
  hud: 10,
  overlay: 20,
  modal: 30,
} as const;
