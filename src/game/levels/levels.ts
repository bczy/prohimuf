import type { Prefs } from "@game/systems/prefsSystem";
import type { DeliverySpec } from "@game/types/delivery";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import type { EnemyKind } from "@game/types/enemy";
import type { LootSpec } from "@game/types/loot";

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
   * Scripted boss QTE encounter — "le Commandant" (ADR-0051). Absent ⇒ no boss. In V1 the
   * ONLY level carrying it is the NON-SHIPPED `BOSS_QTE_DEV_HARNESS_LEVEL` (D4), which is
   * deliberately EXCLUDED from the shipped `LEVELS` array — no shipped level authors a boss,
   * so no shipped player can reach the required gate. The seed of `GameState.bossQteSpec`
   * reads this.
   */
  readonly bossQteSpec?: BossQteSpec;
  /**
   * Armament-crate pickup config (ADR-0055 D8). Absent ⇒ no crates spawn ⇒ the
   * level's tick is byte-for-byte identical to ADR-0040 (weapon stays `base`/∞).
   * Belliard-first for V1; the seed of `GameState.lootSpec` reads this.
   */
  readonly loot?: LootSpec;
}

export const LEVELS: readonly LevelConfig[] = [
  // Optional, scripted, informative-only onboarding stage (ADR-0012). Prepended so it
  // is the first menu card, ahead of Rue Belliard, without inventing a composite menu
  // order. Gameplay fields are inert (never read — consumers branch on `kind` first);
  // name/district/year are diegetic copy that renders on the card.
  {
    id: "tutorial",
    kind: "tutorial",
    name: "Tutoriel",
    district: "Repérage",
    year: "1998",
    enemySpeedMultiplier: 1,
    enemiesToWin: 0,
    timeSeconds: 0,
    unlocked: true,
    deliveries: [],
  },
  {
    id: "belliard",
    name: "Rue Belliard",
    district: "19e Arrondissement",
    year: "1998",
    enemySpeedMultiplier: 1.0,
    enemiesToWin: 10,
    timeSeconds: 90,
    unlocked: true,
    deliveries: [
      {
        vehicleType: "truck",
        triggerAtElapsedSeconds: 20,
        integrity: 100,
        windowSeconds: 8,
        bonus: 500,
        entrySide: "left",
        // y: as low as the default 16:9 cover framing allows while keeping the whole
        // vehicle (and its neon rim) on screen. The facade art's road strip sits below
        // the 16:9 bottom edge, so the vehicle rides the curb line just under the
        // shopfronts — going lower (toward -4.6) clips its wheels off frame. Was -4,
        // which floated it up onto the sidewalk.
        stopPosition: { x: 0, y: -4.5 },
      },
    ],
    // Belliard-first rollout gate (ADR-0004 D2). Courier street only; the hostage
    // taker is no longer a window/street pop-up — it triggers the cinematic QTE
    // below (ADR-0030). The car remains withdrawn.
    roster: { streetSpawns: ["courier"] },
    // Hostage-taker QTE — "the static duel" (revises ADR-0034 after playtest; tuning
    // per spec-hostage-qte §5). Scripted set-piece, once per level. Values are
    // game-designer defaults (tunable; F3/ADR-0035 curves them across levels). `anchor`
    // is the captor's STATIC world position the camera zooms onto and holds — ON THE
    // SIDEWALK, in the street lane where couriers ride (streetY = −0.4 × worldHeight
    // 12 = −4.8): centre −5 puts the 2.0-tall tableau's feet on the ground line at −6.
    // He stands still; the sole clock is `maxBlownPeeks` blown openings before the
    // execution (the retreat/distance clock is removed).
    hostageQte: {
      triggerAtElapsedSeconds: 12,
      zoomSeconds: 2,
      // x nudged off the origin so the tableau reads against a facade at the ×2.4
      // zoom. Under ADR-0057's single-wide opaque décor there is no longer a sky
      // gap at x=0 (the old black-void regression, PR #76), so 9.9 is now kept as
      // a design constant: x_norm 0.655 = solid facade, clear of the passage
      // (0.39) and the pignon (0.80) per the street-wide repositioning spec.
      anchor: { x: 9.9, y: -5 },
      maxBlownPeeks: 4,
      peekCadenceSeconds: 1.5,
      // Rebalanced for the spatial-colour ring: the exposure runs 1.5 s so each peek presents
      // ~4 decelerating (zero-velocity) firing windows as the ring roams the wider anatomy box.
      peekDurationSeconds: 1.5,
      // Captor hit points — the kill currency (spatial-colour revision). 3 HP ⇒ two VITAL
      // ring hits (2 each) or a VITAL + a LIMB deplete the rescue.
      captorHp: 3,
      // Fixed authored seed for the deterministic, replay-safe ring wander (F3 may curve it).
      // K-5 PIN (re-pinned for the hitbox-diagram bands + roam): with peekDuration 1.5 /
      // LEG_DURATION 0.38 (4 decel waypoints/peek) this seed presents ≥1 on-captor (vital∪limb)
      // decelerating window in EVERY one of the 4 peeks (per-peek counts 3/2/4/3).
      targetSeed: 20260718,
    },
    // Belliard-first armament crates (ADR-0055 D8). Generic window spawn (pm ruling
    // #3), not per-level scripted placement. Cadence/pool are verify-tunable (§7),
    // not gated: a crate every ~15 s, carrying `auto` or `spread`.
    loot: {
      spawnIntervalSeconds: 15,
      weapons: ["auto", "spread"],
    },
  },
  {
    id: "stalingrad",
    name: "Stalingrad",
    district: "19e Arrondissement",
    year: "1998",
    enemySpeedMultiplier: 1.3,
    enemiesToWin: 12,
    timeSeconds: 80,
    unlocked: false,
    deliveries: [
      {
        vehicleType: "car",
        triggerAtElapsedSeconds: 25,
        integrity: 80,
        windowSeconds: 7,
        bonus: 400,
        entrySide: "right",
        stopPosition: { x: -2, y: -4.5 },
      },
    ],
  },
  {
    id: "vitry",
    name: "Vitry — 94",
    district: "Val-de-Marne",
    year: "1998",
    enemySpeedMultiplier: 1.6,
    enemiesToWin: 15,
    timeSeconds: 70,
    unlocked: false,
    deliveries: [
      {
        vehicleType: "moto",
        triggerAtElapsedSeconds: 18,
        integrity: 60,
        windowSeconds: 6,
        bonus: 300,
        entrySide: "left",
        stopPosition: { x: 2, y: -4.5 },
      },
    ],
    // Hostage-taker QTE — the peak-difficulty escalation (F4 / ADR-0036): the shipped
    // static duel with an ACCOMPLICE (a second shooter) as its SINGLE distinguishing
    // variable. The duel body is held ≈ Belliard (one-variable-at-a-time) — the accomplice
    // owns the player-directed fire, so the captor's own counter-fire is suppressed and the
    // ~−32 passive-ignore drain simply arrives on the accomplice's separately-telegraphed
    // clock instead of the peek clock (net-neutral). Vitry-only (advanced level; not the
    // Belliard teaching duel).
    hostageQte: {
      triggerAtElapsedSeconds: 10,
      zoomSeconds: 2,
      anchor: { x: 0, y: -5 },
      maxBlownPeeks: 4,
      peekCadenceSeconds: 1.5,
      peekDurationSeconds: 1.5,
      captorHp: 3,
      // K-5 PIN (re-verified, dev-gameplay/stage-5): with peekDuration 1.5 / LEG_DURATION
      // 0.38 (4 decel waypoints/peek) this seed presents ≥1 on-captor (vital∪limb)
      // decelerating window in EVERY one of the 4 peeks (accomplice does not affect the
      // wander — Belliard's pinning logic transfers). Re-pinned from the 19940714 placeholder,
      // which failed peek 1 (0 on-captor windows).
      targetSeed: 19940715,
      // The escalation: a second gun firing every 2.8 s (≈4 shots over the ~11–12 s to reach
      // maxBlownPeeks ⇒ ≈−32, matching the preserved passive-ignore figure).
      accomplice: { fireIntervalSeconds: 2.8 },
    },
  },
  // Niveau Final — l'Éden, 31 déc 1999 (STORY-BOSS-NIVEAU-FINAL-LIVE / ADR-0053). The one canon,
  // progression-gated level that ships the ADR-0051/0052 boss "le Commandant" LIVE. Appended after
  // Vitry so the existing index-based unlock hop (App.tsx `LEVELS[shippedIdx + 1]` on
  // LEVEL_COMPLETE) auto-unlocks it — no new unlock code. Pre-boss street is the hardest gallery
  // (spec-boss-niveau-final-level §1): speed 1.8 / quota 16 / timer 70 (monotonic-hardest vs Vitry,
  // each step deliberately modest). The boss is the terminal beat on the REAL quota crossing
  // (enemiesToWin 16, non-zero — NOT the harness `0` instant-trigger, AC4). It authors NO
  // `hostageQte` (AC1 — mutual exclusion by construction; civilian/hostage_taker keep default
  // weight 0 and stay out of the window pool). `bossQteSpec` is a value-for-value copy of the tuned
  // harness combat block (zoom 2 / phase 3 / bossHp 24 / maxBlownWindows 10 / anchor {0,-5}) with
  // ONLY `targetSeed` re-pinned (19991231, the diegetic date — winnability re-verified per the K-5
  // discipline) and `decorProp` re-sited to the hall chandelier — no system value smuggled as data
  // (AC5). `bossQteSystem.ts` / `types/bossQte.ts` stay byte-untouched.
  {
    id: "niveau-final",
    // Player-facing name — narrative-designer's one-field canonical value (fiction spec §4),
    // mirrors the "Vitry — 94" convention (the millennium date is the finale's meaningful tag).
    name: "L'Éden — 31 déc. 1999",
    district: "Paris",
    year: "1999",
    enemySpeedMultiplier: 1.8,
    enemiesToWin: 16,
    timeSeconds: 70,
    unlocked: false, // unlocked by clearing Vitry via the existing index hop
    deliveries: [
      {
        // The crew's sound-system rig — "livre le son" to the hall. Held ≈ Vitry (integrity 60 /
        // window 6 s), not tightened: the escalation is carried by speed + quota + the boss.
        vehicleType: "truck",
        triggerAtElapsedSeconds: 18,
        integrity: 60,
        windowSeconds: 6,
        bonus: 300,
        entrySide: "left",
        stopPosition: { x: 0, y: -4.5 },
      },
    ],
    // Riot-heavy window mix (2-HP CRS `enemy_riot` is the thematic finale enemy and the honest
    // source of "harder without a new mechanic"); bonus kept near default as the 70 s time valve.
    // civilian/hostage_taker are NOT overridden ⇒ they keep default weight 0 (AC1).
    roster: {
      streetSpawns: ["courier"],
      windowWeights: { normal: 40, riot: 28, biker: 20, bonus: 10 },
    },
    // NO hostageQte (AC1) — mutual-exclusion invariant respected by construction.
    bossQteSpec: {
      zoomSeconds: 2,
      anchor: { x: 0, y: -5 }, // centred hall tableau (x may nudge once the backdrop lands, §6)
      phaseCount: 3, // unchanged (ADR-0052 tuned)
      bossHp: 24, // unchanged (3×8, thresholds 16/8)
      maxBlownWindows: 10, // unchanged — the sole failure clock
      // K-5 PIN (re-verified, dev-gameplay/stage-5): with the full ADR-0052 kit (two decorrelated
      // rings + parry) a competent player who fires on-ring and parries every charged window clears
      // 24 HP before the blown-window clock trips on this seed (winnability test). The diegetic
      // date; re-pinnable per the K-5 discipline if a landability gap is found.
      targetSeed: 19991231,
      // The hall chandelier — overhead pure-upside +3 HP drop, armed once in phase 2 (armPhaseIndex
      // 1). Re-sited from the harness speaker-stack {1.4,0.2}; the mur d'enceintes is the reserved
      // F3 second prop (needs the decorProps[] promotion, not authored — a correct-course, not now).
      decorProp: { position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 },
    },
  },
];

/**
 * NON-SHIPPED boss QTE dev-harness (ADR-0051 D4). The ONLY level in the tree carrying a
 * non-null `bossQteSpec`, deliberately kept OUT of the shipped `LEVELS` array/menu so the
 * required, level-gating boss is unreachable by any shipped player in V1 (the "Belliard live
 * contract untouched" guarantee). It exercises the system + tuning on the built Belliard
 * tableau; the render lane runs it on the cop/provisional fallback sprite (no canon art yet —
 * the FLUX generator has not run, cf. the lead-art §7 gate). The dev-only reachability seam
 * (`?preview=`-style / `import.meta.env.DEV`) is the render/tooling lanes' call (ADR-0051 D4 /
 * Consequences) — this module provides ONLY the harness LevelConfig, not the access point.
 *
 * The `bossQteSpec` carries the game-designer defaults (spec §5): 3 phases, 24 HP (3×8),
 * `maxBlownWindows 10`, a 2 s zoom on the centre-street anchor. The per-phase window escalation
 * (EXPOSED 1.6→1.0 s, lull 2.0→1.2 s, tell 0.45→0.35 s, wander 1.0→1.6 u/s, drain −5/−6/−8) and
 * `PHASE_BREAK_SECONDS 1.0` are system constants in `bossQteSystem.ts` (F3-promotable later).
 * `targetSeed` is provisional pending the stage-5 K-5 seed pin (ADR-0051 gotcha; a competent
 * player clears with margin on this seed — a landable vital/limb window opens in each phase).
 */
export const BOSS_QTE_DEV_HARNESS_LEVEL: LevelConfig = {
  id: "boss-harness",
  name: "Le Commandant (harness)",
  district: "Dev — Belliard",
  year: "1998",
  enemySpeedMultiplier: 1.0,
  // Instant trigger (kills 0 >= enemiesToWin 0) so `?preview=boss` lands straight in the duel —
  // Bertrand asked for direct access, not mook-clearing (2026-07-19).
  enemiesToWin: 0,
  timeSeconds: 90,
  unlocked: false,
  deliveries: [],
  roster: { streetSpawns: ["courier"] },
  bossQteSpec: {
    zoomSeconds: 2,
    anchor: { x: 0, y: -5 },
    phaseCount: 3,
    bossHp: 24,
    maxBlownWindows: 10,
    targetSeed: 20260719,
    // ADR-0052 lever 2 — one non-canon placeholder décor prop (a mur d'enceintes / lustre),
    // armed once during phase 2 (armPhaseIndex 1): shoot it in the SHIELDED lull for a single,
    // pure-upside +3 HP burst. Anchor-relative position; harness-only (no shipped level touched).
    // The stage-5 K-5 seed re-pin obligation (ADR-0052 gotcha) must confirm this arm-window is
    // landable on `targetSeed`, alongside the two-ring + parry landability checks.
    decorProp: { position: { x: 1.4, y: 0.2 }, armPhaseIndex: 1 },
  },
};

/**
 * The first playable (non-tutorial) level — Rue Belliard. Consumers that used to
 * assume `LEVELS[0]` is the first playable level (menu default highlight, HUD/tension
 * seeds, `handlePlay` fallback) must go through this instead, since `LEVELS[0]` is now
 * the tutorial (ADR-0012, D1). Narrowed to a non-undefined `LevelConfig` via a
 * module-load invariant so `noUncheckedIndexedAccess` sees no `| undefined`.
 */
const firstPlayable = LEVELS.find((l) => l.kind !== "tutorial");
if (firstPlayable === undefined) {
  throw new Error("Invariant: LEVELS must contain at least one playable level");
}
export const FIRST_PLAYABLE_LEVEL: LevelConfig = firstPlayable;

export type Difficulty = Prefs["difficulty"];

export interface DifficultyConfig {
  readonly enemySpeedMult: number;
  readonly livesOverride: number | null; // null = use prefs
  readonly bulletSpeedMult: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { enemySpeedMult: 0.7, livesOverride: null, bulletSpeedMult: 1.2 },
  normal: { enemySpeedMult: 1.0, livesOverride: null, bulletSpeedMult: 1.0 },
  hard: { enemySpeedMult: 1.4, livesOverride: null, bulletSpeedMult: 0.9 },
};

const PROGRESS_KEY = "muf_progress";

export function loadUnlockedLevels(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw === null) return new Set(["belliard"]);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set(["belliard"]);
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set(["belliard"]);
  }
}

export function unlockLevel(levelId: string): void {
  const current = loadUnlockedLevels();
  const updated = [...current, levelId];
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
