# 0062 — Vendor-neutral agent orientation: AGENTS.md canonical + thin overlays (proposed)

- **Status:** Proposed
- **Date:** 2026-07-23
- **Origin:** commit 502ecd2 (2026-07, `docs(agents): add AGENTS.md + Copilot
  overlay, split CLAUDE.md, add copilot-setup-steps`) — an orientation-model
  change that shipped without an ADR. Drafted after the fact per drift-audit
  finding F9 (docs/drift-audit-2026-07.md), pending `senior-architect` PASS at
  the merge-gate triage (per ADR-0061's DOCS-PLAN doctrine, an ADR of this
  scope should have been allocated at story open — noted for post-mortem).
- **Amends (does NOT supersede):** [ADR-0018](./0018-staffed-production-pipeline.md)
  (staffed pipeline roster). The orientation surface described here is the
  front door to the roster documented there.

## Context

Until 2026-07 the multi-agent orientation for muf lived in a single file,
`CLAUDE.md`, tuned for Claude Code (subagent crew, BMAD skills, `rtk` /
`codegraph`). GitHub Copilot's coding agent was then given a task in the repo
and had to work from `CLAUDE.md` — a file whose entire top half addresses
tools Copilot does not have (`Task` subagents, MCP `codegraph`, BMAD skills).
Every non-Claude agent that would later join (Cursor, Codex, Aider, human
contributor) faced the same friction: rules generic to the project were
entangled with Claude-Code-only orchestration.

Two failure modes were observed:

1. **Copilot ignoring Claude-only rules as noise** — including generic ones
   ("boundary law", "yarn commands") that WERE applicable.
2. **Duplication drift** — anyone editing a rule had to hunt whether it lived
   in `CLAUDE.md` alone or also in a copilot-specific place, and updates fell
   out of sync.

## Decision

Adopt a **canonical + overlays** orientation model:

- **`AGENTS.md` (repo root, canonical, vendor-neutral)** — single source of
  truth for project facts and universal rules: what the project is, the tech
  stack, the yarn commands, the boundary law
  (`src/game` ↔ `src/render` ↔ `src/hooks`), the scope guard
  (`_bmad-output/guidelines/PROJECT_GUIDELINES.md`), the working rules
  (strict TypeScript, TDD, Conventional Commits, preview-link PR template,
  ADR discipline), and the Karpathy behavioural guidelines. Every future
  general rule lands here.
- **`CLAUDE.md` (Claude Code overlay, thin)** — Claude-Code-only additions on
  top of AGENTS.md: the subagent crew, the BMAD skills, `rtk` compression,
  `codegraph` MCP, hook-based automation, session-provisioning specifics.
  Explicitly instructs the reader to read `AGENTS.md` first and NOT to
  duplicate its rules.
- **`.github/copilot-instructions.md` (Copilot overlay, thin)** — Copilot-only
  additions: sandbox provisioning (`copilot-setup-steps.yml`), reminders that
  Copilot lacks Task/subagent tooling, and Copilot-flavoured pointers to the
  same rules as everyone else. Explicitly instructs the reader to read
  `AGENTS.md` first and NOT to duplicate its rules.

## Drivers

- **Multi-agent parity.** Every agent (present and future) starts at the same
  file. The gates that matter (typecheck/test/lint, code review, ADRs) apply
  identically regardless of which agent opens the PR.
- **No duplication.** Rules generic to the project appear once and only once.
  Overlays are additive, not restatements. This is enforced by convention —
  and by tech-writer's stage-7 coherence sweep introduced in ADR-0061.
- **Zero-cost extensibility.** Adding a new agent (Cursor, Aider, Codex, …)
  is a new overlay pointing to the same canonical file, not a new copy of
  the rules.

## Consequences

- Any rule change that applies to all agents must be edited in `AGENTS.md`. A
  PR that adds/updates a rule in an overlay only will fail the code-review
  panel's routine check ("could this be in AGENTS.md?"). Repo memory
  captured this convention 2026-07-19; ADR-0061 makes it enforceable at the
  DOC GATE (stage 5) whenever the diff touches an overlay.
- README's "Multi-agent compatibility" section describes the model for humans;
  it is kept in sync with this ADR by tech-writer.
- Adding a new agent vendor is: (1) create `<vendor>-instructions.md`, (2)
  reference `AGENTS.md` first, (3) list only vendor-specific additions. No
  ADR needed for a new overlay unless it introduces a durable convention.
- **What this does NOT change:** the roster, the pipeline stages, the gates,
  or any code. The physical boundary law (game/render/hooks) is unaffected —
  AGENTS.md documents it, ADRs enforce it, this ADR only relocates where the
  documentation lives.

## Alternatives considered

- **Keep a single CLAUDE.md, tell Copilot to read it and filter.** Rejected:
  observed to fail — Copilot either honours the whole thing (attempts
  subagent calls it cannot make) or discards it wholesale.
- **Duplicate the generic rules into each overlay.** Rejected: guaranteed
  drift; the original problem restated.
- **Machine-generate the overlays from AGENTS.md.** Rejected as premature.
  Two overlays are cheap to maintain by hand; a generator becomes worth its
  cost at 4+ overlays.
