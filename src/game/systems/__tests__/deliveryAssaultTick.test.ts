import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tickGameState,
  ENEMIES_TO_WIN,
  LEVEL_TIME_SECONDS,
} from "@game/systems/stateMachine";
import type { LevelParams } from "@game/systems/stateMachine";
import {
  DELIVERY_ASSAILANTS,
  DELIVERY_ASSAULT_ID_BASE,
  countAliveAssailants,
  isDeliveryAssailant,
  reservedAssaultSlots,
} from "@game/systems/deliveryAssault";
import { DAMAGE_PER_ASSAILANT_PER_SECOND } from "@game/systems/deliverySystem";
import { spawnWave } from "@game/systems/enemySystem";
import { LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { getBackdropLayout, WORLD_HEIGHT } from "@game/levels/levelArt";
import { FACADE_01 } from "@game/maps/facade01";
import type { CourierField } from "@game/systems/courierSystem";
import type { GameState } from "@game/types/gameState";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { Enemy } from "@game/types/enemy";
import type { LootCrate } from "@game/types/loot";
import { LOOT_MAX_ABS_X } from "@game/systems/lootSystem";
import { levelFacade } from "../../levels/__tests__/levelFacade";

/**
 * The delivery assault at TICK level (`docs/game-design/spec-delivery-van-assault.md`
 * Rev.2 + K-7…K-11, architect tech plan §2.3/§3): AC2, AC3, AC4, AC10-AC14, AC16.
 * The pure module's own ACs (AC5-AC9, the reservation geometry, the id-range
 * invariant) live in `deliveryAssault.test.ts`.
 */

const DT = 1 / 60;
const noFire = false;

/**
 * A wave that was PLAYED and cleared — the only thing that rolls a wave over since the
 * panel's B2 fix (an empty enemy array satisfies `every()` vacuously and no longer counts).
 */
function wiped(enemies: readonly Enemy[]): readonly Enemy[] {
  return enemies.map((e) => ({ ...e, state: "DEAD" as const }));
}
const fire = true;

function levelById(id: string): LevelConfig {
  const level = LEVELS.find((l) => l.id === id);
  if (level === undefined) throw new Error(`missing level ${id}`);
  return level;
}

/**
 * The render lane's LevelConfig → LevelParams mapping, hostage/boss QTE left OUT
 * so the delivery beat is isolated (both freeze the clock and would never let the
 * scripted trigger arrive at its authored second).
 */
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

/** `GameScene`'s courier field for a level: the full street's half-width. */
function fieldFor(id: string): CourierField {
  return { halfWidth: getBackdropLayout(id).fullW / 2, streetY: -WORLD_HEIGHT * 0.4 };
}

interface LevelRun {
  readonly id: string;
  readonly spec: DeliverySpec;
}

const DELIVERY_LEVELS: readonly LevelRun[] = LEVELS.flatMap((l) => {
  const spec = l.deliveries[0];
  return spec === undefined ? [] : [{ id: l.id, spec }];
});

interface IgnoreRun {
  /** Ticks from the window opening to the FAILED transition. */
  readonly failTick: number;
  /** Integrity after every DELIVERING tick, in order. */
  readonly series: readonly number[];
  readonly finalPhase: DeliveryVehicle["phase"];
  readonly score: number;
  readonly livesAtFail: {
    readonly before: number;
    readonly after: number;
    /** Player hits resolved on that same tick (return fire, D2.7 — not the delivery). */
    readonly hits: number;
  };
  readonly scoreAtFail: { readonly before: number; readonly after: number };
  readonly assailantsAtWindowOpen: number;
  readonly integrityAtWindowOpen: number;
  readonly deadAssailantsAfterRetirement: number;
}

/**
 * Drive a shipped level from just before its delivery trigger to `GONE`, with the
 * player never firing and the camera PARKED at a fixed x — the "ignore the window"
 * case the merge-gate panel found free.
 */
function driveIgnoreCase(run: LevelRun, cameraOffsetX: number): IgnoreRun {
  const level = levelById(run.id);
  const facade = levelFacade(run.id);
  const field = fieldFor(run.id);
  let state: GameState = {
    // Lives are raised out of the way: by D2.7 the assailants (and the ambient
    // wave) DO shoot back at the player, and a GAME_OVER mid-window would stop the
    // delivery machine before the claim under test — the gauge — could be observed.
    // The lives cost of the objective is A2, a stage-5 capture, not this AC.
    ...createInitialState(facade, { ...paramsForLevel(level), lives: 99 }, level.roster),
    // Start one tick before the scripted trigger: the ignore case never rolls a
    // wave over (no kills ⇒ `allDead` false), so wave 1's seating — the primary
    // path of K-8 — is exactly the seating under test.
    elapsedSeconds: run.spec.triggerAtElapsedSeconds - DT,
  };

  const series: number[] = [];
  let failTick = -1;
  let delivering = 0;
  let assailantsAtWindowOpen = -1;
  let integrityAtWindowOpen = -1;
  let livesAtFail = { before: state.lives, after: state.lives, hits: 0 };
  let scoreAtFail = { before: state.score, after: state.score };
  let deadAssailantsAfterRetirement = -1;

  for (let i = 0; i < 3000 && state.deliveryVehicle?.phase !== "GONE"; i++) {
    const before = state;
    state = tickGameState(
      before,
      noFire,
      0.5,
      0.5,
      DT,
      facade,
      cameraOffsetX,
      0,
      18,
      12,
      level.enemiesToWin,
      field,
      level.roster,
    );
    const phase = state.deliveryVehicle?.phase;
    if (phase === "DELIVERING") {
      if (delivering === 0) {
        assailantsAtWindowOpen = countAliveAssailants(state.enemies);
        integrityAtWindowOpen = state.deliveryVehicle?.integrity ?? -1;
      }
      delivering++;
      series.push(state.deliveryVehicle?.integrity ?? -1);
    }
    if (phase === "FAILED" && failTick < 0) {
      // `delivering` counts the DELIVERING ticks before this one: the arrival tick
      // opens the window without damaging (`tickDelivery` resets `windowRemaining`),
      // so this is exactly the number of ticks that CHARGED the gauge.
      failTick = delivering;
      livesAtFail = {
        before: before.lives,
        after: state.lives,
        hits: state.playerHitEvents?.length ?? 0,
      };
      scoreAtFail = { before: before.score, after: state.score };
      deadAssailantsAfterRetirement = state.enemies.filter(
        (e) => isDeliveryAssailant(e) && e.state === "DEAD",
      ).length;
    }
  }

  return {
    failTick,
    series,
    finalPhase: state.deliveryVehicle?.phase ?? "IDLE",
    score: state.score,
    livesAtFail,
    scoreAtFail,
    assailantsAtWindowOpen,
    integrityAtWindowOpen,
    deadAssailantsAfterRetirement,
  };
}

/** Camera x's spanning "on the van" and "far off the van" (AC2(a)). */
const CAMERAS = [0, 9, -9, 18, -18, 25];

describe("AC2(a)/AC3 — no camera position makes the delivery free", () => {
  for (const run of DELIVERY_LEVELS) {
    // t_fail = integrity / (N·D), a SINGLE number per level: the damage rule reads
    // neither the camera nor any freezable state, so every camera trajectory fails
    // at the same instant (spec §4.2).
    const tFail = run.spec.integrity / (DELIVERY_ASSAILANTS * DAMAGE_PER_ASSAILANT_PER_SECOND);
    const expectedTicks = Math.ceil(tFail / DT);

    for (const camera of CAMERAS) {
      it(`${run.id} @ camera ${String(camera)}: FAILED at ${tFail.toFixed(2)}s, no bonus`, () => {
        const r = driveIgnoreCase(run, camera);
        expect(r.assailantsAtWindowOpen).toBe(DELIVERY_ASSAILANTS);
        expect(r.integrityAtWindowOpen).toBe(run.spec.integrity);
        // FAILED, then the vehicle departs — AC3.
        expect(r.finalPhase).toBe("GONE");
        expect(Math.abs(r.failTick - expectedTicks)).toBeLessThanOrEqual(1);
        expect(r.failTick * DT).toBeCloseTo(tFail, 1);
        // scoreDelta 0: the bonus is never awarded, on any camera.
        expect(r.score).toBe(0);
        // AC11 — the escort leaves with the van, on the very transition tick.
        expect(r.deadAssailantsAfterRetirement).toBe(DELIVERY_ASSAILANTS);
        // K-10 / guidelines rule 6 ("jamais de mort bullshit"): losing the delivery
        // costs no point and no life. A life CAN move on that tick — the assault
        // shoots back (D2.7) — but only ever with a resolved player hit to explain
        // it; the delivery machine itself never touches lives.
        expect(r.scoreAtFail.after).toBe(r.scoreAtFail.before);
        if (r.livesAtFail.after !== r.livesAtFail.before) {
          expect(r.livesAtFail.hits).toBeGreaterThan(0);
        }
      });
    }

    it(`${run.id}: the integrity series is IDENTICAL on the van and far away (AC2(d))`, () => {
      const onVan = driveIgnoreCase(run, Math.round(run.spec.stopPosition.x));
      const away = driveIgnoreCase(run, 25);
      expect(onVan.series).toEqual(away.series);
      // AC2(c) — orientation: engaging must never punish the van.
      const damageOnVan = run.spec.integrity - (onVan.series.at(-1) ?? 0);
      const damageAway = run.spec.integrity - (away.series.at(-1) ?? 0);
      expect(damageOnVan).toBeLessThanOrEqual(damageAway);
    });
  }

  it("ADR-0071's frozen mid-SHOOTING wave cop no longer chips the gauge (AC6 at tick level)", () => {
    // The two cases this replaces (`stateMachine.test.ts` describe("frozen
    // mid-SHOOTING")) pinned the free objective and the INVERTED incentive as
    // expected behaviour. What survives is: an ambient shooter — frozen or not,
    // 1 unit from the stop line — contributes nothing.
    const spec: DeliverySpec = {
      vehicleType: "truck",
      triggerAtElapsedSeconds: 20,
      integrity: 100,
      windowSeconds: 8,
      bonus: 500,
      entrySide: "left",
      stopPosition: { x: 0, y: -5 },
    };
    const nearStop = FACADE_01.slots.findIndex((s) => Math.abs(s.screenPosition.x) <= 1);
    expect(nearStop).toBeGreaterThanOrEqual(0);
    const base = createInitialState(FACADE_01, {
      lives: 3,
      timeSeconds: LEVEL_TIME_SECONDS,
      enemiesToWin: ENEMIES_TO_WIN,
      enemySpeedMultiplier: 1,
      delivery: spec,
    });
    const shooter: Enemy = {
      id: 101,
      slotIndex: nearStop,
      state: "SHOOTING",
      timer: 5,
      kind: "normal",
      hp: 1,
    };
    const delivering: DeliveryVehicle = {
      phase: "DELIVERING",
      position: spec.stopPosition,
      vehicleType: "truck",
      integrity: 100,
      integrityMax: 100,
      windowRemaining: 5,
    };
    for (const camera of [0, 25]) {
      const next = tickGameState(
        { ...base, deliveryVehicle: delivering, enemies: [shooter], elapsedSeconds: 25 },
        noFire,
        0.5,
        0.5,
        1,
        FACADE_01,
        camera,
        0,
        18,
        12,
        undefined,
        fieldFor("belliard"),
      );
      expect(next.deliveryVehicle?.integrity).toBe(100);
    }
  });
});

describe("AC4/AC10 — the engaged player (belliard)", () => {
  const run = DELIVERY_LEVELS.find((l) => l.id === "belliard");
  const level = levelById("belliard");

  it("AC4: assailants dead at 2.0s and 4.0s ⇒ 6.0 assailant-seconds ⇒ integrity 46", () => {
    expect(run).toBeDefined();
    if (run === undefined) return;
    const facade = levelFacade("belliard");
    const field = fieldFor("belliard");
    let state: GameState = {
      ...createInitialState(facade, paramsForLevel(level), level.roster),
      elapsedSeconds: run.spec.triggerAtElapsedSeconds - DT,
    };
    let windowTicks = -1;
    let integrityAtEnd = -1;
    let scoreDeltaTotal = 0;

    for (let i = 0; i < 3000; i++) {
      // Retire an assailant exactly at 2.0s and 4.0s of the window (the design
      // harness's "killed at t": one alive-assailant-second is one 9-integrity
      // charge, whatever killed it).
      if (windowTicks >= 0) {
        const elapsed = windowTicks * DT;
        const wanted = elapsed >= 4.0 - 1e-9 ? 0 : elapsed >= 2.0 - 1e-9 ? 1 : 2;
        let alive = countAliveAssailants(state.enemies);
        if (alive > wanted) {
          const enemies = state.enemies.map((e) => {
            if (alive > wanted && isDeliveryAssailant(e) && e.state !== "DEAD") {
              alive--;
              return { ...e, state: "DEAD" as const, timer: 0 };
            }
            return e;
          });
          state = { ...state, enemies };
        }
      }
      const before = state.score;
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        DT,
        facade,
        0,
        0,
        18,
        12,
        level.enemiesToWin,
        field,
        level.roster,
      );
      scoreDeltaTotal += state.score - before;
      const phase = state.deliveryVehicle?.phase;
      if (phase === "DELIVERING") windowTicks = windowTicks < 0 ? 0 : windowTicks + 1;
      if (phase === "SUCCESS" || phase === "FAILED") {
        integrityAtEnd = state.deliveryVehicle?.integrity ?? -1;
        expect(phase).toBe("SUCCESS");
        break;
      }
    }
    // 100 − 9 × 6.0 = 46, with the architect's ±one-tick-per-kill tolerance (§2.3).
    expect(integrityAtEnd).toBeGreaterThan(45.6);
    expect(integrityAtEnd).toBeLessThan(46.4);
    expect(scoreDeltaTotal).toBe(run.spec.bonus);
    expect(state.score).toBe(run.spec.bonus);
  });

  it("AC10: no damage during INCOMING, and pre-empting buys a damage-free window", () => {
    expect(run).toBeDefined();
    if (run === undefined) return;
    const facade = levelFacade("belliard");
    const field = fieldFor("belliard");
    const reserved = reservedAssaultSlots(facade, run.spec);
    let state: GameState = {
      ...createInitialState(facade, paramsForLevel(level), level.roster),
      elapsedSeconds: run.spec.triggerAtElapsedSeconds - DT,
    };
    const killsBefore = state.kills;
    let integrityAtWindowOpen = -1;
    let integrityAtEnd = -1;

    for (let i = 0; i < 3000; i++) {
      const phase = state.deliveryVehicle?.phase;
      // Clear the ambush pre-emptively, during the roll-in: aim the camera (hence
      // the centred crosshair) at each reserved slot in turn and fire.
      const target = state.enemies.find((e) => isDeliveryAssailant(e) && e.state !== "DEAD");
      const slot = target === undefined ? undefined : facade.slots[target.slotIndex];
      const shooting = phase === "INCOMING" && slot !== undefined;
      state = tickGameState(
        state,
        shooting ? fire : noFire,
        0.5,
        0.5,
        DT,
        facade,
        shooting ? slot.screenPosition.x : 0,
        shooting ? slot.screenPosition.y : 0,
        18,
        12,
        level.enemiesToWin,
        field,
        level.roster,
      );
      const next = state.deliveryVehicle?.phase;
      if (next === "DELIVERING" && integrityAtWindowOpen < 0) {
        integrityAtWindowOpen = state.deliveryVehicle?.integrity ?? -1;
        // The assault died during the roll-in, before the gauge could ever move.
        expect(countAliveAssailants(state.enemies)).toBe(0);
      }
      if (next === "SUCCESS" || next === "FAILED") {
        integrityAtEnd = state.deliveryVehicle?.integrity ?? -1;
        expect(next).toBe("SUCCESS");
        break;
      }
    }
    expect(integrityAtWindowOpen).toBe(run.spec.integrity);
    expect(integrityAtEnd).toBe(run.spec.integrity);
    // Killing them scores and credits the quota exactly like any window cop (D2.7).
    expect(state.kills).toBe(killsBefore + DELIVERY_ASSAILANTS);
    expect(state.score).toBeGreaterThan(run.spec.bonus);
    // Both reserved slots were the ones engaged.
    expect(reserved).toHaveLength(DELIVERY_ASSAILANTS);
  });
});

describe("AC11/AC14 — retirement and the ADR-0071 invariants, in a controlled scene", () => {
  const spec: DeliverySpec = {
    vehicleType: "truck",
    triggerAtElapsedSeconds: 20,
    integrity: 100,
    windowSeconds: 8,
    bonus: 500,
    entrySide: "left",
    stopPosition: { x: 0, y: -5 },
  };
  const params: LevelParams = {
    lives: 3,
    timeSeconds: LEVEL_TIME_SECONDS,
    enemiesToWin: ENEMIES_TO_WIN,
    enemySpeedMultiplier: 1,
    delivery: spec,
  };
  const FIELD: CourierField = { halfWidth: 40, streetY: -5 };
  // Two wave cops parked at the far left of FACADE_01 (x = −18 / −16): they keep
  // `allDead` false (no rollover) and are off screen for every camera used here,
  // so the ONLY enemies that could ever fire are the assailants.
  const farCops: readonly Enemy[] = [0, 1].map((slotIndex) => ({
    id: 101 + slotIndex,
    slotIndex,
    state: "VISIBLE",
    timer: 0.001,
    kind: "normal",
    hp: 1,
  }));

  function seatedState(): GameState {
    const base: GameState = {
      ...createInitialState(FACADE_01, params),
      enemies: farCops,
      elapsedSeconds: spec.triggerAtElapsedSeconds - DT,
    };
    // One tick to cross IDLE → INCOMING, which is where the assault is seated.
    const seated = tickGameState(
      base,
      noFire,
      0.5,
      0.5,
      DT,
      FACADE_01,
      40,
      0,
      18,
      12,
      undefined,
      FIELD,
    );
    expect(seated.deliveryVehicle?.phase).toBe("INCOMING");
    expect(countAliveAssailants(seated.enemies)).toBe(DELIVERY_ASSAILANTS);
    return seated;
  }

  it("AC14: frozen assailants spawn NO bullet and hold their state, while still bleeding", () => {
    let state = seatedState();
    const seeded = state.enemies.filter(isDeliveryAssailant);
    let sawDelivering = false;
    for (let i = 0; i < 1200 && state.deliveryVehicle?.phase !== "FAILED"; i++) {
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        DT,
        FACADE_01,
        // Camera 40: nothing on this facade is on screen, so ADR-0071 freezes the
        // whole scene — including the assault.
        40,
        0,
        18,
        12,
        undefined,
        FIELD,
      );
      // No enemy round exists at any point: `SHOOTING` is only ever ENTERED on
      // screen, so a frozen assailant threatens the gauge, never the player.
      expect(state.bullets.filter((b) => !b.fromPlayer)).toHaveLength(0);
      if (state.deliveryVehicle?.phase === "DELIVERING") {
        sawDelivering = true;
        // Frozen: state HELD and countdown PAUSED for the whole window, and still
        // bleeding the gauge — the D1-Rev.2 property, in one assertion.
        for (const a of state.enemies.filter(isDeliveryAssailant)) {
          const seed = seeded.find((s) => s.id === a.id);
          expect(a.state).toBe("VISIBLE");
          expect(a.timer).toBe(seed?.timer);
        }
      }
    }
    expect(sawDelivering).toBe(true);
    expect(state.deliveryVehicle?.phase).toBe("FAILED");
    expect(state.lives).toBe(3);
  });

  // The architect's §2.3 ruling ("count the POST-shot array `shotEnemies`, not the
  // pre-shot `activeEnemies`") is implemented as ruled. Its measured consequence,
  // pinned here so nobody re-derives it wrongly: under the ratified ALIVE rule the
  // two arrays can never DISAGREE, because a player shot resolves to `HIT` (hp 0),
  // never straight to `DEAD` — the corpse appears one `HIT_DURATION` later, through
  // `tickEnemy`. So AC4's "± one tick per kill" tolerance is not actually consumed,
  // and the drain keeps running for the 0.2 s hit flash.
  it("a shot assailant is HIT — still ALIVE, still chipping — until `tickEnemy` retires it", () => {
    let state = seatedState();
    // Reach the window with both assailants up.
    for (let i = 0; i < 2000 && state.deliveryVehicle?.phase !== "DELIVERING"; i++) {
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        DT,
        FACADE_01,
        40,
        0,
        18,
        12,
        undefined,
        FIELD,
      );
    }
    expect(state.deliveryVehicle?.phase).toBe("DELIVERING");
    const target = state.enemies.find(isDeliveryAssailant);
    const slot = FACADE_01.slots[target?.slotIndex ?? 0];
    expect(slot).toBeDefined();
    if (slot === undefined) return;

    // Fire at it (camera on the slot ⇒ the centred crosshair lands on it) until it drops.
    let downTick: GameState | null = null;
    let integrityBefore = state.deliveryVehicle?.integrity ?? 0;
    for (let i = 0; i < 60 && downTick === null; i++) {
      integrityBefore = state.deliveryVehicle?.integrity ?? 0;
      state = tickGameState(
        state,
        fire,
        0.5,
        0.5,
        DT,
        FACADE_01,
        slot.screenPosition.x,
        slot.screenPosition.y,
        18,
        12,
        undefined,
        FIELD,
      );
      const shot = state.enemies.find((e) => e.id === target?.id);
      if ((shot?.hp ?? 1) <= 0) downTick = state;
    }
    expect(downTick).not.toBeNull();
    const shot = downTick?.enemies.find((e) => e.id === target?.id);
    expect(shot?.state).toBe("HIT");
    // Both assailants are still charged on the tick the kill lands…
    expect(countAliveAssailants(downTick?.enemies ?? [])).toBe(DELIVERY_ASSAILANTS);
    expect(integrityBefore - (downTick?.deliveryVehicle?.integrity ?? 0)).toBeCloseTo(
      DAMAGE_PER_ASSAILANT_PER_SECOND * DELIVERY_ASSAILANTS * DT,
      6,
    );
    // …and only the corpse, one hit-flash later, halves the drain.
    for (let i = 0; i < 30 && countAliveAssailants(state.enemies) > 1; i++) {
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        DT,
        FACADE_01,
        40,
        0,
        18,
        12,
        undefined,
        FIELD,
      );
    }
    expect(countAliveAssailants(state.enemies)).toBe(1);
    const beforeHalved = state.deliveryVehicle?.integrity ?? 0;
    state = tickGameState(state, noFire, 0.5, 0.5, DT, FACADE_01, 40, 0, 18, 12, undefined, FIELD);
    expect(beforeHalved - (state.deliveryVehicle?.integrity ?? 0)).toBeCloseTo(
      DAMAGE_PER_ASSAILANT_PER_SECOND * DT,
      6,
    );
  });

  it("AC11: retirement unblocks `allDead` — the wave rolls over again", () => {
    // Only the assault is left alive in the array (the wave cops are already
    // down), so `allDead` is reachable as soon as the escort retires.
    const seated = seatedState();
    let state: GameState = {
      ...seated,
      enemies: [
        ...seated.enemies.filter(isDeliveryAssailant),
        ...farCops.map((c) => ({ ...c, state: "DEAD" as const, hp: 0 })),
      ],
    };
    const waveBefore = state.wave;
    let retired: GameState | null = null;
    for (let i = 0; i < 1200; i++) {
      const before = state;
      state = tickGameState(
        state,
        noFire,
        0.5,
        0.5,
        DT,
        FACADE_01,
        40,
        0,
        18,
        12,
        undefined,
        FIELD,
      );
      const phase = state.deliveryVehicle?.phase;
      if ((phase === "FAILED" || phase === "SUCCESS") && retired === null) {
        retired = state;
        expect(state.enemies.filter((e) => isDeliveryAssailant(e) && e.state !== "DEAD")).toEqual(
          [],
        );
        // The retirement itself pays nothing: no score, no kill, no life.
        expect(state.score).toBe(before.score);
        expect(state.kills).toBe(before.kills);
        expect(state.lives).toBe(before.lives);
        continue;
      }
      if (retired !== null) {
        expect(state.wave).toBe(waveBefore + 1);
        break;
      }
    }
    expect(retired).not.toBeNull();
  });
});

describe("AC12 — the reservation holds at every slot consumer (K-8)", () => {
  it.each(DELIVERY_LEVELS.map((l) => [l.id, l.spec] as const))(
    "%s: wave 1 (createInitialState) never seats on a reserved slot",
    (id, spec) => {
      const facade = levelFacade(id);
      const level = levelById(id);
      const reserved = reservedAssaultSlots(facade, spec);
      const state = createInitialState(facade, paramsForLevel(level), level.roster);
      expect(state.enemies.some((e) => reserved.includes(e.slotIndex))).toBe(false);
    },
  );

  it.each(DELIVERY_LEVELS.map((l) => [l.id, l.spec] as const))(
    "%s: the wave ROLLOVER never seats on a reserved slot, waves 2..21",
    (id, spec) => {
      const facade = levelFacade(id);
      const level = levelById(id);
      const field = fieldFor(id);
      const reserved = reservedAssaultSlots(facade, spec);
      const fresh = createInitialState(facade, paramsForLevel(level), level.roster);
      // A CLEARED wave, not an empty street: since the panel's B2 fix an empty enemy
      // array no longer rolls the wave over (`every()` on `[]` is vacuously true).
      let state: GameState = { ...fresh, enemies: wiped(fresh.enemies) };
      for (let wave = 2; wave <= 21; wave++) {
        state = tickGameState(
          state,
          noFire,
          0.5,
          0.5,
          DT,
          facade,
          0,
          0,
          18,
          12,
          level.enemiesToWin,
          field,
          level.roster,
        );
        expect(state.wave).toBe(wave);
        expect(state.enemies.some((e) => reserved.includes(e.slotIndex))).toBe(false);
        // Next rollover.
        state = { ...state, enemies: wiped(state.enemies) };
      }
    },
  );

  it("K-8: a wave-1 cop on a reserved slot would make the objective free — and cannot happen", () => {
    // No SHIPPED level's wave 1 lands on a reserved slot today, so this geometry is
    // synthetic ON PURPOSE: it is the only way to make the wave-1 call site's
    // exclusion BITE rather than be a guard that never fires. 16 slots (wave 1 seats
    // #4 then #3) with the two nearest the stop line being exactly #3/#4.
    const facade = {
      width: 16,
      height: 1,
      slots: Array.from({ length: 16 }, (_, col) => ({
        col,
        row: 0,
        screenPosition: { x: col === 3 ? 0.5 : col === 4 ? -0.5 : 20 + col, y: 2 },
      })),
    };
    const spec: DeliverySpec = {
      vehicleType: "truck",
      triggerAtElapsedSeconds: 20,
      integrity: 100,
      windowSeconds: 8,
      bonus: 500,
      entrySide: "left",
      stopPosition: { x: 0, y: -5 },
    };
    expect(reservedAssaultSlots(facade, spec)).toEqual([3, 4]);
    expect(spawnWave(1, facade).map((e) => e.slotIndex)).toEqual([4, 3]);

    const params: LevelParams = {
      lives: 99,
      timeSeconds: LEVEL_TIME_SECONDS,
      enemiesToWin: ENEMIES_TO_WIN,
      enemySpeedMultiplier: 1,
      delivery: spec,
    };
    let state: GameState = {
      ...createInitialState(facade, params),
      elapsedSeconds: spec.triggerAtElapsedSeconds - DT,
    };
    // Wave 1 was pushed off the ambush windows…
    expect(state.enemies.some((e) => [3, 4].includes(e.slotIndex))).toBe(false);
    expect(state.enemies).toHaveLength(2);

    let seated = -1;
    for (let i = 0; i < 2000 && state.deliveryVehicle?.phase !== "FAILED"; i++) {
      state = tickGameState(state, noFire, 0.5, 0.5, DT, facade, 0, 0, 18, 12, undefined, {
        halfWidth: 40,
        streetY: -5,
      });
      if (seated < 0 && state.deliveryVehicle?.phase === "INCOMING") {
        seated = countAliveAssailants(state.enemies);
      }
    }
    // …so the full assault seats, and the ignored window is LOST, not free.
    expect(seated).toBe(DELIVERY_ASSAILANTS);
    expect(state.deliveryVehicle?.phase).toBe("FAILED");
    expect(state.score).toBe(0);
  });

  it("the rollover excludes the crate slot AND the reserved slots (union, not replacement)", () => {
    const id = "belliard";
    const facade = levelFacade(id);
    const level = levelById(id);
    const reserved = reservedAssaultSlots(facade, level.deliveries[0] ?? null);
    // A live crate on a slot the unreserved wave 2 WOULD have taken.
    const crateSlot = spawnWave(2, facade)[0]?.slotIndex ?? 0;
    const crate: LootCrate = {
      id: 1,
      slotIndex: crateSlot,
      state: "VISIBLE",
      timer: 5,
      weapon: "spread",
    };
    const state = tickGameState(
      {
        ...createInitialState(facade, paramsForLevel(level), level.roster),
        enemies: wiped(createInitialState(facade, paramsForLevel(level), level.roster).enemies),
        loot: crate,
      },
      noFire,
      0.5,
      0.5,
      DT,
      facade,
      0,
      0,
      18,
      12,
      level.enemiesToWin,
      fieldFor(id),
      level.roster,
    );
    expect(state.wave).toBe(2);
    expect(state.enemies.some((e) => e.slotIndex === crateSlot)).toBe(false);
    expect(state.enemies.some((e) => reserved.includes(e.slotIndex))).toBe(false);
  });

  it("the loot crate never spawns on a reserved slot (lootSystem seam)", () => {
    // A facade with exactly two slots: the reserved one at the stop line, and one
    // far outside `LOOT_MAX_ABS_X`. With the reservation honoured, NO slot is
    // crate-eligible, so no crate can ever spawn — without it, one spawns on the
    // reserved slot (the pre-arming hole D2.8 names: `CRATE_DELIVERY_GAP_X` only
    // guards the INCOMING|DELIVERING phases).
    const facade = {
      width: 2,
      height: 1,
      slots: [
        { col: 0, row: 0, screenPosition: { x: 0, y: 2 } },
        { col: 1, row: 0, screenPosition: { x: LOOT_MAX_ABS_X + 10, y: 2 } },
      ],
    };
    const spec: DeliverySpec = {
      vehicleType: "truck",
      triggerAtElapsedSeconds: 20,
      integrity: 100,
      windowSeconds: 8,
      bonus: 500,
      entrySide: "left",
      stopPosition: { x: 0, y: -5 },
    };
    expect(reservedAssaultSlots(facade, spec)).toEqual([0]);
    let state: GameState = {
      ...createInitialState(facade, {
        lives: 3,
        timeSeconds: LEVEL_TIME_SECONDS,
        enemiesToWin: ENEMIES_TO_WIN,
        enemySpeedMultiplier: 1,
        delivery: spec,
        loot: { spawnIntervalSeconds: 0.2, weapons: ["spread"] },
      }),
      enemies: [],
      wave: 1,
    };
    for (let i = 0; i < 200; i++) {
      state = tickGameState(state, noFire, 0.5, 0.5, DT, facade, 0, 0, 18, 12, undefined, {
        halfWidth: 40,
        streetY: -5,
      });
      expect(state.loot).toBeNull();
    }
  });

  it("AC12.3: niveau-final seats EXACTLY 2 under occupancy, at a colliding wave", () => {
    const id = "niveau-final";
    const facade = levelFacade(id);
    const level = levelById(id);
    const spec = level.deliveries[0];
    expect(spec).toBeDefined();
    if (spec === undefined) return;
    const reserved = reservedAssaultSlots(facade, spec);
    const WAVE = 9;
    // The counterfactual that makes this test bite: WITHOUT the reservation, wave 9
    // takes BOTH reserved slots (measured: w4, w9 and w10 each lose both).
    expect(spawnWave(WAVE, facade).filter((e) => reserved.includes(e.slotIndex))).toHaveLength(
      DELIVERY_ASSAILANTS,
    );

    const cohort = spawnWave(WAVE, facade, undefined, reserved);
    const free = facade.slots
      .map((_s, i) => i)
      .filter((i) => !reserved.includes(i) && !cohort.some((e) => e.slotIndex === i));
    const corpseSlot = free[0] ?? 0;
    const crateSlot = free[1] ?? 0;
    const corpse: Enemy = {
      id: 999,
      slotIndex: corpseSlot,
      state: "DEAD",
      timer: 0,
      kind: "normal",
      hp: 0,
    };
    const crate: LootCrate = {
      id: 1,
      slotIndex: crateSlot,
      state: "VISIBLE",
      timer: 5,
      weapon: "spread",
    };
    let state: GameState = {
      // Niveau-final authors no crate config; belliard's is borrowed so a live
      // crate can sit on the facade for this occupancy case.
      ...createInitialState(
        facade,
        { ...paramsForLevel(level), loot: levelById("belliard").loot ?? null },
        level.roster,
      ),
      wave: WAVE,
      enemies: [...cohort, corpse],
      loot: crate,
      elapsedSeconds: spec.triggerAtElapsedSeconds - DT,
    };
    state = tickGameState(
      state,
      noFire,
      0.5,
      0.5,
      DT,
      facade,
      0,
      0,
      18,
      12,
      level.enemiesToWin,
      fieldFor(id),
      level.roster,
    );
    expect(state.deliveryVehicle?.phase).toBe("INCOMING");
    const seated = state.enemies.filter(isDeliveryAssailant);
    expect(seated).toHaveLength(DELIVERY_ASSAILANTS);
    expect(seated.map((e) => e.slotIndex)).toEqual([...reserved]);
    expect(seated.map((e) => e.id)).toEqual([
      DELIVERY_ASSAULT_ID_BASE,
      DELIVERY_ASSAULT_ID_BASE + 1,
    ]);
    // One entity per slot: nothing is seated behind the corpse or the crate.
    expect(seated.some((e) => e.slotIndex === corpseSlot || e.slotIndex === crateSlot)).toBe(false);
  });
});

describe("AC13 — a level with no delivery is untouched", () => {
  it("seats wave 1 exactly as `spawnWave` does, with no reservation and no assault", () => {
    const params: LevelParams = {
      lives: 3,
      timeSeconds: LEVEL_TIME_SECONDS,
      enemiesToWin: ENEMIES_TO_WIN,
      enemySpeedMultiplier: 1,
    };
    const state = createInitialState(FACADE_01, params);
    expect(state.enemies).toEqual(spawnWave(1, FACADE_01));
    expect(reservedAssaultSlots(FACADE_01, null)).toEqual([]);

    let s = state;
    for (let i = 0; i < 300; i++) {
      s = tickGameState(s, noFire, 0.5, 0.5, DT, FACADE_01, 0, 0, 18, 12, undefined, {
        halfWidth: 40,
        streetY: -5,
      });
      expect(s.enemies.some(isDeliveryAssailant)).toBe(false);
    }
  });
});

describe("AC16 — the reservation degrades gracefully (disclosed edge, K-11)", () => {
  it("niveau-final's cohort caps at 14 from wave 14, never throws, never empties", () => {
    const facade = levelFacade("niveau-final");
    const level = levelById("niveau-final");
    const spec = level.deliveries[0];
    expect(spec).toBeDefined();
    if (spec === undefined) return;
    const reserved = reservedAssaultSlots(facade, spec);
    expect(facade.slots).toHaveLength(16);
    for (let wave = 1; wave <= 20; wave++) {
      // `spawnWave` computes `count` BEFORE filtering and slices the filtered
      // list (`enemySystem.ts:103/122`), so the effective cohort is
      // min(1 + wave, slots − reserved).
      const cohort = spawnWave(wave, facade, undefined, reserved);
      expect(cohort).toHaveLength(Math.min(1 + wave, facade.slots.length - reserved.length));
      expect(cohort.length).toBeGreaterThan(0);
      expect(cohort.some((e) => reserved.includes(e.slotIndex))).toBe(false);
    }
    // The cap only ever bites from wave 14 — and it is unreachable in a shipped
    // run (wave 14 needs ≈ 104 kills inside 70 s).
    expect(spawnWave(13, facade).length).toBe(spawnWave(13, facade, undefined, reserved).length);
    expect(spawnWave(14, facade).length).toBeGreaterThan(
      spawnWave(14, facade, undefined, reserved).length,
    );
  });
});
