# 0083 — Le sujet du panel est épinglé sur la tête de PR, et un sujet vide échoue

- **Status:** Proposed — en attente de la signature `dev-tooling-assets` et du sign-off `senior-architect`
- **Date:** 2026-08-05
- **Number:** 0083 — auto-alloué (max `origin/main` = 0081, plus 0082 revendiqué par la PR #145
  non mergée). **À re-vérifier juste avant le merge** : ce dépôt a déjà vu 0077 puis 0078
  changer de main entre l'écriture et la fusion, et le ruling `producer` du 2026-08-02 en tire
  la règle — un numéro n'est réservé qu'au moment du merge, jamais avant.

## Context

Le panel de code review en CI (ADR-0063) est le gate de merge obligatoire. Son job `prepare`
construit le sujet de la relecture : `panel-input/diff.patch` et `panel-input/files.txt`,
produits par `git diff origin/main...HEAD`.

Ce job ne pinnait aucune `ref` sur son `actions/checkout`. L'action résout alors la ref du
workflow lui-même : `refs/pull/N/merge` sur `pull_request` — correct — mais **la branche par
défaut** sur `workflow_dispatch` et `workflow_call`. Sur ces deux déclencheurs, `HEAD` valait
donc `main`, et `git diff origin/main...HEAD` était légitimement vide.

Le défaut a été constaté en production sur la PR #145 (check run 91549184645) : les quatre
reviewers ont reçu un `diff.patch` de 0 octet. L'un d'eux a refusé d'appeler ça un PASS et a
reconstruit le diff à la main — il n'a repéré l'anomalie qu'en voyant `branch=main` dans son
propre `git status`. Un panel qui relit un sujet reconstruit n'est pas un panel, et rien dans
le harness ne l'empêchait de publier un verdict malgré tout.

## Decision

1. **Épingler le checkout de `prepare` sur `refs/pull/N/head`**, sous tous les déclencheurs.
   C'est exactement le commit que les jobs reviewers checkoutent déjà comme `pr-head`, donc le
   sujet relu et l'arbre que les agents lisent deviennent un seul et même commit au lieu de deux.
2. **`prepare` échoue bruyamment sur une liste de fichiers vide.** Une PR sans changement n'a
   rien à merger : un `files.txt` vide ne peut signifier qu'un harness ayant produit le mauvais
   diff.
3. **`prepare` compte parmi les jobs dont l'échec donne DEGRADED** dans le triage. Il en était
   absent — c'est pourquoi un `panel-input` vide produisait quand même un verdict.

## Consequences

**Positif.** Le sujet de la relecture ne peut plus être vide en silence : soit le panel relit
le vrai diff, soit il échoue en DEGRADED, qui est bloquant. Les trois déclencheurs se comportent
enfin pareil, alors que seul `pull_request` était correct — ce qui rendait le défaut invisible
au flux normal et ne frappait que les relances manuelles.

**Négatif / à savoir.** `refs/pull/N/head` est la tête de la PR, pas la fusion prévisionnelle
avec `main` : le panel relit désormais ce que l'auteur a écrit, pas le résultat de la fusion.
C'est le bon sujet pour une revue de code — et c'est déjà ce que lisaient les reviewers via
`pr-head` — mais un conflit ou une régression n'apparaissant qu'à la fusion reste hors de son
champ. Les gates `Lint · Typecheck · Test` sur la fusion couvrent ce versant.

Ce changement modifie le **comportement du gate de merge lui-même**, pour toute PR future.
C'est la quatrième fois que ce fichier appelle un ADR, après ADR-0063 (panel en CI),
ADR-0067 (fallback de fournisseur) et ADR-0070 (transport d'authentification) — ce qui confirme
la règle plutôt qu'elle ne l'affaiblit : ce fichier ne change pas sans décision écrite.
