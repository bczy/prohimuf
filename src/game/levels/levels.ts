import type { Prefs } from "@game/systems/prefsSystem";
import type { DeliverySpec } from "@game/types/delivery";
import type { QteSpec } from "@game/types/hostageQte";
import type { EnemyKind } from "@game/types/enemy";

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
        stopPosition: { x: 0, y: -4 },
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
      anchor: { x: 0, y: -5 },
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
        stopPosition: { x: -2, y: -4 },
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
        stopPosition: { x: 2, y: -4 },
      },
    ],
  },
];

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
