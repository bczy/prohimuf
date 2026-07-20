# Hand-offs — menus/UI-completion cycle (epic-menus-ui-completion: M1, M2, M3 + UX spec)

Covers the epic-level DESIGN GATE run before lane split. `producer` may shard per-story
(M1/M2/M3) at sprint planning; this block is the design-gate record for all three.

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20
- claim: gate the menus/UI-completion cycle — epic + 3 PM stories (M1 name-entry, M2
  difficulty-separation, M3 a11y-consolidation) + UX spec `spec-menus-ui-completion.md`;
  resolve 7 open questions from both lanes.
- release: verdict doc `docs/game-design/design-gate-menus-ui-completion.md`; index updated
  (`docs/game-design/README.md`); surgical edits applied to M1 (input length ≤16 + Q1/Q2
  decisions), M2 (file-map corrected: keep PRESSION in OPTIONS + add NIVEAUX header, not
  removal/new rubrique; VIES stays in OPTIONS), UX spec (Q7 single-flag heuristic, Q3 Option A
  chosen, §6 all resolved). 7 decisions: Q1 native byline / Q2 `NAME_ENTRY` after
  `NARRATIVE_POST` / Q3 promoted NIVEAUX PRESSION header + Option A / Q4 S0.1-owns-schema
  sequencing / Q5 `reducedMotion` default false + live-union / Q6 outcome-contract boundary /
  Q7 `muf_seen_tutorial_nudge`. File List: see verdict doc §Edits.
- VERDICT: PASS — design gate: epic-menus-ui-completion (lead-game-designer)
- VERDICT: PASS — design gate: story-highscore-name-entry M1 (lead-game-designer)
- VERDICT: PASS — design gate: story-difficulty-modifiers-separation M2 (lead-game-designer)
- VERDICT: PASS — design gate: story-accessibility-settings-consolidation M3 (lead-game-designer)
- VERDICT: PASS — design gate: ux/spec-menus-ui-completion (lead-game-designer)

Conditions/routes (not blockers): M3 PASS conditional on the Q5 live-union semantics.
`story-timer-duel-telegraph.md` AC13 (other epic, socle-fidélité) must be reconciled from
seed-once to the union model before either story ships — routed to `game-designer` +
`senior-architect` (authority ADR). Next stage → `senior-architect` lane cut + scope ADR;
sequence M2 & M3 on shared `OptionsColophon.tsx`/`PauseScreen.tsx`.
