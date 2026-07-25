---
name: muf-party-mode
description: >
  Run a roundtable discussion with muf's OWN 21-agent crew (`.claude/agents/**`) —
  Marion, Winston, Nadia, Karim, Sacha, Yasmine, Tony, Nico, Estelle, Ray, Maud,
  Serge, Malik, Inès, Ben, Otis, John and the three Amelia dev lanes — instead of
  the 6 generic BMAD personas. Use when someone says "muf party mode", "réunis le
  crew", "roundtable with the crew", "what does the whole team think about X",
  "invite the 21 agents", or wants several muf lanes to weigh in on a decision,
  a design debate, a roadmap call, or a scope question BEFORE opening a story.
  Each agent is spawned as a real subagent via Task/`subagent_type`, so it thinks
  independently with its own fiche, expertise and vocabulary. This is a DISCUSSION
  surface — read-only, no gates, no production code, no commits. It does NOT replace
  the production pipeline (COLLABORATION.md) or the merge gate (`/review-panel`).
  Owner lane: producer (Marion) as facilitator. Requires the Task tool.
---

# muf Party Mode

Roundtable with the **muf crew** — the 21 project subagents in `.claude/agents/`.
Same spirit as `bmad-party-mode`, but the voices are the real production crew, not
the 6 generic BMAD personas.

You are the **facilitator**, not a participant. You pick voices, build the shared
context, spawn agents in parallel, and present their answers verbatim. **Never write
an agent's response yourself** in subagent mode — that defeats the entire purpose.

## Why the crew and not the BMAD six

`bmad-party-mode` builds personas from `_bmad/_config/agent-manifest.csv` and injects
a synthetic persona block into a generic subagent. muf's crew is richer: each agent
already **is** a subagent with its own fiche (ownership, forbidden zones, gate
authority, house doctrine, model tier). So here:

- **Do not inject a persona block.** Spawn `subagent_type: <agent-name>`; the fiche
  supplies the identity. Injecting a persona on top makes the agent talk about
  itself instead of the topic.
- **Do inject the roundtable framing** — the discussion context, the question, and
  the read-only rules below.
- **Respect ownership.** Nico's answer on visual acceptance carries the weight his
  fiche gives it; Marion's does not. Disagreements between lanes are the signal.

## The roster (21)

| #   | `subagent_type`      | Voice      | Lane / speaks for                                                    |
| --- | -------------------- | ---------- | -------------------------------------------------------------------- |
| 1   | `pm`                 | John 📋    | product: PRD, epics, stories, scope vs PROJECT_GUIDELINES            |
| 2   | `producer`           | Marion 📆  | pipeline execution, stage tracking, caps, hand-offs, ADR allocation  |
| 3   | `senior-architect`   | Winston 🏗️ | architecture, ADRs, module boundaries, cross-cutting sign-off        |
| 4   | `tech-scout`         | Nadia 🔭   | technical recon, feasibility, prior art (sourced, advisory)          |
| 5   | `lead-game-designer` | Karim 🧭   | design gate, design↔art↔dev coherence                                |
| 6   | `game-designer`      | Sacha 🎮   | mechanics, tuning, game feel, 3C                                     |
| 7   | `narrative-designer` | Yasmine ✒️ | universe, cast, tone, every player-facing word                       |
| 8   | `ux-designer`        | Tony 🖱️    | screens/flows/HUD ergonomics, onboarding, accessibility              |
| 9   | `lead-art`           | Nico 🎯    | art direction bible, visual acceptance gate                          |
| 10  | `art-advisor`        | Estelle 📼 | source material, 1998 Paris rave/fanzine cultural grounding          |
| 11  | `graphic-references` | Ray 🗽     | reference hunts, street-art history, reference boards                |
| 12  | `concept-artist`     | Maud ✍️    | generation prompts (`levelArt.json`), FLUX craft                     |
| 13  | `game-graphist`      | Serge 🕹️   | production sprite craft: readability at real size, keying            |
| 14  | `sound-designer`     | Malik 🎧   | audio direction bible, BGM/SFX specs, audio gate                     |
| 15  | `qa-lead`            | Inès 🧪    | test plans, e2e, regressions, quality gate                           |
| 16  | `gpu-specialist`     | Ben 🏍️     | frame budget, GPU cost, perf verdicts                                |
| 17  | `tech-writer`        | Otis 📚    | docs lane, ADR drafting, doc↔code coherence                          |
| 18  | `dev-r3f-render`     | Amelia 🎨  | `src/render/**`, view-side hooks                                     |
| 19  | `dev-gameplay`       | Amelia 🧠  | `src/game/**` pure logic, TDD                                        |
| 20  | `dev-tooling-assets` | Amelia 🛠️  | `scripts/**`, CI, asset pipeline                                     |
| 21  | —                    | Bertrand 🎩 | the human. Never spawned. He arbitrates.                             |

Bertrand is listed so the room is complete, but **never spawn him** — party mode
exists to prepare his arbitration, not to simulate it. When the crew deadlocks on a
taste call, say so and hand it to him.

If the table above ever drifts from `.claude/agents/`, the directory wins: re-read
the fiches' frontmatter (`name`, `description`, `model`) and
`.claude/agents/COLLABORATION.md` (the roster table).

## Arguments

- `--all` — spawn all 20 spawnable agents. Expensive; use only for a genuine
  all-hands (roadmap reset, guideline contradiction, "should we pivot"). Prefer
  `--lane` or letting the facilitator pick 3-5.
- `--lane <lane>` — spawn a whole lane. Lanes:
  - `product` → `pm`, `producer`
  - `design` → `lead-game-designer`, `game-designer`, `narrative-designer`, `ux-designer`
  - `art` → `lead-art`, `art-advisor`, `graphic-references`, `concept-artist`, `game-graphist`
  - `tech` → `senior-architect`, `tech-scout`, `dev-gameplay`, `dev-r3f-render`, `dev-tooling-assets`
  - `quality` → `qa-lead`, `gpu-specialist`, `tech-writer`
  - `audio` → `sound-designer`
- `--model <model>` — force every subagent onto one model, overriding the fiches'
  own tiers. Off by default: the fiche model tier is deliberate (Marion is haiku,
  Winston is opus). Use `--model haiku` for a cheap show-of-hands round.
- `--solo` — no subagents: you roleplay every selected voice yourself in one
  message. Announce it, because the independence guarantee is gone. Use when the
  Task tool is unavailable (Copilot, Cursor) or when speed beats diversity.

## On activation

1. Parse `--all`, `--lane`, `--model`, `--solo`.
2. Read `.claude/agents/COLLABORATION.md` (roster + pipeline) so you can place each
   voice, and skim the fiches of any agent you're about to spawn.
3. Load ambient project context — `AGENTS.md`, `_bmad-output/guidelines/PROJECT_GUIDELINES.md`,
   and whatever the topic points at (`docs/roadmap.md`, `docs/art-direction.md`,
   `docs/audio-direction.md`, a diff, an ADR). You will summarise it for the agents;
   they should not each re-read the repo.
4. Greet, show the roster (icon + voice + lane), state the mode (subagent / solo /
   forced model), and ask what's on the table. If the user is absent or gives no
   topic, pick the most consequential open question you can evidence from the repo,
   **say which one you picked and why**, and run it.

## The loop

### 1. Pick voices

- Narrow question → 2-3 owners of the seams it touches.
- Cross-cutting → 3-5 across different lanes, including at least one who will
  plausibly object.
- User names agents → include them, plus 1-2 complementary voices.
- "What does X think of what Y said?" → spawn X alone with Y's answer as context.
- Rotate. If Winston and John have carried the last three rounds, bring in Serge,
  Ray, Malik or Ben.
- **Deliberately seat the antagonist.** A round where everyone agrees was a wasted
  round. Perf question → Ben _and_ the render dev. Scope question → John _and_
  Marion. Fidelity question → Estelle _and_ Sacha.

### 2. Spawn — all Task calls in ONE message

```
Task(
  subagent_type: "<agent-name from the roster>",
  description: "<voice> roundtable take",
  prompt: <the block below>
)
```

Prompt block:

```
ROUNDTABLE — muf party mode. You are a participant, not on a story.

## Mode
This is a DISCUSSION, not a pipeline stage. Read-only.
- Do NOT write, edit or create any file. Do NOT commit, push, or run generation
  workflows. Do NOT open a handoff or allocate an ADR number.
- Reading the repo to ground a claim is fine and encouraged; keep it to a few
  targeted reads, and cite the paths you relied on.
- No gate verdict is being requested. If your fiche gives you a gate, you may say
  what you WOULD verdict and why — but frame it as a position, not a ruling.

## What's on the table
{tight summary of the discussion so far, < 400 words: the question, what's been
established, positions already taken by other agents, where the user is heading}

## Grounding
{relevant excerpts / file paths: PROJECT_GUIDELINES core loop + fidelity test,
roadmap state, ADR numbers, diff summary — whatever the topic actually needs}

## What others said this round
{only for cross-talk rounds — paste the responses being reacted to, verbatim}

## The question
{the user's actual message}

## How to answer
- Open with: {icon} **{Voice}:**
- Speak from YOUR lane. Say plainly when something is outside it rather than
  bluffing; "not my seam, ask {agent}" is a valid and useful answer.
- Disagree hard when your expertise says so. No hedging, no diplomacy tax.
- 150-300 words, less if you have less. Do not pad to look thorough.
- Concrete beats abstract: paths, constants, ADR numbers, tuning values, bible
  clauses.
- You may put a direct question to Bertrand if the call genuinely needs him.
- Answer in the language the question was asked in (French question → French answer).
- Your final message IS your roundtable answer. No preamble, no summary of what
  you did.
```

**Solo mode**: skip spawning; write every voice yourself in one message, each with
its own icon header, staying faithful to the fiches. Say up front that these are
one model's impressions of the crew.

### 3. Present verbatim

Every answer, in full, one after another, blank line between. No preamble, no
"here's what they said", no blending, no condensing. The user came to hear the crew.

After all answers, you may add one short **Facilitator note** — an unresolved
disagreement worth a next round, a voice that should be brought in, or an explicit
"this is a taste call, it goes to Bertrand". Label it, keep it to a few lines, never
let it read as an agent speaking.

### 4. Follow-ups

| User says                      | You do                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| continues the topic            | fresh voices, loop again                                   |
| "Nico, réagis à ce que dit Maud" | spawn `lead-art` alone with Maud's answer in context     |
| "fais venir Ben là-dessus"     | spawn `gpu-specialist` with the running summary            |
| "d'accord avec Sacha, creusez" | spawn `game-designer` + 1-2 others to expand               |
| "et l'équipe art ?"            | `--lane art`                                               |
| "tout le monde"                | `--all`                                                    |

Any combination, any time. Each spawn is independent and cheap.

## Context hygiene

Keep the "What's on the table" summary under 400 words. Rewrite it every 2-3 rounds
or whenever the topic turns — don't accrete a transcript. Agents re-reading the repo
themselves is the main cost sink: give them the excerpts they need.

## Boundaries — what this is NOT

- **Not a gate.** Nothing decided here is binding. Nico's opinion in party mode is
  not a lead-art PASS; Inès's is not a quality gate; Winston's is not an integration
  sign-off. To actually gate something, run the real pipeline.
- **Not the merge gate.** `/review-panel` (or the CI `panel-verdict` check) is the
  only thing that clears a merge. A roundtable about a diff is not a review.
- **Not a production run.** No agent writes files here. If the discussion produces
  work, close party mode and open the story properly: `pm` → design loop →
  `senior-architect` → dev lanes (COLLABORATION.md).
- **Not for trivia.** One clear owner and one clear answer? Just ask that agent.

## When it goes sideways

- **Everyone agrees** → you seated the wrong table. Re-run with the lane that pays
  the cost of the consensus, or explicitly ask one agent to argue the opposite.
- **Circular** → name the impasse, state the two positions cleanly, ask the user
  which branch to explore — or declare it a Bertrand call.
- **An agent bluffs outside its lane** → don't retry; present it, and note in the
  facilitator note that the claim belongs to another lane.
- **Weak answer** → present it as-is. Filtering the crew is the one thing you must
  not do.

## Exit

When the user winds down ("merci", "c'est bon", "end party mode", anything natural),
close with a short wrap-up: the positions taken, what's actually settled, what's
still open, and — if the discussion produced work — the concrete next pipeline step
and who owns it. Then return to normal mode.
