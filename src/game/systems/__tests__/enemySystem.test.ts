import { describe, it, expect } from "vitest";
import { spawnWave, tickEnemy, hitEnemy } from "@game/systems/enemySystem";
import type { Enemy, EnemyState } from "@game/types/enemy";
import { FACADE_01 } from "@game/maps/facade01";

// Build a normal (shooting, 1 hp) enemy in the given state for deterministic
// state-machine tests.
function mk(state: EnemyState, timer: number, over: Partial<Enemy> = {}): Enemy {
  return { id: 1, slotIndex: 0, state, timer, kind: "normal", hp: 1, ...over };
}

describe("spawnWave", () => {
  it("wave 1 spawns 2 enemies", () => {
    const enemies = spawnWave(1, FACADE_01);
    expect(enemies.length).toBe(2);
  });

  it("all enemies start as HIDDEN", () => {
    const enemies = spawnWave(1, FACADE_01);
    enemies.forEach((e) => {
      expect(e.state).toBe("HIDDEN");
    });
  });

  it("enemy ids are unique", () => {
    const enemies = spawnWave(1, FACADE_01);
    const ids = enemies.map((e) => e.id);
    expect(new Set(ids).size).toBe(enemies.length);
  });

  it("wave 2 spawns more enemies than wave 1", () => {
    const w1 = spawnWave(1, FACADE_01);
    const w2 = spawnWave(2, FACADE_01);
    expect(w2.length).toBeGreaterThan(w1.length);
  });

  it("assigns a kind and matching hp to every enemy", () => {
    const enemies = spawnWave(3, FACADE_01);
    enemies.forEach((e) => {
      expect(e.kind).toBeDefined();
      expect(e.hp).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("tickEnemy", () => {
  it("decrements timer", () => {
    const e = spawnWave(1, FACADE_01)[0];
    if (e === undefined) throw new Error("expected enemy");
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.timer).toBeCloseTo(e.timer - 0.1);
  });

  it("transitions HIDDEN → APPEARING when timer reaches 0", () => {
    expect(tickEnemy(mk("HIDDEN", 0.05), 0.1).state).toBe("APPEARING");
  });

  it("transitions APPEARING → VISIBLE when timer reaches 0", () => {
    expect(tickEnemy(mk("APPEARING", 0.05), 0.1).state).toBe("VISIBLE");
  });

  it("transitions VISIBLE → SHOOTING for a shooting enemy", () => {
    expect(tickEnemy(mk("VISIBLE", 0.05), 0.1).state).toBe("SHOOTING");
  });

  it("transitions VISIBLE → HIDDEN for a non-shooting enemy (civilian)", () => {
    expect(tickEnemy(mk("VISIBLE", 0.05, { kind: "civilian" }), 0.1).state).toBe("HIDDEN");
  });

  it("DEAD state does not change", () => {
    expect(tickEnemy(mk("DEAD", 0), 0.5).state).toBe("DEAD");
  });
});

describe("hitEnemy", () => {
  it("transitions VISIBLE enemy to HIT and decrements hp", () => {
    const hit = hitEnemy(mk("VISIBLE", 1));
    expect(hit.state).toBe("HIT");
    expect(hit.hp).toBe(0);
  });

  it("a 1-hp enemy goes DEAD after the HIT flash", () => {
    const hit = hitEnemy(mk("VISIBLE", 1)); // hp 1 -> 0
    expect(tickEnemy(hit, 0.3).state).toBe("DEAD");
  });

  it("a riot enemy (2 hp) survives the first hit and pops back up", () => {
    const hit = hitEnemy(mk("VISIBLE", 1, { kind: "riot", hp: 2 })); // hp 2 -> 1
    expect(hit.hp).toBe(1);
    expect(tickEnemy(hit, 0.3).state).toBe("VISIBLE");
  });
});
