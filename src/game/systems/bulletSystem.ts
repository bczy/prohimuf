import type { Bullet } from "@game/types/bullet";
import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { Vec2 } from "@game/types/vector";
import { crosshairToWorld, VIEW_W, VIEW_H } from "@game/systems/crosshairSystem";
import { hitEnemy } from "@game/systems/enemySystem";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";
import type { HitEvent, ImpactEvent } from "@game/types/feedback";
import type { LootCrate } from "@game/types/loot";
import type { WeaponKind } from "@game/types/weapon";
import { LOOT_STREET_Y } from "@game/systems/lootSystem";

// What a single hitscan resolution landed on (ADR-0055 D2). `enemy-hit` carries
// the existing reward math; `loot-hit` equips only (never scores, AC7-loot);
// `miss` may then hit a courier (the caller resolves courier-on-miss).
export type ShotOutcome = "enemy-hit" | "loot-hit" | "miss";

// One resolved player shot. `enemies` is the enemy set after the (0-or-1) hit;
// the per-hit reward math (deltas / events) matches the removed `checkBulletHits`.
export interface PlayerShotResult {
  // Which target class this resolution consumed (ADR-0055 D2).
  readonly outcome: ShotOutcome;
  readonly enemies: readonly Enemy[];
  // The crate after this resolution: null on a `loot-hit` (consumed), otherwise
  // the input crate threaded through unchanged.
  readonly loot: LootCrate | null;
  // The weapon a `loot-hit` equips (absent on enemy-hit / miss).
  readonly equippedWeapon?: WeaponKind;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Continuous-energy change from this shot. Always 0 now (the hostage QTE owns
  // all energy changes — see qteSystem); kept on the result for the tick's
  // uniform fold-in. Folded into GameState.energy by the tick.
  readonly energyDelta: number;
  // Targets that count toward the level win (cops only), neutralised this shot.
  readonly targetsDown: number;
  // Per-takedown events (for floating feedback).
  readonly events: readonly HitEvent[];
  // Exactly one impact per resolution (hit or miss) — drives render effects
  // (ADR-0040). A `loot-hit`'s impact is a miss-shaped placeholder the caller
  // discards (the crate has its own render channel).
  readonly impact: ImpactEvent;
}

// Enemy return-fire travel speed (world units/s). Tuned for READABILITY, not
// realism: the aim line from a facade window to the camera is ~6 world units, so
// this gives the player roughly 0.6s of visible flight — long enough to see the
// round coming and pan away, instead of the ~0.28s blink it used to be.
export const BULLET_SPEED = 9;
const HIT_RADIUS = 0.8;
const OUT_OF_BOUNDS_X = 60;
const OUT_OF_BOUNDS_Y = 15;

/**
 * Aim a bullet as a straight line from `spawn` to `target`, normalized to
 * magnitude `speed`. tickBullets never re-steers a bullet after spawn, so this
 * guarantees BOTH axes reach the target at the same time.
 */
export function aimBulletVelocity(spawn: Vec2, target: Vec2, speed = BULLET_SPEED): Vec2 {
  const dx = target.x - spawn.x;
  const dy = target.y - spawn.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: (dx / dist) * speed, y: (dy / dist) * speed };
}

/**
 * Has this bullet already travelled PAST the player? A round is aimed at the
 * player at spawn and is never re-steered, so the sign of
 * `velocity · (player - position)` flips exactly once — at closest approach. Once
 * negative the round is spent: it is behind the player and can no longer hit
 * anything.
 *
 * Without this cull a round that misses (the aim jitter makes that common) stays
 * alive until the out-of-bounds test, i.e. several seconds of flight. Since the
 * renderer scales bullets by their distance to the camera, such a round grows to
 * full size, then shrinks again as it recedes — which reads as the bullet
 * BOUNCING off the player rather than whistling past them.
 */
export function hasPassedPlayer(bullet: Bullet, playerX: number, playerY: number): boolean {
  const toPlayerX = playerX - bullet.position.x;
  const toPlayerY = playerY - bullet.position.y;
  return bullet.velocity.x * toPlayerX + bullet.velocity.y * toPlayerY <= 0;
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

// Resolve ONE player-shot hitscan resolution at a single world point (ADR-0040,
// spec §2.1; extended per ADR-0055 D2). The point is the aiming SoT
// (`crosshairToWorld`) shifted by `offsetDx` (the weapon's per-resolution offset,
// §2.4). Scans enemies ∪ {VISIBLE crate} for the nearest within HIT_RADIUS (tie →
// lowest slotIndex, spanning both types): an enemy → the existing reward math; a
// crate → equip-only (no reward, AC7-loot); nothing → miss (courier resolved by
// the caller). `loot`/`offsetDx` default to the ADR-0040 base shot.
export function resolvePlayerShot(
  crosshair: Crosshair,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  viewW = VIEW_W,
  viewH = VIEW_H,
  loot: LootCrate | null = null,
  offsetDx = 0,
): PlayerShotResult {
  const aim = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH);
  const impactPoint: Vec2 = { x: aim.x + offsetDx, y: aim.y };

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
    if (!(dist <= HIT_RADIUS)) continue; // NaN-safe: a NaN distance never hits.
    if (
      best === null ||
      dist < best.dist ||
      (dist === best.dist && enemy.slotIndex < best.enemy.slotIndex)
    ) {
      best = { enemy, slotPosition: slot.screenPosition, dist };
    }
  }

  // The VISIBLE crate is one more eligible target (§5.3): compare it against the
  // best enemy — nearest wins, tie → lowest slotIndex (one entity per slot, so
  // slot indices never collide). Since ADR-0056 the crate is a STREET object: its
  // x stays the slot's (`slot.screenPosition.x`) but its y is the fixed
  // `LOOT_STREET_Y`, NOT the slot's window row. Only this y source changed — the
  // nearest-wins/tie-break ordering below is byte-identical (AC-D3 / P2).
  let crate: { dist: number; slotIndex: number; weapon: WeaponKind } | null = null;
  if (loot !== null && loot.state === "VISIBLE") {
    const slot = facade.slots[loot.slotIndex];
    if (slot !== undefined) {
      const dx = impactPoint.x - slot.screenPosition.x;
      const dy = impactPoint.y - LOOT_STREET_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HIT_RADIUS) crate = { dist, slotIndex: loot.slotIndex, weapon: loot.weapon };
    }
  }
  const crateWins =
    crate !== null &&
    (best === null ||
      crate.dist < best.dist ||
      (crate.dist === best.dist && crate.slotIndex < best.enemy.slotIndex));

  if (crateWins && crate !== null) {
    // LOOT hit: equip only. NO reward, NO enemy change (structurally off the
    // score/lives path). The crate is consumed this tick. The impact is a
    // miss-shaped placeholder the caller discards (crate has its own visual).
    return {
      outcome: "loot-hit",
      enemies,
      loot: null,
      equippedWeapon: crate.weapon,
      scoreDelta: loot?.reward?.scoreDelta ?? 0,
      livesDelta: loot?.reward?.livesDelta ?? 0,
      timeDelta: 0,
      energyDelta: 0,
      targetsDown: 0,
      events: [],
      impact: { classification: "miss", impactPoint },
    };
  }

  if (best === null) {
    return {
      outcome: "miss",
      enemies,
      loot,
      scoreDelta: 0,
      livesDelta: 0,
      timeDelta: 0,
      energyDelta: 0,
      targetsDown: 0,
      events: [],
      impact: { classification: "miss", impactPoint },
    };
  }

  const { enemy, slotPosition } = best;
  let scoreDelta = 0;
  let livesDelta = 0;
  let timeDelta = 0;
  const energyDelta = 0;
  let targetsDown = 0;
  const events: HitEvent[] = [];
  // Effects only land when this hit takes the enemy down (hp -> 0).
  if (enemy.hp - 1 <= 0) {
    const a = CORE_ARCHETYPES[enemy.kind];
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
    outcome: "enemy-hit",
    enemies: enemies.map((e) => (e.id === enemy.id ? hitEnemy(e) : e)),
    loot,
    scoreDelta,
    livesDelta,
    timeDelta,
    energyDelta,
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
