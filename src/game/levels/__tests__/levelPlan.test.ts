import { describe, expect, it } from "vitest";
import {
  planToLevelArt,
  planToLevelConfig,
  validateLevelPlan,
  type LevelPlan,
} from "@game/levels/levelPlan";

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

describe("planToLevelConfig", () => {
  it("projects the plan into a playable, locked LevelConfig", () => {
    const cfg = planToLevelConfig({ ...base, archetypes: [vigile] });
    expect(cfg.id).toBe("fixture");
    expect(cfg.kind).toBe("playable");
    expect(cfg.name).toBe("Fixture");
    expect(cfg.district).toBe("Test");
    expect(cfg.year).toBe("1998");
    expect(cfg.enemiesToWin).toBe(5);
    expect(cfg.timeSeconds).toBe(60);
    expect(cfg.enemySpeedMultiplier).toBe(1);
    // A generated level is never unlocked by default — it opens through progress.
    expect(cfg.unlocked).toBe(false);
    // `deliveries[0]` seeds GameState.deliveryVehicle: a playable level needs one.
    expect(cfg.deliveries).toHaveLength(1);
  });

  it("carries the plan's window weights into the roster (the activation seam)", () => {
    const cfg = planToLevelConfig({
      ...base,
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigile": 20 } },
    });
    expect(cfg.roster?.windowWeights).toEqual({ "fixture:vigile": 20 });
  });
});

describe("planToLevelArt", () => {
  it("projects the plan into a single-wide LevelArt with no per-layer prompt", () => {
    const art = planToLevelArt(base);
    expect(art.id).toBe("fixture");
    expect(art.label).toBe("Fixture, Paris, 1998");
    expect(art.backdrop).toEqual({ mode: "single-wide", file: "street-wide", aspect: 5.14 });
    // The decor comes from the paid single-wide pipeline, not from gen-level-art.
    expect(art.prompts).toEqual({});
  });

  it("projects the props as near-foreground objects, keeping their declared order", () => {
    const art = planToLevelArt({
      ...base,
      props: [
        {
          kind: "fixture:kiosque",
          asset: "assets/nearfg/fixture/kiosque.png",
          aspect: 0.6,
          heightFrac: 0.28,
          footPadFrac: 0.15,
          x: 0.22,
          row: "far",
        },
        {
          kind: "fixture:borne",
          asset: "assets/nearfg/fixture/borne.png",
          aspect: 0.3,
          heightFrac: 0.1,
          footPadFrac: 0.1,
          x: 0.7,
        },
      ],
    });
    expect(art.nearForeground?.objects).toEqual([
      { kind: "fixture:kiosque", x: 0.22, row: "far" },
      // `row` is OMITTED, never passed as undefined (exactOptionalPropertyTypes).
      { kind: "fixture:borne", x: 0.7 },
    ]);
  });
});
