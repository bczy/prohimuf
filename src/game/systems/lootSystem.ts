import type { Enemy } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import type { LootCrate, LootSpec } from "@game/types/loot";

// Pure armament-crate system (ADR-0052 D5): spawn (with the §5.4 exclusion rule)
// + the small HIDDEN→APPEARING→VISIBLE state machine. A crate is a NEW entity,
// structurally off the ARCHETYPES/score-lives path — nothing here touches score,
// lives or the enemy set; a crate hit is resolved by weaponSystem/bulletSystem.

// §5.4 — the crate's column must clear EVERY active engaged column by this gap.
export const LOOT_SPAWN_MIN_COL_GAP = 2;

// Crate state durations, seconds (verify-tunable, §7 style — not gated). The
// HIDDEN wait mirrors the target convention; APPEARING matches enemySystem's
// 0.3; VISIBLE is the pickable window.
export const LOOT_HIDDEN_DURATION = 0.4;
export const LOOT_APPEARING_DURATION = 0.3;
export const LOOT_VISIBLE_DURATION = 4.0;

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
): LootTickResult {
  const timer = lootTimer - delta;
  if (timer > 0) return { loot: null, lootTimer: timer, spawned: false };
  if (spec.weapons.length === 0) return { loot: null, lootTimer: 0, spawned: false };

  const activeCols = activeEnemyCols(enemies, facade);
  // Co-location guard (ADR-0052 D5, direction a): a crate must not sit on ANY
  // non-DEAD enemy's slot — including HIDDEN/HIT, which the §5.4 column-gap rule
  // (active states only) does not catch. Applied ALONGSIDE the column-gap rule.
  const occupied = new Set(enemies.filter((e) => e.state !== "DEAD").map((e) => e.slotIndex));
  const eligible = facade.slots
    .map((slot, slotIndex) => ({ slotIndex, col: slot.col }))
    .filter((s) => !occupied.has(s.slotIndex) && canSpawnLootAt(s.col, activeCols));
  if (eligible.length === 0) return { loot: null, lootTimer: 0, spawned: false }; // deferred

  // Deterministic picks keyed on the crate id (the spawn sequence is replay-safe).
  const seed = Math.abs(nextId);
  const chosen = eligible[seed % eligible.length];
  if (chosen === undefined) return { loot: null, lootTimer: 0, spawned: false };
  const weapon = spec.weapons[seed % spec.weapons.length] ?? spec.weapons[0];
  if (weapon === undefined) return { loot: null, lootTimer: 0, spawned: false };

  return {
    loot: {
      id: nextId,
      slotIndex: chosen.slotIndex,
      state: "HIDDEN",
      timer: LOOT_HIDDEN_DURATION,
      weapon,
    },
    lootTimer: spec.spawnIntervalSeconds,
    spawned: true,
  };
}

// Tick the loot channel: advance a live crate, or count down and (maybe) spawn one.
export function tickLoot(
  loot: LootCrate | null,
  spec: LootSpec | null,
  lootTimer: number,
  delta: number,
  enemies: readonly Enemy[],
  facade: FacadeMap,
  nextId: number,
): LootTickResult {
  if (spec === null) return { loot: null, lootTimer, spawned: false };
  if (loot !== null) return advanceCrate(loot, spec, lootTimer, delta);
  return attemptSpawn(spec, lootTimer, delta, enemies, facade, nextId);
}
