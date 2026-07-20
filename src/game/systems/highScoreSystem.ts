export interface ScoreEntry {
  readonly score: number;
  readonly wave: number;
  readonly date: string; // ISO
  /**
   * Player byline (M1, ADR-0054 §2). Optional on read: legacy blobs written before
   * this field existed have no `name`, and a skipped/empty entry stores none either.
   * Always clamped/trimmed/plain-text when present (see `sanitizeName`).
   */
  readonly name?: string;
}

const MAX_ENTRIES = 10;
const STORAGE_KEY_PREFIX = "muf_scores_";
const PLAYER_NAME_KEY = "muf_player_name";

/** Byline budget — mirrors the gated `[CREW_NAME]` cap (ADR-0054 §2, story AC6). */
export const MAX_NAME_LENGTH = 16;

/**
 * Fanzine-voiced fallback shown when an entry carries no name (legacy blob, skip, or
 * empty submit). Narrative-owned copy slot (spec-menus-ui-completion §2, note 3); kept
 * as the single source of truth here alongside the existing French narrative content in
 * `src/game`. Never stored — resolved at display time via `resolveDisplayName`.
 */
export const ANONYMOUS_NAME = "ANONYME";

// C0/C1 control characters + DEL: newlines/tabs/null would break the plain-text
// leaderboard row (AC6). React escapes markup in text nodes, so stripping these plus
// trim + length-clamp is the full plain-text guarantee the pure layer owes the render.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

function storageKey(levelId: string): string {
  return `${STORAGE_KEY_PREFIX}${levelId}`;
}

/**
 * Pure normalisation of a raw player byline: strip control characters, trim, clamp to
 * `MAX_NAME_LENGTH`. Returns `""` for an empty/whitespace-only name (no minimum — the
 * fallback is applied at display time, not here). Idempotent. For per-keystroke input
 * clamping use `sanitizeNameLive` — trimming here would eat the space the player just
 * typed mid-name ("DJ MEHDI" would collapse to "DJMEHDI").
 */
export function sanitizeName(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, MAX_NAME_LENGTH).trim();
}

/**
 * Per-keystroke variant of `sanitizeName`: strips control characters and clamps to
 * `MAX_NAME_LENGTH` but keeps edge whitespace, so internal spaces survive typing
 * left-to-right. The full trim is applied at submit/save via `sanitizeName`.
 */
export function sanitizeNameLive(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").slice(0, MAX_NAME_LENGTH);
}

/**
 * Display-time resolver: the sanitised name if the player signed one, otherwise the
 * anonymous fallback. Handles legacy (`undefined`) and empty alike — the single seam the
 * render layer (`ScoresUne` rows, the entry screen lead-story) reads so the fallback copy
 * lives in exactly one place.
 */
export function resolveDisplayName(name: string | undefined): string {
  const clean = sanitizeName(name ?? "");
  return clean.length > 0 ? clean : ANONYMOUS_NAME;
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
  const updated = [...existing, normalizeEntry(entry)]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
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

/**
 * Last-used byline convenience key (`muf_player_name`) — identity, not a `Prefs` setting
 * (ADR-0054 §2). Stored as a plain sanitised string; missing/empty reads as `""` so the
 * entry input starts blank on the first-ever high score.
 */
export function loadPlayerName(): string {
  try {
    const raw = localStorage.getItem(PLAYER_NAME_KEY);
    if (raw === null) return "";
    return sanitizeName(raw);
  } catch {
    return "";
  }
}

export function savePlayerName(name: string): void {
  const clean = sanitizeName(name);
  try {
    if (clean.length > 0) {
      localStorage.setItem(PLAYER_NAME_KEY, clean);
    } else {
      localStorage.removeItem(PLAYER_NAME_KEY);
    }
  } catch {
    // storage unavailable
  }
}

/**
 * Guarantees the persisted blob only ever holds a clean, plain-text name — and omits the
 * field entirely when empty, keeping a skipped entry byte-identical to a legacy one.
 */
function normalizeEntry(entry: ScoreEntry): ScoreEntry {
  const base = { score: entry.score, wave: entry.wave, date: entry.date };
  const clean = sanitizeName(entry.name ?? "");
  return clean.length > 0 ? { ...base, name: clean } : base;
}

function isValidEntry(v: unknown): v is ScoreEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  if (typeof e.score !== "number" || typeof e.wave !== "number" || typeof e.date !== "string") {
    return false;
  }
  // Tolerant on `name`: absent (legacy blob) or a string. A corrupt non-string name is
  // the only thing that drops the entry — same posture as the pre-existing filter.
  return e.name === undefined || typeof e.name === "string";
}
