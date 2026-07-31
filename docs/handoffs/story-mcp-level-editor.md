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
- [x] **Sign-off senior-architect au BUILD** (2026-07-31, §4) : (1) renversement ADR-0075 §6
      → **PASS avec conditions** (version ÉTROITE : seul le throw se déplace) ; (2) ADR du
      serveur → **PASS**, `docs/adr/0077-mcp-level-editor-server.md`, index régénéré
- [x] T1 (dev-gameplay, 2026-07-31) : fail-fast déplacé au bootstrap, **version étroite**
      (C1→C6 tenues) — `validateCatalogue` source unique dans `levelPlan.ts`,
      `registerGeneratedLevels()` au corps de `src/main.tsx`, garde du site d'appel
      `bootstrapRegistration.test.ts` prouvée par mutation (retrait de l'appel ⇒ 2 tests
      rouges, le test de pool restant vert — exactement le point du sign-off). Amendement
      daté ADR-0075 §Consequences + correction de la phrase fausse du spec §4.3.
      1679 tests ✓ / 117 fichiers, tsc ✓
- [x] T2b (dev-gameplay) : validateLevelPlan → LevelIssue[], code stable par garde
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

## 4. Sign-offs senior-architect — 2026-07-31

Contexte du sign-off : contrairement à ce qu'annonçait §3, **T1 n'est pas commité** (la
branche `feat/mcp-level-editor` n'a jamais existé sur `origin`). Ces deux sign-offs portent
donc sur le **design, avant implémentation** — ce qui est la bonne place pour eux.

### (a) Renversement d'ADR-0075 §6 (T1) — **PASS AVEC CONDITIONS**

Le renversement est accordé dans une **version étroite** : seul le `throw` se déplace de
l'import au bootstrap. La proposition §4.3 en l'état est refusée sur un point (le
déplacement de l'enregistrement des archétypes), pour les raisons ci-dessous.

**Ce que j'ai repesé, honnêtement.**

1. *Le crash au bootstrap est-il aussi impossible à rater qu'à l'import ?* **Pour
   l'application, oui** (appel au corps de `src/main.tsx`, avant `createRoot(...).render` :
   même écran blanc, même stack, une frame plus tard). **Pour le reste, non** — et la spec
   §4.3 le dit trop vite. Aujourd'hui le throw à l'import atteint *toute* surface qui touche
   le catalogue : tests, scripts, driver e2e, futur outil MCP. Après déplacement, ces
   surfaces n'ont plus de fail-fast. C'est **voulu** (l'outil doit rapporter une issue, pas
   mourir), mais ça se paie : entre l'écriture d'un doublon et le passage CI/app, le
   split-brain `LEVEL_ART` last-wins / `ALL_LEVELS.find` first-wins existe silencieusement.
   La compensation `validateCatalogue` n'est donc pas un bonus mais la **contrepartie
   obligatoire** du renversement (condition C2).
2. *Le micro-risque « oubli d'appel au bootstrap » est-il couvert par le test de pool ?*
   **Non — la phrase de §4.3 est fausse en l'état et doit être corrigée.** Le test
   « activates a level-authored kind in ITS pool » ne passe aujourd'hui que parce que
   `buildWeightedFrom` lit `generated` peuplé *par l'import*. Or le plan T1 prévoit
   explicitement d'appeler `registerGeneratedLevels()` « dans le setup des tests qui exercent
   le chemin runtime » : un test qui appelle lui-même la fonction ne peut, par construction,
   rien dire du site d'appel de `src/main.tsx`. Le garde doit porter sur le **site d'appel
   réel** (condition C3).
3. *Un point que ni la spec ni le plan ne relèvent — et qui est le vrai coût du déplacement
   de l'enregistrement.* `src/game/levels/validateLevel.ts:11` porte
   `import "@game/levels/generated";` avec un commentaire explicite : effet de bord
   **délibéré** (panel run-8) pour que le consommateur STANDALONE — « story ③'s MCP `validate`
   tool » — voie les kinds générés via `hasArchetype`/`knownKinds`. Rendre le module
   totalement pur casse ce contrat et ferait rapporter `unknown-enemy-kind` sur tout kind
   généré légitime : la story se tirerait une balle dans son propre outil. `validateLevel.ts`
   n'est même pas dans la liste de fichiers de T1.

**La conclusion architecturale.** Ce qui bloque l'import mécanique du catalogue est le
**throw**, pas l'enregistrement. Enregistrer des archétypes tous à `weight: 0` dans une `Map`
privée est idempotent, inobservable et ne peut corrompre aucun pool ; c'est même ce dont
l'outil MCP dépend. Déplacer le throw livre 100 % du besoin de la story ; déplacer aussi
l'enregistrement ajoute un rayon d'explosion (validateLevel, tous les tests qui passaient par
l'import, le cœur MCP) pour un bénéfice de pureté théorique. **On déplace le throw. On garde
l'enregistrement.**

**Conditions (bloquantes, à vérifier au review-panel) :**

- **C1 — Périmètre.** Seul `assertDistinctPlanIds(GENERATED_PLANS)` quitte le corps de
  `generated/index.ts`. La boucle `registerGeneratedArchetypes` **reste**. `validateLevel.ts`
  garde son import à effet de bord et son commentaire (mis à jour pour dire que seul le
  fail-fast a bougé). Vouloir malgré tout déplacer l'enregistrement ⇒ **nouveau sign-off**,
  avec inventaire préalable des consommateurs et mise à jour de `validateLevel.ts`.
- **C2 — Contrepartie.** `validateCatalogue(plans): LevelIssue[]` (code `plan/duplicate-id`)
  vit dans `levelPlan.ts` et est la **source unique** de la règle : `assertDistinctPlanIds`
  devient un wrapper mince qui throw sur son résultat (pas deux implémentations de
  l'unicité). Elle est appelée par l'outil `validate` **et** par `scaffold` avant écriture, et
  un test CI l'exécute sur le **vrai** `GENERATED_PLANS` (pas seulement sur une paire
  synthétique — le test actuel ne prouve que la fonction, pas le catalogue).
- **C3 — Garde du site d'appel.** Un test dédié doit rougir quand l'appel disparaît de
  `src/main.tsx`. Le test de pool ne compte pas. Moyen laissé à la lane (assertion sur la
  source de `main.tsx`, ou extraction du bootstrap dans un module importable et testé), mais
  la preuve est une **mutation** : supprimer l'appel ⇒ suite rouge, vérifié par `qa-lead`
  (skill `test-quality`) au VERIFY. Sans cette preuve, T1 ne passe pas le panel.
- **C4 — Forme de l'appel.** `registerGeneratedLevels()` est idempotente et appelée au
  **corps du module** `src/main.tsx`, avant `createRoot(...).render` — jamais dans un effet
  React (StrictMode double-monte). Un test asserte que le double appel est un no-op.
- **C5 — Frontière.** `registerGeneratedLevels` vit dans `src/game/levels/generated/`
  (couche pure, zéro React/Three). Seul le composition root (`src/main.tsx`) l'appelle ;
  aucun module de `src/render` ne le fait.
- **C6 — Traçabilité.** Amendement daté de la Consequence d'ADR-0075 (« throws at IMPORT
  time ») renvoyant à ADR-0077, sans renumérotation ni réécriture de la décision. Et
  **correction de la spec §4.3** : la phrase « gardé par le test de pool de
  `generatedLevels.test.ts` » est fausse et doit être remplacée par C3.

### (b) ADR du serveur (T2) — **PASS**

**ADR alloué : 0077** — `docs/adr/0077-mcp-level-editor-server.md`, index régénéré
(`gen-adr-index.mjs --write` puis `--check` : *fresh — 77 ADR, registry in sync*, README +
`public/adr/index.html`).

Vérification du numéro (leçon 0073→0074→0075) : `adr-new` (local + index + `origin/main`)
**plus** un contrôle indépendant sur **toutes** les branches distantes — `git fetch origin
--prune` (98 heads distants = 98 remote-tracking, fetch complet vérifié) puis
`git log --all --name-only -- 'docs/adr/*.md'` : numéro le plus haut existant **0076**, sur
tout ref connu. Aucun `producer` n'avait réservé de numéro dans ce shard ⇒ auto-allocation
déclarée comme telle dans l'ADR. **À re-vérifier avant merge.**

Contenu acté : D1 process `scripts/mcp-level-editor/server.mjs` stdio hors bundle (tranche
l'hésitation `server.ts` de la spec §4.2 — `scripts/` est en `.mjs`) · D2
`@modelcontextprotocol/sdk` en devDependency, interdit d'import depuis `src/**` · D3 cinq
outils fermés, zéro règle côté serveur, cœur unique prouvé par l'appel bibliothèque · D4 les
trois disciplines d'écriture + écriture atomique + pas d'écrasement implicite + `scaffold`
n'édite pas `index.ts` · D5 non-secret · D6 l'amendement ADR-0075 §6 en version étroite du
sign-off (a).

**Ce que l'ADR n'autorise pas** (nouvel ADR requis, pas une itération) : tout transport autre
que stdio local, tout outil supplémentaire, toute écriture hors `generated/`, tout geste git.

### Assignation de lanes (inchangée, chemins disjoints)

`dev-gameplay` sur `src/game/levels/**` (T1 puis T2b, séquentielles — même fichier
`levelPlan.ts`) ∥ `dev-tooling-assets` sur `scripts/mcp-level-editor/**`, `.mcp.json`,
`package.json` (T2 → T3 → T4 → T5 → T6). **Fichier partagé à sérialiser** : `levelPlan.ts`
(T1 y ajoute `validateCatalogue`, T2b y migre les signatures) — T1 atterrit avant T2b. T3
consomme `validateCatalogue` : ne pas démarrer T3 avant que T1 soit vert.
