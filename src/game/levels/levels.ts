/**
 * Public barrel over the level types + the level catalogue (ADR-0074 §1). It
 * deliberately does NOT re-export progression, so nothing that imports the catalogue
 * can reach browser storage transitively — the two player-save functions are imported
 * from `@game/systems/progressSystem` instead.
 *
 * The generated-level aggregation below lives HERE, not in `levels.data.ts`, on
 * purpose (panel run-5): ADR-0074 §2 binds the DATA module to literal-only,
 * side-effect-free imports, and importing `@game/levels/generated` is neither — its
 * module body registers each plan's archetypes into `enemyTypes`' module-level
 * registry (a cross-module Map mutation) and asserts distinct plan ids (can throw at
 * import). The barrel is not bound by §2, so a consumer that needs the catalogue
 * WITHOUT that side effect imports `levels.data` directly; a consumer of
 * `ALL_LEVELS` knowingly pulls the generated world in.
 *
 * Existing consumers keep their import line unchanged; migrating them to the direct
 * `levels.data` / `types/level` paths is a later mechanical follow-up.
 */
import type { LevelConfig } from "@game/types/level";
import { LEVELS } from "@game/levels/levels.data";
import { GENERATED_LEVEL_CONFIGS } from "@game/levels/generated";

export type { LevelConfig, LevelRoster } from "@game/types/level";
export type { Difficulty, DifficultyConfig } from "@game/levels/levels.data";
export {
  BELLIARD_BOSS_ENABLED,
  LEVELS,
  BOSS_QTE_DEV_HARNESS_LEVEL,
  FIRST_PLAYABLE_LEVEL,
  DIFFICULTY_CONFIG,
} from "@game/levels/levels.data";

/**
 * The harness-generated levels (spec-level-harness-sp1 §4.3), each derived from
 * the single `LevelPlan` of its own module.
 *
 * They are deliberately NOT in `LEVELS`, which is the SHIPPED CAMPAIGN: its order
 * drives the index-based unlock hop (App.tsx `LEVELS[i + 1]`), niveau-final is its
 * last playable level, its ids mirror `levelArt.json` one for one, and every sprite
 * it rosters must ship on disk. A generated level satisfies none of that by design —
 * promoting one to the campaign is a deliberate, separate act.
 */
export const GENERATED_LEVELS: readonly LevelConfig[] = GENERATED_LEVEL_CONFIGS;

/** Every level this build can run: the shipped campaign plus the generated ones. */
export const ALL_LEVELS: readonly LevelConfig[] = [...LEVELS, ...GENERATED_LEVELS];
