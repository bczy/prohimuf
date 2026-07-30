# Spec — Story ③ : serveur MCP level-editor (`validate` / `inspect` / `scaffold` / `dryrun` / `preview`)

> **Statut** — cadrage validé par Bertrand le 2026-07-30 (3 décisions, §2), spec à relire.
> Story ③ de la piste éditeur ouverte par
> [`story-level-data-extraction.md`](../handoffs/story-level-data-extraction.md) (ADR-0074),
> croisée avec la couche `LevelPlan` de SP1 (ADR-0075). La réserve §7.1 de la story ①
> (playthrough 5 levels) bloque ② — **pas cette story**.
> **Lanes** — `dev-tooling-assets` (serveur), `dev-gameplay` (le passage à
> l'enregistrement paresseux, §4.3), `senior-architect` (ADR du serveur — nouveau process
> et dépendance — ET le sign-off de la proposition NOUVELLE de §4.3, qui renverse un
> point acté d'ADR-0075).
> **Chantier frère** — SP2 ([`spec-level-harness-sp2.md`](./spec-level-harness-sp2.md))
> consomme le même cœur en bibliothèque ; parallélisables, avec DEUX points de
> contact séquencés (le corps de `validateLevelPlan`, le driver §8 généralisé — voir
> l'Auto-revue du plan MCP).

## 1. Objet

Donner aux agents (et à Bertrand en session interactive) une surface outillée pour
travailler les levels générés : valider un plan avant de l'écrire, inspecter l'état d'un
level (données + assets), échafauder un module, le faire tourner headless, le voir. **Un
cœur de fonctions pures, deux surfaces** : ce serveur MCP (interactif, local) et les
scripts CI de SP2/SP3 (batch) — jamais deux implémentations.

## 2. Décisions de cadrage (Bertrand, 2026-07-30)

1. **Écriture dès la v1** — `scaffold(plan)` écrit `generated/<id>.ts`, sous trois
   disciplines dures : écriture **uniquement** sous `src/game/levels/generated/`,
   `validate` obligatoire et bloquant avant toute écriture, **jamais** de commit/push
   (le geste git reste humain).
2. **Navigateur en local** — `dryrun` lance le driver Playwright §8 et `preview` sert
   l'URL du seam sur un vite local. En CI, les mêmes fonctions s'appellent par les
   scripts, sans serveur ni navigateur MCP.
3. **SDK officiel** — `@modelcontextprotocol/sdk` en devDependency, serveur stdio,
   enregistré dans `.mcp.json` (le précédent codegraph). La dépendance est actée par
   l'ADR de la story.

## 3. Les outils

| Outil      | Signature (esquisse)                                                | S'appuie sur                                                                                                            |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `validate` | `{ plan? , levelId? } → { issues: LevelIssue[] }`                   | `validateLevelPlan` (migré vers `LevelIssue[]`, voir §4.1) + `validateLevel(planToLevelConfig(plan))` + unicité des ids |
| `inspect`  | `{ levelId } → { plan, config, art, assets: { present, missing } }` | projections SP1 + scan des chemins d'assets conventionnels                                                              |
| `scaffold` | `{ plan } → { path }` (refus si `validate` non vide)                | template du module `generated/<id>.ts`                                                                                  |
| `dryrun`   | `{ levelId } → report.json` (§8)                                    | le driver Playwright de SP1                                                                                             |
| `preview`  | `{ levelId } → { url }` (+ screenshot optionnel)                    | le seam `?preview=level&level=<id>`                                                                                     |

## 4. Architecture

### 4.1 Le cœur

`validateLevelPlan`, `validateLevel`, `planToLevelConfig`/`planToLevelArt` existent
(SP1 + ADR-0074). **Contrat unifié** : `validateLevelPlan` rend aujourd'hui `string[]`
alors que `validateLevel` rend des `LevelIssue` structurés (ADR-0074 §3) ; la story
MIGRE `validateLevelPlan` vers `LevelIssue[]` (tâche TDD `dev-gameplay`, un `code`
stable par garde — `plan/weight-nonzero`, `plan/namespace`, `plan/sizing`, … — tests
existants mis à jour), pour que `validate` compose les deux sans emballage ad hoc. La
story ajoute ensuite un module mince d'orchestration
(`scripts/mcp-level-editor/core.mjs` ou équivalent TS) : résolution d'un plan par id,
scan d'assets, template de scaffold. **Aucune règle de validation n'est écrite côté
serveur** — tout invariant nouveau va dans `validateLevelPlan`/`validateLevel`.

### 4.2 Le serveur

`scripts/mcp-level-editor/server.ts` (stdio, SDK officiel), entrée `.mcp.json`. Le
serveur ne détient **aucun secret** : la génération payée reste en CI ; `dryrun`/
`preview` n'utilisent que vite + Playwright locaux.

### 4.3 Le préalable : enregistrement paresseux — proposition NOUVELLE, sign-off requis

Cadrage honnête du statut (corrigé après panel run 1 de cette PR) : la question
ADR-0074 §2 ouverte au shard SP1 portait sur le **placement** de
`GENERATED_LEVELS`/`ALL_LEVELS` et a été **résolue** par leur relocation dans le barrel
(`story-level-harness-sp1.md` §Suivi — « the former countersign ask is moot »). Ce que
cette section propose est donc **autre chose et nouveau** : renverser le comportement
acté par ADR-0075 §6 — le fail-fast à l'import de `assertDistinctPlanIds` +
l'enregistrement des archétypes au corps du module — qui reste incompatible avec un
outil important le catalogue mécaniquement. Ce renversement exige son propre sign-off
`senior-architect`, en repesant la raison d'être du fail-fast (le split-brain
`LEVEL_ART` last-wins / `ALL_LEVELS.find` first-wins qu'aucun test fixture ne peut
représenter sans le déclencher).

Proposition : **déplacer, pas supprimer**. `generated/index.ts` n'exporte plus que des
données pures ; le bootstrap du jeu appelle `registerGeneratedLevels()`, qui exécute
`assertDistinctPlanIds` PUIS l'enregistrement — le fail-fast split-brain est
**préservé au démarrage de l'app** (même crash impossible à rater, une frame plus
tard), seul l'import redevient pur. En plus, l'unicité devient un invariant de
`validate`/CI, donc un id en collision est rejeté avant même d'atteindre un runtime.
Alternative écartée : amender ADR-0074 pour une seconde exception — l'exception
existante est un flag littéral, pas une mutation de registre ni un throw ; élargir la
catégorie affaiblirait la règle que la piste éditeur exige. Micro-risque : un oubli
d'appel au bootstrap — gardé par le test de pool de `generatedLevels.test.ts` branché
sur le chemin runtime.

## 5. Sécurité (surface d'écriture agent)

- Écriture confinée à `generated/` par construction (chemin dérivé de l'id validé, refus
  de tout `..`/séparateur dans l'id — l'id est déjà contraint par le namespace).
- `validate` bloquant avant `scaffold` : un plan invalide ne touche jamais le disque.
- Ni commit, ni push, ni exécution arbitraire : les outils sont énumérés, fermés.
- Le serveur tourne sous l'utilisateur local, sans token réseau — rien à exfiltrer.

## 6. Critère d'acceptation

En session interactive : `validate` d'un plan volontairement cassé rend les issues
attendues ; `scaffold` d'un plan sain écrit un module que la suite de tests accepte tel
quel ; `inspect` liste les assets manquants du fixture ; `dryrun` du fixture rend un
report §8 identique à celui commité ; `preview` ouvre le level dans le navigateur. Et en
batch : un script CI appelle `validate` **en bibliothèque** (sans serveur), prouvant les
deux surfaces sur un seul cœur.

## 7. Hors périmètre

La timeline (story ②, bloquée par la réserve §7.1), le placeur de balcons (story ④),
toute génération d'assets (SP2), l'orchestrateur (SP3), tout transport MCP autre que
stdio local.
