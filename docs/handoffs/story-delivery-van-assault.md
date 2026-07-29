# story-delivery-van-assault — assaut scripté sur la camionnette + télégraphe

> Shard ouvert **rétroactivement** au merge gate de la PR #143 : le chantier avait
> livré son code, ses specs et ses preuves QA sans shard ni entrée d'index, ce que le
> panel a relevé (MAJEUR — « PR body's chantier inventory omits a third, undisclosed
> feature entirely »). Ce document rattrape la traçabilité ; il ne re-décide rien.

## Pourquoi ce chantier existe

ADR-0071 (gel des ennemis hors-champ) a introduit un filtre **positionnel** sur le
grignotage d'intégrité de la camionnette : seuls les ennemis à l'écran comptaient. Le
panel local de la PR #143 a immédiatement montré la conséquence — pointer la caméra sur
n'importe quelle portion de rue vide donnait `shootingCount === 0`, donc intégrité
intacte, donc `SUCCESS` + bonus (500) **à tous les coups**. L'objectif « protéger la
camionnette » se vidait de son enjeu.

L'ADR l'avait consigné comme conséquence assumée nécessitant un arbitrage
`game-designer`. Ce chantier EST cet arbitrage, et il l'a tranché autrement : plutôt que
de vivre avec l'exploit, la source de dégâts change de nature.

## Décision

Le grignotage ne dépend plus de la caméra du tout.

- `src/game/systems/deliveryAssault.ts` — nouveau système d'assaut scripté :
  `DELIVERY_ASSAILANTS`, `seatAssault`, `retireAssault`, `countAliveAssailants`,
  `reservedAssaultSlots`. Des assaillants dédiés sont **assis sur des slots réservés
  pour tout le niveau** (vague 1 incluse), pas tirés au sort dans la vague.
- `src/game/systems/deliverySystem.ts` — `DAMAGE_PER_SHOOTER_PER_SECOND` devient
  `DAMAGE_PER_ASSAILANT_PER_SECOND`. **Le terme caméra disparaît.**
- `src/game/systems/stateMachine.ts` — câblage, et réservation des slots d'assaut au
  `createInitialState`.

Conséquence directe : l'exploit d'ADR-0071 n'existe plus, parce que la règle qui le
rendait possible n'existe plus. Regarder ailleurs ne protège plus rien.

## Télégraphe (lane render/UX)

Un assaillant hors-champ qui abîme le véhicule serait la faute inverse de celle
qu'ADR-0071 corrigeait — perdre sans comprendre. D'où une couche de signalement, livrée
dans le même chantier :

- `DeliveryIntegrityBanner` (HUD) — l'état de la jauge devient lisible en permanence.
- `OffscreenArrowIndicator` + `arrowGlyph` — direction de la menace hors-cadre.
- Consommateurs de `viewport.isOnScreen` côté render, câblés via `useGameLoop` et
  `GameScene`.

> **Correction (panel PR #143, BLOQUANT).** Une version antérieure de ce shard citait aussi
> `NearForeground.tsx` parmi les consommateurs du télégraphe. **C'est faux** : son diff est
> un correctif de z-order sans rapport (masquer les rangées de props de trottoir pendant le
> tableau boss, après le signalement de Bertrand du 26/07 sur le lampadaire coupant le
> Commandant). Décrire ce fichier comme du câblage de télégraphe faisait passer du code non
> relu pour du travail gaté — exactement l'erreur que le panel existe pour attraper.
> **Tranché par Bertrand le 29/07 : le hunk est assumé**, avec sa propre traçabilité dans
> [`story-boss-tableau-kerb-occlusion.md`](./story-boss-tableau-kerb-occlusion.md). Il ne
> fait toujours pas partie de ce chantier-ci.

## Specs et preuves

| Artefact                | Chemin                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec gameplay           | `docs/game-design/spec-delivery-van-assault.md`                                                                                                                                                                                                                                                                                                                                                                           |
| Spec UX du télégraphe   | `docs/game-design/ux/spec-delivery-assault-telegraph.md`                                                                                                                                                                                                                                                                                                                                                                  |
| Preuves QA (7 captures) | `docs/qa/evidence/story-delivery-telegraph/`                                                                                                                                                                                                                                                                                                                                                                              |
| Tests                   | `src/game/systems/__tests__/deliveryAssault.test.ts`, `deliveryAssaultTick.test.ts`                                                                                                                                                                                                                                                                                                                                       |
| Harnais de capture      | `src/render/scene/deliveryHarness.ts` (`?preview=delivery&at=incoming\|delivering`), câblé dans `App.tsx` (`installDeliveryCaptureSeam`, `DELIVERY_HARNESS_PREVIEW`) et `useGameLoop.ts` (`fastForwardDeliveryState`) — miroir de `bossHarness.ts`/`?preview=boss`, produit très probablement les 7 captures QA ci-dessus. Ajouté après-coup (panel finding MAJEUR, PR #143) : le fichier existait sans être déclaré ici. |

## État

**open** — code, specs, tests et preuves livrés ; passé au merge gate dans la PR #143.

Reste ouvert (relevé par le panel, non traité ici) : aucun garde d'authoring n'empêche
un boss finale d'orphaniser une livraison en vol. La branche `bossQte` retourne tôt à
chaque tick avant le bloc livraison, et `shouldTriggerBossFinale` ne regarde pas la
phase de livraison — un futur retune (`triggerAtElapsedSeconds` plus tard,
`windowSeconds` plus long, `timeSeconds` plus court sur un niveau livraison+boss) gèlerait
le véhicule à `INCOMING`/`DELIVERING` définitivement. Le garde symétrique existe déjà
pour hostage+boss dans `createInitialState` ; celui-ci est à écrire. Owner :
`dev-gameplay`, cadrage `senior-architect`.
