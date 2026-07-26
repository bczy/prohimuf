import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { LootCrate, LootDrop, LootSpec } from "@game/types/loot";

// Pure armament-crate system (ADR-0055 D5): spawn (with the §5.4 exclusion rule)
// + the small HIDDEN→APPEARING→VISIBLE state machine. A crate is a NEW entity,
// structurally off the ARCHETYPES/score-lives path — nothing here touches score,
// lives or the enemy set; a crate hit is resolved by weaponSystem/bulletSystem.

// §5.4 — the crate's column must clear EVERY active engaged column by this gap.
export const LOOT_SPAWN_MIN_COL_GAP = 2;

// The crate's fixed world-y on the sidewalk strip (ADR-0056 D2, verify-tunable).
// Single source of truth: read by `bulletSystem.resolvePlayerShot` (crate hit-point)
// and by `LootCrate.tsx` (render mount) — the crate decouples its y from the window
// row, keeping only its x (slot.screenPosition.x). AC-D8 crop-clearance knob.
export const LOOT_STREET_Y = -4.3;

// Near-centre spawn bound (ADR-0056 D3): a candidate slot's |screenPosition.x| must
// be ≤ this, world-origin-anchored (the pure spawn can't read live camera pan —
// ADR-0003/0026 keep pan out of GameState). verify-tunable.
export const LOOT_MAX_ABS_X = 7;

// Delivery x-gap (ADR-0056 D9-2): when a vehicle is INCOMING/at its stop, the crate
// must not spawn within this world-x distance of the stop line. verify-tunable.
export const CRATE_DELIVERY_GAP_X = 2.0;

// Crate state durations, seconds (verify-tunable, §7 style — not gated). The
// HIDDEN wait mirrors the target convention; APPEARING is a drop-and-settle
// (ADR-0056 D5); VISIBLE is the pickable window, lengthened for a street object
// read off the resting frame (ADR-0056 D4).
export const LOOT_HIDDEN_DURATION = 0.4;
export const LOOT_APPEARING_DURATION = 0.45;
export const LOOT_VISIBLE_DURATION = 6.0;

function dropPool(spec: LootSpec): readonly LootDrop[] {
  if (spec.drops !== undefined && spec.drops.length > 0) return spec.drops;
  const weapons = spec.weapons ?? [];
  return weapons.map((weapon) => ({ weapon }));
}

// The §5.4 spawn-exclusion predicate (AC9): a candidate column is eligible iff it
// is ≥ LOOT_SPAWN_MIN_COL_GAP from EVERY active-engagement column. Empty ⇒ true.
export function canSpawnLootAt(col: number, activeCols: readonly number[]): boolean {
  return activeCols.every((a) => Math.abs(col - a) >= LOOT_SPAWN_MIN_COL_GAP);
}

// The columns the reticle is likely tracking: enemies mid-engagement only
// (APPEARING | VISIBLE | SHOOTING). HIDDEN/HIT/DEAD do not block a crate spawn.
export function activeEnemyCols(enemies: readonly Enemy[], facade: FacadeMap): number[] {
  const cols: number[] = [];
  for (const e of enemies) {
    if (e.state !== "APPEARING" && e.state !== "VISIBLE" && e.state !== "SHOOTING") continue;
    const slot = facade.slots[e.slotIndex];
    if (slot !== undefined) cols.push(slot.col);
  }
  return cols;
}

export interface LootTickResult {
  readonly loot: LootCrate | null;
  readonly lootTimer: number;
  // True on the tick a crate is created — the caller advances its id counter.
  readonly spawned: boolean;
}

// Pure delivery snapshot for the D9-2 x-gap (ADR-0056 D4). `stopX` is the vehicle's
// stop world-x. `null` ⇒ no active delivery this tick ⇒ the gap predicate is
// skipped. The phase-gate lives in `stateMachine`; `lootSystem` stays
// delivery-type-agnostic (a number in, never a `DeliveryVehicle`) — boundary law.
export interface DeliveryGap {
  readonly stopX: number;
}

// Advance an existing crate's state machine by `delta`; expiry removes it and
// re-arms the spawn timer to the configured interval.
function advanceCrate(
  loot: LootCrate,
  spec: LootSpec,
  lootTimer: number,
  delta: number,
): LootTickResult {
  const timer = loot.timer - delta;
  if (timer > 0) {
    return { loot: { ...loot, timer }, lootTimer, spawned: false };
  }
  switch (loot.state) {
    case "HIDDEN":
      return {
        loot: { ...loot, state: "APPEARING", timer: LOOT_APPEARING_DURATION },
        lootTimer,
        spawned: false,
      };
    case "APPEARING":
      return {
        loot: { ...loot, state: "VISIBLE", timer: LOOT_VISIBLE_DURATION },
        lootTimer,
        spawned: false,
      };
    default:
      // VISIBLE elapsed with no pickup: the crate is gone; re-arm the spawn timer.
      return { loot: null, lootTimer: spec.spawnIntervalSeconds, spawned: false };
  }
}

// Deterministic, replay-safe crate spawn: countdown, then place a HIDDEN crate on
// an eligible column (§5.4) with a weapon cycled from the pool. Unsatisfiable this
// tick ⇒ deferred (never force-placed), the timer stays elapsed so it retries.
function attemptSpawn(
  spec: LootSpec,
  lootTimer: number,
  delta: number,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  nextId: number,
  deliveryGap: DeliveryGap | null,
  excludeSlots: readonly number[],
): LootTickResult {
  const timer = lootTimer - delta;
  if (timer > 0) return { loot: null, lootTimer: timer, spawned: false };
  const drops = dropPool(spec);
  if (drops.length === 0) return { loot: null, lootTimer: 0, spawned: false };

  const activeCols = activeEnemyCols(enemies, facade);
  // Co-location guard (ADR-0055 D5, direction a): a crate must not sit on ANY
  // non-DEAD enemy's slot — including HIDDEN/HIT, which the §5.4 column-gap rule
  // (active states only) does not catch. Applied ALONGSIDE the column-gap rule.
  // …plus the slots the caller has reserved for something else entirely (the
  // delivery assault's window slots, ADR-0069 story / D2.8). Pure slot indices, so
  // `lootSystem` stays agnostic of WHY they are reserved — the same seam shape as
  // `deliveryGap`.
  const occupied = new Set(enemies.filter((e) => e.state !== "DEAD").map((e) => e.slotIndex));
  for (const slotIndex of excludeSlots) occupied.add(slotIndex);
  const eligible = facade.slots
    .map((slot, slotIndex) => ({ slotIndex, col: slot.col, x: slot.screenPosition.x }))
    .filter(
      (s) =>
        !occupied.has(s.slotIndex) &&
        canSpawnLootAt(s.col, activeCols) &&
        // Near-centre bound (ADR-0056 D3), world-origin-anchored.
        Math.abs(s.x) <= LOOT_MAX_ABS_X &&
        // Delivery x-gap (ADR-0056 D9-2); skipped when no vehicle is active.
        (deliveryGap === null || Math.abs(s.x - deliveryGap.stopX) >= CRATE_DELIVERY_GAP_X),
    );
  if (eligible.length === 0) return { loot: null, lootTimer: 0, spawned: false }; // deferred

  // Deterministic picks keyed on the crate id (the spawn sequence is replay-safe).
  const seed = Math.abs(nextId);
  const chosen = eligible[seed % eligible.length];
  if (chosen === undefined) return { loot: null, lootTimer: 0, spawned: false };
  const drop = drops[seed % drops.length] ?? drops[0];
  if (drop === undefined) return { loot: null, lootTimer: 0, spawned: false };

  return {
    loot: {
      id: nextId,
      slotIndex: chosen.slotIndex,
      state: "HIDDEN",
      timer: LOOT_HIDDEN_DURATION,
      weapon: drop.weapon,
      ...(drop.reward !== undefined ? { reward: drop.reward } : {}),
    },
    lootTimer: spec.spawnIntervalSeconds,
    spawned: true,
  };
}

// Tick the loot channel: advance a live crate, or count down and (maybe) spawn one.
// `deliveryGap` is the pre-computed pure delivery snapshot for the D9-2 x-gap
// (null ⇒ no active delivery this tick); defaults to null so callers without a
// delivery need not pass it. `excludeSlots` are slot indices the crate must never
// take (empty/omitted ⇒ the legacy eligibility, byte-for-byte).
export function tickLoot(
  loot: LootCrate | null,
  spec: LootSpec | null,
  lootTimer: number,
  delta: number,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  nextId: number,
  deliveryGap: DeliveryGap | null = null,
  excludeSlots: readonly number[] = [],
): LootTickResult {
  if (spec === null) return { loot: null, lootTimer, spawned: false };
  if (loot !== null) return advanceCrate(loot, spec, lootTimer, delta);
  return attemptSpawn(spec, lootTimer, delta, enemies, facade, nextId, deliveryGap, excludeSlots);
}
