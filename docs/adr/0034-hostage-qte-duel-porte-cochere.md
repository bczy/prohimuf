# 0034 — Hostage QTE rework: "Le duel de la porte cochère" (living tableau + shot rules)

- **Status:** Accepted (amended 2026-07-18 — D1 reversed, see Revision 2; further amended
  2026-07-18 — wandering peek target + seeded-pure-PRNG precedent, see Revision 3)
- **Date:** 2026-07-17
- **Partially supersedes:** [ADR-0030](./0030-hostage-taker-feature-and-sprite.md) — the
  **static frozen tableau**, the **`windowSeconds` clock**, and the **`PART_DAMAGE`
  body-part damage table + captor health bar** leave the design. What ADR-0030 established
  and this ADR **keeps unchanged**: the scripted once-per-level trigger
  (`triggerAtElapsedSeconds`), the **freeze of the rest of the level** during the QTE
  (D3), the 2 s progressive **zoom** and **"OTAGE" banner** (D5), the **side-objective /
  never-advances-the-kill-quota** rule (D4), the `energy` stat, and the boundary law (D6).
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (D5 the continuous `energy`
  stat, reused as the QTE's outcome currency; Belliard-first rollout precedent),
  [ADR-0035](./0035-hostage-qte-difficulty-curve.md) (F3, the per-level curve that depends
  on this rework), [ADR-0036](./0036-hostage-qte-accomplice.md) (F4, the deferred second
  shooter), the brainstorming session
  [`brainstorming-session-2026-07-17-1.md`](../../_bmad-output/brainstorming/brainstorming-session-2026-07-17-1.md)
  (the validated product decision this ADR encodes — final system v2 and feature grouping
  F1/F2), [`enemy-bestiary.md`](../../_bmad-output/guidelines/enemy-bestiary.md) (§3),
  `src/game/systems/qteSystem.ts`, `src/game/types/hostageQte.ts`,
  `src/hooks/useGameLoop.ts`.

## Context

ADR-0030 shipped the hostage QTE as a **static tableau**: the scene freezes, the camera
zooms, then a **5 s window** (`windowSeconds`) opens on a captor standing still at a fixed
`anchor`, with a **4-HP health bar** and a **per-part damage table** (`PART_DAMAGE`: head
one-shots, torso/limbs chip). A single aimed head-shot in a generous window on an immobile
target made the QTE trivial — and, because success is a small side bonus, **ignoring it was
near-optimal** (session Phase 1: "absence of stakes"; "rien ne bouge, ce n'est pas très
stressant").

A brainstorming session (2026-07-17, facilitated under BMAD, all arbitrations made by
Bertrand) reworked the phase from first principles. The output is a single coherent system
— **"Le duel de la porte cochère"** — plus 4 design principles (P1–P4) and 8
anti-frustration guardrails (G1–G8). This ADR encodes features **F1 (le tableau vivant)**
and **F2 (la règle du tir)**; it does not redesign them.

Design principles that constrain every decision below:

- **P1 — Stakes first:** the outcome must matter to the run.
- **P2 — Motion breeds sang-froid:** cool-headedness only exists when there is a temptation
  to fire too early — a live, moving adversary with passing openings.
- **P3 — Sang-froid ≠ panic:** readable danger, visible windows, no punitive RNG. The
  player must always conclude "I cracked", never "that was unreadable".
- **P4 — Fidelity:** conscious extension territory; bestiary §3 is the reference document.

## Decision

### D1 — Distance is the sole clock; `windowSeconds` leaves the design

The captor **retreats toward a porte cochère dragging the hostage** for the whole QTE
(reusing the existing `Courier` movement model — a mobile `{x, y, dir, speed}` actor).
**Reaching the door = failure** (he is gone with her). The street itself is the timer:
tracking a moving target + waiting for an opening compound into the pressure.

The abstract `windowSeconds` countdown is **removed** — its `QteSpec` field,
`HostageQte.windowRemaining` / `windowSeconds`, and the timeout-loss branch in `tickQte`
all leave the contract. Two clocks (a distance-to-door **and** a countdown bar) is one too
many to read (session open question, **DECIDED: distance only**). The retreat distance
remaining IS the readable, diegetic timer the render lane surfaces instead of a HUD bar.

### D2 — Captor state machine: `COVERED ↔ PEEKING` behind the human shield

The captor uses the hostage as a **living human shield**. A sub-state machine on the QTE
runtime record alternates:

- **`COVERED`** — dragging the hostage backward; **not shootable** (no valid kill zone).
- **`PEEKING`** — a brief, telegraphed exposure of his head beside/over the hostage.

Exposures are **brief and telegraphed** (G4: every peek preceded by a readable tell — a
minimal pre-peek cue, not the deleted pose-countdown mechanic). Exposure duration has a
**hard floor of ≥ 0.5 s even at maximum difficulty** (G5), so a peek is always answerable
within human reaction time. Cadence and duration are authored per level — see
[ADR-0035](./0035-hostage-qte-difficulty-curve.md) — but the floors are invariants baked
into the system, not data conventions.

### D3 — The peek is the captor's shot: the opportunity window is the danger window

**During `PEEKING` the captor fires at the player.** If the player does not answer the
exposure (no clean head hit during it), the captor's shot lands and **drains player
energy**. This is the breakthrough of the design: the _only_ moment the captor is
vulnerable is also the _only_ moment he is dangerous — bidirectional danger restores the
original's "he's about to act" pressure. (This is the sole active incoming-fire source; the
rest of the level is frozen. In late levels the accomplice — [ADR-0036](./0036-hostage-qte-accomplice.md)
— _replaces_ this counter-fire rather than stacking on it, per the coherence pass.)

### D4 — Shot rules (F2 — la règle du tir): head-during-peek is the sole kill route

The body-part damage simulation is replaced by one readable timing test. A shot resolves to
exactly one of:

| Shot                          | Result                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| **Head, during `PEEKING`**    | **Win** — clean rescue. The _sole_ kill route.                                 |
| **Captor body** (any time)    | **Small player-energy drain** — reckless spray bleeds you.                     |
| **Hostage**                   | **Heavy energy penalty.**                                                      |
| **Fired during the 2 s zoom** | **Penalized panic shot** — the zoom teaches "don't shoot what you can't read". |
| **Clean rescue**              | **Big energy refill** — the QTE is the level's fuel station.                   |

Sanction hierarchy (locked): **body = small cost, hostage = big cost,
head-during-peek = win.** Nothing else counts. The captor no longer has a health bar: the
duel is **binary** — one clean headshot during an opening, or nothing. This closes the
safe-DPS loophole (chipping the torso while he is COVERED must not bypass the wait-duel).

### D5 — Energy is outcome currency only; no passive drain

Every QTE beat is priced in `energy` (the ADR-0004 D5 stat): clean rescue = big refill,
panic shot = penalty, hostage hit = heavy penalty, captor-body hit = small drain, unanswered
peek = drain. There is **explicitly no passive per-second tick drain** during the QTE
(the "energy leak" idea was demoted in the coherence pass — the door already makes waiting
costly; a second disguised clock would violate the single-clock decision). Waiting patiently
for a clean peek must remain viable; energy moves only on _outcomes_, never on the passage
of time.

Score is **not** the stake (score-based multipliers and magnified-failure ideas were
rejected). The ADR-0030 D4 rule stands: a rescue never advances the kill quota.

### D6 — Contract rework, boundary law preserved

`qteSystem.ts` / `types/hostageQte.ts` are reworked:

- **Removed:** `captorHp` / `captorHpMax`, `PART_DAMAGE`, `QteBodyPart`, the
  `windowSeconds` / `windowRemaining` fields and the timeout-loss branch, and `hostageHp` /
  `hostageHpMax`.
- **Added:** the captor sub-state (`COVERED | PEEKING`) with a peek timer, a **moving
  anchor** (the captor's live position, advanced each tick during the frozen QTE), a
  **spatial fail condition** (anchor reaches the porte-cochère world point), captor
  counter-fire resolution, and a head-only / body / hostage zone classifier with **clean
  spatial separation** between the peeking head and the hostage silhouette (G6).
- **Kept:** the scripted trigger, the `ZOOMING → … → DONE` forward-only phase machine, the
  brief WON/LOST result hold (the post-verdict breather was _kept_ — idea #19 rejected), the
  `anchor`, and the "OTAGE" `warning`.

> **Amendment (2026-07-17, lead-game-designer design gate, finding D-1).** The Removed list
> above now names `hostageHp` / `hostageHpMax` explicitly; the original text left them out,
> which read as an open seam even though D4 already makes the duel binary and a hostage hit
> a flat energy penalty (not an HP drain, not a loss route). No decision changes — this
> closes an incompleteness the gate flagged, ratifying what D3/D4 and the frozen
> `src/game/types/hostageQte.ts` contract already do.

All of this stays **pure `src/game`** (zero React/Three, unit-tested). The render lane reads
the new state and draws the moving tableau (drag / peek / firing poses — **new sprites via
the art lane**; cop fallback until they land, per ADR-0030). The zoom driver in
`useGameLoop.ts` must now **follow the moving anchor** rather than lerping to a fixed point.
`HUD.tsx` stays render-only. The only game↔render bridge remains `useGameLoop.ts`.

## Consequences

**Positive**

- Implements P1–P2 directly: a live, retreating, shooting adversary turns "aim once" into
  "hold your nerve". The door as spatial clock (P2) and the peek-is-the-shot fusion (D3)
  are the two levers that make the phase a duel of patience.
- The binary head-only rule (D4) is far simpler than the `PART_DAMAGE` simulation it
  replaces and removes the chip-damage loophole in one stroke.
- Reuses proven primitives: the `Courier` movement model (ADR-0004 D1) for the retreat, the
  ADR-0030 freeze + zoom + banner shell, and the `energy` stat as the single currency.
- Additive-and-optional discipline holds: a `qteSpec === null` level is untouched and
  deterministic; the boundary law is preserved.

**Negative / costs**

- The ADR-0030 D3 partial-freeze branch grows: it must now advance the captor position, the
  peek sub-state machine, and counter-fire — not just tick two timers. The frozen QTE is now
  a small live simulation of one actor.
- The render zoom driver (already the highest-risk part per ADR-0030) must **track a moving
  anchor** and restore base framing exactly on `DONE` — a camera that follows a retreat is
  harder to keep gated across the mobile-pan / edge-scroll writers.
- New sprite work (drag walk, covered, peeking-with-gun-raised) is a hard art-lane
  dependency for the phase to read; the cop fallback will look wrong for a _moving_ captor.

**Gotchas**

- The spatial fail (door reached) and any same-tick winning head-shot must resolve
  deterministically — the shot should win (mirror the ADR-0030 kill-vs-timeout precedent).
- G5's ≥ 0.5 s exposure floor and G4's telegraph are **safety invariants** — assert them in
  code against level data, do not trust the authored `QteSpec` to respect them
  (see [ADR-0035](./0035-hostage-qte-difficulty-curve.md)).
- G6 spatial separation (peeking head clear of the hostage silhouette) is a fairness
  property under a _moving_ tableau — assert it directly rather than relying on draw order,
  and tune it against the new art.
- Unanswered-peek energy drain must be charged **once per closed exposure**, not per tick,
  or a long peek over-bills the player.

## Revision 2 — 2026-07-18: static duel (D1 reversed)

Bertrand playtested the ADR-0034 build (PR #79) and **rejected D1** (the distance-to-door
retreat clock). Verbatim:

- « je ne vois pas l'intérêt de faire décaler le preneur d'otage de gauche à droite »
- « l'otage et son preneur glissent sur le sol, c'est très bizarre en mode rendu »
- « cette envolée vers la porte cochère est clairement foireuse »

He kept liking the `qteZoneAt` hitboxes. Product-owner decision, gated PASS by
`lead-game-designer` (Karim, design source
[`spec-hostage-qte-static-duel.md`](../game-design/spec-hostage-qte-static-duel.md), gate
verdict in the story shard's §10): the duel goes **static**, and the door clock is replaced
by a **blown-peeks execution clock**. The frozen code contract is `senior-architect`'s story
shard §9 (`docs/handoffs/story-hostage-qte-duel.md`).

### D1 reversed — static captor, camera zooms-and-holds

The captor no longer retreats toward the porte cochère. He is **STATIC at the zoom anchor**
for the whole QTE — the ADR-0030 frozen-tableau shape: the camera zooms to `anchor` and
**holds** (no follow, no lead). `porteCochere` and `retreatSpeed` leave `QteSpec`; `dir`,
`speed`, `porteCochere`, and the moving-anchor advance leave the `HostageQte` runtime —
`anchor` becomes a **constant**, copied once at `createQte` and never mutated by the tick.

Reason: in playtest the moving cop-fallback tableau read as "sliding on the floor" (the
drag-walk art was a deferred CI dependency, so the cop fallback dragged visibly wrong), and
the door envolée had no perceived point — a spatial fail condition the player never actually
watched land. Removing the retreat kills both defects at the source rather than patching the
fallback art or the door framing.

### The clock is now blown peeks, not distance

A `PEEKING` exposure that **closes** (`PEEKING → COVERED`) without a clean headshot during
it is a **blown peek** — the same event D3 already calls an "unanswered peek". It now does
double duty: it still drains `QTE_UNANSWERED_PEEK` (−8, unchanged, charged once per closed
exposure), **and** it increments a `blownPeeks` counter. When `blownPeeks` reaches the
per-level `maxBlownPeeks`, the captor **executes the hostage → `LOST`**. This is the **sole**
failure route — no door, no timeout, no second condition. The tie-break is preserved: `fire`
resolves before the loss check, so a same-tick winning head-shot beats a same-tick fatal
blown peek → `WON` (mirrors the ADR-0030 kill-vs-timeout precedent D1 originally reused).

`maxBlownPeeks` **replaces `retreatSpeed`/`porteCochere` as the per-level difficulty knob**
— [ADR-0035](./0035-hostage-qte-difficulty-curve.md) (F3) must retune its enumerated knobs
around it (Belliard default N = 4, integer ≥ 1 asserted in code, authoring guidance N ≥ 2 so
no level executes her on a single blown opening).

### F-1 reversed — the hostage is killable again

D4's "hostage = flat −30, non-fatal" penalty **stays** — a hostage-band hit is still not a
death route. But the execution on the Nth blown peek makes the hostage **killable again**,
which **reverses F-1**: the design-gate finding that ruled her non-killable and `pm`'s
(John) ratify-recommendation that this ADR retire ADR-0030's hostage-death loss route were
both tied to the now-deleted door, and are **superseded** by this revision. What guideline
§5.6 ("jamais de mort bullshit") actually cares about still holds: this is not a
stray-bullet HP death (there is still no `hostageHp`, no per-bullet death) — it is a
**legible, telegraphed patience clock** (miss `maxBlownPeeks` readable, G4/G5-fair openings
→ she is executed). `lead-game-designer`'s revision gate confirmed this reading as coherent
with §5.6, not a violation of it.

### Contract delta

- **`QteSpec`** — loses `porteCochere`, `retreatSpeed`; gains `readonly maxBlownPeeks: number`
  (integer ≥ 1, asserted — the per-level execution cap).
- **`HostageQte` runtime** — loses `dir`, `speed`, `porteCochere`, and the moving-anchor
  advance (`anchor` becomes static); gains `readonly blownPeeks: number` (counter, 0 →
  `maxBlownPeeks`) and a runtime mirror `readonly maxBlownPeeks: number`.
- **Kept verbatim:** the peek-duel (`COVERED ↔ PEEKING`, D2), G4's telegraph and G5's
  exposure floor, D3 (the peek is the captor's shot), D4's head-during-peek = the sole win
  route, the energy ledger (D5, unchanged magnitudes), and the `qteZoneAt` hitbox bands (G6
  spatial separation now holds trivially on a fixed anchor).

Full frozen delta (types, `qteSystem.ts`, render/camera driver) lives in
`senior-architect`'s story shard §9, `docs/handoffs/story-hostage-qte-duel.md` — this ADR
section is the decision record, not the code contract.

## Revision 3 — 2026-07-18: wandering peek target

Bertrand steered a further tweak on the accepted static duel (PR #79), verbatim: « il faudrait
faire bouger le rond dans lequel il faut tirer / cela doit être des mouvements aléatoires. »
Design source
[`spec-hostage-qte-static-duel.md`](../game-design/spec-hostage-qte-static-duel.md) §8
(`game-designer`, Sacha), gated PASS-WITH-CORRECTIONS by `lead-game-designer` (Karim, gate
verdict in the story shard's §15). The frozen code contract is `senior-architect`'s story
shard §14, `docs/handoffs/story-hostage-qte-duel.md`.

### The head kill-zone moves — a deliberate, localised re-introduction of motion

Revision 2 removed the captor's motion entirely (static duel). This revision **re-introduces
motion, but LOCALISED to the head kill-zone** — the shootable `"head"` band and its reticle
ring — turning aiming during `PEEKING` into a **moving-target tracking test**. The **captor
stays static** (Revision 2 holds unchanged: no drag, no floor-slide, no camera follow); only
the head zone wanders, and only while `PEEKING` (`COVERED`/`ZOOMING` show the zone at its
neutral, non-wandering resting position, not the wander origin). The wander region is bounded
G6-clear of the hostage silhouette on both axes at every offset (see contract delta below) —
no peek position ever forces the player to risk the hostage to reach the head.

### The wander model — closed-form hashed waypoint, ruled over the illustrative sum-of-sines

`senior-architect`'s frozen determinism LAW (below) requires a pure function of elapsed peek
time, illustrated in the freeze with a sum-of-sines sketch. `lead-game-designer`'s gate
**ruled** the shipped internal shape instead: a **closed-form hashed-waypoint wander** —
`waypoint[k] = hash(targetSeed, peekIndex, k)` mapped into the wander-region box,
`k = floor(t / legDuration)`, smoothstep-eased between consecutive waypoints — over the
sum-of-sines sketch, because the deceleration into each waypoint is a load-bearing fairness
affordance (a legible "it's arriving, shoot now" window every leg) and a low-term
sum-of-sines reads as a learnable, quasi-periodic loop against Bertrand's "mouvements
aléatoires" intent. The waypoint model is signature- and determinism-identical to the frozen
`wander(targetSeed, peekIndex, t): Vec2` shape — it fills an internal the architect
deliberately left open to design/dev, it does not reopen his frozen contract.

### Contract delta

- **`QteSpec`** — gains `readonly targetSeed: number` (integer, per-level, seeds the
  closed-form hash — the sole determinism input; finite, asserted in `createQte`). Wander
  amplitude/speed (Belliard `wanderSpeed` ≈ 1.2 u/s) are **system constants** in
  `qteSystem.ts`, not `QteSpec` fields, for this rollout — promoting them to `QteSpec`
  (`wanderAmplitude`, `wanderSpeed`) is an additive seam reserved for when
  [ADR-0035](./0035-hostage-qte-difficulty-curve.md)'s (F3) per-level curve needs them.
- **`HostageQte` runtime** — gains `readonly targetOffset: Vec2` (anchor-relative, the live
  head-zone centre). This is a **derived cache only**, recomputed every tick from the closed
  form — carrying **no `rngState` field and no waypoint-cursor field**: the two inputs the
  closed form needs (the peek ordinal, the peek-elapsed time) are both already deterministic
  sim state, not new bookkeeping (see the precedent below). `targetOffset` sits at the head
  zone's neutral centre outside `PEEKING`.
- **`qteZoneAt` gains a parameter** — frozen signature
  `qteZoneAt(dx: number, dy: number, stance: CaptorStance, targetOffset: Vec2): QteZone`. The
  `"head"` band is now tested centred on `targetOffset` instead of a fixed offset; the
  `hostage`/`body`/`miss` bands stay anchor-relative and byte-for-byte unchanged. Precedence
  unchanged: `hostage` first, then offset `head` (PEEKING only), then `body`, then `miss`.
- **Belliard rebalance** — `peekDurationSeconds` **1.2 → 1.4 s** (the acquire-track-fire
  cushion a moving reticle needs, still ≫ the G5 0.5 s floor); `maxBlownPeeks` (N = 4) and
  `peekCadenceSeconds` (1.5 s) unchanged. Passive-ignore tempo moves from ≈ 10.8 s to ≈ 11.6 s
  of `ACTIVE`, a disclosed, within-tolerance delta; the −32 passive-ignore energy figure is
  unchanged.
- **G6 — asserted, not trusted from tuning.** The wander bounds keep the head band disjoint
  from the hostage band on both axes at every wander offset: a runtime clamp
  (`clampTargetOffsetG6`) forces the head-zone centre's Y to stay above the hostage's top by a
  non-zero margin **regardless of X** (Y-disjoint ⇒ disjoint for any X), belt-and-suspenders
  with a full-amplitude-box unit test. No bavure is ever required to reach the head.

Full frozen delta (types, `qteSystem.ts`, render) lives in `senior-architect`'s story shard
§14, `docs/handoffs/story-hostage-qte-duel.md` — this ADR section is the decision record, not
the code contract.

### New precedent — a seeded, pure PRNG is permitted in `src/game`

This is the first deliberate deterministic-pseudo-random source inside the pure game layer.
The decision recorded here is the SHAPE future randomness-flavoured mechanics should follow,
not just this QTE's wander:

- **Permitted:** an authored seed (here `targetSeed`) plus a **pure function of already-
  deterministic simulation state** — for this wander, the peek ordinal (`peekIndex =
blownPeeks`) and the peek-elapsed time (`t = peekDurationSeconds − stanceRemaining`, both
  derived, not new fields). No `Math.random`, no `Date.now`, no wall-clock read anywhere in
  `src/game`.
- **Forbidden:** a per-tick stepped PRNG cursor (draw-and-advance, carried as mutable state on
  the runtime record). A per-tick step is frame-count-dependent — a different `delta`
  chunking produces a different result — a replay-determinism landmine the stage-6
  code-review panel's "no randomness in `src/game`" check exists to catch. A pure closed-form
  function of `t` is framerate-independent and re-derivable from any deterministic sim
  snapshot.
- **Why this preserves the boundary law and replay-determinism:** a deterministic function is
  not randomness — same seed, same tick sequence ⇒ byte-identical path, exactly like every
  other pure `src/game` system. The stored `targetOffset` is a derived cache (render reads it,
  `fire` classifies against it), never a source of truth the way a carried PRNG cursor would
  be.
- **Precedent for future work:** any future randomness-flavoured mechanic in `src/game`
  (weighted spawns, procedural variation, etc.) should follow this shape — authored seed +
  pure function of accumulated, already-deterministic sim state — rather than a stepped
  generator. A deviation from this shape is an architecture question to raise before
  shipping, not a call to make silently in a dev lane.
