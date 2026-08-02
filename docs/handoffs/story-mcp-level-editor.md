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
      serveur → **PASS**, `docs/adr/0081-mcp-level-editor-server.md`, index régénéré
- [x] T1 (dev-gameplay, 2026-07-31) : fail-fast déplacé au bootstrap, **version étroite**
      (C1→C6 tenues) — `validateCatalogue` source unique dans `levelPlan.ts`,
      `registerGeneratedLevels()` au corps de `src/main.tsx`, garde du site d'appel
      `bootstrapRegistration.test.ts` prouvée par mutation (retrait de l'appel ⇒ 2 tests
      rouges, le test de pool restant vert — exactement le point du sign-off). Amendement
      daté ADR-0075 §Consequences + correction de la phrase fausse du spec §4.3.
      1679 tests ✓ / 117 fichiers, tsc ✓
- [x] T2b (dev-gameplay) : validateLevelPlan → LevelIssue[], code stable par garde
- [x] T2 (dev-tooling-assets) : serveur MCP, ADR du process, après sign-off
- [x] T3–T6 (dev-tooling-assets) : tooling séquentiel (inspect/scaffold/dryrun/preview)
- [x] **VERIFY (qa-lead, 2026-08-01, §5) : QUALITY GATE PASS** — 1715 tests ✓ / 121 fichiers,
      tsc ✓, lint ✓, les 6 points du critère §6 attestés un par un, 6 mutations (5 BITES,
      1 SURVIVES documentée)
- [x] simplify (2026-08-01) : diff déjà discipliné — 1 APPLIED (dédoublonnage
      `inspect`↔`resolvePlanOrThrow`, `4c238071`), 0 PROPOSED, 0 coupe rouge. La passe a
      surfacé un lint rouge pré-panel (`typeof import()` vs `consistent-type-imports`
      dans `generatedLevels.test.ts`, masqué au VERIFY par le cache eslint) — corrigé en
      `40fd9ac6` (imports type namespace). Fixes VERIFY O1/O2 en `0ff370bb`
      (`preview()` rend la main : stdio ignore ; assertion C3 ancrée). tsc ✓ /
      1715 tests ✓ / lint ✓ re-prouvés sur l'ensemble.
- [x] **review-panel (2026-08-01) : 4 reviewers + triage architecte (§6) → fixes
      prescrits atterris → re-vérification incrémentale architecte (§6.7) :
      verdict MERGE CONDITIONNEL** — 2 gestes courts restants (R1 + ruling ADR)
- [x] **R1** (`dev-tooling-assets`, tier fix-lane, 2026-08-02) : fix §6.7 appliqué au
      caractère près (`eac9688b`), reviewer unique `code-review` (high) rejoué après le
      reset de la limite d'usage : **RAS bloquant, fix lane close** — contrats
      never-throws (`validate` ET `scaffold`) et cumul one-shot prouvés par probes ;
      ses 2 LOW appliqués dans la foulée (phrase R2 déplacée dans le JSDoc de
      `validate`, probe du cumul promue en test commité)
- [x] **Numéro ADR** : ruling `producer` (Marion, 2026-08-02) — collision 0077 RESOLUE. Story MCP garde ADR-0081; branche flyer renumérote 0078 au rebase post-merge MCP. Handoff ouvert : `docs/handoffs/story-flyer-wall-float-in-animation.md` (créé 2026-08-02).
- [x] PR draft → acceptation pm — **ACCEPTED**, voir §7
- [x] **Panel CI (PR #159, autorité bloquante ADR-0063) — round 1 : FAIL** sur `ae1aa10b`
      (1 BLOQUANT, 2 MAJEUR, 1 MINEUR), les 4 findings traités, voir §8
- [x] **Panel CI — round 2 : CONDITIONAL** sur `b3e96f5c` (0 BLOQUANT, 1 MAJEUR,
      3 MINEUR), les 4 findings traités, voir §8
- [x] **Panel CI — round 3 : CONDITIONAL** sur `0071b4ff` (0 BLOQUANT, 3 MAJEUR,
      2 MINEUR), traités, voir §8
- [x] **Panel CI — round 4 : FAIL** sur `f867734b` (**1 BLOQUANT** — l'ADR se déclarait
      encore 0077 après renumérotation —, 1 MAJEUR de sécurité, 2 MINEUR), traités, voir §8
- [x] **Panel CI — round 5 : CONDITIONAL** sur `9ed5f9d2` (0 BLOQUANT, 1 MAJEUR,
      1 MINEUR), traités, voir §8
- [x] **Panel CI — round 6 : CONDITIONAL** sur `5ad75f3e` (0 BLOQUANT, 2 MAJEUR,
      1 MINEUR), traités, voir §8
- [x] **Panel CI — round 7 : CONDITIONAL** sur `5fbc3586` (0 BLOQUANT, 2 MAJEUR,
      3 MINEUR), traités, voir §8
- [x] **Panel CI — round 8 : CONDITIONAL** sur `633f91d5` (0 BLOQUANT, 3 MAJEUR,
      2 MINEUR), traités, voir §8
- [x] **Panel CI — round 9 : CONDITIONAL** sur `758ee575` (0 BLOQUANT, 2 MAJEUR,
      1 MINEUR), traités, voir §8
- [ ] Merge

## 8. Panel CI + review Copilot — PR #159 (2026-08-02)

Trois runs du panel CI ont d'abord rendu **DEGRADED** : diagnostic vérifié sur les jobs,
les 4 reviewers étaient `cancelled` (pas `failed`) par la **concurrency**, chaque fois à
l'instant d'une de mes poussées, et le job `Preflight · panel availability` réussissait.
Ni quota ni token — contrairement aux deux seules pistes que le message DEGRADED propose.
**Défaut CI relevé, hors périmètre de ce diff** (le workflow vit sur `main`) : l'étape
« Collect failed panel jobs » compte un job `cancelled` comme `failed` et publie un
diagnostic d'authentification trompeur dans le cas d'une run supersédée. → chantier à
ouvrir côté `dev-tooling-assets`.

Round 1 complet (HEAD stable) : **FAIL**, 4 findings, tous traités.

- **[BLOQUANT] trace contradictoire du fix lane R1** — `fixes.md:278` disait encore
  « passe reviewer formelle à rejouer AVANT merge » alors que le shard et le corps de PR
  affirmaient « fix lane close ». **Fondé, et de ma main** : la passe a bien été rejouée
  et a rendu RAS, mais je n'avais mis à jour que le shard, pas la ligne du fix lane —
  le diff portait donc deux versions contradictoires du même gate. Ligne corrigée.
- **[MAJEUR] `dryrun()` orphelinait vite si `chromium.launch()` throw** — fondé : le
  `launch` était HORS du try, donc un Chromium qui ne démarre pas (le cas même que
  `PLAYWRIGHT_CHROMIUM_PATH` reconnaît) laissait le serveur `--strictPort` tenir le port
  5173 et bloquait tout `dryrun`/`preview` suivant. Le `launch` passe dans le try,
  `browser` devient nullable, le teardown couvre les deux échecs.
- **[MAJEUR] contrôle d'ordre HUD aveugle** — fondé : `indexOf` non ancré cherchait les
  labels dans TOUT le snippet, nom du level compris ; un district comme « Armentières »
  contient `ARME`, ce qui épinglait le label à sa position dans le NOM et rendait le
  contrôle anti-régression inopérant pour ce level. La plage de nom (NIVEAU…VAGUE) est
  désormais masquée avant localisation. Test ajouté sur un nom collisionnant.
- **[MINEUR] avis de sécurité des 3 nouvelles devDeps non cité** — `yarn npm audit --all
--recursive` exécuté : **7 avis dans l'arbre, aucun ne touche
  `@modelcontextprotocol/sdk@1.30.0`, `vite-node@3.2.4` ni `zod@4.4.3`** (tous
  préexistants sur `main` : brace-expansion via minimatch ×3, git-raw-commits via
  commitlint, glob via test-exclude, playwright, tar via node-gyp).

**Review Copilot (3 remarques)** : 1 retenue — `compareDryrunReport` gardait le nom
« Fixture » en dur, dernier reliquat de m5 (corrigé en `ae1aa10b`, le nom est lu dans
l'évidence attendue). 2 réfutées par écrit dans les fils : `writeAtomic()` n'utilise pas
`unlinkSync` (la remarque décrivait le prérequis de sa propre suggestion), et
`fs.renameSync` écrase bien la destination sur Windows (libuv passe `MOVEFILE_REPLACE_EXISTING`
à `MoveFileExW`) — l'`unlink` préalable suggéré ouvrirait la fenêtre non-atomique que le
tmp-then-rename ferme.

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

1. _Le crash au bootstrap est-il aussi impossible à rater qu'à l'import ?_ **Pour
   l'application, oui** (appel au corps de `src/main.tsx`, avant `createRoot(...).render` :
   même écran blanc, même stack, une frame plus tard). **Pour le reste, non** — et la spec
   §4.3 le dit trop vite. Aujourd'hui le throw à l'import atteint _toute_ surface qui touche
   le catalogue : tests, scripts, driver e2e, futur outil MCP. Après déplacement, ces
   surfaces n'ont plus de fail-fast. C'est **voulu** (l'outil doit rapporter une issue, pas
   mourir), mais ça se paie : entre l'écriture d'un doublon et le passage CI/app, le
   split-brain `LEVEL_ART` last-wins / `ALL_LEVELS.find` first-wins existe silencieusement.
   La compensation `validateCatalogue` n'est donc pas un bonus mais la **contrepartie
   obligatoire** du renversement (condition C2).
2. _Le micro-risque « oubli d'appel au bootstrap » est-il couvert par le test de pool ?_
   **Non — la phrase de §4.3 est fausse en l'état et doit être corrigée.** Le test
   « activates a level-authored kind in ITS pool » ne passe aujourd'hui que parce que
   `buildWeightedFrom` lit `generated` peuplé _par l'import_. Or le plan T1 prévoit
   explicitement d'appeler `registerGeneratedLevels()` « dans le setup des tests qui exercent
   le chemin runtime » : un test qui appelle lui-même la fonction ne peut, par construction,
   rien dire du site d'appel de `src/main.tsx`. Le garde doit porter sur le **site d'appel
   réel** (condition C3).
3. _Un point que ni la spec ni le plan ne relèvent — et qui est le vrai coût du déplacement
   de l'enregistrement._ `src/game/levels/validateLevel.ts:11` porte
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
  time ») renvoyant à ADR-0081, sans renumérotation ni réécriture de la décision. Et
  **correction de la spec §4.3** : la phrase « gardé par le test de pool de
  `generatedLevels.test.ts` » est fausse et doit être remplacée par C3.

### (b) ADR du serveur (T2) — **PASS**

**ADR alloué : 0077** — `docs/adr/0081-mcp-level-editor-server.md`, index régénéré
(`gen-adr-index.mjs --write` puis `--check` : _fresh — 77 ADR, registry in sync_, README +
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

## 5. VERIFY — quality gate (qa-lead, 2026-08-01)

Stage 5 orchestré sur `claude/mcp-level-editor-build-iy2jaw` @ `c6f35425` (T1→T6 commitées).
Verdict rendu AVANT `simplify` et le review-panel. Aucun fichier de code touché : les probes
de cette session sont toutes revenues (`git status` vide après chacune).

### 5.1 Gates mécaniques — PASS

| Gate           | Commande          | Résultat                                          |
| -------------- | ----------------- | ------------------------------------------------- |
| Typecheck      | `yarn typecheck`  | ✓ exit 0                                          |
| Suite COMPLÈTE | `yarn vitest run` | ✓ **1715 tests / 121 fichiers**, 0 échec (44.9 s) |
| Lint           | `yarn lint`       | ✓ exit 0                                          |

### 5.2 Critère d'acceptation spec §6 — 6/6 attestés

| §6  | Point                                                    | Preuve exécutée par qa-lead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Verdict |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| a   | `validate` d'un plan cassé rend les issues attendues     | appel bibliothèque direct sur un plan `weight: 3` + kind `autre:vigile` → `plan/weight-nonzero`, `plan/namespace` (×2). Plan cassé de `mcpCore.test.mjs` conforme au §6. **Preuve RÉÉCRITE le 2026-08-02 (panel r5)** : la version d'origine citait aussi un `foreign-enemy-kind` rendu dans le MÊME appel, ce que le fix M2b/m3 du triage a rendu impossible depuis — les issues plan-level court-circuitent désormais avant `validateLevel`. La composition reste réelle mais passe par l'autre chemin, celui qu'épingle le test « composes validateLevel too » : une clé `windowWeights` NON préfixée échappe aux gardes du plan (`validateLevelPlan` rend `[]`) et n'est attrapée que par `validateLevel` → `unknown-enemy-kind`, code non-`plan/*`. | PASS    |
| b   | `scaffold` écrit un module que la suite accepte tel quel | **preuve réelle, pas en tmpdir** : `scaffold({plan: qaprobe})` → `src/game/levels/generated/qaprobe.ts` écrit dans le VRAI dossier, ligne d'agrégation ajoutée à la main dans `index.ts` (l'outil ne la touche pas, conforme D4) → `yarn vitest run src/game/levels` **204 tests ✓ / 15 fichiers** + `yarn typecheck` ✓ sur le module généré. Module et ligne RETIRÉS ensuite, worktree propre.                                                                                                                                                                                                                                                                                                                                                          | PASS    |
| c   | `inspect` liste les assets manquants du fixture          | `inspect({levelId:"fixture"})` → `present: []`, `missing: ["assets/levels/fixture/street-wide.png", "assets/enemy_fixture_vigile.png", "assets/nearfg/fixture/kiosque.png"]` — les trois familles conventionnelles (backdrop / sprite ennemi / prop).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | PASS    |
| d   | `dryrun("fixture")` ≡ report §8 commité                  | `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers vite-node scripts/mcp-level-editor/dryrun-fixture.mjs` → **PASSED**, exit 0. `pageErrors: []`, `tempsFirstRead: 60 → tempsSecondRead: 59`, `timerTicking: true`, `hudSnippet: "SCORE 0000 NIVEAU Fixture VAGUE 1 TEMPS 59s VIES ♥♥♥ ÉNERGIE ⚡100 ARME A ∞"`. Rejoué par qa-lead, pas repris de la lane.                                                                                                                                                                                                                                                                                                                                                                                                      | PASS    |
| e   | `preview` rend l'URL du seam                             | appel bibliothèque direct → `{"url":"http://localhost:5173/prohimuf/?preview=level&level=fixture"}` ; id inconnu ⇒ `throw` (`preview: no generated level with id "nope"`). Serveur vite laissé par la probe tué, port 5173 rendu (`curl` → down).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | PASS    |
| f   | surface bibliothèque, zéro serveur                       | `mcpLibrarySurface.test.mjs` ✓ 2 tests dans la passe complète (preuve statique : `core.mjs` n'importe ni `server.mjs` ni le SDK ; preuve dynamique : `validate({levelId:"fixture"})` par import nu).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | PASS    |

### 5.3 Qualité des tests — 6 mutations ciblées (skill `test-quality`)

Probes jetables, chacune revertée immédiatement (`git checkout --`), rien n'atteint un commit.

| #   | Mutation (discipline §5 / condition visée)                                                   | Résultat                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | confinement d'id neutralisé (refus `/`, `\`, `..` + charset `SAFE_ID` désarmés)              | **BITES** — 3 rouges : `mcpCore` ×2 (séparateur, backslash) + `mcpServer` ×1 (refus sur le fil). Le cas `..` reste vert : rattrapé par la 2ᵉ couche (cf. M4).                                                                                                             |
| M2  | `validate` bloquant avant écriture désarmé                                                   | **BITES** — 1 rouge : « refuses a plan that validate rejects, before touching disk ».                                                                                                                                                                                     |
| M3  | garde d'écrasement (`existsSync && !overwrite`) désarmée                                     | **BITES** — 1 rouge : « refuses to overwrite an existing module without overwrite: true ».                                                                                                                                                                                |
| M4  | confinement de chemin belt-and-suspenders (`targetPath.startsWith(generated/)`) désarmé SEUL | **SURVIVES** — 25/25 verts. **Documentée et acceptée** : c'est une 2ᵉ couche derrière M1, explicitement commentée comme telle dans `core.mjs`, et M1 prouve qu'elle n'est PAS du code mort (c'est elle qui attrape `..`). Aucune couche n'est simultanément non couverte. |
| M5  | condition **C3** : appel `registerGeneratedLevels()` COMMENTÉ dans `src/main.tsx`            | **BITES** — 1 rouge (« calls it at MODULE BODY level »).                                                                                                                                                                                                                  |
| M6  | condition **C3** : appel + import SUPPRIMÉS de `src/main.tsx` (l'accident réaliste)          | **BITES** — 3/3 rouges dans `bootstrapRegistration.test.ts`.                                                                                                                                                                                                              |

**C3 du sign-off architecte est donc vérifiée par `qa-lead`, par mutation, comme exigé.**

### 5.4 Observations non bloquantes (pour le review-panel / la lane propriétaire)

- **O1 — `preview()` en bibliothèque ne rend jamais la main.** Le vite spawné a des pipes
  `stdout`/`stderr` refed ; `proc.unref()` ne détache que le handle enfant, pas ses flux.
  Constaté : ma probe imprime l'URL correcte puis reste bloquée jusqu'au `timeout` (exit 124).
  Sans effet sur le serveur MCP (process long) et aucun script CI n'appelle `preview`, mais un
  appelant bibliothèque doit `process.exit`. À documenter ou passer `stdio: "ignore"` —
  `dev-tooling-assets`, NON bloquant.
- **O2 — précision d'une assertion C3.** `bootstrapRegistration.test.ts` › « calls it BEFORE
  the first render » utilise `indexOf("registerGeneratedLevels();")`, qui matche un appel
  COMMENTÉ (survivant de M5). Le fichier rougit quand même via l'assertion ancrée `^…$`, donc
  C3 tient ; note de précision seulement — `dev-gameplay`, NON bloquant.
- **O3 — trou de couverture assumé.** Le chemin navigateur de `dryrun`/`preview` n'est pas dans
  `yarn vitest run` (précédent des `e2e-*.mjs`) : il est couvert par `dryrun-fixture.mjs`, lancé
  à la main au VERIFY — fait ici, PASSED. Rien de **CI-DEFERRED** : tout ce que le plan exigeait
  a pu tourner dans ce sandbox.

### 5.5 Verdict

**QUALITY GATE : PASS.** Les trois gates mécaniques sont vertes sur la suite complète, les six
points du critère d'acceptation §6 sont attestés un par un par mes propres exécutions (dont la
preuve de scaffold dans le VRAI `generated/`, et non en tmpdir), et les disciplines de sécurité
§5 mordent sous mutation (5 BITES / 1 SURVIVES documentée et redondante). Les trois observations
ci-dessus sont non bloquantes et routées sans reprise de gate.

Reste dû avant merge : `simplify`, puis le review-panel 4 reviewers + triage architecte, puis
acceptation `pm`. Rappel du sign-off (b) : **re-vérifier le numéro ADR-0081 contre toutes les
branches distantes juste avant le merge.**

---

## 6. Panel stage 6 — triage architecte

`senior-architect` (Winston), 2026-08-01. Une passe sur `git diff origin/main...HEAD`
(21 fichiers hors `yarn.lock`), findings des 4 reviewers re-vérifiés par exécution là où
j'avais un doute, plus la revue d'intégration. Ce triage EST ma revue d'intégration : une
étape, une lecture (COLLABORATION.md §code-review panel).

### 6.1 Ré-exécutions faites de ma main

| Probe                                                                                | Résultat                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `validate({plan: fixture})` (plan DÉJÀ au catalogue)                                 | `plan/duplicate-id` sur `plans[1].id` — **M1 confirmé**                               |
| `validate({levelId: "fixture"})`                                                     | `[]` — l'asymétrie est bien dans la branche de jointure                               |
| `validate({plan: {id:"safe"}})`                                                      | `THREW: TypeError entries is not iterable` — **M2 confirmé**                          |
| `scaffold({plan: {id:"safe"}})`                                                      | même throw — le contrat `{ok,path,issues}` est bien cassé                             |
| frontières : `rg` sur `src/**` → `mcp-level-editor` / `modelcontextprotocol` / `zod` | **aucune occurrence** (hors commentaires sans rapport)                                |
| `yarn.lock` : instances de `zod`                                                     | **une seule** (`4.4.3`, satisfait aussi le `^3.25 \|\| ^4.0` du SDK) — pas de doublon |

### 6.2 Triage — MAJEURS

**M1 · le contrat de `validate({plan})` pour un id déjà au catalogue — TRANCHÉ.**
CONFIRMÉ, et la question posée est la bonne : ce n'est pas un bug de garde, c'est un
contrat manquant. Je tranche.

> **Décision.** La jointure de `validate` modélise le catalogue **APRÈS l'écriture
> qu'on est en train de valider**, et `scaffold` écrit `<id>.ts` — donc il **remplace**
> l'entrée de cet id, il ne s'ajoute pas à côté. La jointure correcte est un **upsert**,
> pas une concaténation :
>
> ```js
> const catalogue = [...plans.filter((p) => p.id !== plan.id), plan];
> ```
>
> C'est vrai des DEUX chemins de résolution : par `{levelId}`, le plan EST déjà
> `plans[i]`, et l'upsert le remplace par lui-même (identité). **La branche
> `input?.levelId !== undefined` disparaît donc entièrement** — et avec elle m1, qui
> n'est que le symptôme de cette branche.

Séparation des rôles que cette décision fixe, et qu'il faut écrire dans le JSDoc :
`plan/duplicate-id` est un invariant **d'intégrité du catalogue** (deux entrées agrégées
partagent un id) ; la protection contre l'écrasement d'un level existant est un invariant
**de disque**, et elle est déjà portée par `scaffold/exists` + `overwrite`. Les confondre
est ce qui rendait `overwrite: true` inatteignable et le message menteur. Après le fix,
la boucle d'itération normale marche : `validate` propre → `scaffold` refuse avec
`scaffold/exists` → `scaffold({overwrite:true})` passe. Le conseil du message devient
suivable, ce qui est le vrai critère.

Alternative **écartée** : un paramètre explicite (`intent: "create" | "update"`).
Il duplique une information déjà portée deux fois (par `overwrite` et par le catalogue
lui-même), crée un nouvel invariant « les deux drapeaux doivent s'accorder », et élargit
la surface d'outils que D3 tient fermée. Non.

Reste un angle mort assumé, à documenter en une ligne : un plan agrégé dans `index.ts`
depuis un fichier qui ne s'appelle PAS `<id>.ts` échappe à `scaffold/exists`. Il n'est pas
exploitable (scaffold n'édite jamais `index.ts`, donc rien n'est agrégé sans geste humain,
et `validateCatalogue` en CI attrape le doublon) — **note dans le JSDoc, pas de code**.

→ **Lane `dev-tooling-assets`** — `scripts/mcp-level-editor/core.mjs` (`validate`,
`resolveInputPlan`, JSDoc). **BLOQUANT.**

**M2 · `validate` throw sur un plan malformé.** CONFIRMÉ (probe ci-dessus). C'est une
violation du contrat `{issues}` / `{ok,path,issues}`, pas une rugosité : le `planShape`
zod du serveur est lâche **par décision** (D3 — la forme d'un `LevelPlan` est l'affaire
de `src/game`, pas du transport), donc c'est précisément à la couche game de rendre le
verdict. Le fix a deux moitiés, et la ligne de partage est la loi de frontière :

1. **La règle de forme est une règle de plan ⇒ elle vit dans `validateLevelPlan`**, pas
   dans `core.mjs`. Ajouter en tête une précondition structurelle qui rend des
   `LevelIssue` de code `plan/malformed` (champ manquant ou non-array parmi
   `archetypes`, `props`, `gameplay`, `backdrop` ; `gameplay.windowWeights` non-objet) et
   **retourne immédiatement** — sans jamais entrer dans les boucles. Bénéfice au-delà du
   serveur : SP2 et la CI héritent de la même protection.
   → **Lane `dev-gameplay`** — `src/game/levels/levelPlan.ts`. **BLOQUANT.**
2. `core.validate` ne doit plus appeler `planToLevelConfig`/`validateLevel` sur un plan
   que `validateLevelPlan` vient de déclarer malformé (ils throwent aussi).
   → **Lane `dev-tooling-assets`** — voir l'ordonnancement prescrit en m3, qui règle les
   deux d'un seul geste. **BLOQUANT.**

Les deux moitiés portent sur des fichiers disjoints (`src/game/` vs `scripts/`) : les deux
lanes peuvent tourner **en parallèle** sur le contrat convenu ici (`code = "plan/malformed"`,
retour anticipé). Pas de sérialisation nécessaire, contrat figé par ce paragraphe.

### 6.3 Triage — MINEURS

| #   | Verdict                                  | Fix prescrit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Lane                 | Bloquant                                        |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| m1  | CONFIRMÉ, **subsumé par M1**             | aucun fix propre : la branche `levelId !== undefined` disparaît avec l'upsert. Ajouter un test qui pose `{plan, levelId}` avec un plan en collision réelle.                                                                                                                                                                                                                                                                                                                                                                                                                         | `dev-tooling-assets` | oui (via M1)                                    |
| m2  | CONFIRMÉ                                 | garde is-main-module autour de `main()` dans `server.mjs` (`process.argv[1]` résolu vs `fileURLToPath(import.meta.url)`). `createServer` est déjà exporté et testé — un import de test qui branche un transport stdio orphelin est un piège, pas une hypothèse.                                                                                                                                                                                                                                                                                                                     | `dev-tooling-assets` | oui                                             |
| m3  | CONFIRMÉ                                 | **réordonner `core.validate`** : (a) `validateLevelPlan(plan)` + `validateCatalogue(catalogue)` toujours — aucun des deux ne touche le registre global ni ne peut throw après le fix M2 ; (b) `registerGeneratedArchetypes` + `validateLevel(planToLevelConfig(plan))` **seulement si `validateLevelPlan` est revenu vide**. Un plan aux archétypes cassés (hp −99) n'atteint donc jamais le registre du process serveur, et le feedback one-shot est préservé pour le cas qui compte (plan structurellement sain). Mettre à jour le JSDoc, qui décrit aujourd'hui l'ordre inverse. | `dev-tooling-assets` | oui                                             |
| m4  | CONFIRMÉ                                 | `dryrun-fixture.mjs` : shebang + runbook de l'en-tête passent à `vite-node` (l'invocation réellement attestée au §5.2 d). Un runbook qui crashe est pire qu'absent.                                                                                                                                                                                                                                                                                                                                                                                                                 | `dev-tooling-assets` | non                                             |
| m5  | CONFIRMÉ, **portée relevée** — voir §6.5 | `compareDryrunReport(actual, expected, { base = DEFAULT_BASE, levelId = "fixture" } = {})`, regex construite à partir des deux (base échappée). Défauts inchangés ⇒ aucun appelant actuel ne bouge.                                                                                                                                                                                                                                                                                                                                                                                 | `dev-tooling-assets` | non (mais **doit** atterrir dans cette branche) |
| m6  | CONFIRMÉ                                 | listener `'error'` sur le child vite dans `ensureDevServer` — un `ENOENT` (yarn hors PATH) tue aujourd'hui **tout le process serveur** au lieu de rendre un `isError`. Le convertir en rejet de la promesse d'attente.                                                                                                                                                                                                                                                                                                                                                              | `dev-tooling-assets` | oui                                             |
| m7  | PLAUSIBLE → **CONFIRMÉ par lecture**     | dans le `finally` de `dryrun`, `proc.kill()` doit être hors d'atteinte d'un throw de `browser.close()` : tuer le serveur d'abord, ou envelopper la fermeture du navigateur dans son propre `try`. Un vite orphelin sur `--strictPort` bloque tous les `dryrun` suivants.                                                                                                                                                                                                                                                                                                            | `dev-tooling-assets` | oui                                             |

### 6.4 Triage — NITS

| #                  | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Suite                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| n1                 | **CONFIRMÉ, et c'est mon texte.** ADR-0081 D6 dit « `registerGeneratedLevels()` reste idempotente et ré-enregistre sans effet observable » : faux, elle ne ré-enregistre rien — l'enregistrement des archétypes est resté au corps du module, comme le reste du même bullet le dit correctement. Phrase à remplacer par « reste idempotente : c'est une pure vérification ». Un ADR est l'artefact durable ; une phrase fausse dedans coûte plus cher qu'un bug. → **`tech-writer`, BLOQUANT.** |
| n2                 | CONFIRMÉ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `timerTicking: false` passe sur un report sans `tempsFirstRead`/`tempsSecondRead` (`undefined < undefined` ⇒ `false === false`). Garde `Number.isFinite` sur les deux lectures avant la comparaison de cohérence interne. À plier dans l'édition m5. → `dev-tooling-assets`, non bloquant. |
| n3                 | CONFIRMÉ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `labelOrder` vérifie la présence, pas l'ordre, alors que le JSDoc promet « the same ORDERED set ». Le fix honnête est d'implémenter l'ordre réel (tri des labels par `indexOf` dans le snippet) — 3 lignes, et la promesse du doc devient vraie. → `dev-tooling-assets`, non bloquant.     |
| n4                 | CONFIRMÉ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `spriteBase` vide ⇒ `startsWith("")` matche tous les png de `public/assets/`. C'est une **règle de plan** ⇒ garde dans `validateLevelPlan` (`spriteBase` chaîne non vide), pas un rustine dans `scanAssets`. → `dev-gameplay`, non bloquant, même édition que M2.                          |
| n5                 | CONFIRMÉ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Fix ennuyeux plutôt que malin : retirer le flag `i` de `SAFE_ID` (`/^[a-z0-9][a-z0-9_-]*$/`). Tous les ids expédiés sont minuscules ; on supprime l'ambiguïté par construction au lieu de la détecter en dépendant du système de fichiers. → `dev-tooling-assets`, non bloquant.           |
| n6a (TOCTOU)       | **REJETÉ, motivé.** Outil de dev local, mono-utilisateur, sans écrivain concurrent ; l'écriture est déjà tmp+rename atomique, donc le pire cas est un dernier-écrivain-gagne sur une course qui n'existe pas dans le modèle d'usage. Refermer la fenêtre exigerait un `wx` + gestion d'`EEXIST` qui complique la garde `overwrite` pour un risque non réel. Risque **accepté et tracé ici**.                                                                                                    |
| n6b (`isServerUp`) | CONFIRMÉ, durcissement bon marché : accepter la réponse seulement si le corps ressemble à l'app (p.ex. contient `/@vite/client` ou `id="root"`). Sinon `dryrun` peut piloter l'app de quelqu'un d'autre sur 5173 et rendre un verdict faux. → `dev-tooling-assets`, non bloquant.                                                                                                                                                                                                               |

Reviewer D (security) : **RAS confirmé**. J'ajoute que la fermeture par construction de la
surface d'écriture (D4) est bien effective dans le diff : charset d'id → refus explicite des
séparateurs et de `..` → `targetPath.startsWith(generated/ + sep)` en seconde couche, les
trois AVANT tout accès disque, et le §5.3 prouve par mutation que les couches 1 et 3 mordent.

### 6.5 Revue d'intégration

**Loi de frontière — PASS.** Vérifié, pas supposé :

- `src/game/levels/levelPlan.ts` ne gagne qu'un import **type-only** de `LevelIssue` depuis
  `validateLevel` : aucune arête d'exécution, aucun React, aucun Three. Le contrat d'issue
  reste unique (ADR-0074 §3), il n'y a pas de type parallèle côté outil.
- `validateCatalogue` est **au bon étage** : c'est une règle, elle vit dans `game`, et
  `assertDistinctPlanIds` n'est plus qu'un wrapper qui throw sur son résultat. Une règle,
  une implémentation — exactement ce que D6 exigeait, et ce que D3 protège (`core.mjs` ne
  réécrit aucune règle, il compose).
- Sens de dépendance : `scripts/` → `@game/**`, jamais l'inverse. Aucun module de `src/**`
  ne référence `mcp-level-editor`, ni le SDK MCP, ni `zod`. Et `mcpLibrarySurface.test.mjs`
  épingle l'autre sens (`core.mjs` n'importe ni `server.mjs` ni le SDK). **Les deux sens
  sont désormais tenus par un test** — c'est la bonne façon de rendre une frontière durable.
- `src/main.tsx` appelle une fonction de bootstrap **pure** de `game` depuis la racine de
  composition : direction légitime, aucune règle n'a fui dans `render`.

**Le risque que D6 a créé est couvert.** Déplacer le fail-fast de l'import au bootstrap
affaiblit une garantie structurelle au profit d'un site d'appel unique et supprimable ;
c'est pourquoi j'avais posé la condition C3 (garde sur le VRAI site d'appel, prouvée par
mutation). `bootstrapRegistration.test.ts` la tient, `qa-lead` l'a prouvée par mutation
(M5 commenté ⇒ rouge, M6 supprimé ⇒ 3/3 rouges). **C3 satisfaite.** Résiduel assumé et
déjà écrit dans le test lui-même : c'est une assertion textuelle, elle ne survivrait pas à
une réécriture exotique de l'appel (import aliasé, indirection). Le prix est accepté tant
que `main.tsx` reste le bootstrap plat qu'il est ; si un jour il ne l'est plus, la garde
doit être repensée, pas rafistolée.

**Seams cross-lane — SP2 consomme le même cœur.** Deux points de contact, déjà séquencés
au §2 du handoff SP2 ; l'état du diff en change un :

1. _Corps de `validateLevelPlan`_ (SP2 T1 vs MCP T2b) — la migration `LevelIssue[]` a
   atterri **ici**. SP2 **rebase et adapte**, il ne re-migre pas. Le fix M2 (précondition
   `plan/malformed`) atterrit dans le même corps de fonction : autre raison de le faire
   maintenant plutôt qu'après, sinon SP2 rebase sur une base que l'on rouvre juste après.
2. _Driver §8 généralisé_ (SP2 T6 vs MCP T5) — `core.dryrun` est déclaré, dans son propre
   JSDoc et dans D3, comme **la** seule implémentation sur laquelle SP2 dédoublonnera.
   **C'est ce qui relève la portée de m5** : en l'état, `compareDryrunReport` durcit
   `/prohimuf/` ET `level=fixture` dans sa regex, donc le comparateur n'est réutilisable
   par aucun second level. Un SP2 qui rebase là-dessus forkera un comparateur au lieu de
   dédoublonner — exactement ce que D3 interdit. m5 n'est pas un cosmétique : c'est la
   condition pour que la promesse « deux surfaces, une implémentation » tienne au-delà du
   fixture. **Doit atterrir dans cette branche.**
3. Corollaire du même raisonnement pour **m3** : SP2 validera un second level candidat
   **dans le même process**. La pollution du registre global par les archétypes d'un plan
   refusé cesse alors d'être une curiosité pour devenir une contamination inter-levels.
   Must-fix maintenant, pas plus tard.

**Dépendances & déploiement — impact nul sur le jeu, une remarque.**

- +3 `devDependencies` (`@modelcontextprotocol/sdk`, `zod`, `vite-node`), **aucune**
  atteignable depuis `src/**` (vérifié) ⇒ **zéro impact bundle, zéro impact déploiement**,
  aucun workflow CI touché. Conforme à D2.
- `zod` **dédoublonné** dans le lock : une seule instance `4.4.3`, qui satisfait aussi le
  `^3.25 || ^4.0` du SDK. Rien à faire.
- **W1 — finding que j'ajoute au panel (discipline de pin incohérente).**
  `@modelcontextprotocol/sdk` est en `^1.30.0` (caret) alors que `zod` et `vite-node` sont
  pinnés à l'exact. C'est à l'envers : la Consequence d'ADR-0081 dit elle-même « protocole
  jeune, versions rapides » — la dépendance la plus volatile des trois est la seule laissée
  flottante, et un `yarn install` ultérieur peut casser l'outillage sans qu'aucun commit ne
  le montre. **Pin exact `1.30.0`.** → `dev-tooling-assets`, **BLOQUANT** (coût : un
  caractère ; bénéfice : la reproductibilité que les deux autres pins visent déjà).
- `.mcp.json` gagne une seconde entrée qui lance `vite-node` : chaque session Claude
  démarre désormais un pipeline Vite et charge le graphe TS du jeu, même quand elle ne
  touche à aucun level. C'est le coût qu'ADR-0081 a explicitement accepté ; je le laisse
  passer et je le **trace** pour la re-pesée annoncée à l'arrivée d'un troisième serveur.
- `dryrun-fixture.mjs` reste hors de `yarn vitest run` (O3, précédent des `e2e-*.mjs`) :
  accepté, la logique pure comparée est couverte, elle, à chaque passe.

### 6.6 Verdict

**NO-MERGE en l'état — MERGE conditionnel** dès que les fixes ci-dessous sont verts.

Aucun finding confirmé n'est un défaut de conception : la frontière game/render/hooks est
tenue, la règle d'unicité est bien redescendue en une seule implémentation côté `game`, et
la surface d'écriture agent est fermée par construction et prouvée par mutation. Ce qui
bloque, c'est un **contrat manquant** (M1) et un **contrat non tenu** (M2) sur la porte
d'entrée de l'outil — plus quatre robustesses de process serveur long-vécu.

Conditions du passage à MERGE :

1. **M1** — jointure upsert, branche `levelId` supprimée, JSDoc à jour · `dev-tooling-assets`
2. **M2a** — précondition `plan/malformed` dans `validateLevelPlan` · `dev-gameplay`
3. **M2b + m3** — ordonnancement de `core.validate` (registre après plan-check) · `dev-tooling-assets`
4. **m2, m6, m7** — garde is-main-module, listener `'error'`, ordre du `finally` · `dev-tooling-assets`
5. **W1** — pin exact du SDK MCP · `dev-tooling-assets`
6. **n1** — phrase fausse d'ADR-0081 D6 · `tech-writer`
7. Non bloquants mais **à faire atterrir dans la même branche** : m4, m5, n2, n3, n4, n5,
   n6b. m5 est le plus important des sept (seam SP2).

Vérification attendue au retour : `yarn vitest run` complet + un test neuf par finding
majeur (re-scaffold d'un level agrégé avec `overwrite: true` **qui passe** ; `validate` d'un
plan malformé qui rend des issues **sans throw** ; registre non pollué après validation d'un
plan refusé). Pas de nouveau tour de panel complet : les fixes sont locaux et bornés, je
re-vérifie moi-même sur le diff incrémental. Rappel du sign-off (b), toujours dû :
**re-vérifier le numéro ADR-0081 contre toutes les branches distantes juste avant le merge.**

### 6.7 Re-vérification incrémentale architecte (2026-08-01, `108c4ef2..9c35b344`)

Une passe sur le diff incrémental (10 fichiers, +710/−51 hors `yarn.lock`), plus mes propres
exécutions. Pas de nouveau tour de panel, comme cadré au §6.6.

**Conformité des prescriptions — 15/15 fidèles.**

| Prescription                | Vérification                                                                                                                                                                                                                                                                                                                                                                         | Verdict |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **M1** upsert               | `[...plans.filter((p) => p.id !== plan.id), plan]`, branche `levelId` supprimée, JSDoc réécrit avec la séparation catalogue/disque que j'avais fixée. Probe : `validate({plan: fixture})` → `[]` (était `plan/duplicate-id`), `validate({levelId})` → `[]` inchangé.                                                                                                                 | ✅      |
| M1 test de collision        | Réécrit comme demandé : `plans: [soundPlan("dup"), soundPlan("dup")]` — **deux entrées distinctes partageant un id**, plan candidat tiers. Plus le cas inverse (re-soumission d'un id du catalogue ⇒ pas de `duplicate-id`) et les deux tests `scaffold` (refus `scaffold/exists` puis passage avec `overwrite: true`). La boucle d'itération que M1 bloquait est prouvée débloquée. | ✅      |
| **M2a** `plan/malformed`    | `planShapeIssues` en tête de `validateLevelPlan`, retour anticipé. Couvre ce que les gardes déréférencent (`archetypes`/`props` + forme par ÉLÉMENT, `fiction`/`backdrop`/`gameplay`, `gameplay.windowWeights`) — la forme par élément n'était pas dans ma prescription et est un ajout juste. Contrat « ne throw jamais » écrit dans le JSDoc.                                      | ✅      |
| **M2b + m3** ordonnancement | Plan-check + catalogue d'abord, `registerGeneratedArchetypes` + `validateLevel` seulement si propre. Probe : `validate({plan:{id:"safe"}})` → 5 × `plan/malformed`, **sans throw**. Test de non-pollution du registre (hp 2 reste 2 après un plan refusé) présent.                                                                                                                   | ✅      |
| **m2** garde is-main        | `isMainModule()` par comparaison `fileURLToPath(import.meta.url)` vs `path.resolve(argv[1])`. **Correctif réel découvert par la lane** : `vite-node` sans `--script` réécrit `process.argv` et fait taire le serveur ; `mcp:level-editor` passe donc à `vite-node --script`. Bien trouvé — c'est le genre de piège qu'un garde is-main copié-collé introduit en silence.             | ✅      |
| m2 → `.mcp.json`            | **Non régressé, vérifié par smoke JSON-RPC de ma main** : `.mcp.json` invoque `yarn mcp:level-editor`, donc hérite du `--script`. Handshake `initialize` → `serverInfo {level-editor, 0.1.0}` puis `tools/list` → les 6 outils. L'entrée MCP est intacte.                                                                                                                            | ✅      |
| **m6** listener `'error'`   | Posé, converti en throw dans la boucle d'attente.                                                                                                                                                                                                                                                                                                                                    | ✅      |
| **m7** `finally` imbriqué   | `proc.kill()` hors d'atteinte d'un throw de `browser.close()`.                                                                                                                                                                                                                                                                                                                       | ✅      |
| **W1** pin SDK              | `"@modelcontextprotocol/sdk": "1.30.0"` exact.                                                                                                                                                                                                                                                                                                                                       | ✅      |
| m4 runbook                  | Shebang `env -S vite-node` + runbook corrigé (`yarn vite-node`), fichier passé exécutable.                                                                                                                                                                                                                                                                                           | ✅      |
| **m5** paramétrage          | `compareDryrunReport(actual, expected, { base, levelId })`, regex construite avec `escapeRegExp`, défauts inchangés. **Le seam SP2 est débloqué** : un second level réutilise ce comparateur au lieu d'en forker un.                                                                                                                                                                 | ✅      |
| n2 / n3 / n5 / n6b          | Garde `Number.isFinite` sur les deux lectures ; `labelOrder` trie par position réelle (`indexOf`) ⇒ la promesse « same ordered set » devient vraie ; flag `i` retiré de `SAFE_ID` + message aligné ; `looksLikeThisDevServer` exige `id="root"` **et** `/@vite/client`.                                                                                                              | ✅      |
| n4 `spriteBase`             | Garde dans `validateLevelPlan` sous `plan/archetype-bounds`, avec le motif écrit (préfixe de nom de fichier ⇒ vide = matche tout `public/assets/`). Au bon étage : c'est une règle de plan.                                                                                                                                                                                          | ✅      |
| **n1** ADR-0081 D6          | Phrase fausse remplacée : « n'enregistre rien elle-même (l'enregistrement des archétypes reste à l'import) : elle ne fait qu'exécuter le fail-fast ». Exact.                                                                                                                                                                                                                         | ✅      |

Gates re-déclarées par la lane : tsc ✓, **1734 tests / 121 fichiers** ✓ (+19 depuis le triage),
lint ✓.

**Deux résiduels, trouvés par mes probes.**

- **R1 — `validate({plan: null})` throw encore. BLOQUANT (tier fix-lane).**
  Probe : `TypeError: Cannot read properties of null (reading 'id')`. C'est le fix M1 qui
  l'introduit : la jointure upsert déréférence `plan.id` **avant** que `validateLevelPlan`
  n'ait pu rendre `plan/malformed`. Autrement dit la classe de défaut que M2 vient de fermer
  est ré-ouverte à cinq lignes de là, dans la même fonction. Inatteignable sur le fil (le
  `z.record` du serveur rejette `null`), mais la **surface bibliothèque est de premier rang**
  (D3, « deux surfaces, une implémentation », épinglée par `mcpLibrarySurface.test.mjs`) — et
  le JSDoc de `validateLevelPlan` promet désormais noir sur blanc « never throws, whatever it
  is handed », promesse que `core.validate` ne tient pas. Fix prescrit, qui préserve le
  feedback one-shot (donc pas un simple retour anticipé) :

  ```js
  const planIssues = validateLevelPlan(plan);
  if (planIssues.some((i) => i.code === "plan/malformed")) return { issues: planIssues };
  const catalogue = [...plans.filter((p) => p.id !== plan.id), plan];
  const issues = [...planIssues, ...validateCatalogue(catalogue)];
  if (issues.length > 0) return { issues };
  registerGeneratedArchetypes(plan.archetypes);
  return { issues: validateLevel(planToLevelConfig(plan)) };
  ```

  `plan/malformed` devient de ce fait une **clé machine porteuse** — c'est cohérent, le panel
  l'a justement établie comme le code du contrat. Test attendu : `validate({plan: null})` rend
  des issues sans throw. → `dev-tooling-assets`, un fichier, une lane, aucun enjeu de design :
  **fix lane, un seul reviewer, pas de retour panel ni architecte.**

- **R2 — angle de l'upsert à documenter. NON BLOQUANT, doc seule.**
  Probe : `validate({plan: X}, {plans: [dup, dup]})` → `[]`. L'upsert filtre **toutes** les
  entrées partageant l'id du candidat, donc un catalogue déjà corrompu _sur cet id précis_ est
  silencieusement assaini dans la jointure. C'est une conséquence correcte de la sémantique que
  j'ai choisie (« l'agrégation humaine tient une ligne par id »), et la couverture n'est pas
  perdue globalement — `assertDistinctPlanIds` au bootstrap et le test CI sur le vrai
  `GENERATED_PLANS` attrapent le doublon, et toute autre paire dupliquée reste vue. Mais mon
  §6.2 laissait entendre l'inverse. Une phrase à ajouter au JSDoc de `validate`, rien de plus.
  → `dev-tooling-assets`, avec R1.

**Condition de sign-off (b) — le numéro ADR : elle FIRE. Escalade `producer`.**

Re-vérification faite contre **101 têtes distantes** (`git ls-remote --heads origin`, puis
`git log --all --diff-filter=A -- 'docs/adr/0077-*.md'`) :

- `docs/adr/0081-mcp-level-editor-server.md` — cette branche, revendiqué le **2026-07-31**.
- `docs/adr/0077-flyer-cascade-session-key.md` — commit `24762f7a`, **2026-08-01**, porté par
  `origin/claude/flyer-wall-float-in-animation` **et par elle seule**.

Aucun des deux n'est sur `main` : la collision ne se matérialise qu'au **second** merge. C'est
exactement le scénario des deux ADR-0020 que la discipline `adr-new` existe pour empêcher, et
c'est pourquoi j'avais fait de cette re-vérification une condition au lieu d'un rituel.

Je **ne tranche pas le numéro** : l'allocation appartient à `producer` (COLLABORATION.md — les
numéros d'ADR viennent de Marion, jamais d'auto-allocation, et mon propre en-tête d'ADR admet
s'être auto-alloué faute de réservation). Les faits pour la décision : notre revendication est
antérieure d'un jour et c'est cette branche qui est au merge gate, l'autre n'y est pas. La
résolution naturelle est donc « cette branche garde 0077 et passe la première, la branche
flyer renumérote en 0078 au rebase » — mais elle exige un hand-off vers la lane flyer, et c'est
`producer` qui l'ouvre et l'enregistre. **Merger cette branche sans ce ruling posé, c'est armer
la collision pour quelqu'un d'autre.**

### 6.8 Verdict final

**MERGE CONDITIONNEL.** Les 15 prescriptions du triage sont implémentées fidèlement, y compris
les deux majeurs sur le contrat d'entrée, et la lane a trouvé en chemin un vrai piège
(`vite-node --script`) que je n'avais pas vu — l'entrée `.mcp.json` est prouvée intacte par mon
propre smoke JSON-RPC. La revue d'intégration du §6.5 est **inchangée et confirmée** : loi de
frontière tenue, condition C3 satisfaite, seam SP2 désormais réellement réutilisable (m5),
impact bundle/déploiement nul.

Ne pas pousser sur `main` avant ces deux gestes, tous deux courts :

1. **R1** — `validate({plan: null})` ne doit pas throw · `dev-tooling-assets` · **tier fix-lane**
   (une lane, un fichier, aucun enjeu de design) · R2 documenté dans la même édition.
2. **Ruling `producer` sur le numéro ADR** — collision 0077 avec
   `origin/claude/flyer-wall-float-in-animation`, hand-off à ouvrir vers cette lane.

**Je ne redemande ni passage panel ni passe architecte** : R1 est couvert par le reviewer unique
de la fix lane, le ruling ADR est un geste de production. Dès qu'ils sont verts, la branche part
en acceptation `pm`. Ma condition de sign-off (b) est **close** — non pas « rien trouvé », mais
« trouvé, tracé, escaladé à qui de droit ».

— `senior-architect` (Winston), 2026-08-01.

## 7. Acceptation pm — stage 8

`pm` (John), 2026-08-02, sur `claude/mcp-level-editor-build-iy2jaw` @ `87114205` (PR #159
draft). Jugement de la livraison CONTRE `spec-mcp-level-editor.md`, `plan-mcp-level-editor.md`,
PROJECT_GUIDELINES et ce shard — pas une reprise des gates amont (tous PASS, déjà tracés) mais
un contrôle direct sur trois axes : cadrage, périmètre, honnêteté de la trace.

### 7.1 Cahier des charges

Prohibition (Atari ST) n'a pas d'outil d'édition de niveaux pour agents — cet outil n'est pas
une fonctionnalité du jeu, c'est un outil de production pour la piste éditeur (ADR-0074/0075).
Le test "cahier des charges" ne s'applique pas directement à un outil interne ; ce qui s'applique
est la discipline de scope de la spec elle-même (§2, §7), qui EST le cadrage de Bertrand pour cet
outil. Vérifié ligne à ligne :

- **Décision 1 (écriture v1, triple discipline)** — tenue. `scaffold` écrit uniquement sous
  `src/game/levels/generated/` (charset d'id + refus `/`, `\`, `..` + `targetPath.startsWith`
  en 2ᵉ couche, les trois couches prouvées par mutation §5.3 M1/M4) ; `validate` bloquant avant
  écriture (M2/R1 fermés — un plan malformé ou `null` rend des issues, ne throw plus, donc ne
  peut plus contourner le blocage par effet de bord) ; aucun geste git dans l'outil (`rg` sur
  `src/**`/`scripts/mcp-level-editor/**` ne montre aucun appel `git`/`commit`/`push`, conforme
  §6.1 du panel et à D3/D4 de l'ADR).
- **Décision 2 (navigateur local uniquement)** — tenue. `dryrun`/`preview` pilotent un vite +
  Playwright locaux, aucun token/secret côté serveur (D5, vérifié §6.5) ; `dryrun-fixture.mjs`
  n'est pas dans le CI mais exécuté à la main au VERIFY (§5.2d, PASSED, report identique au
  commité).
- **Décision 3 (SDK officiel, stdio, `.mcp.json`)** — tenue. `@modelcontextprotocol/sdk`
  `1.30.0` pin exact en devDependency (W1 fermé), interdit d'import depuis `src/**` (vérifié par
  `rg`, §6.1), `.mcp.json` porte `"type": "stdio"` (vérifié directement par moi) et le smoke
  JSON-RPC de l'architecte confirme le handshake + les 6 outils.

### 7.2 Hors périmètre (§7)

Aucune trace de timeline (story ②, toujours bloquée par sa réserve §7.1 — non touchée ici), de
placeur de balcons (story ④), de génération d'assets (réservée à SP2) ou de transport MCP autre
que stdio local dans le diff. L'ADR-0081 D2/D3 ferme explicitement toute extension de ces
surfaces à un nouvel ADR — ce n'est pas seulement respecté aujourd'hui, c'est verrouillé pour
demain. Confirmé par ma propre lecture de la spec/plan/ADR et par les vérifications de frontière
répétées de l'architecte (§6.1, §6.5, §6.7) : rien à retrancher.

### 7.3 Critère d'acceptation §6

Les 6 points sont attestés par des **exécutions réelles**, pas sur parole : qa-lead a rejoué
`validate`/`scaffold`/`inspect`/`dryrun`/`preview` en direct (§5.2, dont le scaffold dans le VRAI
`generated/` et non en tmpdir — la preuve la plus exigeante), et l'architecte a rejoué une partie
de ces mêmes probes lui-même en triage (§6.1) puis en re-vérification incrémentale (§6.7),
trouvant au passage deux résiduels (R1, ADR#) qui ont chacun reçu un traitement fermé plutôt
qu'une note vague. C'est le niveau de preuve que ce critère demande.

### 7.4 Dette et hand-offs ouverts — tracés, pas de dette silencieuse

- **Renumérotation flyer 0077→0078** : ruling `producer` rendu et enregistré dans
  `docs/handoffs/story-flyer-wall-float-in-animation.md` (vérifié — geste explicite listé,
  renommage + régénération d'index + mise à jour du handoff avant rebase sur `main`).
  **À dire exactement (panel round 3, MAJEUR de traçabilité)** : c'est bien CETTE branche
  qui porte l'artefact de coordination — elle crée `story-flyer-wall-float-in-animation.md`
  et ses deux lignes d'index, contenu qui ne trace à aucun élément du spec/plan/ADR de la
  story ③. C'est assumé, pas accidentel : la collision de numéro a été DÉCOUVERTE par la
  condition de sign-off de cette story, le ruling `producer` devait atterrir quelque part,
  et le laisser dans une branche flyer non ouverte l'aurait rendu invisible au moment où il
  compte (le merge de celle-ci). Ce que la branche flyer porte, c'est le GESTE
  (renuméroter 0077→0078 à son rebase) ; la trace du ruling voyage ici. La rédaction
  antérieure — « la story flyer porte sa propre dette, pas cette branche » — disait
  l'inverse du diff et est corrigée par la présente.
- **Dédup driver §8 par SP2** : `compareDryrunReport` paramétré (`base`, `levelId`, regex
  échappée) précisément pour que SP2 dédoublonne au lieu de forker (m5, §6.5 et §6.7) — seam
  ouvert, documenté, non bloquant pour CETTE story puisque SP2 n'a pas encore mergé.
- **Garde `plan/calibration` côté SP2** : notée en §3 comme non ajoutée ici par construction
  (SP2 toujours en SPECS REVIEWED au moment du build) — pas un oubli, une séquence attendue
  documentée dans le plan (Auto-revue, croisement SP2 point 1).
- **Constat "branche fantasme"** (§3) : le shard trace honnêtement que la branche
  `feat/mcp-level-editor` annoncée par Bertrand n'a jamais existé sur `origin`, que T1/T2b ont
  été réimplémentées sur `claude/mcp-level-editor-build-iy2jaw`, et que si les commits locaux de
  Bertrand refont surface une réconciliation manuelle sera nécessaire. C'est exactement la
  transparence attendue — rien à corriger, sauf attirer l'attention de Bertrand dessus (fait
  dans mon verdict ci-dessous) au cas où des commits locaux existent encore quelque part et
  mériteraient un coup d'œil avant qu'on les considère caducs.

### 7.5 Verdict

**ACCEPTED, sans réserve bloquante.** Les 3 décisions de cadrage sont tenues à la lettre, aucune
extension hors §7 n'est livrée, le critère §6 est attesté par des exécutions réelles rejouées à
deux niveaux indépendants (qa-lead, senior-architect), et toute la dette ouverte (renumérotation
ADR, dédup SP2, garde calibration) est tracée avec un porteur et un déclencheur clairs — rien
n'est laissé en dette silencieuse. Un seul point à porter à l'attention de Bertrand hors gate :
le constat §3 sur la branche `feat/mcp-level-editor` jamais poussée — si des commits locaux
existent encore de son côté, un coup d'œil avant de les considérer perdus, sinon rien à faire.

Prêt pour merge dès que `producer`/l'architecte confirment le numéro ADR-0081 une dernière fois
juste avant le push sur `main` (rituel déjà cadré au §6.7, pas une nouvelle condition).

— `pm` (John), 2026-08-02.

### Round 2 — `b3e96f5c` : CONDITIONAL (0 BLOQUANT, 1 MAJEUR, 3 MINEUR)

Note de contexte : la run du panel sur `1e75721d` a de nouveau été **annulée**, cette
fois par le force-push du rebase de la branche sur un `main` plus récent (docs SP3) —
2 reviewers avaient rendu, 2 tournaient encore, d'où le « 2 jobs failed ». Même
mécanisme de supersession que les trois précédents, même diagnostic trompeur du
workflow (cf. le chantier CI relevé ci-dessus). Le rebase a préservé le travail
intégralement (arbres comparés, seul écart = les 4 fichiers SP3 hérités de `main`).

- **[MAJEUR] `plan.fiction` : les sous-champs n'étaient jamais vérifiés** — fondé et
  sérieux : `planShapeIssues` ne contrôlait que l'objecthood de `fiction`, et rien en
  aval ne regarde `name`/`label`/`district`/`year`. Un `fiction: {}` recevait donc un
  verdict **« sain »** (`issues: []`), `scaffold` écrivait le module, et la carte de menu
  affichait littéralement « undefined » une fois le level agrégé. Exactement la classe
  d'entrée que la story rend atteignable (JSON arbitraire d'agent + `planShape` zod
  volontairement lâche), et que le fixture des tests masquait en fournissant toujours un
  `fiction` complet. Les 4 champs sont désormais exigés non vides ; probe : `validate`
  rend 4 issues `plan/malformed` ciblées et `scaffold` refuse d'écrire.
- **[MINEUR] spec §4.2 disait encore `server.ts`** — fondé : ADR-0081 D1 dit trancher
  cette hésitation même, et la phrase n'avait pas suivi. Corrigée, avec le renvoi à D1.
- **[MINEUR] TOCTOU de `scaffold`** — **déjà arbitré** par l'architecte (§6.7, n6a :
  risque accepté, outil local mono-opérateur, écriture déjà tmp+rename atomique). Le
  finding le concède lui-même (« Not critical for a single-operator dev tool »). Décision
  inchangée ; l'arbitrage est maintenant inscrit en commentaire au point de garde pour
  qu'il ne soit pas re-plaidé à chaque tour.
- **[MINEUR] course de `ensureDevServer` sur port froid** — retenu, correctif appliqué :
  deux appels concurrents voyaient tous deux « pas de serveur », le perdant mourait sur
  EADDRINUSE au lieu de réutiliser le serveur du gagnant. Sur échec de spawn, on
  re-sonde une fois avant d'abandonner — et on rend `proc: null`, donc on ne tue jamais
  le serveur d'autrui.

### Round 3 — `0071b4ff` : CONDITIONAL (0 BLOQUANT, 3 MAJEUR, 2 MINEUR)

- **[MAJEUR, traçabilité] la branche porte un shard hors-story (flyer) que le §7.4
  désavouait** — fondé sur le fond documentaire : le diff crée bien
  `story-flyer-wall-float-in-animation.md` + 2 lignes d'index, contenu qui ne trace à
  rien du spec/plan/ADR de la story ③, pendant que §7.4 affirmait « pas cette branche ».
  Des deux issues proposées, je retiens la seconde (dire vrai plutôt que retirer) :
  supprimer le fichier ferait disparaître un ruling `producer` découvert PAR cette story
  et dû AU moment de son merge. §7.4 réécrit pour dire ce que le diff fait réellement,
  en distinguant l'artefact (ici) du geste de renumérotation (branche flyer).
- **[MAJEUR] `backdrop.file` jamais vérifié** et **[MAJEUR] `props[].asset` jamais
  vérifié** — fondés tous deux, et **même classe que le MAJEUR du round 2**
  (`fiction.*`) : une chaîne requise que rien ne contrôle, un verdict « sain », un module
  écrit sur disque, puis `undefined` qui atterrit dans un chemin (`undefined.png`,
  `path.join` qui throw un `TypeError` brut depuis `inspect`) ou dans l'UI. Trois rounds,
  trois instances : j'ai donc **fermé la classe, pas les instances** — toutes les chaînes
  requises du `LevelPlan` sont désormais balayées depuis une table unique
  (`fiction.name/label/district/year`, `backdrop.file`, `props[i].asset`), avec le
  périmètre dit explicitement dans le JSDoc (`spriteBase` relève des règles,
  `backdrop.mode` est une union à un littéral). Le commentaire qui prétendait vérifier
  « exactement ce que les gardes en aval déréférencent » disait faux : il vérifiait moins
  que ce que les projections et les outils MCP déréférencent — corrigé.
- **[MINEUR] `plan/missing-input` sans couverture** — retenu : chemin atteignable sur le
  fil (le schéma zod rend `plan` ET `levelId` optionnels). Test ajouté sur `{}`,
  `{overwrite:true}` et `undefined`.
- **[MINEUR] table de cargaison de la PR fausse (7 .md annoncés, 6 réels)** — retenu et
  recompté depuis `git diff --name-status`, corps de PR corrigé.

### Fusion de `main` + renumérotation ADR-0077 → **ADR-0081** (2026-08-02, après-midi)

`main` a bougé (PR #160, #161) et la PR est repassée `dirty`. Deux constats à la fusion :

1. **Un TIERS a pris le 0077 avant nous.** `docs/adr/0077-couverture-tsc-eslint-scripts.md`
   (branche `claude/focused-wozniak-lomy3e`, PR #161) a mergé sur `main`. Le ruling
   `producer` du matin arbitrait 0077 entre CETTE story et la branche flyer ; il a tenu
   entre elles (la flyer s'est bien renumérotée en 0078, vérifié sur sa branche), mais il
   ne protégeait pas d'une troisième branche qui merge d'abord. Notre ADR passe donc en
   **0079**, seul numéro libre vérifié (0077 = main, 0078 = flyer déjà renumérotée).
   37 références réécrites dans 16 fichiers ; index régénéré (`--check` : fresh, 78 ADR).
   La leçon est consignée côté `producer` dans `story-flyer-wall-float-in-animation.md` :
   ne jamais pinner un numéro futur dans un hand-off, dire « le prochain libre, vérifié au
   rebase » — un numéro n'est réservé qu'au merge.
2. **Fusion plutôt que rebase**, à dire franchement : le rebase butait sur les index ADR
   générés à chaque commit (27 rejeux) ; la fusion offre un point de résolution unique.
   Conflits résolus : `fixes.md` et l'index handoffs (append des deux côtés — main y avait
   dédupliqué sa table, sa version est retenue), les deux index ADR régénérés par le script.

Gates après fusion : tsc ✓, 1739 tests ✓ / 121 fichiers, lint ✓, format:check ✓.

**Correction du numéro retenu, même jour** : la première allocation visait 0079 (premier
trou libre, décidé sur une vérification bornée). Un balayage EXHAUSTIF (103/103 branches
distantes, PR croisées) l'a corrigée : 0079 est libre à l'instant T mais c'est la cible
naturelle de trois glissements déjà armés — #163 doit quitter 0077, et #145/#156 se
disputent 0078. Camper sur 0079 aurait rejoué le pari perdu le matin même. La story prend
donc **0081**, hors zone de choc ; les trous 0079/0080 sont assumés et documentés.

### Round 4 — `f867734b` : FAIL (1 BLOQUANT, 1 MAJEUR, 2 MINEUR)

- **[BLOQUANT] le corps de l'ADR se déclarait encore « 0077 »** — fondé, et de ma main :
  mon `sed` de renumérotation ciblait `ADR-0077` et `0077-mcp-level-editor-server`, deux
  motifs qu'aucun des deux champs propres du document ne porte (`# 0077 — …` en titre,
  `**Number:** 0077` en métadonnée). Le fichier s'appelait 0081 et se disait 0077 —
  exactement le genre de document auto-contradictoire que la story prétend éviter. Titre
  et champ Number corrigés, et le bloc Number RACONTE désormais la renumérotation plutôt
  que de la masquer : c'est lui le porteur de la leçon (un arbitrage ne réserve pas un
  numéro, seul un merge le fait).
- **[MAJEUR, sécurité] `backdrop.file` et `props[].asset` sans garde de traversée** —
  fondé et bien vu. J'avais ajouté au round 3 l'exigence « chaîne non vide » sur ces deux
  champs, sans voir qu'ils deviennent des CHEMINS. Un `backdrop.file` valant
  `../../../../etc/passwd` validait proprement, se scaffoldait tel quel, et transformait
  le scan d'assets d'`inspect` en oracle d'existence de fichiers arbitraires — alors que
  la doctrine du même diff impose ce confinement à `plan.id`. Corrigé aux DEUX étages :
  la règle (rejet de `..` et `\`) vit dans `validateLevelPlan` où vivent les invariants,
  et `scanAssets` confine en plus le chemin résolu sous `public/` puisque c'est LUI qui
  touche le disque. Probe : les deux champs rendent maintenant `plan/malformed`.
- **[MINEUR] `{plan}` + `{levelId}` ensemble : le levelId était ignoré en silence** —
  retenu. Des deux issues proposées (documenter la précédence ou la refuser), j'ai pris
  la seconde : un agent qui envoie les deux croit avoir cadré son appel par id, et laisser
  le plan gagner sans rien dire masque leur désaccord. Nouveau code `plan/ambiguous-input`,
  testé.
- **[MINEUR] avis de sécurité non re-vérifiable par le panel** — juste sur la forme : le
  panel CI n'a pas de réseau, donc ma ligne dans le corps de PR ne lui est pas
  reproductible. Le résultat de `yarn npm audit --all --recursive` (7 avis, aucun sur nos
  3 paquets, les 7 préexistants nommés un par un) est désormais **dans l'ADR D2**, avec la
  commande pour le rejouer.

### Round 5 — `9ed5f9d2` : CONDITIONAL (0 BLOQUANT, 1 MAJEUR, 1 MINEUR)

- **[MAJEUR] la preuve d'acceptation §5.2 (a) décrivait un code que mon propre fix avait
  changé** — fondé, et c'est le finding le plus fin de la série. Le `qa-lead` avait attesté
  la composition `validateLevelPlan` + `validateLevel` en citant un plan cassé rendant
  `plan/*` **et** `foreign-enemy-kind` dans le même appel. Le fix M2b/m3 du triage — que
  j'ai appliqué APRÈS ce VERIFY — fait court-circuiter les issues plan-level avant
  `validateLevel` : cette preuve est devenue impossible, et personne (moi compris) n'est
  revenu la relire. Pire, le test correspondant avait été réécrit pour n'assurer que les
  codes `plan/*`, si bien que **plus aucun test ne couvrait la composition**, le cœur même
  du §4.1. Preuve §5.2 réécrite pour dire le code réel, et le vrai chemin restant est
  désormais épinglé : une clé `windowWeights` non préfixée échappe aux gardes du plan
  (`if (!kind.includes(":")) continue`), donc `validateLevelPlan` rend `[]` et seul
  `validateLevel` la rejette — vérifié par probe avant d'écrire le test.
- **[MINEUR] `scanAssets` matchait les sprites par préfixe nu** — retenu : un level dont le
  `spriteBase` est le préfixe littéral de celui d'un autre (`enemy_porte_flic` vs
  `enemy_porte_flic_vigile`) se voyait attribuer les assets du voisin. Match désormais
  délimité (`<base>.png` exact, ou `<base>_…`), conforme à la convention documentée juste
  à côté.

### Round 6 — `5ad75f3e` : CONDITIONAL (0 BLOQUANT, 2 MAJEUR, 1 MINEUR)

- **[MAJEUR, traçabilité] le Suivi et le corps de PR s'arrêtaient au round 3** — fondé.
  §8 documentait bien les rounds 4 et 5 (dont un BLOQUANT), mais les deux endroits que le
  process traite comme faisant foi — la checklist §Suivi et le corps de PR — n'en
  portaient pas trace : un auditeur en aurait conclu que l'historique s'arrêtait au round
  3 et n'aurait jamais su qu'un BLOQUANT était apparu ensuite. Les 6 rounds sont désormais
  listés dans §Suivi, avec la sévérité de chacun ; corps de PR aligné.
- **[MAJEUR] course de teardown du serveur de dev** — la moitié manquante du fix de course
  du round 5 : j'avais traité le DÉMARRAGE (deux appels sur un port froid) sans traiter
  l'ARRÊT (celui qui a démarré le serveur le tuait dans son `finally`, sans regarder si un
  appel concurrent s'en servait encore). Corrigé par un compteur de références par port :
  le serveur meurt quand le DERNIER porteur relâche ; `preview` prend une référence et ne
  la relâche jamais, ce qui est exactement son contrat (l'URL rendue doit continuer de
  servir) et ce qui empêche un `dryrun` concurrent de la lui couper.
  **Honnêteté sur la preuve** : la probe de concurrence (deux `dryrun` chevauchants sur
  port froid) passe avec le fix — mais la MUTATION (remettre le `kill` inconditionnel) ne
  la fait PAS rougir. Une fois la page chargée, tuer vite ne casse pas les lectures DOM en
  cours ; la fenêtre réelle exige que l'appel survivant fasse encore une requête réseau
  après la libération (plausible avec les chunks Three.js différés d'ADR-0068, non
  reproduit ici). Le refcount est donc gardé comme correction de classe, pas comme
  correctif d'un bug observé — et c'est dit plutôt que sous-entendu.
- **[MINEUR] avis de sécurité des devDeps non re-vérifiable hors ligne** — le finding dit
  lui-même « No action required to merge ». Sa recommandation (faire re-jouer
  périodiquement l'audit par un outil CI en réseau — Dependabot / osv-scanner — au lieu de
  s'appuyer sur l'attestation ponctuelle d'ADR-0081 D2) est un chantier d'outillage propre,
  hors périmètre de cette story. **Hand-off ouvert ci-dessous.**

### Hand-offs ouverts à la sortie de cette story

- `dev-tooling-assets` — **audit de dépendances en CI** : brancher osv-scanner ou
  Dependabot sur le dépôt pour que l'attestation d'ADR-0081 D2 (`yarn npm audit`, ponctuelle
  et hors ligne côté panel) devienne une vérification continue. Recommandé par le panel CI
  (r4, r6, security-review).
- `dev-tooling-assets` — **le workflow du panel compte un job `cancelled` comme `failed`**
  et publie alors un diagnostic d'authentification trompeur (« quota épuisé / token
  expiré ») alors qu'il s'agit d'une run supersédée par une poussée. Quatre DEGRADED de
  cette PR viennent de là. Le workflow vit sur `main`, hors périmètre de ce diff.
- `producer` — **collision 0078 non arbitrée** entre `claude/flyer-wall-float-in-animation`
  (#145) et `feat/level-harness-sp2` (#156), plus `design/qte-photo-paparazzi` (#163) qui
  doit quitter 0077. Détail et tableau des numéros :
  `docs/handoffs/story-flyer-wall-float-in-animation.md`.

### Round 7 — `5fbc3586` : CONDITIONAL (0 BLOQUANT, 2 MAJEUR, 3 MINEUR)

Observation à porter au dossier : **les deux MAJEUR de ce round portent sur du code écrit
aux rounds 4 et 6** — la garde de traversée et le compteur de références. Chaque correctif
ouvre sa propre surface, et c'est le signal que le rendement de ces tours décroît sur le
code pendant que le risque de régression, lui, ne décroît pas.

- **[MAJEUR] la garde de traversée ratait le chemin ABSOLU** — fondé et embarrassant :
  `/etc/passwd` ne contient ni `..` ni `\`, donc `validateLevelPlan` rendait un verdict
  « sain » pour exactement la classe d'entrée que la garde existe pour confiner. Aucun de
  mes trois tests ne couvrait la forme la plus simple. Pas exploitable aujourd'hui
  (`scaffold` ne dérive son chemin que de `plan.id`, et `scanAssets` re-borne de son côté),
  mais le contrat de `validate` était faux. Condition ajoutée, deux tests ajoutés.
- **[MAJEUR] `ensureDevServer` corrompait sa table sur une course de port froid** — le
  meilleur finding du round, et il vise le fix du round 6. Le perdant d'une course meurt en
  EADDRINUSE par une **sortie non nulle**, pas par un événement `error` — mon commentaire
  affirmait pourtant que la branche `spawnError` couvrait ce cas. Résultat : les deux appels
  finissaient par voir le serveur du gagnant, tous deux écrivaient dans la Map, et le
  dernier écrasait l'entrée avec un handle de process MORT en remettant le compteur à 1 —
  après quoi `release()` tuait un cadavre et le vrai serveur fuyait. Corrigé : écoute de
  `exit` en plus d'`error`, adoption du gagnant via `NO_RELEASE` sans jamais s'enregistrer,
  et enregistrement réservé au process dont on a constaté qu'il est vivant (premier
  écrivain gagne, les suivants prennent une référence).
- **[MINEUR] table clé par port seul** — corrigé : clé `port::base::rootDir`, deux cibles
  distinctes ne partagent plus un emplacement.
- **[MINEUR] `z.record` rejetait avant que le contrat « ne throw jamais » s'applique** —
  fondé, et l'écart était réel entre les deux surfaces : le test bibliothèque prouvait que
  `core.validate` rend `plan/malformed` pour `null`, mais sur le FIL le schéma zod rejetait
  d'abord, et l'agent recevait une erreur JSON-RPC opaque au lieu de la forme documentée
  par D3. `planShape` passe à `z.unknown()` — la validation de forme appartient à
  `src/game`, pas au transport. Test de niveau fil ajouté, **et vérifié discriminant par
  mutation** (retour à `z.record` ⇒ rouge).
- **[MINEUR] devDeps** — « no action required », l'attestation d'ADR-0081 D2 est à jour.

### Round 8 — `633f91d5` : CONDITIONAL (0 BLOQUANT, 3 MAJEUR, 2 MINEUR)

Contrairement au round 7, deux des trois MAJEUR visent le code d'ORIGINE, pas mes
correctifs — dont le plus grave manquement au contrat de toute la série.

- **[MAJEUR, sécurité] `scaffold({id:"index", overwrite:true})` écrasait le barrel** —
  fondé, et c'est le trou le plus sérieux : la promesse écrite noir sur blanc dans le
  docstring, dans ADR-0081 D4 et dans la description de l'outil (« ne touche JAMAIS
  `generated/index.ts` ») ne tenait que par l'accident qu'`overwrite` vaut `false` par
  défaut. Rien ne regardait l'id. Un appel explicite aurait remplacé tout le module
  d'agrégation `GENERATED_PLANS` par un fichier de données à un seul plan. Denylist
  `RESERVED_MODULE_NAMES` ajoutée, refus quel que soit `overwrite`
  (code `scaffold/reserved-id`), probe : `index.ts` intact après tentative.
  **Écart assumé avec le finding** : il proposait de bloquer AUSSI `fixture`. Refusé —
  les deux diffèrent en nature. `index.ts` n'est pas un level, c'est le barrel ;
  `fixture.ts` EST un module de level, exactement ce que l'outil possède, et le
  re-scaffolder avec `overwrite: true` est la boucle d'itération que le fix M1 existe
  pour rendre possible. Le bloquer aurait défait M1 pour ne rien protéger.
- **[MAJEUR] `scaffold` acceptait les clés en trop, écrivant un module que tsc rejette** —
  fondé et malin : `renderModuleSource` écrit un littéral DIRECTEMENT TYPÉ
  (`export const plan: LevelPlan = {...}`), donc le contrôle de propriétés excédentaires
  de TypeScript s'y applique. Une clé parasite — erreur très plausible d'un agent face à
  un schéma de transport volontairement lâche — passait `validate`, passait `scaffold`,
  et faisait échouer `yarn typecheck` sur un fichier que l'outil venait de déclarer
  proprement écrit. C'est-à-dire précisément le critère §6 (« un module que la suite
  accepte tel quel »). Passe de détection des clés inconnues ajoutée sur les six formes
  déclarées (plan, fiction, backdrop, gameplay, chaque archétype, chaque prop).
- **[MAJEUR] `adoptOrFail` abandonnait après une sonde et ne prenait pas de référence** —
  encore le fix du round 7 : le perdant d'une course meurt en EADDRINUSE presque
  instantanément alors que le vite gagnant met bien plus longtemps à démarrer, donc une
  sonde unique déclarait en échec un démarrage sain ; et l'adoption rendait `NO_RELEASE`
  sans compter le porteur, si bien que le gagnant pouvait tuer le serveur en pleine
  navigation Playwright. Sonde désormais jusqu'à la MÊME échéance que la boucle
  principale, et prise de référence sur l'entrée du gagnant.
- **[MINEUR] double sonde réseau sur entrée périmée** — corrigé, une seule sonde.
- **[MINEUR] devDeps** — « no action required », l'attestation D2 tient.

### Round 9 — `758ee575` : CONDITIONAL (0 BLOQUANT, 2 MAJEUR, 1 MINEUR)

- **[MAJEUR] le VRAI point d'entrée `yarn mcp:level-editor` n'avait aucune couverture** —
  la meilleure suggestion de couverture de toute la série, et elle ne vise aucun de mes
  correctifs : c'est un trou depuis T2. `mcpServer.test.mjs` pilote `createServer()` par
  un transport en mémoire, donc ne touche jamais `main()` ni la garde is-main-module. Or
  cette garde repose sur un fait réellement surprenant : sous `vite-node <fichier>` nu,
  vite-node RÉÉCRIT `process.argv`, la garde lit faux, `main()` ne tourne pas, et le
  process sort **sans rien imprimer**. Le drapeau `--script` de `package.json` est tout ce
  qui l'empêche — un drapeau qui a l'air redondant à côté des autres entrées de
  `scripts/**` (toutes sous `node` nu) et que le prochain nettoyage supprimera. Sans
  garde, la fonctionnalité entière de cette story pouvait régresser au silence avec
  tsc/vitest/lint/panel au vert. Nouveau `scripts/__tests__/mcpEntryPoint.test.mjs` :
  spawn de la commande réelle, JSON-RPC `initialize` sur son vrai stdio, réponse exigée
  (~5 s pour les deux cas). **Vérifié discriminant par mutation** : `--script` retiré de
  `package.json` ⇒ rouge. Le second cas épingle la surprise elle-même (invocation nue =
  silence), pour qu'un futur vite-node qui corrigerait ce comportement le signale au lieu
  de laisser le drapeau vivre comme folklore.
- **[MAJEUR] lecture périmée de `held` à travers l'await** — **régression que J'AI
  introduite au round 8** en corrigeant le MINEUR de la double sonde : `held` était capturé
  AVANT `await isServerUp`, donc une inscription atterrissant pendant la sonde n'était pas
  vue, l'appel prenait `NO_RELEASE` sans compter son hold, et le porteur d'en face pouvait
  tuer le serveur en pleine navigation — soit exactement la course que r6/r7 prétendaient
  avoir fermée. Table relue APRÈS l'await.
- **[MINEUR] audit de dépendances non câblé en CI** — le finding demande lui-même de
  « suivre le hand-off ouvert », ce qui est déjà fait (liste en fin de shard). Sans action.
