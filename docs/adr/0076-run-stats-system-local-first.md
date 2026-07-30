# 0076 — Run stats system (local-first)

- **Status:** Accepted
- **Date:** 2026-07-30
- **Number:** 0076, allocated by producer (Marion) at story intake 2026-07-30.
- **Author:** decision content by `senior-architect` (Winston), stage 3 tech plan.
- **Relates to:** ADR-0066 (quarter-heart lives lattice — the unit `heartsLost` counts in),
  ADR-0002 / ADR-0072 (delivery core loop + reserved assault slots — the `Livrer` transition the
  delivery latch hangs on), ADR-0055 (weapon/loot seam — the crate events counted by `pickups`),
  ADR-0054 (`muf_scores_*` / `muf_player_name` — the storage family this feature must stay out
  of), ADR-0074 (storage owners live beside each other in `src/game/systems` — the precedent
  this ADR knowingly diverges from, see C4), ADR-0015 (device-forked control copy — reused by
  the export fallback), ADR-0059 (boss finale — one of the five end-of-run causes).
- **Inputs:** story `_bmad-output/planning-artifacts/story-run-stats-system.md`; gameplay spec
  `docs/game-design/spec-run-stats.md` (GATED); UX spec
  `docs/game-design/ux/ux-run-stats-endscreen.md` (GATED); design gate verdict + rulings
  `docs/handoffs/story-run-stats-system.md` §3.

## Context

The game ends a run with one line (`SCORE FINAL : 4200 | VAGUE 3`) that vanishes when the tab
closes. The story asks for per-run counters, a 3-metric end screen with an optional detail
panel, a one-tap JSON export for playtest reporting, and a 4-milestone local funnel — all
local-first: **zero network, zero account, zero identity**.

Four properties of the existing build make this an architecture decision rather than a counter
increment:

1. **Some facts are destroyed by the tick that produces them.** The delivery vehicle runs
   `DELIVERING → SUCCESS|FAILED → GONE`; on the end screen its phase reads `GONE` whatever
   happened. The outcome is unreadable from the terminal state and **must be latched at the
   transition tick** (spec D2.2.2).
2. **Some facts are not reconstructible from the state delta.** `lives` is moved by three
   different things — enemy bullets, the civil-courier fault penalty, and crate rewards that
   _give hearts back_ (`livesDelta: 2` on the `spread` drop). "Hearts lost" is therefore not
   `livesAtStart − livesAtEnd`, and the two loss sources are already aggregated together inside
   `TriggerResult.livesDelta` (spec D2.3.2, gate Q2).
3. **`GAME_OVER` is not one outcome but three** (health, timer, boss lost), and
   `LEVEL_COMPLETE` is two (quota, boss won). Guidelines §5 rule 4 ("every death/failure: an
   explicit reason displayed") is currently unmet; the cause becomes a first-class datum shown
   at 0 input (gate R5).
4. **`src/game` is pure and must stay pure.** `localStorage` and `navigator.clipboard` are
   browser I/O; the counting logic must stay deterministic, replayable from a tick sequence and
   unit-testable without a DOM (story AC1/AC8).

The tick (`tickGameState`) is a single ~530-line function with **seven return sites**. Any
design that requires touching all seven is a design that will silently miss one.

## Decision

### D1 — Two data shapes, not one: a private accumulator and a public summary

- **`RunStats`** — a small, monotone accumulator carried **inside `GameState`** (`readonly
stats: RunStats`). It holds **only what cannot be recovered later**: pickups collected /
  crates spawned, hearts lost split into `damage` + `faults`, the starting heart gauge, and the
  latched delivery outcome (+ its integrity at the latch tick). Nothing else. It is _game
  state_: produced by the tick, seeded by `createInitialState`, reset by construction at every
  new run (F1 — a run is one attempt on one level).
- **`RunSummary`** — the finished, presentation-ready record, built **once, at read time**, by a
  pure `buildRunSummary(state: GameState): RunSummary`. Everything derivable from the terminal
  state is derived there, never accumulated: final score, `elapsedSeconds`, wave, end-of-run
  cause, delivery _issue_ (5 values) + integrity percentage, pickups ratio.

**Why the split is the decision and not an implementation detail:** it collapses the tick's
intrusion from "seven return sites" to **one fold plus three carry sites**, and it turns every
presentation rule (rounding, floor-not-round, `—` vs `0/0`, `INTERROMPUE`) into a pure function
of a frozen state — testable without simulating a run.

`RunSummary` deliberately carries **no `levelId`**: level identity is known by the render shell,
not by the tick, and threading it through the bridge would buy nothing. It is attached at
report-build time (D5).

### D2 — The end-of-run cause is derived, not accumulated

`deriveEndCause(state)` is a total function of the terminal `GameState`, in this precedence:

| Order | Condition on the terminal state               | Cause        |
| ----- | --------------------------------------------- | ------------ |
| 1     | `bossQte.phase === "DONE"` and `bossHp <= 0`  | `BOSS_GAGNE` |
| 2     | `bossQte.phase === "DONE"` (boss still alive) | `BOSS_PERDU` |
| 3     | `phase === "GAME_OVER"` and `lives <= 0`      | `SANTE`      |
| 4     | `phase === "GAME_OVER"`                       | `TEMPS`      |
| 5     | `phase === "LEVEL_COMPLETE"`                  | `QUOTA`      |

No `enemiesToWin` parameter is needed: on a boss-less level the _only_ road to `LEVEL_COMPLETE`
is the kill quota. Zero touch points in the tick, zero new state, and the five branches map
one-to-one onto exit branches that already exist.

**Abandon is not a cause** (spec D2.6.3): quitting to the menu produces no end screen, no
summary, no export. There is no `ABANDON` value — adding one would mean writing a stat from a
navigation event, outside the pure loop.

### D3 — One fold point in the tick, from explicitly typed facts (no inference)

`foldRunStats(prev: RunStats, facts: RunStatsTickFacts): RunStats` is called **exactly once** per
tick in `tickGameState`, immediately after `newLives` is computed (every countable fact of the
tick exists by then), and the result is carried by the three return sites below it (`newLives <=
0`, timer expiry, normal return). The six early returns above it — terminal idle, boss active,
boss resolved, quota, hostage QTE — all spread `...state` and produce **no countable event by
construction** (they are frozen or terminal), so `stats` rides through unchanged. That property
is asserted by a test, not assumed.

The facts are **explicit and structural**, never inferred from cosmetic channels:

| Fact                                                                      | Source in the tick                                                  | Why not inferred                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crateSpawned: boolean`                                                   | `lootTick.spawned`                                                  | already an explicit flag                                                                                                                                                                                                                                                                                                                                 |
| `cratePicked: boolean`                                                    | `lootTick.loot !== null && trigger.loot === null`                   | a crate is consumed only by a shot; expiry happens earlier, inside `tickLoot`. Structurally guarantees "exactly 1 pickup" under a spread weapon (spec AC-4) — the crate no longer exists for offsets 2 and 3                                                                                                                                             |
| `damageTaken: number`                                                     | the tick's local `damageTaken`                                      | already invulnerability-gated and once-per-tick (spec AC-5)                                                                                                                                                                                                                                                                                              |
| `faultLivesLost: number`                                                  | **new** `TriggerResult.faultLivesDelta`                             | `trigger.livesDelta` mixes courier faults with crate heart rewards. The two are _already separated_ inside `resolveTrigger`'s branches; surfacing the courier term is an additive, behaviour-free field. Reading `pointFeedback` and filtering on `livesDelta < 0` would be a heuristic that the next negative-reward crate breaks in silence — rejected |
| `deliveryOutcome: "SUCCESS" \| "FAILED" \| null` + integrity at that tick | hoisted out of the existing `wasPhase === "DELIVERING" && …` branch | the branch already exists; only the fact is hoisted                                                                                                                                                                                                                                                                                                      |

`foldRunStats` is **monotone**: hearts lost never decrease (a crate heal moves the player's
gauge, never the exposure record — spec D2.3.3), the delivery latch is written once and never
re-written (spec D2.2.5 — a `SUCCESS` followed by a `GAME_OVER` stays `RÉUSSIE`), and the heart
total is clipped to `heartsAtStart` so an oversized fatal blow can never print `3,25 / 3` (spec
AC-6). `heartsAtStart` is seeded from `LevelParams.lives`, i.e. the player-preference gauge
(1..5), not a constant.

### D4 — Persistence and clipboard live in the bridge, never in `src/game`

- **Pure, in `src/game`:** the funnel _algebra_ — the milestone value type, the total
  `parseFunnel(raw: string | null): FunnelState` (never throws; unknown/corrupt ⇒ all-false),
  the idempotent `withMilestones(f, ms)`, and `milestonesFromRun(summary, levelId)`.
- **Impure, in `src/hooks`** (the architecture's declared bridge layer): the `localStorage`
  get/set adapter and the `navigator.clipboard` call, both wrapped in the same
  try/catch-swallow posture as the existing storage owners.

This is a **deliberate divergence from ADR-0074's precedent** (where `prefsSystem`,
`progressSystem` and `highScoreSystem` each hold their own I/O inside `src/game/systems`).
See C4 — the divergence is scoped to this feature and does not authorise retro-migrating the
other four.

**Storage key: `muf_funnel`** — a fifth, distinct `muf_*` key. It is never read or written by the
high-score, prefs or progress code, and none of those are read by this feature (story AC7, gate
A2). Value shape:

```json
{
  "v": 1,
  "titleSeen": true,
  "tutorialCleared": true,
  "firstDeliveryDone": false,
  "belliardCleared": false
}
```

An **object of independent booleans, not an ordered list**: each milestone is its own lock,
written by an OR-merge that can only ever flip `false → true`. That makes gate ruling D4.3
structural — a player who clears Belliard before ever seeing a delivery gets milestone 4 without
milestone 3, and nothing is lost. Milestone 4 is **`belliardCleared`** (`LEVEL_COMPLETE` on
`belliard`), per gate Q3. Missing/unknown/corrupt fields read as `false`; a write never removes
a key it does not know about.

### D5 — Export schema: `muf.run-report`, version 1

`buildRunReport(summary, funnel, levelId): RunReport` (pure, `src/game`) then
`serializeRunReport(report): string` (pure `JSON.stringify`, stable key order). Shape:

```json
{
  "schema": "muf.run-report",
  "version": 1,
  "level": "belliard",
  "end": { "cause": "SANTE", "wave": 3 },
  "counters": {
    "score": 4200,
    "durationSeconds": 68.4,
    "pickups": { "collected": 3, "spawned": 4 },
    "delivery": { "issue": "INTERROMPUE", "integrityPct": 78 },
    "heartsLost": { "total": 1.5, "damage": 0.5, "faults": 1, "max": 3 }
  },
  "funnel": {
    "titleSeen": true,
    "tutorialCleared": true,
    "firstDeliveryDone": false,
    "belliardCleared": false
  }
}
```

Rules:

- **`schema` + `version`.** `schema` is a constant discriminator so a blob pasted into Discord is
  identifiable without context. `version` is an integer bumped **only** on a breaking change (a
  field removed, renamed, or whose meaning/unit changes); adding an optional field does not bump
  it. There is no reader in this release — the version exists so the _first_ reader is not
  forced to guess.
- **Absence is `null`, not `0`.** `pickups: null` on a level that authors no crates,
  `delivery: null` on a level that authors none. `0/0` reads as a failure, `null` reads as "not
  applicable" (spec §2.1.3); the `—` glyph is the render lane's rendering of `null`.
- **Units are the spec's units, already rounded:** `durationSeconds` one decimal, `integrityPct`
  an integer **floor** (99.6 ⇒ 99, never 100 — spec D2.2.4), `heartsLost` on the quarter-heart
  lattice.
- **One vocabulary, on screen and in the export** (gate Q7/R5). The five causes and five
  delivery issues are the same five words in both places; the export carries them **ASCII-folded
  and uppercase** (`SANTE`, `TEMPS`, `QUOTA`, `BOSS_GAGNE`, `BOSS_PERDU`; `REUSSIE`, `PERDUE`,
  `INTERROMPUE`, `NON_DECLENCHEE`) so the blob survives any terminal or paste-target encoding.
  The accented display strings (`SANTÉ`, `RÉUSSIE`, …) live in **one** lookup in the render lane.
  Accents are typography; the vocabulary is identical.
- **Forbidden in the payload, structurally:** no timestamp, no device/browser identifier, no free
  text, and above all **no `muf_player_name`** (gate A1 — a stable identifier, already in
  `localStorage`). The guarantee is not a review promise: `buildRunReport`'s inputs are
  `RunSummary`, `FunnelState` and `levelId`, none of which can reach the byline, and the pure
  module never imports `highScoreSystem`.
- **No network, structurally:** the whole path (`src/game` builders + the clipboard hook)
  contains no `fetch` / `XMLHttpRequest` / `WebSocket` (story AC4).

### D6 — What the render lane may and may not touch

`GameState.stats` is **private to the pure layer**. The render lane never reads it: it consumes
`RunSummary` (exposed through the HUD projection built in `useGameLoop`) and the two report
builders. Rendering holds no rounding rule, no `—`-vs-`0` rule, no cause precedence — those live
in `src/game` and are covered by unit tests.

### D7 — Explicitly not built

No run history (gate Q5 — restart-scum vector and a second source of truth against the shipped
high-score board), no `newMilestonesThisRun` diff field (gate T1), no funnel UI anywhere (UX
§4), no sixth counter (gate Q4 — neutralisations deferred to v1.1), no comparison / record /
badge on `EndScreen` (spec D3.3).

## Consequences

**C1 — The tick grows one field and one call.** `GameState` gains `stats`; `tickGameState` gains
one `foldRunStats` call and three carry sites; `TriggerResult` gains one additive number. No
existing rule changes, no new event source, no new system on the loop's critical path. The
`bossQteSpec === null` byte-identity property of ADR-0051 D4 holds for _behaviour_; the state
shape does change, so identity tests comparing whole states need their fixture updated once.

**C2 — Every counter is replayable.** No `Date.now()`, no `Math.random()` anywhere on the
counting path; duration comes from the existing `elapsedSeconds` accumulator, which is already
frozen during pause (`useGameLoop` early-returns), during QTEs and during the boss duel — so the
exported duration is _effective play time_ by construction, not by a special case (spec D2.4.3).

**C3 — A fifth `muf_*` key exists.** Storage surface goes from four keys to five; quota pressure
is negligible (one small object). The two features that both describe "how did this run go" —
this one and the Sprint-4 high-score board — now have distinct keys, distinct shapes and no
shared mutable state; the seam must be re-read as a pair when Sprint 4 reopens `EndScreen`
(gate A7).

**C4 — Two storage conventions now coexist, knowingly.** Four existing owners keep their I/O
inside `src/game/systems`; this feature splits pure-parse from impure-I/O across the `src/game`
↔ `src/hooks` seam. Accepted because this is the first stored blob whose content leaves the
machine (clipboard → a third party), so keeping `src/game` free of both `localStorage` and
`navigator.clipboard` is worth one inconsistency; and because the pure half is genuinely
non-trivial (total parse of an untrusted blob, idempotent OR-merge). **This ADR does not
authorise retro-migrating the other four** — that is a separate, behaviour-free refactor story
if anyone ever wants it. Until then "where does storage live?" has two answers, and this
paragraph is the answer to why.

**C5 — `EndScreen` stops being a plain click-anywhere overlay.** It gains a single non-closing
controls block with ≥24 px of inert padding (gate R1). That is a change to a shipped
interaction, ruled in-lane by the design gate (Q6), and it narrows — never removes — the dismiss
surface. Story AC9 (dismiss stays one action) is preserved and is exactly what the gate's A7
acceptance check measures.

**C6 — A spec clause is unreachable in the build, and stays that way.** Spec D2.5.3 wants a
negative final score displayed as-is; `tickGameState` already floors the score at 0
(`Math.max(0, …)`). Making it reachable would mean changing a scoring rule from inside a feature
that promised only to observe the loop. **Ruling: no code change.** The export carries the score
exactly as the game holds it (≥ 0). Reported back to `game-designer` / `pm` as a spec-vs-build
discrepancy, not a defect (closes the score half of gate advisory A5; the "does it traverse the
export" half stays a stage-5 check).

**C7 — Two lanes build in parallel behind one contract file.** `src/game/types/runStats.ts` is
written first by `dev-gameplay` and imported read-only by `dev-r3f-render`; no other file is
touched by both lanes. Detailed lane split: hand-off §4.

## Alternatives Considered

**A1 — A pure observer diffing the pre-tick and post-tick `GameState`, with zero modification to
existing systems.** Architecturally the most attractive (no field in `GameState`, no fold in the
tick) and rejected on facts: hearts lost cannot be recovered from the `lives` delta (crate
heals), and separating a courier fault from a crate reward would mean filtering `pointFeedback`
on the sign of `livesDelta` — a heuristic riding on a cosmetic channel, which the next
negative-reward crate breaks in silence. An observer that has to guess is not an observer.

**A2 — A per-tick event bus (`state.statEvents: readonly StatEvent[]`) drained by the bridge.**
Generic and extensible, rejected as speculative: five counters do not need a bus, it allocates
per tick on the hot path, and it invites exactly the analytics inflation the story caps (risk
3). `foldRunStats` with a typed fact record gives the same decoupling at no runtime cost.

**A3 — Compute the whole summary at run end from the terminal state alone.** The simplest
possible design, and impossible: the delivery outcome is destroyed by the `→ GONE` transition
and the crate/damage history is not in the terminal state at all. That is _why_ `RunStats`
exists — and also why `RunStats` holds nothing else.

**A4 — Keep the funnel's `localStorage` I/O in `src/game/systems/runFunnelSystem.ts`, matching
the four existing owners.** More consistent with today's codebase, rejected: it puts browser I/O
next to the one module whose output is copied off-machine, and it forces the funnel's unit tests
to run against a DOM global instead of pure values. See C4 — the inconsistency is the price, and
it is documented rather than hidden.

**A5 — Reuse `muf_scores_<levelId>` / extend the score entry with the funnel.** Rejected on the
story's own AC7 and on the gate's Q5 reasoning: two features, two lifetimes, two shapes; sharing
a key would let the Sprint-4 board and the playtest instrumentation mutate each other's blob.

---

**Next stage:** dev lanes in parallel — `dev-gameplay` (pure counters, TDD, `src/game`) ∥
`dev-r3f-render` (`EndScreen` controls block, detail panel, export, funnel adapter in
`src/hooks`) — per the tech plan in `docs/handoffs/story-run-stats-system.md` §4.
