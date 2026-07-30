# Handoffs — Level harness SP2 : phases de génération autonomes (STORY-LEVEL-HARNESS-SP2)

Story slug: `story-level-harness-sp2` · ouverte 2026-07-30, dans la foulée du merge de
SP1 (PR #149, ADR-0075). Feature : chaque phase de matérialisation d'un `LevelPlan`
(backdrop payé, calibration, skins, props, preuve) tourne seule en CI, idempotente,
gates existants, zéro octet des levels shippés modifié.
Intake : décision directe de Bertrand — « les deux en parallèle » (SP2 + story ③ MCP).

## 1. INTAKE + CADRAGE — pm (John, brouillon) puis direct avec Bertrand — 2026-07-30

- Cadrage pm : découpage en 5 phases, contrats E/S, gates réutilisés, 4 questions
  d'arbitrage remontées à Bertrand.
- **4 décisions actées par Bertrand (2026-07-30)** : la calibration ne regénère jamais
  l'image payée (échec = escalade humaine) + cap dur 3 tirages payés/level/PR · seed
  pinnée (dérivée du levelId) pour le backdrop payé, libre pour skins/props · le
  `LevelPlan` porte le point de départ de calibration (ajout de schéma, plus aucun
  `LEVEL_CFG` manuel) · preuve sur un VRAI level candidat dont la fiction passe la
  boucle design AVANT toute génération payée.
- Spec : `docs/game-design/spec-level-harness-sp2.md` · Plan (7 tâches) :
  `docs/game-design/plan-level-harness-sp2.md` — PR #151 (docs-only, avec la story ③).

## 2. Points de contact avec la story ③ (séquencement, panel run 2 de la PR #151)

Le corps de `validateLevelPlan` (SP2 T1 vs MCP T2b) et le driver §8 généralisé
(SP2 T6 vs MCP T5) — la seconde branche à atterrir rebase et adapte. Détail :
Auto-revue des deux plans.

## Suivi

- [ ] PR #151 (specs+plans) : panel PASS → acceptation pm → merge
- [ ] BUILD : branche `feat/level-harness-sp2`, T1 (dev-gameplay) puis T2-T6
      (dev-tooling-assets), T7 (boucle design du level candidat) ferme
- [ ] Le level candidat : id/quartier/fiction proposés par game-designer +
      narrative-designer, gate lead-game-designer, AVANT le premier tirage payé
