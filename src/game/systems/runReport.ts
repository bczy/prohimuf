import type { FunnelState, RunReport, RunSummary } from "@game/types/runStats";
import { RUN_REPORT_SCHEMA, RUN_REPORT_VERSION } from "@game/types/runStats";

/**
 * The exported run report (ADR-0076 D5) — pure assembly + serialisation.
 *
 * The identity guarantee is STRUCTURAL, not a review promise: the only inputs are
 * a `RunSummary`, a `FunnelState` and a level id, none of which can reach
 * `muf_player_name`, and this module imports no storage owner. No timestamp, no
 * device identifier, no free text — and no network anywhere on the path.
 */

/** Assemble the report. `levelId` is attached here: the summary carries none. */
export function buildRunReport(
  summary: RunSummary,
  funnel: FunnelState,
  levelId: string,
): RunReport {
  return {
    schema: RUN_REPORT_SCHEMA,
    version: RUN_REPORT_VERSION,
    level: levelId,
    end: { cause: summary.endCause, wave: summary.wave },
    counters: {
      score: summary.score,
      durationSeconds: summary.durationSeconds,
      // `null` (not `0`) is the value of "not applicable" — `0/0` reads as a
      // failure (spec §2.1.3). The `—` glyph is the render lane's rendering of it.
      pickups: summary.pickups,
      delivery: summary.delivery,
      heartsLost: summary.heartsLost,
    },
    // The STATE of the four milestones, never a diff (gate T1).
    funnel,
  };
}

/** Serialise for the clipboard. Key order is the literal order above — stable. */
export function serializeRunReport(report: RunReport): string {
  return JSON.stringify(report);
}
