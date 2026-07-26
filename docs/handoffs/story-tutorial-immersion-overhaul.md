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

| Stage           | Status                                                                      | Owner now                         | Next hand-off                              | Blockers / risk                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0. INTAKE       | done                                                                        | producer                          | —                                          | none                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1. SCOPE        | done                                                                        | pm                                | —                                          | none                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2. DESIGN GATE  | done (§D2.2 amended, PASS)                                                  | lead-game-designer → dev-gameplay | apply whitelist {5,10,12,14} + weapon beat | rework rounds used: 1/2 (the 2026-07-26 amendment is a post-panel correct-course, not a rework round)                                                                                                                                                                                                                                                                                                                    |
| 3. ARCHITECTURE | **done — ADR-0069 Accepted**                                                | senior-architect                  | —                                          | closed at stage-6 run 3: D5 now names the shipped device-forked API and the render-knowledge-in-`src/game` placement is enforced by `illustrationAssetBinding.test.ts`, so the condition I held the ADR on is met. `docs/adr/README.md` + `public/adr/index.html` regenerated (`gen-adr-index.mjs --check` fresh)                                                                                                        |
| 4. BUILD        | done                                                                        | dev-gameplay ∥ dev-r3f-render     | QA execution                               | none                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5. VERIFY       | run 4: **PASS — CLOSED** (verify↔build loops **2/2, at cap, not exceeded**) | qa-lead → pm                      | —                                          | none blocking. Targeted re-verify of the MAJEUR-R2-01 round held 4/4 on both device profiles (mobile launch −90.9 %, no `street-wide.png`; "Tutoriel" label on both forks; panel 13 zero timer overlap over the full 3.2 s cycle; mechanical 5/5). Follow-up, non-blocking: regression spec TUT-LOAD-01 → `dev-tooling-assets` (loading label + fork warm-list have no automated guard; probe 6 SURVIVES, documented)    |
| 6. REVIEW       | run 3: **MERGE — CLOSED**                                                   | senior-architect → pm             | stage-7 acceptance                         | MAJEUR-R2-01 + the 2 bundled MINEURs + the NIT all CONFIRMED closed on the diff, not on self-report. Integration review CLEAN (unchanged from run 2). **Merge precondition, mechanical:** the whole fix round is still UNCOMMITTED/UNTRACKED — commit + push, then the CI `panel-verdict` check run (ADR-0063) is the blocking authority on the pushed diff. 2 new NITs routed, non-blocking. AC3 waiver call still → pm |
| 7. PM ACCEPT    | **done — ACCEPT** (AC3 boss-HP clause WAIVED w/ follow-up)                  | pm                                | merge                                      | RESOLVED — accepted architect's waive-with-follow-up recommendation; full rationale + AC-by-AC scope check in the stage-7 entry below. Only remaining item is the pre-existing stage-6 mechanical precondition (commit + push, then CI `panel-verdict` per ADR-0063).                                                                                                                                                    |
| 8. MERGE        | ready, pending mechanical precondition only                                 | Bertrand/orchestrator             | close story                                | not a pm blocker: commit the uncommitted round (no `--no-verify`), push, wait for CI `panel-verdict` (ADR-0063) green on the pushed diff, then Bertrand/orchestrator merges                                                                                                                                                                                                                                              |

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

## stage-6. REVIEW PANEL — senior-architect (Winston) — 2026-07-26 (run 2)

- claim: re-run the 4-reviewer merge-gate panel after the run-1 rework / release: panel executed on
  `bczy-tutorial-immersion-overhaul` @ `a0adf16d` vs `origin/main` — code-review(high) ∥
  bmad-code-review ∥ edge-case-hunter ∥ security-review, all four adversarially self-verified, then
  triaged here. This triage IS the integration review (one stage, one read of the full diff).
- **All 5 run-1 MAJEURs independently re-derived as genuinely fixed** (reviewer A re-derived them
  from source, reviewer B found zero recurrence). Run-1 finding 5 is the exception that bit back —
  see MAJEUR-R2-01 below: the fix was correct in intent and over-broad in scope.

### VERDICT: NO-MERGE — 1 CONFIRMED MAJEUR

**MAJEUR-R2-01 — `src/game/systems/assetManifest.ts:384-401` — the tutorial preload gate blocks
mobile on a 5.7 MB asset the mobile fork never draws. Owner: `dev-gameplay` (+ `dev-r3f-render` for
the 3-line `App.tsx` seam). CONFIRMED — 3 reviewers independently, and re-derived here from source.**

Verification I ran myself rather than taking on trust:

- `manifestFor("tutorial")` unions BOTH forks (`…DESKTOP` + `…MOBILE`) on all four channels.
- `App.tsx:112` picks exactly ONE fork at load (`IS_MOBILE ? …MOBILE : …DESKTOP`), and
  `App.tsx:409-413` passes the single string `"tutorial"` for the TUTORIAL phase. So the fork the
  device will never render is warmed anyway.
- `edge-scroll` is authored on the DESKTOP fork only (`narrativeSystem.ts:131`); mobile authors
  `swipe-pan` (`:146`), whose embedded-asset list is `[]`. Reviewer B's cross-reference to
  `assetManifest.test.ts:141-146` is exact: the test asserts mobile does NOT claim
  `street-wide.png`, and `manifestFor` then discards that exclusion by unioning.
- Cost, measured on disk, not estimated: mobile's honest set is **~412 KB** (facade 103 KB + truck
  36 + shooting 33 + riot 37 + biker 36 + bonus 80 + hostage 29 + girl 25 + commandant 30 + rider);
  the shipped set is **6.35 MB**, i.e. **93.5 % of the mobile tutorial preload is one file mobile
  never puts on screen**.
- `useAssetPreloader` (`src/hooks/useAssetPreloader.ts:34-53`) fires all paths and reports `done`
  only when every one settles; `App.tsx` gates `LoadingScreen` on that. There is no size cap and no
  timeout (reviewer C is right), so on a mobile connection this is a hard wall in front of the
  onboarding screen — the one screen a first-time player meets, on the device class least able to
  pay for it. `street-wide.png` also decodes at 6418×1248 ≈ **30.6 MB RGBA**, which is a real
  low-end-mobile memory spike for a 96×76 px mini-screen.
- Not mitigated by "mobile needs it later anyway": belliard is `single-wide`, so
  `levelLayerPaths("belliard")` already warms `street-wide.png` **at level selection**. Moving it
  back there costs mobile nothing it does not already pay, at a moment where the player has chosen
  to load a level.

**Prescribed fix (this exact shape — it is the one that keeps ADR-0015's "the game layer never sees
the device"; do NOT add an `isMobile: boolean` parameter to `manifestFor`, that leaks the device
into `src/game`).** The render layer already owns the device decision, so let it pick the _target
string_; the game layer maps string → scene:

1. `src/game/systems/assetManifest.ts` — `ManifestTarget` gains `"tutorial-desktop"` and
   `"tutorial-mobile"`; extract the current tutorial body into one private
   `tutorialManifest(scene: NarrativeScene)` helper (menu backdrop + `scene.backdrop` +
   `narrativeImagePaths(scene)` + `illustrationAssetPaths(scene)`) and dispatch both new targets to
   it with the scene each names. The `tutorialBackdrops` block collapses to the single selected
   scene's backdrop.
2. `src/render/scene/App.tsx` — three touch points, all in `dev-r3f-render`'s lane, so **serialise
   this file after 1 lands**: a module-level `const TUTORIAL_MANIFEST_TARGET: ManifestTarget =
IS_MOBILE ? "tutorial-mobile" : "tutorial-desktop"` next to `TUTORIAL_SCENE` (`:112`), the
   `appPhase === "TUTORIAL"` branch at `:411`, and the loading-screen label at `:444`
   (`target === "tutorial"` no longer matches — the label would silently fall through to
   `selectedLevel.name`; that is the kind of miss this fix must not introduce).
3. **Footgun to close explicitly, with a test.** `LEVELS` contains a real entry with
   `id: "tutorial"` (`levels.ts:90`). If the `"tutorial"` case simply disappears, any caller passing
   `"tutorial"` falls through to the level branch and silently builds a full _level_ manifest from
   that entry's inert fields. Either keep `"tutorial"` mapped (documented as the device-agnostic
   superset, tests only) or pin the chosen behaviour in `assetManifest.test.ts`. Latent, silent and
   expensive is exactly what we are fixing — do not trade one for another.
4. Tests to update/add in `assetManifest.test.ts`: `manifestFor("tutorial-mobile")` must NOT contain
   `street-wide.png`; `manifestFor("tutorial-desktop")` must contain it; both must contain the
   shared `image:` sprites, the hostage pair and `commander_shielded.png`. The existing test at
   `:141-146` is a good assertion pointed at the wrong level of the stack — keep it and add the
   `manifestFor` twin, so the exclusion is enforced where it is actually consumed.

Re-verify after the fix: the menu-path preload check only (qa-lead's TUT warm-list bullet), on BOTH
device profiles. No rendered output changes, so the 20/20 scenario evidence from verify run 2 stays
valid. This is verify↔build loop **2/2** — within cap, and the last one, which is why everything
below that is worth doing is bundled into the same round.

### Also required in the same round (non-blocking on their own, bundled to spend one loop, not three)

- **[MINEUR → required] Embedded-asset maps have no mechanical link to what the icons draw.**
  `assetManifest.ts:336-356` — the exhaustive `Record<GestureKind, …>` / `Record<DiagramKind, …>`
  guards the KEYS; nothing guards the VALUES. A bitmap added to an existing kind (map entry already
  `[]`) escapes the manifest silently. This seam has now bitten **twice** — run-1 MAJEUR 5, then the
  Commandant swap that needed a hand-written cross-lane warning in this very log (stage-4 REWORK,
  2026-07-26). A comment is not a contract. **Fix:** one test in `src/render/ui/__tests__/` that
  renders every `DiagramKind` and `GestureKind`, extracts every `href`/`xlinkHref` off the emitted
  `<image>` elements (strip `BASE_URL`), and asserts set-equality with the game-side map. Render may
  import game, so this is legal and lands in one file. Owner: **`dev-r3f-render`**.
- **[MINEUR → required] `DiagramIcon.tsx:448-470` — `boss-finale-switch` overprints both timer texts
  with motion ON.** Re-derived from the keyframes: `di-bf-before` is `0%,38%{opacity:1}
46%,100%{opacity:.25}`, `di-bf-after` is `0%,38%{opacity:.32} 46%,100%{opacity:1}` — neither
  reaches 0, so `00:05` and `00:00` are painted at the same `x=33,y=68` for **the whole cycle**, one
  ghosting through the other at 7.6px in a 128-unit viewBox. The run-1 fix correctly closed the
  reduced-motion frame and left the DEFAULT motion path mushy; the `.25` residual is right for the
  chrono box and the quota bar (dimmed = deprecated) and wrong for two texts on one anchor.
  **Fix:** give the `<text>` its own class/keyframes reaching a hard `opacity:0` in the after phase
  (`0%,38%{opacity:1} 46%,100%{opacity:0}`), leaving the box/bar group on `.25`. The base attribute
  is already `0`, so the frozen frame is untouched. Targeted re-verify: panel 13, motion ON, both
  devices. Owner: **`dev-r3f-render`**.
- **[NIT → required, same file already open]** `DiagramIcon.tsx:130` — stale
  "(the only `DiagramKind` today)" on a file with 5 kinds. Header comment "YELLOW on **a limb**" —
  `qteSystem.ts:205-215` classifies torso **and** shoulders as `"limb"`, and the shipped panel-12
  bullet says `jaune = torse`; say torso+shoulders (or name the token and its geometry).
  Owner: **`dev-r3f-render`**.
- **[MINEUR → DOC, required, no code]** `spec-tutorial-narrative-presentation.md:82-85` — the
  2026-07-26 §D2.2 amendment introduced C1/C2/C3 and left §D2.3 ("bullet 1 = what to do, bullet 2 =
  consequence") standing. 3 of the 4 shipped bullet panels (5, 12, 14) are enumeration/instrument
  copy: legal under C1/C2, illegal under D2.3 as written. A gated spec that contradicts itself is
  precisely the defect that produced run-1 finding 3 (a recorded PASS against divergent code) —
  fixing it now, while it is cheap, is the whole lesson of that finding. → **`tech-writer`** drafts
  the reconciliation (D2.3 becomes the _format_ contract subordinate to the C1/C2/C3 _eligibility_
  contract), **`lead-game-designer` signs it off** — D2.3 is design law, not prose. Doc-only: no
  re-verify, does not consume the loop.
- **[DOC, required, no code]** ADR-0069 §D5 — tech-writer's run-1 pass tightened D5 to name the
  embedded-bitmap mechanism; MAJEUR-R2-01 changes the contract again (the tutorial manifest becomes
  device-forked). D5 must state it: _the tutorial warms the illustration assets of the fork the
  device will actually render, not the union._ → **`tech-writer`**, after the fix lands.

### Routed, NOT required for this merge

- **[MINEUR] AC3 coverage gap — boss HP never taught** (reviewer B). Re-read AC3: "what telegraphs
  the duel, what the player should watch (boss HP / danger windows), and that the boss trigger is a
  level finale condition". Panel 13 ships 2 of the 3 clauses (chrono-à-zéro telegraph, quota-no-
  longer-ends condition) and the diagram carries the danger _window_ visually; only "boss HP" is
  absent. That is materially different from run-1 MAJEUR 4, where AC2 was absent outright. Closing
  it needs either new copy on an already-dense panel or a 17th panel, which reopens ADR-0069's
  16-panel map and burns design round 2/2. **→ `pm`, as an explicit accept-or-waive at stage 7.**
  My recommendation: **waive with a follow-up story** — `BossHpBar` is a level-3 surface the
  tutorial's first-session player will not meet for a long while. If `pm` does not waive, it returns
  as a design round, not as a panel finding.
- **[MINEUR] Teaching bullets render in full while the sentence is still typing** (A CONFIRMED, C
  CONFIRMED with layout-shift detail, B PLAUSIBLE). Real, and no shipped clause forbids it — D2.2 C1
  arguably _wants_ the bullets present as scannable structure while the prose runs. Gating them on
  `!isTyping` is three characters, but it is a visible change to a surface `lead-game-designer` gated
  48 hours ago, and it would invalidate qa-lead's DOM-read TUT-CUE-06 sweep timing. **→ `ux-designer`
  to rule (with `lead-game-designer`), follow-up cycle.** The layout shift is the part I would weigh
  most: the `<ul>` is pushed down as `.text` grows.
- **[MINEUR] Embedded `<image>` bitmaps have no `onError` fallback** (reviewer C). Accurate
  asymmetry with the `image:` channel's `imageError` path. Degradation today is an empty rect inside
  otherwise-correct vector art, and every one of these paths is manifest-warmed and committed — a
  404 means the deploy is broken, not the panel. **→ standing render-lane debt**, revisit if we ever
  ship a diagram bitmap that is generated in CI rather than committed.

### Rejected, with reason

- **[MINEUR] `threat-hierarchy-ladder` draws 5 non-zero rungs while `bonus`/`courier` deal 0 damage**
  (reviewer B). REJECTED as a defect. AC-IMM-04 requires the panel to use "real archetype danger
  **order** (`bulletDamage` truth)" — the order shipped is correct (CRS → motard → flic → bonus,
  livreur), the caption ("Bonus et livreur ne font pas monter le danger") is accurate, and the bottom
  two rungs are visibly the shortest (30 px, 20 px) and faintest (.4, .28). Drawing them at literal
  zero would make them invisible, which teaches less, not more. A taste call for the design lane at
  their discretion, not a correctness finding.
- **[NIT] `LootCrate.tsx:68-70` unrelated prettier reformat** (reviewer B). REJECTED — **do not
  revert it.** I checked: `origin/main`'s copy of that file is NOT prettier-clean; the branch's copy
  is. Reverting would put `yarn format:check` red and break the pre-commit hook. Out of the story's
  declared surface, yes; harmful, no — it repairs a pre-existing violation. Keep.
- **[NIT] `tutorialBackdrops` dedupe block contributes zero entries** (reviewer A). REJECTED as dead
  code: it contributes nothing _today_ only because both forks happen to author the same
  `facade.png` that `menuBackdropPath()` already returns. It is the backdrop channel being declared
  correctly, and it starts paying the moment a fork authors its own backdrop. It does shrink to the
  single selected scene under MAJEUR-R2-01's fix.
- **[FYI, reviewer D] Unguarded object-index into the embedded-asset maps in
  `illustrationAssetPaths`.** REJECTED — the index type is the exact closed union and both maps are
  exhaustive `Record`s, so the miss is unrepresentable. A runtime guard here would be dead defensive
  code; the exhaustive `Record` _is_ the guard. (The values, not the keys, are the real exposure —
  covered by the binding test above.)
- **[NIT] Diagram slot has no `imageError` degradation path** (reviewer B). REJECTED — unreachable
  under the channel-exclusivity invariant, and the diagram is code-drawn: there is no image to fail.

### Integration review (same pass)

- **Boundary law: CLEAN.** `grep` over `src/game/**` (non-test) returns zero `react` / `three` /
  `@react-three` imports; `assetManifest.ts` and `narrativeSystem.ts` are pure data + pure
  functions. `src/render` holds no rules — `DiagramIcon` pulls its ring hues from `ringZoneColour`,
  the same map the in-game QTE uses, rather than restating them. `src/hooks` untouched by the diff.
  The prescribed fix must keep it that way: **device stays in render** (it picks the target string),
  the game layer only maps string → authored scene.
- **The one architectural tension, ruled.** `GESTURE_EMBEDDED_ASSETS` / `DIAGRAM_EMBEDDED_ASSETS`
  put _render knowledge_ (which bitmap a component draws) inside `src/game`. That is not an import
  violation, and I **accept the placement**: a preload manifest is by nature a declaration of what
  will be drawn, it must be computable without React, and ADR-0069 D5 already sanctions it. I accept
  it **conditionally on the binding test above** — an unenforced declaration of another layer's
  behaviour is a comment wearing a type's clothes, and this one has already drifted twice.
- **Cross-lane seams:** exactly one, `assetManifest.ts` (game) ↔ `App.tsx` (render), and the fix
  touches both sides. **Serialise:** `dev-gameplay` lands step 1, then `dev-r3f-render` lands step 2
  - the render-side test + the diagram fixes. No parallel edit of either file.
- **Dependencies / deploy:** no new dependency, no new URL, no new storage key, no CI or workflow
  change, no `BASE_URL` handling change. Bundle impact nil (all new visuals are inline SVG). Deploy
  surface unchanged; `street-wide.png` was already shipped and served.
- **Security (reviewer D):** zero findings, and I concur — every new string is a compile-time
  literal under `BASE_URL`, scene data has fixed non-attacker-reachable provenance.
- **ADR-0069 stays `Proposed`.** I will not finalise it while MAJEUR-R2-01 changes the D5 contract
  it documents. Sequence: fix lands → tech-writer's D5 addendum → I flip ADR-0069 to `Accepted` at
  the stage-6 sign-off, and stage 3 closes with it.

- **NO-MERGE. Blocking: MAJEUR-R2-01, owning lanes `dev-gameplay` (game) then `dev-r3f-render`
  (render seam).** Everything else in the "same round" list rides along and does not, on its own,
  block. Re-run the panel after the round; if the only deltas are the ones prescribed here, run 3 is
  a confirmation read, not a fourth full pass.

Caps watch: design rework 1/2, asset-generation batches 0/2, verify↔build loops 1/2 → **2/2 once the
MAJEUR-R2-01 round lands** (run 2 sent the diff back to dev-r3f-render on the mechanical gate; run 3
closed it without a further build↔verify loop; the stage-6 run-2 round is the last one available —
everything worth fixing is bundled into it deliberately).  
Cycle reset count: 0 (no reset declared).

## stage-6. REWORK — dev-gameplay (Amelia) — 2026-07-26 (MAJEUR-R2-01, game half)

- claim: land step 1 of the prescribed fix (device-forked tutorial manifest) / release:
  `src/game/systems/assetManifest.ts` + `src/game/systems/__tests__/assetManifest.test.ts` — the
  `App.tsx` seam is FREE for `dev-r3f-render` (step 2). No other file touched.
- **API landed (match this exactly, render lane):**
  `ManifestTarget = "menu" | "tutorial-desktop" | "tutorial-mobile" | (string & {})`. Both tutorial
  targets dispatch to one private `tutorialManifest(scene: NarrativeScene)` (menu backdrop +
  `scene.backdrop` + `narrativeImagePaths` + `illustrationAssetPaths`); no forking logic inside
  `manifestFor`, no device parameter, ADR-0015 boundary intact. The bare `"tutorial"` case is GONE.
- **Cost, measured from the manifests themselves:** desktop = 11 paths (street-wide.png included),
  mobile = 10 (identical minus `assets/levels/belliard/street-wide.png`, 5.7 MB / ~30 MB decoded).
  Mobile's tutorial preload drops 6.35 MB → ~0.4 MB (the only removed path is that one file).
- **Footgun closed as prescribed (§3), by pin not by branch:** `LEVELS` still holds `id: "tutorial"`
  (`levels.ts:90`), so a bare `"tutorial"` now lands on the LEVEL branch. That dispatch is pinned by
  the test "dispatches only the two device targets to the tutorial manifest; bare 'tutorial' is the
  level id" — it asserts the bare string yields a level manifest (audio + player-bullet marks) and
  that neither device target does. Re-introducing an ambiguous `"tutorial"` case, or a caller
  typo'ing one, is red instead of silent. The behaviour is also stated in `manifestFor`'s doc block.
- **Tests:** the old union test split into two exact ORDERED-array pins (`tutorial-desktop` /
  `tutorial-mobile`), plus the scene-derived "warms each fork's own channels" property test and the
  dispatch pin above; `ALL_TARGETS` / the audio-exclusion loop now carry both device targets. The
  lower-level `illustrationAssetPaths` exclusion test is kept (its comment no longer claims a union).
  `rtk vitest` targeted: 31 PASS / 0 FAIL. Full suite: 1190 PASS / 0 FAIL. `rtk tsc`: no errors.
- **simplify pass (own diff only):** cut a redundant "the two forks differ by exactly X" test — the
  two exact-array pins already determine the difference; the mobile pin keeps the explicit
  `not.toContain(street-wide.png)` assertion the MAJEUR is about. Nothing else added beyond the type
  arm, the 10-line helper and the dispatch lines.
- **Hand-off to `dev-r3f-render`:** the ONLY caller of `manifestFor` in the repo is
  `src/render/scene/App.tsx` (import `:27`, call `:421`) — three touch points to update per the
  triage (`:112` fork constant, `:411` TUTORIAL branch, `:444` label where `target === "tutorial"`
  no longer matches). Grep over `src/`, `demo/`, `scripts/` found no other call site.
  Doc-only leftover for `tech-writer`: ADR-0069 §D5 line 77 still says `manifestFor("tutorial")`.

## stage-6. REWORK — dev-r3f-render (Amelia) — 2026-07-26 (MAJEUR-R2-01 render half + 3 bundled)

- claim/release: `src/render/scene/App.tsx`, `src/render/ui/DiagramIcon.tsx`,
  `src/render/ui/__tests__/DiagramIcon.test.ts`, NEW
  `src/render/ui/__tests__/illustrationAssetBinding.test.ts`. `src/game/**` untouched (the seam was
  free — `dev-gameplay` had released it). `src/hooks` untouched.
- **MAJEUR-R2-01, render half — CLOSED.** The three `App.tsx` touch points now hang off ONE
  `IS_MOBILE` read: `TUTORIAL_FORK = IS_MOBILE ? {scene: …MOBILE, manifestTarget:"tutorial-mobile"}
: {scene: …DESKTOP, manifestTarget:"tutorial-desktop"}` (`:110`). The TUTORIAL branch of `target`
  (`:422`) and the `NarrativeScreen scene=` (`:519`) read the two fields of that one object, so the
  script drawn and the manifest preloaded cannot name different forks. Deviation from the triage's
  prescribed shape (a second `TUTORIAL_MANIFEST_TARGET` ternary), taken deliberately: two
  independent ternaries on the same flag is the desync the finding is about, and `ManifestTarget`'s
  `(string & {})` arm would not catch the drift. `manifestTarget` is annotated to the two LITERALS
  rather than `ManifestTarget`, so a stale/typo'd value at this call site IS a compile error.
- **Loading label (`:454`) — fixed, and made structurally correct rather than re-typed.** It now
  compares `target === TUTORIAL_FORK.manifestTarget`, i.e. against the very value `target` was built
  from, so it resolves to "Tutoriel" on BOTH forks by construction — not by matching a literal that
  is right on one device and wrong on the other. No level id collides with either literal
  (`levels.ts`: tutorial, belliard, stalingrad, vitry, niveau-final, boss-harness), so no level
  loader can mislabel as "Tutoriel". Grep over `App.tsx`: no `"tutorial"` manifest-target literal
  left; the two survivors are `PREVIEW_SCREEN === "tutorial"` (URL param) and
  `level.kind === "tutorial"` (LevelConfig field) — neither is a manifest target.
- **[MINEUR] binding gap — CLOSED** by `src/render/ui/__tests__/illustrationAssetBinding.test.ts`
  (new file rather than split across the two component test files: one contract, one extractor, no
  duplication — the triage asked for "one test in `src/render/ui/__tests__/`"). For each of the 5
  `DiagramKind` + 4 `GestureKind` it renders the component, reads every `href`/`xlink:href` the
  markup actually fetches (BASE_URL stripped, `#`-fragments excluded — `swipe-pan` reuses one
  `<defs>` hand 4×) and asserts SET-EQUALITY against `illustrationAssetPaths()` on a synthetic
  one-line probe scene. Both directions fail: undeclared bitmap (cold fetch) AND declared-but-unused
  path. Plus an anti-vacuity pin so the 9 cases can never pass on two empty sets.
- **[MINEUR] motion-ON overprint — CLOSED.** The two timer `<text>` nodes moved off the group
  classes onto their own `di-bf-timer-before` / `di-bf-timer-after`, keyframes
  `0%,38%{opacity:1} 46%,100%{opacity:0}` and `0%,38%{opacity:0} 46%,100%{opacity:1}` — same
  3.2s/step-end timing and same 38%/46% switch, so the flip is still instantaneous and exactly one
  readout is painted at `x=33,y=68` at every t. The `.25`/`.32` residual is KEPT on `di-bf-before` /
  `di-bf-after` (correct "dimmed = deprecated" read for the chrono box, the quota bar, the
  Commandant telegraph). Reduced-motion frozen frame untouched: base attrs are still `opacity="0"`
  on "00:05" and absent (⇒1) on "00:00".
- **[NIT] stale comments — CLOSED.** `HostageRingIcon` JSDoc no longer claims "the only
  `DiagramKind` today"; the header + the `YELLOW` const now say the `"limb"` zone is torso +
  shoulders (per `qteSystem.ts:197-215`), not "a limb".
- **Verification.** `rtk tsc` no errors. `rtk lint` no issues. `yarn format:check` clean. Targeted
  `rtk vitest` (DiagramIcon + GestureIcon + illustrationAssetBinding + NarrativeScreen +
  assetManifest): 66 PASS / 0 FAIL. Full suite: **1202 PASS / 0 FAIL**. No `App.tsx` test file
  exists (mounting it pulls the lazy R3F chunk); the label correctness is argued structurally above,
  not asserted.
  **Mutation-probed (both new tests go red on the real bug, reverted immediately):** (a) reverting
  `di-bf-timer-before`'s hidden stop to `.25` → RED (`expected 0.25 to be +0`); (b) adding an
  undeclared `<image href=…assets/probe_mutation.png>` to `threat-hierarchy-ladder` (a kind whose
  map entry is `[]` — the exact escape route the finding names) → RED
  (`expected [ 'assets/probe_mutation.png' ] to deeply equal []`).
- **simplify pass (own diff only):** cut a single-use `markup()` wrapper and a single-use
  `animationClasses()` helper from the new tests (inlined, and the `ReactElement` import went with
  them); tightened the `TUTORIAL_FORK` comment. Nothing behavioural touched.
- **Still owed, NOT mine:** the visual re-verify the triage names (panel 13, motion ON, both
  devices) → `qa-lead`. I covered the mechanism with the mutation-probed attribute test rather than
  a single frame, because a screenshot samples one t of a 3.2s cycle while the keyframe assertion
  holds for all t; a frame is still worth attaching to the PR as evidence. Doc leftovers for
  `tech-writer` stand: ADR-0069 §D5 (device-forked contract + `manifestFor("tutorial")` on line 77).
- NOT committed, NOT pushed, as instructed.

## stage-6. REWORK — tech-writer (Otis) — 2026-07-26 (MAJEUR-R2-01, doc leftover)

- claim/release: `docs/adr/0069-tutorial-immersion-narrative-contract.md` §D5 only — no other file,
  no other section touched.
- **Wording fix, not a redesign.** §D5's asset-preload paragraph named `manifestFor("tutorial")`,
  an API `dev-gameplay`'s stage-6 rework retired (that bare target now falls through to the level
  branch, per `assetManifest.ts:410-415` and the dispatch test cited in their entry above). Corrected
  to name the real, shipped API: `manifestFor("tutorial-desktop")` / `manifestFor("tutorial-mobile")`,
  device-forked, selected by the render layer off the same `IS_MOBILE` read that also picks
  `TUTORIAL_NARRATIVE_DESKTOP` / `TUTORIAL_NARRATIVE_MOBILE` (`App.tsx`'s `TUTORIAL_FORK`, per
  `dev-r3f-render`'s entry above) — and stated that each fork's manifest warms only its own embedded
  illustration assets, so a mobile player's preload never touches the desktop-only
  `street-wide.png`. No other line of D5 (or of the ADR) changed.
- Traced to: MAJEUR-R2-01 (stage-6 run-2 CONFIRMED finding), doc leftover flagged by both
  `dev-gameplay` and `dev-r3f-render` in their rework entries above.
- Not run: `rtk tsc` / `rtk lint` — no source file touched, only ADR prose.
- Not committed, not pushed, as instructed.

## stage-5. VERIFY — qa-lead (Inès) — 2026-07-26 (execution run 4, TARGETED re-verify of the MAJEUR-R2-01 round)

- claim: re-verify ONLY what the stage-6 run-2 round could have broken (the full 20-scenario matrix
  held at run 2 and no rendered output changed outside panel 13) / release: 4 targeted checks run
  against the PRODUCTION build (`yarn build` → `vite preview`) in headless Chromium, on BOTH device
  profiles (desktop UA @ 1280×720, iPhone-17 UA @ 844×390 — `platform.ts` forks on UA only).
  Zero `pageerror` on every run.

### 1. Mobile preload payload — **PASS**, measured at runtime on the real menu path

Menu path (TITLE → single-action entry → NIVEAUX → `Tutoriel` flyer), real preload gate, no
`?preview` bypass. Every same-origin `assets/**` response fired AFTER the flyer click, decoded byte
length off `response.body()`:

| fork    | asset responses at tutorial launch | bytes at launch | image-only bytes | `street-wide.png`         |
| ------- | ---------------------------------- | --------------- | ---------------- | ------------------------- |
| desktop | 14                                 | 6 603 921 B     | 6 535 737 B      | **fetched** (5 939 784 B) |
| mobile  | 13                                 | 664 137 B       | 595 953 B        | **never fetched**         |

- The delta between the two forks is **exactly 5 939 784 B — byte-for-byte `street-wide.png` and
  nothing else**. The trim is surgical: mobile loses that one file and keeps every shared sprite
  (truck, the 4 enemy poses, rider, hostage pair, `commander_shielded.png`, facade).
- **Mobile's image preload drops 90.9 %** (6 535 737 → 595 953 B). `street-wide.png` was 90.9 % of
  the desktop image payload and 100 % of the fork delta.
- `street-wide.png` is fetched **zero times in the whole mobile session** — not at boot, not at
  launch, and not later: a full **16-panel sweep on mobile** (all panels walked, `dotFilled`
  1→16) fetched 10 distinct images and **0** `street-wide.png`. The desktop sweep fetched 11
  distinct images and `street-wide.png` **exactly once** (the preload) — so the warm actually
  serves panel 3 instead of being paid twice.
- **Fork coherence proven, not assumed** (this is what `TUTORIAL_FORK`'s single `IS_MOBILE` read
  buys): the run that preloaded the mobile manifest also DREW the mobile script — panel 2/3 cues
  read "Tap simultané à deux doigts…" / "Un doigt balaye l'écran…"; the desktop run read
  "Souris : un clic gauche…" / "Curseur poussé au bord…". Manifest and scene cannot name different
  forks at runtime.

### 2. Loading-screen label on BOTH forks — **PASS**, and the check is proven to discriminate

- Assets artificially delayed 450 ms each so the gate is observable; the `LoadingScreen` was caught
  up on both profiles. `progressbar` `aria-label` = **`"Chargement Tutoriel"`** on desktop AND on
  mobile; the printed label line reads **TUTORIEL** on both screenshots.
- **Counter-probe (this is the load-bearing part).** I re-armed the exact regression the architect
  flagged — `: target === TUTORIAL_FORK.manifestTarget` → `: target === "tutorial"` — rebuilt, and
  re-ran: the loader then reads **"Chargement Rue Belliard"** on BOTH forks (the `selectedLevel.name`
  fall-through, on both devices, not just one). So the label check is not a tautology: it goes red
  on the real bug. Reverted immediately, tree byte-identical.

### 3. Panel 13 `boss-finale-switch` motion ON — **PASS** across the full cycle, and reduced-motion still holds

Panel index 13 reached through the real narrative flow (16-dot progress read off the DOM), on both
profiles. Two independent sweeps of the computed opacity of the two `<text>` nodes sharing the
`x=33,y=68` anchor:

- **Sweep A — free-running, wall-clock:** ~120 samples over 4.5 s (> 1.4 full 3.2 s cycles), per
  fork. Simultaneously-visible frames: **0**. Blank frames (neither readout painted): **0**.
- **Sweep B — deterministic phase grid:** animations paused and `currentTime` driven over
  0…3200 ms at 25 ms steps **plus the switch boundaries ±1 ms** (1215/1216/1217, 1471/1472/1473) —
  138 samples per fork. Only **two distinct states exist over the entire cycle**: `before/after` =
  `1/0` and `0/1`. Overlap: **0**. Blank: **0**. The flip is at 1472→1473 ms, i.e. exactly 46 % of
  3200 ms, instantaneous (`step-end`), identical on both forks.
- Screenshot evidence at the decisive phases: `p13-*-motion-just-before-switch.png` shows a single
  clean ink `00:05`; `p13-*-motion-just-after-switch.png` a single clean WARN `00:00`. No ghosting.
  (Caveat, stated so it is not over-read: those captures pause only the two timer animations, so
  the surrounding box/bar/arrow groups sit at an arbitrary phase — the quantitative sweeps above,
  not the frames, are the evidence for the timer separation.)
- **Reduced-motion frozen frame (run-1's fix) re-confirmed unchanged** on both forks:
  `00:05` opacity **0**, `00:00` opacity **1**, **0** running animations across the 10 `.di-anim`
  nodes, `di-bf-before` groups at `.25`, `di-bf-after` at `1/1/.94/.95`. The frame is still the
  legible boss-trigger beat (one readout, struck-out quota, Commandant in the highlighted window,
  `!` badge).

### 4. Mechanical gate — **PASS 5/5**

`rtk tsc` no errors · `rtk vitest run` **1202 PASS / 0 FAIL** · `rtk lint` no issues ·
`npx prettier --check src docs` all formatted · `yarn test:coverage` **exit 0** (`src/game`
96.29 stmts / 91.88 branches / 98.63 funcs / 96.29 lines vs the 80 thresholds). Re-run a second
time on the restored tree after the mutation probes: identical, so nothing leaked out of a probe.

### test-quality (my own probes, not the lanes' self-report) — 5 BITE / 1 SURVIVES (documented)

Every probe reverted immediately; the three mutated sources restored from checksummed backups and
`git status` verified identical to the pre-probe state.

| #   | mutation                                                                           | result                                                                                                |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `"tutorial-mobile"` dispatches to `TUTORIAL_NARRATIVE_DESKTOP` (the MAJEUR itself) | **BITES** — `tutorial-mobile manifest is exactly the mobile fork's assets — NO desktop street bitmap` |
| 2   | re-introduce a bare `"tutorial"` manifest case (the §3 footgun)                    | **BITES** — `dispatches only the two device targets…; bare 'tutorial' is the level id`                |
| 3   | `00:05` digits put back on the group class `di-bf-before`                          | **BITES** ×2 — the motion-ON separation test AND the reduced-motion frozen-frame test                 |
| 4   | `di-bf-timer-before` hidden stop `0` → `.25` (ghosting, class split kept)          | **BITES** — `vanishes each timer readout in its hidden phase instead of merely dimming it`            |
| 5   | undeclared `<image>` on `threat-hierarchy-ladder` (map entry `[]`)                 | **BITES** — the new binding test, on the exact escape route the finding named                         |
| 6   | loading label `TUTORIAL_FORK.manifestTarget` → `"tutorial"`                        | **SURVIVES** — `tsc` clean AND 1202/1202 green with the regression re-armed                           |

Probe 6 is a **documented** survivor (`dev-r3f-render` said so explicitly: no `App.tsx` test file
exists, the label is argued structurally), so it is not an undocumented SURVIVES and does not fail
this gate — the fix itself is correct and I verified it at runtime on both forks. But it is a real
hole, and note that `ManifestTarget`'s `(string & {})` arm means **the type system will not catch
it either**: today the only thing standing between this line and a silent mislabel is a QA session.

### Regression-test spec — TUT-LOAD-01 (owner: `dev-tooling-assets`, e2e surface)

> Drive the production build through the real menu path to the `Tutoriel` flyer on BOTH device
> profiles (desktop UA / mobile UA), with `assets/**` responses delayed so the gate is observable.
> Assert the `LoadingScreen` `[role="progressbar"]` `aria-label` equals `"Chargement Tutoriel"` on
> each, and that the desktop launch fetches `assets/levels/belliard/street-wide.png` while the
> mobile launch does not. Fails on both the label fall-through and a re-unioned tutorial manifest.

This burns down two of the "known e2e holes" in `docs/qa/README.md` (tutorial flow, mobile
controls fork) with one script, and it is the only mechanical guard possible for the label short of
extracting a pure `loadingLabelFor()` helper. Logged for the next cycle — **not** a blocker on this
merge (the behaviour is verified here at runtime, on both forks).

### Carried forward, unchanged and non-blocking

The four run-2 observations still stand and are still not regressions from this diff:
`shot-read` freeze point at cx=68 sits on the player tracer (→ `dev-r3f-render` + `ux-designer`,
discretionary) · TUT-A11Y-01 container `role`/name debt (pre-dates the branch, → `ux-designer`) ·
the `[ CONTINUER ]` blink survives `prefers-reduced-motion` (pre-existing, → `ux-designer`) ·
the missing stage-4 REWORK entry from `dev-gameplay` is now closed by the two stage-6 REWORK
entries above (→ `producer`, traceability satisfied).

- **VERDICT: PASS — QUALITY GATE (qa-lead).** All 4 targeted checks hold on both device profiles,
  on runtime evidence, and the two that could have been rubber-stamps (the label, the timer
  separation) were proven to discriminate by re-arming the exact bugs. The 20/20 scenario matrix
  from run 2 stays valid: nothing in this round changed rendered output outside panel 13's two
  timer nodes, and panel 13 is re-verified above in both motion modes. Nothing unverified, nothing
  CI-DEFERRED. Hand to `senior-architect` for stage-6 panel run 3 (a confirmation read per his own
  triage). Not committed, not pushed, as instructed.
- Evidence (session-local, not committed, under the run's scratchpad `…/6ae7a0ec-…/scratchpad/`):
  `qa-preload.mjs` + `out/preload.json` + `out/loading-{desktop,mobile}.png`;
  `qa-panel13.mjs` + `out/panel13.json` + `out/p13-{desktop,mobile}-motion-{before-phase,
just-before-switch,just-after-switch,after-phase}.png` + `out/p13-{desktop,mobile}-reducedmotion.png`;
  `qa-forksweep.mjs`; the label counter-probe run under `out-mutated/`.

## stage-6. REVIEW PANEL — senior-architect (Winston) — 2026-07-26 (run 3, confirmation)

- claim: confirmation read of the MAJEUR-R2-01 round, per my own run-2 instruction ("if the only
  deltas are the ones prescribed here, run 3 is a confirmation read, not a fourth full pass") /
  release: no fourth panel fan-out. I re-derived the three closures FROM THE DIFF myself, took a
  fresh look for what the fix round introduced, and re-ran the checks I was going to cite
  (`rtk tsc` no errors; targeted `rtk vitest` on `illustrationAssetBinding` + `DiagramIcon` +
  `assetManifest` = **58 PASS / 0 FAIL**).
- **Scope note that matters for anyone reading this later:** the fix round lives in the WORKING TREE
  of worktree `prohimuf-tutorial-141`, not in a commit. `git diff origin/main...HEAD` (what CI sees)
  still shows the run-2 NO-MERGE state. Everything below is judged on `git diff origin/main` +
  the untracked `illustrationAssetBinding.test.ts`. See the merge precondition at the bottom.

### VERDICT: MERGE

#### MAJEUR-R2-01 — CONFIRMED CLOSED (re-derived from source, not from the lanes' entries)

- `assetManifest.ts` — `ManifestTarget` is `"menu" | "tutorial-desktop" | "tutorial-mobile" |
(string & {})`; both device targets dispatch to one private `tutorialManifest(scene)`; **no
  `isMobile` parameter anywhere**, so ADR-0015's "the game layer never sees the device" holds. The
  shape is the one I prescribed.
- **The footgun (§3) is genuinely closed, and I checked the reachability myself rather than trusting
  the pin.** `App.tsx:361` — `if (level.kind === "tutorial") { setAppPhase("TUTORIAL"); return; }`
  returns BEFORE `setSelectedLevel(level)`, so `selectedLevel` can never become the `id: "tutorial"`
  entry and the bare string is unreachable as a manifest target from production code. `INITIAL_LEVEL`
  is not it either. So the level-branch fall-through is theoretical — and it is still pinned red by
  the "bare 'tutorial' is the level id" test. Belt and braces, correctly.
- `App.tsx` — the lane deviated from my prescribed shape (one `TUTORIAL_FORK` object instead of a
  second `TUTORIAL_MANIFEST_TARGET` ternary) and **the deviation is better than what I asked for**.
  Two independent ternaries on the same flag is the desync class the finding is about; one object
  read at three sites makes the desync unrepresentable. `manifestTarget` annotated to the two
  LITERALS (not `ManifestTarget`, whose `(string & {})` arm swallows typos) is the right call. I
  endorse it as the shipped shape.
- The label at `:454` compares `target === TUTORIAL_FORK.manifestTarget` — right by construction on
  both forks, not by re-typed literal. Grep confirms the only `"tutorial"` strings left in `App.tsx`
  are `PREVIEW_SCREEN === "tutorial"` (URL param) and `level.kind === "tutorial"` (LevelConfig
  field); neither is a manifest target.
- Cost re-checked on disk: `street-wide.png` = **5.7 MB**, vs facade 103 KB / hostage pair ~53 KB /
  `commander_shielded.png` 29 KB. `qa-lead`'s runtime measurement (mobile 664 137 B vs desktop
  6 603 921 B, delta byte-for-byte 5 939 784 B) is consistent with the manifests I read. The 90.9 %
  mobile trim is real and it is surgical — mobile keeps every shared sprite.
- Test quality: `manifestFor("tutorial-desktop")` / `("tutorial-mobile")` are pinned as **exact
  ordered arrays**, not supersets. That is the correct strength for a preload manifest — every extra
  entry is a download a real player makes — and it is what makes `qa-lead`'s mutation #1 bite.

#### The two bundled MINEURs — CONFIRMED CLOSED

- **Binding gap.** `src/render/ui/__tests__/illustrationAssetBinding.test.ts` is the contract I asked
  for and slightly more: it scans `href`/`xlink:href` on ANY element (not just `<image>`), strips
  `BASE_URL`, excludes `#`-fragments, and asserts **set-equality** per kind — so both directions fail
  (undeclared bitmap AND declared-but-unused path). The anti-vacuity case and the fragment case are
  real guards, not decoration. Legal direction (render imports game). `react-dom/server` is
  established precedent in `src/render/ui/__tests__/`, no new dependency.
- **Panel-13 motion-ON overprint.** Re-derived from the keyframes myself: `di-bf-timer-before` =
  `0%,38%{opacity:1} 46%,100%{opacity:0}`, `di-bf-timer-after` = `0%,38%{opacity:0} 46%,100%{opacity:1}`
  — strictly complementary, `step-end`, same 3.2 s / 38 %-46 % switch as the group pair, so exactly
  one readout is painted at `x=33,y=68` at every t and the flip stays instantaneous. Base attributes
  untouched (`opacity="0"` on "00:05", absent ⇒ 1 on "00:00"), so the reduced-motion frozen frame from
  run 1 is unchanged. The `.25`/`.32` residual correctly STAYS on `di-bf-before`/`-after` for the
  chrono box, quota bar and Commandant telegraph — the fix is scoped to the two nodes that share an
  anchor, which is exactly the distinction the finding drew. `qa-lead`'s 138-point deterministic
  phase grid (0 overlap, 0 blank, flip at 1472→1473 ms = 46 % of 3200 ms) matches the CSS arithmetic.
- **NIT (stale comments)** — closed: no "the only `DiagramKind` today"; header and `YELLOW` now say
  the `"limb"` zone is torso + shoulders.

#### Fresh look — what the fix round itself introduced

Two new NITs, neither blocking, plus one mechanical precondition. Nothing CONFIRMED at MAJEUR or
MINEUR level.

- **[NIT → next cycle, `dev-r3f-render`] The binding test's own kind lists are hand-written.**
  `DIAGRAM_KINDS` / `GESTURE_KINDS` in `illustrationAssetBinding.test.ts:27-40` are literal arrays
  typed `readonly DiagramKind[]`, not derived exhaustively from the unions. Add a 6th `DiagramKind`
  and the type system forces a `DIAGRAM_EMBEDDED_ASSETS` entry and a `DIAGRAMS` component — but NOT
  a binding assertion, which would go silently missing. Mildly ironic in a test whose whole point is
  "the `Record` guards the keys, not the values". **Not blocking, and materially smaller than the
  finding it closes:** adding a kind is a deliberate act with two type-forced touch points, whereas
  adding a bitmap to an existing kind was the silent one — and that is now covered. Fix when next in
  the file: derive the lists from an exported `Record<Kind, true>` (or from the components' own
  `DIAGRAMS`/`ICONS` maps) so the union drives the test.
- **[NIT → `tech-writer`] ADR-0069 D5 states the declaration mechanism but not its enforcement.** My
  acceptance of render-knowledge-inside-`src/game` was explicitly conditional on the binding test
  existing (run-2 integration review). D5 now correctly names the device-forked API and the two maps,
  but not `illustrationAssetBinding.test.ts` — so a future contributor could delete the test without
  knowing it is load-bearing for an architectural acceptance. The test's own 16-line header does cite
  ADR-0069 D5, so the link exists in one direction; make it two. One clause, no re-verify.
- **[checked, not a finding]** `assetManifest.test.ts` now does filesystem I/O (`existsSync` over
  `public/`) inside a `src/game` unit test. Faint purity smell, but it is a test asserting that
  declared bitmaps actually ship, `src/game` **source** stays pure, and it is the pin that catches
  the next Commandant-style sprite swap. Accept as shipped.
- **[checked, not a finding]** `illustrationAssetPaths` is newly exported. It is the twin of the
  already-exported `narrativeImagePaths` and is consumed by `tutorialManifest` internally; the export
  is not test-only scaffolding. Fine.
- **[checked, not a finding]** `DIAGRAM_STYLES` grows ~200 bytes and is inlined in all five diagrams'
  `<style>`. Pre-existing pattern, not introduced here, inline SVG, no bundle impact worth a line.

#### Integration review (same pass) — CLEAN, unchanged from run 2

- **Boundary law: CLEAN.** Re-grepped: zero `react` / `three` / `@react-three` imports anywhere in
  `src/game` (non-test). `assetManifest.ts` remains pure data + pure functions; the device decision
  stayed in render (`App.tsx` names the target string, the game layer maps string → authored scene),
  which is precisely the shape the fix had to preserve. `src/render` holds no rules. `src/hooks`
  untouched by the whole diff.
- **The one architectural tension, now unconditionally accepted.** `GESTURE_EMBEDDED_ASSETS` /
  `DIAGRAM_EMBEDDED_ASSETS` put render knowledge in `src/game`. I accepted the placement in run 2
  **conditionally on a mechanical binding**; that binding now exists and is mutation-proven (probe 5).
  The condition is met, so the acceptance is now unconditional and ADR-0069 can carry it.
- **Cross-lane seams:** the single `assetManifest.ts` (game) ↔ `App.tsx` (render) seam was
  **serialised as instructed** — `dev-gameplay` landed step 1 and released the file, `dev-r3f-render`
  then landed step 2 and touched no `src/game` file. The shipped API matches the handed-off API
  exactly (`ManifestTarget` arms, `tutorialManifest`, no device parameter). No parallel edit occurred.
- **Dependencies / deploy:** unchanged. No new dependency, no new URL, no new storage key, no CI or
  workflow change, no `BASE_URL` handling change, no new committed asset. All new visuals remain
  inline SVG. `street-wide.png` was already shipped and served — the change is _when_ it is fetched
  and by whom, which is strictly a reduction on mobile and byte-identical on desktop.
- **Security:** nothing new. Every path added this round is a compile-time literal under `BASE_URL`.
- **Caps: verify↔build loop 2/2 — CLOSED AT CAP, NOT EXCEEDED.** Loop 1 = the run-1 panel rework;
  loop 2 = the MAJEUR-R2-01 round, whose re-verify (`qa-lead` run 4) came back PASS. Because I found
  no new blocker, no third loop is opened — had I confirmed one, it would have been 3/2 and an
  escalation to `producer`, not a rework. Design rework 1/2, asset-generation batches 0/2, cycle
  resets 0. All within cap.

#### ADR-0069 — Proposed → **Accepted** (done in this pass)

The reason I held it at Proposed in run 2 was that MAJEUR-R2-01 was about to change the D5 contract
it documents. That fix has landed and `tech-writer`'s §D5 correction names the shipped API
(`manifestFor("tutorial-desktop")` / `("tutorial-mobile")`, device-forked from the render layer's
single `IS_MOBILE` read, each fork warming only its own embedded illustration assets, no bare
`"tutorial"` target). I verified D5's text against the shipped code rather than against the
hand-off note. Status flipped to `Accepted` in
`docs/adr/0069-tutorial-immersion-narrative-contract.md`.
**Mechanical consequence handled:** the Status string is embedded in two GENERATED artifacts
(`docs/adr/README.md` and `public/adr/index.html`), and CI runs
`node scripts/gen-adr-index.mjs --check`. Flipping the field alone would have shipped a red freshness
gate, so I ran `--write` then `--check` (fresh, 69 ADR). The generated diff is status-only
(`Proposed`→`Accepted` on one row, `proposed`→`accepted` on one class). Stage 3 closes with this.

#### MERGE precondition (mechanical, owner: whoever holds the branch)

**The entire fix round is uncommitted, and `illustrationAssetBinding.test.ts` is untracked.** My
MERGE verdict is on the CONTENT of the working tree. Before merge: commit the round (do NOT use
`--no-verify`; the hook's lint-staged + `format:check` is part of the gate), push, and let the CI
`code-review-panel` workflow run — per ADR-0063 the `panel-verdict` check run on the pushed diff is
the merge-blocking authority and this local read is the pre-check. If the push contains anything
beyond what I read here, that is a new diff and this verdict does not cover it.

#### Still routed, still not blocking this merge

Unchanged from run 2: AC3 boss-HP clause → **`pm`, explicit accept-or-waive at stage 7** (my
recommendation stands: waive with a follow-up story) · teaching bullets rendering during typing →
`ux-designer` + `lead-game-designer` · embedded `<image>` `onError` → standing render-lane debt ·
`shot-read` freeze point, TUT-A11Y-01 container role, `[ CONTINUER ]` blink under reduced motion →
`ux-designer`. New this round: regression spec **TUT-LOAD-01** → `dev-tooling-assets` (the loading
label has no mechanical guard — `qa-lead`'s probe 6 SURVIVES, documented, and `ManifestTarget`'s
`(string & {})` arm means the type system will not catch it either) · the 2 NITs above.

- **MERGE.** Zero unresolved CONFIRMED blocking or major findings. Hand to `pm` for stage-7
  acceptance (with the AC3 call), then Bertrand merges once the pushed diff clears the CI panel.
- Files I touched in this pass, and no others: `docs/handoffs/story-tutorial-immersion-overhaul.md`
  (this entry + pipeline table rows 3/5/6/7), `docs/adr/0069-tutorial-immersion-narrative-contract.md`
  (Status field only), plus the two generator outputs `docs/adr/README.md` and `public/adr/index.html`
  (regenerated, not hand-edited — required by the freshness gate).

## stage-7. PM ACCEPT — pm (John) — 2026-07-26

- claim: stage-7 acceptance against the published scope artifact
  (`_bmad-output/planning-artifacts/story-tutorial-immersion-overhaul.md`) and
  `PROJECT_GUIDELINES.md`, plus the explicit AC3 accept-or-waive call senior-architect
  routed to me at run 2 and re-confirmed at run 3 / release: **ACCEPT — merge-ready**,
  AC3's boss-HP clause WAIVED with a documented follow-up (see below). No source or test
  file touched — docs only.

### Scope conformance — shipped vs published AC envelope

Read the full pipeline history in this shard (design-gate rework, 3 QA runs, 3 panel
runs) and the scope artifact side by side. AC-by-AC:

- **AC1 (crate pickup taught) / AC2 (weapon readout taught)** — both land on panel 5,
  per the 2026-07-26 design amendment (finding 4: the readout is taught where the
  crate/LOOT loop is drawn, not as a 17th panel). Verified against shipped systems by
  qa-lead run 2's "truth check" (panel 5 bullets match `WeaponReadout.tsx` label/glyph/
  stock semantics exactly). **Met.**
- **AC3 (boss-finale cues/conditions)** — 2 of 3 clauses met (chrono-to-zero telegraph;
  quota-no-longer-ends-the-level condition, both truthful to live level data). The third
  clause ("what to watch: boss HP / danger windows") has no explicit teaching beat.
  **Partially met — see waiver decision below.**
- **AC4–AC6 (immersion visuals)** — met: real Belliard facade backdrop, the
  `threat-hierarchy-ladder` diagram (danger order, `bulletDamage`-truth), the
  `shot-read` bullet/projectile cue (player shot vs incoming threat, motion-safe under
  reduced-motion after the run-1 rework). **Met.**
- **AC7–AC8 (device-fork correctness + parity)** — met, and stress-tested harder than
  the AC asked for: qa-lead's run-4 fork-coherence check proves the SAME run that
  preloads a fork's manifest also draws that fork's script (`TUTORIAL_FORK`'s single
  `IS_MOBILE` read). Fork indices [2,3] only, shared-segment identity locked by
  `tutorialInvariants`. **Met.**
- **AC9–AC10 (optional/skippable, no persistence)** — met: TUT-OPT-01/02, TUT-PERSIST-01
  held across every verify run, before AND after a full completion; only
  `muf_seen_tutorial_nudge` is ever written. **Met.**
- **AC11 (green checks)** — met: final mechanical gate `rtk tsc` clean, `rtk vitest`
  1202/1202, `rtk lint` clean, `format:check` clean, coverage thresholds held. **Met.**
- **AC12 (visual proof both device contexts)** — met: qa-lead's runs captured desktop +
  mobile screenshots at every targeted panel across 4 verify executions (session-local
  evidence, consistent with how this project has treated per-run QA proof elsewhere).
  **Met.**

### No scope creep, no silent AC drop

- **File map** — everything landed is inside the story's declared touch surface
  (`narrativeSystem.ts`, `assetManifest.ts`, `tutorialInvariants.test.ts`,
  `narrativeSystem.test.ts`, `assetManifest.test.ts`, `DiagramIcon.tsx`,
  `GestureIcon.tsx`, `NarrativeScreen.tsx`/`.module.css`) with two additions, both
  process-driven and both documented at the point they were introduced, not smuggled:
  `src/render/scene/App.tsx` (the device-fork seam MAJEUR-R2-01 forced — the story's own
  file map already named `App.tsx`'s tutorial branch as in-scope, "behavior unchanged",
  and the fix keeps that behavior unchanged, it just corrects which manifest target is
  read) and the new `illustrationAssetBinding.test.ts` (a test-only mechanical guard the
  architect made a condition of accepting an architecture placement, not a feature).
  Neither is a gameplay-rule change; both stay inside "Onboarding/tutorial surface only".
- **No new gameplay systems, balance, controls, or persistence** — confirmed
  independently across 4 qa-lead runs and 3 panel runs; the AC3 gap is a teaching
  omission, not an added or changed rule, so it is a shortfall against the brief, never
  scope creep.
- **The one AC gap (AC3, boss-HP clause) is not a silent drop** — it was CONFIRMED by
  the stage-6 panel (run 2, reviewer B), explicitly routed to `pm` twice (run 2 and run 3) rather than waved through, and is being closed out here with a named, reasoned,
  written decision plus a follow-up — exactly the documentation `PROJECT_GUIDELINES.md`
  demands for any conscious extension/deferral (§"Ces guidelines évoluent — toute
  modification doit être documentée et justifiée" applies equally to a scoped deferral).
- **Guidelines check** — tutorial remains a "conscious extension" of the core loop
  (ADR-0012), teaches only what already exists in shipped systems (no invented rules),
  keeps the `game/`↔`render/` boundary clean (confirmed CLEAN at both panel runs), and
  the mission-length / skippable / no-bullshit-death rules are untouched because nothing
  here changes gameplay. No guideline conflict.

### The AC3 call — ACCEPT the waiver, with reasoning

Senior-architect's recommendation (run 2, re-stood at run 3): waive AC3's boss-HP clause
for this story and ship as-is; open a follow-up rather than reopening the gated,
design-capped 16-panel map (ADR-0069) a second time.

**I accept the waiver.** Reasoning, as a cost/value call — not a shrug:

1. **What's actually missing is narrow.** AC3 has three clauses; two are taught
   correctly (chrono telegraph, finale condition). Only "what to watch: boss HP" has no
   beat. The diagram already carries a danger _window_ visually (the highlighted
   Belliard window + `!` badge) — the gap is specifically the HP-bar instrument, not the
   danger concept.
2. **The surface taught is low-frequency and downstream.** `BossHpBar` is a level-3
   encounter surface. A first-session tutorial player will not meet it for several
   missions after the tutorial — the teaching debt sits far from the moment it would
   bite, unlike, say, a control scheme taught wrong on panel 1.
3. **The cost to close it now is real and disproportionate.** ADR-0069 froze the
   tutorial at 16 panels; that map has already been re-gated once (design rework 1/2)
   and the story has already run 3 full QA execution passes and 3 stage-6 panel passes.
   Reopening design for a 17th panel (or restructuring the already-dense panel 13) means
   a second design-rework round PLUS another verify↔build loop on a story that just
   closed its cap at 2/2. That is not "a bit more polish" — it re-opens gates that are
   deliberately expensive to reopen, for one clause of one AC.
4. **Waiving is not free either, so I am not rubber-stamping.** It is a real, if small,
   first-session comprehension gap, which is why it gets a named follow-up below rather
   than a silent shrug. If the follow-up does not land before boss-finale content
   expands further (e.g. more boss variants reachable early), this call should be
   revisited — noted for whoever picks up the follow-up.

**Verdict on the open call: WAIVE AC3's boss-HP clause for this story. Open a follow-up
(below).**

### Follow-up backlog artifact — convention check

Checked for an existing backlog structure before inventing one: `_bmad-output/planning-
artifacts/` holds only full story-spec files (no lightweight "backlog" doc type);
`docs/qa/regressions.md`/`docs/qa/README.md`'s "known e2e holes" list is qa-lead's
escaped-bug ledger, not a product-scope backlog; the project's actual convention for a
scoped, not-yet-opened follow-up is a **`## Follow-ups (out of this story)` section
inside the closing story's own handoff shard**, cross-referenced from the
`docs/agent-handoffs.md` index row (precedent: `story-adr-undeveloped-backlog.md`'s own
such section; `story-boss-qte-differentiation`'s "Follow-up register" surfaced the same
way in its index note). Followed that convention — see the section below and the index
update.

### VERDICT: ACCEPT — merge-ready

Scope matches the published AC envelope with one explicitly waived clause (documented
above). No scope creep, no silent AC drop. Stage-6 verdict (MERGE) stands; the only
remaining item before Bertrand merges is the pre-existing stage-6 mechanical
precondition (commit the uncommitted round without `--no-verify`, push, wait for the CI
`panel-verdict` check run per ADR-0063). Handing to Bertrand/orchestrator for stage 8.

## Follow-ups (out of this story)

- **Boss-HP teaching beat (AC3 third clause, waived above).** Not opened as a full
  pipeline shard yet — flagging for `producer`/Bertrand intake at stage 0/1 when
  prioritized. Scope sketch for whoever opens it: teach "watch the boss HP bar" as a
  live mechanic, either as a new beat on the existing panel 13 (`boss-finale-switch`) if
  it can be added without breaking AC9-class reduced-motion/overprint constraints already
  hard-won on that panel, or as a 17th panel if not — either way it REOPENS ADR-0069's
  16-panel map and needs a fresh `lead-game-designer` design-gate pass (its own rework
  cap, independent of this story's spent 2/2). Truth source: `BossHpBar.tsx` (render) +
  the boss HP/finale data it reads (game) — keep it as truthful-to-shipped as the rest of
  this story's panels, no invented boss mechanics.
- Carried over from stage-6 run 3, still open, none blocking this merge (repeated here
  for discoverability, not duplicated ownership — the stage-6 entry above is authoritative):
  regression spec **TUT-LOAD-01** (owner `dev-tooling-assets`) · teaching-bullets-render-
  while-typing call (owner `ux-designer` + `lead-game-designer`) · embedded `<image>`
  `onError` fallback (standing render-lane debt) · `shot-read` freeze-point separation,
  TUT-A11Y-01 container role/name, `[ CONTINUER ]` blink under reduced motion (all owner
  `ux-designer`) · 2 NITs from stage-6 run 3 (hand-written kind lists in the binding test;
  ADR-0069 D5 → test cross-reference), owners `dev-r3f-render` / `tech-writer`.
