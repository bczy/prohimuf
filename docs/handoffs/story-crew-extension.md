# story-crew-extension

Roster extension: adds `ux-designer` (Tony 🖱️), `gpu-specialist` (Ben 🏍️) and
`tech-writer` (Otis 📚) to the crew, plus protocol wiring and an ADR. Branch
`claude/agents-manquants-equipe-sci9kt`, PR #72. This shard is opened at stage 6 because
the branch still carries the pre-shard monolithic `docs/agent-handoffs.md`; the
orchestrator migrates the branch's earlier INTAKE/ARCH entries into this file during
reconciliation (they are quoted at the tail of the old monolith).

> Context that dominates this triage: `origin/main` moved under the branch —
> commit `36cd10f` (two-tier pipeline, sharded handoffs, merged review stage, **ADR-0032**).
> The branch was authored against **pre-`36cd10f`** main. Every BLOQUANT below is a
> consequence of that base drift.

## 0-1. INTAKE / PRODUCT — Bertrand → orchestrator — 2026-07-17 _(re-homed from the pre-shard monolith)_

- claim: Bertrand validated a roster-gap analysis and authorised adding three subagents:
  **Otis 📚 `tech-writer`** (fronts `bmad-agent-tech-writer`/Paige) as standing DOCS-lane
  owner — the handoffs log showed the architect absorbing DOCS lanes himself; **Tony 🖱️
  `ux-designer`** (fronts `bmad-agent-ux-designer`/Sally) as a third design lane
  (screens/flows, HUD ergonomics, accessibility), gated by `lead-game-designer`;
  **`gpu-specialist`** (no BMAD persona; named Théo ⚡ at intake, renamed **Ben 🏍️** by
  Bertrand mid-story, commit `a8b2bdf`) owning the frame budget, GPU-cost analysis at
  TECH PLAN and the PERF VERDICT at stage 5 — filling the CRT-story gap (AC6 perf
  unmeasurable under SwiftShader, no gate owner). Org/protocol change only, no
  production code. Stages 2-5 skipped EXPLICITLY: no gameplay/fiction/asset surface
  (protocol-meta change); mechanical checks ran in lieu of a per-story test plan.

## 6a. FIRST ARCHITECT SIGN-OFF — senior-architect (Winston 🏗️) — 2026-07-17 _(re-homed; pre-dates the base-drift discovery and the Théo→Ben rename)_

- claim/release: cross-cutting review of the 6-file diff (3 charters, COLLABORATION.md
  roster 15→18 + wiring, CLAUDE.md, diagram). Internal coherence PASS (names/emojis/
  ownership/gate wiring in lockstep); mermaid valid; gates/caps PASS (purely additive).
  Two MAJEUR conditions + one MINEUR: (1) no ADR records the extension → new ADR
  required in-PR; (2) tech-writer↔dev JSDoc WORDING seam undeclared in Rules of
  engagement #3 → declare it (announce/serialise, wording-only); (3) crew bitmap stale
  at 15 cards → regenerate. Note: `docs/perf-budget.md` and `docs/game-design/ux/`
  absent as expected (first-activation deliverables).
- VERDICT: PASS — cross-cutting sign-off, CONDITIONAL (3 conditions) (senior-architect)

## 6b. CONDITIONS APPLIED — orchestrator (DOCS lane) — 2026-07-17 _(re-homed)_

- release: condition 1 → ADR authored (then numbered 0032 — superseded by triage finding
  B1 below: renumbered 0033 after main's two-tier ADR took 0032, then **0034** after a
  second and third parallel-main collisions, see 6d/6f: final number **0037**) + README row;
  condition 2 → rule #3 names the JSDoc seam; condition 3 → bitmap at 18 cards (6×3,
  '8' glyph, "LES 18 CLAUDES"), TONY (phone+pointer+toggle), BEN (moto+GPU chip+frame
  graph), OTIS (doc+pen+shades). Verification: yarn typecheck ✓, test 423/423 ✓, lint ✓.

## 6. REVIEW — senior-architect (Winston 🏗️) — 2026-07-17

- claim: triage the 4-reviewer panel findings on `git diff origin/main...HEAD` and deliver
  the integration sign-off in the same pass (merged stage 6, per `36cd10f`). Read-only
  except this log entry. Panel findings were adversarially cross-checked; I independently
  re-confirmed against `origin/main` (`git merge-tree --write-tree`, ADR index tail,
  `docs/handoffs/` tree).
- release: triage verdicts + prescriptions + owning lanes below. All owning-lane work is
  the **orchestrator acting as the DOCS/tooling lane** (Otis/Tony/Ben are the _subject_ of
  this PR and are not launchable until it merges). Findings independently reproduced:

  | #   | Sev      | Finding                                                                                                                                             | Verdict                                                          | Prescription → lane                                                                                                                                                                                                   |
  | --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | B1  | BLOQUANT | ADR numbered `0032`, already taken by main's two-tier ADR                                                                                           | CONFIRMED                                                        | Renumber → `docs/adr/0033-crew-extension-ux-gpu-docs.md`; retitle `# 0033 —`; README row → 0033; sweep in-diff refs (the re-homed handoff entry). Producer (Marion) confirms/registers the number. → DOCS lane        |
  | B2  | BLOQUANT | Content conflict vs main in 5 files (COLLABORATION.md, CLAUDE.md, docs/adr/README.md, docs/agent-handoffs.md, docs/diagrams/agent-workflows.md)     | CONFIRMED — `merge-tree` reports CONFLICT in all 5               | Reconcile onto the two-tier versions (see Ruling 1). Not mergeable until resolved. → DOCS lane                                                                                                                        |
  | B3  | MAJEUR   | tech-writer wiring + CLAUDE.md flow ("stages 0-9", "architect reviews → panel" as two nodes) written against the deleted separate REVIEW stage      | CONFIRMED — main is stages 0-8, review merged into stage 6       | Re-express: stages 0-8; doc/DOCS findings route off the stage-6 TRIAGE (not a phantom REVIEW node); diagram REVIEW subgraph re-expressed as the merged panel+triage box. → DOCS lane                                  |
  | B4  | MAJEUR   | Two handoff entries appended to the now-forbidden monolithic `docs/agent-handoffs.md`                                                               | CONFIRMED — main turned that file into an append-forbidden index | Re-home the two entries into THIS shard + add the index row (`open`). → DOCS lane (producer curates index)                                                                                                            |
  | B5  | MINEUR   | All 3 charters instruct logging in `docs/agent-handoffs.md` (gpu L91, ux L84, tw L78)                                                               | CONFIRMED                                                        | Repoint to `docs/handoffs/story-<slug>.md` (+ `docs/handoffs/fixes.md` for fix-lane). → DOCS lane                                                                                                                     |
  | C1  | MINEUR   | Diagram PM→ARCH bypass label still "no gameplay/fiction change" — stale now that screens/flows is a design trigger                                  | CONFIRMED                                                        | Relabel bypass edge "no gameplay/fiction/**UX** change (tech/tooling/art/audio only)". → DOCS lane                                                                                                                    |
  | C2  | MINEUR   | CLAUDE.md VERIFY summary lists Ben's perf leg but omits Tony's stage-5 UX-review leg (which the diagram DOES add as UXR→DACC)                       | CONFIRMED                                                        | Add ux-designer's built-screens UX review to the CLAUDE.md verify sentence for symmetry with the diagram. → DOCS lane                                                                                                 |
  | C3  | MINEUR   | DEFERRED-ON-TARGET has no re-entry route if the on-target measurement returns OVER budget post-merge                                                | CONFIRMED                                                        | Name the re-entry: OVER-budget on-target result re-enters via the **fix lane** (or `correct-course` if scope-affecting) back to the owning dev lane; document on the PERF edge + COLLABORATION §fix lane. → DOCS lane |
  | C4  | MINEUR   | Bitmap: Otis "reading shades" overlay at cell row 8 sits on the forehead — BASE eye line renders at row 9 (confirmed: nose-bridge overlay `(10,9)`) | CONFIRMED                                                        | Move shades overlay to row 9 (onto the eye line) and regenerate `docs/muf-crew.png`. → tooling/DOCS lane                                                                                                              |
  | A1  | MINEUR   | gpu-specialist charter mandates `mcp__Context7__query-docs` (L77) but `tools:` frontmatter omits it                                                 | CONFIRMED                                                        | Add `mcp__Context7__query-docs` to the allowlist (Context7 MCP is available) OR drop the mandate — pick one so charter and frontmatter agree. → DOCS lane                                                             |
  | A2  | MINEUR   | ux-designer charter cites "guidelines §5 UX-1" (L31); PROJECT_GUIDELINES §5 "Règles UX Non-Négociables" is an unlabeled numbered list — no "UX-1"   | CONFIRMED                                                        | Cite the real anchor: "§5 Règles UX Non-Négociables" (or the numbered item), drop the invented `UX-1` label. → DOCS lane                                                                                              |
  | D   | —        | Security                                                                                                                                            | CONFIRMED no findings                                            | None. Reconciliation adds no attacker surface.                                                                                                                                                                        |

- rulings:
  1. **Reconciliation = rebase onto `origin/main`**, not merge. The branch is docs-only, 3
     commits, and the 5 conflicts need _semantic_ re-expression (additive deltas re-applied
     onto main's new two-tier structure), not textual conflict-picking. Rebase keeps history
     linear and forces each delta to be restated against the correct base; resolve by taking
     main's two-tier text as canonical and re-applying ONLY the additive crew deltas
     (roster +3, design-loop +UX, verify +PERF/+UXR, panel→tech-writer routing, ADR-0033).
  2. **Bounded re-check, not the full 4-reviewer panel.** The reconciliation is material
     (per main's "panel re-runs if the diff changed materially"), but the entire surface is
     docs/process. I waive Reviewer A (`code-review`/correctness — no code) and Reviewer D
     (`security-review` — already clean, no attacker surface added). Re-run scoped to:
     Reviewer B (`bmad-code-review`, Acceptance-Auditor angle) verifying the additive deltas
     re-expressed correctly onto the two-tier base, all prescriptions landed (0033, shard
     re-home, stage 0-8 wording, seam rule), and **zero residual conflict markers**; plus
     Reviewer C (`bmad-review-edge-case-hunter`) narrowly on the routing fixes (C1, C3); plus
     my integration re-triage against whatever `origin/main` HEAD is at that moment. This is
     an explicit architect exception to the default full-panel rule, justified by docs-only
     surface — Bertrand/producer may override to a full panel.
  3. **ADR number = 0033.** Main's index ends at 0032 (two-tier). Allocation is producer's
     (Marion) job per COLLABORATION rule #9 / the ADR README allocation rule; I allocate
     0033 _provisionally_ here to unblock, with Marion's role noted — she must register it in
     the index at reconciliation so a second collision cannot recur (the very failure mode
     that produced B1).

- VERDICT: FAIL — integration sign-off / stage-6 REVIEW (senior-architect)

  Integration is BLOCKED on B1 + B2 (and B3/B4 ride the same reconciliation). The crew
  extension's _design_ is sound and additive — no boundary-law violation, gates/caps
  untouched — but the branch is unmergeable against current `main`. Re-enter stage 6
  (bounded re-check per Ruling 2) after the DOCS lane completes the rebase + all 12
  prescriptions. No merge to `main` until this line flips to PASS.

## 6c. RECONCILIATION — orchestrator (DOCS lane) — 2026-07-17

- claim: apply Winston's 12 prescriptions + Ruling 1 (rebase). Branch rebuilt on
  `origin/main` (`36cd10f`), main's two-tier text taken as canonical, additive crew
  deltas re-applied only.
- release: File List —
  - `docs/adr/0033-crew-extension-ux-gpu-docs.md` — renumbered from 0032 (B1), number
    0033 registered here per rule #9 (Marion's allocation, provisionally exercised by
    Winston in triage); allocation note added in the ADR header; C3 re-entry route
    added to the gpu-specialist bullet. `docs/adr/README.md` row intended here but
    NOT part of the reconciliation commit (re-check B, MINEUR log-accuracy) — the
    row actually landed at the SECOND renumber (see 6d; final number 0037, see 6f).
  - `.claude/agents/COLLABORATION.md` — deltas re-expressed on two-tier base: roster +3
    (18), stage 2 +ux trigger/lane, stage 3 +GPU-cost consult, stage 5 +PERF VERDICT
    (with C3 re-entry via fix lane) +UX review leg, stage-6 triage → tech-writer DOC
    findings routing, design flow +ux lane + 3C seam, rule #3 two seams (JSDoc wording).
  - `CLAUDE.md` — crew table +3; flow paragraph on stages 0-8 (B3): design loop +ux,
    verify legs +UX review (C2) +perf verdict.
  - `docs/diagrams/agent-workflows.md` — UXD/UXR/PERF/TW re-expressed on main's merged
    stage-6 structure: TW hangs off TRIAGE (B3), bypass edge relabelled
    "no gameplay/fiction/UX change" (C1), PERF FAIL edge names the fix-lane re-entry
    (C3), prose bullets updated.
  - `.claude/agents/{tech-writer,ux-designer,gpu-specialist}.md` — logging repointed to
    story shards (B5); Context7 tools added to Ben's allowlist (A1); Tony's guidelines
    citation fixed to « §5 Règles UX Non-Négociables » (A2).
  - `docs/muf-crew-bitmap.py` + `docs/muf-crew.png` — Otis shades moved onto the eye
    line, row 9 (C4); PNG regenerated.
  - `docs/agent-handoffs.md` — main's index kept verbatim + one index row for this
    shard (B4); the two monolith entries re-homed above as 6a/6b.
- next: bounded re-check per Ruling 2 (Reviewer B full-diff acceptance + Reviewer C on
  C1/C3 routing + Winston integration re-triage), then stage 7 pm acceptance.

## 6d. SECOND RENUMBER + CI FIX — orchestrator (DOCS lane) — 2026-07-17

- claim: two events during the bounded re-check: (1) `origin/main` moved AGAIN
  (`d6adcb9`) and took ADR-0033 (remote session provisioning) — second number
  collision on this story; (2) CI `format:check` failed on this shard (prettier).
- release: branch rebased onto `d6adcb9` (clean, ADR index auto-resolved); our ADR
  renumbered **0033 → 0034** (file, title, header allocation note now records both
  collisions, README row, index-row note); this shard prettier-formatted. Marion's
  allocation lesson doubled: allocate at story OPENING and re-check at merge — two
  parallel-main collisions in one story is the rule-#9 case study.

## 6e. RE-CHECK C FINDINGS APPLIED — orchestrator (DOCS lane) — 2026-07-17

- claim: bounded re-check, Reviewer C (edge-case-hunter, scope C1/C3). C1 holds at the
  bypass edge; C3's re-entry left 2 MAJEUR + 3 MINEUR gaps. All applied:
- release:
  - MAJEUR (open-PR dead end) → stage-5 perf leg now splits the OVER case: PR open =
    DEFERRED pass REVOKED, stage-5 FAIL, same branch via architect; post-merge = fix
    lane. (COLLABORATION.md stage 5, diagram PERF FAIL edge, ADR-0034, Ben's charter.)
  - MAJEUR (fix-lane loop never closes) → fix-lane closure of an OVER item requires
    Ben's PERF re-verdict (protocol re-run); `gpu-specialist` added to the fix-lane
    gate-owner reclaim list. (COLLABORATION.md §fix lane, ADR-0034, charter.)
  - MINEUR (correct-course mis-routed) → correct-course branch now explicitly
    re-enters at pm/architect, never at a dev lane.
  - MINEUR (charter silent on re-entry) → Ben's collaboration contract defines all
    three outcomes (UNDER / OVER-open / OVER-merged) and the design-trade routing.
  - MINEUR (trigger vocabulary drift) → "accessibility" restored in the diagram P2
    title, the how-to-read design bullet and CLAUDE.md's design-loop sentence.
- VERDICT: PASS — re-check C, findings applied (orchestrator, DOCS lane; Winston
  re-triage pending)

## 6f. THIRD RENUMBER — orchestrator (DOCS lane) — 2026-07-17

- claim/release: `origin/main` advanced a third time mid-story (`baebdd9`): the hostage
  QTE ADRs — themselves renumbered after colliding with 0033 — took 0034-0036. Our ADR
  renumbered **0034 → 0037** (file, title, header note now records all three
  collisions, README row, index-row note). Three renumbers in one story: rule #9 must
  be applied as "allocate at story opening AND re-check at merge" — Marion to confirm
  0037 is free at the moment Bertrand merges.
