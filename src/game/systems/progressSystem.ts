/**
 * Player progression save state (ADR-0074 §1). Moved verbatim out of the level catalogue:
 * unlocked-level ids are player-save state, not level data, and belong beside the other
 * `muf_*` storage owners (`prefsSystem.ts`, `highScoreSystem.ts`) with the same
 * try/catch-swallow semantics. Behaviour is byte-identical to the pre-move version.
 */

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
