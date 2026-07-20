import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Courier } from "@game/types/courier";
import type { FacadeMap } from "@game/types/map";
import type { HitEvent, ImpactEvent, PointHitEvent } from "@game/types/feedback";
import type { LootCrate } from "@game/types/loot";
import type { WeaponKind, WeaponState } from "@game/types/weapon";
import { WEAPON_SPECS } from "@game/types/weapon";
import { VIEW_W, VIEW_H } from "@game/systems/crosshairSystem";
import { resolvePlayerShot } from "@game/systems/bulletSystem";
import { resolveCourierShot } from "@game/systems/courierSystem";

// The pure weapon orchestrator (ADR-0052 D2): one trigger → 1..3 §2.1 hitscan
// resolutions, folded sequentially left→centre→right, threading the enemy AND
// courier sets (so §2.4's no-double-billing and P1's per-offset courier-on-miss
// come for free). Burst scheduling (B) is pure tick state (D4); equip-on-loot
// ordering follows P2/D6. No React/Three, deterministic, unit-testable.

export interface TriggerResult {
  readonly weapon: WeaponState;
  readonly enemies: readonly Enemy[];
  readonly loot: LootCrate | null;
  readonly couriers: readonly Courier[];
  // Aggregate deltas for the tick (enemy rewards + per-resolution courier penalties).
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  readonly energyDelta: number;
  readonly targetsDown: number;
  readonly events: readonly HitEvent[];
  readonly pointFeedback: readonly PointHitEvent[];
  // 0-to-3 impacts (ADR-0052 D3); a loot-hit emits none (its own render channel).
  readonly impacts: readonly ImpactEvent[];
  // True on the exact tick a special empties and auto-returns to base (§6.1/AC10).
  readonly weaponEmpty: boolean;
}

function baseWeaponState(): WeaponState {
  return {
    active: "base",
    stock: WEAPON_SPECS.base.startStock,
    burstRemaining: 0,
    burstTimerMs: 0,
    refractoryMs: 0,
  };
}

export function resolveTrigger(
  weapon: WeaponState,
  fire: boolean,
  delta: number,
  crosshair: Crosshair,
  enemies: readonly Enemy[],
  loot: LootCrate | null,
  facade: FacadeMap,
  couriers: readonly Courier[],
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  viewW = VIEW_W,
  viewH = VIEW_H,
): TriggerResult {
  const spec = WEAPON_SPECS[weapon.active];
  const deltaMs = delta * 1000;

  // Advance the post-fire lockout first (base is always 0).
  const refractoryMs = Math.max(0, weapon.refractoryMs - deltaMs);
  let burstRemaining = weapon.burstRemaining;
  let burstTimerMs = weapon.burstTimerMs;

  // Decide the offsets to resolve this tick + whether this is a burst round (B).
  let offsets: readonly number[] = [];
  let roundEmitted = false; // an `auto` burst round fired this tick
  if (weapon.active === "auto") {
    if (burstRemaining > 0) {
      // Auto-sequenced: rounds fire on interval crossings, ≤1 per tick (D4).
      burstTimerMs += deltaMs;
      if (burstTimerMs >= spec.burstIntervalMs) {
        burstTimerMs -= spec.burstIntervalMs;
        offsets = spec.offsets;
        roundEmitted = true;
      }
    } else if (fire && refractoryMs <= 0) {
      // A trigger arms the burst; the first round fires on the next crossing.
      burstRemaining = spec.burstRounds;
      burstTimerMs = 0;
    }
    // Further `fire` while a burst is in flight is ignored (no branch above).
  } else if (fire && refractoryMs <= 0 && burstRemaining === 0) {
    // base / spread: a single trigger resolves the whole offset set this tick.
    offsets = spec.offsets;
  }

  // Fold the resolutions sequentially, threading enemies, the crate and couriers.
  let curEnemies = enemies;
  let curLoot = loot;
  let curCouriers = couriers;
  let scoreDelta = 0;
  let livesDelta = 0;
  let timeDelta = 0;
  let energyDelta = 0;
  let targetsDown = 0;
  const events: HitEvent[] = [];
  const pointFeedback: PointHitEvent[] = [];
  const impacts: ImpactEvent[] = [];
  let equipWeapon: WeaponKind | null = null;

  for (const dx of offsets) {
    const r = resolvePlayerShot(
      crosshair,
      curEnemies,
      facade,
      cameraOffsetX,
      cameraOffsetY,
      viewW,
      viewH,
      curLoot,
      dx,
    );
    curEnemies = r.enemies;
    if (r.outcome === "enemy-hit") {
      scoreDelta += r.scoreDelta;
      livesDelta += r.livesDelta;
      timeDelta += r.timeDelta;
      energyDelta += r.energyDelta;
      targetsDown += r.targetsDown;
      for (const e of r.events) events.push(e);
      impacts.push(r.impact);
    } else if (r.outcome === "loot-hit") {
      curLoot = r.loot; // consumed (null)
      // Right-most crate hit wins within a press (P2/D6); only one crate exists,
      // so this is at most a single assignment in practice.
      if (r.equippedWeapon !== undefined) equipWeapon = r.equippedWeapon;
    } else {
      // MISS: emit the impact and resolve courier-on-miss at THIS offset's point
      // (P1 — up to 3 courier resolutions/tick for C; empty courier set = no-op).
      impacts.push(r.impact);
      const cs = resolveCourierShot(r.impact.impactPoint, curCouriers);
      curCouriers = cs.couriers;
      scoreDelta += cs.scoreDelta;
      livesDelta += cs.livesDelta;
      for (const ev of cs.events) pointFeedback.push(ev);
    }
  }

  // Resolve the new weapon state.
  let newWeapon: WeaponState;
  let weaponEmpty = false;

  if (equipWeapon !== null) {
    // Equip takes effect immediately and aborts any remaining burst (P2/D6): the
    // equipped weapon is live from the NEXT trigger, at full stock. The prior
    // special's remaining stock is lost.
    const espec = WEAPON_SPECS[equipWeapon];
    newWeapon = {
      active: equipWeapon,
      stock: espec.startStock,
      burstRemaining: 0,
      burstTimerMs: 0,
      refractoryMs: 0,
    };
  } else if (weapon.active === "auto" && roundEmitted) {
    const stock = weapon.stock - 1; // one round consumed
    burstRemaining -= 1;
    if (stock <= 0) {
      // Empty mid-burst: end the burst and auto-return to base THIS tick (§2.3).
      newWeapon = baseWeaponState();
      weaponEmpty = true;
    } else if (burstRemaining <= 0) {
      newWeapon = { active: "auto", stock, burstRemaining: 0, burstTimerMs: 0, refractoryMs: spec.refractoryMs };
    } else {
      newWeapon = { active: "auto", stock, burstRemaining, burstTimerMs, refractoryMs };
    }
  } else if (weapon.active === "spread" && offsets.length > 0) {
    const stock = weapon.stock - 1; // one press consumed
    if (stock <= 0) {
      newWeapon = baseWeaponState();
      weaponEmpty = true;
    } else {
      newWeapon = { active: "spread", stock, burstRemaining: 0, burstTimerMs: 0, refractoryMs: spec.refractoryMs };
    }
  } else {
    // No consumption this tick: base (∞) or an idle/advancing special.
    newWeapon = {
      active: weapon.active,
      stock: weapon.stock,
      burstRemaining,
      burstTimerMs,
      refractoryMs,
    };
  }

  return {
    weapon: newWeapon,
    enemies: curEnemies,
    loot: curLoot,
    couriers: curCouriers,
    scoreDelta,
    livesDelta,
    timeDelta,
    energyDelta,
    targetsDown,
    events,
    pointFeedback,
    impacts,
    weaponEmpty,
  };
}
