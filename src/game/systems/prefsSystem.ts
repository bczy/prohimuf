export interface Prefs {
  readonly soundVolume: number; // 0.0–1.0
  readonly musicVolume: number; // 0.0–1.0
  readonly lives: number; // 1–5
  readonly difficulty: "easy" | "normal" | "hard";
}

export const DEFAULT_PREFS: Prefs = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  lives: 3,
  difficulty: "normal",
};

const STORAGE_KEY = "muf_prefs";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      soundVolume: clamp(parsed.soundVolume ?? DEFAULT_PREFS.soundVolume, 0, 1),
      musicVolume: clamp(parsed.musicVolume ?? DEFAULT_PREFS.musicVolume, 0, 1),
      lives: clampInt(parsed.lives ?? DEFAULT_PREFS.lives, 1, 5),
      difficulty: isValidDifficulty(parsed.difficulty)
        ? parsed.difficulty
        : DEFAULT_PREFS.difficulty,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable — silently ignore
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clampInt(v: number, min: number, max: number): number {
  return Math.round(clamp(v, min, max));
}

function isValidDifficulty(v: unknown): v is Prefs["difficulty"] {
  return v === "easy" || v === "normal" || v === "hard";
}
