# Handoffs — Story ③ : serveur MCP level-editor (STORY-MCP-LEVEL-EDITOR)

Story slug: `story-mcp-level-editor` · ouverte 2026-07-30. La story ③ nommée par
`story-level-data-extraction.md` (ADR-0074) — un serveur MCP `validate` / `inspect` /
`scaffold` / `dryrun` / `preview` pour agents — croisée avec la couche `LevelPlan` de
SP1 (ADR-0075). Un cœur de fonctions pures, deux surfaces (MCP interactif local,
scripts CI en bibliothèque). La réserve §7.1 de la story ① bloque ② — pas celle-ci.
Intake : décision directe de Bertrand — « les deux en parallèle » (SP2 + story ③).

## 1. INTAKE + CADRAGE — orchestrateur (lane architecte tombée 2× en 529) — 2026-07-30

- Brouillon de tech plan rédigé par l'orchestrateur ; en conséquence le sign-off
  `senior-architect` reste À PRENDRE au BUILD sur les deux décisions qui lui
  appartiennent (voir Suivi).
- **3 décisions actées par Bertrand (2026-07-30)** : `scaffold` en écriture dès la v1
  sous triple discipline (écriture sous `generated/` uniquement, `validate` bloquant
  avant toute écriture, jamais de commit/push) · navigateur local pour
  `dryrun`/`preview` · SDK officiel `@modelcontextprotocol/sdk` (devDependency, actée
  par l'ADR de la story).
- Spec : `docs/game-design/spec-mcp-level-editor.md` · Plan (7 tâches dont T2b) :
  `docs/game-design/plan-mcp-level-editor.md` — PR #151 (docs-only, avec SP2).

## 2. Cadrages corrigés par le panel de la PR #151 (runs 1-2)

- La proposition « enregistrement paresseux » (T1) reframée pour ce qu'elle est : un
  renversement NOUVEAU d'ADR-0075 §6 (fail-fast d'`assertDistinctPlanIds` déplacé de
  l'import au bootstrap — déplacé, pas supprimé), à sign-offer comme tel ; le
  countersign ADR-0074 §2 du shard SP1 est résolu et moot (relocation barrel).
- Le contrat `validate` pinné : `validateLevelPlan` migre vers `LevelIssue[]` (T2b,
  code stable par garde) au lieu d'un emballage ad hoc côté serveur.
- Points de contact avec SP2 séquencés (`validateLevelPlan`, driver §8) — Auto-revue
  des deux plans.

## Suivi

- [ ] PR #151 (specs+plans) : panel PASS → acceptation pm → merge
- [ ] **Sign-off senior-architect au BUILD** : (1) le renversement ADR-0075 §6 de T1,
      avec le risque split-brain repesé ; (2) l'ADR du serveur (T2, nouveau process +
      devDependency, numéro par adr-new vérifié contre TOUTES les branches distantes)
- [ ] BUILD : branche `feat/mcp-level-editor`, T1+T2b (dev-gameplay, séquentielles) ∥
      T2 (dev-tooling-assets), puis T3→T6
