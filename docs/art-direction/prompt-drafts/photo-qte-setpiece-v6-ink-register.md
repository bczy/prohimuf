# photo QTE paparazzi — draft v6 : le registre d'encre (« more sketchy, more comics, more like Belliard »)

Auteur : `concept-artist` (Maud). Statut : **DRAFT — attend le gate `lead-art`.**
Porte un **écart de vocabulaire de bible** (§3.1 règle 4) posé explicitement en §4.
Prédécesseurs : `photo-qte-setpiece.md` → `-v2` → `-v3` → `-v4` → `-v5`,
`photo-qte-plate-edit-v6.md`. Verdicts : `docs/art-direction/gates/photo-qte-setpiece-v5-prompt-gate.md`.

Retour Bertrand sur la plate générée : « Do something more sketchy, more comics, more like Belliard. »

## 1. Diagnostic — vérifié à 1:1, confirmé

Comparaison de deux crops à taille native :

- `public/assets/levels/belliard/street-wide.png` (6418×1248) — trait d'encre net et
  d'épaisseur constante, noirs francs, aplats gris clairs **lisses**, hachures franches.
  Zéro grain. Ça lit comme une planche (registre Tardi/Baru).
- `public/assets/photoqte/plate-signage-blanked.png` (2048×1152) — bruit granuleux
  couvrant **toute** la surface, contours dissous dans le grain, valeurs moyennes grises
  et molles. Ça lit comme une photo de nuit passée en N&B, pas comme un dessin.

Deux causes, additives, toutes deux vérifiées dans le dépôt :

1. **Le vocabulaire.** Le prompt du décor shippé (`levels[belliard].prompts.facade`)
   ne contient **aucun mot de style** : description architecturale pure. Le trait vient
   du modèle (`ideogram-v4-quality`, cf. `scripts/gen-street-paid.mjs:31` et
   `scripts/stitch-belliard-street.mjs`). Nos prompts `photoQte` ouvrent au contraire sur
   `coarse halftone toner dots` + registre xerox — on **commande** le grain, on l'obtient,
   et il mange le trait. Le diagnostic transmis est juste.
2. **Le modèle et la résolution d'édition.** La plate passe par `kontext` en img2img
   (`gen-photo-sprites.mjs`, `PLATE_MODEL`), dont la résolution d'édition observée est
   ~1024 px avant remontée à 2048 — un ré-échantillonnage qui écrase le trait fin avant
   même que le vocabulaire n'ajoute son grain. Le Belliard de référence, lui, est rendu
   en une passe **text-to-image** large sur ideogram.

Correctif complet = **les deux** : changer le vocabulaire (ci-dessous, lane concept-artist)
ET, si le `POLLINATIONS_TOKEN` rafraîchi le permet, régénérer sur le **même modèle que la
référence** (lane `dev-tooling-assets`). Le vocabulaire seul sur `kontext` améliorera, mais
ne rejoindra pas le trait Belliard.

## 2. Le nouveau vocabulaire — décrire ce qu'on veut VOIR

Principe inchangé de la maison : description positive. On ne dit pas « pas de grain », on
décrit un trait, des noirs et des aplats si complètement que le grain n'a pas de place.

### `photoQte.opening` (medium + vue)

AVANT : `Flat 2D fanzine sprite, orthographic projection, …`
APRÈS : `Flat 2D inked comic sprite, orthographic projection, …`

Rationale par clause : `inked comic` remplace `fanzine` — même famille (illustration
imprimée N&B), mais `fanzine` tire vers le photocopié dégradé alors que `comic` tire vers
la planche encrée. Le reste de l'opening (projection, compression télé, silhouette au
cadre) est inchangé : il n'est pas en cause.

### `photoQte.style` (queue partagée)

AVANT : `, photocopied fanzine xerox illustration, rough black ink linework, coarse
halftone toner dots, high-contrast black and white, flat ambient lighting, hard crisp
cut-out edges, on a flat uniform bright magenta #FF3CDC field …, no text`

APRÈS : `, black and white comic-book ink illustration, confident black ink outlines of
even weight, solid black shapes and clean flat pale grey areas, bold ink hatching where a
surface turns away, high-contrast, flat ambient lighting, hard crisp cut-out edges, on a
flat uniform bright magenta #FF3CDC field filling every gap and every space between the
shapes, no text`

| clause | ce qu'elle gagne |
| --- | --- |
| `black and white comic-book ink illustration` | medium positif ; remplace `photocopied … xerox` qui appelait la dégradation |
| `confident black ink outlines of even weight` | remplace `rough black ink linework` — `rough` autorisait le tremblement/la dissolution ; `confident … even weight` est exactement ce que la référence montre |
| `solid black shapes and clean flat pale grey areas` | remplace `coarse halftone toner dots` : c'est LA clause de remplacement. Les gris deviennent des **aplats**, pas une trame |
| `bold ink hatching where a surface turns away` | c'est le « sketchy » de Bertrand — la valeur portée par la hachure, pas par le bruit. Sans elle on tombe dans le vectoriel plat |
| `high-contrast` | conservé, sans `black and white` redondant avec l'ouverture de la clause |
| `flat ambient lighting`, `hard crisp cut-out edges`, champ magenta `#FF3CDC`, `no text` | **inchangés, verbatim** — process de keying et anti-ombre, hors sujet du retour |

Net : 56 mots contre 44. Le budget assemblé reste dans la bande tolérée (§3.1 règle 3),
chaque mot ajouté est une clause de trait justifiée ici.

### `photoQte.plate` (ouverture propre à la plate)

AVANT : `Photocopied punk fanzine xerox illustration, rough black ink linework, coarse
halftone toner dots, high-contrast black and white:`
APRÈS : `Black and white comic-book ink illustration, confident black ink outlines of even
weight, solid black shapes and clean flat pale grey areas, bold ink hatching:`

Le corps de la plate (la rue, la terrasse vide, la chaussée dégagée, les trois tables non
photographiables) est **intégralement conservé** : il porte les rulings structurels R1/R8/F20
et n'est pas en cause dans le retour de Bertrand.

### Fuites de style dans les prompts de type

Deux découpes portaient une clause de trame dans leur sujet, ce qui contredirait la nouvelle
queue partagée :

- `exchange_close` : `; toner dots large and sparse` → `; drawn with heavy black outlines
  and broad flat greys` (même intention — tenir la lisibilité en gros plan — dans le
  nouveau registre).
- `berline_plate` : `smooth and free of toner; toner dots elsewhere large and sparse` →
  `smooth and unbroken; heavy black outlines and broad flat greys elsewhere`. `free of
  toner` était en plus une formulation par soustraction, interdite §3.1.

### `plateEditB` (prompt d'édition en `editChain`)

`the ink linework and grey tone` → `the ink linework and the clean flat grey tone`.
Une clause de préservation : elle doit décrire le gris qu'on veut garder, sinon l'édition
ré-introduit la trame qu'on vient de retirer de la base.

### Non touché

`sheet` reste tel quel : le ruling de résolution §1.5 l'a rendu inerte (aucun PNG généré,
composite DOM à deux couches). Le modifier donnerait l'illusion d'une famille cohérente sur
une chaîne morte. À supprimer proprement le jour où le gate le décide, pas ici.
`plateEdit`, `plateEditA`, `plateEditA2` : étapes historiques déjà consommées (la base
`plate-signage-blanked.png` existe), non rejouées par l'`editChain` courant.

## 3. Ce que ça change pour la génération — coordination `dev-tooling-assets`

Question ouverte à la lane outillage, à trancher **avant** de dépenser une passe :
`POLLINATIONS_TOKEN` étant rafraîchi, `ideogram-v4-quality` est-il de nouveau joignable ?
Si oui, le chemin le plus court vers « more like Belliard » est de générer la plate en
**text-to-image sur le modèle de la référence**, pas en img2img `kontext` à 1024.

Contrainte à ne pas perdre dans l'échange : E-6(7) (continuité de rue avec le décor shippé)
était justement l'argument qui avait imposé l'img2img depuis un crop de `street-wide.png`.
Générer sur le **même modèle** que ce décor sert cette continuité par une autre voie —
l'identité de rendu — mais ce n'est pas la même garantie, et c'est au gate d'arbitrer.
Les découpes n'étant pas encore générées, la bascule de registre se fait au bon moment :
toute la famille change ensemble, aucun sujet tramé ne se retrouvera sur un décor encré.

## 4. Écart de bible — posé explicitement pour `lead-art`

`docs/art-direction.md` §3.1 règle 4 : « **One primary style**, stated as medium + era +
process: "photocopied 1990s punk fanzine style: rough black ink linework, high-contrast
xerox toner texture, halftone dots". Xerox is the law. » Retirer `halftone` / `xerox` de
cette famille est donc, à la lettre, un écart. Il est demandé ici pour la famille `photoQte`
seule ; `vehicles`, `enemies`, `nearForegroundArt` ne sont pas touchés.

Mon avis, à charge pour `lead-art` de trancher :

1. **La bible décrit mal ce que le jeu fait déjà.** Le décor que Bertrand cite en référence
   ne respecte pas ce vocabulaire — il n'en contient **aucun mot**. Le rendu maison shippé
   est un trait encré, pas une photocopie. La règle 4 décrit une *intention de monde*
   (fanzine 1998, tract photocopié) et la formule comme une *recette de prompt*. C'est la
   confusion qui nous a coûté cette plate.
2. **La bible se contredit déjà elle-même**, et dans notre sens : §2 note 90 dit
   « **No** heavy halftone dot-screen on the sprite: it would eat the silhouette ». C'est
   exactement le constat fait ici, à l'échelle du décor. Le v6 applique une règle existante
   plutôt qu'il n'en casse une.
3. **L'identité fanzine ne disparaît pas** : elle vit dans le N&B strict, le contraste dur,
   les aplats francs, l'absence de couleur hors néon runtime, et dans les surfaces papier du
   jeu (menus, cadres de briefing) où la texture xerox reste littérale et pertinente —
   c'est du papier montré comme papier. Un décor n'est pas une feuille de tract.

Recommandation : accorder l'écart pour `photoQte`, et **ouvrir une entrée pour `tech-writer`**
afin que §3.1 règle 4 distingue le registre-monde (fanzine N&B, la loi) de la recette-prompt
(les mots `halftone`/`xerox`, qui sont un moyen parmi d'autres et se révèlent contre-productifs
sur les grandes surfaces). Le faire en douce, famille par famille, produirait exactement la
divergence que la bible existe pour empêcher.

## 5. Variantes rejetées

- **Ne rien décrire du tout** (imiter littéralement le prompt du décor shippé, sujet nu).
  Rejeté : le décor shippé est une passe unique sur un modèle à trait fort ; les 15+ découpes
  de cette famille doivent être cohérentes ENTRE ELLES, et la queue partagée est le seul
  mécanisme qui le garantit (§3.1 règle 9). Un sujet nu sur `flux` retomberait en photoréaliste.
- **Garder `halftone` en l'adoucissant** (`fine halftone`, `subtle halftone`). Rejeté :
  une clause qui demande la trame en s'excusant est une clause qui demande la trame. Une
  variable par itération, et la variable ici est la trame elle-même.
- **`risograph` / `screen-print`** comme medium de remplacement. Rejeté : la bible cadre
  explicitement contre (« not risograph »), et le riso ramène le décalage de couches — un
  artefact de couleur sur une famille strictement N&B.
