import { describe, it, expect } from "vitest";
import {
  checkCourierHits,
  courierSpawnInterval,
  spawnCourier,
  tickCouriers,
  COURIER_SPEED,
} from "@game/systems/courierSystem";
import type { CourierField } from "@game/systems/courierSystem";
import type { Bullet } from "@game/types/bullet";

const FIELD: CourierField = { halfWidth: 40, streetY: -5 };

describe("spawnCourier", () => {
  it("rightward courier enters from the left edge at street level", () => {
    const c = spawnCourier(1, 1, FIELD);
    expect(c.dir).toBe(1);
    expect(c.x).toBeLessThan(-FIELD.halfWidth);
    expect(c.y).toBe(FIELD.streetY);
    expect(c.speed).toBe(COURIER_SPEED);
  });

  it("leftward courier enters from the right edge", () => {
    const c = spawnCourier(2, -1, FIELD);
    expect(c.dir).toBe(-1);
    expect(c.x).toBeGreaterThan(FIELD.halfWidth);
  });
});

describe("tickCouriers", () => {
  it("advances a courier in its travel direction", () => {
    const c = spawnCourier(1, 1, FIELD);
    const [moved] = tickCouriers([c], 1, FIELD);
    expect(moved?.x).toBeCloseTo(c.x + COURIER_SPEED);
  });

  it("drops a courier once it has ridden off the far edge", () => {
    const c = {
      id: 1,
      x: FIELD.halfWidth + 3,
      y: FIELD.streetY,
      dir: 1 as const,
      speed: COURIER_SPEED,
    };
    expect(tickCouriers([c], 1, FIELD)).toHaveLength(0);
  });

  it("keeps a courier that is still on the street", () => {
    const c = spawnCourier(1, 1, FIELD);
    expect(tickCouriers([c], 0.1, FIELD)).toHaveLength(1);
  });
});

describe("checkCourierHits", () => {
  const courier = { id: 7, x: 0, y: -5, dir: 1 as const, speed: COURIER_SPEED };
  const playerBulletAt = (x: number, y: number): Bullet => ({
    id: 1,
    position: { x, y },
    velocity: { x: 0, y: 1 },
    fromPlayer: true,
  });

  it("a player bullet on the courier removes it and applies the civilian penalty", () => {
    const res = checkCourierHits([playerBulletAt(0, -5)], [courier]);
    expect(res.couriers).toHaveLength(0);
    expect(res.bullets).toHaveLength(0);
    expect(res.scoreDelta).toBe(-1);
    expect(res.livesDelta).toBe(-1);
    expect(res.events).toHaveLength(1);
    expect(res.events[0]).toMatchObject({ x: 0, y: -5, livesDelta: -1 });
  });

  it("a bullet that misses leaves the courier untouched", () => {
    const res = checkCourierHits([playerBulletAt(20, -5)], [courier]);
    expect(res.couriers).toHaveLength(1);
    expect(res.bullets).toHaveLength(1);
    expect(res.scoreDelta).toBe(0);
    expect(res.livesDelta).toBe(0);
  });

  it("enemy bullets never hit couriers", () => {
    const enemyBullet: Bullet = {
      id: 2,
      position: { x: 0, y: -5 },
      velocity: { x: 0, y: -1 },
      fromPlayer: false,
    };
    const res = checkCourierHits([enemyBullet], [courier]);
    expect(res.couriers).toHaveLength(1);
  });
});

describe("courierSpawnInterval", () => {
  it("is positive and varies with spawn count", () => {
    expect(courierSpawnInterval(0)).toBeGreaterThan(0);
    expect(courierSpawnInterval(1)).not.toBe(courierSpawnInterval(0));
  });
});
