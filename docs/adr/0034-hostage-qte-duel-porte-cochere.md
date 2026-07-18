# 0034 — Hostage QTE rework: "Le duel de la porte cochère" (living tableau + shot rules)

- **Status:** Accepted (amended 2026-07-18 — D1 reversed, see Revision 2; further amended
  2026-07-18 — wandering peek target + seeded-pure-PRNG precedent, see Revision 3; further
  amended 2026-07-18 — graded captor HP + spatial-colour reticle, see Revision 4; further
  amended 2026-07-18 — box-disjoint G6 clamp + hitbox-map anatomy re-map, see Revision 5)
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

## Revision 4 — 2026-07-18: graded captor HP + spatial-colour reticle

Bertrand made two further product calls on the accepted wandering-target duel (PR #79),
confirmed and reframed in a single design pass: _"PV + chip couleur"_ — the captor gets an
HP bar and a head hit no longer instantly wins, it chips HP by a colour read on the ring —
and, once the colour mechanism was drafted, a reframe of what the colour MEANS: _"Rouge = le
rond n'est pas sur le preneur (sur du vide). Jaune = le rond est sur une partie non létale
(bras, jambe…). Vert = le rond est sur une zone létale (torse, visage). Plus d'ampleur dans
le mouvement."_ An interim design draft had the colour cycle rouge→jaune→vert over
peek-elapsed TIME (a `cyclePhase(t)`/`ringPhase` ramp); Bertrand's anatomy reframe
**superseded and withdrew it before any code landed** (`git`-clean `src/` never carried
`ringPhase`/`cyclePhase`/`RingColour`) — it is recorded here only so a reader of the story
shard's superseded draft isn't misled; **the shipped model is SPATIAL**, below. Design source
[`spec-hostage-qte-static-duel.md`](../game-design/spec-hostage-qte-static-duel.md) §9
(HP/loss/energy, carried forward) and §10 (the spatial colour reframe, `game-designer`
values in the story shard's §19), gated **PASS-WITH-CORRECTIONS** by `lead-game-designer`
(Karim, gate verdict in the story shard's §20 — corrections K-2/K-5, conditions K-1/K-3/K-4).
The frozen code contract is `senior-architect`'s story shard §18,
`docs/handoffs/story-hostage-qte-duel.md`.

### D4 reversed again — the captor has graded HP; the head kill-band is retired

**D4** ("head-during-peek is the sole kill route, no captor HP") **is REVERSED**: the captor
gets `captorHp` (Belliard default **3**, `QteSpec`/`HostageQte`, integer ≥ 1). A head hit no
longer wins outright — it chips HP, and depleting it is what wins.

The dedicated `"head"` kill-band **leaves `QteZone`** — `QteZone` is now `"body" | "hostage" |
"miss"` only. Captor damage no longer flows through a position-classified band at all; it
flows through a separate ring-hit test (below). A `QteZone` member that could no longer kill
would have been a footgun left in the contract, so it is retired rather than kept inert.

### Spatial colour — the ring's colour is WHAT ANATOMY it sits over, not WHEN in the peek

The wandering reticle ring (Revision 3) now carries a **colour that is a pure function of its
own CENTRE POSITION** against a static anatomy map of the captor: a new `RingZone = "vital" |
"limb" | "off"`, returned by `ringZoneAt(centre)` (precedence vital > limb > off). The game
layer names only the anatomy zone; the render layer maps it to the diegetic colour — `vital`
→ vert, `limb` → jaune, `off` → rouge — so the game never imports a colour and the render
never imports the anatomy bands.

A shot that **hits the ring** (within `RING_HIT_RADIUS` — Belliard 0.30 — of the ring centre,
and only while `stance === "PEEKING"`) chips captor HP by that zone's damage: **vital −2**
(`CAPTOR_DAMAGE_VITAL`), **limb −1** (`CAPTOR_DAMAGE_LIMB`), **off 0** (a wasted shot — the
peek still closes and still ticks the loss clock). Depleting `captorHp` to ≤ 0 → `WON`,
paying `QTE_RESCUE_REFILL` (+40) on the depleting shot. A shot that does **not** hit the ring
falls through to `qteZoneAt` (now body/hostage/miss only) for the unchanged energy
penalties — **hostage hit stays a flat −30 `QTE_HOSTAGE_HIT`** (still not a death route),
body −5, miss 0.

Because the ring's position is itself the seeded wander's pure function of peek-elapsed `t`
(Revision 3), the colour is transitively a deterministic function of `t` too — but it is
_expressed_ as position, not time: no temporal seed, no cycle period, no `ringPhase`, no
per-tick stepped state. This joins the wander under Revision 3's seeded/deterministic-pure-fn
precedent rather than opening a second one. **Colour-honesty (drawn colour == scored
colour):** the runtime STORES the derived `HostageQte.ringZone` (computed each tick from the
same last-drawn `targetOffset`, exactly as `targetOffset` itself is stored) and a `fire`
scores against that **last-drawn** value — the player is judged on the colour the ring showed
when they fired, the same aim-honesty discipline Revision 3 established for position.

### Loss route unchanged — "blown peek" re-keyed, not replaced

The **sole `LOST` route stays the execution-after-`maxBlownPeeks`-blown-peeks clock**
(Revision 2) — no door, no second condition. Its trigger event is re-keyed because a headshot
no longer instantly wins: a **blown peek** is now **"a `PEEKING` exposure that CLOSES with
`captorHp > 0`"** (previously "closed without a headshot" — obsolete once headshots chip
rather than win). `QTE_UNANSWERED_PEEK` (−8) still does double duty on that same close: it
drains energy **and** increments `blownPeeks`, charged once per closed exposure, never per
tick. The deterministic tie-break is preserved: `fire` resolves before the loss check, so a
same-tick **depleting** ring hit beats a same-tick fatal blown peek → `WON`; a same-tick
**chipping-only** ring hit does not save the run — the loop still reaches the fatal close →
`LOST`.

### Wander widened, G6 clamp reshaped from a Y-floor to X-disjoint

The roam box grows **~5.7×** ("plus d'ampleur") to span the captor's exposed silhouette plus
surrounding air — Belliard `dx [−1.20, −0.45]` / `dy [−0.50, +1.10]` (was Revision 3's `dx
[−0.95, −0.35]` / `dy [+0.60, +0.95]`) — so red/yellow/green all occur as the ring moves. Zone
size and peak wander speed are unchanged (difficulty from tracking + reading anatomy, not
shrink or extra speed).

Revision 3's `clampTargetOffsetG6` was a **Y-floor** (head band bottom kept above the hostage
top), which was correct for a head-only band stacked vertically above the hostage but is
**wrong** for a roam that now includes a LOW `limb` (leg) zone — a Y-floor would flatten the
entire lower half of the intended roam and delete the zone Bertrand's anatomy model requires.
The clamp is **reshaped to X-disjoint**: keep the ring circle entirely LEFT of the hostage
(she is the front-right shield; the captor's exposed anatomy is his left side) —

```
clampTargetOffsetG6(offset).x = min(offset.x, HOSTAGE_DX_MIN − RING_HIT_RADIUS − G6_MARGIN)
clampTargetOffsetG6(offset).y = offset.y   // untouched — the low leg survives
```

A circle whose rightmost point never crosses `x = HOSTAGE_DX_MIN − G6_MARGIN` is disjoint
from the hostage band for **any** `dy` — X-separation alone is sufficient, independent of
height. With Belliard's values (`HOSTAGE_DX_MIN 0.0`, `RING_HIT_RADIUS 0.30`, `G6_MARGIN
0.10`) the ceiling is `−0.40`; the authored roam's right edge (`−0.45`) already sits inside
it, so the clamp is an **asserted safety net**, not an active distorter of the authored box.
No bavure is ever required to reach a vital or limb zone. (The Revision 3 Y-floor fallback —
drop the leg, arm-only `limb`, raise the roam to `dy ≥ 0.55` — was recorded as the safe degrade
if the X-clamp were rejected; it was **not** taken, since it deletes an anatomy zone the
product call requires.)

### Captor-HP read stays diegetic — a HUD bar is out of scope for this amendment

Re-introducing captor HP does **not** reverse Revision 2's **U-1** ("no captor-HP HUD
element" — `HudHostageQte` stays `{ phase, warning }`). The default, gate-confirmed read
(design-gate correction **K-4**) is **diegetic pips** near the tableau, in-world, not a HUD
bar; `ux-designer` rules the exact form. If a HUD element is ever approved later, that is a
fresh reversal of U-1 to be logged separately before either lane builds it — not implied by
this amendment.

### Contract delta

- **`QteSpec`** — gains `readonly captorHp: number` (integer ≥ 1, asserted, per-level).
  Anatomy bands, per-zone damage, and `RING_HIT_RADIUS` are Belliard-first **system
  constants** in `qteSystem.ts`, not `QteSpec` fields (same F3-promotion seam as the wander
  amplitude). Everything else on `QteSpec` unchanged.
- **`HostageQte` runtime** — gains `readonly captorHp: number` (current HP, seeded from
  `spec.captorHp`, decremented by ring-hit chips, never below 0) and `readonly ringZone:
RingZone` (derived cache, computed each ACTIVE tick as `ringZoneAt(targetOffset)` from the
  same last-drawn offset; rests at `ringZoneAt(HEAD_NEUTRAL)` while `COVERED`/`ZOOMING`).
  Everything else (`targetOffset`, `targetSeed`, `blownPeeks`, `maxBlownPeeks`, `stance`,
  `telegraphActive`, `stanceRemaining`, static `anchor`, `zoomRemaining`/`zoomSeconds`,
  `resultRemaining`, `warning`) unchanged.
- **`QteZone`** loses `"head"` → `"body" | "hostage" | "miss"`. `qteZoneAt` now classifies the
  energy layer only; the ring-hit test (`RING_HIT_RADIUS` around `targetOffset`, PEEKING-gated)
  is a separate check in `tickQte`, resolved before the `qteZoneAt` fallback.
- New pure functions in `qteSystem.ts`: `ringZoneAt(centre: Vec2): RingZone` and
  `colourDamage(zone: RingZone): number` (vital/limb/off → damage; off implicit 0).
- Energy ledger, `maxBlownPeeks`/blown-peeks mechanics, the WON/LOST → DONE hold, and the
  static camera/anchor (Revision 2) are unchanged by this amendment.

Full frozen delta (types, `qteSystem.ts`, render) lives in `senior-architect`'s story shard
§18, `docs/handoffs/story-hostage-qte-duel.md` — this ADR section is the decision record, not
the code contract.

### Open pre-ship conditions (design-gate §20, tracked here for traceability)

Two conditions the design gate left open, not resolved by this amendment:

- **K-1 — wide-box on-frame framing.** The ~5.7× roam reaches ring extents beyond the
  previously-proven-safe occupancy; on-frame framing at the QTE zoom is unverified pending the
  built box. Composite gate + stage-5 `verify` must confirm the ring stays framed and
  trackable on both device classes before ship. Defined fallback if it clips: tighten
  `WANDER_AMP_Y → 0.65` and/or `WANDER_AMP_X → 0.325` — a constant-value tweak that never
  touches the G6 X-clamp above.
- **K-5 — pin the Belliard `targetSeed` and guarantee a per-peek on-captor window.** The
  balance claim ("floor path wins with an opening to spare") assumes every one of the
  `maxBlownPeeks` openings presents a landable vital-or-limb window, but the wander only
  visits a handful of hash-derived waypoints per peek and vital∪limb is a minority of the
  roam. Before this is verifiably fair on level 1: (a) the Belliard `targetSeed` value must be
  pinned (left unspecified as of this amendment), and (b) either a structural assert (≥ 1
  waypoint per peek lands inside vital∪limb) or an empirical `verify`-playtest confirmation
  with the pinned seed must close the gap. Tracked as a stage-5 pre-ship item, not a merge
  blocker for the contract itself.

## Revision 5 — 2026-07-18: box-disjoint clamp + hitbox-map anatomy

Bertrand supplied a **hitbox diagram drawn on the captor sprite** (PR #79), which corrects both
the G6 clamp geometry and the anatomy↔tier mapping Revision 4 shipped. Design source
[`spec-hostage-qte-static-duel.md`](../game-design/spec-hostage-qte-static-duel.md) §11
(`game-designer`, Sacha — anatomy-band + roam-box values). The frozen code contract is
`senior-architect`'s story shard §22, `docs/handoffs/story-hostage-qte-duel.md`.

### The G6 clamp is reshaped again — X-disjoint → BOX-disjoint

Revision 4's `clampTargetOffsetG6` kept the ring circle entirely LEFT of the hostage
(X-disjoint only), which confined the roam to the captor's left flank — his head and torso
were unreachable there, and a ring drawn over his gun-arm scored GREEN by construction. That
was the bug, not a tuning gap: the diagram places VITAL (head) and LIMB (torso/shoulders)
**centred, above** the hostage, not to her left.

The clamp is reshaped to a **BOX-disjoint push-out**: the ring circle (centre ±
`RING_HIT_RADIUS`) is kept clear of the hostage AABB inflated by a pad `G6_PAD =
RING_HIT_RADIUS + G6_MARGIN` (Belliard 0.40) on every side. If the ring centre lands inside
that inflated forbidden box, it is pushed to the nearest hostage-clearing edge — **LEFT**
(`x = −0.40`, off his gun-arm flank) or **UP** (`y = +0.55`, above her head) — whichever move
is minimal. This is a conservative superset of true circle-vs-box disjointness (point outside
the padded box ⇒ centre-to-box distance ≥ pad ⇒ the ring circle clears the hostage box by ≥
`G6_MARGIN`), so G6 holds for every offset, not just the authored roam. Unlike the X-disjoint
form, this clamp **admits the centre-top strip** (`y ≥ +0.55`) as reachable across the whole
width — so the ring can validly sit over the captor's head or torso, directly above the
kneeling hostage, exactly as the diagram requires. `qteZoneAt`/`ringZoneAt` are unaffected —
only the clamp that bounds where the ring's centre is ever allowed to land changes shape.

### Anatomy re-mapped from Revision 4's read to Bertrand's diagram

Revision 4's spatial-colour bands read the captor **left-flank-on**: `vital` (green) covered
head + torso, `limb` (yellow) covered arm/leg. Bertrand's diagram reads him **front-facing,
standing over the kneeling hostage**, and re-tiers the same three anatomy groups:

| Tier              | Revision 4 (left-flank read) | **Revision 5 (Bertrand's diagram)** |
| ----------------- | ---------------------------- | ----------------------------------- |
| **VITAL** (green) | head/face **+ torso**        | **head/face only**                  |
| **LIMB** (yellow) | arm/leg                      | **torso + both shoulders**          |
| **OFF** (red)     | empty air                    | **arms + legs + empty air**         |

Torso moves from `vital` → `limb`; arms/legs move from `limb` → `off` (now a genuine zero-chip
zone, not merely absent). The `RingZone` **enum itself is unchanged** — still the 3-tier
`"vital" | "limb" | "off"` (it suffices; this is a re-label of which world-space band each tier
covers, not a widening of the type). Damage magnitudes are unchanged: vital `CAPTOR_DAMAGE_VITAL
= 2`, limb `CAPTOR_DAMAGE_LIMB = 1`, off `= 0`; `captorHp = 3` and `maxBlownPeeks (N) = 4` stay
Belliard defaults. The energy ledger, the loss route (`blownPeeks ≥ maxBlownPeeks` → execution,
sole `LOST`), and the WON/LOST → DONE hold are all unchanged by this amendment.

The roam box is recentred **high/centre** (head + shoulders + upper torso, dipping left over
the gun-arm) instead of Revision 4's low-left column, so the wander actually visits the
diagram's VITAL/LIMB anatomy rather than mostly OFF space. Reachability under the new clamp:
`centre.x ≤ −0.40` (left of her, the gun-arm) **OR** `centre.y ≥ +0.55` (above her, head +
shoulders + upper torso) — the over-hostage wedge (lower-centre/right) is excluded by
construction, so the classifier never scores a centre that would physically sit on top of the
hostage.

### Captor-HP read stays diegetic pips — unchanged

Revision 4's diegetic-pips-not-a-HUD-bar read (K-4, holding Revision 2's U-1) is untouched by
this amendment; no HUD element is added.

### Contract delta

- **`QteSpec` / `HostageQte`** — **structurally unchanged.** No field added, removed, or
  retyped. `targetOffset: Vec2`, `ringZone: RingZone`, `captorHp: number` all stay as Revision
  4 shipped them.
- **`qteSystem.ts`** (values + clamp form only, inside the already-frozen spatial-colour
  contract):
  - `clampTargetOffsetG6` reimplemented as the box-disjoint push-out above (new constant
    `G6_PAD = RING_HIT_RADIUS + G6_MARGIN`), replacing Revision 4's X-only min-clamp.
  - `ringZoneAt`'s anatomy constants re-tuned to the diagram's bands: `VITAL_DX/DY` narrowed to
    a top-centre head box; new `TORSO_DX/DY` and `L_SHOULDER_*`/`R_SHOULDER_*` constants added
    under `limb`; the old arm/leg `limb` bands are removed (arms and legs now fall through to
    `off` by construction, needing no explicit band).
  - `WANDER_CENTRE`/`WANDER_AMP_X`/`WANDER_AMP_Y` reshaped to the high/centre roam box (design
    values: centre `(−0.20, +0.60)`, `AMP_X 0.78`, `AMP_Y 0.40`).
  - `createQte`'s G6 assert re-targets the box-disjoint boundary (the clamp's left ceiling
    `−0.40` and Y-floor `+0.55` against the constants), same discipline as every prior G6
    assert — asserted, never trusted from data.
- **`ringZoneAt` docstring** (the only doc-lane touch inside source, this pass) re-describes the
  front-facing anatomy read (head / torso+shoulders / arms+legs) so the comment matches the
  shipped bands — `tickQte`'s logic is unchanged; it reads `ringZoneAt`/`colourDamage` exactly
  as Revision 4 left them.
- **dev-r3f-render** — no change required. The render already colours by `ringZone`
  (vital → vert, limb → jaune, off → rouge) and follows `targetOffset`; only the region the ring
  roams and the world-space meaning of each tier change, both game-owned.

Full frozen delta (clamp form, determinism, lane plan) lives in `senior-architect`'s story
shard §22, `docs/handoffs/story-hostage-qte-duel.md`; the anatomy-band and roam-box VALUES are
`game-designer`'s in the same shard's follow-up entry — this ADR section is the decision
record, not the code contract.

**What is decided vs. proposed as of this amendment.** The clamp FORM (box-disjoint push-out),
its determinism, and the contract stability (no field change) are `senior-architect`'s FROZEN
ruling (§22 — LAW). The specific anatomy-band and roam-box numeric VALUES quoted above are
`game-designer`'s (Sacha) proposal against that frozen clamp, delivered in the shard's §22
follow-up entry and **still awaiting `lead-game-designer` (Karim) gate PASS** as of this
amendment — recorded here as the authored input the clamp reasons about, not yet a
gate-ratified figure. A gate correction to the values, if any, is a follow-up amendment to this
Revision, not a reopening of the clamp mechanism.

### Open pre-ship conditions carried forward from Revision 4, restated under Revision 5's values

- **On-frame framing (composite gate / stage-5 `verify`).** The high/centre roam's ring VISUAL
  extent (centre ± `RING_HIT_RADIUS`) reaches beyond the previously-proven-safe occupancy at the
  QTE zoom — unverified pending the built box. Defined fallback if it clips: tighten
  `WANDER_AMP_Y → 0.35` and/or `WANDER_AMP_X → 0.70` — the right-edge / G6 pin is never touched
  by either fallback value.
- **K-5 re-pin (dev-gameplay, blocking).** The anatomy bands **and** the roam geometry both
  changed under this amendment, so the previously-pinned Belliard `targetSeed` is **invalid**
  until re-verified: each of the `maxBlownPeeks` (N = 4) peeks must present ≥ 1 on-captor
  (`vital ∪ limb`) decelerating waypoint window. `dev-gameplay` re-checks and re-pins the seed
  against the Revision 5 constants before ship; tracked as a stage-5 pre-ship item, not a merge
  blocker for the contract itself.
