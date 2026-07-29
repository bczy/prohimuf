import type { DeliverySpec } from "@game/types/delivery";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import type { EnemyKind } from "@game/types/enemy";
import type { LootSpec } from "@game/types/loot";

/**
 * Level authoring types (ADR-0074 §1). Type-only, zero runtime — and deliberately free of
 * any `@game/systems` import, so `types/` never depends on the simulation layer. The
 * catalogue itself lives in `@game/levels/levels.data`; the invariants that constrain these
 * shapes live in `@game/levels/validateLevel`.
 */

// Per-level roster gate (ADR-0004, D2). Optional and additive: absence is
// byte-for-byte identical to today's behaviour (default window pool +
// courier-only street). Belliard-first rollout — only `belliard` opts in.
export interface LevelRoster {
  // Override map for the window spawn pool, merged as `{ ...defaults, ...windowWeights }`.
  // A `weight: 0` entry removes that kind entirely.
  readonly windowWeights?: Partial<Record<EnemyKind, number>>;
  // The street entities active on this level. Absent ⇒ legacy courier-only.
  // `[]` ⇒ a silent street.
  readonly streetSpawns?: readonly ("courier" | "car" | "hostage_taker")[];
}

export interface LevelConfig {
  readonly id: string;
  /**
   * Discriminates a playable level from the scripted onboarding stage (ADR-0012, D1).
   * Absent ⇒ `"playable"`, so the three shipped levels stay byte-for-byte identical.
   * A `"tutorial"` entry carries inert gameplay fields (never read — every consumer
   * branches on `kind` first) and diegetic display fields (name/district/year, which
   * do render on the menu card).
   */
  readonly kind?: "playable" | "tutorial";
  readonly name: string;
  readonly district: string;
  readonly year: string;
  readonly enemySpeedMultiplier: number;
  readonly enemiesToWin: number;
  readonly timeSeconds: number;
  readonly unlocked: boolean; // default state (can be overridden by progress)
  /**
   * Scripted vehicle deliveries for this level (core loop `Livrer`). Extensible
   * to several; MVP authors exactly one. The seed of `GameState.deliveryVehicle`
   * reads `deliveries[0]`.
   */
  readonly deliveries: readonly DeliverySpec[];
  readonly roster?: LevelRoster;
  /**
   * Scripted hostage-taker cinematic QTE (ADR-0030). Absent ⇒ no QTE this level.
   * The seed of `GameState.qteSpec` reads this. Belliard-first.
   */
  readonly hostageQte?: QteSpec;
  /**
   * Scripted boss QTE encounter — "le Commandant" (ADR-0051). Absent ⇒ no boss. V1 authored it
   * only on the NON-SHIPPED `BOSS_QTE_DEV_HARNESS_LEVEL` (D4), deliberately EXCLUDED from the
   * shipped `LEVELS` array — the team's dev-only iteration surface. Since ADR-0053, the shipped
   * `niveau-final` level also authors one — the player's one canon meeting with le Commandant,
   * triggered on the real quota crossing. Every other shipped level still authors none. The
   * seed of `GameState.bossQteSpec` reads this.
   */
  readonly bossQteSpec?: BossQteSpec;
  /**
   * Armament-crate pickup config (ADR-0055 D8). Absent ⇒ no crates spawn ⇒ the
   * level's tick is byte-for-byte identical to ADR-0040 (weapon stays `base`/∞).
   * Belliard-first for V1; the seed of `GameState.lootSpec` reads this.
   */
  readonly loot?: LootSpec;
}
