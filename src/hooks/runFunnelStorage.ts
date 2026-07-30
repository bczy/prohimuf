/**
 * Funnel persistence adapter (ADR-0076 D4) — the IMPURE half of the funnel.
 *
 * `src/game` owns the algebra (`parseFunnel` total, `withMilestones` idempotent);
 * this module owns the browser I/O and nothing else. Same try/catch-swallow posture
 * as the four existing `muf_*` storage owners: a disabled/full/corrupt localStorage
 * degrades to "no milestone recorded", never to a thrown error on a navigation event.
 *
 * The four milestones are INDEPENDENT locks merged by OR (gate D4.3) — a write can
 * only ever flip `false → true`, in any order, so clearing Belliard without ever
 * seeing a delivery loses nothing.
 */
import { FUNNEL_STORAGE_KEY, type FunnelState, type Milestone } from "@game/types/runStats";
import { parseFunnel, withMilestones } from "@game/systems/runFunnelSystem";

/**
 * Version tag of the STORED representation (ADR-0076 D4's `"v": 1`). It belongs to
 * the storage format, which this adapter owns — `FunnelState` itself carries no
 * version, and `parseFunnel` is total, so a blob written without it still reads.
 */
const FUNNEL_STORAGE_VERSION = 1;

/** Reads the funnel; any failure (no storage, corrupt blob) reads as all-false. */
export function loadFunnel(): FunnelState {
  try {
    return parseFunnel(localStorage.getItem(FUNNEL_STORAGE_KEY));
  } catch {
    return parseFunnel(null);
  }
}

/**
 * OR-merges the given milestones into the stored funnel and returns the result.
 * Idempotent: re-recording an already-locked milestone rewrites the same blob.
 */
export function recordMilestones(milestones: readonly Milestone[]): FunnelState {
  const next = withMilestones(loadFunnel(), milestones);
  try {
    localStorage.setItem(
      FUNNEL_STORAGE_KEY,
      JSON.stringify({ v: FUNNEL_STORAGE_VERSION, ...next }),
    );
  } catch {
    // Storage unavailable/full — the run still ends normally, the lock is just lost.
  }
  return next;
}
