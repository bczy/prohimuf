import { describe, expect, it } from "vitest";
import { ALL_LEVELS, GENERATED_LEVELS, LEVELS } from "@game/levels/levels";
import { GENERATED_PLANS } from "@game/levels/generated";
import { validateLevelPlan } from "@game/levels/levelPlan";
import { getLevelArt } from "@game/levels/levelArt";
import { archetype, buildWeightedFrom, CORE_ARCHETYPES } from "@game/types/enemyTypes";
import type { CoreEnemyKind } from "@game/types/enemy";

/**
 * The generated-level harness end to end (spec-level-harness-sp1 §8): a plan
 * declared in `generated/` yields a resolvable, playable level WITHOUT touching
 * the shipped campaign.
 */
const SHIPPED = ["tutorial", "belliard", "stalingrad", "vitry", "niveau-final"];

const DEFAULT_WEIGHTS = Object.fromEntries(
  (Object.keys(CORE_ARCHETYPES) as CoreEnemyKind[]).map((k) => [k, CORE_ARCHETYPES[k].weight]),
);

describe("generated levels", () => {
  it("every plan holds its own invariants", () => {
    expect(GENERATED_PLANS.length).toBeGreaterThan(0);
    for (const plan of GENERATED_PLANS) expect(validateLevelPlan(plan)).toEqual([]);
  });

  it("leaves the shipped campaign untouched", () => {
    // LEVELS is the shipped campaign and nothing else: its order drives the
    // index-based unlock hop, and niveau-final must stay its last playable level.
    expect(LEVELS.map((l) => l.id)).toEqual(SHIPPED);
  });

  it("resolves every generated level outside the campaign, through ALL_LEVELS", () => {
    const ids = GENERATED_PLANS.map((p) => p.id);
    expect(GENERATED_LEVELS.map((l) => l.id)).toEqual(ids);
    expect(ALL_LEVELS.map((l) => l.id)).toEqual([...SHIPPED, ...ids]);
    expect(ALL_LEVELS.map((l) => l.id)).toContain("fixture");
  });

  it("registers each plan's archetypes so they resolve by kind", () => {
    for (const plan of GENERATED_PLANS) {
      for (const a of plan.archetypes) expect(archetype(a.kind)).toBe(a);
    }
  });

  it("gives every generated level its own art, never the first level's fallback", () => {
    for (const plan of GENERATED_PLANS) {
      const art = getLevelArt(plan.id);
      expect(art.id).toBe(plan.id);
      expect(art.backdrop).toEqual(plan.backdrop);
    }
  });

  it("activates a level-authored kind in ITS pool, via windowWeights alone", () => {
    for (const plan of GENERATED_PLANS) {
      const level = GENERATED_LEVELS.find((l) => l.id === plan.id);
      const pool = buildWeightedFrom({ ...DEFAULT_WEIGHTS, ...level?.roster?.windowWeights });
      for (const [kind, weight] of Object.entries(plan.gameplay.windowWeights)) {
        expect(pool.filter((k) => k === kind)).toHaveLength(weight ?? 0);
      }
    }
  });

  it("never leaks a generated kind into the pool of a level that does not own it", () => {
    for (const level of ALL_LEVELS) {
      const pool = buildWeightedFrom({ ...DEFAULT_WEIGHTS, ...level.roster?.windowWeights });
      for (const kind of new Set(pool)) {
        if (kind.includes(":")) expect(kind.startsWith(`${level.id}:`)).toBe(true);
      }
    }
  });

  it("keeps the frozen default pool free of any generated kind", () => {
    const pool = buildWeightedFrom(DEFAULT_WEIGHTS);
    expect(pool.some((k) => k.includes(":"))).toBe(false);
  });
});
