# QA verify plan — Tutorial immersion overhaul

**Story:** `_bmad-output/planning-artifacts/story-tutorial-immersion-overhaul.md`  
**Specs:** `docs/game-design/tutorial-immersion-teaching-spec.md`, `docs/game-design/ux/spec-tutorial-narrative-presentation.md`  
**ADR:** `docs/adr/0069-tutorial-immersion-narrative-contract.md`  
**Owner:** `qa-lead` (Inès) · **Stage:** 5 (VERIFY) · **Status:** PLAN-ONLY (pre-implementation)

## 1) Verify scope (must hold)

1. Desktop/mobile tutorial flow remains deterministic and complete (16 panels each, same shared indices, fork only on controls).
2. Control fork correctness stays device-accurate (desktop mouse/edge-scroll; mobile two-finger tap/swipe-pan).
3. Cue readability is preserved for:
   - projectile literacy (player shot vs enemy bullet),
   - crates/weapons/readout loop,
   - enemy taxonomy + threat hierarchy,
   - boss finale expectation switch.
4. Tutorial remains optional, skippable, and persistence-inert (no progress/high-score writes).
5. Reduced-motion + accessibility contract holds (labels, role/name, touch targets, non-pulsing fallback).

## 2) Mechanical gate (run on implementation branch)

- `yarn typecheck`
- `yarn vitest run`
- `yarn lint`
- `yarn test:coverage` (thresholds for `src/game`: 80% lines/functions/branches/statements)

Expected: all commands exit 0.

## 3) Deterministic verification scenarios

### A. Tutorial flow + device matrix

| ID          | Device                          | Steps                                                         | Expected outcome                                                                       |
| ----------- | ------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TUT-FLOW-01 | Desktop 1280×720                | Launch `?preview=tutorial`; complete all panels without skip. | Exactly 16 panels shown; flow ends back to menu; no dead-end screen.                   |
| TUT-FLOW-02 | Mobile landscape (iPhone class) | Launch `?preview=tutorial`; complete all panels without skip. | Exactly 16 panels shown; same panel count/progress parity as desktop; returns to menu. |
| TUT-FLOW-03 | Desktop + Mobile                | On panel 0, 8, 15 trigger **Skip**.                           | Skip works at each point; immediate return to menu; no crash/pageerror.                |
| TUT-FLOW-04 | Desktop + Mobile                | While typewriter runs: input once, then input again.          | First input completes current line only; second input advances exactly one panel.      |

### B. Control fork correctness

| ID          | Steps                                               | Expected outcome                                                                                        |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| TUT-FORK-01 | Inspect tutorial data invariants.                   | Only indices 2 and 3 are forked; shared reference indices remain `[0,1,4,5,6,7,8,9,10,11,12,13,14,15]`. |
| TUT-FORK-02 | Desktop run: read panel copy/tokens at indices 2–3. | Desktop uses `mouse-click` + `edge-scroll`; no finger wording.                                          |
| TUT-FORK-03 | Mobile run: read panel copy/tokens at indices 2–3.  | Mobile uses `two-finger-tap` + `swipe-pan`; no mouse wording.                                           |

### C. Cue readability + teaching truth

| ID         | Steps                             | Expected outcome                                                                                                                   |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TUT-CUE-01 | Check panel 4 cue.                | Diagram token `shot-read-player-vs-enemy-bullet`; clearly distinguishes instant player hit vs travelling enemy projectile threat.  |
| TUT-CUE-02 | Check panel 5 cue and text.       | `weapon-crate-loop` teaches: shoot crate → equip special (`auto`/`spread`) → finite stock → auto return to `base` (`∞`).           |
| TUT-CUE-03 | Check panels 6–11.                | Enemy identity cues are readable; hierarchy panel reflects Riot > Biker > Normal > Bonus/Courier (non-target semantics preserved). |
| TUT-CUE-04 | Check panel 13.                   | `boss-finale-switch` truthfully states timer expiry switches boss levels to finale condition; no invented rules.                   |
| TUT-CUE-05 | Sweep all 16 panels.              | Max one primary cue per panel (`image` OR `gesture` OR `diagram`), never stacked.                                                  |
| TUT-CUE-06 | Sweep bullet reinforcement usage. | `teachingBullets` never exceeds 2 lines per panel; bullets present only where intended for high-risk misunderstandings.            |

### D. Optional/skippable/persistence-inert

| ID             | Steps                                                                     | Expected outcome                                                         |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| TUT-OPT-01     | Enter tutorial from menu and complete normally.                           | Always returns to menu at tutorial end; gameplay state not auto-started. |
| TUT-OPT-02     | Enter tutorial, skip mid-flow, then reopen tutorial.                      | Tutorial is replayable and unaffected by prior completion/skip.          |
| TUT-PERSIST-01 | Clear storage; run complete tutorial and skip path; inspect storage keys. | No writes to `muf_progress`; no high-score key writes (`muf_scores_*`).  |

### E. Reduced motion + accessibility

| ID          | Steps                                                                              | Expected outcome                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TUT-A11Y-01 | Inspect NarrativeScreen semantics during tutorial.                                 | Dialog-like container has role + accessible name; skip has explicit destination label (“skip tutorial, return to menu” semantics). |
| TUT-A11Y-02 | Inspect cue accessibility labels panel-by-panel.                                   | Primary cue node has non-empty alt/aria label when informative; decorative/empty labels hidden from a11y tree.                     |
| TUT-A11Y-03 | Enable reduced motion (`prefers-reduced-motion: reduce` + in-app flag if present). | Gesture/diagram cues render as static, non-pulsing states; tutorial remains fully operable.                                        |
| TUT-A11Y-04 | Mobile landscape target check.                                                     | Skip/continue interactive targets meet ≥44×44 CSS px and remain reachable (not occluded by browser UI).                            |

## 4) Required deterministic test updates (spec for dev lanes)

- `dev-gameplay` (unit/invariants):
  - `src/game/levels/__tests__/tutorialInvariants.test.ts`
  - `src/game/systems/__tests__/narrativeSystem.test.ts`
  - `src/game/systems/__tests__/assetManifest.test.ts` (if tutorial backdrop/image references change)
- `dev-tooling-assets` (e2e scenarios):
  - Add tutorial flow script(s) under `scripts/e2e-home/ingame/` covering scenarios TUT-FLOW-01/02/03/04, TUT-FORK-02/03, TUT-CUE-01/02/04, TUT-PERSIST-01, TUT-A11Y-03.

## 5) Pass/fail rule for the quality gate

- **PASS**: All mechanical checks green + all scenarios above pass on desktop and mobile profiles.
- **FAIL**: Any single scenario fails, or any scenario is unrun without explicit CI-DEFERRED note + escalation path.
