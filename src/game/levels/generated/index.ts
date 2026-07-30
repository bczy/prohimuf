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

/**
 * Two plans sharing an id corrupt the level tables silently: `LEVEL_ART` is
 * last-wins while `ALL_LEVELS.find` is first-wins, so one level would be played
 * with the other's decor. Throwing at import turns that into an unmissable crash
 * on the first line of the app instead.
 *
 * Only the DUPLICATE-WITHIN-GENERATED half lives here: checking a collision with
 * a shipped id would need `LEVELS`, and `levels.ts` imports THIS module (cycle).
 * Re-declaring the shipped ids locally would add a constant that can drift
 * unnoticed, so that half is a CI invariant in generatedLevels.test.ts.
 */
export function assertDistinctPlanIds(plans: readonly LevelPlan[]): void {
  const seen = new Set<string>();
  for (const plan of plans) {
    if (seen.has(plan.id)) {
      throw new Error(`generated level "${plan.id}" is declared twice — ids must be unique`);
    }
    seen.add(plan.id);
  }
}

assertDistinctPlanIds(GENERATED_PLANS);

// The module's only other side effect, and it is idempotent: the archetypes must be
// known before anything resolves a kind. They all carry `weight: 0`, so this
// cannot change any default pool.
for (const plan of GENERATED_PLANS) registerGeneratedArchetypes(plan.archetypes);

export const GENERATED_LEVEL_CONFIGS: readonly LevelConfig[] =
  GENERATED_PLANS.map(planToLevelConfig);

export const GENERATED_LEVEL_ART: readonly LevelArt[] = GENERATED_PLANS.map(planToLevelArt);
