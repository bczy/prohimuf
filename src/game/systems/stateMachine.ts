import type { GameState } from "@game/types/gameState";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { HitEvent, ImpactEvent, PointHitEvent } from "@game/types/feedback";
import type { FacadeMap } from "@game/types/map";
import { tickTimer } from "@game/systems/timer";
import { moveCrosshair, crosshairToWorld } from "@game/systems/crosshairSystem";
import { spawnWave, tickEnemy } from "@game/systems/enemySystem";
import { tickBullets, BULLET_SPEED } from "@game/systems/bulletSystem";
import { resolveTrigger } from "@game/systems/weaponSystem";
import { tickLoot } from "@game/systems/lootSystem";
import { tickDelivery, seedDeliveryVehicle } from "@game/systems/deliverySystem";
import {
  courierSpawnInterval,
  FIRST_COURIER_DELAY,
  spawnCourier,
  streetSpawnsCourier,
  tickCouriers,
} from "@game/systems/courierSystem";
import type { CourierField } from "@game/systems/courierSystem";
import { isQteActive, shouldTriggerQte, createQte, tickQte } from "@game/systems/qteSystem";
import {
  isBossQteActive,
  shouldTriggerBossQte,
  createBossQte,
  tickBossQte,
} from "@game/systems/bossQteSystem";
import { applyEnergy, ENERGY_INITIAL } from "@game/systems/energySystem";
import { WEAPON_SPECS } from "@game/types/weapon";
import type { LootSpec } from "@game/types/loot";
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
let _nextLootId = 1;

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
  /**
   * Scripted hostage-taker QTE for this level (from `LevelConfig.hostageQte`).
   * Omitted / null = no QTE this level.
   */
  hostageQte?: QteSpec | null;
  /**
   * Scripted boss QTE encounter for this level (ADR-0051). Omitted / null = no boss
   * (EVERY shipped level in V1 — only the non-shipped Belliard dev-harness authors it).
   */
  bossQte?: BossQteSpec | null;
  /**
   * Per-level armament crate config (ADR-0055 D8, from `LevelConfig.loot`).
   * Omitted / null = no crates this level ⇒ weapon stays `base`/∞ and the tick is
   * byte-for-byte identical to ADR-0040. Belliard-first for V1.
   */
  loot?: LootSpec | null;
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
  const hostageQteSpec = params.hostageQte ?? null;
  const bossQteSpec = params.bossQte ?? null;
  const lootSpec = params.loot ?? null;
  // Reset the crate-id counter per session (MINEUR-2): unlike bullet/courier ids
  // (identity only), the loot id is the RNG seed for the slot+weapon pick
  // (lootSystem), so resetting it makes the "deterministic, replay-safe" claim true
  // — two fresh sessions on the same level produce the same crate sequence.
  _nextLootId = 1;
  // GUARD (code-review panel, PR #112): a level may NOT author BOTH a hostage QTE and a boss
  // QTE yet. The two cinematics do not interleave — the boss block at the top of `tickGameState`
  // freezes `elapsedSeconds` while the boss is active, and the hostage QTE triggers off
  // `elapsedSeconds`; so a co-authored hostage would be SILENTLY dropped once the boss quota is
  // met (never delayed — lost). Interleaving them is a follow-up story; until then, fail LOUD at
  // level load rather than lose a scripted beat in play. Not reachable in V1 (no shipped level
  // authors both; the dev harness authors only the boss spec) — this locks it that way.
  if (hostageQteSpec !== null && bossQteSpec !== null) {
    throw new Error(
      "LevelConfig invariant: a level cannot author BOTH hostageQte and bossQte yet — the two " +
        "QTE cinematics do not interleave (the boss freezes the clock the hostage trigger reads), " +
        "so the hostage QTE would be silently dropped. Split them across levels or wait for the " +
        "QTE-interleave follow-up story.",
    );
  }
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
    energy: ENERGY_INITIAL,
    qteSpec: hostageQteSpec,
    qte: null,
    bossQteSpec: bossQteSpec,
    bossQte: null,
    deliverySpec,
    deliveryVehicle: seedDeliveryVehicle(deliverySpec),
    // Weapon+loot seam (ADR-0055 D1/D5/D8). Every level starts on `base`/∞; a
    // level without `lootSpec` never spawns a crate, so weapon stays `base` and
    // the tick is byte-identical to ADR-0040.
    weapon: {
      active: "base",
      stock: WEAPON_SPECS.base.startStock,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    },
    loot: null,
    lootSpec,
    lootTimer: lootSpec !== null ? lootSpec.spawnIntervalSeconds : 0,
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
    // Idle terminal ticks must not replay last tick's transient events (they are
    // consumed once by the bridge; the transition tick already emitted its burst).
    return { ...state, impactEvents: [], feedback: [], pointFeedback: [], weaponEmpty: false };
  }

  // Boss QTE encounter — "le Commandant" (ADR-0051 D3). Additive-and-optional: this whole
  // block is skipped when `bossQteSpec === null` (every shipped level EXCEPT `niveau-final`,
  // ADR-0053), so the quota-win path below is BYTE-FOR-BYTE unchanged there (the ADR-0051 D4
  // safety property, asserted by the `bossQteSpec === null` identity test — exactly as the
  // hostage guards `qteSpec === null`).
  // When a boss IS authored, the boss REPLACES the abrupt "quota met → LEVEL_COMPLETE": it
  // triggers on quota-completion, freezes the rest of the level while ACTIVE, and only a boss
  // WON completes the level (boss LOST fails it). The boss is NOT in the kill quota.
  if (state.bossQteSpec !== null) {
    let bossQte = state.bossQte;
    if (shouldTriggerBossQte(state.bossQteSpec, bossQte, state.kills, enemiesToWin)) {
      bossQte = createBossQte(state.bossQteSpec);
    }
    if (isBossQteActive(bossQte) && bossQte !== null) {
      const crosshair = moveCrosshair(mouseX, mouseY);
      const impactPoint = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH);
      const r = tickBossQte(bossQte, fire, impactPoint, delta);
      return {
        ...state,
        crosshair,
        // The clock is frozen — the cinematic beat is "outside time".
        elapsedSeconds: state.elapsedSeconds,
        bossQte: r.qte,
        // Energy is the boss QTE's sole outcome currency (ADR-0051 D2); score is untouched.
        energy: applyEnergy(state.energy, r.energyDelta),
        impactEvents: [],
        feedback: [],
        pointFeedback: [],
        // Weapon state (active/stock/burst) rides `...state` FROZEN through the duel
        // (ADR-0055 D7); only the transient empty flag is cleared.
        weaponEmpty: false,
      };
    }
    // The boss has resolved (phase DONE): a depleted `bossHp` WON the fight → the level
    // completes; the blown-window clock LOST it → the level fails. LEVEL_COMPLETE fires ONLY
    // on a boss win. (A boss authored but not yet triggered — quota not reached — falls
    // through to normal play, exactly as before.)
    if (bossQte !== null && bossQte.phase === "DONE") {
      const won = bossQte.bossHp <= 0;
      return {
        ...state,
        bossQte,
        phase: won ? "LEVEL_COMPLETE" : "GAME_OVER",
        impactEvents: [],
        feedback: [],
        pointFeedback: [],
        weaponEmpty: false,
      };
    }
  }

  // Victory is gated on the kill-count only (`countsAsTarget` takedowns), never
  // on the score — so the delivery bonus can never trigger the level win.
  if (state.kills >= enemiesToWin) {
    return {
      ...state,
      phase: "LEVEL_COMPLETE",
      impactEvents: [],
      feedback: [],
      pointFeedback: [],
      weaponEmpty: false,
    };
  }

  // Deterministic elapsed-time accumulator, drives the scripted delivery trigger.
  const elapsedSeconds = state.elapsedSeconds + delta;

  // 1. Update crosshair
  const crosshair = moveCrosshair(mouseX, mouseY);

  // 1b. Hostage-taker cinematic QTE — "the static duel" (revises ADR-0034).
  // When its scripted trigger fires, the REST OF THE SCENE FREEZES: only the
  // crosshair and the QTE's own live simulation advance (the static captor, his
  // COVERED↔PEEKING sub-machine and the player's shot). Everything else (enemies,
  // waves, spawns, bullets, couriers, delivery, the level clock) is carried
  // unchanged via `...state`, so a QTE-less level (`qteSpec === null`) skips this
  // block entirely and stays byte-for-byte deterministic. Energy is the QTE's
  // SOLE outcome currency (D5); score is never moved by the QTE.
  let qte = state.qte;
  if (shouldTriggerQte(state.qteSpec, qte, elapsedSeconds) && state.qteSpec !== null) {
    qte = createQte(state.qteSpec);
  }
  if (isQteActive(qte) && qte !== null) {
    const impactPoint = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH);
    const r = tickQte(qte, fire, impactPoint, delta);
    return {
      ...state,
      crosshair,
      // The clock is frozen — the cinematic beat is "outside time" (so the
      // delivery script and the level timer are not perturbed by it).
      elapsedSeconds: state.elapsedSeconds,
      qte: r.qte,
      // Energy is the QTE's sole outcome currency (ADR-0034 D5); score is untouched.
      energy: applyEnergy(state.energy, r.energyDelta),
      impactEvents: [],
      feedback: [],
      pointFeedback: [],
      // Weapon+stock ride `...state` FROZEN through the QTE (ADR-0055 D7 / AC6); no
      // weapon/loot logic runs in this branch. Clear only the transient empty flag.
      weaponEmpty: false,
    };
  }

  // 2. Tick enemies
  const tickedEnemies = state.enemies.map((e) => tickEnemy(e, delta));

  // 3. Spawn new wave if all enemies dead
  const allDead = tickedEnemies.every((e) => e.state === "DEAD");
  const newWave = allDead ? state.wave + 1 : state.wave;
  // On a wave rollover, exclude the live crate's slot so a fresh enemy never seats
  // on it (ADR-0055 D5 co-location guard, direction b). `state.loot` is the pre-tick
  // crate; its slot is stable across the tick.
  const activeEnemies: readonly Enemy[] = allDead
    ? spawnWave(
        newWave,
        facade,
        windowPoolFor(roster),
        state.loot !== null ? [state.loot.slotIndex] : [],
      )
    : tickedEnemies;

  // 3b. Armament crate (ADR-0055 D5 / ADR-0056): advance / spawn the LOOT crate.
  // Runs only on the normal-tick path, so a QTE freeze never spawns or resolves a
  // crate (D7 / AC6). No-op when the level authors no `lootSpec` (D8). The D9-2
  // delivery x-gap (ADR-0056 D4) is assembled HERE from the PRE-tick delivery
  // snapshot (this runs before the 7c delivery tick): the phase-gate lives in the
  // stateMachine (it knows the delivery types); only pure data crosses the seam
  // into the delivery-agnostic `lootSystem` (P1, boundary law).
  const deliveryGap =
    state.deliveryVehicle !== null &&
    state.deliverySpec !== null &&
    (state.deliveryVehicle.phase === "INCOMING" || state.deliveryVehicle.phase === "DELIVERING")
      ? { stopX: state.deliverySpec.stopPosition.x }
      : null;
  const lootTick = tickLoot(
    state.loot,
    state.lootSpec,
    state.lootTimer,
    delta,
    activeEnemies,
    facade,
    _nextLootId,
    deliveryGap,
  );
  if (lootTick.spawned) _nextLootId++;

  // 4a. Street couriers (livreurs): move them along the road and spawn new ones on
  // a timer BEFORE the shot resolves, so courier-on-miss (below) tests the current
  // positions. Friendly-fire resolution itself moved into `resolveTrigger` (P1).
  let couriers: readonly Courier[] = state.couriers;
  let courierTimer = state.courierTimer;
  let couriersSpawned = state.couriersSpawned;
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
  }

  // 4b. Player fires — the active weapon folds 1..3 instant hitscan resolutions
  // (ADR-0055 D2), each an ADR-0040 shot: window-priority (enemy OR VISIBLE crate)
  // then courier-only-on-miss, threading enemies+couriers+crate. Burst scheduling
  // (B) and equip-on-loot (P2) live in `resolveTrigger`. Reads the pre-hit enemy
  // snapshot, exactly like the enemy-fire step below. A level with no crate stays
  // on `base`, so this is byte-identical to the ADR-0040 single shot.
  const trigger = resolveTrigger(
    state.weapon,
    fire,
    delta,
    crosshair,
    activeEnemies,
    lootTick.loot,
    facade,
    courierField !== undefined ? couriers : [],
    cameraOffsetX,
    cameraOffsetY,
    viewW,
    viewH,
  );
  const shotEnemies = trigger.enemies;
  const impactEvents: readonly ImpactEvent[] = trigger.impacts;
  couriers = courierField !== undefined ? trigger.couriers : couriers;
  const pointFeedback: readonly PointHitEvent[] = trigger.pointFeedback;

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
  // `trigger.scoreDelta` already aggregates enemy rewards AND the per-resolution
  // courier penalties (P1 / AC5).
  const newScore = Math.max(0, state.score + trigger.scoreDelta + deliveryScoreDelta);
  const newKills = state.kills + trigger.targetsDown;

  // Continuous energy is moved only by the hostage QTE (handled in the frozen QTE
  // branch above); the normal tick leaves it unchanged.
  const newEnergy = state.energy;

  // 8. Enemy bullet hits player (near screen center y=0)
  const hitBulletIds = new Set<number>();
  let playerHit = false;
  for (const b of movedBullets) {
    if (b.fromPlayer) continue;
    if (Math.sqrt(b.position.x * b.position.x + b.position.y * b.position.y) <= PLAYER_HIT_RADIUS) {
      hitBulletIds.add(b.id);
      playerHit = true;
    }
  }
  const finalBullets = movedBullets.filter((b) => !hitBulletIds.has(b.id));

  // Lives change from being shot AND from mistakes (shooting a civilian courier).
  const feedbackEvents: readonly HitEvent[] = trigger.events;
  const newLives = state.lives - (playerHit ? 1 : 0) + trigger.livesDelta;

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: feedbackEvents,
      pointFeedback,
      impactEvents,
      couriers,
      courierTimer,
      couriersSpawned,
      energy: newEnergy,
      qteSpec: state.qteSpec,
      qte,
      deliveryVehicle,
      elapsedSeconds,
      kills: newKills,
      bullets: finalBullets,
      lives: 0,
      score: newScore,
      wave: newWave,
      phase: "GAME_OVER",
      weapon: trigger.weapon,
      loot: trigger.loot,
      lootSpec: state.lootSpec,
      lootTimer: lootTick.lootTimer,
      weaponEmpty: trigger.weaponEmpty,
    };
  }

  // 9. Tick timer (bonus enemies add seconds back)
  const timeRemaining = tickTimer(state.timeRemaining, delta) + trigger.timeDelta;
  if (timeRemaining <= 0) {
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: feedbackEvents,
      pointFeedback,
      impactEvents,
      couriers,
      courierTimer,
      couriersSpawned,
      energy: newEnergy,
      qteSpec: state.qteSpec,
      qte,
      deliveryVehicle,
      elapsedSeconds,
      kills: newKills,
      bullets: finalBullets,
      lives: newLives,
      score: newScore,
      wave: newWave,
      timeRemaining: 0,
      phase: "GAME_OVER",
      weapon: trigger.weapon,
      loot: trigger.loot,
      lootSpec: state.lootSpec,
      lootTimer: lootTick.lootTimer,
      weaponEmpty: trigger.weaponEmpty,
    };
  }

  // Quota met THIS tick (the kill that crossed the threshold landed here, so `state.kills`
  // was still below quota at the top). A boss-less level (every shipped level) still wins
  // abruptly. But when a boss IS authored, victory-by-quota must NOT complete the level here:
  // stay PLAYING with `kills` at/over quota so the boss block at the TOP of the NEXT tick sees
  // `state.kills >= enemiesToWin` and opens the duel via `shouldTriggerBossQte` (ADR-0051 D3).
  // Only VICTORY yields to the boss — the GAME_OVER branches above (lives/timer) stay immediate.
  const finalPhase =
    newKills >= enemiesToWin && state.bossQteSpec === null ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase: finalPhase,
    crosshair,
    enemies: shotEnemies,
    feedback: feedbackEvents,
    pointFeedback,
    impactEvents,
    couriers,
    courierTimer,
    couriersSpawned,
    energy: newEnergy,
    qteSpec: state.qteSpec,
    qte,
    // Boss QTE carried inert through normal play: it only triggers on quota-completion
    // (handled above), so here `bossQte` is always `state.bossQte` (null pre-trigger).
    bossQteSpec: state.bossQteSpec,
    bossQte: state.bossQte,
    deliverySpec: state.deliverySpec,
    deliveryVehicle,
    elapsedSeconds,
    kills: newKills,
    bullets: finalBullets,
    score: newScore,
    lives: newLives,
    timeRemaining,
    wave: newWave,
    // Weapon+loot resolved this tick (ADR-0055): active weapon / stock / burst,
    // the crate channel, and the one-tick empty flag.
    weapon: trigger.weapon,
    loot: trigger.loot,
    lootSpec: state.lootSpec,
    lootTimer: lootTick.lootTimer,
    weaponEmpty: trigger.weaponEmpty,
  };
}
