# Story — Hostage QTE rework: "Le duel de la porte cochère" (F1 + F2)

- **Owner (PM):** John · **Design gate:** `lead-game-designer` (Karim)
- **Source of truth:** [ADR-0034](../adr/0034-hostage-qte-duel-porte-cochere.md) — **ACCEPTED, do not
  redesign.** This story only scopes the build.
- **Scope:** ADR-0034 features **F1 (le tableau vivant)** + **F2 (la règle du tir)** only.
- **Out of scope (explicit):** F3 per-level difficulty curve ([ADR-0035](../adr/0035-hostage-qte-difficulty-curve.md))
  and F4 accomplice/second shooter ([ADR-0036](../adr/0036-hostage-qte-accomplice.md)). This story
  ships ONE Belliard-first tuned spec; the per-level curve is F3's job.
- **Lanes:** `dev-gameplay` (pure `src/game`, TDD) is primary. `senior-architect` owns lane
  assignment — this touches the `src/game` ↔ `src/render` ↔ `useGameLoop` seam (moving-anchor camera),
  so it is a cross-cutting change and must pass through architecture before dev fan-out. Render + art +
  camera work are their own lanes, gated separately; this story specifies the **pure-logic contract and
  its invariants** that all lanes build against.

---

## Why (the product bet)

The ADR-0030 QTE is a static tableau: freeze, zoom, then a generous 5 s window on a motionless captor
with a 4-HP health bar and per-part damage. Aim once, win — and because the rescue is a small side
bonus, **ignoring it was near-optimal**. No stakes, no sang-froid. ADR-0034 turns it into a duel of
patience: the captor **retreats toward a porte cochère dragging the hostage**, alternating COVERED ↔
PEEKING behind a human shield. The peek is simultaneously his only vulnerability AND his only
counter-fire moment. Reaching the door = the hostage is gone. That is the whole change we are cashing.

## What the player experiences (F1 + F2)

1. Scripted trigger fires once. Scene freezes, 2 s zoom onto the captor, "OTAGE" banner. (UNCHANGED
   from ADR-0030.)
2. Zoom ends. The captor **drags the hostage backward toward the porte cochère** — the shrinking
   distance to the door IS the timer. No countdown bar.
3. He cycles: **COVERED** (dragging, no kill zone) → a brief **telegraph tell** → **PEEKING** (head
   exposed beside the hostage, and he fires at the player) → back to COVERED.
4. The player's only win is a **head shot landed during PEEKING**. Everything else costs energy.
5. Outcome resolves in `energy`: clean rescue = big refill; captor-body hit = small drain; hostage hit
   = heavy penalty; a shot fired during the zoom = panic penalty; a peek the player fails to answer =
   the captor's counter-shot drains energy (charged once per closed exposure).
6. If the captor reaches the door first → **LOST** (hostage gone). Brief WON/LOST hold, then resume.

---

## Contract changes (pure `src/game` — `qteSystem.ts`, `types/hostageQte.ts`)

### Removed (leave the contract entirely)

- `captorHp`, `captorHpMax`, `CAPTOR_HP_MAX`, `PART_DAMAGE`, `QteBodyPart`.
- `hostageHp`, `hostageHpMax`, `HOSTAGE_HP_MAX` (health-bar model → the duel is binary).
- `windowSeconds` / `windowRemaining` / `QTE_WINDOW_SECONDS` and the **timeout-loss branch** in `tickQte`.
- The `QteSpec` fields `captorHp`, `hostageHp`, `windowSeconds` (and the Belliard-level values feeding them).

### Added

- **Captor sub-state** on `HostageQte`: `COVERED | PEEKING` (with a telegraph flag/timer feeding the
  COVERED→PEEKING transition — the readable pre-peek tell, G4).
- **Moving anchor:** the captor's live `{x, y}`, advanced each tick during the frozen QTE by a retreat
  velocity toward the door. Replaces the static `anchor` as the render/camera follow point.
- **`QteSpec.doorPoint: Vec2`** — the porte cochère world point. **`QteSpec.retreatSpeed`** — drag speed
  (world units/sec). **Peek cadence fields** the sub-state machine reads (covered interval, telegraph
  lead, peek duration) — F1 ships ONE Belliard default set; F3 authors the per-level curve.
- **Spatial fail condition:** captor anchor reaching `doorPoint` → LOST.
- **Captor counter-fire resolution** during PEEKING (D3).
- **Sub-state-aware zone classifier:** `head` (only classifiable during PEEKING) / `captor-body` /
  `hostage` / `miss`, with clean spatial separation between the peeking head and the hostage silhouette (G6).
- Energy outcome constants: clean-rescue refill, captor-body drain, hostage penalty, panic-shot penalty,
  unanswered-peek drain.

### Kept (do NOT touch)

- Scripted once-per-level trigger `shouldTriggerQte` / `triggerAtElapsedSeconds`.
- Forward-only phase machine `ZOOMING → … → (WON | LOST) → DONE`; the brief WON/LOST result hold
  (`QTE_RESULT_HOLD`).
- The 2 s progressive zoom + "OTAGE" `warning` banner.
- `energy` as the outcome currency; **rescue never advances the kill quota**.
- The freeze-rest-of-level behaviour in `tickGameState` (only crosshair + QTE advance; everything else
  carried via `...state`).
- **Boundary law:** all of the above stays pure `src/game`, zero React/Three, 100% unit-tested; the sole
  game↔render bridge remains `useGameLoop.ts`.
- **Additive-optional discipline:** a `qteSpec === null` level is byte-for-byte untouched and
  deterministic.

---

## Acceptance criteria (given / when / then — all CODE-ASSERTED, unit-tested in `src/game`)

### A. Phase & sub-state behaviour

- **AC1 — retreat replaces the countdown.**
  GIVEN a QTE that has left ZOOMING (zoom elapsed),
  WHEN it ticks with no fire,
  THEN the captor anchor advances toward `doorPoint` by `retreatSpeed * delta` each tick, and
  `HostageQte` exposes NO `windowRemaining` / `windowSeconds` field (there is no countdown clock).

- **AC2 — sub-state cycle.**
  GIVEN an active retreating QTE,
  WHEN it ticks across the authored cadence,
  THEN the captor sub-state cycles COVERED → (telegraph) → PEEKING → COVERED deterministically, and the
  render-facing telegraph flag is TRUE for the whole pre-peek lead and never overlaps a PEEKING interval.

- **AC3 — COVERED is not a kill zone.**
  GIVEN the captor is COVERED (or telegraphing),
  WHEN the player lands a shot on the captor's upper silhouette,
  THEN it never classifies as `head` and never wins — it resolves as `captor-body` (small drain) or
  `hostage` / `miss` per geometry. The head zone is classifiable ONLY during PEEKING.

### B. Shot-rule table (D4)

- **AC4 — head during PEEKING is the sole win.**
  GIVEN the captor is PEEKING,
  WHEN the player lands a shot in the `head` zone,
  THEN the phase transitions to WON exactly once, applies the clean-rescue energy refill (once), and
  does NOT advance the kill quota.

- **AC5 — captor body = small drain, any time.**
  GIVEN any active QTE state,
  WHEN a shot lands in the `captor-body` zone,
  THEN energy drops by the small captor-body cost, the phase stays active (no health bar, no kill), and
  the drain applies once for that shot.

- **AC6 — hostage = heavy penalty.**
  GIVEN any active QTE state,
  WHEN a shot lands in the `hostage` zone,
  THEN energy drops by the heavy hostage penalty (once) and the QTE does not become winnable off that
  shot. Hostage precedence: a shot resolving to both hostage and captor-body geometry classifies as
  `hostage` first (G6 separation must make this rare, but precedence is asserted).

- **AC7 — panic shot during zoom.**
  GIVEN the QTE is in ZOOMING,
  WHEN the player fires,
  THEN the panic-shot energy penalty applies (once per shot) and no kill/zone resolution occurs.

- **AC8 — nothing else counts.**
  GIVEN a `miss` (outside the tableau silhouette),
  WHEN the player fires,
  THEN no energy moves and no phase change occurs. The sanction hierarchy is exactly:
  body = small cost, hostage = big cost, head-during-peek = win, everything else = nothing.

### C. Spatial fail (door reached)

- **AC9 — reaching the door loses.**
  GIVEN a retreating captor,
  WHEN the anchor reaches `doorPoint`,
  THEN the phase transitions to LOST exactly once, holds for `QTE_RESULT_HOLD`, then goes DONE, and the
  level resumes unperturbed (elapsed clock and all other systems were frozen throughout).

### D. Invariants asserted in code (NOT trusted from `QteSpec` data)

- **AC10 — G5 exposure floor ≥ 0.5 s.**
  GIVEN a spec whose authored peek duration is below 0.5 s (or F3 pushes it there),
  WHEN the QTE runs,
  THEN the EFFECTIVE peek duration is `max(0.5, authored)` — every PEEKING interval lasts ≥ 0.5 s of
  simulated time regardless of the spec. A unit test feeds a sub-floor spec and asserts the exposure
  still measures ≥ 0.5 s. (Clamp in `createQte`; do not rely on level authors.)

- **AC11 — G4 telegraph always present.**
  GIVEN any spec,
  WHEN a peek begins,
  THEN it is ALWAYS preceded by a non-zero telegraph lead — the effective telegraph lead is floored in
  code (> 0), so no PEEKING interval can start with the telegraph flag having been false the prior tick.
  A unit test feeds a zero/negative telegraph lead and asserts a telegraph window still precedes every peek.

### E. Energy / counter-fire correctness

- **AC12 — unanswered peek charges ONCE per closed exposure.**
  GIVEN a PEEKING interval that the player does not answer with a head shot,
  WHEN that interval closes (transitions back to COVERED),
  THEN the captor's counter-fire energy drain is applied exactly ONCE for that exposure — never per tick.
  A unit test ticks a multi-tick peek to completion and asserts the drain total equals one unit, and that
  an ANSWERED peek (head shot mid-interval → WON) charges zero counter-fire drain.

- **AC13 — no passive drain.**
  GIVEN an active QTE with the player firing nothing,
  WHEN time passes across COVERED intervals,
  THEN `energy` does not change from the mere passage of time — energy moves only on outcomes (rescue,
  body hit, hostage hit, panic shot, closed unanswered peek).

### F. Deterministic tie-break

- **AC14 — same-tick headshot beats door-reached.**
  GIVEN a tick in which the captor's advance reaches `doorPoint` AND the player lands a winning head shot
  during a still-open PEEKING,
  WHEN that tick resolves,
  THEN the outcome is **WON** (headshot wins), mirroring the ADR-0030 kill-vs-timeout precedent. The fire
  resolution is evaluated before the door-reached fail branch; a unit test constructs the exact same-tick
  collision and asserts WON.

### G. Additive-optional discipline

- **AC15 — a QTE-less level is untouched.**
  GIVEN a level with `qteSpec === null`,
  WHEN it runs,
  THEN `tickGameState` skips the QTE block entirely and the run is byte-for-byte identical to today (no
  new field reads, no behaviour change). Existing QTE-less determinism tests stay green.

### H. Regressions / suite health

- **AC16 — boundary + suite.**
  `qteSystem.ts` and `types/hostageQte.ts` import zero React/Three; `rtk tsc` + `rtk vitest` + `rtk lint`
  all green; every removed symbol (`captorHp`, `PART_DAMAGE`, `windowSeconds`, `QteBodyPart`, …) has no
  remaining references across `src/`.

---

## Explicitly UNCHANGED (guardrail — reject any diff that touches these)

- Scripted once-per-level trigger (`triggerAtElapsedSeconds`, `shouldTriggerQte`).
- Freeze-rest-of-level during the QTE (only crosshair + QTE advance).
- 2 s progressive zoom + "OTAGE" banner and the WON/LOST result hold.
- Side-objective rule: a rescue NEVER advances the kill quota.
- Boundary law: pure `src/game`, unit-tested; sole bridge is `useGameLoop.ts`.
- The `qteSpec === null` untouched-level path.

## Downstream (not this story, flagged for `senior-architect` lane assignment)

- Render lane: draw the moving tableau (drag / covered / telegraph / peeking-firing) and surface the
  door-distance as the diegetic clock; cop fallback until new sprites land (per ADR-0030).
- Camera: the `useGameLoop.ts` zoom driver must FOLLOW the moving anchor and restore base framing exactly
  on DONE, gated across the mobile-pan / edge-scroll writers. Highest-risk render item — its own lane.
- Art lane: new sprites (drag walk, covered, peeking-with-gun-raised) — hard dependency for the phase to read.
- QA lane (`qa-lead`): the AC1–AC16 given/when/then map directly to the unit-test plan; G6 spatial
  separation and the moving-tableau fairness get an e2e/playtest pass once art + camera land.
- F3 (ADR-0035) authors the per-level cadence curve on top of this contract; F4 (ADR-0036) later replaces
  the D3 counter-fire with the accomplice.
