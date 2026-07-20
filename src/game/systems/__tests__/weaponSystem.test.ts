import { describe, it, expect } from "vitest";
import { resolveTrigger } from "@game/systems/weaponSystem";
import type { TriggerResult } from "@game/systems/weaponSystem";
import { WEAPON_SPECS } from "@game/types/weapon";
import type { WeaponState } from "@game/types/weapon";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Courier } from "@game/types/courier";
import type { FacadeMap } from "@game/types/map";
import type { LootCrate } from "@game/types/loot";
import type { Vec2 } from "@game/types/vector";
import { ARCHETYPES } from "@game/types/enemyTypes";

const centre: Crosshair = { position: { x: 0.5, y: 0.5 } }; // → world (0,0)

function facadeWithSlots(positions: readonly Vec2[]): FacadeMap {
  return {
    width: 20,
    height: 4,
    slots: positions.map((p, i) => ({ col: i, row: 0, screenPosition: p })),
  };
}

function enemyAt(slotIndex: number, overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: slotIndex + 1,
    slotIndex,
    state: "VISIBLE",
    timer: 1,
    kind: "normal",
    hp: 1,
    ...overrides,
  };
}

function courier(id: number, x: number, y = 0): Courier {
  return { id, x, y, dir: 1, speed: 7 };
}

const baseW = (): WeaponState => ({
  active: "base",
  stock: Infinity,
  burstRemaining: 0,
  burstTimerMs: 0,
  refractoryMs: 0,
});
const autoW = (over: Partial<WeaponState> = {}): WeaponState => ({
  active: "auto",
  stock: WEAPON_SPECS.auto.startStock,
  burstRemaining: 0,
  burstTimerMs: 0,
  refractoryMs: 0,
  ...over,
});
const spreadW = (over: Partial<WeaponState> = {}): WeaponState => ({
  active: "spread",
  stock: WEAPON_SPECS.spread.startStock,
  burstRemaining: 0,
  burstTimerMs: 0,
  refractoryMs: 0,
  ...over,
});

const EMPTY: readonly Courier[] = [];

// Convenience wrapper with the default camera/view args.
function trigger(
  weapon: WeaponState,
  fire: boolean,
  delta: number,
  enemies: readonly Enemy[],
  loot: LootCrate | null,
  facade: FacadeMap,
  couriers: readonly Courier[] = EMPTY,
): TriggerResult {
  return resolveTrigger(weapon, fire, delta, centre, enemies, loot, facade, couriers);
}

describe("resolveTrigger — A base (AC1/AC2): 1 resolution at offset 0, ∞ stock", () => {
  it("fire on an enemy at the crosshair ⇒ exactly one enemy-hit impact, stock stays Infinity", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const r = trigger(baseW(), true, 0.016, [enemyAt(0)], null, facade);
    expect(r.impacts).toHaveLength(1);
    expect(r.impacts[0]?.classification).toBe("hit");
    expect(r.targetsDown).toBe(1);
    expect(r.weapon.active).toBe("base");
    expect(r.weapon.stock).toBe(Infinity);
  });

  it("never decrements base stock across many shots", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    let w = baseW();
    for (let i = 0; i < 50; i++) w = trigger(w, true, 0.016, [enemyAt(0)], null, facade).weapon;
    expect(w.stock).toBe(Infinity);
  });

  it("no fire ⇒ no impacts, weapon untouched", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const r = trigger(baseW(), false, 0.016, [enemyAt(0)], null, facade);
    expect(r.impacts).toHaveLength(0);
    expect(r.weapon).toEqual(baseW());
  });
});

describe("resolveTrigger — B auto (AC3): per-trigger burst, ≤1 round/tick", () => {
  const facade = facadeWithSlots([{ x: 100, y: 100 }]); // far away ⇒ every round misses (still 1 impact)

  it("one trigger fires BURST_ROUNDS rounds over successive ticks; -1 stock per round", () => {
    let w = autoW();
    // Start tick: arms the burst, emits no round yet (threshold-based, D4).
    let r = trigger(w, true, 0.1, [], null, facade);
    w = r.weapon;
    expect(r.impacts).toHaveLength(0);
    expect(w.burstRemaining).toBe(WEAPON_SPECS.auto.burstRounds);

    let rounds = 0;
    for (let i = 0; i < 6; i++) {
      r = trigger(w, false, 0.1, [], null, facade);
      w = r.weapon;
      rounds += r.impacts.length;
    }
    expect(rounds).toBe(WEAPON_SPECS.auto.burstRounds);
    expect(w.burstRemaining).toBe(0);
    expect(w.stock).toBe(WEAPON_SPECS.auto.startStock - WEAPON_SPECS.auto.burstRounds);
    expect(w.refractoryMs).toBeGreaterThan(0); // post-burst lockout armed
  });

  it("further fire during a burst is ignored (still exactly BURST_ROUNDS rounds)", () => {
    let w = autoW();
    let rounds = 0;
    // Hold fire down for many ticks; the burst must not extend or restart mid-flight.
    for (let i = 0; i < 20; i++) {
      const r = trigger(w, true, 0.1, [], null, facade);
      w = r.weapon;
      rounds += r.impacts.length;
      if (w.refractoryMs > 0 && w.burstRemaining === 0) break; // burst finished + locked out
    }
    expect(rounds).toBe(WEAPON_SPECS.auto.burstRounds);
  });

  it("the post-burst refractory blocks a new trigger until it elapses", () => {
    // Enter the refractory directly.
    let w = autoW({ stock: 100, burstRemaining: 0, refractoryMs: WEAPON_SPECS.auto.refractoryMs });
    // Fire while locked out ⇒ no new burst.
    let r = trigger(w, true, 0.05, [], null, facade);
    w = r.weapon;
    expect(w.burstRemaining).toBe(0);
    // Elapse the rest of the lockout, then fire ⇒ a new burst arms.
    r = trigger(w, true, 0.2, [], null, facade);
    w = r.weapon;
    expect(w.burstRemaining).toBe(WEAPON_SPECS.auto.burstRounds);
  });
});

describe("resolveTrigger — C spread (AC4): 3 simultaneous resolutions at ±2 u", () => {
  it("fires 3 resolutions covering the 3 adjacent columns; -1 stock per press; refractory armed", () => {
    const facade = facadeWithSlots([
      { x: -2, y: 0 },
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
    const enemies = [enemyAt(0), enemyAt(1), enemyAt(2)];
    const r = trigger(spreadW(), true, 0.016, enemies, null, facade);
    expect(r.impacts).toHaveLength(3);
    expect(r.impacts.every((i) => i.classification === "hit")).toBe(true);
    expect(r.targetsDown).toBe(3);
    expect(r.weapon.stock).toBe(WEAPON_SPECS.spread.startStock - 1);
    expect(r.weapon.refractoryMs).toBe(WEAPON_SPECS.spread.refractoryMs);
  });

  it("the press cooldown blocks a second press until it elapses", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    let w = spreadW();
    w = trigger(w, true, 0.016, [], null, facade).weapon;
    expect(w.stock).toBe(WEAPON_SPECS.spread.startStock - 1);
    // Immediate second press blocked by the cooldown.
    w = trigger(w, true, 0.05, [], null, facade).weapon;
    expect(w.stock).toBe(WEAPON_SPECS.spread.startStock - 1);
    // After the cooldown elapses, a press fires again.
    w = trigger(w, true, 0.3, [], null, facade).weapon;
    expect(w.stock).toBe(WEAPON_SPECS.spread.startStock - 2);
  });
});

describe("resolveTrigger — discrimination integrity (AC5): full penalty per resolution, no amnesty", () => {
  const civ = ARCHETYPES.civilian;

  it("a spread press landing on 3 couriers charges the civilian penalty 3 times", () => {
    const facade = facadeWithSlots([{ x: 100, y: 100 }]); // no window hits
    const couriers = [courier(1, -2), courier(2, 0), courier(3, 2)];
    const r = trigger(spreadW(), true, 0.016, [], null, facade, couriers);
    expect(r.pointFeedback).toHaveLength(3);
    expect(r.livesDelta).toBe(civ.livesDelta * 3);
    expect(r.scoreDelta).toBe(civ.scoreDelta * 3);
  });

  it("threads couriers so one courier reachable by two barrels is hit only once (no double-hit)", () => {
    const facade = facadeWithSlots([{ x: 100, y: 100 }]);
    // A single courier at x=1 sits within COURIER_HIT_RADIUS (1.2) of BOTH the
    // centre barrel (x=0) and the right barrel (x=2).
    const couriers = [courier(1, 1)];
    const r = trigger(spreadW(), true, 0.016, [], null, facade, couriers);
    expect(r.pointFeedback).toHaveLength(1);
    expect(r.livesDelta).toBe(civ.livesDelta);
    expect(r.couriers).toHaveLength(0);
  });
});

describe("resolveTrigger — LOOT equip (AC7-loot/AC8)", () => {
  const facade = facadeWithSlots([{ x: 0, y: 0 }]);
  const crate: LootCrate = { id: 1, slotIndex: 0, state: "VISIBLE", timer: 1, weapon: "spread" };

  it("firing a VISIBLE crate equips at full stock with ZERO score/lives; crate consumed; no impact", () => {
    const r = trigger(baseW(), true, 0.016, [], crate, facade);
    expect(r.weapon.active).toBe("spread");
    expect(r.weapon.stock).toBe(WEAPON_SPECS.spread.startStock);
    expect(r.loot).toBeNull();
    expect(r.scoreDelta).toBe(0);
    expect(r.livesDelta).toBe(0);
    expect(r.impacts).toHaveLength(0); // loot pickup is its own render channel
    expect(r.weaponEmpty).toBe(false);
  });

  it("equip takes effect from the NEXT trigger (the equipping shot used the old weapon)", () => {
    // Equip auto off a crate while holding base.
    const autoCrate: LootCrate = { ...crate, weapon: "auto" };
    const equipped = trigger(baseW(), true, 0.016, [], autoCrate, facade).weapon;
    expect(equipped.active).toBe("auto");
    expect(equipped.burstRemaining).toBe(0); // no burst started on the equipping tick
    // Next trigger fires the newly-equipped auto (arms a burst).
    const next = trigger(equipped, true, 0.016, [], null, facade).weapon;
    expect(next.burstRemaining).toBe(WEAPON_SPECS.auto.burstRounds);
  });
});

describe("resolveTrigger — auto-return on empty (AC10)", () => {
  const facade = facadeWithSlots([{ x: 100, y: 100 }]);

  it("spread stock→0 returns to base the same tick with a weaponEmpty event", () => {
    const r = trigger(spreadW({ stock: 1 }), true, 0.016, [], null, facade);
    expect(r.weapon.active).toBe("base");
    expect(r.weapon.stock).toBe(Infinity);
    expect(r.weaponEmpty).toBe(true);
  });

  it("auto emptying mid-burst ends the burst that tick and returns to base", () => {
    const w = autoW({ stock: 1, burstRemaining: 3, burstTimerMs: 85 });
    const r = trigger(w, false, 0.1, [], null, facade); // burstTimerMs crosses 90 ⇒ round fires
    expect(r.weapon.active).toBe("base");
    expect(r.weapon.burstRemaining).toBe(0);
    expect(r.weaponEmpty).toBe(true);
  });
});

describe("resolveTrigger — P2: mid-burst crate equip aborts the burst", () => {
  it("a burst round landing on a crate equips immediately and clears burstRemaining", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const crate: LootCrate = { id: 1, slotIndex: 0, state: "VISIBLE", timer: 1, weapon: "spread" };
    const w = autoW({ stock: 50, burstRemaining: 4, burstTimerMs: 85 });
    const r = trigger(w, false, 0.1, [], crate, facade); // the round crosses the interval and hits the crate
    expect(r.weapon.active).toBe("spread");
    expect(r.weapon.stock).toBe(WEAPON_SPECS.spread.startStock);
    expect(r.weapon.burstRemaining).toBe(0);
    expect(r.loot).toBeNull();
  });
});
