import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { HostageQte, QteSpec } from "@game/types/hostageQte";
import type { BossQte, BossQteSpec } from "@game/types/bossQte";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { HitEvent, ImpactEvent, PointHitEvent } from "@game/types/feedback";
import type { WeaponState } from "@game/types/weapon";
import type { LootCrate, LootSpec } from "@game/types/loot";

export type Phase = "PLAYING" | "GAME_OVER" | "LEVEL_COMPLETE";

export interface GameState {
  readonly phase: Phase;
  readonly crosshair: Crosshair;
  readonly enemies: readonly Enemy[];
  readonly bullets: readonly Bullet[];
  readonly score: number;
  readonly lives: number;
  readonly timeRemaining: number;
  readonly wave: number;
  // Seconds elapsed since the level started (drives the scripted delivery
  // trigger). Deterministic accumulator, independent of `timeRemaining`.
  readonly elapsedSeconds: number;
  // Count of `countsAsTarget` enemies neutralised so far. THE win gate is
  // `kills >= enemiesToWin` — never the score (so the delivery bonus, which
  // lands in `score`, can never trigger victory on its own).
  readonly kills: number;
  // Street couriers (livreurs) crossing the level, with a countdown to the next
  // entry and a running total spawned (drives id + entry direction).
  readonly couriers: readonly Courier[];
  readonly courierTimer: number;
  readonly couriersSpawned: number;
  // Continuous energy stat (0–100), init 100 (ADR-0004 D5 / ADR-0030). The hostage
  // QTE moves it in V1; reaching 0 has no special effect (pure clamp).
  readonly energy: number;
  // Hostage-taker cinematic QTE (ADR-0030). `qteSpec` is the authored per-level
  // data (null = no QTE this level); `qte` is the runtime sub-record (null until
  // triggered, then persists through DONE so it fires exactly once). While the QTE
  // is active the general sim is frozen (see stateMachine).
  readonly qteSpec: QteSpec | null;
  readonly qte: HostageQte | null;
  // Boss QTE encounter — "le Commandant" (ADR-0051). `bossQteSpec` is the authored
  // per-level data (null = no boss — EVERY shipped level in V1; only the non-shipped
  // Belliard dev-harness authors it, D4); `bossQte` is the runtime sub-record (null
  // until the kill quota is reached, then persists through DONE). While it is active the
  // general sim is frozen and the quota → LEVEL_COMPLETE transition is REPLACED by the
  // duel (D3). Additive-and-optional: `bossQteSpec === null` is byte-for-byte identical.
  readonly bossQteSpec: BossQteSpec | null;
  readonly bossQte: BossQte | null;
  // Scripted vehicle delivery (core loop `Livrer` — protect the vehicle).
  // `deliverySpec` is the authored data for this level (null = no delivery);
  // `deliveryVehicle` is its runtime state the render lane draws (phase,
  // world position, vehicleType, integrity, integrityMax, windowRemaining).
  readonly deliverySpec: DeliverySpec | null;
  readonly deliveryVehicle: DeliveryVehicle | null;
  // Takedown effects from the latest tick (transient; for floating feedback).
  readonly feedback?: readonly HitEvent[];
  // Courier-hit penalties this tick, anchored to world positions (transient).
  readonly pointFeedback?: readonly PointHitEvent[];
  // Player-shot impacts from the latest tick (transient; drives render effects
  // — explosion, wall marks). 0 to 3 elements (ADR-0052 D3: C `spread` emits up
  // to 3 per tick; A/B emit ≤1). Render is already N-safe — the bridge drains the
  // list and ImpactEffects pools it, so the widening needs no render change.
  readonly impactEvents?: readonly ImpactEvent[];
  // Active weapon + special stock + burst tick state (ADR-0052 D1). Rule-owned;
  // seeded `base`/∞ and always `base` on a level with no `lootSpec` (byte-identical
  // to ADR-0040). Frozen through a QTE (rides `...state`, D7).
  readonly weapon: WeaponState;
  // The single in-flight armament crate, or null (ADR-0052 D5). Off the
  // `ARCHETYPES`/score-lives path — a crate hit equips only, never scores.
  readonly loot: LootCrate | null;
  // Per-level loot config (null = no crates this level; parallels `deliverySpec`).
  readonly lootSpec: LootSpec | null;
  // Countdown (seconds) to the next crate spawn attempt (parallels `courierTimer`).
  readonly lootTimer: number;
  // Set on the exact tick a special empties and auto-returns to `base` (§6.1,
  // AC10). Transient like `impactEvents`: one tick, consumed by the bridge (HUD
  // flash + culasse-à-vide SFX), never persisted. Distinct from `impactEvents`.
  readonly weaponEmpty?: boolean;
}
