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

## Pipeline status (stages 0-8)

| Stage           | Status                     | Owner now                     | Next hand-off                          | Blockers / risk                                                |
| --------------- | -------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| 0. INTAKE       | done                       | producer                      | —                                      | none                                                           |
| 1. SCOPE        | done                       | pm                            | —                                      | none                                                           |
| 2. DESIGN GATE  | done (re-gate PASS)        | lead-game-designer            | —                                      | rework rounds used: 1/2                                        |
| 3. ARCHITECTURE | in progress                | senior-architect              | finalize ADR-0069 gate outcome         | ADR still Proposed                                             |
| 4. BUILD        | done                       | dev-gameplay ∥ dev-r3f-render | QA execution                           | none                                                           |
| 5. VERIFY       | in progress (plan logged)  | qa-lead                       | run verify and log PASS/FAIL gate      | verify execution pending                                       |
| 6. REVIEW       | run 1: NO-MERGE (5 MAJEUR) | dev lanes + design            | apply fixes → re-verify → re-run panel | reduced-motion frames, D2.2 bullets, AC2 HUD, 5.9 MB warm miss |
| 7. PM ACCEPT    | pending                    | pm                            | merge                                  | waits stage-6 verdict                                          |
| 8. MERGE        | pending                    | Bertrand/orchestrator         | close story                            | waits stage-7 accept                                           |

Caps watch: design rework 1/2, asset-generation batches 0/2, verify↔build loops 0/2.  
Cycle reset count: 0 (no reset declared).
