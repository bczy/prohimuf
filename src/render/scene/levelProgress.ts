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
export function nextLevelToUnlock(phase: Phase, levelId: string): string | null {
  // Only a WIN unlocks. GAME_OVER (incl. a boss LOST on a failable shipped level) never does.
  if (phase !== "LEVEL_COMPLETE") return null;
  const shippedIdx = LEVELS.findIndex((l) => l.id === levelId);
  // Not a shipped level (dev-harness) ⇒ inert, exactly as `isShippedLevel === false`.
  if (shippedIdx === -1) return null;
  return LEVELS[shippedIdx + 1]?.id ?? null;
}
