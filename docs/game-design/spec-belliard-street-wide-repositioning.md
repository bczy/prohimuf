# Spec — Rue Belliard décor v3: repositionner fenêtres de pop & barrières

- **Auteur:** Sacha (game-designer / gameplay)
- **Date:** 2026-07-21
- **Statut:** DRAFT — en attente du gate `lead-game-designer` (Karim) avant `senior-architect` + `dev-gameplay`
- **Lane:** mécaniques + tuning + 3C. **Zéro code** — ce spec nomme les valeurs, les devs implémentent.
- **Contexte art:** le backdrop Belliard passe de 4 tuiles tronçon (ADR-0048) à **une seule
  image large peinte** : `public/assets/levels/belliard/street-wide.png`
  (6656×1248, aspect **5,333:1**, N&B façon Tardi, frontal).
- **Remplace, pour Belliard uniquement:** les zones de pop tronçon
  (`windowZones.generated.json` belliard = 4×21) et les 18 props near-foreground
  (`levelArt.json` levels[0].nearForeground). Stalingrad/Vitry **inchangés**.

---

## 0. Système de coordonnées (à lire d'abord)

Tout ce spec est en **coordonnées normalisées 0..1 sur la LARGEUR de l'image** (x, gauche→droite)
et sur la **HAUTEUR du plan façade** (y, haut→bas). C'est volontaire : les x/y normalisés sont
**robustes à la largeur monde exacte** — seule la §3 (difficulté) dépend de `fullW`.

Conversions (façade plane `heightUnits = 12`, cf. `levelArt.json`) :

| Grandeur | Formule | Note |
|---|---|---|
| `worldX` | `(x_norm − 0,5) · fullW` | `fullW` = largeur monde |
| `worldY` | `(0,5 − y_norm) · 12` | haut plan = +6, bas plan = −6 |
| `fullW` (nouvelle) | `12 × 5,333 = 64,0` | contre **87,36** en tronçon (§3) |
| Lane rue / courier | `worldY = −4,8` ⇒ `y_norm 0,90` | `streetY = −facadeH·0,4` |

**Hypothèse d'implémentation (à confirmer par `senior-architect`) :** l'image large est
affichée comme **UNE tuile** à `heightUnits 12`, donc `fullW = 64,0`. Si le layout letterbox
ou scale autrement, **mes x/y normalisés tiennent quand même** (ils sont relatifs à l'image) ;
seuls les chiffres de la §3 supposent `fullW = 64`.

### 0.1 Lecture verticale de la nouvelle image (relevé)

De haut en bas, en `y_norm` :

| Bande | `y_norm` | Contenu |
|---|---|---|
| Ciel | 0,00–0,08 | au-dessus des toits |
| Toiture mansardée + lucarnes + cheminées | 0,10–0,28 | **lucarnes = vraies fenêtres** |
| Corniche | ~0,28 | |
| **R1 — étage noble** (balcon-filant continu, portes-fenêtres) | 0,29–0,40 | vraies fenêtres |
| Bandeau | ~0,40 | |
| **R2 — fenêtres à persiennes** (grandes ouvertures) | 0,42–0,53 | **lecture la plus nette** |
| **R3 — persiennes + garde-corps fonte** | 0,55–0,65 | |
| **R4 — persiennes** | 0,67–0,77 | |
| R5 — dernier étage résidentiel | 0,78–0,87 | |
| Rez — devantures / rideaux de fer / portes / tags | 0,87–1,00 | KOR, MUR, XIX, BOULANGERIE, TABAC |

### 0.2 Zones d'EXCLUSION (aucun pop ennemi, aucun prop haut) — repères de l'image

| Zone | `x_norm` | Raison |
|---|---|---|
| **Le passage / mur-pignon** (coin noir vertical) | **0,372 – 0,408** | vide sombre entre deux immeubles : pas de fenêtre |
| **Pignon aveugle bâtiment étroit droite** (raie d'ombre) | **0,788 – 0,812** | mur-pignon en ombre : pas de fenêtre |
| **Couture tonale / mur mitoyen** central | **0,485 – 0,502** | jointure ambiguë : on saute une colonne |
| Bords pannés/rognés | `< 0,035` et `> 0,965` | sortent du cadre au pan / risque de clip |

Ces quatre zones sont **les repères naturels** demandés (le passage, le pignon) et servent
DOUBLEMENT : elles excluent les pops ET accueillent les props HAUTS (§2.3).

---

## 1. Fenêtres de pop ennemi (flics)

### 1.1 Contrat repris de l'ancien niveau (à préserver)

L'ancien pool tronçon faisait popper les flics depuis **3 rangées** hautes :
`y = 0,2238 / 0,3243 / 0,4379` ⇒ `worldY = +3,31 / +2,11 / +0,75` (84 zones candidates,
7/tuile/rangée). **3 rangées, band de visée haut-milieu de façade** = le feel à conserver
(règle « une variable à la fois » : le décor change, PAS la hauteur de visée).

### 1.2 Décision D1 — 3 rangées de pop, recalées sur les VRAIES fenêtres

Je pose 3 rangées dont le `worldY` reste **à moins de 0,4 unité** de l'ancien band, tout en
tombant sur des ouvertures réelles et lisibles de la nouvelle image :

| Rangée | `y_norm` | `worldY` | Ancien équivalent | Ouvertures |
|---|---|---|---|---|
| **A — lucarnes / mansarde** | **0,24** | +3,12 | 0,2238 (+3,31) | lucarnes du toit |
| **B — étage noble R1** | **0,35** | +1,80 | 0,3243 (+2,11) | portes-fenêtres du balcon-filant |
| **C — persiennes R2** | **0,47** | +0,36 | 0,4379 (+0,75) | grandes fenêtres à persiennes |

Hauteur de visée **préservée** ; les flics poppent sur des fenêtres **peintes et nettes**
(silhouette-first). Écran : le plan (12 de haut) est visible en entier → +3,12 en haut de
cadre, +0,36 au centre : bon étagement vertical de menace, aucune rangée hors-champ.

### 1.3 Décision D2 — Colonnes x par rangée (calées sur les travées)

Cibles de design en `x_norm`. Le générateur / harness (ADR-0028) **snap sur l'ouverture
réelle la plus proche** ; ces valeurs sont la **cible ET le critère d'acceptation**.
Exclusions §0.2 respectées.

**Rangée A — lucarnes (12 colonnes, plus espacées que les travées) :**
```
0,055  0,125  0,195  0,265  0,335 | 0,455 | 0,545  0,620  0,700 | 0,835  0,905  0,950
```

**Rangée B — étage noble R1 (18 colonnes) :**
```
0,045  0,082  0,118  0,152  0,187  0,221  0,257  0,292  0,327 |
0,427  0,458 | 0,516  0,583  0,651  0,719 | 0,836  0,897  0,957
```

**Rangée C — persiennes R2 (22 colonnes, la plus dense) :**
```
0,045  0,082  0,118  0,152  0,187  0,221  0,257  0,292  0,327  0,356 |
0,427  0,481 | 0,516  0,549  0,617  0,651  0,685  0,719  0,746  0,766 |
0,836  0,897  0,928  0,957
```
(les `|` marquent les blocs d'immeubles séparés par une exclusion §0.2)

### 1.4 Densité & rythme

- **Total ≈ 52 zones candidates** (12+18+22) sur `fullW 64` ⇒ **0,81 zone/unité monde**,
  contre 0,97 en tronçon (84/87,36). **Volontairement un peu plus clairsemé** : monde plus
  étroit, on évite l'entassement, et on n'inscrit QUE des fenêtres réellement propres (toutes
  les travées n'ont pas une belle ouverture). Cible acceptable : **48–56 zones**.
- Le pool n'est qu'un **réservoir de positions** ; la cadence de spawn reste pilotée par le
  temps (inchangée). La densité règle seulement l'**étalement spatial** des cibles.
- **Rythme gauche→droite :** bloc dense (Zone I, 10 travées) → passage (respiration, 0 pop) →
  court bloc (0,42–0,48) → couture (respiration) → bloc central dense → pignon (respiration) →
  bloc droit. Les 3 respirations rythment le pan et **empêchent un mur de flics uniforme**.

---

## 2. Barrières / cover de rue (near-foreground)

### 2.1 Ce que « barrières/cover » désigne réellement dans muf (honnêteté cahier des charges)

⚠️ **muf n'a AUCUN système de cover à collision.** Le seul « mobilier/barrière de rue »
existant est la **couche near-foreground parallax (ADR-0047/0049)** : props DÉCORATIFS
(lampadaire, borne, banc, scooter, feu, panneau, fontaine Wallace, horodateur) qui défilent
plus vite que la façade et **ne bloquent ni les balles ni les entités** (AC1 du
`spec-foreground-parallax.md` leur INTERDIT même de chevaucher une fenêtre). Ils sont du
**cadrage visuel**, pas de la couverture jouable.

- **Cahier des charges :** Prohibition (Atari ST) avait des barricades/civils devant lesquels
  se plaçaient des ennemis. muf ne reproduit PAS ce cover interactif — c'est une extension non
  encore décidée. **Ce spec ne l'invente pas.** Si une vraie mécanique de cover à collision
  est voulue, c'est un **nouveau mécanisme** → à remonter à `pm` + `lead-game-designer`, pas à
  trancher ici. Ce §2 repositionne donc les **props décoratifs** sur le nouveau décor.

### 2.2 Décision D3 — 13 props (au lieu de 18), calés sur les repères

Le monde rétrécit à 73 % (§3) ; à densité écran constante, `18 × 0,733 ≈ 13`. Le
`spec-foreground-parallax` §D4 exige « clairsemé » (≈ 1 élément / 0,5 largeur-écran, monde ≈ 3
largeurs-écran ⇒ ~6/rangée). **Je passe de 18 → 13** props, ancrés aux devantures / rideaux /
passage plutôt qu'à un pas mécanique de 0,112.

### 2.3 RÈGLE DE DESIGN CLÉ — le SEUL prop occlusif (le feu) devant un GAP

**Correction gate Karim (C1/C2) — la méca réelle du moteur.** `NearForeground.tsx`
(L127-135) **clampe DUR** tous les props sous la rangée basse de fenêtres (`maxH`), **SAUF le
`trafficLight`** qui, seul, est exempté (ADR-0047, `TRAFFIC_LIGHT_H_FRAC = 0,8`) et peut monter
dans les rangées de fenêtres. Donc les **lampposts NE montent PAS dans les fenêtres** — malgré
leur `heightFrac 0,62` nominal, ils sont rabotés sous la bande comme tous les autres props bas.

⇒ Il n'y a **qu'UN seul repère haut / potentiellement occlusif : le feu tricolore.** Les 2
lampposts sont, mécaniquement, des props **bas** (clampés). Leur placement §2.4 reste bon
(ils soulignent la couture / le pignon **au niveau du trottoir**, comme repères de sol), mais
ils n'ont **aucun** enjeu d'occlusion de fenêtre.

**Le vrai rationale du feu-sur-passage (`x_norm 0,388`) :** comme c'est le seul prop qui
s'élève dans les rangées, on le pose devant le **passage** (zone d'exclusion §0.2, aucune
fenêtre) pour **minimiser l'occlusion balayée de cibles ACTIVES** : au pan, son mât ne barre
jamais une fenêtre de pop. Ce n'est pas « AC1 gratuit pour 3 props » (faux) — c'est
**placer l'unique prop exempté d'AC1 là où son exemption ne coûte aucune cible**.

Hauteurs de référence (`NEAR_KIND_SPECS.heightFrac`, AVANT clamp) : trafficLight **1,44**
(exempté ⇒ effectivement HAUT) ; lamppost 0,62, wallaceFountain 0,32, streetSign 0,40,
parkingMeter 0,24, scooter 0,18, bench 0,17, bollard 0,13 — **tous clampés ⇒ effectivement BAS.**

### 2.4 Table de placement (13 props)

| # | kind | `x_norm` | row | Ancrage / repère | H |
|---|---|---|---|---|---|
| 1 | scooter | 0,075 | far | garé contre le rideau taggé KOR | bas |
| 2 | bench | 0,160 | near | devanture gauche | bas |
| 3 | wallaceFountain | 0,275 | far | angle de trottoir | bas |
| 4 | parkingMeter | 0,340 | near | devant la BOULANGERIE | bas |
| 5 | **bollard** | 0,360 | far | flanc GAUCHE du passage | bas |
| 6 | **trafficLight** | **0,388** | near | **DEVANT le passage** — SEUL prop occlusif (§2.3) | **HAUT (exempté)** |
| 7 | **bollard** | 0,412 | far | flanc DROIT du passage | bas |
| 8 | streetSign | 0,460 | near | post-passage | bas |
| 9 | lamppost | 0,495 | near | souligne la couture mitoyenne (repère de sol) | bas (clampé) |
| 10 | bench | 0,600 | near | devanture centrale | bas |
| 11 | parkingMeter | 0,720 | near | devant le TABAC | bas |
| 12 | lamppost | 0,800 | near | souligne le pignon aveugle droit (repère de sol) | bas (clampé) |
| 13 | bollard | 0,900 | far | bord de trottoir droit | bas |

**Résultat :** le **seul** prop occlusif (feu, 0,388) tombe sur la respiration passage §0.2 →
son mât ne barre jamais une cible active au pan (§2.3). Les 12 autres props sont clampés sous
la bande de fenêtres par le moteur ⇒ **non-occlusion par construction** (aucun enjeu AC1). Le
cluster passage (bornes 0,360/0,412 + feu 0,388) reste un **repère de navigation** fort au
tiers gauche ; les 2 lampposts (0,495/0,800) restent des **repères de sol** devant couture et
pignon (coordonnées inchangées, seul leur rôle mécanique est requalifié).

> Réglage silhouette/clearance exact des props = lane **render (ADR-0047) + `lead-art`** ;
> je specifie le read (« le passage doit se lire comme un point de repère ») et les x, pas le style.

---

## 3. Impact de la nouvelle largeur (5,33:1 vs ~7,28:1 tronçon)

### 3.1 Le fait

`fullW` : **87,36 → 64,0** (73 %, soit **−27 %**). Demi-pan caméra : `43,7 → 32,0`.

### 3.2 Analyse difficulté

- **Cadence de spawn = temporelle**, indépendante de la largeur. `enemiesToWin 10` en
  `timeSeconds 90` est un problème de **taux de kill**, pas de largeur.
- La largeur agit sur l'**acquisition de cible** : rue plus courte ⇒ moins de pan pour couvrir
  toutes les fenêtres ⇒ cibles trouvées plus vite ⇒ **légèrement plus facile** (moins de temps
  mort à panner/chercher).
- Effet inverse possible : cibles plus **serrées à l'écran** ⇒ plus de menaces simultanées par
  écran ⇒ pression ponctuelle **plus forte**. Les deux effets se compensent en partie.

### 3.3 Décision D4 — Tenir les chiffres, surveiller au playtest

**`enemiesToWin: 10` et `timeSeconds: 90` INCHANGÉS** pour l'instant (une variable à la fois :
le décor change ; on ne retouche pas la difficulté à l'aveugle). Le pool recalé (§1) et les
props (§2) sont les seuls changements.

**Leviers nommés, à activer SEULEMENT si le playtest (VERIFY) dévie :**

| Symptôme mesuré au playtest | Levier (dans l'ordre) | Valeur |
|---|---|---|
| Clear trop trivial (< ~60 s, marge large) | 1. `timeSeconds` | **90 → 80** |
| " (encore trop facile) | 2. cadence de spawn | resserrer −10 % |
| Trop punitif / cibles entassées illisibles | 1. densité pool §1 | 52 → ~44 (retirer 4 col. R2) |
| " | 2. `timeSeconds` | 90 → 100 |

Ne PAS toucher `enemySpeedMultiplier` (1.0) : la vitesse ennemie n'est pas en cause ici.

### 3.4 Caméra / 3C

Demi-pan `32` : la rue se traverse en ~27 % de temps en moins → **feel plus serré, positif**
(moins de pan mort). **Vitesse d'edge-scroll / rampe inchangées** — la même rampe couvre juste
une rue plus courte. À confirmer subjectivement au VERIFY ; aucun changement 3C proposé a priori.

---

## 4. Cohérence courier scripté + hostage QTE + delivery + loot (rien ne casse)

Vérifié contre `levels.ts` (belliard) — toutes les entrées sont en **coordonnées MONDE**, donc
sensibles au nouveau `fullW`. Traduction en `x_norm` sur la nouvelle image :

| Élément | Valeur actuelle (monde) | `x_norm` sur 64 | Verdict |
|---|---|---|---|
| **Hostage QTE** `anchor` | `x 9,9 ; y −5` | **0,655** | ✅ tombe sur **façade pleine** (bloc central, zone TABAC/BOULANGERIE), **hors passage** (0,39) et **hors pignon** (0,80). Le ×2,4 zoom lit une façade, pas un vide. **On garde 9,9.** |
| **Delivery** `stopPosition` | `x 0 ; y −4,5` | **0,50** | ✅ camion s'arrête en milieu de rue devant façade ; `y −4,5` = ligne de trottoir (lane courier `−4,8`). `windowSeconds 8` = timer fixe, insensible à la largeur. Approche gauche plus courte (32 vs 43,7) mais **rien ne clippe**. |
| **Courier** (lane) | `worldY −4,8` (`y_norm 0,90`) | traverse | ✅ lane sur le bandeau trottoir/rez (0,87–1,00) de la nouvelle image. Traversée plus courte, aucune rupture. |
| **Loot crates** | window-spawn générique, 15 s | pool §1 | ✅ réutilise le **nouveau pool** de fenêtres (§1). Rien à changer côté loot. |

**Point de vigilance (VERIFY) :** l'ancien commentaire justifiait `anchor.x 9,9` par « centre du
tronçon-b » et par un **trou de ciel à x=0** en mode tronçon. Sur l'image UNIQUE il n'y a plus de
trou à x=0 (norm 0,50 = mur mitoyen continu, pas de ciel). Donc **9,9 reste valable** (façade
derrière), mais le *pourquoi* change → mettre à jour le commentaire de `levels.ts` lors de l'impl.
Si le composite-gate du zoom montrait un backdrop médiocre à 0,655, repli propre : `anchor.x 0`
(norm 0,50, façade aussi) — **une seule variable**, à ne changer que sur preuve.

---

## 5. Critères d'acceptation (VERIFY — stage 5)

1. **AC-POP :** flics poppent UNIQUEMENT sur des fenêtres peintes réelles, sur 3 rangées
   `y_norm ≈ 0,24 / 0,35 / 0,47` ; **aucun** pop dans le passage (0,372–0,408), le pignon
   (0,788–0,812) ou la couture (0,485–0,502). Vérif : harness SCREEN + capture playtest.
2. **AC-DENSITÉ :** 48–56 zones candidates, réparties gauche→droite avec les 3 respirations
   visibles (pas de mur uniforme de flics).
3. **AC-VISÉE :** hauteur de visée subjectivement identique à l'ancien Belliard (band `worldY`
   +0,36 → +3,12) ; aucune rangée hors-champ ni collée au trottoir.
4. **AC-BARRIÈRES :** 13 props. Le **feu** (seul prop exempté du clamp, §2.3) est devant le
   passage `x_norm 0,388` ⇒ son mât ne balaie **aucune fenêtre de pop active** au pan. Les
   **12 props clampés** (dont les 2 lampposts) restent sous la bande de fenêtres — la
   non-occlusion tient par construction du moteur, à **ne pas** re-vérifier prop par prop.
   Cluster passage lisible comme repère de navigation.
5. **AC-DIFFICULTÉ :** clear de 10 flics en 90 s **atteignable et non-trivial** par un joueur
   compétent ; sinon activer les leviers §3.3 (et RE-gater).
6. **AC-COHÉRENCE :** QTE (anchor 0,655) lit une façade au zoom ; delivery s'arrête à 0,50
   sans clip ; courier traverse ; loot poppe depuis le nouveau pool. Aucune régression.
7. **AC-NON-RÉGRESSION :** Stalingrad & Vitry byte-for-byte (leur mode tronçon/single n'est pas
   touché).

## 6. Test cahier des charges

| Élément | Prohibition ST ? | Traitement |
|---|---|---|
| Ennemis qui poppent aux fenêtres | **Oui** | §1 = version fidèle, recalée sur le nouveau décor |
| 3 rangées / band de visée haut-milieu | Oui (feel repris) | conservé |
| Barricades / cover interactif | Oui | **NON reproduit** dans muf (pas de collision) — non traité ici ; extension à décider par pm+lead-GD |
| Mobilier de rue parallax (props) | Non (extension muf) | §2 = extension **assumée**, documentée (ADR-0047/0049), décorative |

## 7. Hand-offs (à logguer dans `docs/handoffs/`)

- → **`lead-game-designer` (Karim)** : gate de ce spec avant tout dev.
- → **`senior-architect` (Winston)** : confirmer `fullW = 64` (mode single-image 1 tuile) ; la
  §3 en dépend. Allouer le no de l'ADR si le changement de mode backdrop en exige un.
- → **`dev-gameplay`** : nouveau pool de fenêtres §1 (données `windowZones` belliard) + maj
  commentaire `anchor.x` dans `levels.ts` §4 ; garder `enemiesToWin/timeSeconds` inchangés.
- → **`dev-r3f-render`** : 13 props §2 (`levels[0].nearForeground.objects`) ; feu unique prop
  occlusif devant le passage (§2.3). **NOTE DEV (gate Karim) :** mettre à jour
  `windowGrid.top`/`band` (aujourd'hui **0,19**) pour que le plafond de clamp `maxH`
  (`NearForeground.tsx`) suive la **nouvelle rangée haute** (Row A `y_norm 0,24`, §1.2) —
  sinon les props clampés flottent sous l'ancienne ligne de fenêtres.
- → **`lead-art`** : read des repères (passage/pignon/couture doivent se lire comme respirations
  et points de navigation) — le style reste sa juridiction.
- → **`game-designer` (moi)** : playtest VERIFY vs §5, report PASS/déviations à Karim avant la
  revue d'intégration architecte.
