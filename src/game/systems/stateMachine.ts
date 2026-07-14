import type { GameState } from "@game/types/gameState";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { ImpactEvent, PointHitEvent } from "@game/types/feedback";
import type { FacadeMap } from "@game/types/map";
import { tickTimer } from "@game/systems/timer";
import { moveCrosshair } from "@game/systems/crosshairSystem";
import { spawnWave, tickEnemy } from "@game/systems/enemySystem";
import { resolvePlayerShot, tickBullets, BULLET_SPEED } from "@game/systems/bulletSystem";
import type { PlayerShotResult } from "@game/systems/bulletSystem";
import { tickDelivery, seedDeliveryVehicle } from "@game/systems/deliverySystem";
import {
  checkCourierHits,
  courierSpawnInterval,
  FIRST_COURIER_DELAY,
  spawnCourier,
  streetSpawnsCourier,
  tickCouriers,
} from "@game/systems/courierSystem";
import type { CourierField } from "@game/systems/courierSystem";
import { ARCHETYPES, buildWeightedFrom } from "@game/types/enemyTypes";
import type { LevelRoster } from "@game/levels/levels";
import type { EnemyKind } from "@game/types/enemy";

// Resolve the active window pool from a roster: absent `windowWeights` ⇒ the
// frozen default path (spawnWave called without a pool), so AC1 holds.
function windowPoolFor(roster?: LevelRoster): readonly EnemyKind[] | undefined {
  const overrides = roster?.windowWeights;
  if (overrides === undefined) return undefined;
  const defaults = Object.fromEntries(
    (Object.keys(ARCHETYPES) as EnemyKind[]).map((k) => [k, ARCHETYPES[k].weight]),
  ) as Record<EnemyKind, number>;
  return buildWeightedFrom({ ...defaults, ...overrides });
}

export const LEVEL_TIME_SECONDS = 90;
export const ENEMIES_TO_WIN = 10;

const PLAYER_HIT_RADIUS = 1.0;

let _nextBulletId = 1;
let _nextCourierId = 1;

export interface LevelParams {
  lives: number;
  timeSeconds: number;
  enemiesToWin: number;
  enemySpeedMultiplier: number;
  /**
   * Scripted vehicle delivery for this level (from `LevelConfig.deliveries[0]`).
   * Omitted / null = no delivery this level.
   */
  delivery?: DeliverySpec | null;
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
  roster?: LevelRoster,
): GameState {
  const deliverySpec = params.delivery ?? null;
  return {
    phase: "PLAYING",
    crosshair: { position: { x: 0.5, y: 0.5 } },
    enemies: spawnWave(1, facade, windowPoolFor(roster)),
    bullets: [],
    score: 0,
    lives: params.lives,
    timeRemaining: params.timeSeconds,
    wave: 1,
    elapsedSeconds: 0,
    kills: 0,
    couriers: [],
    courierTimer: FIRST_COURIER_DELAY,
    couriersSpawned: 0,
    deliverySpec,
    deliveryVehicle: seedDeliveryVehicle(deliverySpec),
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
  cameraOffsetY = 0,
  viewW = 18,
  viewH = 12,
  enemiesToWin = ENEMIES_TO_WIN,
  courierField?: CourierField,
  roster?: LevelRoster,
): GameState {
  if (state.phase === "GAME_OVER" || state.phase === "LEVEL_COMPLETE") {
    return state;
  }

  // Victory is gated on the kill-count only (`countsAsTarget` takedowns), never
  // on the score — so the delivery bonus can never trigger the level win.
  if (state.kills >= enemiesToWin) {
    return { ...state, phase: "LEVEL_COMPLETE" };
  }

  // Deterministic elapsed-time accumulator, drives the scripted delivery trigger.
  const elapsedSeconds = state.elapsedSeconds + delta;

  // 1. Update crosshair
  const crosshair = moveCrosshair(mouseX, mouseY);

  // 2. Tick enemies
  const tickedEnemies = state.enemies.map((e) => tickEnemy(e, delta));

  // 3. Spawn new wave if all enemies dead
  const allDead = tickedEnemies.every((e) => e.state === "DEAD");
  const newWave = allDead ? state.wave + 1 : state.wave;
  const activeEnemies: readonly Enemy[] = allDead
    ? spawnWave(newWave, facade, windowPoolFor(roster))
    : tickedEnemies;

  // 4. Player fires — instant hitscan resolved at the crosshair world point
  // (ADR-0020). No travelling player projectile enters `bullets`; the shot yields
  // one ImpactEvent plus the (byte-identical) reward math. Reads the pre-hit
  // enemy snapshot, exactly like the enemy-fire step below.
  const shot: PlayerShotResult | null = fire
    ? resolvePlayerShot(crosshair, activeEnemies, facade, cameraOffsetX, cameraOffsetY, viewW, viewH)
    : null;
  const shotEnemies = shot ? shot.enemies : activeEnemies;
  const impactEvents: readonly ImpactEvent[] = shot ? [shot.impact] : [];

  // 5. Enemies fire a SINGLE shot when they enter the SHOOTING state (not a
  // per-frame stream — that was unfairly dense). Reads `activeEnemies` (the
  // pre-hit snapshot), so a same-tick player kill does NOT suppress the telegraph.
  let bullets: readonly Bullet[] = state.bullets;
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

  // 6. Tick bullets (only enemy bullets travel now — the player shot is hitscan).
  const movedBullets = tickBullets(bullets, delta);

  // 7b. Street couriers (livreurs): move them along the road, spawn new ones on a
  // timer, and resolve mistaken hits (shooting a courier costs a life + point).
  let couriers: readonly Courier[] = state.couriers;
  let courierTimer = state.courierTimer;
  let couriersSpawned = state.couriersSpawned;
  let courierBullets = movedBullets;
  let courierScoreDelta = 0;
  let courierLivesDelta = 0;
  let pointFeedback: readonly PointHitEvent[] = [];
  if (courierField !== undefined) {
    couriers = tickCouriers(couriers, delta, courierField);
    courierTimer -= delta;
    // Per-level roster gate: only spawn couriers when this level's street roster
    // includes "courier" (absent roster ⇒ legacy courier-only behaviour).
    if (courierTimer <= 0 && streetSpawnsCourier(roster?.streetSpawns)) {
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

  // 7c. Scripted vehicle delivery (core loop `Livrer` — protect the vehicle).
  // Enemies currently in SHOOTING chip the vehicle's integrity during the
  // window; surviving it awards a one-shot score bonus. Shares the courier
  // street lane, so it only runs when a courier field is supplied.
  let deliveryVehicle: DeliveryVehicle | null = state.deliveryVehicle;
  let deliveryScoreDelta = 0;
  if (state.deliverySpec !== null && deliveryVehicle !== null && courierField !== undefined) {
    const shootingCount = activeEnemies.filter((e) => e.state === "SHOOTING").length;
    const result = tickDelivery(
      deliveryVehicle,
      state.deliverySpec,
      elapsedSeconds,
      shootingCount,
      courierField,
      delta,
    );
    deliveryVehicle = result.vehicle;
    deliveryScoreDelta = result.scoreDelta;
  }

  // Score folds in the delivery bonus; the win gate below stays on kills only.
  const shotScoreDelta = shot ? shot.scoreDelta : 0;
  const shotTargetsDown = shot ? shot.targetsDown : 0;
  const newScore = Math.max(
    0,
    state.score + shotScoreDelta + courierScoreDelta + deliveryScoreDelta,
  );
  const newKills = state.kills + shotTargetsDown;

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
  const shotLivesDelta = shot ? shot.livesDelta : 0;
  const shotEvents = shot ? shot.events : [];
  const newLives = state.lives - (playerHit ? 1 : 0) + shotLivesDelta + courierLivesDelta;

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: shotEvents,
      pointFeedback,
      impactEvents,
      couriers,
      courierTimer,
      couriersSpawned,
      deliveryVehicle,
      elapsedSeconds,
      kills: newKills,
      bullets: finalBullets,
      lives: 0,
      score: newScore,
      wave: newWave,
      phase: "GAME_OVER",
    };
  }

  // 9. Tick timer (bonus enemies add seconds back)
  const shotTimeDelta = shot ? shot.timeDelta : 0;
  const timeRemaining = tickTimer(state.timeRemaining, delta) + shotTimeDelta;
  if (timeRemaining <= 0) {
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: shotEvents,
      pointFeedback,
      impactEvents,
      couriers,
      courierTimer,
      couriersSpawned,
      deliveryVehicle,
      elapsedSeconds,
      kills: newKills,
      bullets: finalBullets,
      lives: newLives,
      score: newScore,
      wave: newWave,
      timeRemaining: 0,
      phase: "GAME_OVER",
    };
  }

  const finalPhase = newKills >= enemiesToWin ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase: finalPhase,
    crosshair,
    enemies: shotEnemies,
    feedback: shotEvents,
    pointFeedback,
    impactEvents,
    couriers,
    courierTimer,
    couriersSpawned,
    deliverySpec: state.deliverySpec,
    deliveryVehicle,
    elapsedSeconds,
    kills: newKills,
    bullets: finalBullets,
    score: newScore,
    lives: newLives,
    timeRemaining,
    wave: newWave,
  };
}
