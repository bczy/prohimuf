# 0072 — Assaut de livraison : slots réservés au niveau et identité par plage d'id

- **Status:** Proposed
- **Date:** 2026-07-29
- **Number:** 0072, auto-alloué (aucun `producer` dans la boucle — le TECH PLAN §5.2 prévoyait
  que Marion alloue). Vérifié contre les fichiers locaux, `docs/adr/README.md` ET `origin/main`.
  À re-vérifier au merge.
- **Rédaction :** `tech-writer`, contenu repris du TECH PLAN `senior-architect` (Winston,
  2026-07-26) §5.2 et de `spec-delivery-van-assault.md` Rev.2 §D1/D2.6/D2.8. **La décision
  est celle de l'architecte** ; cet ADR la met en forme, il ne la re-litige pas.

## Context

ADR-0071 gèle les ennemis hors-champ. Le grignotage d'intégrité de la camionnette lisait
alors `SHOOTING` en continu, filtré par la position caméra — ce qui rendait l'objectif
« protéger la camionnette » **gratuit** : regarder ailleurs suffisait à préserver la jauge.

L'arbitrage rendu (spec `spec-delivery-van-assault.md`) supprime la règle plutôt que de
composer avec : des **assaillants scriptés** dédiés remplacent le comptage caméra-filtré, et
`deliverySystem` passe de `DAMAGE_PER_SHOOTER_PER_SECOND` à
`DAMAGE_PER_ASSAILANT_PER_SECOND` — plus aucun terme caméra, ni aucun terme d'état de pop-up.

Le TECH PLAN §5.2 tranche que ce mécanisme **exige son propre ADR**, non pas parce que la
règle de dégâts change — la spec et le fil de la story le documentent mieux qu'un ADR — mais
parce qu'il embarque **un invariant inter-modules et une convention**, tous deux invisibles
depuis les fichiers qui doivent les respecter.

## Decision

### 1. Les slots d'assaut sont réservés pour TOUT le niveau

`reservedAssaultSlots(facade, spec)` réserve les emplacements de l'assaut dès
`createInitialState`, vague 1 incluse. **Tout consommateur de slots doit honorer cette
réservation** — les deux sites d'appel de `spawnWave` _et_ l'éligibilité des caisses
(`lootSystem`).

C'est un invariant à l'échelle du niveau, et rien dans `enemySystem.ts` ni dans
`lootSystem.ts` ne laisse deviner qu'y asseoir une entité peut **silencieusement vider un
objectif du cœur de boucle**. Ce mode de défaillance a déjà été trouvé **deux fois en revue**
(K-3, puis K-8) avant qu'une ligne ne soit écrite ; la troisième fois, ce sera dans six mois,
par quelqu'un qui retouche la géométrie des fenêtres. C'est la définition même d'une décision
que les contributeurs futurs ne doivent pas re-litiger.

La couture reste **agnostique de la livraison** : `tickLoot`/`attemptSpawn` reçoivent un
`excludeSlots: readonly number[] = []` et rien de forme « livraison » n'entre dans
`lootSystem` — le `stateMachine` assemble les nombres, exactement comme il le fait déjà pour
`deliveryGap`. Seules des données pures traversent la couture.

### 2. L'identité d'un assaillant est une convention de plage d'id

`id >= DELIVERY_ASSAULT_ID_BASE` (900000) discrimine un assaillant, via
`isDeliveryAssailant(e)`. Le choix est délibéré : élargir le type `Enemy` d'un champ typé
aurait été possible (l'overrule était pré-autorisé), mais coûtait une frontière.

La convention est donc **garantie par les tests, pas par le système de types**. D'où l'ADR :
une convention avec un rationale documenté est une décision ; une convention sans rationale
est du folklore.

### 3. La règle de dégâts ne contient plus ni caméra ni état de pop-up

Acté ici pour mémoire : `deliverySystem` reste sans façade et sans caméra — le module
arithmétique n'acquiert **pas** d'import `FacadeMap`. Cette décision **supersede le choix
implicite du filtre caméra** et referme la puce §Négatif d'ADR-0071 (« l'objectif devient
gratuit »).

## Consequences

**Positif**

- L'exploit d'ADR-0071 n'existe plus, parce que la règle qui le rendait possible n'existe
  plus. Regarder ailleurs ne protège plus rien.
- L'invariant de réservation est écrit une fois, à un endroit trouvable depuis les deux
  modules qui doivent l'honorer.
- La frontière `src/game` tient : `deliverySystem` reste pur et arithmétique, `lootSystem`
  reste ignorant de la livraison.

**Négatif / à surveiller**

- **La plage d'id n'est pas vérifiée par le compilateur.** Un futur `spawnWave` qui émettrait
  des ids ≥ 900000 casserait le discriminant sans une seule erreur de type. Les tests sont le
  seul filet ; ADR-0055 D5 et ADR-0056 D9-2 ont le même profil de risque et le même filet.
- Les slots réservés réduisent d'autant les emplacements disponibles pour les vagues et pour
  les caisses, sur toute la durée du niveau. Sans effet pratique aux densités actuelles (les
  slots sont bien plus nombreux que les entités d'une vague), mais c'est une contrainte de
  plus à respecter si la géométrie des fenêtres est resserrée.
- Aucun garde d'authoring n'empêche encore un **boss finale d'orphaniser une livraison en
  vol** : la branche `bossQte` retourne tôt à chaque tick, avant le bloc livraison, et
  `shouldTriggerBossFinale` ne regarde pas la phase de livraison. Le garde symétrique existe
  pour hostage+boss dans `createInitialState` ; celui-ci reste à écrire. Aucun niveau livré
  ne déclenche le cas (niveau-final : résolution à t=24 s contre `timeSeconds` 70). Owner :
  `dev-gameplay`. Suivi :
  [`docs/handoffs/story-delivery-van-assault.md`](../handoffs/story-delivery-van-assault.md).

## Précédent

`ADR-0055 D5` (`excludeSlots` pour les caisses) et `ADR-0056 D9-2` (l'écart x caisse/livraison)
sont des décisions **plus petites** que celle-ci et ont toutes deux reçu un ADR. Ne pas en
écrire un ici aurait été incohérent avec le propre historique du projet.
