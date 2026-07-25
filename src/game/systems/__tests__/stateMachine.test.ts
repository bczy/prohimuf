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
import type { LootCrate, LootSpec } from "@game/types/loot";
import { BULLET_SPEED } from "@game/systems/bulletSystem";
import { LOOT_STREET_Y } from "@game/systems/lootSystem";
import { spawnWave } from "@game/systems/enemySystem";
import { pickKind } from "@game/types/enemyTypes";

/** Mirror of the render lane's LevelConfig -> LevelParams mapping. */
function paramsForLevel(level: LevelConfig): LevelParams {
  return {
    lives: 3,
    timeSeconds: level.timeSeconds,
    enemiesToWin: level.enemiesToWin,
    enemySpeedMultiplier: level.enemySpeedMultiplier,
    delivery: level.deliveries[0] ?? null,
    loot: level.loot ?? null,
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

describe("tickGameState — shooting (hitscan, ADR-0040)", () => {
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
      bullets: [{ id: 99, position: { x: 0, y: 0 }, velocity: { x: 0, y: -1 }, fromPlayer: false, damage: 1 }],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(2);
  });

  it("enemy bullet near camera offset decrements lives", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [{ id: 99, position: { x: 3, y: 2 }, velocity: { x: 0, y: 0 }, fromPlayer: false, damage: 1 }],
    };
    // cameraOffsetX=3, cameraOffsetY=2 → bullet is at camera centre
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01, 3, 2);
    expect(next.lives).toBe(2);
  });

  it("enemy bullet far from camera offset does NOT decrement lives", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [{ id: 99, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, fromPlayer: false, damage: 1 }],
    };
    // cameraOffsetX=5 → bullet is 5 units from camera centre, well outside PLAYER_HIT_RADIUS
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01, 5, 0);
    expect(next.lives).toBe(3);
  });

  it("lives reaching 0 → GAME_OVER", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      lives: 1,
      bullets: [{ id: 99, position: { x: 0, y: 0 }, velocity: { x: 0, y: -1 }, fromPlayer: false, damage: 1 }],
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

describe("hostage-taker QTE — trigger, partial freeze & wiring (the static duel)", () => {
  // Scripted spec: triggers immediately (elapsed 0), 2 s zoom, anchor at origin so a
  // world point IS the anchor-relative offset. A high blown-peeks cap so the execution
  // clock never trips during these wiring ticks.
  const SPEC = {
    triggerAtElapsedSeconds: 0,
    zoomSeconds: 2,
    anchor: { x: 0, y: 0 },
    maxBlownPeeks: 4,
    peekCadenceSeconds: 1.5,
    peekDurationSeconds: 1.5,
    // Spatial-colour ring: 3 HP depleted by chipping the wandering ring. Pinned seed whose
    // first peek opens on an on-captor (limb→vital) window, so firing at the live ring wins.
    targetSeed: 20260718,
    captorHp: 3,
  };
  function qteState(): GameState {
    return createInitialState(FACADE_01, {
      lives: 3,
      timeSeconds: 90,
      enemiesToWin: 10,
      enemySpeedMultiplier: 1,
      hostageQte: SPEC,
    });
  }
  // Crosshair coords that map a desired world point through crosshairToWorld
  // (viewW 18, viewH 12): x = wx/18 + 0.5, y = 0.5 − wy/12.
  const chX = (wx: number) => wx / 18 + 0.5;
  const chY = (wy: number) => 0.5 - wy / 12;
  const tick = (s: GameState, f: boolean, wx: number, wy: number, dt: number) =>
    tickGameState(s, f, chX(wx), chY(wy), dt, FACADE_01, 0, 0, 18, 12, 10, FIELD);

  it("initialises energy at 100, qte null, and carries the authored spec", () => {
    const s = qteState();
    expect(s.energy).toBe(100);
    expect(s.qte).toBeNull();
    expect(s.qteSpec).toEqual(SPEC);
  });

  it("triggers into ZOOMING and FREEZES the rest of the scene", () => {
    const s0 = qteState();
    const s1 = tick(s0, noFire, 0, 0, 0.1);
    expect(s1.qte?.phase).toBe("ZOOMING");
    // Frozen: the general sim state is carried through unchanged.
    expect(s1.enemies).toBe(s0.enemies);
    expect(s1.wave).toBe(s0.wave);
    expect(s1.timeRemaining).toBe(s0.timeRemaining);
    expect(s1.elapsedSeconds).toBe(s0.elapsedSeconds);
    expect(s1.couriers).toBe(s0.couriers);
  });

  it("a panic shot during the zoom drains energy inside the frozen tick", () => {
    const s0 = qteState();
    const s1 = tick(s0, fire, -0.3, 0.8, 0.1); // fire during ZOOMING
    expect(s1.qte?.phase).toBe("ZOOMING");
    expect(s1.energy).toBe(94); // −6 panic
    expect(s1.enemies).toBe(s0.enemies); // still frozen
  });

  it("opens the duel after the zoom, then depleting the captor's HP during peeks WINS", () => {
    let s = tick(qteState(), noFire, 0, 0, 0.1); // → ZOOMING
    s = tick(s, noFire, 0, 0, 2.0); // end the 2 s zoom → ACTIVE, COVERED
    expect(s.qte?.phase).toBe("ACTIVE");
    expect(s.qte?.stance).toBe("COVERED");
    // Cross into a PEEKING exposure (cadence 1.5 s). The anchor is static, but the reticle
    // ring now WANDERS (seeded) around WANDER_CENTRE across the captor's anatomy.
    s = tick(s, noFire, 0, 0, 1.5);
    expect(s.qte?.stance).toBe("PEEKING");
    expect(s.qte?.anchor).toEqual({ x: 0, y: 0 });
    // Fire ONLY while PEEKING, aiming at the ring the render drew LAST frame (anchor origin ⇒
    // world == offset). Each on-captor ring hit chips HP; a ring hit charges no energy, so
    // energy stays 100 until the +40 rescue refill. The pinned seed's first peek opens on an
    // on-captor window, so the 3 HP deplete before the peek closes.
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 5 && s.qte?.phase === "ACTIVE"; i++) {
      const off = s.qte.targetOffset;
      const peeking = s.qte.stance === "PEEKING";
      s = tick(s, peeking, off.x, off.y, dt);
    }
    expect(s.qte?.phase).toBe("WON");
    expect(s.score).toBe(0); // energy is the sole QTE currency (G-1); score untouched
    expect(s.energy).toBe(100); // +40 rescue refill clamped at the 100 cap
    expect(s.kills).toBe(0); // rescue never advances the win quota
  });

  it("a stray hit on the hostage drains energy INSIDE the frozen tick (sim still frozen)", () => {
    let s = tick(qteState(), noFire, 0, 0, 0.1);
    s = tick(s, noFire, 0, 0, 2.0); // → ACTIVE
    const before = s;
    // Hostage band relative to the static anchor: (0.4, −0.5).
    const after = tick(s, fire, 0.4, -0.5, 0.1);
    expect(after.energy).toBe(70); // −30 bavure
    expect(after.score).toBe(0); // energy carries the sanction; no score penalty
    // Still frozen despite the shot.
    expect(after.enemies).toBe(before.enemies);
    expect(after.timeRemaining).toBe(before.timeRemaining);
  });

  it("the frozen QTE tick clears the transient event channels", () => {
    const s = tick(qteState(), noFire, 0, 0, 0.1);
    expect(s.feedback).toEqual([]);
    expect(s.pointFeedback).toEqual([]);
    expect(s.impactEvents).toEqual([]);
  });

  it("a QTE-less level ticks normally (elapsed advances, qte stays null)", () => {
    const s1 = tickGameState(createInitialState(FACADE_01), noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(s1.qte).toBeNull();
    expect(s1.qteSpec).toBeNull();
    expect(s1.elapsedSeconds).toBeCloseTo(0.1);
  });
});

describe("boss QTE encounter — timed-finale trigger, freeze & completion (ADR-0051/0058)", () => {
  // A boss spec — the level's TIMED FINALE (ADR-0059): it is created at TIMER EXPIRY, not on quota.
  // anchor at origin so a world point IS the anchor-relative offset (like the hostage test's mapping).
  const BOSS_SPEC = {
    zoomSeconds: 2,
    anchor: { x: 0, y: 0 },
    phaseCount: 3,
    bossHp: 24,
    maxBlownWindows: 10,
    targetSeed: 20260719,
  };
  const QUOTA = 3;
  function bossState(overrides: Partial<GameState> = {}): GameState {
    return {
      ...createInitialState(FACADE_01, {
        lives: 3,
        timeSeconds: 90,
        enemiesToWin: QUOTA,
        enemySpeedMultiplier: 1,
        bossQte: BOSS_SPEC,
      }),
      ...overrides,
    };
  }
  const chX = (wx: number) => wx / 18 + 0.5;
  const chY = (wy: number) => 0.5 - wy / 12;
  const tick = (s: GameState, f: boolean, wx: number, wy: number, dt: number) =>
    tickGameState(s, f, chX(wx), chY(wy), dt, FACADE_01, 0, 0, 18, 12, QUOTA, FIELD);

  it("initialises bossQte null and carries the authored bossQteSpec", () => {
    const s = bossState();
    expect(s.bossQte).toBeNull();
    expect(s.bossQteSpec).toEqual(BOSS_SPEC);
  });

  it("BELOW quota, the boss stays dormant and the level plays normally", () => {
    const s = tick(bossState({ kills: QUOTA - 1 }), noFire, 0, 0, 0.1);
    expect(s.phase).toBe("PLAYING");
    expect(s.bossQte).toBeNull();
    expect(s.elapsedSeconds).toBeCloseTo(0.1);
  });

  it("timer expiry triggers the boss into ZOOMING; the kill quota alone does NOT (ADR-0059)", () => {
    // Quota met but the timer is still running → the level keeps PLAYING (quota is score-only on a
    // boss level) and no boss is born.
    const mid = tick(bossState({ kills: QUOTA, timeRemaining: 5 }), noFire, 0, 0, 0.1);
    expect(mid.phase).toBe("PLAYING");
    expect(mid.bossQte).toBeNull();
    // Timer expires → the boss is CREATED as the finale: level stays PLAYING (NOT the timeout
    // GAME_OVER), the clock is pinned to 0, and the duel opens in ZOOMING.
    const s0 = bossState({ kills: QUOTA, timeRemaining: 0.02 });
    const s1 = tick(s0, noFire, 0, 0, 0.1);
    expect(s1.phase).toBe("PLAYING");
    expect(s1.bossQte?.phase).toBe("ZOOMING");
    expect(s1.timeRemaining).toBe(0);
    // The NEXT tick freezes the general sim — the boss owns the scene.
    const s2 = tick(s1, noFire, 0, 0, 0.1);
    expect(s2.elapsedSeconds).toBe(s1.elapsedSeconds);
    expect(s2.enemies).toBe(s1.enemies);
  });

  it("crossing the kill quota on a boss level never completes it (score-only; boss waits for the timer)", () => {
    // ADR-0059: on a boss level the quota is score-only — landing the quota-meeting kill must NOT
    // complete the level, and must NOT trigger the boss (that is the timed finale). A `VISIBLE`,
    // hp-1 "normal" enemy sits at slot 0; firing on it takes it down with time still on the clock.
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
    const s0 = bossState({ kills: QUOTA - 1, enemies: [enemy], timeRemaining: 30 });
    const s1 = tickGameState(
      s0,
      fire,
      0.5,
      0.5,
      0.1,
      FACADE_01,
      slot.screenPosition.x,
      slot.screenPosition.y,
      18,
      12,
      QUOTA,
      FIELD,
    );
    expect(s1.kills).toBe(QUOTA); // the crossing kill counted
    expect(s1.phase).toBe("PLAYING"); // NOT LEVEL_COMPLETE — quota is score-only on a boss level
    expect(s1.bossQte).toBeNull(); // the boss is the TIMED finale, never a quota trigger
  });

  it("a panic shot during the boss zoom drains energy inside the frozen tick", () => {
    const zooming = tick(bossState({ timeRemaining: 0.02 }), noFire, 0, 0, 0.1); // finale → ZOOMING
    expect(zooming.bossQte?.phase).toBe("ZOOMING");
    const s1 = tick(zooming, fire, 0, 0, 0.1);
    expect(s1.bossQte?.phase).toBe("ZOOMING");
    expect(s1.energy).toBe(94); // −6 panic
  });

  it("defeating the boss (bossHp → 0) completes the level; the kill quota is NOT inflated", () => {
    let s = tick(bossState({ kills: QUOTA, timeRemaining: 0.02 }), noFire, 0, 0, 0.1); // finale → ZOOMING
    expect(s.bossQte?.phase).toBe("ZOOMING");
    // Play the duel: fire at the drawn ring whenever it sits on vital/limb during EXPOSED.
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 90 && s.phase === "PLAYING"; i++) {
      const q = s.bossQte;
      const onRing =
        q !== null && q.stance === "EXPOSED" && q.phaseBreakRemaining <= 0 && q.ringZone !== "off";
      const off = q?.targetOffset ?? { x: 0, y: 0 };
      s = tick(s, onRing, off.x, off.y, dt);
    }
    expect(s.phase).toBe("LEVEL_COMPLETE");
    expect(s.bossQte?.phase).toBe("DONE");
    expect(s.bossQte?.bossHp).toBe(0);
    expect(s.kills).toBe(QUOTA); // the boss never advanced the kill quota
  });

  it("a passive player blows every window → boss LOST → level fails (GAME_OVER)", () => {
    let s = tick(bossState({ kills: QUOTA, timeRemaining: 0.02 }), noFire, 0, 0, 0.1); // finale → ZOOMING
    for (let i = 0; i < 60 * 120 && s.phase === "PLAYING"; i++) {
      s = tick(s, noFire, 0, 0, 1 / 60);
    }
    expect(s.phase).toBe("GAME_OVER");
    expect(s.bossQte?.phase).toBe("DONE");
    expect(s.bossQte?.bossHp).toBeGreaterThan(0); // never defeated → a loss
    expect(s.bossQte?.blownWindows).toBe(BOSS_SPEC.maxBlownWindows);
  });

  it("the frozen boss tick clears the transient event channels", () => {
    const zooming = tick(bossState({ timeRemaining: 0.02 }), noFire, 0, 0, 0.1); // finale → ZOOMING
    const s = tick(zooming, noFire, 0, 0, 0.1); // a frozen boss tick
    expect(s.bossQte?.phase).toBe("ZOOMING");
    expect(s.feedback).toEqual([]);
    expect(s.pointFeedback).toEqual([]);
    expect(s.impactEvents).toEqual([]);
  });

  it("GUARD: allows hostage + boss together when the hostage safely resolves before the timed finale (ADR-0059 D3)", () => {
    // Belliard now authors BOTH (Bertrand, 2026-07-21: keep both, don't drop the hostage). This is
    // safe by construction: the boss is a TIMED FINALE, created no earlier than `timeSeconds` of
    // non-frozen play, and the hostage QTE freezes the timer WHILE it's active — so as long as the
    // hostage's worst case (trigger + zoom + every peek blown + result hold) finishes with margin
    // before `timeSeconds`, the two never run concurrently. Belliard's own numbers (12 + 2 + 4×1.5 +
    // 2.2 = 22.2s, vs. timeSeconds 90s) mirrored here.
    const HOSTAGE_SPEC = {
      triggerAtElapsedSeconds: 12,
      zoomSeconds: 2,
      anchor: { x: 0, y: 0 },
      maxBlownPeeks: 4,
      peekCadenceSeconds: 1.5,
      peekDurationSeconds: 1.5,
      targetSeed: 20260718,
      captorHp: 3,
    };
    const both: LevelParams = {
      lives: 3,
      timeSeconds: 90,
      enemiesToWin: QUOTA,
      enemySpeedMultiplier: 1,
      hostageQte: HOSTAGE_SPEC,
      bossQte: BOSS_SPEC,
    };
    expect(() => createInitialState(FACADE_01, both)).not.toThrow();
    // Each spec ALONE still loads fine too.
    expect(() => createInitialState(FACADE_01, { ...both, bossQte: null })).not.toThrow();
    expect(() => createInitialState(FACADE_01, { ...both, hostageQte: null })).not.toThrow();
  });

  it("GUARD: throws when hostage+boss timing is UNSAFE — the hostage's worst case could still be running when the timed finale fires", () => {
    // REGRESSION (code-review panel, PR #112, re-scoped for ADR-0059 D3): the two cinematics must
    // never interleave. `createInitialState` fails LOUD at level load if a retune (here: a level
    // timer far too short for the authored hostage) would let the boss's timer-expiry creation land
    // before the hostage could possibly have resolved — never a silent drop.
    const HOSTAGE_SPEC = {
      triggerAtElapsedSeconds: 12,
      zoomSeconds: 2,
      anchor: { x: 0, y: 0 },
      maxBlownPeeks: 4,
      peekCadenceSeconds: 1.5,
      peekDurationSeconds: 1.5,
      targetSeed: 20260718,
      captorHp: 3,
    };
    const unsafe: LevelParams = {
      lives: 3,
      timeSeconds: 15, // worst-case hostage end (22.2s) + margin (5s) > 15s timer
      enemiesToWin: QUOTA,
      enemySpeedMultiplier: 1,
      hostageQte: HOSTAGE_SPEC,
      bossQte: BOSS_SPEC,
    };
    expect(() => createInitialState(FACADE_01, unsafe)).toThrow(/not safely sequential/);
  });

  it("IDENTITY: a boss-less level is byte-for-byte unchanged — the quota still wins directly", () => {
    // The ADR-0051 D4 safety property: `bossQteSpec === null` (every shipped level) makes the
    // boss branch a strict no-op, so the existing `kills >= enemiesToWin → LEVEL_COMPLETE` path
    // is exactly as before. Mirrors the hostage `qteSpec === null` guard.
    const base = createInitialState(FACADE_01);
    expect(base.bossQteSpec).toBeNull();
    expect(base.bossQte).toBeNull();
    // At quota → LEVEL_COMPLETE directly (the boss branch does not intercept).
    const atQuota: GameState = { ...base, kills: ENEMIES_TO_WIN };
    const won = tickGameState(atQuota, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(won.phase).toBe("LEVEL_COMPLETE");
    expect(won.bossQte).toBeNull();
    // Below quota → normal play, boss fields inert.
    const playing = tickGameState(base, noFire, 0.5, 0.5, 0.1, FACADE_01);
    expect(playing.phase).toBe("PLAYING");
    expect(playing.bossQteSpec).toBeNull();
    expect(playing.bossQte).toBeNull();
    expect(playing.elapsedSeconds).toBeCloseTo(0.1);
  });
});

// --- ADR-0055: weapon + LOOT integration at the tick level ---------------------

// Aim `mouseX/mouseY` at a crate on the given slot: its x is the slot's world-x,
// but since ADR-0056 the crate resolves at street-y (LOOT_STREET_Y), NOT the slot's
// window-y. Under the tick's default 18×12 view (see crosshairToWorld).
function aimAtCrate(slotIndex: number): { mx: number; my: number } {
  const p = FACADE_01.slots[slotIndex]?.screenPosition;
  if (p === undefined) throw new Error(`no slot ${String(slotIndex)}`);
  return { mx: p.x / 18 + 0.5, my: 0.5 - LOOT_STREET_Y / 12 };
}
// Slot 49 = col 9 / row 2 → screenPosition.x = 0, safely inside the view.
const CENTRE_SLOT = 49;

describe("tickGameState — levels without loot stay byte-identical (D8)", () => {
  it("seeds base/∞ weapon, null loot/lootSpec when no loot config is supplied", () => {
    const s = createInitialState(FACADE_01);
    expect(s.weapon).toEqual({
      active: "base",
      stock: Infinity,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    });
    expect(s.loot).toBeNull();
    expect(s.lootSpec).toBeNull();
  });

  it("never spawns a crate and never leaves base across many ticks (incl. firing)", () => {
    let s = createInitialState(FACADE_01);
    for (let i = 0; i < 200; i++) {
      s = tickGameState(
        s,
        i % 2 === 0,
        0.5,
        0.5,
        0.1,
        FACADE_01,
        0,
        0,
        18,
        12,
        ENEMIES_TO_WIN,
        FIELD,
      );
      if (s.phase !== "PLAYING") break;
    }
    expect(s.loot).toBeNull();
    expect(s.weapon.active).toBe("base");
    expect(s.weapon.stock).toBe(Infinity);
  });

  it("a base shot still emits at most one impact per tick (ADR-0040 invariant preserved)", () => {
    const s = createInitialState(FACADE_01);
    const next = tickGameState(s, fire, 0.5, 0.5, 0.016, FACADE_01);
    expect((next.impactEvents ?? []).length).toBeLessThanOrEqual(1);
  });
});

describe("tickGameState — AC7-loot: a crate hit equips with ZERO score/lives delta", () => {
  it("firing a VISIBLE crate equips its weapon; score, lives and kills are untouched", () => {
    const crate: LootCrate = {
      id: 1,
      slotIndex: CENTRE_SLOT,
      state: "VISIBLE",
      timer: 5,
      weapon: "spread",
    };
    // Belliard opts into loot; enemies from the initial spawn are HIDDEN (not hittable,
    // no wave respawn), so the crate is the only eligible target this tick.
    const s: GameState = {
      ...createInitialState(FACADE_01, paramsForLevel(levelById("belliard"))),
      loot: crate,
    };
    const aim = aimAtCrate(CENTRE_SLOT);
    const next = tickGameState(s, fire, aim.mx, aim.my, 0.016, FACADE_01);
    expect(next.weapon.active).toBe("spread");
    expect(next.weapon.stock).toBe(30);
    expect(next.loot).toBeNull();
    expect(next.score).toBe(s.score);
    expect(next.lives).toBe(s.lives);
    expect(next.kills).toBe(s.kills);
  });
});

describe("tickGameState — AC14 (A7 regression): a player hit never touches weapon state", () => {
  it("taking an enemy bullet decrements lives but leaves weapon.active/stock intact", () => {
    const weapon = {
      active: "spread" as const,
      stock: 10,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    };
    const s: GameState = {
      ...createInitialState(FACADE_01),
      weapon,
      // An enemy bullet already on top of the player centre.
      bullets: [
        {
          id: 1,
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: -BULLET_SPEED },
          fromPlayer: false,
          damage: 1,
        },
      ],
    };
    const next = tickGameState(s, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(s.lives - 1);
    expect(next.weapon.active).toBe("spread");
    expect(next.weapon.stock).toBe(10);
  });
});

describe("tickGameState — AC10: stock→0 auto-returns to base with one weaponEmpty event", () => {
  it("a spread press that empties the stock returns to base the same tick and flags weaponEmpty", () => {
    const weapon = {
      active: "spread" as const,
      stock: 1,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    };
    const s: GameState = { ...createInitialState(FACADE_01), weapon };
    const next = tickGameState(s, fire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.weapon.active).toBe("base");
    expect(next.weapon.stock).toBe(Infinity);
    expect(next.weaponEmpty).toBe(true);
  });

  it("clears the transient weaponEmpty on the following tick (consumed once)", () => {
    const weapon = {
      active: "spread" as const,
      stock: 1,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    };
    const s: GameState = { ...createInitialState(FACADE_01), weapon };
    const emptied = tickGameState(s, fire, 0.5, 0.5, 0.016, FACADE_01);
    const after = tickGameState(emptied, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(after.weaponEmpty).toBe(false);
  });
});

describe("tickGameState — AC6: weapon + loot are FROZEN through a QTE freeze (D7)", () => {
  it("a hostage QTE freeze leaves weapon.active/stock and loot untouched, no crate spawns", () => {
    const weapon = {
      active: "spread" as const,
      stock: 10,
      burstRemaining: 2,
      burstTimerMs: 40,
      refractoryMs: 0,
    };
    // A synthetic hostage spec on stalingrad (no boss, no hostage of its own) so this freeze test
    // is independent of which shipped level carries a hostage QTE — belliard authors both a
    // hostage and a boss (ADR-0059 D3, sequential coexistence), so this stays deliberately
    // decoupled from that specific pairing rather than re-deriving its timing-safety margin here.
    const HOSTAGE = {
      triggerAtElapsedSeconds: 12,
      zoomSeconds: 2,
      anchor: { x: 0, y: 0 },
      maxBlownPeeks: 4,
      peekCadenceSeconds: 1.5,
      peekDurationSeconds: 1.5,
      captorHp: 3,
      targetSeed: 20260718,
    };
    const stalingrad = levelById("stalingrad");
    const s: GameState = {
      ...createInitialState(FACADE_01, {
        ...paramsForLevel(stalingrad),
        hostageQte: HOSTAGE,
      }),
      elapsedSeconds: 11.99, // the synthetic hostage QTE triggers at 12 s
      weapon,
      loot: null,
    };
    // Fire during the freeze — the QTE resolves it, the special must NOT be consumed.
    const next = tickGameState(s, fire, 0.5, 0.5, 0.02, FACADE_01);
    expect(next.qte).not.toBeNull(); // QTE is active (frozen)
    expect(next.weapon).toBe(s.weapon); // exact same reference — rides ...state frozen
    expect(next.loot).toBeNull(); // no crate spawns during the freeze
    expect(next.weaponEmpty).toBe(false);
  });
});

describe("tickGameState — ADR-0055 D5 co-location guard (b): a wave rollover excludes the crate slot", () => {
  it("never seats a rolled-over enemy on the live crate's slot", () => {
    // A slot the un-excluded wave-2 would use ⇒ the exclusion is actually exercised.
    const takenSlot = spawnWave(2, FACADE_01)[0]?.slotIndex;
    if (takenSlot === undefined) throw new Error("expected a seated enemy");
    const crate: LootCrate = {
      id: 1,
      slotIndex: takenSlot,
      state: "VISIBLE",
      timer: 5,
      weapon: "auto",
    };
    const s: GameState = {
      ...createInitialState(FACADE_01, paramsForLevel(levelById("belliard"))),
      wave: 1,
      // A single DEAD enemy forces the all-dead wave rollover this tick.
      enemies: [{ id: 999, slotIndex: 0, state: "DEAD", timer: 0, kind: "normal", hp: 0 }],
      loot: crate,
    };
    const next = tickGameState(s, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.wave).toBe(2); // rollover happened
    expect(next.enemies.every((e) => e.slotIndex !== takenSlot)).toBe(true);
  });
});

describe("createInitialState — resets _nextLootId for replay-safe crate picks (MINEUR-2)", () => {
  it("two fresh sessions produce identical crate slot + weapon", () => {
    const spec: LootSpec = { spawnIntervalSeconds: 0.1, weapons: ["auto", "spread"] };
    const params: LevelParams = {
      lives: 3,
      timeSeconds: 90,
      enemiesToWin: 10,
      enemySpeedMultiplier: 1,
      loot: spec,
    };
    function firstCrate(): { slotIndex: number; weapon: string } {
      let st = createInitialState(FACADE_01, params);
      for (let i = 0; i < 5 && st.loot === null; i++) {
        st = tickGameState(st, noFire, 0.5, 0.5, 0.1, FACADE_01);
      }
      if (st.loot === null) throw new Error("expected a crate to spawn");
      return { slotIndex: st.loot.slotIndex, weapon: st.loot.weapon };
    }
    // Run a second session AFTER the first advanced the module counter — the reset
    // in createInitialState must make the two picks identical.
    expect(firstCrate()).toEqual(firstCrate());
  });
});

describe("tickGameState — fractional damage and the invulnerability window", () => {
  /** A stationary enemy bullet sitting exactly on the player-hit centre. */
  function bulletOnPlayer(damage: number, id = 99): GameState["bullets"][number] {
    return { id, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, fromPlayer: false, damage };
  }

  it("a quarter-heart round removes 0.25, not a whole heart", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [bulletOnPlayer(0.25)],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(2.75);
  });

  it("a half-heart round removes 0.5", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [bulletOnPlayer(0.5)],
    };
    expect(tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01).lives).toBe(2.5);
  });

  it("opens the invulnerability window on a hit", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [bulletOnPlayer(0.25)],
    };
    expect(tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01).playerInvulnRemaining).toBe(0.4);
  });

  it("two bullets landing on the same tick cost only the first one's damage", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      bullets: [bulletOnPlayer(0.25, 1), bulletOnPlayer(1, 2)],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(2.75);
    // Both are still absorbed — neither survives to hit again next tick.
    expect(next.bullets).toHaveLength(0);
  });

  it("absorbs a bullet for free while the window is still open", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      playerInvulnRemaining: 0.4,
      bullets: [bulletOnPlayer(1)],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(3);
    expect(next.bullets).toHaveLength(0);
    expect(next.playerHitEvents).toHaveLength(0);
  });

  it("the window runs down with delta and lets a later bullet through", () => {
    const state: GameState = {
      ...createInitialState(FACADE_01),
      playerInvulnRemaining: 0.01,
      bullets: [bulletOnPlayer(1)],
    };
    const next = tickGameState(state, noFire, 0.5, 0.5, 0.016, FACADE_01);
    expect(next.lives).toBe(2);
  });

  it("four quarter-heart rounds land exactly on a whole heart (no float drift)", () => {
    let lives = 3;
    for (let i = 0; i < 4; i++) {
      const next = tickGameState(
        { ...createInitialState(FACADE_01), lives, bullets: [bulletOnPlayer(0.25)] },
        noFire,
        0.5,
        0.5,
        0.016,
        FACADE_01,
      );
      lives = next.lives;
    }
    expect(lives).toBe(2);
  });

  it("GAME_OVER only once the last fraction is gone", () => {
    const alive = tickGameState(
      { ...createInitialState(FACADE_01), lives: 0.5, bullets: [bulletOnPlayer(0.25)] },
      noFire,
      0.5,
      0.5,
      0.016,
      FACADE_01,
    );
    expect(alive.lives).toBe(0.25);
    expect(alive.phase).toBe("PLAYING");

    const dead = tickGameState(
      { ...createInitialState(FACADE_01), lives: 0.25, bullets: [bulletOnPlayer(0.25)] },
      noFire,
      0.5,
      0.5,
      0.016,
      FACADE_01,
    );
    expect(dead.phase).toBe("GAME_OVER");
  });
});
