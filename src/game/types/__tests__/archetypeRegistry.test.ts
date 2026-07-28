import { describe, expect, it } from "vitest";
import { CORE_ARCHETYPES, WEIGHTED, archetype } from "@game/types/enemyTypes";

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
});
