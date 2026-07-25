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

## Pipeline status (stages 0-8)

| Stage           | Status                    | Owner now                     | Next hand-off                     | Blockers / risk          |
| --------------- | ------------------------- | ----------------------------- | --------------------------------- | ------------------------ |
| 0. INTAKE       | done                      | producer                      | —                                 | none                     |
| 1. SCOPE        | done                      | pm                            | —                                 | none                     |
| 2. DESIGN GATE  | done (re-gate PASS)       | lead-game-designer            | —                                 | rework rounds used: 1/2  |
| 3. ARCHITECTURE | in progress               | senior-architect              | finalize ADR-0069 gate outcome    | ADR still Proposed       |
| 4. BUILD        | done                      | dev-gameplay ∥ dev-r3f-render | QA execution                      | none                     |
| 5. VERIFY       | in progress (plan logged) | qa-lead                       | run verify and log PASS/FAIL gate | verify execution pending |
| 6. REVIEW       | pending                   | review panel                  | pm acceptance                     | waits stage-5 verdict    |
| 7. PM ACCEPT    | pending                   | pm                            | merge                             | waits stage-6 verdict    |
| 8. MERGE        | pending                   | Bertrand/orchestrator         | close story                       | waits stage-7 accept     |

Caps watch: design rework 1/2, asset-generation batches 0/2, verify↔build loops 0/2.  
Cycle reset count: 0 (no reset declared).
