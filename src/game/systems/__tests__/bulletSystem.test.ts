import { describe, it, expect } from "vitest";
import { fireBullet, tickBullets, checkBulletHits, BULLET_SPEED } from "@game/systems/bulletSystem";
import { crosshairToWorld } from "@game/systems/crosshairSystem";
import { FACADE_01 } from "@game/maps/facade01";

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

describe("fireBullet", () => {
  it("creates a bullet at crosshair position in world", () => {
    const crosshair = { position: { x: 0.5, y: 0.5 } };
    const b = fireBullet(crosshair, true, 1);
    expect(b.id).toBe(1);
    expect(b.fromPlayer).toBe(true);
  });

  it("enemy bullet is not fromPlayer", () => {
    const crosshair = { position: { x: 0.5, y: 0.5 } };
    const b = fireBullet(crosshair, false, 2);
    expect(b.fromPlayer).toBe(false);
  });

  it("shifts the shot's world-Y by cameraOffsetY after a vertical pan", () => {
    // A two-finger tap at screen centre after panning the camera up by 3 must
    // land at world-Y 3 — matching where the HUD arrows point (they add camera.y).
    const centre = { position: { x: 0.5, y: 0.5 } };
    const b = fireBullet(centre, true, 3, 0, 3);
    expect(b.position).toEqual({ x: 0, y: 3 });
  });
});

describe("tickBullets", () => {
  it("moves bullets by velocity * delta", () => {
    const b = fireBullet({ position: { x: 0.5, y: 0.5 } }, true, 1);
    const [moved] = tickBullets([b], 0.1);
    if (moved === undefined) throw new Error("expected bullet");
    expect(moved.position.x).toBeCloseTo(b.position.x + b.velocity.x * 0.1);
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

describe("checkBulletHits", () => {
  it("player bullet hits VISIBLE enemy in same slot position → removes bullet, marks enemy HIT", () => {
    const slot = FACADE_01.slots[0];
    if (slot === undefined) throw new Error("expected slot");
    const enemy = {
      id: 1,
      slotIndex: 0,
      state: "VISIBLE" as const,
      timer: 1,
      kind: "normal" as const,
      hp: 1,
    };
    const bullet = {
      id: 10,
      position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.targetsDown).toBe(1);
    expect(result.scoreDelta).toBe(1);
    expect(result.bullets.length).toBe(0);
    const hitEnemy = result.enemies[0];
    if (hitEnemy === undefined) throw new Error("expected enemy");
    expect(hitEnemy.state).toBe("HIT");
  });

  it("bullet misses enemy far away", () => {
    const enemy = {
      id: 1,
      slotIndex: 0,
      state: "VISIBLE" as const,
      timer: 1,
      kind: "normal" as const,
      hp: 1,
    };
    const bullet = {
      id: 10,
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.targetsDown).toBe(0);
    expect(result.bullets.length).toBe(1);
  });

  it("player bullet does not hit DEAD enemy", () => {
    const slot = FACADE_01.slots[0];
    if (slot === undefined) throw new Error("expected slot");
    const enemy = {
      id: 1,
      slotIndex: 0,
      state: "DEAD" as const,
      timer: 0,
      kind: "normal" as const,
      hp: 1,
    };
    const bullet = {
      id: 10,
      position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.targetsDown).toBe(0);
  });
});
