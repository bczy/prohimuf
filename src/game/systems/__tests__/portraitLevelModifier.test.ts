import { describe, it, expect } from "vitest";
import type { LevelModifier } from "@game/types/levelModifier";
import { createInitialState, tickGameState, DEFAULT_LEVEL_PARAMS } from "@game/systems/stateMachine";
import { ENERGY_INITIAL } from "@game/systems/energySystem";
import { levelModifierFromPortrait } from "@game/systems/portraitRobotSystem";
import { FACADE_01 } from "@game/maps/facade01";

/**
 * ADR-0079 D4 — the verdict crosses to the NEXT level as an opaque `LevelModifier`, and
 * it has exactly two effects. The identity property (absent modifier ⇒ byte-identical
 * build) is the one that keeps this seam additive.
 */

const DT = 1 / 60;

function tick(state: ReturnType<typeof createInitialState>, delta = DT) {
  return tickGameState(state, false, 0.5, 0.5, delta, FACADE_01);
}

describe("no modifier ⇒ byte-identical to the pre-feature build", () => {
  it("createInitialState is unchanged when the field is absent or null", () => {
    const bare = createInitialState(FACADE_01);
    expect(bare.waveHoldRemaining).toBe(0);
    expect(bare.energy).toBe(ENERGY_INITIAL);
    expect(bare.enemies.length).toBeGreaterThan(0);

    const explicitNull = createInitialState(FACADE_01, {
      ...DEFAULT_LEVEL_PARAMS,
      modifier: null,
    });
    expect(explicitNull).toEqual(bare);
  });

  it("the wave-spawn guard is true on the first tick with no hold", () => {
    const state = tick(createInitialState(FACADE_01));
    expect(state.waveHoldRemaining).toBe(0);
    expect(state.wave).toBe(1);
  });
});

describe("energyDelta lands on the NEXT level's capital, through the existing clamp", () => {
  it("FAILED costs 20 of the initial capital (gate A1/A1c)", () => {
    const modifier = levelModifierFromPortrait({
      outcome: "FAILED",
      correctCount: 1,
      scoreDelta: 0,
    });
    const state = createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier });
    expect(state.energy).toBe(ENERGY_INITIAL - 20);
  });

  it("IDENTIFIED and PARTIAL move no energy — there is no reward (gate A1c)", () => {
    for (const outcome of ["IDENTIFIED", "PARTIAL"] as const) {
      const modifier = levelModifierFromPortrait({ outcome, correctCount: 4, scoreDelta: 0 });
      expect(
        createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier }).energy,
      ).toBe(ENERGY_INITIAL);
    }
  });

  it("an absurd malus is clamped, never negative", () => {
    const modifier: LevelModifier = {
      energyDelta: -10_000,
      firstWaveDelaySeconds: 0,
      narrativeBeat: "FAILED",
    };
    const state = createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier });
    expect(state.energy).toBe(0);
  });

  it("never costs a life, whatever the verdict", () => {
    for (const outcome of ["IDENTIFIED", "PARTIAL", "FAILED"] as const) {
      const modifier = levelModifierFromPortrait({ outcome, correctCount: 0, scoreDelta: 0 });
      const state = createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier });
      expect(state.lives).toBe(DEFAULT_LEVEL_PARAMS.lives);
    }
  });
});

describe("firstWaveDelaySeconds holds wave 1 (gate A6/A10)", () => {
  const held = (seconds: number) =>
    createInitialState(FACADE_01, {
      ...DEFAULT_LEVEL_PARAMS,
      modifier: { energyDelta: 0, firstWaveDelaySeconds: seconds, narrativeBeat: "IDENTIFIED" },
    });

  it("the street starts empty and the hold is seeded", () => {
    const state = held(20);
    expect(state.enemies).toEqual([]);
    expect(state.waveHoldRemaining).toBe(20);
    expect(state.wave).toBe(1);
  });

  it("no enemy and no wave rollover while the hold is live", () => {
    let state = held(20);
    for (let i = 0; i < 600; i += 1) state = tick(state);
    expect(state.enemies).toEqual([]);
    // The failure this guard exists for: an empty street inflating `wave` every frame.
    expect(state.wave).toBe(1);
    expect(state.waveHoldRemaining).toBeCloseTo(10, 5);
  });

  it("wave 1 seats on the tick the hold reaches 0, and never before", () => {
    let state = held(0.05);
    state = tick(state, 0.04);
    expect(state.enemies).toEqual([]);
    expect(state.waveHoldRemaining).toBeCloseTo(0.01, 6);

    state = tick(state, 0.02);
    expect(state.waveHoldRemaining).toBe(0);
    expect(state.enemies.length).toBeGreaterThan(0);
    expect(state.wave).toBe(2);
  });

  it("the hold never goes negative", () => {
    let state = held(1);
    for (let i = 0; i < 200; i += 1) state = tick(state);
    expect(state.waveHoldRemaining).toBe(0);
  });

  it("a zero hold is the legacy path — wave 1 is seated at creation", () => {
    const state = held(0);
    expect(state.waveHoldRemaining).toBe(0);
    expect(state.enemies.length).toBeGreaterThan(0);
  });
});
