# QA test plan — Boss QTE differentiation pack (5 levers, ADR-0052)

**Story:** `_bmad-output/planning-artifacts/story-boss-qte-differentiation.md` ·
**ADR:** `docs/adr/0052-boss-qte-differentiation-levers.md` (extends ADR-0051) · **Specs:**
`docs/game-design/spec-boss-qte-differentiation.md` (mechanic/tuning, AC-D1..D8),
`docs/game-design/ux/spec-boss-qte-differentiation-ux.md` (A1–A15),
`docs/game-design/spec-boss-differentiation-fiction.md`,
`docs/game-design/spec-boss-qte-differentiation-audio.md`.
**Owner:** `qa-lead` (Inès) · **Stage:** 5 (VERIFY) — leg 1 + CLOSE · **Date:** 2026-07-20
**Verdict of record:** leg-1 shard §10; **quality-gate CLOSE** shard §24
(`docs/handoffs/story-boss-qte-differentiation.md`) + the STAGE-5 CLOSE audit at the end of this plan.
**Predecessor plan (house style):** `docs/qa/plan-story-boss-encounter-qte.md` (V1).

This plan derives from the story ACs + the gated design/UX specs (plan-from-spec, not from the
diff). Like V1 it is a **DEV harness** (`?preview=boss`, reachable on branch-preview builds — NOT
`import.meta.env.DEV`-gated, App.tsx L59-66, Bertrand's explicit 2026-07-19 ask); NOT a
player-facing feature. The pack is **five differentiation levers** authored entirely inside the
already-separate boss system (`bossQteSystem.ts` / `types/bossQte.ts` + two view files) — the gate
verifies the LEVERS **and**, above all, the **additive-and-inert** guarantee that no shipped level
or player is affected (phase 1 byte-identical, hostage QTE untouched, Belliard live config
untouched, no persistence side-effect).

**Leg split (per the pipeline):** THIS is leg 1 — test plan + mechanical gate + e2e evidence +
V1-regression + the lanes' verify-leg obligations. Leg 2 is `game-designer` (Sacha)
design-acceptance vs. AC-D1..D8 and `ux-designer` (Tony) UX review vs. A1–A15, run on **my
screenshots**. Where the sandbox cannot produce a screenshot a leg-2 item needs, that item is
named CI-DEFERRED here (§4) — not silently assumed green.

---

## 1. What must be true (per-lever verification matrix)

Traced to spec AC-D1..D8, ADR-0052 D1-D5, UX A1-A15. "How proven" distinguishes **unit**
(deterministic, seeded-pure — authoritative for pure logic), **mechanical** (tsc/vitest/lint/fmt),
**e2e** (runtime screenshot), **inspect** (code read).

| #   | Lever / claim to prove                                                                                                                                                                                                                                     | Source             | How proven (this leg)                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| Q1  | tsc / vitest / lint / format clean; `src/game` coverage ≥ 80 %                                                                                                                                                                                             | DoD, CLAUDE.md     | **mechanical — GREEN §2**                                                   |
| Q2  | **L1** dual rings phase 2+ (vital 2 / limb 1, ×1.0 / ×0.6, shared `windowChipped`, overlap→vital, ⊂-band asserted); phase 1 single-ring byte-identical                                                                                                     | AC-D2, ADR D2      | **unit** (62-test suite) + **e2e** phase-1 only (§4 hole H1)                |
| Q3  | **L3** parry from same `fire`+`impactPoint` (no `src/hooks` change); `parryLeadSeconds`≥0.35 & <lull, `parryWindowSeconds`≥0.5; +2 & stagger / −10+1-blown / panic −6 non-consuming                                                                        | AC-D3, ADR D2      | **unit** (asserts + cadence) + **inspect**; **e2e** DEFERRED (§4 H2)        |
| Q4  | **L2** décor prop SHIELDED-gap, single-use, pure-upside (+3, no failure surface); smoke degrades-not-removes visual tell (≥ floor lead), audio redundant                                                                                                   | AC-D4, ADR D2      | **unit** (pure-upside, additive-optional) + **e2e** DEFERRED (§4 H3)        |
| Q5  | **L5** `bossHp≤0` → FINISHER (new top-level phase) → click OR 1.5 s timeout → WON (+50) → `QTE_RESULT_HOLD`; damage-free, zero failure surface; freeze holds through FINISHER                                                                              | AC-D5, ADR D3      | **unit** (FINISHER interpose + holds-freeze) ; **e2e** DEFERRED (§4 H4)     |
| Q6  | **L4** phase-3 surge telegraphed; blown-under-surge −12 (single charge, replaces −8); exactly ONE `blownWindows` (no loss-clock accel); answered costs nothing; touches no `enemies`/`spawnWave`/`couriers`/`bullets`/`lives`/`elapsedSeconds`/`qteSystem` | AC-D6, ADR D4      | **unit** (surge range + D4 boundary assertion) ; **e2e** DEFERRED (§4 H5)   |
| Q7  | **§5.6** every new failure attributable to a telegraphed window ≥ reaction floor; all new patterns introduced on phase breaks                                                                                                                              | AC-D7              | **unit** (telegraph floors, monotonic ledger)                               |
| Q8  | **Boundary / determinism** all-new logic pure `src/game`, seeded-pure (no `Math.random`), additive-and-optional (`decorProp` absent / phase-1-only ⇒ byte-identical); early-return freeze untouched                                                        | AC-D8, ADR D5      | **unit** (byte-identity, source scan) + **inspect** (§7 R1-R4)              |
| Q9  | Legibility reads (parry vs shoot by FORM, dual-ring not-colour-alone, finisher distinct from `QTE_RESULT_HOLD`, HP-bar zero-settle), reduced-motion, mobile 44×44                                                                                          | UX A1-A15          | **e2e** phase-1 + reduced-motion + mobile reachable; phase-2+ DEFERRED (§4) |
| Q10 | Boot `?preview=boss` → boss ACTIVE, no `pageerror`, both device classes                                                                                                                                                                                    | ADR-0051 D4        | **e2e — GREEN** (desktop + mobile, §4 E2E-1)                                |
| Q11 | **No shipped player reaches the gate**; **no score/unlock persistence** from the harness (f5bd0a0)                                                                                                                                                         | ADR-0051 D4, story | **e2e** (persistence inert) + **inspect** (LEVELS exclusion, §7 R4)         |

---

## 2. Mechanical checks (run this cycle — REAL results)

Corepack Yarn 4.12.0, `COREPACK_NPM_REGISTRY=https://registry.npmjs.org` exported; rtk not
installed → `yarn` fallbacks. Commit `3c1bf8e`, branch `claude/yo-pmnyzr`.

| Check      | Command             | Result                                                     |
| ---------- | ------------------- | ---------------------------------------------------------- |
| Typecheck  | `yarn typecheck`    | **EXIT 0** (whole repo)                                    |
| Unit suite | `yarn vitest run`   | **843 / 843 PASS**, 64 files, EXIT 0 (boss suite 62 tests) |
| Lint       | `yarn lint`         | **EXIT 0** (0 problems)                                    |
| Format     | `yarn format:check` | **EXIT 0** ("All matched files use Prettier code style!")  |
| Build      | `yarn build`        | **EXIT 0** (dist emitted; grep §7 R4)                      |

Coverage (Q1): the boss suite grew 35 → 62 tests with the ADR-0052 levers (AC-D1..D8 + the D4
boundary assertion + FINISHER-holds-freeze + ⊂-band + determinism); the whole `src/game` suite is
green and CI enforces the 80 % threshold. Coverage was NOT re-run standalone this leg (the CI
`test:coverage` gate is authoritative; the added 27 tests only raise `bossQteSystem.ts` coverage) —
**named as a residual, not a hole**: if the CI coverage job is not green, the gate does not hold.

## 3. Unit coverage expectations (owned by `dev-gameplay`, verified here)

`src/game/systems/__tests__/bossQteSystem.test.ts` (62 tests) MUST cover, and does:

- **L1** dual-ring: `bossWander`→`bossWanderBox` parameterisation (phase-1 identical output),
  ring-B salt `BOSS_RING_B_SALT` decorrelation, overlap→vital, shared `windowChipped`, ⊂-band
  containment asserted in `createBossQte`.
- **L3** parry: `isChargedWindow(0,·)=false`, `isChargedWindow(1,·)` = one teach at window index 1,
  `isChargedWindow(2,·)` = every-other; `parryLeadSeconds`/`parryWindowSeconds` floor asserts;
  `QTE_PARRY_CHIP +2` + STAGGER, `QTE_CHARGED_WHIFF −10` + one blown, panic −6 non-consuming.
- **L2** décor: additive-optional (`decorProp` absent ⇒ byte-identical), pure-upside +3 single-use;
  `smokeActive` boolean + floor guarantee.
- **L5** FINISHER: depleting chip → FINISHER (energyDelta 0), click/timeout → WON(+50); the
  **FINISHER-holds-the-freeze** test (`isBossQteActive` includes FINISHER).
- **L4** renfort: `RENFORT_SURGE = { phaseIndex: 2, onsetWindowIndex: 1, durationWindows: 2 }`,
  `isRenfortWindow` flags exactly that range; blown-under-surge −12 as ONE blown window (never
  accelerates `maxBlownWindows`); charged+surge overlap → max(−10,−12) = −12 single charge; answered
  window costs nothing; **the D4 boundary assertion** (source scan: touches no
  `enemies`/`spawnWave`/`couriers`/`bullets`/`lives`/`elapsedSeconds`/`qteSystem`/`hostageQte`).
- **K-5 winnability** on the pinned seed `20260719`: "a competent player (rings + parry) clears
  24 HP before the blown-window clock trips." **Seeded-pure ⇒ this unit result IS the winnability
  proof** (no runtime divergence possible).
- **Byte-identity** (`bossQteSpec === null` no-op) carried in `stateMachine.test.ts` (unchanged
  guard).

## 4. E2e scenarios & evidence (SPEC — implemented by `dev-tooling-assets`; driven by me this leg)

Evidence dir: `docs/qa/evidence/story-boss-qte-differentiation/` (PNG, commit-friendly). Driven
headless via Playwright + the `chromium_headless_shell` binary (SwiftShader), `?preview=boss` +
`window.__MUF_PLAY__=true` (installs the ADR-0005 read-only `__MUF_STATE__` snapshot seam so every
capture is **state-verified**, never guessed). CRT off, muted.

**The harness change that unblocked boot:** `BOSS_QTE_DEV_HARNESS_LEVEL.enemiesToWin = 0` — the boss
triggers **instantly** on `?preview=boss` (V1's C-QA1 mook-quota blocker is GONE). Boot → 2 s zoom →
ACTIVE phase 1 is now deterministic on both device classes.

- **E2E-1 — harness boot (desktop + mobile). [GREEN]** `?preview=boss` → ACTIVE on `boss-harness`,
  HUD renders, ZERO `pageerror` on all runs. Evidence: `01`, `13`, `14`.
- **E2E-2 — production reachability + persistence guard. [GREEN, model reconciled]** The V1 plan's
  "dist contains NEITHER `boss-harness` NOR the name" assertion is **OBSOLETE** — since commit
  9a49edf the `?preview=boss` seam is intentionally bundled (branch-preview access), so those
  strings ARE in `dist/assets/*.js` **by design**. The current guard is two-part and both hold:
  (a) the harness level is **excluded from `LEVELS`** (a separate export; no menu path — §7 R4);
  (b) **zero persistence side-effect** — after a full boot→duel→LOST run, `localStorage` held only
  my own injected `muf_prefs`: **no `muf_scores_*`, `muf_progress = null`** (the f5bd0a0 fix holds).
- **E2E-3 — the differentiated duel (phase-2 dual rings → parry → phase-3 smoke/renfort →
  FINISHER → WON). [CI-DEFERRED-BLOCKED — see the hole below].**

**BLOCKING HOLE — C-QA2 [CLOSED at stage-5 close].** `dev-r3f-render` built the deterministic
state-seed capture seam I specced (`?preview=boss&at=phase2|phase3|finisher` + `&blownImmune=1`,
view-side pure-API fast-forward, shard §11) — phases 2/3/FINISHER are now e2e-reachable and
state-verified in-sandbox (evidence 20-39). The runtime differentiation reads are captured and were
run through Sacha's playtest + Tony's UX review + Nico's composite gate. See the STAGE-5 CLOSE audit
at the end of this plan for the final per-read disposition. The original hole text is retained below
for the record.

**BLOCKING HOLE — C-QA2 (as first raised at leg 1 — retained for the record).** The depletion-gated differentiation reads
(phase-2 dual rings, parry telegraph, stagger, phase-3 smoke, renfort edge, décor-armed, FINISHER,
WON, HP-bar zero-settle) could NOT be reached in the sandbox. Measured cause: **headless SwiftShader
renders at ~2 fps** (rAF probe = 2), so each ~1.6 s EXPOSED window gets ~2-4 sim ticks with the ring
jumping ~0.25-0.4 world-units/tick (≈ the `RING_HIT_RADIUS 0.30`), and the **blown-window LOST clock
(`maxBlownWindows 10`) trips before enough chips land to cross even the first HP threshold (16).** A
best-effort **aided-fire** attempt (self-calibrated world→screen aim off `__MUF_STATE__`, ~90 s) landed
only **4 HP (24→20)** before LOST at phase 1. This is a **harness/frame-rate limitation, not a
defect** — the pure logic behind every one of these reads is fully unit-proven (§3), and on a
real-GPU machine at 60 fps the seeded winnability test proves the fight is clearable. It means the
**runtime render / UX legibility** of the differentiation reads is **UNVERIFIED in the sandbox**.

→ **Correction routed (blocks the leg-2 VISUAL verification of phase-2+ reads, NOT the merge):** to
`dev-tooling-assets` (+ a small `dev-gameplay`/`dev-r3f-render` assist) — add a **deterministic
state-seed seam** so the depletion-gated reads become e2e-automatable at any frame rate, e.g.
`?preview=boss&at=phase2|phase3|finisher` (seed the boss ACTIVE at a pinned HP band) or a
`&blownImmune` harness flag that suppresses the LOST clock for capture. Same class as V1's C-QA1
correction, sharpened for the two-ring + parry + finisher reads.
→ **Escalated to `producer` (Marion) as CI-DEFERRED-BLOCKED** (CI Playwright hits the same
SwiftShader wall). **Only Bertrand waives.** Interim leg-2 path: Sacha's playtest + Tony's UX review
of phase-2+ reads run on a **real-GPU build** (branch preview `…/preview/claude-yo-pmnyzr/?preview=boss`
or local) until the seam lands.

**Evidence inventory (this leg):**

| File                           | State (state-verified via `__MUF_STATE__`)                               | Serves                               |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------ |
| `01-phase1-single-ring.png`    | ACTIVE, phase 0, EXPOSED, single green ring — **V1 regression baseline** | AC-D2 phase-1-identical; UX A15 base |
| `02-phase1-telegraph.png`      | ACTIVE, phase 0, SHIELDED, `telegraphActive` — the shoot tell            | UX A4 (shoot-tell reference); §5.6   |
| `11-lost.png`                  | phase LOST, `blownWindows 10`, HP still 20/24, ÉNERGIE ⚡0               | loss-clock read (not HP); §5.6       |
| `12-reduced-motion-phase1.png` | ACTIVE phase 0 EXPOSED under `prefers-reduced-motion: reduce`            | UX A7/A2 (phase-1 scope)             |
| `13-mobile-boot.png`           | boot, iPhone UA 844×390, boss present, no error                          | device fork (ADR-0003/0015)          |
| `14-mobile-phase1-ring.png`    | ACTIVE phase 0 EXPOSED, mobile zoom, ring legible at boss zoom           | UX A15 mobile base case              |

**Reduced-motion / mobile scope caveat (named, not hidden):** captures `12` and `14` cover the
**phase-1** reads only. The reduced-motion branches of the NEW reads (parry glyph steady, smoke
static veil, renfort held-edge, finisher wash steady — UX A7 for parry, A2 under smoke) and the
mobile legibility of the dual-ring / parry / finisher (UX A5/A15 for phase-2+) are inside C-QA2 and
are **DEFERRED** with it.

## 5. Exploratory charters (manual `verify`, real-GPU — leg 2 / deferred)

- **CH-1 (differentiation reads, AC-D1):** by phase 2 a visible targeting CHOICE (two rings), by
  phase 3 a parry beat, both on a telegraphed phase break — a playtester describes a different
  moment-to-moment than the hostage duel. **Blocked in sandbox (C-QA2); Sacha runs on real GPU.**
- **CH-2 (§5.6, AC-D7):** parry tell distinct from shoot tell BEFORE commit; renfort onset
  telegraphed; no un-signalled pattern at a break. **Deferred with C-QA2.**
- **CH-3 (K-5 seed feel):** the seeded winnability is unit-proven (§3); the empirical "each phase-2/3
  window presents a landable waypoint on EACH ring, each charged window a landable parry, the décor
  arm-window landable" is the runtime confirmation — **deferred with C-QA2**, Sacha re-pins if it
  reads wrong (spec's designated most-likely correction).
- **CH-4 (device fork, phase-2+):** dual-ring + parry + finisher legible at the boss zoom on mobile.
  **Deferred with C-QA2** (phase-1 mobile ring verified, `14`).

## 6. Device matrix

| Class                       | Boot (`?preview=boss`) | Phase-1 read | Reduced-motion (phase 1) | Phase-2+ differentiation reads |
| --------------------------- | ---------------------- | ------------ | ------------------------ | ------------------------------ |
| Desktop (1280×720)          | **GREEN** (`01`)       | **GREEN**    | **GREEN** (`12`)         | **HELD — C-QA2**               |
| Mobile (iPhone UA, 844×390) | **GREEN** (`13`,`14`)  | **GREEN**    | (deferred)               | **HELD — C-QA2**               |

## 7. Regression specs (V1 carryover + every escaped bug → a test)

- **R1 (byte-identity, GREEN):** `bossQteSpec === null` no-op — asserted in `stateMachine.test.ts`;
  the permanent guard that shipped levels stay inert. **Extended by ADR-0052 D5:** additive-optional
  (`decorProp` absent, no charged window, no surge, phase-1-only ⇒ byte-behaviour-identical) —
  asserted in the boss suite.
- **R2 (phase-1 byte-identical, GREEN):** phase 1 = single ring, `bossRingZoneAt` colour-by-position
  (`bossWander` delegates to `bossWanderBox` with full-anatomy amps ⇒ identical output — unit) AND
  runtime-observed (`01` shows the single V1 ring; state `pIdx 0` single `targetOffset`, `offB`
  parked at rest).
- **R3 (hostage QTE + Belliard live config untouched, GREEN by inspect + unit):** `qteSystem.ts` /
  `hostageQte.ts` byte-untouched (ADR-0052 D1, gameplay-lane boundary check); every shipped
  `LevelConfig` untouched — only the non-shipped `boss-harness` gained a `decorProp`. `stateMachine.ts`
  and all of `src/hooks` byte-untouched (the FINISHER↔camera type widening was in `qteCamera.ts` /
  render, not hooks — merge-gate note, shard §8). The 843/843 suite includes the unchanged hostage
  suites.
- **R4 (no persistence side-effect from the harness, GREEN):** runtime — after boot→duel→LOST,
  `localStorage` = only injected `muf_prefs`; no `muf_scores_*`, `muf_progress = null`. Inspect —
  App.tsx L216-222 scopes persistence to **membership-in-`LEVELS`**; `boss-harness` is a separate
  export, `findIndex = -1` → no write on ANY outcome (the f5bd0a0 fix). **Residual (named):** the
  **WON-path** persistence-inertness was not exercised at runtime (WON unreachable in sandbox, C-QA2)
  — covered by the App.tsx guard + the LEVELS exclusion + the unit byte-identity; runtime WON check
  **deferred with C-QA2**.
- **R5 (NEW regression spec → `dev-tooling-assets`, non-blocking):** once the C-QA2 state-seed seam
  lands, add e2e `E2E-BOSS-DIFF` asserting per phase: dual rings drawn phase 2+ / single phase 1;
  parry glyph form-distinct on charged windows; smoke veil ≤ capped alpha (telegraph still legible);
  renfort frame-edge motion with no shootable body; FINISHER distinct from `QTE_RESULT_HOLD` +
  « LIVRE LE SON »; HP-bar zero-settle — on BOTH device classes + reduced-motion. Verified by me next
  cycle.

## 8. Deliberately NOT covered (and why)

- Canon player-facing "le Commandant" + Niveau Final art (parry raised-weapon pose, two-ring form,
  finisher reach-for-radio pose, smoke-degraded salience, venue props) — art-flow deferred to the
  Niveau-Final story (ADR-0052 §7, N2 "no run ahead of need"); harness ships procedural/placeholder.
- Audio cues (8 new assets) — separate later licence-gated lane (ADR-0052 §7 audio-wiring call); no
  `playSfx` stubs this story (avoids the dead-path pattern the audio bible flagged).
- GPU frame-budget of the smoke on weak mobile — `gpu-specialist` verdict (shard §8): PERF PASS on
  the ≤6-quad technique; the marginal-ms + phase-3 median on weak mobile is DEFERRED-ON-TARGET
  (unmeasurable in SwiftShader; Bertrand runs). Not a QA-gate item; noted for coherence.

---

## STAGE-5 CLOSE — quality-gate funnel audit (qa-lead, 2026-07-20)

Written at gate close, after the full leg-2 + correction history ran (shard §11-§23). Every plan
line below is either **VERIFIED** (evidence + verdict named) or **DEFERRED** (deferral + owner named).
Nothing is silently assumed green.

### Mechanical gate — re-run at close (ALL GREEN)

| Check      | Command             | Result                                                                                                           |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Typecheck  | `yarn typecheck`    | **EXIT 0**                                                                                                       |
| Unit suite | `yarn vitest run`   | **847 / 847 PASS**, 64 files, EXIT 0 (grew 843→847 with the A1/A1-R2 vital-catch-radius tests; boss suite 62→66) |
| Lint       | `yarn lint`         | **EXIT 0**                                                                                                       |
| Format     | `yarn format:check` | **EXIT 0**                                                                                                       |

### Per-plan-line disposition

| Line                                          | Final status | Evidence / verdict (or deferral + owner)                                                                                                                                                                                                      |
| --------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 (tsc/vitest/lint/fmt; coverage ≥80%)       | **VERIFIED** | mechanical GREEN above; CI `test:coverage` gate authoritative for the 80% threshold                                                                                                                                                           |
| Q2 (L1 dual rings)                            | **VERIFIED** | unit (66-test suite) + e2e PNG `20` (dual rings) + Sacha AC-D2 PASS (§12/§19) + Tony D4.1/D4.5 PASS (§15/§23). **Amended:** per-ring `BOSS_VITAL_CATCH_RADIUS 0.11` (A1-R2, Karim §17 PASS, Sacha §19 re-verify PASS — camp dominance broken) |
| Q3 (L3 parry)                                 | **VERIFIED** | unit (cadence + floor asserts) + e2e PNG `21`/`33`/`28`/`29` + Sacha AC-D3 PASS + Tony D2.1 PASS after the parry-glyph salience fix (§16, glyph+halo above smoke)                                                                             |
| Q4 (L2 décor + smoke)                         | **VERIFIED** | unit (pure-upside, additive-optional) + e2e `22`/`27`/`30`-`32`/`34` + Sacha AC-D4/D5 PASS + Nico composite PASS (particle smoke `30-32`, décor dégradé `34` after the §2.1-aplat FAIL→fix)                                                   |
| Q5 (L5 FINISHER)                              | **VERIFIED** | unit (FINISHER-holds-freeze + interpose) + e2e `25`/`35` + Sacha AC-D5 PASS + Tony D3.1/D3.2 PASS + Nico composite PASS (`35` B&W after the sepia colour-law FAIL→fix)                                                                        |
| Q6 (L4 renfort)                               | **VERIFIED** | unit (surge range + D4 boundary assertion) + e2e `23` + Sacha AC-D6 PASS (−12 single charge, loss-clock +1 exactly, no double jeopardy)                                                                                                       |
| Q7 (§5.6 attributability)                     | **VERIFIED** | unit (telegraph floors, monotonic ledger) + Sacha AC-D7 PASS + Karim gate §5.6 checks (§13/§17)                                                                                                                                               |
| Q8 (boundary/determinism)                     | **VERIFIED** | unit (byte-identity, source scan) + boundary diff (below): `stateMachine.ts`, hostage system byte-untouched; seeded-pure                                                                                                                      |
| Q9 (legibility, reduced-motion, mobile 44×44) | **VERIFIED** | Tony UX review PASS on both device classes (§23), incl. the mobile small-ring FAIL (§20) → architect ruling (§21) → frame-lift fix (§22) → **RE-VERDICT PASS** (§23). Reduced-motion `27`/`32`. Finisher full-frame click ≫44px               |
| Q10 (boot both classes, no pageerror)         | **VERIFIED** | e2e `01`/`13`/`14` (leg 1) + all §11/§20/§22 captures, zero pageerror                                                                                                                                                                         |
| Q11 (no shipped reach; persistence inert)     | **VERIFIED** | e2e persistence-inert (leg 1) + `LEVELS` exclusion (inspect) + boundary diff: only the non-shipped harness `decorProp` added to `levels.ts`                                                                                                   |

### Regression lines (re-verified mechanically at close vs `origin/main`)

| Reg                                                        | Status                | Proof                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1 (byte-identity `bossQteSpec===null`; additive-optional) | **VERIFIED**          | unit guard (`stateMachine.test.ts`) + boss suite additive-optional tests, green in 847/847                                                                                                                                                                                                                                                                                                                                                             |
| R2 (phase-1 byte-identical)                                | **VERIFIED**          | unit (`bossWander`→`bossWanderBox` identical output) + e2e `01`                                                                                                                                                                                                                                                                                                                                                                                        |
| R3 (hostage QTE + stateMachine untouched)                  | **VERIFIED**          | `git diff origin/main...HEAD` = **zero** diff on `qteSystem.ts`, `hostageQte.ts`, `types/hostageQte.ts`, `stateMachine.ts`. NOTE (updated from leg 1): `src/hooks/useGameLoop.ts` DID change (+52: the C-QA2 boot seam §11 + the §22 mobile frame-lift) — ruled render-owned bridge code consuming the `{anchor,…}` data contract UNCHANGED (architect §21, no game/hooks CONTRACT crossing); stage-6 architect integration review owns final sign-off |
| R4 (harness persistence inert, f5bd0a0)                    | **VERIFIED**          | runtime (leg 1: no `muf_scores_*`, `muf_progress=null`) + App.tsx L216-222 `LEVELS`-membership guard (inspect). WON-path runtime now reachable via the seam — no persistence write observed (harness excluded from `LEVELS`)                                                                                                                                                                                                                           |
| R5 (shipped LevelConfigs untouched)                        | **VERIFIED**          | `levels.ts` diff = only the non-shipped `boss-harness` `decorProp` (+6 lines); no belliard/stalingrad/vitry config touched                                                                                                                                                                                                                                                                                                                             |
| E2E-BOSS-DIFF (new regression, was §7 R5)                  | **IMPLEMENTABLE now** | the C-QA2 seam (§11) makes it automatable; spec stands for `dev-tooling-assets` next cycle                                                                                                                                                                                                                                                                                                                                                             |

### Gate-verdict ledger for stage-6 (every needed verdict logged + final PASS)

| Gate                               | Owner                      | Final verdict                                                                                           | Shard                      |
| ---------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------- |
| Design acceptance (AC-D1..D8)      | game-designer (Sacha)      | **PASS** (after PASS-WITH-CORRECTIONS §12 → A1 re-verify FAIL §15 → A1-R2 §19)                          | §19                        |
| Design gate (lever-1 correction)   | lead-game-designer (Karim) | **PASS** (A1 §13, A1-R2 round 2 §17)                                                                    | §13, §17                   |
| UX review (A1–A15, both classes)   | ux-designer (Tony)         | **PASS** (after PASS-WITH-CORRECTIONS §15 → mobile FAIL §20 → RE-VERDICT §23)                           | §23                        |
| Composite Gate-4 (runtime visuals) | lead-art (Nico)            | **PASS** (after FAIL on `24`/`25` → particle smoke + décor dégradé + B&W finisher → RE-VERDICT `30-35`) | §21 (composite re-verdict) |
| Perf (smoke technique)             | gpu-specialist (Ben)       | **PERF PASS** (particle bounds CAP-A..E) + **DEFERRED-ON-TARGET** (on-device ms)                        | §18                        |
| Architect render-scale ruling      | senior-architect (Winston) | RULING (mobile frame-lift, render-lane)                                                                 | §21                        |

### Deferral list (explicit, with owner — the honest holes in the funnel)

1. **DEFERRED-ON-TARGET — smoke marginal-ms + phase-3 median/p95 on weak mobile.** Unmeasurable in
   SwiftShader (particle overdraw needs silicon). Owner: **Bertrand executes** the on-device run;
   `producer` chases; thresholds per Ben §18 (mobile marginal ≤~1.5 ms, median ≤33.3 ms, p95 ≤~40 ms).
   Not a sandbox-runnable check — CI-DEFERRED, only Bertrand closes.
2. **DEFERRED — audio wiring (8 cues).** Deferred by ADR-0052 §7 (separate licence-gated
   `dev-tooling-assets`→`dev-r3f-render` lane; no `playSfx` stubs this story). Owner: `producer`
   sequences post-merge. Out of this story's scope by design.
3. **DEFERRED (code-inferred, not captured) — phase-1→2 split-preview "new pattern" cue (D4.7/A14).**
   The `?preview=boss&at=…` seam fast-forwards THROUGH the phase-1→2 break, so this window is not
   screenshot-reachable. Tony confirmed the fix coverage by source read (`BossQteSprite.tsx:589`
   split-preview uses `ringGeoVital` + the frame-lift covers its position); code-level coverage
   unambiguous, held CLOSED-by-inspection, not by capture. Owner: `dev-tooling-assets` if a future
   reviewer wants a capture (small harness extension to stop inside the break).
4. **DEFERRED — canon boss art (Niveau-Final).** Placeholder/procedural this story (ADR-0052 §7 N2);
   `enemy_riot` fallback. Owner: `lead-art` when the Niveau-Final story opens.

### Scope-bleed finding (routed to producer + stage-6 architect triage — NOT a defect in this pack)

The branch `git diff origin/main...HEAD` also carries **concurrent NIVEAU-FINAL work** that is NOT
part of STORY-BOSS-QTE-DIFFERENTIATION and NOT covered by this gate: `src/game/levels/levelArt.json`
(+39: plainclothes-BAC boss redesign + differentiation-pose + hall-prop PROMPT strings, ADR-0053,
gated under that story's own lead-art PROMPT GATE) and `public/adr/index.html` (ADR-0053 index row).
Prompt strings only — no generation dispatched, no runtime effect (harness uses the fallback sprite),
so no runtime regression risk to this pack. Flagged so the stage-6 panel (which reads the WHOLE diff)
and `senior-architect`'s integration triage decide whether the two stories merge together or split —
`producer`'s branch-hygiene call, explicitly not mine.

### CLOSING VERDICT

The plan ran and held. Mechanical gate GREEN (847/847), all eleven acceptance lines VERIFIED, all five
regression lines VERIFIED, all four stage-6 gate verdicts logged and PASS (Sacha design-acceptance,
Tony UX, Nico composite, Ben perf-pre-close), every deferral explicit with an owner. The one
CI-DEFERRED item (Ben's on-device ms) and the scope-bleed finding are named and routed, neither
deadlocks the gate. **The quality gate PASSES — stage-6 (the 4-reviewer merge panel) is open.**

**VERDICT: PASS — quality gate (qa-lead)**
