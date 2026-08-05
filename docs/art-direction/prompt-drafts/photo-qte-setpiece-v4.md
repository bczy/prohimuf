# Photo QTE set-piece — DRAFT v4 (round 4 — **le discriminant est la SCÈNE**)

Auteur : concept-artist (Maud). Statut : **draft, non gaté**.
Répond au FAIL round 3 (`docs/art-direction/gates/photo-qte-setpiece-v3-prompt-gate.md`,
D0-D4) **sous la direction tranchée le 2026-08-05** : le visage n'est plus le discriminant.
Historique : `photo-qte-setpiece-v2.md` (pivot terrasse), `-v3.md` (R1/R2/R3, ARRIVÉE).

---

## 0. Le principe, en tête, et opposable au gate

> **Aucun signal n'identifie seul. C'est leur CONJONCTION sur une même table qui identifie.**
> Le zoom sert à **vérifier une hypothèse construite au grand-angle**, pas à filtrer des
> visages.

Ce que le joueur cherche, par ordre de lisibilité — et c'est délibérément l'inverse de ce
qu'on faisait depuis trois rounds :

| #   | Signal                                                                                | Bande de fréquence        | Pourquoi il marche                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **La voiture de service en double file, chauffeur qui attend au volant**              | masse, grand-angle        | L'objet qui **accuse** (il est venu en fonction) est aussi l'objet qui **désigne**. Le joueur repère la voiture hors de la file, puis **remonte à la table qu'elle sert**. |
| 2   | **Le tailleur et le parapheur de la femme**                                           | masse moyenne, zoom moyen | Une dirigeante, pas une amoureuse : une serviette rigide contre un pied de chaise et une coupe de vêtement se lisent en masses, jamais en détail.                          |
| 3   | **Le déroulé dans la durée** — il arrive, ils s'attablent, il repart seul, elle reste | temporel                  | Aucun leurre ne joue cette séquence. C'est le seul signal qu'un sprite ne peut pas imiter.                                                                                 |

**J'acte D0 sans réserve, et la règle qui en sort me condamne :** j'ai décrit un visage sans
ouvrir le PNG. Le Commandant shippé est **chauve et rasé** — j'ai propagé une moustache que
personne ne porte. _Le PNG livré est la référence, jamais le prompt_ : j'ai ouvert
`commander_exposed.png` et `commander_shielded.png` avant d'écrire une ligne de cette v4.

Et la conséquence que Nico refusait de maquiller (D0.4) est celle qui règle le débat : **ce
cast n'a aucun trait fin.** Un homme chauve en manteau sombre, assis dans une foule assise
et manteautée, n'est pas discriminable par le visage à 60,2 px/su. On arrête d'itérer sur
les traits. La scène prend le relais.

---

## 1. La clause de traits — alignée sur l'image, **cohérence de cast uniquement**

Lue sur les **deux** sprites (le clause doit être vraie des deux : `shielded` lit un crâne
nu, `exposed` une coupe très courte ⇒ ce que les deux montrent est **l'absence de masse de
cheveux**, pas l'une ou l'autre coiffure) :

> **`a bald shaven head, clean-shaven, a heavy brow, a square jutting jaw`**
> _(+ le gabarit, déjà porté par le sujet : `heavy-set`, cou épais, épaules lourdes.)_

- **Statut : cohérence de cast, PAS reconnaissance.** Elle sert à ce que l'homme de la
  terrasse soit le même homme que le boss ; elle ne porte plus aucune charge de gameplay.
- **Conséquence directe : l'alerte 42,7 px/su tombe**, et avec elle mon propre critère de
  refus « visage illisible ». Des masses survivent à la trame — et de toute façon elles ne
  décident plus rien.
- **D3 devient discutable, et je ne bloque pas dessus.** Le canevas 1536 (64,0 px/su) sur
  l'ARRIVÉE reste _souhaitable_ au titre de l'égalité de px/su (mou-dans-un-set-net est un
  tell, comme net-dans-un-set-mou), mais son argument pédagogique est mort. Si Ben le
  refuse, je livre à 1024 / 42,7 px/su sans protester : **plus rien d'éliminatoire n'en
  dépend.**
- **Aucun trait inventé pour atteindre un compte.** Quatre tokens observés, zéro cinquième.

---

## 2. `plate` — v4

La v3 était PASS as text. Je n'y touche que sur **deux** points, dont un que je dois
signaler comme une **incohérence de la v3 que le gate n'a pas relevée**.

### 2.1 ⚠ Contradiction v3 à corriger : la plaque peignait les sept tables candidates

La chaîne v3 dit `seven small round pavement tables each taken by a seated pair of
customers…`. Or R3 sort les sept tables de la plaque et la règle d'addition au ruling §1.3
dit **« la plate ne porte aucun candidat »**. Les deux ont été validés dans le même verdict.
Composé, ça donne sept couples peints **sous** sept couples découpés. Correction :

> `seven small round pavement tables standing empty with their bistro chairs in place` (au
> lieu de `each taken by a seated pair of customers in coats leaning towards each other over
their glasses`)

Les trois tables mortes énumérées (client seul / chaises retournées / masquée par le pied
d'auvent) **restent peintes** : elles ne sont pas des candidats, c'est précisément leur
raison d'être. Le compte R2 est intact : 10 tables, 7 emplacements candidats, 3 mortes.

### 2.2 La voiture : elle ne se peint toujours pas, et voici pourquoi c'est encore vrai

R1 reste valide **et** le nouveau discriminant n°1 est la voiture. Ce n'est pas
contradictoire : la voiture doit être **visible au grand-angle** et **partir**. Peinte, elle
ne peut pas partir ; c'est exactement la jumelle de R1. Donc :

- la plaque garde son **emplacement vide** verbatim (`one clear empty stretch of open
roadway alongside the parked row, wet tarmac catching the lamplight, away from the kerb`) ;
- la fautive arrive comme **découpe échelle-plaque** (`berline_double_file`, §4), posée sur
  cet emplacement, et **translatée hors cadre** sur [53,0 ; 55,9] — même mécanique que
  `berline_plate`, donc même garantie par construction ;
- la **file garée peinte** fournit gratuitement la distribution du signal n°1 : plusieurs
  tables ont une voiture à proximité. **Une seule a une voiture hors de la file, avec
  quelqu'un dedans.**

### 2.3 Chaîne `plate` v4 (deltas en gras)

> Photocopied punk fanzine xerox illustration, rough black ink linework, coarse halftone
> toner dots, high-contrast black and white: a plunging night view down a narrow crowded
> 1998 Paris street from a rooftop dormer. A dark roadway band across the bottom third,
> two saloon cars and a small van parked nose to tail along the near kerb, a scooter and a
> bicycle leaned against the wall between them, a delivery van with its rear doors open
> further down, and one clear empty stretch of open roadway alongside the parked row, wet
> tarmac catching the lamplight, away from the kerb. Along the pavement a row of shopfronts
> under awnings: a bakery with a lit window, a corner bistro under a glowing awning with
> **seven small round pavement tables standing empty with their bistro chairs in place**,
> and three further tables along the same terrace, one with a single customer reading
> alone, one with its chairs turned up on the tabletop, one half hidden behind the awning
> post; a shuttered grocer with crates outside, a laundrette with a bright glowing front.
> Right of centre a tall vertical slot between two buildings, the deepest solid pure-black
> shape in the picture, rising past the first floor, tagged roller shutters either side.
> Small clothed figures scattered the length of the pavement, all in overcoats and jackets
> with their collars up: two walking away arm in arm seen from behind, two standing close
> and holding hands under a lamp with their faces turned away up the street, a group of
> three talking near the bistro seen from behind, one figure in a doorway handing a small
> wrapped parcel to another whose back is to the viewer, a lone figure leaning on the wall
> by the slot with his face in the shadow of his collar, one figure crouched at a scooter
> with his head down, one figure at a phone box seen from behind. Above, six storeys of
> Haussmann facades with wrought-iron balconies converging away up both sides, a dozen
> windows lit as pale rectangles, a small dark seated or standing silhouette inside four of
> them, one window showing two silhouettes side by side, the rest shuttered dark.
> Bill-posted panels, layered torn posters, spray tags along the lower walls, bins and
> bollards and a slender cast-iron traffic-light mast on the pavement, hooded lamps
> spilling pale pools on the tarmac.

Inchangé par ailleurs : ancrage E-6(7) (le slot noir), anonymat auteuré, aucun lettrage,
aucun néon, crop source élargi (bornes à consigner au dispatch), clause mobilier de
terrasse pré-autorisée en attente d'`art-advisor`.

---

## 3. D1 est caduc — la règle du quasi-manqué change d'objet, pas de nature

La règle R4 de Nico était juste **dans sa forme** et son objet est mort : on ne distribue
plus des traits de visage. Je la transpose telle quelle aux **signaux de scène**, ce qui
la rend _moins_ chère (N = 3 au lieu de 4) et bien plus lisible :

> **RÈGLE — le leurre porte la combinaison, jamais la collection complète.** Pour une cible
> définie par N signaux, le jeu de leurres contient, **pour chaque signal**, au moins un
> leurre portant les N−1 autres et auquel il manque **seulement celui-là**. Seul le N complet
> est interdit. Sinon un sous-ensemble plus court que N suffit, et le zoom cesse d'être une
> vérification pour devenir un filtre.

Avec N = 3, ça coûte **trois** leurres de quasi-manqué sur six ; les trois autres restent
des leurres lointains pour que le cadrage d'établissement garde sa variété.

| Leurre                  | Voiture proche                                                | Femme en tailleur + serviette          | Séquence arrivée/départ                        | Manque                        |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------- | ----------------------------- |
| `_a` **quasi-manqué 1** | voiture **hors de la file, moteur tournant, personne dedans** | oui                                    | oui                                            | **le chauffeur qui attend**   |
| `_b` **quasi-manqué 2** | oui (hors file, chauffeur)                                    | non — sac de courses, pas de serviette | oui                                            | **le marqueur professionnel** |
| `_c` **quasi-manqué 3** | oui (hors file, chauffeur)                                    | oui                                    | non — ils sont là depuis le début et y restent | **le déroulé**                |
| `_d` leurre lointain    | garée dans la file                                            | serviette souple, pas de tailleur      | non                                            | 2 signaux                     |
| `_e` leurre lointain    | aucune                                                        | non                                    | oui (un couple arrive et repart)               | 2 signaux                     |
| `_f` leurre lointain    | garée dans la file                                            | non                                    | non                                            | 3 signaux                     |

**Une seule table réunit les trois.** Et aucun signal pris seul ne descend en dessous de
deux porteurs.

Note honnête sur les colonnes 1 et 3 : **elles ne vivent pas dans le sprite du leurre**.
« Voiture à proximité » est une affaire de placement (une découpe véhicule échelle-plaque
posée près de la table), « séquence » est une affaire de piste temporelle. Je décris ici le
**contrat de scène** que mes prompts doivent servir ; sa réalisation appartient à la spec
(`game-designer`) et au placement (`dev-tooling-assets`). Ce que j'écris et qui est de mon
ressort, c'est la colonne 2 et tout ce qui touche la table elle-même.

---

## 4. Les sprites véhicules de la scène (nouveau, §2.2 + signal n°1)

Deux découpes échelle-plaque, **non candidates** (elles ne sont pas des pistes vérifiées —
sauf décision contraire de la mécanique, qui devrait alors m'en donner les boîtes) :

**`berline_double_file`** — la fautive, celle du Commandant :

> a dark saloon standing square in the open roadway seen from the same high dormer angle,
> parallel to the parked row but well out of it, angled slightly across the traffic lane, a
> uniformed driver seated at the wheel behind the glass with his cap on, both hands on the
> wheel, the car empty otherwise, wet tarmac under the tyres

**`berline_decoy`** — la même carrosserie, **sans chauffeur**, pour les leurres `_a` :

> a dark saloon standing square in the open roadway seen from the same high dormer angle,
> parallel to the parked row but well out of it, angled slightly across the traffic lane,
> the driver's seat empty behind the glass, wet tarmac under the tyres

| Clause                                                                            | Ce qu'elle achète                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seen from the same high dormer angle`                                            | Répond à **C2** par le prompt et non par la chance : la plaque v3/v4 est une plongée perspective ; une caisse « square-on » y collerait comme un autocollant. Ici l'angle est nommé, donc reproductible.                                    |
| `well out of it, angled slightly across the traffic lane`                         | **La faute professionnelle, décrite positivement** : hors de la file, en travers. Jamais « mal garée ».                                                                                                                                     |
| `a uniformed driver seated at the wheel with his cap on, both hands on the wheel` | Le signal n°1 complet. Le chauffeur **en tenue** est ce que le Commandant n'est pas : c'est lui qui dit « véhicule de service », sans que la cible n'ait à porter le moindre insigne — le piège de l'uniforme reste désamorcé sur la cible. |
| `the driver's seat empty behind the glass` (decoy)                                | Le quasi-manqué n°1, à un seul token de différence. Un joueur qui s'arrête à « une voiture en double file » se trompe de table.                                                                                                             |
| `the car empty otherwise`                                                         | Interdit un passager fantôme que FLUX ajouterait volontiers, sans négation ambiguë.                                                                                                                                                         |

`berline_plate` (le gros plan de plaque d'immatriculation) reste **inchangé**, avec C1 réglé
et C2 désormais traité en amont par la clause d'angle ci-dessus.

---

## 5. Les six leurres de table — v4

Ouvertures et fermetures **verbatim identiques** à `commandant_couple` (banked PASS,
vérifié caractère par caractère au round 3) ; même boîte 17,00×9,56 su, canevas 1024,
**60,2 px/su**, trame 6-8 px ; mono-frame ; E2 (rien hors ensemble énuméré) ; ensemble
énuméré identique : deux personnes assises + deux chaises + une table ronde + ce qui est
posé dessus.

**R5 appliqué — le motif des mains jointes est cité VERBATIM sur trois leurres** (`_a`,
`_c`, `_e`) : `their two hands rest side by side on the cloth, fingers loosely folded
together`. Pas paraphrasé : une paraphrase est une autre forme d'encre. C'était le défaut
le plus grave du round 3 et il devient, sous la nouvelle direction, **encore plus
important** — le geste est un discriminant plus grossier que tout ce que la cible porte.

**Note de cast (D0.4) :** aucun leurre ne cumule `chauve + rasé + mâchoire lourde`. `_c` est
chauve **avec une barbe**, `_e` est rasé **avec des cheveux**. Ce n'est plus une protection
de gameplay (le visage ne décide plus rien) mais une hygiène de cast : deux sosies parfaits
du boss sur une même terrasse seraient une faute de récit.

**`decoy_table_a`** — quasi-manqué n°1 (voiture hors file **sans chauffeur**)

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a lean man in a dark suit and a loosened tie, dark hair parted, clean-shaven; on
> the right a woman in a grey tailored coat over a business suit, a slim document folder
> propped against her chair leg, hair pinned up; on the tablecloth between them their two
> hands rest side by side on the cloth, fingers loosely folded together, beside two tall
> glasses, a coffee cup and a closed diary; behind them the glowing awning of the bistro and
> a wall of tiles, at their feet the wet pavement

**`decoy_table_b`** — quasi-manqué n°2 (voiture + chauffeur, **pas de marqueur pro**)

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a stocky middle-aged man in a padded jacket and a flat cap, thick dark eyebrows,
> clean-shaven, one elbow on the table; on the right a woman in a duffel coat and a woollen
> hat, two full shopping bags leaning against her chair, long hair loose, laughing towards
> him; on the tablecloth two beer glasses, an ashtray and a folded newspaper; behind them
> the glowing awning of the bistro and a wall of tiles, at their feet the wet pavement

**`decoy_table_c`** — quasi-manqué n°3 (voiture + chauffeur + tailleur, **pas de déroulé**)

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a broad bald man with a short greying beard, in a heavy checked overcoat,
> leaning back; on the right a woman in a dark tailored coat over a business suit, a stiff
> briefcase flat against her chair leg, short curled hair; on the tablecloth between them
> their two hands rest side by side on the cloth, fingers loosely folded together, beside
> two wine glasses, a carafe and a breadbasket; behind them the glowing awning of the bistro
> and a wall of tiles, at their feet the wet pavement

**`decoy_table_d`** — leurre lointain

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a thin young man in a short zipped jacket and a woollen beanie pulled low,
> clean-shaven, leaning forward on his elbows; on the right a young woman in a quilted coat
> and a long scarf wound high, a soft cloth satchel on her lap, short dark hair, listening
> with her chin on her hand; on the tablecloth two tall glasses, a coffee cup and a paper
> napkin; behind them the glowing awning of the bistro and a wall of tiles, at their feet
> the wet pavement

**`decoy_table_e`** — leurre lointain

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a slim man in a leather jacket over a polo neck, dark hair to the collar,
> clean-shaven; on the right a woman in a belted pale raincoat and a beret, hair tied back;
> on the tablecloth between them their two hands rest side by side on the cloth, fingers
> loosely folded together, beside two glasses, a small vase and a set of keys; behind them
> the glowing awning of the bistro and a wall of tiles, at their feet the wet pavement

**`decoy_table_f`** — leurre lointain

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left an elderly man in a fur-collared overcoat and a homburg hat, greying sideburns,
> both hands flat on the cloth; on the right an elderly woman in a swing coat and a
> headscarf, glasses, turned three-quarters away from the viewer; on the tablecloth two
> small coffee cups, a saucer of sugar and a small ribboned parcel; behind them the glowing
> awning of the bistro and a wall of tiles, at their feet the wet pavement

---

## 6. R5 — l'audit de discriminant, toutes bandes de fréquence, par écrit

Exigé au round 3 et livré ici. Un signal n'est acceptable que s'il a **≥ 2 porteurs** ou
s'il fait partie de la conjonction voulue.

| Bande                                                          | Ce que porte la cible      | Porteurs chez les leurres                                                                         | Verdict                                                   |
| -------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Geste** (mains jointes sur la nappe, verbatim)               | oui                        | `_a`, `_c`, `_e`                                                                                  | **distribué** (R5 honoré)                                 |
| **Pose** (assis droits, séparés, une chaise chacun)            | oui                        | les six, clause identique                                                                         | **distribué**                                             |
| **Masse de silhouette** (homme corpulent, manteau long sombre) | oui                        | `_b` (trapu, veste matelassée), `_c` (large, pardessus épais), `_f` (pardessus à col de fourrure) | **distribué**                                             |
| **Valeur** (femme en manteau clair)                            | oui (`pale`)               | `_e` (`belted pale raincoat`), `_f` (swing coat clair)                                            | **distribué**                                             |
| **Objets de table** (2 verres + tasse + petit paquet)          | oui                        | `_a` (verres+tasse), `_d` (verres+tasse), `_f` (paquet enrubanné)                                 | **distribué**, aucun triplet complet ailleurs             |
| **Marqueur professionnel** (tailleur + parapheur)              | oui                        | `_a` (tailleur+parapheur), `_c` (tailleur+serviette rigide)                                       | **distribué à 3 porteurs** — signal n°2 de la conjonction |
| **Chapeau / tête nue**                                         | tête nue                   | `_a`, `_c`, `_e` tête nue ; `_b`, `_d`, `_f` couverts                                             | **distribué**                                             |
| **Voiture hors file à proximité** (placement)                  | oui, **avec chauffeur**    | `_a` (sans chauffeur), `_b`, `_c` (avec chauffeur)                                                | **distribué** — signal n°1                                |
| **Déroulé arrivée/départ** (piste temporelle)                  | oui, **et il repart seul** | `_a`, `_b`, `_e` arrivent/repartent                                                               | **distribué** — signal n°3                                |
| **Netteté / px/su / pas de trame**                             | 60,2 px/su, trame 6-8 px   | identique sur les six                                                                             | **non discriminant** (R3 honoré)                          |

Aucune ligne ne laisse la cible seule porteuse. Ce qui la désigne n'est dans aucune ligne :
c'est **l'intersection des lignes « voiture + chauffeur », « tailleur + parapheur » et
« il repart seul »**.

---

## 7. Les poses maîtresses

- **`commandant_arrivee`** — chaîne du round 3 **inchangée**, sauf la clause de traits qui
  passe à celle du §1 : `a bald shaven head, clean-shaven, a heavy brow, a square jutting
jaw` remplace `thick greying hair swept back, a broad moustache, square jaw, bare-headed`.
  Tout le reste (deux figures debout entières, une ligne de sol, écart explicite, **le
  manteau comme objet, les mains sur un vêtement jamais sur une personne**, le paquet déjà
  posé et fermé) est banked PASS et n'est pas réécrit. Canevas : 1536/64,0 px/su si Ben le
  paie, 1024/42,7 sinon — **je ne bloque plus dessus** (§1).
- **`commandant_couple`** (LA TABLE) — idem : même substitution de clause de traits, la
  femme conserve `over a business suit` + `a slim document folder tucked beside her chair`,
  qui deviennent le **signal n°2** au lieu d'un simple marqueur de fiction. Rien d'autre ne
  bouge.
- **DÉPART — instant non spécifié, que je signale au lieu de l'inventer.** « Il repart seul
  et elle reste » est le signal n°3, et il n'a **aucune boîte dans la spec Rev.6.1** (trois
  instants maîtres : ARRIVÉE, LA TABLE, `berline_plate`). Soit la mécanique joue le départ
  par la **translation de `berline_double_file`** — auquel cas rien à dessiner, et c'est
  mon hypothèse de travail —, soit elle veut une quatrième pose dessinée (elle seule à la
  table) et il lui faut alors **une boîte, un instant et un `pxPerSu`** : ce n'est pas à moi
  de les inventer. Question portée en §9.

---

## 8. R6 / D4 — l'écriture dans `levelArt.json` (**faite**, et une alerte)

- **Revert effectué.** Les sept prompts `commander_*` et la traçabilité mal placée dans
  `loot.$comment` sont revenus à l'état du dépôt, byte pour byte (`loot.$comment` vérifié
  identique à HEAD). La moustache et les cheveux gris ne sont plus nulle part.
- **⚠ Le verdict disait « revert to `origin/main` » : je ne l'ai pas fait littéralement, et
  c'est délibéré.** Sur ce worktree, `origin/main` ne contient pas 62 lignes du bloc
  `photoQte` **déjà committées sur la branche** : un revert littéral les aurait supprimées.
  J'ai reverté **le diff de travail** (l'intention du verdict), pas la branche. À vérifier
  par `dev-tooling-assets` si quelqu'un rejoue la consigne à la lettre.
- **Traçabilité réappliquée au bon endroit : `boss.$comment`**, et cette fois écrite en
  ciblant explicitement le bloc `boss` — la chaîne de fin de commentaire est identique dans
  `loot` et dans `boss`, et un remplacement naïf frappe `loot` en premier. **C'est
  exactement le mécanisme du bug D4**, que j'ai reproduit une fois avant de le corriger ; je
  le consigne pour que le prochain qui édite ce fichier le sache.
- Le paragraphe consigne : la clause **observée sur les PNG livrés**, la règle « le PNG est
  la référence », le fait que le visage **n'est plus le discriminant**, le revert de la
  moustache, et que **les sept prompts sont laissés inchangés à dessein** — leur insertion
  est une édition de famille qui exige son propre PASS, la pré-autorisation du round 2 étant
  dépensée.
- **`node scripts/check-art-prompts.mjs` : PASSED**, aucun nouveau warning. Diff total :
  1 ligne, `boss.$comment`. **Le bloc `photoQte` n'est pas touché.**

---

## 9. Ce qui reste dû, et questions

| Owner                                   | Item                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lead-game-designer` / `game-designer`  | Le **DÉPART** (§7) : translation de la berline, ou quatrième pose dessinée avec sa boîte ? · Les colonnes « voiture proche » et « déroulé » du §3 sont des contraintes de **piste et de placement** : où sont-elles assertées en CI ? · `berline_double_file` / `berline_decoy` sont-ils des candidats (⇒ boîtes) ou du décor mobile ? |
| `art-advisor`                           | La clause observée §1 tient-elle en 16-bit pixel art **et** en trame grossière (question de cohérence de cast, plus d'éliminatoire) · mobilier de terrasse novembre 1998 (clause pré-autorisée)                                                                                                                                        |
| `gpu-specialist` + `dev-tooling-assets` | Fork (a) 6 uniques / (b) 3×2 · **deux sprites véhicules en plus** (§4) · ARRIVÉE 1536 (optionnel désormais) · `pxPerSu` par candidat · bornes du crop                                                                                                                                                                                  |
| `narrative-designer`                    | Le chauffeur en tenue attend dans la voiture : est-ce un subordonné qui **sait**, donc un témoin ? Ça vaut peut-être une ligne, et ça durcit le levier.                                                                                                                                                                                |
| `lead-art`                              | Gate round 4 · gate asset (balayage anti-défauts : **quatorze mains sur des tables**, quatre de plus sur le manteau à l'ARRIVÉE, plus deux au volant)                                                                                                                                                                                  |

Trois questions courtes :

1. Le contraste du signal n°1 repose sur **un chauffeur présent vs absent** (`_a`). Est-ce
   lisible à l'échelle plaque (20,5 px/su) à travers un pare-brise ? Si non, je remplace le
   siège vide par **une portière ouverte côté conducteur** — masse franche, même sens.
2. Les six leurres gardent-ils six seeds distincts sous le même `style` block (ratifié au
   round 3) maintenant que trois d'entre eux partagent le motif de mains verbatim ?
3. Le sosie peint seul à sa table (Q6 round 2) survit-il à la nouvelle direction ? Il n'a
   plus grand-chose à imiter, mais il ne coûte rien et il épaissit la foule. Je le garde
   sauf avis contraire.
