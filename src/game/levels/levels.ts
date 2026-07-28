/**
 * Public barrel over the level types + the level catalogue (ADR-0074 §1). Pure re-exports:
 * no logic lives here, and it deliberately does NOT re-export progression, so nothing that
 * imports the catalogue can reach browser storage transitively — the two player-save
 * functions are imported from `@game/systems/progressSystem` instead.
 *
 * Existing consumers keep their import line unchanged; migrating them to the direct
 * `levels.data` / `types/level` paths is a later mechanical follow-up.
 */
export type { LevelConfig, LevelRoster } from "@game/types/level";
export type { Difficulty, DifficultyConfig } from "@game/levels/levels.data";
export {
  BELLIARD_BOSS_ENABLED,
  LEVELS,
  BOSS_QTE_DEV_HARNESS_LEVEL,
  FIRST_PLAYABLE_LEVEL,
  DIFFICULTY_CONFIG,
  GENERATED_LEVELS,
  ALL_LEVELS,
} from "@game/levels/levels.data";
