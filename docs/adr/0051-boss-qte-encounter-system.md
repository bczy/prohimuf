# 0051 — Boss QTE encounter system ("le Commandant"): phase-sequenced spatial-colour duel + non-shipped dev-harness

- **Status:** Accepted (D4 superseded by [ADR-0059](./0059-belliard-boss-gated-shipped-level.md))
- **Date:** 2026-07-19
- **Number:** 0051, **self-allocated** via the `adr-new` collision-safe check (highest
  across branch + `origin/main` + index was 0050 → 0051). No `producer` number was recorded
  in the story shard at TECH PLAN, so this is self-allocated with notice (same as
  ADR-0038/0039); re-check at merge.
- **Supersedes:** nothing. **Extends** (does not modify) the shell established by
  [ADR-0030](./0030-hostage-taker-feature-and-sprite.md) (freeze + progressive zoom +
  forward-only phase machine) and [ADR-0034](./0034-hostage-qte-duel-porte-cochere.md) (the
  sequenced-vulnerability duel, the seeded-pure-PRNG determinism law, the spatial-colour
  wandering ring, the `energy` outcome currency, the "diegetic read is the default, a HUD
  surface needs its own ruling" convention).
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (D5 the continuous `energy`
  stat, reused as this QTE's outcome currency), [ADR-0035](./0035-hostage-qte-difficulty-curve.md)
  (the F3 per-level curve seam this feature mirrors for `phaseCount`/`bossHp` as data),
  [ADR-0005](./0005-dynamic-verification-harness.md) (the dev-only harness-window discipline
  the boss dev-harness reachability mirrors),
  `_bmad-output/planning-artifacts/story-boss-encounter-qte.md` (the story + the K2 `pm`
  ratification this ADR encodes), `docs/game-design/spec-boss-qte-encounter.md` (mechanic +
  tuning, gated), `docs/game-design/spec-boss-encounter-fiction.md` (OQ5, gated),
  `docs/game-design/ux/spec-boss-qte-hp-read.md` (OQ6, C1 closed),
  `docs/handoffs/story-boss-encounter-qte.md` (full stage history),
  `src/game/systems/qteSystem.ts`, `src/game/types/hostageQte.ts`, `src/hooks/useGameLoop.ts`,
  `src/render/scene/qteCamera.ts`.

## Context

The competitive veille (`docs/game-design/veille-concurrentielle-shooters.md` §3 Tier A
idea #6) proposed a Time-Crisis/House-of-the-Dead capstone: "un chef de brigade protégé,
vulnérable seulement quand il ouvre le feu". Nothing in muf currently tests **sustained**
mastery of the skills the player already owns; every target is read-and-react in seconds.
The story (`story-boss-encounter-qte.md`) scoped exactly **one** boss-tier encounter for V1,
reusing the ADR-0030/0034 shell wholesale, and handed six Open Questions to the design loop.

**Cahier des charges test (scope guard, `PROJECT_GUIDELINES.md`).** _"Did Prohibition (Atari
ST, 1987) have a boss?"_ — **No** (veille §1 confirms). This is therefore an **[EXTENSION]**,
same class and same documentation standard as the hostage QTE (ADR-0030): explicitly
requested by Bertrand, justified against the loop, recorded here before any code lands. The
core loop `Récupérer → Livrer → Éviter` is untouched — the boss is the terminal obstacle on
the **existing** `Livrer` verb, not a new verb, and does not widen the `Éviter`
discrimination rule.

**The design loop resolved the Open Questions** (design gate PASS-WITH-CORRECTIONS,
`lead-game-designer`, handoff §4; K1 closed §6; `pm` K2 ratification §5; UX C1 closed §5):

- **OQ1 (stakes) — required gate on `Livrer`** as the stakes MODEL: the level cannot
  complete until `bossHp → 0`; the boss is NOT in the kill quota; failure is the telegraphed
  blown-window clock (`maxBlownWindows`), never a stray bullet.
- **OQ2 (vulnerability window) — reuse the `COVERED↔PEEKING` skeleton re-themed
  `SHIELDED↔EXPOSED` + the spatial-colour wandering ring, PLUS a 3-phase HP sequencing** that
  re-parameterises the exposed-window duel per phase. G6 (the hostage-shield clamp) DROPS —
  there is no human shield.
- **OQ3 (count) — Option A** (one finale-bound boss), architected so tier is DATA
  (`phaseCount`/`bossHp` are spec fields from day one), keeping a later mini-boss tier a
  data-only story. Fuyard variant OUT.
- **OQ4/OQ5 (home + fiction) — "le Commandant"**, singular named apex of the BAC de nuit
  (extends the §7 roster, not a 4th faction), whose "vulnerable only when he opens fire"
  derives diegetically from the already-canon Niveau Final "flics débordés" moment.
- **OQ6 (HP read) — no HUD element; diegetic only** (per-phase posture escalation + per-hit
  reaction pose), with one genuinely-new requirement: a dedicated, non-text/non-duration
  phase-break cue.

**The K2 collision (`pm` ratified, §5).** OQ1's required, level-failing gate is inherently
player-facing; OQ4's fiction reserves the canon Commandant for the **unbuilt** Niveau Final
and puts only a **non-canon placeholder** on Belliard. A required level-gating boss and a
non-canon throwaway are mutually exclusive as a _shipping_ config, compatible as an
_iteration_ config. Ratified resolution: **decouple SHELL from SHIP.** V1 builds the system +
tuning + gated fiction, exercised via a **non-shipped Belliard dev-harness that does not
alter Belliard's live quota-win completion contract**; the canon player-facing encounter
ships in a separate follow-up story that also builds a minimal Niveau Final. This ADR is that
V1's contract (story AC5).

Forces read from the code that constrain the technical shape:

- The hostage QTE (`qteSystem.ts` / `hostageQte.ts`) is a **playtest-frozen contract across
  five ADR-0034 revisions + ADR-0035/0036**, shipped live on Belliard and Vitry, guarded by a
  large invariant-asserted unit suite. Touching it re-opens that regression surface.
- The **shell primitives are already boundary-clean and QTE-agnostic**: the camera driver
  (`qteCamera.ts` + the `useGameLoop` zoom writer) reads only `{ anchor, phase, zoomRemaining,
zoomSeconds }`; the freeze branch in `tickGameState` keys on an `isQteActive`-style predicate;
  additive-and-optional (`spec === null` ⇒ byte-identical) is the standing law.
- The seeded closed-form **wander was explicitly declared a reusable precedent** (ADR-0034
  Rev. 3): "any future randomness-flavoured mechanic in `src/game` should follow this shape —
  authored seed + pure function of accumulated deterministic sim state."

## Decision

### D1 — A NEW, additive, isolated `bossQteSystem.ts` + `types/bossQte.ts` — NOT an extension of the hostage system

The boss is built as a **separate pure system** (`src/game/systems/bossQteSystem.ts`) over a
separate types-only module (`src/game/types/bossQte.ts`, zero functions per the `types/`
law). It does **not** modify `qteSystem.ts` / `hostageQte.ts`.

**Rationale (the shared-vs-new call the story invited, C5).** The two QTEs share a _shape_,
not a _contract_. Folding boss-only concerns (phase index, `bossHp` gauge, per-phase
escalation table, the damage-free phase-break beat, `maxBlownWindows`) into `HostageQte` /
`tickQte` would produce a bimodal tick and a fat optional-field union over a **playtest-frozen,
gated, live-shipped** contract — re-opening Belliard + Vitry regression surface **in service
of a NON-SHIPPED harness feature**. That asymmetry (disturb shipped code for an unshipped
harness) is the wrong trade in V1. A separate system keeps the boss lane **100 % additive and
reviewable in isolation**, and honours the surgical-change discipline.

**Reinventing vs. reusing (Architecture directive).** Reinventing the freeze/zoom/phase-machine
_primitive_ from scratch is a scope violation and is NOT done here. Instead:

- **Camera shell — reused VERBATIM.** `qteCamera.ts` (`qtePose`, `qteRestorePose`,
  `qteZoomInProgress`, `QTE_ZOOM_FACTOR`, `QTE_RESTORE_SECONDS`) is already QTE-agnostic. The
  boss runtime exposes the same `{ anchor, phase, zoomRemaining, zoomSeconds }` field names, so
  the driver drives it unchanged (see D4).
- **Phase-machine SHAPE — reproduced structurally, not copied.** The forward-only
  `ZOOMING → ACTIVE → (WON | LOST) → DONE` machine is followed exactly. The phase break is an
  **`ACTIVE` sub-state** (a stance/flag + `phaseBreakRemaining` timer), **not** a new top-level
  phase — so the top-level phase machine is byte-shape-identical to the shell (AC2).
- **Seeded wander — reused by the PRECEDENT, copied and parameterised.** The boss needs a
  **per-phase wander speed** (1.0 → 1.6 u/s) the hostage wander has no knob for, so it cannot
  call the hostage `wander(seed, i, t)` verbatim. The frozen closed-form (hash → waypoints →
  smoothstep, no `Math.random`/`Date.now`, pure function of elapsed `t`) is **copied into the
  boss system and parameterised** by a wander config (amplitudes, leg duration). Copying the
  proven closed-form is FOLLOWING the ADR-0034 Rev. 3 precedent, not reinventing it; a
  from-scratch sum-of-sines or per-tick PRNG cursor **would** be a violation and is forbidden.
- **Spatial-colour model — reused as a pattern, boss-authored bands.** `RingZone`
  (`vital | limb | off`), the 2/1/0 damage grades, and `RING_HIT_RADIUS 0.30` are reused. The
  **anatomy band geometry is boss-authored** (a full-figure commander, no hostage silhouette),
  so `bossRingZoneAt` is new; the **G6 hostage-disjoint clamp is DROPPED entirely** (no shield
  → no bavure path → the ring may roam the full boss anatomy). The sole remaining spatial
  constraint is **ring-on-frame at the boss zoom** (a stage-5 `verify` item, mirroring
  ADR-0034 K-1).

**Rejected — extend `qteSystem.ts` in V1:** fattens a frozen gated contract for an unshipped
feature (above). **Rejected — extract the shared wander/ring primitives into a common module
in V1:** the DRY win is real but requires touching the shipped hostage system, same
shipped-disturbance objection. It is **deferred, not dropped** — see D6.

### D2 — Reuse map (verbatim vs. newly authored), ADR-0034 revision-log discipline (AC2)

**Reused verbatim (do not re-derive):**

- The forward-only phase machine `ZOOMING → ACTIVE → (WON | LOST) → DONE` (shape).
- The freeze-the-rest-of-the-level branch (ADR-0030 D3) — an `isBossQteActive` sibling of the
  existing `isQteActive` freeze in `tickGameState`.
- The 2 s progressive zoom + `QTE_RESULT_HOLD 2.2 s` breather; the camera driver
  (`qteCamera.ts` + the `useGameLoop` zoom writer).
- The `SHIELDED↔EXPOSED` two-stance skeleton (re-theme of `COVERED↔PEEKING`).
- The seeded-pure-PRNG determinism LAW (ADR-0034 Rev. 3): authored seed + pure closed-form of
  accumulated sim state; **no `Math.random`, no `Date.now`, no per-tick PRNG cursor.**
- `RingZone`/spatial-colour model, `RING_HIT_RADIUS 0.30`, ring damage `2 / 1 / 0`.
- `PEEK_EXPOSURE_FLOOR 0.5 s` (asserted floor), `QTE_PANIC_SHOT −6`, `QTE_BODY_HIT −5`,
  `QTE_ZOOM_SECONDS 2.0`.
- The boundary law: additive-and-optional, `bossQteSpec === null` byte-for-byte identical;
  the deterministic tie-break (fire resolves before the loss check).

**Newly authored (boss-only):**

- `phaseCount` (default 3, tier lever, integer ≥ 1 asserted) + `bossHp` (default 24 = 3×8,
  integer ≥ 1 asserted) + derived phase thresholds (HP ≤ 16, HP ≤ 8).
- The per-phase escalation table (EXPOSED 1.6→1.0 s, SHIELDED lull 2.0→1.2 s, wander speed
  1.0→1.6 u/s, boss shot drain −5/−6/−8) — **system constants for V1** (one encounter, no
  curve yet), promoted to `BossQteSpec` fields only when a multi-encounter curve story needs
  them (the ADR-0035 F3 seam).
- `telegraphLeadSeconds` per phase (0.45/0.40/0.35) — a **new authored per-phase field** with
  its **own** asserted floor `BOSS_TELEGRAPH_LEAD_FLOOR = 0.35 s` (deliberately equal to the
  shipped hostage `TELEGRAPH_LEAD_SECONDS` so the boss is never less readable than the proven
  duel), and a per-phase `lull STRICTLY > lead` assert. This is NOT a reuse of the fixed
  hostage constant (K1 close, handoff §6): a fixed constant cannot ramp per phase.
- `PHASE_BREAK_SECONDS 1.0 s` — the damage-free, telegraphed, re-`SHIELDED` phase-break beat
  (an `ACTIVE` sub-state; asserted ≥ its floor and damage-free).
- `maxBlownWindows 10` — the loss clock (a re-key of `maxBlownPeeks`; a "blown window" = an
  `EXPOSED` that CLOSES having chipped **0** HP; integer ≥ 1 asserted).
- `QTE_BOSS_REFILL +50` — the defeat refill (above the hostage +40; a harder, required fight).
- The boss anatomy bands (`bossRingZoneAt`, full-figure, no hostage), G6 clamp dropped.
- `phaseIndexAt(bossHp)` — a **pure exported helper** returning the current phase from `bossHp`
  - the threshold constants, so the render layer does not re-encode the 16/8 thresholds
    (OQ6/UX §0.2 confirmed: no new `src/game` HUD field, but the phase derivation lives in the
    game layer and render calls it — see D5).

### D3 — Required-gate stakes as a game-layer rule; trigger on quota-completion

The boss is the **terminal beat on `Livrer`**: it triggers when the kill quota is satisfied
(`kills >= enemiesToWin`), _replacing_ the abrupt "quota met → `LEVEL_COMPLETE`" transition
with the duel (the faithful Time-Crisis "clear mooks → stage boss → stage clear" shape, the
`game-designer` §7 flag 3 recommendation, taken). `tickGameState` gains a branch: **when
`bossQteSpec !== null` and the quota is reached, trigger/tick the boss instead of completing;
`LEVEL_COMPLETE` fires only on boss `WON`/`DONE`; boss `LOST` → level fail.** The boss is NOT
added to `enemiesToWin` (AC-safe — he does not inflate the quota).

**Additive-and-optional is the safety property (D4).** When `bossQteSpec === null` — every
shipped level — the branch is a strict no-op and the existing `kills >= enemiesToWin →
LEVEL_COMPLETE` path is **byte-for-byte unchanged** (asserted by a `bossQteSpec === null`
identity test, exactly as the hostage QTE guards `qteSpec === null`). No shipped level authors
a `bossQteSpec` in V1, so no shipped player can reach the boss branch or the required gate.

### D4 — The harness/ship split: a non-shipped dev-harness, Belliard's live contract untouched

V1 exercises the boss on Belliard **without touching Belliard's shipped `LevelConfig`**. The
harness is a **separate level config** carrying the only non-null `bossQteSpec` in the tree,
**excluded from the shipped `LEVELS` array/menu** and reachable only through a dev-only seam
(a `?preview=`-style query param and/or `import.meta.env.DEV` gating — mirroring the ADR-0005
harness-window discipline; exact seam is the render/tooling lanes' call, §Consequences). The
harness runs on the **cop/provisional fallback sprite** and carries **no canon narrative**
(the fiction scripts §4 are gated-and-held for the Niveau Final, per narrative §3.3.1).

Consequences of the split, made explicit so a future contributor does not mistake the harness
for a shipped feature:

- **Shipped `belliard` `LevelConfig` is byte-identical** — its `hostageQte`, `roster`,
  `enemiesToWin`, delivery and quota-win completion contract are untouched. No new
  required-gate branch is reachable by a shipped player in V1.
- The canon, player-facing, required-gate **"le Commandant"** encounter — and the minimal
  Niveau Final that hosts it — are a **named follow-up story**, explicitly out of this V1.
- V1's shippable deliverable = **the system + tuning + gated fiction + the non-shipped
  dev-harness**. This narrows V1's player-facing surface (a harness, not a live encounter)
  rather than widening it — the opposite of scope creep.

### D5 — HP read stays diegetic; the phase break is the only new render requirement (OQ6, C1)

> **AMENDED 2026-07-19 — the "no HUD bar" ruling below was OVERRIDDEN the same day.** Bertrand
> playtested the harness and found the diegetic-only read insufficient ("gênant de ne pas voir
> l'énergie du boss") and asked directly for a HUD health bar. Shipped:
> `src/render/ui/hud/BossHpBar.tsx` (+ `HudBossQte` in `src/render/ui/hud/types.ts`), reading
> `bossHp`/`bossHpMax`/`phaseCount` — still **no new `src/game` contract field**, so the
> boundary-law sentence below still holds. The override is logged in full in
> `docs/game-design/ux/spec-boss-qte-hp-read.md` §0 and `docs/handoffs/story-boss-encounter-qte.md`.
> D1.1/D1.2/D2's diegetic reads (posture escalation, per-hit reaction, phase-break cue) are
> UNCHANGED and ship **alongside** the bar, not replaced by it — the bar answers "how much HP
> is left," the diegetic reads answer "did a hit land" / "did the pattern just change."

Per the original UX ruling (`spec-boss-qte-hp-read.md`, C1 closed, since overridden — see above):
**no HUD bar, no numeric counter, no per-hit pip stack** for boss HP (§6 "pas de barre de
stress" applies to the same _family_ of object). The continuous "how hurt is he" read is the
**already-budgeted per-phase posture escalation** (D1.1) + the **per-hit reaction pose** (D1.2).
The one genuinely-new render requirement is a **dedicated phase-break cue that does not depend
on reading text or noticing a duration** (D2.1) — because `PHASE_BREAK_SECONDS 1.0 s` is shorter
than phase-3's ordinary 1.2 s lull and cannot be distinguished by duration — plus a distinct
re-`SHIELDED` animation (D2.4), reduced-motion-safe (≤ 3 Hz, D3.1). **No new `src/game` HUD
contract field**: the render derives the current phase from `bossHp` via the exported pure
`phaseIndexAt` (D2). The boundary law holds — the game names phase/HP; the render maps them to
poses/pulse/colour.

### D6 — Deferred: extract the shared QTE primitives when the boss ships player-facing

The parameterised wander + ring primitives duplicated in V1 (D1) are a **conscious, tracked
DRY debt**, not a silent copy-paste. The extract-to-shared refactor (a common
`src/game/systems/qte*` kinematics module imported by both the hostage and boss systems) is
**deferred to the follow-up player-facing story**, when the boss is real and shipped and the
DRY payoff justifies touching the shipped hostage contract — guarded then by both systems'
byte-identity test suites. Recorded here so the duplication is visible and the follow-up
inherits the seam.

### D7 — Boundary law + determinism (unchanged, restated as acceptance)

- `types/bossQte.ts` — types only, zero functions (the `types/` law).
- `bossQteSystem.ts` — pure `src/game`, zero React/Three, TDD (100 % in
  `__tests__/bossQteSystem.test.ts`), seeded-pure wander (no `Math.random`/`Date.now`/per-tick
  cursor).
- `bossQteSpec === null` levels are byte-for-byte identical and deterministic (asserted).
- The only game↔render bridge remains `useGameLoop.ts`; the render layer holds no boss rules;
  `HUD.tsx` imports only view types.
- Safety invariants are **asserted in code against the authored spec**, never trusted:
  `phaseCount`/`bossHp`/`maxBlownWindows` integers ≥ 1; each phase's EXPOSED ≥
  `PEEK_EXPOSURE_FLOOR`; each phase's `telegraphLeadSeconds` ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` AND
  strictly < that phase's SHIELDED lull; every phase break damage-free and ≥ `PHASE_BREAK_SECONDS`;
  finite-numeric guards (C6) on every authored scalar.

## Consequences

**Positive**

- V1 is **100 % additive**: no shipped level, no shipped player path, and the frozen hostage
  contract are all untouched — the merge-gate panel reviews new files + one guarded
  `tickGameState`/`GameState` branch, not a hostage rewrite.
- Reuses the proven shell (camera, phase machine, spatial-colour ring, energy currency,
  determinism law) exactly where it is QTE-agnostic; authors only what genuinely diverges
  (phase sequencing, boss HP, boss anatomy, phase break, loss clock).
- Tier-as-data (`phaseCount`/`bossHp` spec fields) keeps a later mini-boss tier (OQ3 Option C)
  a data-only story, mirroring the proven hostage Belliard→curve rollout.
- The harness/ship split lets engineering iterate the system on the one built level (Belliard
  velocity) **without spending the canon Commandant** or forcing a placeholder required gate
  onto a live level.

**Negative / costs**

- The seeded-wander + ring primitives are **duplicated** between the hostage and boss systems
  in V1 (D1/D6). Bounded (the closed-form is stable/frozen) and tracked as a deferred
  extraction, but two copies exist until the follow-up.
- `tickGameState` gains a second frozen-QTE branch and a quota-completion interception; both
  must be provably inert when `bossQteSpec === null` (byte-identity test) or a shipped level's
  win path could drift. **This is a cross-boundary change (game state + hooks) — serialise it
  with any concurrent QTE camera / state-machine work.**
- The `useGameLoop` zoom driver now drives on **either** QTE being active — a shared-file
  (game↔render bridge) touch that must stay minimal and gated.
- V1 ships **no player-facing canon boss** — a deliberate deviation from every prior QTE's
  live-Belliard-first rollout, justified by the required-gate/non-canon incoherence (K2), not
  an oversight. The investment only pays off in a real beat once the Niveau-Final follow-up is
  sequenced — recommend sequencing it soon rather than shelving it.

**Gotchas**

- **Reachability seam:** the dev-harness must be genuinely unreachable in production (behind a
  dev-only query param and/or `import.meta.env.DEV`), or the harness leaks into a shipped menu
  and the "Belliard live contract untouched" guarantee is void. Gate it like the ADR-0005
  harness window: zero shipped cost.
- **Deterministic tie-break:** a same-tick depleting ring hit that takes `bossHp` to 0 must
  beat a same-tick fatal blown window → `WON`; a chipping-but-not-depleting hit does not save
  a fatal window. Resolve `fire` before the loss check (mirror ADR-0030/0034).
- **Unanswered-window drain charged once per CLOSED window**, never per tick (the ADR-0034
  over-billing gotcha), phase-scaled −5/−6/−8.
- **Ring-on-frame at the boss zoom** is unverified pending the built tableau (G6 dropped, so
  the roam is wider than the hostage's) — a stage-5 `verify` / composite-gate item on both
  device classes, with a defined amplitude-tighten fallback if it clips.
- **K-5-style seed pin:** pin the harness `targetSeed` and confirm each phase presents ≥ 1
  landable vital-or-limb decelerating window per exposure, or the winnability math (≈ 55–62 %
  window efficiency to clear 24 HP) is unproven — a stage-5 pre-ship item, not a contract
  blocker.
- The phase-break cue is safety-relevant, not decoration: a new attack pattern that opens
  un-signalled is the "mort bullshit" §5.6 forbids. The mechanic guarantees the damage-free
  beat exists; the render MUST carry its non-text/non-duration read (D5).
