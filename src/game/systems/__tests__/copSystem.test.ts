import { describe, it, expect } from "vitest";
import {
  tickCop,
  detectPlayer,
  COP_SPEED,
  DETECTION_RADIUS,
  ALERT_DURATION,
} from "@game/systems/copSystem";
import { createCop } from "@game/types/cop";
import type { Vec2 } from "@game/types/vector";

const WAYPOINTS: Vec2[] = [
  { x: -5, y: 0 },
  { x: 5, y: 0 },
];

describe("tickCop — PATROLLING", () => {
  it("avance vers le waypoint courant", () => {
    const cop = createCop(1, { x: 0, y: 0 });
    // waypointIndex=0 → target is WAYPOINTS[0] = { x: -5, y: 0 }
    const result = tickCop(cop, WAYPOINTS, 1);
    // Should move toward x: -5 (negative direction)
    expect(result.position.x).toBeLessThan(cop.position.x);
  });

  it("passe au waypoint suivant quand assez proche", () => {
    // Start very close to waypoint 0
    const cop = createCop(1, { x: -4.8, y: 0 });
    const result = tickCop(cop, WAYPOINTS, 1);
    expect(result.waypointIndex).toBe(1);
  });

  it("boucle sur les waypoints (dernier → premier)", () => {
    // Start very close to last waypoint, with waypointIndex pointing to last
    const cop = { ...createCop(1, { x: 4.8, y: 0 }), waypointIndex: 1 };
    const result = tickCop(cop, WAYPOINTS, 1);
    expect(result.waypointIndex).toBe(0);
  });

  it("direction mise à jour", () => {
    const cop = createCop(1, { x: 0, y: 0 });
    // waypointIndex=0 → target is { x: -5, y: 0 } → direction should be negative x
    const result = tickCop(cop, WAYPOINTS, 1);
    expect(result.direction.x).toBeLessThan(0);
  });
});

describe("tickCop — ALERT", () => {
  it("alertTimer décrémente", () => {
    const cop = {
      ...createCop(1, { x: 0, y: 0 }),
      state: "ALERT" as const,
      alertTimer: ALERT_DURATION,
    };
    const result = tickCop(cop, WAYPOINTS, 0.5);
    expect(result.alertTimer).toBeCloseTo(ALERT_DURATION - 0.5);
  });

  it("repasse à PATROLLING quand alertTimer atteint 0", () => {
    const cop = {
      ...createCop(1, { x: 0, y: 0 }),
      state: "ALERT" as const,
      alertTimer: 0.1,
    };
    const result = tickCop(cop, WAYPOINTS, 0.5);
    expect(result.state).toBe("PATROLLING");
  });
});

describe("detectPlayer", () => {
  it("retourne état ALERT si player dans le rayon", () => {
    const cop = createCop(1, { x: 0, y: 0 });
    // Player within DETECTION_RADIUS
    const playerPos: Vec2 = { x: DETECTION_RADIUS - 0.5, y: 0 };
    const result = detectPlayer(cop, playerPos);
    expect(result.state).toBe("ALERT");
    expect(result.alertTimer).toBeCloseTo(ALERT_DURATION);
  });

  it("reste PATROLLING si player hors du rayon", () => {
    const cop = createCop(1, { x: 0, y: 0 });
    // Player outside DETECTION_RADIUS
    const playerPos: Vec2 = { x: DETECTION_RADIUS + 1, y: 0 };
    const result = detectPlayer(cop, playerPos);
    expect(result.state).toBe("PATROLLING");
  });

  it("exporte les constantes attendues", () => {
    expect(COP_SPEED).toBeGreaterThan(0);
    expect(DETECTION_RADIUS).toBeGreaterThan(0);
    expect(ALERT_DURATION).toBeGreaterThan(0);
  });
});
