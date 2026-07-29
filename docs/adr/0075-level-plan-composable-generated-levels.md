# 0075 — Un level est un objet composable : table d'archétypes scindée, kinds namespacés, seam `generated/`

- **Status:** Proposed
- **Date:** 2026-07-29
- **Number:** 0075, self-allocated via the `adr-new` numbering discipline. First
  allocated as 0073 (checked against `origin/main`, the index AND every remote branch),
  then RENUMBERED at rebase time: PRs #141/#143 merged meanwhile and main took
  0071/0072/0073 (`0073-tutorial-immersion-narrative-contract.md`) — the exact
  duplicate-number hazard the adr-new discipline exists for, caught before the index
  regeneration rather than after merge.
- **Relates to:** ADR-0004 (level roster gate — the `windowWeights` seam this design
  activates through), ADR-0057 (single-wide backdrop — the canonical backdrop contract for
  generated levels), ADR-0047/0049 (near-foreground props — the sizing contract moved to
  data for generated props).
- **Author:** drafted from the decisions of `spec-level-harness-sp1.md` (design validated
  by Bertrand 2026-07-27); triage of panel run on PR #149 confirmed the missing-ADR
  BLOQUANT this document closes.

## Context

The level harness (SP1 of three sub-projects) needs a level to be **describable entirely
as data**: backdrop, per-level enemy skins, at most one level-authored archetype, per-level
props, tuning, fiction. Before this change, `ARCHETYPES` was a closed
`Record<EnemyKind, Archetype>` over six kinds, enemy art was global, and a level had no
place to declare its own enemies or props. Three facts shaped the design: `ARCHETYPES` was
already a pure data table (no `switch (kind)` anywhere in `src/game`); `spriteBase` is a
string field of the archetype, so per-level skins need no new axis; and `WEIGHTED` is a
frozen, order-sensitive constant that `pickKind` determinism is guaranteed against.

## Decision

1. **Split, don't open, the core table.** `CORE_ARCHETYPES: Record<CoreEnemyKind, Archetype>`
   keeps TypeScript exhaustiveness over the six core kinds. Level-authored archetypes live
   in a module-private registry filled once at import by `generated/index.ts`
   (`registerGeneratedArchetypes`, idempotent per key). The single resolution point is
   `archetype(kind)`, which falls back to `normal` — the same fallback `pickKind` already
   used. `WEIGHTED` iterates `CORE_ARCHETYPES` only and is byte-for-byte unchanged
   (pinned by golden test).
2. **Namespaced generated kinds.** `EnemyKind = CoreEnemyKind | \`${string}:${string}\``.
The `:` never appears in core ids, so the two namespaces are disjoint by construction.
3. **`weight: 0` is mandatory** on every level-authored archetype (validator-enforced).
   Activation happens only through the owning level's `roster.windowWeights` — the
   ADR-0004 seam — where `buildWeightedFrom` appends authored kinds AFTER the core pool,
   and only when they resolve to a registered archetype. Default pools of every shipped
   level are unchanged.
4. **One module per generated level.** A generated level is one file,
   `src/game/levels/generated/<id>.ts`, declaring a single `LevelPlan`; `generated/index.ts`
   aggregates. The harness only ever CREATES files — it never edits `levelArt.json` or
   `levels.ts`, whose load-bearing comments and hand-gated data stay out of its blast
   radius.
5. **`LevelPlan` is the single source; `LevelConfig` and `LevelArt` are projections**
   (`planToLevelConfig` / `planToLevelArt`, pure functions in `levelPlan.ts`).
6. **Generated levels live OUTSIDE the shipped campaign.** `LEVELS` keeps its exact
   shipped content and order — the index-based unlock hop (`levelProgress.ts`
   `LEVELS[shippedIdx + 1]`) and the menu wall index into it. Generated levels are
   exposed as `GENERATED_LEVELS` and `ALL_LEVELS = [...LEVELS, ...GENERATED_LEVELS]`;
   promoting one into the campaign is a deliberate, separate act.
7. **Generated props carry their sizing as data** — the same `{aspect, heightFrac,
footPadFrac}` triplet as `NEAR_KIND_SPECS`, resolved per kind at render time; a
   generated prop has NO procedural fallback drawing: without its PNG it silently does
   not render.

## Consequences

- Adding a generated level = one new module + one line in `generated/index.ts`; deleting
  one = deleting a file. Two levels can be generated in parallel without conflicts.
- Every reader of the archetype table goes through `archetype()`; direct indexing of a
  string-keyed merged table would be `| undefined` under `noUncheckedIndexedAccess`.
- The boundary law holds: `levelPlan.ts` and `generated/**` are pure game data
  (type-only imports toward `levels.ts`/`levelArt.ts`); render reads game, never the
  reverse.
- Two guards, two failure times — deliberately distinct. `validateLevelPlan` is the
  CI-time guard (weight-0, the 1-archetype cap, namespace ownership of archetypes,
  props AND `windowWeights` keys, sizing completeness incl. `x`, `variants`/`hp` floors,
  gameplay sanity, duplicate-kind consistency, mobile-halving row parity): a bad plan
  fails tests, never play. Namespace ownership is ALSO enforced config-side by
  `validateLevel` (`foreign-enemy-kind`, ADR-0074 §3): a `LevelConfig` that reaches
  validation WITHOUT going through `validateLevelPlan` (hand-authored, story ③'s MCP
  edits) still cannot key another level's namespaced kind in `roster.windowWeights` —
  the runtime resolvers (`archetype`, `buildWeightedFrom`) stay deliberately global
  and unscoped, so this validator check is the isolation guarantee, not them. Id-collision is the exception and is NOT in the validator:
  `assertDistinctPlanIds` (generated/index.ts) throws at IMPORT time — a deliberate
  fail-fast, because a colliding id would silently corrupt `LEVEL_ART` (last-wins)
  while `ALL_LEVELS.find` returns the other entry (first-wins), a split-brain no test
  fixture can represent without triggering it.
- Verification reachability: the `?preview=level&level=<id>` URL seam boots a generated
  level for §8-style verification. Lookup restricted to `GENERATED_LEVEL_CONFIGS`
  (never `LEVELS` — the shipped campaign is not URL-bootable through it), persistence
  inert behind the existing `PREVIEW_SCREEN !== null` guard; mirrors the
  `?preview=boss` reachability discipline (ADR-0051 D4/E9).
- SP2 (per-phase CI generation) and SP3 (pitch → candidate orchestration) build on this
  schema; nothing here presumes them.
