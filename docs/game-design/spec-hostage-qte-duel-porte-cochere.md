# Spec — Hostage QTE "Le duel de la porte cochère": F1+F2 tuning defaults

**Feature:** the reworked hostage-taker cinematic QTE (ADR-0034, features F1 "le tableau
vivant" + F2 "la règle du tir").
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-17
**Status:** DRAFT — **needs `lead-game-designer` (Karim) PASS** before it goes to
`senior-architect` and any dev implements it.
**Design source (DECIDED, not re-opened here):** `docs/adr/0034-hostage-qte-duel-porte-cochere.md`
(D1–D6, guardrails G4/G5/G6). This spec sets **concrete DEFAULT magnitudes only**; it does
not redesign the mechanic.
**Reference:** `_bmad-output/guidelines/enemy-bestiary.md` §3 (hostage reference, now
superseded on mechanics by ADR-0034 but authoritative on intent: rescue = side objective,
hostage hit = "lose a lot").
**Out of scope (explicit):** the per-level difficulty **curve** across levels is
**ADR-0035 (F3)** — this spec authors the **Belliard default + the invariant floors** only.
**Cahier des charges verdict:** conscious, documented **extension** (ADR-0034 P4). Prohibition
(Atari ST) had no cinematic hostage duel; this is justified in ADR-0030/0034 and stays a
side objective that never advances the kill quota (D4). Core loop untouched.

This is a design spec, not code. Every value below is a **game-designer default (tunable)**,
transcribed into `src/game/**` by `dev-gameplay` (pure, TDD). Nothing here holds render/art
decisions — the render lane reads the state ADR-0034 D6 defines and draws the moving tableau.

---

## 0. World frame the numbers live in (read once)

Values are traced against the shipping world so a reviewer can sanity-check them:

- Street plane: `WORLD_HEIGHT = 12`, facade aspect `1280/768 ≈ 1.667`, `PANELS = 4` ⇒ full
  street width `fullW ≈ 80` world units, `x ∈ [−40, 40]`, `streetY = −0.4 × 12 = −4.8`.
- Retreat reuses the **`Courier` model** `{x, y, dir, speed}` (`courierSystem.ts`), advanced
  `x += dir × speed × delta`. Reference `COURIER_SPEED = 7` u/s.
- Energy: continuous stat `[0, 100]`, `ENERGY_INITIAL = 100`, clamp only, no death at 0
  (`energySystem.ts`). The QTE is the **sole** mover of energy in V1.
- Captor tableau figure ≈ 1.9 u tall on a 2.0 plane centred on the anchor (`qteZoneAt` bands).

---

## 1. Retreat — the door is the sole clock (ADR-0034 D1)

The captor drags the hostage backward toward a porte cochère; **reaching the door = failure**.
The retreat is the diegetic timer that replaces the deleted `windowSeconds` bar.

| Field                     | Default             | Rationale                                                                                                                                                         |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Captor start (`anchor`)   | `{ x: 0, y: −5 }`   | Kept from the current Belliard spec — centre street, tableau feet on the ground line ≈ −6, beside the road. The zoom establishes on this point.                   |
| Retreat direction (`dir`) | `+1` (screen-right) | Reuses the `Courier` `dir: 1 \| −1`. Door is toward +x. Arbitrary/**mirror-able per art** — render/`lead-art` picks the doorway side; gameplay only needs a sign. |
| Retreat speed             | **0.6 u/s**         | ≈ 1/12 of `COURIER_SPEED`. A slow, ominous drag of a struggling hostage — clearly moving inside the zoomed frame, never a sprint. One variable to ramp in F3.     |
| Distance-to-door          | **7.2 u**           | Door world point = `{ x: +7.2, y: −5 }` (start.x + dir × distance).                                                                                               |
| **Time-to-door budget**   | **12.0 s**          | `7.2 / 0.6`. This is the **answerable** duel budget (see §1.1). Yields ≈ 4 clean peeks (§2) — waiting patiently for a clean opening stays viable (**D5**).        |

**1.1 — When the clock starts (spec decision, flag for gate).** The retreat begins at the
**`ACTIVE` onset (after the 2 s zoom)**, not during `ZOOMING`. Rationale: the door is the
_duel_ clock; the 2 s zoom is the establishing hold where firing is a panic penalty (D4), so
counting it against the door would silently shorten the answerable budget and fight "waiting
is viable" (D5). The captor is shown seizing/holding during the zoom, and starts dragging
when the duel opens.
→ **If the gate prefers the strict D1 reading** ("retreats for the whole QTE", zoom included),
keep the 12.0 s answerable budget by setting **distance-to-door = 8.4 u** (`7.2 + 0.6 × 2.0`)
so the 2 s of zoom-time retreat is added on top rather than stolen from the duel. Either way,
the answerable budget stays 12.0 s — that is the invariant, the distance is the free variable.

---

## 2. Peek cadence — `COVERED ↔ PEEKING` (ADR-0034 D2/D3) + guardrail floors

The captor alternates `COVERED` (not shootable, dragging) and `PEEKING` (head exposed, and
**he fires at the player** — the opening window IS the danger window, D3). Every peek is
preceded by a readable **tell** (G4). The sequence **starts `COVERED`** so the player gets a
beat to settle after the zoom before the first opening.

### 2.1 Belliard defaults (level 1 — approachable, generous)

| Field                   | Default    | Rationale                                                                                                                     |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `COVERED` duration      | **1.5 s**  | The lull between openings. Long enough to reset aim and read the next tell; short enough that ≈ 4 cycles fit the 12 s budget. |
| `PEEKING` exposure      | **1.2 s**  | Well above the 0.5 s floor — a comfortable clean-shot window on level 1. This is the value F3 ramps _down_ toward the floor.  |
| Tell lead time (`tell`) | **0.35 s** | The pre-peek cue fires in the last 0.35 s of `COVERED`. Readable "tell → exposure" danger window = 0.35 + 1.2 = **1.55 s**.   |
| Cycle length            | 2.7 s      | `COVERED + PEEKING`. Over a 12 s budget ⇒ **≈ 4 clean peeks**. First opening lands at `ACTIVE + 1.5 s`.                       |

### 2.2 Invariant floors — **assert in code against level data (ADR-0034 gotchas)**

These are **safety invariants baked into the system**, not authoring conventions. The code
must assert them against any authored `QteSpec` (incl. F3's curve), not trust the data:

| Invariant                | Floor        | Guardrail | Rationale                                                                                              |
| ------------------------ | ------------ | --------- | ------------------------------------------------------------------------------------------------------ |
| `PEEKING` exposure       | **≥ 0.5 s**  | **G5**    | A peek must stay answerable within human reaction time **even at max difficulty**. Hard floor.         |
| Tell lead time           | **≥ 0.25 s** | **G4**    | Every peek must be telegraphed by a perceptible, non-zero lead. No un-telegraphed exposure ever ships. |
| Distance-to-door / speed | `> 0`        | D1        | Door strictly ahead of the start, non-zero retreat — the clock must always run toward failure.         |

**G6 (spatial fairness, note for the D6 rework + art gate):** the `PEEKING` head zone must
stay **spatially disjoint** from the hostage silhouette so a clean head hit is never
ambiguous with a bavure — assert the zone bands directly (do not rely on draw order), tuned
against the new peeking-with-gun sprite. Exact bands are a D6/art-gate deliverable; this spec
only pins that the separation is an asserted property, not a visual accident.

---

## 3. Energy economy — outcome currency only, no passive drain (ADR-0034 D5)

Energy moves **only on outcomes**, never on the passage of time (the door already prices
waiting; a second time-based drain would re-introduce the deleted second clock). Magnitudes
are on the `[0, 100]` scale, and are **game-wide module constants** (a rescue is a rescue on
every level) — **not** part of the per-level curve. Severity is strictly monotonic:
`body −5 < panic −6 < unanswered peek −8 ≪ hostage −30`, and rescue `+40` dominates.

| Outcome                                  | `energyDelta` | Frequency / charge rule                              | Rationale                                                                                                                                                                                   |
| ---------------------------------------- | ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clean rescue** (head during `PEEKING`) | **+40**       | Once, terminal (`WON`).                              | The QTE is the level's fuel station (D4). Big refill; clamps at 100 on a full bar, so it mainly _recovers_ the duel's drain and pays out on later levels where energy is worn (F3 economy). |
| **Hostage hit** (bavure)                 | **−30**       | Per stray hit on the hostage.                        | The heaviest single event — you shot the girl. Above every self-inflicted cost. Preserves bestiary §3.2 "lose a lot" (−25→−30 to sit clearly worst).                                        |
| **Unanswered peek** (his shot lands)     | **−8**        | **Once per CLOSED exposure** (never per tick).       | D3 counter-fire: an ignored opening is also an incoming shot. Ignoring the whole duel (≈ 4 peeks) ⇒ ≈ −32 — a real loss, just over one bavure, without killing anyone.                      |
| **Panic shot** (fired during 2 s zoom)   | **−6**        | Per shot fired while `ZOOMING`.                      | Teaches "don't shoot what you can't read" (D4). Stings more than a stray body shot because it's firing at an unreadable frame.                                                              |
| **Captor-body hit** (any time)           | **−5**        | Per body-zone hit (repeatable — spraying compounds). | Reckless spray bleeds you; the smallest deliberate cost. Closes the safe-DPS loophole (D4): chipping the body never wins, it only costs.                                                    |

**No door-reached lump penalty.** Reaching the door is _not_ a separate charge — the loss is
already paid peek-by-peek (unanswered-peek drains) plus the forfeited +40 refill. This keeps
"energy moves only on outcomes" literally true and avoids a hidden second timer.

**Stake check (P1).** Full clean rescue vs full ignore-to-door ≈ `+40 − (−32) = 72` of swing
on the 100 scale — the outcome now matters to the run. A single bavure (−30) is the sharpest
atomic mistake. The old design's "ignoring it was near-optimal" is closed.

**Score.** Score is **not** the stake (D5). Keep the small side-objective score bonus for the
clean rescue only (default **+8**, unchanged from the shipped `QTE_SUCCESS.scoreDelta`); no
score penalties are load-bearing here — energy carries all sanction nuance.

---

## 4. Per-level rollout — Belliard-first (ADR-0004 precedent, ADR-0034)

Which levels carry a `qteSpec` at all (the F1+F2 default footprint):

| Level          | Carries `qteSpec`?                  | Value                                                                                   |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `tutorial`     | **No**                              | Inert onboarding stage; never runs gameplay.                                            |
| **`belliard`** | **Yes — the default authored here** | `trigger = 12 s`, `zoom = 2 s`, anchor `{0,−5}`, retreat §1, cadence §2.1, floors §2.2. |
| `stalingrad`   | **No** (deferred)                   | No `qteSpec` ⇒ no QTE this level. Rolled in by **ADR-0035 (F3)** with its curve values. |
| `vitry`        | **No** (deferred)                   | Same — deferred to ADR-0035. Not this spec's scope.                                     |

A `qteSpec`-absent level stays byte-for-byte deterministic (ADR-0034 boundary discipline).
Belliard is the sole opt-in for F1+F2; the other levels wait for the curve.

**Belliard-kept fields** (from the shipped spec, unchanged): `triggerAtElapsedSeconds = 12`,
`zoomSeconds = 2` (= `QTE_ZOOM_SECONDS`), the "OTAGE" warning, the brief WON/LOST result hold
(`QTE_RESULT_HOLD = 2.2`).
**Belliard-removed fields** (per D6): `captorHp`, `hostageHp`, `windowSeconds` — replaced by
the retreat (§1) + peek cadence (§2). The captor has no health bar; the duel is binary.

---

## 5. Consolidated value table (the deliverable)

**Per-level `QteSpec` (Belliard default — F3 curves these; floors in §2.2 clamp them):**

| Key                       | Belliard default                    | Kind                |
| ------------------------- | ----------------------------------- | ------------------- |
| `triggerAtElapsedSeconds` | 12 s                                | kept                |
| `zoomSeconds`             | 2.0 s                               | kept                |
| `anchor` (captor start)   | `{ x: 0, y: −5 }`                   | kept                |
| retreat `dir`             | `+1` (mirror-able)                  | new (Courier model) |
| retreat `speed`           | 0.6 u/s                             | new                 |
| distance-to-door          | 7.2 u (8.4 if zoom-inclusive, §1.1) | new                 |
| ⇒ answerable budget       | **12.0 s**                          | derived (invariant) |
| `COVERED` duration        | 1.5 s                               | new                 |
| `PEEKING` exposure        | 1.2 s                               | new                 |
| tell lead time            | 0.35 s                              | new                 |

**Game-wide constants (`qteSystem.ts` — not per level):**

| Constant                   | Default    | Notes                                 |
| -------------------------- | ---------- | ------------------------------------- |
| `QTE_RESCUE_REFILL`        | **+40**    | clean rescue (energy)                 |
| `QTE_HOSTAGE_HIT` (energy) | **−30**    | bavure                                |
| `QTE_UNANSWERED_PEEK`      | **−8**     | per closed exposure                   |
| `QTE_PANIC_SHOT`           | **−6**     | fired during zoom                     |
| `QTE_BODY_HIT`             | **−5**     | per body-zone hit                     |
| rescue score bonus         | **+8**     | side objective only, non-load-bearing |
| `QTE_ZOOM_SECONDS`         | 2.0 s      | kept                                  |
| `QTE_RESULT_HOLD`          | 2.2 s      | kept                                  |
| **`PEEK_EXPOSURE_FLOOR`**  | **0.5 s**  | **assert** (G5), max-difficulty floor |
| **`TELL_FLOOR`**           | **0.25 s** | **assert** (G4)                       |

---

## 6. Acceptance criteria (design VERIFY, stage 5)

A build implementing this spec is checked against:

- **AC1 — Budget.** With no player fire, the captor reaches the door in **12.0 s ± 0.2 s** of
  `ACTIVE` time (or of ACTIVE+zoom if §1.1 zoom-inclusive is chosen). Door-reached ⇒ `LOST`,
  no separate energy charge beyond the peek drains already taken.
- **AC2 — Peek count.** A passive run surfaces **≥ 4 fully-closed `PEEKING` exposures** before
  the door — waiting for a clean opening is demonstrably viable (D5).
- **AC3 — G5 floor.** Belliard exposure reads ≥ 1.0 s in playtest; the code **asserts** any
  authored exposure ≥ 0.5 s (unit test on level data).
- **AC4 — G4 tell.** Every `PEEKING` is preceded by a perceptible tell ≥ 0.25 s (asserted).
- **AC5 — Energy ledger.** Clean rescue = +40 (clamped); hostage hit = −30; each unanswered
  peek = −8 charged **once** per closed exposure (a long peek is not over-billed); panic shot
  during zoom = −6; each body hit = −5. Severity order holds.
- **AC6 — Binary duel.** No health bar; the sole win route is a head hit during `PEEKING`.
  Body/hostage/miss never win; spraying the body only bleeds energy (D4 loophole closed).
- **AC7 — Rollout.** `belliard` runs the QTE; `stalingrad`/`vitry`/`tutorial` run none and
  stay deterministic.

Sacha playtests the built feature (`verify` skill) against AC1–AC7 and reports PASS/deviations
to `lead-game-designer` before the architect's integration review.

---

## 7. Open flags for the gate

1. **§1.1 clock start** — retreat begins at `ACTIVE` (default) vs strict D1 "whole QTE"
   (zoom-inclusive, distance 8.4). Karim/Winston to confirm the reading; either preserves the
   12.0 s answerable budget.
2. **Rescue +40 vs the 100-cap on level 1.** On Belliard you enter at 100, so +40 clamps and
   reads as "recover the duel's drain" rather than a windfall. Sized deliberately for the
   cross-level energy economy (F3/ADR-0035); flag if the gate wants a Belliard-visible payout
   instead (would require persisting energy below 100 pre-QTE — out of this spec's scope).
3. **Retreat `dir` / door side** — handed to `lead-art` (which porte-cochère, which side);
   gameplay only needs the sign. Narrative implication (who she is, why the door) already
   owned by `narrative-designer` per ADR-0030 — no new fiction requested here.
