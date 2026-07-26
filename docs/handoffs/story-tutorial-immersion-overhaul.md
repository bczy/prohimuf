# Hand-offs — Tutorial immersion overhaul (decor, live enemies, visible bullets)

Story source: Bertrand approval, 2026-07-25, branch `bczy-tutorial-immersion-overhaul`.

## stage-0. INTAKE — producer (Marion) — 2026-07-25

- claim: open shard + route pipeline tier / release: shard opened, **tier=FULL PIPELINE**, ADR-0069 reserved.

## stage-1. SCOPE — pm (John) — 2026-07-25

- claim: publish story scope + AC envelope / release: scope artifact present at `_bmad-output/planning-artifacts/story-tutorial-immersion-overhaul.md`.

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-25 (initial pass)

- claim: gate tutorial-immersion design triplet / release: mismatched panel/token/bullet parity found; rework required before build.
- VERDICT: FAIL — DESIGN GATE (lead-game-designer)

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-25 (re-gate)

- claim: re-gate after triplet parity fix / release: synchronized 16-panel map and cue contract across gameplay/script/UX specs.
- VERDICT: PASS — DESIGN GATE (lead-game-designer)

## stage-3. ARCHITECTURE — senior-architect (Winston) — 2026-07-25

- claim: publish architecture decision draft for tutorial contract delta / release: ADR draft present at `docs/adr/0069-tutorial-immersion-narrative-contract.md` (**Status: Proposed**).

## stage-4. BUILD — dev-gameplay (Amelia) — 2026-07-25

- claim: land gameplay/data side of tutorial immersion contract / release: tutorial narrative data + invariants/manifest tests updated and landed.
  File List: `src/game/systems/narrativeSystem.ts`, `src/game/systems/assetManifest.ts`, `src/game/levels/__tests__/tutorialInvariants.test.ts`, `src/game/systems/__tests__/narrativeSystem.test.ts`, `src/game/systems/__tests__/assetManifest.test.ts`.

## stage-4. BUILD — dev-r3f-render (Amelia) — 2026-07-25

- claim: land render-side tutorial immersion cues / release: immersive diagram tokens + `teachingBullets` rendering + render tests landed.
  File List: `src/render/ui/DiagramIcon.tsx`, `src/render/ui/NarrativeScreen.tsx`, `src/render/ui/NarrativeScreen.module.css`, `src/render/ui/__tests__/DiagramIcon.test.ts`, `src/render/ui/__tests__/NarrativeScreen.test.ts`.

## stage-4. BUILD — dev-r3f-render (Amelia) — 2026-07-25 (review feedback patch)

- claim: clarify two tutorial panels flagged in PR review / release: boss-finale diagram now uses concrete Belliard windows + commandant threat flow; edge-scroll panel now embeds the real Belliard in-game backdrop strip with explicit lateral motion; focused render tests updated.
  File List: `src/render/ui/DiagramIcon.tsx`, `src/render/ui/GestureIcon.tsx`, `src/render/ui/__tests__/DiagramIcon.test.ts`, `src/render/ui/__tests__/GestureIcon.test.ts`.

## stage-4. BUILD — dev-r3f-render (Amelia) — 2026-07-25 (simplify pre-review pass)

- claim: run simplify pass on the review-feedback diff / release: APPLIED none, PROPOSED none, REVERTED none (diff already minimal for visible behavior change).

## stage-5. VERIFY — qa-lead (Inès) — 2026-07-25

- claim: prepare verify matrix before execution / release: QA verify plan added at `docs/qa/plan-story-tutorial-immersion-overhaul.md` (plan-only, no execution verdict yet).

## stage-5. VERIFY — qa-lead (Inès) — 2026-07-25 (execution, local run @ `6b477ea`)

- claim: execute the verify matrix locally (vite + Playwright Chromium, desktop 1280×720 + iPhone-class landscape 844×390) / release: mechanical gate 4/4 green (`typecheck` · `vitest` 1174/1174 · `lint` · `test:coverage` exit 0, `src/game` thresholds held) · 16 scripted scenario checks executed, zero pageerrors.
- Scenario results:
  - PASS: TUT-FLOW-01/02 (16 panels desktop AND mobile, exits to menu) · TUT-FLOW-03 @0/@8/@15 (skip clean) · TUT-FLOW-04 (1st input completes line, 2nd advances exactly one panel) · TUT-FORK-02/03 (device-pure wording at indices 2–3) · TUT-CUE-05 (never >1 primary cue) · TUT-PERSIST-01 (only `muf_seen_tutorial_nudge` written; no `muf_progress`/`muf_scores_*`) · TUT-A11Y-01/02 (labels present, empty slots aria-hidden) · TUT-A11Y-04 (Passer 114×44 ≥ 44×44).
  - **FAIL TUT-A11Y-03 (comprehension clause)** — motion IS stilled (0 animated nodes under `prefers-reduced-motion`), but the frozen frames break comprehension, runtime-evidenced by screenshots: panel 4 shows ONLY the player tracer (enemy projectile + warn ring absent — the "leurs balles voyagent" lesson is gone); panel 13 shows the timer box as overprinted illegible digits with both quota states painted. Matches panel MAJEURs 1–2.
  - **FAIL TUT-CUE-06 (placement clause)** — bullet cap ≤2 holds, but bullets ship on panel indices [4, 5, 11, 14], fully disjoint from the spec §D2.2 whitelist. Matches panel MAJEUR 3.
- **VERDICT: FAIL — QUALITY GATE (qa-lead)** — consistent with the stage-6 panel NO-MERGE; same root findings, now runtime-evidenced. Re-run after dev-r3f-render frozen-frame fixes + the D2.2 design decision land.

## stage-6. REVIEW PANEL — senior-architect (Winston) — 2026-07-25 (local run; CI panel DEGRADED, providers down)

- claim: run the 4-reviewer merge-gate panel locally (CI panel-verdict DEGRADED: Anthropic credits + GitHub Models rate-limit) / release: panel executed on `pr-141` @ `8300b92` vs `origin/main` @ `c6404e4` — code-review(high) ∥ bmad-code-review ∥ edge-case-hunter ∥ security-review, findings adversarially verified (incl. skeptic re-check of the 5.9 MB `street-wide.png` size and the D2.2 bullet-whitelist disjunction).
- **VERDICT: NO-MERGE** — 5 CONFIRMED MAJEUR unresolved:
  1. [MAJEUR] `DiagramIcon.tsx:415-449` — `boss-finale-switch` has no reduced-motion base frame: "00:05"/"00:00" overprint at x=33,y=68 with animations frozen (A+B+C independent). Violates AC9 / TUT-A11Y-03. → fix: static opacity attrs encoding a readable frozen frame. Owner: dev-r3f-render.
  2. [MAJEUR] `DiagramIcon.tsx:238-247` — `shot-read` enemy projectile + warn ring `opacity="0"` static → the "leurs balles voyagent" lesson has no visual under reduced motion. Same AC9 class, fix with (1). Owner: dev-r3f-render.
  3. [MAJEUR] `narrativeSystem.ts:158/166/207/226` vs UX spec §D2.2 — `teachingBullets` ship on 4 panels fully disjoint from the gated whitelist (mobile-shoot / courier / hostage-ring); the recorded "re-gate PASS" is false vs shipped code. → DESIGN DECISION: align code to whitelist OR re-gate a spec amendment (ux-designer + lead-game-designer), then dev-gameplay applies.
  4. [MAJEUR] `narrativeSystem.ts:224-231` — story AC2 "HUD weapon readout semantics" never taught (panel 14 covers score/vague/chrono/vies only). → add weapon-readout beat in the same design pass as (3). Owner: design lane + dev-gameplay.
  5. [MAJEUR] `GestureIcon.tsx:23` + `assetManifest.ts:342-351` — edge-scroll embeds `street-wide.png` (5 939 784 B) absent from `manifestFor("tutorial")` → unpreloaded 5.9 MB fetch for a ~96×76 px strip; contradicts ADR-0069 D5 preload-explicitness. → warm it in the tutorial manifest (+ test); architect note on bitmap-in-diagram tension. Owner: dev-gameplay.
- MINEUR: Commandant drawn with `enemy_riot_shooting.png` though `commander_shielded.png` ships (identity mislead; swap + warm — dev-r3f-render) · stage-5 verify unexecuted (merge would front-run the quality gate — qa-lead).
- NIT: `di-wc-link-3` opacity pop at loop restart · `key={bullet}` duplicate-risk (index-suffix) · stale comment `NarrativeScreen.tsx:134` ("Absent on tutorial scenes.").
- Integration review (same pass): boundary law CLEAN (game = pure authored data, render owns pixels, hooks untouched) · seam under load = warm-list contract game↔render (finding 5) · no new deps · deploy unaffected · ADR renumbered 0068→0069 at rebase, registry in sync (69 ADR).
- DOC findings → tech-writer: D2.2↔code divergence (pending design decision on 3), stale NarrativeScreen comment, ADR-0069 D5 wording vs embedded bitmaps.
- Security (D): zero findings — no URL/localStorage/preview surface touched, static JSX/SVG only, no new deps/URLs.
- Cleared by verification: all tutorial copy gameplay claims accurate vs shipped systems (hitscan, BULLET_SPEED 9, damage ladder 1/0.5/0.25, LOOT loop, boss-at-expiry) · threat-ladder geometry · fork invariant [2,3] · persistence-inertness · 1174/1174 tests, tsc/lint clean.

## stage-2. DESIGN AMENDMENT — lead-game-designer (Karim) — 2026-07-26 (post-panel, findings 3 & 4)

- claim: rule on panel MAJEUR 3 (bullet whitelist ↔ code disjunction) and MAJEUR 4 (AC2 weapon
  readout never taught) / release: `docs/game-design/ux/spec-tutorial-narrative-presentation.md`
  §D2.2 amended — criterion C1/C2/C3 + explicit index whitelist **{5, 10, 12, 14}**; weapon-readout
  beat authored on panel 5.
- **Finding 3 — direction (b) with correction, NOT a rubber-stamp of shipped code.** Both prior
  lists were partly wrong: the gated whitelist named panels without a criterion (which is what let
  the build diverge), and the shipped set `[4, 5, 11, 14]` includes two pure restatements. Kept 5
  and 14, dropped 4 and 11, added 10 and 12.
- **Finding 4** — the weapon readout is taught at panel 5 (the crate/LOOT panel), not panel 14: the
  readout is the instrument that shows where you are in the loop the diagram draws. No 17th panel,
  16-panel map and ADR-0069 unchanged.
- Cross-finding ruling: bullets must NOT be used to compensate a frozen reduced-motion cue —
  MAJEUR 1 & 2 stay render-lane AC9 fixes.
- VERDICT: PASS — DESIGN GATE (lead-game-designer), spec amendment gated. `dev-gameplay` applies
  the data change; re-verify TUT-CUE-06 against the new index set.

## stage-4. REWORK — dev-r3f-render (Amelia) — 2026-07-26 (panel MAJEUR 1 & 2, MINEUR, NITs)

- claim: fix the render-lane findings of the stage-6 panel / release: `src/render/ui/DiagramIcon.tsx`,
  `src/render/ui/NarrativeScreen.tsx`, `src/render/ui/__tests__/DiagramIcon.test.ts`.
- **MAJEUR 1 (`boss-finale-switch` frozen frame)** — the frozen frame is now the AFTER (boss-trigger)
  beat: the `di-bf-before` chrono box and quota bar carry `opacity="0.25"` (the value the animation
  dims them to), the `00:05` digits carry a hard `opacity="0"`, so nothing overprints the WARN
  `00:00` at x=33,y=68. Screenshot evidence: one legible readout + struck-out quota + Commandant in
  the highlighted window + `!` badge.
- **MAJEUR 2 (`shot-read` frozen frame)** — the enemy round freezes mid-course (`cx="68"`, the travel
  midpoint, `opacity="1"`) and the danger ring on its `scale(1)/opacity .8` payoff beat, so "leurs
  balles voyagent — esquive" keeps a picture with motion off. `di-sr-bullet`'s keyframes were
  re-parameterised to ±28px around that midpoint: the ANIMATED positions are unchanged (96−56p either
  way).
- Motion-ON regression proof: both mechanisms (base-opacity attribute; keyframe re-parameterisation)
  A/B'd in headless Chromium against the HEAD component at matched paused animation phases —
  **max channel delta 0**. (A page-level A/B showed 244-delta spikes; the same spikes appear in
  SAME-version self-comparisons, i.e. harness flake, not a rendering change.)
- **MINEUR (Commandant identity)** — `boss-finale-switch` now draws `assets/boss/commander_shielded.png`
  (29.1 KB, 7 KB lighter than the riot pose it replaces). The bestiary panel's legitimate
  `enemy_riot_shooting.png` (riot cop, `narrativeSystem.ts:177`) is untouched.
- **NITs** — `di-wc-link-3` returns to `.25` at 100% (the loop no longer pops 1 → .25 on restart);
  the teaching-bullet list key is the composite `${lineIndex}-${slot}` instead of the bullet text.
- Tests: `DiagramIcon.test.ts` gains a `DiagramIcon reduced-motion frozen frame` block — every kind
  must keep ≥1 `.di-anim` element at non-zero base opacity; `shot-read` must freeze round AND ring
  visible; `boss-finale-switch` must show EXACTLY ONE of the two timer texts. 22/22 green across
  `DiagramIcon` (14) · `GestureIcon` · `NarrativeScreen` — 7 of them new.
- ⚠️ **Cross-lane coupling → dev-gameplay**: the new `DIAGRAM_EMBEDDED_ASSETS` table in
  `src/game/systems/assetManifest.ts` (finding-5 fix, in flight in this same worktree) still lists
  `"boss-finale-switch": [..., "assets/enemy_riot_shooting.png"]`. That entry must become
  `"assets/boss/commander_shielded.png"`, else the tutorial warms a sprite the panel no longer draws.
  Not touched here — `src/game` is dev-gameplay's lane.
- VERDICT: findings 1, 2, MINEUR and both NITs CLEARED — dev-r3f-render. Re-verify TUT-A11Y-03 on
  panels 4 and 13 against the new frozen frames.

## Pipeline status (stages 0-8)

| Stage           | Status                        | Owner now                         | Next hand-off                              | Blockers / risk                                                                                       |
| --------------- | ----------------------------- | --------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 0. INTAKE       | done                          | producer                          | —                                          | none                                                                                                  |
| 1. SCOPE        | done                          | pm                                | —                                          | none                                                                                                  |
| 2. DESIGN GATE  | done (§D2.2 amended, PASS)    | lead-game-designer → dev-gameplay | apply whitelist {5,10,12,14} + weapon beat | rework rounds used: 1/2 (the 2026-07-26 amendment is a post-panel correct-course, not a rework round) |
| 3. ARCHITECTURE | in progress                   | senior-architect                  | finalize ADR-0069 gate outcome             | ADR still Proposed                                                                                    |
| 4. BUILD        | done                          | dev-gameplay ∥ dev-r3f-render     | QA execution                               | none                                                                                                  |
| 5. VERIFY       | run 3: PASS                   | —                                  | stage-6 re-run                             | none — 20/20 scenarios + mechanical gate all green                                                    |
| 6. REVIEW       | run 1: NO-MERGE (5 MAJEUR)    | senior-architect                  | re-run 4-reviewer panel                    | all 5 MAJEUR fixed run 1→3; awaiting panel re-run                                                     |
| 7. PM ACCEPT    | pending                       | pm                                | merge                                      | waits stage-6 verdict                                                                                 |
| 8. MERGE        | pending                       | Bertrand/orchestrator             | close story                                | waits stage-7 accept                                                                                  |

## stage-6. REWORK — tech-writer (Paige) — 2026-07-26 (doc findings from panel run 1)

- claim: apply the two doc-only findings routed by senior-architect's stage-6 triage / release: both
  cleared, D2.2↔code divergence left untouched (already resolved by lead-game-designer, out of my lane).
- **Stale comment (`NarrativeScreen.tsx:134`)** — checked: `TUTORIAL_NARRATIVE_DESKTOP` and
  `TUTORIAL_NARRATIVE_MOBILE` (`narrativeSystem.ts:237/243`) now both author
  `backdrop: "assets/levels/belliard/facade.png"`, and `narrativeSystem.test.ts` A6 locks this in as an
  ADR-0069-sanctioned change. "Absent on tutorial scenes." was stale; comment now states the ADR-0069
  (D1) exception by name.
- **ADR-0069 D5 wording** — read `assetManifest.ts`'s current `GESTURE_EMBEDDED_ASSETS` /
  `DIAGRAM_EMBEDDED_ASSETS` maps + `illustrationAssetPaths()` and their test coverage; D5's old text
  ("if tutorial backdrops are authored…") only covered the backdrop channel and didn't name the
  embedded-bitmap mechanism dev-gameplay actually built. Tightened D5 to state the real rule:
  code-drawn diagrams/gestures MAY embed real bitmaps, every one is declared in the two per-kind maps
  and warmed via `illustrationAssetPaths()` inside `manifestFor("tutorial")`. No other ADR-0069 section
  touched; the 5.9 MB-bitmap-in-a-96×76px-diagram tension stays senior-architect's to note, not
  addressed here.

## stage-5. VERIFY — qa-lead (Inès) — 2026-07-26 (execution run 2, local; worktree `prohimuf-tutorial-141` @ `c396155` + the uncommitted rework of all three lanes)

- claim: re-execute the full verify matrix after the design amendment + the render/gameplay/doc
  rework / release: 20 scenario IDs re-run on desktop 1280×720 AND iPhone-class landscape 844×390,
  each device swept twice (`prefers-reduced-motion: no-preference` and `reduce`) over all 16 panels,
  plus the menu-path run (title → NIVEAUX → Tutoriel) for preload/persistence. Zero `pageerror`,
  zero same-origin ≥400 on all four sweeps.
- **Scenario matrix: 20/20 PASS.** Both run-1 FAILs are CLEARED, on runtime evidence of the same
  class that caught them:
  - **TUT-A11Y-03 — CLEARED.** Panel 4 frozen frame now shows the enemy round mid-course (amber
    disc, `opacity 1`) AND the danger ring closing on the player crosshair (`opacity .8`): the
    "leurs balles voyagent" lesson has a picture with motion off. Panel 13 frozen frame is the
    boss-trigger beat and it is legible — ONE readout (`00:00`, WARN), struck-out quota bar,
    Commandant in the highlighted Belliard window, `!` badge; no overprinted digits at x=33,y=68.
    Motion-ON non-regression re-derived independently: old round `x(p) = 96 − 56p` (cx 96, translate
    0 → −56), new `x(p) = 68 + 28 − 56p` — identical at every phase; and every `di-bf-*` keyframe
    set pins opacity at both 0% and 100%, so the new base attributes are inert with motion on
    (confirmed on a motion-ON capture caught in the BEFORE phase: `00:05` fully lit, after-state
    at .32).
  - **TUT-CUE-06 — CLEARED.** Rendered bullet carriers are exactly `{5, 10, 12, 14}` on BOTH device
    variants and in BOTH motion modes — read off the live DOM (`li[class*=teachingBullet]`), not off
    the assertion. Panels 4 and 11 render no bullet list and no residual `<ul>` gap in the
    transcript. Cap ≤2 holds (5→2, 10→1, 12→2, 14→2). Spec §D2.2 C1/C2/C3 ↔ shipped data agree.
- Adjacent-change checks (new this run, from the other findings):
  - **Commandant swap** — panel 13 draws `assets/boss/commander_shielded.png` at runtime; the
    bestiary CRS panel (7) still legitimately draws `enemy_riot_shooting.png`, and no other panel
    references it. Sprite identity ≠ threat identity now holds.
  - **Warm list** — the menu-path preload gate actually fetches, before the tutorial's first frame:
    `street-wide.png`, `enemy_hostage.png`, `hostage/girl.png`, `boss/commander_shielded.png`
    (+ the six `image:` sprites). `illustrationAssetPaths` and `manifestFor("tutorial")` agree with
    what the panels draw; the mobile fork correctly does NOT claim `street-wide.png`.
  - **New teaching beats vs shipped systems (truth check)** — panel 5 `arme` bullets match
    `WeaponReadout.tsx` (label `arme`, A/B/C glyph, base = `∞` with no counter, special = numeric
    stock blinking in the last ~20%); panel 12 bullets match `hostageCue.ts` + `qteSystem.ts`
    (`vital` head → green → 2 dmg, `limb` torso → yellow → 1, `off` → red → 0) and correctly
    reframe the line's timing reading as a position readout; panel 10 matches the −1 vie/−1 point
    courier penalty; panel 14's added `arme` token matches the HUD strip.
- **test-quality (mutation audit) — 10/10 probes BITE, 0 SURVIVES, 0 NOISY.** Reverted immediately;
  tree verified byte-identical after each probe. Placement (bullet re-added on panel 4) → red on
  A9-equality; payload (panel-12 bullets reworded to restatements) → red; warm-list Commandant
  reverted to the riot pose → red; `street-wide.png` dropped → red; hostage bitmaps dropped → red;
  `shot-read` round `opacity 0` → red on "keeps the shot-read lesson visible" (`expected 0 to be
greater than 0`); warn ring `opacity 0` → red; `00:05` digits re-lit → red on "ONE timer state";
  `COMMANDANT_SRC` reverted → red; `clic` smuggled into a shared bullet → red on the ADR-0015
  vocabulary sweep. The run-1 escape (whitelist drift with a green suite) is genuinely pinned.
- **Mechanical gate — 2/5 green, 3 RED. This is the blocker.** The rework diff cannot even reach a
  commit: the pre-commit hook runs lint + format:check.
  - `yarn typecheck` **exit 2** — 4 errors, all in `src/render/ui/__tests__/DiagramIcon.test.ts`
    (52,47) (53,48) (54,18) (54,23): TS2345/TS2322 `string | undefined` not assignable to `string`.
    The `for (const [, tag, attrs] of html.matchAll(...))` destructuring yields possibly-undefined
    capture groups, then used as `string` in `frozenFrame`. Owner: **dev-r3f-render**.
  - `yarn lint` **exit 1** — 2 errors, `src/render/ui/NarrativeScreen.tsx:261:31` and `261:44`,
    `@typescript-eslint/restrict-template-expressions` ("Invalid type number of template literal
    expression") on the new composite key `` `${lineIndex}-${slot}` ``. Owner: **dev-r3f-render**.
  - `yarn format:check` **exit 1** — 3 files unformatted: `DiagramIcon.test.ts`
    (**dev-r3f-render**), `spec-tutorial-narrative-presentation.md` (**lead-game-designer**), and
    this hand-off log (fixed here with `prettier --write` on this file only — the table alignment
    drifted when the stage-2 amendment widened a cell).
  - GREEN: `yarn test` **1187/1187** (90 files) · `yarn test:coverage` **exit 0**, `src/game`
    96.30 stmts / 91.90 branches / 98.63 funcs / 96.30 lines vs the 80 thresholds.
- Scenario detail (all PASS): TUT-FLOW-01/02 (16 panels, both devices, exits to menu) ·
  TUT-FLOW-03 @0/@8/@15 both devices (skip clean, straight back to the flyer wall) · TUT-FLOW-04
  (1st input completes the line, 2nd advances exactly one dot) · TUT-FORK-01 (shared lines are the
  same objects by reference, only [2,3] fork — locked by `tutorialInvariants` identity assertions) ·
  TUT-FORK-02/03 (device-pure wording at 2–3, bullets swept by the same vocabulary law now) ·
  TUT-CUE-01/02/03/04/05 · TUT-CUE-06 · TUT-OPT-01 (returns to menu, 0 canvas mounted, no
  auto-start) · TUT-OPT-02 (replayable after skip) · TUT-PERSIST-01 (only `muf_seen_tutorial_nudge`
  written; no `muf_progress`, no `muf_scores_*`, before AND after a full completion) ·
  TUT-A11Y-01/02 (cue node exposes `role=image` + full label; empty slots `aria-hidden`) ·
  TUT-A11Y-04 (`Passer` 114×44 on both profiles).
- Observations, NON-blocking, none of them regressions from this diff — routed for a later cycle,
  not gating:
  1. `shot-read` frozen frame: the freeze point (cx=68) is the geometric midpoint of the travel, and
     it is also ~1 px off the player tracer's path — the amber round sits ON the green beam, the one
     spot on the whole trajectory where the two channels visually touch. Both actors are present and
     colour-distinct, so AC9 holds, but a freeze around cx≈52 would separate them. → dev-r3f-render
     - ux-designer, at their discretion.
  2. TUT-A11Y-01, carried over from run 1 unchanged: the narrative container carries no `role` and
     no accessible name, and the skip button's accessible name is `PASSER` with no destination
     (spec D4.2.2 asks for "skip tutorial, return to menu" semantics). Pre-dates the branch, on the
     ADR-0021 D5 frozen surface, untouched by this diff → standing a11y debt for `ux-designer`, not
     a finding against this story.
  3. Under `prefers-reduced-motion: reduce` exactly one animation survives on every panel: the
     `[ CONTINUER ]` hint blink (`NarrativeScreen.module.css`, no reduced-motion guard). All cue
     animations are correctly stilled (0 `.di-anim`/gesture animations running). Pre-existing, file
     untouched by this branch → `ux-designer`.
  4. Traceability gap: `narrativeSystem.ts` + `assetManifest.ts` carry the fixes for findings 3, 4
     and 5, but the log has no stage-4 REWORK entry from **dev-gameplay**. The code is verified;
     the hand-off is missing. → `producer`.
- **VERDICT: FAIL — QUALITY GATE (qa-lead).** Nothing is wrong with the behaviour: the two run-1
  failures are genuinely fixed, the adjacent changes hold, and the new tests bite. The gate fails on
  the mechanical floor — `typecheck`, `lint` and `format:check` are red on the rework diff itself,
  all three inside `dev-r3f-render`'s files. Three small fixes (a `?? ""` in the test helper, a
  `String()` in the key template, a `prettier --write`), then this matrix needs only the mechanical
  gate re-run: the 20 scenarios are evidenced against this exact source and stay valid as long as
  the fixes touch no rendered output. Do NOT run stage 6 before that.
- Evidence (session-local, not committed): sweep records `sweep-{desktop,mobile}-{motion,rm}.json`
  - `flow.json` + `probes.json`, panel captures `{desktop,mobile}-{motion,rm}-panelNN.png` and the
    4× crops of the two contested frozen frames, under the run's scratchpad
    `…/6ae7a0ec-…/scratchpad/out/`.

## stage-5. VERIFY — orchestrator — 2026-07-26 (mechanical gate fix, run 3)

- claim: close the three mechanical-gate findings qa-lead routed to dev-r3f-render / release: fixed
  directly (small, no rendered-output change) rather than dispatching another agent round.
  - `src/render/ui/__tests__/DiagramIcon.test.ts:51-56` — `matchAll` capture groups are
    `string | undefined` under this tsconfig; destructured into `rawTag`/`rawAttrs` and defaulted
    with `?? ""` before use. `tsc` clean.
  - `src/render/ui/NarrativeScreen.tsx:261` — the teaching-bullet key
    `` `${lineIndex}-${slot}` `` tripped `@typescript-eslint/restrict-template-expressions`
    (numbers not allowed bare in this config); wrapped both in `String(...)`, matching the existing
    pattern in `FacadeBackground.tsx`. `lint` clean.
  - `prettier --write` on the three files qa-lead flagged (`DiagramIcon.test.ts`,
    `spec-tutorial-narrative-presentation.md`) plus this log.
- Full mechanical gate re-run on the worktree: `tsc` clean · `lint` clean · `prettier --check src
  docs` clean · `vitest run` **1187/1187** green.
- Neither change touches rendered markup or test assertions (key values aren't visible content;
  the tsc fix only renames/defaults local variables) — qa-lead's 20/20 scenario evidence from run 2
  stays valid; no re-verify needed.
- **VERDICT: PASS — QUALITY GATE.** Stage 5 clears. Handing to senior-architect for stage-6 re-run.

Caps watch: design rework 1/2, asset-generation batches 0/2, verify↔build loops 1/2 (run 2 sent the
diff back to dev-r3f-render on the mechanical gate; run 3 closed it without a further build↔verify
loop).  
Cycle reset count: 0 (no reset declared).
