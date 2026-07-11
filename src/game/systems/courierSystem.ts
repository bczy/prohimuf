import type { Courier } from "@game/types/courier";
import type { Bullet } from "@game/types/bullet";
import type { PointHitEvent } from "@game/types/feedback";
import { ARCHETYPES } from "@game/types/enemyTypes";

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

export interface CourierHitResult {
  readonly bullets: readonly Bullet[];
  readonly couriers: readonly Courier[];
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly events: readonly PointHitEvent[];
}

/**
 * Player bullets hitting couriers: a mistake. Each hit removes the courier and
 * the bullet and applies the civilian penalty (lose a life and a point).
 */
export function checkCourierHits(
  bullets: readonly Bullet[],
  couriers: readonly Courier[],
): CourierHitResult {
  const hitBulletIds = new Set<number>();
  const hitCourierIds = new Set<number>();
  let scoreDelta = 0;
  let livesDelta = 0;
  const events: PointHitEvent[] = [];
  const a = ARCHETYPES.civilian;

  for (const bullet of bullets) {
    if (!bullet.fromPlayer) continue;
    for (const c of couriers) {
      if (hitCourierIds.has(c.id)) continue;
      const dx = bullet.position.x - c.x;
      const dy = bullet.position.y - c.y;
      if (Math.sqrt(dx * dx + dy * dy) <= COURIER_HIT_RADIUS) {
        hitBulletIds.add(bullet.id);
        hitCourierIds.add(c.id);
        scoreDelta += a.scoreDelta;
        livesDelta += a.livesDelta;
        events.push({
          x: c.x,
          y: c.y,
          scoreDelta: a.scoreDelta,
          livesDelta: a.livesDelta,
          timeDelta: a.timeDelta,
        });
      }
    }
  }

  return {
    bullets: bullets.filter((b) => !hitBulletIds.has(b.id)),
    couriers: couriers.filter((c) => !hitCourierIds.has(c.id)),
    scoreDelta,
    livesDelta,
    events,
  };
}
