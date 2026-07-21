# 0055 — Multi-weapon pickup system (roster A-B-C): weapon state, N-resolution hitscan, LOOT crate

- **Status:** Accepted — **amended 2026-07-20** (D5 enforcement clause, D6 struck, D1 seam
  note; see amendment below)
- **Date:** 2026-07-20
- **Story:** armement complet / multi-armes par pickup (`docs/handoffs/story-weapons-pickup.md`)
- **Spec (GATED):** [../game-design/weapons.md](../game-design/weapons.md) (design gate round 2: PASS + P1/P2/P3)
- **PM story:** [../../\_bmad-output/planning-artifacts/story-weapons-pickup.md](../../_bmad-output/planning-artifacts/story-weapons-pickup.md)
- **Grounds on / relates to:** ADR-0040 (player-shot hitscan + render-transient impacts),
  ADR-0003 (controller contract, discrete-tap model), ADR-0034 (hostage QTE), ADR-0051 (boss
  QTE), ADR-0004 (per-level roster gate — the additive-and-optional precedent).

## Context

The shipped player shot is an **instant hitscan resolved at one crosshair world point**
(ADR-0040, `resolvePlayerShot` in `bulletSystem.ts`): nearest-eligible enemy within
`HIT_RADIUS = 0.8` (tie → lowest `slotIndex`), one shot = one target, window-hit takes
priority, and **only a miss** can hit a courier (`resolveCourierShot`, `stateMachine.ts`
L317-325). The tick emits **at most one** `ImpactEvent` (`GameState.impactEvents`, commented
"0 or 1 element").

The gated spec adds a one-active-weapon-at-a-time pickup system (roster V1 = A `base` ∞ /
B `auto` finite / C `spread` finite), acquired by shooting an armament crate, auto-returning
to `base` when a special empties. It keeps the ADR-0040 resolution primitive verbatim and
defines each weapon as **N independent hitscan resolutions** at deterministic offsets. That
forces boundary decisions the design gate and pm handed to the architect:

1. Where the weapon state lives and its shape.
2. How `resolvePlayerShot` extends to N resolutions with the §2.4 precedence
   (left→centre→right, no double-billing) — and the **P1** courier-resolution loop-widening
   (up to 3 courier-on-miss invocations/tick vs today's single one).
3. The `GameState.impactEvents` invariant widening (0-or-1 → 0-to-3) and its render impact.
4. Per-trigger burst scheduling across ticks (B) as pure tick state.
5. The LOOT crate: **new `EnemyKind` vs new entity** — pm/Karim both require it stays off the
   `ARCHETYPES`/score-lives path (a crate hit never emits a stray `scoreDelta`/`livesDelta`).
6. **P2** mid-burst / multi-resolution crate-equip ordering.
7. QTE-freeze weapon-state contract; Belliard-first rollout.

Boundary law (unchanged): `src/game/**` pure (no React/Three), holds all rules; `src/render/**`
renders state, no rules; `src/hooks/**` is the only bridge.

## Decision

### D1 — Weapon state shape in `GameState`

Add one rule-owned field `readonly weapon: WeaponState` to `GameState`, plus a transient
`readonly weaponEmpty?: boolean` (mirroring `feedback`/`impactEvents`: one tick, consumed by
the bridge, never persisted). New pure module `src/game/types/weapon.ts`:

```
type WeaponKind = "base" | "auto" | "spread";

interface WeaponState {           // runtime, on GameState
  readonly active: WeaponKind;
  readonly stock: number;         // base = Infinity, never decremented
  readonly burstRemaining: number;// B only; 0 when idle
  readonly burstTimerMs: number;  // accumulator to the next burst round
  readonly refractoryMs: number;  // post-burst lockout remaining
}
```

The **data table** `WEAPON_SPECS: Record<WeaponKind, WeaponSpec>` (burst rounds/interval/
refractory, start stock or `Infinity`, offset list) lives in `weapon.ts` — the exact precedent
of `ARCHETYPES` in `enemyTypes.ts` (a data const, not runtime logic). `WeaponSpec` carries the
§7 tuning values, which stay `verify`-tunable (not gated). `createInitialState` seeds
`weapon: { active: "base", stock: Infinity, burstRemaining: 0, burstTimerMs: 0, refractoryMs: 0 }`.

### D2 — N-resolution hitscan: thread a sequential fold, reuse the ADR-0040 primitive

A new pure orchestrator `src/game/systems/weaponSystem.ts` owns "one trigger → 1..3 resolutions".
The single-resolution primitive stays `resolvePlayerShot` (in `bulletSystem.ts`), **extended**
to resolve one world point against **both** the enemy set and the (optional) VISIBLE LOOT crate
and to return a discriminated outcome (`enemy-hit` with the existing reward math | `loot-hit`
with **no** reward | `miss`). Per-resolution precedence is byte-identical ADR-0040: window
(enemy **or** crate) priority first, tie → lowest `slotIndex`; a consumed resolution cannot also
hit a courier.

`weaponSystem.resolveTrigger(...)` computes the tick's offset list — A: `[0]`; B: `[0]` **iff**
a burst round fires this tick (D4); C: `[-2, 0, +2]` (façade column pitch, `col*2-18` in
`facade01.ts`) — and folds the resolutions **sequentially left→centre→right, threading the enemy
set and the courier set** through each step. Threading gives §2.4 for free: `resolvePlayerShot`
already skips `HIT`/`DEAD`/`HIDDEN`, so an enemy downed by an earlier offset is excluded from
later ones (the discs also never overlap — belt-and-suspenders). The fold accumulates the
score/lives/time deltas, `targetsDown`, `HitEvent[]`, `PointHitEvent[]`, and the impact list.

**P1 — courier loop-widening (priced here, not just `impactEvents`).** Courier-on-miss moves
from a single post-shot call in `stateMachine.ts` (L319-325) into the per-offset fold: **each
MISS offset** invokes `resolveCourierShot` at **that offset's** world point, threading the
courier set so a courier downed by an earlier barrel is not re-hit. Consequence: up to
`BURST_ROUNDS` (B, across ticks) or **up to 3 (C, one tick)** courier resolutions where today
there is exactly one. This is the full-innocent-penalty-per-resolution / no-amnesty rule (spec
§3, AC5) made structural. Gated behind `courierField !== undefined` exactly as today (absent ⇒
no courier resolution, preserving levels without a street). The cost is bounded (≤3/tick) and
the fold stays O(offsets × entities) — negligible at these counts.

### D3 — `impactEvents` invariant widens 0-or-1 → 0-to-3; render is already N-safe

The comment on `GameState.impactEvents` changes to "0 to 3 elements (C `spread` emits up to 3
per tick; A/B emit ≤1)". `PlayerShotResult`'s single `impact` is superseded by the orchestrator
returning `impacts: readonly ImpactEvent[]`. `weaponEmpty` is a **distinct** transient field, not
an `ImpactEvent` — it does not inflate this list.

**Key finding — no render-consumer rewrite.** The render side is already N-impact-safe: the
bridge drains with `for (const ev of next.impactEvents) impactChannel.queue.push(ev)`
(`useGameLoop.ts` L418-419) and `ImpactEffects.tsx` consumes `channel.queue.splice(0)` as a list
into pools of 12 (L220). Three impacts in one tick already render correctly today. The widening
is therefore a **game-side + type-comment** change only; Lane B touches the impact path for
**nothing** here (its render work is the crate + HUD, D8).

### D4 — Per-trigger burst (B) as pure tick state; timer-accumulator cadence

B is a **per-trigger burst**, not held-auto (ADR-0003 has no hold gesture; identical on desktop
tap and mobile tap — zero new binding, W8/AC3). `resolveTrigger` advances `burstTimerMs`/
`refractoryMs` by `delta` each tick. A `fire` while `burstRemaining === 0` **and**
`refractoryMs <= 0` starts a burst (`burstRemaining = BURST_ROUNDS`); further `fire` during a
burst is ignored (auto-sequenced). A burst round is emitted on the tick where `burstTimerMs`
crosses `BURST_INTERVAL_MS` (**at most one round per tick**; this reconciles the spec §2.3
"1 round/tick" wording with the `BURST_INTERVAL_MS = 90` cadence — at 60 fps a round lands every
~5-6 ticks). Each round = one offset-`[0]` resolution at that tick's **live** crosshair,
decrements `burstRemaining` and **stock by 1 round**. On `burstRemaining → 0`, arm
`BURST_REFRACTORY_MS`. Burst state rides `GameState.weapon`, so it is naturally frozen during a
QTE (D7). No `pendingShots` coupling: the tick's `fire: boolean` + `delta` are sufficient — burst
scheduling is entirely inside `WeaponState`.

### D5 — LOOT crate is a NEW ENTITY, not a new `EnemyKind` (structural, not by-convention)

The crate is a **separate entity**, not an `ARCHETYPES` row:

- New type `src/game/types/loot.ts`: `LootCrate { id, slotIndex, state: LootState, timer,
weapon: Exclude<WeaponKind,"base"> }` where `LootState` reuses the window state-machine shape
  (`HIDDEN | APPEARING | VISIBLE | ...`). New field `readonly loot: LootCrate | null` on
  `GameState`.
- New pure `src/game/systems/lootSystem.ts`: spawn (with the §5.4 exclusion rule) + tick (the
  small state machine), all pure and unit-testable.

**Why a new entity, not a weight-0 `EnemyKind`.** A weight-0 archetype with all-zero deltas
would be "off the score path" only _by convention_ — it would still flow through the
`ARCHETYPES` reward math, `hitEnemy` (hp-decrement semantics a crate does not have), `HitEvent`
emission, and `targetsDown` accounting. Both pm and the design gate require the crate to be
**structurally incapable** of emitting `scoreDelta`/`livesDelta` (story AC7-loot). A separate
entity delivers that by construction: a `loot-hit` outcome routes to equip only, never touching
`ARCHETYPES`/`hitEnemy`/`HitEvent`. It also avoids perturbing the frozen `WEIGHTED` pool
(`pickKind` determinism) that adding any spawnable kind would. The precedent civilian/
`hostage_taker` weight-0 rows are inert _descriptors that never spawn_; a crate **must** spawn,
so that precedent does not transfer. Cost: the appearing/visible timing enum is duplicated in
`LootState` (small; the alternative leaks a rule-bearing coupling into `ARCHETYPES`).

Slot sharing: the crate holds a `slotIndex` and shares the window channel by **occupying** a
slot (one entity per slot — enemies and the crate never co-locate, spec §5.3). The extended
`resolvePlayerShot` scans enemies ∪ {VISIBLE crate} for nearest-within-`HIT_RADIUS`; deterministic
tie-break on `slotIndex` spans both types.

**§5.4 spawn-exclusion** is a pure predicate in `lootSystem`:
`∀ active slot a (APPEARING|VISIBLE|SHOOTING): |loot.col − a.col| ≥ LOOT_SPAWN_MIN_COL_GAP (=2)`;
if unsatisfiable this tick, the spawn is **deferred** (never force-placed). Unit-tested (AC9).

### D6 — Equip ordering + P2 (mid-burst / multi-resolution equip)

Baseline (spec §5.2): the shot that hits a `VISIBLE` crate resolves under the **currently-active**
weapon; the equipped weapon takes effect from the **next** trigger, at full stock; the prior
special's remaining stock is lost.

**P2 decision (adopting the gate's default proposal): an equipping resolution takes effect
immediately and aborts any remaining burst rounds that tick.** Concretely:

- A **B burst round** that lands on a crate: equip immediately, set `active` to the crate's
  weapon at full stock, and **clear `burstRemaining` (and refractory)** — the old special's
  in-flight burst stops that tick. The equip cannot be undone.
- A **C press** (3 simultaneous barrels) resolves all 3 under the pre-press weapon (the offset
  set is fixed at press time; a mid-press crate hit does **not** re-arm the fan). If **more than
  one** barrel lands on a crate — reachable, since two crates ≥2 cols apart can both sit in the
  3-adjacent-column span — the **last in resolution order (left→centre→right, i.e. right-most)**
  is the equipped weapon; earlier crate hits are consumed but overwritten same trigger. Equip
  takes effect from the next trigger.

Rationale: deterministic, matches "equip cannot be undone", and the §5.4 exclusion makes the
multi-crate case rare. This closes the guessing surface the gate flagged.

### D7 — QTE-freeze weapon contract (satisfied by construction)

Adding `weapon` to `GameState` makes AC6 hold structurally: both QTE branches early-return
`{ ...state, ... }` (`stateMachine.ts` L169-180 hostage-boss, L226-238 hostage) without touching
`weapon`, so `active`/`stock`/`burstRemaining`/timers ride `...state` **frozen**. Because
`weaponSystem` and `lootSystem` run only on the normal-tick path (never in the frozen branches),
no burst advances, no stock is consumed, and no crate spawns or is resolvable during a freeze
(spec §4, AC6). A burst caught mid-flight when a QTE triggers simply freezes and resumes on exit
— acceptable (stock is frozen, not lost).

### D8 — Belliard-first rollout via `LevelConfig` (additive-and-optional)

Follow the ADR-0004/0030/0051 precedent exactly: an optional `LevelConfig.loot?: LootSpec` (crate
spawn cadence / eligible weapons), threaded through `LevelParams.loot` into `createInitialState`.
**Absent ⇒ no crates spawn** → every shipped level's tick stays byte-for-byte identical (the
weapon field is present but always `base`/∞, and `resolveTrigger` under `base` is the ADR-0040
shot). Only Belliard opts in for V1. No per-level scripted crate data beyond the enable/cadence
gate (pm ruling #3: generic spawn).

## Consequences

**Positive.**

- `GameState` stays rule-only; the `base`/no-loot path is byte-identical to ADR-0040 (identity
  guaranteed by "no `LevelConfig.loot` ⇒ weapon always `base`, no crate entity").
- Clean disjoint lanes behind a typed seam (`weapon.ts` / `loot.ts` / the new `GameState`
  fields): `dev-gameplay` owns all of `src/game/**`; `dev-r3f-render` owns `src/render/**` + the
  view bridge. The multi-impact render path needs **zero** change (D3).
- LOOT is structurally off the score/lives path (D5) — AC7-loot cannot regress by a future
  `ARCHETYPES` edit.
- Burst is pure tick state (D4) — deterministic, replay-safe, testable in `src/game`.

**Negative / gotchas.**

- **P1 loop-widening:** courier-on-miss now runs up to 3×/tick. Reviewers must confirm courier
  threading (no double-hit of one courier within a press) and that the `courierField === undefined`
  gate still short-circuits. Deterministic order = left→centre→right.
- `resolvePlayerShot`'s signature grows (crate arg + discriminated outcome). Its existing
  enemy/courier reward tests must stay green (only the added loot branch is new behaviour).
- `LootState` duplicates the appearing/visible timing enum — accepted to keep the rule boundary
  clean (D5).
- The `weaponEmpty` transient is a **new bridge drain** (`useGameLoop.ts`, Lane B): it must be
  consumed per-frame like `impactEvents`/`feedback`, or the HUD flash / SFX cue misfires. It is
  distinct from `impactEvents`.
- Base `stock === Infinity` is a `number` sentinel: `weaponSystem` must never decrement `base`
  and the HUD must render ∞ (never a counter/red/blink) — AC11.

## Notes for downstream

- **P3** (B stock-unit = round, not press) is a pm-owned amendment to story AC A4 — already
  ack'd in the story shard; referenced here, not re-decided.
- Tuning values (§7 `WEAPON_SPECS`) are `verify` starting points, not gated; W7 (≤40% special
  uptime) is the measured acceptance bound governing stock sizing.
- The ADR index (`docs/adr/README.md`) is script-generated (`scripts/gen-adr-index.mjs`,
  ADR-0041) — regenerated by the tooling lane / CI, not hand-edited.

## Amendment (2026-07-20 — stage-6 panel)

Per the stage-6 review-panel triage (`docs/handoffs/story-weapons-pickup.md`, senior-architect
NO-MERGE ruling, MAJEUR finding + NIT-6). The decision below is Winston's; this amendment
records it.

**D5 — enforcement clause (the invariant was asserted "for free"; no spawn path actually
enforced it).** The panel confirmed `lootSystem.attemptSpawn` filters candidate slots on the
§5.4 column-gap predicate only, and `enemySystem.spawnWave` reseeds every slot with no
knowledge of `state.loot` — so a crate could seat on a `HIDDEN` enemy's slot (direction a) or a
wave rollover could seat an enemy on the live crate's slot (direction b). Once co-located,
`resolvePlayerShot`'s equal-slot tie-break is always false (same `slotIndex`), so the enemy
shields the crate: unpickable crate, overlapping sprites.

The co-location invariant is enforced by **two one-direction guards, not a central
slot-occupancy authority** (a redesign the two-call surface does not warrant):

- (a) `lootSystem.attemptSpawn` gains a slot-occupancy filter excluding any `slotIndex` held by
  a **non-DEAD** enemy, applied **alongside** (not replacing) the existing §5.4 column-gap rule.
- (b) `enemySystem.spawnWave` gains an optional `excludeSlots?: readonly number[]` parameter;
  the wave-rollover call site passes `state.loot ? [state.loot.slotIndex] : []`
  (`createInitialState`'s call keeps `[]` — loot is null at construction).

With both guards in place, the "slot indices never collide" assumption `resolvePlayerShot`'s
tie-break and the `LootCrate.tsx` comment rely on is **restored true** — no `bulletSystem`
change is required.

**D6 — internal inconsistency struck.** The original D6 paragraph prices a case (more than one
of the 3 simultaneous `spread` barrels landing on a crate, right-most wins) that D5's
single-crate model (`loot: LootCrate | null`) makes structurally unreachable — at most one
crate can ever exist, so at most one barrel can ever land on one. The right-most-wins fold in
`weaponSystem.ts` is retained, but reworded here to be explicitly **defensive / forward-looking**
for a possible future multi-crate world (per the code comment guarding it), not a reachable V1
mechanic: it is inert-but-harmless under the shipped single-crate invariant, not a live rule
this ADR needs to justify against today's state shape.

**D1 — seam note.** During build the type seam grew two fields beyond this ADR's original
enumeration: `readonly lootSpec: LootSpec | null` and `readonly lootTimer: number` on
`GameState` — the spawn-cadence bookkeeping the loot state machine needs, added by
`dev-gameplay` (Lane A) in-lane. This is strictly parallel to the shipped
`deliverySpec`/`courierTimer` precedent already on `GameState`, not a semantic deviation from
D1's weapon/loot shape.
