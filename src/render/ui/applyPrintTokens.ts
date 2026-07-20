/**
 * Token bridge (ADR-0046 D2): mirrors the `tokens.ts` single source onto
 * `document.documentElement` as CSS custom properties at boot, so `.module.css`
 * files can reference `var(--ink-black)`, `var(--font-size-xs)`, … without ever
 * re-declaring a hex/font/motion/px literal in CSS. Called once from `main.tsx`.
 *
 * Data-driven on purpose: every token object is listed in `GROUPS`, so adding a
 * token to `tokens.ts` and its object here is the only step — a new key cannot be
 * silently dropped (covered by the unit test). Render-only: no `src/game` symbol.
 */
import {
  INK,
  STOCK,
  MARK,
  ACID,
  FONT,
  MOTION,
  FONT_SIZE,
  SPACE,
  KEYLINE_WIDTH,
  FLYER_MAX_WIDTH_PX,
  Z,
} from "./print/tokens";

type TokenRecord = Readonly<Record<string, string | number>>;
type Formatter = (value: string | number) => string;

// Colours / font stacks emit verbatim; numeric scales carry their unit.
const asIs: Formatter = (v) => String(v);
const ms: Formatter = (v) => `${String(v)}ms`;
const px: Formatter = (v) => `${String(v)}px`;

interface TokenGroup {
  /** kebab-case CSS-var namespace, e.g. `font-size` → `--font-size-xs`. */
  readonly prefix: string;
  readonly tokens: TokenRecord;
  readonly format: Formatter;
}

const GROUPS: readonly TokenGroup[] = [
  { prefix: "ink", tokens: INK, format: asIs },
  { prefix: "stock", tokens: STOCK, format: asIs },
  { prefix: "mark", tokens: MARK, format: asIs },
  { prefix: "acid", tokens: ACID, format: asIs },
  { prefix: "font", tokens: FONT, format: asIs },
  { prefix: "motion", tokens: MOTION, format: ms },
  { prefix: "font-size", tokens: FONT_SIZE, format: px },
  { prefix: "space", tokens: SPACE, format: px },
  { prefix: "z", tokens: Z, format: asIs },
];

const camelToKebab = (key: string): string => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Pure builder for the full `--namespace-key` → value map (unit-testable; the test
 * asserts it covers every token key). `applyPrintTokens` writes it onto `:root`.
 */
export function buildPrintTokenVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const { prefix, tokens, format } of GROUPS) {
    for (const [key, value] of Object.entries(tokens)) {
      vars[`--${prefix}-${camelToKebab(key)}`] = format(value);
    }
  }
  // KEYLINE_WIDTH is a lone scalar, not a group object.
  vars["--keyline-width"] = px(KEYLINE_WIDTH);
  // FLYER_MAX_WIDTH_PX is a lone scalar too — the shared A5 flyer cap (ADR-0049).
  vars["--flyer-max-width"] = px(FLYER_MAX_WIDTH_PX);
  return vars;
}

/** Writes every print token as a CSS custom property on the given root (default `:root`). */
export function applyPrintTokens(root: HTMLElement = document.documentElement): void {
  const vars = buildPrintTokenVars();
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

/**
 * Second trigger for the `--motion-*` zeroing (ADR-0052 §3). Reflects the shared
 * derived reduced-motion signal onto the root as `data-reduced-motion="true"`, so
 * `base.css` zeroes the motion durations from the in-app MOUVEMENT RÉDUIT toggle in
 * addition to the OS `@media (prefers-reduced-motion)` block. The attribute is
 * removed (not set to `"false"`) when off, so the `[data-reduced-motion="true"]`
 * selector matches only while reduced motion is actually active.
 */
export function applyReducedMotion(
  reduced: boolean,
  root: HTMLElement = document.documentElement,
): void {
  if (reduced) root.setAttribute("data-reduced-motion", "true");
  else root.removeAttribute("data-reduced-motion");
}
