import { describe, it, expect } from "vitest";
import { validateLevel, hostageBossMarginIssue } from "@game/levels/validateLevel";
import type { LevelIssue } from "@game/levels/validateLevel";
import { LEVELS, GENERATED_LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";
import type { LevelConfig, LevelRoster } from "@game/levels/levels";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import { registerGeneratedArchetypes } from "@game/types/enemyTypes";
import type { Archetype } from "@game/types/enemyTypes";

/**
 * `validateLevel` — the single source of generic `LevelConfig` invariants (ADR-0074 §3).
 * AC4→AC7 of story-level-data-extraction are this file's test list.
 */

const BASE: LevelConfig = {
  id: "test-level",
  name: "Test",
  district: "Test",
  year: "1998",
  enemySpeedMultiplier: 1,
  enemiesToWin: 10,
  timeSeconds: 90,
  unlocked: false,
  deliveries: [],
};

const DELIVERY = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 500,
  entrySide: "left",
  stopPosition: { x: 0, y: -4.5 },
} as const;

// Worst case = 12 + 2 + 4 × 1.5 + QTE_RESULT_HOLD (2.2) = 22.2 s.
const HOSTAGE: QteSpec = {
  triggerAtElapsedSeconds: 12,
  zoomSeconds: 2,
  anchor: { x: 0, y: -5 },
  maxBlownPeeks: 4,
  peekCadenceSeconds: 1.5,
  peekDurationSeconds: 1.5,
  captorHp: 3,
  targetSeed: 1,
};

const BOSS: BossQteSpec = {
  zoomSeconds: 2,
  anchor: { x: 0, y: -5 },
  phaseCount: 3,
  bossHp: 24,
  maxBlownWindows: 10,
  targetSeed: 2,
};

function codes(issues: readonly LevelIssue[]): readonly string[] {
  return issues.map((i) => i.code);
}

describe("validateLevel — the shipped catalogue (AC4)", () => {
  // GENERATED_LEVELS included (panel run-5): validateLevelPlan guards the PLAN, but the
  // projected LevelConfig must also hold the generic invariants — validateLevel is the
  // single source (ADR-0074 §3), and an invariant added there alone must still cover
  // every generated level. Importing the barrel registers the generated archetypes.
  it.each(
    [...LEVELS, ...GENERATED_LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL].map((l) => [l.id, l] as const),
  )("reports no issue on %s", (_id, level) => {
    expect(validateLevel(level)).toStrictEqual([]);
  });

  it("reports no issue on a minimal config", () => {
    expect(validateLevel(BASE)).toStrictEqual([]);
  });
});

describe("validateLevel — hostage/boss timing margin (AC5)", () => {
  it("returns an issue when the hostage's worst case leaves less than the safety margin", () => {
    // worst case 22.2 s + 5 s margin = 27.2 ⇒ a 25 s level violates it.
    const issues = validateLevel({
      ...BASE,
      timeSeconds: 25,
      hostageQte: HOSTAGE,
      bossQteSpec: BOSS,
    });
    expect(codes(issues)).toContain("hostage-boss-margin");
    const issue = issues.find((i) => i.code === "hostage-boss-margin");
    expect(issue?.severity).toBe("error");
    expect(issue?.field).toBe("hostageQte");
    // Parity with the `createInitialState` throw, which must keep matching this regex.
    expect(issue?.message).toMatch(/not safely sequential/);
    expect(issue?.message).toContain("22.2");
    expect(issue?.message).toContain("25");
  });

  it("does not fire when only one of the two cinematics is authored", () => {
    expect(validateLevel({ ...BASE, timeSeconds: 25, hostageQte: HOSTAGE })).toStrictEqual([]);
    expect(validateLevel({ ...BASE, timeSeconds: 25, bossQteSpec: BOSS })).toStrictEqual([]);
  });

  it("fires exactly at the margin boundary (>= is the guard, per the shipped throw)", () => {
    // worst case 22.2 + margin 5 = 27.2: equal ⇒ violation, just above ⇒ clean.
    expect(
      codes(validateLevel({ ...BASE, timeSeconds: 27.2, hostageQte: HOSTAGE, bossQteSpec: BOSS })),
    ).toStrictEqual(["hostage-boss-margin"]);
    expect(
      validateLevel({ ...BASE, timeSeconds: 27.3, hostageQte: HOSTAGE, bossQteSpec: BOSS }),
    ).toStrictEqual([]);
  });

  it("treats a non-finite timeSeconds as a violation (deliberate, stricter than the old guard)", () => {
    // The clearance test returns null only when the margin HOLDS, so NaN falls through to an
    // issue — and therefore to the `createInitialState` throw. A level whose clock is NaN
    // cannot honour a timing invariant and must not boot; the pre-refactor `>=` let it pass.
    const issues = validateLevel({
      ...BASE,
      timeSeconds: NaN,
      hostageQte: HOSTAGE,
      bossQteSpec: BOSS,
    });
    expect(codes(issues)).toContain("hostage-boss-margin");
    expect(
      hostageBossMarginIssue({ hostageQte: HOSTAGE, bossQteSpec: BOSS, timeSeconds: NaN })?.code,
    ).toBe("hostage-boss-margin");
  });

  it("exposes the margin as a shared predicate the state machine can call", () => {
    expect(
      hostageBossMarginIssue({ hostageQte: HOSTAGE, bossQteSpec: BOSS, timeSeconds: 90 }),
    ).toBeNull();
    expect(
      hostageBossMarginIssue({ hostageQte: HOSTAGE, bossQteSpec: null, timeSeconds: 1 }),
    ).toBeNull();
    expect(
      hostageBossMarginIssue({ hostageQte: HOSTAGE, bossQteSpec: BOSS, timeSeconds: 25 })?.code,
    ).toBe("hostage-boss-margin");
  });
});

describe("validateLevel — roster.windowWeights slots (AC6)", () => {
  it("names an unknown enemy kind", () => {
    const roster = { windowWeights: { zombie: 40 } } as unknown as LevelRoster;
    const issues = validateLevel({ ...BASE, roster });
    expect(codes(issues)).toStrictEqual(["unknown-enemy-kind"]);
    expect(issues[0]?.field).toBe("roster.windowWeights.zombie");
    expect(issues[0]?.message).toContain("zombie");
    expect(issues[0]?.severity).toBe("error");
  });

  it("accepts every real EnemyKind", () => {
    const roster: LevelRoster = {
      windowWeights: { normal: 40, riot: 28, biker: 20, bonus: 10, civilian: 0, hostage_taker: 0 },
    };
    expect(validateLevel({ ...BASE, roster })).toStrictEqual([]);
  });

  it("reports every unknown slot, in declaration order", () => {
    const roster = { windowWeights: { zombie: 1, normal: 2, ghost: 3 } } as unknown as LevelRoster;
    const issues = validateLevel({ ...BASE, roster });
    expect(issues.map((i) => i.field)).toStrictEqual([
      "roster.windowWeights.zombie",
      "roster.windowWeights.ghost",
    ]);
  });
});

describe("validateLevel — namespaced kind ownership (panel: cross-level leak)", () => {
  // A REGISTERED generated archetype, namespaced on a level that is NOT the config under
  // test: `hasArchetype` resolves it (it exists), so only the ownership check can reject
  // it. Unique namespace so this registration never collides with the real generated set.
  const FOREIGN: Archetype = {
    kind: "vl-foreign-owner:goon",
    hp: 1,
    bulletDamage: 0,
    hiddenDuration: 1,
    visibleDuration: 1,
    shoots: false,
    scoreDelta: 0,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: false,
    weight: 0,
    spriteBase: "enemy_sprite",
    variants: 1,
    tint: "#ffffff",
    aspect: 1,
  };
  registerGeneratedArchetypes([FOREIGN]);

  it("rejects a registered kind namespaced on ANOTHER level (no cross-level leak)", () => {
    const roster = {
      windowWeights: { "vl-foreign-owner:goon": 10 },
    } as unknown as LevelRoster;
    const issues = validateLevel({ ...BASE, roster });
    expect(codes(issues)).toStrictEqual(["foreign-enemy-kind"]);
    expect(issues[0]?.field).toBe("roster.windowWeights.vl-foreign-owner:goon");
    expect(issues[0]?.message).toContain("vl-foreign-owner");
    expect(issues[0]?.severity).toBe("error");
  });

  it("accepts the same kind on the level that OWNS its namespace", () => {
    const roster = {
      windowWeights: { "vl-foreign-owner:goon": 10 },
    } as unknown as LevelRoster;
    expect(validateLevel({ ...BASE, id: "vl-foreign-owner", roster })).toStrictEqual([]);
  });

  it("still reports an UNKNOWN namespaced kind as unknown, not foreign", () => {
    const roster = {
      windowWeights: { "vl-nowhere:ghost": 10 },
    } as unknown as LevelRoster;
    expect(codes(validateLevel({ ...BASE, roster }))).toStrictEqual(["unknown-enemy-kind"]);
  });
});

describe("validateLevel — trigger times inside [0, timeSeconds] (AC7)", () => {
  it("flags a delivery trigger past the end of the level", () => {
    const issues = validateLevel({
      ...BASE,
      timeSeconds: 10,
      deliveries: [{ ...DELIVERY, triggerAtElapsedSeconds: 20 }],
    });
    expect(codes(issues)).toStrictEqual(["trigger-out-of-range"]);
    expect(issues[0]?.field).toBe("deliveries[0].triggerAtElapsedSeconds");
    expect(issues[0]?.message).toContain("20");
    expect(issues[0]?.message).toContain("10");
  });

  it("flags a negative delivery trigger", () => {
    const issues = validateLevel({
      ...BASE,
      deliveries: [{ ...DELIVERY, triggerAtElapsedSeconds: -1 }],
    });
    expect(issues[0]?.field).toBe("deliveries[0].triggerAtElapsedSeconds");
  });

  it("flags a hostage QTE trigger out of range", () => {
    const issues = validateLevel({
      ...BASE,
      timeSeconds: 10,
      hostageQte: { ...HOSTAGE, triggerAtElapsedSeconds: 11 },
    });
    expect(issues.map((i) => i.field)).toStrictEqual(["hostageQte.triggerAtElapsedSeconds"]);
  });

  it("flags a loot spawn interval out of range", () => {
    const issues = validateLevel({
      ...BASE,
      timeSeconds: 10,
      loot: { spawnIntervalSeconds: 15, drops: [] },
    });
    expect(issues.map((i) => i.field)).toStrictEqual(["loot.spawnIntervalSeconds"]);
  });

  it("accepts both interval bounds (0 and timeSeconds)", () => {
    expect(
      validateLevel({
        ...BASE,
        timeSeconds: 10,
        deliveries: [{ ...DELIVERY, triggerAtElapsedSeconds: 0 }],
        loot: { spawnIntervalSeconds: 10 },
      }),
    ).toStrictEqual([]);
  });

  it("reports every offending field, deliveries first then hostage then loot", () => {
    const issues = validateLevel({
      ...BASE,
      timeSeconds: 10,
      deliveries: [
        { ...DELIVERY, triggerAtElapsedSeconds: 0 },
        { ...DELIVERY, triggerAtElapsedSeconds: 40 },
      ],
      hostageQte: { ...HOSTAGE, triggerAtElapsedSeconds: 50 },
      loot: { spawnIntervalSeconds: 60 },
    });
    expect(issues.map((i) => i.field)).toStrictEqual([
      "deliveries[1].triggerAtElapsedSeconds",
      "hostageQte.triggerAtElapsedSeconds",
      "loot.spawnIntervalSeconds",
    ]);
  });
});

describe("validateLevel — contract", () => {
  it("never throws and returns issues in a stable, check-declaration order", () => {
    const roster = { windowWeights: { zombie: 1 } } as unknown as LevelRoster;
    const config: LevelConfig = {
      ...BASE,
      timeSeconds: 25,
      roster,
      hostageQte: { ...HOSTAGE, triggerAtElapsedSeconds: 99 },
      bossQteSpec: BOSS,
    };
    const first = validateLevel(config);
    expect(codes(first)).toStrictEqual([
      "hostage-boss-margin",
      "unknown-enemy-kind",
      "trigger-out-of-range",
    ]);
    // Deterministic: same input, same array, verbatim (story ③ compares results).
    expect(validateLevel(config)).toStrictEqual(first);
  });
});
