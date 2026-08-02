import type { Archetype } from "@game/types/enemyTypes";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";
import type { LevelConfig } from "@game/levels/levels";
import type { AuthoredNearForegroundObject, LevelArt } from "@game/levels/levelArt";
import type { DeliverySpec } from "@game/types/delivery";
// Types only: `validateLevel.ts` owns the `LevelIssue` shape (ADR-0074 §3) and this
// module speaks it verbatim — one issue contract for the MCP `validate` tool, no
// parallel type. Type-only, so no import-time dependency is added.
import type { LevelIssue } from "@game/levels/validateLevel";
import { VEHICLE_MARGIN, VEHICLE_SPEED } from "@game/systems/deliverySystem";

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
 * The items of ONE kerb row that survive the mobile density halving — THE single
 * copy of the rule (panel run-8): `NearForeground.tsx`'s `split()` calls this, so
 * game-side reasoning and the renderer can never drift apart again. Filter by row
 * FIRST (an item with no `row` stands in the near row), THEN keep the even indices
 * of the row's own order. That parity is what made the panneaux PARIS vanish on
 * mobile twice (see nearForegroundDensity.test.ts), so prop order is load-bearing.
 * Note a non-empty row always keeps its index-0 item — the halving can thin a row,
 * never empty it.
 */
export function mobileVisibleProps<T extends { readonly row?: "near" | "far" | undefined }>(
  props: readonly T[],
  row: "near" | "far",
): readonly T[] {
  return props.filter((p) => (p.row ?? "near") === row).filter((_, i) => i % 2 === 0);
}

/** Build one plan-level issue. Plan codes are namespaced `plan/…` (spec-mcp §4.1). */
function planIssue(code: string, field: string, message: string): LevelIssue {
  return { code: `plan/${code}`, severity: "error", field, message };
}

/** A non-null, non-array object — what "an object" means for every check below. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The STRUCTURAL precondition of `validateLevelPlan` (panel stage 6, M2a). The rule
 * guards below read a plan through its shape — `plan.archetypes.forEach`,
 * `a.kind.startsWith(ns)`, `Object.entries(plan.gameplay.windowWeights)` — so on a
 * malformed input they do not report, they THROW (`TypeError: entries is not
 * iterable` for `{ id: "safe" }`). That breaks the `{issues}` contract of the MCP
 * tools, whose zod `planShape` is loose BY DECISION (ADR-0081 D3: a `LevelPlan`'s
 * shape is `src/game`'s business, not the transport's) — so the verdict is ours to
 * give, in issues, never in an exception.
 *
 * Checked here is what ANY consumer of a validated plan dereferences on that same
 * tool call — the guards below, the `planToLevelConfig`/`planToLevelArt`
 * projections, and the MCP tools' own asset scan — not merely what this file's
 * guards touch. Field VALUES (a wrong `hp`, a foreign namespace) are not this
 * function's business — they are the rules, and they run only once the shape holds.
 */
function planShapeIssues(plan: LevelPlan): readonly LevelIssue[] {
  if (!isRecord(plan)) {
    return [planIssue("malformed", "plan", "plan: expected an object describing a level plan")];
  }
  const issues: LevelIssue[] = [];
  const p: Record<string, unknown> = plan;

  // `id` seeds the namespace prefix every kind is matched against.
  if (typeof p.id !== "string" || p.id.length === 0) {
    issues.push(
      planIssue("malformed", "id", "id: expected a non-empty string (the level's namespace)"),
    );
  }
  for (const field of ["archetypes", "props"] as const) {
    const list: unknown = p[field];
    if (!Array.isArray(list)) {
      issues.push(planIssue("malformed", field, `${field}: expected an array`));
      continue;
    }
    // Per-ELEMENT shape: `kind` is dereferenced as a string on every entry of both
    // lists, so one null entry throws just as surely as a missing array.
    (list as readonly unknown[]).forEach((entry, i) => {
      if (!isRecord(entry) || typeof entry.kind !== "string") {
        issues.push(
          planIssue(
            "malformed",
            `${field}[${String(i)}]`,
            `${field}[${String(i)}]: expected an object with a string kind`,
          ),
        );
      }
    });
  }
  for (const field of ["fiction", "backdrop", "gameplay"] as const) {
    if (!isRecord(p[field])) {
      issues.push(planIssue("malformed", field, `${field}: expected an object`));
    }
  }
  // EVERY required string the plan carries, walked from one table instead of one
  // guard per field. Three review rounds each surfaced another unchecked string
  // (`fiction.*`, then `backdrop.file`, then `props[].asset`) with the identical
  // failure: a "sound" verdict, a module scaffolded to disk, and `undefined`
  // reaching a filesystem path or the menu card. This closes the class rather than
  // the instances. (`archetypes[].spriteBase` is checked by the rules below;
  // `backdrop.mode` is a one-literal union — a wrong value is a rule question, not
  // a crash.)
  const requiredStrings: (readonly [string, unknown, string])[] = [];
  if (isRecord(p.fiction)) {
    for (const key of ["name", "label", "district", "year"] as const) {
      requiredStrings.push([`fiction.${key}`, p.fiction[key], "it shows on the level's menu card"]);
    }
  }
  if (isRecord(p.backdrop)) {
    requiredStrings.push([
      "backdrop.file",
      p.backdrop.file,
      "it names the backdrop under public/assets/levels/<id>/",
    ]);
  }
  if (Array.isArray(p.props)) {
    (p.props as readonly unknown[]).forEach((prop, i) => {
      if (isRecord(prop)) {
        requiredStrings.push([
          `props[${String(i)}].asset`,
          prop.asset,
          "it is the prop's own asset path under public/",
        ]);
      }
    });
  }
  for (const [field, value, why] of requiredStrings) {
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push(planIssue("malformed", field, `${field}: expected a non-empty string (${why})`));
    }
  }
  // The two strings above that become FILESYSTEM PATHS get the same traversal
  // discipline the MCP `scaffold` tool applies to `plan.id` — the rule being that a
  // path fragment supplied by the caller never escapes its root. Without it, a
  // `backdrop.file` of "../../../etc/passwd" validates clean, gets scaffolded
  // verbatim, and turns the `inspect` tool's asset scan into an arbitrary-path
  // file-existence oracle (CI panel MAJEUR, security-review, on f867734b).
  const pathFragments: (readonly [string, unknown])[] = [];
  if (isRecord(p.backdrop)) pathFragments.push(["backdrop.file", p.backdrop.file]);
  if (Array.isArray(p.props)) {
    (p.props as readonly unknown[]).forEach((prop, i) => {
      if (isRecord(prop)) pathFragments.push([`props[${String(i)}].asset`, prop.asset]);
    });
  }
  for (const [field, value] of pathFragments) {
    if (
      typeof value === "string" &&
      (value.includes("..") || value.includes("\\") || value.startsWith("/"))
    ) {
      issues.push(
        planIssue(
          "malformed",
          field,
          `${field}: must stay inside public/ — no ".." segment, no "\\" separator, not absolute`,
        ),
      );
    }
  }
  if (isRecord(p.gameplay) && !isRecord(p.gameplay.windowWeights)) {
    issues.push(
      planIssue(
        "malformed",
        "gameplay.windowWeights",
        "gameplay.windowWeights: expected an object mapping enemy kinds to weights",
      ),
    );
  }
  return issues;
}

/**
 * Check the invariants a plan must hold. Returns the list of violations — empty
 * when the plan is sound. Called from a test, so a violation breaks CI and never
 * the runtime.
 *
 * **This function never throws**, whatever it is handed: a structurally malformed
 * input comes back as `plan/malformed` issues and short-circuits every rule below
 * (see `planShapeIssues`). Agent-facing callers — the MCP `validate`/`scaffold`
 * tools — rely on that contract, and so does the CI catalogue check.
 *
 * Issues are the SAME structured `LevelIssue` as `validateLevel` (ADR-0074 §3), so
 * story ③'s MCP `validate` tool composes plan-level and config-level validation
 * without an ad-hoc wrapper (spec-mcp-level-editor §4.1). Each guard owns a stable
 * `plan/…` `code` — the machine key an agent branches on; the `message` stays the
 * human sentence, `field` the dotted path into the plan.
 */
export function validateLevelPlan(plan: LevelPlan): readonly LevelIssue[] {
  // Shape FIRST, and nothing else if it fails: the guards below are the code that
  // throws on a malformed plan, so they must not run at all.
  const malformed = planShapeIssues(plan);
  if (malformed.length > 0) return malformed;

  const errors: LevelIssue[] = [];
  const ns = `${plan.id}:`;
  const declared = new Set<string>(plan.archetypes.map((a) => a.kind));

  // Bertrand's framing decision (spec §2.1): at most ONE novel archetype per
  // level — the design-gated cap on a generated level's mechanical surface.
  if (plan.archetypes.length > 1) {
    errors.push(
      planIssue(
        "archetype-cap",
        "archetypes",
        `archetypes: ${String(plan.archetypes.length)} declared, the design cap is 1 per level (spec §2.1)`,
      ),
    );
  }

  plan.archetypes.forEach((a, i) => {
    const at = `archetypes[${String(i)}]`;
    // weight 0 is the activation law (§4.2): a level-authored kind never enters
    // a default pool, it is opted in by its own roster.windowWeights.
    if (a.weight !== 0) {
      errors.push(
        planIssue(
          "weight-nonzero",
          `${at}.weight`,
          `archetype ${a.kind}: weight must be 0 (activation via windowWeights)`,
        ),
      );
    }
    // `length <= ns.length` catches the template typo `"<id>:"` (empty name):
    // startsWith alone accepts it, but isOwnedGeneratedPropKind / the sprite
    // pipeline require a non-empty name segment and would silently drop it.
    if (!a.kind.startsWith(ns) || a.kind.length <= ns.length) {
      errors.push(
        planIssue(
          "namespace",
          `${at}.kind`,
          `archetype ${a.kind}: expected namespace "${ns}" plus a non-empty name`,
        ),
      );
    }
    // `spriteBase` is the sprite FILENAME PREFIX: the preload manifest builds
    // `${spriteBase}_${n}.png` from it, and story ③'s `inspect` tool claims a level's
    // sprites by `file.startsWith(spriteBase)` — which an empty string makes match
    // EVERY png of public/assets/ (panel stage 6, n4). The rule is about the plan, so
    // it lives here rather than in the scanner.
    if (typeof a.spriteBase !== "string" || a.spriteBase.trim().length === 0) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.spriteBase`,
          `archetype ${a.kind}: spriteBase must be a non-empty string (it is the sprite filename prefix)`,
        ),
      );
    }
    // Runtime divides by `variants` (EnemySprite keys the flipbook off
    // slotIndex % variants) and loops preload paths 1..variants: 0 or a
    // non-integer means NaN sprite keys and an EMPTY preload manifest. Capped as
    // well as floored — transposed digits (100000 for 1) would fan out a huge
    // preload manifest with a green CI; the core table's max is 3, 16 is headroom.
    if (!Number.isInteger(a.variants) || a.variants < 1 || a.variants > 16) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.variants`,
          `archetype ${a.kind}: variants must be an integer in [1, 16]`,
        ),
      );
    }
    if (!Number.isInteger(a.hp) || a.hp < 1) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.hp`,
          `archetype ${a.kind}: hp must be an integer >= 1`,
        ),
      );
    }
    // The remaining numeric fields are read just as directly at runtime, with no
    // clamp on the way: `bulletDamage` flows into `snapLives(lives - damage + …)`
    // (a NaN corrupts lives forever — game-over compares then never fire) and the
    // hidden/visible durations feed enemySystem's timers (NaN ⇒ state flips every
    // frame). Score/lives/time deltas land in the HUD arithmetic on every kill.
    if (!Number.isFinite(a.bulletDamage) || a.bulletDamage < 0) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.bulletDamage`,
          `archetype ${a.kind}: bulletDamage must be a finite number >= 0`,
        ),
      );
    }
    for (const field of ["hiddenDuration", "visibleDuration"] as const) {
      if (!Number.isFinite(a[field]) || a[field] <= 0) {
        errors.push(
          planIssue(
            "archetype-bounds",
            `${at}.${field}`,
            `archetype ${a.kind}: ${field} must be a finite number > 0`,
          ),
        );
      }
    }
    for (const field of ["scoreDelta", "livesDelta", "timeDelta"] as const) {
      if (!Number.isFinite(a[field])) {
        errors.push(
          planIssue(
            "archetype-bounds",
            `${at}.${field}`,
            `archetype ${a.kind}: ${field} must be a finite number`,
          ),
        );
      }
    }
    // Runtime reads `aspect` just as directly: EnemySprite scales the mesh by it
    // (NaN/0/negative → invisible or mirrored sprite), and GameScene folds EVERY
    // generated archetype's aspect into the module-level WIDEST_ASPECT at import —
    // so one bad value corrupts the window-fit harness box of every OTHER level too.
    if (!Number.isFinite(a.aspect) || a.aspect <= 0) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.aspect`,
          `archetype ${a.kind}: aspect must be a finite number > 0`,
        ),
      );
    }
  });

  plan.props.forEach((p, i) => {
    const at = `props[${String(i)}]`;
    if (!p.kind.startsWith(ns) || p.kind.length <= ns.length) {
      // Same empty-name law as the archetype check above: getNearForeground's
      // isOwnedGeneratedPropKind requires a non-empty name at runtime.
      errors.push(
        planIssue(
          "namespace",
          `${at}.kind`,
          `prop ${p.kind}: expected namespace "${ns}" plus a non-empty name`,
        ),
      );
    }
    // `x` included: getNearForeground silently DROPS a non-finite-x object at
    // runtime, which would desynchronize the mobile-halving parity this
    // validator certifies below from the list the renderer actually indexes.
    for (const field of ["aspect", "heightFrac", "footPadFrac", "x"] as const) {
      if (!Number.isFinite(p[field])) {
        errors.push(
          planIssue("sizing", `${at}.${field}`, `prop ${p.kind}: ${field} missing or non-finite`),
        );
      }
    }
    // Same law as archetype.aspect above: NearForeground computes the plane width as
    // `planeH * aspect` UNCLAMPED (heightFrac/footPadFrac are clamped downstream,
    // aspect is not), so 0 renders nothing and negative mirrors the prop.
    if (Number.isFinite(p.aspect) && p.aspect <= 0) {
      errors.push(
        planIssue("sizing", `${at}.aspect`, `prop ${p.kind}: aspect must be a finite number > 0`),
      );
    }
  });

  // Two placements of the SAME kind must agree on sizing and asset: the render
  // side resolves both PER KIND (Object.fromEntries — last entry wins), so a
  // divergent second entry would silently re-size and re-skin every placement
  // of that kind, including the first.
  const byKind = new Map<string, GeneratedPropSpec>();
  plan.props.forEach((p, i) => {
    const first = byKind.get(p.kind);
    if (first === undefined) {
      byKind.set(p.kind, p);
      return;
    }
    const agrees =
      first.asset === p.asset &&
      first.aspect === p.aspect &&
      first.heightFrac === p.heightFrac &&
      first.footPadFrac === p.footPadFrac;
    if (!agrees) {
      errors.push(
        planIssue(
          "prop-consistency",
          `props[${String(i)}]`,
          `prop ${p.kind}: two placements disagree on sizing/asset (per-kind resolution is last-wins)`,
        ),
      );
    }
  });

  // Gameplay sanity: these values seed divisors and loop bounds at runtime.
  // timeSeconds = 0 divides the tension derivation by zero on the first tick
  // (the tutorial's timeSeconds: 0 is special-cased on ITS path, not this one).
  // The Livrer loop needs runway beyond its trigger: firing is not completing —
  // after t=trigger the vehicle still TRAVELS from the field edge to stopPosition
  // (≈(halfWidth+VEHICLE_MARGIN)/VEHICLE_SPEED ≈ 1.6s on the standard street; the
  // width is a render-time value, so we budget a conservative allowance) and then
  // holds its FULL windowSeconds before the bonus is awarded. A timer at or below
  // trigger+travel+window ships a level whose delivery bonus is structurally
  // unearnable on every playthrough.
  const g = plan.gameplay;
  // The travel allowance derives from backdrop.aspect, so the aspect must be sane
  // FIRST — a NaN/non-positive aspect would poison the runway arithmetic below
  // (and the runtime layout math it mirrors).
  if (!Number.isFinite(plan.backdrop.aspect) || plan.backdrop.aspect <= 0) {
    errors.push(
      planIssue("sizing", "backdrop.aspect", `backdrop.aspect: must be a finite number > 0`),
    );
  }
  const travelAllowance = Number.isFinite(plan.backdrop.aspect)
    ? deliveryTravelAllowanceSeconds(plan.backdrop.aspect)
    : deliveryTravelAllowanceSeconds(0);
  const minDeliveryRunway =
    DEFAULT_DELIVERY.triggerAtElapsedSeconds + travelAllowance + DEFAULT_DELIVERY.windowSeconds;
  if (!Number.isFinite(g.timeSeconds) || g.timeSeconds <= 0) {
    errors.push(
      planIssue(
        "gameplay-bounds",
        "gameplay.timeSeconds",
        `gameplay.timeSeconds: must be a finite number > 0`,
      ),
    );
  } else if (g.timeSeconds <= minDeliveryRunway) {
    errors.push(
      planIssue(
        "gameplay-bounds",
        "gameplay.timeSeconds",
        `gameplay.timeSeconds: must exceed ${String(minDeliveryRunway)}s — delivery trigger ` +
          `(${String(DEFAULT_DELIVERY.triggerAtElapsedSeconds)}s) + vehicle travel allowance ` +
          `(${String(travelAllowance)}s for backdrop aspect ${String(plan.backdrop.aspect)}) + ` +
          `delivery window (${String(DEFAULT_DELIVERY.windowSeconds)}s) — or the delivery ` +
          `bonus can never be earned`,
      ),
    );
  }
  if (!Number.isInteger(g.enemiesToWin) || g.enemiesToWin < 1) {
    errors.push(
      planIssue(
        "gameplay-bounds",
        "gameplay.enemiesToWin",
        `gameplay.enemiesToWin: must be an integer >= 1`,
      ),
    );
  }
  if (!Number.isFinite(g.enemySpeedMultiplier) || g.enemySpeedMultiplier <= 0) {
    errors.push(
      planIssue(
        "gameplay-bounds",
        "gameplay.enemySpeedMultiplier",
        `gameplay.enemySpeedMultiplier: must be a finite number > 0`,
      ),
    );
  }

  // The activation seam is also the leak: `windowWeights` is projected verbatim
  // into roster.windowWeights, so a foreign namespace would pull ANOTHER level's
  // kind into this pool, and a typo would be dropped in silence by
  // `buildWeightedFrom` (0 % spawn, no error). Unprefixed keys are the core kinds
  // and stay allowed — tuning them is a level's right.
  for (const [kind, weight] of Object.entries(plan.gameplay.windowWeights)) {
    // The VALUE first (panel run-10 BLOQUANT): buildWeightedFrom does
    // `Array.from({ length: Math.max(0, weight) })` per kind — Infinity resolves to
    // 2^53-1, past the engine's max array length, and throws RangeError on EVERY
    // boot of the level; NaN silently contributes zero entries and skews the pool.
    // Bounded above too: buildWeightedFrom materializes `weight` ARRAY ENTRIES per
    // kind on every level boot, so a large-but-finite typo (200000 for 20) is the
    // same Array.from blow-up as Infinity, just below the RangeError threshold —
    // a frozen tab instead of a crash. 1000 dwarfs the whole core pool (93).
    const at = `gameplay.windowWeights.${kind}`;
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 1000) {
      errors.push(
        planIssue(
          "window-weights",
          at,
          `windowWeights ${kind}: weight must be a finite number in [0, 1000]`,
        ),
      );
    }
    if (!kind.includes(":")) continue;
    if (!kind.startsWith(ns)) {
      errors.push(planIssue("namespace", at, `windowWeights ${kind}: expected namespace "${ns}"`));
    } else if (!declared.has(kind)) {
      errors.push(
        planIssue(
          "window-weights",
          at,
          `windowWeights ${kind}: no archetype of the plan declares this kind`,
        ),
      );
    }
  }

  // Victory is `kills >= enemiesToWin` and kills only count `countsAsTarget` kinds —
  // so the EFFECTIVE pool (core defaults merged with the plan's overrides, exactly
  // how call sites feed `buildWeightedFrom`) must keep at least one countsAsTarget
  // kind at positive weight. Tuning core weights is a level's right, but zeroing
  // normal/riot/biker while activating only a non-countable kind ships a permanent
  // softlock: the win quota is structurally unreachable on every playthrough — the
  // same "structurally unearnable" class the delivery-runway check closes above.
  const effectivePool: Partial<Record<string, number>> = {
    ...Object.fromEntries(
      (Object.keys(CORE_ARCHETYPES) as (keyof typeof CORE_ARCHETYPES)[]).map((k) => [
        k,
        CORE_ARCHETYPES[k].weight,
      ]),
    ),
    ...plan.gameplay.windowWeights,
  };
  const declaredByKind = new Map<string, Archetype>(plan.archetypes.map((a) => [a.kind, a]));
  const core: Partial<Record<string, Archetype>> = CORE_ARCHETYPES;
  const winnable = Object.entries(effectivePool).some(([kind, weight]) => {
    if (typeof weight !== "number" || weight <= 0) return false;
    const arch = declaredByKind.get(kind) ?? core[kind];
    return arch?.countsAsTarget === true;
  });
  if (!winnable) {
    errors.push(
      planIssue(
        "window-weights",
        "gameplay.windowWeights",
        `gameplay.windowWeights: no countsAsTarget kind survives with positive weight — ` +
          `enemiesToWin can never be reached`,
      ),
    );
  }

  // No mobile-halving row check here, deliberately (panel run-8): the halving keeps
  // even indices OF THE ROW'S OWN ORDER, so a non-empty row always keeps its index-0
  // prop — an "emptied row" is unconstructible. The rule itself lives in
  // `mobileVisibleProps`, the ONE copy NearForeground.tsx also renders from.

  return errors;
}

/**
 * The invariant that spans the WHOLE catalogue, not a single plan: two plans sharing
 * an id corrupt the level tables silently — `LEVEL_ART` is last-wins while
 * `ALL_LEVELS.find` is first-wins, so one level would be played with the other's
 * decor, a split-brain no fixture can represent without triggering it.
 *
 * This is THE single implementation of the rule (ADR-0081 D6, amending ADR-0075 §6).
 * It reports instead of throwing, so story ③'s MCP `validate`/`scaffold` tools can tell
 * an agent about a collision rather than dying on the import; `assertDistinctPlanIds`
 * (generated/index.ts) is the thin wrapper that turns the same result into the
 * bootstrap fail-fast.
 */
export function validateCatalogue(plans: readonly LevelPlan[]): readonly LevelIssue[] {
  const issues: LevelIssue[] = [];
  const seen = new Set<string>();
  plans.forEach((plan, i) => {
    if (seen.has(plan.id)) {
      issues.push(
        planIssue(
          "duplicate-id",
          `plans[${String(i)}].id`,
          `generated level "${plan.id}" is declared twice — ids must be unique`,
        ),
      );
    }
    seen.add(plan.id);
  });
  return issues;
}

/**
 * Mirrors `levelArt.ts` `WORLD_HEIGHT` (manifest `world.heightUnits`) — duplicated
 * with a cross-reference because this module imports `levelArt.ts` as TYPES ONLY
 * (`assetManifest.ts` documents that it wants no import-time dependency on it).
 * The wide-aspect boundary test in levelPlan.test.ts pins the derived arithmetic.
 */
export const WORLD_HEIGHT_UNITS = 12;

/**
 * Validation-time model of the vehicle's INCOMING travel (field edge → stopPosition),
 * scaled by the plan's OWN backdrop: the runtime distance is `fullW/2 + VEHICLE_MARGIN`
 * with `fullW = WORLD_HEIGHT × aspect` for `single-wide` (levelArt.ts
 * `buildSingleWideLayout` → GameScene's `courierField.halfWidth`), covered at
 * `VEHICLE_SPEED`. A fixed budget would under-estimate wide backdrops (aspect 5.14
 * already travels ≈4.4s; aspect 10 ≈8s) and re-open the unearnable-bonus gap this
 * check exists to close. `Math.ceil` keeps the allowance conservative.
 */
function deliveryTravelAllowanceSeconds(aspect: number): number {
  return Math.ceil(((WORLD_HEIGHT_UNITS * aspect) / 2 + VEHICLE_MARGIN) / VEHICLE_SPEED);
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
