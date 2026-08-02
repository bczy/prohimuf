# Décision art — les cinq emblèmes de crew sur les flyers NIVEAUX

**Statut :** gate d'acceptation visuelle rétroactive · `lead-art` (Nico) · PR #145 ·
**PASS** (2ᵉ passage : réserve bloquante R1 levée après rework)
**Portée :** les cinq marques de `FlyerMotif.tsx`, leur pose sur la feuille
(`LevelFlyer.tsx`, `LevelFlyer.module.css`) et leur attribution crew→emblème.
**Preuve jugée :** rendu réel du menu construit (écran NIVEAUX, cascade stabilisée),
lu au 1:1 et en gros plan par emblème — pas une maquette. Deux passages : un premier
sur le set d'origine (trame `halftone` pour NADIR 94), un second sur le set corrigé
(fil à plomb `plumb`).

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
  époque, pas comme cinq traitements. Vrai pour quatre pièces sur cinq au premier
  passage — la cinquième (la trame) cassait la règle et a été refaite ; **conforme sur les
  cinq depuis le fil à plomb** (R1 puis R1-bis).
- **Le mur ne clignote pas d'information.** `aria-hidden`, décor pur, aucun état porté par
  l'emblème : la couleur sémantique reste au tampon de difficulté. Bon partage.

## Verdicts par emblème

| Emblème                           | Verdict                              | Motif                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spiral` — SPIRALE 23/Belliard    | **PASS**                             | La meilleure des cinq. L'encre bave, la spirale d'Archimède se ferme sur une queue, le trait s'amincit là où le toner lâche. Vocabulaire Spiral Tribe littéral (§1) et lecture immédiate au 1:1.                                                                                                                         |
| `smiley` — Tutoriel               | **PASS**                             | Acid house, l'icône la moins chère de la décennie, yeux et bouche **percés** dans le disque (even-odd) et non peints par-dessus : c'est la logique du pochoir, pas celle de l'illustration. Masse solide, lisible à toute taille. Sur la feuille manila du mode d'emploi, il joue le rôle d'accueil sans rien promettre. |
| `rings` — KANAL SYSTEM/Stalingrad | **PASS** (réserve R2, non bloquante) | Cible hypnotique de la période, et — meilleure lecture que celle du commentaire — **onde concentrique sur l'eau** : Stalingrad, le bassin, KANAL. L'attribution devient site-spécifique au lieu d'être décorative.                                                                                                       |
| `invader` — L'Éden                | **PASS** (réserve R3, non bloquante) | Grille de carrés pleins : la chose la plus simple qu'un pochoir ou une photocopieuse tienne. Silhouette imparable, la seule des cinq qui survivrait à une troisième génération de copie.                                                                                                                                 |
| `plumb` — NADIR 94/Vitry          | **PASS** (2ᵉ passage)                | Fil à plomb, encre pleine, trou de visée **percé** en even-odd. Remplace la trame refusée au 1ᵉʳ passage (R1) ; levée en R1-bis.                                                                                                                                                                                         |

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
- **NADIR 94 → trame** (1ᵉʳ passage) : la seule qui ne disait rien. Refusée, voir R1.
- **NADIR 94 → fil à plomb** (état final) : **la meilleure attribution du mur avec la
  spirale.** Nadir = le point le plus bas ; un fil à plomb est l'instrument qui _définit_
  ce point, pas une illustration de ce point. La marque ne décore pas le nom, elle le
  démontre. Et l'objet est plausible sans effort d'époque : un crew qui pochoire une
  annonce de squat en a un sous la main — c'est de l'outillage de chantier, pas un
  symbole de graphiste. Vitry, la banlieue, le point bas de la carte : ça tient sur trois
  niveaux à la fois, et aucun n'a besoin d'être expliqué au joueur pour que la feuille
  fonctionne.

Aucune attribution ne me paraît anachronique.

## Réserves

### R1 — `halftone` / NADIR 94 : **bloquante — LEVÉE au 2ᵉ passage (voir R1-bis)**

> Conservée telle qu'écrite au premier passage : la raison du refus est ce qui rend la
> forme finale défendable, et la supprimer laisserait le prochain lecteur libre de
> reproposer la trame.

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

### R1-bis — le fil à plomb : **R1 LEVÉE**

Bertrand a tranché voie (b). Livré : `PlumbPath` — barre de suspension, fil, masse pleine
au trou de visée percé — sur le slot `hero` de la feuille NADIR 94, taille et inclinaison
inchangées. Jugé sur les deux captures du build (la feuille seule en gros plan, puis le
mur des cinq). Les quatre questions posées, dans l'ordre :

1. **§2 loi 2 refermée — oui.** Cinq encres pleines, un seul tirage. Il ne reste aucune
   pièce tonale : la valeur d'un emblème ne dépend plus que de l'opacité de sa rangée, et
   non plus de la densité interne de sa forme. C'est ce qui manquait, c'est réglé.
2. **Lecture à trois mètres, verrouillée comprise — oui.** Sur la feuille grise, sous
   `opacity: .5` × `--flyer-lock-filter`, la masse tient : elle encaisse le double
   affaiblissement exactement comme l'invader, parce qu'elle est pleine. C'était le
   symptôme aggravant de R1, il disparaît avec sa cause.
3. **Le trou de visée tient à ~100 px — oui, franchement ouvert.** Percé en even-odd
   comme les yeux du smiley : c'est un trou dans l'encre, pas un rond peint par-dessus —
   sur une photocopieuse l'un survit et l'autre boue. Il donne au passage à la masse le
   seul accident dont elle avait besoin pour ne pas se lire comme une simple flèche.
4. **Silhouette distincte des quatre autres — oui, et le set y gagne.** Le mur était
   trois marques rondes plus une masse blocky large ; le plomb est la **seule marque
   axiale verticale**, et la seule qui pointe. R2 n'est pas aggravée, elle est même un peu
   desserrée : le voisin des anneaux n'est plus un aplat indécis mais une forme
   d'orientation opposée.

Bénéfice non demandé, noté parce qu'il compte : incliner de 5° un instrument dont la
fonction _est_ la verticale n'est pas une faute, c'est le meilleur argument de la pièce —
ce n'est pas le plomb qui est de travers, c'est le tampon qui a été tapé à la main.
Garder les 5°.

**Réserves nées de ce passage — aucune bloquante :**

- **R1b-1, forme (facultatif).** La masse est un cerf-volant symétrique ; un vrai plomb a
  l'épaule ronde et son point le plus large **sous** son sommet. Tel quel, la pièce lorgne
  vers la plume à dessin / le fer de lance. Ça ne gêne pas la lecture — tout tire vers le
  bas, ce qui est le sens voulu — mais si quelqu'un y repasse : descendre le point le plus
  large d'environ un dixième de la hauteur et arrondir un peu les épaules verrouillerait
  « plomb » plutôt que « pointe ». Facultatif, pas une condition du PASS.
- **R1b-2, commentaires de code périmés — à nettoyer, ce n'est pas une reprise d'art.**
  Deux endroits de `FlyerMotif.tsx` parlent encore de la trame supprimée : le bloc de
  documentation posé juste **au-dessus** de `PlumbPath` décrit toujours « Coarse halftone
  lozenge — a photo screened down to dots », et la borne de taille de `FlyerEmblem`
  justifie encore son plancher par « the halftone reads as mud below ~70px ». Le corps de
  `PlumbPath`, lui, porte le bon raisonnement. Un commentaire qui décrit une forme
  disparue est précisément par où une trame reviendrait : à corriger par la lane
  `dev-r3f-render`. Aucune conséquence visuelle, donc pas de re-gate — la capture fait foi.

### R2 — voisinage spirale/anneaux : **non bloquante, à surveiller**

Formellement, spirale et anneaux sont cousins : même masse ronde, même graisse de trait,
tailles voisines (96 / 84 px). Aujourd'hui la confusion ne se produit pas — stocks
différents (rose vif vs gris verrouillé), la spirale a une queue franche, et une feuille
les sépare. La réserve est **conditionnelle** : si l'ordre du mur change et que les deux
se retrouvent adjacents sur des stocks proches, il faudra écarter les deux formes
(graisse ou nombre de tours). À rejuger au moment d'un éventuel repli de la pile
(la passe de pile différée de §2bis.2 pt5), pas maintenant.

### R3 — ancrage de l'invader : **non bloquante, reformulée au 2ᵉ passage**

L'attribution est validée ; c'est sa **justification écrite** que je refuse. Le
commentaire actuel défend le motif par son âge (« le sprite d'arcade avait déjà 20 ans en
1998 »), c'est-à-dire par une absence d'anachronisme. Une absence de faute n'est pas une
raison : elle rendrait le motif valable sur n'importe quel mur de n'importe quel jeu situé
après 1978, donc elle ne le rattache pas à celui-ci. C'est exactement l'argument avec
lequel on décroche un motif six mois plus tard en le prenant pour un clin d'œil geek.

**La raison à inscrire est parisienne et locale :** Invader a commencé à carreler les murs
de Paris en 1998 — l'année du jeu, la ville du jeu, et le même geste que celui du joueur,
poser de nuit quelque chose sur un mur qui ne vous appartient pas. Sur le dernier niveau,
la nuit du 31 décembre 1999, la forme porte en plus « invasion / fin de partie » sans
qu'on ait à l'écrire. Un motif défendu par ce qu'il partage avec la fiction se garde ;
un motif défendu par sa date de naissance se perd.

Rédaction demandée à la lane `dev-r3f-render`, à substituer au commentaire d'`InvaderPath`
(même passage que R1b-2, un seul aller-retour) : _« NADIR de la rue : Invader carrelait
Paris à partir de 1998 — même ville, même année, même geste que le joueur. Et une grille
de carrés pleins est ce qu'un pochoir ou une photocopieuse tient le mieux. »_ — à
reformuler en anglais comme le reste du fichier, le sens prime sur la lettre.

Note d'exécution associée (inchangée) : les deux antennes ne touchent le corps qu'**en
diagonale, par un coin**. C'est fidèle au sprite d'arcade et je ne le refuse pas — mais le
déplacement d'usure (`scale=2.1`) peut rompre ce contact et faire lire les deux carrés
hauts comme des salissures de toner à petite taille. Si l'emblème descend un jour sous
~60 px, souder les diagonales d'un cheveu.

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
   imprimées. R1 en découle directement, et le fil à plomb est ce que la règle produit
   quand on la suit.

Report dans `docs/art-direction.md` à faire par `tech-writer`, sur ce texte-ci, sans le
reformuler.

## Verdict

### 1ᵉʳ passage (set d'origine) — PASS avec réserves, une bloquante

Quatre emblèmes sur cinq passaient la gate d'asset tels quels : `spiral`, `smiley`,
`rings`, `invader`. Le cinquième, `halftone` / NADIR 94, **FAIL (rework)** au titre de
§2 loi 2 et de la règle « une marque, pas une texture » : il ne se lisait pas comme une
marque et faisait tomber la cohérence du tirage. R2 et R3 ne bloquaient rien.

### 2ᵉ passage (après rework, voie b) — **PASS**

**R1 est levée.** Le fil à plomb referme la loi de famille : cinq encres pleines, un seul
tirage, aucune pièce tonale. Il se lit à trois mètres sur feuille verrouillée comme
déverrouillée, son trou de visée reste franchement ouvert à ~100 px, et sa silhouette
axiale est la plus distincte du mur. Il vaut mieux que ce qu'il remplace, et pas seulement
parce qu'il est conforme : c'est l'attribution la mieux fondée du lot avec la spirale.

**Le set des cinq emblèmes passe la gate d'asset.** Rien ne bloque le merge de ce côté.

Réserves ouvertes, toutes non bloquantes et sans conséquence visuelle : **R1b-1** (épaule
du plomb, facultatif), **R1b-2** (deux commentaires périmés dans `FlyerMotif.tsx`),
**R2** (voisinage spirale/anneaux, conditionnel à un futur repli de la pile), **R3**
(réancrer la note d'intention de l'invader — texte fourni). R1b-2 et R3 touchent le même
fichier : un seul aller-retour `dev-r3f-render` les solde, et **aucun ne redemande mon
verdict**, puisque aucun ne change un pixel.

Verdicts (les deux passages) à reporter dans `docs/agent-handoffs.md`.
