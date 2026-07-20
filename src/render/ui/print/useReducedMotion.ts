import { useEffect } from "react";
import { applyReducedMotion } from "../applyPrintTokens";
import { useMediaQuery } from "./useMediaQuery";

/** The OS-level reduced-motion media query string (ADR-0052 §3). */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Pure union combiner (ADR-0052 §3): the in-app MOUVEMENT RÉDUIT toggle may
 * STRENGTHEN reduced motion but must never WEAKEN a live OS `reduce`. Exported so
 * the invariant is unit-testable without a DOM.
 */
export function unionReducedMotion(prefsReducedMotion: boolean, osReducedMotion: boolean): boolean {
  return prefsReducedMotion || osReducedMotion;
}

/**
 * The ONE shared derived reduced-motion signal (ADR-0052 §3), owned at the
 * render/bridge edge and read by every consumer so the union can never drift.
 * Unions the persisted `prefs.reducedMotion` field with the LIVE OS
 * `prefers-reduced-motion` query, mirrors the result onto the document root as
 * `data-reduced-motion` (the second trigger for `base.css`'s `--motion-*` zeroing,
 * alongside the existing `@media` block) and returns it for JS consumers that can't
 * read CSS vars (`CrtPass`). `matchMedia` lives here, never in `src/game`.
 */
export function useReducedMotionRoot(prefsReducedMotion: boolean): boolean {
  const osReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const effective = unionReducedMotion(prefsReducedMotion, osReducedMotion);
  useEffect(() => {
    applyReducedMotion(effective);
  }, [effective]);
  return effective;
}
