import { describe, it, expect } from "vitest";
import type { LevelModifier } from "@game/types/levelModifier";
import {
  createInitialState,
  tickGameState,
  DEFAULT_LEVEL_PARAMS,
} from "@game/systems/stateMachine";
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
      expect(createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier }).energy).toBe(
        ENERGY_INITIAL,
      );
    }
  });

  it("an absurd malus is clamped, never negative", () => {
    const modifier: LevelModifier = {
      scoreDelta: 0,
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

/**
 * Panel B1 + architect arbitration §6.2 — the score is the ONE field of the modifier that
 * settles the scene that just played. It travels in `LevelModifier` (single output
 * channel) but it is NOT spent by the next level's build; the shell applies it at the exit
 * of the portrait phase. These are the pure half of the seam: the value the shell reads,
 * observed at arrival, and the proof that the next level does not consume it.
 */
describe("scoreDelta crosses in the modifier and settles the PAST (§6.2)", () => {
  it("carries the gate barème from the resolved scene, verdict by verdict", () => {
    const barème = { IDENTIFIED: 1500, PARTIAL: 400, FAILED: 0 } as const;
    for (const outcome of ["IDENTIFIED", "PARTIAL", "FAILED"] as const) {
      const result = { outcome, correctCount: 4, scoreDelta: barème[outcome] };
      expect(levelModifierFromPortrait(result).scoreDelta).toBe(barème[outcome]);
    }
  });

  it("the next level does NOT spend it — its score still starts at 0", () => {
    const modifier = levelModifierFromPortrait({
      outcome: "IDENTIFIED",
      correctCount: 4,
      scoreDelta: 1500,
    });
    const state = createInitialState(FACADE_01, { ...DEFAULT_LEVEL_PARAMS, modifier });
    expect(state.score).toBe(0);
  });
});

describe("firstWaveDelaySeconds holds wave 1 (gate A6/A10)", () => {
  const held = (seconds: number) =>
    createInitialState(FACADE_01, {
      ...DEFAULT_LEVEL_PARAMS,
      modifier: {
        scoreDelta: 0,
        energyDelta: 0,
        firstWaveDelaySeconds: seconds,
        narrativeBeat: "IDENTIFIED",
      },
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
    // REGRESSION (panel B2). `every()` on an EMPTY array is `true`, so the released hold
    // read as "wave cleared" and rolled the wave over: the level the player EARNED started
    // at wave 2 and the payoff was a punishment. The wave the hold held back is wave ONE.
    expect(state.wave).toBe(1);
  });

  it("wave 1 is a full wave, and the rollover to 2 still needs it played", () => {
    // Same release, then the freshly seated wave is wiped: THAT is a rollover.
    let state = held(0.02);
    state = tick(state, 0.03);
    expect(state.wave).toBe(1);
    const seated = state.enemies.length;
    expect(seated).toBe(createInitialState(FACADE_01).enemies.length);

    state = tick({
      ...state,
      enemies: state.enemies.map((e) => ({ ...e, state: "DEAD" as const })),
    });
    expect(state.wave).toBe(2);
    expect(state.enemies.length).toBeGreaterThan(0);
    expect(state.enemies.every((e) => e.state !== "DEAD")).toBe(true);
  });

  it("the hold never goes negative", () => {
    let state = held(1);
    for (let i = 0; i < 200; i += 1) state = tick(state);
    expect(state.waveHoldRemaining).toBe(0);
  });

  it("the level clocks are FROZEN while the hold runs — the payoff does not pay for itself", () => {
    let state = held(2);
    for (let i = 0; i < 60; i += 1) state = tick(state);
    expect(state.waveHoldRemaining).toBeCloseTo(1, 5);
    // The three level clocks: the timer, the delivery/QTE script, the courier spawn clock.
    expect(state.timeRemaining).toBe(DEFAULT_LEVEL_PARAMS.timeSeconds);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.courierTimer).toBe(createInitialState(FACADE_01).courierTimer);
  });

  it("the clocks resume on the tick the hold is released", () => {
    let state = held(DT / 2);
    state = tick(state);
    expect(state.waveHoldRemaining).toBe(0);
    expect(state.elapsedSeconds).toBeCloseTo(DT, 6);
    expect(state.timeRemaining).toBeLessThan(DEFAULT_LEVEL_PARAMS.timeSeconds);
  });

  it("a zero hold is the legacy path — wave 1 is seated at creation", () => {
    const state = held(0);
    expect(state.waveHoldRemaining).toBe(0);
    expect(state.enemies.length).toBeGreaterThan(0);
  });
});
