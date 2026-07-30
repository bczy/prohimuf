# Plan d'implémentation — Story ③ : serveur MCP level-editor

> **Pour les lanes agentiques :** exécution tâche par tâche, cases `- [ ]`. Spec :
> [`spec-mcp-level-editor.md`](./spec-mcp-level-editor.md). Branche :
> `feat/mcp-level-editor` (après merge des specs). Lanes : `dev-gameplay` (T1),
> `dev-tooling-assets` (T2-T5). L'ADR du serveur (nouveau process + devDependency) est
> rédigé en T2 et le countersign ADR-0074 §2 se prend sur T1 — les deux par
> `senior-architect`.

**Objectif** — un cœur de fonctions pures, deux surfaces : serveur MCP stdio
(interactif local) et appels bibliothèque (scripts CI SP2/SP3).

## Contraintes globales

- Décisions §2 du spec : scaffold v1 discipliné (generated/ seul, validate bloquant,
  jamais de git) · navigateur local pour dryrun/preview · SDK `@modelcontextprotocol/sdk`.
- Aucune règle de validation côté serveur : tout invariant va dans
  `validateLevelPlan`/`validateLevel`.
- Le serveur ne détient aucun secret ; la génération payée reste en CI.

### Tâche 1 — enregistrement paresseux (lane dev-gameplay, TDD, countersign architecte)

**Fichiers** : `src/game/levels/generated/index.ts`, le point d'entrée du jeu
(`src/main.tsx` ou le seam de bootstrap existant), `src/game/types/enemyTypes.ts`
(inchangé sauf si un accesseur manque), tests `generatedLevels.test.ts`.

- [ ] Test rouge : importer `generated/index.ts` ne mute plus le registre (un import nu suivi de `archetype("fixture:vigile")` rend le repli `normal`) ; après `registerGeneratedLevels()`, il résout le vigile ; l'appel est idempotent ; `assertDistinctPlanIds` n'est PLUS appelé au corps du module (un doublon d'id ne throw plus à l'import — il est rejeté par `validate`).
- [ ] Implémentation :

```ts
// generated/index.ts — plus AUCUN effet de bord au corps du module (ADR-0074 §2 :
// le catalogue redevient importable mécaniquement — la story MCP en dépend).
export function registerGeneratedLevels(): void {
  assertDistinctPlanIds(GENERATED_PLANS); // fail-fast conservé, mais au BOOTSTRAP
  for (const plan of GENERATED_PLANS) registerGeneratedArchetypes(plan.archetypes);
}
```

- [ ] Bootstrap : UN appel `registerGeneratedLevels()` au point d'entrée du jeu, avant le premier render (et dans le setup des tests qui exercent le chemin runtime).
- [ ] L'unicité des ids devient un invariant de `validateLevelPlan`-niveau-catalogue (nouvelle fonction `validateCatalogue(plans)` appelée par les tests ET par l'outil `validate`).
- [ ] Mettre à jour ADR-0075 §Consequences (l'attribution des gardes change) — petit amendement daté, pas de renumérotation.
- [ ] Commit `refactor(game): enregistrement paresseux des levels générés (clôt le countersign ADR-0074 §2)`.

### Tâche 2 — ADR du serveur + squelette

**Fichiers** : `docs/adr/00NN-mcp-level-editor-server.md` (numéro par `adr-new`, vérifié
contre TOUTES les branches distantes — la leçon 0073→0074→0075), `package.json`
(devDependency SDK), `scripts/mcp-level-editor/server.mjs`, `.mcp.json`.

- [ ] ADR : le process, la dépendance, les cinq outils, les trois disciplines d'écriture, le non-secret. Index régénéré (`gen-adr-index.mjs --write`).
- [ ] `yarn add -D @modelcontextprotocol/sdk` ; serveur stdio minimal qui s'enregistre et expose `ping` ; entrée `.mcp.json` calquée sur codegraph.
- [ ] Vérif : `claude mcp list` (ou un client de test du SDK) voit le serveur.
- [ ] Commit `feat(tooling): squelette du serveur MCP level-editor (ADR-00NN)`.

### Tâche 3 — le cœur + `validate` / `inspect`

**Fichiers** : `scripts/mcp-level-editor/core.mjs` (pur, testé —
`scripts/__tests__/mcpCore.test.mjs`), `server.mjs` (branchement).

- [ ] Le cœur charge les modules TS de `src/game` par le même loader que les tests scripts (esbuild-register ou strip-types — suivre le précédent des tests `scripts/__tests__`).
- [ ] `validate({plan}|{levelId})` : `validateLevelPlan` + `validateLevel(planToLevelConfig(plan))` + `validateCatalogue` (T1). Test : le plan cassé du spec §6 rend les issues attendues.
- [ ] `inspect({levelId})` : plan + projections + scan des chemins conventionnels (`public/assets/levels/<id>/`, `enemy_<spriteBase>*`, `plan.props[].asset`) → `{present, missing}`. Test sur le fixture : tout `missing`.
- [ ] Commit `feat(tooling): outils validate et inspect sur le cœur pur`.

### Tâche 4 — `scaffold` (écriture disciplinée)

**Fichiers** : `core.mjs` (+ template), tests.

- [ ] Test rouge : id avec `/`, `..` ou hors namespace ⇒ refus ; plan invalide ⇒ refus AVANT tout accès disque ; plan sain ⇒ fichier `src/game/levels/generated/<id>.ts` conforme au format du fixture (en-tête de commentaire compris) + rappel « ajouter la ligne d'agrégation dans index.ts » dans la réponse (l'outil ne modifie PAS index.ts : un fichier neuf seulement, la ligne d'agrégation reste un geste relu par un humain).
- [ ] Écriture atomique (tmp + rename), jamais d'écrasement d'un module existant sans `overwrite: true` explicite.
- [ ] Commit `feat(tooling): scaffold écrit un module generated/ sous triple discipline`.

### Tâche 5 — `dryrun` / `preview`

**Fichiers** : `core.mjs` (réutilise `scripts/e2e-lib.mjs` et le driver §8 généralisé de
SP2 T6 s'il a mergé, sinon l'inline du même code), `server.mjs`.

- [ ] `preview({levelId})` : démarre (ou réutilise) un vite local, rend `http://localhost:<port>/prohimuf/?preview=level&level=<id>`.
- [ ] `dryrun({levelId})` : le driver §8 headless, rend le report JSON. Test d'acceptation du spec §6 : `dryrun("fixture")` ≡ le report commité (aux timestamps près).
- [ ] Commit `feat(tooling): dryrun et preview sur le seam ?preview=level`.

### Tâche 6 — preuve « deux surfaces »

- [ ] Un test scripts appelle `validate` EN BIBLIOTHÈQUE (import direct de core.mjs, zéro serveur) — le critère §6 du spec. Une ligne dans un workflow CI existant l'exécute déjà de fait (vitest scripts).
- [ ] Commit `test(tooling): la surface bibliothèque prouve le cœur unique`.

## Auto-revue

Couverture spec : §2.1→T4 · §2.2→T5 · §2.3→T2 · §3 table→T3-T5 · §4.1/4.2→T2/T3 ·
§4.3→T1 · §5→T4 · §6→T3/T4/T5/T6. Ordre : T1 (gameplay) et T2 (tooling) parallèles ;
T3→T4→T5 séquentielles côté tooling ; T6 ferme. Croisement SP2 : seul le driver §8
généralisé (SP2 T6) est partagé — si SP2 ne l'a pas mergé, T5 inline et SP2 dédupliquera.
