import { LEVELS } from "@game/levels/levels";
import type { Phase } from "@game/types/gameState";

/**
 * The next-level unlock decision for a terminal level phase (ADR-0059 §D4, story
 * AC3/AC4). Pure so the failable-shipped-level contract can be LOCKED by a unit test
 * without rendering the R3F `<Canvas>` App mounts.
 *
 * The contract this encodes, unchanged from the inlined App.tsx effect it replaces:
 *
 * - `LEVEL_COMPLETE` (a clean quota clear today, OR a boss `WON` once Belliard's boss
 *   flips on) → unlock the NEXT shipped level.
 * - `GAME_OVER` (lives/timer death today, OR a boss `LOST` on a shipped boss level) →
 *   `null`: a shipped level can now FAIL on its ending and that must never unlock the
 *   next level. The unlock lives ONLY under the win branch.
 * - A level NOT in the shipped `LEVELS` array (the `?preview=boss` dev-harness, which is
 *   deliberately excluded — ADR-0051 D4 / AC5) → `null`: inert, no progression write.
 * - The last shipped level completing → `null`: nothing left to unlock.
 *
 * Returns the id to unlock, or `null` when nothing unlocks. The caller still gates the
 * actual write on "not already unlocked" (idempotence) — that stays with React state.
 */
/**
 * The photo set-piece's PROGRESSION predicate (pm ruling Q-3): the set-piece never fires on
 * a player's FIRST Belliard — it opens only once Belliard has already been cleared.
 *
 * "Cleared" is read off the progression already persisted in `muf_progress`: clearing a
 * shipped level unlocks the next one (`nextLevelToUnlock` above, the single writer), so
 * "the level right after the host level is unlocked" IS "the host level has been cleared".
 * Zero new storage key, zero new write — one derived boolean.
 *
 * PURE and total, so a harness can SEED the exact state it wants from an `addInitScript`
 * (write `muf_progress`, boot, done) instead of playing a level to reach it — the
 * architecture requirement that keeps the feature testable in CI.
 *
 * A level outside the shipped campaign, or the last one (nothing after it to unlock), reads
 * `false`: no progression fact exists to stand on.
 */
export function isPhotoQteUnlocked(levelId: string, unlockedLevels: ReadonlySet<string>): boolean {
  const shippedIdx = LEVELS.findIndex((l) => l.id === levelId);
  if (shippedIdx === -1) return false;
  const nextId = LEVELS[shippedIdx + 1]?.id;
  return nextId !== undefined && unlockedLevels.has(nextId);
}

export function nextLevelToUnlock(phase: Phase, levelId: string): string | null {
  // Only a WIN unlocks. GAME_OVER (incl. a boss LOST on a failable shipped level) never does.
  if (phase !== "LEVEL_COMPLETE") return null;
  const shippedIdx = LEVELS.findIndex((l) => l.id === levelId);
  // Not a shipped level (dev-harness) ⇒ inert, exactly as `isShippedLevel === false`.
  if (shippedIdx === -1) return null;
  return LEVELS[shippedIdx + 1]?.id ?? null;
}
