---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: "Making the hostage-rescue QTE (ADR-0030) more interesting and less easy"
session_goals: "Generate gameplay mechanics and tuning ideas that raise the challenge and tension of the hostage QTE while staying faithful to Prohibition (Atari ST 1987), the project scope guard, and the pure-logic src/game architecture"
selected_approach: "ai-recommended"
techniques_used: ["First Principles Thinking", "SCAMPER Method", "Reverse Brainstorming"]
ideas_generated: []
context_file: ""
---

# Brainstorming Session Results

**Facilitator:** Claude (BMAD brainstorming)
**Participant:** Bertrand.coizy
**Date:** 2026-07-17

## Session Overview

**Topic:** Making the hostage-rescue QTE (ADR-0030) more interesting and less easy.

**Goals:** Generate mechanics/tuning ideas that raise challenge and tension of the hostage phase.

### Context Guidance

Current implementation (`src/game/systems/qteSystem.ts`, ADR-0030):

- Scripted trigger, once per level, deterministic (`triggerAtElapsedSeconds`).
- Scene freezes → 2 s zoom → 5 s shootable window.
- Captor 4 HP; per-part damage: head = 4 (one-shot), torso = 2, arm/legs = 1.
- Hostage 3 HP; each stray hit −25 energy / −3 score; timeout −15 energy / −2 score.
- Success: +8 score, +15 energy (side objective, never advances the kill quota).
- Static tableau: captor + kneeling hostage at fixed anchor, fixed hitbox bands.

**Why it's too easy:** one aimed head-shot in a generous 5 s window on a static target, with a scripted, predictable trigger.

**Constraints:**

- Fidelity to Prohibition (Atari ST 1987) — "cahier des charges" test from PROJECT_GUIDELINES.
- Pure logic in `src/game` (zero React/Three); rendering only reflects state.
- Universe: 1998 Paris clandestine rave scene.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Hostage QTE difficulty/interest redesign — concrete existing system, hard constraints, problem-solving + innovation goal.

**Recommended Techniques:**

- **First Principles Thinking (creative):** Strip the QTE to what fundamentally creates tension in a hostage standoff; produce design principles that filter all later ideas.
- **SCAMPER Method (structured):** Systematically mutate every enumerable parameter of the current QTE (trigger, zoom, window, zones, HP, penalties, tableau, frequency) through the seven lenses.
- **Reverse Brainstorming (creative):** Explore "how to make it more boring / unfairly punishing" to locate the real difficulty levers and the frustration line not to cross.

**AI Rationale:** The system is concrete and parameterized → structured mutation (SCAMPER) yields volume; but without first naming what tension *is* (First Principles) the mutations would just inflate numbers; and difficulty work needs an anti-frustration guardrail (Reverse Brainstorming) to separate real challenge from fake difficulty.

## Technique Execution Results

### Phase 1 — First Principles Thinking

**Bertrand's inputs:**

1. Timing > aiming confirmed, but the deeper missing fundamental is **absence of stakes**.
2. No memory of hostages in the original Prohibition — checked against ADRs: the hostage-taker is already a **documented conscious extension** (ADR-0030, bestiary §3), so the reference is the bestiary + our own design choices, under scope-guard discipline.
3. Target feeling: **sang-froid** — "rien ne bouge, ce n'est pas très stressant".

**Design principles (filters for all subsequent ideas):**

- **P1 — Stakes first:** the QTE outcome must matter to the run (current ±15 energy / ±8 score is negligible; even ignoring the QTE is near-optimal).
- **P2 — Motion breeds sang-froid:** cool-headedness only exists when there is a temptation to fire too early — relative captor/hostage motion, passing openings.
- **P3 — Sang-froid ≠ panic:** readable danger, visible windows, no punitive RNG. Player must always conclude "I cracked", never "that was unreadable".
- **P4 — Fidelity note:** extension territory, bestiary §3 is the reference document.

### Phase 2 — SCAMPER (in progress)

**[Substitute #1]**: Living Human Shield
_Concept_: Captor hides behind the hostage and only peeks intermittently (`COVERED ↔ PEEKING` states in pure logic). Head one-shot still exists but only during openings.
_Novelty_: Converts aim-skill into wait-skill; directly implements P2.

**[Substitute #2]**: Diegetic Countdown
_Concept_: Replace the abstract timer bar with 3 captor poses (gun down → gun raised → barrel on temple). The pose IS the timer.
_Novelty_: Time pressure becomes something you read in the scene, not on the HUD.

**[Substitute #3]**: Slow-Motion Instead of Freeze
_Concept_: Scene runs at ~20% speed instead of freezing; window cops keep (slowly) aiming at you during the QTE.
_Novelty_: Staying calm while under threat — the freeze currently removes all ambient pressure.

**[Substitute #4]**: Micro-Windows
_Concept_: The hostage struggles and breaks the grip in bursts (~0.6 s openings); firing outside an opening risks hitting her.
_Novelty_: Discretizes the window into moments to seize; punishes impatience, not aim.

**[Combine #5]**: Wire It Into the Core Loop
_Concept_: Successful rescue → ×2 score multiplier for 20 s; hostage killed → combo/multiplier reset to zero.
_Novelty_: The stake becomes the central system, not a side bonus (P1).

**[Combine #6]**: Energy Leaks During the QTE
_Concept_: Every second of waiting drains energy — sang-froid has a price; waiting for the perfect opening is itself a gamble.
_Novelty_: Creates a wait-vs-risk economy inside the QTE.

**[Combine #7]**: Named Recurring Hostage
_Concept_: The hostage is a cast character (KENZA/DISPATCH narrative thread); saving/losing her changes later level briefings.
_Novelty_: Fictional stakes layered on mechanical ones; hooks narrative-designer.

**[Combine #8]**: Two Captors
_Concept_: A real captor plus an accomplice who shoots at you during the window — target-priority choice under pressure.
_Novelty_: Adds a decision, not just a harder shot.

**[Adapt #9]**: Time Crisis Exposure
_Concept_: The captor periodically pops out of cover to shoot YOU (−energy if you didn't hit him during his exposure).
_Novelty_: Bidirectional danger — the original's "he's about to act" pressure restored.

**[Adapt #10]**: Operation Wolf Escape Run
_Concept_: Once the captor is wounded, the hostage flees across the screen — phase 2: cover her escape without hitting her.
_Novelty_: Two-beat set-piece; the rescue isn't over when the shot lands.

**[Adapt #11]**: The Feint
_Concept_: Captor fakes an execution (shoulder twitch) to make you crack; firing during the feint makes the hostage panic and move — zones shift.
_Novelty_: Punishes nervous trigger, not aim; readable tell keeps it fair (P3).

**Bertrand's reactions (S/C/A batch):** #1 COOL · #2 COOL · #3 COOL · #4 NON · #5 NON · #6 COOL · #7 BOF · #8 COOL · #9 COOL · #10 NON · #11 NON.

**Emerging pattern:** keep everything that makes the danger *alive and readable* (human shield, poses, slow-mo, counter-fire, accomplice) and the **energy** economy as the stake; reject erratic-motion gimmicks (struggle, feint, escape run) and score-based stakes. Emerging system: *a duel of patience against an adversary who actively threatens you, paid in energy.*

**[Modify #12]**: Per-Level Curve
_Concept_: `QteSpec` is already per level — shorter/rarer PEEKING openings and tighter total window each level. Belliard teaches, later levels punish.
_Novelty_: Difficulty progression using existing data plumbing, zero new architecture.

**[Modify #13]**: Magnify Failure
_Concept_: Hostage executed = heavy energy hit (−50, not −15), consistent with the all-energy economy Bertrand chose via #6.
_Novelty_: Makes failure genuinely feared without touching score systems.

**[Modify #14]**: The Wounded Get Angry
_Concept_: Each non-lethal hit (arm/leg) shortens his subsequent exposures and speeds up his pose countdown.
_Novelty_: Chip damage becomes a real risk/reward choice instead of a consolation prize.

**[Modify #15]**: Shooter's Breath
_Concept_: Slight impact-point sway during the QTE (heartbeat) that settles if you hold fire for ~1 s. Pure logic: offset as a function of time.
_Novelty_: Mechanically rewards sang-froid itself.

**[Put-to-other-uses #16]**: The QTE as Fuel Station
_Concept_: With energy leaking during the QTE (#6) and all outcomes priced in energy, a fast clean rescue becomes THE big refill of the level.
_Novelty_: Elevates the QTE from side bonus to strategic survival decision.

**[Put-to-other-uses #17]**: Make the Zoom Earn Its Keep
_Concept_: Firing during the 2 s zoom = penalized panic shot. The zoom teaches the core reflex: don't shoot what you can't read.
_Novelty_: Dead time becomes the tutorial for the phase's core skill.

**[Eliminate #18]**: Eliminate the Body as Target
_Concept_: Only the head (during PEEKING) wounds the captor; torso/arms/legs merely anger him (#14). Radicalizes the 1+2+9 trio into a pure timing duel.
_Novelty_: Removes the damage-table simulation in favor of one readable skill test.

**[Eliminate #19]**: Eliminate the Post-Verdict Breather
_Concept_: Scene resumes instantly after WON/LOST, window cops already mid-aim (consistent with slow-mo #3).
_Novelty_: No free breathing room — the rescue lives inside the level, not beside it.

**[Eliminate #20]**: Eliminate the "OTAGE" Banner
_Concept_: Replace the UI warning with a diegetic cue (off-screen scream + the tableau sliding into frame). Info stays readable (P3) but stops being a defusing announcement.
_Novelty_: Preserves surprise without sacrificing fairness.

**[Reverse #21]**: The Tableau Moves
_Concept_: The captor backs away dragging the hostage toward a porte cochère for the whole QTE (existing `Courier` movement model). Reaching the door = gone with her (fail). The street itself is the timer.
_Novelty_: Spatializes the countdown; tracking + waiting compound.

**[Reverse #22]**: Reverse the Trigger
_Concept_: No fixed `triggerAtElapsedSeconds` — the taker first appears as a street silhouette crossing with his victim; if you fail to neutralize him before he entrenches, THEN the QTE fires. The player causes the event; runs differ.
_Novelty_: Converts a scripted cutscene into a consequence of play.

**Bertrand's reactions (M/P/E/R batch):** #12 OK · #13 NON · #14 NON · #15 NON · #16 OK · #17 OK · #18 NON · #19 NON · #20 NON · #21 OK · #22 NON.

**Kept overall:** #1, #2, #3, #6, #8, #9, #12, #16, #17, #21. **Rejected:** everything that complicates internal rules (per-limb meta, anger escalation, aim sway) or breaks readability/framing (banner removal, breather removal, dynamic trigger). Direction: *a readable, classic duel deepened from the inside — not a reframe.*

### Phase 3 — Reverse Brainstorming (anti-goals → guardrails)

**"How would we make it MORE boring?"**

- Waiting at no cost → **G1:** energy leak (#6) + porte-cochère timer (#21) make waiting never free — THE anti-triviality lock.
- Exposures long enough to aim comfortably → **G2:** peeks shorter than comfortable-aim time (~0.8–1.2 s), tuned per level (#12).
- Identical script every run → **G3 (accepted):** arcade light-gun memorability IS genre fidelity; variety comes from the per-level curve, not randomness (consistent with rejecting #22).

**"How would we make it unfairly frustrating?"**

- Random peeks with no tell → **G4:** every exposure telegraphed by the preceding pose (#2); player must always conclude "I cracked", never "unreadable" (P3).
- Peeks below human reaction time → **G5:** hard floor ≈ 0.5 s exposure, even at max difficulty.
- Hostage hitbox overlapping the peek zone → **G6:** clean spatial separation between peeking head and hostage silhouette, especially with the retreating tableau (#21).
- Slow-mo ambient fire killing the patient player → **G7:** ambient slow-mo shots are pressure, capped; the real active threat is the accomplice (#8) / captor counter-fire (#9), readable and answerable.
- Energy drain punishing clean waiting → **G8:** drain rate must allow waiting ~2 full peek cycles without endangering the gauge.

### Emerging synthesis — "Le duel de la porte cochère"

1. Scripted trigger + OTAGE banner + 2 s zoom unchanged; firing during zoom = penalized panic shot (#17).
2. Scene drops to slow-motion instead of freezing (#3).
3. Captor retreats toward a porte cochère dragging the hostage — reaching it = she's gone (fail). The street is the timer (#21), replacing the abstract bar.
4. He hides behind her (#1), exposing himself only in pose-telegraphed bursts (#2); his peek is also his shot at you (#9): the opportunity window IS the danger window.
5. Everything is priced in energy: drain during the QTE (#6), clean rescue = big refill (#16).
6. Per-level curve (#12): retreat speed, peek length/frequency; the accomplice (#8) only appears in advanced levels.

**Open question:** with the door as spatial timer, keep `windowSeconds` as belt-and-braces or make distance the only clock? Facilitator's lean: distance only — two clocks is one too many to read.
