import type { Archetype } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";
import type { LevelConfig } from "@game/levels/levels";
import type { AuthoredNearForegroundObject, LevelArt } from "@game/levels/levelArt";
import type { DeliverySpec } from "@game/types/delivery";

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
 * The props of ONE kerb row that survive the mobile density halving. Mirrors
 * `NearForeground.tsx`'s `split()` exactly: filter by row FIRST (a prop with no
 * `row` stands in the near row), THEN keep the even indices of the row's own
 * order. That parity is what made the panneaux PARIS vanish on mobile twice
 * (see nearForegroundDensity.test.ts), so a plan's prop order is load-bearing.
 */
export function mobileVisibleProps(
  props: readonly GeneratedPropSpec[],
  row: "near" | "far",
): readonly GeneratedPropSpec[] {
  return props.filter((p) => (p.row ?? "near") === row).filter((_, i) => i % 2 === 0);
}

/**
 * Check the invariants a plan must hold. Returns the list of violations — empty
 * when the plan is sound. Called from a test, so a violation breaks CI and never
 * the runtime.
 */
export function validateLevelPlan(plan: LevelPlan): string[] {
  const errors: string[] = [];
  const ns = `${plan.id}:`;
  const declared = new Set<string>(plan.archetypes.map((a) => a.kind));

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

  // The activation seam is also the leak: `windowWeights` is projected verbatim
  // into roster.windowWeights, so a foreign namespace would pull ANOTHER level's
  // kind into this pool, and a typo would be dropped in silence by
  // `buildWeightedFrom` (0 % spawn, no error). Unprefixed keys are the core kinds
  // and stay allowed — tuning them is a level's right.
  for (const kind of Object.keys(plan.gameplay.windowWeights)) {
    if (!kind.includes(":")) continue;
    if (!kind.startsWith(ns)) {
      errors.push(`windowWeights ${kind}: expected namespace "${ns}"`);
    } else if (!declared.has(kind)) {
      errors.push(`windowWeights ${kind}: no archetype of the plan declares this kind`);
    }
  }

  // Mobile halves each kerb row by list parity: a row whose props all land on an
  // odd index of its own order is drawn EMPTY on mobile (see mobileVisibleProps).
  for (const row of ["near", "far"] as const) {
    const inRow = plan.props.filter((p) => (p.row ?? "near") === row);
    if (inRow.length > 0 && mobileVisibleProps(plan.props, row).length === 0) {
      errors.push(`row ${row}: every prop is dropped by the mobile halving`);
    }
  }

  return errors;
}

/**
 * The default delivery of a generated level, modelled on belliard's. A playable
 * level needs one: `deliveries[0]` seeds `GameState.deliveryVehicle`, so an empty
 * array would leave the `Livrer` half of the core loop on an untested path.
 */
const DEFAULT_DELIVERY: DeliverySpec = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 500,
  entrySide: "left",
  stopPosition: { x: 0, y: -4.5 },
};

/** The gameplay projection of a plan. Pure: same plan in, same config out. */
export function planToLevelConfig(plan: LevelPlan): LevelConfig {
  return {
    id: plan.id,
    kind: "playable",
    name: plan.fiction.name,
    district: plan.fiction.district,
    year: plan.fiction.year,
    enemySpeedMultiplier: plan.gameplay.enemySpeedMultiplier,
    enemiesToWin: plan.gameplay.enemiesToWin,
    timeSeconds: plan.gameplay.timeSeconds,
    // Never unlocked out of the box: a generated level opens through progress,
    // like stalingrad and vitry.
    unlocked: false,
    deliveries: [DEFAULT_DELIVERY],
    // The activation seam (§4.2): the plan's own weights are the ONLY way its
    // archetypes (all weight 0) enter a window pool.
    roster: { windowWeights: plan.gameplay.windowWeights, streetSpawns: ["courier"] },
  };
}

/** The art projection of a plan. Pure: same plan in, same art out. */
export function planToLevelArt(plan: LevelPlan): LevelArt {
  const objects: AuthoredNearForegroundObject[] = plan.props.map((p) => ({
    kind: p.kind,
    x: p.x,
    // Omitted, never `undefined` — exactOptionalPropertyTypes.
    ...(p.row === undefined ? {} : { row: p.row }),
  }));
  return {
    id: plan.id,
    name: plan.fiction.name,
    label: plan.fiction.label,
    // `single-wide` bakes the whole decor into one image, so per-layer parallax
    // is inert — but the field is required by the type.
    parallax: { sky: 0, facade: 0, street: 0 },
    backdrop: plan.backdrop,
    // No per-layer prompt: the decor comes from the paid single-wide pipeline
    // (ADR-0057), not from gen-level-art.
    prompts: {},
    // The prop ORDER is load-bearing: NearForeground.tsx drops one element out of
    // two of the list order on mobile. It mirrors the plan's declaration order and
    // must never be sorted (by x or anything else).
    nearForeground: { factor: -0.38, objects },
  };
}
