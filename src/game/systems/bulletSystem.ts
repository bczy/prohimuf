import type { Bullet } from "@game/types/bullet";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import { hitEnemy } from "@game/systems/enemySystem";

export const BULLET_SPEED = 20;
const HIT_RADIUS = 0.8;
const OUT_OF_BOUNDS_X = 20;
const OUT_OF_BOUNDS_Y = 15;

// Bullet always fires straight up (toward the building facade)
export function fireBullet(crosshair: Crosshair, fromPlayer: boolean, nextId: number): Bullet {
  const worldX = (crosshair.position.x - 0.5) * 20;
  const worldY = -(crosshair.position.y - 0.5) * 12;
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
): { bullets: readonly Bullet[]; enemies: readonly Enemy[]; hits: number } {
  let hits = 0;
  const hitBulletIds = new Set<number>();
  const hitEnemyIds = new Set<number>();

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
        hits++;
      }
    }
  }

  return {
    bullets: bullets.filter((b) => !hitBulletIds.has(b.id)),
    enemies: enemies.map((e) => (hitEnemyIds.has(e.id) ? hitEnemy(e) : e)),
    hits,
  };
}
