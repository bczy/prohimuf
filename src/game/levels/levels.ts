import type { Prefs } from "@game/systems/prefsSystem";
import type { DeliverySpec } from "@game/types/delivery";
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
}

export const LEVELS: readonly LevelConfig[] = [
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
    // Belliard-first rollout gate (ADR-0004, D2). S1 ships the gate only:
    // courier-only street (today's behaviour). S2/S3 extend this to
    // `["courier", "car", "hostage_taker"]` + `windowWeights`.
    roster: { streetSpawns: ["courier"] },
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
