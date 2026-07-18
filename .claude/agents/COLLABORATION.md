# Agent collaboration protocol — muf

Nineteen subagents work the muf project. They run **in parallel where paths don't overlap**,
but they **always coordinate** through this protocol. Read this before acting.

## Roster & ownership

| Agent | Persona | Owns | Never touches |
| --- | --- | --- | --- |
| `pm` | John 📋 | PRD, epics, stories, scope (`_bmad-output/planning-artifacts/`) | production code |
| `producer` | Marion 📆 | pipeline execution: stage tracking, hand-off chasing, caps & escalations, sprint status, ADR number allocation, handoffs-shard opening | scope, gate verdicts, specs, production code |
| `senior-architect` | Winston 🏗️ | architecture, ADRs, boundaries, cross-cutting sign-off | feature implementation |
| `lead-game-designer` | Karim 🧭 | design gate (specs & scripts), design↔art↔dev sync, `docs/game-design/README.md` | first-draft specs, production code |
| `game-designer` | Sacha 🎮 | mechanics, tuning values, 3C — specs in `docs/game-design/` | production code, lore, visual style |
| `narrative-designer` | Yasmine ✒️ | universe, cast, every player-facing word — scripts in `docs/game-design/` | production code, mechanics, visuals |
| `ux-designer` | Tony 🖱️ | screens/flows/HUD ergonomics + accessibility — UX specs in `docs/game-design/ux/` | production code, visual style, 3C/mechanics |
| `lead-art` | Nico 🎯 | `docs/art-direction.md` + references, visual acceptance gate (prompts & generated assets) | pipeline mechanics, first-draft prompts |
| `art-advisor` | Estelle 📼 | references & cultural grounding (advice only, read-only) | any file except via lead-art |
| `graphic-references` | Ray 🗽 | interactive reference hunts with Bertrand (interview → web propositions → verdicts → refine), boards in `docs/art-direction/references/boards/` | gate verdicts, prompts, production code, the curated library (lead-art curates) |
| `concept-artist` | Maud ✍️ | prompt/style strings in `levelArt.json`, `docs/art-direction/prompt-drafts/` (one shard per family, index at `prompt-drafts.md`) | sizes/ids/paths/structure, workflows |
| `game-graphist` | Serge 🕹️ | production passes (readability/keying annotations, `scripts/retouch-sprites.mjs`) | direction verdicts, prompt authorship, CI workflows |
| `sound-designer` | Malik 🎧 | audio direction bible (`docs/audio-direction.md`), audio specs, AUDIO GATE (BGM/SFX assets + audible behaviour) | production code, script mechanics |
| `qa-lead` | Inès 🧪 | stage 5 VERIFY: test plans (`docs/qa/`), e2e/regression specs, QUALITY GATE | production code, test implementation (spec only) |
| `gpu-specialist` | Ben 🏍️ | frame budget (`docs/perf-budget.md`), GPU-cost analysis, PERF VERDICT (stage 5) + on-target protocols | production code, visual/design verdicts |
| `tech-writer` | Otis 📚 | DOCS lane: ADR drafting (decisions stay Winston's), doc realignments, `docs/index.md`, doc↔code coherence (incl. JSDoc wording) | code logic, gate verdicts, gated content decisions |
| `dev-r3f-render` | Amelia 🎨 | `src/render/**`, view-side `src/hooks/**` | `src/game/**`, `scripts/**` |
| `dev-gameplay` | Amelia 🧠 | `src/game/**`, logic-side `src/hooks/**` | `src/render/**`, `scripts/**` |
| `dev-tooling-assets` | Amelia 🛠️ | `scripts/**`, `levelArt.json` (structure), `.github/**`, config | game rules, scene code, prompt strings |

## The production pipeline (a feature passes hand to hand — never silo)

Every feature traverses the SAME pipeline, stage by stage, each stage with one owner and
an explicit hand-off logged in the story's shard under `docs/handoffs/`
(`docs/agent-handoffs.md` is the index — read it for the template and the
machine-parsable `VERDICT:` line format). A stage that does not apply is
skipped EXPLICITLY (the agent holding the hand at that point declares the skip and logs
it; `producer` verifies every skip is explicit), never silently.

Small, single-lane changes take the **fix lane** instead (§fix lane below) — the full
pipeline is for features; paying full ceremony on a one-lane bug fix is waste, and
bending the pipeline silently is worse.

```
0. INTAKE     Bertrand → pm : intent, bug, or idea.
1. PRODUCT    pm — scoped story: WHAT/WHY, "cahier des charges" test vs
              PROJECT_GUIDELINES, acceptance criteria.
2. DESIGN     (when the story touches how the game plays, its fiction, or its
              screens/flows/accessibility)
                → game-designer      ┐ specs in parallel on
                → narrative-designer │ non-overlapping deliverables
                → ux-designer        ┘
                → lead-game-designer DESIGN GATE (PASS required — §design flow)
3. TECH PLAN  senior-architect — feasibility, boundaries, ADR if needed, lane
              partition: dev lanes + an ART lane when the feature needs new or
              changed visuals. Perf-sensitive features (post-processing, shaders,
              particles, render targets, draw-call growth) → gpu-specialist
              GPU-cost analysis BEFORE lanes are cut.
4. BUILD      parallel, non-overlapping lanes:
                · ART — (reference hunt: graphic-references ↔ Bertrand, when the
                  family lacks references) → advisor → concept-artist →
                  game-graphist → lead-art gates → CI generation (§art flow)
                · AUDIO — sound-designer specs → sourcing/generation →
                  AUDIO GATE (§audio flow)
                · DEV — dev-gameplay (TDD) / dev-r3f-render / dev-tooling-assets
5. VERIFY     the test stage, before any review — orchestrated by qa-lead
              against her per-story test plan (docs/qa/):
                · rtk tsc + rtk vitest (100%) + rtk lint — all green, no claims
                · e2e / `verify` skill runs for anything player-visible
                · runtime-composed visuals → screenshots → lead-art Gate 4
                · audible behaviour changes → sound-designer behaviour verdict
                · perf-sensitive changes → gpu-specialist PERF VERDICT vs
                  docs/perf-budget.md (what CI/SwiftShader cannot measure ships
                  as a ready-to-run on-target protocol, escalated to Bertrand —
                  DEFERRED-ON-TARGET is logged and chased by producer, never
                  silently dropped. An on-target result returning OVER budget:
                  PR still open → the DEFERRED pass is REVOKED, it is a stage-5
                  FAIL routed to the owning dev lane on the same branch via the
                  architect; already merged → a fix-lane cycle on the owning dev
                  lane, closed ONLY by gpu-specialist's PERF re-verdict (the
                  on-target protocol re-run) — or, when the remedy has a
                  design/asset surface (a cheaper technique that changes look or
                  feel), a correct-course story re-entering at pm/architect, not
                  at a dev lane)
                · game-designer PLAYTESTS the build vs the gated spec (design
                  acceptance — verdict reported to lead-game-designer)
                · ux-designer reviews built screens/flows vs his gated UX spec
                  on real screenshots, both device classes (verdict to
                  lead-game-designer)
                · qa-lead QUALITY GATE — the funnel verdict: plan ran and held
                  (PASS required before stage 6; FAIL routes back to the
                  owning lane with the failing case named)
6. REVIEW     CODE-REVIEW PANEL + INTEGRATION TRIAGE — 4 parallel skills, findings
              adversarially verified, then senior-architect TRIAGES the findings AND
              delivers his integration review & cross-lane sign-off in the SAME pass
              (he already reads the full diff to triage — one stage, one read;
              mandatory before any merge to main — see below).
7. ACCEPT     pm — acceptance vs story + PROJECT_GUIDELINES.
8. MERGE      Bertrand (or an EXPLICIT merge instruction from him for this
              branch — a general standing preference is never merge authority) —
              merge to main; the full cycle is traceable in the story's
              handoffs shard.
```

The pipeline is DRIVEN by `producer` (Marion): she tracks which stage every feature is
in and who has the hand, chases missing log entries, enforces the bounded-iteration caps
(2 rework rounds per spec, 2 generation batches per asset set, 2 verify↔build rework
rounds per story; a "cycle" = one pass of a story through the pipeline, and only Marion
declares a reset), serialises contended seams, and assembles escalation packets for
Bertrand when a cap is hit or a lane stalls. At story opening she also **allocates the
ADR number** if the tech plan will need one (see §rules of engagement #9) and opens the
story's handoffs shard (`docs/handoffs/story-<slug>.md`).
She holds no gate and authors no content — the orchestrator launches agents, Marion
keeps the state honest. Visual companion: `docs/diagrams/agent-workflows.md` (the
pipeline as one mermaid flowchart).

## The fix lane (small, single-lane changes — the two-tier rule)

The full pipeline exists for FEATURES. A small fix does not impersonate one. A change
qualifies for the fix lane when ALL of these hold:

- **One owning lane** — the diff touches only paths owned by a single dev lane
  (`dev-gameplay`, `dev-r3f-render` or `dev-tooling-assets`), `src/hooks/**` included
  only on that lane's side; no cross-boundary change.
- **No design surface** — no change to how the game plays (mechanics, tuning values,
  3C) and no player-facing words; polish/bug-fix of an ALREADY-GATED behaviour only.
- **No asset surface** — no new or changed prompt, sprite, or audio asset.
- **No architecture surface** — no new dependency, no boundary or contract change,
  nothing ADR-worthy.
- **Small** — a diff the single reviewer can hold in one read (rule of thumb: a bug
  fix, a copy-size tweak, a tap-target enlargement — not a feature in disguise).

Route: owning dev lane implements → `rtk tsc` + `rtk vitest` + `rtk lint` all green
(+ `verify`/e2e screenshots when the change is player-visible) → **ONE reviewer**
running `code-review` (effort high) on `git diff origin/main...HEAD`, findings fixed
or refuted → Bertrand merges. No pm story, no design gate, no architect stage, no
4-reviewer panel. The cycle is logged as ONE line in `docs/handoffs/fixes.md`.

Tiering: the orchestrator proposes the tier; `producer` records it and challenges
abuse (a "fix" that fails a criterion mid-flight ESCALATES to the full pipeline at the
stage it violated — it never continues in the fix lane). When in doubt, full pipeline.
A gate owner (lead-art, lead-game-designer, sound-designer, gpu-specialist,
senior-architect) can
reclaim any fix touching their surface — one call from them re-routes it. A fix-lane
cycle that exists to close an OVER-budget on-target item (stage-5 §perf re-entry) is
NOT closed by the code reviewer's approval alone: `gpu-specialist`'s PERF re-verdict
(the on-target protocol re-run) is required before merge — a perf fix nobody measured
is not a fix.

## The design flow (any change to mechanics, tuning, 3C, universe, cast, in-game text, screens/flows or accessibility)

```
pm story (what/why)
     ↓
lead-game-designer splits & sequences the design work
     ↓
game-designer (mechanics, tuning tables,  ┐ parallel when deliverables
               3C specs)                  │ don't overlap; they reconcile
narrative-designer (bible, character      │ directly when fiction, mechanics
                    sheets, scripts)      │ and surfaces meet (seams logged)
ux-designer (screens/flows, HUD           │
             ergonomics, accessibility)   ┘
     ↓
lead-game-designer DESIGN GATE — PASS/FAIL per deliverable vs PROJECT_GUIDELINES
(cahier des charges test, core loop, verifiability, coherence with gated specs
 and with the art bible). Max 2 rework rounds per cycle, then escalate to Bertrand.
     ↓
FAIL → designer iterates · PASS → senior-architect (lanes) → devs implement the spec
```

Design deliverables live under `docs/game-design/` (index: `docs/game-design/README.md`,
kept by `lead-game-designer`; UX specs under `docs/game-design/ux/`). Designers write
specs and scripts, never production code:
`dev-gameplay` transcribes gated tuning values and narrative scripts into `src/game/**`;
`dev-r3f-render` implements gated UX specs in `src/render/**`. The 3C seam is explicit:
`game-designer` owns what inputs DO in gameplay, `ux-designer` owns the surrounding
surfaces (menus, HUD arrangement, flows, accessibility); on the seam they reconcile
directly and log it.
Character/asset VISUALS stay in the art flow — a character sheet feeds `concept-artist`,
it never bypasses `lead-art`'s gates. Every gate verdict is logged in
the story's handoffs shard (index: `docs/agent-handoffs.md`).

## The code-review panel (MANDATORY gate before merging to main — pipeline stage 6)

No branch merges to `main` without a multi-reviewer code review of the full diff
(`git diff origin/main...HEAD`). (Fix-lane branches use the single-reviewer route of
§fix lane instead.) The panel runs **in parallel** (one message, four Task
calls), each reviewer applying a **different review skill** so the methods stay orthogonal:

| Reviewer | Skill | Angle |
| --- | --- | --- |
| Architect A | `code-review` (effort high) | correctness bugs, reuse, simplification, efficiency |
| Architect B | `bmad-code-review` | BMAD adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor vs the story/ADR criteria) |
| Architect C | `bmad-review-edge-case-hunter` | every branch/boundary condition of the diff |
| Architect D | `security-review` | attacker-controlled surface (URL params, localStorage, asset paths, scripts) |

Protocol: reviewers are **read-only** and report findings as
`[BLOQUANT|MAJEUR|MINEUR] + file:line + concrete failure scenario`. Every non-trivial
finding is then **adversarially verified** (a skeptic agent tries to refute it against the
real code); only CONFIRMED findings are acted on. `senior-architect` triages and
prescribes fixes or rejects-with-reason — and delivers his INTEGRATION REVIEW
(cross-lane sign-off, boundary law) in the same triage pass: he is reading the full
diff anyway, so integration and triage are ONE stage, not two serial reads. The OWNING
lane applies the fixes (the architect never implements feature code himself — and DOC
findings (ADR/bible/README/JSDoc realignments) route to `tech-writer` as the standing
DOCS-lane owner, so the architect stops absorbing them in his triage); then
`rtk tsc` + `rtk vitest` + `rtk lint`
re-run, and the panel re-runs if the diff changed materially. The panel outcome
(findings → verdict → action) is logged in the story's handoffs shard and summarized in
the PR. A PR with an unresolved CONFIRMED BLOQUANT/MAJEUR finding must not be merged.

## The art flow (any generated asset — vehicles, enemies, level art)

```
graphic-references (OPTIONAL — when the family lacks references or Bertrand asks
     for a hunt: INTERVIEW (questions relayed to Bertrand) → web PROPOSITIONS →
     Bertrand verdicts KEEP/DROP/DIG per direction → REFINE, max 3 rounds then
     escalate. Validated board lands in docs/art-direction/references/boards/;
     lead-art curates it into the reference library)
     ↓
art-advisor (references, period grounding — advice)
     ↓
concept-artist (drafts prompts, positive shape language, shared style block)
     ↓
game-graphist PRE-PROD PASS (readability at game size, keying soundness —
                             numbered annotations; concept-artist integrates)
     ↓
lead-art PROMPT GATE (PASS required before any levelArt.json prompt commit;
                      scripts/check-art-prompts.mjs must also pass — it runs in CI)
     ↓
dispatch generation (marker push, see docs/ci.md) — the workflow runs
scripts/check-sprite-style.mjs on each output and retries bad rolls (bounded)
     ↓
game-graphist TECHNICAL PASS (real-size inspection, fringe/halo cleanup via
                              documented scripts — filters what reaches lead-art;
                              for any runtime-composed visual the technical pass ALSO
                              inspects the in-game COMPOSITE at real in-game size, not
                              the source PNG alone — a glow's alpha falloff is only
                              visible on the composite)
     ↓
lead-art ASSET GATE (PASS/FAIL per sprite vs docs/art-direction.md;
                     mechanical gate passing does not bind the verdict)
     ↓
lead-art COMPOSITE GATE (Gate 4 — runtime-composed visuals only: neon rims, glows,
                         additive/emissive effects. Runs at pipeline stage 5 (VERIFY),
                         on REAL in-game screenshots of the INTEGRATED build — never
                         inline in the stage-4 art lane. An asset-gate PASS does NOT
                         cover runtime composition. « un halo est un dégradé, jamais
                         un aplat » — a binary-alpha glow with no falloff FAILs here)
     ↓
FAIL (prompt/asset gates) → concept-artist iterates (one variable per roll,
        max 2 batches/cycle, then escalate options to Bertrand)
FAIL (composite gate) → dev-r3f-render (the composed visual is src/render code;
        it re-enters the art flow only if the defect is in the source sprite's alpha)
PASS → stage 5 (VERIFY) funnels into qa-lead's QUALITY GATE, then the pipeline
        continues (review + integration triage → pm acceptance)
```

Every gate verdict is logged in the story's handoffs shard (index: `docs/agent-handoffs.md`).

**Runtime-composed visuals (the composite gate wiring).** Some visuals are NOT present
in the delivered PNGs — they are composed live in `src/render` (the ADR-0011 neon rim,
glows, additive effects). These have no acceptance surface in the asset gate, which judges
only the source sprite. So:

- **`dev-r3f-render`** MUST deliver REAL in-game screenshots (via the e2e scripts / the
  `verify` skill) alongside ANY change to a runtime-composed visual. A code diff is not a
  deliverable here; the on-screen composite is.
- **`game-graphist`**'s TECHNICAL pass inspects that composite at real in-game size — the
  glow's alpha falloff and edge behaviour only exist on the composite, never on the PNG.
- The **orchestrator** routes those screenshots to `lead-art` for the composite gate
  (Gate 4) before merge. No screenshots reaching `lead-art` = the runtime visual is
  ungated = it does not merge.
- A composite-gate **FAIL routes to `dev-r3f-render`** (the visual is render code,
  not a prompt — regenerating a PNG cannot fix a falloff computed in `src/render`);
  it goes back to `concept-artist` only when the defect is in the source sprite
  itself (e.g. its alpha channel).

## The audio flow (any BGM/SFX asset or audible behaviour change)

```
game-designer (WHEN a cue fires + what it means — only if the cue is a gameplay signal)
     ↓
sound-designer SPEC (what it sounds like: character, tier mapping, function —
                     "ce qui sonne informe": every cue is information)
     ↓
sourcing/generation (dev-tooling-assets mechanics, e.g. scripts/download-audio.mjs —
                     each sourced asset carries a VERIFIED licence/provenance record)
     ↓
sound-designer AUDIO GATE (PASS/FAIL per asset vs docs/audio-direction.md;
                           mechanical pre-checks — format, loudness, loop points —
                           never bind the verdict; what needs human ears is
                           escalated to Bertrand with a shortlist, never passed blind)
     ↓
FAIL → iterate (max 2 batches/cycle, then escalate) · PASS → dev lanes wire it
     ↓
audible BEHAVIOUR changes (tension→tier mapping, crossfades, mix) get Malik's verdict
on the spec BEFORE implementation and on the result at stage 5 (VERIFY)
```

`sound-designer` (Malik) owns `docs/audio-direction.md` (the sonic twin of the art
bible) and is `lead-art`'s peer: one identity, two senses. Every gate verdict is logged
in the story's handoffs shard (index: `docs/agent-handoffs.md`).

## Rules of engagement
1. **No code before a story.** `pm` defines it; `senior-architect` makes it buildable and
   assigns lanes. Devs implement only assigned, scoped work. When the story touches
   gameplay (mechanics/tuning/3C) or fiction (universe/cast/in-game text), the design
   loop runs first and no dev implements an ungated design: `lead-game-designer`'s
   DESIGN GATE PASS is required before the architect assigns lanes.
2. **Boundary rule is law.** `src/game` imports no React/Three; `src/render` holds no game
   rules; `src/hooks` is the only bridge. Any change crossing a lane → `senior-architect`
   sign-off, logged below.
3. **Parallel-safe = non-overlapping paths.** Two routinely shared seams: `src/hooks/**`
   (render ↔ gameplay) and doc-comment/JSDoc WORDING inside `src/**` (`tech-writer` ↔
   the owning dev lane — wording only, never logic; a doc fix needing a logic change is
   a finding for the dev lane). Both: announce, serialise, don't both edit at once.
4. **Log every hand-off** in the story's shard `docs/handoffs/story-<slug>.md`
   (`docs/agent-handoffs.md` is the index — template and the machine-parsable
   `VERDICT: PASS|FAIL — <gate> (<agent>)` line format live there; fix-lane cycles log
   one line in `docs/handoffs/fixes.md`). One line to claim work, one to release it +
   File List. `producer` curates the log's hygiene and chases missing entries — an
   unlogged hand-off didn't happen. **Shard rule (general):** any shared, append-style
   doc approaching the point where an agent can no longer read it in one pass
   (~100 KB) gets sharded by its owner — per story, per family, or per period — with a
   small index at the old path so references keep resolving.
5. **Tooling discipline.** Use `rtk` for dev commands (compact output) and `codegraph` to
   locate symbols/callers before editing. Verify with `rtk tsc` + `rtk vitest` + `rtk lint`
   before declaring done — and never claim green tests that aren't.
6. **Scope guard.** Everything is checked against
   `_bmad-output/guidelines/PROJECT_GUIDELINES.md` and the core loop
   `Récupérer → Livrer → Éviter`.
7. **Language.** Communicate with Bertrand in the `communication_language` from
   `_bmad/bmm/config.yaml`.
8. **Code-review panel is a merge gate.** Any branch headed for `main` goes through the
   multi-skill panel above (which carries the architect's integration sign-off in its
   triage). No merge with an unresolved CONFIRMED BLOQUANT/MAJEUR finding. Fix-lane
   branches substitute the single `code-review` (high) reviewer of §fix lane. (Hard
   enforcement on GitHub — branch protection / required review — is a repo setting only
   Bertrand can flip.)
9. **ADR numbers are allocated by `producer`.** Nobody self-allocates an ADR number:
   Marion hands out the next free `NNNN` at story opening (or on request mid-story) and
   records it in the story shard. Parallel lanes numbering their own ADRs is how the
   repo got two ADR-0020s and a 0026→0028 rebase renumber — never again.

## How to launch them
From the main session, launch agents with the Task tool. Independent lanes go in **one
message with multiple tool calls** so they run concurrently, e.g. `dev-r3f-render` +
`dev-gameplay` + `dev-tooling-assets` in parallel after `senior-architect` has partitioned
the work. Use `pm` and `senior-architect` first to open and plan the loop.
