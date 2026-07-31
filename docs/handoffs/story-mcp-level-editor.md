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

- [x] PR #151 (specs+plans) : panel PASS → acceptation pm → merge (commit 3ba17a4, 2026-07-30)
- [ ] **Sign-off senior-architect au BUILD** : (1) le renversement ADR-0075 §6 de T1,
      avec le risque split-brain repesé ; (2) l'ADR du serveur (T2, nouveau process +
      devDependency, numéro par adr-new vérifié contre TOUTES les branches distantes)
- [ ] T1 (dev-gameplay) : fail-fast bootstrap, sign-off bloquant
- [ ] T2b (dev-gameplay) : validateLevelPlan → LevelIssue[], code stable par garde
- [ ] T2 (dev-tooling-assets) : serveur MCP, ADR du process, après sign-off
- [ ] T3–T6 (dev-tooling-assets) : tooling séquentiel (inspect/scaffold/dryrun/preview)
- [ ] VERIFY (qa-lead) : 187 tests baseline, integration tests
- [ ] simplify : compaction diff
- [ ] review-panel : 4 reviewers, architecture triage
- [ ] PR draft → acceptation pm
- [ ] Merge

## 3. BUILD — reprise 2026-07-31 (session remote)

### Constat : branche fantasme résolue

La branche `feat/mcp-level-editor` annoncée par Bertrand n'existe ni sur `origin` ni en
local. Les 2 commits (T1 + T2b) restent introuvables — probablement demeurés sur une
machine locale. Vérification :

- `git ls-remote origin | grep -i mcp` → aucun match
- `git branch -a | grep mcp` → seulement `claude/mcp-level-editor-build-iy2jaw`
- Baseline code sur `main` : `assertDistinctPlanIds` toujours importé (line 35,
  `src/generated/index.ts`) ; `validateLevelPlan` rend toujours `string[]` (pas
  `LevelIssue[]`).

**Décision** : T1 et T2b seront (ré)implémentés dans cette session sur
`claude/mcp-level-editor-build-iy2jaw`. Si les commits locaux de Bertrand refont
surface, réconciliation manuelle ou abandon selon l'ordre d'arrivée.

### Branche BUILD effective

`claude/mcp-level-editor-build-iy2jaw` (imposée par la session remote, remplace
`feat/mcp-level-editor` du plan de la PR #151).

### Auto-revue des croisements SP2

Rien n'a mergé côté SP2 (`story-level-harness-sp2.md` toujours en SPECS REVIEWED) :

- **Pas de garde `calibration` dans `levelPlan.ts`** — T2b n'ajoute pas le code
  `plan/calibration` ; ce seul point relève du processus SP2 sur `main` après cette
  story.
- **Driver §8 pour T5** — T5 (dryrun) inline le driver Playwright §8 (référence :
  `docs/qa/evidence/story-level-harness-sp1/report.json`), externalise la soumise vers
  SP2 (deduplication possible post-merge).

### Baseline verte au départ

- 187 tests ✓ / 14 fichiers (`src/game/levels/**/*`)
- Lint/tsc ✓
- Aucune branche distante parallèle n'interfère

### Séquencement des lanes (rework du suivi §2)

1. **Sign-off senior-architect** (bloquant) : T1 ADR-0075 reverse + T2 ADR-server ∥
2. **T2b** (dev-gameplay, après sign-off) : validateLevelPlan → LevelIssue[]
3. **T1** (dev-gameplay, après sign-off) : bootstrap fail-fast ∥ **T2** (dev-tooling-assets,
   après ADR) : serveur MCP
4. **T3** → T4 → T5 → T6 (dev-tooling-assets, séquentielles) : inspect/scaffold/dryrun/preview
5. **VERIFY** (qa-lead) : mutation tests + integration
6. **simplify** → **review-panel** → **PR draft**
7. **pm acceptance** → **merge**
