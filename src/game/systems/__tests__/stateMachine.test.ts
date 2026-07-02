import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tickGameState,
  LEVEL_TIME_SECONDS,
  ENEMIES_TO_WIN,
  BELLIARD_CARGO_PICKUP,
  BELLIARD_CARGO_DEPOT,
} from "../stateMachine";
import type { LevelParams } from "../stateMachine";
import { FACADE_01 } from "@game/maps/facade01";
import { LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import type { GameState } from "@game/types/gameState";
import type { CourierField } from "@game/systems/courierSystem";
import { pickKind } from "@game/types/enemyTypes";

/** Mirror of the render lane's LevelConfig -> LevelParams mapping for cargo. */
function paramsForLevel(level: LevelConfig): LevelParams {
  return {
    lives: 3,
    timeSeconds: level.timeSeconds,
    enemiesToWin: level.enemiesToWin,
    enemySpeedMultiplier: level.enemySpeedMultiplier,
    cargoPickup: level.cargoPickup,
    cargoDepot: level.cargoDepot,
  };
}

function levelById(id: string): LevelConfig {
  const level = LEVELS.find((l) => l.id === id);
  if (level === undefined) throw new Error(`missing level ${id}`);
  return level;
}

const noFire = false;
const fire = true;
const FIELD: CourierField = { halfWidth: 40, streetY: -5 };

describe("createInitialState", () => {
  it("creates PLAYING phase", () => {
    const state = createInitialState(FACADE_01);
    expect(state.phase).toBe("PLAYING");
  });

  it("score is 0, lives is 3, timeRemaining is LEVEL_TIME_SECONDS", () => {
    const state = createInitialState(FACADE_01);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.timeRemaining).toBe(LEVEL_TIME_SECONDS);
  });

  it("wave starts at 1", () => {
    const state = createInitialState(FACADE_01);
    expect(state.wave).toBe(1);
  });

  it("spawns initial enemies", () => {
    const state = createInitialState(FACADE_01);
    expect(state.enemies.length).toBeGreaterThan(0);
  });

  it("seeds cargo TO_PICKUP", () => {
    const state = createInitialState(FACADE_01);
    expect(state.cargo.status).toBe("TO_PICKUP");
  });

  it("defaults cargo to the belliard positions (no regression)", () => {
    const state = createInitialState(FACADE_01);
    expect(state.cargo.pickup).toEqual(BELLIARD_CARGO_PICKUP);
    expect(state.cargo.depot).toEqual(BELLIARD_CARGO_DEPOT);
    expect(state.cargo.pickup).toEqual({ x: -6, y: -3 });
    expect(state.cargo.depot).toEqual({ x: 6, y: -3 });
  });

  it("seeds cargo positions from the supplied level params", () => {
    const params = paramsForLevel(levelById("stalingrad"));
    const state = createInitialState(FACADE_01, params);
    expect(state.cargo.pickup).toEqual(params.cargoPickup);
    expect(state.cargo.depot).toEqual(params.cargoDepot);
  });

  it("belliard params reproduce the historical cargo positions", () => {
    const state = createInitialState(FACADE_01, paramsForLevel(levelById("belliard")));
    expect(state.cargo.pickup).toEqual({ x: -6, y: -3 });
    expect(state.cargo.depot).toEqual({ x: 6, y: -3 });
  });

  it("different levels produce different cargo positions", () => {
    const belliard = createInitialState(FACADE_01, paramsForLevel(levelById("belliard")));
    const stalingrad = createInitialState(FACADE_01, paramsForLevel(levelById("stalingrad")));
    const vitry = createInitialState(FACADE_01, paramsForLevel(levelById("vitry")));

    expect(stalingrad.cargo.pickup).not.toEqual(belliard.cargo.pickup);
    expect(stalingrad.cargo.depot).not.toEqual(belliard.cargo.depot);
    expect(vitry.cargo.pickup).not.toEqual(belliard.cargo.pickup);
    expect(vitry.cargo.pickup).not.toEqual(stalingrad.cargo.pickup);
  });

  it("keeps cargo collect-left / drop-right at ground level for every level", () => {
    for (const level of LEVELS) {
      const state = createInitialState(FACADE_01, paramsForLevel(level));
      expect(state.cargo.pickup.x).toBeLessThan(0); // collect on the left
      expect(state.cargo.depot.x).toBeGreaterThan(0); // drop on the right
      expect(state.cargo.pickup.y).toBeLessThan(0); // at ground level
      expect(state.cargo.depot.y).toBeLessThan(0);
    }
  });
});

describe("tickGameState — terminal phases", () => {
  it("does nothing when phase is GAME_OVER", () => {
    const state: GameState = { ...createInitialState(FACADE_01), phase: "GAME_OVER" };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next).toBe(state);
  });

  it("does nothing when phase is LEVEL_COMPLETE", () => {
    const state: GameState = { ...createInitialState(FACADE_01), phase: "LEVEL_COMPLETE" };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next).toBe(state);
  });
});

describe("tickGameState — timer", () => {
  it("decrements timeRemaining", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.timeRemaining).toBeCloseTo(LEVEL_TIME_SECONDS - 0.1);
  });

  it("transitions to GAME_OVER when timeRemaining reaches 0", () => {
    const state: GameState = { ...createInitialState(FACADE_01), timeRemaining: 0.05 };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.phase).toBe("GAME_OVER");
  });
});

describe("tickGameState — crosshair", () => {
  it("updates crosshair position from mouse coords", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, noFire, 0.3, 0.7, 0.016, FACADE_01);
    expect(next.crosshair.position).toEqual({ x: 0.3, y: 0.7 });
  });
});

describe("tickGameState — shooting", () => {
  it("fire key creates a player bullet", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, fire, 0.5, 0.5, 0.016, FACADE_01);
    const playerBullets = next.bullets.filter((b) => b.fromPlayer);
    expect(playerBullets.length).toBeGreaterThan(0);
  });

  it("no bullet when fire key is not pressed", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    const playerBullets = next.bullets.filter((b) => b.fromPlayer);
    expect(playerBullets.length).toBe(0);
  });
});

describe("tickGameState — enemy shot hits player", () => {
  it("enemy bullet near center of screen decrements lives", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [{ id: 99, position: { x: 0, y: 0 }, velocity: { x: 0, y: -1 }, fromPlayer: false }],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(2);
  });

  it("lives reaching 0 → GAME_OVER", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      lives: 1,
      bullets: [{ id: 99, position: { x: 0, y: 0 }, velocity: { x: 0, y: -1 }, fromPlayer: false }],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.phase).toBe("GAME_OVER");
  });
});

describe("tickGameState — wave complete", () => {
  it("score reaching ENEMIES_TO_WIN → LEVEL_COMPLETE", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      score: ENEMIES_TO_WIN,
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.phase).toBe("LEVEL_COMPLETE");
  });
});

describe("tickGameState — street couriers", () => {
  it("a courier eventually enters when a courier field is supplied", () => {
    let state = createInitialState(FACADE_01);
    for (let i = 0; i < 600 && state.couriers.length === 0; i++) {
      state = tickGameState(state, noFire, 0.5, 0.5, 0.05, FACADE_01, 0, 18, 12, undefined, FIELD);
    }
    expect(state.couriers.length).toBeGreaterThan(0);
  });

  it("does not spawn couriers without a courier field", () => {
    let state = createInitialState(FACADE_01);
    for (let i = 0; i < 200; i++) {
      state = tickGameState(state, noFire, 0.5, 0.5, 0.05, FACADE_01);
    }
    expect(state.couriers).toHaveLength(0);
  });
});

describe("enemy spawn pool", () => {
  it("never spawns a civilian in a window (couriers ride the street instead)", () => {
    for (let seed = 0; seed < 500; seed++) {
      expect(pickKind(seed)).not.toBe("civilian");
    }
  });
});
