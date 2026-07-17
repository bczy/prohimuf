---
stepsCompleted: [1, 2, 3, 4]
workflow_completed: true
session_active: false
inputDocuments: []
session_topic: "Making the hostage-rescue QTE (ADR-0030) more interesting and less easy"
session_goals: "Generate gameplay mechanics and tuning ideas that raise the challenge and tension of the hostage QTE while staying faithful to Prohibition (Atari ST 1987), the project scope guard, and the pure-logic src/game architecture"
selected_approach: "ai-recommended"
techniques_used: ["First Principles Thinking", "SCAMPER Method", "Reverse Brainstorming"]
ideas_generated: [22]
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

**DECIDED (Bertrand):** distance only. The porte cochère is the single clock; `windowSeconds` leaves the active design.

## Idea Organization and Prioritization

**Thematic Organization (kept ideas only):**

**Theme A — The Living Duel** _(captor behaviour)_
- **#1 Living Human Shield:** `COVERED ↔ PEEKING` states; head one-shot only during openings.
- **#2 Diegetic Countdown:** telegraphed poses replace abstract timing; every exposure is announced (G4).
- **#9 His Peek Is His Shot:** the captor's exposure is also his attack on you — opportunity window = danger window.
- _Pattern:_ the difficulty lives in READING the adversary, not in hitbox size.

**Theme B — Spatial Pressure** _(the street as clock)_
- **#21 Retreat to the Porte Cochère:** the captor drags the hostage backward; reaching the door = failure. Sole clock (decided).
- **#3 Slow-Motion Instead of Freeze:** the level keeps living at ~20%; ambient threat capped (G7).
- _Pattern:_ time pressure is diegetic and spatial, never a UI bar.

**Theme C — Energy Economy** _(the stakes)_
- **#6 Energy Leaks During the QTE:** waiting is never free (G1), but drain allows ~2 peek cycles (G8).
- **#16 Fuel Station:** clean rescue = the level's big energy refill — strategic, not cosmetic.
- **#17 Panic Shot:** firing during the zoom is penalized — the zoom teaches the core reflex.
- _Pattern:_ every QTE beat priced in the continuous stat Bertrand chose as THE currency.

**Theme D — Progression** _(difficulty curve)_
- **#12 Per-Level Curve:** retreat speed, peek length/frequency tuned per `QteSpec` (floors: G2, G5).
- **#8 The Accomplice:** second shooter, advanced levels only.
- _Pattern:_ escalation through existing per-level data, no new architecture.

**Prioritization Results:**

- **Top priority (the core rework):** Themes A + B together — they are one mechanic (the duel) and replace the static tableau + abstract timer.
- **Quick wins:** #17 (panic shot: small rule, immediate flavor), #16/#6 (retune existing energy constants).
- **Breakthrough concept:** #21+#9 fusion — the street as clock combined with bidirectional danger is what turns "aim once" into "hold your nerve".
- **Deferred:** #8 accomplice (needs new entity + sprite lane; ship the duel first).

**Action Planning (BMAD pipeline):**

1. **`game-designer`** — spec "Le duel de la porte cochère" in `docs/game-design/`: state machine (COVERED/PEEKING/pose telegraphs), retreat path & speed, peek cadence with floors (≥0.5 s exposure, 0.8–1.2 s target), energy table (drain rate sized for 2 peek cycles, rescue refill, panic-shot & hostage-hit penalties), per-level tuning table, guardrails G1–G8 as acceptance criteria. → **`lead-game-designer`** gate.
2. **`senior-architect`** — ADR superseding the frozen-scene/`windowSeconds` parts of ADR-0030 (slow-mo tick contract, moving anchor, distance clock); lane assignment.
3. **Dev lanes (parallel):** `dev-gameplay` (qteSystem rework, TDD in `src/game/systems/__tests__/`) ∥ `dev-r3f-render` (slow-mo, retreating tableau, pose rendering) ∥ art lane (captor pose sprites: covered / peeking / gun-raised, drag walk) via `concept-artist` → `lead-art` gate.
4. **`qa-lead`** verify → code-review panel → `pm` acceptance.

**Success metrics:** a first-try player fails the rescue more often than not but can always name why; a skilled player saves her with 1–2 headshots during peeks; ignoring the QTE is clearly costly (energy economy); zero "unreadable" complaints in playtest (P3).

## Session Summary and Insights

**Key Achievements:**

- 22 ideas across 3 techniques; 10 kept by explicit votes; 8 anti-frustration guardrails; 1 coherent synthesized system ("Le duel de la porte cochère") with its open question resolved (distance-only clock).

**Session Reflections:**

- First Principles unlocked the session: naming "stakes first / motion breeds sang-froid / no punitive RNG" made every later vote fast and consistent.
- Bertrand's votes drew a sharp line: deepen the duel *inside* the existing framing (keep banner, keep scripted trigger, keep body zones) — reject rule complexity and frame-breaking. The rejected ideas (#4, #11, #13–15, #18–20, #22) are documented as consciously out of scope.
- Reverse Brainstorming earned its place: G1 (waiting is never free) is the single lock that prevents the new design from regressing into "wait for the obvious peek, shoot once".

## Post-Session Coherence Pass (redundancies & conflicts)

Bertrand asked whether the 10 kept ideas overlapped or conflicted. Four intersections were identified and ruled on:

1. **#6 (energy drain) vs #21 (door clock) — redundant waiting costs.** The drain was a second, disguised clock; the door already makes waiting costly.
   **DECIDED: #6 demoted.** No tick tax. Energy remains the *outcome* currency only: rescue refill (#16), panic shot (#17), hostage-hit penalty.
2. **#2 (pose countdown) vs #21 — original meaning gone.** With the door as sole clock, there is no execution countdown for the poses to express.
   **DECIDED: #2 deleted.** No pose-countdown system. (G4 still requires each peek to be readable — the tell becomes a minimal pre-peek cue, spec detail, not a countdown mechanic.)
3. **#9 + #8 + #3 — up to three sources of incoming fire.** Stacked, they become noise and violate P3.
   **DECIDED: #3 deleted.** Back to full freeze of the rest of the level; the QTE tableau alone is alive. #9 is THE active threat; #8 (accomplice, late levels) *replaces* the captor's counter-fire role rather than adding to it (role division: captor on hostage, accomplice on you).
4. **#1 (human shield) vs earlier rejection of #18 — safe-DPS loophole.** If the torso stays shootable while COVERED, impatient chip damage bypasses the wait-duel entirely.
   **DECIDED: #18 adopted after all.** Head-only damage, valid only during PEEKING. The body-part damage table leaves the design; the duel is binary — one clean headshot during an opening, or nothing.

### Final system — "Le duel de la porte cochère" (v2, post-coherence)

1. Scripted trigger + OTAGE banner + 2 s zoom unchanged; firing during zoom = penalized panic shot (#17).
2. Rest of the level **freezes** (as today); the QTE tableau alone is alive.
3. Captor retreats toward a porte cochère dragging the hostage (#21) — the street is the **sole clock**; reaching the door = she's gone (fail).
4. Human shield (#1): `COVERED` while dragging; brief telegraphed `PEEKING` exposures during which **he shoots at you** (#9, −energy if unanswered).
5. **Head-only** (#18, refined): the rescue is one clean headshot during a peek. Hitting the captor's **body drains the player's energy** (small penalty — reckless spray bleeds you); hitting the hostage = heavy penalty. Sanction hierarchy: body = small cost, hostage = big cost, head-during-peek = win. Nothing else counts.
6. Energy = outcome currency only: rescue refill (#16), panic shot (#17), hostage hits. No passive drain (#6 demoted).
7. Per-level curve (#12): retreat speed, peek frequency/length (floors G2/G5); accomplice (#8) in late levels, replacing captor counter-fire.

**Final kept set:** #1, #8, #9, #12, #16, #17, #18, #21 (with #6 demoted to outcome-only, #2 and #3 removed).

## Feature Grouping (delivery-ready)

**F1 — Le tableau vivant** _(core, largest)_
Captor as an animated adversary: retreat toward the porte cochère as sole clock (#21, `windowSeconds` removed), `COVERED ↔ PEEKING` state machine behind the hostage (#1), counter-fire during exposures (#9, −energy if unanswered).
Scope: `qteSystem` rework + types, moving anchor, spatial fail condition. Parallel art lane: drag / peek / firing sprites.

**F2 — La règle du tir** _(rules, medium — depends on F1)_
Impact economy: head-during-peek = win; captor body = player energy drain (spray bleeds); hostage = heavy penalty (#18 refined); panic shot during zoom penalized (#17); clean rescue = big refill (#16).
Scope: pure rules on zones + tuning constants + HUD feedback.

**F3 — La courbe de difficulté** _(small, data — depends on F1+F2)_
Per-level `QteSpec` extension: retreat speed, peek cadence/duration (#12), hard anti-frustration floors baked in (exposure ≥ 0.5 s, readable tells — G2/G4/G5). Belliard-first rollout.

**F4 — Le complice** _(deferred, late levels)_
Second shooter (#8) that REPLACES captor counter-fire (captor on hostage, accomplice on you). New entity + sprite. Only after F1–F3 pass playtest.

**Delivery order:** F1 → F2 → F3 (F1+F2 = first playable lot: the duel), F4 later.
