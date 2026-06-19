import type { Bullet } from "@game/types/bullet";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import { hitEnemy } from "@game/systems/enemySystem";
import { ARCHETYPES } from "@game/types/enemyTypes";
import type { HitEvent } from "@game/types/feedback";

export interface HitResult {
  readonly bullets: readonly Bullet[];
  readonly enemies: readonly Enemy[];
  // Net effects of this tick's player hits.
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Targets that count toward the level win (cops only), neutralised this tick.
  readonly targetsDown: number;
  // Per-takedown events (for floating feedback).
  readonly events: readonly HitEvent[];
}

export const BULLET_SPEED = 20;
const HIT_RADIUS = 0.8;
const OUT_OF_BOUNDS_X = 60;
const OUT_OF_BOUNDS_Y = 15;

export function fireBullet(
  crosshair: Crosshair,
  fromPlayer: boolean,
  nextId: number,
  cameraOffsetX = 0,
  viewW = 18,
  viewH = 12,
): Bullet {
  const worldX = (crosshair.position.x - 0.5) * viewW + cameraOffsetX;
  const worldY = -(crosshair.position.y - 0.5) * viewH;
  return {
    id: nextId,
    position: { x: worldX, y: worldY },
    velocity: { x: 0, y: fromPlayer ? BULLET_SPEED : -BULLET_SPEED },
    fromPlayer,
  };
}

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

export function checkBulletHits(
  bullets: readonly Bullet[],
  enemies: readonly Enemy[],
  facade: FacadeMap,
): HitResult {
  const hitBulletIds = new Set<number>();
  const hitEnemyIds = new Set<number>();
  let scoreDelta = 0;
  let livesDelta = 0;
  let timeDelta = 0;
  let targetsDown = 0;
  const events: HitEvent[] = [];

  for (const bullet of bullets) {
    if (!bullet.fromPlayer) continue;
    for (const enemy of enemies) {
      if (enemy.state === "DEAD" || enemy.state === "HIT" || enemy.state === "HIDDEN") continue;
      if (hitEnemyIds.has(enemy.id)) continue;

      const slot = facade.slots[enemy.slotIndex];
      if (slot === undefined) continue;

      const dx = bullet.position.x - slot.screenPosition.x;
      const dy = bullet.position.y - slot.screenPosition.y;
      if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
        hitBulletIds.add(bullet.id);
        hitEnemyIds.add(enemy.id);
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
      }
    }
  }

  return {
    bullets: bullets.filter((b) => !hitBulletIds.has(b.id)),
    enemies: enemies.map((e) => (hitEnemyIds.has(e.id) ? hitEnemy(e) : e)),
    scoreDelta,
    livesDelta,
    timeDelta,
    targetsDown,
    events,
  };
}
