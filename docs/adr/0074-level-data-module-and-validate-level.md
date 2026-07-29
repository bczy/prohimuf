# 0074 — Level catalogue as an import-time-computable data module, and `validateLevel` as the single source of `LevelConfig` invariants

- **Status:** Proposed
- **Date:** 2026-07-29
- **Number:** 0073, allocated by `producer` (Marion) at story opening, recorded in
  `docs/handoffs/story-level-data-extraction.md` §2. Re-check at merge.
- **Decision owner:** `senior-architect` (Winston), TECH PLAN of
  `docs/handoffs/story-level-data-extraction.md` §3.

## Context

The level catalogue module mixed three unrelated concerns in one 441-line file, which blocks
the whole level-editor track that follows it.

`src/game/levels/levels.ts` currently holds (a) the pure `LevelConfig` catalogue — `LEVELS`,
`BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG` — (b) the
`LevelConfig` / `LevelRoster` type declarations, (c) a runtime rollout flag
(`BELLIARD_BOSS_ENABLED`) that conditionally composes one level's `bossQteSpec`, and (d) two
player-save functions that read and write `localStorage` under the `muf_progress` key
(`loadUnlockedLevels` / `unlockLevel`).

Three downstream stories depend on untangling this: a timeline of named events inside
`LevelConfig` (story ②), an MCP level-editor surface for agents — `validate` / `inspect` /
`dryrun` / `preview` (story ③), and a dev-only balcony placer (story ④). All three need
level data that is side-effect-free to import and independently validatable. Today, importing
`LEVELS` pulls a module that touches browser storage, and the only structural `LevelConfig`
invariant the game enforces — the hostage/boss timing-margin guard — is reachable only by
constructing live `GameState` through `createInitialState` (`src/game/systems/stateMachine.ts`),
where it throws. An agent-facing validator cannot call a throw buried in the state machine,
and re-deriving the same arithmetic in a second place is how the two copies drift.

The forces are therefore: keep the 32 existing import lines across 23 files working unchanged
(this is a
byte-for-byte refactor, not a feature), give story ③ a data module that a tool can read — and
one day write — mechanically, and make the invariant set additive rather than duplicated.

## Decision

### 1. Four modules, one public barrel

- `src/game/types/level.ts` — `LevelConfig` and `LevelRoster` declarations only. Type-only,
  zero runtime, no import of `src/game/systems`. This is the home story ② extends with
  `timeline?: readonly TimelineEvent[]` and story ④ extends with slot-origin tagging.
- `src/game/levels/levels.data.ts` — the pure catalogue: `LEVELS`,
  `BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG` and the
  `Difficulty` / `DifficultyConfig` types. `Difficulty` stays here, not in `types/level.ts`,
  because it derives from `Prefs["difficulty"]` and `types/` must not depend on `systems/`.
- `src/game/levels/validateLevel.ts` — `LevelIssue`, `validateLevel`, and the shared
  invariant predicates. **No catalogue import**: it must never import `levels.data.ts`, so the
  validator can be applied to a config that does not exist in the catalogue (story ③ validates
  edits before they are written). Beyond that it imports `@game/types/*`, plus — where an
  invariant's arithmetic needs a real tuning constant — that constant **read from the system
  that owns it** (e.g. `QTE_RESULT_HOLD` from `@game/systems/qteSystem`), never a redeclared
  copy. Re-declaring the value in the validator would recreate exactly the duplicated-formula
  drift this ADR exists to prevent. Such an import is admissible only while it stays
  value-only and acyclic; if a needed constant ever sits in a module that imports the
  catalogue, move the constant, not the boundary.
- `src/game/systems/progressSystem.ts` — `loadUnlockedLevels`, `unlockLevel`, `PROGRESS_KEY`.
  This is player-save state and belongs beside its two existing siblings, `prefsSystem.ts` and
  `highScoreSystem.ts`, which own the other `muf_*` storage keys with the same
  try/catch-swallow semantics.

`src/game/levels/levels.ts` remains as a **pure re-export barrel** over the types and the data
only — no logic, no progression. Every current consumer of `LEVELS`, `LevelConfig`,
`FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG` and `BOSS_QTE_DEV_HARNESS_LEVEL` keeps its import
line untouched. The barrel deliberately does **not** re-export progression: the two call sites
of `loadUnlockedLevels` / `unlockLevel` are rewired to `@game/systems/progressSystem`, so
nothing that imports the catalogue can reach `localStorage` transitively.

### 2. `levels.data.ts` is import-time computable, with one grandfathered conditional

`levels.data.ts` must remain a module whose every export is computable at import time from
literals, with **no I/O, no environment read, no clock, no randomness**. `BELLIARD_BOSS_ENABLED`
and its conditional spread of `belliard`'s `bossQteSpec` stay in this module, next to the entry
they compose, and are the **one grandfathered non-literal construct**. No new conditional,
loop, or computed entry may be introduced in the catalogue: a new level is a plain object
literal. When the Belliard boss decouple flag is retired, the flag and its spread are deleted
and the field becomes literal, at which point the module is fully literal.

The alternative — a `levelFlags.ts` module for the flag alone — was rejected: it is indirection
with a single caller, and the composing spread has to live beside the level entry regardless.

The module-load derivation of `FIRST_PLAYABLE_LEVEL` (a `find` plus an invariant throw) is
allowed under this rule: it is a pure derivation over the literals in the same file, not an
input from outside it.

### 3. `validateLevel` is the single source of generic `LevelConfig` invariants

```ts
export type LevelIssueSeverity = "error" | "warning";
export interface LevelIssue {
  readonly code: string; // stable machine key, e.g. "hostage-boss-margin"
  readonly severity: LevelIssueSeverity;
  readonly field: string; // dotted path into the config, e.g. "hostageQte.triggerAtElapsedSeconds"
  readonly message: string; // human sentence, safe to surface to an agent or a dev
}
export function validateLevel(config: LevelConfig): readonly LevelIssue[];
```

`[]` means no issue found. `validateLevel` never throws and never mutates. Issues are returned
in a deterministic order (declaration order of the checks, then field order) so an MCP caller
and a test can compare results verbatim.

**The `createInitialState` throw stays**, and stops owning its arithmetic. The timing-margin
computation and its threshold move into `validateLevel.ts` as one exported predicate; the state
machine calls that predicate and throws with the returned issue's message when it fires. Two
reasons the throw is not simply replaced by a `validateLevel` call: `createInitialState` receives
`LevelParams`, not a `LevelConfig`, so it cannot call `validateLevel` without a restructure this
refactor does not want; and fail-loud-at-load is a genuinely different contract from
report-and-return — a level that violates the margin must not boot, even if a caller ignores the
issue array. Parity between the throw and AC5's returned issue is then true by construction
rather than by a duplicated formula.

`src/game/systems` may consume `validateLevel` or its predicates; it must not re-derive a
`LevelConfig` invariant locally. A new structural invariant is added to `validateLevel.ts`
first, and consumed from there.

## Consequences

- Story ③'s MCP `validate` tool is a thin wrapper over `validateLevel` — no logic of its own,
  no duplicated correctness rules, and it can validate a candidate config that is not in the
  catalogue.
- Story ②'s timeline field lands in `src/game/types/level.ts` with the timeline's own checks
  added to `validateLevel.ts`; no new module boundary is needed for it.
- Importing the level catalogue no longer drags `localStorage` into the module graph, which
  also removes a jsdom dependency from any future headless/tooling consumer of `LEVELS`.
- Negative: `levels.ts` becoming a barrel means two names for one concept for a while.
  Consumers are deliberately **not** migrated to direct imports in this story — a 23-file /
  32-line import rewrite inside a byte-for-byte refactor would drown the diff that proves
  nothing changed. Migration is a later, mechanical follow-up.
- Gotcha, and a precondition story ③ inherits: `validateLevel`'s "never throws" contract holds
  for a **structurally well-formed** `LevelConfig` — i.e. one the type system vouches for. It
  indexes `config.deliveries` and `roster.windowWeights` directly, so a malformed object cast
  through the type would raise a `TypeError` instead of returning issues. That is deliberate:
  the core stays a validator of typed data, and **parsing untrusted input is the caller's job at
  its own boundary**. Story ③'s MCP surface must parse/shape-guard an agent-supplied candidate
  into a `LevelConfig` before calling `validateLevel`; it must not push defensive `typeof`
  checks into this module.
- Negative: the invariant now has two exits — a returned issue and a throw. They share one
  computation, but a contributor adding an invariant must decide consciously whether it is also
  load-fatal. Default: it is not; only invariants that make the level unplayable earn a throw.
- Gotcha: `validateLevel` needs a **runtime** list of valid `EnemyKind`s to flag an unknown
  `roster.windowWeights` key. `EnemyKind` is a bare union with no runtime value; the keys of
  `ARCHETYPES` (`src/game/types/enemyTypes.ts`) are the existing runtime source and must be used
  rather than a second hand-maintained list.
- Gotcha: if the chosen split ever changes `BELLIARD_BOSS_ENABLED`'s effective value or the
  identity of the composed `belliard` entry, that is a bug, not a feature — the deep-equal
  pre/post test (AC1) is the guard, and it is the one test that must not be weakened.
