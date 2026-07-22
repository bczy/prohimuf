import { describe, it, expect } from "vitest";
import { BELLIARD_BOSS_ENABLED, LEVELS } from "../levels";
import type { LevelConfig } from "../levels";
import { createBossQte, shouldTriggerBossFinale } from "@game/systems/bossQteSystem";
import type { BossQteSpec } from "@game/types/bossQte";

/** Safe lookup of the shipped Belliard level (the codebase forbids non-null assertions). */
function belliard(): LevelConfig {
  const level = LEVELS.find((l) => l.id === "belliard");
  if (level === undefined) throw new Error("Rue Belliard must be a shipped level");
  return level;
}

// The harness-default boss spec the flag attaches when ON — Belliard's authored spec must match it.
const BELLIARD_BOSS_SPEC: BossQteSpec = {
  zoomSeconds: 2,
  anchor: { x: 0, y: -5 },
  phaseCount: 3,
  bossHp: 24,
  maxBlownWindows: 10,
  targetSeed: 20260719,
  decorProp: { position: { x: 1.4, y: 0.2 }, armPhaseIndex: 1 },
};

describe("levels — Belliard boss gate (story-boss-belliard-live, AC1)", () => {
  it("is ENABLED: the boss is Belliard's live end-gate", () => {
    expect(BELLIARD_BOSS_ENABLED).toBe(true);
  });

  it("flag ON ⇒ Belliard authors BOTH the bossQteSpec and its hostageQte (ADR-0059 D3, sequential)", () => {
    const level = belliard();
    expect(level.bossQteSpec).toBeDefined();
    // Bertrand, 2026-07-21: keep both — the hostage QTE (triggers 12s, resolves well within the
    // level) always finishes long before the timed-finale boss (created only at timeSeconds) can
    // exist, so the two are safely sequential, never concurrent (asserted in createInitialState).
    expect(level.hostageQte).toBeDefined();
  });

  it("the boss is the level's timed finale (fires once a spec is authored, not on quota)", () => {
    const level = belliard();
    // ADR-0059: the boss is created at TIMER EXPIRY, gated only on a spec being authored and no
    // boss born yet — NOT on the kill quota (which is score-only on a boss level).
    expect(shouldTriggerBossFinale(level.bossQteSpec ?? null, null)).toBe(true);
    // Once a boss has been born, it never re-fires.
    const spec = level.bossQteSpec;
    if (spec !== undefined) {
      expect(shouldTriggerBossFinale(spec, createBossQte(spec))).toBe(false);
    }
  });

  it("Belliard's authored spec is a legal boss (createBossQte invariants all pass)", () => {
    const spec = belliard().bossQteSpec;
    expect(spec).toBeDefined();
    if (spec === undefined) return; // narrow for strict optional / noUncheckedIndexedAccess
    expect(() => createBossQte(spec)).not.toThrow();
    expect(createBossQte(spec).bossHp).toBe(24);
    // Matches the harness-default shape.
    expect(spec).toEqual(BELLIARD_BOSS_SPEC);
  });
});
