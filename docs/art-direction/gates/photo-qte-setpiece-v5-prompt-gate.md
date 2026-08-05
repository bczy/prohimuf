# Photo QTE set-piece — PROMPT GATE round 5 — **PASS (avec un amendement dicté, R10)**

Gate : `lead-art` (Nico). Objet : `docs/art-direction/prompt-drafts/photo-qte-setpiece-v5.md`.
Périmètre : R7, R8, R9, `commandant_table_apres` + les deux choix contre-intuitifs portés
par la concept-artist. Rien d'autre n'était ouvert, rien d'autre n'a été rouvert : vérifié.

**Verdict : PASS.** L'écriture dans `src/game/levels/levelArt.json` est **autorisée**, et la
génération peut partir derrière (`gen-photo-sprites.yml`, token présent → pleine résolution

- kontext disponible, ce qui a une conséquence directe : voir R11).

L'amendement **R10** ci-dessous est **contraignant et intégral à ce PASS** : je le dicte au
caractère près pour qu'il n'y ait pas de round 6. On écrit la chaîne telle que je l'écris ici,
pas telle qu'elle est dans la v5.

---

## R7 — accepté, et oui, ma règle est bien une contrainte de PLACEMENT

L'observation de la concept-artist est juste et je la confirme au procès-verbal : la chaîne de
prompt de `_c` **ne bouge pas d'un caractère**, parce que le signal 1 n'a jamais vécu dans le
sprite. R7, tel que je l'ai écrit au round 4 (« its car goes back parked in the row … the
sprite chain itself needs no change beyond the placement contract »), est **une règle de
composition de scène**, pas de dessin. Elle porte sur _où l'on pose une berline par rapport à
la file_, ce qui est une donnée de placement détenue par la spec.

Conséquence que je ratifie et que je durcis : **une règle d'art qui ne vit que dans un
placement n'est pas gatée tant qu'elle n'est pas assertée quelque part.** Le gate prompt ne
peut pas la protéger — il ne lit que des chaînes. Son escalade vers `game-designer` est donc
la bonne, et j'y ajoute la formulation opposable :

> La berline de `decoy_table_c` est **rangée dans la file**, alignée avec les riverains, au
> même titre que `_d` et `_f`. Aucun leurre ne détient simultanément « voiture hors file avec
> chauffeur » et « tailleur + parapheur ».

Tant que cette ligne n'est pas assertée là où les autres contraintes de scène le sont, R7 est
**réputée non tenue**, quel que soit l'état des prompts. Je ne bloque pas le PASS là-dessus
(c'est hors de ma juridiction), mais je l'inscris comme dette ouverte au nom de `game-designer`.

Le tableau des signaux v5 est vérifié ligne à ligne : signal 1 → 3 porteurs (cible, `_a`
partiel, `_b`), signal 2 → 3 porteurs (cible, `_a`, `_c`), **aucune ligne autre que la cible
ne détient `1 ∧ 2`**. Slot de quasi-manqué n°3 supprimé, non réaffecté : conforme. Règle
générale à verser à la bible avec les trois précédentes : **acceptée telle qu'écrite** (§R7 du
draft), sous réserve qu'elle soit rédigée comme une règle de **composition de scène** et non
de prompt — je la reprendrai moi-même à l'écriture bible.

---

## R8 — accepté, et la correction du résidu est meilleure que ma propre formulation

`a clear empty stretch of terrace paving beneath it` : conforme à R8, et **supérieur à la
chaîne que j'avais dictée** (`… no tables and no chairs on it`), qui reposait sur une négation
— exactement ce que les règles FLUX de la bible interdisent. Ma formulation était une faute de
contrat sur mon propre gate ; la sienne est positive et décrit le sol, pas son manque. **Sa
version prévaut, la mienne est retirée.**

`three tables at the far end of the same terrace` : le résidu d'antécédent est réel (« further »
renvoyait aux sept découpes désormais absentes du fond) et la correction est propre — elle
situe les trois tables mortes au lieu de les compter par rapport à un ensemble disparu, et les
éloigne du pan vide où atterrissent les candidates. Accepté.

Compte R2 revérifié : dix tables, sept candidates (découpes, mobilier compris), trois mortes
(peintes). Aucune addition de mobilier sous une découpe. **PASS.**

---

## R9 — accepté tel quel

Masse verticale contre masse horizontale, casquette, main sur le montant, `facing along the
street` : conforme à R9. `the roadway clear all around it` sur le decoy est de l'absence
décrite positivement, correctement. Portière ouverte en **token cumulatif sur la seule version
maître** : conforme au round 4. `berline_plate` inchangé : vérifié.

Une réserve, qui n'est pas un blocage de prompt mais une **charge au gate asset** : `one hand
resting on the door pillar` + `the driver's door standing open beside him` posent une main au
contact d'un objet, à la jonction d'un montant et d'une portière ouverte. C'est le nid à
défauts par excellence (main fusionnée au montant, avant-bras dupliqué, main flottante
détachée). Ajouté au balayage anti-défauts obligatoire.

---

## `commandant_table_apres` — le corps du prompt est BON. L'ouverture est FAIL. R10.

Tout ce qui est **après** les deux-points est validé sans réserve, et c'est l'essentiel :
chaise reculée **et** tournée de côté (les deux tokens sont nécessaires, elle a raison), le
parapheur **ouvert avec une main à plat dessus** au moment où l'homme sort du cadre — c'est le
bon beat, et c'est une masse claire franche donc lisible à 60,2 px/su —, les deux verres dont
un vide, le paquet **toujours fermé** (garde-fou de fiction : je le note comme la meilleure
clause de la page), la fermeture verbatim. Rien à reprendre.

### Réponse à sa question 1 : non. Garder « two » n'est pas le moindre mal, ça va sortir deux personnes.

Son raisonnement d'AABB est juste ; sa conclusion ne l'est pas, parce qu'elle attribue à un
**numéral** un travail que font en réalité les **tokens de cadrage**. Ce qui fixe la boîte,
c'est `small round café table on a pavement terrace at night`, `seen at mid-distance from
slightly above`, `whole from head to shoe`, `seated upright`, `on one ground line` — pas le mot
`two`. On peut retirer le compte et garder rigoureusement tout le reste : la boîte ne bouge
pas, parce qu'aucun token de boîte n'est touché.

Et le coût de le garder est, lui, très concret. La chaîne v5 pose en tête, en position de
poids maximal, une assertion de compte **triplement redondante** — `two fully dressed
customers`, `both figures whole from head to shoe`, `both seated upright` — puis tente de la
défaire vingt tokens plus loin par `nobody on it`, c'est-à-dire **par une négation**. C'est
précisément le schéma que la bible interdit (pas de prompt qui repose sur une négation) et le
mode d'échec le mieux documenté de FLUX : le compte annoncé tôt gagne, la correction tardive
perd. **Probabilité élevée de générer deux personnes assises** — c'est-à-dire de rater le seul
message du sprite, qui est _il est parti_. C'est un FAIL de conception, pas de goût.

### RULING R10 (contraignant) — l'ouverture de `commandant_table_apres` est réécrite ainsi, verbatim

> `one fully dressed customer in a winter coat seated at a small round café table on a
pavement terrace at night, the second bistro chair beside her standing empty, seen at
mid-distance from slightly above, her figure whole from head to shoe, seated upright on a
bistro chair, both chairs on one ground line: on the left the empty bistro chair pushed
back from the table and turned aside; on the right the woman alone in her belted pale coat
over a business suit and a beret, seated upright, her document folder now lying open on the
tablecloth in front of her, one hand flat on its pages, looking down at them; on the
tablecloth two tall glasses, one of them empty, a coffee cup and the small ribboned parcel
still resting closed on the cloth; behind them the glowing awning of the bistro and a wall
of tiles, at their feet the wet pavement`

Ce que R10 conserve et ce qu'elle change, pour que ce soit vérifiable :

| Token                                                   | v5                   | R10                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `small round café table on a pavement terrace at night` | présent              | **identique**                                                                                                                                                                                                                        |
| `seen at mid-distance from slightly above`              | présent              | **identique**                                                                                                                                                                                                                        |
| `whole from head to shoe`                               | `both figures whole` | `her figure whole` — même contrainte de pied-à-tête, appliquée au sujet présent                                                                                                                                                      |
| `seated upright on … bistro chair(s)`                   | présent              | **identique**                                                                                                                                                                                                                        |
| `on one ground line`                                    | `on one ground line` | `both chairs on one ground line` — la ligne de sol est désormais tenue par **les deux chaises**, donc par le mobilier commun aux deux états, ce qui est **plus** stable qu'en v5 où elle était tenue par un personnage qui disparaît |
| compte de personnes                                     | `two` (faux)         | `one` (vrai) + `the second bistro chair beside her standing empty` (positif, en tête, à la place qu'occupait le compte)                                                                                                              |
| `nobody on it`                                          | présent (négation)   | **supprimé** — l'information est passée en tête, en forme positive                                                                                                                                                                   |
| fermeture                                               | verbatim             | **identique**                                                                                                                                                                                                                        |

L'ensemble énuméré reste **deux places + deux chaises + table + objets**, donc E2 tient et
F12(1b) mesure la même boîte : la seconde place est déclarée dès l'ouverture, simplement
occupée par une chaise vide au lieu d'un corps. Le garde-fou d'AABB qu'elle voulait est
**conservé, et déplacé sur un objet qui existe dans les deux états**.

C'est le dernier mot sur ce sprite : on écrit R10 dans `levelArt.json`, on ne rouvre pas.

---

## Réponse à sa question 2 : ratifiée et AMENDÉE — l'img2img n'est pas le repli, c'est la méthode. R11.

Le point de contrôle qu'elle porte au gate asset est **le bon point de contrôle** et je le
reprends à mon compte : deux états d'une même boîte qui ne se superposent pas transforment un
beat narratif en glitch, et un glitch est un FAIL composite.

Mais je casse l'ordre de préférence. « Même seed, et si ça ne tient pas, img2img » suppose
qu'une même graine sur **deux prompts différents** donne un décor identique. FLUX ne garantit
pas ça — la graine fixe le bruit de départ, pas la stabilité du mobilier sous un prompt
modifié. Compter dessus, c'est acheter une régénération à coup sûr. Et le token
`POLLINATIONS_TOKEN` est présent : **kontext est disponible ce coup-ci**, donc la méthode
robuste ne coûte pas plus cher que la méthode fragile.

### RULING R11 — ordre de production imposé pour LA TABLE

1. `commandant_couple` (état AVANT) est généré **en premier** et gaté en premier. C'est le
   master ; il fixe la table, les verres, l'auvent, la ligne de sol.
2. `commandant_table_apres` est **dérivé du master par img2img / kontext**, avec R10 comme
   consigne d'édition — jamais tiré à neuf. Le décor n'est alors pas re-généré, il est
   conservé : la superposition devient une propriété de la méthode, pas un pari sur la graine.
3. Le tirage à neuf n'est autorisé **qu'en repli**, si kontext échoue, et il repasse alors par
   le contrôle de superposition ci-dessous en toute rigueur.

C'est l'inverse exact de son ordre de préférence, pour la même raison qui a fait échouer
« two » : on ne fait pas reposer un invariant sur un mécanisme qui ne le garantit pas.

### Test d'acceptation de superposition (gate asset)

Overlay des deux PNG, différence. Le delta doit être **confiné** à : chaise gauche, corps de
l'homme, parapheur, main. **FAIL** si l'un de ces éléments bouge : bord de table, position des
deux verres et de la tasse, position du paquet, ligne de l'auvent, ligne de sol, mur carrelé.
Un décalage de la ligne de sol est éliminatoire même s'il est faible : c'est lui qu'on voit
sauter à l'instant du swap.

---

## Ce qui est dû MAINTENANT (avant génération)

1. **`dev-tooling-assets`** — écrire dans `src/game/levels/levelArt.json` : `berline_double_file`
   et `berline_decoy` (R9, chaînes v5 verbatim), la chaîne `plate` (R8, delta unique),
   `commandant_table_apres` **avec l'ouverture R10** (pas celle de la v5). Le diff
   `boss.$comment` reste autorisé ; `photoQte` gelé.
2. **`dev-tooling-assets`** — ordonnancer la génération selon **R11** : master d'abord,
   `_apres` en dérivation kontext ensuite. Ce n'est pas une préférence, c'est la condition du PASS.
3. **`game-designer`** — asserter le contrat de placement R7 (berline de `_c` **dans la
   file**) là où les autres contraintes de scène le sont, + l'instant de swap
   `commandant_table_apres` + les deux retraits de leurres de la fenêtre F18.
4. **`lead-art` (moi)** — verser à la bible les quatre règles (R4 amendée par R7, plus les
   trois précédentes), rédigées comme règles de composition de scène.

## Ce qui est dû au gate ASSET (sur les PNG livrés, pas maintenant)

- **Superposition au pixel près** des deux états de LA TABLE, selon le test ci-dessus.
- **Balayage anti-défauts** sur fond contrastant, avec deux zones nommées en priorité :
  (a) la **main du chauffeur sur le montant** + la portière ouverte (fusion main/objet,
  avant-bras dupliqué, main détachée) ; (b) la **main à plat sur le parapheur** de la femme
  (doigts surnuméraires, main fondue dans la nappe). Toute enclave claire fermée sur un corps
  est présumée trou de génération.
- **Compte de personnes** sur `commandant_table_apres` : **une** figure assise, une chaise
  vide. Deux figures = FAIL immédiat, et retour en img2img avec R10 durcie.
- **Chaise vide lisible comme reculée ET tournée** à 60,2 px/su : si elle lit comme « chaise en
  place », le beat ne se joue pas → FAIL.
- **`berline_double_file` vs `berline_decoy`** : la différence doit être une **masse verticale
  présente / absente** au premier coup d'œil à l'échelle plaque, sans lire le détail.
- **Plaque** : aucun bord de table ni pied de chaise peint dans le pan de terrasse destiné aux
  découpes ; trois tables mortes bien au fond.
- Loi du glow, famille, silhouette : gates habituels, inchangés.

---

**PASS round 5, sous R10 (verbatim) et R11 (ordre de production). Écriture `levelArt.json`
autorisée. Génération autorisée derrière.**
