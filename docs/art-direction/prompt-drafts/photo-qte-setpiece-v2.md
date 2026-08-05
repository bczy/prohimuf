# Photo QTE set-piece — DRAFT v2.2 (scène peuplée + preuve « avec qui / comment il est venu »)

> **v2.1 — 2026-08-05.** Direction Bertrand : « la "preuve maîtresse" est d'un glauque…
> un couple qui marche dans la même rue est plus adapté, genre qui s'embrasse ou se tient
> la main ou encore qui se font un cadeau ou un restaurant. » **L'enveloppe et la
> transaction disparaissent.** La cible devient le Commandant surpris en tendresse.
> Sections réécrites : §2.c (faux positifs), §3 (le sujet, `exchange_street` →
> `commandant_couple`), §4 (`berline_plate`), §7 (impacts fiction). §1 (plaque) est
> amendée à la marge : les figurants deviennent des couples.
>
> **v2.2 — 2026-08-05, PRÊT POUR LE GATE (Nico).** Quatre décisions tombées, toutes
> intégrées ci-dessous :
>
> 1. **La partenaire est une femme** — option A tranchée par Bertrand sur recommandation
>    ferme du narratif. La variante B est **fermée**, le prompt de §3 est figé là-dessus.
> 2. **Le levier n'est plus l'intimité.** « Il a une vie » = zéro levier, écrit exprès. Ce
>    qui compromet, c'est **avec qui** (elle dirige les boîtes du centre — conflit
>    d'intérêts) et **comment il est venu** (voiture de service en double file — faute
>    professionnelle). « Muf ne le tient pas par son cœur, il le tient par son matricule. »
>    → Conséquence d'image, décisive : **le registre du geste reste chaleureux, jamais
>    lascif** — c'est la voiture à côté qui salit, pas le couple. Et **le paquet ne quitte
>    pas la nappe** : un objet qui passe de main en main redevient un paiement, exactement
>    ce qu'on vient de fuir.
> 3. **La berline repart pendant les 3 dernières secondes** et se tient **en double file**,
>    pas garée proprement (§4.b réécrit).
> 4. **Les 7 tables sont adoptées par la mécanique** (elle en demandait 3), avec une
>    nouvelle règle contraignante sur les tables à ≥2 personnes (§2.c).

Auteur : concept-artist (Maud). Statut : **draft, non gaté**. Aucune écriture dans
`src/game/levels/levelArt.json` avant le PASS `lead-art`.
Remplace, si gaté, la moitié « plate + poses » de
`docs/art-direction/prompt-drafts/photo-qte-setpiece.md` (v1). Les tampons
(`stamp_master` / `stamp_bonus` / `stamp_reject`) et la `sheet` ne sont pas touchés.

---

## 0. Pourquoi v2 — la contrainte qu'on avait mal lue

Verdict Bertrand : « là on prend quoi en photo ? […] il n'y a qu'un truc à prendre en
photo sur toute la scène, intérêt ZÉRO. »

Il a raison, et la cause est mécanique, pas artistique. Le gate v1 avait tranché
« `plate` = DÉCOR SEUL, ni acteur ni berline », parce que les 9 boîtes de `subjectTrack`
sont vérifiées en CI sur l'AABB opaque **du sprite livré**
(`scripts/check-photo-subject-boxes.mjs`) : une figure peinte dans une plaque opaque n'a
pas d'AABB lisible. Conclusion tirée à l'époque : _aucune_ figure dans le décor.
Conclusion correcte : **aucune figure VÉRIFIÉE dans le décor.**

La clé du pivot : **les figurants ne sont vérifiés par rien.** Aucun test, aucun gate,
aucune boîte ne les mesure. Ils peuvent donc être peints à même la plaque, ou être des
découpes déjà shippées reposées par-dessus. Seule **la cible compromettante** reste une
découpe dédiée avec sa boîte vérifiée — une par scène, celle du contrat de gameplay.

Doctrine v2, en une ligne :
**décor dense et peuplé (non vérifié) + figurants réutilisés (non vérifiés) + UN sujet
spécial découpé (vérifié).**

---

## 1. La plaque dense — `plate`

Objectif : densité de `public/assets/levels/belliard/street-wide.png`, mais dans le
tirage fanzine N&B de la lucarne (le joueur regarde à travers un viseur, pas à travers le
moteur : le style reste xérox, pas 16-bit). Assez de matière pour que zoomer **partout**
paie quelque chose : un regard, une silhouette derrière un rideau, un geste ambigu.

### Prompt proposé

> Photocopied punk fanzine xerox illustration, rough black ink linework, coarse halftone
> toner dots, high-contrast black and white: a plunging night view down a narrow crowded
> 1998 Paris street from a rooftop dormer. A dark roadway band across the bottom third,
> two saloon cars and a small van parked nose to tail along the near kerb, a scooter and a
> bicycle leaned against the wall between them, a delivery van with its rear doors open
> further down, and one dark saloon standing out in the open roadway alongside the parked
> row, angled slightly across the traffic lane and blocking it, alone away from the kerb. Along the pavement a row of shopfronts under awnings: a bakery with a
> lit window, a corner bistro under a glowing awning with eight small round pavement
> tables, most of them taken by seated pairs of customers in coats leaning towards each
> other over their glasses, a shuttered grocer with crates outside, a laundrette with a
> bright glowing front. Right of
> centre a tall vertical slot between two buildings, the deepest solid pure-black shape in
> the picture, rising past the first floor, tagged roller shutters either side. Small
> clothed figures scattered the length of the pavement, all in overcoats and jackets: two
> walking arm in arm, two standing close and holding hands under a lamp, a group of three
> talking near the bistro, one figure handing a small wrapped parcel to another outside the
> bakery, a lone figure leaning on the wall by the slot, one figure crouched at a scooter,
> one figure at a phone box. Above, six
> storeys of Haussmann facades with wrought-iron balconies converging away up both sides,
> a dozen windows lit as pale rectangles, a small dark seated or standing silhouette
> inside four of them, one window showing two silhouettes side by side, the rest shuttered
> dark. Bill-posted panels, layered torn posters,
> spray tags along the lower walls, bins and bollards and a slender cast-iron traffic-light
> mast on the pavement, hooded lamps spilling pale pools on the tarmac.

### Rationale, clause par clause (chaque clause paye sa place)

| Clause                                                                                                                          | Ce qu'elle achète                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « photocopied punk fanzine xerox… high-contrast black and white »                                                               | Bloc de style maison, identique à v1 : la plaque doit rester dans le même tirage que les découpes.                                                                                                                                                                                                                                                                                  |
| « plunging night view … from a rooftop dormer »                                                                                 | Le point de vue du joueur (lucarne). Inchangé v1 : c'est le seul ancrage de continuité de mise en scène.                                                                                                                                                                                                                                                                            |
| « roadway band across the bottom **third** » (v1 : sixth)                                                                       | Rend au trottoir/à la chaussée la surface nécessaire pour poser du monde. Un sixième de hauteur ne peut pas contenir une foule.                                                                                                                                                                                                                                                     |
| Voitures / scooter / vélo / camionnette portes ouvertes                                                                         | Première couche de zoom : de la mécanique à fouiller, et un rappel de la berline (faux positif n°1 — le joueur a appris que « berline sombre = cible » en v1).                                                                                                                                                                                                                      |
| Rangée de commerces nommés (boulangerie, **bistro à terrasse**, épicerie, laverie)                                              | Quatre pôles lumineux répartis en largeur : ils structurent le balayage horizontal du zoom au lieu de le laisser errer. **v2.1 :** la terrasse et ses huit tables occupées par des paires attablées est désormais la clause la plus importante de la plaque — c'est le banc de sable où la cible se noie.                                                                           |
| « two walking arm in arm, two holding hands under a lamp, one handing a small wrapped parcel »                                  | **v2.1 :** les figurants rejouent tous les gestes que Bertrand cite (bras dessus, main dans la main, cadeau). La recherche devient naturelle : le geste ne distingue plus rien, **seul le visage distingue**.                                                                                                                                                                       |
| « one dark saloon standing out in the open roadway … angled across the traffic lane and blocking it, alone away from the kerb » | **v2.2, clause décisive du nouveau levier.** La double file EST la faute professionnelle, et elle se décrit **positivement** : hors de la file, en travers, seule, elle bloque. Jamais « mal garée » ni « not parked » — FLUX ignore la négation, il lit la position. C'est ce véhicule que `berline_plate` rejoue en gros plan (§4.b) et qui repart dans les 3 dernières secondes. |
| « all in overcoats and jackets », « clothed figures »                                                                           | Double emploi : vérité de période (rue de nuit en novembre) **et** garde-fou anti-dérive — le vêtement est nommé avant toute figure, y compris dans la plaque.                                                                                                                                                                                                                      |
| « tall vertical slot … deepest solid pure-black shape »                                                                         | **Conservé mot pour mot de v1** : c'est l'ancrage de continuité avec `street-wide.png` (critère E-6(7)) et la niche où vivra le sujet.                                                                                                                                                                                                                                              |
| Six figurants nommés et localisés                                                                                               | La masse. Chacun est une hypothèse plausible : un groupe qui parle, un type adossé, un couple qui s'éloigne, quelqu'un accroupi, quelqu'un au téléphone.                                                                                                                                                                                                                            |
| « a dozen windows lit … a small silhouette inside four of them »                                                                | Deuxième étage de zoom, gratuit en pixels : les fenêtres sont déjà dans le décor Belliard, on les habite.                                                                                                                                                                                                                                                                           |
| Affiches / tags / poubelles / bornes / mât tricolore                                                                            | Grain de bas de mur : ce qui fait qu'un zoom au hasard tombe toujours sur _quelque chose_.                                                                                                                                                                                                                                                                                          |
| Aucun « no people », aucune négation                                                                                            | FLUX ignore les négations ; on décrit ce qui EST là. Et la loi v1 « le décor ne contient pas d'acteur » tombe : elle n'a jamais protégé qu'une boîte vérifiée.                                                                                                                                                                                                                      |

**Interdits maintenus (hérités du gate v1) :** aucun lettrage lisible sur les enseignes
(la fascia boulangerie reste un panneau peint muet, FLUX ne sait pas lettrer un 1998
français) ; aucun rim néon sur cette famille (le sujet est photographié, jamais tiré
dessus) ; plaque opaque 16:9, pas de chroma key.

**Génération :** même route que v1 — kontext img2img depuis
`assets/photoqte/plate-source-crop.png`, seed épinglée, cap 2 batches. La densité demandée
ici justifie de repartir d'un crop **plus large** de `street-wide.png` (davantage de
matière source) ; le choix exact du crop est `dev-tooling-assets`, pas moi.

**Risque assumé :** à 2048×1152, des figurants de 40–60 px ont des visages et des mains
approximatifs. C'est acceptable et même souhaitable : le flou de l'anonymat est ce qui
rend le zoom nécessaire. La netteté est réservée au sujet, qui est une découpe.

---

## 2. Inventaire des figurants réutilisables (zéro génération)

Rien de tout ceci n'est vérifié par la CI. Coût de génération : nul. Coût de style :
indiqué.

### 2.a Même tirage fanzine N&B — reposables tels quels

| Sprite shippé                                  | Emploi proposé dans la scène                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `assets/nearfg/scooter.png`                    | Deux-roues couché contre le mur ; un deuxième plus loin, à l'échelle réduite.           |
| `assets/nearfg/bench.png`, `bench_front.png`   | Banc devant le café — support d'un figurant assis.                                      |
| `assets/nearfg/bollard.png`                    | Rangée de bornes le long du caniveau, échelles dégressives.                             |
| `assets/nearfg/lamppost.png`                   | Deux réverbères, l'un cadrant le slot.                                                  |
| `assets/nearfg/parkingMeter.png`, `_front.png` | Horodateurs : le prétexte du figurant penché.                                           |
| `assets/nearfg/streetSign.png`                 | Panneau de rue près de l'entrée du passage.                                             |
| `assets/nearfg/trafficLight.png`               | Le mât tricolore (déjà décor, déjà « ne lit rien » par la prohibition R3-2/N-1).        |
| `assets/nearfg/wallaceFountain.png`            | Fontaine Wallace — vérité de période, et un point de zoom que tout Parisien vérifie.    |
| `assets/loot/crate.png`                        | Cageots devant l'épicerie fermée ; deux exemplaires, tailles différentes.               |
| `assets/vehicles/car.png`                      | **Le faux positif majeur** : une berline garée, même famille graphique que la cible v1. |
| `assets/vehicles/moto.png`                     | Moto sur béquille entre deux voitures.                                                  |
| `assets/vehicles/truck.png`                    | Camionnette de livraison, portes arrière ouvertes.                                      |

### 2.b Figures humaines — deux routes possibles

Les sprites humains shippés (`enemy_*`, `hostage/girl`, `courier/rider*`,
`boss/commander_*`) sont en **pixel art 16-bit couleur** : posés bruts dans le viseur
xérox, ils hurlent. Deux options, à trancher par `lead-art` :

- **Route A (recommandée) — les humains sont PEINTS DANS LA PLAQUE** (clause §1). Zéro
  asset, zéro pipeline, cohérence de tirage garantie, et l'anonymat vient gratuitement de
  la résolution. C'est la route que je défends.
- **Route B — desaturation + halftone d'un sprite existant.** Précédent existant :
  `nearForegroundArt` est « chroma-keyed **+ luma-desaturated** ». On pourrait passer
  `courier/rider.png` (le livreur — **v2.1 : il perd son rôle de faux positif majeur** avec
  l'abandon de l'enveloppe, mais reste une bonne présence de rue) et un ou deux
  `enemy_sprite_*` par le même filtre. Coût : un passage script (lane `dev-tooling-assets`), et un risque
  de trame incohérente (pixels carrés vs points de trame). À réserver aux **deux ou trois**
  figurants qu'on veut nets et cliquables, pas à la foule.

### 2.c Les faux positifs qu'on plante délibérément

**v2.1 — le changement de nature des faux positifs.** En v2, les leurres imitaient un
geste rare (une remise d'objet) : il fallait les fabriquer, et chacun se voyait. Avec la
preuve tendre, **le leurre est le décor lui-même** — une rue de nuit est pleine de gens
qui s'embrassent, se tiennent la main, dînent à deux. On ne simule plus la cible : la
cible est un cas particulier d'une chose banale. C'est le meilleur cadeau de ce pivot.

Corollaire de méthode : **le geste ne discrimine plus rien, seul le visage discrimine.**
C'est exactement ce qui justifie enfin le téléobjectif — le joueur ne cherche plus une
forme, il vérifie une identité, tête par tête. Toute la liste ci-dessous est construite
là-dessus.

Liste proposée, tous non vérifiés :

1. **Les sept autres tables de la terrasse** — chacune un couple attablé, même cadre, même
   lumière, même posture penchée. Sept fois le bon geste, sept fois le mauvais visage.
2. **Le couple bras dessus bras dessous** qui remonte le trottoir, de dos : impossible à
   écarter sans zoomer, et le zoom ne donne que deux nuques. Le leurre le plus coûteux en
   temps, donc le meilleur.
3. **Le couple main dans la main sous le réverbère** — le geste littéral cité par Bertrand,
   joué par des inconnus.
4. **Le baiser sous l'auvent de la laverie** — le geste le plus fort de la scène… sur les
   deux personnes qui n'intéressent personne. Punit la lecture au geste.
5. **Le cadeau devant la boulangerie** — un petit paquet enrubanné passe d'une main à
   l'autre. Récupère l'ancien « colis pâle » (v2 §2.c-4) sous sa forme nouvelle : ce n'est
   plus une signature de transaction, c'est une tendresse de plus.
6. **La fenêtre allumée aux deux silhouettes côte à côte** — un couple chez lui, un étage
   au-dessus. Étend la fouille à la verticale, pas seulement au trottoir.
7. **L'homme seul adossé au mur près du slot** — il attend quelqu'un ; il est le bon type
   d'homme, à la bonne heure, au bon endroit, et il ne sert à rien.
8. **Un homme en manteau sombre attablé de dos**, à deux tables de la cible : silhouette
   quasi identique au Commandant, visage invisible. Le sosie.
9. **La berline garée** (`vehicles/car.png`) — le joueur v1 a appris « berline sombre =
   cible » ; ici elle ne vaut plus que par sa plaque (§4).
10. **Le groupe de trois près du bistro** — bruit de fond, densité, et une quatrième
    personne qu'on ne voit qu'en zoomant.
11. **L'accroupi au scooter** et **l'homme à la cabine** — hérités de v2, toujours valides :
    ils entretiennent le doute « et si la preuve n'était pas un couple ? ».

Onze pistes, un seul visage. **Personne dans cette liste ne porte d'uniforme, et la cible
non plus** — voir le piège traité en §3.

Note de production : le leurre n°8 (le sosie de dos) est le seul qui mérite peut-être sa
propre découpe plutôt qu'un aplat peint, parce qu'il doit soutenir un zoom serré sans
bouillie. À trancher au gate ; s'il devient un sprite, il reste **non vérifié** — aucune
boîte, aucun `subjectTrack`.

Onze pistes, un seul visage. C'est ça, la boucle.

### 2.d v2.2 — la règle des tables (adoptée par la mécanique, et elle me contraint)

Les 7 tables leurres sont **retenues** (la mécanique en demandait 3) parce qu'elles naissent
du lieu plutôt que d'un quota : l'écart réel entre deux tables de terrasse dépasse de 44 %
le plancher de séparation exigé. **La géométrie du lieu produit gratuitement la contrainte
de gameplay** — c'est exactement l'argument que je défendais en §3.0, désormais chiffré.

En contrepartie, une règle qui pèse sur mon art et que j'accepte :

> **Toute table à ≥2 personnes en interaction doit être SOIT un candidat authored, SOIT
> visiblement non-photographiable.** Sinon une photo bien cadrée recevrait un tampon
> « hors cadre » — un mensonge, et le joueur aurait raison de se sentir volé.

Traduction en directives d'image, opposables au gate :

1. **Les 7 tables leurres sont des candidats authored** — donc peintes/posées à la position
   exacte que la spec leur donne, jamais « en plus » ni décalées d'un demi-cadre par une
   liberté de composition. Elles cessent d'être du décor : elles sont du contenu.
2. **Toute autre table de la terrasse est rendue non-photographiable PAR L'IMAGE**, et
   positivement : occupée par **une seule** personne, ou **vide avec les chaises
   retournées sur le plateau**, ou **coupée par le bord du cadre**, ou **masquée par le
   mât / l'auvent / une silhouette au premier plan**. Aucune table ambiguë ne survit.
3. **Conséquence sur le prompt §1 :** « eight small round pavement tables » se lit
   désormais 1 cible + 7 leurres — le compte est exact et ne doit pas dériver à la
   génération. Si le rendu en produit dix, on ne « laisse pas passer » : les tables
   surnuméraires doivent tomber dans la catégorie 2 ci-dessus ou être retouchées. **Point
   de contrôle explicite du gate asset.**
4. Même règle pour les couples **hors terrasse** (n°2, 3, 4 de la liste) : ils sont debout,
   de dos, ou partiellement masqués — jamais offerts à un cadrage propre qui mériterait un
   tampon.

---

## 3. Le sujet spécial — `commandant_couple` (remplace `exchange_close` puis `exchange_street`)

Une seule découpe vérifiée dans la scène. Elle doit tenir deux contraintes opposées :
**illisible dans la masse au grand angle, incontestable au zoom.**

### 3.0 Le geste choisi, et pourquoi les trois autres perdent

Bertrand en propose quatre. Un seul tient les deux contraintes à la fois. Mon choix :
**attablés à la terrasse du bistro, mains jointes sur la table, un petit paquet enrubanné
posé entre les verres.** Ce cadre absorbe _trois_ des quatre propositions (restaurant +
main dans la main + cadeau) dans une seule image.

| Geste                             | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Le baiser**                     | **Rejeté — il cache le visage.** C'est rédhibitoire : depuis ce pivot, le visage est le SEUL discriminant. Un baiser tourne les deux têtes l'une contre l'autre et détruit précisément l'information que le joueur vient chercher. Il fait en revanche un excellent faux positif (§2.c-4) : le geste le plus spectaculaire de la scène, sur les gens qui ne comptent pas.                                                                                          |
| **Main dans la main en marchant** | **Rejeté comme cible, gardé en leurre.** Deux marcheurs se lisent de dos ou de profil, en mouvement : visages fuyants, et une pose qui appelle l'animation alors que les poses de hold doivent être des sprites STATIQUES mono-frame (zéro frame = seule garantie zéro-dérive pour E-6(4), ruling v1 §3).                                                                                                                                                          |
| **Le cadeau**                     | **Rejeté comme sujet unique, absorbé.** Un petit paquet, c'est un objet fin — exactement le problème de lisibilité N&B tramée qu'on vient de fuir avec l'enveloppe. Comme _détail_ posé sur la table, en revanche, il paye : il donne au zoom une deuxième récompense après le visage.                                                                                                                                                                             |
| **La terrasse de restaurant**     | **RETENU.** Quatre raisons : (1) c'est le seul endroit d'une rue de nuit où un visage est **légitimement éclairé** — l'auvent lumineux du bistro motive la lisibilité au téléobjectif sans tricher ; (2) c'est une pose **assise et immobile**, donc un mono-frame naturel ; (3) elle se noie par construction : sept autres tables identiques autour ; (4) elle porte les deux autres gestes en supplément (mains jointes sur la nappe, paquet entre les verres). |

Conséquence : la cible n'est plus reconnaissable à ce qu'elle FAIT. Elle est reconnaissable
à **qui elle est**. Le zoom passe du statut d'outil de confort à celui de mécanique
centrale — c'est la boucle que Bertrand réclamait.

### 3.0-bis Le piège de l'uniforme (traité de front)

Si le Commandant est le seul en manteau sombre ou en tenue, il se dénonce à 200 px et le
zoom redevient décoratif. Trois verrous dans le prompt :

1. **Il est en civil, et son civil est le civil de tout le monde** : manteau de laine
   sombre, col ouvert, écharpe — la même description vestimentaire que les figurants de la
   plaque (§1 : « all in overcoats and jackets »). Aucun képi, aucun galon, aucun
   ceinturon, aucune tenue nommée dans le prompt du sujet.
2. **Le sosie n°8** (§2.c) porte exactement la même valeur de manteau, deux tables plus
   loin, de dos. La silhouette ne peut donc pas trancher — même sur un joueur qui essaie.
3. **L'identification passe par des traits de tête stables et reproductibles** : la ligne
   des cheveux, la moustache, la mâchoire lourde, la monture de lunettes. Ce sont des
   traits que je peux répéter à l'identique dans les autres poses de la famille (et que
   `art-advisor` doit raccorder aux sprites `boss/commander_*` déjà shippés — sinon le
   joueur n'a aucun référentiel pour reconnaître qui que ce soit, et la boucle est fausse).

**Dépendance signalée, hors de mon lane :** cette mécanique n'a de sens que si le joueur a
déjà vu le visage du Commandant ailleurs (briefing, fiche, cinématique). Sans référence,
zoomer sur des visages ne discrimine rien. À trancher par `lead-game-designer` +
`narrative-designer`.

### Le post-mortem du NU (à ne pas reproduire)

`exchange_close` v1 a généré un nu. Cause : le prompt était une addition de fragments
anatomiques sans un seul vêtement porté par le sujet gauche —
« two large **dark head shapes** … **cropped at the collarbones** … left short hair » :
aucun habit sur l'homme de gauche, un cadrage nommé par un **repère osseux**, et
« bare magenta » qui met le token _bare_ à trois mots d'un torse. FLUX complète ce qu'on
ne décrit pas, et « head + collarbone + bare » complète en peau.

**v2.1 — le risque est PLUS élevé, pas moins.** On passe d'une remise d'enveloppe à une
scène de tendresse : le champ sémantique « couple / intimité / restaurant » est
précisément celui où un modèle dérape. Les trois règles ci-dessous ne sont donc pas
héritées par principe, elles sont **renforcées** : la scène est publique, attablée,
manteaux fermés, vue de loin, et rien dans le prompt ne nomme un contact autre que deux
mains sur une table.

Trois règles :

1. **Le vêtement d'abord, le corps jamais.** Chaque figure est nommée par son habit
   (« a man in a buttoned dark overcoat »), pas par sa tête ni son torse.
2. **Cadrage par le décor, pas par l'anatomie.** On ne coupe pas « aux clavicules » : on
   cadre une scène entière, pieds au sol, jusqu'au bord bas de l'image.
3. **Zéro token ambigu.** Aucun `bare`, `nude`, `close`, `intimate`, `skin`, `body`,
   `flesh`, `cropped at`. Le fond magenta se dit « flat uniform bright magenta #FF3CDC
   field », jamais « bare magenta ».

### Prompt proposé — **FIGÉ v2.2** (partenaire = femme, option A ; registre chaleureux ; paquet posé)

> two fully dressed customers in winter coats seated at a small round café table on a
> pavement terrace at night, seen at mid-distance from slightly above, both figures whole
> from head to shoe, both seated upright on separate bistro chairs on one ground line: on
> the left a heavy-set man in a dark wool overcoat over a shirt and knitted scarf, thick
> greying hair swept back, a broad moustache, square jaw, bare-headed, his face turned
> three-quarters towards his companion and fully visible; on the right a woman in a belted
> pale coat over a business suit and a beret, seen in three-quarter view, a slim document
> folder tucked beside her chair, talking to him with an easy open smile; on the tablecloth
> between them their two hands rest side by side on the cloth, fingers loosely folded
> together, both figures sitting straight and apart, beside two tall glasses, a coffee cup
> and a small ribboned parcel resting closed on the cloth; behind them the glowing awning
> of the bistro and a wall of tiles, at their feet the wet pavement

**Ce que v2.2 change dans ce prompt, et pourquoi (une clause = une décision) :**

- `over a business suit` + `a slim document folder tucked beside her chair` — **le nouveau
  levier est là.** Ce n'est pas une amoureuse, c'est une dirigeante : le tailleur et le
  parapheur disent « avec qui » sans un mot de texte. C'est l'unique ajout qui fait passer
  l'image de « il a une vie » à « conflit d'intérêts ».
- `talking to him with an easy open smile` (remplace `smiling towards him`) — **registre
  chaleureux, jamais lascif.** Elle _parle_ ; c'est une conversation, pas une étreinte. Le
  sale est dans la voiture d'à côté, pas sur cette table.
- `both figures sitting straight and apart` — verrou de registre ET verrou anti-dérive :
  droits, séparés, deux chaises. Une seule clause qui sert les deux causes.
- `a small ribboned parcel resting closed on the cloth` (remplace « beside two glasses ») —
  **le paquet ne quitte jamais la nappe.** Un objet qui passe de main en main redevient un
  paiement : `resting closed on the cloth` interdit positivement le geste de remise sans
  jamais avoir à le nommer.
- `a coffee cup` — un détail de plus à zoomer, et l'heure : on n'est pas au champagne.
- **Variante B (partenaire masculine) : SUPPRIMÉE.** Décision Bertrand, option A. Elle ne
  figure plus dans ce document pour qu'aucune génération ultérieure ne la ressuscite.

**Rationale**

| Clause                                                                                                                                                           | Ce qu'elle achète                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « two **fully dressed** customers in winter coats » en ouverture                                                                                                 | Le tout premier token de sujet est un vêtement, et « customers » cadre socialement la scène avant toute anatomie. Antidote direct au nu de v1, renforcé pour un champ sémantique plus risqué.                                                                                                                                                                                                                                                   |
| « seated at a small round café table on a pavement terrace at night »                                                                                            | Le geste retenu (§3.0) et, surtout, le **lieu public** : une terrasse n'est pas une chambre. Verrou sémantique n°2.                                                                                                                                                                                                                                                                                                                             |
| « seen at mid-distance from slightly above »                                                                                                                     | Raccorde à l'axe de la lucarne et interdit le gros plan qui avait dérivé en v1.                                                                                                                                                                                                                                                                                                                                                                 |
| « both figures whole from head to shoe … on one ground line »                                                                                                    | Cadrage défini par la figure entière : aucun repère anatomique de coupe, et une AABB propre et stable pour `check-photo-subject-boxes.mjs`.                                                                                                                                                                                                                                                                                                     |
| « seated upright on separate bistro chairs »                                                                                                                     | **Deux chaises séparées** : verrou sémantique n°3, il interdit la fusion des deux corps en une seule masse et toute lecture d'enlacement.                                                                                                                                                                                                                                                                                                       |
| « a dark wool overcoat over a shirt and knitted scarf »                                                                                                          | Le Commandant en civil, habillé **exactement comme la foule de §1**. Aucun képi, aucun galon : le piège de l'uniforme est désamorcé dans le vêtement lui-même.                                                                                                                                                                                                                                                                                  |
| « thick greying hair swept back, a broad moustache, square jaw, bare-headed »                                                                                    | **La clause la plus importante du prompt.** C'est le seul discriminant de toute la scène ; elle doit être répétée mot pour mot dans toute autre pose du personnage, et raccordée aux `boss/commander_*` shippés. « bare-headed » : pas de chapeau qui masquerait la ligne des cheveux au zoom.                                                                                                                                                  |
| « his face turned three-quarters towards his companion and **fully visible** »                                                                                   | Exige explicitement ce que la boucle vend : un visage photographiable. Le trois-quarts donne à la fois le profil du nez et la mâchoire — les deux traits reconnaissables en N&B tramé.                                                                                                                                                                                                                                                          |
| « a woman in a belted pale coat over a business suit and a beret, three-quarter view, a slim document folder beside her chair, talking with an easy open smile » | **v2.2 — la clause qui porte le nouveau levier.** Valeur claire contre valeur sombre : les deux figures se séparent à 60 px. Le béret ancre 1998 Paris. Le tailleur + le parapheur disent **avec qui** il dîne (une dirigeante, pas une amoureuse) — c'est ça qui compromet. « talking … easy open smile » fixe le registre : chaleureux, jamais lascif. Partenaire **figée en femme** (option A, Bertrand) : la variante masculine est fermée. |
| « their two hands rest side by side, fingers loosely folded together »                                                                                           | Le geste tendre, dit dans le vocabulaire le plus sec possible. **Posées sur la nappe** : les mains sont appuyées, donc stables, et le nombre de doigts est le risque de défaut n°1 du projet — les tenir immobiles sur une table est ce qui le réduit le plus.                                                                                                                                                                                  |
| « two tall glasses, a coffee cup and a small ribboned parcel **resting closed on the cloth** »                                                                   | Le restaurant et le cadeau, en accessoires — deuxième récompense du zoom, après le visage. **v2.2 :** le paquet est explicitement POSÉ et FERMÉ. Un objet qui passe de main en main redevient un paiement, ce qu'on vient de fuir : la clause interdit le geste de remise en décrivant positivement l'objet immobile, jamais par une négation.                                                                                                  |
| « the glowing awning of the bistro and a wall of tiles, the wet pavement »                                                                                       | Le sujet transporte sa propre niche : il se pose sur la terrasse de la plaque sans trou de raccord — et l'auvent **motive** la lumière sur le visage.                                                                                                                                                                                                                                                                                           |

Style : le bloc `style` existant de la famille `photoQte`, verbatim, y compris
« on a flat uniform bright magenta #FF3CDC field filling every gap and every space between
the shapes, no text ». Aucune couleur, aucun néon dans le sujet.

**Contrôle qualité imposé au gate asset — trois lectures, pas une :**

1. **À 1:1** — mains (nombre de doigts, deux mains et pas trois), manteaux fermés, deux
   chaises distinctes, aucune fusion des silhouettes.
2. **À la taille du zoom maximal** — le visage du Commandant doit être identifiable :
   cheveux, moustache, mâchoire lisibles à travers la trame. Si le visage est une bouillie,
   **l'asset est refusé** : c'est toute la boucle qui tombe, pas un détail.
3. **À la taille de composition (grand angle)** — le sujet doit être **indistinguable** des
   onze leurres de §2.c. S'il saute aux yeux sans zoom, il est raté dans l'autre sens.

Une variable par itération :

- dérive intime → je change **uniquement** l'ouverture (renforcer le plan vestimentaire) ;
- visage illisible → je change **uniquement** la clause de traits (ajouter un trait
  saillant, pas rapprocher la caméra) ;
- sujet qui se dénonce au grand angle → je change **uniquement** la clause de manteau pour
  la rapprocher de celle de la foule.
  Jamais deux à la fois.

---

## 4. Sort des trois autres poses v1

| Pose                                       | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Motif |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `commandant_wait` (commandant seul)        | **À JETER** en tant que cible ; **à recycler** en figurant. Une figure debout seule dans une rue n'est compromettante en rien — c'est exactement le « panneau photographiez ici » que Bertrand rejette. Le PNG existe, il est dans le bon tirage : qu'il devienne un des figurants non vérifiés de §2 (l'homme au téléphone, ou l'adossé), et il paye enfin sa place.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pair_facing` (face-à-face + berline)      | **À REFONDRE, ou à fusionner.** Sa raison d'être v1 était de faire monter la tension avant l'échange. Dans la scène dense, le face-à-face **sans enveloppe** devient le meilleur faux positif de la scène : je propose de le garder tel quel mais **rétrogradé en figurant non vérifié**, et de laisser `commandant_couple` porter seul la boîte. **v2.1 :** avec la preuve tendre, un face-à-face debout entre deux hommes ne raconte plus rien du tout — il devient purement un leurre, ce qui confirme la rétrogradation. Si le design tient à une progression en deux temps, la deuxième pose doit être le **même couple attablé une seconde plus tôt** (avant que les mains ne se joignent), re-généré au cadrage et à l'échelle exacts de `commandant_couple` — sinon la cible se signale par son changement de taille. |
| `berline_plate` (plaque d'immatriculation) | **À GARDER, intact — et le pivot v2.1 la renforce.** Aucune modification de prompt. Sa géométrie reste verrouillée par construction (un PNG translaté, jamais redimensionné : c'est ce qui rend E-6(5) et E-6(6) vrais par construction). Voir la note ci-dessous : elle change de _sens_ sans changer d'_art_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### 4.b `berline_plate` après le pivot — la voiture EN DOUBLE FILE devant le restaurant

Reste-t-elle pertinente ? **Oui, et depuis v2.2 elle n'est plus un bonus décoratif : elle
porte la moitié du levier.** « Muf ne le tient pas par son cœur, il le tient par son
matricule » — le matricule, c'est elle.

1. **Elle devient une preuve de second ordre, pas un doublon.** La photo de la table prouve
   _avec qui_ il dîne ; la voiture prouve _comment il est venu_ — véhicule de service,
   **en double file**, moteur côté rue, pendant qu'il dîne. La faute professionnelle est
   là, dans la position du véhicule, pas dans le couple.
2. **Elle sauve le rythme.** La scène ne peut pas être faite d'un seul type de cible (des
   visages, encore des visages). La plaque est l'unique beat de nature différente : on ne
   cherche plus une personne, on lit une inscription. Elle mérite d'être le **bonus**, pas
   la preuve maîtresse.
3. **Elle profite de la densité.** Parmi cinq véhicules garés le long du trottoir (§2.a),
   la seule qui soit **hors de la file** se distingue sans être signalée : trouver LA bonne
   plaque devient un vrai geste au lieu d'un pointage.

**Le prompt `berline_plate` tient-il en double file ? Oui, sans une lettre de changement —
et je l'ai vérifié clause par clause.** Il décrit « a dark saloon's rear **square-on,
parallel to the picture plane**, a low wide block filling the frame » : un cul de voiture
cadré de face, sans aucun contexte de trottoir, de caniveau ni de véhicule voisin. Rien
dans cette image ne dit comment la voiture est rangée. **C'est la plaque §1 qui porte la
double file** (clause « standing out in the open roadway, angled across the traffic lane
and blocking it, alone away from the kerb »), et le gros plan qui porte l'identification.
Séparation propre : le contexte au décor, le fait au sujet. Aucune régénération.

Trois conditions de mise en scène à répercuter côté placement (lane `dev-tooling-assets` /
spec), aucune n'étant un changement d'art :

- **À portée de regard de la terrasse**, pas à l'autre bout de la rue : le lien voiture ↔
  table doit être déductible par le joueur, sinon le bonus est arbitraire.
- **Hors de la file de stationnement, en travers de la voie** — c'est la position qui prouve
  la faute. Une berline proprement rangée ne prouve rien du tout et vide le beat de son
  sens.
- **Le départ dans les 3 dernières secondes** ne demande rien de neuf à l'art : c'est le
  MÊME PNG translaté horizontalement, exactement le mécanisme qui rend E-6(5) (cy constant)
  et E-6(6) (boîte constante) vrais **par construction**. Le pivot ne fragilise pas cette
  garantie, il la réutilise. Une seule vigilance de gate : le sprite ne doit être ni
  redimensionné ni redessiné pour « faire départ » — pas de fumée d'échappement, pas de
  feux allumés dans le PNG (l'unique élément autorisé à encoder un état reste le balayage
  de phares côté render, prohibition R3-2/N-1).
- **Clôture de scène :** la voiture qui s'en va est le meilleur signal de fin qu'on puisse
  offrir sans HUD — le joueur comprend qu'il a raté quelque chose sans qu'un texte le lui
  dise. Je signale simplement qu'elle doit sortir **par le bord opposé à la terrasse**,
  sinon elle passe devant la cible et masque le sujet pendant les dernières secondes.

Conséquence structurelle à faire trancher par `lead-game-designer` + `dev-tooling-assets` :
si `commandant_wait` et `pair_facing` sortent du `subjectTrack`, les 9 boîtes vérifiées et
les keyframes K2→K5 changent. **Ce n'est pas mon lane** — je signale l'impact, je ne le
tranche pas.

### 4.c Ce que le pivot change pour la fiction (relais `narrative-designer`)

**v2.2 — le narratif a tranché, et il a trouvé mieux que ma proposition.** J'avais listé
« le levier devient l'intime ». Sa réponse : « il a une vie » = zéro levier, écrit exprès —
ce qui compromet, c'est **avec qui** (elle dirige les boîtes du centre : conflit d'intérêts)
et **comment il est venu** (voiture de service en double file : faute professionnelle).
« Muf ne le tient pas par son cœur, il le tient par son matricule. » C'est plus fort, et
surtout **c'est photographiable** : un conflit d'intérêts et une infraction de
stationnement laissent des traces dans l'image (un tailleur, un parapheur, une voiture en
travers) là où un sentiment n'en laisse aucune.

Ce que ça verrouille côté art, désormais acté et intégré ci-dessus :

- **Registre chaleureux, jamais lascif** (§3, prompt figé). C'est la voiture à côté qui
  salit, pas le couple. L'image ne doit rien insinuer : elle doit **documenter**.
- **Le paquet ne quitte pas la nappe** (§3). Un objet qui passe de main en main redevient un
  paiement — retour du pivot précédent, refusé.
- **La partenaire est une femme** (option A, Bertrand), en tailleur, avec un parapheur : un
  personnage professionnel, pas un accessoire romantique.
- **La double file est une clause de décor, pas de sujet** (§4.b) : le contexte accuse, le
  gros plan identifie.

Reste dû par la fiction, et hors de mon lane :

- **Établir le visage AVANT la scène** (dépendance §3.0-bis) : sans référence visuelle
  préalable, zoomer sur des visages ne discrimine rien. C'est la seule dépendance qui peut
  faire tomber toute la boucle.
- **Nommer l'entreprise / le marché** quelque part dans le texte : sans ça, le tailleur et
  le parapheur restent décoratifs et le conflit d'intérêts n'est pas lisible dans l'image
  seule.

---

## 5. Ce que je ne fais pas dans ce draft

- Aucune écriture dans `src/game/levels/levelArt.json` (gate d'abord).
- Aucune `size`, `seed`, `pxPerSu`, `asset`, id ou chemin : `dev-tooling-assets`.
- Aucune boîte `subjectTrack` : `game-designer` / spec.
- `node scripts/check-art-prompts.mjs` non exécuté — rien à linter tant que le JSON n'est
  pas touché ; il tournera au moment de l'écriture post-gate.

## 6. Questions ouvertes pour le gate

1. Route A (figurants peints) vs Route B (sprites desaturés) — ou les deux, A pour la
   foule + B pour deux ou trois figurants nets ?
2. `pair_facing` : figurant non vérifié, ou deuxième pose re-cadrée ?
3. `art-advisor` : une terrasse de bistro parisien ouverte et occupée **de nuit, en
   novembre 1998** — auvent, braseros/chaufferettes, tables rondes, chaises rotin : quelle
   est la vérité de période ? (Question remplaçant celle de la casquette, caduque.)
4. Un crop source plus large de `street-wide.png` est-il acceptable au regard du critère de
   continuité E-6(7) ?
5. **Raccord de visage :** les traits du Commandant (§3) doivent-ils être dérivés des
   `boss/commander_*` shippés — et si oui, `art-advisor` fournit-il la fiche de traits que
   je copierai verbatim dans toutes ses poses ?
6. Le sosie de dos (§2.c-8) : aplat peint dans la plaque, ou découpe dédiée non vérifiée ?
7. ~~Genre de la partenaire~~ — **TRANCHÉ v2.2 : une femme (option A, Bertrand).** Question
   close, variante masculine supprimée du document.
8. **v2.2 — comptage des tables (§2.d) :** si la génération produit plus de 8 tables, on
   retouche (chaises retournées / cadrage / masquage) plutôt que d'accepter des tables
   ambiguës. Le gate confirme-t-il que c'est un critère de refus d'asset et non un détail ?

---

## 7. État pour le gate (Nico)

**PRÊT.** Trois prompts à juger : `plate` (§1), `commandant_couple` (§3, **figé**),
`berline_plate` (§4 — **inchangé, aucune régénération demandée**). Plus deux directives
d'image opposables : la règle des tables (§2.d) et le placement en double file (§4.b).

Ce que le gate doit trancher en priorité, par ordre d'impact :

1. **La lisibilité du visage au zoom maximal** (§3, contrôle n°2) — si elle n'est pas
   atteinte, toute la boucle tombe et c'est un refus d'asset, pas une retouche.
2. **La règle des tables** (§2.d) — elle transforme un choix de composition en contrat de
   gameplay ; je veux qu'elle soit gatée explicitement, pas tolérée.
3. **Route A vs B** pour les figurants humains (§2.b).

Aucune écriture dans `levelArt.json` avant ce PASS. `check-art-prompts.mjs` tournera au
moment de l'écriture post-gate — il n'y a rien à linter tant que le JSON est intact.
