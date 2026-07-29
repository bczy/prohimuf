import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  LEVELS,
  BOSS_QTE_DEV_HARNESS_LEVEL,
  FIRST_PLAYABLE_LEVEL,
  DIFFICULTY_CONFIG,
  BELLIARD_BOSS_ENABLED,
} from "@game/levels/levels";
import PRE from "./fixtures/levelsCatalogue.pre.json";

/**
 * AC1 (story-level-data-extraction / ADR-0074): the data/code split must not move a single
 * value. `fixtures/levelsCatalogue.pre.json` was serialised from the PRE-refactor
 * `levels.ts` (the 441-line mixed module, at HEAD before the split) and is the frozen
 * reference; every export re-exported by the barrel must still deep-equal it.
 *
 * FIXTURE WITHDRAWAL NOTE (JSON carries no comments, so it lives here): the fixture freezes
 * `BELLIARD_BOSS_ENABLED: true` AND the resulting `bossQteSpec` on `belliard`. Flipping the flag
 * OFF is a sanctioned seam, not a regression — when that happens, regenerate the fixture from
 * the commit of the flip and re-read this test. Do NOT make the comparison flag-aware: the
 * fixture stays dumb and literal (ruling: `senior-architect`, stage-6 panel triage).
 *
 * `toStrictEqual` is deliberate: the fixture carries NO `bossQteSpec` key on the levels that
 * author none, so a regression that made the conditional spread emit `bossQteSpec: undefined`
 * (instead of omitting the key — `exactOptionalPropertyTypes`) fails here. This is the one
 * test that must not be weakened.
 */
describe("level catalogue — pre/post extraction parity (AC1)", () => {
  it("BELLIARD_BOSS_ENABLED keeps its effective value", () => {
    expect(BELLIARD_BOSS_ENABLED).toStrictEqual(PRE.BELLIARD_BOSS_ENABLED);
  });

  it("LEVELS is value-for-value identical, in the same order", () => {
    expect(LEVELS).toStrictEqual(PRE.LEVELS);
  });

  it("BOSS_QTE_DEV_HARNESS_LEVEL is unchanged and still out of LEVELS", () => {
    expect(BOSS_QTE_DEV_HARNESS_LEVEL).toStrictEqual(PRE.BOSS_QTE_DEV_HARNESS_LEVEL);
    expect(LEVELS.some((l) => l.id === BOSS_QTE_DEV_HARNESS_LEVEL.id)).toBe(false);
  });

  it("FIRST_PLAYABLE_LEVEL still resolves to the same entry", () => {
    expect(FIRST_PLAYABLE_LEVEL).toStrictEqual(PRE.FIRST_PLAYABLE_LEVEL);
  });

  it("DIFFICULTY_CONFIG is unchanged", () => {
    expect(DIFFICULTY_CONFIG).toStrictEqual(PRE.DIFFICULTY_CONFIG);
  });

  it("the data module and the barrel carry no progression / storage reference (AC2)", () => {
    for (const file of ["levels.data.ts", "levels.ts"]) {
      const source = readFileSync(resolve(__dirname, "..", file), "utf8");
      expect(source).not.toMatch(/localStorage|loadUnlockedLevels|unlockLevel|muf_progress/);
    }
  });
});
