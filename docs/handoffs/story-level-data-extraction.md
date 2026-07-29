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
`createInitialState` (`src/game/systems/stateMachine.ts:148-164`) throws at level *load* time
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

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | The extracted data module | Any consumer imports `LEVELS` (and `BOSS_QTE_DEV_HARNESS_LEVEL`, `FIRST_PLAYABLE_LEVEL`, `DIFFICULTY_CONFIG`) after the refactor | The values are byte-for-byte identical (same objects/fields/order) to today's `levels.ts` exports — verified by a test that snapshots or deep-equals the pre/post arrays, not just "it typechecks." |
| AC2 | The data module (whatever it is named) | Grepped for imports | It contains **no** import of/reference to `localStorage`, `loadUnlockedLevels`, or `unlockLevel` — progression is fully out. |
| AC3 | `loadUnlockedLevels()` / `unlockLevel()` | Called from their new home by existing call sites | Behaviour (return values, `localStorage` key `muf_progress`, try/catch-swallow semantics) is unchanged — existing tests for progression pass unmodified or with import-path-only edits. |
| AC4 | `validateLevel(config)` | Called on any of the 4 currently-shipped `LevelConfig`s (`tutorial`, `belliard`, `stalingrad`, `vitry`, `niveau-final`) and the dev harness | Returns `[]` (no issues) — the shipped catalogue is valid by construction, proving the validator doesn't cry wolf on real data. |
| AC5 | `validateLevel(config)` | Called on a config whose `hostageQte`/`bossQteSpec` pair violates the safety-margin invariant (mirroring the existing `stateMachine.ts` throw's own trigger condition) | Returns at least one issue describing the timing violation — parity with today's throw, but returned not thrown. |
| AC6 | `validateLevel(config)` | Called on a config with a `roster.windowWeights` key that is not a valid `EnemyKind` | Returns at least one issue naming the unknown slot. |
| AC7 | `validateLevel(config)` | Called on a config with any trigger-time field (`triggerAtElapsedSeconds` on a delivery/hostageQte/bossQteSpec, or `loot.spawnIntervalSeconds`) `< 0` or `> timeSeconds` | Returns at least one issue naming the offending field and value. |
| AC8 | The full game | Built, typechecked, played through all 5 levels end to end | Zero observable behaviour change — no gameplay, timing, HUD, or menu regression. This is a refactor + a new pure function, not a feature. |
| AC9 | `rtk tsc` / `rtk lint` / `rtk vitest` | Run against the branch | All green; no `any`; no `--no-verify`. |

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
