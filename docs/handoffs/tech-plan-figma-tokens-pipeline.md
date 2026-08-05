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

## Preuve d'audit dépendances (panel PR #161, finding MINEUR security-review)

Extraction une-ligne-par-advisory (paquet, versions dans l'arbre, sévérité, ID,
résumé complet — champs `value`/`Tree Versions`/`Severity`/`ID`/`Issue` de la sortie
NDJSON de `yarn npm audit --recursive --json` ; ce n'est PAS le JSON brut). Run du
2026-08-02 sur le lock du head de la PR #161 — AUCUNE advisory ne concerne les paquets
ajoutés par la PR (`@types/node` 24.13.3 / `undici-types` 7.18.2) ni leurs doublons
transitifs pré-existants (26.1.1 / 8.3.0) ; les 7 advisories ci-dessous existaient déjà
sur `main` :

```
brace-expansion 1.1.16 — high — 1130588 — brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash
brace-expansion 2.1.2 — high — 1130589 — brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash
brace-expansion 5.0.7 — high — 1130591 — brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash
git-raw-commits 5.0.1 — moderate — git-raw-commits (deprecation) — Deprecated and no longer maintained. Use @conventional-changelog/git-client instead.
glob 10.5.0 — moderate — glob (deprecation) — Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
playwright 1.48.0 — high — 1109208 — Playwright downloads and installs browsers without verifying the authenticity of the SSL certificate
tar 7.5.20 — moderate — 1124287 — node-tar: Uncontrolled recursion in mapHas/filesFilter allows uncatchable stack-overflow DoS via crafted long-path tar with member selection
```

Re-run du 2026-08-05 sur le lock POST-merge de `main` (head `7fbbb36` de la PR #164) :
18 advisories — toujours **zéro** sur `@types/node` 24.13.3/26.1.1 et `undici-types`
7.18.2/8.3.0. Les 11 nouvelles lignes viennent (a) des dépendances propres au serveur
MCP level-editor arrivé de `main` (ADR-0081 : `undici` runtime ×5, `hono`, `fast-uri`,
`postcss`) et (b) d'advisories publiées entre-temps sur des paquets déjà présents
(`brace-expansion` ×3, bypass de CVE-2026-14257) — toutes hors périmètre du diff de
cette PR, à traiter côté `main` par le lane propriétaire du level-editor.
