import type { Crosshair } from "@game/types/crosshair";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { Courier } from "@game/types/courier";
import type { HostageQte, QteSpec } from "@game/types/hostageQte";
import type { BossQte, BossQteSpec } from "@game/types/bossQte";
import type { DeliverySpec, DeliveryVehicle } from "@game/types/delivery";
import type { HitEvent, ImpactEvent, PlayerHitEvent, PointHitEvent } from "@game/types/feedback";
import type { WeaponState } from "@game/types/weapon";
import type { LootCrate, LootSpec } from "@game/types/loot";
import type { RunStats } from "@game/types/runStats";
import type { PhotoQte, PhotoQteSpec } from "@game/types/photoQte";
import type { PhotoLeverage } from "@game/types/photoLeverage";

export type Phase = "PLAYING" | "GAME_OVER" | "LEVEL_COMPLETE";

export interface GameState {
  readonly phase: Phase;
  readonly crosshair: Crosshair;
  readonly enemies: readonly Enemy[];
  readonly bullets: readonly Bullet[];
  readonly score: number;
  readonly lives: number;
  // Seconds of remaining post-hit immunity (0 = vulnerable). Ticked down every
  // frame and reset to PLAYER_INVULN_SECONDS by a hit, so a burst from several
  // windows costs one heart rather than one per bullet.
  readonly playerInvulnRemaining: number;
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
  // Photo QTE "paparazzi" set-piece (ADR-0077 / ADR-0080). `photoQteSpec` is the authored
  // per-level data (null = no set-piece — EVERY level but Belliard, and Belliard itself on a
  // run where `photoQteEnabled` is false); `photoQte` is the runtime sub-record (null until
  // triggered, then null again once the player has left). While it is active the general sim
  // is frozen and `elapsedSeconds` does not advance, so the beat costs the level timer ZERO
  // seconds. Additive-and-optional: `photoQteSpec === null` is byte-for-byte identical.
  readonly photoQteSpec: PhotoQteSpec | null;
  readonly photoQte: PhotoQte | null;
  // The MISSION-scoped attempt counter (spec §1.3.a, D-1) — the AUTHORITY behind
  // `PhotoQte.attemptIndex`. It counts entries (the first included) and is never reset while
  // this level state lives, so `[ RECOMMENCER ]` cannot mint itself a fresh budget by
  // re-creating the sub-record. Leaving Belliard and replaying it gives a fresh one, which is
  // what keeps ruling R3-6 (no rarity) intact.
  readonly photoQteAttempts: number;
  // The cross-level carry (ADR-0080), seeded from persisted storage by the bridge and read
  // by `createBossQte`. The pure layer NEVER reads storage — it reads this.
  readonly photoLeverage: PhotoLeverage;
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
  // — explosion, wall marks). 0 to 3 elements (ADR-0055 D3: C `spread` emits up
  // to 3 per tick; A/B emit ≤1). Render is already N-safe — the bridge drains the
  // list and ImpactEffects pools it, so the widening needs no render change.
  readonly impactEvents?: readonly ImpactEvent[];
  // Enemy bullets that hit the player this tick (transient; drives full-screen
  // red flash + camera shake — ADR-0065). Mirror of `impactEvents` in the
  // opposite direction. Optional so the pre-ADR-0065 shape stays valid.
  readonly playerHitEvents?: readonly PlayerHitEvent[];
  // Active weapon + special stock + burst tick state (ADR-0055 D1). Rule-owned;
  // seeded `base`/∞ and always `base` on a level with no `lootSpec` (byte-identical
  // to ADR-0040). Frozen through a QTE (rides `...state`, D7).
  readonly weapon: WeaponState;
  // The single in-flight armament crate, or null (ADR-0055 D5). Off the
  // `CORE_ARCHETYPES`/score-lives path — a crate hit equips only, never scores.
  readonly loot: LootCrate | null;
  // Per-level loot config (null = no crates this level; parallels `deliverySpec`).
  readonly lootSpec: LootSpec | null;
  // Countdown (seconds) to the next crate spawn attempt (parallels `courierTimer`).
  readonly lootTimer: number;
  // Set on the exact tick a special empties and auto-returns to `base` (§6.1,
  // AC10). Transient like `impactEvents`: one tick, consumed by the bridge (HUD
  // flash + culasse-à-vide SFX), never persisted. Distinct from `impactEvents`.
  readonly weaponEmpty?: boolean;
  // Run statistics accumulator (ADR-0076 D1). Holds ONLY what the tick destroys
  // and cannot be recovered from the terminal state: crate pickups, hearts lost
  // split by source, the starting gauge, and the latched delivery outcome. Folded
  // exactly once per tick, reset by construction at every new run. PRIVATE to the
  // pure layer — the render lane reads `RunSummary`, never this (D6).
  readonly stats: RunStats;
}
