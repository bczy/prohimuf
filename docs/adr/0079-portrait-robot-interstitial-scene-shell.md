# 0079 — Portrait-robot as an interstitial DOM phase: where the scene lives, and how its verdict reaches the next level

- **Status:** Proposed
- **Date:** 2026-08-05
- **Number:** 0079, allocated by producer (Marion) at story intake 2026-08-05.
- **Author:** decision content by `senior-architect` (Winston), stage 3 TECH PLAN.
- **Relates to:** ADR-0030 / ADR-0034 (the hostage QTE shell — the precedent this ADR
  deliberately does **not** reuse, see A1), ADR-0051/0060 (boss QTE — the other frozen
  sub-state), ADR-0004 D5 + ADR-0069 (the `energy` ledger this feature moves), ADR-0074
  (`LevelParams` / `validateLevel` discipline), ADR-0076 (the `src/game` ↔ `src/hooks`
  purity seam and the "no `Date.now` on the pure path" rule), ADR-0068 (lazy R3F chunk —
  why this screen must not be a Canvas), ADR-0046 (CSS Modules + tokens), ADR-0080
  (the face data model), ADR-0081 (input & presentation).
- **Inputs (canonical):** `docs/game-design/design-gate-portrait-robot.md` §3 + arbitrage
  **A4-bis** (Bertrand, 2026-08-05) — the only tuning source of truth; story
  `_bmad-output/planning-artifacts/story-portrait-robot.md`;
  `docs/game-design/spec-portrait-robot.md` (mechanics only — its tuning values are
  superseded wherever §3 speaks), `docs/game-design/spec-portrait-robot-fiction.md`,
  `docs/game-design/ux/portrait-robot-ux.md`, `docs/art-direction/brief-portrait-robot.md`,
  `docs/research/research-photofit-robocop-atari-st.md`.

## Context

The design gate (A2) places « TÊTE À CONNAÎTRE » **between** levels and forbids the two
things that would have made it cheap to build:

1. **It does not freeze the world**, because there is no world. The hostage QTE (ADR-0030)
   and the boss QTE (ADR-0051) are sub-records of `GameState` whose entire architectural
   justification is that they suspend a running simulation — `tickGameState` early-returns,
   `elapsedSeconds` and the level clock stop, the enemies stay where they were. Portrait-robot
   runs when `tickGameState` is not running at all. Modelling it as a third `GameState`
   sub-record would mean inventing a `GameState` with no facade, no enemies, no timer and no
   `LevelParams` just to host it. That is not reuse, it is a costume.
2. **Its consequence lands on a level that does not exist yet** (A1c). `energy` is a field of
   `GameState`, seeded to `ENERGY_INITIAL = 100` by `createInitialState` and clamped to
   `[0, 100]` by `applyEnergy`. A verdict produced after `LEVEL_COMPLETE` has, by
   construction, nothing to write to: the state it could touch is terminal, and the state it
   must touch is built later, by a call the render shell makes. A reward in energy is
   *inoperative* (clamped at 100) — which is exactly why A1c deletes it and keeps only the
   `FAILED` malus.

Meanwhile the repo law is unchanged: the rules (draw, scoring, verdict, effect on the next
level) belong in `src/game`; `src/render` may not hold a rule. And `AppPhase` — the machine
that would host the scene — is React state living in `src/render/scene/App.tsx`.

The whole difficulty of this ADR is that single sentence: **the phase is render-owned, the
verdict is game-owned, and the two are separated in time by a level boot.**

Two further facts shape the answer. `useGameLoop` owns `createInitialState` and re-invokes it
on restart; `LevelParams` is the only channel through which the shell already parameterises a
level (lives, time, quota, delivery, hostage, boss, loot) — all of them additive-and-optional,
all defaulting to a byte-identical pre-feature build. And a run today is *one attempt on one
level* (ADR-0076 F1): "the next level" is, concretely, the next `PLAYING` boot in the same
session.

## Decision

### D1 — `PORTRAIT_ROBOT` is a new `AppPhase`, and a **DOM screen**, not a Canvas scene

The chain becomes `PLAYING → LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT → (NAME_ENTRY |
END | next level)`. The phase is one more literal in `App.tsx`'s `AppPhase` union and one more
branch in its render, beside `NARRATIVE_PRE` / `NARRATIVE_POST` / `TUTORIAL`.

The screen itself lives at `src/render/ui/portrait/PortraitRobotScreen.tsx` — **plain DOM +
CSS Modules**, the same family as `NarrativeScreen` / `EndScreen`, and **no `<Canvas>`, no
Three, no R3F**. Motives, in order of weight:

1. **The scene has no 3D content.** It composites four stacked bitmaps, a medallion and text.
   Everything it needs is `<img>` and CSS.
2. **Accessibility is a hard requirement here** (gate A7 `aria-live` chrono announcements, UX
   44×44 px targets, the chevrons that A4-bis demotes to *accessibility targets*). DOM gives
   focus, roles and live regions for free; inside a WebGL canvas every one of them has to be
   re-invented, badly.
3. **ADR-0068.** Routing this phase through `<Canvas>` would pull the lazy Three chunk on an
   interstitial that renders no world — a network cost paid for nothing.

**Consequence that must travel back to `lead-art` (his §7.3 Q5, and his §4):** the CRT
composite is a `CrtPass` post-process **inside `GameScene`**. A DOM screen is structurally
outside it. So the honest answer to "monde de jeu or surface pré-jeu ?" is neither of his two
boxes: **it is an interactive DOM surface** — no CRT, no shader glow. The selection liseré that
the gate legitimises (§5.2) is rendered as a **CSS falloff** (`box-shadow` / gradient, never a
flat fill — bible §2.1 holds) on the keyboard-focused band, and the xerox grain is a CSS
overlay applied to the **assembled** face, which is also the answer to his §7.3 Q4: grain is
post-composition, one layer, zero per-band cost. Rendering the scene inside the Canvas *purely*
to inherit CRT was considered and rejected (A2).

### D2 — One pure system, one pure type module, one bridge hook

| Layer | Module | Holds |
| --- | --- | --- |
| `src/game/types` | `portraitRobot.ts` | `PortraitBandId`, `PortraitPuzzle`, `PortraitSelection`, `PortraitScene`, `PortraitIntent`, `PortraitOutcome`, `PortraitResult`. Types only, zero runtime (ADR-0074 §1 discipline). |
| `src/game/types` | `levelModifier.ts` | `LevelModifier` — the inter-level currency, see D4. |
| `src/game/systems` | `portraitRobotSystem.ts` | Every rule: `createPortraitScene`, `applyPortraitIntent`, `tickPortraitScene`, `resolvePortraitScene`, `levelModifierFromPortrait`, and the tuning constants of gate §3. |
| `src/hooks` | `usePortraitRobot.ts` | The bridge: a rAF/`dt` driver that calls `tickPortraitScene`, a `paused` input, and the intent inbox. Owns no rule. |
| `src/render/ui/portrait` | `PortraitRobotScreen.tsx` + `.module.css` | Draws `PortraitScene`. Decides nothing. |

`PortraitScene` is a **standalone immutable record**, *not* a field of `GameState`. It is
created at phase entry, folded by pure functions, and thrown away at phase exit — its only
residue is the `PortraitResult` (D4). `GameState` gains **nothing** from this ADR.

`applyPortraitIntent(scene, intent)` and `tickPortraitScene(scene, dt)` are total: they never
throw, never mutate, and are exhaustively unit-testable without a DOM. The chrono is a
`remainingSeconds` accumulator moved by `dt` — never a wall clock. **Zero `Date.now`, zero
`Math.random`** anywhere in `src/game` for this feature; the seed is supplied from outside (D3).

### D3 — The seed is supplied by the shell, frozen at entry, and never re-rolled

`src/game` must not invent entropy, and the scene must be replayable. So:

- `createPortraitScene(catalogue, seed, timerSeconds)` is a **pure function of its seed**. The
  draw (which variant is the truth in each band, and the presentation order of the six) is a
  hash of `seed` — ADR-0080 D4.
- The **shell** (`App.tsx`) produces the seed **once**, at the transition into
  `PORTRAIT_ROBOT`, and holds it in React state for the phase's lifetime. A re-render, an
  orientation flip, a `RotateOverlay` pause or a StrictMode double-invoke must **not** re-roll
  it — the seed is stored, not recomputed. Sourcing entropy on the shell side is the same
  posture ADR-0076 D4 took for `localStorage`: impure things live on the bridge side of the seam.
- `?portraitSeed=<n>` in the URL overrides it, so QA, the playtest and a screenshot capture can
  replay one exact puzzle. This is the reachability discipline of the existing `?preview=`
  seams, and it makes the determinism claim **testable in the built app**, not only in a unit
  test.
- **There is no retry.** Gate A3 gives one occurrence per run and A2 makes every exit path
  (submit, timeout, confirmed abandon) resolve at the current state. The scaffold's open
  question "same lineup on retry or re-roll?" is therefore **void by design**: no path re-enters
  the scene.

### D4 — The verdict travels as a `LevelModifier`, applied at the *next* `createInitialState`

This is the load-bearing leg. Three objects, three owners:

```ts
// src/game/types/portraitRobot.ts — the pure verdict
export type PortraitOutcome = "IDENTIFIED" | "PARTIAL" | "FAILED";
export interface PortraitResult {
  readonly outcome: PortraitOutcome;
  readonly correctCount: number; // 0..4
  readonly scoreDelta: number;   // 1500 | 400 | 0
}

// src/game/types/levelModifier.ts — the inter-level currency
export interface LevelModifier {
  readonly energyDelta: number;           // −20 on FAILED, else 0
  readonly firstWaveDelaySeconds: number; // 20 | 10 | 0
  readonly narrativeBeat: PortraitOutcome | null; // which obligatory beat to play
}
```

1. **The rule** is `levelModifierFromPortrait(result): LevelModifier`, pure, in
   `src/game/systems/portraitRobotSystem.ts`. It is the *only* place the gate's §3 payoff table
   is written down. `src/render` never maps an outcome to a number.
2. **The carrier** is React state in `App.tsx`: `pendingModifier: LevelModifier | null`. The
   shell holds an opaque value it does not interpret — exactly as it already holds
   `PendingScore` between `LEVEL_COMPLETE` and `NAME_ENTRY` (ADR-0054 §2). Holding a value is
   not holding a rule.
3. **The application point** is `createInitialState`, through **one new optional field on
   `LevelParams`**:

   ```ts
   readonly modifier?: LevelModifier | null; // absent/null ⇒ byte-identical to today
   ```

   with exactly two effects inside `createInitialState`:

   - `energy: applyEnergy(ENERGY_INITIAL, modifier?.energyDelta ?? 0)` — the existing clamp is
     reused, so a malus can never produce a negative or an out-of-range capital, and a
     hypothetical future bonus is silently clamped (which is *why* A1c deleted the reward).
   - `waveHoldRemaining: modifier?.firstWaveDelaySeconds ?? 0` — a new `GameState` number
     (default `0`).

   `firstWaveDelaySeconds` is enforced by **one guard on one branch**: step 3 of `tickGameState`
   ("spawn new wave if all enemies dead") is gated on `waveHoldRemaining <= 0`, and the hold is
   decremented by `dt` in the same tick. While the hold is live, **neither the spawn nor the
   wave rollover fires** — both sit in that one branch, so an empty street cannot silently
   inflate `wave` to 4 before the first enemy appears. `createInitialState` seeds `enemies: []`
   when the hold is non-zero. With no modifier the field is `0`, the guard is `true` on the
   first tick, and the build is byte-for-byte the pre-feature build (the ADR-0051 D4 identity
   property, restated for this feature).

**Why not persist it.** `pendingModifier` is **session state, never `localStorage`**. It has a
lifetime of one transition; a fifth `muf_*` key for a value consumed within seconds would be
storage for storage's sake, and it would let a reload duplicate or resurrect a sanction. If the
player quits to the menu before starting the next level, the modifier dies with the session — a
deliberate, documented leniency (this is a payoff modifier, not a debt).

**Consequence flagged to `game-designer` (stage 5):** a 20 s wave hold on a level whose clock
keeps running is *less pressure and less kill time* on a quota level. That is the payoff working
as designed, but it moves the quota difficulty. Re-check at playtest against gate A11 — a tuning
fact, not a defect.

### D5 — The obligatory narrative beat is data, resolved in the pure layer

Gate A1b/A10 make the next-level beat **mandatory**. `narrativeBeat` rides in the
`LevelModifier`; the pre-level narrative screen selects the scripted lines for that outcome from
`narrativeSystem` (data, in `src/game`), exactly as `PRE_LEVEL_NARRATIVE` is selected by level
id today. The render lane picks *a scene by key*; it does not author or branch on the verdict's
meaning.

### D6 — Skippability, abandon, and the `RotateOverlay` pause

- The framing lines are skippable in one gesture (guidelines §5.3, reusing `NarrativeScreen`'s
  existing skip path). **The interactive phase is not skippable.**
- `Escape` / Android back ⇒ the existing light confirmation, whose resolution calls
  `resolvePortraitScene` **at the current state**, byte-identical to timer expiry. There is
  exactly **one** resolution function and every exit path goes through it: submit, timeout,
  confirmed abandon. No exit path can produce an unevaluated scene (gate A2).
- `usePortraitRobot` takes a `paused: boolean`; `App.tsx` passes `rotateBlocked` (its existing
  `IS_MOBILE && isPortrait` signal). Paused ⇒ `tickPortraitScene` is not called, so the chrono
  is frozen by *not advancing*, never by a special case inside the rule. Same posture as
  `useGameLoop`'s pause early-return (ADR-0076 C2).

### D7 — Explicitly not built

No `GameState` sub-record; no persistence; no retry/practice mode; no second occurrence; no
life delta of any kind (the type has no field for one — the prohibition is **structural**, not a
review promise: `LevelModifier` cannot express a life loss); no energy reward; no effect on
quota, weapons, geometry or completion; no CRT/Three on this phase.

## Consequences

**C1 — `GameState` grows exactly one number, `LevelParams` one optional field.** The tick grows
one guard on one existing branch and one decrement. Every other system is untouched. Absent a
modifier, behaviour is identical; the state-shape fixtures in the identity tests need updating
once.

**C2 — A rule now lives one level-boot away from its trigger.** The verdict is computed in one
phase and applied in another, with React state in between. That seam is the cost of A1c and it
is deliberate; it is made safe by the modifier being an *opaque, closed* value type the shell
can only carry, and by `levelModifierFromPortrait` being the single writer of the payoff numbers.

**C3 — The scene is unreachable from any menu.** Its only entry is the post-level chain plus
`?portraitSeed=` for capture. No player path repeats it (gate A3, story AC8), and that property
is testable from `App.tsx`'s transition table.

**C4 — The art brief needs a correction descended to it.** `lead-art` §4 assumes CRT + the
world's glow law; D1 says DOM, CSS falloff, post-composition grain. His §4 and the bible entry
he plans must be rewritten on that basis before the prompt gate.

**C5 — Two lanes build behind one contract file.** `src/game/types/portraitRobot.ts` +
`levelModifier.ts` are written first by `dev-gameplay` and imported read-only by everyone else.
No file is edited by two lanes. Split: hand-off §3.

## Alternatives Considered

**A1 — Model it like the QTEs: a `portrait` sub-record of `GameState`, frozen tick.** The most
"consistent-looking" option and wrong on facts: the QTE shell's entire purpose is to suspend a
running simulation, and there is no simulation here. It would force a synthetic `GameState`
(facade, enemies, level clock, `LevelParams`) into existence to host a screen that uses none of
it, and it would drag `tickGameState` — already a ~530-line function with seven return sites —
into a phase that has nothing to do with the game loop. Rejected on both counts.

**A2 — Render the scene inside the R3F `<Canvas>` so it inherits `CrtPass`.** Attractive for one
reason only (visual consistency with `lead-art`'s preference), and rejected on three: it pulls
the lazy Three chunk (ADR-0068) for a screen with no 3D content; it destroys the DOM
accessibility surface the gate requires (`aria-live` chrono, 44 px targets, focus order); and it
makes the 4-band composite a texture problem instead of a layout problem. A CSS grain and a CSS
falloff buy 90 % of the look at 0 % of that cost.

**A3 — Apply the −20 energy immediately, to the finished level's state.** The obvious reading of
"the scene costs energy", and inert: the level is over, nothing reads that number again. A1c
exists precisely because this option is a no-op dressed as a sanction.

**A4 — Persist the modifier in a `muf_portrait` `localStorage` key.** Rejected: a value with a
lifetime of one transition does not earn a storage key (ADR-0076 C3's pressure, in reverse), and
persistence introduces two new failure modes — a sanction resurrected on reload, and a sanction
applied twice — for zero player-visible benefit.

**A5 — Let `App.tsx` compute `energyDelta` / `firstWaveDelaySeconds` from the outcome inline
(it is "just a switch").** This is the boundary breach the repo law exists to stop. Three numbers
from the gate's §3 table would live in the render layer, untested, and the next tuning pass would
edit a `.tsx` file. `levelModifierFromPortrait` is four lines; the discipline is the point.

**A6 — Delay the first wave with a scripted timeline event instead of a state field.** Cleaner in
the abstract and premature: story ② of the level-editor track (ADR-0074) may bring a real
`timeline`, at which point the hold becomes one timeline event and this field is deleted.
Building the timeline *now*, for one consumer, is speculative generality — flagged here so the
future migration is a known, cheap follow-up rather than a discovery.

---

**Next stage:** dev lanes per `docs/handoffs/story-portrait-robot.md` §3.
