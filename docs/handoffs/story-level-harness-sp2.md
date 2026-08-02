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

## 2b. BUILD — dev-tooling-assets (+ dev-gameplay T1) — 2026-08-01

- T1→T6 committées (e65eb68f, 9dedb821, abe060aa, e5191bd2, a85c120a, 81745518) :
  schéma calibration, générateur payé paramétré (style/contenu séparés), workflow
  cap-3 en version durcie panel (#153 : tentatives par commits --full-history,
  concurrency par level_id, garde avant incrément, FAIL dur post-dépense),
  align-windows depuis le plan, skins/props du plan, e2e-generated-level.
- Écarts assumés : check-sprite-integrity non branché (retiré du pipeline enemy,
  ADR-0029) ; évidence du run d'essai non commitée (artefact CI) ; bug subshell
  du gate props trouvé et épinglé par test.
- État : typecheck vert, 1705/1705 tests (×2), workflows:check ok (6 warnings
  préexistants). Douteux tracé : intégration navigateur d'align-windows testable
  seulement en CI réelle ; seeds libres de T5 sans cap (à borner si besoin, hors
  périmètre).

## 2c. ADR-0078 — la surface CI (panel run 6) — 2026-08-02

Le run 6 a établi que la ligne « ADR n/a » de la PR était une erreur de jugement :
trois workflows `contents: write` (deux portant `POLLINATIONS_TOKEN`) qui résolvent
un input de dispatch en module transpilé/exécuté par jiti sont une surface nouvelle,
et ADR-0075 — le seul ADR cité — exclut explicitement SP2 de son périmètre
(« nothing here presumes them »). `docs/adr/0078-sp2-paid-generation-ci-surface.md`
acte les 7 décisions réellement prises (allowlist en profondeur y compris sur le
chemin d'échec, double garde de confinement, verrou d'id + validation avant dépense,
comptabilité du cap par commits de trace `--full-history`, sérialisation par level,
idempotence au re-dispatch) et leurs limites assumées.

## Suivi

- [x] PR #151 (specs+plans) : panel PASS (4 runs convergents) → MERGÉE (3ba17a47,
      2026-07-30)
- [ ] BUILD : branche `feat/level-harness-sp2`, T1 (dev-gameplay) puis T2-T6
      (dev-tooling-assets), T7 (boucle design du level candidat) ferme
- [ ] Le level candidat : id/quartier/fiction proposés par game-designer +
      narrative-designer, gate lead-game-designer, AVANT le premier tirage payé
