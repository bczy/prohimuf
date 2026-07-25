import type { GameState } from "@game/types/gameState";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { HitEvent, ImpactEvent, PlayerHitEvent, PointHitEvent } from "@game/types/feedback";
import type { FacadeMap } from "@game/types/map";
import { tickTimer } from "@game/systems/timer";
import { moveCrosshair, crosshairToWorld } from "@game/systems/crosshairSystem";
import { spawnWave, tickEnemy } from "@game/systems/enemySystem";
import { tickBullets, aimBulletVelocity, hasPassedPlayer } from "@game/systems/bulletSystem";
import { sampleDiscJitter, makeBulletRng, AIM_JITTER_RADIUS } from "@game/systems/enemyFireSystem";
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
import {
  isQteActive,
  shouldTriggerQte,
  createQte,
  tickQte,
  QTE_RESULT_HOLD,
} from "@game/systems/qteSystem";
import {
  isBossQteActive,
  shouldTriggerBossFinale,
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

// Seconds of immunity granted by a hit. Short: it only swallows the instant
// double-tap (two windows resolving on the same or adjacent ticks). Damage
// magnitude, not immunity duration, is what keeps the game fair.
const PLAYER_INVULN_SECONDS = 0.4;

// Lives are tracked in quarter-heart steps. Every subtraction is snapped back
// onto that lattice so repeated 0.25 hits can't leave a 0.7499999 residue that
// would keep the player alive at "zero" hearts.
const LIVES_QUANTUM = 0.25;

function snapLives(lives: number): number {
  return Math.round(lives / LIVES_QUANTUM) * LIVES_QUANTUM;
}

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
  // GUARD (ADR-0059 D3 — sequential coexistence, Bertrand 2026-07-21: keep both hostage AND boss).
  // A level MAY author both a hostage QTE and a boss QTE, but only SEQUENTIALLY, never concurrently:
  // the boss is a TIMED FINALE (ADR-0059 Amendment 2) — `createBossQte` only ever fires at TIMER
  // EXPIRY, i.e. no earlier than `params.timeSeconds` of (non-frozen) play — and the hostage QTE
  // freezes BOTH `elapsedSeconds` and the timer while it's active (its early-return in `tickGameState`
  // runs before the timer-tick step), so the two clocks pause together. That means: as long as the
  // hostage's WORST CASE resolution (trigger + zoom + every peek blown + the result hold) finishes
  // before the timer could possibly reach 0, the hostage is ALWAYS long since resolved (rescued or
  // executed — either way the scene is free) by the time the boss is ever created. Assert that
  // margin here — fail LOUD at level load if a future retune (a shorter `timeSeconds`, a later
  // `triggerAtElapsedSeconds`, more `maxBlownPeeks`) ever closes it, rather than risk the hostage
  // QTE silently never triggering.
  if (hostageQteSpec !== null && bossQteSpec !== null) {
    const hostageWorstCaseEnd =
      hostageQteSpec.triggerAtElapsedSeconds +
      hostageQteSpec.zoomSeconds +
      hostageQteSpec.maxBlownPeeks * hostageQteSpec.peekCadenceSeconds +
      QTE_RESULT_HOLD;
    const SAFETY_MARGIN_SECONDS = 5;
    if (hostageWorstCaseEnd + SAFETY_MARGIN_SECONDS >= params.timeSeconds) {
      throw new Error(
        `LevelConfig invariant: hostageQte and bossQte are authored together but are not safely ` +
          `sequential — the hostage's worst-case resolution (${String(hostageWorstCaseEnd)}s) leaves ` +
          `less than the required ${String(SAFETY_MARGIN_SECONDS)}s margin before the level's ` +
          `timeSeconds (${String(params.timeSeconds)}s), when the timed-finale boss is created. ` +
          `Widen timeSeconds, move triggerAtElapsedSeconds earlier, or shrink maxBlownPeeks/` +
          `peekCadenceSeconds so the hostage always resolves well before the boss can exist.`,
      );
    }
  }
  return {
    phase: "PLAYING",
    crosshair: { position: { x: 0.5, y: 0.5 } },
    enemies: spawnWave(1, facade, windowPoolFor(roster)),
    bullets: [],
    score: 0,
    lives: params.lives,
    playerInvulnRemaining: 0,
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

  // Boss QTE encounter — "le Commandant" (ADR-0051 D3, retrigger amended by ADR-0059). Additive-
  // and-optional: this whole block is skipped when `bossQte === null` (EVERY shipped level, and a
  // boss level until its timer expires), so the quota-win path below is BYTE-FOR-BYTE unchanged
  // (the ADR-0051 D4 safety property, asserted by the `bossQteSpec === null` identity test).
  // The boss is now the level's TIMED FINALE: it is CREATED at TIMER EXPIRY (below), not on quota-
  // completion. This block only RUNS an already-created boss — it freezes the scene while ACTIVE,
  // and a boss WON completes the level (boss LOST fails it). The boss is NOT in the kill quota.
  if (state.bossQte !== null) {
    const bossQte = state.bossQte;
    if (isBossQteActive(bossQte)) {
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
        // The player's own shot stays VISIBLE during the frozen duel. This channel is
        // purely cosmetic (tracer + puff + shoot cue); the QTE keeps sole ownership of
        // the outcome, which is why the resolution is reported as a `miss` — the captor
        // is not a facade enemy, so there is no slot to anchor a `hit` on, and his real
        // damage read is his own HP pips. Emitted only on the tick the player actually
        // fires (`fire` is a consumed edge, one per press), so a non-firing frozen tick
        // still clears every transient channel exactly as before.
        impactEvents: fire ? [{ classification: "miss" as const, impactPoint }] : [],
        feedback: [],
        pointFeedback: [],
        // Weapon state (active/stock/burst) rides `...state` FROZEN through the duel
        // (ADR-0055 D7); only the transient empty flag is cleared.
        weaponEmpty: false,
      };
    }
    // The boss has resolved (phase DONE): a depleted `bossHp` WON the fight → the level
    // completes; the blown-window clock LOST it → the level fails. LEVEL_COMPLETE fires ONLY
    // on a boss win.
    if (bossQte.phase === "DONE") {
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

  // Victory is gated on the kill-count only (`countsAsTarget` takedowns), never on the score —
  // so the delivery bonus can never trigger the level win. On a BOSS level (ADR-0059) the quota
  // NEVER completes the level: the player plays the full timer and the boss is the finale, so the
  // quota stays a score-only target here.
  if (state.kills >= enemiesToWin && state.bossQteSpec === null) {
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
      // The player's own shot stays VISIBLE during the frozen duel. This channel is
      // purely cosmetic (tracer + puff + shoot cue); the QTE keeps sole ownership of
      // the outcome, which is why the resolution is reported as a `miss` — the captor
      // is not a facade enemy, so there is no slot to anchor a `hit` on, and his real
      // damage read is his own HP pips. Emitted only on the tick the player actually
      // fires (`fire` is a consumed edge, one per press), so a non-firing frozen tick
      // still clears every transient channel exactly as before.
      impactEvents: fire ? [{ classification: "miss" as const, impactPoint }] : [],
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
    // Aim jitter (ADR-0065): a deterministic per-bullet RNG offsets the aim
    // point inside a small disc, so enemy fire is threatening but not a
    // guaranteed hit when the player holds still.
    const jitter = sampleDiscJitter(makeBulletRng(_nextBulletId, enemy.id), AIM_JITTER_RADIUS);
    bullets = [
      ...bullets,
      {
        id: _nextBulletId,
        position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
        velocity: aimBulletVelocity(slot.screenPosition, {
          x: cameraOffsetX + jitter.x,
          y: cameraOffsetY + jitter.y,
        }),
        fromPlayer: false,
        // Per-archetype damage: a riot cop's round costs a full heart, a base
        // cop's a quarter. Read at spawn so it survives the shooter's death.
        damage: ARCHETYPES[enemy.kind].bulletDamage,
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

  // 8. Enemy bullet hits player (near camera centre)
  //
  // Invulnerability window: after a hit the player is immune for
  // PLAYER_INVULN_SECONDS. Bullets entering the disc during that window are
  // still absorbed (removed, so they can't hit again next tick) but cost no
  // life and raise no feedback event. Without this, two shooters firing on
  // consecutive ticks drain the whole 3-heart bar in a fraction of a second.
  const invulnAfterTick = Math.max(0, state.playerInvulnRemaining - delta);
  const invulnerable = invulnAfterTick > 0;
  const hitBulletIds = new Set<number>();
  let damageTaken = 0;
  const playerHitEvents: PlayerHitEvent[] = [];
  for (const b of movedBullets) {
    if (b.fromPlayer) continue;
    const dx = b.position.x - cameraOffsetX;
    const dy = b.position.y - cameraOffsetY;
    if (Math.sqrt(dx * dx + dy * dy) <= PLAYER_HIT_RADIUS) {
      hitBulletIds.add(b.id);
      // Absorbed but harmless: either the window from an earlier hit is still
      // open, or an earlier bullet THIS tick already opened one.
      if (invulnerable || damageTaken > 0) continue;
      damageTaken = b.damage;
      // ADR-0065 — surface the crossing point for render (red flash + shake).
      // Cosmetic-only: the `lives` rule below is unchanged.
      playerHitEvents.push({ worldPoint: { x: b.position.x, y: b.position.y } });
    }
  }
  const playerHit = damageTaken > 0;
  // Drop bullets consumed by a hit AND rounds that have already whistled past the
  // player — a missed round is spent, and leaving it in flight makes it grow then
  // shrink again, reading as a bounce off the camera.
  const finalBullets = movedBullets.filter(
    (b) =>
      !hitBulletIds.has(b.id) &&
      (b.fromPlayer || !hasPassedPlayer(b, cameraOffsetX, cameraOffsetY)),
  );
  // A fresh hit restarts the window; otherwise the countdown just runs down.
  const newInvulnRemaining = playerHit ? PLAYER_INVULN_SECONDS : invulnAfterTick;

  // Lives change from being shot (fractional, per shooter archetype) AND from
  // mistakes (shooting a civilian courier — a fault, so still a whole heart).
  const feedbackEvents: readonly HitEvent[] = trigger.events;
  const newLives = snapLives(state.lives - damageTaken + trigger.livesDelta);

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: feedbackEvents,
      pointFeedback,
      impactEvents,
      playerHitEvents,
      playerInvulnRemaining: newInvulnRemaining,
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
    // Timer expired. On a BOSS level (spec authored, none fired yet) the boss is the level's
    // TIMED FINALE (ADR-0059): CREATE it and stay in-play (phase PLAYING, timeRemaining 0) so the
    // boss block at the TOP of the NEXT tick freezes the scene and runs the duel — WON →
    // LEVEL_COMPLETE, LOST → GAME_OVER. There is NO quota gate for V1: the boss always caps the
    // timer. A non-boss level fails on timer expiry exactly as before (GAME_OVER, byte-identical).
    // The guard narrows `bossQteSpec` to non-null so `createBossQte` type-checks; `null` ⇒ no
    // finale (non-boss level, or a boss already born earlier this level) ⇒ the timeout loss.
    const finaleSpec = shouldTriggerBossFinale(state.bossQteSpec, state.bossQte)
      ? state.bossQteSpec
      : null;
    return {
      ...state,
      crosshair,
      enemies: shotEnemies,
      feedback: feedbackEvents,
      pointFeedback,
      impactEvents,
      playerHitEvents,
      playerInvulnRemaining: newInvulnRemaining,
      couriers,
      courierTimer,
      couriersSpawned,
      energy: newEnergy,
      qteSpec: state.qteSpec,
      qte,
      bossQte: finaleSpec !== null ? createBossQte(finaleSpec) : state.bossQte,
      deliveryVehicle,
      elapsedSeconds,
      kills: newKills,
      bullets: finalBullets,
      lives: newLives,
      score: newScore,
      wave: newWave,
      timeRemaining: 0,
      phase: finaleSpec !== null ? "PLAYING" : "GAME_OVER",
      weapon: trigger.weapon,
      loot: trigger.loot,
      lootSpec: state.lootSpec,
      lootTimer: lootTick.lootTimer,
      weaponEmpty: trigger.weaponEmpty,
    };
  }

  // Quota met THIS tick. A boss-less level (every shipped level) still wins abruptly. On a BOSS
  // level (ADR-0059) the quota NEVER completes the level: the player plays the full timer and the
  // boss caps it as the finale (created at timer expiry above), so stay PLAYING with `kills`
  // at/over quota (a score-only target here).
  const finalPhase =
    newKills >= enemiesToWin && state.bossQteSpec === null ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase: finalPhase,
    crosshair,
    enemies: shotEnemies,
    feedback: feedbackEvents,
    pointFeedback,
    impactEvents,
    playerHitEvents,
    playerInvulnRemaining: newInvulnRemaining,
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
