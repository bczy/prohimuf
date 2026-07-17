# 0038 — Agent capability upgrade: MCP toolsets, per-agent models, curated references

- **Status:** Accepted
- **Date:** 2026-07-17
- **Number:** 0038, allocated directly at Bertrand's request for this out-of-band
  crew-improvement change (single session, re-checked against the index at write time).
  Normal flow allocates via `producer` at story opening (rule #9) — noted here because
  this change was not opened as a standard pipeline story.

## Context

An audit of the eighteen crew agents (`.claude/agents/`) surfaced four gaps, none of
which touch game/render/hooks behaviour but all of which weaken the agents as tools:

1. **Tools cited but not granted.** `dev-gameplay` and `senior-architect` instruct the
   agent to "use codegraph", yet `mcp__codegraph__*` was absent from their `tools:`
   list — a subagent only receives the tools it declares, so the instruction was dead.
   Only `gpu-specialist` had `mcp__Context7__*` (up-to-date library docs), though the
   render and logic lanes benefit most. `ux-designer` had no Figma access despite the
   session exposing a Figma MCP; `dev-r3f-render` had no Three.js viewer.
2. **Uniform `model: opus`.** All eighteen ran on Opus 4.8, including purely mechanical
   roles (`producer` tracks stages and chases hand-offs; it holds no creative/technical
   gate) and rubric-following roles.
3. **No consolidated sources.** Only `art-advisor` had a "knowledge anchors" section.
   Every other agent's external knowledge lived in ad-hoc `WebSearch` calls — re-fetched
   each run, unversioned, unreviewable.
4. **External links captured nowhere.** `grep http` over the eighteen files returned
   zero curated links.

## Decision

Additive capability upgrade. No pipeline stage, gate, cap, or the game/render/hooks
boundary changes. No new agent; the roster stays eighteen.

- **Toolsets aligned to need.** `mcp__codegraph__*` granted to `dev-gameplay`,
  `dev-r3f-render`, `senior-architect` (all already reference it). `mcp__Context7__*`
  added to `dev-gameplay`, `dev-r3f-render`, `dev-tooling-assets` (`gpu-specialist`
  already had it). Three.js viewer MCP added to `dev-r3f-render`. Figma read tools
  (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`) added to
  `ux-designer`. All are session-available; a missing server degrades to the tool simply
  being uncallable, never an error in the rest of the agent.
- **Per-agent model tiering.** Mapped to each role's own self-description of cognitive
  load:
  - **Haiku 4.5** — `producer` (pure tracking, explicitly "holds NO creative or
    technical gate").
  - **Sonnet 5** — `pm`, `tech-writer`, `ux-designer`, `art-advisor`, `game-graphist`,
    `sound-designer`, `dev-tooling-assets` (structured writing, rubric gates, scripted
    craft, advisory).
  - **Opus 4.8** — `senior-architect`, `dev-gameplay`, `dev-r3f-render`,
    `gpu-specialist`, `lead-game-designer`, `game-designer`, `narrative-designer`,
    `lead-art`, `concept-artist`, `qa-lead` (deep reasoning, hard creative/technical
    judgement). Taste calls that need human ears still escalate to Bertrand regardless
    of tier.
- **Curated reference library.** New `docs/references/` (index + ten discipline
  files) holding stable, one-line-contextualised links (official docs, W3C/MDN
  standards, pérenne archives) plus the internal docs that are the source of truth. Art
  references keep living in the existing license-noted `docs/art-direction/references/`;
  `docs/references/art-culture.md` points there rather than duplicating. Every agent
  gains a **"Sources & références"** section pointing at its file(s), with the standing
  rule: cite these rather than re-searching the web, extend by reviewed PR, never dump
  links.
- **Model shown on the crew bitmap.** `docs/muf-crew-bitmap.py` gains a `MODELS` map and
  draws a third, colour-coded label line per Claude (Opus = acid green, Sonnet = cyan,
  Haiku = yellow) with a legend under the title; `docs/muf-crew.png` regenerated. The
  transparent singles (`docs/diagrams/crew/*.png`) are label-free and unchanged.

## Consequences

- The freshness gate (`scripts/check-agents-infographic.mjs`) watches every
  `.claude/agents/*.md` and the generator; all eighteen files and the generator changed,
  so the manifest is re-pinned in this same PR (conscious act, in the diff). The pipeline
  poster changed; the HTML pipeline infographic did not (protocol/roster unchanged).
- Model tiering is a knob, not a contract: any agent can be moved back to Opus by a
  one-line frontmatter change if quality regresses on its lane. Watch `sound-designer`,
  `game-graphist` and `ux-designer` first, since they hold gates.
- `docs/references/` is a new documentation surface to keep alive; stale links are a
  review finding for `tech-writer`, curation extensions go through normal review.
- A follow-up is scoped separately in ADR-0039 (proposed "maison" skills backlog).
