import type { GameState } from "@game/types/gameState";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { Cargo } from "@game/types/cargo";
import type { Vec2 } from "@game/types/vector";
import type { PointHitEvent } from "@game/types/feedback";
import type { FacadeMap } from "@game/types/map";
import { tickTimer } from "@game/systems/timer";
import { moveCrosshair } from "@game/systems/crosshairSystem";
import { spawnWave, tickEnemy } from "@game/systems/enemySystem";
import {
  fireBullet,
  tickBullets,
  checkBulletHits,
  crosshairToWorld,
  BULLET_SPEED,
} from "@game/systems/bulletSystem";
import { tickDelivery } from "@game/systems/deliverySystem";
import {
  checkCourierHits,
  courierSpawnInterval,
  FIRST_COURIER_DELAY,
  spawnCourier,
  tickCouriers,
} from "@game/systems/courierSystem";
import type { CourierField } from "@game/systems/courierSystem";

export const LEVEL_TIME_SECONDS = 90;
export const ENEMIES_TO_WIN = 10;

// MVP: the belliard cargo pickup/depot are hard-coded world positions, sized to
// sit inside the crosshair's reachable area (see `crosshairToWorld`). Data-driven
// per-level placement is out of scope for this slice.
export const BELLIARD_CARGO_PICKUP: Vec2 = { x: -6, y: -3 };
export const BELLIARD_CARGO_DEPOT: Vec2 = { x: 6, y: -3 };

const PLAYER_HIT_RADIUS = 1.0;

let _nextBulletId = 1;
let _nextCourierId = 1;

export interface LevelParams {
  lives: number;
  timeSeconds: number;
  enemiesToWin: number;
  enemySpeedMultiplier: number;
}

export const DEFAULT_LEVEL_PARAMS: LevelParams = {
  lives: 3,
  timeSeconds: LEVEL_TIME_SECONDS,
  enemiesToWin: ENEMIES_TO_WIN,
  enemySpeedMultiplier: 1.0,
};

export function createInitialState(
  facade: FacadeMap,
  params: LevelParams = DEFAULT_LEVEL_PARAMS,
): GameState {
  return {
    phase: "PLAYING",
    crosshair: { position: { x: 0.5, y: 0.5 } },
    enemies: spawnWave(1, facade),
    bullets: [],
    score: 0,
    lives: params.lives,
    timeRemaining: params.timeSeconds,
    wave: 1,
    couriers: [],
    courierTimer: FIRST_COURIER_DELAY,
    couriersSpawned: 0,
    cargo: {
      status: "TO_PICKUP",
      pickup: BELLIARD_CARGO_PICKUP,
      depot: BELLIARD_CARGO_DEPOT,
    },
  };
}

export function tickGameState(
  state: GameState,
  fire: boolean,
  mouseX: number,
  mouseY: number,
  delta: number,
  facade: FacadeMap,
  cameraOffsetX = 0,
  viewW = 18,
  viewH = 12,
  enemiesToWin = ENEMIES_TO_WIN,
  courierField?: CourierField,
): GameState {
  if (state.phase === "GAME_OVER" || state.phase === "LEVEL_COMPLETE") {
    return state;
  }

  if (state.score >= enemiesToWin) {
    return { ...state, phase: "LEVEL_COMPLETE" };
  }

  // 1. Update crosshair
  const crosshair = moveCrosshair(mouseX, mouseY);

  // 1b. Core-loop delivery: the crosshair-in-world position grabs the cargo at
  // its pickup and drops it at the depot (same conversion as `fireBullet`).
  const crosshairWorld = crosshairToWorld(crosshair, cameraOffsetX, viewW, viewH);
  const delivery = tickDelivery(state.cargo, crosshairWorld);
  const cargo: Cargo = delivery.cargo;
  const deliveryEvents = delivery.events;

  // 2. Tick enemies
  const tickedEnemies = state.enemies.map((e) => tickEnemy(e, delta));

  // 3. Spawn new wave if all enemies dead
  const allDead = tickedEnemies.every((e) => e.state === "DEAD");
  const newWave = allDead ? state.wave + 1 : state.wave;
  const activeEnemies: readonly Enemy[] = allDead ? spawnWave(newWave, facade) : tickedEnemies;

  // 4. Player fires bullet
  let bullets: readonly Bullet[] = state.bullets;
  if (fire) {
    _nextBulletId++;
    bullets = [...bullets, fireBullet(crosshair, true, _nextBulletId, cameraOffsetX, viewW, viewH)];
  }

  // 5. Enemies fire a SINGLE shot when they enter the SHOOTING state (not a
  // per-frame stream — that was unfairly dense).
  const wasShooting = new Set(state.enemies.filter((e) => e.state === "SHOOTING").map((e) => e.id));
  const shootingEnemies = activeEnemies.filter(
    (e) => e.state === "SHOOTING" && !wasShooting.has(e.id),
  );
  for (const enemy of shootingEnemies) {
    const slot = facade.slots[enemy.slotIndex];
    if (slot === undefined) continue;
    _nextBulletId++;
    bullets = [
      ...bullets,
      {
        id: _nextBulletId,
        position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
        velocity: { x: 0, y: -BULLET_SPEED },
        fromPlayer: false,
      },
    ];
  }

  // 6. Tick bullets
  const movedBullets = tickBullets(bullets, delta);

  // 7. Player bullet hits on enemies
  const hitResult = checkBulletHits(movedBullets, activeEnemies, facade);

  // 7b. Street couriers (livreurs): move them along the road, spawn new ones on a
  // timer, and resolve mistaken hits (shooting a courier costs a life + point).
  let couriers: readonly Courier[] = state.couriers;
  let courierTimer = state.courierTimer;
  let couriersSpawned = state.couriersSpawned;
  let courierBullets = hitResult.bullets;
  let courierScoreDelta = 0;
  let courierLivesDelta = 0;
  let pointFeedback: readonly PointHitEvent[] = [];
  if (courierField !== undefined) {
    couriers = tickCouriers(couriers, delta, courierField);
    courierTimer -= delta;
    if (courierTimer <= 0) {
      const dir: 1 | -1 = couriersSpawned % 2 === 0 ? 1 : -1;
      couriers = [...couriers, spawnCourier(_nextCourierId++, dir, courierField)];
      couriersSpawned += 1;
      courierTimer = courierSpawnInterval(couriersSpawned);
    }
    const ch = checkCourierHits(courierBullets, couriers);
    courierBullets = ch.bullets;
    couriers = ch.couriers;
    courierScoreDelta = ch.scoreDelta;
    courierLivesDelta = ch.livesDelta;
    pointFeedback = ch.events;
  }

  // Fold pickup/delivery feedback into the same world-anchored channel.
  if (deliveryEvents.length > 0) {
    pointFeedback = [...pointFeedback, ...deliveryEvents];
  }

  const newScore = Math.max(
    0,
    state.score + hitResult.scoreDelta + courierScoreDelta + delivery.scoreDelta,
  );

  // 8. Enemy bullet hits player (near screen center y=0)
  const hitBulletIds = new Set<number>();
  let playerHit = false;
  for (const b of courierBullets) {
    if (b.fromPlayer) continue;
    if (Math.sqrt(b.position.x * b.position.x + b.position.y * b.position.y) <= PLAYER_HIT_RADIUS) {
      hitBulletIds.add(b.id);
      playerHit = true;
    }
  }
  const finalBullets = courierBullets.filter((b) => !hitBulletIds.has(b.id));

  // Lives change from being shot AND from mistakes (shooting a civilian courier).
  const newLives = state.lives - (playerHit ? 1 : 0) + hitResult.livesDelta + courierLivesDelta;

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: hitResult.enemies,
      feedback: hitResult.events,
      pointFeedback,
      couriers,
      courierTimer,
      couriersSpawned,
      cargo,
      bullets: finalBullets,
      lives: 0,
      score: newScore,
      wave: newWave,
      phase: "GAME_OVER",
    };
  }

  // 9. Tick timer (bonus enemies add seconds back)
  const timeRemaining = tickTimer(state.timeRemaining, delta) + hitResult.timeDelta;
  if (timeRemaining <= 0) {
    return {
      ...state,
      crosshair,
      enemies: hitResult.enemies,
      feedback: hitResult.events,
      pointFeedback,
      couriers,
      courierTimer,
      couriersSpawned,
      cargo,
      bullets: finalBullets,
      lives: newLives,
      score: newScore,
      wave: newWave,
      timeRemaining: 0,
      phase: "GAME_OVER",
    };
  }

  const finalPhase = newScore >= enemiesToWin ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase: finalPhase,
    crosshair,
    enemies: hitResult.enemies,
    feedback: hitResult.events,
    pointFeedback,
    couriers,
    courierTimer,
    couriersSpawned,
    cargo,
    bullets: finalBullets,
    score: newScore,
    lives: newLives,
    timeRemaining,
    wave: newWave,
  };
}
