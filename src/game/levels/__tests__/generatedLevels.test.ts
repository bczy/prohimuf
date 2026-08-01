import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_LEVELS, GENERATED_LEVELS, LEVELS } from "@game/levels/levels";
import {
  assertDistinctPlanIds,
  GENERATED_PLANS,
  registerGeneratedLevels,
} from "@game/levels/generated";
import { validateCatalogue, validateLevelPlan } from "@game/levels/levelPlan";
import { getLevelArt } from "@game/levels/levelArt";
import { enemyAssetPathsFor, levelLayerPaths, manifestFor } from "@game/systems/assetManifest";
import { archetype, buildWeightedFrom, CORE_ARCHETYPES } from "@game/types/enemyTypes";
import type { CoreEnemyKind } from "@game/types/enemy";
import type { LevelIssue } from "@game/levels/validateLevel";
// Namespace type-only imports (no runtime evaluation — bare-import purity intact):
// consistent-type-imports forbids `typeof import(...)` query positions.
import type * as GeneratedBarrel from "@game/levels/generated";
import type * as LevelPlanModule from "@game/levels/levelPlan";

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

  it("refuses two plans sharing an id (art would be overwritten, config would not)", () => {
    const first = GENERATED_PLANS[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    expect(() => {
      assertDistinctPlanIds([first, first]);
    }).toThrow(/fixture/);
    expect(() => {
      assertDistinctPlanIds(GENERATED_PLANS);
    }).not.toThrow();
  });

  it("keeps the REAL catalogue free of duplicate ids (C2: the invariant on the actual data)", () => {
    // The synthetic pair above only proves the FUNCTION; this line proves the
    // catalogue that ships. Same call the MCP `validate`/`scaffold` tools make.
    expect(validateCatalogue(GENERATED_PLANS)).toEqual([]);
  });

  it("never reuses a shipped level id", () => {
    // LEVEL_ART is last-wins while ALL_LEVELS.find is first-wins: a collision would
    // give a shipped level the generated art of its namesake. Guarded here because
    // `generated/index.ts` cannot import LEVELS (levels.ts imports IT).
    const shipped = new Set(LEVELS.map((l) => l.id));
    for (const plan of GENERATED_PLANS) expect(shipped.has(plan.id)).toBe(false);
  });

  it("preloads the generated skins and the generated backdrop, never belliard's", () => {
    for (const plan of GENERATED_PLANS) {
      const enemies = enemyAssetPathsFor(plan.id);
      for (const a of plan.archetypes) {
        expect(enemies.some((p) => p.includes(a.spriteBase))).toBe(true);
      }
      expect(levelLayerPaths(plan.id)).toEqual([
        `assets/levels/${plan.id}/${plan.backdrop.file}.png`,
      ]);
      const manifest = manifestFor(plan.id);
      expect(manifest).not.toContain("assets/levels/belliard/street-wide.png");
      for (const p of plan.props) expect(manifest).toContain(`nearfg:${p.kind}`);
    }
  });

  it("keeps every generated level's own tuning in the manifest fallback path", () => {
    // levelConfigFor used to resolve an unknown id to FIRST_PLAYABLE_LEVEL: a
    // generated level got belliard's roster (so belliard's enemy sprites).
    expect(enemyAssetPathsFor("fixture")).toContain("assets/enemy_fixture_vigile.png");
  });

  it("keeps the frozen default pool free of any generated kind", () => {
    const pool = buildWeightedFrom(DEFAULT_WEIGHTS);
    expect(pool.some((k) => k.includes(":"))).toBe(false);
  });
});

/**
 * The narrow reversal of ADR-0075 §6 (ADR-0077 D6, sign-off condition C1/C2): the
 * `throw` moved from the module body to `registerGeneratedLevels()`, called once at the
 * composition root. The ARCHETYPE REGISTRATION stays at the module body — it is
 * idempotent, all-weight-0 and load-bearing for `validateLevel.ts`'s deliberate
 * side-effect import (the MCP `validate` tool reads the generated kinds through it),
 * which is why the test above still sees `archetype()` resolve on a bare import.
 */
describe("generated levels — fail-fast at the bootstrap, not at import", () => {
  afterEach(() => {
    vi.doUnmock("@game/levels/levelPlan");
    vi.resetModules();
  });

  /** Re-import the barrel with `validateCatalogue` spied, module registry reset. */
  const importBarrelWith = async (
    validateCatalogueImpl: () => readonly LevelIssue[],
  ): Promise<{
    spy: ReturnType<typeof vi.fn>;
    barrel: typeof GeneratedBarrel;
  }> => {
    const spy = vi.fn(validateCatalogueImpl);
    vi.doMock("@game/levels/levelPlan", async () => {
      const actual = await vi.importActual<typeof LevelPlanModule>("@game/levels/levelPlan");
      return { ...actual, validateCatalogue: spy };
    });
    vi.resetModules();
    return { spy, barrel: await import("@game/levels/generated") };
  };

  it("does not run the catalogue check while the module body evaluates", async () => {
    const { spy, barrel } = await importBarrelWith(() => []);
    // The whole point of the story: an agent's MCP tool can import the catalogue
    // mechanically. Evaluating the barrel checks nothing and throws nothing.
    expect(spy).not.toHaveBeenCalled();
    barrel.registerGeneratedLevels();
    expect(spy).toHaveBeenCalledWith(barrel.GENERATED_PLANS);
  });

  it("throws from registerGeneratedLevels() on any issue validateCatalogue reports", async () => {
    const issue: LevelIssue = {
      code: "plan/duplicate-id",
      severity: "error",
      field: "plans[1].id",
      message: 'generated level "fixture" is declared twice — ids must be unique',
    };
    const { barrel } = await importBarrelWith(() => [issue]);
    expect(() => {
      barrel.registerGeneratedLevels();
    }).toThrow(/declared twice/);
  });

  it("is idempotent: a second call is a no-op (StrictMode double-mount, C4)", () => {
    expect(() => {
      registerGeneratedLevels();
      registerGeneratedLevels();
    }).not.toThrow();
    for (const plan of GENERATED_PLANS) {
      for (const a of plan.archetypes) expect(archetype(a.kind)).toBe(a);
    }
  });
});
