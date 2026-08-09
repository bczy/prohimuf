---

> **⚠️ SUPERSEDED — ne pas citer comme gate en vigueur.**
> Ce document juge un jeu de cinq emblèmes qui **n'est plus celui qui est livré** : il passe
> `smiley` pour le tutoriel et `invader` pour la finale, or le code ne porte plus ni l'un ni
> l'autre — le tutoriel est **non signé** et la finale porte un **lustre**.
> Le gate en vigueur est [`../decision-flyer-crew-emblems-fiction.md`](../decision-flyer-crew-emblems-fiction.md),
> arbitré par `lead-game-designer` (PASS WITH CHANGES, `5401c4e3`) et implémenté en `242199ef`.
>
> Conservé, non supprimé : son analyse de fond reste la meilleure sur trois des quatre marques
> livrées (spirale, anneaux, fil à plomb) et sur la question « citation ou fiction nouvelle »,
> et effacer un verdict de gate parce qu'un autre l'a emporté priverait le lecteur du
> raisonnement qui a mené là. Ce qu'il dit du smiley et de l'invader est en revanche caduc.

status: pass
gate: none
date: 2026-08-05
owner: narrative-designer
kind: reference
---

# Décision narration — l'attribution des cinq emblèmes des flyers NIVEAUX

**Statut :** gate narratif rétroactif · `narrative-designer` (Yasmine) · PR #145 ·
**PASS avec réserves — une bloquante (R-N1), quatre non bloquantes**
**Portée :** l'**attribution** feuille→emblème de la table `FLYER_EMBLEMS`
(`src/render/ui/menu/FlyerMotif.tsx`) et les **justifications de fiction écrites** autour
d'elle (commentaires du fichier). **Hors portée :** la forme, la lisibilité, la période
graphique, la pose sur la feuille — c'est le gate `lead-art`, déjà PASSé
(`docs/art-direction/decision-flyer-crew-emblems.md`).
**Sources jugées :** `narrative-bible.md` §1.4 / §2 / §3.2 · `pregame-copy-deck.md`
§0, §2.1-§2.5, §4.1, §9 (PASS w/ conditions 2026-07-14) ·
`spec-niveau-final-fiction.md` §1.1-§1.2, §4.1 (PASS 2026-07-20) ·
`LevelFlyer.tsx` (`PLAYABLE_COPY` / `TUTORIAL_COPY` shippés) ·
la note `lead-art` de cette même PR.

## Pourquoi cette note existe

Le panel CI relève depuis cinq tours que « quel crew possède quel symbole » est une
décision d'identité de fiction, et qu'aucune lane narrative ne l'a signée. Il a raison.
`lead-art` a jugé les marques ; il s'est prononcé sur l'attribution parce qu'un directeur
artistique honnête ne peut pas valider une forme sans regarder ce qu'elle prétend dire —
mais son verdict porte sur « aucune n'est anachronique, aucune n'est paresseuse », pas sur
« chacune est vraie dans ce monde-là ». C'est ce second jugement qui manque, et c'est
celui-ci.

Un point de méthode qui décide de tout le reste : **l'emblème est `aria-hidden`, muet, et
n'ajoute aucune chaîne au corpus.** Il n'existe donc, en tant que fiction, que dans deux
endroits : la **table d'attribution** et les **phrases qui la justifient**. Mon gate porte
sur ces deux endroits, et sur rien d'autre. Aucun pixel n'est en jeu ici.

---

## 1. La question de fond, tranchée : fiction nouvelle ou simple citation ?

Le panel dit fiction nouvelle. La défense dit citation. **Les deux ont raison d'une moitié
chacun, et la ligne de partage n'est pas là où le débat la place.**

> **Le SYMBOLE est une citation. L'ATTRIBUTION est un fait de fiction.**
>
> Qu'une spirale, un smiley acid, des anneaux concentriques, un fil à plomb ou une mosaïque
> de rue existent en 1998 n'engage personne : c'est du vocabulaire d'époque, disponible pour
> n'importe qui. Mais dire « **cette** marque est **celle de ce crew-là**, toujours la même,
> et d'aucun autre » énonce sur une entité canonique un fait qu'aucune source gatée
> n'énonçait. Le joueur le voit, il est stable d'un render à l'autre, et il sera le seul
> ancrage visuel de trois collectifs qui n'ont jusqu'ici qu'un nom. C'est du canon.

**Verdict : fiction NOUVELLE, de faible amplitude.** Trois attributions sur cinq n'existent
dans aucune source gatée, et une quatrième déplace un motif gaté d'une feuille à une autre.
Faible amplitude ⇒ **elle se canonise en cinq lignes** (§4 ci-dessous), pas en une story.
La ventilation exacte, parce que « fiction nouvelle » en bloc serait aussi malhonnête que
« simple citation » en bloc :

| Attribution                  | Statut de source                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| spirale → SPIRALE 23         | **Citation pure, déjà gatée.** `pregame-copy-deck.md` §2.2 : « Motifs : **spiral**, 23 ». Zéro fiction ajoutée.                        |
| smiley → tutoriel            | **Motif gaté, feuille déplacée.** Le deck §2.4 écrit « acid smiley » — mais sur **Vitry**. Le motif est canon, son placement est neuf. |
| anneaux → KANAL SYSTEM       | **NEUF.** Le deck §2.3 attribuait à Stalingrad un **biohazard**. Les anneaux ne sont dans aucune source.                               |
| fil à plomb → NADIR 94       | **NEUF.** Aucune source, aucune mention, aucun précédent.                                                                              |
| invader → feuille du 31 déc. | **NEUF**, et la seule qui touche une **classe d'entité** (§3).                                                                         |

**Une doctrine a également été remplacée en silence, et il faut le dire.** Le deck gaté
distribuait des motifs **partagés** (« spiral, 23 » sur les trois feuilles playables) ; le
code impose des marques **exclusives** (`kind` : « UNIQUE across the wall »). Ce n'est pas
un détail d'exécution, c'est l'inverse d'une intention gatée. **Je ratifie le changement
et je dis pourquoi :** sous le régime du deck, la spirale est sur les trois feuilles, donc
elle ne désigne plus SPIRALE 23 — une marque qui est partout n'est la marque de personne,
et le crew dont le nom EST la spirale se retrouve sans signature. L'exclusivité est la
seule règle qui rende l'attribution signifiante. Mais un mieux ne dispense pas d'un
amendement : voir **R-N3**.

---

## 2. Verdicts par attribution

| Feuille        | Marque      | Verdict                                |
| -------------- | ----------- | -------------------------------------- |
| `belliard`     | spirale     | **PASS**                               |
| `stalingrad`   | anneaux     | **PASS** (réserve R-N3, non bloquante) |
| `vitry`        | fil à plomb | **PASS**                               |
| `tutorial`     | smiley      | **PASS** (réserve R-N2, non bloquante) |
| `niveau-final` | invader     | **PASS** (réserve **R-N1, bloquante**) |

**`belliard` — SPIRALE 23 → la spirale.** Le crew imprime son nom en image. Ce n'est pas
paresseux, c'est ce que fait un flyer : il doit se reconnaître plié dans une poche, à trois
mètres, sans être lu. Et c'est **déjà écrit dans le deck gaté**. Rien à juger : la feuille
du premier gig porte la marque la plus lisible du mur, ce qui est aussi la bonne pédagogie.
PASS sans réserve.

**`stalingrad` — KANAL SYSTEM → les anneaux.** La justification écrite dans le code (« la
cible hypnotique des flyers psy ») est un motif d'époque disponible pour n'importe quel
crew : elle ne rattache rien à celui-ci. **L'ancrage juste est celui de `lead-art` : l'onde
concentrique.** Il tient sur trois plans à la fois, sans qu'aucun ait besoin d'être
expliqué au joueur — le canal est dans le nom du crew (`KANAL`), il est dans la copie
shippée de la feuille (`BORDS DU CANAL · 19e`), et une onde concentrique est aussi ce que
fait un mur d'enceintes. Un crew qui s'appelle KANAL et qui pose son mur de son au bord
d'un bassin a exactement cette marque-là. PASS ; la justification à inscrire est l'onde,
pas la cible. (C'est la même demande que la R2 de `lead-art`, formulée depuis ma lane : je
la confirme plutôt que de la doubler.)

**`vitry` — NADIR 94 → le fil à plomb.** La meilleure attribution du mur, et je pèse le
mot après avoir cherché à la casser. Nadir = le point le plus bas ; un fil à plomb n'est
pas une **illustration** de ce point, c'est **l'instrument qui le définit**. La marque ne
décore pas le nom, elle le démontre — et elle le fait sans une ligne de texte, ce qui est
littéralement la règle §2 de la bible (« nommer, ne pas raconter »). L'objet est plat et
d'époque : de l'outillage de chantier, pas un symbole de graphiste. Il tombe juste sur ce
que Vitry EST dans le corpus shippé — la verticale d'une barre, le seul niveau où Muf parle
de lui — **sans jamais y toucher**. C'est le point décisif : la marque ne romance rien,
elle ne commente pas la mélancolie du niveau, elle se contente d'être exacte. Une marque
qui aurait « raconté » Vitry aurait été un FAIL. PASS sans réserve.

**`tutorial` — le smiley : le regard à part.** L'objection est bonne et il faut la prendre
au sérieux : la feuille porte `SANS SYSTÈME · AVANT LE SON`, donc lui donner « l'emblème
d'un crew qui n'existe pas » serait un contresens.

> **Ce n'est pas un contresens, c'est la meilleure lecture du lot — à condition de la
> nommer.** Le smiley acid n'appartient à personne : c'est l'icône commune de la décennie,
> celle que tout le monde photocopie parce que personne ne l'a signée. La feuille du
> tutoriel n'est pas un gig — le deck §2.1 en fait « un **vieux** flyer photocopié que
> DISPATCH a annoté à la main » : une feuille sans système, sans info-line, sans date, une
> feuille que personne ne revendique. **Une feuille non signée reçoit la marque de tout le
> monde ; une feuille signée reçoit une signature.** La banalité du smiley est ici le
> sujet, et non un défaut.

Ce qui est faux, ce n'est donc pas l'attribution : c'est le **mot** « emblème de crew »
appliqué à elle. Voir R-N1/R-N2.

---

## 3. `niveau-final` — l'invader, et la seule vraie faute du lot

Ici l'énoncé du problème est déjà faux, et c'est ce qui a caché la faute jusqu'à
maintenant. La demande de gate décrit la feuille finale comme « **crew : L'Éden** ». Elle
ne l'est pas. Le canon shippé et gaté dit deux choses opposées :

- `LevelFlyer.tsx` `PLAYABLE_COPY["niveau-final"].crew` =
  **`SPIRALE 23 · KANAL SYSTEM · NADIR 94`** — les trois crews réunis, le payoff de la
  finale (`spec-niveau-final-fiction.md` §4.1, PASS 2026-07-20). L'Éden n'est pas dans le
  champ `crew` : il est dans la `zoneLine` (`L'ÉDEN · ANCIEN DANCING`).
- `narrative-bible.md` §1.4 classe **l'Éden en « Lieu (finale) »**, pas en collectif, et
  pose la règle : « Aucun nom hors de cette liste n'existe » — avec des **classes
  d'entités volontairement séparées** (`pregame-copy-deck.md` §9 : « ne jamais fusionner »).

Conséquence : **documenter l'invader comme « l'emblème de L'Éden » donne une marque de crew
à un bâtiment**, c'est-à-dire promeut un lieu au rang de collectif. C'est la seule chose de
cette PR qui contredit le canon — et elle ne se voit pas à l'écran, elle est dans les
phrases. C'est aussi la question exacte que le panel posait : qui possède ce symbole ?
**Réponse : personne, et c'est la seule réponse qui tienne.**

**L'attribution est validée sous cette lecture-ci**, qui est aussi la plus forte du mur :

> L'invader ne se lit pas comme la marque d'un crew mais comme **une mosaïque de rue** :
> quelque chose que quelqu'un a posé de nuit sur un mur qui ne lui appartenait pas — le
> geste du joueur, dans la ville du joueur, l'année du jeu (`lead-art`, R3). Sur la feuille
> du 31 décembre 1999, la seule feuille dont le champ `crew` porte **trois** noms, aucune
> marque de crew ne pouvait fonctionner : quatre systèmes sur une feuille qui en réunit
> trois. **C'est la ville qui signe la dernière feuille**, et c'est juste.

Et cela referme la symétrie que rien nulle part n'a écrite, alors qu'elle est ce que le mur
a de mieux : **les deux feuilles sans crew — le tutoriel et la finale — portent les deux
marques sans propriétaire.** Trois crews, trois signatures ; deux feuilles que personne ne
revendique, deux marques que personne ne possède. Cinq marques, zéro exception.

**Deux contrôles complémentaires, tous deux verts :**

- **Discipline anti-spoiler** (`spec-niveau-final-fiction.md` §4.1, ux D3) : la feuille
  nomme la teuf, jamais l'antagoniste. L'invader ne nomme ni ne montre le Commandant, ne
  dit ni flic ni descente. La lecture « invasion / fin de partie » relevée par `lead-art`
  reste **disponible et non énoncée** — ce qui est exactement le régime « name it, don't
  narrate it » (bible §2). **PASS**, tant qu'aucune copie ne la glose (R-N5).
- **Risque méta.** muf est un remake d'un jeu Atari ST de 1987 : un Space Invader sur la
  dernière feuille peut se lire comme un clin d'œil à l'héritage arcade **du jeu lui-même**,
  c'est-à-dire une sortie de diégèse. `lead-art` a refusé cette défense ; **je la refuse
  aussi et j'en fais une règle** : l'invader est un carrelage de rue parisien de 1998,
  jamais une référence arcade. Le mot « arcade » ne doit pas se retrouver à côté de lui,
  ni dans la copie, ni dans un commentaire, ni dans un alt.

---

## 4. Ce que ce lot ajoute au canon

Cinq lignes, à replier dans `narrative-bible.md` (§1.4 ou une §1.5 « Marques de feuille »)
après le merge — la branche est antérieure à la bible, le fichier n'y existe pas encore
(R-N4). **Elles ne créent aucune entité, aucun nom, aucune réplique.**

1. **Une feuille, au plus une marque, unique sur le mur.** Une marque partagée par
   plusieurs feuilles ne désigne plus personne.
2. **Trois marques appartiennent à un crew :** SPIRALE 23 → la **spirale** (son nom en
   image) · KANAL SYSTEM → les **anneaux concentriques** (l'onde du canal, et celle d'un
   mur d'enceintes) · NADIR 94 → le **fil à plomb** (l'instrument qui définit le point le
   plus bas).
3. **Deux marques n'appartiennent à personne, et c'est leur sujet.** La feuille du
   tutoriel (`SANS SYSTÈME · AVANT LE SON`) porte le **smiley acid**, l'icône commune de la
   décennie. La feuille du 31 décembre 1999, dont le champ `crew` réunit les trois
   systèmes, porte l'**invader**, un carrelage de rue : la ville signe. **L'Éden est un
   lieu, pas un collectif — il n'a pas d'emblème et n'en aura pas.**
4. **Une marque est un tampon, pas un logo.** Pas de version officielle, pas de gabarit :
   tailles et inclinaisons inégales, encre fatiguée, cinq machines d'une même époque.
   L'ours du fanzine dit « Ni pub, ni logo, ni adresse » (`pregame-copy-deck.md` §4.1) et
   rien ici ne le contredit — un tampon tapé à la main n'est pas une identité de marque.
5. **Interdiction de glose.** Aucune copie player-facing — flyer, briefing, alt,
   `PARIS-MINUIT`, feuille verrouillée — ne nomme, n'explique ni ne commente un emblème.
   Une marque qu'il faut expliquer a déjà échoué.

**Contrôle de cohérence sur la feuille verrouillée** (`LOCKED_COPY`, deck §2.5) : l'emblème
reste rendu sous `opacity: .5`, aux côtés du nom de crew qui « reste lisible ». C'est
cohérent, et je l'enregistre pour que personne ne le rouvre : la marque **est** le nom sous
forme d'image ; la retirer au verrouillage retirerait l'information que le deck demande
justement de garder. Ce qui est retenu sur une feuille verrouillée, c'est la date, le RV et
la ligne — pas l'identité. **PASS.**

---

## 5. Réserves

### R-N1 — le vocabulaire « emblème de crew » : **BLOQUANTE** (texte seul, zéro pixel)

Deux endroits du code affirment une fiction fausse sur 2 feuilles / 5 :

- l'en-tête de `FlyerMotif.tsx` : « The single ink stamp **each crew** printed on its
  flyer » — or le tutoriel n'a **pas** de crew (`SANS SYSTÈME`) et la finale en a **trois** ;
- le champ `FlyerEmblem.kind` : « **Which crew's mark.** » — même défaut, et c'est la
  phrase que le prochain auteur lira en premier.

Ajoutée à la ligne de la table qui associe l'invader à `niveau-final`, cette formulation
canonise **L'Éden comme crew** : une classe d'entité que `narrative-bible.md` §1.4 interdit
de fusionner.

**Pourquoi je bloque alors que `lead-art` a laissé sa reformulation (R3) non bloquante :**
parce que l'emblème est muet et `aria-hidden`. La phrase **est** l'artefact de ma lane —
ici, ce qui affirme la fiction, c'est le commentaire. Un commentaire qui donne une marque
de crew à un bâtiment est, dans mon registre, ce que serait une réplique fausse dans celui
de `dev-gameplay`. Le coût est de quelques lignes, dans le **même aller-retour**
`dev-r3f-render` que les R1b-2 / R3 de `lead-art` (même fichier, un seul passage).

**Demandé** (sens imposé, lettre libre — à rédiger en anglais comme le reste du fichier) :

- En-tête : la marque d'encre que porte chaque feuille — **trois appartiennent à un crew,
  deux n'appartiennent à personne** (le tutoriel n'a pas de système, la finale en réunit
  trois) ; renvoyer à cette note.
- `FlyerEmblem.kind` : « quelle marque porte cette feuille », **pas** « la marque de quel
  crew ». Unicité conservée telle quelle, elle est juste.
- Table : la ligne `niveau-final` **ne doit pas** associer l'invader à « L'Éden ». Formuler
  l'ancrage comme en §3 : la feuille des trois systèmes, marquée par la rue.
- L'identifiant `CrewMotif` peut rester tel quel : c'est du code, pas de la fiction, et je
  ne demande pas un renommage pour un mot. **Ma réserve porte sur les phrases, pas sur les
  symboles.**

**Levée :** aucune re-passe de ma part n'est nécessaire si le sens ci-dessus est tenu —
aucun pixel ne change, et je ne rejuge pas une reformulation.

### R-N2 — écrire la symétrie des deux feuilles sans système : non bloquante

La meilleure idée du mur (§3) n'est écrite nulle part, donc elle sera défaite par le
prochain qui ajoutera un niveau et cherchera « quel emblème pour ce crew ». À inscrire au
même passage que R-N1, une phrase suffit : _les feuilles signées portent une signature ;
les feuilles que personne ne revendique portent une marque que personne ne possède._

### R-N3 — amendement dû au `pregame-copy-deck.md` (§2.2-§2.4) : non bloquante, **due**

Le deck **gaté** (PASS w/ conditions 2026-07-14) écrit encore : Stalingrad → « biohazard »,
Vitry → « acid smiley », et une distribution **partagée** (« spiral, 23 » partout). Les
trois énoncés sont superseded par ce qui ship. **Aucun mot joueur ne change**, donc rien ne
bloque cette PR — mais laisser deux documents gatés se contredire est précisément ce qui a
produit les contradictions C-1→C-8 de la bible. À solder par un bloc **AMENDEMENT** en fin
de deck (ma lane, re-gate court par `lead-game-designer`), sur le précédent formel de
l'AMENDEMENT A1 de `spec-niveau-final-fiction.md`. Il doit acter : (i) doctrine exclusive,
avec la raison du §1 ; (ii) biohazard → anneaux ; (iii) le smiley quitte Vitry pour le
tutoriel, où il ne signifie plus « euphorie sur la mélancolie » mais « personne » ; (iv)
Vitry → fil à plomb. Sans quoi le prochain auteur relira « biohazard » comme canon.

### R-N4 — repli dans la bible : non bloquante

Cette branche est antérieure à `narrative-bible.md` (absente du worktree). Après le merge,
replier les cinq lignes du §4 dans §1.4/§1.5. Ma lane, une passe courte.

### R-N5 — interdiction de glose : non bloquante, permanente

Règle de veille, pas une action : si un jour une copie player-facing tente de nommer,
d'expliquer ou de commenter une marque — un alt, une légende, une réplique, une ligne de
`PARIS-MINUIT` —, elle est refusée d'office. Cela vaut en premier lieu pour l'invader (« ce
n'est pas une référence arcade » ne doit jamais avoir besoin d'être dit **dans le jeu**).

---

## 6. Conformité boucle & périmètre

- **Zéro mécanique**, **zéro chaîne player-facing** ajoutée ou modifiée par ce gate.
- **Zéro touche à la boucle.** `Récupérer → Livrer → Éviter` inchangée ; « une mission =
  3-5 minutes » intacte — un emblème n'ajoute aucune scène et ne gate rien.
- **Zéro code de ma part.** `src/**` appartient à `dev-r3f-render` ; mes réserves sont des
  demandes de rédaction, jamais des diffs.
- **Cahier des charges.** _Prohibition_ (Atari ST, 1987) n'avait quasiment aucune
  narration : la couche narrative est une extension consciente, déjà ratifiée (ADR-0012,
  `pregame-copy-deck.md` §9 pour le registre imprimé et les trois crews). Ce lot **étend**
  cette extension d'un cran mesuré — trois signatures et deux marques sans propriétaire —
  et cet ajout est **canonisé au §4**, pas laissé implicite. Il n'ouvre aucune fiction
  au-delà : ni personnage, ni faction, ni lieu, ni nom.
- **Période.** Rien à re-litiger côté forme (gate `lead-art`) ; côté fiction, aucune des
  cinq marques n'exige un objet, un mot ou une pratique post-1998. `art-advisor` (Estelle)
  reste la lane à consulter si l'ancrage parisien de l'invader devait un jour être daté à
  l'année près — ce que rien ici ne demande.

---

## Verdict

**PASS avec réserves — une bloquante, quatre non bloquantes.**

Les cinq attributions sont **validées telles que le joueur les voit**. Aucune ne contredit
le canon dans sa forme ; deux le renforcent (le fil à plomb, la spirale) ; une le contredit
dans sa **justification écrite** et doit être reformulée avant merge (**R-N1** :
l'invader n'est l'emblème ni d'un crew ni de L'Éden — c'est la ville qui signe la feuille
des trois systèmes).

Sur la question de fond : **fiction nouvelle**, pas simple citation — mais de faible
amplitude, et **canonisée ici en cinq lignes** plutôt que renvoyée à une story. Le symbole
citait ; l'attribution énonce.

Réserves ouvertes : **R-N1** (bloquante, rédaction, même aller-retour `dev-r3f-render` que
les R1b-2/R3 de `lead-art`), **R-N2** (écrire la symétrie), **R-N3** (amendement dû au
copy deck, ma lane), **R-N4** (repli dans la bible après merge, ma lane), **R-N5** (veille
permanente). Aucune ne change un pixel ; **aucune ne redemande mon verdict**, R-N3 exceptée
qui va au gate `lead-game-designer` par sa propre porte.

Verdict à reporter dans `docs/agent-handoffs.md`.
