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

## 4. DESIGN GATE (rétroactif) — lead-game-designer — 2026-07-29

**PASS** — gate rétroactif, périmètre strictement limité au tuning de l'archétype
`fixture:vigile` et à son activation dans le roster du level `fixture` (aucun autre
élément du diff PR #149 n'est gaté ici ; l'architecture, le validateur et le seam de
preview restent la lane `senior-architect`).

Justification :

1. **Scope** — extension consciente et déjà documentée, pas une nouveauté non déclarée :
   le spec gaté §2.1 autorise « un archétype inédit au maximum par level », défini comme
   une recombinaison de primitives mécaniques existantes. `fixture:vigile` n'introduit
   aucune primitive, aucune règle, aucun `switch (kind)` : c'est une ligne de table. Le
   level est hors `LEVELS`, sans assets, atteignable uniquement par
   `?preview=level&level=fixture` ; c'est de l'outillage de vérification, pas du contenu
   joueur.
2. **Tuning dans les eaux de `CORE_ARCHETYPES`** — hp 2 = `riot` ; bulletDamage 0.5 =
   `biker` ; hidden 1.6 / visible 3.0 encadrés par `normal` (1.5/3.2) et `riot`
   (1.7/3.6) ; scoreDelta 2 = `riot` ; livesDelta/timeDelta 0 ; `countsAsTarget: true` ;
   tint `#ffffff` et aspect 1 = `normal`. Aucune valeur hors enveloppe, aucun effet
   exotique. `spriteBase: "enemy_fixture_vigile"` inexistant exprès pour forcer le repli
   `enemy_sprite`.
3. **Loi d'activation** — `weight: 0` respecté (§4.2), activation par le seul
   `roster.windowWeights` du level `fixture` : `WEIGHTED` et le pool par défaut des 4
   levels shippés sont intacts. C'est la conformité qui compte le plus dans ce gate, et
   elle est tenue.
4. **Boucle core** — non diluée : `Récupérer → Livrer → Éviter` inchangée, l'archétype
   se comporte comme un pop-fenêtre standard. Cadrage 60 s / 5 ennemis : bien sous le
   plafond « une mission = 3-5 minutes » (PROJECT_GUIDELINES) — c'est un plafond, pas un
   plancher, et une fixture doit se dérouler vite pour servir de preuve rejouable.
5. **Vérifiabilité** — toutes les valeurs sont des nombres pinnés dans le module, et
   l'activation est épinglée par le test de composition de pool
   (`generatedLevels.test.ts`). Rien à deviner pour un dev.

Réserve non bloquante (advisory) : le level `fixture` doit rester ce qu'il est — hors
campagne, sans assets, hors du menu. Toute demande future de lui générer de l'art, de le
nommer en fiction ou de le rendre atteignable autrement que par le seam de vérification
annule ce PASS et le renvoie en gate plein.

**Précédent SP2/SP3 — confirmé, sans amendement** : ce PASS est un précédent de portée
volontairement étroite, réservé aux levels de vérification (hors `LEVELS`, sans assets,
atteignables uniquement par le seam de preview) ; tout level généré destiné à être joué
en SP2/SP3 repasse le **gate design plein** — tuning d'archétype, composition de
roster/poids, courbe de difficulté et cohérence fiction — level par level et avant
merge, exactement comme l'en-tête « Lanes » du spec `spec-level-harness-sp1.md` le
prévoit.

— Karim, `lead-game-designer`, 2026-07-29.

## Suivi

- [ ] Panel re-run after remediation push → zero unaddressed CONFIRMED bloquant/majeur
- [x] `verify` §8 acceptance evidence — DONE 2026-07-29 (re-run after the run-2
      roster fix): `?preview=level&level=fixture` seam (generatedHarness.ts, boss-seam
      reachability discipline — generated-only, never shipped), headless Playwright:
      zero pageerror, HUD `NIVEAU Fixture`, timer 57→54 ticking (TEMPS 48s at the
      last HUD snapshot — the exact report.json values), flat-colour backdrop
      fallback, enemies firing and dealing damage. CORRECTION of the first run's claim:
      that run resolved the roster off `LEVELS` (run-2 MAJEUR) so it played the DEFAULT
      pool — `fixture:vigile` was not in it. Now `GameScene`/`handlePlay` resolve via
      `ALL_LEVELS`, and the vigile's activation is pinned by the pool-composition unit
      test (`generatedLevels.test.ts`); on screen it is indistinguishable anyway (it
      renders on the same fallback sprite). Evidence:
      `docs/qa/evidence/story-level-harness-sp1/` (3 PNG + report.json)
- [x] ADR-0074 §2 placement question RESOLVED by relocation (panel run-5, 2026-07-29):
      `GENERATED_LEVELS` / `ALL_LEVELS` moved OUT of `levels.data.ts` into the
      `levels.ts` barrel, which §2 does not bind — the data module is back to pure
      literals with zero import side effect, consumers' import lines unchanged. The
      generated import's side effect (archetype registration + duplicate-id throw)
      is documented on the barrel where it now lives. The former countersign ask
      (was: bless the placement IN the data module) is moot; `senior-architect`
      still reviews this at his panel-triage/integration read like the rest of the diff
- [x] Design gate on the tuning/roster surface (spec lane header): retroactive
      scope-limited PASS by `lead-game-designer` on `fixture:vigile` — §4 above
      (panel run-10 MAJEUR closed); SP2/SP3 playable levels take the FULL design gate
- [ ] `pm` acceptance vs this shard + PROJECT_GUIDELINES
- [ ] SP2 opens only after this merges
