# `plate` — PROMPT D'ÉDITION v6 (depuis `plate-v2-reference.png`)

Auteur : concept-artist (Maud). Statut : **draft**. Non écrit dans `levelArt.json`.
Source : `public/assets/photoqte/plate-v2-reference.png` (2048×1152, validée par Bertrand).
Contexte : run 8 CI — le texte seul ne rend **ni la plongée ni la nuit**.

---

## 0. Ce que j'ai lu sur l'image validée, avant d'écrire

Nuit franche (ciel noir plein), trait à la plume type Tardi avec trame grise, deux angles
haussmanniens qui encadrent un canyon de rue noir au centre, rideaux de fer, devantures
éclairées, un réverbère et une lanterne en potence, une berline et un break garés en bas de
cadre, un scooter et un vélo à droite, une fenêtre allumée avec silhouette en haut à
droite, une plaque d'égout, huit piétons qui remontent la rue au centre, et deux enseignes
en charabia (`LAINDORETE`, `GYTTEN`).

**Le point de vue est de plain-pied, depuis le trottoir d'en face — pas une plongée.**

---

## 1. La leçon du run 8, appliquée

Le défaut n'était pas « conditionnement contre texte » : c'était **une clause de cadrage
enfouie**. Dans ma chaîne, `a plunging night view down a narrow street from a rooftop
dormer` arrivait **après** 25 mots d'ouverture de style, à l'endroit où le modèle pondère
le moins. Règle que j'en tire et que j'appliquerai désormais à toute la famille :

> **RÈGLE — le cadrage se déclare en tête, avant le style.** Le point de vue, la distance
> et l'axe sont les seuls tokens dont l'échec est invisible dans le texte et total dans
> l'image. Ils passent en position 1, jamais après une clause de tirage.

---

## 2. ⚠ Ce que je dois dire avant de livrer le prompt

**Une bascule de point de vue n'est pas une édition, c'est une re-projection.** Un modèle
d'édition ajoute, retire, repeint — il ne recalcule pas une perspective. Demander la
plongée en tête d'un prompt d'édition donne, dans l'ordre de probabilité :

1. la clause est ignorée (le run 8 en plein) ;
2. la clause est honorée **en régénérant l'image** — et on perd tout ce que Bertrand a
   validé, ce qui est le pire des deux ;
3. un entre-deux bancal : façades basculées, sol non, lignes de fuite contradictoires.

**Et une question de fond, qui n'est pas un détail de rendu :** la plongée servait la
fiction v1 (« depuis une lucarne de toit »). Or **le gameplay va mieux de plain-pied.**
D'une plongée, on voit des chapeaux, des épaules et des dessus de table ; de plain-pied on
voit **des visages, des mains sur la nappe, une serviette contre un pied de chaise, un
chauffeur debout contre sa portière** — c'est-à-dire les trois signaux qu'on vient de
passer cinq rounds à construire. L'image que Bertrand a validée est **meilleure pour la
mécanique** que celle que je réclamais.

Ma recommandation, franche : **garder l'axe de l'image validée** et déplacer le poste
d'observation dans la fiction — une fenêtre d'immeuble d'en face plutôt qu'une lucarne de
toit. C'est un changement de texte, pas d'image, et ça vaut mieux qu'une re-projection qui
peut coûter la planche entière. Je livre donc **les deux prompts**, dans cet ordre de
préférence inverse de leur numérotation.

---

## 3. E1 — prompt d'édition **avec** la bascule (celui qui a été demandé)

Court, impératif, cadrage en tête.

> `Tilt the whole view to a steep high-angle looking down into the street, as seen from a
rooftop dormer window: the pavements and the roadway open out below, the buildings seen
from above their first floor. Keep the night, the black sky, the ink linework and grey
tone, the Haussmann facades, the balconies, the roller shutters, the lit shopfronts, the
street lamps, the parked cars, the scooter and the bicycle. Add a bistro terrace under a
striped awning along the right-hand pavement: an awning, a tiled wall, plain open paving
beneath it, a warm glow from the shopfront behind. Leave the paving clear and open where
the walking figures were. Repaint every shop fascia and every sign as a plain blank
panel, smooth and unlettered.`

## 4. E2 — prompt d'édition **sans** la bascule (ma recommandation)

Une seule variable change par rapport à l'image validée : la terrasse. C'est aussi le seul
prompt qui respecte la règle d'itération à une variable.

> `Add a bistro terrace under a striped awning along the right-hand pavement, in front of
the shuttered shopfront: a scalloped awning over the pavement, a tiled wall behind, plain
open paving beneath it, a warm glow spilling from the window behind, and two street
heaters. Keep everything else exactly as it is: the night, the black sky, the ink
linework and grey tone, the Haussmann facades, the balconies, the roller shutters, the
lit shopfronts, the street lamps, the parked cars, the scooter and the bicycle. Leave the
paving clear and open where the walking figures were. Repaint every shop fascia and every
sign as a plain blank panel, smooth and unlettered.`

### Rationale (vaut pour les deux)

| Clause                                                                                   | Ce qu'elle achète                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadrage / ajout **en première position**                                                 | La leçon du run 8. En E2 la première clause est l'ajout de terrasse, seule transformation demandée.                                                                                                                                                                        |
| `Keep the night, the black sky, the ink linework and grey tone…` énuméré                 | Sans conditionnement, le texte perdait la nuit (ciel blanc, ombres de soleil). Ce que je veux conserver, je le **nomme** : une édition ne préserve de façon fiable que ce qui est cité.                                                                                    |
| `an awning, a tiled wall, plain open paving beneath it`                                  | **La plaque peint le LIEU, jamais le mobilier d'un candidat** (R8). Aucune table, aucune chaise : les sept tables arrivent en découpes avec leurs propres chaises.                                                                                                         |
| `two street heaters` (E2)                                                                | Vérité de période (novembre 1998, terrasse ouverte la nuit) et masse verticale qui ancre la terrasse au sol.                                                                                                                                                               |
| `Leave the paving clear and open where the walking figures were`                         | Formulation **positive** : je demande du pavé ouvert, pas « pas de piétons ». Les marcheurs deviennent des sprites animés, et ils occuperaient la place où les tables se composent.                                                                                        |
| `Repaint every shop fascia and every sign as a plain blank panel, smooth and unlettered` | Le charabia `LAINDORETE` signe l'IA. Formulé positivement : un panneau **peint, lisse, uni** — on décrit ce qui est là, pas l'absence de lettres. Précédent maison : la fascia boulangerie et les glyphes de la caisse de loot, lettrage composé côté render s'il en faut. |

---

## 5. Terrasse dans l'édition, ou asset séparé ? — **dans l'édition**, et fermement

- Un auvent généré à part et composité, c'est **exactement le défaut C2** que le gate a
  écrit noir sur blanc : une pièce qui n'a ni la perspective ni la lumière de la rue lit
  comme un autocollant. L'auvent est une structure attachée à un mur, avec ses fuyantes et
  son ombre portée : c'est le cas d'école de ce qu'il ne faut pas composer.
- Ce qui doit **rester séparé**, ce sont les **candidats** — les sept tables et leurs
  chaises, plus les deux berlines. Ça, c'est la règle « la plate ne porte aucun candidat »,
  et le partage est net : **l'édition livre le lieu (auvent, mur, pavé, lumière), les
  découpes livrent tout ce que la mécanique suit.**
- Bénéfice de production : une seule image à valider par Bertrand, et l'ancrage au sol de
  la terrasse n'est plus un pari.

Si la lane outillage tient à deux temps pour des raisons de coût, alors le découpage
acceptable est : temps 1 = édition rue + auvent + pavé ; temps 2 = découpes candidates.
**Pas** : auvent en asset flottant.

---

## 6. Réponses sur la famille `walkerTracks` (spec Rev.6.5)

- **Devant tout candidat + échelle ≥ 1,35×** : bon pour moi, c'est photographiquement vrai
  et ça donne au masquage une cause visible.
- **Pénombre de flou dessinée** : je la veux **dans le sprite**, pas en post — un flou
  gaussien appliqué à un trait de plume tramé bouillit la trame et sort le marcheur du
  tirage. Elle se dessine : contour plus épais et plus mou, trame plus grosse et plus
  espacée, aucun détail interne. C'est ce que fait un tirage argentique d'un premier plan
  hors profondeur de champ, et ça reste du même encrier.
- **Vitesse** : l'allure de flâneur me va, et je **ne demande pas le levier**. Un marcheur
  rapide traverserait la pénombre d'avertissement en moins d'une seconde, ce qui annulerait
  précisément ce que la pénombre achète. Le seul cas où je le réclamerais, c'est si le
  masquage devient trop rare pour être lu comme une règle — et c'est un constat de
  playtest, pas une intuition d'art.

---

## 7. Gate : avant ou pendant ?

**Le prompt d'édition, je l'écris directement** — on est en itération d'image, un aller-
retour de gate par tirage coûte plus cher qu'il ne protège, et l'image livrée sera de toute
façon jugée au gate asset, qui est le seul juge utile ici.

**Mais une chose doit être gatée AVANT le tirage, et ce n'est pas un prompt :** le choix
E1/E2, c'est-à-dire **le poste d'observation du joueur**. C'est de la mise en scène et de la
fiction (lucarne de toit vs fenêtre d'en face), ça touche `lead-art`,
`lead-game-designer` et `narrative-designer`, et si on tranche après le tirage on aura payé
une planche pour rien. Je demande cet arbitrage-là, et rien d'autre.
