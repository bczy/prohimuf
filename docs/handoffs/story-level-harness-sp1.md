# Handoffs — Level harness SP1: un level composable en données (STORY-LEVEL-HARNESS-SP1)

Story slug: `story-level-harness-sp1` · opened retroactively 2026-07-29 (panel MAJEUR
« untraced diff » on PR #149 — the cycle ran, the shard did not exist; this document
closes that gap and is the trace).
Feature: sub-project 1 of the level-generation harness — make a level fully describable
as data (backdrop, per-level enemy skins, one level-authored archetype max, per-level
props, tuning, fiction), additively, without touching the four shipped levels.
Triggered by Bertrand's direct intake: _« que te manquerait-il pour faire un harness qui
crée un level complet »_ then _« il faudrait tout créer : les ennemis, les backgrounds,
absolument tout »_ (2026-07-27).

## 1. INTAKE + CADRAGE — direct avec Bertrand — 2026-07-27

- Gap analysis of the existing chain (13 `gen-*.yml`, manifest, gates) → 7 gaps, the
  blocking one being enemy/prop scoping. Scope B chosen by Bertrand (full harness from a
  one-line pitch), split into SP1 (schema) → SP2 (per-phase CI generation) → SP3
  (orchestrator), forced order.
- Four framing decisions by Bertrand: skins per level + ONE novel archetype max
  (design-gated); props per level too; canonical backdrop = `single-wide` paid pipeline;
  additive only (shipped levels byte-for-byte).
- Architecture chosen (option B of three): statically merged archetype table + one
  generated module per level. Spec: `docs/game-design/spec-level-harness-sp1.md`
  (validated by Bertrand), plan: `docs/game-design/plan-level-harness-sp1.md`.

## 2. BUILD — dev-gameplay lane — 2026-07-29

- Tasks 1-5 of the plan on `feat/level-harness-sp1` (commits e8e0b0cf, 089ef78a,
  c22f80a9, 653e10a9, 00c0402b): table split + `archetype()` accessor, `EnemyKind`
  widening, `LevelPlan` + validator + projections, `generated/` seam + fixture level.
- Two deviations from plan, both correct and kept: generated levels live OUTSIDE
  `LEVELS` (its order drives the index-based unlock hop and the menu wall) in
  `GENERATED_LEVELS`/`ALL_LEVELS`; and `buildWeightedFrom` had to learn to append
  authored kinds (the spec's claimed activation seam only half-existed).
- Full suite green at hand-off: 1278/1278, typecheck clean, shipped-level invariant
  tests untouched.

## 3. STAGE 6 — panel CI run on PR #149 — 2026-07-29

- Verdict **FAIL**: 1 BLOQUANT (this ADR-worthy change shipped without an ADR —
  closed by `docs/adr/0075-level-plan-composable-generated-levels.md` in the same PR — allocated 0073, renumbered 0074 at the first rebase (main took 0073), then 0075 at the post-#150 rebase (main took 0074)),
  8 MAJEUR, 1 MINEUR.
- Remediation split across two lanes on disjoint files (no-commit rule, orchestrator
  commits after review): `dev-gameplay` — validator hardening (windowWeights namespace +
  typo cross-check, mobile-halving row parity), id-collision guard, preloader resolving
  generated ids (`assetManifest`); `dev-r3f-render` — task 6 done for real (generated
  props renderable when their PNG exists: `getNearForeground` accepts owner-namespaced
  kinds, render-side `nearKindSpec` resolution, no procedural fallback), `WIDEST_ASPECT`
  widened to generated archetypes.
- Untraced-diff MAJEUR: closed by this shard.

## Suivi

- [ ] Panel re-run after remediation push → zero unaddressed CONFIRMED bloquant/majeur
- [x] `verify` §8 acceptance evidence — DONE 2026-07-29 (re-run after the run-2
      roster fix): `?preview=level&level=fixture` seam (generatedHarness.ts, boss-seam
      reachability discipline — generated-only, never shipped), headless Playwright:
      zero pageerror, HUD `NIVEAU Fixture`, timer 60→47 ticking, flat-colour backdrop
      fallback, enemies firing and dealing damage. CORRECTION of the first run's claim:
      that run resolved the roster off `LEVELS` (run-2 MAJEUR) so it played the DEFAULT
      pool — `fixture:vigile` was not in it. Now `GameScene`/`handlePlay` resolve via
      `ALL_LEVELS`, and the vigile's activation is pinned by the pool-composition unit
      test (`generatedLevels.test.ts`); on screen it is indistinguishable anyway (it
      renders on the same fallback sprite). Evidence:
      `docs/qa/evidence/story-level-harness-sp1/` (3 PNG + report.json)
- [ ] `senior-architect` countersign: `GENERATED_LEVEL_CONFIGS` / `GENERATED_LEVELS` /
      `ALL_LEVELS` placement in `levels.data.ts` satisfies ADR-0074 §2's
      import-time-computable rule (pure projection at import, no runtime state) —
      requested post-rebase on #150; the JSDoc on `GENERATED_LEVELS` points here
- [ ] `pm` acceptance vs this shard + PROJECT_GUIDELINES
- [ ] SP2 opens only after this merges
