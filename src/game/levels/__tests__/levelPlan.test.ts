import { describe, expect, it } from "vitest";
import { validateLevelPlan, type LevelPlan } from "@game/levels/levelPlan";

/**
 * The LevelPlan schema (spec-level-harness-sp1 §4.4) and the invariants a plan
 * must hold. The validator is called from tests only: a bad plan breaks CI, never
 * the runtime.
 */
const base: LevelPlan = {
  id: "fixture",
  fiction: { name: "Fixture", label: "Fixture, Paris, 1998", district: "Test", year: "1998" },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [],
  props: [],
  gameplay: { enemiesToWin: 5, timeSeconds: 60, enemySpeedMultiplier: 1, windowWeights: {} },
};

const vigile = {
  kind: "fixture:vigile",
  hp: 2,
  bulletDamage: 0.5,
  hiddenDuration: 1.6,
  visibleDuration: 3,
  shoots: true,
  scoreDelta: 2,
  livesDelta: 0,
  timeDelta: 0,
  countsAsTarget: true,
  weight: 0,
  spriteBase: "enemy_fixture_vigile",
  variants: 1,
  tint: "#ffffff",
  aspect: 1,
} as const;

describe("validateLevelPlan", () => {
  it("accepts a minimal plan", () => {
    expect(validateLevelPlan(base)).toEqual([]);
  });

  it("rejects an archetype whose weight is not zero", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, weight: 3 }] };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("weight"));
  });

  it("rejects an archetype id namespaced on another level", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, kind: "autre:vigile" }] };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("rejects a prop with an incomplete sizing triplet", () => {
    const plan = {
      ...base,
      props: [{ kind: "fixture:kiosque", asset: "a.png", aspect: 0.6, x: 0.2 }],
    } as unknown as LevelPlan;
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("heightFrac"));
  });

  it("rejects a prop namespaced on another level", () => {
    const plan: LevelPlan = {
      ...base,
      props: [
        {
          kind: "autre:kiosque",
          asset: "a.png",
          aspect: 0.6,
          heightFrac: 0.28,
          footPadFrac: 0.15,
          x: 0.2,
        },
      ],
    };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });
});
