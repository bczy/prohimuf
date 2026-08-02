# 0077 — Couvrir scripts/ par tsc et ESLint via tsconfig.node.json et @types/node explicite

- **Status:** Accepted
- **Date:** 2026-08-02
- **Number:** 0077, self-allocated (fix lane `dev-tooling-assets`, pas de `producer` dans la
  boucle — PR #161), re-checked at merge.

## Context

Les 104 fichiers du dossier scripts (103 modules .mjs et un script TypeScript) étaient
invisibles pour tout l'outillage de qualité du repo : `tsconfig.json` n'inclut que `src`,
`eslint.config.ts` ignorait `scripts/**` (avec un commentaire mensonger « linted
separately » — rien ne les lintait), et `tsconfig.node.json`, pourtant bien formé
(configs racine + `scripts/**/*.ts`), n'était référencé par aucune commande. Constat posé
par `senior-architect` dans le tech plan figma-tokens-pipeline : `yarn typecheck` et
`yarn lint` (et leurs proxys `rtk`) ne voyaient AUCUN fichier de `scripts/`, alors que ce
dossier porte le pipeline d'assets, les checks CI et les harness e2e. Contrainte
supplémentaire découverte au câblage : le typecheck Node ne compilait que par accident —
`@types/node` n'existait qu'en **transitif** (v26, hoisté via happy-dom / @types/ws /
buffer-image-size), donc un bump de n'importe laquelle de ces dépendances pouvait casser
`tsc -p tsconfig.node.json` silencieusement.

## Decision

1. **`tsconfig.node.json` est réutilisé, pas supprimé** : `yarn typecheck` enchaîne
   `tsc -p tsconfig.json --noEmit && tsc -p tsconfig.node.json --noEmit`. Le projet Node
   couvre les quatre configs racine (`vite`/`vitest`/`eslint`/`prettier.config.ts`) et
   `scripts/**/*.ts`.
2. **ESLint couvre `scripts/**`** : ignore retiré ; bloc `scripts/**/\*.mjs`en`disableTypeChecked`+ globals Node (pas de projet tsconfig possible pour du .mjs pur ;`explicit-module-boundary-types`off car insatisfiable sans annotations) ; bloc`scripts/**/_.ts`type-aware via`project: ./tsconfig.node.json`(projectService
débrayé pour ces fichiers). lint-staged étendu à`_.mjs`.
3. **`@types/node@^24` devient une devDependency explicite**, calée sur le Node 24 de la
   CI (`.github/workflows/ci.yml`). La **double résolution** qui en découle dans
   `yarn.lock` est un état ACCEPTÉ : la v24 directe est hoistée à la racine
   (`node_modules/@types/node`) et c'est elle — et elle seule — que le scan `@types` des
   deux tsconfig voit ; les v26 transitives restent nichées sous leurs dépendants
   (happy-dom, @types/ws, buffer-image-size) et ne participent pas au typecheck
   (`skipLibCheck: true` dans les deux projets couvre le reste).

Alternatives rejetées : (a) rester sur le hoisting transitif — c'est le bug latent décrit
en contexte ; (b) forcer une version unique via `resolutions` — couple les besoins de
types de l'outillage aux dépendances runtime pour un bénéfice nul tant que la copie
racine est déterministe ; (c) `checkJs` sur les 103 .mjs — hors de proportion avec le
constat, à re-décider si un besoin réel émerge.

## Consequences

- Positif : toute violation dans `scripts/` casse désormais `yarn lint`/`yarn typecheck`
  (couverture prouvée par mutation lors de la review : une variable morte injectée dans
  `scripts/` est flaggée) ; le pre-commit lint-staged corrige les .mjs stagés.
- Négatif / à surveiller : deux versions d'@types/node coexistent dans le lock. Le
  montage ne casse que si la copie RACINE cesse d'être la v24 directe (elle gagne le slot
  tant qu'elle est une dépendance directe, linker node-modules). Si un `Duplicate
identifier` ou un drift de types apparaît, le remède est de dédupliquer (bump de la
  devDep ou `resolutions`), pas de retirer la dépendance directe.
- Gotcha documenté dans `eslint.config.ts` : seul `scripts/` a un bloc .mjs — un .mjs
  ajouté ailleurs échoue au parse (projectService) et demande d'étendre le bloc ;
  lint-staged stage `*.mjs` sur tout le repo.
- La dérogation `explicit-module-boundary-types` ne vaut que pour `scripts/**/*.mjs` ;
  tout nouveau script en TypeScript reprend les règles type-aware pleines.
