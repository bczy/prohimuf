# Photo QTE set-piece — DRAFT v3 (round 3, réponse au FAIL de Nico)

Auteur : concept-artist (Maud). Statut : **draft, non gaté**.
Répond point par point à `docs/art-direction/gates/photo-qte-setpiece-v2-prompt-gate.md`
(FAIL, round 2). Historique et raisonnements conservés dans
`photo-qte-setpiece-v2.md` (v2.2) — ce document ne le réécrit pas, il le **corrige** et
devient la pièce gatée.

**Aucune écriture dans `src/game/levels/levelArt.json` pour la famille `photoQte`.**
Une seule écriture faite, celle qui était pré-autorisée : la clause de traits dans les
sept prompts `boss/commander_*` (§6).

---

## 0. Ce que j'accepte, sans discussion

R3 est juste et il tue ma doctrine. J'avais écrit « les figurants ne sont vérifiés par
rien » ; c'était vrai à l'écriture, ça a cessé de l'être à Rev.6.1 §A.13.3.a quand les
sept tables sont devenues des `candidateTracks`. **Un leurre n'est pas un figurant** : dès
que la mécanique demande au joueur de le distinguer, il est du contenu vérifié, pas du
décor. Ma phrase de v2 se retourne mot pour mot contre moi, sur six objets.

Et l'argument de densité est pire que la règle qu'il enfreint : 20,5 px/su contre
60,2 px/su, le même visage sur les mêmes 184 px écran avec trois fois l'encre. **Le joueur
ne chercherait pas une moustache, il chercherait la table nette.** Je le retiens comme
règle de métier et pas comme correction ponctuelle :

> **La netteté est un tell** — et c'est le seul que la trame n'aplatit pas. Tout ce que la
> mécanique demande de distinguer est auteuré au même px/su et au même pas de trame que
> ses leurres.

Idem pour R2-bis, qui est une faute de calcul de ma part et pas une divergence de goût :
13,5 su × 20,5 px/su = **276 px** par figurant debout, pas 40-60. Mon « anonymat par le
flou » n'existe pas. L'anonymat est désormais **auteuré** (§2.3).

---

## 1. `plate` — prompt v3 (R1 + R2 appliqués verbatim)

> Photocopied punk fanzine xerox illustration, rough black ink linework, coarse halftone
> toner dots, high-contrast black and white: a plunging night view down a narrow crowded
> 1998 Paris street from a rooftop dormer. A dark roadway band across the bottom third,
> two saloon cars and a small van parked nose to tail along the near kerb, a scooter and a
> bicycle leaned against the wall between them, a delivery van with its rear doors open
> further down, and one clear empty stretch of open roadway alongside the parked row, wet
> tarmac catching the lamplight, away from the kerb. Along the pavement a row of
> shopfronts under awnings: a bakery with a lit window, a corner bistro under a glowing
> awning with seven small round pavement tables each taken by a seated pair of customers
> in coats leaning towards each other over their glasses, and three further tables along
> the same terrace, one with a single customer reading alone, one with its chairs turned
> up on the tabletop, one half hidden behind the awning post; a shuttered grocer with
> crates outside, a laundrette with a bright glowing front. Right of centre a tall
> vertical slot between two buildings, the deepest solid pure-black shape in the picture,
> rising past the first floor, tagged roller shutters either side. Small clothed figures
> scattered the length of the pavement, all in overcoats and jackets with their collars
> up: two walking away arm in arm seen from behind, two standing close and holding hands
> under a lamp with their faces turned away up the street, a group of three talking near
> the bistro seen from behind, one figure in a doorway handing a small wrapped parcel to
> another whose back is to the viewer, a lone figure leaning on the wall by the slot with
> his face in the shadow of his collar, one figure crouched at a scooter with his head
> down, one figure at a phone box seen from behind. Above, six storeys of Haussmann
> facades with wrought-iron balconies converging away up both sides, a dozen windows lit
> as pale rectangles, a small dark seated or standing silhouette inside four of them, one
> window showing two silhouettes side by side, the rest shuttered dark. Bill-posted
> panels, layered torn posters, spray tags along the lower walls, bins and bollards and a
> slender cast-iron traffic-light mast on the pavement, hooded lamps spilling pale pools
> on the tarmac.

### 1.1 Les trois corrections, et ce qu'elles coûtent

**R1 — la berline peinte disparaît.** Clause de remplacement reprise mot pour mot du
verdict : `and one clear empty stretch of open roadway alongside the parked row, wet
tarmac catching the lamplight, away from the kerb`. Nico a raison et c'est un défaut que
j'aurais dû voir seule : le cut-out repart sur [53,0 ; 55,9], la peinte reste — **deux
berlines**, et la jumelle se révèle exactement au beat dont le métier est de dire « la
voiture est partie ». J'ajoute que la preuve ne s'affaiblit pas : **c'est la file garée qui
accuse**, puisque c'est elle dont la fautive est en dehors. L'emplacement vide est même
meilleur que ma clause : il _attend_ la voiture, et il reste après son départ.

**R2 — 10 tables : 7 candidates + 3 non-photographiables.** Reformulation reprise verbatim.
Mon « 8 = 1 + 7 » violait `DECOY_COUNT_MAX = 6` et fabriquait une **cible orpheline** : une
photo bien cadrée aurait reçu un tampon « hors cadre », soit exactement le mensonge que
F20 interdit. Les trois tables mortes sont désormais **énumérées** (client seul / chaises
retournées sur le plateau / masquée par le pied d'auvent) au lieu d'être un principe — ma
§2.d disait « rendues non-photographiables », ce qui est un vœu ; une énumération est un
contrat. Et la « dizaine de tables » de la fiction est servie par le reste.

⚠ **Rappel du verdict, à porter au gate asset :** une plaque livrée avec une huitième table
en interaction est **retouchée ou re-tirée**. C'est un critère de refus d'asset.

**R2-bis — l'anonymat est auteuré, plus jamais hérité de la résolution.** Chaque figurant
peint porte maintenant sa propre clause de dérobade : `seen from behind`, `faces turned
away up the street`, `whose back is to the viewer`, `his face in the shadow of his collar`,
`with his head down`, et `all in overcoats and jackets with their collars up` en tête de
groupe. Bénéfice secondaire non négligeable : moins de visages et de mains dessinés « avec
intention » par FLUX, donc moins de surface pour le balayage anti-défauts.

### 1.2 Ce que je ne touche pas

- « tall vertical slot … deepest solid pure-black shape » : ancrage de continuité E-6(7),
  inchangé depuis v1.
- Aucun lettrage lisible (fascia boulangerie = panneau muet), aucun rim néon, plaque
  opaque 16:9, pas de chroma key.
- Q4 (crop source plus large) : **PASS acquis**, avec la condition C1 héritée — les bornes
  du crop sont committées en fichier de référence et **consignées ici** au moment du
  dispatch : `assets/photoqte/plate-source-crop.png`, bornes x_norm à inscrire par
  `dev-tooling-assets` dans ce paragraphe même, pour que la plaque soit reproductible.
- Q3 (mobilier de terrasse novembre 1998 : paravents vitrés, chauffages gaz sur pied,
  chaises en rotin) : **une seule clause insérée sur confirmation d'`art-advisor`**, sans
  nouveau round, per §4.4 du verdict. Je ne l'écris pas avant sa réponse.

---

## 2. R3 — les six leurres sortent de la plaque et deviennent des découpes

### 2.0 Le contrat commun aux SEPT candidats

Ces règles valent pour `commandant_couple` **et** pour les six `decoy_table_*` :

1. **Même px/su, même pas de trame.** Boîte de pose 17,00 × 9,56 su, canevas 1024×576 →
   **60,2 px/su**, trame 6-8 px dans le PNG (ruling §1.4). Un leurre auteuré moins cher que
   sa cible n'est pas une économie, c'est un wallhack.
2. **E2, prohibition d'énumération.** _Rien dans un sprite candidat qui ne soit pas dans son
   ensemble énuméré._ Pas de coin de table voisine, pas de bout de chaise en amorce, pas de
   pied d'auvent qui dépasse : F12(1b) mesure l'AABB opaque de l'ensemble énuméré, et un
   pixel opaque hors énumération gonfle la boîte et fait tomber le contrôle d'intervalle.
   La table voisine entre dans le cadre **en tant que sprite leurre**, ce qui est
   exactement ce que R3 achète. J'avais moi-même envie de ce coin de table : il est mort,
   et il est consigné mort ici pour que personne ne le repropose au round 4.
3. **Ensemble énuméré identique pour les sept :** deux personnes assises + leurs deux
   chaises + une table ronde + ce qui est posé dessus. Rien d'autre. Même structure de
   boîte pour tous ⇒ aucune asymétrie de silhouette exploitable.
4. **Mono-frame statique**, comme les poses de hold v1 : zéro frame = seule garantie
   zéro-dérive sur un contrôle d'intervalle.
5. **Aucun leurre ne porte un seul des quatre traits du Commandant** (cheveux gris ramenés
   en arrière + moustache large + mâchoire carrée + tête nue). Un leurre peut être tête nue
   **ou** moustachu, jamais les deux, jamais avec les cheveux gris ramenés. C'est le seul
   endroit du paquet où je m'interdis une combinaison plutôt qu'un token.
6. **Registre identique à la cible :** chaleureux, attablé, manteaux, mains sur la nappe.
   Le geste ne discrimine rien — c'est le principe même de la scène.

### 2.1 Les six prompts `decoy_table_*`

Style : bloc `style` de la famille `photoQte`, verbatim. Opening : idem famille.
_(Les trois premiers sont, dans cet ordre, le trio à retenir si le fork §2.1(b) du verdict
— 3 PNG uniques utilisés deux fois — est choisi : ce sont les trois plus éloignés les uns
des autres en silhouette, donc les moins coûteux à voir répétés.)_

**`decoy_table_a`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a thin young man in a short zipped jacket and a woollen beanie pulled low, hair
> dark and cropped, clean-shaven, leaning forward on his elbows; on the right a young woman
> in a duffel coat with the hood down, long straight hair, laughing towards him; on the
> tablecloth two beer glasses, an ashtray and a folded newspaper; behind them the glowing
> awning of the bistro and a wall of tiles, at their feet the wet pavement

**`decoy_table_b`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a stout elderly man in a heavy checked overcoat and a flat cap, a short white
> beard, both hands flat on the cloth; on the right an elderly woman in a fur-collared coat
> and a headscarf, glasses, turned three-quarters away from the viewer; on the tablecloth
> two small coffee cups, a carafe and a saucer of sugar; behind them the glowing awning of
> the bistro and a wall of tiles, at their feet the wet pavement

**`decoy_table_c`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a tall bald man in a pale trench coat, clean-shaven, one arm hooked over the
> chair back; on the right a woman in a dark tailored coat and a wide-brimmed hat, curled
> hair, both hands around a cup; on the tablecloth two wine glasses, a bottle and a
> breadbasket; behind them the glowing awning of the bistro and a wall of tiles, at their
> feet the wet pavement

**`decoy_table_d`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a heavy-set middle-aged man in a dark wool overcoat and a knitted cap, thick
> dark eyebrows, clean-shaven, talking with one hand raised; on the right a woman in a
> quilted coat and a long scarf wound high, short dark hair, listening with her chin on her
> hand; on the tablecloth two tall glasses, a coffee cup and a paper napkin; behind them
> the glowing awning of the bistro and a wall of tiles, at their feet the wet pavement

**`decoy_table_e`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a slim man in a leather jacket over a polo neck, dark hair to the collar and a
> narrow moustache, leaning back; on the right a woman in a belted raincoat and a beret,
> hair tied back, both hands resting side by side on the cloth; on the tablecloth two
> glasses, a small vase and a set of keys; behind them the glowing awning of the bistro and
> a wall of tiles, at their feet the wet pavement

**`decoy_table_f`**

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a broad man in a dark overcoat and a homburg hat, greying sideburns,
> clean-shaven, turned three-quarters towards his companion; on the right a woman in a pale
> swing coat and a silk scarf, blonde waved hair, smiling with her head tilted; on the
> tablecloth two tall glasses, a coffee cup and a small ribboned parcel; behind them the
> glowing awning of the bistro and a wall of tiles, at their feet the wet pavement

### 2.2 Rationale d'ensemble (ce que ce jeu de six achète, et ce qu'il évite)

| Décision                                                                                                                    | Raison                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture et fermeture **identiques mot pour mot** à `commandant_couple`                                                    | Même cadrage, même sol, même auvent, même mur : aucun leurre ne peut se distinguer par sa mise en scène. Seuls les deux blocs de description de personne varient. C'est aussi ce qui rend le contrôle F12(1b) comparable d'une piste à l'autre. |
| `decoy_table_e` a **une moustache** ; `decoy_table_c` est **tête nue** ; `decoy_table_f` a **des cheveux gris**             | Chaque trait de la cible existe ailleurs, **isolé**. Un joueur qui cherche « une moustache » ou « un homme tête nue » se trompe : il doit tenir les quatre traits ensemble. C'est ce qui transforme le zoom en vérification et non en filtrage. |
| `decoy_table_d` — le plus proche de la cible (corpulent, manteau de laine sombre) mais **bonnet + sourcils sombres + rasé** | Le leurre le plus cruel du jeu, celui qui demande la lecture complète. Un seul de ce calibre : deux seraient une punition, zéro serait un cadeau.                                                                                               |
| `decoy_table_f` porte **un paquet enrubanné**                                                                               | La cible n'a pas le monopole de l'objet. Si l'accessoire discriminait, on retomberait sur « chercher un objet » — le piège que le pivot narratif vient d'écarter.                                                                               |
| Aucun leurre ne porte **tailleur ni parapheur**                                                                             | Ce sont les marqueurs de la partenaire (le « avec qui »), pas de la cible ; les répartir affaiblirait la lecture du levier sans rien ajouter à la difficulté, qui se joue sur le visage.                                                        |
| Ordre a-b-c comme trio de repli                                                                                             | Jeune/jeune, vieux/vieux, grand chauve/chapeau large : trois silhouettes qui ne se confondent pas, donc trois répétitions supportables si le fork (b) est retenu.                                                                               |

**Sur le fork (a) 6 uniques / (b) 3×2** — la facture est à Ben et à
`dev-tooling-assets`, je ne la tranche pas. Je note seulement, du côté image : la
préférence de Nico pour (b) tient **si et seulement si** les deux copies d'une paire ne
sont jamais adjacentes ni dans un même cadre légal ; le miroir horizontal suffit à casser
la lecture au cadrage d'établissement, mais **un miroir ne doit jamais s'accompagner d'un
rescale** — ce serait rompre l'égalité de px/su qui est toute la raison d'être de R3.

### 2.3 Ce qui reste peint (Route A ratifiée, Route B refusée)

Route B est refusée et je ne la défends pas : une grille de pixels carrés sous une grille
de points de trame, ce sont deux tirages dans une image, et la loi de famille ne plie pas
pour un filtre. Le précédent `nearForegroundArt` ne s'applique pas — ces sprites vivent
dans le monde, pas dans la lucarne. Restent donc peints, **tous non-candidats** : les
marcheurs, le couple main dans la main, le baiser, le cadeau de porte, les fenêtres
allumées, le groupe de trois, l'accroupi, la cabine, et **le sosie, seul à sa table**
(Q6 : seul = catégorie F20 n°2 = non-photographiable par construction, à coût nul ; s'il
gagne un compagnon il devient un septième leurre, donc il n'en gagne pas).
`commandant_wait` reste recyclable en figurant non-candidat.

---

## 3. ARRIVÉE — le trou du paquet, comblé

`pair_facing` ne peut pas être rétrogradé : c'est l'instant maître n°1, **24,00 × 13,50 su,
valeurs inchangées** (spec §A.13.1), mis en scène par la fiction §3.2 — elle traverse la
terrasse, il se lève, il lui prend son manteau. Ma §4 de v2 est antérieure à Rev.6.1 et la
contredit ; elle est retirée. Le master a **trois** instants dessinés, v2 en livrait un.

Canevas 1024 sur une boîte de 24 su ⇒ **42,7 px/su**, soit 1,4× plus grossier que LA TABLE.
C'est la contrainte dominante de ce prompt : la clause de traits doit survivre **ici**,
sinon l'ARRIVÉE enseigne un visage que le joueur ne pourra pas retrouver.

### Prompt proposé — `commandant_arrivee`

> a fully dressed man and a fully dressed woman in winter coats meeting at a small round
> café table on a pavement terrace at night, seen at mid-distance from slightly above,
> both figures whole from head to shoe, both standing upright on one ground line, a clear
> gap of open ground between them: on the left a heavy-set man in a dark wool overcoat over
> a shirt and knitted scarf, thick greying hair swept back, a broad moustache, square jaw,
> bare-headed, risen from his chair and turned three-quarters towards her, his face fully
> visible, both hands holding a folded pale coat by its shoulders, arms lowered; on the
> right a woman in a business suit and a beret, a slim document folder under one arm, one
> hand still on the back of her chair, talking to him with an easy open smile; between them
> the round table with two tall glasses and a small ribboned parcel resting closed on the
> cloth, two bistro chairs pushed back; behind them the glowing awning of the bistro and a
> wall of tiles, at their feet the wet pavement

**Rationale des clauses qui portent quelque chose :**

| Clause                                                                              | Ce qu'elle achète                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a fully dressed man and a fully dressed woman in winter coats`                     | Le post-mortem du nu s'applique intégralement, et **plus durement** : « il lui prend son manteau » est un geste de contact à deux corps, exactement le genre de scène où le modèle dérape. Le vêtement est le premier token.                                                                                            |
| `both standing upright on one ground line, a clear gap of open ground between them` | Deux figures debout, séparées, cadrées par le décor et jamais par l'anatomie. L'écart explicite remplace ici le rôle que jouaient les deux chaises à LA TABLE : il interdit la fusion des silhouettes.                                                                                                                  |
| `both hands holding a folded pale coat by its shoulders, arms lowered`              | **Le manteau est l'objet, les mains sont sur un vêtement, jamais sur une personne.** C'est la traduction littérale de la consigne du verdict, et c'est aussi la pose la plus stable pour quatre mains — le paquet compte désormais quatorze mains sur des tables, c'est notre plus forte exposition au défaut de mains. |
| `thick greying hair swept back, a broad moustache, square jaw, bare-headed`         | **Clause de famille (E1), citée verbatim**, pas réinventée ici. Même homme, douze secondes plus tôt.                                                                                                                                                                                                                    |
| `risen from his chair … his face fully visible`                                     | Le beat d'ARRIVÉE est celui qui _enseigne_ le visage. S'il est de dos ou baissé, la scène ne remplit pas sa fonction pédagogique.                                                                                                                                                                                       |
| `a business suit and a beret, a slim document folder under one arm`                 | La partenaire, avec ses marqueurs de levier (« avec qui ») dès l'arrivée : le conflit d'intérêts est lisible avant même qu'ils s'assoient.                                                                                                                                                                              |
| `one hand still on the back of her chair`                                           | Elle arrive : la main sur le dossier dit le mouvement sans demander de frame d'animation. Mono-frame statique préservé.                                                                                                                                                                                                 |
| `two bistro chairs pushed back`                                                     | Continuité d'objets avec LA TABLE : mêmes chaises, même table, même paquet — la scène est la même douze secondes plus tard.                                                                                                                                                                                             |
| `two tall glasses and a small ribboned parcel resting closed on the cloth`          | Le paquet est **déjà posé et fermé** à l'arrivée. Il n'a donc jamais été remis : aucune lecture de paiement possible sur toute la piste maître.                                                                                                                                                                         |

**Alerte que je porte moi-même au gate :** à 42,7 px/su, la mâchoire carrée et les cheveux
ramenés en arrière sont des masses ; la moustache est le seul trait de détail. Si
`art-advisor` conclut qu'un seul trait survit à la fois à la trame grossière **et** au
pixel art 16-bit, alors la clause doit être amendée **en famille** (boss + photoQte
ensemble, §6), jamais par pose — sinon on refabrique le problème qu'E1 vient de résoudre.

---

## 4. `berline_plate` — C1 réglé, C2 accepté comme critère

- **C1** : réglé par R1 ci-dessus. Sans l'emplacement vide, le sprite réutilisé n'était pas
  réutilisé, il était dupliqué. La séparation « le contexte accuse, le gros plan
  identifie » tient maintenant sans jumelle.
- **C2** : accepté sans réserve. La plaque v3 est une vue plongeante explicitement
  perspective, avec une file garée qui fuit vers le haut de la rue ; un cul de voiture
  « square-on, parallel to the picture plane » composité là-dedans **peut** se lire comme un
  autocollant. Si c'est le cas sur la plaque livrée, `berline_plate` prend **une** seule
  re-génération dans le cap, **sur l'angle de vue uniquement** — je m'y engage par écrit ici
  pour qu'aucune autre modification ne se glisse dans ce re-tirage.
- Le départ sur [53,0 ; 55,9] reste le même PNG translaté : ni rescale, ni fumée
  d'échappement, ni feux allumés peints dans le sprite (le balayage de phares côté render
  reste le seul élément autorisé à encoder un état).

---

## 5. Inventaire des sprites livrables après v3

| Sprite                        | Nature                           | Boîte / px/su                    | Vérifié F12(1b) |
| ----------------------------- | -------------------------------- | -------------------------------- | --------------- |
| `plate`                       | décor opaque, **aucun candidat** | 2048×1152, 20,5 px/su            | non (décor)     |
| `commandant_arrivee`          | **master**, instant 1            | 24,00×13,50 su, 1024, 42,7 px/su | oui             |
| `commandant_couple`           | **master**, LA TABLE             | 17,00×9,56 su, 1024, 60,2 px/su  | oui             |
| `berline_plate`               | **master**, plaque               | 7,50×4,22 su, 1024, 136,5 px/su  | oui             |
| `decoy_table_a…f`             | **6 decoy**                      | 17,00×9,56 su, 1024, 60,2 px/su  | oui, × 6        |
| tampons ×3, `commandant_wait` | inchangés / non-candidats        | —                                | non             |

Chiffres de boîtes repris de la spec et du ruling **à titre de rappel de contrainte** :
`size`, `pxPerSu`, `asset`, ids et seeds restent à `dev-tooling-assets`, et les boîtes à la
spec. Je ne les écris nulle part.

---

## 6. E1 — la clause de traits propagée aux prompts boss (**FAIT**, pré-autorisé)

Écriture effectuée dans `src/game/levels/levelArt.json`, famille `boss`, **prompts
uniquement** — c'est la seule écriture de ce round, et elle est celle que le verdict
pré-autorise explicitement (§4.3.1) pour ne pas coûter un round.

Les **sept** prompts `commander_*` (`shielded`, `exposed`, `hit`, `down`, `weakpoint`,
`parry_windup`, `finisher`) passent de :

> `a towering bare-headed french police commander in a knee-length overcoat, …`

à :

> `a towering bare-headed french police commander with thick greying hair swept back, a broad moustache and a square jaw, in a knee-length overcoat, …`

- Quatre traits ajoutés, **aucune silhouette touchée** : ni brassard, ni radio, ni manteau,
  ni pose. `lustre`, `speaker_wall` et les deux `shield_cover_*` ne sont pas concernés.
- `boss.$comment` reçoit la traçabilité : origine du gate, raison (le joueur doit pouvoir
  **comparer** un visage zoomé à quelque chose), et la règle qui en découle — **toute
  évolution de ces traits est une édition de famille (boss + photoQte ensemble), jamais un
  ajustement par prompt.**
- `node scripts/check-art-prompts.mjs` : **PASSED**, aucun nouveau warning (les prompts boss
  restent dans la bande 30-90 mots).

Le constat qui rendait ce point éliminatoire reste vrai et n'est pas de mon ressort :
**aucun des neuf PNG boss n'est généré** (`gen-boss-sprites.mjs` n'existe pas). La clause
existe désormais dans le texte ; il n'y a toujours aucune image de ce visage dans le jeu.
Sans elle, zoomer sur un visage ne discrimine rien.

---

## 7. Ce qui reste dû, et par qui

| Owner                                       | Item                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `art-advisor`                               | Les quatre traits survivent-ils à 42,7 px/su **et** au pixel art 16-bit (§3) ? Mobilier de terrasse novembre 1998 (§1.2, clause pré-autorisée)            |
| `gpu-specialist` + `dev-tooling-assets`     | Fork (a) 6 uniques / (b) 3×2 (§2.2), facture VRAM, `pxPerSu` par candidat, bornes du crop source (§1.2)                                                   |
| `lead-game-designer` + `narrative-designer` | Où le joueur voit ce visage **avant** la scène (§6) — peut tuer la boucle                                                                                 |
| `lead-art`                                  | Gate round 3 sur : `plate` v3, `commandant_arrivee`, les six `decoy_table_*` ; puis gate asset (balayage anti-défauts, **quatorze mains sur des tables**) |
| moi                                         | Itération à une variable sur les FAIL du round 3, dans le cap de lots                                                                                     |

---

## 8. Questions ouvertes (courtes, cette fois)

1. Les six leurres doivent-ils partager le **même seed** que la cible (cohérence de trame,
   risque de visages proches) ou six seeds distincts (variété, risque de dérive de style) ?
   Je penche pour six seeds distincts sous le **même** style block.
2. Si le fork (b) est retenu, l'appariement des trois PNG et leurs positions relèvent-ils de
   la spec (`game-designer`) ou du placement (`dev-tooling-assets`) ? La contrainte « jamais
   adjacents, jamais dans un même cadre légal » doit vivre quelque part de vérifié.
3. `commandant_wait` : je le maintiens en figurant non-candidat — confirmé, ou le retire-t-on
   complètement du set maintenant que la foule est peinte ?
