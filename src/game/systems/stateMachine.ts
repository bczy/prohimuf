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
import { isOnScreen } from "@game/systems/viewport";
import { tickBullets, aimBulletVelocity, hasPassedPlayer } from "@game/systems/bulletSystem";
import { sampleDiscJitter, makeBulletRng, AIM_JITTER_RADIUS } from "@game/systems/enemyFireSystem";
import { resolveTrigger } from "@game/systems/weaponSystem";
import { tickLoot } from "@game/systems/lootSystem";
import { tickDelivery, seedDeliveryVehicle } from "@game/systems/deliverySystem";
import {
  countAliveAssailants,
  reservedAssaultSlots,
  retireAssault,
  seatAssault,
} from "@game/systems/deliveryAssault";
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
  shouldTriggerBossFinale,
  createBossQte,
  tickBossQte,
} from "@game/systems/bossQteSystem";
import { applyEnergy, ENERGY_INITIAL } from "@game/systems/energySystem";
import { createRunStats, foldRunStats } from "@game/systems/runStatsSystem";
import { WEAPON_SPECS } from "@game/types/weapon";
import type { LootSpec } from "@game/types/loot";
import type { LevelModifier } from "@game/types/levelModifier";
import { CORE_ARCHETYPES, archetype, buildWeightedFrom } from "@game/types/enemyTypes";
import type { LevelRoster } from "@game/levels/levels";
import { hostageBossMarginIssue, deliveryBossMarginIssue } from "@game/levels/validateLevel";
import type { CoreEnemyKind, EnemyKind } from "@game/types/enemy";

// Resolve the active window pool from a roster: absent `windowWeights` ⇒ the
// frozen default path (spawnWave called without a pool), so AC1 holds.
function windowPoolFor(roster?: LevelRoster): readonly EnemyKind[] | undefined {
  const overrides = roster?.windowWeights;
  if (overrides === undefined) return undefined;
  const defaults = Object.fromEntries(
    (Object.keys(CORE_ARCHETYPES) as CoreEnemyKind[]).map((k) => [k, CORE_ARCHETYPES[k].weight]),
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
  /**
   * The verdict of the interstitial scene that preceded this level (ADR-0079 D4).
   * Absent / null ⇒ the build is BYTE-IDENTICAL to a run without any interstitial scene.
   *
   * The shell carries a value it never interprets; the only two effects it can have are
   * spelled out in `createInitialState` below and nowhere else — `src/render` never maps
   * an outcome to a number (ADR-0079 A5). It cannot cost a life: `LevelModifier` has no
   * field for one (gate A1, story AC5).
   */
  modifier?: LevelModifier | null;
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
  // Street half-width carrier for the delivery/boss guard's travel legs (render-owned,
  // same value `tickGameState` already receives). Optional: absent, the guard keeps
  // its width-independent bound instead of going blind.
  courierField?: CourierField,
): GameState {
  const deliverySpec = params.delivery ?? null;
  const hostageQteSpec = params.hostageQte ?? null;
  const bossQteSpec = params.bossQte ?? null;
  const lootSpec = params.loot ?? null;
  // The interstitial scene's residue (ADR-0079 D4), spent exactly once, here. Two
  // effects, no third: the initial energy capital and the first-wave hold. Absent ⇒ both
  // are the pre-feature values.
  const modifier = params.modifier ?? null;
  // Borné à 0 : une valeur négative ferait porter à l'état une durée de maintien
  // absurde, que le tick décrémenterait sans jamais l'atteindre. Le verdict du portrait
  // ne produit que 0/10/20, mais un niveau AUTEUR peut écrire ce champ — et le reste de
  // cette couche est total par principe (Copilot review, 2026-08-11).
  const waveHoldRemaining = Math.max(0, modifier?.firstWaveDelaySeconds ?? 0);
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
  // The arithmetic itself lives in `validateLevel.ts` (ADR-0074 §3): ONE predicate, two exits
  // — reported as an issue by `validateLevel`, thrown here. Fail-loud-at-load is a different
  // contract from report-and-return: a level violating the margin must not boot.
  const marginIssue = hostageBossMarginIssue({
    hostageQte: hostageQteSpec,
    bossQteSpec,
    timeSeconds: params.timeSeconds,
  });
  if (marginIssue !== null) {
    throw new Error(marginIssue.message);
  }
  // GUARD (panel PR #143 follow-up — the delivery mirror of the guard above). The boss
  // branch of `tickGameState` early-returns before the delivery block, so a delivery still
  // in flight when the timed finale fires would freeze on screen forever. Same ADR-0074 §3
  // shape: the arithmetic lives in `validateLevel.ts`, thrown here with the REAL street
  // half-width when the caller supplies it (useGameLoop always does).
  const deliveryMarginIssue = deliveryBossMarginIssue({
    delivery: deliverySpec,
    bossQteSpec,
    timeSeconds: params.timeSeconds,
    streetHalfWidth: courierField?.halfWidth,
  });
  if (deliveryMarginIssue !== null) {
    throw new Error(deliveryMarginIssue.message);
  }
  return {
    phase: "PLAYING",
    crosshair: { position: { x: 0.5, y: 0.5 } },
    // The delivery's assault slots are reserved for the WHOLE level, wave 1
    // included (D2.8 / K-8): the ignore case never rolls a wave over (no kills ⇒
    // `allDead` false), so wave 1's seating IS the seating the objective runs
    // against. No delivery ⇒ no reservation ⇒ the legacy `spawnWave` path.
    // Held first wave (ADR-0079 D4): the street starts EMPTY and the same guard that
    // gates the tick's spawn branch decides when wave 1 seats. Seeding a wave here and
    // hiding it would be a second rule.
    enemies:
      waveHoldRemaining > 0
        ? []
        : spawnWave(1, facade, windowPoolFor(roster), reservedAssaultSlots(facade, deliverySpec)),
    bullets: [],
    score: 0,
    lives: params.lives,
    playerInvulnRemaining: 0,
    timeRemaining: params.timeSeconds,
    wave: 1,
    waveHoldRemaining,
    elapsedSeconds: 0,
    kills: 0,
    couriers: [],
    courierTimer: FIRST_COURIER_DELAY,
    couriersSpawned: 0,
    // The existing clamp is REUSED (ADR-0079 D4), so a malus can never produce a
    // negative or out-of-range capital — and a hypothetical bonus would be silently
    // clamped away, which is precisely why gate A1c deleted the reward rather than
    // making it ineffective.
    energy: applyEnergy(ENERGY_INITIAL, modifier?.energyDelta ?? 0),
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
    // Run statistics (ADR-0076 D1). A run is one attempt on one level (spec F1),
    // so the record is empty by construction here — never reset mid-run. Seeded
    // from the player's gauge preference, not a constant.
    stats: createRunStats(params.lives),
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
    return {
      ...state,
      impactEvents: [],
      feedback: [],
      pointFeedback: [],
      // The fatal hit's flash was emitted once on the transition tick; the bridge
      // drains it every tick, so re-spreading it here (via `...state`) would replay
      // the full-screen red flash + shake ~60×/s for the whole terminal screen
      // (a photosensitivity hazard). Clear it like every other transient channel.
      playerHitEvents: [],
      weaponEmpty: false,
    };
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
        // A hit landed the tick before the finale created the boss would otherwise
        // ride `...state` and replay every frozen tick — clear it like the others.
        playerHitEvents: [],
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
        playerHitEvents: [],
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
      playerHitEvents: [],
      weaponEmpty: false,
    };
  }

  // The held first wave (ADR-0079 D4) is a GIFT OF TIME: it must not be paid for with the
  // level's own clock, or the payoff funds itself and the reward is nil. So while the hold
  // runs, the THREE level clocks — `elapsedSeconds` (the delivery/QTE script), `timeRemaining`
  // (the level timer) and `courierTimer` (the street's spawn clock) — are frozen, exactly as
  // they are during a QTE beat: the street is empty, nothing the level scripts can happen yet.
  // Everything else keeps ticking (crosshair, bullets, energy): the player may move and shoot
  // into an empty street, they simply do not spend the level for it.
  // Decremented HERE rather than at the spawn guard below so both readers see one value.
  const waveHoldRemaining = Math.max(0, state.waveHoldRemaining - delta);
  const levelDelta = waveHoldRemaining > 0 ? 0 : delta;

  // Deterministic elapsed-time accumulator, drives the scripted delivery trigger.
  const elapsedSeconds = state.elapsedSeconds + levelDelta;

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
      // A hit landed the tick before the QTE triggered would otherwise ride `...state`
      // and replay every frozen tick — clear it like the other transient channels.
      playerHitEvents: [],
      // Weapon+stock ride `...state` FROZEN through the QTE (ADR-0055 D7 / AC6); no
      // weapon/loot logic runs in this branch. Clear only the transient empty flag.
      weaponEmpty: false,
    };
  }

  // An enemy is "on screen" when the centre of the window it occupies is inside
  // the camera rectangle. An enemy seated on a slot the facade does not define
  // has no position at all ⇒ treated as off screen (fail-safe).
  const enemyOnScreen = (e: Enemy): boolean => {
    const slot = facade.slots[e.slotIndex];
    if (slot === undefined) return false;
    return isOnScreen(slot.screenPosition, cameraOffsetX, cameraOffsetY, viewW, viewH);
  };

  // 2. Tick enemies. Off-screen ones are FROZEN (state held, countdown paused),
  // so an enemy the player cannot see never reaches SHOOTING and never fires —
  // the rule is enforced at the transition, not at the muzzle.
  const tickedEnemies = state.enemies.map((e) => tickEnemy(e, delta, enemyOnScreen(e)));

  // The delivery's reserved assault slots, computed ONCE for the whole tick: every
  // slot consumer below must honour them (the wave rollover AND the crate spawn),
  // or a wave cop / a crate squats an ambush window and the objective silently
  // loses an assailant (D2.8, found twice in review as K-3 then K-8). Empty for a
  // level with no delivery, so those levels stay on the legacy paths.
  const reservedSlots = reservedAssaultSlots(facade, state.deliverySpec);

  // 3. Spawn new wave if all enemies dead — unless the first wave is still HELD
  // (ADR-0079 D4). ONE guard on ONE branch: while the hold is live neither the spawn nor
  // the wave rollover fires, both of which sit downstream of `allDead`, so an empty
  // street cannot silently inflate `wave` to 4 before the first enemy appears. The hold
  // is decremented above and the guard reads the POST-decrement value, so the wave seats on
  // the tick the hold reaches 0 rather than one frame later.
  //
  // `tickedEnemies.length > 0` is NOT belt-and-braces: `every()` on an EMPTY array is `true`,
  // so on the tick the hold expires the still-empty street read as "all dead" and rolled the
  // wave over — the level the player EARNED started at wave 2 and the payoff became a
  // punishment. A wave rollover requires a wave that was actually played.
  const allDead =
    waveHoldRemaining <= 0 &&
    tickedEnemies.length > 0 &&
    tickedEnemies.every((e) => e.state === "DEAD");
  // The hold's own release: the tick it reaches 0, wave 1 SEATS — same wave number, the
  // one `createInitialState` refused to seat. It is a distinct event from a rollover
  // precisely because it must not increment `wave`.
  const holdReleased = state.waveHoldRemaining > 0 && waveHoldRemaining <= 0;
  const newWave = allDead ? state.wave + 1 : state.wave;
  // On a wave rollover, exclude the live crate's slot so a fresh enemy never seats
  // on it (ADR-0055 D5 co-location guard, direction b). `state.loot` is the pre-tick
  // crate; its slot is stable across the tick. The assault's reserved slots are
  // excluded ALONGSIDE it — a UNION, never a replacement, or D5 reopens in silence.
  const activeEnemies: readonly Enemy[] =
    allDead || holdReleased
      ? spawnWave(newWave, facade, windowPoolFor(roster), [
          ...(state.loot !== null ? [state.loot.slotIndex] : []),
          ...reservedSlots,
        ])
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
    // `levelDelta`, NOT `delta`: the crate clock is a LEVEL script, so it freezes for
    // the same reason and the same duration as `courierTimer` and `timeRemaining`
    // during the wave hold. With the raw delta it kept counting, and since the street
    // is empty during the hold the spawn guard is vacuously true for every column —
    // a crate appeared on an empty street before wave 1's first enemy, contradicting
    // ADR-0079 D4's "nothing the level scripts can happen yet" (panel MAJEUR).
    levelDelta,
    activeEnemies,
    facade,
    _nextLootId,
    deliveryGap,
    // Same seam as `deliveryGap`: the stateMachine knows the delivery types and
    // hands `lootSystem` pure slot indices, so a crate can never squat an ambush
    // window before the delivery arms (`CRATE_DELIVERY_GAP_X` only guards the
    // INCOMING | DELIVERING phases).
    reservedSlots,
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
    courierTimer -= levelDelta;
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
        damage: archetype(enemy.kind).bulletDamage,
      },
    ];
  }

  // 6. Tick bullets (only enemy bullets travel now — the player shot is hitscan).
  const movedBullets = tickBullets(bullets, delta);

  // 7c. Scripted vehicle delivery (core loop `Livrer` — protect the vehicle).
  // The vehicle is chipped by its OWN scripted assault — two enemies seated at the
  // reserved window slots next to the stop position when it starts rolling in — for
  // as long as they are ALIVE, and by nothing else (`deliveryAssault`, D1/D2).
  // There is NO camera term and no pop-up-state term in that rule, so no camera
  // position and no pan timing can make the objective free. Shares the courier
  // street lane, so it only runs when a courier field is supplied.
  let deliveryVehicle: DeliveryVehicle | null = state.deliveryVehicle;
  let deliveryScoreDelta = 0;
  // The delivery's terminal transition THIS tick, hoisted out of the branch below
  // so the run record can latch it (ADR-0076 D3 / spec D2.2.2). The vehicle runs on
  // to GONE right after, and then the outcome is unreadable from the state.
  let deliveryOutcomeThisTick: "SUCCESS" | "FAILED" | null = null;
  // The enemy array carried to EVERY return site below (the seating appends to it,
  // the retirement rewrites it) — one variable, so no return can miss it.
  let finalEnemies: readonly Enemy[] = shotEnemies;
  if (state.deliverySpec !== null && deliveryVehicle !== null && courierField !== undefined) {
    // Counted on the POST-shot array: an assailant the player just took down must
    // not still be charged to the gauge, which is the "engaging punishes the van"
    // flavour this rule exists to delete.
    const assailantCount = countAliveAssailants(shotEnemies);
    const result = tickDelivery(
      deliveryVehicle,
      state.deliverySpec,
      elapsedSeconds,
      assailantCount,
      courierField,
      delta,
    );
    const wasPhase = deliveryVehicle.phase;
    deliveryVehicle = result.vehicle;
    deliveryScoreDelta = result.scoreDelta;

    if (wasPhase === "IDLE" && deliveryVehicle.phase === "INCOMING") {
      // Seat the assault one roll-in BEFORE the damage window opens: the roll-in
      // becomes a real telegraph and a present player can clear the ambush
      // pre-emptively. Damage is phase-gated to DELIVERING, so an early seating can
      // never chip.
      finalEnemies = [
        ...shotEnemies,
        ...seatAssault(
          facade,
          state.deliverySpec,
          windowPoolFor(roster),
          shotEnemies,
          trigger.loot?.slotIndex ?? null,
        ),
      ];
    } else if (
      wasPhase === "DELIVERING" &&
      (deliveryVehicle.phase === "SUCCESS" || deliveryVehicle.phase === "FAILED")
    ) {
      // The escort leaves when the van leaves (D3): no score, no kill credit, no
      // quota credit — and `allDead` becomes reachable again.
      finalEnemies = retireAssault(shotEnemies);
      deliveryOutcomeThisTick = deliveryVehicle.phase;
    }
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

  // Run statistics — THE single fold point of the tick (ADR-0076 D3). Placed right
  // after `newLives` because every countable fact of the tick exists by now; the
  // three return sites below carry the result. The six early returns above it are
  // frozen or terminal and produce no countable event by construction, so `stats`
  // rides through them unchanged via `...state` (asserted by a test).
  const stats = foldRunStats(state.stats, {
    crateSpawned: lootTick.spawned,
    // A crate is consumed only by a shot; expiry already happened inside `tickLoot`.
    // Structurally exactly 1 pickup under a spread volley (spec AC-4): offsets 2
    // and 3 no longer see the crate.
    cratePicked: lootTick.loot !== null && trigger.loot === null,
    damageTaken,
    // `trigger.livesDelta` mixes faults with crate heart rewards; only the courier
    // term is a loss (spec D2.3.2). It is a negative delta — the record counts
    // magnitudes.
    faultLivesLost: -trigger.faultLivesDelta,
    // The gauge BEFORE this tick's deltas — the clip reference for both terms, so a
    // blow bigger than what is left is charged only for what it really took.
    livesBefore: state.lives,
    deliveryOutcome: deliveryOutcomeThisTick,
    deliveryIntegrity: deliveryVehicle?.integrity ?? null,
  });

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: finalEnemies,
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
      waveHoldRemaining,
      phase: "GAME_OVER",
      weapon: trigger.weapon,
      loot: trigger.loot,
      lootSpec: state.lootSpec,
      lootTimer: lootTick.lootTimer,
      weaponEmpty: trigger.weaponEmpty,
      stats,
    };
  }

  // 9. Tick timer (bonus enemies add seconds back)
  const timeRemaining = tickTimer(state.timeRemaining, levelDelta) + trigger.timeDelta;
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
      enemies: finalEnemies,
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
      waveHoldRemaining,
      timeRemaining: 0,
      phase: finaleSpec !== null ? "PLAYING" : "GAME_OVER",
      weapon: trigger.weapon,
      loot: trigger.loot,
      lootSpec: state.lootSpec,
      lootTimer: lootTick.lootTimer,
      weaponEmpty: trigger.weaponEmpty,
      stats,
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
    enemies: finalEnemies,
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
    waveHoldRemaining,
    // Weapon+loot resolved this tick (ADR-0055): active weapon / stock / burst,
    // the crate channel, and the one-tick empty flag.
    weapon: trigger.weapon,
    loot: trigger.loot,
    lootSpec: state.lootSpec,
    lootTimer: lootTick.lootTimer,
    weaponEmpty: trigger.weaponEmpty,
    stats,
  };
}
