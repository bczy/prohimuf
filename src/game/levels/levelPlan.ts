import type { Archetype } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";

/**
 * The single description of a generated level (spec-level-harness-sp1 §4.4).
 * A generated module declares ONE plan; `LevelConfig` and `LevelArt` are pure
 * projections of it, so a level has exactly one source of truth.
 *
 * This module is data + pure functions only. It imports `levels.ts` and
 * `levelArt.ts` as TYPES ONLY (see the projections below): both are erased at
 * compile time, so nothing here adds an import-time dependency — `assetManifest.ts`
 * documents that it wants none on `levelArt.ts`.
 */

/** Sizing of a generated prop: the same triplet as `NearKindSpec`, but in data. */
export interface GeneratedPropSpec {
  readonly kind: `${string}:${string}`;
  readonly asset: string;
  readonly aspect: number;
  /** Fraction of the facade height — not an absolute height. */
  readonly heightFrac: number;
  readonly footPadFrac: number;
  /** Normalized x anchor over the whole street (0 = left, 1 = right). */
  readonly x: number;
  readonly row?: "near" | "far";
}

export interface LevelPlan {
  readonly id: string;
  readonly fiction: {
    readonly name: string;
    readonly label: string;
    readonly district: string;
    readonly year: string;
  };
  readonly backdrop: {
    readonly mode: "single-wide";
    readonly file: string;
    readonly aspect: number;
  };
  readonly archetypes: readonly Archetype[];
  readonly props: readonly GeneratedPropSpec[];
  readonly gameplay: {
    readonly enemiesToWin: number;
    readonly timeSeconds: number;
    readonly enemySpeedMultiplier: number;
    readonly windowWeights: Partial<Record<EnemyKind, number>>;
  };
}

/**
 * Check the invariants a plan must hold. Returns the list of violations — empty
 * when the plan is sound. Called from a test, so a violation breaks CI and never
 * the runtime.
 */
export function validateLevelPlan(plan: LevelPlan): string[] {
  const errors: string[] = [];
  const ns = `${plan.id}:`;

  for (const a of plan.archetypes) {
    // weight 0 is the activation law (§4.2): a level-authored kind never enters
    // a default pool, it is opted in by its own roster.windowWeights.
    if (a.weight !== 0) {
      errors.push(`archetype ${a.kind}: weight must be 0 (activation via windowWeights)`);
    }
    if (!a.kind.startsWith(ns)) {
      errors.push(`archetype ${a.kind}: expected namespace "${ns}"`);
    }
  }

  for (const p of plan.props) {
    if (!p.kind.startsWith(ns)) errors.push(`prop ${p.kind}: expected namespace "${ns}"`);
    for (const field of ["aspect", "heightFrac", "footPadFrac"] as const) {
      if (!Number.isFinite(p[field])) errors.push(`prop ${p.kind}: ${field} missing or non-finite`);
    }
  }

  return errors;
}
