import type { Cop } from "@game/types/cop";
import type { Vec2 } from "@game/types/vector";
import { distanceVec2, normalizeVec2, scaleVec2, addVec2 } from "@game/systems/vec2";

export const COP_SPEED = 3;
export const COP_CHASE_SPEED = 5;
export const DETECTION_RADIUS = 3;
export const ALERT_DURATION = 2.0;
export const CATCH_RADIUS = 0.6;

const WAYPOINT_REACH_THRESHOLD = 0.3;

export function tickCop(
  cop: Cop,
  waypoints: readonly Vec2[],
  delta: number,
  chasing = false,
  playerPosition?: Vec2,
): Cop {
  // CHASE mode — ignore waypoints, run at player
  if (chasing && cop.state === "CHASE" && playerPosition !== undefined) {
    const dir = normalizeVec2({
      x: playerPosition.x - cop.position.x,
      y: playerPosition.y - cop.position.y,
    });
    const move = scaleVec2(dir, COP_CHASE_SPEED * delta);
    const position = addVec2(cop.position, move);
    return { ...cop, position, direction: dir };
  }

  if (cop.state === "ALERT") {
    const alertTimer = cop.alertTimer - delta;
    if (alertTimer <= 0) {
      return { ...cop, alertTimer: 0, state: "PATROLLING" };
    }
    return { ...cop, alertTimer };
  }

  // PATROLLING
  const target = waypoints[cop.waypointIndex];
  if (target === undefined) return cop;

  const dist = distanceVec2(cop.position, target);

  if (dist < WAYPOINT_REACH_THRESHOLD) {
    const waypointIndex = (cop.waypointIndex + 1) % waypoints.length;
    return { ...cop, waypointIndex };
  }

  const direction = normalizeVec2({
    x: target.x - cop.position.x,
    y: target.y - cop.position.y,
  });
  const move = scaleVec2(direction, COP_SPEED * delta);
  const position = addVec2(cop.position, move);

  return { ...cop, position, direction };
}

export function detectPlayer(cop: Cop, playerPosition: Vec2): Cop {
  if (distanceVec2(cop.position, playerPosition) <= DETECTION_RADIUS) {
    return { ...cop, state: "ALERT", alertTimer: ALERT_DURATION };
  }
  return cop;
}

export function enterChase(cop: Cop): Cop {
  return { ...cop, state: "CHASE", alertTimer: 0 };
}

export function isCopCatchingPlayer(cop: Cop, playerPosition: Vec2): boolean {
  return cop.state === "CHASE" && distanceVec2(cop.position, playerPosition) <= CATCH_RADIUS;
}
