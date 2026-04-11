import type { Prefs } from "@game/systems/prefsSystem";

export interface LevelConfig {
  readonly id: string;
  readonly name: string;
  readonly district: string;
  readonly year: string;
  readonly enemySpeedMultiplier: number;
  readonly enemiesToWin: number;
  readonly timeSeconds: number;
  readonly unlocked: boolean; // default state (can be overridden by progress)
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
