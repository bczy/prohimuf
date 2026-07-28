import type { Courier } from "@game/types/courier";
import type { PointHitEvent } from "@game/types/feedback";
import type { Vec2 } from "@game/types/vector";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";

/** Where couriers live: the wide street's half-width and the road's world y. */
export interface CourierField {
  readonly halfWidth: number;
  readonly streetY: number;
}

// Spawn/cull this far outside the field so couriers slide fully on/off screen.
const MARGIN = 4;
export const COURIER_SPEED = 7;
const COURIER_HIT_RADIUS = 1.2;
const BASE_INTERVAL = 7; // seconds between couriers
export const FIRST_COURIER_DELAY = 4;

/** Deterministic, mildly-varied gap before the next courier enters. */
export function courierSpawnInterval(spawnCount: number): number {
  return BASE_INTERVAL + (spawnCount % 3) * 1.5;
}

/**
 * Per-level roster gate for the street courier spawn (pure, no state).
 * - `undefined` (no `roster.streetSpawns`) ⇒ legacy courier-only behaviour → true.
 * - present and includes `"courier"` ⇒ true.
 * - present and omits `"courier"` (including `[]`) ⇒ false (silent street, no throw).
 */
export function streetSpawnsCourier(
  streetSpawns?: readonly ("courier" | "car" | "hostage_taker")[],
): boolean {
  if (streetSpawns === undefined) return true;
  return streetSpawns.includes("courier");
}

/** A courier entering from the edge it will ride away from. */
export function spawnCourier(id: number, dir: 1 | -1, field: CourierField): Courier {
  const startX = dir === 1 ? -(field.halfWidth + MARGIN) : field.halfWidth + MARGIN;
  return { id, x: startX, y: field.streetY, dir, speed: COURIER_SPEED };
}

/** Advance couriers along the street, dropping any that have ridden off the end. */
export function tickCouriers(
  couriers: readonly Courier[],
  delta: number,
  field: CourierField,
): readonly Courier[] {
  const limit = field.halfWidth + MARGIN + 0.5;
  return couriers
    .map((c) => ({ ...c, x: c.x + c.dir * c.speed * delta }))
    .filter((c) => Math.abs(c.x) <= limit);
}

export interface CourierShotResult {
  readonly couriers: readonly Courier[];
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly events: readonly PointHitEvent[];
}

/**
 * A player miss (no window hit) striking a courier: a mistake. Resolves the
 * hitscan impact point against the couriers — the nearest single courier within
 * COURIER_HIT_RADIUS is removed and the civilian penalty applies (lose a life and
 * a point). One shot = one target (consistent with the D1.5 window rule).
 */
export function resolveCourierShot(
  impactPoint: Vec2,
  couriers: readonly Courier[],
): CourierShotResult {
  let best: { courier: Courier; dist: number } | null = null;
  for (const c of couriers) {
    const dx = impactPoint.x - c.x;
    const dy = impactPoint.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!(dist <= COURIER_HIT_RADIUS)) continue;
    if (best === null || dist < best.dist) best = { courier: c, dist };
  }

  if (best === null) {
    return { couriers, scoreDelta: 0, livesDelta: 0, events: [] };
  }

  const { courier } = best;
  const a = CORE_ARCHETYPES.civilian;
  return {
    couriers: couriers.filter((c) => c.id !== courier.id),
    scoreDelta: a.scoreDelta,
    livesDelta: a.livesDelta,
    events: [
      {
        x: courier.x,
        y: courier.y,
        scoreDelta: a.scoreDelta,
        livesDelta: a.livesDelta,
        timeDelta: a.timeDelta,
      },
    ],
  };
}
