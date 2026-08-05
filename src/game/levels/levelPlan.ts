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
  /** Point de départ de la calibration des fenêtres (spec SP2 §2.3, décision Bertrand) :
   *  la bande verticale (normalisée y-down sur l'image) où chercher les ouvertures, et
   *  le nombre de colonnes attendu. Optionnel : absent ⇒ la phase (b) refuse de tourner
   *  pour ce level (pas de LEVEL_CFG manuel de repli pour un level généré). */
  readonly calibration?: {
    readonly windowBand: { readonly top: number; readonly bottom: number };
    readonly expectedCols?: number;
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
  // `trim()`, comme toute autre chaîne requise ici : un id " " passait, et
  // `validateLevelPlan` construisait ensuite le namespace "   :" (panel r11).
  if (typeof p.id !== "string" || p.id.trim().length === 0) {
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
  // `calibration` is the fourth nested object, and the only OPTIONAL one — which is
  // exactly why it escaped the loop above when SP2 introduced it. Absent is legal;
  // present-but-not-an-object is not, because the calibration rule further down
  // destructures `calibration.windowBand` and would throw a raw TypeError on
  // `null`/`"x"`/`{}` — breaking the never-throws contract the MCP tools rest on
  // (panel round on the post-merge HEAD, 2 MAJEUR). Same treatment as its siblings,
  // one level deeper because the rule dereferences one level deeper.
  if (p.calibration !== undefined) {
    if (!isRecord(p.calibration)) {
      issues.push(planIssue("malformed", "calibration", "calibration: expected an object"));
    } else if (!isRecord(p.calibration.windowBand)) {
      issues.push(
        planIssue(
          "malformed",
          "calibration.windowBand",
          "calibration.windowBand: expected an object with numeric top and bottom",
        ),
      );
    }
  }
  // EVERY required string the plan carries, walked from one table instead of one
  // guard per field. Three review rounds each surfaced another unchecked string
  // (`fiction.*`, then `backdrop.file`, then `props[].asset`) with the identical
  // failure: a "sound" verdict, a module scaffolded to disk, and `undefined`
  // reaching a filesystem path or the menu card. Closes the MISSING-string half of the
  // class ; the extra-key half is r8's check, the wrong-type half r10's, below.
  // (`archetypes[].spriteBase` is checked by the rules further down.)
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
  // `id` feeds the identical `assets/levels/<id>/...` shape (the new MCP `scanAssets`
  // AND the pre-existing runtime `levelLayerPaths`/`enemyAssetPathsFor`) — it gets the
  // same discipline as the two fields above, not just the MCP-only `scaffoldIdIssue`
  // check that a hand-authored `generated/*.ts` module never goes through (panel r14).
  const pathFragments: (readonly [string, unknown])[] = [];
  if (typeof p.id === "string") pathFragments.push(["id", p.id]);
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
  // Excess keys, not just missing ones. `renderModuleSource` writes the plan as a
  // DIRECTLY-TYPED literal (`export const plan: LevelPlan = {...}`), and TypeScript's
  // excess-property check fires on those — so a stray key makes `yarn typecheck` fail
  // on a module `scaffold` just reported as cleanly written, breaking spec §6's own
  // acceptance criterion ("un module que la suite accepte tel quel"). Very plausible
  // from an agent, since the wire schema is deliberately loose (ADR-0081 D3). Panel r8.
  const KNOWN_KEYS = {
    plan: ["id", "fiction", "backdrop", "archetypes", "props", "gameplay", "calibration"],
    fiction: ["name", "label", "district", "year"],
    backdrop: ["mode", "file", "aspect"],
    gameplay: ["enemiesToWin", "timeSeconds", "enemySpeedMultiplier", "windowWeights"],
    archetype: [
      "kind",
      "hp",
      "bulletDamage",
      "hiddenDuration",
      "visibleDuration",
      "shoots",
      "scoreDelta",
      "livesDelta",
      "timeDelta",
      "countsAsTarget",
      "weight",
      "spriteBase",
      "variants",
      "tint",
      "aspect",
      "artRetired",
    ],
    prop: ["kind", "asset", "aspect", "heightFrac", "footPadFrac", "x", "row"],
  } as const;
  const reportExtraKeys = (value: unknown, allowed: readonly string[], at: string): void => {
    if (!isRecord(value)) return;
    for (const key of Object.keys(value)) {
      if (allowed.includes(key)) continue;
      issues.push(
        planIssue(
          "malformed",
          at === "" ? key : `${at}.${key}`,
          `${at === "" ? key : `${at}.${key}`}: unknown field — a scaffolded module is a ` +
            `typed LevelPlan literal, so an extra key makes tsc reject the written file`,
        ),
      );
    }
  };
  reportExtraKeys(p, KNOWN_KEYS.plan, "");
  reportExtraKeys(p.fiction, KNOWN_KEYS.fiction, "fiction");
  reportExtraKeys(p.backdrop, KNOWN_KEYS.backdrop, "backdrop");
  reportExtraKeys(p.gameplay, KNOWN_KEYS.gameplay, "gameplay");
  if (Array.isArray(p.archetypes)) {
    (p.archetypes as readonly unknown[]).forEach((a, i) => {
      reportExtraKeys(a, KNOWN_KEYS.archetype, `archetypes[${String(i)}]`);
    });
  }
  if (Array.isArray(p.props)) {
    (p.props as readonly unknown[]).forEach((prop, i) => {
      reportExtraKeys(prop, KNOWN_KEYS.prop, `props[${String(i)}]`);
    });
  }
  // Les TYPES des champs qu'aucune borne ne regarde. Le round 3 affirmait « fermer la
  // classe » (verdict sain → module scaffoldé → `tsc` rouge) ; c'était surestimé : il
  // fermait les chaînes MANQUANTES, le round 8 les clés EN TROP, mais pas les VALEURS de
  // mauvais type sur des clés connues (panel r10). Un `shoots: "yes"` ou un
  // `backdrop.mode: "troncon-sequence"` passait, se scaffoldait, et faisait rougir `tsc`
  // sur un fichier que l'outil venait de déclarer propre.
  //
  // Périmètre exact, vérifiable en lisant les deux tables côte à côte : les gardes de
  // `validateLevelPlan` couvrent déjà kind, weight, variants, hp, bulletDamage, les deux
  // durées, les trois deltas, aspect et spriteBase — la table ci-dessous prend tout le
  // reste, donc chaque champ déclaré des trois formes a désormais l'un ou l'autre.
  const typeChecks: (readonly [string, unknown, "boolean" | "string", boolean])[] = [];
  if (Array.isArray(p.archetypes)) {
    (p.archetypes as readonly unknown[]).forEach((a, i) => {
      if (!isRecord(a)) return;
      const at = `archetypes[${String(i)}]`;
      typeChecks.push([`${at}.shoots`, a.shoots, "boolean", true]);
      typeChecks.push([`${at}.countsAsTarget`, a.countsAsTarget, "boolean", true]);
      typeChecks.push([`${at}.tint`, a.tint, "string", true]);
      typeChecks.push([`${at}.artRetired`, a.artRetired, "boolean", false]);
    });
  }
  for (const [field, value, expected, required] of typeChecks) {
    if (!required && value === undefined) continue;
    if (typeof value !== expected) {
      issues.push(
        planIssue(
          "malformed",
          field,
          `${field}: expected a ${expected} — a wrong type here scaffolds a module tsc rejects`,
        ),
      );
    }
  }
  // Les deux unions littérales, pour la même raison : rien d'autre ne les regarde
  // (`validateLevel` travaille sur `LevelConfig`, qui ne porte pas `backdrop`), et le
  // rendu branche sur `backdrop.mode === "single-wide"`.
  if (isRecord(p.backdrop) && p.backdrop.mode !== "single-wide") {
    issues.push(
      planIssue(
        "malformed",
        "backdrop.mode",
        `backdrop.mode: expected the literal "single-wide" (the only layout the renderer knows)`,
      ),
    );
  }
  if (Array.isArray(p.props)) {
    (p.props as readonly unknown[]).forEach((prop, i) => {
      if (!isRecord(prop) || prop.row === undefined) return;
      if (prop.row !== "near" && prop.row !== "far") {
        issues.push(
          planIssue(
            "malformed",
            `props[${String(i)}].row`,
            `props[${String(i)}].row: expected "near" or "far"`,
          ),
        );
      }
    });
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
    // The spriteBase becomes a real filesystem WRITE target in the sprite
    // pipeline (gen-enemy-types.mjs writes public/assets/<spriteBase>*.png for
    // frame 1 AND every extra frame): a "/", ".." or absolute segment would
    // silently escape public/assets on the CI runner — the same class of bug
    // already closed for props[].asset below (panel run-4 on PR #156). The
    // generator carries its own containment throw; this is the CI-time seat
    // of the same law. The shape is the one every existing spriteBase has
    // (enemy_sprite, enemy_fixture_vigile, …): a plain lowercase filename stem.
    // Both checks below dereference `a.spriteBase` as a string (`.test`,
    // `.startsWith`) — gated on `typeof === "string"` so a missing/non-string
    // spriteBase reports once, above, instead of throwing here.
    if (typeof a.spriteBase === "string" && !/^[a-z0-9_]+$/.test(a.spriteBase)) {
      errors.push(
        planIssue(
          "archetype-bounds",
          `${at}.spriteBase`,
          `archetype ${a.kind}: spriteBase "${a.spriteBase}" must match ^[a-z0-9_]+$ ` +
            `(a plain filename stem — it is joined into public/assets/<spriteBase>*.png)`,
        ),
      );
    }
    // Unlike props — whose output is namespaced per level under
    // assets/nearfg/<id>/ — a spriteBase resolves FLAT into public/assets/, so it
    // shares one namespace with the shipped table and with every other generated
    // level. A collision fails SILENTLY GREEN (panel run-8): gen-enemy-types only
    // generates a frame when MISSING, so reusing e.g. "enemy_sprite" skips
    // generation, commits nothing, exits 0 — and the level ships forever wearing
    // another level's sprite. Requiring the plan's own id in the stem makes the
    // flat namespace collision-free by construction.
    // L'id est NORMALISÉ (tirets → underscores) avant de former le préfixe : un id de
    // level admet les tirets (`porte-de-vanves`) alors que la forme d'un spriteBase les
    // interdit — sans cette normalisation les deux règles seraient mutuellement
    // exclusives et AUCUN level à tiret ne pourrait déclarer d'ennemi (panel run-9 ;
    // tous les tests précédents utilisaient "fixture", sans tiret, d'où le trou).
    const spritePrefix = `enemy_${plan.id.replace(/-/g, "_")}_`;
    if (typeof a.spriteBase === "string" && !a.spriteBase.startsWith(spritePrefix)) {
      errors.push(
        planIssue(
          "namespace",
          `${at}.spriteBase`,
          `archetype ${a.kind}: spriteBase "${a.spriteBase}" must start with ` +
            `"${spritePrefix}" — the sprite namespace is FLAT (public/assets/), so a ` +
            `stem that does not carry this level's id can silently collide with the ` +
            `shipped table or a sibling generated level`,
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
    // The asset string becomes a real filesystem WRITE target in the sprite
    // pipeline (gen-nearfg-sprites.mjs resolves it under public/): an absolute
    // path or a ".." segment would silently escape public/ on the CI runner.
    // The generator carries its own containment throw; this is the CI-time
    // seat of the same law, next to the rest of the prop invariants.
    if (p.asset.startsWith("/") || p.asset.split("/").includes("..")) {
      errors.push(
        planIssue(
          "asset-path",
          `${at}.asset`,
          `prop ${p.kind}: asset "${p.asset}" must be a relative path under public/ ` +
            `with no ".." segment (documented shape: assets/nearfg/<id>/<name>.png)`,
        ),
      );
    }
    // Le namespace par level des props était une hypothèse de commentaire, pas un
    // invariant vérifié (panel run-12) : un asset pointant vers le dossier d'un AUTRE
    // level passait la validation, et le générateur y aurait écrit — écrasant l'art
    // commité d'un level frère. Même loi que le préfixe de `spriteBase` (run 8), à
    // ceci près que les props ont, eux, un dossier propre : on l'exige. La forme est
    // ancrée pour interdire aussi une profondeur supplémentaire, que le glob de
    // présence du workflow ne verrait pas.
    const assetDir = `assets/nearfg/${plan.id}/`;
    if (!p.asset.startsWith(assetDir) || p.asset.slice(assetDir.length).includes("/")) {
      errors.push(
        planIssue(
          "asset-path",
          `${at}.asset`,
          `prop ${p.kind}: asset "${p.asset}" must be exactly "${assetDir}<name>.png" — ` +
            `a foreign level's directory would be overwritten, and extra depth is not ` +
            `committed by the workflow's presence check`,
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
  // `backdrop.file` is the THIRD plan field that becomes a filesystem write target
  // (gen-street-paid resolves public/assets/levels/<id>/<file>.png, the output of the
  // PAID job; align-windows reads the same path) — it was the one that received
  // neither of the two guards its siblings got (panel run-8, two reviewers). Same
  // law as spriteBase: a plain filename stem, so no ".." or absolute segment can
  // reach the resolve. The generators carry the containment throw as the runtime
  // half — see ADR-0078 §3 for why both halves exist.
  if (!/^[a-z0-9_-]+$/.test(plan.backdrop.file)) {
    errors.push(
      planIssue(
        "asset-path",
        "backdrop.file",
        `backdrop.file: "${plan.backdrop.file}" must match ^[a-z0-9_-]+$ (a plain ` +
          `filename stem — it is joined into public/assets/levels/${plan.id}/<file>.png)`,
      ),
    );
  }
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

  // Calibration (SP2 §2.3): optional — a level with no `calibration` simply cannot
  // run phase (b) yet (align-windows.mjs refuses, see planCalibration.mjs). When
  // declared, the band must be a sane, normalized (y-down) [0,1] window with
  // top < bottom, and expectedCols (if given) a positive integer — both feed the
  // detection loop's config directly, with no manual LEVEL_CFG fallback.
  if (plan.calibration !== undefined) {
    const { windowBand, expectedCols } = plan.calibration;
    const { top, bottom } = windowBand;
    const finiteInUnit = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1;
    if (!finiteInUnit(top) || !finiteInUnit(bottom) || !(top < bottom)) {
      errors.push(
        planIssue(
          "calibration",
          "calibration.windowBand",
          `calibration.windowBand: top (${String(top)}) and bottom (${String(bottom)}) must ` +
            `be finite numbers in [0, 1] with top < bottom`,
        ),
      );
    }
    if (expectedCols !== undefined && (!Number.isInteger(expectedCols) || expectedCols < 1)) {
      errors.push(
        planIssue(
          "calibration",
          "calibration.expectedCols",
          `calibration.expectedCols: must be an integer >= 1`,
        ),
      );
    }
  }

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
