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
   </content>
   </invoke>
