export interface Prefs {
  readonly soundVolume: number; // 0.0–1.0
  readonly musicVolume: number; // 0.0–1.0
  readonly lives: number; // 1–5
  readonly difficulty: "easy" | "normal" | "hard";
  readonly crt: boolean;
  /**
   * VHS scan-line scroll. The CRT composite's scanline comb is always on with
   * `crt`; this toggles its slow upward TRAVEL (the VHS tell) on top of it —
   * some players read a crawling comb as flicker, so it is a separate switch.
   * Default true; inert when `crt` is off (the pass is not mounted) and frozen
   * under the effective reduced-motion signal.
   */
  readonly vhs: boolean;
  // Player's own reduced-motion toggle. Default false (ADR-0054): the OS
  // `prefers-reduced-motion` signal is unioned LIVE at the render/bridge edge —
  // never seeded into or stored by this pure reducer.
  readonly reducedMotion: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  lives: 3,
  difficulty: "normal",
  crt: true,
  vhs: true,
  reducedMotion: false,
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
      crt: typeof parsed.crt === "boolean" ? parsed.crt : DEFAULT_PREFS.crt,
      vhs: typeof parsed.vhs === "boolean" ? parsed.vhs : DEFAULT_PREFS.vhs,
      reducedMotion:
        typeof parsed.reducedMotion === "boolean"
          ? parsed.reducedMotion
          : DEFAULT_PREFS.reducedMotion,
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
