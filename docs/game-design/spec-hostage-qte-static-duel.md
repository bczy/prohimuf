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

**Author:** `game-designer` (Sacha) · **Date:** 2026-07-18 · **Status:** DRAFT — **needs
`lead-game-designer` (Karim) PASS**.
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
peekTargetOffset`, where `peekTargetOffset` is an anchor-relative wander vector.
   Difficulty comes from **motion, not shrink** (one variable at a time).
2. **`PEEKING` only.** `COVERED` has **no target**: no head zone, no ring (as today). The
   wander exists only while the exposure is open.
3. **Per-peek reset.** At each `COVERED → PEEKING` open the wander (re)initialises: a seeded
   start point **in-bounds** (§8.3), then it moves for that peek's duration. Peeks do not
   carry momentum across a `COVERED` beat — each opening is a fresh track.
4. The render's reticle ring **follows** `peekTargetOffset` (it no longer sits at the fixed
   `CUE_DX/CUE_DY`). Ring-visual vs kill-box alignment is reconciled at the **composite
   gate**, exactly as the fixed cue is today (ADR-0034 gotcha) — the ring FRAMES the box.

### 8.2 D-W2 — Movement feel: seeded, deterministic, erratic-but-trackable

**Hard invariant (non-negotiable).** `src/game` must stay **replay-deterministic**: **no
`Math.random`, no `Date.now`, no wall-clock**. The motion is a **seeded pseudo-random
wander** — a per-QTE authored seed feeds a pure PRNG (dev's choice: mulberry32/xorshift32,
pure function of state) advanced by the fixed-timestep tick. Same seed + same tick sequence
⇒ **byte-identical path** (ADR-0035 D2 discipline).

**Recommended model — SEEDED-WAYPOINT WANDER (not Lissajous).**

| Decision                 | Value / rule                                                                                                 | Rationale                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path generator           | PRNG draws a **waypoint** uniformly in the wander region; target eases toward it; on arrival, draw the next. | Bertrand asked for _"mouvements aléatoires"_. A **Lissajous/sine** loop is periodic → **learnable** → defeats the intent. Seeded waypoints read as genuinely erratic yet stay deterministic. |
| Motion between waypoints | **Ease-in / ease-out** (smoothstep) per leg — decelerate INTO each waypoint, accelerate OUT.                 | The target is **trackable, never teleporting**. The deceleration at each waypoint is the **fairness feature**: a natural "lead point" / firing window every leg.                             |
| Speed cap (Belliard)     | **`wanderSpeed` = 1.2 world u/s** (peak, mid-leg).                                                           | The 0.5-wide zone crosses its own width in ~0.42 s; over a peek the target stays within the small region and bounces — followable by a human, not a coin-flip.                               |
| Min leg length           | **0.15 u**                                                                                                   | Below this the target jitters in place (reads as a glitch, untrackable). Forces visible, coherent legs.                                                                                      |
| Drift vs waypoints       | **Waypoints**, not continuous noise-drift.                                                                   | Discrete legs with eases give clear "it's heading there" reads; value-noise drift is an acceptable alt but muddier to lead.                                                                  |

The wander state (`peekTargetOffset`, current waypoint, PRNG state) lives in the
`HostageQte` runtime and is advanced in `tickQte`. **WYSIWYG classify order:** the head band
is classified against the wander position **at the tick's start** (the frame the player
aimed at), `fire` resolved FIRST (§5 tie-break unchanged), **then** the wander advances — so
a hit registers against the reticle the player actually saw.

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
| `wanderSpeed`         | —          | **1.2 u/s**           | Peak mid-leg; followable (§8.2).                                                                                                                                           |
| `maxBlownPeeks` (N)   | 4          | **4** (unchanged)     | Keeps the four-honest-chances tempo; energy economy (−32 full ignore) undisturbed.                                                                                         |
| `peekCadenceSeconds`  | 1.5 s      | **1.5 s** (unchanged) | COVERED beat + G4 tell unchanged.                                                                                                                                          |

**Tempo check.** Cycle 1.5 + 1.4 = **2.9 s**; passive loss (N = 4) ≈ **11.6 s** of ACTIVE
(4×1.4 peeks + 4×1.5 covered) — within cadence tolerance of the §3 ≈ 10.8 s duel, a touch
longer, appropriate for the added skill demand. Energy ledger unchanged.

**F3 / ADR-0035 curve note.** `wanderSpeed`, the wander-region extents, N, and the cadence
are the per-level difficulty knobs. Later districts **raise `wanderSpeed`** (guidance: cap
~2.0 u/s so it stays human-trackable), **widen the region** (always re-clamped so the
head-box right edge stays `< 0` and the dy margin `≥ 0.15` — **G6 is invariant, never
curved away**), and/or lower N / tighten cadence toward the floors. Belliard sits at the
gentle end of every knob.

### 8.5 Contract delta (design intent for `senior-architect` + `dev-gameplay`)

Pure `src/game`; boundary law preserved. Additive — nothing from §5 leaves.

**Enters the contract:**

- `QteSpec`: `wanderSeed: number` (integer, per-level, drives the PRNG — determinism);
  `wanderSpeed: number` (u/s, per-level, F3-curvable). Region extents as module constants
  (`WANDER_DX_MIN/MAX`, `WANDER_DY_MIN/MAX`) mirroring the band constants.
- `HostageQte` runtime: `peekTargetOffset: Vec2` (anchor-relative, the live head-zone
  centre) + the wander bookkeeping the tick needs (current waypoint, PRNG state). Reset on
  each peek open; meaningful only while `stance === "PEEKING"`.
- `qteZoneAt`: the `"head"` test becomes a fixed-size box (half-extents 0.25) centred on
  `peekTargetOffset` instead of the fixed HEAD\_\* band. Precedence unchanged (hostage wins;
  head only while PEEKING). All other bands byte-for-byte unchanged.
- `createQte`: assert `wanderSeed` finite integer; `wanderSpeed` finite `> 0`; the region↔G6
  disjointness asserted against constants (§8.3).

**Render note (spec the read, not the code — `dev-r3f-render` owns it):** the reticle ring
reads `peekTargetOffset` from the runtime each frame and positions itself at `anchor +
peekTargetOffset` (replacing the fixed `CUE_DX/CUE_DY`). Ring size/opacity two-beat tell
(§ HostageQteSprite) unchanged; only its centre now tracks.

### 8.6 Updated acceptance criteria (append to §6)

- **AC8 — Moves only during PEEKING.** `peekTargetOffset` changes across ticks **only while
  `stance === "PEEKING"`**; during `COVERED` there is no target and no ring. Verified in the
  built QTE (`verify`): the ring visibly wanders while open, absent while covered.
- **AC9 — In-bounds / G6-clear always.** For every tick of every peek, the head-box (centre
  ± 0.25) stays inside the wander region and **disjoint from the hostage band on both axes**
  (dx margin ≥ 0.10, dy margin ≥ 0.20). Unit test samples the wander across a full peek and
  asserts no head-box position enters or abuts the hostage band. No bavure is ever required
  to reach the head.
- **AC10 — Deterministic.** Same `wanderSeed` + same tick sequence ⇒ identical
  `peekTargetOffset` path (unit test on two runs). No `Math.random`/`Date.now` in the wander
  (lint/grep asserted). `wanderSeed`-absent / `qteSpec === null` levels unaffected (AC7).
- **AC11 — Trackable & fair on Belliard.** In playtest (`verify`), a human can acquire and
  headshot the moving target within a Belliard peek: `wanderSpeed = 1.2 u/s`,
  `peekDurationSeconds = 1.4 s`, zone 0.5 × 0.5, region 0.35 × 0.25 — the target never
  teleports, decelerates into each waypoint (a firing window), and stays on-frame at the
  zoom. N = 4 keeps the duel winnable on level 1.

Sacha playtests the built wander against **AC8–AC11** (plus the inherited AC1–AC7) and
reports PASS/deviations to `lead-game-designer` before the architect's integration review.

### 8.7 Open flags for the gate (append to §7)

4. **ADR touch.** The wander adds `wanderSeed`/`wanderSpeed` to the QteSpec contract and a
   PRNG to the pure tick — worth a line in the same ADR-0034 superseder (§7.1): "head
   kill-zone wanders on a per-QTE seed; G6 invariant across the wander region."
5. **Model choice.** Seeded-waypoint recommended over Lissajous (§8.2). If the gate prefers
   smoother value-noise drift, only the generator swaps — bounds (§8.3), determinism, and the
   Belliard tuning (§8.4) are model-agnostic.
6. **Ring-follows-target read.** Handed to `lead-art` / composite gate: confirm the moving
   ring still reads as "shoot HERE" and its alignment to the kill-box holds across the wander
   (the fixed-cue reconciliation, now over a moving centre).
   </content>
   </invoke>
