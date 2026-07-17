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
