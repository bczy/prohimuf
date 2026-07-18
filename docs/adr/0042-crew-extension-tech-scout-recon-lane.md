# 0042 — Crew extension: tech-scout technical-reconnaissance / feasibility lane (Nadia)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Number:** 0042, allocated by `producer` (Marion) at story opening, recorded in
  `docs/handoffs/story-tech-scout-lane.md`. Re-check at merge (rule #9).

## Context

The staffed pipeline (ADR-0018, then ADR-0037 which brought the crew to eighteen) still
had no owner for **prior-art surveys and feasibility spikes**. When a story rested on an
unproven technique — a new model/API/service, a rendering or animation approach not
already in `src/render`, a build/CI path of unknown blast radius — the reconnaissance
was absorbed by `senior-architect` himself, folded into TECH PLAN. That mixes two
different jobs: *finding out what already exists and what it costs* (research) versus
*deciding how muf will build it* (architecture). The architect was doing both, under
pipeline pressure, with no dedicated read-only lane and no sourced, verifiable artefact
to point back at.

The gap surfaced concretely while researching AI-generated 2D sprite animation for muf
(`docs/research/research-2d-sprite-animation.md`): a multi-source, adversarially-verified
survey — the kind of work that decides whether a whole feature is even feasible — had no
home in the crew and no named owner. It landed on the architect by default.

The reconnaissance a scout serves is muf-specific, so its load-bearing constraints must
be named every time: budget ≈ 0€, no local GPU, CI on GitHub Actions, a fanzine-B&W +
acid-neon (non-pixel-art) house style, and the existing Pollinations/FLUX asset baseline
(no key). A generic "what's the best tool" answer is worthless here; the useful answer is
"what fits *these* constraints, sourced".

Precedent: ADR-0037 added three advisory/gate lanes the same way (UX design, GPU perf
verdict, staffed DOCS) — an additive crew extension leaving the pipeline stages, existing
gates, caps and the game/render/hooks boundary unchanged.

## Decision

Add a **nineteenth** agent, `tech-scout` (**Nadia 🔭**), as a **read-only advisory
technical-reconnaissance / feasibility lane** (fiche: `.claude/agents/tech-scout.md`).
The extension is additive: pipeline stages, existing gates, caps and the
game/render/hooks boundary are unchanged.

- **Role.** Runs prior-art surveys and feasibility spikes and returns a **sourced
  feasibility report + recommendation** — options compared on an honest
  cost / quality / integrability axis, each load-bearing claim tied to a real source,
  CONFIRMED separated from unverified, ending in a concrete muf-specific recommendation
  and the residual risks the architect must weigh.
- **When pulled in.** By `senior-architect` at **TECH PLAN (stage 3)**, exactly the way
  `gpu-specialist` is pulled in for perf-sensitive work — whenever a story rests on a
  technique/model/API/dependency the team has not proven yet, *before* lanes are cut so
  the architect partitions work against evidence rather than a guess.
- **Harness.** Drives `deep-research` (fan-out web search → fetch → adversarial
  verification → cited synthesis), falling back to `WebSearch`/`WebFetch` with per-claim
  confidence when the harness is unavailable or cut short.
- **Writable surface.** `docs/research/**` only — one report per investigation
  (`research-<slug>.md`), index at `docs/research/README.md`. Never production code
  (`src/**`, `scripts/**`), `levelArt.json`, prompts, ADRs, or any bible.
- **Model:** `opus`. **Bridges** the BMAD analyst `bmad-agent-analyst` (Mary) and the
  `bmad-technical-research` module.
- **Explicitly NOT a decision-maker.** It holds **no gate** and decides nothing. It
  *informs*; the architect decides. The resulting ADR is the **architect's** — the scout
  feeds it, never authors it. A confident wrong answer is worse than a flagged
  uncertainty, so thin/contradictory evidence is reported as such.

## Consequences

- The crew grows to **nineteen**. The agent-infographic freshness gate
  (`scripts/check-agents-infographic.mjs`) and the crew bitmap
  (`docs/muf-crew-bitmap.py`) must be updated and re-pinned **in this same PR** — handled
  by the `dev-tooling-assets` lane (noted here, not done in this ADR's lane).
- A **`deep-research` dependency** for the lane: the scout's quality rests on the harness
  being reachable; when it is not, output degrades to hand-synthesised `WebSearch` with
  per-claim confidence flags (never silently dropped).
- A new documentation surface to keep alive: `docs/research/**` (index +
  `research-<slug>.md` reports), first populated by
  `docs/research/research-2d-sprite-animation.md`.
- **Placement relative to `gpu-specialist`.** Both are architect-pulled TECH-PLAN inputs
  and both are advisory (no gate). They are orthogonal: `gpu-specialist` answers "does it
  fit the frame budget on target" for perf-sensitive changes at stage 5 and TECH PLAN;
  `tech-scout` answers "does a proven, muf-affordable solution to this already exist"
  before lanes are cut. Neither implements; both feed the architect's decision.
- Updated in lockstep in this PR: `.claude/agents/COLLABORATION.md` (roster row,
  "Nineteen subagents", TECH-PLAN recon clause parallel to the gpu-specialist clause),
  `CLAUDE.md` (roster table + flow paragraph), and the mermaid companion
  `docs/diagrams/agent-workflows.md` (an architect-pulled TECH-PLAN input node mirroring
  `gpu-specialist`).
