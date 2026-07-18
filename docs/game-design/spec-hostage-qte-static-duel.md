# Spec — Hostage QTE "Le duel figé": static captor + blown-peeks loss clock (revision)

**Feature:** revision of the hostage-taker cinematic QTE after Bertrand's playtest of the
ADR-0034 build (PR #79).
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18
**Status:** DRAFT — **needs `lead-game-designer` (Karim) PASS** before `senior-architect`
and any dev implements it.
**Supersedes on mechanics:** `spec-hostage-qte-duel-porte-cochere.md` §1 (retreat/door
clock) and the parts of §§2–6 that assume a moving anchor. It **reuses unchanged** the peek
cadence (§2.1), the invariant floors (§2.2), the energy magnitudes (§3), the hitbox bands,
and the Belliard rollout (§4). Everything not explicitly changed below is inherited verbatim.
**Design source this revises:** ADR-0034 **D1** (distance = clock) and the moving-anchor
parts of **D2/D6** are REJECTED by Bertrand. **D2 (peek sub-machine), D3 (peek = danger
window), D4 (head-during-peek = sole win), D5 (energy = outcome currency)** are KEPT. This
revision needs a short ADR amendment/superseder — flagged to the gate, not written here.

## 0. Why this revision (Bertrand's playtest verdict, verbatim)

- "je ne vois pas l'intérêt de faire décaler le preneur d'otage de gauche à droite" — the
  lateral retreat has no gameplay value.
- "l'otage et son preneur glissent sur le sol, c'est très bizarre en mode rendu" — the drag
  reads as sliding-on-the-floor in the rendered build.
- "cette envolée vers la porte cochère est clairement foireuse" — the door escape is broken.
- He **likes the hitboxes** (the `qteZoneAt` head/body/hostage/miss bands).

**Decision (Bertrand):** keep the peek-duel, make it **STATIC** — no lateral movement at
all. This spec encodes that decision and replaces the door clock with a blown-peeks clock
(his steer). Cahier-des-charges verdict unchanged: conscious documented **extension**
(Prohibition had no hostage duel); a **static** cop tableau is the ADR-0030 precedent and
reads fine, so this revision also **removes the moving-captor art dependency**.

---

## 1. The captor is STATIC (replaces ADR-0034 D1 + retreat)

The captor stands still at the **zoom anchor** for the whole QTE, exactly like the ADR-0030
frozen tableau. There is **no retreat, no porte cochère, no distance clock, no camera
follow.**

| Field                   | Value             | Change vs current spec                                                                |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| Captor position         | `{ x: 0, y: −5 }` | **KEPT** as the current Belliard `anchor` — but now **fixed**, never advanced.        |
| Retreat direction/speed | —                 | **REMOVED.** No `dir`, no `speed`.                                                    |
| Distance-to-door / door | —                 | **REMOVED.** No `porteCochere`, no door world point, no door-reached fail.            |
| Camera                  | zoom-and-hold     | Zoom to the static anchor and **hold** (ADR-0030 behaviour); no moving-anchor follow. |

This directly kills both defects Bertrand named: nothing slides on the floor, and there is
no door envolée. The camera driver in `useGameLoop.ts` reverts to **lerp-to-fixed-point**
(the ADR-0030 shape) instead of tracking a moving anchor — a render-lane note, not a rule.

**Art impact (spec the read, hand style to `lead-art`):** the phase now needs only a
**static** captor tableau (covered / peeking / firing poses on one spot) — the ADR-0030
cop-fallback tableau reads correctly for a stationary captor, so the "moving captor looks
wrong in fallback" blocker is gone. No drag-walk sprite is required.

---

## 2. Peek cadence, floors, hitboxes — KEPT unchanged

Everything in this section is **inherited verbatim** from
`spec-hostage-qte-duel-porte-cochere.md` — Bertrand objected only to movement, not to the
duel itself, and explicitly likes the hitboxes.

- **`COVERED ↔ PEEKING` sub-machine** (ADR-0034 D2): starts `COVERED`, alternates.
- **Belliard cadence (§2.1, unchanged):** `COVERED = 1.5 s`, `PEEKING = 1.2 s`,
  tell lead `= 0.35 s`, cycle `= 2.7 s`.
- **G4 telegraph:** every peek preceded by a readable tell in the last 0.35 s of `COVERED`.
- **G5 floor (asserted):** `PEEKING` exposure **≥ 0.5 s** even at max difficulty.
- **Tell floor (asserted):** tell lead **≥ 0.25 s**.
- **Head-during-`PEEKING` = the SOLE win** (ADR-0034 D4). Body/hostage/miss never win.
- **Hitbox classifier `qteZoneAt`:** the head / body / hostage / miss bands are **KEPT
  byte-for-byte** (Bertrand likes them). Their only conceptual change is that the anchor
  they are relative to no longer moves — so G6 spatial disjointness holds trivially on a
  fixed tableau. **No band value changes.**

The peek is still the captor's shot (ADR-0034 D3): the opening window is the danger window.
That fusion is untouched.

---

## 3. Blown-peeks loss clock (replaces the door clock — Bertrand's steer)

The door was the only fail route; it is gone. Its replacement is a **blown-peeks counter**.

**Definition.** A **blown peek** = a `PEEKING` exposure that **CLOSES** (`PEEKING → COVERED`)
**without a clean headshot during it** — i.e. exactly the event ADR-0034 already calls an
"unanswered peek". One event, two effects:

1. **Energy:** it drains **−8** (`QTE_UNANSWERED_PEEK`, unchanged), charged **once per closed
   exposure** (never per tick).
2. **Loss clock:** it **increments a `blownPeeks` counter**. When
   `blownPeeks` reaches **N**, the captor **executes the hostage → `LOST`**.

This is now the **sole fail route**. There is no door, no timeout, no second condition.

### 3.1 N — how many blown peeks kill her

| Field                   | Belliard default | Kind                             |
| ----------------------- | ---------------- | -------------------------------- |
| `maxBlownPeeks` (**N**) | **4**            | new per-level knob (F3-curvable) |

**Rationale for N = 4.** The old door budget (12.0 s at 0.6 u/s) produced **≈ 4 clean
peeks** before failure. Setting N = 4 reproduces that exact tempo without any movement: a
fully passive run blows peeks 1→4 and loses on the 4th close. Timeline (Belliard cadence):
`COVERED 1.5 → PEEK1 → COVERED → PEEK2 → COVERED → PEEK3 → COVERED → PEEK4 closes` ≈ **10.8 s**
of `ACTIVE` — a tense handful of openings, comparable to the old duel, and each opening is
still G5/G4-fair (≥ 0.5 s, telegraphed). The player gets four honest chances to hold their
nerve and take the head.

**Energy consistency check.** Passive ignore = 4 blown peeks × −8 = **−32 energy** — the
identical figure the current spec's stake check (§3) uses for "full ignore". So the energy
economy is undisturbed; only the terminal event changes (now a kill, not a door escape).

**Curve note (ADR-0035 F3).** N is authored per level, exactly as retreat-speed was: it
**replaces retreat-speed as the per-level clock knob**. Later districts lower N (tighter
duel) and/or tighten cadence toward the floors. Enforced invariant: **N is an integer ≥ 1**
(the clock must be able to run to a loss); authoring guidance **N ≥ 2** so no level executes
her on a single blown opening. Like the peek floors, this is asserted in code against the
authored `QteSpec`, not trusted from data (ADR-0035 D2 discipline).

### 3.2 Reinstates hostage death as the loss condition (reverses F-1)

**Call-out (explicit, for the gate).** ADR-0034's sole LOST route was "captor reaches the
door with her" — she was **not killable** (design-gate finding **F-1**, PR #79, awaiting
Bertrand's ratification). This revision **deletes that door** and makes **N blown peeks →
the captor kills the hostage** the sole LOST route. That **reinstates hostage death as the
loss condition and REVERSES the F-1 "hostage non-killable" ruling** — which was only ever
tied to the now-deleted door. F-1 should be marked **superseded by this revision**, not
ratified. Energy still has no death-at-0 (unchanged); the hostage's death is a QTE outcome
(`LOST`), not an energy event. The rescue-never-advances-the-kill-quota rule (ADR-0030 D4)
is untouched — this is still a side objective.

---

## 4. No second clock (single-clock principle holds)

**Recommendation: NO second clock.** The `blownPeeks` count (0 → N) **is** the single,
readable clock. It needs **no HUD bar and no countdown** — it advances only on a discrete,
already-telegraphed event (a peek closing), so it is legible as "he just got another chance
to kill her" without a meter. This keeps the single-clock decision ADR-0034 D1 fought for,
now honoured by a **static** clock instead of a spatial one.

**Render read (spec the read, style to `lead-art`):** the player must be able to sense **how
close the captor is to executing her** — e.g. escalating hostage distress / captor
aggression per blown peek, or N discrete pips near the tableau. That is a render/art read,
not a HUD requirement; gameplay only exposes `blownPeeks` and N.

**Kept from the ADR-0030 shell (unchanged):** the 2 s progressive **zoom**, the **"OTAGE"
banner** during zoom, the brief **WON / LOST** result hold (`QTE_RESULT_HOLD = 2.2 s`), and
the forward-only `ZOOMING → ACTIVE → (WON | LOST) → DONE` phase machine.

---

## 5. Contract delta (what leaves, what changes — for `senior-architect` + `dev-gameplay`)

Pure `src/game` only; boundary law preserved. This is the design intent; the dev lane owns
the code.

**Leaves the contract (movement is gone):**

- `QteSpec`: `porteCochere`, `retreatSpeed`.
- `HostageQte` runtime: `dir`, `speed`, `porteCochere`. The `anchor` **stays** but is now
  **constant** (the fixed zoom/classifier centre), never advanced.
- `qteSystem.ts`: the retreat-advance + door-reached branch in `tickQte` (ACTIVE step 2);
  the `createQte` invariants tied to the door — `dx === 0` "strictly ahead",
  `porteCochere.y === anchor.y` (C3), `retreatSpeed > 0` (D1). The finite-numerics guard (C6)
  drops `porteCochere.x/y` and `retreatSpeed`.

**Enters the contract:**

- `QteSpec`: `maxBlownPeeks: number` (N; integer ≥ 1, asserted).
- `HostageQte` runtime: `blownPeeks: number` (accumulator, 0 → N).
- `qteSystem.ts`: on each closed peek (the existing `PEEKING → COVERED` crossing that charges
  `QTE_UNANSWERED_PEEK`), **also** increment `blownPeeks`; when it reaches N, transition
  `ACTIVE → LOST`. Assert `maxBlownPeeks` is a finite integer ≥ 1 in `createQte`.

**Unchanged energy constants** (`qteSystem.ts`): `QTE_RESCUE_REFILL +40`,
`QTE_HOSTAGE_HIT −30`, `QTE_UNANSWERED_PEEK −8`, `QTE_PANIC_SHOT −6`, `QTE_BODY_HIT −5`,
`PEEK_EXPOSURE_FLOOR 0.5`, `TELEGRAPH_LEAD_SECONDS 0.35`, `QTE_ZOOM_SECONDS 2.0`,
`QTE_RESULT_HOLD 2.2`. All hitbox band constants unchanged.

**Tie-break (kept, ADR-0034 gotcha).** In an ACTIVE tick, resolve the player's `fire`
FIRST: a head-during-peek WINS even on the same tick the N-th peek would close. The shot
wins; the counter only reaches N when the peek closes unanswered.

---

## 6. Acceptance criteria (design VERIFY, stage 5)

Mirrors the current AC set; movement/door ACs replaced by static/blown-peeks ACs.

- **AC1 — Static captor.** The captor's `anchor` is **constant** for the whole QTE (no x or
  y advance); the camera zooms to it and holds. Nothing slides on the ground.
- **AC2 — Blown-peeks loss.** With no player fire, the **N-th** closed `PEEKING` exposure
  transitions the QTE to `LOST` (captor kills the hostage). Belliard N = 4 ⇒ loss on the 4th
  blown peek, ≈ 10.8 s of `ACTIVE` (± cadence tolerance).
- **AC3 — Sole win route.** A head hit **during `PEEKING`** is the only path to `WON`;
  body / hostage / miss never win (D4 loophole closed, no health bar).
- **AC4 — Energy ledger.** Clean rescue = +40 (clamped); hostage hit = −30; each blown peek
  = −8 charged **once** per closed exposure (a long peek is not over-billed); panic shot
  during zoom = −6; each body hit = −5. Severity order holds. Full passive ignore = −32
  **and** `LOST`.
- **AC5 — Floors asserted.** Belliard exposure ≥ 1.0 s in playtest; code asserts any authored
  exposure ≥ 0.5 s (G5) and any tell ≥ 0.25 s (G4); code asserts `maxBlownPeeks` is an
  integer ≥ 1. Unit tests on level data.
- **AC6 — Hitboxes unchanged.** `qteZoneAt` head/body/hostage/miss bands match the current
  values exactly (regression: same band asserts as before).
- **AC7 — Deterministic when absent.** `qteSpec === null` levels
  (`tutorial`/`stalingrad`/`vitry`) run no QTE and stay byte-for-byte deterministic; only
  `belliard` carries the spec.

Sacha playtests the built revision (`verify` skill) against AC1–AC7 and reports
PASS/deviations to `lead-game-designer` before the architect's integration review.

---

## 7. Open flags for the gate

1. **ADR amendment.** Removing D1's retreat/door and reversing F-1 is a design decision that
   needs an ADR record — recommend a short **ADR-0034 superseder** (or amendment) capturing
   "static captor + blown-peeks clock, hostage killable again". `tech-writer`/`producer` to
   allocate the number; the decision content is the gate's to ratify. This spec is the input.
2. **N = 4 vs the tempo.** N = 4 reproduces the old ≈ 4-peek budget and −32 ignore cost. If
   the gate wants a longer/shorter static duel, N is the single free knob — flag a preferred
   value; the fairness floors (G4/G5) are unaffected by N.
3. **The blown-peeks read.** Handed to `lead-art`: how the player perceives progress toward
   execution (distress escalation vs pips). Gameplay exposes `blownPeeks`/N; no HUD bar.

---

## 8. Addendum — the head kill-zone WANDERS during peeks (Bertrand steer)

**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18 · **Status:**
PASS-WITH-CORRECTIONS (`lead-game-designer` design gate,
`docs/handoffs/story-hostage-qte-duel.md` §15) — corrections **W-1** (closed-form waypoint
realignment) and **W-2** (field-name/placement reconcile) applied below by `tech-writer`,
2026-07-18. Cleared to `senior-architect` / dev.
**Steer (verbatim):** _"il faudrait faire bouger le rond dans lequel il faut tirer / cela
doit être des mouvements aléatoires."_

**What this changes and what it does NOT.** The captor stays **STATIC** (§1 stands — no
sliding). What now moves is only the **head kill-zone** — the shootable `"head"` band and
the reticle ring the render draws over it. Aiming becomes a **tracking-a-moving-target**
skill test instead of a fixed-point tap. Everything else (§§1–7) is inherited verbatim:
static captor, blown-peeks clock, energy ledger, floors, hostage band, sole-win rule.

**Cahier des charges.** Prohibition ST had no hostage duel and no moving reticle — this is
a **conscious, documented extension**, layered on the already-extension QTE. It deepens the
existing `Éviter`/skill axis (aim under pressure) without adding a new loop verb.

### 8.1 D-W1 — What moves, and when

1. The head kill-zone is a **fixed-size box** — **0.5 × 0.5** world units (half-extents
   0.25, **unchanged** from today's HEAD band) — whose **centre** is `anchor +
targetOffset`, where `targetOffset` is an anchor-relative wander vector (frozen name,
   was `peekTargetOffset` in this addendum's draft — see **W-2**).
   Difficulty comes from **motion, not shrink** (one variable at a time).
2. **`PEEKING` only.** `COVERED` has **no target**: no head zone, no ring (as today). The
   wander exists only while the exposure is open.
3. **Per-peek reset.** Each `COVERED → PEEKING` open starts a fresh track: the peek-elapsed
   clock `t` (derived, not stored — `peekDurationSeconds − stanceRemaining`) resets to 0,
   and the peek ordinal (`peekIndex`, the closed-peek count so far) selects a fresh
   hash-derived waypoint sequence off `targetSeed` (§8.2 — **W-1**). Peeks do not carry
   momentum across a `COVERED` beat — each opening is a genuinely fresh, decorrelated path.
4. The render's reticle ring **follows** `targetOffset` (it no longer sits at the fixed
   `CUE_DX/CUE_DY`). Ring-visual vs kill-box alignment is reconciled at the **composite
   gate**, exactly as the fixed cue is today (ADR-0034 gotcha) — the ring FRAMES the box.

### 8.2 D-W2 — Movement feel: seeded, deterministic, erratic-but-trackable

**Hard invariant (non-negotiable, `senior-architect` §14 LAW).** `src/game` stays
**replay-deterministic**: **no `Math.random`, no `Date.now`, no wall-clock, no per-tick
stepped PRNG cursor.** The motion is a **seeded, PURE closed-form function of elapsed peek
time `t`** — a per-QTE authored seed (`targetSeed`) plus a hash, not a mutable PRNG drawn
and advanced tick-by-tick. Same seed + same `t` ⇒ **byte-identical offset**, independent of
framerate/delta chunking (ADR-0035 D2 discipline, sharpened by §14's determinism LAW).

**Model — CLOSED-FORM HASHED-WAYPOINT WANDER (not Lissajous, not a stepped PRNG). Ruling:
`lead-game-designer`, `docs/handoffs/story-hostage-qte-duel.md` §15 — realigns this
addendum's original stateful draft, below, to `senior-architect`'s §14 determinism LAW
(correction **W-1**).**

`waypoint[k] = hash(targetSeed, peekIndex, k)` mapped into the wander region (§8.3);
`k = floor(t / legDuration)`; the offset smoothstep-eases between `waypoint[k]` and
`waypoint[k+1]` as `t` advances within leg `k`. `peekIndex` and `t` are both DERIVED from
already-deterministic sim state (§8.1 point 3 — `peekIndex = blownPeeks`,
`t = peekDurationSeconds − stanceRemaining`) — no stored cursor, no drawn-and-advanced PRNG.

| Decision                 | Value / rule                                                                                                                               | Rationale                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path generator           | Hash-derived waypoints in the wander region, indexed by `k = floor(t / legDuration)`; smoothstep-eased between consecutive waypoints.      | Bertrand asked for _"mouvements aléatoires"_. A **Lissajous/sine** loop is periodic → **learnable** → defeats the intent. Hashed, per-peek-decorrelated waypoints read as genuinely erratic yet stay a pure function of `t`. |
| Motion between waypoints | **Ease-in / ease-out** (smoothstep) per leg — decelerate INTO each waypoint, accelerate OUT.                                               | The target is **trackable, never teleporting**. The deceleration at each waypoint is the **fairness feature**: a natural "lead point" / firing window every leg.                                                             |
| Speed cap (Belliard)     | **`wanderSpeed` ≈ 1.2 world u/s** (peak, mid-leg) — realised via `legDuration` tuned against the wander-region box, not a stored velocity. | The 0.5-wide zone crosses its own width in ~0.42 s; over a peek the target stays within the small region and bounces — followable by a human, not a coin-flip.                                                               |
| Min leg length           | **0.15 u** — enforced as a min-distance constraint on the hash-to-waypoint mapping (re-hash on collision), not a runtime clamp.            | Below this the target jitters in place (reads as a glitch, untrackable). Forces visible, coherent legs.                                                                                                                      |
| Drift vs waypoints       | **Waypoints**, not continuous noise-drift.                                                                                                 | Discrete legs with eases give clear "it's heading there" reads; value-noise drift is an acceptable alt but muddier to lead.                                                                                                  |

**`wanderSpeed` (and the wander-region amplitude) are Belliard-first SYSTEM CONSTANTS in
`qteSystem.ts`, not `QteSpec` fields** — see §8.5 (**W-2**).

`HostageQte.targetOffset` stores ONLY the DERIVED result of the closed form above — the
current head-zone centre, recomputed each tick from `t`. **No `rngState` field, no
current-waypoint cursor field** on the runtime record: `k` and the two bracketing waypoints
are recomputed from `t` every tick, never carried forward (frozen field name `targetOffset`,
was `peekTargetOffset` in the original draft — **W-2**). **WYSIWYG classify order (unchanged
by the model realignment):** `fire` resolves FIRST against the STORED `targetOffset` — the
offset the render drew last frame, i.e. what the player actually aimed at (§5 tie-break
unchanged) — **then** the OUTGOING `targetOffset` for next frame is recomputed via the
closed form above.

### 8.3 D-W3 — Wander bounds (load-bearing: G6 + on-frame + reach)

The wander region is the box the **centre** of the head zone stays within. It is a
constant tied to the tableau geometry (mirrors the HEAD/HOSTAGE band constants); F3 curves
it per level (§8.4).

**Wander region — centre of the head zone, anchor-relative (Belliard):**

| Axis | Centre range      | Head-box occupancy (± 0.25) |
| ---- | ----------------- | --------------------------- |
| dx   | **−0.70 … −0.35** | −0.95 … **−0.10**           |
| dy   | **+0.60 … +0.85** | +0.35 … +1.10               |

**G6 — disjoint from the hostage on BOTH axes, at all times (the whole point of Bertrand's
"never risk a bavure" rule):**

- Hostage silhouette band: dx `0.0 … 0.75`, dy `−1.05 … 0.15`.
- Head-box **right edge ≤ −0.10** < hostage **left edge 0.0** → **dx margin ≥ 0.10** u,
  independent of dy. The rightmost reach `−0.10` is **exactly today's `HEAD_DX_MAX`** — the
  G6-critical boundary is **preserved unchanged**; the wander only extends left/up from it.
- Head-box **bottom ≥ +0.35** > hostage **top 0.15** → **dy margin ≥ 0.20** u.
- ⇒ Disjoint on **both** axes with belt-and-suspenders margins (0.10 dx **and** 0.20 dy).
  No peek position ever forces the player to risk the hostage to reach the head. **G6 holds.**

**On-frame / readable at the QTE zoom:** head-box occupancy dx `[−0.95, −0.10]`, dy
`[0.35, 1.10]` sits inside the ~2.0 u tableau plane's upper-left (the head-pop region), so
the ring stays framed at the zoom. **Human reach:** region span is only **0.35 × 0.25** u —
small enough that acquisition never demands a large flick, large enough that the target
genuinely moves.

**Assert in code (createQte, against constants):** region right edge < `HOSTAGE_DX_MIN` and
region bottom > `HOSTAGE_DY_MAX`, each by a positive margin — G6 is asserted, never trusted
(ADR-0035 discipline). Same treatment the peek floors get.

### 8.4 D-W4 — Difficulty: a moving target is harder → rebalance Belliard

A moving target for the full peek is strictly harder than a fixed tap. To keep level 1
**fair and approachable**, extend the **exposure** slightly (cheaper than lowering speed,
and it preserves the ~4-opening tempo); keep speed modest and the zone full-size.

| Field                 | Old (§2.1) | **New (Belliard)**    | Rationale                                                                                                                                                                  |
| --------------------- | ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `peekDurationSeconds` | 1.2 s      | **1.4 s**             | +0.2 s cushion to **acquire → track → fire** a moving reticle; still ≫ G5 floor 0.5 s. Reaction ~0.3–0.5 s leaves ~0.9 s of tracking + a waypoint ease as a firing window. |
| `wanderSpeed`\*       | —          | **1.2 u/s**           | Peak mid-leg; followable (§8.2).                                                                                                                                           |
| `maxBlownPeeks` (N)   | 4          | **4** (unchanged)     | Keeps the four-honest-chances tempo; energy economy (−32 full ignore) undisturbed.                                                                                         |
| `peekCadenceSeconds`  | 1.5 s      | **1.5 s** (unchanged) | COVERED beat + G4 tell unchanged.                                                                                                                                          |

\* `wanderSpeed` here is the Belliard-tuned VALUE of a **system constant** in `qteSystem.ts`
— not a `QteSpec` field (**W-2**, §8.5). Only `targetSeed` is per-level today.

**Tempo check.** Cycle 1.5 + 1.4 = **2.9 s**; passive loss (N = 4) ≈ **11.6 s** of ACTIVE
(4×1.4 peeks + 4×1.5 covered) — within cadence tolerance of the §3 ≈ 10.8 s duel, a touch
longer, appropriate for the added skill demand. Energy ledger unchanged.

**F3 / ADR-0035 curve note.** For Belliard, `wanderSpeed` and the wander-region amplitude are
**system constants** in `qteSystem.ts` — only `targetSeed` is a per-level `QteSpec` field
today. `N` and the cadence remain authored `QteSpec` fields (unchanged from §3.1/§2.1). When
a later district needs to curve `wanderSpeed` / the region per level (guidance: cap
`wanderSpeed` ~2.0 u/s so it stays human-trackable; widen the region always re-clamped so the
head-box right edge stays `< 0` and the dy margin `≥ 0.15` — **G6 is invariant, never curved
away**), `senior-architect` promotes them to `QteSpec` (`wanderAmplitude: Vec2`,
`wanderSpeed: number`) as an ADDITIVE change in the same dev-gameplay pass — the seam
Winston pre-authorized (§14), not a redesign. Belliard sits at the gentle end of every knob,
today as constants.

### 8.5 Contract delta (design intent for `senior-architect` + `dev-gameplay`)

Pure `src/game`; boundary law preserved. Additive — nothing from §5 leaves. Realigned to the
frozen closed-form model per **W-1**/**W-2**
(`docs/handoffs/story-hostage-qte-duel.md` §14/§15) — field names below are the frozen ones,
not this addendum's original draft names.

**Enters the contract:**

- `QteSpec`: `targetSeed: number` (integer, per-level, seeds the closed-form hash — the
  determinism input; frozen name, was `wanderSeed` in the draft). **`wanderSpeed` and the
  wander-region amplitude are Belliard-first SYSTEM CONSTANTS in `qteSystem.ts`
  (`WANDER_AMP_X/Y`, wander leg speed), NOT `QteSpec` fields** — only `targetSeed` enters
  `QteSpec` today. Region extents live as module constants (`WANDER_DX_MIN/MAX`,
  `WANDER_DY_MIN/MAX`) mirroring the band constants. Promoting `wanderSpeed`/amplitude to
  `QteSpec` is the ADDITIVE seam that lands **when F3/ADR-0035 arrives** (§8.4), not now.
- `HostageQte` runtime: `targetOffset: Vec2` (anchor-relative, the live head-zone centre —
  frozen name, was `peekTargetOffset` in the draft). This is a **DERIVED CACHE ONLY**,
  recomputed each tick from the closed form (§8.2) — **no `rngState` field, no
  waypoint-cursor field.** Reset to the neutral head-zone centre on each peek close;
  meaningful (wandering) only while `stance === "PEEKING"`.
- `qteZoneAt`: the `"head"` test becomes a fixed-size box (half-extents 0.25) centred on
  `targetOffset` instead of the fixed HEAD\_\* band — frozen signature
  `qteZoneAt(dx, dy, stance, targetOffset)`. Precedence unchanged (hostage wins; head only
  while PEEKING). All other bands byte-for-byte unchanged.
- `createQte`: assert `targetSeed` finite (integer); the region↔G6 disjointness asserted
  against constants (§8.3). (No per-level `wanderSpeed` assert — it is a constant, not
  authored data.)

**Render note (spec the read, not the code — `dev-r3f-render` owns it):** the reticle ring
reads `targetOffset` from the runtime each frame and positions itself at `anchor +
targetOffset` (replacing the fixed `CUE_DX/CUE_DY`). Ring size/opacity two-beat tell
(§ HostageQteSprite) unchanged; only its centre now tracks.

### 8.6 Updated acceptance criteria (append to §6)

- **AC8 — Moves only during PEEKING.** `targetOffset` changes across ticks **only while
  `stance === "PEEKING"`**; during `COVERED` there is no target and no ring. Verified in the
  built QTE (`verify`): the ring visibly wanders while open, absent while covered.
- **AC9 — In-bounds / G6-clear always.** For every tick of every peek, the head-box (centre
  ± 0.25) stays inside the wander region and **disjoint from the hostage band on both axes**
  (dx margin ≥ 0.10, dy margin ≥ 0.20). Unit test samples the wander across a full peek and
  asserts no head-box position enters or abuts the hostage band. No bavure is ever required
  to reach the head.
- **AC10 — Deterministic.** Same `targetSeed` + same tick sequence ⇒ identical
  `targetOffset` path (unit test on two runs). No `Math.random`/`Date.now` in the wander
  (lint/grep asserted). `targetSeed`-absent / `qteSpec === null` levels unaffected (AC7).
- **AC11 — Trackable & fair on Belliard.** In playtest (`verify`), a human can acquire and
  headshot the moving target within a Belliard peek: `wanderSpeed = 1.2 u/s`,
  `peekDurationSeconds = 1.4 s`, zone 0.5 × 0.5, region 0.35 × 0.25 — the target never
  teleports, decelerates into each waypoint (a firing window), and stays on-frame at the
  zoom. N = 4 keeps the duel winnable on level 1.

Sacha playtests the built wander against **AC8–AC11** (plus the inherited AC1–AC7) and
reports PASS/deviations to `lead-game-designer` before the architect's integration review.

### 8.7 Open flags for the gate (append to §7)

4. **ADR touch — applied.** The wander adds `targetSeed` to the `QteSpec` contract
   (`wanderSpeed`/amplitude stay system constants, not `QteSpec` fields — §8.5, **W-2**) and
   a seeded pure hash function to the pure tick — recorded in ADR-0034's Revision 3
   (`tech-writer`, per Flag Y, `docs/handoffs/story-hostage-qte-duel.md` §14/§15): "head
   kill-zone wanders on a per-QTE seed via a closed-form hashed-waypoint function; G6
   invariant across the wander region."
5. **Model choice — RULED.** Closed-form hashed-waypoint ships
   (`lead-game-designer` §15 ruling, over this addendum's illustrative stateful draft and the
   architect's sum-of-sines sketch — see §8.2, **W-1**). Bounds (§8.3), determinism, and the
   Belliard tuning (§8.4) are unaffected by the internal generator shape.
6. **Ring-follows-target read.** Handed to `lead-art` / composite gate: confirm the moving
   ring still reads as "shoot HERE" and its alignment to the kill-box holds across the wander
   (the fixed-cue reconciliation, now over a moving centre).

---

## 9. Addendum — captor HP + colour-timing meter, and a WIDER/FASTER wander (Bertrand steer, PR #79)

> **⚠ SUPERSEDED IN PART by §10 (Bertrand reframe, 2026-07-18).** The **colour model of
> this section is DEAD.** §9.2 (`D-C2`, the rouge→jaune→vert **TIME ramp**) is **entirely
> superseded** — colour is no longer a function of peek-elapsed time; it is now a function
> of **what captor anatomy the wandering ring is over** (spatial). The wander **box/speed**
> of §9.4 (`D-C4`) is superseded by the **wider** roam box of §10.B. **What CARRIES FORWARD
> from §9:** captor HP (§9.1 `D-C1`, HP = 3), the damage amounts (§9.3 `D-C3`, green 2 /
> yellow 1 / red 0), the loss-clock + energy reconcile (§9.5 `D-C5`), and the D4 reversal
> (captor killable by HP). Read §9.1/§9.3/§9.5 as still live; read §9.2/§9.4 through §10.
> **Implement §10, not §9's colour/wander.**

**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18 · **Status:** DRAFT — **needs
`lead-game-designer` (Karim) PASS** before `senior-architect` and any dev implements it.
**Supersedes within §8 (values only, model untouched):** the wander box (§8.3), the wander
speed / `LEG_DURATION` (§8.2/§8.4), and `peekDurationSeconds` (§8.4). Everything else in
§§1–8 is inherited verbatim — **static captor, seeded PURE closed-form wander determinism
(no `Math.random`/`Date.now`), G6, the hitbox classifier, the blown-peeks clock shell.**
**Reverses:** ADR-0034 **D4** ("one headshot = kill, no captor HP") — the captor is killable
by HP again (see 9.1). This needs the same ADR touch already flagged (§7.1 / §8.7.4).

### 0. Two product calls (Bertrand, verbatim + confirmed)

1. **"Plus ample et plus rapide"** — the wandering target ring must move over a **WIDER**
   area and **FASTER** (current: box dx −0.70..−0.35 / dy +0.60..+0.85, peak ~1.2 u/s).
2. **"PV + chip couleur"** — the captor gets an **HP bar**; the ring **CYCLES
   rouge→jaune→vert** as a timing meter; a head hit removes captor HP by the ring's colour
   **at shot time** — _"vert → beaucoup, jaune → un peu, rouge → rien"_; depleting captor
   HP = hostage saved (WON). Loss unchanged: captor executes the hostage if still alive after
   N blown peeks. Shooting the hostage = penalty.

**Cahier des charges.** Prohibition ST had neither a hostage duel, a captor HP bar, nor a
colour-timed reticle. This is a **conscious, documented extension**, layered on the already-
extension QTE. It deepens the existing `Éviter`/skill axis (aim + time under pressure)
without adding a new loop verb. The core loop `Récupérer → Livrer → Éviter` is untouched.

### 9.1 D-C1 — Captor HP, reintroduced (reverses ADR-0034 D4)

A head hit during `PEEKING` no longer **instantly** wins. It **chips** the captor's HP by the
ring's colour-damage at shot time (9.3). **WON** fires the instant `captorHp ≤ 0` (that
depleting shot pays the `QTE_RESCUE_REFILL +40`). The head band, its precedence, and the
sole-kill-route-is-head-during-peek rule are all **unchanged** — only its _effect_ changes
from binary-win to chip.

| Field               | Belliard default | Kind                                                     |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `captorHp` (**HP**) | **3**            | new per-level knob (`QteSpec`; integer ≥ 1, F3-curvable) |

**Rationale for HP = 3.** With green = 2 / yellow = 1 (9.3) and **one green window per peek**
(9.2), HP = 3 yields a clean fairness gradient over the N = 4 openings:

- **Mastery** — tag the same peek's yellow _then_ green (1 + 2 = 3) ⇒ win on **peek 1**.
- **Skilled** — one green per opening (2) then a yellow/green ⇒ win by **peek 2**.
- **Average** — one yellow per opening (1×3) ⇒ win on **peek 3**, one opening to spare.
- N = 4 guarantees even the yellow-only grinder a spare opening. **Approachable on level 1.**

HP is a `QteSpec` field (per-level, exactly like `maxBlownPeeks`) — later districts raise it
for tougher captors. The **damage amounts and colour model are SYSTEM CONSTANTS** (9.3/9.2),
Belliard-first; F3/ADR-0035 may promote them, like `wanderSpeed` (§8.4).

### 9.2 D-C2 — The colour cycle is a deterministic ripening meter (rouge→jaune→vert)

> **⚠ THIS SUB-DECISION IS SUPERSEDED BY §10.A/§10.D.** Colour is no longer temporal. Kept
> below only as the record of the reframed design. `ringColourAt(t, peekDuration)` is
> replaced by the spatial `ringColourAt(ringCentre)` of §10. Do not implement the time ramp.

The ring's colour is a **PURE function of peek-progress** — same determinism law as the
wander (no `Math.random`, no `Date.now`, no stored PRNG cursor). Let
`p = t / peekDurationSeconds` where `t` is the peek-elapsed seconds already derived for the
wander (`t = peekDurationSeconds − stanceRemaining`, clamped ≥ 0). Then:

| Colour    | Fraction `p` of the peek  | Window @ Belliard 1.5 s peek | Meaning                                     |
| --------- | ------------------------- | ---------------------------- | ------------------------------------------- |
| **ROUGE** | `[0.00, 0.40)` — **40 %** | 0.60 s                       | Unripe. Head hit = **0 dmg** (don't shoot). |
| **JAUNE** | `[0.40, 0.75)` — **35 %** | 0.525 s                      | Ripening. Head hit = **small** (1).         |
| **VERT**  | `[0.75, 1.00]` — **25 %** | 0.375 s                      | Ripe. Head hit = **big** (2). The payoff.   |

**Order / loop — a single monotonic RAMP per peek, no snap-back mid-peek.** The meter
"ripens" rouge→jaune→vert **once**, spanning exactly one peek (**cycle period = the peek
duration**). It does **not** oscillate (r→y→g→y→r) and it does **not** snap-and-repeat inside
a peek — the peek **closes at green**, and the next peek restarts fresh at rouge (per-peek
reset, mirroring the wander's per-peek fresh track, §8.1). Rationale:

- **Green is the smallest slice (25 %) and the last** — it is the harder-to-catch reward, and
  placing it at the tail makes each opening a "hold your nerve, fire before he covers" beat.
- **Red is the largest slice (40 %) and first** — "he just popped out, unripe, don't waste
  the shot"; it is the natural "don't shoot" window Bertrand asked for.
- **Tying the period to the peek** (not a sub-peek frequency) means the player parses **one**
  ripening rhythm synced to the opening, alongside the **one** position track — two skill
  axes, not three, and **no dead time** (the ramp fills the whole opening). It is maximally
  learnable for level 1: same colour timing every peek; only the _position_ varies per peek
  (hash by `peekIndex`, §8.2). Green in seconds scales with the peek, so the G5 exposure
  floor automatically keeps a green window open.
- **F3 curve lever (later districts):** shorten the colour period **below** `peekDuration`
  (⇒ multiple ramps per peek with snap-back, more but tighter green windows) and/or shift the
  slice fractions (shrink green). Belliard sits at the gentle end: one wide ramp, green 25 %.

**Determinism / WYSIWYG.** `ringColourAt(t, peekDurationSeconds)` is pure and framerate-
independent (function of `t` alone). At `fire`, the classifier reads the **incoming** `t`
(the frame the render drew) — the same tie-break/aim-honesty order the wander already uses
(§5, §8.2): resolve the shot against the colour+offset the player actually saw, _then_
advance the stance machine.

### 9.3 D-C3 — Damage by colour (a head hit during PEEKING)

| Shot outcome (during `PEEKING`)         | Captor HP                              | Energy                                                 |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| Head hit, ring **VERT**                 | **−2** (`CAPTOR_DMG_GREEN`)            | 0 (chip is the reward; +40 only on the depleting shot) |
| Head hit, ring **JAUNE**                | **−1** (`CAPTOR_DMG_YELLOW`)           | 0                                                      |
| Head hit, ring **ROUGE**                | **0** (`CAPTOR_DMG_RED`) — wasted shot | 0                                                      |
| Depleting shot (`captorHp` reaches ≤ 0) | → **WON**                              | **+40** (`QTE_RESCUE_REFILL`)                          |
| Body hit (any time)                     | 0                                      | **−5** (`QTE_BODY_HIT`)                                |
| Hostage hit (bavure)                    | 0                                      | **−30** (`QTE_HOSTAGE_HIT`)                            |
| Miss / off-ring                         | 0                                      | 0                                                      |

- Damage is applied **only** to a `"head"` classification (which already requires
  `stance === "PEEKING"` **and** the shot inside the moving head-box — 9.4 / `qteZoneAt`). A
  shot **not aligned** with the ring is not a head hit → no captor damage; it keeps today's
  penalties by band (body −5, hostage −30, miss 0).
- Damage **`green 2 / yellow 1 / red 0`** vs **`captorHp 3`** ⇒ "~2 greens, or 3 yellows"
  (9.1). These three amounts are SYSTEM CONSTANTS (F3-promotable), not authored data.
- **Red is a genuine waste** (0 dmg, 0 energy) — the peek still closes and still ticks the
  loss clock (9.5), so spending your one aligned shot on red costs you an opening. This is the
  teaching pressure toward "wait for jaune/vert".

### 9.4 D-C4 — Wander WIDER + FASTER (directive 1)

Extend the wander box **LEFT and UP**; keep the **right edge pinned** (the G6-critical
boundary, never toward the hostage) and the **bottom pinned** (the G6 dy margin). Raise the
peak speed. Zone size stays 0.5 × 0.5 (difficulty from motion, not shrink — §8.1).

| Constant               | Old (§8)        | **New (Belliard)** | Note                                                                                              |
| ---------------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| Wander box **dx**      | −0.70 … −0.35   | **−0.95 … −0.35**  | Extended **left** by 0.25 u; **right pinned −0.35**.                                              |
| Wander box **dy**      | +0.60 … +0.85   | **+0.60 … +0.95**  | Extended **up** by 0.10 u; **bottom pinned +0.60**.                                               |
| `WANDER_AMP_X`         | 0.175           | **0.30**           | half-extent (centre −0.65).                                                                       |
| `WANDER_AMP_Y`         | 0.125           | **0.175**          | half-extent (centre 0.775).                                                                       |
| `HEAD_NEUTRAL`         | (−0.525, 0.725) | **(−0.65, 0.775)** | new box centre (also the COVERED rest / clamp anchor).                                            |
| Peak `wanderSpeed`     | ~1.2 u/s        | **~1.8 u/s**       | +50 %. "Plus rapide."                                                                             |
| `LEG_DURATION`         | 0.35 s          | **0.28 s**         | realises the ~1.8 u/s peak (a representative ~0.34 u leg × 1.5 smoothstep peak / 0.28 ≈ 1.8 u/s). |
| `MIN_LEG_DISPLACEMENT` | 0.15 u          | **0.15 u** (kept)  | anti-jitter floor unchanged (one variable at a time).                                             |

- **Area:** 0.60 × 0.35 = 0.21 u² vs old 0.35 × 0.25 = 0.0875 u² → **~2.4× wider**. "Plus
  ample."
- **G6 preserved (asserted, never trusted).** Head-box occupancy is now dx **[−1.20, −0.10]**,
  dy **[0.35, 1.20]**. Right edge **−0.10** is _unchanged_ (= today's `HEAD_DX_MAX`) →
  dx margin to the hostage (left edge 0.0) stays **≥ 0.10**. Bottom **0.35** is _unchanged_ →
  dy margin to the hostage (top 0.15) stays **≥ 0.20**. Disjoint on **both** axes; the
  `clampTargetOffsetG6` net (minY = 0.15 + 0.10 + 0.25 = 0.50) never fires because the box
  bottom (0.60) sits above it. **G6 holds; the wander only grows away from the hostage.**
- **On-frame flag (composite gate).** Left reach −1.20 / top 1.20 modestly exceed the §8.3
  established safe occupancy (−0.95 / 1.10). Composite gate to confirm the ring stays framed
  at the QTE zoom; if it clips, tighten `WANDER_AMP_X` to 0.25 (left edge −0.90) — the
  right-edge/G6 pin is unaffected.
- **Human-trackable.** Still smoothstep waypoint eases that decelerate to zero velocity at
  each waypoint (the fairness "lead point"); it never teleports. 1.8 u/s over a 1.5 s peek is
  fast but followable — verified in playtest (AC), tightened if it reads as a coin-flip.

### 9.5 D-C5 — Loss clock + energy reconcile

**Blown peek — redefined and CONFIRMED.** A **blown peek** now means **"a `PEEKING` exposure
that CLOSES with the captor still alive (`captorHp > 0`)"** — i.e. every closed opening ticks
the clock, whether or not you chipped him that opening. It is no longer "closed without a
headshot" (headshots now chip rather than win, so that framing is obsolete). Reaching
`maxBlownPeeks` (**N = 4**) closes with `captorHp > 0` ⇒ the captor **executes the hostage →
LOST**. If the depleting shot lands first (tie-break: `fire` resolves first) ⇒ **WON**. The
blown-peeks counter stays the **sole** fail route (no door, no second clock — §4 holds).

**Energy — KEPT as the reward/penalty layer (do NOT fold).** It stays orthogonal to captor
HP: HP is the win condition, energy is the running cost/reward ledger. Unchanged magnitudes:

- `QTE_RESCUE_REFILL +40` on WON (the HP-depleting shot).
- `QTE_HOSTAGE_HIT −30`, `QTE_BODY_HIT −5`, `QTE_PANIC_SHOT −6` (zoom).
- `QTE_UNANSWERED_PEEK −8` **per closed peek while the captor is alive** — reframed as _the
  captor's counter-fire each opening he survives_ (he shoots you every peek). Passive ignore =
  4 × −8 = **−32**, the identical figure §3/§8 use; the economy is undisturbed. An engaged
  player who finishes early eats fewer of these — a natural reward for a fast kill.

**On-screen read (E) — flag to `ux-designer` + `lead-art`.** Reintroducing HP means the
player must sense **how much captor HP remains** and **the ring colour**. Two reads:

1. **Ring colour** (the timing meter): diegetic on the reticle — rouge→jaune→vert. Owned by
   `dev-r3f-render` + `lead-art`; the render reads the runtime's colour-phase each frame
   (same `t` the classifier uses). Composite-gate the colour↔damage alignment (as the moving
   ring is already gated, §8.7.6).
2. **Captor HP** (3 points): **recommend a minimal DIEGETIC read** — captor flinch/stagger
   escalating per chip and/or **3 discrete pips** near the tableau — **not** a full HUD bar
   if avoidable (keep the single diegetic read the QTE has held). **Flag to `ux`:** a small
   HP read returns after ADR-0034 D4 removed it; `ux` rules pips-vs-diegetic-vs-HUD.

### 9.6 D-C6 — Combined-difficulty tuning for Belliard (level 1 stays approachable)

The combined test (track a **wider + faster** ring **and** time the green window **and** chip
HP over the openings) is materially harder than the single-axis moving-tap. To keep level 1
fair, add a small exposure cushion and keep every other knob at its gentle end. **One green
window per peek**, generous yellow fallback, HP sized so the yellow-only path still makes
quota with a spare opening.

| Field                   | §8 value   | **New (Belliard)**                    | Rationale                                                                                                                         |
| ----------------------- | ---------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `captorHp`              | — (binary) | **3**                                 | 2 greens / 3 yellows across N openings; yellow-only path wins by peek 3 (9.1).                                                    |
| Damage green/yellow/red | —          | **2 / 1 / 0**                         | SYSTEM constants (9.3).                                                                                                           |
| Colour period           | —          | **= `peekDuration`**                  | one ripening ramp per peek, no dead time, learnable (9.2).                                                                        |
| Colour slices r/y/g     | —          | **40 % / 35 % / 25 %**                | green smallest = payoff; red largest = "don't shoot" (9.2).                                                                       |
| `peekDurationSeconds`   | 1.4 s      | **1.5 s**                             | +0.1 s cushion for the wider/faster ring; ⇒ roomy colour windows (red 0.60 / yellow 0.525 / green 0.375 s), all ≫ G5 floor 0.5 s. |
| `wanderSpeed` (peak)    | 1.2 u/s    | **1.8 u/s**                           | "Plus rapide" (9.4).                                                                                                              |
| Wander box              | §8.3       | **dx −0.95..−0.35 / dy +0.60..+0.95** | "Plus ample", G6-pinned right/bottom (9.4).                                                                                       |
| `maxBlownPeeks` (N)     | 4          | **4** (unchanged)                     | Preserves the four-openings tempo AND the −32 passive-ignore economy; HP (not N) carries the added difficulty.                    |
| `peekCadenceSeconds`    | 1.5 s      | **1.5 s** (unchanged)                 | COVERED beat + G4 tell unchanged.                                                                                                 |

**Tempo check.** Cycle 1.5 + 1.5 = **3.0 s**; passive loss (N = 4) ≈ **12.0 s** of ACTIVE — a
touch longer than §8's ≈ 11.6 s, within cadence tolerance, appropriate for the deeper skill
demand. G4/G5 floors unaffected (exposure 1.5 s ≫ 0.5 s; tell 0.35 s ≥ 0.25 s). Energy ledger
unchanged.

### 9.7 Contract delta (design intent for `senior-architect` + `dev-gameplay`)

Pure `src/game`; boundary law preserved. **Additive** — nothing from §5/§8.5 leaves; the
wander model, seed, and determinism are untouched (only tuned).

**Enters the contract:**

- `QteSpec`: **`captorHp: number`** (integer ≥ 1, per-level; asserted in `createQte`).
- `HostageQte` runtime: **`captorHp: number`** (remaining, decrements on chip; seeded from
  `spec.captorHp` in `createQte`).
- `qteSystem.ts` SYSTEM CONSTANTS: `CAPTOR_DMG_GREEN = 2`, `CAPTOR_DMG_YELLOW = 1`,
  `CAPTOR_DMG_RED = 0`; colour thresholds `RING_YELLOW_AT = 0.40`, `RING_GREEN_AT = 0.75`
  (fractions of the peek). A pure **`ringColourAt(t, peekDurationSeconds): "red"|"yellow"|"green"`**
  and a **`captorDamageFor(colour): number`**.

**Changed behaviour (tuning + one branch):**

- `qteSystem.ts` constants **re-tuned** (values only, §9.4/§9.6): `WANDER_AMP_X 0.175→0.30`,
  `WANDER_AMP_Y 0.125→0.175`, `HEAD_NEUTRAL (−0.525,0.725)→(−0.65,0.775)`,
  `LEG_DURATION 0.35→0.28`. Belliard `QteSpec.peekDurationSeconds 1.4→1.5`. The G6-assert
  bounds move with the box (still asserted against `HOSTAGE_*`, §8.3).
- `tickQte` **ACTIVE step (1)**: on a `"head"` classification, **do not** return WON. Instead
  compute `colour = ringColourAt(t_incoming, qte.peekDurationSeconds)`, subtract
  `captorDamageFor(colour)` from `captorHp`; **if `captorHp ≤ 0` → WON with `+40`**, else stay
  ACTIVE with the reduced `captorHp` (energy 0 for the chip; red chip is a no-op). Body /
  hostage / miss branches unchanged.
- `tickQte` **ACTIVE step (2)**: the loss test becomes "blown peek closes **with
  `captorHp > 0`**" — `blownPeeks += 1` on each close (as today); on reaching
  `maxBlownPeeks`, LOST **only if `captorHp > 0`** (it always will be here, since a depletion
  would have returned WON in step 1). Tie-break (fire-first) unchanged.
- `createQte`: add `captorHp` to the C6 finite-numerics guard; assert
  `Number.isInteger(spec.captorHp) && spec.captorHp ≥ 1`.

**`qteZoneAt` is UNCHANGED** — it still returns `"head"` for a shot inside the moving box
during PEEKING. The colour→damage decision lives in `tickQte`, not the classifier (the
classifier answers _where_, the tick answers _how much_). All bands byte-for-byte unchanged.

**Render note (spec the read — `dev-r3f-render` owns it):** the reticle ring colour reads
`ringColourAt(t, peekDuration)` (or a runtime-exposed colour-phase) each frame and tints the
ring rouge/jaune/vert; the ring centre still tracks `targetOffset` (§8.5). A minimal captor-HP
read (pips / stagger) per 9.5 — pending `ux` ruling.

### 9.8 Updated acceptance criteria (append to §6 / §8.6)

- **AC12 — Captor HP chips, HP depletion is the win.** A head hit during PEEKING subtracts
  colour-damage (green 2 / yellow 1 / red 0) from `captorHp`; the QTE reaches **WON only when
  `captorHp ≤ 0`**, and the depleting shot pays `+40`. Belliard `captorHp = 3`. Unit tests:
  green×2 ⇒ WON; yellow×3 ⇒ WON; red hits never reduce HP.
- **AC13 — Colour is a deterministic ripening meter.** `ringColourAt` is a PURE function of
  peek fraction `p = t / peekDuration`: red `[0,0.40)`, yellow `[0.40,0.75)`, green
  `[0.75,1.0]`; one monotonic ramp per peek, reset each open; no `Math.random`/`Date.now`
  (lint/grep asserted). The rendered ring colour at any frame equals the colour the classifier
  applies at a `fire` on that frame (WYSIWYG — composite gate).
- **AC14 — Wider + faster wander, G6 intact.** Belliard wander box dx **−0.95..−0.35** / dy
  **+0.60..+0.95**, peak **~1.8 u/s**, zone 0.5 × 0.5. Right edge of the head-box stays
  **−0.10** and bottom **+0.35** for every tick of every peek ⇒ dx margin ≥ 0.10, dy margin
  ≥ 0.20 to the hostage band (unit test samples a full peek; **no bavure ever required**).
  Playtest: the ring visibly ranges wider/faster than the §8 build yet stays trackable and
  on-frame at the zoom.
- **AC15 — Loss = N openings with the captor alive.** Every `PEEKING` close with
  `captorHp > 0` increments `blownPeeks`; the **N-th** such close (Belliard N = 4) with
  `captorHp > 0` ⇒ **LOST**. A same-tick depleting head hit ⇒ **WON** (fire resolves first).
  Passive ignore ⇒ 4 blown peeks, **−32 energy**, LOST.
- **AC16 — Energy ledger unchanged.** +40 WON (depletion), −30 hostage, −8 per closed peek
  (captor alive), −6 panic (zoom), −5 body; green/yellow/red chips and misses cost 0 energy.
  Severity order holds.
- **AC17 — Approachable on Belliard (combined test).** In playtest (`verify`), a human can
  deplete `captorHp = 3` within N = 4 openings against the wider/faster ring + colour timing:
  the yellow-only path (3 yellows in 4 peeks) succeeds, and a 2-green path wins by peek 2.
  `createQte` asserts `captorHp` is an integer ≥ 1.

Sacha playtests the built integration against **AC12–AC17** (plus inherited AC1–AC11) and
reports PASS/deviations to `lead-game-designer` before the architect's integration review.

### 9.9 Open flags for the gate (append to §7 / §8.7)

7. **ADR touch (D4 reversal).** Reintroducing `captorHp` reverses ADR-0034 **D4** ("one
   headshot = kill, no captor HP") and adds `captorHp` to the `QteSpec` contract + a
   colour→damage rule to the pure tick. Fold into the same ADR-0034 revision already flagged
   (§8.7.4) — `tech-writer`/`producer` allocate; the decision content is the gate's. This
   spec is the input.
8. **HP vs N as the difficulty carrier — RULED here, flag for confirm.** I put the added
   combined difficulty on **`captorHp` (3)**, keeping **N = 4** to preserve the tempo and the
   −32 economy. If the gate prefers a longer safety net, the single lever is **N → 5** (with
   `captorHp` held) OR **`captorHp` → 2**; both stay approachable. Flag a preference.
9. **Captor-HP read — to `ux` + `lead-art`.** A minimal HP read (pips / stagger) returns after
   D4 removed the bar; `ux` rules the form (recommend diegetic, not a HUD bar). Ring-colour
   read handed to `lead-art` / composite gate alongside the moving-ring read (§8.7.6).
10. **On-frame check.** The wider box (head-box top 1.20 / left −1.20) modestly exceeds §8.3's
    safe occupancy; composite gate confirms framing at the zoom, else tighten `WANDER_AMP_X`
    to 0.25 (§9.4) — G6 pin unaffected.

---

## 10. Addendum — the ring's colour is SPATIAL: it is WHAT ANATOMY the wandering ring is over (Bertrand reframe, PR #79)

**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18 · **Status:** DRAFT — **needs
`lead-game-designer` (Karim) PASS** before `senior-architect` and any dev implements it.
**Supersedes:** §9.2 (`D-C2`, the colour **TIME ramp**) in full, and the wander **box/speed**
values of §9.4 (`D-C4`). **Inherits verbatim** from §§1–9 (unchanged): static captor (§1),
seeded **PURE closed-form** wander determinism — no `Math.random`/`Date.now`/stored PRNG
cursor (§8.2), the G6 never-a-bavure law (§8.3), the blown-peeks loss clock (§3/§9.5),
captor HP + damage amounts + the D4 reversal (§9.1/§9.3), and the energy ledger (§9.5).
**The diegetic captor-HP read stays pips / stagger — NO HUD bar (U-1, §9.5).**

**Bertrand's reframe (verbatim).** _"Rouge = le rond n'est pas sur le preneur (sur du
vide). Jaune = le rond est sur une partie non létale (bras, jambe…). Vert = le rond est sur
une zone létale (torse, visage). Plus d'ampleur dans le mouvement."_ The colour is now
**WHERE THE RING IS**, not **WHEN in the peek** it is. You track the roaming ring and fire
when it is over a lethal zone (green).

**Cahier des charges.** Prohibition ST had no hostage duel, no roaming reticle, no
anatomy-coloured target — still a **conscious, documented extension** on the already-
extension QTE. It deepens the `Éviter`/skill axis (track + read anatomy under pressure); no
new loop verb; `Récupérer → Livrer → Éviter` untouched.

### 10.A — D-S1 — Captor anatomy map (`ringZoneAt(ringCentre): RingZone`)

> **Names are the architect's FROZEN contract** (`docs/handoffs/story-hostage-qte-duel.md`,
> spatial-colour freeze): the pure game layer returns an ANATOMY **zone** — `RingZone =
"vital" | "limb" | "off"` — from **`ringZoneAt(centre)`**; the **render** maps that zone to
> the diegetic **colour** (vital → **vert**, limb → **jaune**, off → **rouge**). Game owns
> _lethality_, render owns _hue_. Below, "colour" is shorthand for the render's mapping.

The ring's zone is a **PURE function of the ring-CENTRE offset** against a static anatomy
map of the captor at the anchor. Same determinism law as the wander (no time, no
`Math.random`). Anatomy bands are anchor-relative, on the ~2.0-tall static captor with the
hostage kneeling as a shield **front-RIGHT** (`HOSTAGE_DX 0.0…0.75`) — so his **exposed**
silhouette (head, left/upper torso, gun arm, a leg) is all **LEFT of the hostage** (dx < 0).
The ring roams over that exposed silhouette **plus surrounding empty air**.

`ringZoneAt(centre)` → `RingZone`, **precedence VITAL > LIMB > OFF**:

| `RingZone` (render colour) | Anatomy = lethality   | Band(s) (anchor-relative, classify the ring **centre**)                                                              |
| -------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **`"vital"`** (→ vert)     | LETHAL — face + torso | `VITAL`: dx **[−0.80, −0.45]**, dy **[+0.05, +0.90]** (face = top dy +0.50…+0.90; chest below).                      |
| **`"limb"`** (→ jaune)     | NON-lethal limb       | `ARM`: dx **[−1.20, −0.80]**, dy **[+0.25, +0.65]** · `LEG`: dx **[−0.80, −0.45]**, dy **[−0.45, +0.05]**.           |
| **`"off"`** (→ rouge)      | OFF — empty space     | Anywhere in the roam box that is **not** VITAL and **not** LIMB (far-left air, above the head, below the leg, gaps). |

This is the _worth_ of the ring. `qteZoneAt` (with `"head"` RETIRED — §10.D / architect
freeze) answers **where a NON-ring shot landed** (hostage / body / miss); `ringZoneAt`
answers **what the ring is worth** — the two are orthogonal (10.D). VITAL wins ties with LIMB
(a centre on the vital/leg seam dy = +0.05 is `"vital"`). Areas within the roam box (§10.B):
VITAL ≈ 0.30 u² (**~25 %**), LIMB ≈ 0.335 u² (**~28 %**), OFF ≈ 0.565 u² (**~47 %**) — red
largest ("don't shoot air"), green smallest ("the payoff"). F3 shrinks VITAL for later
districts; Belliard sits at the generous end.

### 10.B — D-S2 — The ring ROAMS WIDER over/around the captor ("plus d'ampleur")

The wander box (the region the ring **centre** travels) now spans the exposed silhouette
**plus** the surrounding air, so red/yellow/green all occur as it moves. It grows LEFT / UP /
DOWN from the §9 box; the **right edge stays pinned** (G6, §10.C). Ring reticle stays a
fixed size (difficulty from motion + reading anatomy, not from shrinking the reticle).

| Constant                    | §9.4 value         | **§10 (Belliard)**  | Note                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roam box **dx**             | −0.95 … −0.35      | **−1.20 … −0.45**   | Extended left to −1.20 (far-left air + gun arm); **right pinned −0.45** (G6-critical).                                                                                                                                                                                                                                                                                                       |
| Roam box **dy**             | +0.60 … +0.95      | **−0.50 … +1.10**   | Extended down (leg) and up (air above head); range 1.60 vs §9's 0.35.                                                                                                                                                                                                                                                                                                                        |
| `WANDER_AMP_X`              | 0.30               | **0.375**           | half-extent (centre −0.825).                                                                                                                                                                                                                                                                                                                                                                 |
| `WANDER_AMP_Y`              | 0.175              | **0.80**            | half-extent (centre +0.30).                                                                                                                                                                                                                                                                                                                                                                  |
| `RING_HIT_RADIUS` (reticle) | 0.25 (`HEAD_HALF`) | **0.30**            | circular catch tolerance of the roaming ring (architect-frozen name); +0.05 keeps a wider/faster ring fair on level 1.                                                                                                                                                                                                                                                                       |
| Peak `wanderSpeed`          | ~1.8 u/s           | **~1.8 u/s** (kept) | Bertrand asked WIDER, not faster; the box grew, speed held → the ring visibly ranges more.                                                                                                                                                                                                                                                                                                   |
| `LEG_DURATION`              | 0.28 s             | **0.38 s**          | with `MAX_LEG_DISPLACEMENT` (below) realises the ~1.8 u/s peak over the bigger box.                                                                                                                                                                                                                                                                                                          |
| `MIN_LEG_DISPLACEMENT`      | 0.15 u             | **0.15 u** (kept)   | anti-jitter floor unchanged.                                                                                                                                                                                                                                                                                                                                                                 |
| `MAX_LEG_DISPLACEMENT`      | — (none)           | **0.45 u** (NEW)    | Caps a single leg's length so a much wider box can NOT spawn a teleport-fast leg. Without it, a diagonal leg (~1.7 u) at LEG_DURATION would peak ≫ trackable. Peak ≈ 0.45 × 1.5 (smoothstep) / 0.38 ≈ **1.8 u/s**. Enforced as a re-hash/clamp on the hash-to-waypoint mapping (mirrors `MIN_LEG_DISPLACEMENT`), not a runtime velocity clamp — the closed-form purity of §8.2 is preserved. |

- **Area:** 0.75 × 1.60 = **1.20 u²** vs §9's 0.21 u² → **~5.7× wider**. "Plus d'ampleur."
- **Human-trackable:** still smoothstep waypoint eases (decelerate to zero at each waypoint =
  the fair "lead point" / firing window); never teleports. `MAX_LEG_DISPLACEMENT` bounds the
  peak. Verified in playtest (AC); tighten if it reads as a coin-flip.
- **On-frame flag (composite gate).** Ring visual extent now reaches left −1.50, top +1.40,
  bottom −0.80 (centre ± `RING_HIT_RADIUS` 0.30). This exceeds the §8.3 safe occupancy — **flag to
  the composite gate**: confirm the ring stays framed at the QTE zoom. **Fallback if it
  clips:** tighten `WANDER_AMP_Y` to 0.65 (dy top +0.95) and/or `WANDER_AMP_X` to 0.325 (dx
  left −1.15) — **the right-edge / G6 pin is never touched** (§10.C).

### 10.C — D-S3 — G6 SAFETY (load-bearing): the ring is NEVER over the hostage

The whole point of Bertrand's rule: **the player must never be lured into a bavure by
tracking the ring.** Bertrand framed G6 spatially — _"'red/off' space is only on the
**non-hostage side**"_ — and the hostage is **front-RIGHT** (dx 0.0…0.75). So G6 here is
**X-disjointness**: the ring — centre **plus reticle radius** — stays entirely **LEFT** of
the hostage, for **any dy**. This is what lets a **low** limb (the LEG, dy < the hostage top)
be a valid yellow zone without ever risking her.

**Asserted bound (in `createQte`, against constants — never trusted from data):**

```
ROAM_DX_MAX + RING_HIT_RADIUS + G6_MARGIN  ≤  HOSTAGE_DX_MIN
   −0.45    +     0.30        +   0.10     =  −0.05   ≤   0.0     ✓
```

- Ring's **rightmost extent** = `ROAM_DX_MAX + RING_HIT_RADIUS` = −0.45 + 0.30 = **−0.15**.
- Hostage's **left edge** = `HOSTAGE_DX_MIN` = **0.0**.
- ⇒ Gap = **0.15 u ≥ G6_MARGIN 0.10.** The ring disc is **disjoint from the hostage on the X
  axis alone** — and shapes disjoint on one axis are disjoint everywhere, **for every dy** (so
  the ring dipping to the leg at dy −0.45 is still clear of the hostage).
- No VITAL / LIMB / roam band ever has dx > −0.45; no ring extent ever has dx > −0.15. **The
  ring is never drawn over, and a vital/limb classification never sits over, the hostage.**

> **⚠ ARCHITECTURE RECONCILE — routed to `senior-architect` (this is his call, not mine).**
> His §18 freeze made `clampTargetOffsetG6` a **Y-FLOOR** (`minY = HOSTAGE_DY_MAX + G6_MARGIN
>
> - RING_HIT_RADIUS = 0.55`) — which keeps the ring **above** the hostage. That was correct
for the earlier **leg-less, high-head** wander, but it is **incompatible with a LOW LEG
zone**: a Y-floor of 0.55 would flatten the entire lower half of this roam (dy < 0.55),
making the leg unreachable. Bertrand's leg-inclusive brief + his "non-hostage side" framing
require the **X-disjoint clamp** — the **§17 asymmetric / hostage-facing-edge** variant the
architect himself noted "still applies" (pin `centre.x ≤ ROAM_DX_MAX`inside the seeded`rawWaypoint`edge-mapping, pure,`clampTargetOffsetG6`-wrapped, no type change). **I am
>   asking the architect to adopt the X-disjoint clamp IN PLACE OF the §18 Y-floor for this
>   spatial-colour build.** The clamp FORMULA is his LAW to set; I supply the values + the
>   intent (a low leg must be reachable) that select the X variant.
>
> **Fallback if he KEEPS the Y-floor:** drop the LEG entirely; `LIMB` = the **ARM only**,
> raised so the whole roam sits at **dy ≥ 0.55** (e.g. roam dy **+0.55…+1.15**, VITAL dy
> +0.65…+1.10, ARM dy +0.55…+0.75). This ships on his frozen Y-floor unchanged, at the cost
> of Bertrand's leg and of vertical "ampleur". I recommend the **X-disjoint** variant; this
> fallback is the safe degrade.

### 10.D — D-S4 — Shot resolution: hit the ring, take the ring's colour-damage

**Confirmed model:** _the shot must hit the ring reticle, and the damage is the ring's
zone-colour._ Two orthogonal tests at a `fire` during `PEEKING` (resolved against the
`targetOffset` the render drew **last frame** — the aim-honesty tie-break of §5/§8.2, `fire`
first, then advance the machine):

1. **Did the shot hit the RING?** A separate **circular** test (architect freeze — `"head"`
   is RETIRED from `qteZoneAt`): the shot is within **`RING_HIT_RADIUS`** (0.30) of the
   ring-centre `targetOffset` AND `stance === "PEEKING"`. Resolved in `tickQte`, not in
   `qteZoneAt`.
2. **If yes — how much?** `zone = ringZoneAt(qte.targetOffset)`; `captorHp −=
colourDamage(zone)` — **VITAL −2 (`CAPTOR_DAMAGE_VITAL`), LIMB −1 (`CAPTOR_DAMAGE_LIMB`), OFF
   0 (wasted shot).**
3. **If no ring hit** → fall through to `qteZoneAt(dx, dy)` → **body / hostage / miss** (the
   retired-`"head"` classifier), keeping today's band penalties.

| Shot outcome (during `PEEKING`)            | Captor HP                      | Energy                           |
| ------------------------------------------ | ------------------------------ | -------------------------------- |
| Hit ring, ring over **VITAL** (vert)       | **−2** (`CAPTOR_DAMAGE_VITAL`) | 0 (chip is the reward)           |
| Hit ring, ring over **LIMB** (jaune)       | **−1** (`CAPTOR_DAMAGE_LIMB`)  | 0                                |
| Hit ring, ring over **OFF** (rouge)        | **0** (`colourDamage("off")`)  | 0 — wasted; the peek still blows |
| Depleting hit (`captorHp` reaches ≤ 0)     | → **WON**                      | **+40** (`QTE_RESCUE_REFILL`)    |
| **No ring hit**, hits **body**             | 0                              | **−5** (`QTE_BODY_HIT`)          |
| **No ring hit**, hits **hostage** (bavure) | 0                              | **−30** (`QTE_HOSTAGE_HIT`)      |
| No ring hit, misses everything             | 0                              | 0                                |

- The colour is a property of the **RING** (its centre's anatomy), not of where inside the
  ring you land — the ring is drawn as **one** colour and you shoot that colour. WYSIWYG.
- A shot **not aligned with the ring** is not a ring hit → **no captor damage**; it keeps
  today's band penalties (body −5, hostage −30, miss 0). Firing when the ring is **red**
  (over air) is a genuine waste (0 dmg, 0 energy) and the peek still closes → ticks the loss
  clock (§10.E): the teaching pressure toward "wait until the ring is on him (yellow/green)."
- Deplete `captorHp` → **WON** (the depleting shot pays +40). Loss unchanged (§10.E).

### 10.E — D-S5 — Balance for Belliard (level 1 approachable)

Colour is now available **whenever the ring is over vital** (not only the last 25 % of a peek
as the dead §9.2 ramp had it), so the _timing_ is easier — the difficulty now lives in
**tracking the wider/faster-ranging ring and reading the anatomy under it.** Tuned so a
yellow-only grinder still makes quota with a spare opening.

| Field                    | Value                               | Rationale                                                                                                                     |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `captorHp`               | **3**                               | green 2 / yellow 1 ⇒ "2 greens, or 3 yellows"; yellow-only path wins by peek 3, one opening to spare. `QteSpec`, integer ≥ 1. |
| Damage vital/limb/off    | **2 / 1 / 0**                       | SYSTEM constants (`CAPTOR_DAMAGE_VITAL/LIMB`; off = 0). Off/red = wasted.                                                     |
| Roam box                 | **dx −1.20…−0.45 / dy −0.50…+1.10** | ~1.20 u², ~5.7× wider (§10.B). Right-of-hostage pin held (G6).                                                                |
| Peak `wanderSpeed`       | **~1.8 u/s**                        | kept from §9; box grew, not speed (§10.B).                                                                                    |
| VITAL / LIMB / OFF split | **~25 % / ~28 % / ~47 %**           | vital smallest (payoff), off largest ("don't shoot air") — the spatial analogue of the old temporal 40/35/25 (§10.A).         |
| `RING_HIT_RADIUS`        | **0.30**                            | circular catch tolerance for the wider ring (fairness knob).                                                                  |
| `peekDurationSeconds`    | **1.5 s**                           | roomy for tracking + reading colour; ≫ G5 floor 0.5 s. Unchanged from §9.6.                                                   |
| `maxBlownPeeks` (**N**)  | **4**                               | four openings; passive-ignore economy = 4 × −8 = **−32** (unchanged).                                                         |
| `peekCadenceSeconds`     | **1.5 s**                           | COVERED beat + G4 tell unchanged.                                                                                             |

**Loss (unchanged, §9.5).** A **blown peek** = a `PEEKING` exposure that CLOSES with
`captorHp > 0`. The **N-th** such close (N = 4) with the captor alive ⇒ captor **executes the
hostage → LOST**. A same-tick depleting ring hit ⇒ **WON** (`fire` resolves first). Blown
peeks are the **sole** fail route (no door, no second clock — §4 holds).

**Energy (unchanged, kept orthogonal to HP).** `+40` WON (depleting shot), `−30` hostage,
`−8` per closed peek while the captor is alive (his counter-fire), `−6` panic (zoom), `−5`
body. Green/yellow/red chips and misses cost 0 energy. Severity order holds; passive ignore
= −32 **and** LOST.

**On-screen read (E) — flag to `ux-designer` + `lead-art`.** (1) **Ring colour** is diegetic
on the reticle (render maps `qte.ringZone` → rouge/jaune/vert) — the same `targetOffset` the
render already positions the ring at; composite-gate the zone↔colour↔damage alignment.
(2) **Captor HP (3)** stays a minimal **diegetic** read — pips / escalating flinch, **NOT a
HUD bar** (U-1 holds). `ux` rules the form.

### 10.F — Updated acceptance criteria (REPLACE AC13/AC14; append the rest)

- **AC13′ — Zone is SPATIAL (supersedes AC13).** `ringZoneAt(ringCentre): RingZone` is a PURE
  function of the ring-**centre** offset: `"vital"` iff in VITAL, else `"limb"` iff in LIMB,
  else `"off"` — **precedence VITAL > LIMB > OFF**, no dependence on time/`t`. No
  `Math.random`/`Date.now` (lint/grep asserted). The rendered ring colour on any frame equals
  the zone the classifier applies to a `fire` on that frame (WYSIWYG — composite gate). Unit
  test: sample centres in each band → expected zone; a vital/leg-seam centre → `"vital"`.
- **AC14′ — Wider roam, G6 intact (supersedes AC14).** Belliard roam box dx **−1.20…−0.45** /
  dy **−0.50…+1.10** (~1.20 u², ~5.7× §9), peak **~1.8 u/s**, `RING_HIT_RADIUS` 0.30. For
  every tick of every peek, the ring's right extent (`centre.x + 0.30`) stays **≤ −0.15** ⇒
  **≥ 0.15 u** clear of the hostage left edge (0.0) on the X axis ⇒ **disjoint from the
  hostage for all dy — no bavure is ever required.** Unit test samples a full peek and asserts
  no ring extent reaches the hostage band. `createQte` asserts `ROAM_DX_MAX + RING_HIT_RADIUS +
G6_MARGIN ≤ HOSTAGE_DX_MIN`.
- **AC12′ — HP chips by the ring's zone (refines AC12).** A ring hit during PEEKING subtracts
  `colourDamage(ringZoneAt(targetOffset))` (vital 2 / limb 1 / off 0) from `captorHp`; WON only
  when `captorHp ≤ 0` (depleting shot pays +40). Belliard `captorHp = 3`. Unit tests: vital×2
  ⇒ WON; limb×3 ⇒ WON; off hits never reduce HP; a shot outside `RING_HIT_RADIUS` never
  reduces HP.
- **AC15 (inherited, restated).** Every `PEEKING` close with `captorHp > 0` increments
  `blownPeeks`; the N-th (N = 4) with the captor alive ⇒ LOST; a same-tick depleting ring hit
  ⇒ WON. Passive ignore ⇒ 4 blown peeks, −32 energy, LOST.
- **AC16 (inherited).** Energy ledger unchanged: +40 WON, −30 hostage, −8/closed peek, −6
  panic, −5 body; chips and misses cost 0 energy.
- **AC17′ — Approachable on Belliard (combined spatial test).** In playtest (`verify`), a
  human can deplete `captorHp = 3` within N = 4 openings against the wider ring + spatial
  colour: the yellow-or-better path (fire while the ring is on him) makes quota, and a 2-green
  path (fire only when the ring is over VITAL) wins by peek 2. The ring never teleports,
  decelerates into each waypoint, and stays on-frame at the zoom. `createQte` asserts
  `captorHp` integer ≥ 1 and the G6 X-bound (AC14′).

Sacha playtests the built §10 integration against **AC12′/AC13′/AC14′/AC17′** (plus inherited
AC1–AC11, AC15, AC16) and reports PASS/deviations to `lead-game-designer` before the
architect's integration review.

### 10.G — Contract delta (design intent for `senior-architect` + `dev-gameplay`)

Pure `src/game`; boundary law preserved. **Aligns to the architect's FROZEN spatial-colour
contract** (`docs/handoffs/story-hostage-qte-duel.md`): `RingZone`, `ringZoneAt`,
`colourDamage`, `RING_HIT_RADIUS`, and `"head"` retired from `QteZone`. This section supplies
only the **numbers** he is waiting on; the field NAMES below are his, not mine.

- **`ringZoneAt(centre: Vec2): RingZone` (`"vital"|"limb"|"off"`)** — the pure spatial
  classify against the anatomy bands (VITAL > LIMB > OFF). Replaces the dead temporal
  `ringColourAt(t, …)` of §9.2. `colourDamage(zone): number` → vital 2 / limb 1 / off 0.
- **New SYSTEM CONSTANTS (`qteSystem.ts`):** anatomy bands `VITAL_DX/DY_*`, `ARM_DX/DY_*`,
  `LEG_DX/DY_*`; **`RING_HIT_RADIUS = 0.30`**; `CAPTOR_DAMAGE_VITAL = 2`,
  `CAPTOR_DAMAGE_LIMB = 1` (off = 0); `MAX_LEG_DISPLACEMENT = 0.45`. Re-tuned wander constants:
  `WANDER_AMP_X 0.30→0.375`, `WANDER_AMP_Y 0.175→0.80`, `HEAD_NEUTRAL → (−0.825, +0.30)` (roam
  centre), `LEG_DURATION 0.28→0.38`. (`ROAM_DX_MAX = HEAD_NEUTRAL.x + WANDER_AMP_X = −0.45`;
  assert `ROAM_DX_MAX + RING_HIT_RADIUS + G6_MARGIN ≤ HOSTAGE_DX_MIN`.)
- **`qteZoneAt` — `"head"` RETIRED:** it now returns only `body | hostage | miss` from
  `(dx, dy)`. The ring hit is a SEPARATE circular test (`|impact − targetOffset| ≤
RING_HIT_RADIUS` during PEEKING), resolved in `tickQte`.
- **`clampTargetOffsetG6` — X-disjoint variant REQUESTED (architect's ruling, §10.C flag):**
  enforce the X ceiling `centre.x ≤ ROAM_DX_MAX` (his §17 asymmetric option) so G6 holds by
  X-disjointness — this REPLACES his §18 Y-floor, which would flatten the low leg. If he keeps
  the Y-floor, the §10.C fallback (drop the leg, raise the roam to dy ≥ 0.55) applies instead.
- **`tickQte` ACTIVE step (1):** on a ring hit, `zone = ringZoneAt(qte.targetOffset)`,
  `captorHp −= colourDamage(zone)`; `captorHp ≤ 0 → WON +40`, else stay ACTIVE. Non-ring shots
  fall to `qteZoneAt` → body / hostage / miss (unchanged). Step (2) loss test unchanged (§9.5).
- **`QteSpec` / `HostageQte`:** `captorHp` enters (§9.7); runtime adds **`ringZone: RingZone`**
  (the render reads it for the tint) recomputed each PEEKING tick from `targetOffset`;
  `targetSeed` from §8.5. No new authored field beyond `captorHp` — anatomy map, reticle,
  damages are system constants (F3 promotes VITAL amplitude / `RING_HIT_RADIUS` later, like
  `wanderSpeed`).

### 10.H — Open flags for the gate (append to §7 / §8.7 / §9.9)

11. **ADR touch (colour model change).** The colour source moves from temporal to spatial and
    the wander box widens (~5.7×). Fold into the same ADR-0034 revision already flagged
    (§9.9.7) — `tech-writer`/`producer` allocate; the decision content is the gate's. This
    spec is the input.
12. **On-frame (STRONG flag).** The ~5.7× box reaches ring extents left −1.50 / top +1.40 /
    bottom −0.80 — well beyond §8.3's proven safe occupancy. **Composite gate MUST confirm
    framing at the zoom before this ships**; fallback tighten `WANDER_AMP_Y→0.65` and/or
    `WANDER_AMP_X→0.325` (§10.B) — G6 X-pin never touched. I could not playtest the new box
    (unbuilt); this is the highest-risk value in the respec.
13. **Green size (25 %) — RULED, flag for confirm.** VITAL ≈ 25 % of the roam keeps green the
    scarce payoff while the yellow fallback (≈ 28 %, so ≥ 1 dmg is available ~53 % of the time)
    keeps level 1 approachable. If the gate wants green scarcer/richer, shrink/grow `VITAL_DX/DY`
    (right/bottom pins on the hostage side stay fixed). Flag a preference.
14. **Reads to `ux` + `lead-art`.** Ring-colour tint (rouge/jaune/vert on the reticle) and the
    captor-HP pips/stagger (NO HUD bar, U-1) — `ux` rules the HP form; composite gate confirms
    colour↔anatomy↔damage alignment over the moving ring.
15. **G6 CLAMP MECHANISM — architect's ruling needed (§10.C, HIGHEST-PRIORITY flag).** The
    frozen §18 clamp is a **Y-floor** (ring stays above the hostage); Bertrand's **leg** (a low
    zone) + his "non-hostage side" framing require the **X-disjoint** clamp (his §17 asymmetric
    variant). I am requesting the X variant IN PLACE OF the Y-floor for this build. If the
    architect keeps the Y-floor, the leg is dropped and the roam raises to dy ≥ 0.55 (§10.C
    fallback). **This must be resolved before dev-gameplay implements the wander/clamp.**

---

## 11. Addendum — ANATOMY RE-MAP from Bertrand's HITBOX DIAGRAM (front-facing captor, tiers REVERSED)

**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18 · **Status:** DRAFT — **needs
`lead-game-designer` (Karim) PASS** before `senior-architect` and any dev implements it.
**Supersedes:** §10.A (`D-S1`, the anatomy bands `VITAL/ARM/LEG`), §10.B (`D-S2`, the roam
box + `WANDER_CENTRE`/`WANDER_AMP_*`), and the §10.C clamp DISCUSSION (see below). **Inherits
verbatim** from §§1–10 (unchanged): static captor (§1), seeded **PURE closed-form** wander
determinism — no `Math.random`/`Date.now`/stored PRNG cursor (§8.2), the blown-peeks loss
clock (§3/§9.5), captor HP + the D4 reversal (§9.1), the spatial-colour SHOT-RESOLUTION model
(§10.D: hit the ring → take the ring's zone-colour), the energy ledger (§9.5), and the
**pips/stagger diegetic HP read — NO HUD bar (U-1)**. The damage AMOUNTS (vital 2 / limb 1 /
off 0) and `captorHp = 3` are **KEPT** (§11.C confirms them under the reversed tiers).

**Bertrand's HITBOX DIAGRAM (front-facing captor silhouette, PR #79).** Colour → damage tier
re-mapped onto the captor's front anatomy:

- **GREEN = head/face** (top-centre box) → **VITAL**, the biggest chip.
- **YELLOW = torso** (large centre box) **+ the two shoulders** (small boxes flanking the head
  at shoulder height) → **LIMB**, medium chip.
- **RED = both arms** (left extended gun-arm + right arm) **+ the legs** (bottom box) → **OFF**,
  zero chip.

**This REVERSES §10.A.** §10 had `torso = VITAL` (green, big) and `arm/leg = LIMB` (yellow).
Now **head = VITAL**, **torso + shoulders = LIMB**, and **arms + legs = OFF (0 damage)**. The
captor is re-read as a **front-facing figure standing over the kneeling hostage** (she is
front-RIGHT, `HOSTAGE_DX 0.0…0.75`, `HOSTAGE_DY −1.05…0.15`), not the earlier left-flank
peeking-over-a-shoulder read. His **head and shoulders sit ABOVE her**; his **gun-arm extends
LEFT** (clear of her); his **legs and right arm sit behind her** (unreachable — and RED/0
anyway, so their unreachability costs nothing).

**Clamp context (architect, in parallel).** §10.C's Y-floor-vs-X-disjoint question is resolved
by the architect reshaping `clampTargetOffsetG6` to **BOX-disjoint**, so the ring can reach the
captor's head/torso/shoulders **ABOVE** the hostage as well as his gun-arm to her **LEFT**. This
addendum is authored to that box-disjoint clamp (§11.C). I supply the values + the intent; the
clamp FORMULA stays the architect's LAW.

**Cahier des charges.** Unchanged from §10 — still the conscious, documented **extension** on
the already-extension QTE (no new loop verb; `Récupérer → Livrer → Éviter` untouched). This is
a re-mapping of an existing spatial-anatomy classifier to match Bertrand's diagram, not a new
mechanic.

### 11.A — D-A1 — New anatomy bands (`ringZoneAt(centre): RingZone`, precedence VITAL > LIMB > OFF)

Anchor-relative, classify the ring **CENTRE** (a point). Precedence **VITAL > LIMB > OFF**.
The captor spans the 2.0-world square `dx∈[−1.0,+1.0]`, `dy∈[−1.0,+1.0]` centred on the anchor.

**VITAL — head/face (→ green, biggest chip):**

| Const          | Value |
| -------------- | ----- |
| `VITAL_DX_MIN` | −0.20 |
| `VITAL_DX_MAX` | +0.20 |
| `VITAL_DY_MIN` | +0.58 |
| `VITAL_DY_MAX` | +1.00 |

A narrow top-centre column (0.40 wide × 0.42 tall, centre `(0, +0.79)`). Sits wholly above the
hostage and above the box-disjoint clamp line (§11.C) → fully reachable. It is the **narrow,
precise** target — the reward.

**LIMB — torso + two shoulders (→ yellow, medium chip):** union of THREE boxes.

| Box          | dx            | dy            |
| ------------ | ------------- | ------------- |
| `TORSO`      | −0.32 … +0.32 | −0.05 … +0.58 |
| `L_SHOULDER` | −0.58 … −0.20 | +0.46 … +0.80 |
| `R_SHOULDER` | +0.20 … +0.58 | +0.46 … +0.80 |

The two shoulders flank the head at shoulder height (dx |0.20…0.58|), giving a **broad
horizontal yellow band** just below/beside the green head — this width is what makes yellow the
**reliable chip** (a horizontally-sweeping ring crosses it often), even though its reachable
area (~0.20 u²) only slightly exceeds the head's (~0.17 u²). The `TORSO` box is the chest column
below; its lower two-thirds sit over/behind the hostage and are **auto-excluded by the clamp**
(never visited — §11.C), so in practice yellow is delivered by the **shoulder band + head-base
row**. That is intended: the reachable yellow is the shoulders.

**OFF — arms + legs + empty air (→ red, ZERO chip):** the classifier returns `"off"` for
**anything not VITAL and not LIMB**, so these need **no explicit band** in `ringZoneAt` — they
fall through. They are documented here for the render sprite-read and the roam design:

| Region      | dx               | dy               | Reachable?                                                                   |
| ----------- | ---------------- | ---------------- | ---------------------------------------------------------------------------- |
| `L_GUN_ARM` | −0.98 … −0.58    | +0.18 … +0.50    | YES (left of hostage) — a genuine RED-on-captor zone: "don't shoot the arm". |
| `R_ARM`     | +0.45 … +0.80    | −0.05 … +0.42    | No (behind hostage) — clamped out; RED/0 anyway.                             |
| `LEGS`      | −0.32 … +0.32    | −1.00 … −0.05    | No (behind hostage) — clamped out; RED/0 anyway.                             |
| air         | rest of roam box | rest of roam box | YES — "don't shoot air".                                                     |

**Classifier (design intent — the dev owns the code):**

```
ringZoneAt(centre):
  if centre ∈ VITAL(head)                          → "vital"
  if centre ∈ (TORSO ∪ L_SHOULDER ∪ R_SHOULDER)    → "limb"
  else                                             → "off"     // arms, legs, air
```

- **Seams (precedence VITAL > LIMB > OFF):** at `dy = +0.58` the head bottom (dx |≤0.20|) meets
  the torso top (dx |≤0.32|) and the shoulders — VITAL wins the head column; the flanks
  (dx 0.20…0.58) are LIMB. `L_GUN_ARM` right edge (−0.58) **abuts** `L_SHOULDER` left edge
  (−0.58) with no overlap → a clean red/yellow seam at the shoulder socket.
- **Area split within the ROAM box (§11.B), reachable-only (rough):** VITAL ≈ 22 %, LIMB ≈ 24 %,
  OFF ≈ 54 %. Red is the majority ("wait — don't shoot air/arm"); green and yellow are the ~20 %
  windows you track for, green narrow-precise, yellow wide-reliable. F3 may shrink VITAL for
  later districts; Belliard sits at the generous end.

### 11.B — D-A2 — Roam box: wander the reachable UPPER body (head + torso + shoulders + gun-arm)

Reshaped from §10.B's **low-left column** (centre `(−0.825, +0.30)`) to a **high/centre band**
that reaches the **head** (green — the payoff), sweeps the **shoulders/upper torso** (yellow),
and dips left over the **gun-arm** (red). The over-hostage lower-right is auto-excluded by the
box-disjoint clamp (§11.C).

| Constant               | §10.B value     | **§11 (Belliard)**  | Note                                                                        |
| ---------------------- | --------------- | ------------------- | --------------------------------------------------------------------------- |
| Roam box **dx**        | −1.20 … −0.45   | **−0.98 … +0.58**   | Centre-shifted right & widened to reach the head (dx 0) and both shoulders. |
| Roam box **dy**        | −0.50 … +1.10   | **+0.20 … +1.00**   | Raised to the upper body: head top +1.00 down to the gun-arm at +0.20.      |
| `WANDER_CENTRE`        | (−0.825, +0.30) | **(−0.20, +0.60)**  | New roam centre (also the COVERED rest point; `ringZone` forced off there). |
| `WANDER_AMP_X`         | 0.375           | **0.78**            | half-extent (box dx spans −0.98 … +0.58).                                   |
| `WANDER_AMP_Y`         | 0.80            | **0.40**            | half-extent (box dy spans +0.20 … +1.00).                                   |
| Peak `wanderSpeed`     | ~1.8 u/s        | **~1.8 u/s** (kept) | Human-trackable; bounded by `MAX_LEG_DISPLACEMENT`, not by box size.        |
| `LEG_DURATION`         | 0.38 s          | **0.38 s** (kept)   | Peak ≈ 0.45 × 1.5 (smoothstep) / 0.38 ≈ 1.78 u/s.                           |
| `MIN_LEG_DISPLACEMENT` | 0.15 u          | **0.15 u** (kept)   | anti-jitter floor unchanged.                                                |
| `MAX_LEG_DISPLACEMENT` | 0.45 u          | **0.45 u** (kept)   | speed cap — bounds peak regardless of the (now wider-x) box.                |

- **Reaches the head (the payoff):** ring centre `(0, +0.79)` ∈ VITAL and is clamp-reachable
  (`cy ≥ clamp line`) → a green window exists every peek the ring visits the top-centre.
- **Passes over torso/shoulders (yellow):** centres across `dx |0.20…0.58|, dy 0.55…0.80` →
  LIMB, reachable — the broad reliable band.
- **Dips over the gun-arm (red-on-captor):** centres `dx −0.98…−0.58, dy 0.20…0.50` → OFF,
  reachable via the clamp's left (X-disjoint) side — teaches "don't shoot the arm".
- **Speed unchanged (kept ~1.8 u/s):** Bertrand's steer was a re-MAP of anatomy, not a speed
  change; `LEG_DURATION` / `MAX_LEG_DISPLACEMENT` hold, so the ring stays trackable.
- **On-frame flag (composite gate):** ring VISUAL extent (centre ± `RING_HIT_RADIUS` 0.30)
  reaches dx `[−1.28, +0.88]`, dy `[−0.10, +1.30]`. Top +1.30 / left −1.28 exceed the ~2.0
  plane's `[−1.0, +1.0]`. **Composite gate MUST confirm framing at the QTE zoom.** Fallback if
  it clips: tighten `WANDER_AMP_Y → 0.35` (dy top +0.95) and/or `WANDER_AMP_X → 0.70` (dx left
  −0.90, right +0.50 — still reaches both shoulders) — the **right-edge / G6 pin is never
  touched** (§11.C). I could not playtest the new box (unbuilt); highest-risk value here.

### 11.C — D-A3 — G6 under the BOX-disjoint clamp: the ring is NEVER over the hostage

The architect's box-disjoint `clampTargetOffsetG6` keeps the ring's **box** (centre ±
`RING_HIT_RADIUS` 0.30) disjoint from the hostage **box** (`dx 0.0…0.75`, `dy −1.05…0.15`). A
centre is **reachable** iff the ring box clears the hostage box on **either** axis:

```
reachable(centre) ⟺  centre.x + RING_HIT_RADIUS + G6_MARGIN ≤ HOSTAGE_DX_MIN     (ring fully LEFT)
                 OR  centre.y − RING_HIT_RADIUS − G6_MARGIN ≥ HOSTAGE_DY_MAX     (ring fully ABOVE)
   i.e. (with RING_HIT_RADIUS 0.30, G6_MARGIN 0.10):  centre.x ≤ −0.40   OR   centre.y ≥ +0.55
```

- **Head + shoulder + head-base yellow are reachable ABOVE her:** every VITAL centre has
  `dy ≥ 0.58 ≥ 0.55`; the yellow shoulder band's used rows are `dy ≥ 0.55`. Ring fully above the
  hostage → **Y-disjoint**, no bavure.
- **Gun-arm is reachable LEFT of her:** `L_GUN_ARM` and the left shoulder edge have
  `dx ≤ −0.58 ≤ −0.40`. Ring fully left → **X-disjoint**, no bavure.
- **The over-hostage wedge is auto-excluded:** the lower-centre/right of the roam
  (`centre.x > −0.40` AND `centre.y < +0.55`) — which is the lower chest, the right arm and the
  legs, all sitting over/behind the hostage — is **clamped out**, so the ring CENTRE never lands
  there. The classifier therefore never classifies a centre that is physically over the hostage;
  the low chest being labelled `TORSO`(limb) is harmless because that region is never visited.
- **Belliard satisfies it:** roam right edge `+0.58` is reachable only where `cy ≥ 0.55`
  (Y-disjoint); roam left `−0.98` is reachable at any dy (X-disjoint). Both belt-and-suspenders.

**Assert in `createQte` (against constants, never trusted):** the roam box's over-hostage wedge
is fully clamp-covered — i.e. for every roam centre, `reachable(clamp(centre))` holds. Concretely
the two boundary asserts: `ROAM_DX_MAX (= WANDER_CENTRE.x + WANDER_AMP_X = +0.58)` is only
admitted above the hostage, and the clamp's left ceiling `−(RING_HIT_RADIUS + G6_MARGIN) = −0.40`
and Y-floor `HOSTAGE_DY_MAX + RING_HIT_RADIUS + G6_MARGIN = +0.55` match the constants. G6 is
asserted, never data-trusted (ADR-0035 discipline). Same treatment the peek floors get.

### 11.D — D-A4 — Damage / balance (amounts + `captorHp` KEPT; re-justified under the reversal)

The reversal changes **which anatomy earns which tier**, not the tier VALUES. Kept:

| Field                   | Value | Kind                                             |
| ----------------------- | ----- | ------------------------------------------------ |
| `CAPTOR_DAMAGE_VITAL`   | **2** | SYSTEM constant (head = the biggest chip).       |
| `CAPTOR_DAMAGE_LIMB`    | **1** | SYSTEM constant (torso/shoulders = medium chip). |
| `colourDamage("off")`   | **0** | arms/legs/air = wasted shot.                     |
| `captorHp`              | **3** | `QteSpec`, integer ≥ 1, F3-curvable.             |
| `maxBlownPeeks` (**N**) | **4** | `QteSpec` — unchanged; four openings.            |

**Why these still balance under the reversal (Belliard):**

- **Reliable path = yellow (shoulders).** Yellow is now the **broad** band (shoulders span
  dx |0.20…0.58|), so a horizontally-sweeping ring is over yellow often → the honest chip.
  Three yellow hits (1 dmg each) across N = 4 openings deplete `captorHp 3` with **one opening to
  spare**. This is the level-1 safety path — and it is the tier Bertrand named "un peu".
- **Reward path = green (head).** The head is now the **narrow** target (dx 0.40), harder to
  hold the ring on — so green (2 dmg) is the earned shortcut: **two greens** ⇒ win by peek 2, or
  **green + yellow** ⇒ win on the first opening you catch both. "Beaucoup", correctly the scarce
  precise reward.
- **Red is a true waste** (0 dmg, 0 energy): firing with the ring over the **gun-arm or air**
  spends your aligned shot for nothing, and the peek still closes → ticks the loss clock. The
  teaching pressure toward "wait until the ring is on his head or shoulders".
- **Net difficulty vs §10:** green got HARDER (head-only, was head+torso) but yellow got EASIER
  and more reliable (broad shoulder band, was awkward arm+leg). The reliable yellow-only route
  carries a level-1 player, green rewards precision — Belliard stays **approachable**. `captorHp`
  stays **3**; F3 raises it for tougher captors later.

**Loss (UNCHANGED, §9.5).** A blown peek = a `PEEKING` exposure that CLOSES with `captorHp > 0`;
the **N-th** such close (N = 4) with the captor alive ⇒ captor **executes the hostage → LOST**.
A same-tick depleting ring hit ⇒ **WON** (`fire` resolves first). Blown peeks are the **sole**
fail route. **Energy ledger UNCHANGED:** +40 WON, −30 hostage, −8 per closed peek (captor alive),
−6 panic (zoom), −5 body; chips and misses cost 0 energy; passive ignore = −32 **and** LOST.

### 11.E — D-A5 — K-5: the pinned `targetSeed` MUST be re-verified (flag to dev-gameplay)

The anatomy bands **and** the roam geometry (`WANDER_CENTRE`, `WANDER_AMP_X/Y`) both changed, so
the closed-form `wander(targetSeed, peekIndex, t)` now produces **different** offsets **and** the
new `ringZoneAt` classifies them differently. **The previously pinned `targetSeed` is therefore
INVALID until re-checked.**

**Requirement (K-5, inherited invariant, re-asserted under the new bands+roam).** For the pinned
Belliard `targetSeed`, **each** of the N = 4 peeks must present **≥ 1 on-captor (`vital ∪ limb`)
DECELERATING window** — i.e. at least one waypoint (a smoothstep leg boundary, where velocity → 0
= the fair firing "lead point") whose **clamped** centre classifies `vital` or `limb`. This
guarantees every opening has a fair, catchable chip on the captor (not a peek that only ever
shows red).

- **dev-gameplay re-checks** the current pin against the §11 constants and **re-pins** if any of
  the 4 peeks fails; ships a unit test that samples each peek's waypoint centres and asserts the
  ≥ 1 `vital ∪ limb` decel window per peek (AC below). I cannot compute the hash here; this is a
  dev re-pin task, flagged, **must pass before ship**.
- Likelihood is favourable — `WANDER_CENTRE (−0.20, +0.60)` itself classifies on/near the
  head/left-shoulder seam, so most waypoints land on-captor — but it is **asserted, never
  assumed**.

### 11.F — Updated acceptance criteria (REPLACE AC13′/AC14′; refine AC12′; add AC18)

- **AC13″ — Anatomy re-mapped (supersedes AC13′).** `ringZoneAt(centre): RingZone` classifies
  the ring CENTRE, precedence VITAL > LIMB > OFF, as a PURE function of position (no time,
  no `Math.random`/`Date.now`): `"vital"` iff in the **head** box `dx[−0.20,+0.20]
dy[+0.58,+1.00]`; else `"limb"` iff in **torso** `dx[−0.32,+0.32] dy[−0.05,+0.58]` ∪ **L/R
  shoulder** `dx[∓0.58,∓0.20] dy[+0.46,+0.80]`; else `"off"` (arms, legs, air). Unit test:
  head-box centre → vital; shoulder centre → limb; gun-arm centre `(−0.75,+0.35)` → off; a
  head/torso-seam centre `(0,+0.58)` → **vital** (precedence). The green/yellow/red tiers match
  Bertrand's diagram (head=green, torso+shoulders=yellow, arms+legs=red).
- **AC14″ — High/centre roam, G6 box-disjoint intact (supersedes AC14′).** Belliard roam box
  dx **−0.98…+0.58** / dy **+0.20…+1.00** (`WANDER_CENTRE (−0.20,+0.60)`, `AMP 0.78/0.40`), peak
  **~1.8 u/s**, `RING_HIT_RADIUS` 0.30. For every tick of every peek the **clamped** ring box is
  disjoint from the hostage box on ≥ 1 axis (`centre.x ≤ −0.40` OR `centre.y ≥ +0.55`) ⇒ **no
  bavure is ever required to reach the head or shoulders.** Unit test samples a full peek and
  asserts no clamped ring extent enters the hostage band. The roam visibly reaches the **head**
  (green) and sweeps the **shoulders** (yellow) and **gun-arm** (red) in playtest.
- **AC12″ — HP chips by the re-mapped zone (refines AC12′).** A ring hit during PEEKING subtracts
  `colourDamage(ringZoneAt(targetOffset))` — **head 2 / torso+shoulder 1 / arm+leg+air 0** — from
  `captorHp`; WON only when `captorHp ≤ 0` (depleting shot pays +40). Belliard `captorHp = 3`.
  Unit tests: 2× head ⇒ WON; 3× shoulder ⇒ WON; gun-arm/air hits never reduce HP; a shot outside
  `RING_HIT_RADIUS` never reduces HP.
- **AC18 — Every peek offers an on-captor decel window (K-5).** For the pinned Belliard
  `targetSeed`, each of the N = 4 peeks presents ≥ 1 waypoint whose clamped centre classifies
  `vital ∪ limb`. Unit test over the 4 peeks' waypoint centres; **dev re-pins the seed if it
  fails** under the §11 bands+roam.
- **AC15 / AC16 (inherited, unchanged).** Loss = N openings with the captor alive; energy ledger
  as §9.5. **AC17″ (inherited, restated):** a human depletes `captorHp = 3` within N = 4 openings
  — the yellow-only (shoulder) path makes quota, a 2-green (head) path wins by peek 2; the ring
  never teleports, decelerates into each waypoint, and stays on-frame at the zoom.

Sacha playtests the built §11 integration against **AC12″/AC13″/AC14″/AC17″/AC18** (plus
inherited AC1–AC11, AC15, AC16) and reports PASS/deviations to `lead-game-designer` before the
architect's integration review.

### 11.G — Contract delta (design intent for `senior-architect` + `dev-gameplay`)

Pure `src/game`; boundary law preserved. **Values-and-bands only** — the frozen spatial-colour
CONTRACT (`RingZone`, `ringZoneAt(centre)`, `colourDamage`, `RING_HIT_RADIUS`, `"head"` retired
from `QteZone`, the box-disjoint `clampTargetOffsetG6`) is untouched by this addendum. No new
authored `QteSpec` field (`captorHp`, `targetSeed`, `maxBlownPeeks` already exist).

- **`qteSystem.ts` anatomy constants RE-TUNED (values only):** `VITAL_DX_MIN/MAX −0.20/+0.20`,
  `VITAL_DY_MIN/MAX +0.58/+1.00`; **new** `TORSO_DX_MIN/MAX −0.32/+0.32`, `TORSO_DY_MIN/MAX
−0.05/+0.58`, `L_SHOULDER_*`/`R_SHOULDER_*` (`dx ∓0.58/∓0.20`, `dy +0.46/+0.80`). The old
  `ARM_*`/`LEG_*` VITAL/LIMB bands are REMOVED — arms and legs now fall through to `off`, so
  `ringZoneAt` tests VITAL then (TORSO ∪ L_SHOULDER ∪ R_SHOULDER), else off.
- **`qteSystem.ts` roam constants RE-TUNED (values only):** `WANDER_CENTRE (−0.825,+0.30) →
(−0.20,+0.60)`, `WANDER_AMP_X 0.375 → 0.78`, `WANDER_AMP_Y 0.80 → 0.40`. `LEG_DURATION 0.38`,
  `MIN/MAX_LEG_DISPLACEMENT 0.15/0.45`, `RING_HIT_RADIUS 0.30` **kept**.
- **Damage / HP:** `CAPTOR_DAMAGE_VITAL 2`, `CAPTOR_DAMAGE_LIMB 1`, `captorHp 3`, `N 4` **all
  KEPT** — the reversal moves anatomy between tiers, not the tier values (§11.D).
- **`createQte` assert:** the G6 box-disjoint boundary asserted against the constants (§11.C).
- **`ringZoneAt` docstring** re-describes the front-facing anatomy (head/torso+shoulders/arms+
  legs) so it matches Bertrand's diagram — the tick logic (`tickQte`) is **unchanged** (it reads
  `ringZoneAt` and `colourDamage` exactly as today).
- **K-5:** dev re-verifies / re-pins the Belliard `targetSeed` (§11.E, AC18).

**Render note (spec the READ, not the code — `dev-r3f-render` + `lead-art`):** the sprite must
read as a **front-facing captor over a kneeling hostage** — head top-centre, shoulders flanking,
gun-arm to HIS side (screen-left), legs/right-arm behind her. The player must identify **head vs
shoulders vs arm at a glance** so the ring's rouge/jaune/vert tint (render maps `qte.ringZone`)
matches what they see. Composite-gate the anatomy↔zone↔colour↔damage alignment over the moving
ring. HP read stays pips/stagger, NO HUD bar (U-1).

### 11.H — Open flags for the gate (append to §7 / §8.7 / §9.9 / §10.H)

16. **Anatomy read → `lead-art` (front-facing captor).** The re-map assumes a front-facing
    silhouette (head top-centre, shoulders flanking, gun-arm screen-left, hostage kneeling
    front-right). The sprite must make head/shoulder/arm **legible at the zoom** so green/yellow/
    red map to what the player sees. Hand the READ to `lead-art`; spec, not style.
17. **On-frame (STRONG flag, unplayable).** Roam ring extent reaches dx `[−1.28,+0.88]`, dy
    `[−0.10,+1.30]` — top/left exceed the ~2.0 plane. **Composite gate MUST confirm framing at
    the zoom before ship**; fallback tighten `WANDER_AMP_Y→0.35` / `WANDER_AMP_X→0.70` (G6 pin
    untouched). I could not playtest the new box (unbuilt) — highest-risk value in the re-map.
18. **K-5 re-pin (blocking).** The pinned `targetSeed` is INVALID under the new bands+roam;
    dev-gameplay MUST re-verify/re-pin so each of the 4 peeks shows ≥ 1 on-captor decel window
    (§11.E, AC18) **before ship**.
19. **Green scarcity (head-only) — RULED, flag for confirm.** Head-only VITAL (was head+torso)
    makes green scarcer/harder; the broad shoulder yellow is the reliable fallback that keeps
    Belliard approachable at `captorHp 3`. If the gate wants green easier, widen `VITAL_DX` (the
    head box) — the G6 pins are on the hostage side (dx > 0 above her), unaffected by widening
    the head symmetrically. Flag a preference.

---
