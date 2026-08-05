# Brief artistique — scène PORTRAIT-ROBOT

- **Lane :** `lead-art` (Nico) — brief de cadrage, stage 0/1. **Aucun prompt, aucun asset.**
- **Date :** 2026-08-05
- **Entrées :** `docs/research/research-photofit-robocop-atari-st.md` (§6 + encadré d'arbitrage),
  `docs/art-direction.md` (la bible, elle gagne), `docs/art-direction/prompt-drafts.md`,
  `docs/art-references/`, forme de famille : `src/game/levels/levelArt.json`.
- **Arbitrage fondateur (Bertrand, 2026-08-05) :** « pas forcément numérisée, on peut garder la
  direction artistique très BD comics actuelle ».
  → **La ST donne la mise en scène. La bible donne le trait.** Rien d'autre n'est emprunté à 1988.

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

| Couture | Position | Ce qui doit coïncider exactement de part et d'autre |
| --- | --- | --- |
| C1 — cheveux / yeux | ~32 % de la hauteur, au niveau du front, **au-dessus des sourcils** | largeur du crâne, contour des tempes, amorce des oreilles |
| C2 — yeux / nez | ~52 %, **au-dessus de l'arête du nez**, sous les pommettes | largeur des joues, ligne de pommette, amorce du nez (un trait, pas un bloc) |
| C3 — nez / bouche | ~72 %, sous les narines, **au-dessus de la lèvre supérieure** | largeur du bas de visage, philtrum, début de la mâchoire |

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
sera jugé sur des captures in-game réelles, pas sur les PNG.

---

## 4. Palette et rendu — la DA maison sur un visage humain en gros plan

Registre neuf pour muf : jusqu'ici nos sujets sont des véhicules, des silhouettes et des façades.
Un visage en gros plan expose le trait comme rien d'autre. Ce qui est autorisé et ce qui ne l'est
pas :

**AUTORISÉ**

- Noir et blanc pur : encre noire sur blanc de photocopie. Trait BD/comics franc, contrasté.
- Texture toner xerox, trame de demi-teinte grossière, hachures et aplats noirs.
- **Une seule** couleur néon dans la scène, exclusivement sur le liseré de sélection (§3) et,
  le cas échéant, sur le chrono quand il devient critique — parce qu'un chrono critique est une
  alerte HUD, et les alertes HUD brillent (bible §2 loi 1). Rien d'autre.
- Le cadre / le fond de la scène traité comme une **surface imprimée** si elle est jugée pré-jeu,
  ou comme monde de jeu si elle est dans la boucle. **À trancher** : si la scène est un écran
  intercalaire de type briefing, §2bis s'applique (papier, zéro glow) et le liseré de sélection
  devient une exception à motiver explicitement devant moi. Si c'est une phase de jeu dans le monde
  (mon hypothèse de travail, et ma préférence : elle a un chrono qui coûte une vie), §2 loi 1
  s'applique telle quelle et le CRT §8 la couvre. **Question ouverte 7.3.**

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

## 5. Faisabilité de production

### 5.1 Le volume réel

`4 bandes × N variantes × M visages`. Le piège : si les visages sont indépendants, le coût est
multiplicatif et l'ensemble explose. Quelques ordres de grandeur :

| Hypothèse | Assets bandes | Combinaisons offertes |
| --- | --- | --- |
| M=1 visage, N=4 | 16 | 256 |
| M=3, N=4 | 48 | 768 |
| M=3, N=6 | 72 | 3 888 |
| M=5, N=6 | 120 | 6 480 |

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
fracturée fait échouer tout l'ensemble** (§1, bible §2 loi 2).

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
bande active, en dégradé décroissant jusqu'à zéro (jamais un aplat, bible §2.1) ; cible sans aucun
glow ; cible et construction lisibles simultanément à la taille réelle mobile ; sous CRT, les
variantes restent discernables (§8.5/P5 de la bible). **Pas de capture lisible = pas de PASS.**

**G8 — Traçabilité.** Verdict par asset et par ensemble consigné dans `docs/agent-handoffs.md`,
avec la planche de combinaisons ayant servi à G1.

---

## 7. Questions ouvertes

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

## Statut

Brief de cadrage — **pas un gate**. Aucun asset généré, aucun prompt écrit, `levelArt.json` non
touché. Les prompts passeront par le **prompt gate** (bible §6) ; les PNG par l'**asset gate** ;
le liseré de sélection par le **gate composite** sur captures in-game.

Règles nouvelles proposées à l'intégration dans `docs/art-direction.md` une fois la scène cadrée
(bible gate, §3 de ma fiche) : **la règle de raccord** (§1) et **le plancher de discernabilité**
(§2), qui sont deux lois de famille que la bible ne couvre pas encore parce qu'aucun ensemble muf
n'était jusqu'ici composé de morceaux interchangeables.
