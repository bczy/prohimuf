import { describe, it, expect } from "vitest";
import { createRunStats, foldRunStats, buildRunSummary } from "@game/systems/runStatsSystem";
import type { RunStats, RunStatsTickFacts } from "@game/types/runStats";
import type { GameState } from "@game/types/gameState";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { LootSpec } from "@game/types/loot";
import type { BossQte, BossQteSpec } from "@game/types/bossQte";
import { createBossQte } from "@game/systems/bossQteSystem";
import { createInitialState } from "@game/systems/stateMachine";
import { FACADE_01 } from "@game/maps/facade01";

const NO_FACTS: RunStatsTickFacts = {
  crateSpawned: false,
  cratePicked: false,
  damageTaken: 0,
  faultLivesLost: 0,
  livesBefore: 3,
  deliveryOutcome: null,
  deliveryIntegrity: null,
};

const facts = (over: Partial<RunStatsTickFacts>): RunStatsTickFacts => ({ ...NO_FACTS, ...over });

const DELIVERY_SPEC: DeliverySpec = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 300,
  entrySide: "left",
  stopPosition: { x: 0, y: 0 },
};

const LOOT_SPEC: LootSpec = {
  spawnIntervalSeconds: 12,
  drops: [{ weapon: "spread" }],
};

const vehicle = (over: Partial<DeliveryVehicle>): DeliveryVehicle => ({
  phase: "IDLE",
  position: { x: 0, y: 0 },
  vehicleType: "truck",
  integrity: 100,
  integrityMax: 100,
  windowRemaining: 0,
  ...over,
});

/**
 * A terminal `GameState`, built from the real initial state so the fixture can
 * never drift from the shape. The summary is a pure projection of a frozen state
 * — which is exactly why it is testable without simulating a run (ADR-0076 D1).
 */
const terminalState = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(FACADE_01),
  phase: "GAME_OVER",
  score: 4200,
  lives: 0,
  elapsedSeconds: 68.42,
  wave: 3,
  ...over,
});

describe("createRunStats", () => {
  it("seeds an empty accumulator carrying the starting gauge", () => {
    expect(createRunStats(3)).toEqual({
      pickupsCollected: 0,
      cratesSpawned: 0,
      heartsLostToDamage: 0,
      heartsLostToFaults: 0,
      heartsAtStart: 3,
      deliveryOutcome: null,
      deliveryIntegrityAtLatch: null,
    } satisfies RunStats);
  });

  it("seeds from the player's gauge preference, not a constant", () => {
    expect(createRunStats(5).heartsAtStart).toBe(5);
    expect(createRunStats(1).heartsAtStart).toBe(1);
  });
});

describe("foldRunStats — crates", () => {
  it("counts a spawn and a pickup independently", () => {
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ crateSpawned: true }));
    s = foldRunStats(s, facts({ cratePicked: true }));
    s = foldRunStats(s, facts({ crateSpawned: true }));
    expect(s.cratesSpawned).toBe(2);
    expect(s.pickupsCollected).toBe(1);
  });

  it("counts a crate that expired unpicked in the denominator only (spec D2.1.3)", () => {
    const s = foldRunStats(createRunStats(3), facts({ crateSpawned: true }));
    expect(s).toMatchObject({ cratesSpawned: 1, pickupsCollected: 0 });
  });

  it("counts ONE pickup for a spread volley: the fact is a per-tick boolean (AC-4)", () => {
    // The crate is consumed by the first projectile, so offsets 2 and 3 cannot see
    // it — the tick reports a single `cratePicked`, structurally.
    const s = foldRunStats(createRunStats(3), facts({ crateSpawned: true, cratePicked: true }));
    expect(s.pickupsCollected).toBe(1);
  });
});

describe("foldRunStats — hearts lost", () => {
  it("accumulates damage and faults in separate terms", () => {
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ damageTaken: 0.25 }));
    s = foldRunStats(s, facts({ faultLivesLost: 1 }));
    s = foldRunStats(s, facts({ damageTaken: 0.5 }));
    expect(s.heartsLostToDamage).toBe(0.75);
    expect(s.heartsLostToFaults).toBe(1);
  });

  it("never decreases when a crate heals the player (spec D2.3.3 / AC-7)", () => {
    // A crate reward moves the player's gauge; it is not a tick fact here, so the
    // exposure record cannot move. The counter measures exposure, not balance.
    const hit = foldRunStats(createRunStats(3), facts({ damageTaken: 1 }));
    const afterHeal = foldRunStats(hit, NO_FACTS);
    expect(afterHeal.heartsLostToDamage).toBe(1);
  });

  it("adds nothing for a tick absorbed by the invulnerability window (AC-5)", () => {
    // The tick reports `damageTaken: 0` for an absorbed bullet — no special case.
    const s = foldRunStats(foldRunStats(createRunStats(3), facts({ damageTaken: 0.5 })), NO_FACTS);
    expect(s.heartsLostToDamage).toBe(0.5);
  });

  it("clips an oversized fatal blow to what the gauge actually held (AC-6)", () => {
    // 2.75 already lost on a 3-heart gauge, then a riot cop lands 1.0 on the 0.25
    // that is left → 3, not 3.75: never charge damage the player did not take.
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ damageTaken: 2.75, livesBefore: 3 }));
    s = foldRunStats(s, facts({ damageTaken: 1, livesBefore: 0.25 }));
    expect(s.heartsLostToDamage).toBe(3);
  });

  it("clips a fault against the live gauge too, damage first", () => {
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ damageTaken: 2.5, livesBefore: 3 }));
    s = foldRunStats(s, facts({ faultLivesLost: 1, livesBefore: 0.5 }));
    expect(s.heartsLostToDamage + s.heartsLostToFaults).toBe(3);
    expect(s.heartsLostToFaults).toBe(0.5);
  });

  it("clips damage and fault landing on the same tick against the same gauge", () => {
    const s = foldRunStats(
      createRunStats(1),
      facts({ damageTaken: 0.5, faultLivesLost: 1, livesBefore: 1 }),
    );
    expect(s.heartsLostToDamage).toBe(0.5);
    expect(s.heartsLostToFaults).toBe(0.5);
  });

  it("lets total exposure exceed the starting gauge after a crate heal (fix B)", () => {
    // Gauge 3 → the run eats the whole gauge, a crate hands 3 hearts back, the run
    // eats 2 more. Exposure is 5 ♥: the starting gauge is a reading landmark, not a
    // ceiling on the total (spec D2.3.3 — the measure is exposure, not balance).
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ damageTaken: 3, livesBefore: 3 }));
    s = foldRunStats(s, facts({ damageTaken: 2, livesBefore: 3 }));
    expect(s.heartsLostToDamage).toBe(5);
    expect(s.heartsAtStart).toBe(3);
  });

  it("still refuses to charge more than the gauge held on the healed tick", () => {
    // Same shape, but the killing blow oversizes what is left after the heal.
    let s = createRunStats(3);
    s = foldRunStats(s, facts({ damageTaken: 3, livesBefore: 3 }));
    s = foldRunStats(s, facts({ damageTaken: 1, faultLivesLost: 1, livesBefore: 0.5 }));
    expect(s.heartsLostToDamage).toBe(3.5);
    expect(s.heartsLostToFaults).toBe(0);
  });
});

describe("foldRunStats — delivery latch", () => {
  it("latches the outcome and the integrity of the transition tick", () => {
    const s = foldRunStats(
      createRunStats(3),
      facts({ deliveryOutcome: "SUCCESS", deliveryIntegrity: 78 }),
    );
    expect(s).toMatchObject({
      deliveryOutcome: "SUCCESS",
      deliveryIntegrityAtLatch: 78,
    });
  });

  it("never re-writes the latch — a SUCCESS followed by anything stays SUCCESS (D2.2.5)", () => {
    let s = foldRunStats(
      createRunStats(3),
      facts({ deliveryOutcome: "SUCCESS", deliveryIntegrity: 78 }),
    );
    s = foldRunStats(s, facts({ deliveryOutcome: "FAILED", deliveryIntegrity: 0 }));
    s = foldRunStats(s, facts({ damageTaken: 0.25 }));
    expect(s).toMatchObject({ deliveryOutcome: "SUCCESS", deliveryIntegrityAtLatch: 78 });
  });

  it("leaves the latch untouched on a tick without a transition", () => {
    const s = foldRunStats(createRunStats(3), facts({ damageTaken: 0.25 }));
    expect(s.deliveryOutcome).toBeNull();
  });

  it("returns the previous record unchanged on an empty tick", () => {
    const prev = foldRunStats(createRunStats(3), facts({ damageTaken: 0.25, crateSpawned: true }));
    expect(foldRunStats(prev, NO_FACTS)).toEqual(prev);
  });
});

describe("buildRunSummary — end cause precedence (ADR-0076 D2)", () => {
  const BOSS_SPEC: BossQteSpec = {
    zoomSeconds: 2,
    anchor: { x: 0, y: 0 },
    phaseCount: 3,
    bossHp: 24,
    maxBlownWindows: 10,
    targetSeed: 20260719,
  };
  const bossQte = (over: Partial<BossQte>): BossQte => ({ ...createBossQte(BOSS_SPEC), ...over });

  it("BOSS_GAGNE — the duel resolved with the boss down", () => {
    const s = terminalState({
      phase: "LEVEL_COMPLETE",
      bossQte: bossQte({ phase: "DONE", bossHp: 0 }),
    });
    expect(buildRunSummary(s).endCause).toBe("BOSS_GAGNE");
  });

  it("BOSS_PERDU — the duel resolved with the boss alive", () => {
    const s = terminalState({ phase: "GAME_OVER", bossQte: bossQte({ phase: "DONE", bossHp: 2 }) });
    expect(buildRunSummary(s).endCause).toBe("BOSS_PERDU");
  });

  it("SANTE — GAME_OVER with the gauge at zero", () => {
    expect(buildRunSummary(terminalState({ phase: "GAME_OVER", lives: 0 })).endCause).toBe("SANTE");
  });

  it("TEMPS — GAME_OVER with hearts left (AC-12)", () => {
    expect(buildRunSummary(terminalState({ phase: "GAME_OVER", lives: 1.5 })).endCause).toBe(
      "TEMPS",
    );
  });

  it("QUOTA — LEVEL_COMPLETE without a boss", () => {
    expect(buildRunSummary(terminalState({ phase: "LEVEL_COMPLETE", lives: 2 })).endCause).toBe(
      "QUOTA",
    );
  });

  it("ignores a boss that has not resolved yet", () => {
    const s = terminalState({
      phase: "GAME_OVER",
      lives: 0,
      bossQte: bossQte({ phase: "ACTIVE" }),
    });
    expect(buildRunSummary(s).endCause).toBe("SANTE");
  });
});

describe("buildRunSummary — counters", () => {
  it("carries score and wave, and rounds the duration to one decimal (D2.4.2)", () => {
    const s = buildRunSummary(terminalState({ score: 4200, wave: 3, elapsedSeconds: 68.42 }));
    expect(s).toMatchObject({ score: 4200, wave: 3, durationSeconds: 68.4 });
  });

  it("reports hearts lost split by source, capped by the starting gauge", () => {
    let stats = createRunStats(3);
    stats = foldRunStats(stats, facts({ damageTaken: 0.5 }));
    stats = foldRunStats(stats, facts({ faultLivesLost: 1 }));
    expect(buildRunSummary(terminalState({ stats })).heartsLost).toEqual({
      total: 1.5,
      damage: 0.5,
      faults: 1,
      max: 3,
    });
  });

  it("reports pickups as null on a level that authors no crates (AC-8)", () => {
    expect(buildRunSummary(terminalState({ lootSpec: null })).pickups).toBeNull();
  });

  it("reports 0/0, not null, on a crate level where nothing spawned", () => {
    const s = buildRunSummary(terminalState({ lootSpec: LOOT_SPEC }));
    expect(s.pickups).toEqual({ collected: 0, spawned: 0 });
  });
});

describe("buildRunSummary — delivery issue (spec D2.2.3)", () => {
  const withDelivery = (over: Partial<GameState>): GameState =>
    terminalState({ deliverySpec: DELIVERY_SPEC, deliveryVehicle: vehicle({}), ...over });

  it("is null on a level that authors no delivery", () => {
    expect(buildRunSummary(terminalState({})).delivery).toBeNull();
  });

  it("REUSSIE with a FLOORED integrity percentage (D2.2.4 — 99.6 ⇒ 99)", () => {
    const stats = foldRunStats(
      createRunStats(3),
      facts({ deliveryOutcome: "SUCCESS", deliveryIntegrity: 99.6 }),
    );
    expect(buildRunSummary(withDelivery({ stats })).delivery).toEqual({
      issue: "REUSSIE",
      integrityPct: 99,
    });
  });

  it("PERDUE carries no percentage — it is 0 by construction", () => {
    const stats = foldRunStats(
      createRunStats(3),
      facts({ deliveryOutcome: "FAILED", deliveryIntegrity: 0 }),
    );
    expect(buildRunSummary(withDelivery({ stats })).delivery).toEqual({
      issue: "PERDUE",
      integrityPct: null,
    });
  });

  it("stays REUSSIE when the run later ends in GAME_OVER (D2.2.5)", () => {
    const stats = foldRunStats(
      createRunStats(3),
      facts({ deliveryOutcome: "SUCCESS", deliveryIntegrity: 100 }),
    );
    // The vehicle is long GONE by then — the latch is the only readable source.
    const s = withDelivery({
      stats,
      phase: "GAME_OVER",
      deliveryVehicle: vehicle({ phase: "GONE" }),
    });
    expect(buildRunSummary(s).delivery?.issue).toBe("REUSSIE");
  });

  it("INTERROMPUE with the live integrity when the run ends mid-window (AC-3)", () => {
    const s = withDelivery({
      deliveryVehicle: vehicle({ phase: "DELIVERING", integrity: 78, integrityMax: 100 }),
    });
    expect(buildRunSummary(s).delivery).toEqual({ issue: "INTERROMPUE", integrityPct: 78 });
  });

  it("INTERROMPUE while the vehicle is still rolling in", () => {
    const s = withDelivery({ deliveryVehicle: vehicle({ phase: "INCOMING", integrity: 100 }) });
    expect(buildRunSummary(s).delivery).toEqual({ issue: "INTERROMPUE", integrityPct: 100 });
  });

  it("NON_DECLENCHEE when the run ends before the scripted trigger (AC-11)", () => {
    const s = withDelivery({
      phase: "LEVEL_COMPLETE",
      deliveryVehicle: vehicle({ phase: "IDLE" }),
    });
    expect(buildRunSummary(s).delivery).toEqual({ issue: "NON_DECLENCHEE", integrityPct: null });
  });
});
