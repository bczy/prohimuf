# 0077 — Serveur MCP level-editor : un process stdio de dev, cinq outils fermés, un seul cœur pur

- **Status:** Proposed
- **Date:** 2026-07-31
- **Number:** 0077, self-allocated via the `adr-new` discipline — no number was reserved by
  `producer` in `docs/handoffs/story-mcp-level-editor.md`. Checked against the local
  `docs/adr/`, the generated index, `origin/main` AND **every remote branch** (98 heads
  fetched, `git log --all` over `docs/adr/*.md` — highest existing number 0076). The
  0073→0074→0075 renumber is the reason this check covers unmerged branches, not just
  `main`; re-check at merge.
- **Relates to:** ADR-0074 (module de données de level + `validateLevel`/`LevelIssue` — le
  contrat que les outils consomment), ADR-0075 (`LevelPlan` composable, seam `generated/` —
  dont le §6 est amendé ici, voir D6), ADR-0063 (précédent d'un outillage d'agents porté en
  CI), ADR-0051 (discipline du seam `?preview=`).
- **Author:** `senior-architect` (Winston), sur la spec
  `docs/game-design/spec-mcp-level-editor.md` (cadrage validé par Bertrand le 2026-07-30) et
  le plan `docs/game-design/plan-mcp-level-editor.md`. Inclut le sign-off du renversement
  d'ADR-0075 §6 demandé par la story ③.

## Context

Les levels générés sont désormais entièrement descriptibles comme données (ADR-0075), mais
aucun agent ne peut les travailler sans lire le repo à la main : rien ne valide un plan avant
de l'écrire, rien ne dit quels assets manquent, rien ne fait tourner un level headless. La
story ③ de la piste éditeur ouvre cette surface. Trois forces la contraignent. D'abord, les
fonctions qui portent la vérité existent déjà et sont pures — `validateLevelPlan`,
`validateLevel`, `planToLevelConfig`/`planToLevelArt` : dupliquer une seule de leurs règles
côté serveur créerait deux définitions du mot « valide », et c'est précisément ce que la CI
et l'agent doivent partager. Ensuite, l'outil `scaffold` **écrit sur le disque du dépôt** sur
demande d'un agent : la surface d'écriture doit être fermée par construction, pas par bonne
volonté. Enfin, le catalogue `generated/index.ts` throw aujourd'hui à l'import
(`assertDistinctPlanIds`, ADR-0075 §6), ce qui rend l'import mécanique du catalogue par un
outil impossible à faire échouer proprement : l'outil crashe au lieu de rapporter une issue.

## Decision

**D1 — Un process de développement, stdio, hors du bundle.** Le serveur est
`scripts/mcp-level-editor/server.mjs` (`.mjs` comme tout `scripts/`, ce qui tranche
l'hésitation `server.ts` de la spec §4.2), transport **stdio uniquement**, enregistré dans
`.mcp.json` sur le modèle de l'entrée `codegraph`. Il ne fait pas partie de l'application :
aucun module de `src/**` ne l'importe, aucun build de jeu ne le référence. Tout autre
transport (HTTP, SSE, distant) est hors périmètre et exige un nouvel ADR.

**D2 — `@modelcontextprotocol/sdk` en devDependency, et nulle part ailleurs.** Le SDK
officiel évite de réimplémenter le protocole ; il entre en `devDependencies` et reste
interdit d'import depuis `src/**` (la loi de frontière ne bouge pas : ni `src/game` ni
`src/render` ne gagnent une dépendance).

**D3 — Cinq outils fermés, aucune règle chez le serveur.** `validate`, `inspect`,
`scaffold`, `dryrun`, `preview` — énumération fermée : pas d'outil « exec », « shell » ou
« patch ». Le serveur est un transport ; toute la logique vit dans
`scripts/mcp-level-editor/core.mjs`, module pur et testé, qui **compose** les validateurs de
`src/game` sans jamais en réécrire une règle. Un invariant nouveau s'ajoute dans
`validateLevelPlan`/`validateLevel`, jamais dans le serveur. Corollaire assumé et vérifié par
un test : **le même cœur est appelé en bibliothèque par les scripts CI, sans serveur ni
navigateur** — deux surfaces, une implémentation.

**D4 — Trois disciplines dures sur l'écriture** (décisions Bertrand du 2026-07-30, spec §2.1) :
1. écriture **uniquement** sous `src/game/levels/generated/`, chemin **dérivé** de l'id déjà
   validé (namespace contraint, refus de tout `..` ou séparateur) — jamais d'un chemin fourni
   par l'appelant ;
2. `validate` **bloquant** : un plan qui rend une issue ne touche pas le disque, et le refus
   précède tout accès disque ;
3. **jamais** de commit, de push ni d'exécution arbitraire — le geste git reste humain.

S'y ajoutent deux règles de sûreté d'écriture : écriture atomique (tmp + rename) et refus
d'écraser un module existant sans `overwrite: true` explicite. `scaffold` **n'édite pas**
`generated/index.ts` : il crée un fichier neuf et rappelle dans sa réponse la ligne
d'agrégation à ajouter — ce geste reste relu par un humain (prolongement direct d'ADR-0075
§4, « the harness only ever CREATES files »).

**D5 — Aucun secret dans le serveur.** La génération payée reste en CI ; `dryrun` et
`preview` n'utilisent qu'un vite local et Playwright local. Le process tourne sous
l'utilisateur local, sans token réseau : il n'y a rien à exfiltrer.

**D6 — ADR-0075 §6 amendé : le fail-fast d'id dupliqué passe de l'import au bootstrap, et
l'unicité devient un invariant de validation.** Le renversement est **accordé en version
étroite** :

- `assertDistinctPlanIds(GENERATED_PLANS)` quitte le corps de `generated/index.ts` ; il est
  exécuté par `registerGeneratedLevels()`, appelée **une fois au composition root**
  (`src/main.tsx`, au corps du module, avant `createRoot(...).render`). Le crash reste
  impossible à rater au démarrage de l'app — une frame plus tard, pas une de plus.
- **L'enregistrement des archétypes RESTE au corps du module.** Il n'est pas déplacé : c'est
  une mutation idempotente d'une `Map` privée, d'archétypes tous à `weight: 0` (ADR-0075 §3),
  qui ne peut corrompre aucun pool — et c'est exactement ce dont dépend le consommateur
  standalone `validateLevel.ts` (son import à effet de bord, posé délibérément au panel run-8
  pour la story ③ précisément). Ce qui bloquait l'import mécanique du catalogue était le
  **throw**, pas l'enregistrement ; seul le throw part. `registerGeneratedLevels()`
  n'enregistre rien elle-même (l'enregistrement des archétypes reste à l'import) : elle
  ne fait qu'exécuter le fail-fast, et rappeler deux fois est un no-op.
- La règle d'unicité gagne une forme *données* : `validateCatalogue(plans): LevelIssue[]`
  (code `plan/duplicate-id`) dans `levelPlan.ts`, **source unique** de la règle —
  `assertDistinctPlanIds` devient un mince wrapper qui throw sur son résultat. Elle est
  appelée par l'outil `validate`, par `scaffold` avant écriture, et asservie par un test CI
  sur le **vrai** `GENERATED_PLANS` (pas seulement sur une paire synthétique). Un id en
  collision est donc rejeté avant d'atteindre un runtime.
- Alternative écartée : amender ADR-0074 §2 pour une seconde exception d'import à effet de
  bord. L'exception existante est un flag littéral ; une mutation de registre plus un throw
  élargiraient la catégorie au point de vider la règle que la piste éditeur exige.

## Consequences

- Un agent (ou Bertrand en session) valide, inspecte, échafaude, fait tourner et voit un
  level sans lire le repo à la main ; la CI obtient le même verdict par appel bibliothèque.
  Une divergence CI/agent sur le mot « valide » devient structurellement impossible.
- La surface d'écriture agent est fermée par construction (D4). Elle reste néanmoins une
  surface d'écriture : toute extension d'outil qui écrit ailleurs que sous `generated/`, ou
  qui touche à git, est un nouvel ADR — pas une itération.
- Le fail-fast d'id dupliqué **s'affaiblit sur les surfaces non-app** : un script, un driver
  e2e ou l'outil MCP qui importe le catalogue ne crashe plus. C'est le but (l'outil doit
  rapporter, pas mourir) et c'est compensé par `validateCatalogue` en CI + dans
  `validate`/`scaffold`. Le prix accepté : entre le moment où un doublon est écrit et le
  moment où la CI ou l'app le voit, `GENERATED_LEVEL_ART` (last-wins) et `ALL_LEVELS.find`
  (first-wins) restent en désaccord silencieux — fenêtre bornée par le fait que `scaffold`
  refuse de créer un doublon et que le test CI tourne sur le vrai catalogue.
- Nouveau risque à garder vivant : **l'appel `registerGeneratedLevels()` au bootstrap peut
  être supprimé par mégarde**. Un test qui appelle lui-même la fonction dans son setup ne
  couvre PAS ce risque. Le garde doit porter sur le site d'appel réel et doit être vérifié
  par une mutation (supprimer l'appel ⇒ test rouge) — condition bloquante du sign-off, tracée
  dans `docs/handoffs/story-mcp-level-editor.md`.
- ADR-0075 §6 et sa Consequence « `assertDistinctPlanIds` throws at IMPORT time » sont
  amendés par cet ADR (note datée dans ADR-0075, sans renumérotation ni réécriture de la
  décision). ADR-0074 §2 est inchangé.
- `.mcp.json` gagne une seconde entrée : les sessions Claude chargent désormais deux serveurs
  MCP. Coût de démarrage et surface d'outils en hausse — acceptable pour un serveur local
  sans réseau, à re-peser si un troisième arrive.
- Le SDK est une dépendance de plus à maintenir (protocole jeune, versions rapides). Comme
  elle est confinée au serveur et absente du bundle, une rupture d'API bloque l'outillage,
  jamais le jeu.
- Points de contact séquencés avec SP2 (`spec-level-harness-sp2.md`) : le corps de
  `validateLevelPlan` (migration `LevelIssue[]`) et le driver §8. La seconde branche à
  atterrir rebase et adapte — aucun des deux ne duplique.
