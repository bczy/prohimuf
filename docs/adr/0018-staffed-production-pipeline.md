# 0018 — Staffed production pipeline: design, production, audio and QA lanes with blocking gates

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

The subagent crew (ADR-0010 staffed the art side) had no game designer, no producer, no
sound designer and no QA owner: gameplay tuning and fiction were decided de facto inside
the dev lanes, nobody tracked which stage a feature was in, a game **about sound
systems** had nobody owning the sound, and verification (stage "test") was distributed
across lanes with no single verdict. The dev, design and art flows were also documented
as three separate silos, so a feature had no single hand-to-hand path from intent to
merge.

## Decision

One **production pipeline** (normative: `.claude/agents/COLLABORATION.md`; visual:
`docs/diagrams/agent-workflows.md`), stages `0. INTAKE → 1. PRODUCT → 2. DESIGN →
3. TECH PLAN → 4. BUILD (dev ∥ art ∥ audio lanes) → 5. VERIFY → 6. INTEGRATE →
7. REVIEW → 8. ACCEPT → 9. MERGE`. Each stage has one owner and an explicit hand-off
logged in `docs/agent-handoffs.md`; a non-applicable stage is skipped explicitly, never
silently. Six new roles (`.claude/agents/`), which brings the crew to fifteen:

- **`game-designer` (Sacha)** — mechanics, tuning values, 3C; specs under
  `docs/game-design/`, never code. Also playtests the implemented build against the
  gated spec at stage 5 (design acceptance).
- **`narrative-designer` (Yasmine)** — universe, cast, every player-facing word;
  scripts follow the `NarrativeLine` contract, transcribed by `dev-gameplay`.
- **`lead-game-designer` (Karim)** — blocking **design gate** (scope / core loop /
  verifiability / coherence) before any dev implementation of a gameplay or fiction
  design; design↔art↔dev sync; design-acceptance verdict.
- **`producer` (Marion)** — pipeline execution only: stage tracking, hand-off chasing,
  bounded-iteration cap enforcement, seam serialisation, escalation packets. Holds no
  gate, authors no content.
- **`sound-designer` (Malik)** — audio direction bible (`docs/audio-direction.md`),
  audio specs ("ce qui sonne informe"), blocking **audio gate** on BGM/SFX assets and
  audible behaviour changes; human-ear taste calls escalate to Bertrand as shortlists.
- **`qa-lead` (Inès)** — owns stage 5 (VERIFY): per-story test plans under `docs/qa/`,
  e2e/regression scenario specs (implemented by the dev lanes), and the **quality
  gate** — the funnel verdict (mechanical checks, composite/audio gates, design
  acceptance) required before integration review.

Designers/leads write specs and verdicts, never production code: the game/render/hooks
boundary (ADR and `docs/architecture.md`) and the existing lane ownership are
unchanged. Existing de facto design surfaces (shipped tuning values, narrative scenes,
ADR-0012/0015 decisions) are grandfathered and change only through this flow from now
on. The BMAD side stays on installed BMM skills; the agents prefer the official BMGD
("Game Dev Studio", module `gds`) workflows if that module is installed later.

## Consequences

- A feature now has ONE path, hand to hand, with six blocking gates (design, prompt,
  asset, composite, audio, quality) plus the design-acceptance verdict, the architect
  sign-off and the 4-skill code-review panel; nothing merges on an author's word alone.
- More process per feature: for gameplay/fiction stories, two design deliverables and
  two extra verdicts (design gate, design acceptance) precede and follow the build.
  The explicit-skip rule keeps pure tooling changes lightweight.
- Bounded iteration everywhere (2 rework rounds per spec, 2 batches per asset/cue set)
  with `producer`-enforced escalation keeps agent loops from burning cycles.
- New documentation surfaces to keep alive: `docs/game-design/` (index by Karim),
  `docs/qa/` (plans by Inès), `docs/audio-direction.md` (bible by Malik, drafted at
  first activation).
- Known QA debt is now owned and listed (`docs/qa/README.md`): e2e holes on tutorial,
  mobile controls, narrative scenes, high-score persistence.
