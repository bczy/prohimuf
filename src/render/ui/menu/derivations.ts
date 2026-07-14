/**
 * Pure, render-side derivations for the NIVEAUX flyer wall.
 *
 * This is the guard that the fanzine reskin preserved the shipped `LevelCard`
 * difficulty derivation byte-for-byte. It is intentionally **pure and
 * print-token-free** (no `@render/ui/print` import): the difficulty inks are the
 * §2bis.1 marker anchors, colocated with the derivation logic so the helper stays
 * unit-testable in isolation (the Vitest config aliases only `@game`/`@utils`, and
 * the repo tests pure render helpers as `.test.ts`, e.g. `haloFalloff`, `muzzleFor`).
 *
 * The three difficulty inks equal `MARK.green` / `MARK.orange` / `MARK.pink` in
 * `print/tokens.ts` (art-direction §2bis.1); consuming surfaces read the hex from
 * `difficultyMark().ink`, never re-declaring it.
 */

// §2bis.1 marker inks — the semantic difficulty tells (always with an ink-black
// keyline + distinct stamp shape on the flyer).
const MARK_GREEN = "#2FA84F"; // FACILE
const MARK_ORANGE = "#E8641E"; // NORMAL (middle tier)
const MARK_PINK = "#D62A7A"; // DIFFICILE

export interface DifficultyMark {
  readonly label: "FACILE" | "NORMAL" | "DIFFICILE";
  readonly ink: string;
}

/**
 * Difficulty stamp derived from `level.enemySpeedMultiplier`, preserving the exact
 * shipped `LevelCard` thresholds (`MainMenu.tsx`): `> 1.2 → DIFFICILE`,
 * `> 1.0 → NORMAL`, else `FACILE`. The middle-tier label is `NORMAL` (design-gate
 * condition f2 — the shipped render read `MOYEN`; this is a one-word render
 * alignment, no data touch). With shipped data only FACILE (belliard `1.0`) and
 * DIFFICILE (stalingrad `1.3`, vitry `1.6`) ever render; `NORMAL` is latent.
 */
export function difficultyMark(enemySpeedMultiplier: number): DifficultyMark {
  if (enemySpeedMultiplier > 1.2) return { label: "DIFFICILE", ink: MARK_PINK };
  if (enemySpeedMultiplier > 1.0) return { label: "NORMAL", ink: MARK_ORANGE };
  return { label: "FACILE", ink: MARK_GREEN };
}
