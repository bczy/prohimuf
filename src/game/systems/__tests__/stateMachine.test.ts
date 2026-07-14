import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tickGameState,
  LEVEL_TIME_SECONDS,
  ENEMIES_TO_WIN,
} from "../stateMachine";
import type { LevelParams } from "../stateMachine";
import { FACADE_01 } from "@game/maps/facade01";
import { LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import type { GameState } from "@game/types/gameState";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { CourierField } from "@game/systems/courierSystem";
import { pickKind } from "@game/types/enemyTypes";

/** Mirror of the render lane's LevelConfig -> LevelParams mapping. */
function paramsForLevel(level: LevelConfig): LevelParams {
  return {
    lives: 3,
    timeSeconds: level.timeSeconds,
    enemiesToWin: level.enemiesToWin,
    enemySpeedMultiplier: level.enemySpeedMultiplier,
    delivery: level.deliveries[0] ?? null,
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

  it("wave starts at 1, kills and elapsedSeconds at 0", () => {
    const state = createInitialState(FACADE_01);
    expect(state.wave).toBe(1);
    expect(state.kills).toBe(0);
    expect(state.elapsedSeconds).toBe(0);
  });

  it("spawns initial enemies", () => {
    const state = createInitialState(FACADE_01);
    expect(state.enemies.length).toBeGreaterThan(0);
  });

  it("has no delivery when none is supplied", () => {
    const state = createInitialState(FACADE_01);
    expect(state.deliverySpec).toBeNull();
    expect(state.deliveryVehicle).toBeNull();
  });

  it("seeds the delivery vehicle IDLE with a full gauge from level data", () => {
    const state = createInitialState(FACADE_01, paramsForLevel(levelById("belliard")));
    expect(state.deliverySpec).not.toBeNull();
    expect(state.deliveryVehicle?.phase).toBe("IDLE");
    expect(state.deliveryVehicle?.vehicleType).toBe("truck");
    expect(state.deliveryVehicle?.integrity).toBe(100);
    expect(state.deliveryVehicle?.integrityMax).toBe(100);
  });

  it("each level ships a distinct vehicle type on the street", () => {
    const belliard = createInitialState(FACADE_01, paramsForLevel(levelById("belliard")));
    const stalingrad = createInitialState(FACADE_01, paramsForLevel(levelById("stalingrad")));
    const vitry = createInitialState(FACADE_01, paramsForLevel(levelById("vitry")));
    expect(belliard.deliveryVehicle?.vehicleType).toBe("truck");
    expect(stalingrad.deliveryVehicle?.vehicleType).toBe("car");
    expect(vitry.deliveryVehicle?.vehicleType).toBe("moto");
  });

  it("every level parks its delivery stop at ground level on the street", () => {
    // The tutorial stage (ADR-0012) carries `deliveries: []` and no gameplay — exclude it
    // from this playable-level data-shape invariant.
    for (const level of LEVELS.filter((l) => l.kind !== "tutorial")) {
      expect(level.deliveries.length).toBeGreaterThan(0);
      for (const d of level.deliveries) {
        expect(d.stopPosition.y).toBeLessThan(0); // ground level
        expect(d.triggerAtElapsedSeconds).toBeGreaterThan(0);
        expect(d.bonus).toBeGreaterThan(0);
      }
    }
  });
});

describe("tickGameState — terminal phases", () => {
  it("does not advance play when phase is GAME_OVER (only clears transients)", () => {
    const state: GameState = { ...createInitialState(FACADE_01), phase: "GAME_OVER", score: 42 };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.phase).toBe("GAME_OVER");
    expect(next.score).toBe(42);
    expect(next.timeRemaining).toBe(state.timeRemaining);
    expect(next.enemies).toBe(state.enemies);
    expect(next.impactEvents).toEqual([]);
  });

  it("does not advance play when phase is LEVEL_COMPLETE (only clears transients)", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      phase: "LEVEL_COMPLETE",
      score: 42,
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.phase).toBe("LEVEL_COMPLETE");
    expect(next.score).toBe(42);
    expect(next.timeRemaining).toBe(state.timeRemaining);
    expect(next.enemies).toBe(state.enemies);
    expect(next.impactEvents).toEqual([]);
  });
});

describe("tickGameState — timer + elapsed", () => {
  it("decrements timeRemaining", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.timeRemaining).toBeCloseTo(LEVEL_TIME_SECONDS - 0.1);
  });

  it("accumulates elapsedSeconds by delta", () => {
    let state = createInitialState(FACADE_01);
    state = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    state = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(state.elapsedSeconds).toBeCloseTo(0.2);
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

describe("tickGameState — shooting (hitscan, ADR-0020)", () => {
  it("firing adds NO player bullet to state.bullets (AC1 — no travelling player shot)", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, fire, 0.5, 0.5, 0.016, FACADE_01);
    const playerBullets = next.bullets.filter((b) => b.fromPlayer);
    expect(playerBullets.length).toBe(0);
  });

  it("firing surfaces exactly one impact event", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, fire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.impactEvents).toHaveLength(1);
  });

  it("no fire ⇒ no impact event and no player bullet", () => {
    const state = createInitialState(FACADE_01);
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.impactEvents).toHaveLength(0);
    expect(next.bullets.filter((b) => b.fromPlayer).length).toBe(0);
  });

  it("threads cameraOffsetY into the impact point exactly like cameraOffsetX into world-X", () => {
    // After a vertical pan, a centre tap must resolve at the shifted world point
    // (the ADR-0002 invariant: aiming/delivery share crosshairToWorld). Compare a
    // shot fired with camera offsets against an un-panned reference, same delta.
    const base = tickGameState(createInitialState(FACADE_01), fire, 0.5, 0.5, 0.016, FACADE_01);
    const shifted = tickGameState(
      createInitialState(FACADE_01),
      fire,
      0.5,
      0.5,
      0.016,
      FACADE_01,
      4, // cameraOffsetX
      3, // cameraOffsetY
    );
    const p0 = base.impactEvents?.[0]?.impactPoint;
    const p1 = shifted.impactEvents?.[0]?.impactPoint;
    if (p0 === undefined || p1 === undefined) throw new Error("expected impact points");
    expect(p1.x - p0.x).toBeCloseTo(4);
    expect(p1.y - p0.y).toBeCloseTo(3);
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

describe("tickGameState — victory is gated on the kill-count, not the score", () => {
  it("kills reaching ENEMIES_TO_WIN → LEVEL_COMPLETE", () => {
    const state: GameState = { ...createInitialState(FACADE_01), kills: ENEMIES_TO_WIN };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.phase).toBe("LEVEL_COMPLETE");
  });

  it("a high score with too few kills does NOT win", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      score: ENEMIES_TO_WIN * 100,
      kills: ENEMIES_TO_WIN - 1,
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.phase).toBe("PLAYING");
  });
});

describe("tickGameState — scripted vehicle delivery", () => {
  const SPEC: DeliverySpec = {
    vehicleType: "truck",
    triggerAtElapsedSeconds: 20,
    integrity: 100,
    windowSeconds: 8,
    bonus: 500,
    entrySide: "left",
    stopPosition: { x: 0, y: -5 },
  };

  function withDelivery(vehicle: DeliveryVehicle, over: Partial<GameState> = {}): GameState {
    return {
      ...createInitialState(FACADE_01, {
        lives: 3,
        timeSeconds: LEVEL_TIME_SECONDS,
        enemiesToWin: ENEMIES_TO_WIN,
        enemySpeedMultiplier: 1,
        delivery: SPEC,
      }),
      deliveryVehicle: vehicle,
      ...over,
    };
  }

  const idleVehicle: DeliveryVehicle = {
    phase: "IDLE",
    position: SPEC.stopPosition,
    vehicleType: "truck",
    integrity: 100,
    integrityMax: 100,
    windowRemaining: SPEC.windowSeconds,
  };

  it("does not trigger before the scripted instant", () => {
    const state = withDelivery(idleVehicle, { elapsedSeconds: 10 });
    const next = tickGameState(
      state,
      noFire,
      0.5,
      0.5,
      0.1,
      FACADE_01,
      0,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.deliveryVehicle?.phase).toBe("IDLE");
  });

  it("triggers once elapsed crosses the scripted instant", () => {
    const state = withDelivery(idleVehicle, { elapsedSeconds: SPEC.triggerAtElapsedSeconds });
    const next = tickGameState(
      state,
      noFire,
      0.5,
      0.5,
      0.1,
      FACADE_01,
      0,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.deliveryVehicle?.phase).toBe("INCOMING");
  });

  it("surviving the window folds the bonus into the score WITHOUT winning", () => {
    const delivering: DeliveryVehicle = {
      phase: "DELIVERING",
      position: SPEC.stopPosition,
      vehicleType: "truck",
      integrity: 100,
      integrityMax: 100,
      windowRemaining: 0.05,
    };
    const state = withDelivery(delivering, { elapsedSeconds: 30, kills: 0, score: 0 });
    const next = tickGameState(
      state,
      noFire,
      0.5,
      0.5,
      0.1,
      FACADE_01,
      0,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.deliveryVehicle?.phase).toBe("SUCCESS");
    expect(next.score).toBe(SPEC.bonus); // bonus folded into score
    expect(next.kills).toBe(0); // kill-count untouched
    expect(next.phase).toBe("PLAYING"); // bonus alone never wins
  });

  it("the bonus lands exactly once (SUCCESS then departs, no further score)", () => {
    const success: DeliveryVehicle = {
      phase: "SUCCESS",
      position: SPEC.stopPosition,
      vehicleType: "truck",
      integrity: 60,
      integrityMax: 100,
      windowRemaining: 0,
    };
    const state = withDelivery(success, { elapsedSeconds: 31, score: SPEC.bonus });
    const next = tickGameState(
      state,
      noFire,
      0.5,
      0.5,
      0.1,
      FACADE_01,
      0,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.score).toBe(SPEC.bonus); // no double bonus
  });

  it("a failed delivery adds no score and no life penalty", () => {
    const failing: DeliveryVehicle = {
      phase: "DELIVERING",
      position: SPEC.stopPosition,
      vehicleType: "truck",
      integrity: 1,
      integrityMax: 100,
      windowRemaining: 5,
    };
    const state = withDelivery(failing, { elapsedSeconds: 25, score: 7, lives: 3 });
    // 5 enemies shooting for a full second drains the tiny gauge.
    const shooters: GameState["enemies"] = Array.from({ length: 5 }, (_e, i) => ({
      id: 1000 + i,
      slotIndex: i,
      state: "SHOOTING" as const,
      timer: 5,
      kind: "normal" as const,
      hp: 1,
    }));
    const next = tickGameState(
      { ...state, enemies: shooters },
      noFire,
      0.5,
      0.5,
      1,
      FACADE_01,
      0,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.deliveryVehicle?.phase).toBe("FAILED");
    expect(next.score).toBe(7); // no bonus
    expect(next.lives).toBe(3); // no malus
  });

  it("leaves the vehicle IDLE when no courier field is supplied", () => {
    const state = withDelivery(idleVehicle, {
      elapsedSeconds: SPEC.triggerAtElapsedSeconds + 5,
    });
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(next.deliveryVehicle?.phase).toBe("IDLE");
  });
});

describe("tickGameState — street couriers", () => {
  it("a courier eventually enters when a courier field is supplied", () => {
    let state = createInitialState(FACADE_01);
    for (let i = 0; i < 600 && state.couriers.length === 0; i++) {
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        0.05,
        FACADE_01,
        0,
        0,
        18,
        12,
        undefined,
        FIELD,
      );
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

describe("tickGameState — courier friendly fire under hitscan (B1)", () => {
  it("a fired MISS at a courier costs a life + point and removes the courier", () => {
    const courier = { id: 7, x: 0, y: -5, dir: 1 as const, speed: 7 };
    // Aim (via camera offsets) at the street point (0,-5) — far below every window,
    // so the window shot is a MISS and the courier resolver runs.
    const state: GameState = {
      ...createInitialState(FACADE_01),
      couriers: [courier],
      lives: 3,
      score: 5,
    };
    const next = tickGameState(
      state,
      fire,
      0.5,
      0.5,
      0.016,
      FACADE_01,
      0, // cameraOffsetX
      -5, // cameraOffsetY → impact point (0,-5) on the courier
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.impactEvents?.[0]?.classification).toBe("miss");
    expect(next.couriers).toHaveLength(0);
    expect(next.lives).toBe(2);
    expect(next.score).toBe(4);
    expect(next.pointFeedback).toHaveLength(1);
  });

  it("a window HIT consumes the shot — a courier at the same point is NOT struck", () => {
    const slot = FACADE_01.slots[0];
    if (slot === undefined) throw new Error("expected slot");
    const enemy = {
      id: 1,
      slotIndex: 0,
      state: "VISIBLE" as const,
      timer: 5,
      kind: "normal" as const,
      hp: 1,
    };
    // Courier planted at the very slot the shot lands on: only spared because the
    // window hit consumes the shot before the courier resolver can run.
    const courier = {
      id: 7,
      x: slot.screenPosition.x,
      y: slot.screenPosition.y,
      dir: 1 as const,
      speed: 7,
    };
    const state: GameState = {
      ...createInitialState(FACADE_01),
      enemies: [enemy],
      couriers: [courier],
      lives: 3,
    };
    const next = tickGameState(
      state,
      fire,
      0.5,
      0.5,
      0.016,
      FACADE_01,
      slot.screenPosition.x,
      slot.screenPosition.y,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(next.impactEvents?.[0]?.classification).toBe("hit");
    expect(next.lives).toBe(3); // no friendly-fire penalty
    expect(next.couriers).toHaveLength(1); // courier survives
    expect(next.pointFeedback).toHaveLength(0);
  });
});

describe("tickGameState — terminal ticks do not replay transient events (M1)", () => {
  it.each(["GAME_OVER", "LEVEL_COMPLETE"] as const)(
    "%s idle tick clears impactEvents/feedback/pointFeedback",
    (phase) => {
      const state: GameState = {
        ...createInitialState(FACADE_01),
        phase,
        impactEvents: [{ classification: "miss", impactPoint: { x: 0, y: 0 } }],
        feedback: [{ slotIndex: 0, scoreDelta: 1, livesDelta: 0, timeDelta: 0 }],
        pointFeedback: [{ x: 0, y: 0, scoreDelta: -1, livesDelta: -1, timeDelta: 0 }],
      };
      const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
      expect(next.impactEvents).toEqual([]);
      expect(next.feedback).toEqual([]);
      expect(next.pointFeedback).toEqual([]);
    },
  );
});

describe("enemy spawn pool", () => {
  it("never spawns a civilian in a window (couriers ride the street instead)", () => {
    for (let seed = 0; seed < 500; seed++) {
      expect(pickKind(seed)).not.toBe("civilian");
    }
  });
});
