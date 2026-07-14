/**
 * Pure, render-side derivations for the NIVEAUX flyer wall.
 *
 * This is the guard that the fanzine reskin preserved the shipped `LevelCard`
 * difficulty derivation byte-for-byte. It stays **React-free** (a pure helper the repo
 * tests as `.test.ts`, e.g. `haloFalloff`, `muzzleFor`) and reads the §2bis.1 marker
 * inks from the single `print/tokens.ts` source via a relative import — tokens.ts holds
 * no React, so it resolves fine under the Vitest config (AC3 dedup, no re-declared hexes).
 *
 * The three difficulty inks are `MARK.green` / `MARK.orange` / `MARK.pink`
 * (art-direction §2bis.1); consuming surfaces read the hex from `difficultyMark().ink`.
 */
import { MARK } from "../print/tokens";

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
  if (enemySpeedMultiplier > 1.2) return { label: "DIFFICILE", ink: MARK.pink };
  if (enemySpeedMultiplier > 1.0) return { label: "NORMAL", ink: MARK.orange };
  return { label: "FACILE", ink: MARK.green };
}
