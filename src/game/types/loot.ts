import type { SpecialWeaponKind } from "@game/types/weapon";

// The armament crate — a NEW entity, NOT an `EnemyKind` (ADR-0052 D5). Kept
// structurally off the `ARCHETYPES`/score-lives path so a crate hit can never
// emit a stray `scoreDelta`/`livesDelta` (AC7-loot). Type-only module.

// Crate lifecycle — reuses the shipped window state-machine shape (§5.2, AC7-loot:
// HIDDEN → APPEARING → VISIBLE → …). A crate is resolvable (shootable) only while
// VISIBLE; expiry removes it (`GameState.loot` → null), there is no HIT/DEAD.
export type LootState = "HIDDEN" | "APPEARING" | "VISIBLE";

export interface LootCrate {
  readonly id: number;
  readonly slotIndex: number;
  readonly state: LootState;
  // Seconds left in the current state (mirrors `Enemy.timer`).
  readonly timer: number;
  // The special weapon this crate equips when shot (never "base", §5.2).
  readonly weapon: SpecialWeaponKind;
}

// Optional per-level loot config (ADR-0052 D8 — additive-and-optional). Absent on
// a level ⇒ no crates spawn ⇒ that level's tick is byte-for-byte identical to
// ADR-0040 (weapon stays `base`/∞). Belliard-first for V1.
export interface LootSpec {
  // Seconds between crate spawn attempts (the first crate spawns one interval in).
  readonly spawnIntervalSeconds: number;
  // The pool of special weapons a crate may carry (cycled deterministically).
  readonly weapons: readonly SpecialWeaponKind[];
}
