import { describe, expect, it } from "vitest";
import {
  CORE_ARCHETYPES,
  WEIGHTED,
  archetype,
  registerGeneratedArchetypes,
  type Archetype,
} from "@game/types/enemyTypes";

const VIGILE: Archetype = {
  kind: "spec:vigile",
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
  spriteBase: "enemy_spec_vigile",
  variants: 1,
  tint: "#ffffff",
  aspect: 1,
};

/**
 * The archetype registry (spec-level-harness-sp1 §4.1). `CORE_ARCHETYPES` is the
 * exhaustive table of the 6 shipped kinds and the ONLY source `WEIGHTED` is built
 * from; `archetype()` is the single resolution point, with the same fallback to
 * `normal` that `pickKind` already applies.
 */
describe("archetype registry", () => {
  it("exposes the 6 core kinds, and only those, in CORE_ARCHETYPES", () => {
    expect(Object.keys(CORE_ARCHETYPES).sort()).toEqual(
      ["biker", "bonus", "civilian", "hostage_taker", "normal", "riot"].sort(),
    );
  });

  it("builds WEIGHTED from the core alone and keeps its frozen order", () => {
    const expected = (Object.keys(CORE_ARCHETYPES) as (keyof typeof CORE_ARCHETYPES)[]).flatMap(
      (k) => Array.from({ length: CORE_ARCHETYPES[k].weight }, () => k),
    );
    expect(WEIGHTED).toEqual(expected);
    // 52 (normal) + 15 (riot) + 15 (biker) + 11 (bonus) + 0 + 0.
    expect(WEIGHTED).toHaveLength(93);
  });

  it("resolves every core kind through archetype()", () => {
    for (const kind of Object.keys(CORE_ARCHETYPES) as (keyof typeof CORE_ARCHETYPES)[]) {
      expect(archetype(kind)).toBe(CORE_ARCHETYPES[kind]);
    }
  });

  it("falls back to normal for a kind nobody registered", () => {
    expect(archetype("pigalle:inexistant")).toBe(CORE_ARCHETYPES.normal);
  });

  it("resolves a registered level-authored archetype without touching the core", () => {
    const coreKeysBefore = Object.keys(CORE_ARCHETYPES);
    const weightedBefore = [...WEIGHTED];

    registerGeneratedArchetypes([VIGILE]);

    expect(archetype("spec:vigile")).toBe(VIGILE);
    // The frozen pool and the core table are untouched: a level-authored kind is
    // activated by its own roster.windowWeights, never by the default pool.
    expect(Object.keys(CORE_ARCHETYPES)).toEqual(coreKeysBefore);
    expect(WEIGHTED).toEqual(weightedBefore);
  });

  it("is idempotent per kind: re-registering the same id overwrites in place", () => {
    registerGeneratedArchetypes([VIGILE]);
    const again: Archetype = { ...VIGILE, hp: 3 };
    registerGeneratedArchetypes([again]);
    expect(archetype("spec:vigile")).toBe(again);
  });
});
