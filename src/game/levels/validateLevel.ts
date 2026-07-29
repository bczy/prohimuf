import type { LevelConfig } from "@game/types/level";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { QTE_RESULT_HOLD } from "@game/systems/qteSystem";

/**
 * The single source of generic `LevelConfig` invariants (ADR-0073 §3).
 *
 * Pure: never throws, never mutates, no I/O. `[]` means "no issue found". Issues come back
 * in a deterministic order — checks in their declaration order below, fields in authoring
 * order inside a check — so a caller (story ③'s MCP `validate` tool) and a test can compare
 * results verbatim.
 *
 * It must NEVER import the catalogue (`levels.data.ts`): story ③ validates candidate configs
 * that are not in the catalogue. `src/game/systems` may consume this module, but must not
 * re-derive a `LevelConfig` invariant locally — a new structural invariant is added here
 * first and consumed from there.
 */

export type LevelIssueSeverity = "error" | "warning";

export interface LevelIssue {
  /** Stable machine key, e.g. `"hostage-boss-margin"`. */
  readonly code: string;
  readonly severity: LevelIssueSeverity;
  /** Dotted path into the config, e.g. `"hostageQte.triggerAtElapsedSeconds"`. */
  readonly field: string;
  /** Human sentence, safe to surface to an agent or a dev. */
  readonly message: string;
}

/**
 * Seconds of clearance required between the hostage QTE's worst-case resolution and the
 * moment the timed-finale boss can be created (ADR-0059 Amendment 2 — timer expiry).
 * Owned here, read by `createInitialState`; do not re-declare it elsewhere.
 */
const SAFETY_MARGIN_SECONDS = 5;

/**
 * The hostage/boss sequential-coexistence invariant (ADR-0059 D3), as ONE shared predicate.
 *
 * A level MAY author both a hostage QTE and a boss QTE, but only SEQUENTIALLY: the boss is a
 * timed finale created no earlier than `timeSeconds` of (non-frozen) play, and the hostage QTE
 * freezes both clocks while active — so as long as the hostage's WORST CASE resolution
 * (trigger + zoom + every peek blown + the result hold) finishes with margin before the timer
 * could reach 0, the two cinematics can never run concurrently.
 *
 * `validateLevel` reports the returned issue; `createInitialState` throws its `message` — same
 * arithmetic, two exits, no duplicated formula. Returns `null` when the invariant holds or
 * when the level authors fewer than both cinematics.
 */
export function hostageBossMarginIssue(input: {
  readonly hostageQte?: QteSpec | null | undefined;
  readonly bossQteSpec?: BossQteSpec | null | undefined;
  readonly timeSeconds: number;
}): LevelIssue | null {
  const hostage = input.hostageQte;
  const boss = input.bossQteSpec;
  if (hostage === null || hostage === undefined) return null;
  if (boss === null || boss === undefined) return null;

  const hostageWorstCaseEnd =
    hostage.triggerAtElapsedSeconds +
    hostage.zoomSeconds +
    hostage.maxBlownPeeks * hostage.peekCadenceSeconds +
    QTE_RESULT_HOLD;
  if (hostageWorstCaseEnd + SAFETY_MARGIN_SECONDS < input.timeSeconds) return null;

  return {
    code: "hostage-boss-margin",
    severity: "error",
    field: "hostageQte",
    message:
      `LevelConfig invariant: hostageQte and bossQte are authored together but are not safely ` +
      `sequential — the hostage's worst-case resolution (${String(hostageWorstCaseEnd)}s) leaves ` +
      `less than the required ${String(SAFETY_MARGIN_SECONDS)}s margin before the level's ` +
      `timeSeconds (${String(input.timeSeconds)}s), when the timed-finale boss is created. ` +
      `Widen timeSeconds, move triggerAtElapsedSeconds earlier, or shrink maxBlownPeeks/` +
      `peekCadenceSeconds so the hostage always resolves well before the boss can exist.`,
  };
}

export function validateLevel(config: LevelConfig): readonly LevelIssue[] {
  const issues: LevelIssue[] = [];

  // 1 — hostage/boss sequential coexistence.
  const marginIssue = hostageBossMarginIssue(config);
  if (marginIssue !== null) issues.push(marginIssue);

  // 2 — every `roster.windowWeights` slot must be a real enemy kind. `EnemyKind` is a bare
  // union with no runtime value; `ARCHETYPES`'s keys are the existing runtime source.
  const windowWeights = config.roster?.windowWeights;
  if (windowWeights !== undefined) {
    for (const slot of Object.keys(windowWeights)) {
      if (!Object.prototype.hasOwnProperty.call(ARCHETYPES, slot)) {
        issues.push({
          code: "unknown-enemy-kind",
          severity: "error",
          field: `roster.windowWeights.${slot}`,
          message:
            `Unknown window spawn slot "${slot}": roster.windowWeights may only key real enemy ` +
            `kinds (${Object.keys(ARCHETYPES).join(", ")}).`,
        });
      }
    }
  }

  // 3 — every authored trigger time must land inside the level's own clock, `[0, timeSeconds]`.
  // The boss QTE carries no trigger field: it is a timed finale fired at timer expiry.
  config.deliveries.forEach((delivery, index) => {
    pushRangeIssue(
      issues,
      `deliveries[${String(index)}].triggerAtElapsedSeconds`,
      delivery.triggerAtElapsedSeconds,
      config.timeSeconds,
    );
  });
  if (config.hostageQte !== undefined) {
    pushRangeIssue(
      issues,
      "hostageQte.triggerAtElapsedSeconds",
      config.hostageQte.triggerAtElapsedSeconds,
      config.timeSeconds,
    );
  }
  if (config.loot !== undefined) {
    pushRangeIssue(
      issues,
      "loot.spawnIntervalSeconds",
      config.loot.spawnIntervalSeconds,
      config.timeSeconds,
    );
  }

  return issues;
}

function pushRangeIssue(
  issues: LevelIssue[],
  field: string,
  value: number,
  timeSeconds: number,
): void {
  if (value >= 0 && value <= timeSeconds) return;
  issues.push({
    code: "trigger-out-of-range",
    severity: "error",
    field,
    message:
      `${field} is ${String(value)}s, outside the level's [0, ${String(timeSeconds)}]s window — ` +
      `it would never fire. Move it inside the level's own clock or widen timeSeconds.`,
  });
}
