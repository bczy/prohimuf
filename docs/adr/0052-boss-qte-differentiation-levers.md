# 0052 — Boss QTE differentiation pack (5 levers): in-tableau extension of the ADR-0051 duel, no freeze-law exception

- **Status:** Accepted
- **Date:** 2026-07-20
- **Number:** 0052, **allocated by `producer` (Marion)** at DESIGN stage and recorded in the
  story shard (`docs/handoffs/story-boss-qte-differentiation.md` §2) — not self-allocated
  (the ADR-README rule; the guard against the duplicate-number bug).
- **Extends (does NOT supersede):**
  [ADR-0051](./0051-boss-qte-encounter-system.md) — the boss QTE encounter system. This ADR
  is to ADR-0051 exactly what ADR-0051 is to [ADR-0030](./0030-hostage-taker-feature-and-sprite.md)
  / [ADR-0034](./0034-hostage-qte-duel-porte-cochere.md): it EXTENDS the contract in place and
  states, per lever, what is reused vs. newly authored, mirroring the revision-log discipline
  those prior ADRs established (story Architecture directive, binding). ADR-0051 stays Accepted
  and is not amended.
- **Narrows one ADR-0051 clause (recorded, not silent):** ADR-0051 D1 held the boss's
  **top-level** phase machine `ZOOMING → ACTIVE → (WON|LOST) → DONE` "byte-shape-identical to
  the shell" as a V1 non-divergence guarantee. Lever 5 (D3 below) adds a `FINISHER` node to that
  top-level machine. This is the sanctioned divergence the differentiation story exists to make;
  ADR-0051 D1's _isolation/additive-and-optional_ property (`bossQteSpec === null` ⇒ byte-for-byte
  identical) is UNTOUCHED — only its "no new top-level phase" sub-clause is superseded, for the
  boss only.
- **Related:** `_bmad-output/planning-artifacts/story-boss-qte-differentiation.md` (the story,
  AC2/AC5, Architecture directive), `docs/game-design/spec-boss-qte-differentiation.md` (gated
  mechanic/tuning — the build contract this ADR ratifies), `docs/game-design/ux/spec-boss-qte-differentiation-ux.md`
  (gated UX/accessibility), `docs/game-design/spec-boss-differentiation-fiction.md` (gated
  fiction, OQ4-D), `docs/game-design/spec-boss-qte-differentiation-audio.md` +
  `docs/audio-direction.md` (gated audio), `docs/handoffs/story-boss-qte-differentiation.md` (full
  stage history incl. the §3 4-C freeze-law ruling this ADR encodes as D4),
  `src/game/systems/bossQteSystem.ts`, `src/game/types/bossQte.ts`,
  `src/render/scene/BossQteSprite.tsx`, `src/render/ui/hud/BossHpBar.tsx`.
  [ADR-0035](./0035-hostage-qte-difficulty-curve.md) (the F3 "promote a constant to a spec field
  when a curve needs it" seam this pack keeps deferred).

## Context

Bertrand's playtest of the ADR-0051 V1 dev-harness returned a structural verdict: **"c'est
limite au même gameplay que l'otage sans l'otage."** ADR-0051 D1 conceded the point in advance —
the boss and hostage QTEs "share a _shape_, not a _contract_," and shape is what the player feels.
The story selected **five differentiation levers** to change the verb or the decision (not the
dressing), sequenced Wave 1 (levers 1 points-faibles-multiples, 3 parade) / Wave 2 (levers 2
décor, 5 coup-de-grâce, 4 renfort-folded), with lever 4 (renfort) blocked pending an architecture
ruling on the freeze law. The design loop gated PASS (`lead-game-designer`, shard §5) and `pm`
cleared scope for TECH PLAN (AC7, shard §6).

Two architecture questions were left for this ADR (game-designer spec §6, shard §5/§6 handoffs):
the **finisher shape** (5-A: new top-level phase vs. an `ACTIVE` sub-state), and the **AC5 ADR
form** (amend ADR-0051 or extend it). The **4-C freeze-law ruling** was already delivered
(shard §3, option (b)); AC5 requires it be recorded here as its own explicit decision, not folded
into the reuse map.

Forces read from the real code (verified against `bossQteSystem.ts` / `types/bossQte.ts` /
`stateMachine.ts` / `useGameLoop.ts` at TECH PLAN, not assumed):

- The boss tick receives **only** `fire: boolean` + `impactPoint: Vec2` + `delta`
  (`tickBossQte`, `stateMachine.ts:168`). Every lever must decode from that surface or it forces
  a `src/hooks` / cross-boundary change.
- The freeze is **structural, not a flag**: the boss block (`stateMachine.ts:160-197`) sits at
  the top of `tickGameState` and `return`s early while `isBossQteActive`, carrying the whole rest
  of `state` through `...state`; the enemy/spawn/bullet/lives pipeline below is syntactically
  unreachable during the encounter.
- The depleting ring hit returns `phase: "WON"` **directly** with `energyDelta: QTE_BOSS_REFILL`
  (`bossQteSystem.ts:605-616`) — the one insertion point for a finisher beat.
- `isBossQteActive` (the freeze predicate) is a `bossQteSystem.ts` export, _called_ by the state
  machine — so extending which phases hold the freeze is a game-lane change, not a seam edit.
- The render already draws every V1 read **procedurally on the `enemy_riot` fallback sprite**
  (posture-hunch, re-arm brace, phase-break pulse quad, per-hit recoil) — no canon boss art
  exists yet (ADR-0051 art-gate N1/N2, deferred to the Niveau-Final story).

## Decision

### D1 — A new ADR that EXTENDS ADR-0051 in place; the whole pack stays inside the boss system

All five levers are authored **entirely within `src/game/systems/bossQteSystem.ts` +
`src/game/types/bossQte.ts`** (pure, TDD) and **`src/render/scene/BossQteSprite.tsx` +
`src/render/ui/hud/BossHpBar.tsx`** (logic-free view). The ADR-0051 D1 "separate, additive boss
system" holds: `qteSystem.ts` / `hostageQte.ts` are **not** touched, and the frozen shipped
hostage contract is not re-opened.

**Load-bearing finding — the cross-cutting seam is untouched.** Because every lever decodes from
the existing `fire`+`impactPoint` and lives inside `tickBossQte` / the boss runtime,
**`src/game/systems/stateMachine.ts` and `src/hooks/useGameLoop.ts` are byte-untouched by this
story**, and no shipped `LevelConfig` changes (only the non-shipped harness gains a `decorProp`).
The structural early-return freeze (`stateMachine.ts:160-197`) and the quota-gate interception
(D3/D4 of ADR-0051) are literally unchanged. This is what makes the pack safe to build as three
parallel lanes and reduces the merge-gate's cross-boundary surface to zero.

### D2 — Per-lever reuse map (extends-in-place vs. newly authored), AC2

Ratifies the game-designer spec's per-lever AC2 maps against the verified code. "Extends in
place" = an existing export/field/constant is reused or its behaviour widened; "newly authored" =
new fields/constants/branches, all boss-only.

**Lever 1 — points faibles multiples (two simultaneous rings, phase 2+):**

- _Extends:_ the `EXPOSED` stance; the single `windowChipped` bool (a chip from **either** ring
  answers the one window — no double jeopardy, no second loss clock); `RING_HIT_RADIUS 0.30`;
  `BOSS_DAMAGE_VITAL 2` / `BOSS_DAMAGE_LIMB 1`; the seeded `bossWander` closed-form (called a
  **second time** with a decorrelating salt for ring B); the phase-break beat as the
  introduction gate. Phase 1 is byte-behaviour-identical to V1 (single ring, `bossRingZoneAt`).
- _Newly authored:_ a second ring on the runtime (`targetOffsetB` + a **fixed** `ringB` identity =
  limb — no `bossRingZoneAt` re-read for the two-ring case); per-ring wander sub-boxes
  (`BOSS_VITAL_WANDER_*` ⊂ head band, `BOSS_LIMB_WANDER_*` ⊂ torso band — the ⊂-band containment
  **asserted in `createBossQte`**, colour-honesty); per-ring wander-speed multipliers (vital ×1.0,
  limb ×0.6); ring-B's wander salt (dev-gameplay's exact choice; the seeded-pure law is
  unchanged); the overlap tie-break (score vital, deterministic).

**Lever 3 — parade (same fire-click, charged/parry window):**

- _Extends:_ the `fire`+`impactPoint` input (**no `src/hooks` change** — 3-A, verified); the
  telegraph discipline + its floors (`BOSS_TELEGRAPH_LEAD_FLOOR`, `lull > lead`); `RING_HIT_RADIUS`
  (reused as the parry-point catch radius); `QTE_PANIC_SHOT −6`; the fire-resolves-before-loss
  tie-break.
- _Newly authored:_ a `chargedWindow` runtime flag; `BOSS_PARRY_POINT` (fixed anchor-relative,
  default `(−0.40, 0.30)`); per-phase `parryLeadSeconds` (0.8/0.6) + `parryWindowSeconds`
  (0.7/0.6), each with **its own asserted floor** (`parryLeadSeconds ≥ BOSS_TELEGRAPH_LEAD_FLOOR`
  and `< lull`; `parryWindowSeconds ≥ PEEK_EXPOSURE_FLOOR`); a **STAGGER sub-state**
  (`staggerRemaining`, damage-free, then opens a bonus `EXPOSED` window — a cousin of the
  phase-break sub-state that opens a window instead of re-SHIELDing); `QTE_PARRY_CHIP +2` (HP),
  `QTE_CHARGED_WHIFF −10` (energy, replaces the phase drain on that close, single charge). The
  charged-window cadence is a V1 system constant (F3-promotable).

**Lever 2 — décor interactif (SHIELDED-gap prop + smoke):**

- _Extends:_ the SHIELDED lull (the prop arms within it); the telegraph discipline;
  `RING_HIT_RADIUS` (prop catch radius); the additive-and-optional law (`decorProp` absent ⇒
  unchanged).
- _Newly authored:_ **`BossQteSpec.decorProp?: { position: Vec2; armPhaseIndex: number }`** (one
  optional authored prop — the phaseCount-as-data precedent, minimally; array-promotion is the
  deferred F3 seam); runtime `decorArmed` / `decorConsumed`; a prop hit-test; `BOSS_DECOR_DAMAGE 3`
  (single-use, **pure upside** — no failure surface); a scripted `smokeActive` flag with the
  **floor guarantee** (visual telegraph degraded, **never removed**, retains the full
  `BOSS_TELEGRAPH_LEAD_FLOOR` lead — the game owns the boolean + the guarantee; the degradation
  look and the redundant audio tell are render/UX/sound, per the gated ADD-not-REPLACE 2-C ruling).

**Lever 5 — coup de grâce:** see D3 (its own decision).

**Lever 4 — renfort:** the reuse map is the **ordinary paragraph below**; the freeze-law
_decision_ is D4 (kept separate per the story's Architecture directive — it must not be folded
into this map).

- _Extends:_ the SHIELDED↔EXPOSED window machine; the blown-window drain event (magnitude
  modulated under the surge); the telegraph discipline + floors; the seeded-pure determinism law;
  the energy ledger; `maxBlownWindows` (**untouched** — the surge never adds counts).
- _Newly authored (all inside `bossQteSystem.ts` / `types/bossQte.ts`):_ a `renfortSurge` scripted
  descriptor (onset window ordinal + duration in windows, V1 constant); a runtime `renfortActive`
  flag derived from `windowOrdinal`; `QTE_RENFORT_DRAIN −12` (a blown window under the surge, a
  single heavier charge, **loss-clock-neutral**); the surge onset tell flag.

### D3 — Finisher shape (5-A): RATIFY a new top-level `FINISHER` phase, not an `ACTIVE` sub-state

The mechanics spec chose a dedicated FINISHER beat that **precedes** `QTE_RESULT_HOLD`. I ratify
the beat and rule its shape: **`FINISHER` is a new node in the top-level phase machine**, inserted
between `ACTIVE` and `WON`:

```
… → ACTIVE → (depleting ring hit) → FINISHER → WON → QTE_RESULT_HOLD → DONE
                                   (awaits a final click OR a 1.5 s timeout; damage-free)
```

**Why a top-level phase and NOT an `ACTIVE` sub-state (unlike the phase break):** the phase break
is a _modulation of the live duel_ — same combat, windows still cycling around it — so ADR-0051
correctly modelled it as an `ACTIVE` sub-state (a flag + timer). The finisher is the **opposite**:
a post-combat beat with no windows, no wander, no telegraph, no drain — the boss is at 0 HP. Folding
it into the `ACTIVE` case would force every branch of the most safety-critical function (shot
resolution, the SHIELDED↔EXPOSED sub-machine, telegraph, wander) to guard `if (!finisherPending)`,
growing conditional surface on the exact code the merge gate scrutinises most. A distinct top-level
node is the surgical change: the depleting-hit return (`bossQteSystem.ts:605-616`) sets
`phase: "FINISHER"` (energyDelta **0**) and seeds `finisherRemaining = FINISHER_HOLD_SECONDS 1.5`;
a new `case "FINISHER"` resolves on any `fire` OR on timeout → `phase: "WON"`, paying
`QTE_BOSS_REFILL +50` there and resetting `resultRemaining`. The forward-only, terminal shape is
preserved; `QTE_RESULT_HOLD 2.2` still runs on the following WON, unchanged.

**Contract touch (frozen for both lanes):** `BossQtePhase` gains `"FINISHER"`; `isBossQteActive`
gains `"FINISHER"` (so the freeze holds while the player delivers the coup de grâce and the level
does not complete until FINISHER → WON → DONE). The `stateMachine.ts` DONE→win/loss check
(`bossHp <= 0`) is unaffected. **5-B ratified:** the finisher is ceremonial, guaranteed-success,
damage-free — zero failure surface (`§5.6` trivially satisfied).

### D4 — The 4-C freeze-law ruling (its own decision, per the Architecture directive)

This restates the ruling already delivered in shard §3, recorded here as AC5 requires — as an
explicit decision, **not** folded into the D2 reuse map. **The story's conditional-split trigger
("if the freeze-law exception is genuinely invasive") is NOT met; there is no boundary change to
document because there is none.**

- **The freeze law is UNCHANGED and gets NO exception.** ADR-0030 D3 / ADR-0051 D2 (freeze the
  rest of the level while a QTE holds the scene) stands verbatim. The structural early-return
  (`stateMachine.ts:160-197`) is literally untouched.
- **"Renfort mi-combat" is reframed as in-tableau scripted pressure** living entirely inside the
  boss state machine — of the same family as the wandering ring — reading as "pas ses hommes" (a
  lost CRS section, fiction OQ4-D), carried by frame-edge motion + audio, with **no shootable
  body, no travelling bullet, no `lives`**. Option (a) — real roster `riot`/`normal` enemies live
  during the QTE — is REJECTED (it would run the enemy/bullet/lives pipeline inside the freeze,
  destroying the byte-identity safety property, creating two competing shot-resolution pipelines
  on one `fire`, and reintroducing stray-bullet death the anti-"mort bullshit" law forbids).
- **The four binding constraints on lever-4 logic** (a lever-4 spec violating any is a design-gate
  FAIL — held at Karim's gate, shard §5):
  1. **In-tableau only** — a telegraphed, seeded pressure shape; no shootable/damaging entity.
  2. **Priced in the existing energy/window ledger** — the surge MODULATES the boss's own
     blown-window drain to `QTE_RENFORT_DRAIN −12` on flagged windows; a single charge per window,
     **never a second clock**, and it **never accelerates `maxBlownWindows`** (one blown window =
     one count, just heavier energy). No `lives`, no travelling bullet.
  3. **Telegraphed and seeded-pure** — the surge onset is a seeded/scripted window ordinal with an
     onset tell ≥ the floor; never `Math.random` / `Date.now` / a per-tick cursor.
  4. **Reads/mutates ONLY boss-QTE runtime fields** — it must NOT read or write `enemies`,
     `spawnWave`, `couriers`, `bullets`, `lives`, or `elapsedSeconds` (frozen), and MUST NOT touch
     `qteSystem.ts` / `hostageQte.ts`.
- **Review-assert (mine, at the stage-6 panel triage):** the lever-4 diff in `bossQteSystem.ts` /
  `types/bossQte.ts` is checked to reference none of `enemies` / `spawnWave` / `couriers` /
  `bullets` / `lives` / `elapsedSeconds` and to leave `stateMachine.ts` untouched. Constraint 4 is
  also encoded as a unit assertion in the TDD suite (dev-gameplay), not left to review alone.

### D5 — Boundary, determinism & seam acceptance (restated from ADR-0051 D7, unchanged law)

- `types/bossQte.ts` — types only, zero functions.
- `bossQteSystem.ts` — pure `src/game`, zero React/Three, TDD (100 % in
  `__tests__/bossQteSystem.test.ts`); every new wander path seeded-pure (no
  `Math.random`/`Date.now`/per-tick cursor).
- **Additive-and-optional preserved:** a boss with `decorProp` absent, no charged window, no
  renfort surge, and a phase-1-only fight is byte-behaviour-identical to V1; `bossQteSpec === null`
  levels stay byte-for-byte identical (asserted).
- **New safety asserts (in `createBossQte`, against the authored/constant data):** each per-ring
  wander sub-box ⊂ its anatomy band; `parryLeadSeconds ≥ BOSS_TELEGRAPH_LEAD_FLOOR` and `< lull`;
  `parryWindowSeconds ≥ PEEK_EXPOSURE_FLOOR`; `FINISHER_HOLD_SECONDS > 0`; the renfort surge onset
  tell ≥ floor; finite-numeric guards on every new authored scalar.
- **The only game↔render bridge remains `useGameLoop.ts` — untouched.** The render layer holds no
  boss rules and reads the new runtime fields named in D2/D3.

## Consequences

**Positive**

- The whole pack is additive inside one already-separate system: the merge gate reviews new
  fields + new branches in `bossQteSystem.ts` and two view files — **not** a `stateMachine.ts`,
  `useGameLoop.ts`, hostage-system, or shipped-level change. Cross-boundary surface = zero.
- The 4-C ruling means lever 4 costs no boundary fight: no split, no freeze-law amendment.
- Phase-1 onboarding stays V1-identical; the fight diverges hard only phase 2+, answering the
  playtest verdict where it counts (majority of HP/duration) without an ambush.

**Negative / costs**

- `BossQtePhase` and `isBossQteActive` gain `FINISHER` — the one place this ADR narrows ADR-0051
  D1's "top-level machine byte-shape-identical" clause. Recorded above; the _isolation_ property
  it guaranteed is untouched.
- The `tickBossQte` `ACTIVE` case grows (two-ring shot resolution, parry decode, STAGGER, decor
  hit-test, renfort modulation). It is already the system's most complex function; the TDD suite
  must grow with it (per-lever acceptance AC-D1..D8 + the D4 constraint assertion).
- The V1 seeded-wander duplication with the hostage system (ADR-0051 D6) is untouched and still
  deferred — a second `bossWander` call for ring B stays inside the boss copy, not a shared extract.

**Gotchas**

- **Seed re-pin (stage-5, K-5 discipline):** two decorrelated ring paths + parry timing make the
  pinned-seed winnability check harder than V1's single ring. Confirm each phase-2/3 window
  presents ≥1 landable waypoint on **each** ring, each charged window a landable parry, and the
  decor arm-window landable — or re-pin `BOSS_QTE_DEV_HARNESS_LEVEL.targetSeed`. Not a contract
  blocker; a pre-ship item.
- **FINISHER freeze:** if `isBossQteActive` is NOT extended to include `FINISHER`, the level would
  complete mid-finisher — the freeze must hold through it. Covered by a unit test.
- **Smoke technique is unbounded and perf-sensitive** — its implementation must clear a
  `gpu-specialist` frame-budget verdict before the render lane locks a technique (see the lane
  partition in the story shard; the smoke is the frenzy-beat compositing over the CRT pass on
  mobile). Every other new render read reuses proven cheap idioms (quads, tints, the pulse family,
  the existing neon-rim ShaderMaterial).
- **Determinism surface widened** — the two-ring salt, parry decode, decor, renfort modulation and
  finisher are all seeded/scripted; a stray `Math.random` anywhere reopens the replay-determinism
  class. Asserted by the pure-function tests.
