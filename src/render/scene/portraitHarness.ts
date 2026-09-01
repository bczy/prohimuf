/**
 * Portrait-robot capture seam — `?preview=portrait` (house convention, the sibling of
 * `?preview=title|menu|narrative|end|nameentry|tutorial` and of `?preview=boss`).
 *
 * Without it the scene is only reachable by finishing a level, which makes the
 * screenshot harness, `ux-designer`'s and `lead-art`'s screen reviews, and `qa-lead`'s
 * "entry board is 0/4 in the BUILT app" check (hand-off §3.3 step 3b) all cost a full
 * playthrough. Like the other seams it is deliberately NOT `import.meta.env.DEV`-gated
 * (ADR-0051 D4): Bertrand asked for these to work on a branch preview. Persistence stays
 * inert through App's existing `PREVIEW_SCREEN !== null` guard, and the phase writes
 * nothing of its own anyway.
 *
 * Pure: takes the search string, touches no `window`.
 */

/**
 * The seed a `?preview=portrait` boot uses when the URL names none. Fixed, so two
 * captures of the same build are the same board — a screenshot diff of a RANDOM board
 * would flag every re-run as a visual change.
 */
export const PORTRAIT_PREVIEW_SEED = 1998;

/**
 * Resolve the scene's seed (ADR-0079 D3 — the shell supplies it, the pure layer holds no
 * `Math.random`).
 *
 * Precedence, and it is what makes `?preview=portrait&portraitSeed=42` work: an explicit
 * `?portraitSeed=` always wins, on a preview boot as on a real run. Otherwise a preview
 * boot is deterministic (`PORTRAIT_PREVIEW_SEED`) and a real run draws once.
 */
export function resolvePortraitSeed(
  search: string,
  isPreview: boolean,
  draw: () => number,
): number {
  const raw = new URLSearchParams(search).get("portraitSeed");
  if (raw !== null && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw);
  return isPreview ? PORTRAIT_PREVIEW_SEED : draw();
}
