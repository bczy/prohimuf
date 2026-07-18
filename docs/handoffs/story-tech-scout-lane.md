# Story — tech-scout recon lane

Add a 19th crew agent, `tech-scout` (Nadia 🔭): a read-only technical-reconnaissance /
feasibility lane that drives the `deep-research` harness and feeds `senior-architect` at
TECH PLAN. Fills the gap surfaced while researching 2D sprite animation — the crew had no
subagent owning prior-art / feasibility spikes; the architect absorbed it. ADR-0042.

## 0/1. INTAKE/PRODUCT — Bertrand → orchestrator — 2026-07-18
- claim: Bertrand asked, after a deep-research run on 2D animation, whether the crew
  needs a research agent, and to wire the answer into the pipeline properly.
- release: scoped as a governance/crew-extension story (precedent: ADR-0037). Agent is
  advisory, read-only, no gate; inserted at TECH PLAN parallel to gpu-specialist. ADR
  number **0042** allocated.

## 3. TECH PLAN — senior-architect (Winston) — 2026-07-18
- claim: ADR-0042 (recon lane rationale, placement, boundaries) + mermaid insertion.
- release: ADR-0042 authored via `adr-new` — Status Accepted, Date 2026-07-18, number
  0042 (producer-allocated, collision-checked: local + origin/main max = 0041). Records
  the gap (no prior-art/feasibility lane; architect absorbed it; surfaced during the
  2D-animation deep-research run), the decision (`tech-scout` / Nadia 🔭 as a 19th,
  read-only advisory TECH-PLAN lane, architect-pulled parallel to gpu-specialist, drives
  `deep-research`, writes `docs/research/**` only, model opus, no gate, bridges
  bmad-agent-analyst, NOT a decision-maker), and the consequences (crew → nineteen so
  infographic freshness gate + crew bitmap must be re-pinned in this PR by
  dev-tooling-assets; `deep-research` dependency; mermaid + COLLABORATION.md + CLAUDE.md
  in lockstep; placement vs gpu-specialist). ADR index regenerated (`node
  scripts/gen-adr-index.mjs --write`) — `docs/adr/README.md` + `public/adr/index.html`
  show the 0042 row, freshness check green. Mermaid: added a `SCOUT` node inside the P3
  TECH PLAN subgraph + an `ARCH -.-> SCOUT` architect-pull arrow, mirroring the
  `ARCH -.-> PERF` gpu-specialist depiction; stage numbering unchanged, label style
  (`name · Persona emoji<br/>role`) preserved.
  File List:
  - `docs/adr/0042-crew-extension-tech-scout-recon-lane.md` (new)
  - `docs/adr/README.md` (regenerated index row)
  - `public/adr/index.html` (regenerated registry)
  - `docs/diagrams/agent-workflows.md` (SCOUT node + architect-pull arrow)
  - `docs/handoffs/story-tech-scout-lane.md` (this entry)
  VERDICT: PASS — tech plan (senior-architect)

## 4. BUILD — connective docs (orchestrator, tech-writer surface) — 2026-07-18
- claim: `.claude/agents/tech-scout.md` fiche; COLLABORATION.md (Nineteen, roster row,
  TECH PLAN recon clause); CLAUDE.md (roster table + flow paragraph); `docs/research/`
  surface (README + first report `research-2d-sprite-animation.md`).
- release: done. File List: `.claude/agents/tech-scout.md`,
  `.claude/agents/COLLABORATION.md`, `CLAUDE.md`, `docs/research/README.md`,
  `docs/research/research-2d-sprite-animation.md`.

## 4. BUILD — dev-tooling-assets (Amelia) — 2026-07-18
- claim: crew bitmap generator (add tech-scout sprite + MODELS + grid for 19),
  regenerate crew sprites, infographic HTML card, re-pin freshness manifest, make
  `check-agents-infographic.mjs` pass.
- release: _(pending — delegated)_
