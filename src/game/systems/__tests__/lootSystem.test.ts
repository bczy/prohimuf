import { describe, it, expect } from "vitest";
import {
  canSpawnLootAt,
  activeEnemyCols,
  tickLoot,
  LOOT_SPAWN_MIN_COL_GAP,
  LOOT_HIDDEN_DURATION,
  LOOT_APPEARING_DURATION,
  LOOT_VISIBLE_DURATION,
} from "@game/systems/lootSystem";
import type { Enemy, EnemyState } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { LootCrate, LootSpec } from "@game/types/loot";

// A facade whose slot `i` sits at column `i` (row 0). Column IS the index here,
// so the spawn-exclusion maths is easy to read.
function facadeCols(cols: number): FacadeMap {
  return {
    width: cols,
    height: 1,
    slots: Array.from({ length: cols }, (_, col) => ({
      col,
      row: 0,
      screenPosition: { x: col * 2 - (cols - 1), y: 0 },
    })),
  };
}

function enemyAt(slotIndex: number, state: EnemyState): Enemy {
  return { id: slotIndex + 1, slotIndex, state, timer: 1, kind: "normal", hp: 1 };
}

const SPEC: LootSpec = { spawnIntervalSeconds: 5, weapons: ["auto", "spread"] };

describe("canSpawnLootAt — §5.4 spawn-exclusion predicate (AC9)", () => {
  it("no active columns ⇒ any column is eligible (vacuous truth)", () => {
    expect(canSpawnLootAt(0, [])).toBe(true);
    expect(canSpawnLootAt(19, [])).toBe(true);
  });

  it("a column must be ≥ LOOT_SPAWN_MIN_COL_GAP from EVERY active column", () => {
    expect(LOOT_SPAWN_MIN_COL_GAP).toBe(2);
    const active = [5];
    // Within the gap on either side ⇒ blocked.
    expect(canSpawnLootAt(4, active)).toBe(false); // |4-5| = 1
    expect(canSpawnLootAt(5, active)).toBe(false); // |5-5| = 0
    expect(canSpawnLootAt(6, active)).toBe(false); // |6-5| = 1
    // Exactly the gap ⇒ eligible.
    expect(canSpawnLootAt(3, active)).toBe(true); // |3-5| = 2
    expect(canSpawnLootAt(7, active)).toBe(true); // |7-5| = 2
  });

  it("must clear ALL active columns, not just one", () => {
    // Eligible for col 3 relative to 5, but blocked by 2.
    expect(canSpawnLootAt(3, [5, 2])).toBe(false); // |3-2| = 1
    expect(canSpawnLootAt(8, [5, 2])).toBe(true); // ≥2 from both
  });
});

describe("activeEnemyCols — only APPEARING/VISIBLE/SHOOTING count", () => {
  it("returns the columns of enemies engaged in the reticle path only", () => {
    const facade = facadeCols(6);
    const enemies: Enemy[] = [
      enemyAt(0, "APPEARING"),
      enemyAt(1, "VISIBLE"),
      enemyAt(2, "SHOOTING"),
      enemyAt(3, "HIDDEN"),
      enemyAt(4, "HIT"),
      enemyAt(5, "DEAD"),
    ];
    expect(activeEnemyCols(enemies, facade).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });
});

describe("tickLoot — no spec ⇒ never spawns (byte-identical levels, D8)", () => {
  it("keeps loot null and does not spawn when spec is null", () => {
    const facade = facadeCols(4);
    const r = tickLoot(null, null, 0, 1, [], facade, 1);
    expect(r.loot).toBeNull();
    expect(r.spawned).toBe(false);
  });
});

describe("tickLoot — spawn cadence + exclusion (AC9)", () => {
  it("spawns a HIDDEN crate on an eligible column once the timer elapses", () => {
    const facade = facadeCols(4);
    // One VISIBLE enemy at col 0 blocks cols 0 and 1; cols 2,3 are eligible.
    const enemies = [enemyAt(0, "VISIBLE")];
    // lootTimer 0.5, delta 1 ⇒ timer crosses 0 this tick.
    const r = tickLoot(null, SPEC, 0.5, 1, enemies, facade, 7);
    expect(r.spawned).toBe(true);
    if (r.loot === null) throw new Error("expected a spawned crate");
    const crate = r.loot;
    expect(crate.state).toBe("HIDDEN");
    expect(crate.id).toBe(7);
    expect(crate.timer).toBe(LOOT_HIDDEN_DURATION);
    // The chosen column clears every active column by ≥2.
    const col = facade.slots[crate.slotIndex]?.col ?? -1;
    expect(canSpawnLootAt(col, activeEnemyCols(enemies, facade))).toBe(true);
    // Weapon comes from the configured pool.
    expect(SPEC.weapons).toContain(crate.weapon);
    // Spawn timer re-armed to the interval.
    expect(r.lootTimer).toBe(SPEC.spawnIntervalSeconds);
  });

  it("defers (no spawn) when no column satisfies the exclusion this tick", () => {
    const facade = facadeCols(3);
    // A VISIBLE enemy at the centre col 1 blocks cols 0,1,2 (all within gap 2).
    const enemies = [enemyAt(1, "VISIBLE")];
    const r = tickLoot(null, SPEC, 0, 1, enemies, facade, 1);
    expect(r.spawned).toBe(false);
    expect(r.loot).toBeNull();
  });

  it("counts the spawn timer down while no crate is present", () => {
    const facade = facadeCols(4);
    const r = tickLoot(null, SPEC, 5, 1, [], facade, 1);
    expect(r.spawned).toBe(false);
    expect(r.loot).toBeNull();
    expect(r.lootTimer).toBeCloseTo(4);
  });
});

describe("tickLoot — crate state machine HIDDEN→APPEARING→VISIBLE→expire (AC7-loot)", () => {
  const facade = facadeCols(4);
  const crate = (state: LootCrate["state"], timer: number): LootCrate => ({
    id: 1,
    slotIndex: 3,
    state,
    timer,
    weapon: "auto",
  });

  it("HIDDEN → APPEARING when the hidden timer elapses", () => {
    const r = tickLoot(crate("HIDDEN", 0.05), SPEC, 99, 0.1, [], facade, 2);
    expect(r.loot?.state).toBe("APPEARING");
    expect(r.loot?.timer).toBe(LOOT_APPEARING_DURATION);
    expect(r.spawned).toBe(false);
  });

  it("APPEARING → VISIBLE when the appearing timer elapses", () => {
    const r = tickLoot(crate("APPEARING", 0.05), SPEC, 99, 0.1, [], facade, 2);
    expect(r.loot?.state).toBe("VISIBLE");
    expect(r.loot?.timer).toBe(LOOT_VISIBLE_DURATION);
  });

  it("VISIBLE crate expires (loot → null) and re-arms the spawn timer", () => {
    const r = tickLoot(crate("VISIBLE", 0.05), SPEC, 99, 0.1, [], facade, 2);
    expect(r.loot).toBeNull();
    expect(r.lootTimer).toBe(SPEC.spawnIntervalSeconds);
  });

  it("does not spawn a second crate while one already exists", () => {
    // A VISIBLE crate with plenty of timer left: the spawn timer must NOT count down.
    const r = tickLoot(crate("VISIBLE", 3), SPEC, 0.01, 0.1, [], facade, 2);
    expect(r.loot?.state).toBe("VISIBLE");
    expect(r.spawned).toBe(false);
    expect(r.lootTimer).toBe(0.01); // untouched while a crate is live
  });
});
