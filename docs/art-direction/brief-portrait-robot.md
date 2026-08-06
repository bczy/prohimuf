# Brief artistique — scène PORTRAIT-ROBOT

- **Lane :** `lead-art` (Nico) — brief de cadrage, stage 0/1. **Aucun prompt, aucun asset.**
- **Date :** 2026-08-05
- **Entrées :** `docs/research/research-photofit-robocop-atari-st.md` (§6 + encadré d'arbitrage),
  `docs/art-direction.md` (la bible, elle gagne), `docs/art-direction/prompt-drafts.md`,
  `docs/art-references/`, forme de famille : `src/game/levels/levelArt.json`.
- **Arbitrage fondateur (Bertrand, 2026-08-05) :** « pas forcément numérisée, on peut garder la
  direction artistique très BD comics actuelle ».
  → **La ST donne la mise en scène. La bible donne le trait.** Rien d'autre n'est emprunté à 1988.

---

## Note de révision — 2026-08-05 (rév. 2, post-gate design + amendements Bertrand §8)

Trois faits sont redescendus du `design-gate-portrait-robot.md` (§3 valeurs canoniques + §8
amendements post-gate) et d'ADR-0080/0081. Ils touchent la composition de l'écran, pas seulement
la production. Ce qui a changé dans ce brief :

| #   | Ce qui a bougé                                                                                                                                                                                                                                       | Où c'est traité ici                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CTA `SORTIR LA TÊTE` supprimé** (Bertrand B1). Plus de bouton, plus de zone d'écran, plus de focus. La scène se valide seule à 4/4 (A12bis). Un **moment visuel neuf** apparaît : **le VERROUILLAGE**, seul signal de toute la scène (A16).        | **§3bis (neuf)** — le verrouillage, proposition DA. Le CTA disparaît de §3 et §6.                                                         |
| 2   | **Chrono en jauge continue**, sans nombre ni unité (B2 / A13). `TÉLÉCARTE · {n} UNITÉS` est mort.                                                                                                                                                    | **§4bis (neuf)** — comment se dessine une jauge qui se vide en DA fanzine.                                                                |
| 3   | **Bandes JOINTIVES** (maquette Figma `muf — Design System`, page `Écrans · Portrait-robot`, corrigée en direct par Bertrand) : aucune couture, aucun écart, aucun trait de séparation. Une seule surface continue, au gabarit **exact** de la cible. | **§1.0 (neuf)** — la règle de raccord passe de bonne pratique à condition d'existence ; **§1.2bis** — bleed, repères, tolérance chiffrée. |

Deux corrections que le gate me fait redescendre, et que j'accepte sans réserve :

- **Mon §4 était faux.** Il justifiait l'hypothèse « monde de jeu » par « un chrono **qui coûte une
  vie** ». La scène **ne peut retirer aucune vie**, toutes issues confondues (gate A1, story AC5) ;
  la sanction est **−20 d'énergie sur le capital initial du niveau suivant** (A1c). L'argument est
  retiré, la conclusion aussi.
- **Ma question ouverte 7.3.5 est close par ADR-0080/0081** : la scène n'est **ni monde de jeu ni
  surface pré-jeu**, c'est une **surface DOM interactive**. Conséquences DA, appliquées ci-dessous :
  le **liseré néon de sélection est légitime** (la bande est manipulée, donc elle brille — loi du
  glow, §2 loi 1), la **cible reste sans glow**, et le **CRT §8 de la bible ne s'applique pas**
  (ADR-0082 D4 : `CrtPass` vit dans `GameScene`, la scène vit hors `GameScene`). Tout mon
  vocabulaire « CRT allumé » comme condition de test est donc **caduc sur cette scène** : les tests
  de lisibilité se font **sans CRT, avec le grain xerox de post-composition**, qui est le seul
  mangeur de détail de cet écran.

Le reste du brief (gabarit, coutures, épaisseur de trait, plancher de discernabilité, planche +
tranchage) est **inchangé et confirmé** par le gate (§5.1 de mon brief ratifié en A5 : 4 bandes,
6 variantes, 1 gabarit = 24 assets).

---

Ce que ça signifie, opérationnellement, en une phrase : on reprend de RoboCop ST le **gros portrait
qui occupe l'écran**, la **cible à gauche / construction à droite**, le **compte à rebours qui
serre** ; on jette la numérisation, le dithering photo, le grain de scan et la palette 16 couleurs.
Le visage est **encré** — trait noir sur blanc de photocopie, comme le reste de muf.

---

## 1. Le problème artistique central : la RÈGLE DE RACCORD

Un visage découpé en 4 bandes interchangeables (cheveux / yeux / nez / bouche) n'existe que si
**toutes les combinaisons se raccordent**. Avec N variantes par bande, ce ne sont pas N visages
qu'on livre mais N⁴ visages qui doivent tous tenir debout. En photo numérisée, la fusion pardonne :
le bruit masque les décalages. **En trait BD encré, le raccord est impitoyable** — un trait de
mâchoire qui rate de 2 px se voit comme une fracture, et le joueur lira la fracture comme une
information de gameplay (« ça ne colle pas, donc c'est faux »). C'est un bug de lisibilité, pas un
défaut cosmétique.

D'où la loi suivante, qui prime sur toute considération de style dans cette scène.

### 1.0 Les bandes sont JOINTIVES — c'est la condition d'existence de l'écran

**Fait de production établi sur maquette (Figma `muf — Design System` → `Écrans · Portrait-robot`),
corrigé en direct par Bertrand :** les 4 bandes sont **jointives**. Aucune couture, aucun écart,
aucun trait de séparation, aucun cadre par bande, aucune ombre entre bandes, aucun arrondi. Les
quatre morceaux forment **une seule surface continue** — un visage, pas quatre tuiles empilées —
et cette surface est au **gabarit exact** de la cible affichée à côté, pour que les deux visages se
comparent **trait pour trait**.

Ça change le statut de tout le §1. La règle de raccord n'était, jusqu'ici, qu'une exigence de
qualité : « si ça raccorde mal, ça se voit ». Elle devient **la condition d'existence de l'écran**,
et voici pourquoi, en trois conséquences opposables :

1. **Il n'y a plus de trait de séparation pour absorber l'erreur.** Un liseré, un filet noir, un
   décalage de 1 px entre bandes auraient été lus comme « voilà la découpe » et auraient masqué
   toute imprécision de dessin. Sans eux, **chaque défaut de raccord devient une fracture du
   visage**, c'est-à-dire une information fausse envoyée au joueur au moment précis où on lui
   demande de comparer des différences fines. Le bruit de raccord et le signal de gameplay ont la
   même amplitude : c'est intenable.
2. **Le gabarit exact cible ↔ construction devient une contrainte géométrique, pas une intention de
   layout.** Même largeur de crâne, même hauteur totale, même axe médian, même échelle, au pixel.
   Si la cible est rendue à une taille et la construction à une autre, la comparaison trait pour
   trait est **impossible** et la scène ne fonctionne plus, quelle que soit la qualité des dessins.
   Un ratio d'échelle ≠ 1:1 entre les deux portraits est un **FAIL de composition**, pas un réglage.
   (Le médaillon cible ≥ 28 % de largeur du gate A8 fixe la place ; il ne fixe pas le droit de
   changer d'échelle. Si l'écran ne peut pas loger deux portraits à la même échelle, c'est le
   layout qui plie, pas le gabarit.)
3. **La sélection ne peut plus être signalée par la géométrie.** Pas de bande qui s'écarte, pas de
   bande qui grossit, pas de cadre qui apparaît, pas de séparateur qui s'allume : toute affordance
   qui _déplace_ de la matière casse la surface continue. La sélection est **exclusivement** le
   liseré néon à falloff de §3, posé **sur** la bande sans rien décoller. C'est aussi ce qui rend
   ce liseré indispensable : il est le seul marqueur d'état qui ne coûte pas la jointure.

**Corollaire pour `ux-designer` et `dev-r3f-render` :** le gap CSS entre bandes est **0**, y compris
en `gap`, `border`, `margin`, `outline` et `box-shadow` interne. Le grain xerox est appliqué en
**une seule couche de post-composition sur le visage assemblé** (confirmé techniquement, ADR-0080
D6.3) : un grain par bande dessinerait les coutures que la jointure vient d'effacer.

### 1.1 Gabarit commun (le squelette invariant)

Toutes les bandes de tous les visages sont dessinées **sur le même gabarit de crâne**, unique et
non négociable :

- **Une seule largeur de crâne**, une seule ligne de mâchoire, un seul axe médian vertical
  strictement centré. Le visage est **frontal, orthographique, sans rotation ni inclinaison de
  tête** (même vocabulaire de cadrage que §3.6 de la bible : « strict frontal view, orthographic
  projection, centered »). Un visage de 3/4, même beau, est hors gabarit : FAIL.
- **Le contour extérieur du crâne appartient au gabarit, pas à la variante.** Aucune bande ne
  redessine la silhouette de la tête : elle remplit l'intérieur et raccorde le contour existant.
  C'est la seule façon d'avoir N⁴ combinaisons dont le contour est toujours continu.
- Les **oreilles** sont exclues du découpage (la ST/Amiga en faisaient une zone ; nous n'avons
  que 4 bandes) : elles appartiennent au gabarit et ne varient pas. Cela évite deux frontières
  supplémentaires sur des zones où le contour extérieur bouge.
- **Le cou et les épaules appartiennent au gabarit**, jamais à la bande « bouche ».

### 1.2 Points d'ancrage (les 3 frontières)

Trois coutures, à des **ordonnées fixes en pourcentage de la hauteur du portrait**, identiques pour
tous les visages et toutes les variantes. Valeurs à figer par `concept-artist` + `game-graphist`
sur un gabarit test, ordre de grandeur proposé ici comme point de départ :

| Couture             | Position                                                            | Ce qui doit coïncider exactement de part et d'autre                         |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| C1 — cheveux / yeux | ~32 % de la hauteur, au niveau du front, **au-dessus des sourcils** | largeur du crâne, contour des tempes, amorce des oreilles                   |
| C2 — yeux / nez     | ~52 %, **au-dessus de l'arête du nez**, sous les pommettes          | largeur des joues, ligne de pommette, amorce du nez (un trait, pas un bloc) |
| C3 — nez / bouche   | ~72 %, sous les narines, **au-dessus de la lèvre supérieure**       | largeur du bas de visage, philtrum, début de la mâchoire                    |

Règle de choix des coutures : **une couture passe toujours dans une zone plate et peu contrastée du
visage**, jamais à travers un trait fort. Couper au milieu d'un sourcil ou d'une narine, c'est
garantir la fracture. Corollaire : **aucune variante ne peut faire déborder son trait au-delà de sa
couture** — une frange qui descend sur les yeux, une moustache qui monte sur le nez sont des
interdits de production, pas des choix de style. (Si le design veut de la frange, elle se traite
comme une variante de la bande « yeux » qui l'inclut, pas comme un débordement.)

**Zone franche (bleed) :** chaque bande est dessinée avec une **marge de recouvrement de quelques
pixels** au-delà de sa couture, en trait continu, pour absorber le liseré de compositing. Le
découpage réel se fait à l'intérieur de cette marge. Sans elle, l'anticrénelage du bord crée une
ligne claire d'un pixel à chaque couture — un liseré horizontal qui traverse le visage = FAIL.

### 1.2bis Ce que la jointure impose au tranchage de la planche — bleed, repères, tolérance

Chiffré ici parce que §1.0 transforme une bonne pratique en critère de rejet, et parce que
`scripts/slice-portrait-plate.mjs` (ADR-0080 D5, seul écrivain des 24 PNG) a besoin de nombres,
pas d'adjectifs. **Espace de référence : la planche livrée, portrait cadré à 1024 px de hauteur**
(hauteur du visage du sommet du crâne à la base du cou, hors marges). Toutes les valeurs ci-dessous
sont exprimées en px de planche **et** en % de cette hauteur, pour survivre à un changement de
résolution de livraison.

**Bleed — 12 px de planche de chaque côté de chaque couture** (≈ 1,2 % de la hauteur, soit une
bande de recouvrement de 24 px). Le dessin est continu à l'intérieur du bleed ; la découpe tombe
sur l'ordonnée de couture, au **milieu** du bleed. Le bleed n'est pas une marge vide : c'est du
trait dessiné deux fois, une fois dans chaque bande. Motif du chiffre : il faut au moins 4 × la
demi-épaisseur du trait de contour pour qu'un anticrénelage de bord n'atteigne jamais un trait
porteur, et 12 px couvre confortablement un contour de 6-8 px à cette résolution. **Le bleed n'est
pas composé au rendu** — les bandes sont posées bord à bord sur l'ordonnée de couture, le
recouvrement sert uniquement à ce que le keying/cutout n'ait pas de bord franc à ronger.

**Repères d'alignement — dans la marge de la planche, jamais dans le portrait.** La normalisation
d'ADR-0080 D5 (recalage sur ligne des yeux / base du nez) a besoin de cibles mesurables. La planche
porte donc, **hors du cadre du portrait** (donc jamais livrées dans un PNG de bande) :

| Repère                                 | Emplacement                                                  | Sert à                                                     |
| -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Deux tirets de **ligne des yeux**      | marges gauche et droite, à l'ordonnée de la ligne pupillaire | fixer l'échelle verticale et la rotation                   |
| Deux tirets de **base du nez**         | marges gauche et droite, sous les narines                    | deuxième point de la normalisation verticale               |
| Un tiret d'**axe médian**, haut et bas | marges supérieure et inférieure, sur l'axe                   | fixer le centrage horizontal et détecter toute inclinaison |
| **Traits de coupe** aux 4 coins        | marges                                                       | cadrer la bbox du portrait, et rien d'autre                |

Ces repères sont dessinés au **même trait que le reste** (c'est une planche d'imprimeur, pas une
overlay technique) — c'est cohérent avec le vocabulaire de dessin technique de la bible §3.6, et
ça aide FLUX à tenir le cadrage au lieu de le combattre.

**Tolérance de raccord — la valeur que je retiens.** Mesurée par le script au moment du tranchage,
sur chacune des 3 coutures, entre la bande du dessus et la bande du dessous, pour **toutes** les
variantes :

| Grandeur mesurée à la couture                                                       | Tolérance (PASS)                              | Rejet de la variante |
| ----------------------------------------------------------------------------------- | --------------------------------------------- | -------------------- |
| **Demi-largeur du crâne** de part et d'autre (gauche et droite mesurées séparément) | **≤ 2 px de planche** (≤ 0,2 % de la hauteur) | **≥ 4 px** (≥ 0,4 %) |
| **Position de l'axe médian**                                                        | **≤ 1 px**                                    | **≥ 2 px**           |
| **Écart de tangente du contour** (rupture d'angle du bord du crâne)                 | **≤ 3°**                                      | **≥ 6°**             |
| **Épaisseur du trait de contour** entre deux bandes                                 | **≤ 10 % d'écart relatif**                    | **> 15 %**           |

**Pourquoi 2 px / 4 px, et pas un chiffre rond de confort.** À la taille de rendu réelle (bande de
56 px de haut en mobile paysage, UX §2.3.1 ratifié au gate — soit un portrait d'environ 224 px de
haut), la planche est réduite d'un facteur ≈ 4,6. Donc **2 px de planche ≈ 0,43 px rendu** :
strictement sub-pixel, invisible, absorbé par le filtrage. **4 px de planche ≈ 0,87 px rendu**,
c'est-à-dire une marche d'un pixel entier sur un contour dont le trait fait 2 px à l'écran : la
moitié de l'épaisseur du trait, exactement le seuil où l'œil lit « fracture » et non « bord ». La
zone 2-4 px est la **zone d'alerte** : elle ne rejette pas seule, mais deux grandeurs simultanément
en zone d'alerte sur la même couture = rejet. Le trait de contour est le référentiel, pas la
résolution : si la hauteur de livraison change, on convertit en % et les seuils suivent (0,2 % /
0,4 %).

**Portée du rejet — c'est le point dur, et il ne bouge pas.** Le gabarit est **atomique**
(ADR-0080 D5, mon §7.3 Q3 accordé). Une variante hors tolérance ne se re-génère donc pas seule :
**une variante rejetée rejette la planche**, et la planche se refait entière. C'est le prix de la
jointure et c'est délibéré — c'est exactement ce qui empêche quelqu'un de rattraper un raccord au
cas par cas et de fabriquer, variante après variante, les 4 dessinateurs que la loi de cohérence de
famille interdit (bible §2 loi 2). Le seuil de rejet s'applique donc à la **planche**, pas à
l'asset.

**Et le mécanique ne me lie pas.** Ces chiffres sont un plancher automatisable, pas un verdict :
une planche qui passe les quatre mesures et dont un raccord se voit quand même à l'œil, à taille
réelle, sur la planche de combinaisons G1, est **FAIL** quand même. La mesure attrape le décalage
géométrique ; elle n'attrape pas un menton qui ne veut pas de ce nez.

### 1.3 Épaisseur de trait et hachures

- **Une seule épaisseur de trait de contour** pour tout l'ensemble, définie en pixels à la taille
  de livraison (pas « en proportion »). Une variante dessinée plus fine ou plus grasse fait échouer
  tout l'ensemble au titre de la **loi de cohérence de famille** (bible §2 loi 2 : « one printing
  run »). Un ensemble portrait-robot est **un seul tirage**, exactement comme le set véhicules.
- **Hiérarchie à deux niveaux seulement** : trait de contour (fort) / trait de détail interne
  (fin). Pas de troisième épaisseur, pas de trait décoratif.
- **Hachures : même trame, même angle, même pas, partout.** L'ombre s'obtient par hachure ou
  demi-teinte tramée, jamais par dégradé lissé. **L'angle de hachure est une constante de
  l'ensemble** — deux bandes hachurées à 45° et 30° se lisent comme deux dessinateurs.
- **Traitement des ombres à la frontière des bandes :** interdiction d'une ombre portée **qui
  traverse une couture**. Chaque bande est éclairée par la même lumière ambiante frontale et plate
  (bible §3.8) ; l'ombre d'un nez ne descend pas sur la bande « bouche », l'ombre d'une frange ne
  tombe pas sur la bande « yeux ». Toute occlusion inter-bandes est **dessinée à l'intérieur de la
  bande qui la produit**, et s'arrête avant la couture. C'est la contrainte qui coûte le plus en
  naturalisme et c'est celle qui n'est pas négociable.
- **Le grain xerox est appliqué APRÈS composition, sur le visage assemblé, pas par bande.** Un
  grain généré par bande donne quatre grains différents et dessine les coutures. (Point à trancher
  avec `senior-architect`, §7 — c'est une contrainte d'architecture autant que de style.)

---

## 2. Variantes proches mais discernables

Le game design fait reposer la difficulté sur la ressemblance entre variantes (l'original :
« minor differences », recon §7). C'est un levier artistique, donc un levier dont **je fixe le
plancher** : la difficulté vient de la finesse de l'écart, jamais de son invisibilité.

**Ce qui reste CONSTANT entre variantes d'une même bande :**
gabarit, coutures, largeur de crâne, épaisseur de trait, angle et pas de hachure, quantité globale
de noir (une variante ne doit pas être perceptiblement plus sombre qu'une autre — sinon le joueur
trie par valeur au lieu de lire la forme, ce qui rend la scène triviale et laide).

**Ce qui VARIE (par ordre décroissant de force de lecture) :**

1. **La forme d'un élément** (nez droit / busqué / retroussé ; bouche large / fine) — variation
   forte, celle qui doit porter les variantes « faciles ».
2. **Un accessoire ou un trait de caractère** (lunettes, boucle d'oreille, cicatrice, grain de
   beauté, dent manquante) — variation forte, à réserver : c'est du gameplay gratuit.
3. **Une proportion** (écart des yeux, hauteur de l'arcade, épaisseur des lèvres) — variation
   moyenne, le cœur du jeu.
4. **Un détail de trait** (nombre de plis à la paupière, direction d'une mèche, forme du sourcil) —
   variation faible, réservée aux difficultés hautes.

**Le plancher de discernabilité (règle de gate, non négociable) :** deux variantes d'une même bande
doivent rester distinguables **côte à côte à la taille réelle de rendu sur téléphone, en une
seconde, écran non zoomé, CRT activé** (le grain cathodique §8 de la bible mange du détail fin :
tout test de lisibilité se fait **effet CRT allumé**, sinon on valide une lisibilité qui n'existe
pas en jeu). En dessous, la variante est **injuste** : elle transforme une épreuve d'observation en
loterie. Deux tests concrets :

- **Test du différentiel :** superposer deux variantes en différence ; si la zone qui les sépare
  fait moins que ~2 % de la surface du portrait ou tient dans un carré plus petit que l'épaisseur
  du trait × 4, elle est trop faible → FAIL.
- **Test de mémoire :** le portrait cible et le portrait construit ne sont **pas nécessairement
  côte à côte dans le regard du joueur**. Une variante qui n'est distinguable qu'en comparaison
  directe simultanée, et pas de mémoire à une seconde d'intervalle, est classée « difficulté
  haute » — jamais utilisée en difficulté FACILE.

Recommandation de tuning à `game-designer` : **graduer par la classe de variation** (1-2 en facile,
3 en normal, 4 en difficile) plutôt que par le nombre de variantes. C'est le même contenu, une
autre courbe.

---

## 3. Portrait cible vs portrait en construction

Les deux doivent se distinguer **instantanément** sans être deux styles différents (deux styles =
rupture de famille, bible §2 loi 2). Ils sont **le même dessin, deux états d'impression**.

- **Cible (à gauche, mise en scène ST) : la pièce du dossier.** Une photocopie collée, entourée
  d'un **cadre imprimé** — filet noir encré, coins scotchés, éventuellement une légende
  dactylographiée (Courier Prime, §2bis.1). Elle est **inerte : zéro glow.** C'est un document
  posé, pas un objet interactif. La loi du glow le dit dans les deux sens : ce qui ne brille pas
  n'est pas interactif, et la cible ne l'est pas.
- **Construction (à droite) : l'objet manipulé, donc il brille.** La bande **actuellement
  sélectionnée** porte un **liseré néon** dans la teinte d'accent assignée à la scène (une seule
  teinte, ancrée hex, `levelArt.json`), avec **falloff obligatoire** — un dégradé qui décroît vers
  zéro, jamais un aplat (bible §2.1). Les trois autres bandes ne brillent pas. **C'est le seul
  glow de l'écran** : il dit « c'est ici que ton joystick agit », ce qui est exactement le rôle de
  la loi du glow, et il remplace tout curseur ou flèche décorative.
- **Distinction supplémentaire, sans style :** la trame. La cible peut porter une **génération de
  photocopie de plus** (trame un cran plus grossière, contraste un cran plus dur) — c'est le même
  procédé, un dub plus loin dans la chaîne (§1 de la bible). Le portrait en construction est
  « frais », la cible est « une copie de copie ». À doser : la cible doit rester parfaitement
  lisible, c'est elle qu'on doit mémoriser.
- **Interdit :** distinguer par la couleur de fond, par un cadre différent en style, par un effet
  de flou, ou par un halo sur la cible.

**Ce point relève du gate composite (Gate 4)** : le liseré de sélection est composé au runtime, il
sera jugé sur des captures in-game réelles, pas sur les PNG. Rappel de §1.0 : le liseré est le
**seul** marqueur de sélection autorisé, parce qu'il est le seul qui ne décolle pas la jointure.
Depuis A4-bis (swipe direct sur la bande visée, pas de tap de sélection), il n'y a plus de « bande
active » persistante au doigt : le liseré est un **écho transitoire du geste**, pas un état
(ADR-0082 D4). Au clavier, où la notion de bande focalisée existe toujours, il est un état.
Les deux cas passent par le même dégradé, jamais par un aplat.

---

## 3bis. LE VERROUILLAGE — le seul signal de la scène

**Neuf. Rév. 2.** Le CTA `SORTIR LA TÊTE` est supprimé (Bertrand B1) : la scène se termine d'elle-
même dès que les 4 bandes sont justes (A12bis). Le gate m'impose la nature du signal — **global,
binaire, terminal, jamais un feedback par trait** (A16) — et me laisse sa forme. Voici la forme.

**Le cahier des charges DA, que je m'impose avant de proposer quoi que ce soit :**

1. **Global** : il porte sur la surface entière, jamais sur une bande. Un signal qui naît sur la
   4ᵉ bande dirait au joueur _quelle_ bande a fermé la combinaison — feedback par trait, interdit.
2. **Binaire et terminal** : un état, pas une montée. Pas de « ça chauffe », pas d'intensité qui
   croît avec le nombre de bonnes bandes. La scène ne commente pas, elle s'arrête.
3. **Jamais la couleur seule** (accessibilité, et loi de la maison : notre identité est le noir et
   blanc — un signal qui n'existe qu'en couleur n'existe pas sur une photocopie).
4. **Compatible `prefers-reduced-motion`** : le signal doit survivre entier quand on lui retire
   tout mouvement. Corollaire : **le mouvement ne peut pas être le porteur d'information.**
5. **Compatible §1.0** : il ne déplace pas de matière, il ne décolle pas les bandes.

### 3bis.1 La proposition : RECALAGE → NÉGATIF → TAMPON, un seul événement en trois couches

Le vocabulaire est celui de l'imprimerie ratée, qui est notre vocabulaire depuis la première page
de la bible. Le portrait en construction est un tirage **mal calé**. Le verrouillage, c'est le
moment où la presse tombe juste.

**Couche 1 — LE RECALAGE (le porteur principal, et il est positionnel, pas coloré).**
Pendant toute la phase `ACTIVE`, le portrait en construction est imprimé **hors repérage** : le
**plateau d'accent néon** (et lui seul) est décalé de **2 à 3 px rendus, en diagonale constante**,
par rapport au plateau d'encre noire. Le trait noir du visage reste **parfaitement net** — c'est
non négociable, c'est lui qu'on compare à la cible. Seul le plateau de couleur bave à côté, comme
une sérigraphie ratée. Au verrouillage, **le décalage tombe à zéro, d'un coup** : le tirage se cale.

Pourquoi ça marche : c'est **global par construction** (le décalage est une propriété du tirage
entier, il ne peut pas désigner une bande) ; c'est **binaire** (calé / pas calé, il n'y a pas de
demi-repérage) ; c'est **lisible sans la couleur** (c'est une position, pas une teinte — un
daltonien voit le décalage, un écran monochrome aussi) ; et ça **raconte** exactement la fiction —
la planche de gueules qui, enfin, coïncide.

Dosage, parce que c'est le risque réel : **le décalage ne doit jamais toucher le trait du visage.**
S'il gênait la comparaison trait pour trait, il attaquerait le verbe de la scène et je le
refuserais moi-même. Il vit sur le **plateau d'accent** — cartouche, filets du cadre de la
construction, libellés de bande — pas sur la peau du dessin. À vérifier au gate composite sur
capture réelle : **si le hors-repérage dégrade la lisibilité du visage, il saute**, et la couche 2
suffit.

**Couche 2 — LE NÉGATIF (le coup de poing, une seule fois).**
Au même instant, le visage assemblé passe **en négatif — encre inversée — une fois, ~120 ms**,
puis revient. Dans un monde en noir et blanc pur, l'inversion d'encre est le signal le plus violent
disponible et il ne coûte pas un gramme de couleur : c'est le flash du photocopieur. Il est
**global par nature** (on n'inverse pas un tiers de visage) et **terminal** (il ne se répète
jamais — une seule inversion, jamais de clignotement, bible §8 P6 : pas de stroboscope).

**Couche 3 — LE TAMPON (l'état stable, ce qui reste à l'écran).**
Le négatif retombe sur un **tampon encreur** posé en travers de la surface assemblée : Rubik Mono
One, `ink-full` `#000000`, léger dévers, distress `feTurbulence` + `feDisplacementMap` (bible
§2bis.1 — c'est le même outillage que les tampons OTAGE / LIVRAISON, donc la même famille de
tirage). Il est le seul élément qui **persiste** pendant `revealSeconds` et `resultHoldSeconds`.
**Le libellé du tampon appartient à `narrative-designer`**, pas à moi (vocabulaire canon, A6) — je
ne fournis que la forme et le poids. Le tampon est **posé, jamais animé en rotation ou en échelle**.

### 3bis.2 Ce que ça donne en `prefers-reduced-motion`

Le signal **survit à 100 %**, et c'est le test qui valide la proposition : les trois couches sont
des **changements d'état**, pas des animations.

- Recalage : le décalage passe de 3 px à 0 **instantanément** au lieu de 120 ms de transition. Le
  hors-repérage lui-même est **statique** pendant `ACTIVE` (il ne vibre pas, il ne dérive pas) —
  il n'y a donc rien à désactiver du côté de l'état d'attente.
- Négatif : inversion instantanée, maintenue ~120 ms, retour instantané. Une inversion unique n'est
  pas du mouvement ; si l'accessibilité exige de la supprimer aussi (photosensibilité), **le
  recalage et le tampon portent seuls le signal** et il reste complet.
- Tampon : il apparaît, point. Aucune trajectoire.

**Aucune couche ne dépend de la couleur, aucune ne dépend du mouvement, aucune ne désigne une
bande.** C'est ce qui me fait la retenir.

### 3bis.3 Les deux formes que j'écarte, et pourquoi

- **Le liseré néon qui fait le tour de la surface assemblée.** Tentant, et c'est la première idée
  de tout le monde. Refusé : il **collide avec le liseré de sélection** — même vocabulaire, même
  teinte, deux sens différents sur le même écran. La loi du glow dit « ce qui brille est
  interactif » ; au moment du verrouillage, plus rien ne l'est. Un glow terminal est un
  contresens de la loi.
- **Le remplissage progressif / la montée d'intensité** (le cadre qui se charge à mesure que les
  bonnes bandes tombent). Refusé frontalement : c'est un **feedback par trait déguisé en signal
  global**, interdit par A16. Trois quarts de cadre allumés disent « il t'en manque une », et le
  joueur balaie au lieu de regarder.

### 3bis.4 Le verrouillage est un objet de Gate 4, pas de Gate 2

Rien de tout ça n'est dans un PNG : c'est composé au runtime. **Je ne PASSerai le verrouillage que
sur des captures in-game réelles** montrant les trois états (hors repérage pendant `ACTIVE` /
l'instant du négatif / le tampon en tenue), et **une quatrième capture en `prefers-reduced-motion`**.
Sans ces captures, pas de PASS — c'est exactement le trou qu'ADR-0011 a laissé sur le liseré des
véhicules, et il ne se rouvre pas ici.

---

## 4. Palette et rendu — la DA maison sur un visage humain en gros plan

Registre neuf pour muf : jusqu'ici nos sujets sont des véhicules, des silhouettes et des façades.
Un visage en gros plan expose le trait comme rien d'autre. Ce qui est autorisé et ce qui ne l'est
pas :

**AUTORISÉ**

- Noir et blanc pur : encre noire sur blanc de photocopie. Trait BD/comics franc, contrasté.
- Texture toner xerox, trame de demi-teinte grossière, hachures et aplats noirs.
- **Une seule** couleur néon dans la scène, **exclusivement sur le liseré de sélection** (§3) et
  sur le plateau d'accent hors repérage du verrouillage (§3bis.1). ~~et, le cas échéant, sur le
  chrono quand il devient critique — parce qu'un chrono critique est une alerte HUD, et les alertes
  HUD brillent~~ → **RETIRÉ, rév. 2.** Le chrono de cette scène **n'est pas un HUD de jeu** : la
  scène est une surface DOM interactive (ADR-0080 D6.3), pas le monde. Et la jauge **n'est pas
  interactive** — elle ne se manipule pas. La loi du glow tranche donc dans l'autre sens : **la
  jauge ne brille jamais**, y compris à 5 s. Son escalade se fait à l'encre (§4bis.3).
- **Statut de la scène — TRANCHÉ, ma question ouverte 7.3.5 est close** (ADR-0079 D1 / ADR-0080
  D6.3, gate §5.2) : **ni monde de jeu, ni surface pré-jeu — une surface DOM interactive.**
  Conséquences, appliquées partout dans ce brief :
  - **Le liseré néon de sélection est légitime**, sans exception à motiver : la bande est
    manipulée, donc elle brille (§2 loi 1). ~~Mon hypothèse « monde de jeu » reposait sur un chrono
    « qui coûte une vie » : c'est FAUX~~ — la scène **ne retire aucune vie, toutes issues
    confondues** (gate A1, story AC5) ; la sanction est **−20 d'énergie sur le capital initial du
    niveau suivant** (A1c). L'argument est retiré ; la conclusion tenait pour une autre raison que
    la mienne.
  - **La cible reste à zéro glow** (elle n'est pas manipulée) — inchangé.
  - **Le §2bis « zéro glow » ne s'applique pas** : ce n'est pas un menu, elle a une issue et un coût.
  - **Le CRT §8 ne s'applique pas** : `CrtPass` vit dans `GameScene`, cette scène vit dehors
    (ADR-0082 D4). **Partout où ce brief écrit « CRT allumé » comme condition de test — §2, §6 G4,
    §6 G7, §7.2 — lire « grain xerox de post-composition appliqué ».** C'est ce grain, unique et
    posé sur le visage assemblé, qui est le mangeur de détail de cet écran ; c'est donc lui, et lui
    seul, qui conditionne le plancher de discernabilité.

**INTERDIT — automatique FAIL**

- **Pas de dithering photo.** Aucun tramage ordonné/Bayer imitant une image numérisée.
- **Pas de grain de numérisation**, pas d'artefact de scanner, pas de « digitised face ».
- **Pas de palette 16 couleurs ST**, pas de sépia, pas de niveaux de gris « rétro ».
- Pas de photoréalisme, pas de rendu peint, pas de dégradé lissé sur la peau : la valeur
  intermédiaire s'obtient par trame ou hachure, point.
- Pas de couleur de peau, pas d'yeux colorés, pas de cheveux colorés. Un visage coloré dans muf
  serait la première couleur non-néon du jeu : rupture d'identité.
- Pas de glow sur la peau, sur les yeux, sur les dents. **Ce qui brille est interactif** — un œil
  qui brille dit au joueur que l'œil est cliquable.

**Direction de dessin (au concept-artist, pour cadrer sans peindre à sa place) :** on veut le
registre **portrait de fanzine / affiche « recherché » photocopiée** — visages durs, éclairage
frontal plat, peu de modelé, beaucoup de caractère dans le contour et dans un ou deux traits
signature. Pas de belle gueule lissée. Le casting doit refléter la faune d'une soirée clandestine
parisienne de 1998 ; le cadrage culturel et les références sont du ressort d'`art-advisor`
(`docs/references/art-culture.md`) — je veux sa passe avant les prompts.

---

## 4bis. LA JAUGE — un chrono continu qui ne ressemble pas à une barre de vie

**Neuf. Rév. 2.** Le compte d'unités saute (Bertrand B2) : plus de `TÉLÉCARTE · {n} UNITÉS`, plus
de 14 unités, plus de nombre à l'écran — ni unités ni secondes. **Jauge continue qui se vide**
(A13). L'habillage télécarte survit **comme objet, pas comme compteur** : c'est la carte qui se
vide.

Le piège est nommé dans la demande et il est réel : une jauge continue, c'est le geste le plus
générique du jeu vidéo moderne. Une barre arrondie, un dégradé vert→rouge, une lueur, et l'écran
cesse d'appartenir à muf. Trois principes le tiennent à distance.

### 4bis.1 Le principe : l'encre s'en va, la forme reste

Une barre de vie moderne **se raccourcit** : un rectangle plein qui rétrécit, sur une glissière
vide. **Notre jauge ne rétrécit pas — elle se dépeuple.** La télécarte est imprimée en entier,
son **contour reste intégralement là du début à la fin**, et c'est **l'encre à l'intérieur qui
disparaît**, de gauche à droite. On ne regarde pas une barre se vider, on regarde **une carte
s'épuiser** : la matière imprimée s'en va, l'objet reste.

C'est la différence entre un widget et un objet, et c'est toute la DA de la maison.

### 4bis.2 Comment ça se dessine, concrètement

- **Le front n'est jamais net.** Le bord entre l'encrée et la vidée est un **bord rongé au toner** :
  irrégulier, granuleux, dentelé à l'échelle du grain — le photocopieur qui manque d'encre en fin
  de course. Techniquement, c'est un masque à bord bruité (`feTurbulence` +
  `feDisplacementMap`, exactement l'outillage des tampons, bible §2bis.1), pas un `clip-path`
  rectiligne. **Un front droit et propre = FAIL** : c'est le tell numéro un de la barre de vie.
- **Zéro dégradé de remplissage.** Encre noire pleine (`ink-black`) ou papier. Pas de fondu, pas de
  lueur intérieure, pas de reflet, pas de biseau. La valeur intermédiaire, s'il en faut, s'obtient
  par **trame**, comme partout ailleurs dans le jeu (§4).
- **Zéro arrondi, zéro ombre portée.** Coins vifs, filet noir, comme un cartouche imprimé. La carte
  garde son ratio **télécarte (~1,6:1)** et se lit comme une carte, pas comme un rail.
- **Aucun changement de teinte avec le niveau.** Pas de vert→orange→rouge : c'est le second tell de
  la barre de vie, et c'est de la couleur seule. La jauge est **noir et blanc du début à la fin**.
- **Elle ne touche pas les portraits.** Interdit formel : la jauge ne passe **jamais** sous le
  visage assemblé ni sous la cible, et n'est jamais accolée à la surface jointive (§1.0) — une
  barre horizontale sous une tête, c'est littéralement l'image d'une barre de vie, et ça abîme la
  jointure. Elle vit sur son propre objet, dans sa propre zone.
- **Elle ne pulse pas, elle ne clignote pas.** Le seul « pulse » toléré dans la maison est le
  curseur de machine à écrire (§2bis).

### 4bis.3 L'escalade des paliers, en encre et jamais en lumière

Les paliers du gate (50 % · 10 s · 5 s restants, A13) doivent se voir. Ils se voient **sans
couleur, sans glow, sans nombre** :

| Palier                  | Ce que fait la jauge                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mi-parcours (50 %)      | **rien de visuel** — c'est un palier de copie (réplique KENZA), pas d'IHM. Ne rien ajouter est une décision, pas un oubli.                                              |
| Urgence (10 s restants) | l'encre restante **passe de l'aplat plein à une trame grossière** — la carte « s'éclaircit », elle rend l'âme. Changement de **texture**, pas de teinte.                |
| Dernier (5 s restants)  | le **filet du contour de la carte s'épaissit d'un cran** (une seconde impression, plus grasse) + le bip + l'annonce `aria-live`. Un seul cran, tenu, sans clignotement. |

Les trois sont perceptibles en niveaux de gris, en `prefers-reduced-motion`, et sans son.

### 4bis.4 Ce que je n'accepterai pas sur la jauge

Rectangle à coins arrondis · dégradé de remplissage · dégradé de teinte selon le niveau · lueur ou
`box-shadow` coloré · clignotement · segments discrets (ce serait ré-introduire les unités que B2
vient de supprimer) · un chiffre, quel qu'il soit, y compris un pourcentage · un pictogramme
d'horloge ou de sablier · un placement sous les portraits. **Chacun est un FAIL isolé.**

**Livrable dû par `narrative-designer`** (le gate le note en B1) : un libellé de jauge **sans
nombre** pour remplacer `TÉLÉCARTE · {n} UNITÉS`. Contrainte DA de ma part, courte : **Courier
Prime, capitales, une ligne, ≤ 12 caractères**, posé sur la carte comme une mention imprimée — et
l'interdit « temps restant » d'A6 tient.

---

## 5. Faisabilité de production

### 5.1 Le volume réel

`4 bandes × N variantes × M visages`. Le piège : si les visages sont indépendants, le coût est
multiplicatif et l'ensemble explose. Quelques ordres de grandeur :

| Hypothèse       | Assets bandes | Combinaisons offertes |
| --------------- | ------------- | --------------------- |
| M=1 visage, N=4 | 16            | 256                   |
| M=3, N=4        | 48            | 768                   |
| M=3, N=6        | 72            | 3 888                 |
| M=5, N=6        | 120           | 6 480                 |

**Constat :** le nombre de combinaisons est absurdement supérieur au besoin de gameplay.
Le joueur voit **une** cible et fait au plus quelques dizaines d'essais. On n'a donc **aucun besoin
de M élevé** : la variété perçue vient déjà de N⁴. **Recommandation de scope à `pm` : M=1 gabarit,
N=4 à 6 par bande, soit 16 à 24 assets.** Un deuxième gabarit (ex. un visage nettement plus large,
ou une variante genrée) est un **fast-follow**, pas un prérequis — et il double tout, y compris le
risque de raccord, puisque chaque gabarit est un tirage à part entière avec ses propres coutures.

### 5.2 Générer par bande, ou trancher des visages entiers ?

**FLUX ne sait pas dessiner une bande.** Il ne comprend pas « le tiers médian d'un visage sur un
gabarit défini », et il n'a aucune mémoire de la largeur de crâne d'une génération à l'autre.
Demander 16 bandes en 16 générations, c'est demander 16 crânes différents : le raccord (§1) échoue
par construction, et aucune quantité d'itérations de prompt ne le rattrape. C'est exactement le
mode d'échec qu'on a déjà payé sur les liserés néon cuits dans les véhicules (ADR-0011) : une
propriété globale ne s'obtient pas en la répétant dans N prompts locaux.

**Recommandation : générer des VISAGES ENTIERS, puis les trancher.**

Voie recommandée — **planche + tranchage**, transposition directe du procédé « strip-and-slice »
déjà éprouvé sur le courier (bible §4.2) :

1. Une génération FLUX = **une planche d'un ou plusieurs visages entiers**, même gabarit, même
   trait, même tirage, cadrés frontalement sur une grille fixe.
2. Découpe mécanique aux **ordonnées de couture fixes** (§1.2), avec bleed.
3. On obtient d'un coup un jeu de bandes **mutuellement raccordables**, parce qu'elles viennent du
   même dessin.
4. Les visages suivants sont dérivés en **`kontext` img2img** depuis le visage héros validé (bible
   §3.12 / §4.1) : même main, même crâne, autre tête. C'est le seul mécanisme dont on dispose pour
   verrouiller un gabarit entre générations.

**Risque de la voie recommandée** (à nommer honnêtement) : le tranchage impose que FLUX cadre le
visage **exactement** aux mêmes proportions dans chaque case ; s'il dérive d'un visage à l'autre,
les coutures tombent au mauvais endroit et il faut un recadrage/normalisation par visage
(alignement sur des repères — ligne des yeux, base du nez) avant découpe. C'est un coût outillage
réel pour `dev-tooling-assets`, et il faut le budgéter. Mitigation : un gabarit de cadrage explicite
dans le prompt (grille, vocabulaire de dessin technique, cf. bible §3.6) + une passe d'alignement
scriptée + un contrôle mécanique du type `check-sprite-style.mjs` mesurant la position des
coutures.

**Risque de la voie rejetée** (bandes générées séparément) : **incohérence de gabarit garantie**,
donc N⁴ visages fracturés, non rattrapable par itération. Ce serait brûler le budget de 2 batches
par ensemble (bible §6) sans jamais converger. Je ne l'autoriserai pas sans une preuve contraire
sur un batch de démonstration.

**Voie de repli si FLUX ne tient pas le gabarit après 2 batches :** dessiner/retoucher le gabarit
héros à la main (ou par retouche scriptée documentée, §6 de la bible) et n'utiliser FLUX que pour
les **variations internes** en img2img masqué. À escalader à Bertrand avec les deux options
chiffrées, pas à décider en sous-main.

---

## 6. Critères du gate visuel (ce que je refuserai à la livraison)

Points vérifiables, sur les PNG livrés **et** sur captures in-game réelles pour tout ce qui est
composé au runtime.

**G1 — Raccord.** Sur un échantillon d'au moins 8 combinaisons tirées au hasard, dont les 4
combinaisons extrêmes : aucune discontinuité visible du contour du crâne ni de la ligne de mâchoire
aux 3 coutures, aucun liseré clair d'un pixel, aucun décalage d'axe médian. **Une seule combinaison
fracturée fait échouer tout l'ensemble** (§1, bible §2 loi 2). **Rév. 2 — durci par la jointure
(§1.0) :** les quatre tolérances chiffrées de §1.2bis sont mesurées par le script de tranchage sur
les 3 coutures × toutes les variantes ; hors tolérance ⇒ **rejet de la planche entière**, pas de la
variante. Vérifier en plus, à l'œil, **gap zéro** (aucun filet, aucun écart, aucune ombre entre
bandes) et **échelle 1:1 exacte entre la cible et la construction**.

**G2 — Épaisseur et trame.** Épaisseur de contour identique sur toutes les bandes ; angle et pas de
hachure identiques ; aucune ombre traversant une couture. Vérifiable par superposition.

**G3 — Quantité de noir.** Écart de densité entre variantes d'une même bande sous un seuil à fixer
(ordre de grandeur : ±10 % de couverture d'encre). Au-delà, le joueur trie par valeur : FAIL.

**G4 — Discernabilité.** Chaque paire de variantes d'une même bande passe le test du différentiel
et le test de mémoire (§2), **à la taille réelle mobile, CRT allumé**. `game-graphist` fournit la
planche de comparaison ; sans elle, pas de verdict.

**G5 — Palette.** Zéro pixel coloré hors liseré néon ; zéro dithering ordonné ; zéro artefact de
numérisation ; pas de dégradé lissé sur la peau. Échantillonnage sur les PNG.

**G6 — Défauts de génération IA (balayage obligatoire, bible §2 loi 3).** Sur fond contrastant, à
taille réelle : pas d'œil dépareillé ou surnuméraire, pas de parité rompue entre éléments pairs
(yeux, oreilles, sourcils), pas de dents fusionnées, pas de trait fondu, pas d'incohérence de
perspective entre bandes. **Un visage a la parité paire la plus visible du jeu** : c'est le
registre où FLUX rate le plus. Toute zone claire enclose sur le visage est une trou de génération
suspecté, pas du fond. **FAIL automatique**, quelle que soit la qualité de rendu.

**G7 — Gate composite (Gate 4).** Sur captures in-game : liseré de sélection présent sur la seule
bande visée, en dégradé décroissant jusqu'à zéro (jamais un aplat, bible §2.1) ; cible sans aucun
glow ; cible et construction lisibles simultanément à la taille réelle mobile ; ~~sous CRT~~ **sous
le grain xerox de post-composition** (pas de CRT sur cette scène, ADR-0082 D4), les variantes
restent discernables. **Pas de capture lisible = pas de PASS.**

**Rév. 2 — trois surfaces runtime neuves entrent dans G7, et aucune n'est couverte par G1-G6 :**

- **G7a — la jointure à l'écran.** Gap zéro visible, grain xerox **unique** sur le visage assemblé
  (aucune discontinuité de grain aux coutures), échelle cible ↔ construction 1:1.
- **G7b — le verrouillage (§3bis).** Quatre captures exigées : hors repérage pendant `ACTIVE` /
  l'instant du négatif / le tampon en tenue / **la même séquence en `prefers-reduced-motion`**.
  Vérifs : le signal est global (rien ne désigne une bande), binaire (aucune montée d'intensité
  avec `correctCount`), terminal (une seule inversion, jamais de clignotement), et **le hors
  repérage ne dégrade pas la lisibilité du trait du visage** — s'il la dégrade, il saute.
- **G7c — la jauge (§4bis).** Front rongé et non rectiligne, contour intégral persistant, aucune
  teinte, aucun glow, aucun nombre, aucun segment, aucun arrondi, non accolée aux portraits ; les
  trois paliers lisibles en niveaux de gris et sans son.

Aucune de ces trois surfaces n'existe dans un PNG. **Un PASS d'asset gate ne les couvre pas.**

**G8 — Traçabilité.** Verdict par asset et par ensemble consigné dans `docs/agent-handoffs.md`,
avec la planche de combinaisons ayant servi à G1.

---

## 7. Questions ouvertes

> **Rév. 2 — ce qui est CLOS.** §7.3 Q1 (atlas ou PNG) → **24 PNG tranchés d'une planche**,
> ADR-0080 D5/D6.1. §7.3 Q2 (où vivent les coutures) → **`portraitPlate.generated.json` émis par le
> script, jamais écrit à la main**, ADR-0080 D5. §7.3 Q3 (atomicité) → **accordée et mécanisée**
> (un seul script, aucun mode par bande, checksum + test de cohérence), ADR-0080 D5/D6.2 ; §1.2bis
> en tire la portée du rejet. §7.3 Q4 (grain en post-composition) → **confirmé techniquement**,
> ADR-0080 D6.3. §7.3 Q5 (statut de la scène) → **surface DOM interactive**, ni monde ni papier ;
> liseré légitime, **pas de CRT** — traité en §4.
> **Reste ouvert :** §7.1 en entier (prompts, à `concept-artist`) et §7.2 (taille réelle et
> plancher de lisibilité, à `game-graphist` — désormais **grain xerox** et non CRT), plus les deux
> questions neuves ci-dessous.

### 7.0 Questions neuves (rév. 2)

1. **À `game-graphist` / `ux-designer` :** la maquette Figma fixe-t-elle une hauteur de portrait qui
   permet **l'échelle 1:1 exacte** entre la cible (médaillon ≥ 28 % de largeur, A8) et la surface
   jointive ? Si non, c'est le layout qui plie (§1.0 conséquence 2) — et il faut me le dire avant
   le tranchage, pas après.
2. **À `ux-designer` / `dev-r3f-render` :** le hors repérage du plateau d'accent (§3bis.1) est-il
   tenable sans toucher le trait du visage, en CSS Modules + tokens (ADR-0082 D4) ? S'il coûte une
   deuxième passe de composition, je préfère le supprimer et laisser négatif + tampon porter le
   verrouillage — dis-le tôt.

### 7.1 À `concept-artist` (Maud) — elle écrira les prompts, pas moi

1. Quel vocabulaire de **cadrage** verrouille le gabarit dans FLUX (grille, repères
   ligne-des-yeux/base-du-nez, « strict frontal orthographic », proportions explicites) sans dépasser
   le plafond de 120 mots de la bible §3.3 ?
2. Une planche = combien de visages ? Un seul grand visage par génération (meilleure résolution par
   bande) ou une rangée de N (meilleure cohérence entre eux) ? Arbitrage résolution/cohérence à
   proposer avec un mini-essai.
3. Comment décrire **positivement** une variante « proche » sans que FLUX ne dérive tout le visage
   (bible §3.1, §3.7) ? Hypothèse à tester : ne varier qu'une clause de sujet, tout le reste verbatim.
4. Le grain xerox : dans le prompt (donc par bande, risque de coutures visibles) ou en
   post-composition ? **Ma préférence est la post-composition** — à confirmer techniquement.

### 7.2 À `game-graphist` — lisibilité à la taille réelle

1. Quelle **taille de rendu réelle** du portrait sur le plus petit écran cible ? C'est elle qui
   fixe l'épaisseur de trait en pixels et donc tout le §1.3.
2. À cette taille et **CRT allumé**, quel est le plus petit écart de forme encore lisible en une
   seconde ? Ce chiffre devient le plancher officiel du §2 (je l'inscrirai dans la bible).
3. Le tranchage avec bleed survit-il proprement au chroma-key / cutout de notre pipeline, ou
   faut-il livrer les bandes déjà détourées, sans passe de keying ?
4. Passe PRE-PROD attendue avant le prompt gate (bible §6) : planche de comparaison des variantes à
   taille réelle.

### 7.3 À `senior-architect` (Winston) — format d'asset, **ADR-0080**

1. **Bandes séparées ou atlas ?** Une planche tranchée en 16-24 PNG, ou un atlas + une table de
   coutures en data ? L'atlas garantit le raccord par construction et évite 24 fichiers ; les PNG
   séparés collent à la forme actuelle de `levelArt.json`.
2. **Où vivent les coutures ?** Ordonnées de découpe et gabarit : en data (nouveau bloc
   `portraitRobot` dans `levelArt.json`, dérivé — jamais un champ manifeste redondant, cf. la règle
   de largeur dérivée du courier §4.2) ou en constantes de rendu ?
3. **Atomicité de l'ensemble.** Comme le courier : si une bande est régénérée seule, le raccord
   casse. Je demande que **le gabarit soit atomique** — une régénération = tout le gabarit. À
   inscrire dans l'ADR.
4. **Grain xerox et liseré néon en post-composition** : le pipeline de rendu peut-il appliquer un
   grain unique sur le visage assemblé et un liseré à falloff sur une seule bande, sans coût GPU
   déraisonnable (`gpu-specialist` à consulter) ?
5. Cette scène est-elle **monde de jeu** (donc CRT §8 + loi du glow) ou **surface pré-jeu** (donc
   §2bis, papier, zéro glow) ? Ma préférence : monde de jeu. La réponse change le §4 de ce brief et
   je la ferai redescendre dans la bible.

---

## 8. GATE PROMPT — planche PORTRAIT-ROBOT (lead-art, Nico) — 2026-08-05

**Objet gaté :** `PORTRAIT_PROMPT_FAMILY` dans `scripts/slice-portrait-plate.mjs`
(`pending: false`, `seed: 190226`), livré par `concept-artist`.

**VERDICT : PASS AVEC CONDITIONS.** Trois substitutions de tokens appliquées par moi
directement dans le fichier (elles bloquaient la génération, elles sont d'un mot chacune,
ce n'est pas de la première main : c'est de la direction sur un jet livré). Le prompt
assemblé passe de 119 à **118 mots**, zéro négation, plafond §3.3 respecté avec 2 mots de
marge rendus à la lane.

### 8.1 Ce que j'ai changé, et pourquoi (opposable clause par clause)

| #   | Avant                                                                                                           | Après                 | Motif                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `on a printer plate`                                                                                            | `on a printed sheet`  | **Bloquant.** « printer plate » est un OBJET (plaque offset métallique, presse) et il est en **position 8 du prompt**, la zone de poids maximal. Même mode d'échec que « zine cover » qui invoque de la typo (bible §3.8) : on risque une photo de plaque d'imprimeur au lieu d'un dessin. « printed sheet » légitime tout autant les repères de marge et garde le sol papier de la maison. |
| 2   | `Hard Parisian face`                                                                                            | `Hard weathered face` | « Parisian » est un token de mode : il tire vers la belle gueule lissée d'édito, ce que mon §4 interdit nommément. « weathered » est une description **positive de forme**, pas une géographie. Le casting 1998 vient des 6 variantes et de la passe `art-advisor`, pas d'un adjectif national.                                                                                             |
| 3   | `rough black ink linework` → `thick black ink outline` ; `coarse halftone dots` → `sparse coarse halftone dots` | (voir Q6)             | Le trait noir est l'organe de la scène. `outline`+`thick` le nomme comme contour porteur ; `sparse` confine la trame à l'ombre au lieu de la laisser recouvrir le trait. `rough` et `hatch` supprimés : redondants avec `Photocopied` / `xerox toner` / `dots`, ils payaient le budget de mots sans rien tenir.                                                                             |

### 8.2 Conditions de PASS (toutes bloquantes)

- **C-A — Roll 1 est un roll de REPÈRES, pas de visage.** La planche brute est livrée
  telle quelle et je la lis **avant tout tranchage**. `slice-portrait-plate.mjs` ne tourne
  pas sur roll 1 tant que je n'ai pas PASSé les repères.
- **C-B — `findTickY` doit pouvoir échouer.** Aujourd'hui il retourne **toujours** une
  ligne (la plus sombre de la fenêtre ±24 px), y compris quand aucun repère n'existe : un
  grain de toner devient un repère et `registerPortrait` **rescale le visage sur du bruit**.
  C'est le scénario « le recalage empire le cadrage » nommé dans le brief de gate.
  `dev-tooling-assets` doit ajouter un seuil de confiance (densité d'encre minimale sur la
  ligne retenue + contraste vs médiane de la fenêtre) qui **abort** au lieu de recaler.
  Pas de tranchage de planche réelle avant ce garde-fou.
- **C-C — Le grain de post-composition n'est PAS une seconde trame.** Voir Q3.
- **C-D — Aucun re-roll de ce prompt pour produire une variante.** Voir Q4.
- **C-E — Cap de 2 batches** (bible §6). Au-delà : escalade Bertrand avec la voie de repli
  §5.2 (gabarit héros dessiné à la main, FLUX cantonné aux variations img2img masquées),
  chiffrée, pas décidée en sous-main.

### 8.3 Réponses aux six questions

**Q1 — Les repères de marge : achat ou pari ? → C'est un PARI, et je l'assume avec un plan B.**
Le prompt fait ce qu'il peut : les repères sont décrits comme **partie de l'imprimé** et
non comme overlay technique, ce qui est la bonne stratégie et la seule compatible avec la
bible §3.6. Mais FLUX place les ticks où il le veut, et surtout : la marge fait **48 px sur
une planche de 864×1120**, soit ~4 % de l'image. C'est très peu de surface pour que le
modèle y loge 8 tirets + 4 croix de coupe lisibles. Attends-toi à des repères présents mais
imprécis, ou à des annotations parasites.
**Plan B, dans cet ordre :** (1) C-B — le détecteur abort au lieu de mentir ; (2) si les
ticks sont présents mais hors fenêtre ±24 px, on élargit la fenêtre et on **repin** les
constantes `EYE_LINE_FRAC` / `NOSE_BASE_FRAC` sur ce que la planche donne réellement (ce
sont des nominaux, pas des lois — les lois sont les coutures 0,32/0,52/0,72) ; (3) si les
ticks sont absents ou décoratifs, on recale sur le **visage lui-même** (ligne de densité
d'encre maximale = ligne des yeux) et les repères redeviennent du décor d'imprimeur ;
(4) si (3) ne converge pas en 2 batches → repli §5.2, escalade.

**Q2 — Le tilt : `eye line level` suffit-il ? → NON, et ce n'est pas grave, parce que le
tilt est un défaut DÉTECTÉ, pas un défaut LIVRÉ.**
L'arsenal réel n'est pas un token mais quatre : `eye line level`, `orthographic projection`,
`centred`, et surtout les ticks **gauche ET droite** qui encodent la rotation dans leur
désaccord. Le script en tire `tiltPx` et rejette à `tiltPx ≥ 24 px`, soit **≈ 1,6°** sur la
largeur de planche — trois fois plus sévère que ma tolérance de 6° du §1.2bis. Un visage à
4° ne passe donc pas en douce : il fait rejeter la planche, ce qui est exactement le
comportement voulu (§1.2bis, portée du rejet). Deux réserves consignées : ce seuil ne vaut
que si C-B est en place (sinon il mesure du bruit), et il produira des **faux rejets** ; si
les rejets se mettent à clusteriser sur le tilt plutôt que sur la dérive verticale, la
réponse est le resample affine complet noté dans l'en-tête du script, pas un
assouplissement du seuil. Je ne desserre pas 1,6° → 6° pour faire passer une planche.

**Q3 — Double couche de grain : je VALIDE les deux, avec une règle neuve.**
Elles ne s'annulent pas — la première est un **procédé de dessin** (trame de demi-teinte,
dans le trait), la seconde est un **procédé de tirage** (bruit de toner, sur le visage
assemblé), et c'est la seconde qui est obligatoire par §1.0 puisqu'un grain par bande
dessinerait les coutures. Mais il y a un mode d'échec que personne n'a nommé : **deux
trames périodiques superposées à des pas différents font du moiré**, et un moiré à travers
les 4 bandes est visuellement une couture. D'où la règle, que j'inscris comme condition
C-C et que je proposerai à la bible : _le grain de post-composition est un bruit
**non périodique** (`feTurbulence`), jamais un second point de trame, jamais une grille de
points, jamais un angle de hachure._ Une seule trame régulière dans l'écran, et elle est
dans le PNG. Surveillance au gate composite : **G7a** est étendu — pas de moiré, pas de
battement de trame, grain unique et continu à travers les 3 coutures.

**Q4 — Une planche = un visage, 6 variantes en `kontext` img2img, un descripteur à la fois :
CONFIRMÉ.** C'est mon §5.2 et rien n'a bougé. Trois précisions opposables : (a) **aucune
variante ne se produit en re-rollant ce prompt** — un re-roll change le crâne, donc casse
le raccord par construction (ADR-0011) ; (b) chaque planche dérivée **repasse le même
contrôle de repères et la même mesure de coutures** que la planche héros, elle n'hérite pas
de son PASS ; (c) le descripteur varié doit rester **dans sa bande** (§1.2 : pas de frange
qui descend sur les yeux, pas de moustache qui monte sur le nez) — un descripteur qui
déborde sa couture est un rejet de planche, pas une variante ratée.

**Q5 — L'échange proposé est REFUSÉ. Je n'échange pas les oreilles.**
`small ears flat to the skull` n'est pas une clause de décor, c'est une **clause de
raccord** : mon §1.1 met les oreilles dans le gabarit, et mon §1.2 fait de « l'amorce des
oreilles » un des éléments qui doivent coïncider à la couture C1. Une oreille décollée
déforme le contour extérieur du crâne exactement là où C1 tombe ; et l'oreille est, avec
les yeux, l'élément **pair** le plus exposé au FAIL de parité G6. La sacrifier, c'est
acheter un mot au prix d'une couture. Ce que j'échange à la place, et que j'ai déjà
appliqué : `Parisian`, `rough`, `hatch`, `deep`. Quatre mots qui ne tenaient rien —
`deep eyes` était même contre-productif, des orbites creusées appellent du modelé sous
`flat frontal light` et le modelé près de C1/C2 est ce qui fabrique les fractures. Résultat :
**118 mots**, deux de marge rendus à la lane pour une clause de correction future.

**Q6 — Le trait noir : le prompt d'origine ne le garantissait pas assez. Il le garantit
maintenant, sous surveillance.**
Le calcul est celui du §1.2bis : planche réduite d'un facteur ≈ 4,6 pour une bande de
56-68 px. `coarse` est le bon choix — une trame fine devient un gris sale à la réduction,
une trame grossière survit en points lisibles. Le danger n'était pas la finesse, c'était la
**couverture** : rien n'empêchait FLUX de poser des points sur le trait lui-même, et un
contour tramé à ×4,6 se dissout. D'où `sparse` (la trame est de l'ombre, pas un
remplissage) et `thick ... outline` (le contour est nommé comme contour porteur, pas comme
« linework » indifférencié). **Critère de recevabilité chiffré** : sur roll 1, la planche
réduite à hauteur de bande réelle doit conserver un contour de crâne **continu et non
interrompu** sur tout son pourtour ; un contour qui se rompt ou vire au gris à la réduction
est un rejet de planche, pas un réglage de post-traitement.

### 8.4 Critères de recevabilité du ROLL 1 — dans l'ordre où je regarde

`concept-artist` a raison : **les ticks avant le visage.** Ordre de lecture imposé.

1. **Les repères.** 4 tirets latéraux (pupille G/D, narines G/D), 2 tirets d'axe (haut/bas),
   4 croix de coupe. Présents, **dans la marge**, dessinés au même trait, horizontaux.
2. **La géométrie du recalage.** Les tirets pupille G et D à la même ordonnée ; idem
   narines. Écart G/D visible à l'œil = tilt = rejet.
3. **Le format.** 864 × 1120 exact — `runReal` jette sinon, et il a raison.
4. **Le contour à la réduction** (critère Q6).
5. **Les zones de couture.** Front (0,32), au-dessus de l'arête (0,52), philtrum (0,72) :
   plates et peu contrastées, aucun trait fort ne les traverse.
6. **Balayage défauts IA (G6)**, sur fond contrastant : parité yeux / oreilles / sourcils,
   dents, zones claires encloses.
7. **Le registre**, en dernier : gueule dure de fanzine, pas belle gueule lissée.

### 8.5 Rejet immédiat de planche (aucune discussion, on rebrûle un batch)

- Repères absents, hors marge, ou remplacés par des **annotations / chiffres / texte**.
- Repères gauche et droite en désaccord visible (tilt).
- Vue 3/4, tête inclinée, crâne recadré ou tronqué, épaules coupées trop haut.
- **Photoréalisme, visage numérisé, dithering ordonné, dégradé lissé sur la peau,
  niveaux de gris rétro, palette ST** (§4, FAIL automatique).
- Le moindre pixel coloré (§4 / G5).
- Défaut de génération IA au sens de la bible §2 loi 3 (parité, fusion, membre détaché).
- Contour rompu ou gris à la réduction taille bande.
- Plus d'une épaisseur de trait, plus d'un angle de trame, ombre traversant une couture.

### 8.6 Ce que ce PASS NE couvre PAS

Il couvre **les mots**. Il ne couvre ni les PNG (asset gate, G1-G6, sur la planche de
combinaisons G1 — sans elle, pas de verdict), ni le liseré de sélection, ni le
verrouillage, ni la jauge, ni la jointure à l'écran (**gate composite G7/G7a/G7b/G7c**, sur
captures in-game réelles uniquement). Un PASS de prompt n'a jamais valu un PASS d'asset.

**Règle candidate à la bible issue de ce gate** (§3 de ma fiche, à intégrer avec les deux
déjà en attente) : _une seule trame régulière par surface — un grain de post-composition
est un bruit non périodique, jamais une seconde trame_ (motif Q3, moiré = couture).

---

## Statut

Brief de cadrage — **pas un gate** (le gate prompt est en §8). Aucun asset généré, aucun prompt écrit, `levelArt.json` non
touché. Les prompts passeront par le **prompt gate** (bible §6) ; les PNG par l'**asset gate** ;
le liseré de sélection par le **gate composite** sur captures in-game.

Règles nouvelles proposées à l'intégration dans `docs/art-direction.md` une fois la scène cadrée
(bible gate, §3 de ma fiche) : **la règle de raccord** (§1, avec ses tolérances §1.2bis) et **le
plancher de discernabilité** (§2), qui sont deux lois de famille que la bible ne couvre pas encore
parce qu'aucun ensemble muf n'était jusqu'ici composé de morceaux interchangeables.

**Rév. 2 — une troisième règle candidate, plus large que cette scène :** la bible connaît le glow
(§2 loi 1) et l'imprimé (§2bis), mais **elle ne dit rien d'une surface DOM interactive** — ni monde
ni menu. ADR-0079/0080/0081 viennent d'en créer une. Je proposerai un **§2ter** : sur une surface
DOM interactive, la loi du glow s'applique **à la lettre et rien qu'à la lettre** — brille ce qui
se manipule (la bande visée), et **rien d'autre, y compris ce qui est urgent** (la jauge de chrono
ne brille pas, §4bis.3). C'est le point où j'avais moi-même dérapé en rév. 1 en important le
réflexe « alerte HUD » sur un écran qui n'a pas de HUD.

---

## 9. GATE DIMENSIONS — plafond de surface Pollinations (lead-art, Nico) — 2026-08-05

Escalade `dev-tooling-assets` après ROLL 1 : la planche demandée en **864 × 1120** revient en
**674 × 874**. Ratio identique à 0,03 % près, facteur linéaire ≈ 0,78 : le service plafonne la
**surface** à ~590 000 px (précédent documenté sur `gen-level-art.mjs`, 1280×768 → 991×594, même
service, même facteur). Le contenu utile que j'avais spécifié — 768 × 1024 = 786 432 px, **marges
non comprises** — dépasse le plafond à lui seul. Il n'existe donc aucune demande qui reviendrait
non réduite. Le fait est établi, je ne le rediscute pas.

### 9.1 Décision : **VOIE B**, et pour une raison qui n'est pas de confort

Je cadre le brief sur ce que le service sait rendre. **Voie A refusée**, pour deux motifs :

1. **A institutionnalise une troncature silencieuse.** §8.4 critère 3 exige « 864 × 1120 exact » et
   `runReal` jette sinon : sous A, toute planche est en échec de format permanent, et la seule
   issue serait d'affaiblir le contrôle de format — c'est-à-dire de rendre l'écart demandé/livré
   invisible. Un contrôle qu'on désarme parce qu'il a raison est pire que pas de contrôle.
2. **Demander plus gros invite un rééchantillonnage.** Aujourd'hui le service génère nativement au
   format plafonné ; rien ne garantit qu'il ne se mettra pas à downsampler une génération plus
   grande. Un contour de fanzine passé au filtre bilinéaire perd exactement ce que je protège en
   §8.3 Q6 : la continuité du trait. On ne demande pas une définition qu'on ne recevra pas.

A et B donnent la même image ; B est la seule qui la **déclare**.

### 9.2 Dimensions cibles et marges — exactes

Le principe de répartition, et c'est lui la vraie décision artistique : **la marge ne se met pas à
l'échelle, le portrait si.** Un anticrénelage fait 1-2 px quelle que soit la planche ; un repère
doit rester détectable en px absolus (trait continu ≥ 6 px, pic ≥ 3× la médiane, exigence
`dev-tooling-assets`). La marge et le bleed sont des grandeurs **absolues** ; le visage a du mou,
la marge n'en a pas. Je prends donc les pixels manquants sur le portrait, pas sur les repères.

| Grandeur                          | Valeur                          | Statut                                        |
| --------------------------------- | ------------------------------- | --------------------------------------------- |
| **Planche livrée**                | **676 × 871** (588 796 px)      | exact, `runReal` contrôle ; sous le plafond   |
| **Marge sur les 4 côtés**         | **48 px**                       | **inchangée** — absolue, non mise à l'échelle |
| **Cadre du portrait**             | **580 × 775**                   | 0,749 (l'ancien 0,750, écart non gaté)        |
| **Bleed de couture**              | **12 px de chaque côté**        | **inchangé** — absolu (anticrénelage)         |
| **Épaisseur du trait de contour** | **5 à 6 px** (0,65-0,78 % de H) | remplace « 6-8 px à 1024 »                    |

Coutures, en ordonnées de planche (0,32 / 0,52 / 0,72 de 775, toutes entières — 775 est multiple
de 25, c'est pour ça qu'il est retenu plutôt que 780) : **C1 y = 296**, **C2 y = 451**,
**C3 y = 606**. Hauteur de portrait H = 775 px = le nouveau référentiel du § 1.2bis.

### 9.3 Nouveau tableau de tolérances — l'invariant est le **pixel rendu**, pas le pixel de planche

La question posée est la bonne et la réponse est : **ça durcit.** À 1024 px de portrait, la
réduction vers une bande de 56 px (portrait rendu ≈ 224 px) valait ≈ 4,6. À 775 px elle vaut
**≈ 3,46**. Un même défaut géométrique de planche se voit donc **33 % plus grand à l'écran**. Mes
seuils n'ont jamais été des px de planche : ils étaient des px **rendus** (PASS ≤ 0,43 px rendu,
rejet ≥ 0,87 px rendu = la moitié de l'épaisseur du trait à l'écran, §1.2bis). Je les reconduis
tels quels et je reconvertis. La mise à l'échelle mécanique ×0,78 tombe au même endroit — non par
coïncidence, mais parce que ×0,78 **est** la conversion render-invariante. Elle est donc juste, et
elle est plus sévère en px de planche parce que la planche est moins réduite. C'est l'exigence qui
est constante ; c'est le chiffre qui bouge.

| Grandeur mesurée à la couture       | PASS                     | Zone d'alerte | Rejet de planche        |
| ----------------------------------- | ------------------------ | ------------- | ----------------------- |
| **Demi-largeur du crâne** (G et D)  | **≤ 1,5 px** (≤ 0,19 %)  | 1,5 – 3,0 px  | **≥ 3,0 px** (≥ 0,39 %) |
| **Position de l'axe médian**        | **≤ 0,75 px** (≤ 0,10 %) | 0,75 – 1,5 px | **≥ 1,5 px** (≥ 0,19 %) |
| **Écart de tangente du contour**    | **≤ 3°**                 | 3° – 6°       | **≥ 6°**                |
| **Épaisseur de trait entre bandes** | **≤ 10 % relatif**       | 10 – 15 %     | **> 15 %**              |

Trois clauses de mesure, sans lesquelles ce tableau est décoratif :

- **Mesure sous-pixel obligatoire.** À 0,75 px, le seuil est sous la quantification entière : la
  demi-largeur et l'axe se mesurent au **centroïde pondéré par l'alpha** du trait de contour (5-6 px
  d'épaisseur, l'estimation sous-pixel est légitime), pas au premier pixel non transparent. Un
  script qui ne sait mesurer qu'en entiers ne mesure pas ce tableau — il faut le dire, pas arrondir.
- **La tangente se fit sur une base proportionnelle** : arc de **5 % de H (≈ 39 px)** de part et
  d'autre de la couture. Sur une planche plus petite, un fit à base fixe devient du bruit ; l'angle
  est sans échelle, son estimateur ne l'est pas.
- **Deux grandeurs simultanément en zone d'alerte sur la même couture = rejet** (inchangé), et la
  portée du rejet reste la **planche entière** (§1.2bis, gabarit atomique, ADR-0080 D5).

Le reste de §1.2bis est inchangé, y compris la clause qui compte : **le mécanique ne me lie pas.**

### 9.4 Réponse à la question posée : 674 px de large, est-ce que ça suffit ?

**Oui pour le visage. Non pour les marges — et c'est pour ça que je ne mets pas les marges à
l'échelle.**

- **Le visage : oui, largement.** 580 px de large pour une tête frontale en trame grossière, rendue
  à ≈ 168 px, c'est une réduction de ×3,46 avec un contour de 5-6 px qui arrive à ≈ 1,6 px écran —
  au-dessus du seuil de continuité que je défends en §8.3 Q6. Le courier a été livré en beaucoup
  moins. La définition n'est pas le risque ici.
- **Les marges à 37 px : non.** Un repère au trait de contour (5-6 px) dans 37 px de marge doit être
  détecté avec un pic ≥ 3× la médiane : la fenêtre de bruit devient plus étroite que la tolérance de
  placement de FLUX, et un tiret qui mord le cadre du portrait ou sort de planche n'est plus un
  défaut de dessin, c'est un défaut de brief. **48 px conservés**, payés par le portrait (−6 % de
  hauteur de visage, imperceptible). C'est l'arbitrage : je sacrifie du visage, jamais du repère.

Donc **pas** de repli §5.2 aujourd'hui. Mais la condition est nommée à l'avance, pour qu'on ne la
redécouvre pas à chaud : **si ROLL 2 rate les repères dans 48 px de marge, ce n'est plus un problème
de dimensions — c'est FLUX qui ne sait pas dessiner un repère de recalage**, et aucune troisième
géométrie ne le corrigera. Dans ce cas précis, on ne rebrûle pas : **repli §5.2** (gabarit héros
fait main, FLUX réduit aux variations internes en img2img masqué), escaladé à Bertrand avec les
deux options chiffrées.

### 9.5 Portée et budget

Ce gate couvre **les dimensions et les tolérances**. Il ne vaut ni PASS de prompt (§8 — il faut y
reporter 676 × 871 au critère §8.4-3, seule modification requise du prompt : le format, pas les
mots), ni PASS d'asset (G1-G6, sur planche de combinaisons), ni gate composite (G7). **Budget :
ROLL 1 consommé, il reste UN tirage avant escalade Bertrand** (cap 2 batches, bible §6). Le
prochain tirage part au nouveau format ou ne part pas.

**Verdict : PASS conditionnel sur VOIE B**, aux dimensions et tolérances ci-dessus.

---

## 10. GATE RECALAGE — VOIE B, recalage sur le dessin (lead-art, Nico) — 2026-08-05

Bertrand a tranché : on abandonne les repères de marge, on recale sur le visage par densité
d'encre. C'est le cran (3) de mon plan B §8.3 Q1. Le repli §5.2 n'est pas retenu aujourd'hui.

**Ce que ROLL 2 a réfuté, et je l'acte sans réserve.** Ma clause de repères était un pari nommé
comme tel ; il est perdu. Le diagnostic est plus dur qu'un mauvais placement : sur 3 des 4 repères,
le meilleur candidat est à **1,0× la médiane du fond**. FLUX n'a pas mal dessiné les repères, il
n'en a dessiné aucun et a rempli la marge de texture. Ma §9.4 avait nommé cette issue à l'avance
(« FLUX ne sait pas dessiner un repère de recalage, aucune troisième géométrie ne le corrigera ») :
elle est constatée. **La clause de repères ne se rejoue pas, à aucun format, sous aucune
formulation.** Toute réapparition d'un token de repère de marge dans ce prompt est un FAIL de
prompt gate, sans discussion. Les **traits de coupe** partent avec — même pari, même verdict.

Je laisse §1.2bis et §9 en place tels quels : ils sont l'historique du raisonnement et §9.3 reste
opposable (voir §10.3). Le tableau de repères de §1.2bis est **caduc**, remplacé par §10.2.

### 10.1 Le prompt révisé — les trois champs

Budget : l'assemblé passait à **118 mots**. Les 21 mots de la clause de repères sortent → 97.
Je réinvestis **19 mots** dans `opening` et **2** dans `prompt` → **118 mots**, deux mots de marge
rendus à la lane, comme en §8.

**`opening`** (la clause de repères est supprimée et remplacée) :

> `Flat 2D black ink drawing on a printed sheet: one human head, strict frontal view,
orthographic projection, centred, eye line level, crown to collarbone, constant skull width.
One unbroken closed skull outline containing the hair, crown and chin inside the sheet, blank
white cheeks and forehead. `

**`prompt`** (une seule substitution, `thin level mouth` → `one thin level mouth line`) :

> `Hard weathered face, broad flat forehead under a straight low hairline, wide-set eyes under a
heavy level brow, straight narrow nose ending blunt, long flat philtrum, one thin level mouth
line, square jaw, small ears flat to the skull, bare neck. `

**`style`** : **inchangé**. Il n'a jamais servi le recalage, il sert le trait ; rien dans ROLL 2 ne
le met en cause.

> `Photocopied 1990s punk fanzine illustration: thick black ink outline of one constant weight,
sparse coarse halftone dots at one 45-degree angle, flat frontal light, uniform white paper
(#FFFFFF), high-contrast xerox toner.`

**Ce que j'achète avec les 21 mots récupérés, clause par clause — c'est opposable :**

| Clause neuve                        | Ce qu'elle tient                                                                                                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `One unbroken closed skull outline` | Le contour devient le **référentiel de recalage** (§10.2) : il doit être un objet mesurable, donc fermé et continu. C'est aussi la clause §8.3 Q6 (contour porteur) promue de critère de lisibilité à **condition de mesurabilité**.                 |
| `containing the hair`               | Rend opposable au dessin ce que §1.1 n'imposait qu'au découpage : **la coiffure ne redessine pas la silhouette du crâne**. Sans elle, la variante « cheveux » déplace le sommet du crâne et détruit le référentiel vertical d'une planche à l'autre. |
| `crown and chin inside the sheet`   | Sommet et menton sont les **deux ancres verticales**. Tronqués, il n'y a plus d'échelle du tout. Ça remplace, en positif et sur le dessin, ce que les traits de coupe devaient garantir.                                                             |
| `blank white cheeks and forehead`   | La clause la plus importante des trois. Elle ne décrit pas un style : elle garantit l'**unicité** des pics de densité (§10.2). Une joue tramée fabrique un maximum horizontal concurrent, et le détecteur choisit la joue.                           |
| `one thin level mouth line`         | `line` nomme la bouche comme **trait horizontal unique**, pas comme volume de lèvres. C'est le pic de contrôle bas.                                                                                                                                  |

Rien n'est sacrifié pour les payer : `small ears flat to the skull` reste (Q5 tient toujours,
et l'oreille redevient importante — elle est sur le contour, donc sur le référentiel).

**VERDICT PROMPT : PASS.** Zéro négation, description positive de forme, sol papier et sol encre
présents, 118 mots ≤ 120. La reformulation exacte des 19 mots reste ouverte à `concept-artist` :
elle peut proposer mieux **à contrat identique** (contour fermé / coiffure incluse / sommet-menton
dans la planche / joues et front blancs), ça repasse par moi ; elle ne peut pas en retirer une.

### 10.2 Les ancrages — ce qui est opposable à `dev-tooling-assets`

**Le renversement, et c'est le cœur de ma réponse : on ne recale pas sur un trait du visage, on
recale sur le CONTOUR.** Les traits du visage sont tous, sans exception, propriété d'une bande
variante — cheveux (bande 1), yeux (2), nez (3), bouche (4). Recaler sur eux, c'est recaler sur ce
qui change **par construction**. Le contour extérieur du crâne, lui, est déclaré invariant par
§1.1 (« le contour appartient au gabarit, pas à la variante ») et cette invariance est désormais
écrite **dans le prompt** (§10.1). C'est ça, la propriété qui garantit que l'ancrage tombe au même
endroit d'une génération à l'autre — pas la stabilité statistique de FLUX, mais une **loi de
gabarit déjà en vigueur, rendue mesurable**. Les repères devaient importer une invariance externe ;
la voie B utilise celle qu'on possédait déjà.

**Ancrages, par rang. Ce tableau est opposable ; `dev-tooling-assets` fixe ses seuils dessus.**

| Rang | Ancrage                                                       | Rôle                                                   | Pourquoi il est stable                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0   | **Contour du crâne** : ordonnée du sommet, ordonnée du menton | **Référentiel vertical unique** (origine + échelle H)  | Gabarit §1.1, verrouillé dans le prompt. Trait de 5-6 px continu = l'objet le plus encré de la planche, très au-dessus du fond. Aucune bande n'a le droit d'y toucher.                                                                                                              |
| A0   | **Demi-largeurs du contour, par ligne** → axe médian pondéré  | **Référentiel horizontal** (centrage + détection tilt) | Même objet, même invariance. Se mesure déjà : c'est exactement la grandeur de §9.3.                                                                                                                                                                                                 |
| A1   | **Barre sourcils + yeux** (pic de densité horizontal haut)    | **CONTRÔLE**, jamais référentiel                       | Ordonnée gabarit (`eye line level`, `heavy level brow`), mais dessin propriété de la bande 2. Sert à vérifier la proportion et à mesurer le tilt (pic G vs D).                                                                                                                      |
| A2   | **Ligne de bouche** (pic de densité horizontal bas)           | **CONTRÔLE**, jamais référentiel                       | Idem, bande 4. Deuxième point de proportion : le couple A1/A2 attrape une planche dont les proportions internes ont dérivé alors que A0 est bon.                                                                                                                                    |
| —    | **Base du nez / narines**                                     | **ABANDONNÉ**                                          | C'était un nominal ADR-0080 D5 ; il ne survit pas au changement de méthode. Deux petites taches non jointives, faible encre, forte variance de forme : ça ne fait pas un maximum horizontal franc. Le retenir, c'est refabriquer le mode d'échec de ROLL 2 à l'intérieur du visage. |

**Les quatre clauses de méthode, sans lesquelles ce tableau est décoratif :**

1. **Un pic de densité n'est un ancrage que s'il est UNIQUE dans sa fenêtre.** Le critère n'est pas
   « le plus sombre » (c'est exactement le défaut C-B de `findTickY`, qui retournait toujours une
   ligne) mais **le plus sombre ET séparé du deuxième candidat de sa fenêtre**. Si le second pic
   est à moins de 2× le premier, le détecteur **abort**. La clause `blank white cheeks and
forehead` existe pour rendre cette séparation atteignable.
2. **C-B reste en vigueur, transposé.** Le détecteur doit pouvoir échouer sur le visage exactement
   comme il devait pouvoir échouer sur la marge. Abort > recalage sur du bruit. C'était vrai en
   marge, c'est plus vrai encore ici : un mauvais recalage intérieur donne une planche
   **plausible**, donc une fracture qu'on découvre à l'écran.
3. **Aucun ancrage ne tombe sur une couture.** C1 y=296 (front), C2 y=451 (au-dessus de l'arête),
   C3 y=606 (philtrum) sont par construction des zones plates et peu contrastées : elles sont donc
   exactement là où un pic de densité **ne doit pas** exister. A1 vit entre C1 et C2, A2 sous C3,
   A0 hors bandes. Un pic de densité détecté à moins de 5 % de H d'une couture est un **défaut de
   planche** (§8.4-5 : aucun trait fort ne traverse une couture), pas un ancrage.
4. **Le recalage inter-planches se mesure, il ne se suppose pas.** Chaque planche dérivée est
   recalée **sur la planche héros** (A0 → A0), et l'écart est journalisé, pas seulement testé. Une
   planche qui abort n'est pas tranchée ; une planche qui passe sort avec ses chiffres.

### 10.3 Tolérances — ce qui tient, ce qui ne tenait pas, et l'aveu

La question est juste et la réponse tient en une distinction que je n'avais pas explicitée en §9 :
**§9.3 ne mesure pas le recalage. §9.3 mesure les coutures.**

- **Les seuils §9.3 tiennent, inchangés** (demi-largeur ≤ 1,5 px, axe ≤ 0,75 px, tangente ≤ 3°,
  trait ≤ 10 %). Ils portent sur le **contour**, mesuré au **centroïde pondéré alpha d'un trait de
  5-6 px**, de part et d'autre d'une couture, **à l'intérieur d'une même planche**. Ils ne
  dépendent d'aucun repère et ne dépendaient déjà d'aucun : un recalage raté ne les déplace même
  pas, puisqu'il translate les deux côtés de la couture de la même quantité. Le sous-pixel est
  légitime ici parce que l'objet mesuré est un trait imprimé net, pas une structure floue. Je ne
  les desserre pas et ce n'est pas de l'entêtement : rien dans le passage à la voie B ne les
  concerne.
- **Ce que la voie B dégrade, c'est le recalage inter-planches — et là je desserre franchement.**
  A0 mesure une **courbure** (calotte crânienne, menton), pas un trait horizontal : l'ordonnée
  extrême d'un arc est mal définie quand l'arc est plat, et une variante de coiffure fera bouger le
  sommet de quelques pixels quoi qu'en dise le prompt. Prétendre y tenir 0,75 px serait produire un
  rejet systématique, et **un contrôle qui rejette tout ne protège rien**. Nouveau tableau, il est
  neuf, il ne remplace rien :

| Grandeur, planche dérivée vs planche héros                   | PASS                      | Alerte       | Rejet de planche |
| ------------------------------------------------------------ | ------------------------- | ------------ | ---------------- |
| **Hauteur de crâne H (sommet → menton)**                     | **≤ 0,5 % de H** (≈ 4 px) | 0,5 – 1,0 %  | **≥ 1,0 %**      |
| **Axe médian, écart de centrage**                            | **≤ 1,5 px**              | 1,5 – 3,0 px | **≥ 3,0 px**     |
| **Ordonnée A1 (barre yeux), en fraction de H**               | **≤ 1,0 % de H**          | 1,0 – 2,0 %  | **≥ 2,0 %**      |
| **Ordonnée A2 (ligne bouche), en fraction de H**             | **≤ 1,5 % de H**          | 1,5 – 3,0 %  | **≥ 3,0 %**      |
| **Tilt : désaccord d'ordonnée entre pic œil G et pic œil D** | **≤ 8 px**                | 8 – 16 px    | **≥ 16 px**      |

Deux points que j'assume à voix haute :

- **Le seuil de tilt passe de 24 px « rejet » à 16 px.** Ce n'est pas un durcissement de confort :
  §8.3 Q2 chiffrait 24 px sur la **largeur de planche à 864**, soit ≈ 1,6°. À 676 px de large, le
  même angle vaut ≈ 19 px et j'arrondis à 16 px pour rester du bon côté. L'exigence est constante,
  c'est le chiffre qui bouge — même raisonnement qu'en §9.3.
- **Ces seuils sont un plancher automatisable, pas un verdict.** Clause §1.2bis reconduite mot pour
  mot : **le mécanique ne me lie pas.** Une planche qui passe les cinq mesures et dont un raccord
  se voit à l'œil sur la planche de combinaisons G1 est FAIL quand même.

### 10.4 Budget — nouveau cap, et sa condition d'abandon nommée d'avance

**Cap : 2 tirages.** ROLL 3 = planche héros au prompt §10.1. ROLL 4 = un seul re-roll, et
**uniquement** si l'échec de ROLL 3 est un échec de dessin nommable et corrigeable (voir ci-dessous).
Au-delà : escalade Bertrand, deux options chiffrées, pas de troisième tirage en sous-main.

**La distinction qui décide, et c'est la question posée : est-ce un mauvais tirage, ou la méthode
qui ne marche pas ?** Le départage se fait sur **l'objet référentiel**, pas sur le visage.

- **Mauvais tirage (retryable, ROLL 4 autorisé).** Le contour est fermé, continu, mesurable ; A0
  sort des chiffres ; mais la planche échoue sur le registre, la parité G6, le tilt, une couture
  traversée, ou un ancrage trop près d'une couture. Le référentiel existe, le dessin est raté :
  on rebrûle une fois.
- **La méthode ne marche pas (ABANDON de la voie B, escalade immédiate, pas de ROLL 4).** Un seul
  des trois signaux suffit :
  1. **Le contour n'est pas un objet.** Il se rompt, se dédouble, se fond dans la coiffure ou dans
     la trame, ou son ordonnée de sommet/menton ne peut pas être extraite avec une séparation
     franche. Le référentiel lui-même est inmesurable — c'est le mode d'échec de ROLL 2 déplacé de
     la marge au dessin, et il vaut le même verdict.
  2. **Les pics ne sont pas uniques.** A1 ou A2 sort avec un second candidat à moins de 2× dans sa
     fenêtre, alors que `blank white cheeks and forehead` est dans le prompt. Ça signifierait que
     FLUX remplit le visage de texture comme il a rempli la marge — même diagnostic
     (« generalised noise »), même conclusion.
  3. **Ça ne se reproduit pas d'une planche à l'autre.** ROLL 3 est bon, mais la première dérivée
     `kontext` sort hors rejet sur H ou sur l'axe (≥ 1,0 % / ≥ 3,0 px). Le recalage n'est alors pas
     imprécis, il est **non reproductible** — et c'est précisément le service que les repères
     devaient rendre. Ce test-là est le vrai verdict de la voie B, et il faut le faire **tôt** :
     `dev-tooling-assets` produit **une** planche dérivée de contrôle avant d'en produire 23.

Ce dernier point est ma seule exigence de séquence sur le budget : **une dérivée de contrôle avant
la série**. Découvrir la non-reproductibilité à la 24ᵉ planche coûterait le batch entier.

**En cas d'abandon**, l'option chiffrée à mettre devant Bertrand reste le repli §5.2 (gabarit héros
dessiné à la main, FLUX cantonné aux variations img2img masquées) — qui, à ce stade, ne serait plus
un repli mais la conséquence logique de deux réfutations : FLUX ne dessine pas de repère, et FLUX
ne reproduit pas un gabarit. Il aurait alors le droit de dessiner **dans** un gabarit, pas de le
définir.

### 10.5 Ordre de lecture du ROLL 3 — remplace §8.4

§8.4 disait « les repères avant le visage ». Il n'y a plus de repères. Le nouveau principe est le
même à un cran de profondeur : **le référentiel avant le visage**, et le référentiel est le
contour.

1. **Le contour du crâne.** Fermé, continu, d'une seule épaisseur, sur tout le pourtour. La
   coiffure est **dedans**. C'est la seule chose que je regarde d'abord, et si elle rate je
   n'ouvre pas la suite.
2. **Sommet et menton.** Non tronqués, dans la planche, et **assez francs pour qu'une ordonnée
   extrême ait un sens** — pas un crâne plat sur 200 px, pas un menton noyé dans le cou.
3. **Le blanc.** Joues et front réellement blancs. C'est ce qui fait exister les pics ; une joue
   tramée est un rejet, pas un effet de style.
4. **Le format.** 676 × 871 exact.
5. **Les deux pics.** Barre yeux/sourcils et ligne de bouche : horizontales, franches, uniques
   dans leur zone. Et l'accord gauche/droite de la barre des yeux — c'est là que le tilt se lit
   maintenant.
6. **Le contour à la réduction** (critère §8.3 Q6, inchangé) : continu à hauteur de bande réelle.
7. **Les zones de couture.** C1/C2/C3 plates, aucun trait fort, aucun pic de densité.
8. **Balayage défauts IA (G6)**, sur fond contrastant : parité yeux / oreilles / sourcils, zones
   claires encloses.
9. **Le registre**, en dernier : gueule dure de fanzine, pas belle gueule lissée.

Les motifs de **rejet immédiat** de §8.5 restent en vigueur, moins les deux premiers (repères), et
plus un neuf : **contour ouvert, rompu, dédoublé, ou coiffure débordant la silhouette du crâne**.

### 10.6 Portée

Ce gate couvre **le prompt révisé, les ancrages, les tolérances de recalage et le budget**. Il ne
vaut ni PASS d'asset (G1-G6, sur planche de combinaisons — sans elle, pas de verdict), ni gate
composite (G7/G7a/G7b/G7c, sur captures in-game réelles). §10.1 remplace les mots gatés en §8 ;
§10.2 rend caduc le tableau de repères de §1.2bis ; §10.3 ajoute un tableau et n'en retire aucun.

**Verdict : PASS — voie B, prompt §10.1, ancrages §10.2, tolérances §10.3, cap 2 tirages §10.4.**

---

## 11. GATE PROMPT — rév. 3, post-regard Bertrand sur ROLL 3 (la couronne)

**Lane :** `lead-art` (Nico). **Entrée :** diagnostic `concept-artist` + trois consignes Bertrand
(vue de face obligatoire · les deux visages se ressemblent énormément · on n'est pas dans le style
BD). **Portée :** prompt uniquement. Ne vaut ni asset gate (G1-G6) ni gate composite (G7).
**Ce §11 remplace les mots gatés en §10.1.**

### 11.0 Le diagnostic est accepté, et je prends ma part

`concept-artist` a raison, et la preuve qu'elle avance est la bonne preuve : **deux couronnes sur
deux graines**, ce n'est pas du bruit, c'est une clause qui mord. `crown` était mon mot — je l'ai
écrit deux fois en §10.1 en croyant nommer une ordonnée anatomique, et j'ai commandé un objet porté.
`collarbone` a payé le collier de dentelle. L'absence de tout token de genre a payé le reste. C'est
la même erreur qu'en ROLL 2 sur les repères, à un cran de subtilité : **j'ai supposé que le modèle
lisait mon intention là où il ne lit que mes mots.**

Et la troisième consigne de Bertrand (« pas dans le style BD ») se lit dans la même mécanique :
80 mots de morphologie concrète appelant la photo, contre un bloc `style` qui démarre au mot ~90.
Le style n'a pas été ignoré, il a été **sous-pondéré**. La cure n'est pas d'ajouter des mots de
style — c'est de retirer des mots qui appellent la photo. La révision fait exactement ça.

### 11.1 Verdict par point

**1. Contrat §10.1 — TENU, les quatre clauses sont là.** Vérifié mot à mot, pas cru sur parole :
`One unbroken closed skull outline` ✓ · `containing the hair` ✓ · sommet+menton dans la planche ✓
(`the top of the head and the chin inside the sheet` — même clause, l'objet portable est sorti,
c'est la bonne substitution) · `blank white cheeks and forehead` ✓ · `constant skull width` ✓ ·
`one thin level mouth line` (pic A2) ✓. **PASS.**

**2. Frontalité par symétrie observable — PASS, et le refus de `mugshot`/`passport photograph` est
VALIDÉ sans réserve.** L'argument est juste deux fois. D'abord parce que `both ears equal, both eyes
the same size on one level line` est **faux par construction sur un trois-quarts** : ce n'est pas un
adjectif que le modèle peut satisfaire à moitié, c'est une contrainte géométrique réfutable — et
elle recouvre exactement ma parité G6 et le `tiltPx` de §10.3. Ensuite parce que `mugshot` et
`passport photograph` sont des mots de **photographie** : ils achètent la frontalité en payant le
médium, c'est-à-dire en payant précisément la consigne 3 de Bertrand. **On ne s'achète pas la
frontalité au prix du médium.** Je promeus ce refus en règle de prompt de la maison :

> **Règle de prompt (neuve, §11) — pas de token de médium concurrent.** Aucun mot qui nomme un
> autre médium que l'impression photocopiée (`photograph`, `mugshot`, `passport photo`, `portrait
> photography`, `render`, `3D`, `painting`) n'entre dans un prompt muf, **même pour acheter une
> propriété géométrique**. Toute propriété géométrique se décrit par une contrainte réfutable sur
> le dessin. Un token de médium est un FAIL de prompt gate.

**3. Les trois assouplissements — 2 PASS, 1 CONDITION.** Vérifié moi-même, pas déclaré :
- `a hairline across it` (ex `under a straight low hairline`) : la ligne de cheveux n'est **pas** un
  ancrage (§10.2 ne la liste pas), elle vit à l'intérieur de la bande 1. Rendre sa forme à la graine
  ne coûte rien de mesurable. **PASS.**
- `a nose` (ex `straight narrow nose ending blunt`) : la base du nez est **ABANDONNÉE** comme ancrage
  en §10.2. Rien à protéger. **PASS**, et c'est même sain — c'était 5 mots de morphologie photo.
- `eyes under a level brow` (ex `wide-set eyes under a heavy level brow`) : **NON.** `wide-set` peut
  partir (proportion, pas ancrage). **`heavy` ne peut pas.** A1 est un **pic de densité** (§10.2), et
  ce qui le rend franc et unique dans sa fenêtre, ce n'est pas son ordonnée (`level`, conservé) mais
  sa **charge d'encre** — c'est `heavy` qui commande une barre noire. Le retirer, ce n'est pas rendre
  une forme à la graine, c'est **désarmer l'ancrage A1** et fabriquer la condition d'abandon
  §10.4-2 (« les pics ne sont pas uniques »). **CONDITION C1 : restituer `heavy`.**
  → `eyes under a heavy level brow`.

**4. `one man's head` — TRANCHÉ PAR BERTRAND, ratifié. Pas d'escalade. Voir §11.3.**

**5. 120/120 — REFUSÉ en l'état. J'exige du mou, et je dis où le prendre. Voir §11.2.** Un prompt
au ras du plafond est un prompt qu'on ne peut plus corriger sans amputer ; §8 et §10.1 ont tous
deux rendu 2 mots à la lane, et ce n'était pas de la coquetterie — c'est la marge qui a permis
§10.1 d'exister sans arbitrage.

**6. Le risque de visage miroir — RECONNU, et il ne se traite pas par un mot de plus.** Voir §11.4.

### 11.2 Ce que la révision a perdu en silence, et le budget corrigé

**Un défaut non signalé, et il est sérieux : `uniform white paper (#FFFFFF)` a disparu du bloc
`style`.** C'était le **token de sol papier ancré en hex** — celui sur lequel reposent le contrôle
de fond de `check-sprite-style.mjs`, la propreté du cutout, et le contraste qui fait exister les
pics de §10.2. Un fond crème ou gris clair ne casse pas l'œil, il casse la **mesure**. La règle FLUX
de la maison exige les deux sols (papier + encre) : la révision n'en garde qu'un.
**CONDITION C2 : restituer `uniform white paper (#FFFFFF)` dans `style`.**

Trois conditions coûtent 5 mots (C1 : 1 · C2 : 4). Je les finance sans toucher une clause portante,
et je rends 2 mots de marge :

| Rachat                                                                                   | Gain | Motif                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `with the top of the head and the chin inside the sheet` → `top of head and chin inside the sheet` | 4    | Même clause, mêmes deux ancres verticales, zéro objet portable. Style télégraphique = registre planche d'imprimeur.                              |
| `Photocopied black ink drawing on white paper:` → `Black ink drawing on a printed sheet:` | 1    | `Photocopied` est déjà le premier mot de `style`, et le sol papier revient en hex par C2. On ne paie pas deux fois le même mot.                   |
| `broad flat forehead` → `broad forehead`                                                 | 1    | `flat` est déjà porté par `blank white cheeks and forehead` (front sans trame) et par `flat frontal light`. Redondance, pas clause.               |
| `wide-set` (déjà retiré par la révision)                                                 | 1    | Acté, proportion sans ancrage.                                                                                                                     |

**Budget final : 56 + 35 + 27 = 118 mots. Deux mots de marge rendus à la lane**, comme en §8 et
§10.1. La marge n'est pas décorative : c'est le droit de corriger ROLL 4 sans amputer une clause.

### 11.2bis Les trois champs GATÉS — c'est cette version-là qui va dans le script

**`opening`** (56) :

> `Black ink drawing on a printed sheet: one man's head facing forward, symmetrical about a vertical centre line, both ears equal, both eyes the same size on one level line, constant skull width. One unbroken closed skull outline containing the hair, top of head and chin inside the sheet, blank white cheeks and forehead.`

**`prompt`** (35) :

> `Hard weathered face, broad forehead, a hairline across it, eyes under a heavy level brow, a nose, long flat philtrum, one thin level mouth line, square jaw, small ears flat to the skull, bare neck.`

**`style`** (27) :

> `Photocopied 1990s punk fanzine illustration: thick black ink outline of one constant weight, sparse coarse halftone dots at one 45-degree angle, flat frontal light, uniform white paper (#FFFFFF), high-contrast xerox toner.`

Contrôle FLUX : zéro négation · zéro token de médium concurrent (§11.1-2) · zéro objet portable ·
description positive de forme · sol papier ancré `#FFFFFF` et sol encre présents · genre spécifié ·
118 ≤ 120. **PASS.**

`concept-artist` peut proposer mieux **à contrat identique** — les six clauses portantes sont
`One unbroken closed skull outline` · `containing the hair` · sommet+menton dans la planche ·
`blank white cheeks and forehead` · `heavy level brow` (pic A1) · `one thin level mouth line`
(pic A2), plus les trois clauses de symétrie. Elle ne peut en retirer aucune sans repasser par moi.

### 11.3 Point 4 — DÉCISION DE CASTING (Bertrand, 2026-08-06) : masculin, pour l'instant

**Tranché par Bertrand, 2026-08-06 : « Restons sur du masculin pour l'instant. »**
`one man's head` est **ratifié**. Je n'escalade pas à `narrative-designer` : la décision est prise
au-dessus de nous deux.

**Ceci est une décision de casting explicite, datée, et non un effet de bord du prompt.** Je
l'écris ici en toutes lettres parce que le mode d'échec est exactement l'inverse d'une erreur de
rédaction : **c'est la case laissée VIDE qui a produit les deux jeunes femmes photoréalistes.** Un
futur lecteur du prompt qui croirait `one man's head` accidentel et le retirerait au nom de la
neutralité ne rendrait pas le prompt neutre — il rendrait le casting au prior de FLUX.

> **Règle de casting (neuve, §11.3), opposable à toute révision future de ce prompt :**
> le token de genre est un **emplacement obligatoire**. Il se **change**, il ne se **vide** jamais.
> Le retirer est un FAIL de prompt gate, au même titre qu'un token de médium concurrent (§11.1-2).
> Si le casting devient mixte, ce sera **un token nommé, planche par planche** — jamais une vacance
> laissée au modèle.

**« Pour l'instant » est dans la décision, donc il est dans le brief : c'est un choix de V1,
réouvrable, pas une loi d'univers.** La réouverture est cadrée d'avance et peu chère : le scope
ratifié est **M=1 gabarit** (§5.1, gate A5) — les 24 assets sont **un seul visage**, décliné en
bandes. Un second gabarit (dont une variante genrée) est explicitement un **fast-follow** en §5.1,
et il porterait son propre token nommé. Quand la question se rouvrira, elle appartiendra à
`narrative-designer` (qui est ce visage : genre, âge, registre social — la faune d'une soirée
clandestine de 1998, §4) ; elle ne se rouvrira pas par omission dans un prompt.

Le raisonnement d'art qui soutient la décision, pour mémoire :

1. **La case vide est un défaut de prompt, pas une neutralité.** Sans token de genre, FLUX ne
   produit pas « un humain » : il produit son prior, et le prior a produit deux jeunes femmes
   photoréalistes. Laisser la case vide, ce n'est pas s'abstenir de caster — c'est **déléguer le
   casting au prior d'un modèle**, ce qui est le pire des deux mondes : ni décision de fiction, ni
   contrôle d'art. Un token de genre est **obligatoire** dans ce prompt, quel qu'il soit.
2. **La portée de fiction était surestimée, et `concept-artist` avait raison de ne pas trancher
   seule.** « Figer le casting au masculin sur les six planches » décrit **un personnage** sous le
   scope M=1, pas une politique de casting. Le coût d'une réouverture est un token nommé et un
   tirage, pas une identité de jeu — ce qui est exactement pourquoi « pour l'instant » est tenable
   sans dette.

### 11.4 Point 6 — le visage miroir : la symétrie est une loi de GABARIT, pas une loi de TRAME

Le risque est réel et je ne le paie pas avec un mot de plus (il n'y en a pas, et un adjectif de
caractère de plus ferait dériver le registre). Je le paie avec une **règle de gate**, qui a
l'avantage d'être opposable à la livraison plutôt qu'espérée à la génération :

> **Règle (neuve, §11.4) — la symétrie porte sur le crâne, jamais sur l'encre.** Ce qui doit être
> symétrique : le contour, la largeur, l'axe médian, la parité des éléments pairs (ancrages A0/A1,
> parité G6). Ce qui **ne doit pas** l'être : la trame, les hachures, les paquets de toner, l'usure,
> les accidents d'impression, les traits de caractère (une ride, une cicatrice, une paupière plus
> lourde). Une planche dont l'encre est symétrique par miroir est un **FAIL de registre** au titre
> de §4 (« pas de belle gueule lissée ») — la symétrie de gabarit ne l'excuse pas.

Conséquence sur l'ordre de lecture §10.5 : **le point 9 (« le registre, en dernier ») cesse d'être
un dernier regard et devient un motif de rejet à part entière**, au même rang que le contour. La
révision a déplacé le risque du photoréalisme vers la fadeur ; le gate suit le risque.
`Hard weathered face` porte seul le registre dans les mots — c'est mince, je l'assume, et c'est
exactement pourquoi le filet est du côté de la livraison.

### 11.5 Verdict

**PASS SOUS CONDITIONS** — les trois champs de **§11.2bis** (et non ceux soumis) partent en ROLL 3.

- **C1** — `heavy` restitué au brow (ancrage A1). _Bloquant._
- **C2** — `uniform white paper (#FFFFFF)` restitué dans `style` (sol papier ancré). _Bloquant._
- **C3** — 118 mots, deux de marge. Zéro mot ajouté sans rachat, et tout rachat repasse par moi.
- **C4** — casting **masculin, ratifié par Bertrand le 2026-08-06** (« pour l'instant »).
  `one man's head` est une **décision explicite**, pas un effet de bord : le token de genre se
  change, il ne se vide jamais (règle §11.3). Réouvrable en fast-follow, par token nommé.
- **C5** — §11.4 entre dans l'ordre de lecture : registre = motif de rejet, pas dernier regard.

Inchangés et opposables : ancrages §10.2, tolérances §10.3, **cap 2 tirages §10.4** (ROLL 3 = planche
héros ; ROLL 4 = un seul re-roll, et seulement si l'échec est nommable et corrigeable), exigence de
séquence §10.4 (**une dérivée de contrôle avant la série**). Ce gate ne vaut **ni** asset gate
(G1-G6, sur planche de combinaisons — sans elle, pas de verdict) **ni** gate composite (G7/a/b/c,
sur captures in-game réelles).

`concept-artist` écrit **§11.2bis** dans le script, mot pour mot.
