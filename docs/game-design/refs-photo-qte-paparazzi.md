# Reference board — QTE photo paparazzi, rue Belliard, nuit 1998

Hunt run by `graphic-references` (Ray), **mode non-interactif** : Bertrand a lancé le
stage 4 et n'est pas disponible pour le protocole habituel round-1/verdict. Board livré
documenté et argumenté directement ; mes questions sont en fin de fichier, non
bloquantes.

**Status : DRAFT — en attente du verdict `lead-art` / Bertrand.**

## Hunt context

- **Ce que je cherche pour :** le set-piece photo QTE où Muf, au téléobjectif depuis un
  toit rue Belliard (Paris 18e), photographie un commandant de police encaissant une
  enveloppe à la bouche d'un passage. Nuit, 23h40, 1998. Deux surfaces consomment ces
  refs : la **vue lunette** (viseur en jeu pendant la prise) et la **planche contact**
  (l'objet montré après coup — sélection des tirages).
- **Note de lecture** : `docs/game-design/spec-photo-qte-fiction.md` n'existe pas encore
  dans le repo à l'heure du hunt (`Glob`/`Grep` négatifs sur `spec-photo-qte-fiction.md`,
  `paparazzi`, `téléobjectif`, `planche contact`). Le board travaille donc sur la
  description de scène fournie par l'orchestrateur ; à recaler si le spec réel diverge
  une fois écrit — flagged en question finale.
- **DA maison** (`docs/art-direction.md`) : fanzine photocopié N&B + néon acide. Ce
  board sert la **photo argentique elle-même**, un référent documentaire distinct du
  néon-fanzine — il informe le grain/l'optique/le cadrage, pas la couleur. Le
  traitement final (xerox, N&B contrasté) reste la loi de `art-direction.md` §1 ; ces
  refs alimentent ce qu'il y a **avant** la photocopie : la photo-source.
- **Écarté d'emblée (anti-anachronisme)** : tout capteur numérique, tout bruit
  "digital noise"/JPEG, tout autofocus moderne à reconnaissance faciale, toute optique
  de smartphone. 1998 = argentique, mise au point manuelle, pellicule, flash ou
  disponible seul.

## Axe 1 — La photo argentique nocturne au téléobjectif (grain, optique, bougé)

Ce qui doit informer le rendu de la **vue lunette** ET des tirages sur la planche
contact.

- [Blow-Up (Michelangelo Antonioni, 1966) — Senses of Cinema](https://www.sensesofcinema.com/2017/1967/blow-up/) —
  LE film-matrice sur le photographe et le téléobjectif qui capture accidentellement
  une scène compromettante dans un parc, puis l'agrandissement qui dissout l'image en
  grain. Sert le **principe narratif** (une preuve photographique ambiguë qu'on doit
  déchiffrer) et la texture de l'agrandissement — pas l'époque (1966, Londres) ni le
  style visuel couleur pop. **Risque : anachronisme d'époque** — à citer pour le
  _procédé_ (photo → preuve → grain qui mange le détail), jamais pour le look de mode
  60s.
- [Rear Window (Alfred Hitchcock, 1954) — évoqué via le rapprochement thématique
  Antonioni/Hitchcock ci-dessus](https://www.sensesofcinema.com/2017/1967/blow-up/) —
  le photographe au télé-objectif qui espionne une cour depuis sa fenêtre : la posture
  de **voyeur immobile, longue focale, cadre fixe**, souvent citée comme la matrice du
  regard-caméra-dans-le-film. Sert le **cadrage** (une fenêtre rectangulaire dans le
  cadre, l'œil collé au viseur) plus que la photo elle-même (Hitchcock filme le
  personnage regardant, pas des tirages). **Risque : c'est du cinéma, pas de la
  photographie fixe** — à ne pas confondre avec un référent de grain/texture réel.
- [Magnum Contact Sheets (Kristen Lubben, Thames & Hudson) — page éditeur](https://www.thamesandhudsonusa.com/books/magnum-contact-sheets-softcover) —
  135 planches-contact de photoreporters (Cartier-Bresson, Capa, Meiselas…), montrant
  la vraie texture d'une **photo de reportage argentique** : grain visible à
  l'agrandissement, exposition inégale d'une vue à l'autre sur le même rouleau, flou de
  bougé assumé sur les prises volées/rapides. Sert de **calibrage de gamme** pour ce à
  quoi une vraie photo de presse period-correct ressemble avant retouche — pas
  spécifiquement nocturne ni téléobjectif long, mais la référence la plus solide et
  pérenne (livre publié, licence commerciale claire) pour la matière du grain.
  **Licence : ouvrage sous droits — étude seulement, jamais scanner une planche
  publiée.**
- [Rut Blees Luxemburg — "London: A Modern Project" (Black Dog Publishing, 1997) — Wikipédia](https://en.wikipedia.org/wiki/Rut_Blees_Luxemburg) —
  série photo **contemporaine à 1998** (livre publié 1997), longues poses nocturnes
  urbaines sous éclairage sodium exclusivement, pas de flash : la lumière orange
  écrase tout, halos larges autour des sources, ombres denses. Sert de calibrage
  **lumière nocturne period-correct** (le sodium, rendu ensuite en N&B contrasté par la
  DA maison) — pas la posture paparazzi (elle photographie l'architecture, pas des
  humains en action), donc utile pour l'ambiance lumineuse de la rue, pas pour le
  cadrage de la scène-clé. **Risque : Londres, pas Paris** — mood de lumière
  uniquement, aucun repère architectural à copier.
- **Repère technique non lié (pas de source unique stable, connaissance de fond
  photographique)** : un 300 mm ouvert autour de f/4-f/5.6 en pellicule 400-1600 ISO de
  nuit produit **une profondeur de champ extrêmement fine** (le sujet net, l'arrière-
  plan/premier plan dissous), un **grain de pellicule poussée** granuleux et irrégulier
  (pas un bruit numérique uniforme), un **vignettage** en bord de cadre, et un **flou
  de bougé directionnel** si la prise est tenue à main levée sans appui — c'est le
  vocabulaire à traduire dans le rendu de la vue lunette. À vérifier/sourcer plus
  précisément par `art-advisor` ou une deuxième passe si le rendu doit être
  techniquement défendable (voir questions).

## Axe 2 — La planche contact argentique (grammaire de l'objet)

- [Magnum Contact Sheets (Kristen Lubben) — book review, 35mmc](https://www.35mmc.com/26/01/2021/magnum-contact-sheets-book-review-by-holly-gilman-and-sroyon-mukherjee/) —
  confirme la grammaire exacte à citer dans l'asset planche contact : 36 vues en
  chronologie brute sur une bande, **croix rouges** et **cercles au crayon gras/china
  marker** sur les vues retenues, une **écriture à la main** dans les marges (dates,
  numéros de rouleau), un vocabulaire de marques propre à chaque photographe. C'est la
  référence la plus solide (livre, licence commerciale, contenu bien documenté par la
  presse spécialisée) pour ce que doit montrer la planche contact du jeu.
  **Licence : ouvrage sous droits — décrire la grammaire, jamais reproduire une
  planche publiée.**
- [Contact print — Wikipédia (EN)](https://en.wikipedia.org/wiki/Contact_print) —
  ossature technique neutre et stable : la planche contact est un tirage 1:1 direct de
  la bande de négatifs posée sur le papier photosensible, d'où les **bords de
  perforation visibles**, les numéros d'image imprimés par la perforeuse de l'appareil
  en bord de bande, et la disposition en grille régulière par bande de 6. **Licence :
  CC BY-SA.**
- **Repère non lié (connaissance de fond)** : le vocabulaire de sélection standard est
  **coche = retenu**, **croix = rejeté**, **cercle au crayon gras (chinagraph/china
  marker)** autour d'une vue candidate, parfois un **recadrage tracé** au crayon gras
  directement sur la vue choisie pour indiquer le futur cadrage de tirage. C'est ce
  vocabulaire précis qu'il faut citer sur la planche contact du jeu pour qu'elle lise
  comme un vrai objet de labo, pas une grille Instagram déguisée.
- **Écarté** : toute imagerie de banque stock (Dreamstime/Getty/iStock) trouvée dans
  cette recherche — non pérenne, non contextualisée, pas de valeur documentaire propre
  au-delà de ce que Magnum Contact Sheets et Wikipédia donnent déjà gratuitement et de
  façon stable.

## Axe 3 — La rue de faubourg parisienne nocturne fin 90s

- [Rut Blees Luxemburg — "London: A Modern Project" (1997)](https://en.wikipedia.org/wiki/Rut_Blees_Luxemburg) —
  réutilisée ici pour son autre valeur : la **lumière sodium omniprésente**,
  contemporaine exacte de la scène (livre 1997, scène 1998), aucune source froide/LED
  (anachronisme à éviter absolument — les LED de rue n'existent pas encore à Paris en
  1998). Le rendu final du jeu désature en N&B contrasté (§1 `art-direction.md`), donc
  cette réf sert le **contraste de valeur** que produit le sodium (jaune très chaud,
  ombres très denses) plutôt qu'une teinte à copier littéralement.
- [Paris Tonkar (Ben Yakhlef & Doriath, Massot, 1991) — scan Internet Archive, déjà
  banké](https://archive.org/details/paris-tonkar-4-ans-de-graffitis) — **renvoi, pas
  re-curation** : déjà validé et curé dans `docs/references/art-culture.md`
  §"Décor de niveau — façade Rue Belliard" pour les rideaux de fer tagués et la texture
  de mur period-correct (1987-91, encore vivant en 1998 avant l'Opération Murs propres
  1999). Le board `board-belliard-decor.md` couvre déjà la devanture/rideaux/mobilier ;
  ce hunt ne le rouvre pas, il le cite comme socle de la rue vue depuis le sol —
  cohérence à préserver entre les deux boards (même rue, même registre crade-
  documentaire).
- **Repère non lié (connaissance de fond, à sourcer si besoin par une deuxième
  passe)** : boulangerie à devanture peinte/lettrage doré, rideau de fer métallique à
  lattes descendu la nuit, feu tricolore à ampoules (pas de LED), sont des éléments
  déjà couverts par le décor Belliard existant — ce hunt ne les re-cherche pas mais
  signale qu'ils doivent rester visibles/reconnaissables même en vue lointaine/floue
  de fond derrière le sujet photographié, pour que la rue reste identifiable même
  hors-focus au 300 mm.

## Axe 4 — Le regard depuis le toit (cadrage plongeant)

- [High-angle shot — Wikipédia (EN)](https://en.wikipedia.org/wiki/High-angle_shot) —
  ossature textuelle neutre et stable : un cadrage en plongée réduit le sujet, le
  place "sous" le regard du spectateur, et est le langage classique du **point de vue
  de surveillance/sniper** — exactement la fonction voulue ici (Muf en position de
  pouvoir/contrôle sur sa cible malgré son propre danger). **Licence : CC BY-SA.**
- [StudioBinder — "High Angle Shot" (article méthodologique, exemples de cadrage)](https://www.studiobinder.com/blog/high-angle-shot-camera-movement-angle/) —
  sert de **calibrage de degré** : distingue une légère plongée (encore lisible comme
  humaine) d'une plongée extrême façon "vue d'oiseau" (qui déshumanise le sujet et
  perd la lecture d'une scène de rue étroite). Pour la scène Belliard, la plongée doit
  rester **modérée** — un toit d'immeuble de faubourg (4-5 étages), pas un
  gratte-ciel : l'angle doit encore permettre de reconnaître un commandant en
  civil/uniforme et une enveloppe échangée. **Risque : c'est un article éditorial
  générique de blog de formation cinéma, pas une source d'époque** — utile pour le
  vocabulaire de cadrage, pas pour la couleur ou l'époque.
- **Croisement avec Rear Window (Axe 1)** : le principe du cadre-dans-le-cadre (viseur
  rond ou rectangulaire cerclé de noir occultant le reste de l'écran) est le même
  vocabulaire qu'un cadrage en plongée + fenêtre de visée — les deux se combinent
  naturellement dans la vue lunette du jeu : plongée modérée + cadre de viseur occultant.

## Recommandations (à valider)

1. **Vue lunette en jeu** : caler le rendu sur Magnum Contact Sheets (grain
   irrégulier, exposition inégale) + le calibrage optique 300 mm de nuit (DoF très
   fine, léger bougé, vignettage) — pas sur Blow-Up/Rear Window qui sont des
   sources cinéma à citer pour le _principe narratif_, pas pour la texture.
2. **Planche contact** : suivre la grammaire Magnum Contact Sheets + Contact print
   (Wikipédia) au pixel près — croix/cercles china marker, perforations, numérotation
   de bande — c'est l'élément le plus daté et le plus vérifiable, donc le plus
   sanctionnable s'il sonne faux.
3. **Rue + cadrage** : réutiliser tel quel le board Belliard déjà validé pour le sol
   de la rue (ne pas re-générer un mood de rue depuis zéro), et caler la plongée sur
   un toit bas de faubourg (4-5 étages, StudioBinder "modérée") combinée au cadre de
   viseur type Rear Window — jamais une plongée de type héliporté.

## Questions à Bertrand (non bloquantes — le board est livrable en l'état)

1. `docs/game-design/spec-photo-qte-fiction.md` n'a pas été trouvé dans le repo au
   moment du hunt — a-t-il été écrit ailleurs, sous un autre nom, ou reste-t-il à
   créer ? Si le spec réel précise un modèle d'appareil, une distance de tir ou un
   nombre de vues sur la planche contact, ce board devra être recalé dessus.
2. La vue lunette doit-elle porter le vignettage/DoF en render-time (comme le CRT
   §8 de `art-direction.md`) ou en asset pré-généré (comme les backdrops) ? Ça
   change qui consomme ce board en premier (`dev-r3f-render` vs `concept-artist`).
3. Combien de vues sur la planche contact au final, et combien sont "manquées"
   (floues/hors-sujet) vs "la bonne preuve" ? Ça calibre combien de variantes de
   grain/flou il faut réellement produire.
4. Le commandant est-il identifiable frontalement sur la photo-preuve, ou son visage
   doit-il rester ambigu (façon Blow-Up, où la preuve est discutable) ? Conditionne
   si Axe 1/Blow-Up doit rester une référence de _procédé_ ou remonter en référence de
   _composition_ du plan-clé.
5. Faut-il une deuxième passe de recherche sourcée sur les caractéristiques
   optiques précises d'un 300 mm argentique de nuit 1998 (ISO poussée, ouverture),
   le repère technique donné ici étant ma connaissance de fond non liée à une
   source stable ?
