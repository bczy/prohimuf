import {
  planToLevelArt,
  planToLevelConfig,
  validateCatalogue,
  type LevelPlan,
} from "@game/levels/levelPlan";
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
 * The fail-fast on a duplicate id, as a throw. The RULE itself lives once, in
 * `validateCatalogue` (levelPlan.ts): this is only the wrapper that turns its issues
 * into the unmissable crash the runtime wants — two plans sharing an id would corrupt
 * the level tables silently (`LEVEL_ART` last-wins vs `ALL_LEVELS.find` first-wins).
 *
 * Only the DUPLICATE-WITHIN-GENERATED half lives here: checking a collision with
 * a shipped id would need `LEVELS`, and `levels.ts` imports THIS module (cycle).
 * Re-declaring the shipped ids locally would add a constant that can drift
 * unnoticed, so that half is a CI invariant in generatedLevels.test.ts.
 */
export function assertDistinctPlanIds(plans: readonly LevelPlan[]): void {
  const issues = validateCatalogue(plans);
  if (issues.length > 0) throw new Error(issues.map((i) => i.message).join("; "));
}

/**
 * The bootstrap fail-fast — ADR-0081 D6, a NARROW amendment to ADR-0075 §6: the throw
 * left the module body so an agent's MCP tool can import this catalogue mechanically
 * and REPORT a collision instead of dying on it. It did not disappear: the composition
 * root (`src/main.tsx`) calls this at module body, before the first render, so the app
 * still crashes on its first frame rather than playing a split-brained level. Idempotent
 * (a pure check), so React StrictMode's double-mount is harmless.
 *
 * Only the throw moved. The archetype registration below stays at import: it is
 * idempotent, all-`weight: 0` and inobservable, and `validateLevel.ts` depends on it
 * through a deliberate side-effect import so the standalone `validate` tool sees the
 * generated kinds.
 */
export function registerGeneratedLevels(): void {
  assertDistinctPlanIds(GENERATED_PLANS);
}

// The module's only side effect, and it is idempotent: the archetypes must be
// known before anything resolves a kind. They all carry `weight: 0`, so this
// cannot change any default pool.
for (const plan of GENERATED_PLANS) registerGeneratedArchetypes(plan.archetypes);

export const GENERATED_LEVEL_CONFIGS: readonly LevelConfig[] =
  GENERATED_PLANS.map(planToLevelConfig);

export const GENERATED_LEVEL_ART: readonly LevelArt[] = GENERATED_PLANS.map(planToLevelArt);
