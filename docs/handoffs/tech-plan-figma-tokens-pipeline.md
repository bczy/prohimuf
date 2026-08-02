# Tech plan — figma-tokens-pipeline (extrait retro-logué : couverture outillage scripts/)

Story: pipeline de design tokens Figma (plan complet en cours côté Bertrand, non poussé).
Author: Winston (senior-architect). Status: **plan hors repo — seul l'extrait ci-dessous
est exécuté à ce jour.**

> **Pourquoi ce shard existe (retro-log).** Le panel de la PR #161 a relevé (MAJEUR,
> traçabilité) que le « tech plan figma-tokens-pipeline » cité par la PR et par
> `fixes.md` n'existait nulle part dans le repo : le document de travail vit dans la
> session locale de Bertrand et n'a jamais été commité. Ce shard retro-logue la SEULE
> partie du plan déjà transmise et exécutée — le constat outillage ci-dessous, relayé
> textuellement par Bertrand en ouverture de la session PR #161 — pour que la citation
> soit vérifiable. Le reste du tech plan (pipeline tokens Figma proprement dit) sera
> logué ici quand il sera transmis.

## Constat outillage (Winston, relayé par Bertrand — exécuté par PR #161)

Constat : `tsconfig.json` n'inclut que `src`, `eslint.config.ts` ignore `scripts/**`,
et `tsconfig.node.json` n'est référencé par rien. Donc `rtk tsc`/`rtk lint` (et
`yarn typecheck`/`yarn lint`) ne voient aucun fichier de `scripts/`.

Directive : décider et câbler une couverture raisonnable — au minimum retirer l'ignore
ESLint sur `scripts/**` (avec les overrides Node nécessaires) et donner un chemin de
typecheck aux scripts (réutiliser ou supprimer `tsconfig.node.json`) ; vérifier que
`vitest.config.ts` (qui inclut déjà `scripts/**/*.test.mjs`) reste cohérent ; ne pas
casser le hook pre-commit lint-staged. Commit conventionnel `chore(tooling)`.

## Exécution

- Lane : `dev-tooling-assets`, tier course express (PR #161), cycle tracé dans
  [`fixes.md`](./fixes.md) (entrées 2026-08-02).
- Décision d'architecture résultante (chemin de typecheck, devDependency
  `@types/node@^24` explicite, double résolution v24/v26 acceptée) :
  [ADR-0077](../adr/0077-couverture-tsc-eslint-scripts.md) — l'ADR ship dans la même PR,
  comme l'exige la doctrine, en réponse au finding BLOQUANT du panel. Le constat de
  Winston ci-dessus vaut assignation de lane ; l'arbitrage final reste au triage
  `senior-architect` du panel de la PR.
