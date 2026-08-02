# Test plan — QTE photo paparazzi (Belliard set-piece)

**Owner:** `qa-lead` (Inès). **Stage:** 4 (written BEFORE the build lands) → executed at stage 5.
**Derived from:** `spec-photo-qte-paparazzi.md` Rev. 4 (AC1–AC15, F1–F15),
`techplan-photo-qte.md` (A-T1–A-T12), `ux/photo-qte-controls.md` (A1–A15 + A3bis/A7bis/A14bis),
`design-gate-photo-qte.md` (E-8 ⇒ AC15).
**This document is a plan, not a verdict.** The QUALITY GATE verdict is appended at §9 after the run.

> **Iron rule.** Everything below is _specified_ by QA and _implemented_ by the owning lane:
> unit specs → `dev-gameplay` (lane A), component specs → `dev-r3f-render` (lane B),
> e2e scripts + CI checks → `dev-tooling-assets` (lane C). QA runs and verdicts.

---

## 0. Baseline (recorded before the story lands)

`npx vitest run` on `design/qte-photo-paparazzi` @ `fcd2fd00` (docs-only at that point):
**116 files / 1663 tests PASS, 12.8 s.** Any red in that set at stage 5 is a regression of this
story, not pre-existing noise. This is the number the gate diffs against.

---

## 1. What must be true (the coverage contract)

Three test surfaces, and one rule about which is allowed to carry which kind of proof:

| Surface                               | Owner  | Carries                                                              | Never carries                                     |
| ------------------------------------- | ------ | -------------------------------------------------------------------- | ------------------------------------------------- |
| **Unit** (`src/game/**/__tests__`)    | lane A | machine, five tests, floors, determinism, zero-delta, algebra        | anything about what is _drawn_ or _pressed_       |
| **Component** (`src/render/**`)       | lane B | CTA shape, focus order, hit areas, no-numeral, grayscale legibility  | game rules (a duplicated rule is a second SoT)    |
| **e2e** (`scripts/e2e-*.mjs`)         | lane C | the composed paths, real input, real clock, device fork, persistence | fine-grained rule enumeration (too slow, brittle) |
| **CI data check** (`scripts/check-*`) | lane C | drawn == box over intervals (F12(1b)), determinism grep (F11)        | —                                                 |

---

## 2. Coverage matrix — AC by AC

Legend: **U** unit (lane A) · **C** component (lane B) · **E** e2e (lane C) · **P** playtest
(`game-designer`, conformity — not mine) · **X** exploratory charter (mine) · **CI** data script.

| AC                        | Surface    | Test id(s)               | Notes / QA-added boundary                                                                                                           |
| ------------------------- | ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| AC1 machine               | U + E      | A-T-M1..M4, **E1**       | + QA: assert **each of the 3 terminals** reaches `CONTACT_SHEET` (3 cases, not 1); assert no phase is revisited (forward-only walk) |
| AC2 posture               | U          | A-T8                     | + QA: focal retained across _two_ lower/raise cycles; `raisedElapsed` reset asserted at the **event**, not the input                |
| AC3 five tests            | U          | A-T-T1..T5               | + QA boundary: `fill` exactly at `FILL_MIN`/`FILL_MAX` (inclusive per spec), and at ±1 ulp outside                                  |
| AC4 two-beat              | U + C      | A-T2, **C-A7bis**        | structural (no field differs) **and** pixel (bracket region diff)                                                                   |
| AC5 zoom trade-off        | U + P      | A-T-Z1, P                | U can assert `s_eff(FILL_MAX) === 0` analytically; the _felt_ degradation from 258 mm is Sacha's                                    |
| AC6 cadence + floors      | U          | A-T11                    | **one test per floor F1–F15**, each via a _mutated_ fixture that must throw a **named** message                                     |
| AC6b subject track        | U + CI     | A-T3/T4/T5/T6 + **CI-1** | (d) is NOT unit-testable — see CI-1 below                                                                                           |
| AC6c tracking demand      | U          | A-T-F5b/F5c              | + QA: assert the **non**-panning player fails at 251 mm (the negative case is the proof, not the positive)                          |
| AC7 suspicion             | U + C      | A-T9 + C-A7              | + QA: shutter #3 exactly at the boundary `2×34=68 < 100 ≤ 3×34=102`                                                                 |
| AC8 film                  | U + C      | A-T-FILM + C-A12         | + QA: `film → 0` on a **rejected** frame ends the scene too (verdict-independent)                                                   |
| AC9 reduced motion        | U          | A-T-RM                   | ±10 pp valid-composition fraction over a 10 s raised sample, both modes, same seed                                                  |
| AC10 determinism          | U + CI + E | A-T10, CI-2, **E1**      | delta chunking 1/60 · 1/30 · jittered; retry N ≡ retry 1; grep gate                                                                 |
| AC11 non-lethality        | U          | A-T7 (3 parts)           | + QA: add the **4th** part — `photoQteEnabled:false` ⇒ Belliard ≡ main                                                              |
| AC12 reward lever         | U          | A-T-LEV                  | phase-3 byte-identity + Belliard byte-identity at every tier + compound assert on the **runtime** row                               |
| AC13 bonus-never-gate     | U + E      | A-T-ATT, **E3**, **E4**  | the invariant proof is E3 (the run _continues_), not a unit test                                                                    |
| AC14 frustration hunt     | P + X      | —                        | Sacha's, plus my exploratory charter X-3                                                                                            |
| **AC15 composed mission** | **E**      | **E6** (+ manual leg)    | §5 — protocol, both clocks, both attempt counts                                                                                     |
| UX A1/A2/A3bis mobile     | E          | **E5**                   | mobile-landscape viewport per ADR-0003/0015                                                                                         |
| UX A6/A13 grayscale       | C          | C-GS                     | 3 bracket states + 3 stamps mutually distinguishable without colour                                                                 |
| UX A14/A14bis CTA         | C + E      | C-CTA, **E3**            | **see trap T-4: the two specs disagree on focus — blocked until arbitrated**                                                        |
| UX A15 hit areas          | C          | C-HIT                    | ≥44×44 CSS px at the mobile viewport, spacing measured                                                                              |
| A-T12 coexistence         | U + E      | A-T12(a..d), **E6**      | the adversarial threshold case (a) is the one that matters                                                                          |

---

## 3. Coverage matrix — floor by floor (F1–F15)

Every floor is a **mutation test**: the assert is only proven by an authored fixture that
breaks it and a `createPhotoQte` that throws a _named_ message. A floor asserted only on the
shipping data is a tautology — it passes because the data happens to be right, not because the
guard works. **Requirement: 15 mutated fixtures, 15 distinct messages.**

| Floor   | Mutation to inject                                       | Expected                    | Extra QA demand                                              |
| ------- | -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| F1      | LA PLAQUE window 2.9 → 1.5 s                             | throw `F1`                  | also test **exactly 1.6** ⇒ passes (inclusive boundary)      |
| F2      | tell lead 1.8 → 1.1 s; and tell **after** `openAt`       | throw `F2` (2 cases)        | the strictly-before leg is a separate case                   |
| F3      | shift ECHANGE so cover overlap 1.5 → 1.1 s               | throw `F3`                  | test the **bonus** rows too, not just master                 |
| F4      | focal band ratio 1.43 → 1.05; and empty band             | throw `F4` (2 cases)        | band outside `[35,300]` is a 3rd case                        |
| F5a/b/c | `SWAY_AMP_X` ↑ / `v_subject` ↑ / `PAN_RATE_MAX` ↓        | throw `F5a` / `F5b` / `F5c` | three distinct messages, not one                             |
| F6      | `filmCount` 4, then 9                                    | throw `F6` (both sides)     | `instantCount+2 = 5` is the floor — test 5 passes            |
| F7      | `SUSPICION_SHUTTER_EXPOSED` 34 → 51                      | throw `F7`                  | ratio exactly 2 ⇒ passes                                     |
| F8      | —                                                        | zero-delta test (A-T7)      | not a fixture floor; a behavioural one                       |
| F9      | `FOCUS_HOLD` 0.35 → 1.0                                  | throw `F9`                  |                                                              |
| F10     | tier ×0.70 on the Niveau Final row                       | throw `F10`                 | must be asserted on the **runtime** row (§AC12)              |
| F11     | —                                                        | CI-2 grep gate              | grep must cover `src/render/**/photo/**` too, not only game  |
| F12     | keyframe outside plate / non-constant dead beat / t≠0,60 | throw `F12(1..3)`           | + CI-1 for the interval leg                                  |
| F13     | `briefingMaxSeconds` 25 → 40                             | throw `F13`                 | assert **both** legs (attempt 1 = 87.8, retry = 62.8)        |
| F14     | `maxAttempts` 2 → 3                                      | throw `F14a`                | **and F14b recomputed from the data**, not a literal 262.1   |
| F15     | `triggerAtElapsedSeconds` 2.5 → 5.0                      | throw `F15`                 | must read the hostage trigger **from the level row**, not 12 |

**F14b must not be a hardcoded constant.** If the assert is `expect(262.1).toBeLessThan(270)` it
proves nothing; it must recompute from `timeSeconds`, `maxAttempts`, the photo spec and the
hostage worst case, so that moving _any_ of the four terms turns it red. Same for F15's `12`.

---

## 4. e2e scenarios — specified (implementation: lane C)

**Format:** raw `playwright` node scripts on `scripts/e2e-lib.mjs`, `seedPlay` (un-frozen tick,
`window.__MUF_STATE__()` read seam), SwiftShader args, screenshot to `screenshots/`, exit 1 on
any gate, zero `pageerror`. **No new `window.__MUF_*` flag** (standing architect ruling recorded
in `e2e-delivery.mjs`'s header): everything the harness needs must be reachable through the
existing state seam and `localStorage`.

**Shared prelude** (`enterPhotoSetPiece(page)`), used by E1–E6:

```
seedPlay(page, levelIds)                      // + the "not a first run" seed, see T-1
enterMenuFromTitle → click Belliard → dismissNarrative
pollState(s => s.game.photoQte?.phase === "BRIEFING")   // must appear by ~5 s of played time
```

| #      | Scenario                                                   | Gate assertions (all hard, exit 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E1** | **Nominal — the master proof** (master proof of the story) | skip briefing → `ESTABLISHING` observed with `posture==="LOWERED"` and `sceneClock===0` across ≥3 polls → hold Space, drive `focal`/aim to the authored L'ÉCHANGE composition, wait `focusHeldSeconds ≥ 0.35`, release shutter → `film` decrements by exactly 1 → scene runs out → `DEVELOPING` → `CONTACT_SHEET` with `outcome === "master"` → screenshot → press `[ CONTINUER ]` → `photoQte === null` and the level resumes. **Also assert: no field of the live view differed before/after the shot** (AC4 at runtime). |
| **E2** | **Failure → truncated sheet**                              | fire 3 **exposed** (uncovered) shutters → `phase === "SPOTTED"` → sheet reached (never bypassed) → sheet shows exactly the frames shot (`frames.length === 3`), **not** 6 slots of verdict → `outcome === "none"` → energy/score/lives/kills/quota **all byte-identical** to the pre-set-piece snapshot (E-4c at runtime, not only in unit)                                                                                                                                                                                 |
| **E3** | **`[ LAISSER TOMBER ]` — the bonus-never-gate invariant**  | on a no-master sheet, activate the decline CTA in **one** input → no confirmation dialog, no second screen (assert phase goes `CONTACT_SHEET → DONE → (photoQte null)` with no intermediate) → **the run CONTINUES**: `phase` is the ordinary level phase, `timeRemaining` resumes decreasing over the next 2 s of polls, the delivery still fires later → `muf_leverage` reads `"none"` → Niveau Final multiplier ×1.00. **This is the story's load-bearing e2e; if it is red nothing else matters.**                      |
| **E4** | **The 2-attempt ceiling**                                  | attempt 1 sheet: **two** CTAs present, `[ RECOMMENCER ]` among them → press it → re-entry lands on **`ESTABLISHING`**, never `BRIEFING` (assert the phase sequence, and that no briefing line rendered) → attempt 2 sheet: `[ RECOMMENCER ]` **absent from the DOM** (not merely disabled/hidden) and exactly **one** CTA remains → press it → run resumes. Then **re-enter Belliard from the menu** and assert the budget **reset** (2 CTAs again) — the mission-scoped counter, both directions.                          |
| **E5** | **Mobile fork** (ADR-0003/0015 viewport)                   | tap-to-toggle raises with **no sustained contact** (`touches.length === 0` after the tap while `posture === "RAISED"`) → max simultaneous `touches.length` over raise/pan/pinch/shutter ≤ **2** → pinch changes `focal` without exposing a frame; a shutter tap does not change `focal` → raise button ≥44×44 CSS px → contact sheet: 6 cells, one viewport, no scroll/pagination node. **Run E1 and E3 at this viewport too** — the two invariants are not desktop-only.                                                   |
| **E6** | **Belliard coexistence + AC15 chronometry**                | see §5 — one script, two runs, both clocks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**Regression scenarios added to the existing suites (mandatory, not optional):**

- **R1 — `e2e-delivery.mjs`** boots Belliard and waits `trigger(20 s) + 15 s` **wall-clock** for
  the DELIVERING banner. With the set-piece triggering at 2.5 s of played time and freezing up to
  87.8 s, **this gate times out** unless the set-piece is off on that path. Lane C must either
  keep it off (the `enabledOnFirstRun` seed) **and assert that it is off**, or widen the budget
  _and say so in the header_. A silently widened timeout is a hole, not a fix.
- **R2 — `harness-assert.mjs` D2-A** and **R3 — `harness-motion.mjs`** both boot Belliard and
  key off the hostage QTE at 12 s. Same exposure, same requirement. All three are **required CI
  checks**; they are the most likely casualties of this story and they are not currently in the
  story's test list at all.

---

## 5. AC15 — the chronometry protocol (executable)

**What the gate asked (E-8):** the real time of one Belliard mission attempt _including_ the
set-piece, at 1 and at 2 set-piece attempts, against 3-5 min and against F14b's 262.1 s.

**Two clocks, measured separately — this is the whole point of the AC:**

- **Played time `T_p`** — level-clock seconds actually consumed: `timeSeconds − hud.timeRemaining`
  sampled from `__MUF_STATE__()`. Frozen blocks contribute **zero**.
- **Wall time `T_w`** — `performance.now()` in the driver, from the first frame of the level to
  the frame the mission resolves. Frozen blocks contribute **all of it**.

**The path that ships, not a first run.** `enabledOnFirstRun: false` means the naive e2e measures
a mission with **no set-piece at all** and reports a fine number that means nothing. The protocol
therefore _first asserts_ `photoQte !== null` appeared, and fails loudly if it did not (see T-1).

**Modelling the human, since the harness has no patience:** the two blocks whose length is a
_reading_ time are scripted with explicit dwells, so `T_w` is a genuine upper bound and not a
robot's lower bound:

| Block           | Run A (1 attempt)                              | Run B (2 attempts)                            | Rationale                                                            |
| --------------- | ---------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `BRIEFING`      | **not skipped** (25.0 s cap elapses)           | not skipped on attempt 1; absent on attempt 2 | the worst legal case is the one under test                           |
| `CONTACT_SHEET` | dwell **30.0 s** (`CONTACT_SHEET_READ_BUDGET`) | 30.0 s **per sheet**                          | the budget is a design number; it must be measured, not assumed away |

**Procedure (single script, two runs):**

1. Seed the not-first-run state; enter Belliard; `t0 = performance.now()`, snapshot `T_p0`.
2. Poll to `photoQte.phase === "BRIEFING"`; record `T_p(trigger)` — **assert ∈ [2.0, 3.0]**.
3. Let the briefing cap elapse; timestamp each phase transition (`ESTABLISHING`, `ACTIVE`,
   `DEVELOPING`, `CONTACT_SHEET`).
4. Dwell 30 s on the sheet. Run A: press the leaving control. Run B: press `[ RECOMMENCER ]`,
   repeat 3-4, then press the leaving control on the exhausted sheet.
5. Record `T_w(exit)` and `T_p(exit)`. **F15:** poll on until `hostageQte` leaves idle; report
   `T_p(hostage) − T_p(exit)` — **assert ≥ 8.0 s, expected 9.5 s.**
6. Continue to mission resolution. Report `T_w(total)`, `T_p(total)`.
7. Emit a machine-readable line `AC15 runA/runB Tw=… Tp=… frozen=… sep=…` and write
   `docs/qa/evidence/ac15-belliard-<run>.json` + a screenshot per phase transition.
8. If `BELLIARD_BOSS_ENABLED` is on, repeat run B on that path and report separately
   (§1.3.a decision 6 — the result goes back to `game-designer` before that flag ships).

**Predictions the run must be compared against — and one I expect to FAIL:**

| Quantity                         | Predicted                                         | Bound   | QA note                                                      |
| -------------------------------- | ------------------------------------------------- | ------- | ------------------------------------------------------------ |
| Run A `T_w`, photo leg           | 87.8 + 30 = **117.8**                             | ≤ 120 s | ✓ expected pass                                              |
| Run B `T_w`, photo leg attempt 2 | 62.8 + 30 = **92.8**                              | ≤ 90 s  | ✗ **the spec's own numbers breach its own ceiling by 2.8 s** |
| Run A composed mission `T_w`     | 90 + 117.8 + 21.5 = **229.3 s = 3.82 min**        | 3-5 min | ✓                                                            |
| Run B composed mission `T_w`     | 90 + 117.8 + 92.8 + 21.5 = **322.1 s = 5.37 min** | 3-5 min | ✗ **over** — F14b's 262.1 s excludes all sheet reading       |
| F15 separation `T_p`             | 9.5 s                                             | ≥ 8.0 s | ✓ if the trigger is honoured                                 |

**This is the finding AC15 was imposed to produce.** F14b bounds _authored frozen_ time and
concludes "4.37 min, inside 3-5 min with 38 s headroom" — but the 60 s of contact-sheet reading
that `CONTACT_SHEET_READ_BUDGET` itself authorises is not in the sum, and it is 22 s larger than
the headroom. Measured real time on the two-attempt path lands at ≈5.4 min. Routed to
`game-designer` (§8, T-6): either the sheet budget enters F14b, or the ceiling moves, or attempt 2
loses the un-skipped briefing it already lost. Not mine to choose — mine to measure and state.

---

## 6. Exploratory charters (mine, timeboxed 30 min each)

- **X-1 — the frozen boundary.** Pause/blur/resize/orientation-change/tab-hide during every phase,
  especially the tick where the shutter fires and the tick where the sheet appears. Look for: a
  posture that survives a pause (T-5), a `raisedElapsed` that accrues while hidden, a
  double-fired shutter on a key repeat, a `focal` that drifts across a resize.
- **X-2 — the input seams.** Space + click + touch simultaneously; Space held while the sheet
  appears; the leaving CTA activated twice in one frame; browser back/refresh mid-set-piece
  (does `muf_leverage` persist a half-outcome?).
- **X-3 — the frustration hunt, robustness half.** Burn a whole roll deliberately; take zero
  photos and let `SCENE_END` fire; retry immediately without reading. Every one must end at a
  sheet with a named reason per frame and a control that leaves.
- **X-4 — the second mission.** Play Belliard twice in a row without reloading. Attempt counter,
  `muf_leverage` merge (monotone, idempotent), and the briefing's once-per-entry rule.

---

## 7. The holes — AC that no test covers naturally

Named on purpose, each with an owner. **An unnamed hole is the bug that escapes.**

| #       | Hole                                                                                                                                                                                                                                                               | Assigned                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| **H1**  | **AC6b(d) — drawn == box.** Not unit-testable (the unit layer has no pixels) and not screenshot-diffable (there is no golden). Needs **CI-1**, a new script `check-photo-subject-boxes.mjs` sampling the _animation_.                                              | lane C, spec below                    |
| **H2**  | **F12's interval legs** (reverse-out flat, non-growing, holds don't drift). Endpoint checks pass on an arc. Same script, interval sampling.                                                                                                                        | lane C                                |
| **H3**  | **AC4's live leg.** A-T2 is structural on `photoSceneView`; it does not prove the _render_ does not leak the verdict through a texture/animation the view object never mentions. Needs C-A7bis (pixel diff of the bracket region) **and** E1's runtime field-diff. | lane B + lane C                       |
| **H4**  | **AC13(d)'s reset direction.** "The counter resets on a new mission" is only proven by E4's second entry — a unit test cannot see a mission boundary. If E4 is descoped, this invariant ships unverified and smuggles in the rarity R3-6 forbids.                  | lane C — **not descopable**           |
| **H5**  | **AC10 across framerates in the real browser.** A-T10 chunks deltas in a unit test; nothing proves the shipped rAF path is chunking-immune. Needs E1 re-run with CPU throttling and a state hash compared.                                                         | lane C                                |
| **H6**  | **AC9 reduced motion end-to-end.** No e2e ever sets `prefers-reduced-motion`. The parity metric is unit-only; the _drawn_ reduced-motion path has zero coverage.                                                                                                   | lane C (add `reducedMotion` to E1)    |
| **H7**  | **A-T7 part 4** (`photoQteEnabled:false` ⇒ Belliard ≡ main) is named in the techplan's §D-K commentary but is **not** in the A-T7 test list. It is the flag the ship path may actually use.                                                                        | lane A                                |
| **H8**  | **The three existing Belliard CI gates** (R1/R2/R3, §4). No spec mentions them. They are required checks and they are the most likely red.                                                                                                                         | lane C — **gate condition**           |
| **H9**  | **`muf_leverage` persistence across a reload.** ADR-0080 carries an outcome across a level boundary via `localStorage`; nothing in the plan reloads the page between Belliard and the Niveau Final.                                                                | lane C (extend E3/E1)                 |
| **H10** | **Audio.** `SUSPICION_SHUTTER_COVERED = 0` depends on cover; the click timbre depends only on T5 (AC4). Every suite runs muted. The click/timbre leak is **unverifiable in the current harness** — CI-DEFERRED, escalated.                                         | `sound-designer` + me, via `producer` |

**CI-1 — `check-photo-subject-boxes.mjs` (spec for lane C).** Sampling step **0.10 s**, fixed and
declared in the header. Rationale: the shortest interval under control is 2.9 s
(`[53.0, 55.9]`), and the spec forbids fewer than 10 samples there; 0.10 s gives **30** samples
there and **601** over `[0, 60]` — comfortably finer than the shortest feature, cheap enough for
CI. **It must sample the rendered animation frames, not a re-interpolation of the authored table
against itself** (that is a green light that asserts nothing — spec §7.2.a). Four assertions:
drawn-vs-box per edge within `max(0.40 su, 5 %)`; `|cy − 9.00| ≤ 0.40` on `[53.0, 55.9]`; `w,h`
vs `7.50 × 4.22` on the same interval; the two hold poses constant on `[K2,K3]` and `[K4,K5]`.
Failure = **art re-delivery**, never a widened tolerance.

**CI-2 — determinism grep (F11).** Extend the existing ADR-0034 grep gate to the new files, and
to `src/render/**/photo/**` — a `Math.random()` in the _dress_ still breaks AC10's byte-identity
if it feeds anything the state hash sees.

---

## 8. Traps I see that the specs did not name

| #        | Trap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Severity / route                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **T-1**  | **`enabledOnFirstRun: false` makes every e2e a false green by default.** The default harness state _is_ a first run. A script that enters Belliard, sees no set-piece and asserts "the delivery still works" passes while testing nothing. **Every photo e2e must open by asserting `photoQte !== null` appeared, and the not-first-run predicate must be reachable from `localStorage` — no new `window.__MUF_*` flag.** The predicate is `pm`'s; its _observability_ is a test requirement. | **Blocking on the e2e suite** → `pm` + lane A                 |
| **T-2**  | **The techplan predates Rev. 4 D-1.** `PhotoQte` (techplan §2.1) has **no `attemptIndex` and no `maxAttempts` field**, and §D-A still reads "`[ RECOMMENCER ]` is not bounded in number". But `BRIEFING` is now entered _iff_ `attemptIndex === 0`, and the counter must be **mission-scoped** — i.e. it must live _outside_ the object that `createPhotoQte(spec)` recreates on retry. If lane A follows the typed contract, attempt 2 replays the briefing and the budget never caps.       | **Blocking** → `senior-architect` (techplan Rev. 4)           |
| **T-3**  | **`outcome` is "derived at DEVELOPING, frozen from then on"** — but a retry produces a _second_ roll. Is the carried leverage the **last** attempt's or the **best** of the two? `mergePhotoLeverage` is monotone (only upgrades), so a good attempt 1 followed by a declined attempt 2 keeps `master`. Nobody decided that; it will be decided by an implementation detail. Add a unit case both ways.                                                                                       | **Major** → `game-designer` ruling                            |
| **T-4**  | **Two specs give the contact sheet two different focus orders.** Spec §1.3: "the leaving control is the **default/primary focus** on both branches". Techplan §A3 / UX R2-5: "**neither styled primary**, initial keyboard/gamepad focus on `[ RECOMMENCER ]`". Lane B cannot satisfy both, and it is exactly the invariant K-4 exists to protect (an invariant only written down is not implemented).                                                                                        | **Blocking on lane B** → `lead-game-designer` + `ux-designer` |
| **T-5**  | **UX A14bis is stale after Rev. 3.** It asserts the decline returns play "to the **Stalingrad** delivery". The set-piece moved to **Belliard**. An e2e written from that line tests the wrong level and cannot fail correctly.                                                                                                                                                                                                                                                                | Minor, but it _is_ the E3 gate → `ux-designer`                |
| **T-6**  | **AC15's real time overruns the F14 argument** (§5 table): 92.8 s > the 90 s attempt-2 ceiling, and 322.1 s = 5.37 min > 5 min on the two-attempt path, because `CONTACT_SHEET_READ_BUDGET`'s 60 s is not in F14b's sum while its 38 s headroom is smaller than that.                                                                                                                                                                                                                         | **Major** → `game-designer` (predicted AC15 deviation)        |
| **T-7**  | **Three green CI gates are on the blast radius and nobody listed them** (H8/R1-R3): `e2e-delivery`, `harness-assert` D2-A, `harness-motion` all boot Belliard on wall-clock budgets. A set-piece that freezes 87.8 s at t=2.5 s breaks all three.                                                                                                                                                                                                                                             | **Gate condition** → lane C                                   |
| **T-8**  | **The retry is "byte-identical (AC10)" _and_ the player has learned the scene.** Same seed, same cadence ⇒ attempt 2 is strictly easier. That is fine as design, but AC10's "retry N identical to retry 1" and AC13's "bounded" together mean a player who memorises attempt 1 always converts attempt 2 — the cap is the only cost. Worth Sacha's eyes; not a bug.                                                                                                                           | Observation → `game-designer`                                 |
| **T-9**  | **`spec: PhotoQteSpec` is carried inside `PhotoQte`**, which is deep-cloned into `__MUF_STATE__()` every poll (`frozenSnapshot` → `structuredClone`). With a 9-keyframe track and briefing lines that is a per-poll clone cost on a seam the harness hits at 150 ms. Watch for e2e flake/slowdown, and for `deepFreeze` recursion depth.                                                                                                                                                      | Minor → lane A / `gpu-specialist` if e2e slows                |
| **T-10** | **`FILL_MAX` is derived (`1 − 2×FRAME_MARGIN` = 0.92) and F5a is _deliberately_ breached at `FILL_MAX` and above 258 mm.** A future "fix the failing floor" reflex will silently re-tune the authored top of range. The floor test must therefore **assert the breach exists** at those points, not merely tolerate it.                                                                                                                                                                       | Minor → lane A (add the positive-breach assertion)            |
| **T-11** | **`SPOTTED` truncates the sheet to the frames shot** — with **zero** frames shot (spotted is impossible at 0 shutters, but `SCENE_END` at 0 is not), the sheet is **empty**. An empty 2×3 grid with a leaving CTA is an untested render state and a likely blank screen. E2 must include the 0-frame `SCENE_END` case.                                                                                                                                                                        | Major → lane B + E2                                           |

---

## 9. Gate conditions (what makes this PASS)

The QUALITY GATE is PASS only if **all** of:

1. `vitest` ≥ 1663 tests, **0 failures**, and `src/game` coverage ≥ 80 % (thresholds unchanged).
2. `tsc` + `lint` clean. Determinism grep (CI-2) clean.
3. **15/15 floor mutation fixtures** throw named messages; A-T1–A-T12 all present and green.
4. E1, E2, E3, E4 green on desktop; E1, E3, E5 green on the mobile-landscape viewport.
5. R1/R2/R3 — the three pre-existing Belliard CI gates — green, with any budget change
   documented in the script header (T-7).
6. **`test-quality` run** on the added tests: every new floor assert and every A-T must go RED
   under a deliberate mutation of its source. A green suite that survives the mutation is a
   **SURVIVES** finding routed to the owning lane — coverage % is never the evidence here.
7. AC15 measured and **reported**, both clocks, both attempt counts (a deviation is reported, not
   swallowed: T-6 is a design call, not a QA veto).
8. H10 (audio) explicitly recorded as **CI-DEFERRED** in the verdict, escalated via `producer`.

Anything that cannot run in the sandbox is named as unverified. **An unrun check is a hole in the
verdict, never a PASS.**
