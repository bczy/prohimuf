import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ASSAULT_RADIUS,
  DELIVERY_ASSAILANTS,
  DELIVERY_ASSAULT_ID_BASE,
  countAliveAssailants,
  isDeliveryAssailant,
  reservedAssaultSlots,
  retireAssault,
  seatAssault,
} from "@game/systems/deliveryAssault";
import { DAMAGE_PER_ASSAILANT_PER_SECOND } from "@game/systems/deliverySystem";
import { spawnWave } from "@game/systems/enemySystem";
import { archetype } from "@game/types/enemyTypes";
import type { Enemy, EnemyKind, EnemyState } from "@game/types/enemy";
import type { DeliverySpec } from "@game/types/delivery";
import type { FacadeMap, WindowSlot } from "@game/types/map";
import { LEVELS } from "@game/levels/levels";
import { levelFacade } from "../../levels/__tests__/levelFacade";

/**
 * The delivery assault (`docs/game-design/spec-delivery-van-assault.md` Rev.2 +
 * K-7…K-11). Unit level: the seating, the reservation and the ALIVE damage count.
 * The tick-level ACs (AC2/AC3/AC4/AC10-AC14/AC16) live in `stateMachine.test.ts`.
 */

const ALL_STATES: readonly EnemyState[] = [
  "HIDDEN",
  "APPEARING",
  "VISIBLE",
  "SHOOTING",
  "HIT",
  "DEAD",
];

const SPEC: DeliverySpec = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 500,
  entrySide: "left",
  stopPosition: { x: 0, y: -5 },
};

/** A facade whose slot x's are supplied straight up (y is irrelevant here). */
function facadeAtX(xs: readonly number[]): FacadeMap {
  const slots: WindowSlot[] = xs.map((x, col) => ({
    col,
    row: 0,
    screenPosition: { x, y: 2 },
  }));
  return { width: slots.length, height: 1, slots };
}

function enemy(over: Partial<Enemy> & Pick<Enemy, "id" | "slotIndex">): Enemy {
  return { state: "VISIBLE", timer: 1, kind: "normal", hp: 1, ...over };
}

/** The shipped levels that author a delivery, with their spec. */
const DELIVERY_LEVELS = LEVELS.flatMap((l) => {
  const spec = l.deliveries[0];
  return spec === undefined ? [] : [{ id: l.id, spec }];
});

describe("isDeliveryAssailant — the ONE identity predicate (D2.6 / architect §2.2)", () => {
  it("is true exactly at and above DELIVERY_ASSAULT_ID_BASE", () => {
    expect(isDeliveryAssailant(enemy({ id: DELIVERY_ASSAULT_ID_BASE, slotIndex: 0 }))).toBe(true);
    expect(isDeliveryAssailant(enemy({ id: DELIVERY_ASSAULT_ID_BASE + 1, slotIndex: 0 }))).toBe(
      true,
    );
    expect(isDeliveryAssailant(enemy({ id: DELIVERY_ASSAULT_ID_BASE - 1, slotIndex: 0 }))).toBe(
      false,
    );
    expect(isDeliveryAssailant(enemy({ id: 100, slotIndex: 0 }))).toBe(false);
  });

  // The convention is enforced by tests, not by the type system (architect §2.2,
  // binding condition 2): make the disjointness EXECUTABLE, not a comment.
  it("spawnWave can never mint into the assault range at any reachable wave", () => {
    const facade = facadeAtX(Array.from({ length: 16 }, (_, i) => i * 2 - 15));
    let maxId = 0;
    for (let wave = 1; wave < DELIVERY_ASSAULT_ID_BASE / 100; wave++) {
      for (const e of spawnWave(wave, facade)) {
        maxId = Math.max(maxId, e.id);
        expect(isDeliveryAssailant(e)).toBe(false);
      }
    }
    // …and the bound is arithmetic, not luck: `wave·100 + i` first reaches the
    // range at wave 9000, ~4 orders of magnitude past any playable wave.
    expect(maxId).toBeLessThan(DELIVERY_ASSAULT_ID_BASE);
    expect(spawnWave(DELIVERY_ASSAULT_ID_BASE / 100, facade).some(isDeliveryAssailant)).toBe(true);
  });

  it("no other module compares an id against the base inline", () => {
    const src = resolve(__dirname, "../..");
    const files = [
      "systems/stateMachine.ts",
      "systems/deliverySystem.ts",
      "systems/lootSystem.ts",
      "systems/enemySystem.ts",
    ];
    for (const f of files) {
      const text = readFileSync(resolve(src, f), "utf8");
      expect(text).not.toContain("900000");
      expect(text).not.toContain("DELIVERY_ASSAULT_ID_BASE");
    }
  });
});

describe("reservedAssaultSlots — the level-wide reservation (D2.8)", () => {
  it("reserves nothing when the level authors no delivery (AC13)", () => {
    expect(reservedAssaultSlots(facadeAtX([0, 1, 2]), null)).toEqual([]);
  });

  it("takes the DELIVERY_ASSAILANTS nearest slots, nearest first", () => {
    // stop at x = 0: distances 3, 1, 2, 6 ⇒ slots 1 then 2.
    expect(reservedAssaultSlots(facadeAtX([-3, 1, -2, 6]), SPEC)).toEqual([1, 2]);
  });

  it("breaks an exact tie on the lower slotIndex", () => {
    expect(reservedAssaultSlots(facadeAtX([2, -2, 1, -1]), SPEC)).toEqual([2, 3]);
  });

  it("never reserves a slot beyond ASSAULT_RADIUS (authoring error stays visible)", () => {
    const justOutside = ASSAULT_RADIUS + 0.01;
    expect(reservedAssaultSlots(facadeAtX([1, justOutside, -justOutside]), SPEC)).toEqual([0]);
  });

  // AC7's authored expectation, measured on the REAL runtime facades.
  it.each([
    ["belliard", [23, 42]],
    ["stalingrad", [19, 23]],
    ["vitry", [107, 102]],
    ["niveau-final", [7, 8]],
  ] as const)("reserves the spec's measured slots on %s", (id, expected) => {
    const level = DELIVERY_LEVELS.find((l) => l.id === id);
    expect(level).toBeDefined();
    if (level === undefined) return;
    expect(reservedAssaultSlots(levelFacade(id), level.spec)).toEqual([...expected]);
  });

  // AC12.1 — the authoring guard, asserted here on the reservation itself (the
  // geometric candidate count is pinned in `levels/__tests__`).
  it.each(DELIVERY_LEVELS.map((l) => [l.id, l.spec] as const))(
    "%s can reserve a full assault",
    (id, spec) => {
      expect(reservedAssaultSlots(levelFacade(id), spec)).toHaveLength(DELIVERY_ASSAILANTS);
    },
  );
});

describe("seatAssault — AC7/AC8/AC9 (seating at the IDLE→INCOMING edge)", () => {
  const facade = levelFacade("belliard");
  const reserved = [23, 42];

  it("AC7: seats exactly DELIVERY_ASSAILANTS on the reserved slots, ids from the base", () => {
    const seated = seatAssault(facade, SPEC, undefined, [], null);
    expect(seated).toHaveLength(DELIVERY_ASSAILANTS);
    expect(seated.map((e) => e.id)).toEqual([
      DELIVERY_ASSAULT_ID_BASE,
      DELIVERY_ASSAULT_ID_BASE + 1,
    ]);
    expect(seated.map((e) => e.slotIndex)).toEqual(reserved);
  });

  // K-9: the `VISIBLE` seating is FAIRNESS-load-bearing, not a read preference —
  // the freeze holds the seating state, so a player absent for the whole roll-in
  // finds two EXPOSED, immediately shootable targets, never a frozen duck.
  it("AC7 (K-9): both assailants are seated EXPOSED, with the archetype's full timer", () => {
    const seated = seatAssault(facade, SPEC, undefined, [], null);
    seated.forEach((e, i) => {
      expect(e.state).toBe("VISIBLE");
      expect(e.timer).toBeCloseTo(archetype(e.kind).visibleDuration * (1 + i * 0.3), 10);
      expect(e.hp).toBe(archetype(e.kind).hp);
    });
  });

  it("AC8: never seats on a slot held by a live enemy", () => {
    const seated = seatAssault(facade, SPEC, undefined, [enemy({ id: 1, slotIndex: 23 })], null);
    expect(seated.map((e) => e.slotIndex)).toEqual([42]);
  });

  // Load-bearing, not defensive: EnemySprite resolves its occupant with
  // `enemies.find(e => e.slotIndex === slotIndex)` (first match), so seating
  // behind a corpse renders NOTHING — an invisible source of damage.
  it("AC8: never seats on a slot held by a DEAD enemy either", () => {
    const corpse = enemy({ id: 1, slotIndex: 42, state: "DEAD", hp: 0 });
    const seated = seatAssault(facade, SPEC, undefined, [corpse], null);
    expect(seated.map((e) => e.slotIndex)).toEqual([23]);
  });

  it("AC8: never seats on the live loot crate's slot", () => {
    const seated = seatAssault(facade, SPEC, undefined, [], 23);
    expect(seated.map((e) => e.slotIndex)).toEqual([42]);
  });

  it("AC9: only shooting kinds are seated, from the level's own pool", () => {
    const pool: readonly EnemyKind[] = ["riot", "bonus", "biker", "bonus"];
    for (const e of seatAssault(facade, SPEC, pool, [], null)) {
      expect(archetype(e.kind).shoots).toBe(true);
      expect(pool).toContain(e.kind);
    }
  });

  it("AC9: a pool with no shooter at all still seats a shooter", () => {
    for (const e of seatAssault(facade, SPEC, ["bonus"], [], null)) {
      expect(archetype(e.kind).shoots).toBe(true);
    }
  });

  it("AC9: deterministic — two identical runs give identical kinds, slots and ids", () => {
    const pool: readonly EnemyKind[] = ["normal", "riot", "biker"];
    expect(seatAssault(facade, SPEC, pool, [], null)).toEqual(
      seatAssault(facade, SPEC, pool, [], null),
    );
  });

  it("seats nothing when the level authors no delivery (AC13)", () => {
    expect(seatAssault(facade, null, undefined, [], null)).toEqual([]);
  });
});

describe("countAliveAssailants — D1 amended: ALIVE, never `targetable` (AC5/AC6)", () => {
  it.each(ALL_STATES)("AC5: an assailant in %s counts iff it is not DEAD", (state) => {
    const assailant = enemy({ id: DELIVERY_ASSAULT_ID_BASE, slotIndex: 23, state });
    const expected = state === "DEAD" ? 0 : 1;
    expect(countAliveAssailants([assailant])).toBe(expected);
    // …and that is what the gauge is charged, at the tuned rate.
    expect(DAMAGE_PER_ASSAILANT_PER_SECOND * countAliveAssailants([assailant])).toBe(expected * 9);
  });

  it.each(ALL_STATES)("AC6: a wave enemy in %s next to the van counts for nothing", (state) => {
    const waveCop = enemy({ id: 401, slotIndex: 23, state });
    expect(countAliveAssailants([waveCop])).toBe(0);
  });

  it("counts the whole live assault", () => {
    const seated = seatAssault(levelFacade("belliard"), SPEC, undefined, [], null);
    expect(countAliveAssailants(seated)).toBe(DELIVERY_ASSAILANTS);
    expect(countAliveAssailants([])).toBe(0);
  });

  // AC2(b): the count is a pure function of the enemy array — asserted by
  // SIGNATURE, not by comparing two runs.
  it("AC2(b): takes no camera argument, and the module reads no camera term", () => {
    expect(countAliveAssailants).toHaveLength(1);
    expect(reservedAssaultSlots).toHaveLength(2);
    const text = readFileSync(resolve(__dirname, "../deliveryAssault.ts"), "utf8");
    for (const term of ["isOnScreen", "cameraOffset", "viewport", "viewW", "viewH"]) {
      expect(text).not.toContain(term);
    }
  });
});

describe("AC15 — the assault widens no contract and keeps `src/game` pure", () => {
  it("a seated assailant is an ORDINARY `Enemy`: the same six fields, no marker", () => {
    // The identity is the id RANGE (D2.6): `Enemy` is the game→render contract read
    // by `EnemySprite`, and an assailant renders exactly like any window cop, so a
    // field here would be a fact the renderer must ignore — and a fact a renderer
    // can see is a fact a renderer eventually reads.
    const seated = seatAssault(levelFacade("belliard"), SPEC, undefined, [], null);
    const waveCop = spawnWave(1, levelFacade("belliard"))[0];
    expect(waveCop).toBeDefined();
    for (const e of seated) {
      expect(Object.keys(e).sort()).toEqual(["hp", "id", "kind", "slotIndex", "state", "timer"]);
      expect(Object.keys(e).sort()).toEqual(Object.keys(waveCop ?? {}).sort());
    }
  });

  it("no field is added to `DeliverySpec` or `LevelConfig`", () => {
    for (const { spec } of DELIVERY_LEVELS) {
      expect(Object.keys(spec).sort()).toEqual([
        "bonus",
        "entrySide",
        "integrity",
        "stopPosition",
        "triggerAtElapsedSeconds",
        "vehicleType",
        "windowSeconds",
      ]);
    }
    // The reservation is pure geometry: nothing authored names a slot.
    const text = readFileSync(resolve(__dirname, "../../levels/levels.ts"), "utf8");
    expect(text).not.toContain("assault");
  });

  it("imports nothing but `@game` (no React, no Three — the boundary law)", () => {
    const text = readFileSync(resolve(__dirname, "../deliveryAssault.ts"), "utf8");
    const imports = [...text.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const path of imports) expect(path?.startsWith("@game/")).toBe(true);
  });
});

describe("retireAssault — the escort leaves with the van (D3 / AC11)", () => {
  it("kills every surviving assailant and leaves wave enemies untouched", () => {
    const waveCop = enemy({ id: 401, slotIndex: 1, state: "SHOOTING" });
    const assailant = enemy({ id: DELIVERY_ASSAULT_ID_BASE, slotIndex: 23 });
    const dead = enemy({ id: DELIVERY_ASSAULT_ID_BASE + 1, slotIndex: 42, state: "DEAD", hp: 0 });
    const retired = retireAssault([waveCop, assailant, dead]);
    expect(retired[0]).toBe(waveCop);
    expect(retired[1]?.state).toBe("DEAD");
    expect(retired[2]).toBe(dead);
    expect(countAliveAssailants(retired)).toBe(0);
  });
});
