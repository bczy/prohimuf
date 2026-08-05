# 0083 — Le sujet du panel est épinglé sur la tête de PR, et un sujet vide échoue

- **Status:** Accepted — signature de lane `dev-tooling-assets` (aucun défaut sur le diff
  workflow) et sign-off `senior-architect` du 2026-08-05 (PR #168)
- **Date:** 2026-08-05
- **Number:** 0083 — auto-alloué (max `origin/main` = 0081, plus 0082 revendiqué par la PR #145
  non mergée). **À re-vérifier juste avant le merge** : ce dépôt a déjà vu 0077 puis 0078
  changer de main entre l'écriture et la fusion, et le ruling `producer` du 2026-08-02 en tire
  la règle — un numéro n'est réservé qu'au moment du merge, jamais avant. **L'allocation
  définitive appartient à `producer`** : le sign-off architecture ne vaut pas confirmation du
  numéro, à confirmer juste avant la fusion (si #145 merge d'abord, 0082 est pris et 0083
  reste libre ; si elle est abandonnée, 0082 se libère et ce document ne bouge pas pour autant —
  on ne renumérote pas un ADR mergé).

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
4. **Les jobs en aval sautent proprement quand `prepare` échoue.** Les quatre reviewers et le
   skeptic ne conditionnaient leur `if:` que sur `preflight.outputs.enabled` (plus
   `is_fix_lane` pour trois d'entre eux), jamais sur le RÉSULTAT de `prepare`. Or les sorties
   écrites tôt par un job survivent à son échec ultérieur : les conditions restaient donc
   vraies, les cinq jobs démarraient, et mouraient au `download-artifact` sur un `panel-input`
   jamais uploadé — cinq échecs CI parlant d'un artefact introuvable au lieu d'un skip propre.
   `needs.prepare.result == 'success'` ajouté à leurs conditions. Le verdict DEGRADED est
   inchangé : `triage` tourne en `always()` et compte déjà `prepare`, donc la garantie « jamais
   de PASS creux » tient avant comme après.

## Decision (2) — le plafond de tours d'un reviewer, et ce qu'il coûte quand il tombe

Ajouté après un second incident sur la même PR #145, de nature différente mais de symptôme
identique : un verdict DEGRADED sans finding.

Le reviewer `code-review` a **épuisé son `--max-turns 40` avant d'émettre ses findings** :

```
"subtype": "error_max_turns"
##[error]--json-schema was provided but Claude did not return structured_output
```

Le job échoue donc en ne disant **rien** de ce qu'il avait déjà trouvé. C'est le pire des
échecs possibles : il coûte le run entier et ne rend aucun signal. Un reviewer qui ne trouve
rien est informatif ; un reviewer épuisé ne l'est pas.

**Décision : plafond porté à 80** pour les reviewers, à la fois dans l'action et dans le
workflow qui la double.

**C'est un budget, pas une cible.** Un reviewer qui a besoin de 80 tours relit quelque chose
de trop gros, et la bonne réponse est alors une PR plus petite — pas un plafond encore plus
haut. Le diff qui a fait tomber celui-ci pesait 23 fichiers et ~2700 lignes ajoutées, dont une
masse de documentation que les gates successifs avaient eux-mêmes produite. Plus une PR
grossit, moins elle est relisible, et la mécanique ne le signalait nulle part.

**Défaut connexe, NON corrigé ici** : le gabarit du verdict ne distingue pas « annulé »
(`cancel-in-progress` sur un push suivant), « échoué » (crash) et « épuisé » (`max_turns`).
Il dit uniformément « did not complete » et propose deux remèdes — attendre la fenêtre de
quota, faire tourner `claude setup-token` — dont **aucun** ne s'appliquait aux trois incidents
observés sur #145. Le diagnostic a coûté plusieurs tours à chaque fois, toujours au même
endroit : il fallait descendre au niveau des jobs, que le verdict n'expose pas. À traiter
séparément, dans le job de triage.

## Alternatives écartées

**`refs/pull/N/merge` comme sujet du panel.** C'est la fusion prévisionnelle : sémantiquement,
c'est la vraie question du gate (« à quoi ressemblera `main` »), et `git diff origin/main...HEAD`
depuis ce commit rend exactement l'effet net de la fusion. Écartée pour trois raisons.
(a) La ref de fusion est **calculée en asynchrone par GitHub et n'existe pas** quand la PR est
en conflit ou pas encore évaluée : on ferait dépendre le gate de merge obligatoire d'une ref
qui peut manquer ou être périmée au moment du checkout — de la flakiness sur le seul job qui
ne doit pas flaker. (b) C'est une **cible mouvante** : elle change à chaque avance de `main`,
sans aucun commit de l'auteur, alors que le verdict est publié contre `head_sha` et que les
findings citent des lignes que l'auteur doit retrouver dans sa PR. (c) Les jobs reviewers
checkoutent `pr-head` ; mettre le diff sur la fusion **rétablit exactement le divorce
sujet/arbre** que la décision 1 supprime.

**Un second passage de panel sur la ref de fusion.** Écarté : il double le coût du gate le plus
cher du dépôt (4 reviewers LLM sur chaque PR) **sans fermer le trou**. Un panel joué sur la
fusion n'est valide que jusqu'à la prochaine avance de `main` ; pour être sain il devrait
rejouer à chaque merge dans `main` — c'est-à-dire de la sémantique de merge queue, pas un job
de plus. La bonne réponse à cette classe de défaut n'est pas un second panel : c'est de
**supprimer l'écart entre la tête et la fusion** (branche à jour exigée avant merge / merge
queue), auquel cas `/head` *est* la fusion et ce panel-ci retrouve toute sa portée. Hors champ
de cet ADR, à décider séparément.

## Consequences

**Positif.** Le sujet de la relecture ne peut plus être vide en silence : soit le panel relit
le vrai diff, soit il échoue en DEGRADED, qui est bloquant. Les trois déclencheurs se comportent
enfin pareil, alors que seul `pull_request` était correct — ce qui rendait le défaut invisible
au flux normal et ne frappait que les relances manuelles.

**Négatif / à savoir.** `refs/pull/N/head` est la tête de la PR, pas la fusion prévisionnelle
avec `main` : le panel relit désormais ce que l'auteur a écrit, pas le résultat de la fusion.
C'est le bon sujet pour une revue de code — et c'est déjà ce que lisaient les reviewers via
`pr-head` — mais une régression n'apparaissant qu'à la fusion reste hors de son champ.

Il faut nommer ce risque résiduel sans le maquiller : **les gates `Lint · Typecheck · Test`
ne le couvrent que partiellement**. Ils attrapent le conflit textuel, la rupture de
compilation et la régression qu'un test existant observe déjà. Ils n'attrapent pas la
régression *sémantique* de fusion — deux branches qui se fusionnent proprement au texte et
se contredisent au comportement, dans un domaine que la suite ne couvre pas encore. La PR #159
en est la démonstration : fusion textuelle propre, gates verts, et quatre findings MAJEUR que
seul un panel rejoué **après** la fusion a vus. Ce panel, épinglé sur `/head`, ne les aurait
pas vus non plus.

La décision reste `/head` parce que les deux alternatives coûtent plus qu'elles ne rendent
(voir *Alternatives écartées*), et parce que la vraie mitigation est ailleurs : exiger la
branche à jour avant merge (ou une merge queue) fait converger tête et fusion et rend le trou
vide. Tant que ce n'est pas en place, la parade opérationnelle est celle qui a marché sur #159 —
**rejouer le panel après une fusion suspecte** (branche longuement divergente, deux PR touchant
la même surface), à la main, sur décision de `senior-architect`. C'est un filet humain, pas une
garantie du harness, et cet ADR l'assume comme tel.

Ce changement modifie le **comportement du gate de merge lui-même**, pour toute PR future.
C'est la quatrième fois que ce fichier appelle un ADR, après ADR-0063 (panel en CI),
ADR-0067 (fallback de fournisseur) et ADR-0070 (transport d'authentification) — ce qui confirme
la règle plutôt qu'elle ne l'affaiblit : ce fichier ne change pas sans décision écrite.
