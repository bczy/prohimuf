import type { FunnelState, Milestone, RunSummary } from "@game/types/runStats";

/**
 * The funnel ALGEBRA — pure (ADR-0076 D4). The `localStorage` I/O that reads and
 * writes the `muf_funnel` blob lives in `src/hooks`, never here: this module only
 * parses an untrusted string and merges milestones.
 *
 * The four milestones are INDEPENDENT locks, never a chain (gate ruling D4.3): a
 * player who clears Belliard before ever seeing a delivery gets milestone 4
 * without milestone 3, and nothing is lost.
 */

/** The virgin funnel — also what any unreadable blob parses to. */
export const EMPTY_FUNNEL: FunnelState = {
  titleSeen: false,
  tutorialCleared: false,
  firstDeliveryDone: false,
  belliardCleared: false,
};

/** The level whose completion locks milestone 4 (gate Q3 — "Belliard BOUCLÉ"). */
const FUNNEL_LEVEL_ID = "belliard";

/**
 * Read the stored blob. TOTAL: never throws, whatever the input. A missing,
 * corrupt, non-object or partial blob reads all-false; a field it does not know is
 * ignored; only a literal `true` unlocks.
 */
export function parseFunnel(raw: string | null): FunnelState {
  if (raw === null) return EMPTY_FUNNEL;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_FUNNEL;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return EMPTY_FUNNEL;
  const blob = parsed as Record<string, unknown>;
  return {
    titleSeen: blob.titleSeen === true,
    tutorialCleared: blob.tutorialCleared === true,
    firstDeliveryDone: blob.firstDeliveryDone === true,
    belliardCleared: blob.belliardCleared === true,
  };
}

/**
 * OR-merge the given milestones into the funnel. Idempotent, order-independent,
 * and one-way: a lock can only ever flip `false → true`.
 */
export function withMilestones(f: FunnelState, ms: readonly Milestone[]): FunnelState {
  return {
    titleSeen: f.titleSeen || ms.includes("titleSeen"),
    tutorialCleared: f.tutorialCleared || ms.includes("tutorialCleared"),
    firstDeliveryDone: f.firstDeliveryDone || ms.includes("firstDeliveryDone"),
    belliardCleared: f.belliardCleared || ms.includes("belliardCleared"),
  };
}

/**
 * The milestones a finished run locks. The other two (`titleSeen`,
 * `tutorialCleared`) are navigation events and are written by the shell — a run
 * cannot produce them.
 */
export function milestonesFromRun(summary: RunSummary, levelId: string): readonly Milestone[] {
  const ms: Milestone[] = [];
  // The milestone marks having DONE the delivery, not having seen it pass (D4.1).
  if (summary.delivery?.issue === "REUSSIE") ms.push("firstDeliveryDone");
  // `LEVEL_COMPLETE` on belliard — its two causes are the quota and a boss win.
  if (
    levelId === FUNNEL_LEVEL_ID &&
    (summary.endCause === "QUOTA" || summary.endCause === "BOSS_GAGNE")
  ) {
    ms.push("belliardCleared");
  }
  return ms;
}
