import { describe, expect, it } from "vitest";
import {
  BOSS_PHASE_TABLE,
  LULL_RESIDUAL_FLOOR,
  SHIELD_BREAK_LULL_CUT,
  SHIELD_BREAK_LULL_FLOOR_MARGIN,
  createBossQte,
  shieldedLullOf,
} from "@game/systems/bossQteSystem";
import { LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";
import type { BossQteSpec } from "@game/types/bossQte";
import type { PhotoLeverage } from "@game/types/photoLeverage";

const ALL: readonly PhotoLeverage[] = ["none", "master", "master-bonus"];
const FINAL = LEVELS.find((l) => l.id === "niveau-final")?.bossQteSpec;
const BELLIARD = LEVELS.find((l) => l.id === "belliard")?.bossQteSpec;

/**
 * §4 — the boss lever (E-4f). The trap this file exists to keep shut: `shieldedLullSeconds`
 * and `telegraphLeadSeconds` are MODULE constants shared by Belliard and the Niveau Final, so
 * a multiplier applied to the table would compress the boss of the very level the player just
 * photographed. "It can't happen" is exactly what K-2 said.
 */
describe("the multiplier is authored per ROW, never a module constant", () => {
  it("the Niveau Final authors tiers and it is the ONLY row that does", () => {
    expect(FINAL?.photoLeverageTiers).toEqual({ master: 0.9, masterBonus: 0.8 });
    for (const level of LEVELS) {
      if (level.id === "niveau-final") continue;
      expect(level.bossQteSpec?.photoLeverageTiers).toBeUndefined();
    }
    expect(BOSS_QTE_DEV_HARNESS_LEVEL.bossQteSpec?.photoLeverageTiers).toBeUndefined();
  });

  it("resolves the multiplier ONCE, into the runtime record", () => {
    expect(FINAL).toBeDefined();
    if (!FINAL) return;
    expect(createBossQte(FINAL, "none").rewardMultiplier).toBe(1.0);
    expect(createBossQte(FINAL, "master").rewardMultiplier).toBe(0.9);
    expect(createBossQte(FINAL, "master-bonus").rewardMultiplier).toBe(0.8);
  });

  it("Belliard's own Commandant is IDENTICAL at every leverage value (the D-F trap)", () => {
    // The real scenario since the relocation: the player holds `master-bonus`, earned on this
    // very level minutes earlier, and meets this encounter. It must resolve to x1.00.
    expect(BELLIARD).toBeDefined();
    if (!BELLIARD) return;
    const baseline = JSON.stringify(createBossQte(BELLIARD, "none"));
    for (const v of ALL) {
      expect(createBossQte(BELLIARD, v).rewardMultiplier).toBe(1.0);
      expect(JSON.stringify(createBossQte(BELLIARD, v))).toBe(baseline);
    }
  });

  it("the shared escalation table is never mutated by a construction", () => {
    const before = JSON.stringify(BOSS_PHASE_TABLE);
    if (FINAL) for (const v of ALL) createBossQte(FINAL, v);
    expect(JSON.stringify(BOSS_PHASE_TABLE)).toBe(before);
  });
});

describe("F10 — the compound floor, asserted at construction, NON-STRICT `>=`", () => {
  it("accepts the three shipped multipliers", () => {
    expect(FINAL).toBeDefined();
    if (!FINAL) return;
    for (const v of ALL) expect(() => createBossQte(FINAL, v)).not.toThrow();
  });

  it("rejects a tier below the legal wall (phase 2 binds)", () => {
    expect(FINAL).toBeDefined();
    if (!FINAL) return;
    const tooStrong: BossQteSpec = {
      ...FINAL,
      photoLeverageTiers: { master: 0.9, masterBonus: 0.5 },
    };
    expect(() => createBossQte(tooStrong, "master-bonus")).toThrow(/F10/);
    // …and the SAME spec is fine at a leverage that does not reach that tier.
    expect(() => createBossQte(tooStrong, "master")).not.toThrow();
  });

  it("the `>=` is non-strict on purpose: the shipped phase-3 baseline sits exactly on it", () => {
    const row = BOSS_PHASE_TABLE[2];
    expect(row).toBeDefined();
    if (!row) return;
    expect(row.shieldedLullSeconds - SHIELD_BREAK_LULL_CUT).toBeCloseTo(
      row.telegraphLeadSeconds + LULL_RESIDUAL_FLOOR,
      10,
    );
  });

  it("the runtime clamp is PROVABLY unreachable at every legal multiplier (AC12/K-3)", () => {
    // ε > the clamp's own margin, so `base − CUT ≥ tell + ε > tell + margin = floor`.
    expect(LULL_RESIDUAL_FLOOR).toBeGreaterThan(SHIELD_BREAK_LULL_FLOOR_MARGIN);
    for (const m of [1.0, 0.9, 0.8]) {
      for (let p = 0; p <= 1; p++) {
        const row = BOSS_PHASE_TABLE[p];
        expect(row).toBeDefined();
        if (!row) continue;
        const floor = row.telegraphLeadSeconds + SHIELD_BREAK_LULL_FLOOR_MARGIN;
        expect(m * row.shieldedLullSeconds - SHIELD_BREAK_LULL_CUT).toBeGreaterThan(floor);
      }
    }
  });
});

describe("R2-2 — the multiplier is PHASE-SCOPED to indices 0 and 1", () => {
  it("phase 3's lull, tell, exposed duration and drain are identical at every tier", () => {
    const row = BOSS_PHASE_TABLE[2];
    expect(row).toBeDefined();
    if (!row) return;
    // Asserted on the SINGLE application point itself, not on a re-derivation of it.
    for (const m of [1.0, 0.9, 0.8]) {
      expect(shieldedLullOf(row, 2, m)).toBe(row.shieldedLullSeconds);
      // …and any phase beyond the table's scope stays authored too.
      expect(shieldedLullOf(row, 5, m)).toBe(row.shieldedLullSeconds);
    }
  });

  it("phases 1 and 2 DO carry it — the scope is a boundary, not a coincidence", () => {
    for (const p of [0, 1]) {
      const row = BOSS_PHASE_TABLE[p];
      expect(row).toBeDefined();
      if (!row) continue;
      expect(shieldedLullOf(row, p, 0.8)).toBeCloseTo(0.8 * row.shieldedLullSeconds, 10);
    }
  });

  it("the opening lull the player actually meets DOES carry the multiplier (phase 1)", () => {
    expect(FINAL).toBeDefined();
    if (!FINAL) return;
    const base = BOSS_PHASE_TABLE[0]?.shieldedLullSeconds ?? 0;
    expect(createBossQte(FINAL, "none").stanceRemaining).toBeCloseTo(base, 10);
    expect(createBossQte(FINAL, "master").stanceRemaining).toBeCloseTo(0.9 * base, 10);
    expect(createBossQte(FINAL, "master-bonus").stanceRemaining).toBeCloseTo(0.8 * base, 10);
  });
});
