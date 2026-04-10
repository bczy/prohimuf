import { describe, it, expect } from "vitest";
import { spawnWave, tickEnemy, hitEnemy } from "@game/systems/enemySystem";
import { FACADE_01 } from "@game/maps/facade01";

describe("spawnWave", () => {
  it("wave 1 spawns 3 enemies", () => {
    const enemies = spawnWave(1, FACADE_01);
    expect(enemies.length).toBe(3);
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
});

describe("tickEnemy", () => {
  it("decrements timer", () => {
    const e = spawnWave(1, FACADE_01)[0];
    if (e === undefined) throw new Error("expected enemy");
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.timer).toBeCloseTo(e.timer - 0.1);
  });

  it("transitions HIDDEN → APPEARING when timer reaches 0", () => {
    const e = { id: 1, slotIndex: 0, state: "HIDDEN" as const, timer: 0.05 };
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.state).toBe("APPEARING");
  });

  it("transitions APPEARING → VISIBLE when timer reaches 0", () => {
    const e = { id: 1, slotIndex: 0, state: "APPEARING" as const, timer: 0.05 };
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.state).toBe("VISIBLE");
  });

  it("transitions VISIBLE → SHOOTING when timer reaches 0", () => {
    const e = { id: 1, slotIndex: 0, state: "VISIBLE" as const, timer: 0.05 };
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.state).toBe("SHOOTING");
  });

  it("DEAD state does not change", () => {
    const e = { id: 1, slotIndex: 0, state: "DEAD" as const, timer: 0 };
    const ticked = tickEnemy(e, 0.5);
    expect(ticked.state).toBe("DEAD");
  });
});

describe("hitEnemy", () => {
  it("transitions VISIBLE enemy to HIT", () => {
    const e = { id: 1, slotIndex: 0, state: "VISIBLE" as const, timer: 1 };
    expect(hitEnemy(e).state).toBe("HIT");
  });

  it("HIT enemy transitions to DEAD on next tick", () => {
    const e = { id: 1, slotIndex: 0, state: "HIT" as const, timer: 0.05 };
    const ticked = tickEnemy(e, 0.1);
    expect(ticked.state).toBe("DEAD");
  });
});
