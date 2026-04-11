export interface ScoreEntry {
  readonly score: number;
  readonly wave: number;
  readonly date: string; // ISO
}

const MAX_ENTRIES = 10;
const STORAGE_KEY_PREFIX = "muf_scores_";

function storageKey(levelId: string): string {
  return `${STORAGE_KEY_PREFIX}${levelId}`;
}

export function loadScores(levelId: string): readonly ScoreEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(levelId));
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveScore(levelId: string, entry: ScoreEntry): readonly ScoreEntry[] {
  const existing = loadScores(levelId);
  const updated = [...existing, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(storageKey(levelId), JSON.stringify(updated));
  } catch {
    // storage unavailable
  }
  return updated;
}

export function isHighScore(levelId: string, score: number): boolean {
  const scores = loadScores(levelId);
  if (scores.length < MAX_ENTRIES) return score > 0;
  const lowest = scores[scores.length - 1];
  return lowest !== undefined && score > lowest.score;
}

function isValidEntry(v: unknown): v is ScoreEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.score === "number" && typeof e.wave === "number" && typeof e.date === "string";
}
