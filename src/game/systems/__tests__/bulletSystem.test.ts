import { describe, it, expect } from "vitest";
import { resolvePlayerShot, tickBullets, BULLET_SPEED } from "@game/systems/bulletSystem";
import { crosshairToWorld } from "@game/systems/crosshairSystem";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy, EnemyKind, EnemyState } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { Vec2 } from "@game/types/vector";
import { ARCHETYPES } from "@game/types/enemyTypes";

describe("crosshairToWorld (single source of truth — ADR-0002)", () => {
  it("adds cameraOffsetY on the Y axis exactly like cameraOffsetX on the X axis", () => {
    // Centre aim → local (0,0); each camera offset shifts its own world axis.
    const centre = { position: { x: 0.5, y: 0.5 } };
    const w = crosshairToWorld(centre, 4, 3);
    expect(w).toEqual({ x: 4, y: 3 });
  });

  it("keeps the two offsets independent (X offset never leaks into Y)", () => {
    const centre = { position: { x: 0.5, y: 0.5 } };
    expect(crosshairToWorld(centre, 5, 0)).toEqual({ x: 5, y: 0 });
    expect(crosshairToWorld(centre, 0, 5)).toEqual({ x: 0, y: 5 });
  });
});

describe("tickBullets", () => {
  it("moves bullets by velocity * delta", () => {
    const b = {
      id: 1,
      position: { x: 0, y: 0 },
      velocity: { x: 2, y: -BULLET_SPEED },
      fromPlayer: false,
    };
    const [moved] = tickBullets([b], 0.1);
    if (moved === undefined) throw new Error("expected bullet");
    expect(moved.position.x).toBeCloseTo(b.position.x + b.velocity.x * 0.1);
    expect(moved.position.y).toBeCloseTo(b.position.y + b.velocity.y * 0.1);
  });

  it("removes bullets out of bounds (|x| > 60)", () => {
    const b = { id: 1, position: { x: 61, y: 0 }, velocity: { x: 1, y: 0 }, fromPlayer: true };
    const result = tickBullets([b], 0.016);
    expect(result.length).toBe(0);
  });

  it("removes bullets out of bounds (|y| > 15)", () => {
    const b = { id: 1, position: { x: 0, y: 16 }, velocity: { x: 0, y: 1 }, fromPlayer: true };
    const result = tickBullets([b], 0.016);
    expect(result.length).toBe(0);
  });
});

// --- resolvePlayerShot (hitscan at fire time — ADR-0020, spec §1) --------------
//
// Crosshair centre (0.5,0.5) with the default offsets maps to world (0,0), so a
// slot placed at a given screenPosition is exactly `distance(0, slotPos)` from the
// impact point. Tests build small custom facades to control that distance.

const centre: Crosshair = { position: { x: 0.5, y: 0.5 } };

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
    state: "VISIBLE" as EnemyState,
    timer: 1,
    kind: "normal" as EnemyKind,
    hp: 1,
    ...overrides,
  };
}

describe("resolvePlayerShot — aim on target", () => {
  it("aim on a live slot within HIT_RADIUS ⇒ hit; enemy → HIT; classification hit", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const enemy = enemyAt(0, { id: 7 });
    const result = resolvePlayerShot(centre, [enemy], facade);

    expect(result.impact.classification).toBe("hit");
    expect(result.impact.impactPoint).toEqual({ x: 0, y: 0 });
    expect(result.impact.hit).toEqual({
      enemyId: 7,
      slotIndex: 0,
      slotPosition: { x: 0, y: 0 },
    });
    const hit = result.enemies[0];
    if (hit === undefined) throw new Error("expected enemy");
    expect(hit.state).toBe("HIT");
    expect(result.targetsDown).toBe(1);
    expect(result.scoreDelta).toBe(1);
  });
});

describe("resolvePlayerShot — aim off target (AC2)", () => {
  it("a live enemy directly ABOVE the aim point beyond HIT_RADIUS ⇒ miss, enemies unchanged", () => {
    // Slot 1.0 world-units straight up from the impact point → outside the 0.8 disc.
    const facade = facadeWithSlots([{ x: 0, y: 1.0 }]);
    const enemy = enemyAt(0);
    const result = resolvePlayerShot(centre, [enemy], facade);

    expect(result.impact.classification).toBe("miss");
    expect(result.impact.hit).toBeUndefined();
    expect(result.impact.impactPoint).toEqual({ x: 0, y: 0 });
    expect(result.enemies).toEqual([enemy]);
    expect(result.enemies[0]?.state).toBe("VISIBLE");
    expect(result.scoreDelta).toBe(0);
    expect(result.targetsDown).toBe(0);
    expect(result.events).toEqual([]);
  });

  it("no enemy anywhere near ⇒ miss with the impact point at the aimed world point", () => {
    const facade = facadeWithSlots([{ x: 10, y: 10 }]);
    const result = resolvePlayerShot(centre, [enemyAt(0)], facade);
    expect(result.impact.classification).toBe("miss");
  });
});

describe("resolvePlayerShot — overlap rule (D1.5): nearest wins, one target per shot", () => {
  it("two live enemies within HIT_RADIUS ⇒ only the NEAREST is hit", () => {
    const facade = facadeWithSlots([
      { x: 0.5, y: 0 }, // slot 0, distance 0.5
      { x: 0.3, y: 0 }, // slot 1, distance 0.3 — nearer
    ]);
    const near = enemyAt(1, { id: 20 });
    const far = enemyAt(0, { id: 10 });
    const result = resolvePlayerShot(centre, [far, near], facade);

    expect(result.impact.hit?.enemyId).toBe(20);
    expect(result.impact.hit?.slotIndex).toBe(1);
    // Exactly one enemy transitions to HIT (the one-shot-one-enemy delta).
    const hitCount = result.enemies.filter((e) => e.state === "HIT").length;
    expect(hitCount).toBe(1);
    expect(result.enemies.find((e) => e.id === 10)?.state).toBe("VISIBLE");
  });

  it("exact-distance tie ⇒ lowest slotIndex wins", () => {
    const facade = facadeWithSlots([
      { x: 0.4, y: 0 }, // slot 0, distance 0.4
      { x: -0.4, y: 0 }, // slot 1, distance 0.4 — equal
    ]);
    const a = enemyAt(0, { id: 100 });
    const b = enemyAt(1, { id: 200 });
    // Feed higher slotIndex first so a naive "first found" would pick slot 1.
    const result = resolvePlayerShot(centre, [b, a], facade);

    expect(result.impact.hit?.slotIndex).toBe(0);
    expect(result.impact.hit?.enemyId).toBe(100);
  });
});

describe("resolvePlayerShot — hittable states (D1.4)", () => {
  it.each<EnemyState>(["DEAD", "HIT", "HIDDEN"])("does not hit a %s enemy", (state) => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const enemy = enemyAt(0, { state });
    const result = resolvePlayerShot(centre, [enemy], facade);
    expect(result.impact.classification).toBe("miss");
    expect(result.enemies).toEqual([enemy]);
  });
});

describe("resolvePlayerShot — reward parity with checkBulletHits (AC5)", () => {
  it.each<EnemyKind>(["normal", "riot", "biker", "bonus", "civilian"])(
    "a lethal hit on %s yields the ARCHETYPES deltas and the same HitEvent",
    (kind) => {
      const a = ARCHETYPES[kind];
      const facade = facadeWithSlots([{ x: 0, y: 0 }]);
      // hp 1 so this single hit is lethal for every kind (isolates reward parity).
      const enemy = enemyAt(0, { id: 42, kind, hp: 1 });
      const result = resolvePlayerShot(centre, [enemy], facade);

      expect(result.scoreDelta).toBe(a.scoreDelta);
      expect(result.livesDelta).toBe(a.livesDelta);
      expect(result.timeDelta).toBe(a.timeDelta);
      expect(result.targetsDown).toBe(a.countsAsTarget ? 1 : 0);
      expect(result.events).toEqual([
        {
          slotIndex: 0,
          scoreDelta: a.scoreDelta,
          livesDelta: a.livesDelta,
          timeDelta: a.timeDelta,
        },
      ]);
    },
  );
});

describe("resolvePlayerShot — multi-hp riot, non-lethal hit (D1.6 / D3.1)", () => {
  it("decrements hp and emits an impact but NO reward and NO HitEvent", () => {
    const facade = facadeWithSlots([{ x: 0, y: 0 }]);
    const riot = enemyAt(0, { id: 5, kind: "riot", hp: 2 });
    const result = resolvePlayerShot(centre, [riot], facade);

    // Impact still fires on the landing shot (explosion is shot-gated, not kill-gated).
    expect(result.impact.classification).toBe("hit");
    expect(result.impact.hit?.enemyId).toBe(5);
    const hit = result.enemies[0];
    if (hit === undefined) throw new Error("expected enemy");
    expect(hit.hp).toBe(1);
    expect(hit.state).toBe("HIT");
    // No reward until hp reaches 0.
    expect(result.scoreDelta).toBe(0);
    expect(result.livesDelta).toBe(0);
    expect(result.timeDelta).toBe(0);
    expect(result.targetsDown).toBe(0);
    expect(result.events).toEqual([]);
  });
});
