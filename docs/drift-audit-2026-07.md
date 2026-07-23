# Drift audit — 2026-07

**Author:** tech-writer (Otis, dogfooding ADR-0061)
**Trigger:** Bertrand, 2026-07-23 — « il y a un drift au niveau de la doc ».
**Scope:** doc↔code and doc↔decision drift in `docs/**`, `README.md`, and the
agent-orientation triad (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`).
Read-only survey; per the iron rule, this file lists findings, it does not decide
content.

## Method

- Compared each doc's freshness stamp against the git log (last touched vs
  current HEAD, 61 ADRs shipped, 25+ ADRs after the last `Generated:` date).
- Grepped for stale format artefacts (comma-orphan lines inside markdown table
  cells — a Prettier reformatting damage pattern).
- Cross-checked doc claims against shipped modules under `src/**`, ADRs, and
  the roster in `.claude/agents/COLLABORATION.md`.

## Findings

Format: `FILE:LINE — CLAIM → REALITY → OWNER`.

### F1 — `docs/index.md:3` — freshness stamp

- CLAIM: `**Generated:** 2026-04-11`.
- REALITY: today 2026-07-23; ~25 ADRs shipped since (0036 → 0060), AGENTS.md
  and CLAUDE.md split (commit 502ecd2, 2026-07), Copilot overlay added.
- OWNER: `tech-writer` (index is his lane).
- **Fixed in this PR** (Vague A).

### F2 — `docs/index.md:10-46` — table cells structurally broken

- CLAIM: valid Markdown Contents/Diagrams tables.
- REALITY: cells containing commas were wrapped across multiple lines with
  BLANK-LINE gaps by a Prettier pass; per CommonMark, a blank line inside a
  table cell terminates the table. The rendered doc is fragmentary from
  line 12 onward.
- OWNER: `tech-writer` (same lane).
- **Fixed in this PR** (Vague A — rewritten with short cells + no commas).

### F3 — `docs/index.md:8-46` — missing entries for the agent-orientation triad

- CLAIM: the Contents table lists internal `docs/**` files.
- REALITY: `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md` are
  now the canonical multi-agent orientation surface (repo memory of
  2026-07-19; README §Multi-agent compatibility) — they do not appear in the
  index.
- OWNER: `tech-writer`.
- **Fixed in this PR** (Vague A — new "Agent orientation" section).

### F4 — `docs/index.md:60-70` — Quick Reference outdated

- CLAIM: `Active level = belliard`, `Test count = 75 tests, all green`.
- REALITY: level `belliard` is still active per ADR-0059, but the test count
  was never updated as the suite grew, and the row is also victim of the
  comma-wrap damage. The intent-of-quick-reference (single glance orientation)
  survives; the numbers do not.
- OWNER: `tech-writer` for freshness; `pm` for scope (should this row exist?
  it decays fast).
- **Partial fix in this PR** — row rewritten with only stable facts; test
  count row removed rather than freshly wrong. Follow-up ticket for `pm` to
  decide whether we keep the row.

### F5 — `docs/roadmap.md:3` and body — sprint history frozen at 2026-04-11

- CLAIM: `Status as of 2026-04-11`; Sprints 0-3 listed; boss QTE / Belliard
  live level / CRT composite (ADRs 0031, 0051-0060) not mentioned.
- REALITY: months of shipped work absent. Also victim of the comma-wrap
  damage (~33 orphan continuation lines under `grep '^\s*[A-Za-z]'`).
- OWNER: `pm` (roadmap is scope content, not wording).
- **Follow-up ticket** — I do not rewrite roadmap content; per the iron rule
  I file this as a drift finding for `pm` to author. Ticket to open post-merge:
  `story-roadmap-refresh-2026-q3`.

### F6 — `docs/architecture.md` — folder-structure block outdated + comma-wrap damage

- CLAIM: folder tree lists `TopdownScene.tsx`, `TiledFacade`, `StreetBackground`,
  a 9-tile facade renderer, and a limited render/scene surface.
- REALITY: shipped surface includes `LevelBackdrop` PNG layers, boss QTE,
  CRT composite pass (ADR-0031), foreground parallax (ADR-0047),
  near-foreground procedural fallbacks (ADR-0049), single-wide backdrop mode
  (ADR-0057), grille overlay (ADR-0058), CSS Modules + tokens bridge
  (ADR-0046), asset preloading gate (ADR-0022), and more. `TiledFacade` was
  retired.
- OWNER: `senior-architect` (architecture content) + `tech-writer` (wording).
- **Follow-up ticket** — content decision belongs to Winston; tech-writer
  drafts once the shape is set. Ticket to open post-merge:
  `story-architecture-doc-refresh-2026-q3`.

### F7 — `README.md` — spot-check pending

- STATUS: not audited in this pass (out of scope for the first wave). The
  Multi-agent compatibility section is verified by the repo memory citation.
- **Follow-up ticket** for a full README pass.

### F8 — Handoffs index vs shard sharding

- CLAIM: `docs/agent-handoffs.md` is a small index (per ADR-0032).
- REALITY: current index file measures ~97 lines of Markdown source but
  ~51 k tokens (very long lines / dense content). Actual shard files under
  `docs/handoffs/*.md` follow the naming convention correctly.
- OWNER: `producer` (log hygiene) for a call on whether to trim; not urgent.
- **No fix in this PR** — noted only.

### F9 — Missing ADR for the agent-orientation split (commit 502ecd2)

- CLAIM: none — commit was `docs(agents):` with no ADR.
- REALITY: the split of vendor-neutral facts into `AGENTS.md` with thin
  overlays (`CLAUDE.md`, `.github/copilot-instructions.md`) is a durable
  orientation-model decision: it dictates that every future rule lives in
  `AGENTS.md` and that overlays MUST NOT duplicate. Future contributors
  benefit from an ADR they can point to; that is exactly the "would a future
  contributor benefit from the reasoning?" test in `docs/adr/README.md`.
- OWNER: `senior-architect` decides; `tech-writer` drafts.
- **Fixed in this PR** (Vague D) — draft ADR-0062 written from the observable
  outcome; awaits senior-architect PASS at merge-gate triage.

### F10 — `docs/perf-budget.md` referenced but not shipped

- CLAIM: `.claude/agents/COLLABORATION.md:25` says the `gpu-specialist` owns
  `docs/perf-budget.md`; ADR-0037 (crew-extension-ux-gpu-docs) treats it as a
  deliverable.
- REALITY: `docs/perf-budget.md` does not exist in the repo. Attempting to
  link it from `docs/index.md` in this pass surfaced the drift.
- OWNER: `gpu-specialist` (content) + `tech-writer` (index once written).
- **No fix in this PR** — I removed the newly-added link so we do not ship a
  dead reference. Follow-up ticket: `story-perf-budget-doc-authoring`.

## Summary

| ID | File | Severity | Fix path | This PR |
| --- | --- | --- | --- | --- |
| F1 | docs/index.md date | minor | tech-writer wording | ✅ |
| F2 | docs/index.md tables | major | tech-writer wording | ✅ |
| F3 | docs/index.md missing triad | minor | tech-writer wording | ✅ |
| F4 | docs/index.md quick-ref | minor | tech-writer + pm decision | ✅ partial |
| F5 | docs/roadmap.md stale | major | pm content | ❌ (ticket) |
| F6 | docs/architecture.md stale | major | senior-architect content | ❌ (ticket) |
| F7 | README.md spot-check | unknown | tech-writer | ❌ (ticket) |
| F8 | handoffs sharding | minor | producer | ❌ (noted) |
| F9 | missing ADR for orientation split | major | senior-architect + tech-writer | ✅ (draft) |
| F10 | docs/perf-budget.md not shipped | major | gpu-specialist content | ❌ (ticket) |

## What Sujet 2 (ADR-0061) would have caught, going forward

- F1, F2 → the stage-5 DOC GATE would refuse any story whose diff touches
  `docs/index.md` without an actual re-render (or catch the Prettier
  reformatting damage on re-render).
- F5, F6 → the stage-3 DOCS-PLAN for the stories that shipped ADRs 0031, 0047,
  0051-0060 would have listed `architecture.md` / `roadmap.md` as
  "to-touch" — dev lanes would have either touched them, or the DOCS-PLAN
  would have been explicit that they were deferred with a follow-up.
- F9 → the stage-3 DOCS-PLAN for the orientation-split story would have
  flagged the missing ADR allocation; producer would have opened ADR-0062 at
  story-open.

This is the audit's dogfood value: the amended workflow is precisely calibrated
against the drift it just measured.
