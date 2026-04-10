import { describe, it, expect } from "vitest";
import { fireBullet, tickBullets, checkBulletHits, BULLET_SPEED } from "@game/systems/bulletSystem";
import { FACADE_01 } from "@game/maps/facade01";

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
});

describe("tickBullets", () => {
  it("moves bullets by velocity * delta", () => {
    const b = fireBullet({ position: { x: 0.5, y: 0.5 } }, true, 1);
    const [moved] = tickBullets([b], 0.1);
    if (moved === undefined) throw new Error("expected bullet");
    expect(moved.position.x).toBeCloseTo(b.position.x + b.velocity.x * 0.1);
  });

  it("removes bullets out of bounds (|x| > 20)", () => {
    const b = { id: 1, position: { x: 21, y: 0 }, velocity: { x: 1, y: 0 }, fromPlayer: true };
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
    const enemy = { id: 1, slotIndex: 0, state: "VISIBLE" as const, timer: 1 };
    const bullet = {
      id: 10,
      position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.hits).toBe(1);
    expect(result.bullets.length).toBe(0);
    const hitEnemy = result.enemies[0];
    if (hitEnemy === undefined) throw new Error("expected enemy");
    expect(hitEnemy.state).toBe("HIT");
  });

  it("bullet misses enemy far away", () => {
    const enemy = { id: 1, slotIndex: 0, state: "VISIBLE" as const, timer: 1 };
    const bullet = {
      id: 10,
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.hits).toBe(0);
    expect(result.bullets.length).toBe(1);
  });

  it("player bullet does not hit DEAD enemy", () => {
    const slot = FACADE_01.slots[0];
    if (slot === undefined) throw new Error("expected slot");
    const enemy = { id: 1, slotIndex: 0, state: "DEAD" as const, timer: 0 };
    const bullet = {
      id: 10,
      position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
      velocity: { x: 0, y: -BULLET_SPEED },
      fromPlayer: true,
    };
    const result = checkBulletHits([bullet], [enemy], FACADE_01);
    expect(result.hits).toBe(0);
  });
});
