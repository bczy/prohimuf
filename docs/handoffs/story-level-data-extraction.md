# Handoffs — Level data/code extraction + generic `validateLevel` (STORY ① of the level-editor track)

Story slug: `story-level-data-extraction` · opened by `pm` (John), 2026-07-29.
Feature: STORY ① of the 4-story level-editor vision Bertrand validated off a multi-lane
feasibility study — the technical prerequisite for ② (timeline of named events), ③ (MCP
level-editor for agents), ④ (dev-only balcony placer). This story ships none of those; it
only untangles `src/game/levels/levels.ts` so they have clean ground to build on.

## 1. INTAKE + PRODUCT — pm (John) — 2026-07-29

- claim: scope the extraction so it is a pure refactor + a new pure validator — zero
  gameplay-behaviour change — and hand off a story lane assignments can build ②③④ against.
- release: this shard (no separate planning-artifacts doc requested for ①; the vision itself
  lives in the multi-lane feasibility study Bertrand already validated).

### Context

`src/game/levels/levels.ts` (441 lines) currently mixes three things that don't belong in
one module:

1. **Pure data** — the `LEVELS: readonly LevelConfig[]` array and
   `BOSS_QTE_DEV_HARNESS_LEVEL`, plus `DIFFICULTY_CONFIG`.
2. **A live runtime flag** — `BELLIARD_BOSS_ENABLED = true as boolean` (l.82), consumed by a
   conditional spread inside the `belliard` entry (l.197-209) to decide whether that level's
   object carries a `bossQteSpec` key at all.
3. **Progression side effects** — `loadUnlockedLevels()` / `unlockLevel()` (l.421-441), which
   read/write `localStorage` under the `muf_progress` key. This is player-save state, not
   level data — it has no business living beside the `LevelConfig` catalogue.

There is exactly one generic structural invariant enforced today, and it lives in the wrong
place for reuse: the hostage/boss timing-margin guard in
`createInitialState` (`src/game/systems/stateMachine.ts:148-164`) throws at level _load_ time
if a level authors both `hostageQte` and `bossQteSpec` without enough safety margin between
the hostage's worst-case resolution and the boss's timed-finale trigger. That's a real,
already-battle-tested `LevelConfig` invariant, currently only reachable by actually
constructing game state — not callable as a pure check.

This matters now because ② (timeline authoring), ③ (an MCP `validate`/`inspect`/`dryrun`/
`preview` surface for agents) and ④ (a dev-only balcony placer) all need to point at level
data that is (a) side-effect-free to import and (b) independently validatable without
spinning up the state machine. Today none of that is true.

### User story

As a dev lane (and, downstream, an agent driving the ③ MCP tools), I want `LevelConfig`
catalogue data isolated from runtime code and progression state, and a pure
`validateLevel(config): LevelIssue[]` function that carries the game's existing generic
`LevelConfig` invariants, so that the timeline (②) and the MCP level-editor (③) have a stable,
side-effect-free data module to read and a single validator to call — instead of each having
to re-derive or duplicate correctness checks against a module that also touches
`localStorage`.

### Scope (V1 — this story only)

- Extract the pure catalogue (`LEVELS`, `BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`,
  `DIFFICULTY_CONFIG`, `Difficulty`/`DifficultyConfig` types, `LevelConfig`/`LevelRoster`
  types) into a data-only module. Exact filename (`levels.data.ts` or otherwise) is
  `senior-architect`'s call, not fixed here.
- Move `loadUnlockedLevels()` / `unlockLevel()` (and the `PROGRESS_KEY` constant) out of the
  data module into a progression-owned module (or an existing progression module if one
  already exists — architect's call). All existing call sites re-wired, none behaviourally
  changed.
- Decide, with the architect, where `BELLIARD_BOSS_ENABLED` and its conditional-spread
  construction of the `belliard` entry live — it is authoring logic, not data, but it must
  still resolve to the exact same static array at import time.
- Write `validateLevel(config: LevelConfig): LevelIssue[]` as a new pure function (own
  module or co-located with the data module — architect's call), TDD, covering at minimum:
  - the existing hostage/boss timing-margin invariant (ported from
    `stateMachine.ts:148-164`, expressed as a pure check against a `LevelConfig`, not against
    live `GameState`);
  - an unknown/malformed `roster.windowWeights` slot (a key not in `EnemyKind`);
  - any `triggerAtElapsedSeconds` (delivery, hostage QTE, boss QTE) or loot
    `spawnIntervalSeconds` falling outside `[0, timeSeconds]`.
  - `LevelIssue` shape (fields, severity if any) is the architect's/dev lane's call; the
    story only requires that issues are structured, not thrown, and that an empty array means
    "no issues found."
- `stateMachine.ts`'s existing throw MAY be re-expressed as a call into `validateLevel` (kept
  as a fail-loud guard at load time) — that consolidation is encouraged but not mandated by
  this story; if deferred, log it as a fast-follow rather than silently dropping it.

### Acceptance criteria

| #   | Given                                    | When                                                                                                                                                                     | Then                                                                                                                                                                                                |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | The extracted data module                | Any consumer imports `LEVELS` (and `BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG`) after the refactor                                         | The values are byte-for-byte identical (same objects/fields/order) to today's `levels.ts` exports — verified by a test that snapshots or deep-equals the pre/post arrays, not just "it typechecks." |
| AC2 | The data module (whatever it is named)   | Grepped for imports                                                                                                                                                      | It contains **no** import of/reference to `localStorage`, `loadUnlockedLevels`, or `unlockLevel` — progression is fully out.                                                                        |
| AC3 | `loadUnlockedLevels()` / `unlockLevel()` | Called from their new home by existing call sites                                                                                                                        | Behaviour (return values, `localStorage` key `muf_progress`, try/catch-swallow semantics) is unchanged — existing tests for progression pass unmodified or with import-path-only edits.             |
| AC4 | `validateLevel(config)`                  | Called on any of the 4 currently-shipped `LevelConfig`s (`tutorial`, `belliard`, `stalingrad`, `vitry`, `niveau-final`) and the dev harness                              | Returns `[]` (no issues) — the shipped catalogue is valid by construction, proving the validator doesn't cry wolf on real data.                                                                     |
| AC5 | `validateLevel(config)`                  | Called on a config whose `hostageQte`/`bossQteSpec` pair violates the safety-margin invariant (mirroring the existing `stateMachine.ts` throw's own trigger condition)   | Returns at least one issue describing the timing violation — parity with today's throw, but returned not thrown.                                                                                    |
| AC6 | `validateLevel(config)`                  | Called on a config with a `roster.windowWeights` key that is not a valid `EnemyKind`                                                                                     | Returns at least one issue naming the unknown slot.                                                                                                                                                 |
| AC7 | `validateLevel(config)`                  | Called on a config with any trigger-time field (`triggerAtElapsedSeconds` on a delivery/hostageQte/bossQteSpec, or `loot.spawnIntervalSeconds`) `< 0` or `> timeSeconds` | Returns at least one issue naming the offending field and value.                                                                                                                                    |
| AC8 | The full game                            | Built, typechecked, played through all 5 levels end to end                                                                                                               | Zero observable behaviour change — no gameplay, timing, HUD, or menu regression. This is a refactor + a new pure function, not a feature.                                                           |
| AC9 | `rtk tsc` / `rtk lint` / `rtk vitest`    | Run against the branch                                                                                                                                                   | All green; no `any`; no `--no-verify`.                                                                                                                                                              |

### Non-goals (explicit)

- **No timeline of named events** (STORY ②) — no new `LevelConfig` field for scripted event
  sequencing. That is the next story, built on top of this one's clean data module.
- **No MCP server** (STORY ③) — no `validate`/`inspect`/`dryrun`/`preview` tool surface, no
  new process, no agent-facing API. `validateLevel` is the function ③ will later call; this
  story does not wire anything to call it except tests (and optionally `stateMachine.ts`).
- **No balcony placer** (STORY ④) — no dev-only UI, no new editor screen.
- **No UI of any kind** — this is a `src/game` data/logic-only story.
- **No gameplay/tuning change** — no value in any `LevelConfig` changes; `enemySpeedMultiplier`,
  `enemiesToWin`, `timeSeconds`, `bossQteSpec`/`hostageQte` tunings, `BELLIARD_BOSS_ENABLED`'s
  current `true` value — all untouched. If the architect's chosen module split makes
  `BELLIARD_BOSS_ENABLED` land somewhere that changes its effective value, that is a bug, not
  a feature.
- **Background enemy spawn stays systemic** — reconfirming the design-loop verdict already
  cited in this story's context: nothing here scripts background spawn; only named events
  (deliveries, hostage QTE, boss QTE — already-existing fields) are candidates for ②'s
  timeline, later.

### Handoff

- handoff → `senior-architect` (Winston): lane cut + module boundary call (this touches only
  `src/game`, so likely a single dev lane, but the architect decides: exact module name(s),
  where `BELLIARD_BOSS_ENABLED`/the conditional-spread construction lands, where
  `LevelIssue`/`validateLevel` live, and whether to fold `stateMachine.ts`'s throw into a
  `validateLevel` call now or defer it as a logged fast-follow. Per COLLABORATION.md, this is
  a `src/game`-only change (data + a new pure validator + moving two functions) — confirm
  whether it stays single-lane (`dev-gameplay`) or needs a second lane if the progression
  module's new home reaches into `src/hooks`.
- handoff → `dev-gameplay` (Amelia): TDD `validateLevel` (AC4-AC7 as the test list) once the
  architect's module boundary is decided; own the extraction itself (AC1-AC3) and the
  regression pass (AC8-AC9).
- handoff → `producer` (Marion): track this shard; this story is the prerequisite gate for
  opening ②/③/④ — do not open those stories' BUILD stages until this one reaches
  pm-accepted, since their data-shape/tooling assumptions depend on the module boundary
  decided here.
- Next in the track (not opened yet, reference only):
  - **STORY ②** — a timeline of named events inside `LevelConfig` (deliveries/hostage-QTE/
    boss-QTE-shaped scripted moments only; background enemy spawn stays systemic, per the
    unanimous design-loop verdict cited above).
  - **STORY ③** — an MCP level-editor surface for agents (`validate`/`inspect`/`dryrun`/
    `preview`), built directly on this story's `validateLevel` and clean data module.
  - **STORY ④** — a dev-only balcony placer tool.

Not yet logged as a `VERDICT:` line — no gate has run yet; this entry is INTAKE/PRODUCT only.
Base branch: `claude/level-editor-fsmr43` (on `main`, PR #143 merged — `deliveryAssault.ts`,
ADR-0072).

---

## 2. STORY OPENING — Marion (producer) — 2026-07-29

- claim: pipeline tracking opened; story indexed in `docs/agent-handoffs.md`; stage 1→2 routed
- release: stage-1 tracking entry, index row added, story ① ready for `senior-architect` TECH PLAN

### ADR question (to be decided at tech plan)

The extraction touches `src/game/levels` (internal boundary) and establishes data structures for downstream stories ②③④ (timeline, MCP level-editor, dev-only balcon-placer). The senior-architect will decide during tech plan:

1. Whether an ADR is required (if yes, next free is 0073)
2. Module boundary scope (extracted module name/location, where `BELLIARD_BOSS_ENABLED` conditional-spread construction lands)
3. Whether to consolidate `stateMachine.ts`'s existing hostage/boss throw into a `validateLevel` call now or defer as logged fast-follow

**Next hand-off:** `senior-architect` for TECH PLAN (lane cut + module boundary + ADR scope decision).

---

## 3. TECH PLAN — senior-architect (Winston) — 2026-07-29

- claim: module boundary, `validateLevel` contract, ADR call and lane cut for story ①
- release: this section + `docs/adr/0074-level-data-module-and-validate-level.md` (Proposed),
  ADR index regenerated (`README.md` + `public/adr/index.html`, 73 ADR, fresh)

Decisions below are binding for the BUILD stage. The ADR carries the rationale in full; this
section is the buildable plan.

### 3.1 Module cut

Four modules plus one barrel. `@game/…` paths as usual.

| Module                               | Contents                                                                                                                                       | Rules                                                                                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/types/level.ts`            | `LevelConfig`, `LevelRoster` (declarations only)                                                                                               | Type-only, zero runtime. MUST NOT import from `@game/systems` (that's why `Difficulty` does not come here). This is where ② adds `timeline?: readonly TimelineEvent[]` and ④ adds slot-origin tagging.           |
| `src/game/levels/levels.data.ts`     | `LEVELS`, `BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG`, `Difficulty`, `DifficultyConfig`, `BELLIARD_BOSS_ENABLED` | Import-time computable: literals only, no I/O, no env read, no clock, no randomness (ADR-0074 §2).                                                                                                               |
| `src/game/levels/validateLevel.ts`   | `LevelIssue`, `LevelIssueSeverity`, `validateLevel`, the shared invariant predicates                                                           | Imports `@game/types/*` only. MUST NOT import `levels.data.ts` — ③ validates configs that are not in the catalogue.                                                                                              |
| `src/game/systems/progressSystem.ts` | `loadUnlockedLevels`, `unlockLevel`, `PROGRESS_KEY`                                                                                            | New home for player-save state, beside its siblings `prefsSystem.ts` / `highScoreSystem.ts` which already own the other `muf_*` keys with identical try/catch-swallow semantics. Behaviour byte-identical (AC3). |
| `src/game/levels/levels.ts`          | **pure re-export barrel** of the types + the data. No logic, no progression.                                                                   | Keeps all ~25 existing import sites untouched. Deliberately does NOT re-export progression, so nothing importing the catalogue can reach `localStorage` transitively (AC2).                                      |

Consumers are **not** migrated to direct imports in this story: a 25-file import rewrite inside
a byte-for-byte refactor would drown the diff that proves nothing changed. Logged as a
mechanical follow-up, not a fast-follow blocker.

**`BELLIARD_BOSS_ENABLED` and the conditional spread stay in `levels.data.ts`**, next to the
`belliard` entry they compose, as the ONE grandfathered non-literal construct. A dedicated
`levelFlags.ts` was considered and rejected: single caller, and the spread has to sit beside
the entry regardless. The constraint that replaces it is a rule, not a file: **no new
conditional / loop / computed entry in the catalogue — a new level is a plain object literal.**
When the decouple flag retires, flag + spread are deleted and the field becomes literal.
`FIRST_PLAYABLE_LEVEL`'s `find` + invariant throw is allowed under the rule (pure derivation
over literals in the same file, no outside input).

Non-negotiable: nothing in the catalogue's VALUES changes. `BELLIARD_BOSS_ENABLED` stays
`true as boolean`; the composed `belliard` object must deep-equal today's, key-presence
included (`exactOptionalPropertyTypes` — the field is OMITTED when the flag is false, not
`undefined`). The AC1 deep-equal pre/post test is the guard and is the one test that must not
be weakened.

### 3.2 `validateLevel` — contract and relationship with the existing throw

```ts
export type LevelIssueSeverity = "error" | "warning";
export interface LevelIssue {
  readonly code: string; // stable machine key, e.g. "hostage-boss-margin"
  readonly severity: LevelIssueSeverity;
  readonly field: string; // dotted path, e.g. "hostageQte.triggerAtElapsedSeconds"
  readonly message: string; // human sentence, safe to hand an agent or a dev
}
export function validateLevel(config: LevelConfig): readonly LevelIssue[];
```

- Lives in `src/game/levels/`, **not** `src/game/systems/`: `systems/` is per-frame
  `GameState`-in / `GameState`-out simulation; this is authoring-time validation of level data.
  It also keeps the ③-facing surface out of the simulation layer.
- Never throws, never mutates. `[]` = no issue. Issues returned in a **deterministic order**
  (check declaration order, then field order) so ③ and the tests can compare verbatim.
- `severity` is in the shape from day one because ③ will need "won't boot" vs "smells wrong";
  V1 emits only `"error"` — do not invent warnings in this story.
- V1 check set = AC5/AC6/AC7 exactly. Nothing else.

**The `stateMachine.ts` throw STAYS, and stops owning its arithmetic** (this is the
consolidation the story called encouraged-but-optional — I'm mandating it, in this form):

- the margin computation and `SAFETY_MARGIN_SECONDS = 5` move into `validateLevel.ts` as ONE
  exported predicate (shape: takes `{ hostageQte?, bossQteSpec?, timeSeconds }`, returns
  `LevelIssue | null`);
- `validateLevel` calls it; `createInitialState` calls it too and throws with the returned
  issue's message when it fires.
- Why not "the throw calls `validateLevel`": `createInitialState` takes `LevelParams`, not a
  `LevelConfig` — wiring `validateLevel` in would force a signature restructure this refactor
  does not want. And fail-loud-at-load is a genuinely different contract from
  report-and-return: a level violating the margin must not boot even if a caller ignores the
  array. Sharing the predicate makes AC5 parity true by construction instead of by a duplicated
  formula.
- The existing test asserts `toThrow(/not safely sequential/)` (`stateMachine.test.ts:969`) —
  that regex must keep matching. Keep the message text; if it must be rebuilt from the issue,
  rebuild it verbatim.

Runtime `EnemyKind` list for AC6: `EnemyKind` is a bare union with no runtime value. Use the
keys of `ARCHETYPES` (`@game/types/enemyTypes`) — the existing runtime source. Do **not**
hand-maintain a second list.

Forward-compat, do NOT implement: ② adds timeline checks INTO `validateLevel.ts`; ④'s slot
tagging (`origin: "window" | "balcony"`, per Amelia's recommendation over a composite SlotRef)
stays open — nothing here narrows a slot to a bare index in a validator signature.

### 3.3 ADR — YES, ADR-0074

`docs/adr/0074-level-data-module-and-validate-level.md`, Status **Proposed**, number allocated
by Marion at story opening (re-check at merge per the `adr-new` guardrail). It earns an ADR on
two counts that outlive this story: the **import-time-computable rule** on `levels.data.ts`
(invisible from the file it constrains, and the contract ③'s tooling will read — and one day
write — against), and **"`validateLevel` is the single source of generic `LevelConfig`
invariants; `systems/` may consume it, never re-derive locally"**. Both are exactly the kind of
call a future contributor would otherwise re-litigate — same reasoning as ADR-0072's
reserved-slot invariant, whose precedent this follows (data crosses the seam, the assembling
module owns composition).

The ADR ships in the SAME PR as the change.

### 3.4 Lane cut — single lane, `dev-gameplay`

Confirmed single-lane. No boundary is crossed: `src/game` only, plus **one** file outside it.

Order (each step green before the next):

1. `src/game/types/level.ts` — move `LevelConfig` / `LevelRoster`, re-export from `levels.ts`. Type-only move, no runtime diff.
2. `src/game/systems/progressSystem.ts` — move the two functions + `PROGRESS_KEY` verbatim; rewire the two call sites (`src/render/scene/App.tsx:33`, `src/game/levels/__tests__/tutorialInvariants.test.ts:4`). **Import-path rewrite ONLY** in `App.tsx` — no other line of render code is touched (AC3).
3. `src/game/levels/levels.data.ts` + `levels.ts` barrel. Land the AC1 deep-equal pre/post test WITH this step, not after.
4. `src/game/levels/validateLevel.ts`, TDD, AC4→AC7 as the test list.
5. Fold the margin predicate into `stateMachine.ts`; `stateMachine.test.ts:940-969` must pass unmodified.
6. Regression pass AC8/AC9.

`src/render/scene/App.tsx` is the only file outside `src/game`, and only its import line moves —
that does not open a `dev-r3f-render` lane, and it is not a shared-file conflict since no other
lane is live on this story. `src/hooks/useGameLoop.ts` and `stateMachine.ts` import
`type LevelRoster` from the barrel: type-only, erased, untouched by steps 1-3.

No `tech-scout` recon needed (no unproven technique, no new dependency). No design loop (no
gameplay/fiction/screen surface). Stage 5 VERIFY is tsc/vitest/lint + the AC8 5-level
playthrough; `qa-lead` should run `test-quality` on the new `validateLevel` tests — a validator
whose tests never go red is worse than no validator. Stage 6 is the full `review-panel` (this is
a refactor across several modules + an ADR, not fix-lane material).

**Next hand-off:** `dev-gameplay` (Amelia) for BUILD in the order of §3.4;
`producer` (Marion) to track ADR-0074's number re-check at merge.

---

## 4. BUILD — dev-gameplay (Amelia) — 2026-07-29

- claim: sole lane on the extraction; §3.4 steps 1→6 executed in order, TDD on `validateLevel`
- release: the module split + `validateLevel` + the AC1 parity guard, all green; ready for
  stage 5 VERIFY (`qa-lead`: `test-quality` on the new validator tests, AC8 5-level playthrough)

### File List

**Created**

- `src/game/types/level.ts` — `LevelConfig` / `LevelRoster`, moved verbatim. Type-only, no
  `@game/systems` import (step 1).
- `src/game/systems/progressSystem.ts` — `loadUnlockedLevels` / `unlockLevel` + `PROGRESS_KEY`,
  moved verbatim, byte-identical semantics (step 2, AC3).
- `src/game/levels/levels.data.ts` — the catalogue: `LEVELS`, `BOSS_QTE_DEV_HARNESS_LEVEL`,
  `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG`, `Difficulty` / `DifficultyConfig`,
  `BELLIARD_BOSS_ENABLED` + its conditional spread (step 3, ADR-0074 §2).
- `src/game/levels/validateLevel.ts` — `LevelIssue`, `LevelIssueSeverity`, `validateLevel`,
  `hostageBossMarginIssue`, `SAFETY_MARGIN_SECONDS` (step 4, ADR-0074 §3).
- `src/game/levels/__tests__/validateLevel.test.ts` — 21 tests, AC4→AC7 (written before the
  implementation; first run red on the missing module).
- `src/game/levels/__tests__/levelsCatalogue.parity.test.ts` — AC1/AC2 guard.
- `src/game/levels/__tests__/fixtures/levelsCatalogue.pre.json` — the frozen PRE-refactor
  catalogue, serialised from `HEAD:src/game/levels/levels.ts` before the split. Reference
  artefact: it must never be regenerated to make a failing parity test pass.

**Modified**

- `src/game/levels/levels.ts` — now a pure re-export barrel (types + data only, no
  progression). 441 → 18 lines; the ~25 consumer import lines are untouched.
- `src/game/systems/stateMachine.ts` — the margin arithmetic and its threshold are gone; the
  guard now calls `hostageBossMarginIssue` and throws the returned `message`. The unused
  `QTE_RESULT_HOLD` import dropped with it. `stateMachine.test.ts` unmodified, incl. the
  `toThrow(/not safely sequential/)` assertion.
- `src/game/levels/__tests__/tutorialInvariants.test.ts` — import line only
  (`loadUnlockedLevels` now from `@game/systems/progressSystem`). No assertion touched.
- `src/render/scene/App.tsx` — import line only (the single file outside `src/game`).

### Verification

- `yarn vitest run` (rtk unavailable in this sandbox): **100 files / 1435 tests passed**
  (baseline before the story: 98 / 1408 — +2 files, +27 tests, 0 modified assertions).
- `yarn typecheck` (`tsc --noEmit`): clean, 0 error. Targeted `eslint` + `prettier --check` on
  the touched paths: clean. No full manual lint pass (pre-commit hook owns it).
- Not run by this lane: AC8's 5-level playthrough (stage 5, `verify` + `game-designer`).

### Deviations from §3 (and why)

1. **`validateLevel.ts` imports `QTE_RESULT_HOLD` from `@game/systems/qteSystem`** — §3.1 says
   "imports `@game/types/*` only". The margin predicate needs the real result-hold constant;
   re-declaring `2.2` here would recreate exactly the duplicated-formula drift the ADR exists to
   prevent. The hard rule (never import `levels.data.ts`) is respected, and `qteSystem` imports
   types only, so no cycle is created. Flagged for `senior-architect`: either the ADR §3 wording
   softens to "no catalogue import; runtime constants may be read from their owning system", or
   the constant moves to `@game/types`.
2. **No boss-QTE trigger check in AC7** — `BossQteSpec` carries **no** `triggerAtElapsedSeconds`
   (it is a timed finale created at timer expiry, ADR-0059 Amendment 2). The AC7 field set is
   therefore `deliveries[i].triggerAtElapsedSeconds`, `hostageQte.triggerAtElapsedSeconds` and
   `loot.spawnIntervalSeconds`. Nothing was skipped — the field does not exist.
3. **`PROGRESS_KEY` is module-private**, not exported (§3.1 lists it as module contents). It had
   no consumer before the move and none after; exporting it would add public surface for nothing.
4. **`hostageBossMarginIssue`'s input type is inline**, not a named exported interface — one
   call site outside the module, so a named type would be single-use indirection (`simplify`).

`simplify` pass run on the diff (own diff only): cut the named input interface (4) and a
parity assertion already subsumed by the `toStrictEqual` deep-equal. Nothing left PROPOSED.

**Next hand-off:** `qa-lead` (Inès) for stage 5 VERIFY — `test-quality` mutation probes on
`validateLevel.test.ts` per §3.4, then the AC8 playthrough; `senior-architect` (Winston) to rule
on deviation 1.
