import { planToLevelArt, planToLevelConfig, type LevelPlan } from "@game/levels/levelPlan";
import { registerGeneratedArchetypes } from "@game/types/enemyTypes";
import type { LevelArt } from "@game/levels/levelArt";
import type { LevelConfig } from "@game/levels/levels";
import { plan as fixture } from "./fixture";

/**
 * Every generated level, in declaration order. Adding a level is ONE line here
 * plus its own module — nothing else in the repo is edited, which is what makes
 * the harness safe by construction (§4.3).
 */
export const GENERATED_PLANS: readonly LevelPlan[] = [fixture];

// The module's only side effect, and it is idempotent: the archetypes must be
// known before anything resolves a kind. They all carry `weight: 0`, so this
// cannot change any default pool.
for (const plan of GENERATED_PLANS) registerGeneratedArchetypes(plan.archetypes);

export const GENERATED_LEVEL_CONFIGS: readonly LevelConfig[] =
  GENERATED_PLANS.map(planToLevelConfig);

export const GENERATED_LEVEL_ART: readonly LevelArt[] = GENERATED_PLANS.map(planToLevelArt);
