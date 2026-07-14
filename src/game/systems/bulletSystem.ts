import type { Bullet } from "@game/types/bullet";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { Vec2 } from "@game/types/vector";
import { crosshairToWorld, VIEW_W, VIEW_H } from "@game/systems/crosshairSystem";
import { hitEnemy } from "@game/systems/enemySystem";
import { ARCHETYPES } from "@game/types/enemyTypes";
import type { HitEvent, ImpactEvent } from "@game/types/feedback";

// One resolved player shot. `enemies` is the enemy set after the (0-or-1) hit;
// the deltas / events mirror the removed `checkBulletHits` byte-for-byte.
export interface PlayerShotResult {
  readonly enemies: readonly Enemy[];
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Targets that count toward the level win (cops only), neutralised this shot.
  readonly targetsDown: number;
  // Per-takedown events (for floating feedback).
  readonly events: readonly HitEvent[];
  // Exactly one impact per shot (hit or miss) — drives render effects (ADR-0020).
  readonly impact: ImpactEvent;
}

export const BULLET_SPEED = 20;
const HIT_RADIUS = 0.8;
const OUT_OF_BOUNDS_X = 60;
const OUT_OF_BOUNDS_Y = 15;

export function tickBullets(bullets: readonly Bullet[], delta: number): readonly Bullet[] {
  return bullets
    .map((b) => ({
      ...b,
      position: {
        x: b.position.x + b.velocity.x * delta,
        y: b.position.y + b.velocity.y * delta,
      },
    }))
    .filter(
      (b) => Math.abs(b.position.x) <= OUT_OF_BOUNDS_X && Math.abs(b.position.y) <= OUT_OF_BOUNDS_Y,
    );
}

// Resolve a player shot as an instant hitscan at fire time (ADR-0020, spec §1).
// The impact point is the aiming SoT (`crosshairToWorld`); the shot hits the
// nearest eligible enemy within HIT_RADIUS (tie → lowest slotIndex), applying the
// exact same reward math as the removed travelling-bullet `checkBulletHits`.
export function resolvePlayerShot(
  crosshair: Crosshair,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  viewW = VIEW_W,
  viewH = VIEW_H,
): PlayerShotResult {
  const impactPoint = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH);

  // Nearest eligible enemy within the hit disc; exact-distance tie → lowest
  // slotIndex (D1.5). At most one enemy hit per shot.
  let best: { enemy: Enemy; slotPosition: Vec2; dist: number } | null = null;
  for (const enemy of enemies) {
    if (enemy.state === "DEAD" || enemy.state === "HIT" || enemy.state === "HIDDEN") continue;
    const slot = facade.slots[enemy.slotIndex];
    if (slot === undefined) continue;
    const dx = impactPoint.x - slot.screenPosition.x;
    const dy = impactPoint.y - slot.screenPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > HIT_RADIUS) continue;
    if (
      best === null ||
      dist < best.dist ||
      (dist === best.dist && enemy.slotIndex < best.enemy.slotIndex)
    ) {
      best = { enemy, slotPosition: slot.screenPosition, dist };
    }
  }

  if (best === null) {
    return {
      enemies,
      scoreDelta: 0,
      livesDelta: 0,
      timeDelta: 0,
      targetsDown: 0,
      events: [],
      impact: { classification: "miss", impactPoint },
    };
  }

  const { enemy, slotPosition } = best;
  let scoreDelta = 0;
  let livesDelta = 0;
  let timeDelta = 0;
  let targetsDown = 0;
  const events: HitEvent[] = [];
  // Effects only land when this hit takes the enemy down (hp -> 0).
  if (enemy.hp - 1 <= 0) {
    const a = ARCHETYPES[enemy.kind];
    scoreDelta += a.scoreDelta;
    livesDelta += a.livesDelta;
    timeDelta += a.timeDelta;
    if (a.countsAsTarget) targetsDown++;
    events.push({
      slotIndex: enemy.slotIndex,
      scoreDelta: a.scoreDelta,
      livesDelta: a.livesDelta,
      timeDelta: a.timeDelta,
    });
  }

  return {
    enemies: enemies.map((e) => (e.id === enemy.id ? hitEnemy(e) : e)),
    scoreDelta,
    livesDelta,
    timeDelta,
    targetsDown,
    events,
    impact: {
      classification: "hit",
      impactPoint,
      hit: {
        enemyId: enemy.id,
        slotIndex: enemy.slotIndex,
        slotPosition,
      },
    },
  };
}
