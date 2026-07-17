# 0037 — Crew extension: UX design lane, GPU/perf verdict, staffed DOCS lane

- **Status:** Accepted
- **Date:** 2026-07-17
- **Number:** 0037, allocated per rule #9 (producer-held allocation; recorded in
  `docs/handoffs/story-crew-extension.md`). This ADR was renumbered THREE times by
  parallel main sessions taking the next number first (0032 → two-tier, 0033 → remote
  provisioning, 0034-0036 → hostage QTE) — exactly the failure mode rule #9 exists to
  prevent; allocate at story opening, RE-CHECK AT MERGE.

## Context

The staffed pipeline (ADR-0018, fifteen agents) left three seats empty, each evidenced
in the handoffs log (now sharded under `docs/handoffs/`, pre-shard history in
`docs/handoffs/archive-2026-07.md`):

- **Docs had no owner.** Review-triage DOC findings (ADR/bible/README/JSDoc
  realignments) were absorbed by `senior-architect` himself ("Winston — DOCS lane"),
  and the PR #63 triage's docs lane shipped with no named owner. Symptoms accumulated:
  an ADR cited under the wrong number, a spec section contradicting shipped values.
- **No UX seat.** Ergonomics sat unowned between `lead-art` (style), `game-designer`
  (3C) and `dev-r3f-render` (implementation): the mobile-landscape "surchargé" accueil,
  guidelines §5 UX rules and accessibility labels were handled ad hoc in dev or docs
  lanes.
- **Perf-on-target had no gate.** CI renders through SwiftShader (software GL), which
  cannot measure real GPUs; the CRT story's verdict — "AC6 perf on real desktop+mobile
  GPUs is not measurable under SwiftShader — escalate to producer" — pointed at an
  agent who holds no gate, so real-hardware performance had no owner and no verdict.

## Decision

Three new agents (`.claude/agents/`), which brings the crew to eighteen. The pipeline
stages, existing gates, caps and the game/render/hooks boundary are unchanged; the
extension is additive.

- **`ux-designer` (Tony 🖱️)** — third design lane, parallel with `game-designer` and
  `narrative-designer`, gated by `lead-game-designer`'s DESIGN GATE: screens/flows,
  HUD ergonomics, accessibility (reduced-motion, escape-hatch toggles, aria, touch
  targets), mobile vs desktop. Specs under `docs/game-design/ux/`, never code, never
  style. Seam declared: `game-designer` owns what inputs DO in gameplay (3C);
  `ux-designer` owns the surrounding surfaces; on the seam they reconcile directly and
  log it. At stage 5 he reviews built screens/flows on real screenshots, both device
  classes.
- **`gpu-specialist` (Ben 🏍️)** — owns the frame budget (`docs/perf-budget.md`, his
  first deliverable, budgets ratified by Bertrand), GPU-cost analysis at TECH PLAN for
  perf-sensitive features (post-processing, shaders, particles, render targets,
  draw-call growth), and a **PERF VERDICT** leg at stage 5 funnelling into `qa-lead`'s
  QUALITY GATE. What the sandbox cannot measure ships as a ready-to-run on-target
  protocol escalated to Bertrand; **DEFERRED-ON-TARGET** is a recorded, `producer`-
  chased state, never a silent drop — and it has a defined re-entry. An on-target
  result returning OVER budget: while the PR is still open, the DEFERRED pass is
  revoked and it is a stage-5 FAIL routed to the owning dev lane on the same branch;
  after merge, it re-enters as a fix-lane cycle closed only by the gpu-specialist's
  PERF re-verdict (protocol re-run), or — when the remedy has a design/asset surface
  — as a correct-course story re-entering at pm/architect. The gpu-specialist sits in
  the fix-lane gate-owner reclaim list for exactly this fix type. Analyzes and
  verdicts, never implements.
- **`tech-writer` (Otis 📚)** — standing owner of the DOCS lane: drafts ADRs from
  decided outcomes (decisions remain `senior-architect`'s, who signs off drafts),
  applies doc realignments mandated by triage findings, keeps `docs/index.md` and
  doc↔code cross-references honest. May edit doc-comment/JSDoc **wording** inside
  `src/**` — never logic; a doc fix requiring a logic change is a finding for the
  owning dev lane. This wording-only seam with the dev lanes is declared in
  COLLABORATION.md's Rules of engagement (announce/serialise like `src/hooks/**`).

## Consequences

- Review-panel DOC findings now route to `tech-writer` instead of being absorbed by
  the architect; the architect keeps decision authority and sign-off on ADR drafts.
- Stories touching screens/flows/accessibility now enter the design loop (three
  parallel design lanes max) and get a UX review leg at VERIFY; pure gameplay/fiction
  stories are unaffected.
- Perf-sensitive changes gain two touchpoints: a cost analysis before lanes are cut
  and a budget verdict before the quality gate. A new documentation surface to keep
  alive: `docs/perf-budget.md` (Ben), plus `docs/game-design/ux/` (Tony).
- One more routinely shared seam to serialise (tech-writer's JSDoc wording across
  `src/**`), low-collision by construction (wording-only, runs at triage/post-merge).
- Updated in lockstep: `.claude/agents/COLLABORATION.md` (roster, stages 2/3/5, panel
  triage routing, rule #3), `CLAUDE.md`, `docs/diagrams/agent-workflows.md`,
  `docs/muf-crew-bitmap.py` + `docs/muf-crew.png`.
