# Décision art — les cinq emblèmes de crew sur les flyers NIVEAUX

**Statut :** gate d'acceptation visuelle rétroactive · `lead-art` (Nico) · PR #145
**Portée :** les cinq marques de `FlyerMotif.tsx`, leur pose sur la feuille
(`LevelFlyer.tsx`, `LevelFlyer.module.css`) et leur attribution crew→emblème.
**Preuve jugée :** rendu réel du menu construit (écran NIVEAUX, cascade stabilisée),
lu au 1:1 et en gros plan par emblème — pas une maquette.

## Pourquoi cette note existe

Les emblèmes ont été validés à l'œil pendant la session de dev. Regarder ensemble un
écran et l'aimer n'est pas une signature de lane : cinq marques d'identité de crew sont
une surface d'art, elle relève de la gate d'asset. Le panel CI a eu raison de le lever.
La note existe pour que la décision soit lisible plus tard sans la redéduire du SVG.

Deux remarques de cadrage, qui **jouent en faveur** de ce lot :

- Ce sont des formes **dessinées en SVG inline**, pas des sorties FLUX : aucun tirage
  généré, aucun binaire, aucune dépendance. La balise « défauts de génération IA »
  (§2 loi 3) n'a rien à mordre ici, et un correctif ne consomme pas de budget de batch
  (cap de 2 tirages par set, §6). Retravailler une marque coûte quelques lignes.
- Aucun emblème ne redéclare de couleur : tout est `currentColor` / `--ink-black`.
  Conforme au single-source des tokens (§2bis.1). Vérifié dans le code, pas supposé.

## Conformité au bible — le socle commun

- **Zéro glow (§2bis).** Rien n'émet. Le fantôme de repérage est dessiné **sous** l'encre,
  décalé de ~1 px à 28 % — c'est un défaut d'impression en deux passes, pas une ombre
  portée, donc pas de lumière. Pas de `box-shadow`, pas de blur, pas de halo. **Conforme.**
- **Une encre, formes pleines.** Période juste : une seconde couleur doublait la facture
  d'impression, les flyers free-party 1998 sont des pochoirs et du trait photocopié. Le
  `feTurbulence` + `feDisplacementMap` est exactement le dispositif de détresse déjà
  sanctionné en §2bis.1, appliqué ici à un tampon plutôt qu'à une ellipse de marqueur.
- **Une seule série d'impression (§2 loi 2).** Même encre, même filtre d'usure, même
  fantôme, tailles volontairement inégales — le mur se lit comme cinq machines d'une même
  époque, pas comme cinq traitements. C'est juste, **sauf pour un des cinq** (voir R1).
- **Le mur ne clignote pas d'information.** `aria-hidden`, décor pur, aucun état porté par
  l'emblème : la couleur sémantique reste au tampon de difficulté. Bon partage.

## Verdicts par emblème

| Emblème                           | Verdict                              | Motif                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spiral` — SPIRALE 23/Belliard    | **PASS**                             | La meilleure des cinq. L'encre bave, la spirale d'Archimède se ferme sur une queue, le trait s'amincit là où le toner lâche. Vocabulaire Spiral Tribe littéral (§1) et lecture immédiate au 1:1.                                                                                                                         |
| `smiley` — Tutoriel               | **PASS**                             | Acid house, l'icône la moins chère de la décennie, yeux et bouche **percés** dans le disque (even-odd) et non peints par-dessus : c'est la logique du pochoir, pas celle de l'illustration. Masse solide, lisible à toute taille. Sur la feuille manila du mode d'emploi, il joue le rôle d'accueil sans rien promettre. |
| `rings` — KANAL SYSTEM/Stalingrad | **PASS** (réserve R2, non bloquante) | Cible hypnotique de la période, et — meilleure lecture que celle du commentaire — **onde concentrique sur l'eau** : Stalingrad, le bassin, KANAL. L'attribution devient site-spécifique au lieu d'être décorative.                                                                                                       |
| `invader` — L'Éden                | **PASS** (réserve R3, non bloquante) | Grille de carrés pleins : la chose la plus simple qu'un pochoir ou une photocopieuse tienne. Silhouette imparable, la seule des cinq qui survivrait à une troisième génération de copie.                                                                                                                                 |
| `halftone` — NADIR 94/Vitry       | **FAIL (rework)**                    | Voir R1.                                                                                                                                                                                                                                                                                                                 |

## Attribution crew→emblème

L'attribution tient, et elle tient mieux que ce que les commentaires du code en disent.

- **SPIRALE 23 → spirale.** Découle du nom, oui. Ce n'est pas de la paresse : un crew
  free-party imprime son nom **en image** parce que le flyer doit se reconnaître à trois
  mètres, plié dans une poche, sans être lu. Spiral Tribe faisait exactement ça. Gardé.
- **Tutoriel → smiley.** Correct : c'est la feuille d'avant-le-son, l'emblème le plus
  générique de la décennie sur la feuille la moins signée. La banalité est ici le sujet.
- **KANAL SYSTEM → anneaux.** Gardé, mais **la justification à inscrire est l'onde**
  (Stalingrad, le canal), pas « la cible des flyers psy » : la seconde est un motif
  d'époque disponible pour n'importe qui, la première appartient à ce crew-là.
- **L'Éden → invader.** L'ancrage écrit dans le code (« le sprite d'arcade avait déjà 20
  ans en 1998 ») est le plus faible des deux arguments disponibles, et il expose
  l'attribution au reproche de citation gratuite. **Le vrai ancrage est parisien** :
  Invader carrelait les murs de Paris à partir de 1998 précisément. Sur le mur d'un jeu
  de logistique clandestine dans Paris 1998, un invader n'est pas une blague geek, c'est
  un tag de rue contemporain de la fiction — et sur le dernier niveau, la nuit du
  31 décembre 1999, il lit aussi « invasion / fin de partie ». Attribution **validée**,
  à condition de réancrer la note d'intention (R3).
- **NADIR 94 → trame.** C'est la seule qui ne dit rien. Voir R1.

Aucune attribution ne me paraît anachronique.

## Réserves

### R1 — `halftone` / NADIR 94 : **bloquante**

L'intention écrite dans le code est juste et sur-direction : « une photo tramée jusqu'à
ce qu'une photocopieuse puisse la reproduire ». C'est exactement le §1. **L'exécution ne
la livre pas.** Trois raisons, cumulatives :

1. **Ce n'est pas une marque, c'est une texture.** Le champ (`sin`×`cos` + diagonale) ne
   résout aucune forme quand on recule : les points ne redeviennent jamais quelque chose.
   Une trame trame **un sujet** — c'est ce qui rend une demi-teinte xerox excitante. Ici
   la trame est le sujet, donc il n'y en a pas. Un joueur ne peut pas reconnaître NADIR 94
   à cette marque, ce qui est la définition du travail demandé.
2. **Elle entre en collision avec la texture du support.** Le dot-screen uniforme de
   §2bis.1 court déjà sur toute la feuille. Poser dessus une trame plus grossière, sans
   sujet, la fait lire comme un **artefact de rendu** — un bug d'échelle du papier — et non
   comme de l'encre voulue. C'est le seul emblème du mur dont on doute qu'il soit
   intentionnel, et ce doute suffit.
3. **§2 loi 2, cohérence de famille.** Quatre tampons d'encre pleine + un aplat de points
   tonal : la cinquième pièce n'est pas du même tirage. Le bible est explicite —
   _un asset hors-famille fait tomber le set_. C'est pour ça que cette réserve bloque au
   lieu d'être un post-it.

Aggravant, non causal : sur une feuille verrouillée, `opacity: .5` × `--flyer-lock-filter`
tire l'emblème vers la valeur du dot-screen du papier lui-même. Les masses pleines
(invader) encaissent, une trame tonale non.

**Rework demandé** (au choix, non cumulatif, à repasser devant moi sur capture réelle) :

- **(a) Donner un sujet à la trame** — que le champ de points résolve une forme basse
  fréquence reconnaissable à trois mètres (visage, foule, œil, silhouette de tour), et
  **la faire déborder du bord de la feuille** en fond perdu : une photo est _posée_ sur
  la maquette, elle ne flotte pas au milieu d'une marge. C'est l'option la plus riche et
  celle qui justifie le slot `hero`.
- **(b) Remplacer par une marque d'encre pleine** propre à NADIR 94 — nadir = le point
  le plus bas : une flèche vers le bas au pochoir, un aplomb, un repère topographique.
  Option la moins chère, et elle rend le set homogène immédiatement.

Ce que je ne veux pas : garder la trame en la fonçant ou en l'agrandissant. Le problème
n'est pas la densité, c'est l'absence de sujet.

### R2 — voisinage spirale/anneaux : **non bloquante, à surveiller**

Formellement, spirale et anneaux sont cousins : même masse ronde, même graisse de trait,
tailles voisines (96 / 84 px). Aujourd'hui la confusion ne se produit pas — stocks
différents (rose vif vs gris verrouillé), la spirale a une queue franche, et une feuille
les sépare. La réserve est **conditionnelle** : si l'ordre du mur change et que les deux
se retrouvent adjacents sur des stocks proches, il faudra écarter les deux formes
(graisse ou nombre de tours). À rejuger au moment d'un éventuel repli de la pile
(la passe de pile différée de §2bis.2 pt5), pas maintenant.

### R3 — note d'intention de l'invader : **non bloquante**

Réancrer le commentaire sur Invader / Paris 1998 (cf. plus haut) plutôt que sur l'âge du
sprite d'arcade. Ce n'est pas un détail de doc : la prochaine personne qui hésitera à
garder ce motif tranchera sur la raison écrite, et « c'était déjà vieux » ne défend rien.

Note d'exécution associée : les deux antennes ne touchent le corps qu'**en diagonale, par
un coin**. C'est fidèle au sprite d'arcade et je ne le refuse pas — mais le déplacement
d'usure (`scale=2.1`) peut rompre ce contact et faire lire les deux carrés hauts comme des
salissures de toner à petite taille. Si un jour l'emblème descend sous ~60 px, souder les
diagonales d'un cheveu.

## Ce que ce lot ajoute au bible

Deux dispositifs introduits ici ne figuraient pas dans `docs/art-direction.md`. Je les
**ratifie** et les inscris comme règle (gate bible) :

1. **Le fantôme de repérage est un défaut d'impression autorisé sur surface imprimée**
   (§2bis) : second tirage de la même plaque, décalé de ~1 px, opacité ≤ ~30 %, dessiné
   **sous** l'encre. Autorisé _parce qu'il soustrait de la lumière et n'en émet aucune_ —
   même exception que l'ombre de contact ink-black de §2bis.2 pt3. Un fantôme dessiné
   **au-dessus**, flouté, ou coloré, redevient une ombre portée : interdit.
2. **Un emblème de crew est une marque, pas une texture.** Il doit se reconnaître à trois
   mètres et se distinguer de ses voisins sur le mur ; la texture du papier n'est jamais
   un emblème. C'est la loi « silhouette d'abord » (§2 loi 3) transposée aux surfaces
   imprimées. R1 en découle directement.

Report dans `docs/art-direction.md` à faire par `tech-writer`, sur ce texte-ci, sans le
reformuler.

## Verdict

**PASS avec réserves — une bloquante.**

Quatre emblèmes sur cinq passent la gate d'asset et partent tels quels : `spiral`,
`smiley`, `rings`, `invader`. Le cinquième, `halftone` / NADIR 94, est **FAIL (rework)**
au titre de §2 loi 2 et de la règle inscrite ci-dessus : il ne se lit pas comme une
marque et il fait tomber la cohérence du tirage. R2 et R3 ne bloquent rien.

Le rework de R1 ne nécessite aucune génération : il se rejuge sur une capture réelle de
l'écran NIVEAUX, comme celui-ci. Verdict à reporter dans `docs/agent-handoffs.md`.
