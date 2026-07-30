# Spec — Story ③ : serveur MCP level-editor (`validate` / `inspect` / `scaffold` / `dryrun` / `preview`)

> **Statut** — cadrage validé par Bertrand le 2026-07-30 (3 décisions, §2), spec à relire.
> Story ③ de la piste éditeur ouverte par
> [`story-level-data-extraction.md`](../handoffs/story-level-data-extraction.md) (ADR-0074),
> croisée avec la couche `LevelPlan` de SP1 (ADR-0075). La réserve §7.1 de la story ①
> (playthrough 5 levels) bloque ② — **pas cette story**.
> **Lanes** — `dev-tooling-assets` (serveur), `dev-gameplay` (le passage à
> l'enregistrement paresseux, §4.3), `senior-architect` (ADR du serveur — nouveau process
> et dépendance — ET le countersign ADR-0074 §2 encore ouvert au shard SP1, que §4.3 clôt).
> **Chantier frère** — SP2 ([`spec-level-harness-sp2.md`](./spec-level-harness-sp2.md))
> consomme le même cœur en bibliothèque ; chemins disjoints, parallélisables.

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

| Outil      | Signature (esquisse)                                                | S'appuie sur                                                                     |
| ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `validate` | `{ plan? , levelId? } → { issues: LevelIssue[] }`                   | `validateLevelPlan` + `validateLevel(planToLevelConfig(plan))` + unicité des ids |
| `inspect`  | `{ levelId } → { plan, config, art, assets: { present, missing } }` | projections SP1 + scan des chemins d'assets conventionnels                       |
| `scaffold` | `{ plan } → { path }` (refus si `validate` non vide)                | template du module `generated/<id>.ts`                                           |
| `dryrun`   | `{ levelId } → report.json` (§8)                                    | le driver Playwright de SP1                                                      |
| `preview`  | `{ levelId } → { url }` (+ screenshot optionnel)                    | le seam `?preview=level&level=<id>`                                              |

## 4. Architecture

### 4.1 Le cœur

`validateLevelPlan`, `validateLevel`, `planToLevelConfig`/`planToLevelArt` existent
(SP1 + ADR-0074). La story ajoute un module mince d'orchestration
(`scripts/mcp-level-editor/core.mjs` ou équivalent TS) : résolution d'un plan par id,
scan d'assets, template de scaffold. **Aucune règle de validation n'est écrite côté
serveur** — tout invariant nouveau va dans `validateLevelPlan`/`validateLevel`.

### 4.2 Le serveur

`scripts/mcp-level-editor/server.ts` (stdio, SDK officiel), entrée `.mcp.json`. Le
serveur ne détient **aucun secret** : la génération payée reste en CI ; `dryrun`/
`preview` n'utilisent que vite + Playwright locaux.

### 4.3 Le préalable : enregistrement paresseux (clôt le countersign ADR-0074 §2)

`generated/index.ts` enregistre aujourd'hui les archétypes **à l'import** et peut
**throw** (`assertDistinctPlanIds`) — incompatible avec un outil qui importe le
catalogue mécaniquement, et en tension actée avec ADR-0074 §2 (l'ADR-0075 le documente
comme fail-fast assumé ; le countersign architecte est resté ouvert au shard SP1).
Décision proposée au countersign : **rendre l'enregistrement paresseux** —
`generated/index.ts` n'exporte plus que des données pures ; le bootstrap du jeu appelle
`registerGeneratedLevels()` (une ligne, un point d'entrée) ; `assertDistinctPlanIds`
devient un invariant de `validate` + un test. Alternative écartée : amender ADR-0074
pour une seconde exception — l'exception existante est un flag littéral, pas une
mutation de registre ni un throw ; élargir la catégorie affaiblirait la règle que la
piste éditeur exige. Micro-risque du paresseux : un oubli d'appel au bootstrap — gardé
par un test e2e existant (un level généré qui ne résout pas ses archétypes fait échouer
le test de pool de `generatedLevels.test.ts` s'il est branché sur le chemin runtime).

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
