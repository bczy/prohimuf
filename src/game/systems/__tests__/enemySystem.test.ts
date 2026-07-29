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

  // ADR-0055 D5 co-location guard (b): a wave rollover must never seat an enemy on
  // the live crate's slot.
  it("never seats an enemy on an excluded slot (co-location guard, ADR-0055 D5)", () => {
    // A slot the un-excluded wave WOULD use, so the exclusion is actually exercised.
    const taken = spawnWave(2, FACADE_01)[0]?.slotIndex;
    if (taken === undefined) throw new Error("expected a seated enemy");
    const excluded = spawnWave(2, FACADE_01, undefined, [taken]);
    expect(excluded.every((e) => e.slotIndex !== taken)).toBe(true);
  });

  it("without excludeSlots is byte-identical to the un-excluded spawn (default path)", () => {
    expect(spawnWave(3, FACADE_01, undefined, [])).toEqual(spawnWave(3, FACADE_01));
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

  // Off-screen freeze: an enemy the camera cannot see does not advance at all —
  // state held, countdown paused. This is what makes "an off-screen enemy cannot
  // shoot" true by construction: VISIBLE → SHOOTING is the only way into a shot.
  describe("off-screen freeze", () => {
    it("holds the state and pauses the countdown", () => {
      const e = mk("VISIBLE", 0.05);
      expect(tickEnemy(e, 0.1, false)).toBe(e); // same reference: nothing moved
    });

    it("never enters SHOOTING while off screen, however long it is ticked", () => {
      let e = mk("VISIBLE", 0.05);
      for (let i = 0; i < 100; i++) e = tickEnemy(e, 0.1, false);
      expect(e.state).toBe("VISIBLE");
    });

    it("does not pop up either (HIDDEN stays HIDDEN)", () => {
      expect(tickEnemy(mk("HIDDEN", 0.05), 0.1, false).state).toBe("HIDDEN");
    });

    it("resumes exactly where it was frozen once back on screen", () => {
      const frozen = tickEnemy(mk("VISIBLE", 0.05), 0.1, false);
      expect(tickEnemy(frozen, 0.1, true).state).toBe("SHOOTING");
    });

    it("stays frozen mid-SHOOTING when the camera pans away", () => {
      expect(tickEnemy(mk("SHOOTING", 0.05), 0.1, false).state).toBe("SHOOTING");
    });

    it("omitting the flag keeps the legacy on-screen behaviour", () => {
      expect(tickEnemy(mk("VISIBLE", 0.05), 0.1)).toEqual(
        tickEnemy(mk("VISIBLE", 0.05), 0.1, true),
      );
    });

    // HIT is exempt: the player already banked the kill and a HIT enemy is not
    // re-targetable, so freezing it would strand an hp-0 corpse short of DEAD and
    // stall wave rollover for the rest of the level.
    describe("HIT is exempt from the freeze", () => {
      it("a killed enemy still reaches DEAD off screen", () => {
        const hit = hitEnemy(mk("VISIBLE", 1)); // hp 1 -> 0
        expect(tickEnemy(hit, 0.3, false).state).toBe("DEAD");
      });

      it("a riot cop that survives still pops back to VISIBLE off screen", () => {
        const hit = hitEnemy(mk("VISIBLE", 1, { kind: "riot", hp: 2 })); // hp 2 -> 1
        expect(tickEnemy(hit, 0.3, false).state).toBe("VISIBLE");
      });

      it("and then freezes in VISIBLE — the exemption does not leak into a shot", () => {
        const hit = hitEnemy(mk("VISIBLE", 1, { kind: "riot", hp: 2 }));
        let e = tickEnemy(hit, 0.3, false); // HIT -> VISIBLE, still off screen
        for (let i = 0; i < 100; i++) e = tickEnemy(e, 0.1, false);
        expect(e.state).toBe("VISIBLE"); // never SHOOTING
      });
    });
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
