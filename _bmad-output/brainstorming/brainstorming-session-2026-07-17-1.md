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

_Session paused for Bertrand's reactions before M/P/E/R lenses and Reverse Brainstorming._
