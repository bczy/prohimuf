# story-harness-infographics — handoffs

Story : une infographie par harness (série sœur de l'agents-pipeline poster), même
système visuel, sprites du crew conservés. Branche
`claude/agents-pipeline-infographic-v5igsx` (redémarrée depuis main après merge #74).
Pas d'ADR (outillage de doc ; mécanisme documenté dans les en-têtes de script).

Périmètre confirmé par Bertrand (AskUserQuestion) : les 4 harness — Level-art
(HARNESS.md), Window-alignment (ADR-0028), Dynamic verification (ADR-0005, Proposed),
Shared harness library (ADR-0007, Proposed).

- 2026-07-17 · intake (Bertrand) : « de la même manière fait une infographie par
  harness et garde les petits bonhommes » ; agents + génération d'images autorisés.
- 2026-07-17 · collecte de matière : HARNESS.md/ci.md/asset-pipeline.md lus en direct ;
  3 sous-agents Explore en parallèle pour window-align / dynamic-verify / shared-lib
  (briefs factuels, statuts ADR relevés).
- 2026-07-17 · dev-tooling-assets : docs/diagrams/build-harness-infographics.py
  (tête/style partagés + un corps par harness, sprites en chemin relatif) émet les 4
  pages ; check-harness-infographics.mjs + manifeste + wiring ci.yml ; lien poster
  dans HARNESS.md.
- Honnêteté : ADR-0005 et 0007 sont _Proposed_ et le dépôt diverge (preview.yml épinglé
  à une branche non-courante ; lib partagée pas encore extraite — morphology.mjs +
  e2e-lib.mjs présents). Les pages l'affichent en bandeau « ADR Proposed » plutôt que
  de présenter du projeté comme livré.
- VERDICT: PASS — checks mécaniques (tsc/vitest 423/vitest/lint/format + les deux gates
  FRESH + tests négatifs du gate harness : source modifiée, infographie manquante)
  (dev-tooling-assets)
