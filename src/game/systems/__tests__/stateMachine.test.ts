import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tickGameState,
  LEVEL_TIME_SECONDS,
  ENEMIES_TO_WIN,
} from "../stateMachine";
import { FACADE_01 } from "@game/maps/facade01";
import type { GameState } from "@game/types/gameState";

const noFire = false;
const fire = true;

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
