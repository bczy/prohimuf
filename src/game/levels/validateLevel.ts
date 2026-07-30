import type { LevelConfig } from "@game/types/level";
import type { QteSpec } from "@game/types/hostageQte";
import type { BossQteSpec } from "@game/types/bossQte";
import { hasArchetype, knownKinds } from "@game/types/enemyTypes";
// Side-effect import, DELIBERATE (panel run-8): `hasArchetype`/`knownKinds` read the
// generated registry in `enemyTypes`, populated only by `generated/index.ts`'s module
// body. A STANDALONE consumer (story ③'s MCP `validate` tool) imports this module in
// isolation — without this line, every legitimate generated kind would report
// `unknown-enemy-kind` purely by import order. This is NOT the catalogue: the
// "never import levels.data.ts" rule below still holds.
import "@game/levels/generated";
import { QTE_RESULT_HOLD } from "@game/systems/qteSystem";
import type { DeliverySpec } from "@game/types/delivery";
import { VEHICLE_SPEED, VEHICLE_MARGIN } from "@game/systems/deliverySystem";

/**
 * The single source of generic `LevelConfig` invariants (ADR-0074 §3).
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
 *
 * The clearance test is expressed as "return null when the margin HOLDS", so a non-finite
 * `timeSeconds` (NaN) makes the comparison false and yields an issue — i.e. it now throws at
 * load where the old `>=` guard let it through. That is deliberate and strictly better: a level
 * whose clock is NaN cannot honour a timing invariant and must not boot. Pinned by test.
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

/**
 * The delivery/boss sequential-coexistence invariant (panel PR #143 follow-up), as ONE
 * shared predicate — the delivery mirror of {@link hostageBossMarginIssue}.
 *
 * The boss branch of `tickGameState` early-returns before the delivery block, so a delivery
 * still `INCOMING`/`DELIVERING` (or departing) when the timed finale fires at TIMER EXPIRY
 * would freeze on screen forever. `tickDelivery` is fully deterministic — fixed speed, no
 * randomness — so the worst case IS the only case: trigger + roll-in + full window +
 * roll-out until `GONE` (the scene must be FREE, same bar as the hostage guard).
 *
 * The two travel legs need the street half-width, which is render-owned (`CourierField`).
 * When the caller cannot supply it (`streetHalfWidth` undefined) the predicate keeps the
 * width-independent bound (trigger + window) rather than going blind. Same NaN posture as
 * the hostage predicate: a non-finite `timeSeconds` fails the "margin HOLDS" comparison
 * and yields an issue.
 */
export function deliveryBossMarginIssue(input: {
  readonly delivery?: DeliverySpec | null | undefined;
  readonly bossQteSpec?: BossQteSpec | null | undefined;
  readonly timeSeconds: number;
  /** Street half-width in world units (`CourierField.halfWidth`); travel legs skipped when unknown. */
  readonly streetHalfWidth?: number | undefined;
}): LevelIssue | null {
  const delivery = input.delivery;
  const boss = input.bossQteSpec;
  if (delivery === null || delivery === undefined) return null;
  if (boss === null || boss === undefined) return null;

  let travelSeconds = 0;
  if (input.streetHalfWidth !== undefined) {
    const edge = input.streetHalfWidth + VEHICLE_MARGIN;
    const entryX = delivery.entrySide === "left" ? -edge : edge;
    const exitX = -entryX;
    travelSeconds =
      (Math.abs(delivery.stopPosition.x - entryX) + Math.abs(exitX - delivery.stopPosition.x)) /
      VEHICLE_SPEED;
  }
  const deliveryWorstCaseEnd =
    delivery.triggerAtElapsedSeconds + travelSeconds + delivery.windowSeconds;
  if (deliveryWorstCaseEnd + SAFETY_MARGIN_SECONDS < input.timeSeconds) return null;

  return {
    code: "delivery-boss-margin",
    severity: "error",
    field: "deliveries",
    message:
      `LevelConfig invariant: a delivery and bossQte are authored together but are not safely ` +
      `sequential — the delivery's worst-case end (${String(deliveryWorstCaseEnd)}s: trigger + ` +
      `travel + window + departure) leaves less than the required ` +
      `${String(SAFETY_MARGIN_SECONDS)}s margin before the level's timeSeconds ` +
      `(${String(input.timeSeconds)}s), when the timed-finale boss is created and freezes the ` +
      `delivery tick. Move triggerAtElapsedSeconds earlier, shrink windowSeconds, or widen ` +
      `timeSeconds so the vehicle is always GONE before the boss can exist.`,
  };
}

export function validateLevel(config: LevelConfig): readonly LevelIssue[] {
  const issues: LevelIssue[] = [];

  // 1 — hostage/boss sequential coexistence.
  const marginIssue = hostageBossMarginIssue(config);
  if (marginIssue !== null) issues.push(marginIssue);

  // 1bis — delivery/boss sequential coexistence (width-independent bound here: the street
  // half-width is render-owned and unknown to a bare `LevelConfig`; `createInitialState`
  // re-runs the same predicate with the real width at level load).
  for (const [index, delivery] of config.deliveries.entries()) {
    const deliveryIssue = deliveryBossMarginIssue({
      delivery,
      bossQteSpec: config.bossQteSpec,
      timeSeconds: config.timeSeconds,
    });
    if (deliveryIssue !== null) {
      issues.push({ ...deliveryIssue, field: `deliveries[${String(index)}]` });
    }
  }

  // 2 — every `roster.windowWeights` slot must be a real enemy kind. `EnemyKind` is a bare
  // union with no runtime value; `hasArchetype` (core table + the generated-level registry,
  // SP1) is the runtime source — validation-side, no silent `normal` fallback.
  //
  // A namespaced kind (`levelId:name`) additionally belongs to ONE level: the one whose id
  // is its prefix. `validateLevelPlan` enforces that on the harness authoring path, but this
  // validator is the gate for every OTHER path (hand-authored configs, story ③'s MCP edits),
  // and the runtime resolvers (`buildWeightedFrom`, `archetype`) are deliberately global —
  // so without this check a config could spawn another level's authored enemy in its pool.
  const windowWeights = config.roster?.windowWeights;
  if (windowWeights !== undefined) {
    for (const slot of Object.keys(windowWeights)) {
      if (!hasArchetype(slot)) {
        issues.push({
          code: "unknown-enemy-kind",
          severity: "error",
          field: `roster.windowWeights.${slot}`,
          message:
            `Unknown window spawn slot "${slot}": roster.windowWeights may only key real enemy ` +
            `kinds (${knownKinds().join(", ")}).`,
        });
      } else if (slot.includes(":") && !slot.startsWith(`${config.id}:`)) {
        // Ownership = FULL-id prefix, the same rule as validateLevelPlan's `ns` and
        // levelArt's isOwnedGeneratedPropKind — never a split on the first colon,
        // which would mis-own kinds of a level whose id itself contains ':'.
        issues.push({
          code: "foreign-enemy-kind",
          severity: "error",
          field: `roster.windowWeights.${slot}`,
          message:
            `Foreign window spawn slot "${slot}": a namespaced kind may only appear in the ` +
            `pool of the level whose id prefixes it — not "${config.id}". A generated ` +
            `archetype never leaks into another level's pool.`,
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
      `${field} is ${String(value)}s, outside [0, ${String(timeSeconds)}]s — the level's own ` +
      `clock. Move it inside that range or widen timeSeconds.`,
  });
}
