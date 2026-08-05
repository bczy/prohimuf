# Spec — Photo QTE "paparazzi" : set-piece de preuve photographique (mécanique + tuning)

**Feature:** the non-lethal QTE family opened by ADR-0077 — Muf photographs a corrupt
authority figure through a telephoto lens instead of shooting him. This spec owns the
**mechanic, the tuning and the 3C**; it is the `game-designer` deliverable of the ADR-0077
design loop.
**Author:** `game-designer` (Sacha) · **Date:** 2026-08-05
**Status:** **Rev. 6.5** — **les passants deviennent des MARCHEURS DE PREMIER PLAN animés**
(décision Bertrand) : nouvelle collection authorée **`walkerTracks`**, nouveau test **T6
« dégagé »** (le masquage compte **au-delà de `OCCLUSION_REJECT_RATIO = 0,25`**, montré **en
direct** via un 5e état de brackets `blocked`, et **il ne casse pas le hold**), nouveaux
planchers **F24** (allée dégagée ≥ 1,2 s sur la couverture ⇒ **F3 reste une garantie**),
**F25** (noyau dessiné == boîte), **F26** (avertissement ≥ 1,00 s au pire focal ⇒
`WALKER_SPEED_MAX = 8,0 su/s`), **F27** (un marcheur ne s'arrête jamais ⇒ F20 ne se rouvre
pas), **F28** (plafond de pression 15 %). Deux nouveaux `rejectReason` : **`obstructed`** et
**`nothing-here`** (qui **resserre** `out-of-frame` et retire à F20 sa porte de derrière).
**`F14` intact — zéro seconde ajoutée.** Dépendance dure : sans l'état `blocked`, **F6 doit
être re-dérivé**. **§A.17.**

**Rev. 6.4 (carried)** — **un signal n'est plus une propriété d'image, c'est une relation
authored** : nouveau **`signalBindings`**, **F22 devient assertable**, **F22b** compte la
distribution 2/2/2, **F23** plancherise le **placement des props** (`4,5 / 6,0 su`) — déplacer
une berline ne peut plus faire s'effondrer F21 en silence. **Instants authorés** : swap
`commandant_table_apres` **52,2 s**, retraits leurres **50,4 / 52,0 s**. **§A.16.**

**Rev. 6.3 (carried)** — **LE DÉPART n'est pas une 4e pose : c'est l'instant LA PLAQUE**, la
translation de `berline_double_file`, **déjà authorée** par le segment K5→K8 de §2.5. **Aucune
donnée nouvelle** (ni keyframe, ni boîte, ni instant, ni `pxPerSu`) et **F21 devient vrai par
identité**. **Escalade n°5 CLOSE** (Bertrand : la berline repart pendant la scène), coût
mécanique nul. **§A.15**, §A.13.2 superseded.

**Rev. 6.2 (carried)** — **le discriminant du signalement n'est plus le visage mais la SCÈNE**
(cast shippé chauve/rasé) : 3 signaux conjonctifs, **F21** ferme le piège du signal tardif qui
arrive après la preuve maîtresse, **F19** 6,0 → 8,0 s et recalée sur `masterOpenAt`, **F22**
distribue les signaux sur exactement 6 leurres, briefing 20,0 → **18,0 s**. **§A.14.**

**Rev. 6.1 (carried)** — **`PHOTO_MAX_ATTEMPTS` devient une donnée authored réglable**
(décision Bertrand : « sois flexible sur le nombre de retry »), **F14 devient une contrainte
paramétrée en `n`** avec la valeur max légale calculée, et **le triptyque est revérifié contre
le pivot de fiction « terrasse »** — deux instants passent sans qu'une valeur bouge, **LA PLAQUE
casse si la berline est immobile** et remonte au gate. **§A.12.** Rev. 6 ci-dessous tient
intégralement pour tout le reste.

**Rev. 6 (carried)** — **PIVOT (Bertrand, 2026-08-05): the scene is DENSE and there are
DECOYS.** The single-subject contract of §2.1 is generalised to a **candidate set** (§A.2),
the shutter becomes designatable and mis-designatable (§A.3), `filmCount` 6 → **8** (§A.5),
four new floors **F16-F19** (§A.8). **Two gate-ratified values are broken by the pivot and I
do not absorb them** — `PHOTO_BRIEFING_MAX_SECONDS` must rise to **20.0 s** and the composed
wall clock **F14 goes over 280 s at two attempts**; the escalation, with all three costed
options, is **§A.9**. **This revision is NOT a drop-in for lane A**: unlike Rev. 5, it moves
the typed contract (`subjectTrack` → `candidateTracks`). Everything below §A is Rev. 5 and
stands except where §A names it.

**Rev. 5 status (carried):** closes the gate's **D-1b** (T-6: F14 bounded authored frozen time and
called it real time) and answers the `sound-designer`'s open question on the **BGM during the
frozen block**. **F14 is rewritten in wall-clock** per **G-4** (§7, §1.3.a-bis):
`PHOTO_BRIEFING_MAX_SECONDS` 25.0 → **15.0 s**, `CONTACT_SHEET_READ_BUDGET` 30.0 → **20.0 s**,
new design budget `CONTACT_SHEET_DECISION_BUDGET = 7.0 s` ⇒ composed worst legal case
**279.1 s = 4.65 min**, **20.9 s** of reserve under 300 s. `PHOTO_MAX_ATTEMPTS` stays **2**.
New **§1.3.b** specifies the BGM duck. **C-9** applied (§1.3 bullet 1, R2-5 Ruling B verbatim).
**Zero structural impact on the lanes now coding**: no phase, no typed field, no window, no
keyframe, no cadence value moves — the three changed values are authored tuning data (§1.3.c).

**Rev. 4 status (carried):** closes the delta gate's blocking condition **D-1** (the frozen time
encased in the Belliard mission is now bounded and costed, §1.3.a), acts rulings **R3-1 / R3-2 /
R3-3 / R3-5 / R3-6**, and closes residues **C-2 / C-5 / C-6 / C-7 / C-8** and note **N-2**.
Rev. 3's relocation and Rev. 2's answers to K-1…K-4 stand; **no window, keyframe, floor value or
tier moved**. The verdict in force is the delta gate's **PASS delta** — this revision is its
closure condition, back to `lead-game-designer` (Karim) for confirmation.

---

## AMENDEMENT Rev.3 — le set-piece est hébergé sur BELLIARD (décision Bertrand, 2026-08-02)

> **Décision de Bertrand, finale : le premier set-piece photo se joue rue Belliard**
> (le niveau 1 shippé), **pas sur un nouveau niveau Stalingrad.** Cette décision **override
> et annule le ruling R-10 du design gate** ("Stalingrad, quai de la Loire, ne pas rouvrir").
> **Aucun niveau n'est à construire.** La fiction est déjà amendée : `spec-photo-qte-fiction.md`
> Rev.3, §2 (réécrite) et §9.0 (hand-off par lane).

**Ce que la relocalisation change de mon côté (mécanique + tuning) :**

| Ce qui change                                                                                                                               | Où                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| La **source de couverture sonore** : passages de métro → **cycle du feu du carrefour** en haut de la rue. Constantes renommées `WAVE_*`.    | §4.1, §4.2, §5.2, §8, §10.4, §10.5 |
| La **période** est **re-dérivée**, pas héritée : cycle de feu **42,0 s à deux phases vertes** ⇒ **une vague toutes les 21,0 s** (§4.1).     | §4.1                               |
| La **mise en scène du plateau** : quai / viaduc / pilier → **bouche du passage, rideaux de fer, feu tricolore**, vue plongeante en lucarne. | §2.5, §0 (implicite), §8           |
| La **berline sort en marche arrière** du passage (elle n'"part" plus sous un viaduc) — **géométrie et vitesses vérifiées, non recalées**.   | §2.5, §4.3                         |
| Le **carry run-scoped** : `Stalingrad → Niveau Final` devient **`Belliard → Niveau Final`**. Le mécanisme est identique.                    | §1.3, §10.6 (e), AC13              |
| **C-2 (résidu du gate round 2)** : la posture est un **fork device** (hold Space desktop / **tap-to-toggle** mobile), pas un bouton tenu.   | §1.2                               |

**Ce qui NE change PAS (et je le vérifie explicitement, pas par confiance) :** les fenêtres de
couverture absolues **[10,17] [31,38] [52,59]** · les tells de vague **8,2 / 29,2 / 50,2 s** ·
les trois instants et leur triptyque (ARRIVÉE dans la couverture / **L'ÉCHANGE à cheval sur
une fin de couverture** / LA PLAQUE dans la couverture) · le floor **F3** (≥ 1,2 s de
chevauchement pour chaque instant : 4,5 / **1,5** / 2,9 s) · les **9 keyframes** de §2.5, y
compris la contrainte **3,103 su/s** de LA PLAQUE et le pan de **9,83 su** de K4→K6 · toute
l'arithmétique K-1/K-2/K-3/K-4 de la Rev. 2 · le levier R1 et ses paliers ×0.90 / ×0.80.

**Deux gains réels, pas cosmétiques** (§4.1 et §2.5 les démontrent) : (1) les trois
chevauchements couverture/instant deviennent **causaux** au lieu d'être tunés — la scène se
règle sur le feu parce que ses acteurs s'y règlent aussi ; (2) la vitesse de LA PLAQUE
(3,103 su/s ≈ **0,40 m/s** sur le plateau) devient **physiquement juste** pour une marche
arrière, là où elle était invraisemblablement lente pour un départ sous viaduc.

**Deux contraintes art NOUVELLES nées de la nouvelle géométrie** (§2.5) : la dérive verticale
et la variation d'échelle apparente de la plaque sur `[53,0 ; 55,9]` doivent rester dans
`SUBJECT_BOX_TOLERANCE`. Elles n'existaient pas dans la version viaduc et elles sont
bloquantes pour F12(1).

---

## AMENDEMENT Rev.6 — LA SCÈNE DENSE ET LES LEURRES (décision Bertrand, 2026-08-05) {#rev6}

> **Critique de Bertrand, mot pour mot :** « là on prend quoi en photo ? Il faut prendre dans
> un décor complexe une partie de la scène où on voit clairement un ou deux antagonistes dans
> une scène compromettante. Là il n'y a qu'un truc à prendre en photo sur toute la scène,
> intérêt ZÉRO. » Et : « chaque scène doit être très détaillée, avec beaucoup de choses où
> zoomer pour justifier la boucle. »
>
> **Nouvelle architecture décidée :** un décor riche et peuplé (niveau de détail Belliard),
> **plusieurs sprites posés dessus, dont un seul compte** — un sprite spécial généré pour la
> scène.

**Je prends la critique comme une critique de MA mécanique, pas de l'art.** Elle est juste, et
elle vise précisément l'endroit où Rev. 1-5 étaient faibles : `subjectTrack(t)` est une boîte
**unique** définie partout, donc la seule question posée au joueur est **QUAND**, jamais **QUI**.
Le zoom n'arbitre alors que du cadrage contre du tremblement — jamais de la lecture. Sur un
plateau à un seul acteur photographiable, viser est une formalité et « chercher » n'existe pas.
Le verbe promis par l'ADR-0077 (`cadrer + zoomer + déclencher`) n'a jamais eu son premier tiers.

### A.1 — Ce qui change, en une table

| Contrat Rev. 5                                                | Contrat **Rev. 6**                                                                  | §       |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| `subjectTrack(t)` — **une** boîte, définie partout            | `candidateTracks` — **N** pistes continues, une `master`, N−1 `decoy`               | A.2     |
| Les brackets lisent « la » boîte                              | Les brackets lisent **le candidat résolu** par le viseur (désignation par centrage) | A.3     |
| T2 = « t est dans une fenêtre »                               | T2 = « t est dans une fenêtre **du candidat résolu**, et ce candidat est `master` » | A.4     |
| `rejectReason ∈ {no-subject, out-of-frame, …}`                | + **`wrong-subject`** — la photo est nette, cadrée, et **ce n'est pas eux**         | A.4     |
| `filmCount = 6`                                               | **8** (plafond F6/UX conservé, grille 2×4, pas de pagination)                       | A.5     |
| Briefing = QUI + OÙ en prose                                  | Briefing = **signalement à 2 critères** (1 statique + 1 comportemental) + zone      | A.6     |
| F12 s'assure d'**une** piste                                  | F12 généralisé à **chaque** piste ; **F16-F19** nouveaux                            | A.8     |
| `PHOTO_BRIEFING_MAX_SECONDS = 15.0`, `PHOTO_MAX_ATTEMPTS = 2` | **cassés par le pivot — escalade, non absorbés**                                    | **A.9** |

**Ce qui NE bouge PAS, et je le vérifie plutôt que je ne l'affirme :** les trois instants et
leur triptyque · les fenêtres de couverture `[10,17] [31,38] [52,59]` · `WAVE_PERIOD = 21.0 s`
· `SCENE_DURATION = 60.0 s` · les 9 keyframes du `master` (§2.5, ils deviennent la piste
`master` sans qu'une valeur bouge) · `FILL_MIN/FILL_MAX/FRAME_MARGIN` · le modèle de sway et
`SWAY_AMP_X = 2.00 su` · `FOCUS_HOLD` · le barème de suspicion et F7 · F1-F5, F8-F13, F15 ·
le duck BGM §1.3.b · le levier de récompense R1.

### A.2 — `candidateTracks` : la généralisation, et pourquoi c'est la même mécanique

**Décision A2.1 — la scène autorise `N` pistes-candidats, chacune exactement de la forme du
`subjectTrack` de §2.1 : une boîte continue, keyframée, interpolée linéairement, totale sur
`[0, sceneDuration]`.** Une et une seule porte `role: "master"` — c'est le sprite spécial de
la décision de Bertrand, et c'est la piste des 9 keyframes de §2.5, **inchangés**. Les autres
portent `role: "decoy"`.

Ce n'est pas un nouveau système : c'est le **même** système instancié N fois. Tout ce que §2.1
démontre (lecture live possible en permanence, secret sémantique préservé, transit uniquement
pendant un tell) reste vrai piste par piste. La règle **piecewise-constant sauf pendant SON
PROPRE télégraphe** s'applique à chaque piste séparément (F12(2) généralisé, §A.8).

**Décision A2.2 — `N = 4` sur Belliard : 1 `master` + 3 `decoy`.** Bornes : `DECOY_COUNT_MIN = 2`,
`DECOY_COUNT_MAX = 4`. Sous 2 leurres, le joueur devine par élimination et l'observation
redevient nulle ; au-delà de 4, la table de keyframes à contrôler en intervalle (§7.2.a) coûte
plus cher en art et en outillage qu'elle ne rend en jeu, et le plateau de `13,0 × 7,3 m` (§2.5)
ne loge plus 5 groupes séparés par F17 sans les empiler.

**Décision A2.3 — un leurre est un GROUPE PLAUSIBLE, pas un figurant décoratif.** Un passant
seul n'est pas un faux positif : personne ne le photographie. Chaque `decoy` est une
composition qui **ressemble à la preuve** — deux silhouettes rapprochées, un geste d'échange,
un véhicule et un homme penché à sa portière. **C'est là que passe la demande de Bertrand :
« beaucoup de choses où zoomer ».** Le décor riche est le contexte ; les 3 leurres sont ce sur
quoi on zoome pour rien.

| Slot   | Rôle     | Zone sur le plateau (su)        | Ce que ça a l'air d'être                                                   |
| ------ | -------- | ------------------------------- | -------------------------------------------------------------------------- |
| **C0** | `master` | bouche du passage, `cx ≈ 54-65` | Le Commandant + le manteau clair — les 9 keyframes de §2.5, **inchangés**  |
| **C1** | `decoy`  | trottoir gauche, `cx ≈ 20-28`   | Deux hommes devant un rideau de fer, l'un tend **quelque chose** à l'autre |
| **C2** | `decoy`  | amorce BOULANGERIE, `cx ≈ 8-14` | Un homme penché à la portière d'une voiture arrêtée, moteur tournant       |
| **C3** | `decoy`  | fond de rue, `cx ≈ 86-94`       | Deux silhouettes sous le feu tricolore, tête contre tête                   |

**Les valeurs de keyframes de C1/C2/C3 ne sont PAS authored ici.** Elles dépendent de la
composition du plateau dense que `lead-art` doit livrer, et les inventer avant le plateau
reproduirait exactement le défaut que le F12(1) existant interdit (une boîte qui ne coïncide
pas avec ce qui est dessiné). **Rev. 6.1 les authore dès que le plateau existe**, sous les
contraintes A.8 qui, elles, sont décidées ici et sont vérifiables sur la livraison.

### A.3 — La désignation : comment le joueur choisit QUI, sans qu'on lui dise QUI

C'est le cœur du pivot et la question 1 de la commande. **Le risque à ne pas rouvrir : F12
ferme une fuite sémantique, et un modèle où les brackets s'accrochent au bon sujet la
rouvrirait en grand** (« les crochets se sont posés ⇒ c'est lui »).

**Décision A3.1 — la résolution se fait par CENTRAGE, jamais par pertinence.** À chaque tick,
le candidat **résolu** `C*(t)` est celui dont le centre de boîte est le plus proche du centre
du viseur, **parmi les candidats intégralement contenus dans `V` avec `FRAME_MARGIN`** (le
test T3, appliqué candidat par candidat). Si aucun ne l'est, `C* = ∅` et les brackets sont
`dashed` — exactement l'état Rev. 5 « composition invalide ».

- La règle ne consulte **jamais** `role`, ni `openAt/closeAt`, ni l'instant courant. Elle est
  purement géométrique. **Elle ne peut donc rien fuiter** : elle répond « tu as proprement
  cadré **quelqu'un** », jamais « tu as cadré **le bon** ».
- Elle est **déterministe** (F11 intact) : distance euclidienne sur des flottants authored,
  départage par index de piste croissant en cas d'égalité exacte.
- Elle donne au verbe `cadrer` son sens : **viser, c'est désigner.** C'est le tiers manquant
  du verbe de l'ADR-0077, et il n'a coûté aucun nouveau binding (§6.3 inchangé).

**Décision A3.2 — la résolution est verrouillée par le hold, pas par une hystérésis ad hoc.**
Un changement de `C*` **remet `FOCUS_HOLD` à zéro**, au même titre qu'une rupture de T3/T4
(§2.3). Aucune nouvelle constante : la règle existante fait déjà le travail, et elle interdit
le cas dégénéré « la photo part sur le voisin au dernier instant ».

**Décision A3.3 — le sway ne peut JAMAIS faire basculer la résolution, et c'est un plancher
(F17), pas un espoir.** Faire passer un leurre devant le master en distance-au-centre demande
un déplacement du viseur de la moitié de la séparation des centres. Avec
`CANDIDATE_CENTRE_SEPARATION_FLOOR = 6.0 su`, il faut **3,0 su** ; le pic de sway est
`SWAY_AMP_X = 2.00 su`. **Marge 1,0 su, soit 50 %.** Un joueur centré sur le master reste
centré sur le master, tremblement compris. C'est la condition pour que le leurre soit une
erreur de **lecture** et jamais une erreur de **tremblement** — la distinction entre un test
d'observation et une taxe.

### A.4 — Le contrat de validation, amendé (§2.2 reste, T2 est réécrit)

Les cinq tests restent conjonctifs et dans le même ordre. **T3, T4, T5 s'évaluent sur `C*(t)`**
(la boîte du candidat résolu) au lieu de `subjectTrack(t)`. Seul **T2** change :

| #      | Test Rev. 6                                                                                                              | Montré live ?             |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| **T2** | `C*` existe **et** `C*.role === "master"` **et** `t ∈ [openAt, closeAt]` d'un instant. Sinon la vignette est `REJECTED`. | **NON — c'est le secret** |

Deux `rejectReason` distincts, et la distinction est de la pédagogie, pas de la décoration :

- **`no-subject`** — le master était cadré, mais hors fenêtre. _« Rien à voir. »_ → le joueur
  a bon sur le QUI, faux sur le QUAND.
- **`wrong-subject`** _(nouveau)_ — la photo est nette et bien cadrée, sur **quelqu'un
  d'autre**. → le joueur a bon sur le QUAND (ou pas), faux sur le QUI.

**Ces deux motifs sont sémantiques, donc révélés à la planche-contact et nulle part ailleurs**
(D8, §2.4 inchangé). Le déclic reste **mécanique** : une photo de leurre parfaitement tenue
produit un **déclic net et un flash discret**, exactement comme une preuve. Le refuser serait
la fuite maximale. La copie des deux tampons est à Yasmine (§A.10).

### A.5 — Les leurres sont-ils photographiables ? OUI, et voici le prix (question 2, tranchée)

**Décision A5.1 — un leurre est intégralement photographiable. T1..T5 s'y appliquent sans
exception, la pellicule est décrémentée, le bruit est produit, la suspicion monte selon le
même barème.** Une pellicule qui refuse de partir sur un figurant est un objectif qui connaît
la réponse : ce serait la plus grosse fuite sémantique possible, plus grosse que tout ce que
F12 ferme. **Non négociable.**

**Décision A5.2 — le prix est UNE POSE, et rien d'autre. Aucune surtaxe.** Pas de suspicion
supplémentaire, pas de pénalité de score, pas de cooldown, pas de « il t'a vu ». La photo d'un
leurre prise **sous couverture** coûte **0 de suspicion**, comme n'importe quelle photo sous
couverture (§5.2). Conséquence directe et voulue : **la course parfaite à zéro suspicion
survit au pivot** — F3 garantit toujours qu'elle existe, même pour un joueur qui se trompe de
sujet, tant qu'il se trompe dans la couverture. C'est l'arbitrage exact demandé : du **poids**
(la pellicule est enfin une ressource qu'on peut gaspiller par erreur de lecture, ce qu'elle
n'était pas) sans **punition** (une erreur de lecture ne fait jamais perdre la scène).

**Décision A5.3 — `filmCount` 6 → 8, et la marge d'erreur est re-dérivée, pas gonflée.**
F6 devient : `filmCount ≥ instantCount + DECOY_ERROR_ALLOWANCE + 2`, avec
`DECOY_ERROR_ALLOWANCE = 2` (le joueur a droit à **deux** faux positifs assumés — un par
apprentissage, un par malchance — sans perdre l'accès au master). ⇒ `3 + 2 + 2 = 7` de
plancher, **8 shippé**, qui reste **au plafond UX de 8** (planche 2×4, pas de pagination,
UX §4.1). À 6, chaque leurre photographié coûtait un tiers de la marge d'erreur existante :
c'est là que la mécanique serait devenue punitive, et c'est la seule raison pour laquelle je
touche à une valeur ratifiée.

### A.6 — Le briefing hybride : le signalement à deux critères (le travail d'observation)

**Le briefing doit dire assez pour que l'échec soit une faute d'attention, pas un tirage — et
pas assez pour que la scène se résolve sans regarder.** Le curseur exact :

**Décision A6.1 — le briefing donne un signalement à EXACTEMENT deux critères, et une zone
large.**

| Critère                                       | Ce que c'est                                                                             | Ce qu'il coûte au joueur        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------- |
| **1 — statique** (silhouette / vêtement)      | lisible dès le pré-roll, à l'œil, sans zoom max                                          | **restreint** : 4 candidats → 2 |
| **2 — comportemental** (ce que le sujet FAIT) | ne se lit qu'**en observant dans la durée**, et seulement au téléobjectif                | **tranche** : 2 candidats → 1   |
| **Zone**                                      | large — un tiers de plateau, pas un point. `x_norm` de la fiction, jamais une coordonnée | **oriente** le premier regard   |

Deux critères et pas un : un seul critère statique se lit d'un coup d'œil et la scène redevient
une formalité ; un seul critère comportemental n'est pas assez amorcé et le joueur balaye au
hasard pendant tout le pré-roll. **Deux critères, dont un qui exige de zoomer et d'attendre,
c'est la définition opérationnelle de « il doit rester du travail d'observation ».**

**Décision A6.2 — le briefing ne pointe JAMAIS. Interdits explicites** (à faire respecter à la
revue de copie, gate F-1) : pas de coordonnée, pas de « à droite du feu », pas de vignette
d'aperçu du plateau avec un cercle, pas de nom de leurre (« ce n'est pas les deux du fond »).
Un briefing qui élimine à la place du joueur détruit la mécanique qu'il est censé amorcer.

> ⚠️ **§A.6 est SUPERSEDED par §A.14 (Rev. 6.2).** Le cast shippé n'offre aucun trait facial
> exploitable : le discriminant devient **la scène** (voiture de service, parapheur, déroulé) et
> les 2 critères deviennent **3 signaux conjonctifs**. **La forme ci-dessous tient** (un
> signalement, les interdits A6.2, un plancher d'amorce) ; seuls le **contenu** de la table,
> la valeur de F19 (6,0 → **8,0 s**) et son **repère** (premier `openAt` → `masterOpenAt`)
> changent. Lire §A.14 comme la version en vigueur.

**Décision A6.3 — `IDENTIFICATION_LEAD_FLOOR = 6.0 s` (F19).** _(valeur superseded : **8,0 s**,
§A14.4)_ Le master doit satisfaire ses
**deux** critères de signalement, visible et inspectable, pendant au moins 6,0 s **avant**
l'ouverture du premier instant. Valeur réelle sur Belliard : le master est en scène dès
`t = 0` et le premier `openAt` est à **11,0 s** ⇒ **11,0 s ✓**, presque le double du plancher.
6,0 s est dérivé, pas rond : balayage du plateau au grand-angle ≈ 2,0 s + une traverse de zoom
`ZOOM_TRAVERSE_SECONDS = 2,2 s` + une lecture de comportement ≈ 1,8 s (la durée d'un tell,
c'est-à-dire le temps qu'un geste met à se lire dans ce jeu). **Sans ce plancher, la scène
dense devient un test de réflexe déguisé en test d'observation.**

### A.7 — Le cadrage et le double arbitrage de zoom tiennent-ils ? (question 3)

**Réponse : ils tiennent, ils ne sont pas retouchés, et le pivot les RENFORCE. Vérifié, pas
supposé.**

1. **`FILL_MIN = 0.45` gagne un second métier et n'a pas besoin de monter.** Rev. 5 :
   « on ne résout pas le set-piece en restant large ». Rev. 6 ajoute : **rester large, c'est
   embarquer les voisins dans le cadre**. Le remplissage était une règle de lisibilité ; il
   devient aussi une règle d'**exclusion**. Contrôle chiffré, au sweet spot de chaque instant :

   | Instant   | Sweet spot | `fovW = 3500/f` | Boîte master | Largeur restante hors sujet | Un leurre à ≥ 8 su du centre master peut-il être **entièrement** dans `V` ? |
   | --------- | ---------- | --------------- | ------------ | --------------------------- | --------------------------------------------------------------------------- |
   | ARRIVÉE   | 94 mm      | 37,2 su         | 24,0 su      | 13,2 su (6,6 par bord)      | **Non** — il en dépasse toujours un morceau                                 |
   | L'ÉCHANGE | 132 mm     | 26,5 su         | 17,0 su      | 9,5 su (4,75 par bord)      | **Non**                                                                     |
   | LA PLAQUE | 251 mm     | 13,9 su         | 7,5 su       | 6,4 su (3,2 par bord)       | **Non**                                                                     |

   Autrement dit : **au remplissage légal, un leurre ne peut jamais entrer entier dans le
   cadre en même temps que le master.** Un bout de leurre peut y être — et c'est voulu, c'est
   ce qui fait une scène habitée — mais T3 étant un test de **contenance intégrale**, un
   fragment de leurre ne devient jamais un candidat résolu. Le risque « la photo part sur le
   voisin » est **structurellement fermé par des valeurs déjà ratifiées**. Je n'y touche pas.

2. **Le double arbitrage de zoom devient enfin bilatéral.** Rev. 5 : trop large ⇒ invalide,
   trop long ⇒ le tremblement mange la marge. Rev. 6 ajoute une troisième pression, et c'est
   la demande de Bertrand : **on doit zoomer pour lire le critère comportemental**, sur des
   candidats dont on ne sait pas encore lequel compte — donc le zoom coûte du **temps
   d'observation**, pas seulement de la stabilité. C'est le premier moment du set-piece où
   `zoomer` sert à **savoir** et pas seulement à **valider**. Aucune constante ne bouge :
   c'est du contenu (les leurres) qui fait travailler un axe existant.

3. **La contrainte de remplissage n'a pas besoin d'une dérogation « scène dense ».** Je l'ai
   cherchée et je ne la trouve pas : le seul cas qui l'aurait exigée est « deux candidats
   légitimement dans le même cadre », et F17 (séparation ≥ 6,0 su, authored ≥ 8,0) plus le
   tableau ci-dessus le rendent impossible au remplissage légal.

### A.8 — Les instants survivent (question 4), et les quatre nouveaux planchers

**Décision A8.1 — le triptyque ARRIVÉE / L'ÉCHANGE / LA PLAQUE est CONSERVÉ tel quel, et je
refuse d'en ajouter un quatrième. La raison est arithmétique, pas conservatrice.** Un
quatrième instant demande ≈ +10 s de `ACTIVE` (tell 1,8 + fenêtre ≈ 3 + un temps mort lisible),
soit **+20 s de temps mur sur le chemin à deux tentatives**, contre **20,9 s de réserve**
(F14, §1.3.a-bis). Un quatrième instant mange la totalité de la réserve du gate à lui seul.

**La densité voulue par Bertrand se paye en ESPACE, pas en TEMPS.** Même durée, mêmes trois
fenêtres, mais 4 candidats au lieu d'1 : le nombre de choses à examiner passe de 1 à 4, la
durée de la scène ne bouge pas d'une seconde. **C'est la seule forme du pivot qui ne casse pas
F14 davantage** — et c'est aussi la meilleure conception : trois instants sur quatre candidats
est un problème plus riche que six instants sur un seul.

**Décision A8.2 — les quatre nouveaux planchers.**

| #       | Plancher                                                                                                                                                                                                                               | Valeur                                             | Belliard                                                       | Pourquoi                                                                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F16** | Nombre de leurres **actifs et intégralement définis** sur tout `[0, sceneDuration]`                                                                                                                                                    | `∈ [DECOY_COUNT_MIN 2, DECOY_COUNT_MAX 4]`         | **3** ✓                                                        | Sous 2, l'élimination remplace l'observation ; au-dessus de 4, le plateau ne loge plus F17 et le contrôle en intervalle (§7.2.a) explose côté art et outillage.                                 |
| **F17** | Séparation des centres : `∀ t, ∀ (i≠j), ‖centre_i(t) − centre_j(t)‖ ≥ CANDIDATE_CENTRE_SEPARATION_FLOOR`                                                                                                                               | **6,0 su** (`= 3 × SWAY_AMP_X`)                    | authored **≥ 8,0 su** ✓ (marge 33 % sur le plancher)           | Le sway ne doit **jamais** pouvoir faire basculer la résolution (§A3.3) : il faudrait 3,0 su de dérive, le pic est de 2,00 su. Un leurre gagné par tremblement est une taxe, pas un test.       |
| **F18** | **Non-discriminabilité des télégraphes.** Pour chaque tell de la piste `master` à `t_m`, au moins un leurre télégraphie dans `[t_m − 1,0 s ; t_m + 1,0 s]`, et aucun canal de rendu (taille, vitesse, contraste) ne trie master/leurre | ≥ **1** leurre concurrent par tell, sur les **3**  | 3/3 ✓ (à authorer en Rev. 6.1, contrainte livrée à `lead-art`) | Sans ce plancher, « quelque chose vient de bouger » redevient la réponse gratuite et les leurres ne sont plus qu'un décor mobile. C'est **le** plancher qui empêche le pivot d'être cosmétique. |
| **F19** | **Amorce d'identification** : le master satisfait ses deux critères de signalement, visible, pendant ≥ `IDENTIFICATION_LEAD_FLOOR` avant le premier `openAt`                                                                           | **6,0 s** (dérivé : 2,0 balayage + 2,2 zoom + 1,8) | **11,0 s** ✓                                                   | Une scène dense sans amorce d'identification est un test de réflexe déguisé. C'est le pendant exact de F2 (aucun instant sans tell) appliqué au QUI au lieu du QUAND.                           |

**Décision A8.3 — F12 est généralisé piste par piste, et je nomme le coût plutôt que de le
cacher.** F12(1) (drawn == box, `SUBJECT_BOX_TOLERANCE`), F12(2) (pas de transit avant le tell)
et F12(3) (totale et finie) s'appliquent **à chacune des 4 pistes**, et le contrôle en
intervalle de §7.2.a aussi. **Le coût de vérification est multiplié par 4** — c'est réel, c'est
à `qa-lead` + `dev-tooling-assets`, et c'est le prix de la densité. Je ne demande aucune
tolérance élargie en compensation : une boîte de leurre qui ment coûte au joueur exactement ce
qu'une boîte de master qui ment lui coûte, puisque la résolution est purement géométrique.

**Décision A8.4 — F6 est re-dérivé** (§A5.3) : `filmCount ≥ instantCount + DECOY_ERROR_ALLOWANCE + 2`
et `≤ 8`. Belliard : plancher 7, shippé **8**, plafond 8 ✓ (au plafond, assumé : c'est la
grille sans pagination et il n'y a pas d'air au-dessus).

**F7 revérifié sous le pivot :** `SUSPICION_MAX / SUSPICION_SHUTTER_EXPOSED = 100/34 = 2,94`
⇒ 2 photos hors couverture survivables, inchangé. Le pivot **n'augmente pas** le nombre de
photos qu'un joueur prendra hors couverture (les leurres sont photographiables dans la
couverture comme le reste) : F7 n'a pas besoin d'être retuné, et je l'ai vérifié plutôt que
supposé.

### A.9 — ⚠️ CE QUE LE PIVOT CASSE — escalade au gate, non absorbée

**Deux valeurs ratifiées ne survivent pas au pivot. Je les remonte au lieu de raboter.**

**Casse 1 — `PHOTO_BRIEFING_MAX_SECONDS = 15.0 s` est trop court pour un signalement.** La
valeur a été dérivée en Rev. 5 pour « ~50 mots ≈ 3 lignes courtes » (l'ellipse). Le briefing
Rev. 6 doit porter **deux critères + une zone** sans jamais pointer : ≈ **75 mots**, soit
~5 lignes, soit **22,5 s** à 200 mots/min. **Je propose 20,0 s** (le briefing est _skippable_
et payé **une seule fois par entrée**, jamais sur la reprise — §1.1 — donc c'est un plafond de
lecteur lent, pas une cadence). En dessous de ~18 s, le second critère cesse d'atterrir, et
un signalement à un critère et demi, c'est le tirage au sort que F19 est censé interdire.

**Casse 2 — `filmCount = 8` allonge la planche-contact terminale, et F14 passe au-dessus de
280 s.** `CONTACT_SHEET_READ_BUDGET` est une **dérivation**, pas un choix (§1.3.a-bis,
décision 3) : `8 × (0,3 + 0,4 + 2,2) + 2,5 = **25,7 s**` (contre 20,0 s à 6 vignettes).
`CONTACT_SHEET_DECISION_BUDGET` ne bouge pas (7,0 s : le balayage de la rangée de tampons est
en `n × 0,6` ⇒ 8 × 0,6 + décision ≈ 7,0 s, inchangé au dixième).

> **F14b sous Rev. 6, à `PHOTO_MAX_ATTEMPTS = 2` :**
> `90 + 20,0 + 62,8 + 7,0 + 62,8 + 25,7 + 21,5 = **289,8 s = 4,83 min**`
> ⇒ **au-dessus des 280 s**, réserve **10,2 s** au lieu des **≥ 20 s** exigées par le gate. ✗

**Je ne rabote pas, et je ne redéfinis pas la contrainte.** Les leviers de mon ressort sont
épuisés : `ACTIVE = 60,0 s` est la cadence (F1-F5, F12, les 9 keyframes, les 3 fenêtres en
dépendent), les deux budgets de lecture sont des dérivations au plancher de lisibilité
(§1.3.a-bis décision 6 l'a pré-déclaré), et `filmCount` en dessous de 8 rend les leurres
punitifs (§A5.3). **Trois options, chiffrées, au gate :**

| Opt.                        | Ce qu'on change                                          | F14b wall clock                                             | Réserve      | Ce que ça coûte                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** _(ma recommandation)_ | `PHOTO_MAX_ATTEMPTS` **2 → 1**                           | `90 + 20,0 + 62,8 + 25,7 + 21,5 = **220,0 s = 3,67 min**`   | **80,0 s** ✓ | La reprise disparaît ⇒ **la forme à deux CTA appairés (A-1 / R2-5) ne s'affiche plus jamais** et E4/H4 perdent leur pas d'apprentissage. **C'est un item de gate, pas une décision mienne.** |
| **B**                       | `filmCount` **8 → 6** (on garde 2 tentatives)            | `90 + 20,0 + 62,8 + 7,0 + 62,8 + 20,0 + 21,5 = **284,1 s**` | 15,9 s ✗     | Toujours au-dessus, **et** les leurres redeviennent punitifs (3 poses de marge pour 3 instants + 3 leurres). Je la liste pour qu'on voie qu'elle ne sauve rien.                              |
| **C**                       | Assouplir la réserve du gate de 20 s à 10 s, tout garder | 289,8 s                                                     | 10,2 s       | Redéfinit la promesse au lieu de la tenir — exactement ce que **G-4** interdit. Je la liste pour la refuser explicitement, pas pour la proposer.                                             |

**Pourquoi A et pas B :** avec 8 poses dont 2 de marge d'erreur assumée et une planche-contact
qui nomme désormais **pourquoi** (`wrong-subject` vs `no-subject`), **le pas d'apprentissage
est passé de la reprise vers l'intérieur de la tentative**. La reprise existait parce que la
scène n'apprenait rien pendant qu'on la jouait ; le pivot lui donne 8 essais informés. Perdre
la reprise coûte donc beaucoup moins cher en Rev. 6 qu'en Rev. 5 — et §1.3.a-bis décision 6
avait **pré-déclaré `PHOTO_MAX_ATTEMPTS = 1` comme le levier réservé** exactement à ce genre de
mesure. C'est ce levier qui se déclenche, à l'heure, sur le motif prévu.

**Ce que je NE décide pas seul :** `PHOTO_MAX_ATTEMPTS = 1` retire une forme d'écran que le
gate a ratifiée (A-1, deux CTA appairés). **Karim + Bertrand tranchent.** Si l'option A est
refusée, la conséquence honnête est que le pivot de densité et la reprise ne tiennent pas
ensemble dans 5 minutes, et c'est la **portée du set-piece** qui doit rouvrir (`pm`), pas
mes planchers.

### A.10 — Ce que le pivot fait remonter aux autres lanes

| Lane                           | Ce qui est dû                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lead-art` / `concept-artist`  | **(1)** un plateau dense au niveau de détail Belliard ; **(2)** 4 groupes-candidats aux zones du tableau §A.2, séparés de **≥ 8,0 su** de centre à centre à tout instant (F17) ; **(3)** chaque candidat = un **ensemble énuméré** d'éléments dessinés dont l'AABB est la boîte (F12(1), §2.5 contrainte 1, × 4) ; **(4)** les 3 leurres doivent **ressembler à une preuve** (§A2.3), pas décorer ; **(5)** F18 : aucun canal de rendu ne doit trier master/leurre. Le master est le **sprite spécial** de la décision de Bertrand. |
| `narrative-designer` (Yasmine) | **(1)** le signalement à 2 critères (1 statique + 1 comportemental) dans le briefing, sous les interdits A6.2 ; **(2)** la copie du tampon **`wrong-subject`** — un constat, jamais un reproche ; **(3)** 3 leurres qui existent diégétiquement (des gens de la rue Belliard, pas des mannequins).                                                                                                                                                                                                                                  |
| `ux-designer` (Tony)           | **(1)** les brackets se posent désormais sur **un candidat parmi N** — le contrat « composition seulement, jamais le verdict » est **inchangé** mais doit être re-validé sur la scène dense ; **(2)** planche-contact à **8** vignettes (2×4, toujours sans pagination) ; **(3)** deux motifs de rejet distincts.                                                                                                                                                                                                                   |
| `qa-lead` (Inès)               | Le contrôle en intervalle §7.2.a est **× 4** ; F16/F17/F18/F19 sont assertables sur les données authored ; F17 est le plus important (un échec = un leurre gagnable au tremblement).                                                                                                                                                                                                                                                                                                                                                |
| `senior-architect` (Winston)   | ⚠️ **Contrat typé modifié** : `subjectTrack: Keyframe[]` → `candidateTracks: { id, role, keyframes }[]`. La résolution `C*(t)` est une fonction pure de plus dans `src/game`. **Rev. 6 n'est pas une substitution de constantes comme Rev. 5** — la lane A doit le savoir avant d'écrire la donnée.                                                                                                                                                                                                                                 |
| `pm` (John)                    | Si l'option A de §A.9 est refusée, la portée du set-piece rouvre (voir §A.9).                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### A.11 — Critères d'acceptation ajoutés (stage 5)

- **AC17 — La désignation est géométrique et ne fuite rien.** En `ACTIVE`, cadrer proprement un
  **leurre** produit des brackets `solid` puis `locked` et un **déclic net + flash** identiques
  à ceux du master ; rien à l'écran, dans le texte ni dans le son ne distingue les deux avant
  la planche-contact. Assertion : le hash d'état comparé par AC10 est **identique** entre une
  prise master valide et une prise leurre valide, à `role` près.
- **AC18 — Le sway ne bascule jamais la résolution (F17).** Test unitaire balayant le sway sur
  une période complète, viseur centré sur le master à ± 1,0 su : `C*` reste le master sur
  **100 %** des ticks, sur les trois instants.
- **AC19 — Le pivot est joué, pas raisonné.** Au `verify` : sur une première partie, un joueur
  qui n'a lu que le briefing identifie le master **avant** `openAt` #1 (F19) ; et sur 3 sessions,
  **au moins une** photo de leurre est prise (si zéro, les leurres sont trop évidents ⇒ F18 est
  violé en pratique, et le levier est le contraste comportemental des leurres, jamais un
  affaiblissement du signalement).
- **AC20 — Le budget mur re-mesuré sous Rev. 6.** AC15 est rejoué avec `filmCount = 8`, le
  briefing à 20,0 s et l'option retenue en §A.9. **Un dépassement de 280 s revient au gate**, il
  ne se rattrape pas en raccourcissant un budget de lecture.

### A.12 — Rev. 6.1 : la reprise devient réglable, F14 devient paramétrée (décision Bertrand, 2026-08-05)

> **Décision de Bertrand sur mon escalade n°3 : « sois flexible sur le nombre de retry ».**
> Lecture que j'en fais et que j'inscris : **le chiffre ne se grave pas maintenant**, il se
> règle au playtest. Ma recommandation de 1 (§A.9) reste, mais comme **point de départ
> authored**, plus comme verdict.

**Décision A12.1 — `maxAttempts` sort des constantes de module et devient une donnée authored
du set-piece.** L'architecte l'avait mis en constante sur l'argument « une seule valeur gatée,
un seul set-piece » ; cet argument tombe le jour où Bertrand veut la régler. Elle rejoint donc
`sceneDuration`, `filmCount` et `triggerAtElapsedSeconds` dans `photoQteSpec` (§8, table
« Authored per set-piece »). `PHOTO_MAX_ATTEMPTS` **disparaît** de la table des constantes.

**Rien à recoder côté rendu, et je le dis parce que c'est le point qui rend la décision peu
chère.** La lane A a déjà `retryOffered = attemptIndex + 1 < maxAttempts`, et la lane B a déjà
**les deux formes d'écran** (un CTA seul / deux CTA appairés, A-1). La forme suit donc la
valeur automatiquement : authorer 1 donne `[ LAISSER TOMBER ]` seul, authorer 2 donne la paire
ratifiée. **La forme A-1 n'est pas supprimée, elle est conditionnée** — ce qui est très
supérieur à ce que proposait §A.9 option A, où elle disparaissait du jeu.

**Décision A12.2 — valeur de départ authored : `maxAttempts = 1`.** Point de départ, pas
verdict. Le motif est celui de §A.9 (le pas d'apprentissage est passé dans la tentative :
8 poses, 2 erreurs de lecture assumées, une planche qui nomme désormais `wrong-subject` vs
`no-subject`) **et** c'est la seule valeur qui passe F14 aujourd'hui sans rien devoir à
personne. **Le playtest (AC20/AC21) a autorité pour la monter à 2 si — et seulement si — les
~10 s manquantes ont été trouvées** (§A12.4).

**Décision A12.3 — F14 est réécrite comme une CONTRAINTE PARAMÉTRÉE, pas comme un chiffre.**
C'est la forme correcte pour une valeur réglable : la borne ne vieillit pas quand la donnée
bouge, et une donnée illégale devient rouge en CI au lieu de passer en silence.

> **F14b(n)** = `90 (mission jouée) + briefingMax + n × 62,8 + (n − 1) × decisionBudget
>
> - readBudget + 21,5 (otage, pire cas)`≤ **280 s**
avec, sous Rev. 6 :`briefingMax = 20,0`(§A.9 casse 1),`decisionBudget = 7,0`,
`readBudget = 25,7` (8 vignettes, dérivé §A.9 casse 2).

| `n` (`maxAttempts` authored) | F14b(n)                | Réserve sous 300 s | Verdict                                         |
| ---------------------------- | ---------------------- | ------------------ | ----------------------------------------------- |
| **1**                        | **220,0 s = 3,67 min** | **80,0 s**         | ✓ — **valeur MAXIMALE légale aujourd'hui**      |
| 2                            | **289,8 s = 4,83 min** | 10,2 s             | ✗ — dépasse 280 s, réserve < 20 s (**−9,8 s**)  |
| 3                            | **359,6 s = 5,99 min** | −59,6 s            | ✗✗ — au-dessus du plafond dur de 300 s lui-même |

**Donc : la valeur maximale qui respecte 300 s avec réserve ≥ 20 s, à 8 poses et planche à
8 vignettes, est `n = 1`.** `n = 2` demande de **récupérer ~9,8 s ailleurs**.

**Décision A12.4 — où sont ces 9,8 s, et pourquoi aucun de mes leviers ne les fournit.** Je
l'avais dit en §A.9 ; je le redis chiffré, parce que c'est l'information utile au playtest :

| Levier                          | Gain      | Propriétaire | Verdict                                                                                                                           |
| ------------------------------- | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `briefingMax` 20,0 → 15,0       | −5,0 s    | **moi**      | ✗ Casse le signalement à 2 critères ⇒ casse **F19**. Refusé.                                                                      |
| `filmCount` 8 → 7               | −2,9 s    | **moi**      | ✗ Ronge `DECOY_ERROR_ALLOWANCE` ⇒ les leurres redeviennent punitifs (§A5.3). Refusé.                                              |
| **Les deux ensemble**           | −7,9 s    | **moi**      | ✗ **281,9 s — toujours au-dessus**, en ayant cassé deux planchers. **C'est la preuve que mes leviers sont épuisés**, pas un avis. |
| `ACTIVE` 60,0 s                 | jusqu'à ∞ | moi          | ✗ Intouchable : F1-F5, F12, les 9 keyframes et les 3 fenêtres en dépendent.                                                       |
| Bloc otage, pire cas **21,5 s** | ≤ 21,5 s  | `techplan`   | ⚠️ **Hors de ma lane.** −10 s ici suffiraient à eux seuls.                                                                        |
| Mission jouée **90 s**          | ?         | `pm`         | ⚠️ **Hors de ma lane.**                                                                                                           |

**Conclusion à porter au playtest telle quelle : `maxAttempts = 2` n'est atteignable par aucun
levier de game design. Il exige du temps rendu par le plan otage ou par la durée de mission —
c'est une négociation `pm` / `senior-architect`, pas un réglage de tuning.** Régler la valeur
est libre ; la régler **au-dessus de la borne** ne l'est pas.

**Décision A12.5 — F14 est assertée sur la donnée authored, pas sur une constante.** Le contrôle
en CI évalue `F14b(spec.maxAttempts) ≤ 280`. Autoriser 2 sans avoir bougé un autre terme rend
la suite **rouge**, avec le nom du terme fautif. C'est exactement la flexibilité demandée :
**réglable, jamais silencieux.**

- **AC21 (nouveau)** — au `verify`, la valeur authored de `maxAttempts` est mesurée au
  chronomètre sur le chemin le plus long réellement jouable, et le résultat est comparé à
  `F14b(n)`. Un écart > 5 % entre la formule et le chronomètre est un défaut de la **formule**
  (elle a oublié un temps mur), pas du joueur — et il revient au gate, comme T-6 en Rev. 5.

### A.13 — Rev. 6.1 : le triptyque et les leurres revérifiés contre le pivot de fiction « TERRASSE »

**Le pivot de fiction :** la scène compromettante n'est plus une remise d'enveloppe mais **le
Commandant attablé en terrasse avec quelqu'un** (une liaison, pas une corruption) ; **la berline
garée** prouve qu'il est venu en fonction ; l'art propose **sept tables voisines au même geste**
comme leurres naturels.

**Ma mécanique candidats/leurres ne bouge pas d'une ligne** — §A.2 à §A.8 sont indifférents à ce
que les gens font, ils ne parlent que de boîtes, de séparation et de télégraphes. **Mais trois
choses doivent être vérifiées instant par instant plutôt que supposées**, et l'une des trois
casse.

#### A13.1 — Les trois instants, relus sur la terrasse

| #   | Instant Rev. 6                                             | Devient, en terrasse                                                                                                              | Valeurs authored | Verdict                      |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------- |
| 1   | **ARRIVÉE** — les deux hommes se font face (24×13,5)       | **ILS S'ASSOIENT** : les deux silhouettes entières se rejoignent à la table                                                       | **inchangées**   | ✓ passe                      |
| 2   | **L'ÉCHANGE** — 2 visages + 2 mains + enveloppe (17×9,56)  | **LE GESTE** : 2 visages rapprochés + 2 mains qui se touchent. L'enveloppe sort de l'ensemble énuméré, la main de l'autre y entre | **inchangées**   | ✓ passe — **même géométrie** |
| 3   | **LA PLAQUE** — la berline recule, boîte MOBILE 3,103 su/s | La berline est **garée**, donc **immobile**                                                                                       | **CASSENT**      | ✗ **voir A13.2**             |

Les deux premiers passent parce que la boîte est l'AABB d'un **ensemble énuméré** (§2.5,
contrainte 1) : changer les éléments énumérés sans changer leur encombrement ne touche aucun
nombre. `24,0 × 13,5` su, c'est deux hommes debout ou deux hommes qui s'attablent ; `17,0 × 9,56`
su, c'est deux visages et deux mains, que la main tienne une enveloppe ou l'autre main. **Le
renommage `L'ÉCHANGE` → `LE GESTE` est de la fiction ; la géométrie est identique et je n'y
touche pas.** La preuve maîtresse reste « deux visages ET deux mains dans le cadre » — la
formulation gatée survit mot pour mot au changement de sujet.

#### A13.2 — ~~⚠️ LA PLAQUE casse si la berline est immobile : escalade n°5~~ **CLOSE (Rev. 6.3)**

> ✅ **ESCALADE N°5 CLOSE — décision Bertrand : la berline REPART pendant la scène.** C'est
> l'option **(i)**, celle que je recommandais : **coût mécanique nul**, les 9 keyframes,
> `3,103 su/s`, F5b, F5c, §3.3.b, §4.3 et AC6c tiennent sans qu'une valeur bouge. Les options
> (ii) et (iii) ci-dessous ne sont **pas** à instruire — elles restent lisibles pour mémoire du
> raisonnement. **Le sujet mobile du set-piece est confirmé, et avec lui le seul test de
> poursuite du jeu.** Suite en **§A.15** : ce départ est aussi le **signal n°3**.

K6→K7→K8 authorent une boîte **mobile** à **3,103 su/s**. Une berline garée a une vitesse de
zéro. Ce n'est pas un détail de mise en scène : c'est le **sujet mobile** du set-piece, et il
porte à lui seul **F5b** (grâce non-trackée), **F5c** (`PAN_RATE_MAX ≥ v_max + v_sway_peak`,
d'où vient la valeur 12,0 su/s), **§3.3.b**, **§4.3** en entier et **AC6c**. Le figer, c'est
supprimer le test de tracking, la justification de `PAN_RATE_MAX` et « la frame la plus dure du
set-piece » d'un seul geste. §2.5 le disait déjà : _« si l'art a besoin que la voiture bouge
autrement, ce n'est pas une note d'art — c'est un ré-authoring de K6/K7. Revenez me voir, ne
l'absorbez pas en silence. »_ Je m'applique ma propre règle.

| Option                                                                                                                                                                                                                              | Ce que ça coûte                                                                                                                                                                                                                                                                              | Verdict                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **(i)** La berline **repart** en fin de scène — elle est garée et visible tout du long (la preuve « venu en fonction » est faite par sa **présence**), et elle s'en va sur `[53,0 ; 55,9]`, ce qui **est déjà** la fenêtre authored | **Zéro.** Les 9 keyframes, `3,103 su/s`, F5b, F5c, §3.3.b, §4.3 et AC6c tiennent tous. La fiction y gagne même une clôture de scène naturelle : le sujet s'en va, la scène finit.                                                                                                            | **Ma recommandation**        |
| **(ii)** Plaque **statique**, ré-authoring de K6/K7/K8                                                                                                                                                                              | Supprime le test de tracking ; **F5b et F5c perdent leur objet** et `PAN_RATE_MAX = 12,0` devient une valeur sans dérivation ; §4.3 et AC6c à réécrire. L'instant reste dur (7,5×4,22 su à 251 mm, sway en haut de plage) mais devient un test de **stabilité** seul, plus de **poursuite**. | Faisable, **coûteux, à moi** |
| **(iii)** Un autre mobile porte l'instant 3 (le serveur, un passant qui démasque la table)                                                                                                                                          | Change le **sujet** de l'instant 3 et donc son ensemble énuméré, sa boîte et sa bande focale ⇒ ré-authoring complet de l'instant + F4 à revérifier.                                                                                                                                          | Non recommandé               |

**Je ne tranche pas seul : c'est de la fiction autant que de la mécanique.** Option (i) est
gratuite mécaniquement et coûte une phrase à Yasmine (« la berline repart »). Si la fiction
exige que la berline reste garée jusqu'au bout, c'est **(ii)** et je porte le ré-authoring —
mais je veux que le gate sache qu'il achète la suppression du seul test de poursuite du jeu.

#### A13.3 — Les sept tables : l'art a raison, et ça fait monter un plancher

Sept tables au même geste, c'est **exactement** le décor que §A2.3 demandait (« un leurre est un
groupe plausible, pas un figurant décoratif ») — et c'est mieux que mes trois slots inventés en
§A.2, parce que ça naît du lieu au lieu d'être posé dessus. **J'adopte la proposition de l'art
et je paie ce qu'elle coûte.**

**Décision A13.3.a — `DECOY_COUNT_MAX` 4 → 6 (F16 amendé).** 1 table `master` + **6** tables
`decoy` = les sept tables de l'art. `DECOY_COUNT_MIN` reste **2**.

**Décision A13.3.b — nouveau plancher F20, « pas de cible orpheline », et c'est un trou que la
terrasse ouvre vraiment.** Avec sept tables identiques, une table qui **ressemble à une cible**
sans être un candidat authored produirait, si le joueur la photographie parfaitement, `C* = ∅`
⇒ échec de T3 ⇒ `rejectReason = out-of-frame`. Or le joueur a cadré impeccablement : la planche
lui dirait **« hors cadre »** sur une photo parfaitement cadrée. **C'est un mensonge de
tampon**, la même faute que F12 ferme du côté des brackets.

> **F20 — Aucun groupe dessiné ne peut se lire comme un sujet photographiable sans être une
> piste authored.** Toute table occupée par ≥ 2 personnes en interaction est **soit** un
> candidat (`master` ou `decoy`, avec sa piste, ses keyframes et son contrôle en intervalle),
> **soit** mise en scène comme non-photographiable (table seule, dos tourné, table vide).
> Vérifié à la livraison du plateau, par énumération, comme F12(1).

**Décision A13.3.c — F17 est revérifiée sur un pas de terrasse, pas supposée.** Un pas de tables
parisien ≈ 1,5 m ; à `1 su ≈ 0,13 m` (§2.5), cela fait **≈ 11,5 su de centre à centre entre
tables voisines** — contre un plancher F17 de **6,0 su** et un authored visé de 8,0. ✓ **avec
44 % de marge sur l'authored**, et la géométrie du lieu la produit gratuitement. Sept tables à
11,5 su occupent ≈ 80 su sur un plateau de 100 : ça tient, sans empiler.

**Décision A13.3.d — §A.7 revérifiée, et elle se renforce.** Le tableau de §A.7 montrait qu'à
8 su de séparation, aucun leurre n'entre **entier** dans le cadre au remplissage légal. À
11,5 su, la marge grandit encore. **Aucune constante de cadrage ne bouge.** Un bout de table
voisine dans le cadre : oui, et c'est la scène habitée que Bertrand demande. Un leurre entier
qui vole la résolution : structurellement impossible.

**Décision A13.3.e — le coût, dit franchement.** Le contrôle en intervalle §7.2.a passe de
**× 4 à × 7**. C'est du temps `qa-lead` + `dev-tooling-assets` et de l'art énuméré table par
table. Je ne demande aucune tolérance élargie en compensation : `SUBJECT_BOX_TOLERANCE` ne
bouge pas.

**Décision A13.3.f — le signalement à 2 critères devient plus fort, pas plus faible.** Sept
tables au même geste, c'est le meilleur cas d'usage possible de F19 : le critère **statique**
(la silhouette du Commandant, le vêtement) élimine cinq tables au grand-angle, le critère
**comportemental** ne se lit qu'au téléobjectif et tranche entre les deux qui restent. Les
11,0 s d'amorce avant `openAt` #1 (F19, plancher 6,0) restent le budget de ce travail. **La
demande de Bertrand — « beaucoup de choses où zoomer » — est littéralement satisfaite : six
tables sur lesquelles zoomer pour rien.**

### A.14 — Rev. 6.2 : le discriminant n'est plus le visage, c'est LA SCÈNE

> **Décision (gate art) :** le Commandant shippé (`commander_exposed.png`) est **chauve et rasé
> de près**. Aucun trait fin exploitable à 60 px/su, deux tentatives de reconnaissance faciale
> échouées. **On arrête d'itérer là-dessus.** Nouveau signalement, du **grossier vers le fin** :
> (1) la **voiture de service en double file avec chauffeur qui attend**, qui **désigne** la
> table qu'elle sert ; (2) le **parapheur** + le **tailleur** de la femme, lus en masses ;
> (3) le **déroulé** — il arrive, ils s'attablent, il repart seul et elle reste.
> **Principe opposable : aucun signal n'identifie seul, c'est leur conjonction sur une même
> table qui identifie.**

**Ma structure tient, son contenu change — et le changement l'améliore.** §A.6 posait 1 critère
statique (élimine grossièrement) + 1 comportemental (tranche finement), le zoom servant à
**trancher**. Le nouveau cast inverse la pente : le signal le plus fort est le plus **grossier**
(une voiture en double file se voit au grand-angle), et le zoom sert désormais à **vérifier une
hypothèse construite au grand-angle**. C'est mécaniquement meilleur — ça met le travail
d'observation **avant** le zoom au lieu de le mettre dedans — et ça sauve `FILL_MIN` d'un rôle
qu'il n'aurait pas pu tenir : lire un visage à 251 mm avec du sway.

**Décision A14.1 — le signalement passe de 2 critères à 3 signaux CONJONCTIFS.** La forme
(§A.6) est conservée : un signalement, des interdits de pointage (A6.2), un plancher d'amorce
(F19). Ce qui change est la table :

| Sig.  | Contenu                                                          | Se lit à            | Disponible dès           | Rôle mécanique                                       |
| ----- | ---------------------------------------------------------------- | ------------------- | ------------------------ | ---------------------------------------------------- |
| **1** | Voiture de service en double file, chauffeur qui attend          | **grand-angle**     | `t = 0`                  | **Désigne une table.** Réduit 7 tables → ~3          |
| **2** | Parapheur (serviette rigide contre une chaise) + tailleur        | **focale moyenne**  | dès qu'ils sont attablés | **Confirme.** Réduit ~3 → **1**                      |
| **3** | Déroulé complet : il arrive, ils s'attablent, **il repart seul** | durée, focale libre | **fin de scène (~53 s)** | **Confirmation tardive uniquement** — jamais requise |

**Décision A14.2 — la conjonction qui identifie est `1 ∧ 2`, et le signal 3 est explicitement
REDONDANT. C'est le cœur de l'ajustement.**

#### A14.3 — ⚠️ Le risque que la commande me demande de regarder en face : oui, il est réel, et il tue la scène si on ne le ferme pas

Le signal 3 est désormais le plus fort **et** il ne se résout qu'au départ du Commandant, vers
**53 s**. Or la preuve maîtresse **LE GESTE** ouvre à **36,5 s** et ferme à **40,3 s**. **Si la
certitude exigeait le signal 3, le joueur ne pourrait jamais photographier la preuve maîtresse
en confiance : il serait certain 13 secondes après la seule fenêtre qui compte.** Il ne lui
resterait que le pari, ou le renoncement à la preuve — c'est-à-dire le set-piece transformé en
piège, l'exact inverse de F3.

**Je ferme ça par un plancher, pas par une intention :**

> **F21 — SUFFISANCE SANS LE SIGNAL TARDIF.** La conjonction des signaux disponibles **avant**
> `masterOpenAt − IDENTIFICATION_LEAD_FLOOR` doit **déjà** désigner un candidat et un seul.
> Aucun signal dont la lecture s'achève après ce point ne peut être nécessaire à
> l'identification du `master`.

Vérification sur Belliard : `1 ∧ 2` est complet **dès qu'ils sont attablés (~11,0 s)**, contre
`masterOpenAt − F19 = 36,5 − 8,0 = 28,5 s` ⇒ **17,5 s de marge** ✓. Le signal 3 arrive
**12,7 s après** la fermeture de la preuve maîtresse : il ne peut donc structurellement pas
être nécessaire, et F21 l'inscrit comme une règle et non comme une coïncidence de staging.

**Et le signal tardif trouve un vrai emploi, qui n'est pas un lot de consolation.** Il tombe à
~53 s, c'est-à-dire **exactement sur la fenêtre de LA PLAQUE `[53,0 ; 55,9]`**, qui est un
**bonus**. Le joueur patient est donc payé par un bonus, jamais par la preuve obligatoire —
c'est **la même structure que F3** (« un bonus accessible seulement en prenant un risque est un
piège, pas un bonus », ici : « une certitude tardive ne peut payer qu'un instant tardif »).
Le pivot de cast, correctement plancherisé, produit un alignement propre au lieu d'une dette.

**Décision A14.4 — F19 est mesurée contre l'instant MAÎTRE, plus contre le premier instant, et
sa valeur monte 6,0 → 8,0 s.**

- **Le repère change** parce que le nouveau signal 2 exige qu'ils soient **attablés** : rien ne
  garantit l'identification avant ARRIVÉE (11,0 s). Or **ARRIVÉE est un bonus.** Assumé et même
  voulu : le premier instant devient un beat « parier ou attendre » qui coûte au pire une pose
  sur 8 (`DECOY_ERROR_ALLOWANCE = 2`) — le pendant, côté QUI, de la leçon de couverture que
  L'ÉCHANGE enseigne côté QUAND. **Personne n'est jamais forcé de parier sur la preuve maîtresse.**
- **La valeur monte** parce que la conjonction coûte **deux trajets d'optique** au lieu d'un :
  balayage grand-angle 2,0 + traverse de zoom vers la table 2,2 + lecture des masses 1,8 +
  vérification/retour 2,2 = **8,2 s** ⇒ plancher **8,0 s**. Dérivé, pas arrondi.
- **Marge réelle** : identification complète ~11,0 s, `masterOpenAt` 36,5 s ⇒ **25,5 s
  disponibles** contre 8,0 requis ✓ (× 3,2).

**Décision A14.5 — le briefing RÉTRÉCIT : mon escalade n°1 s'allège (20,0 → 18,0 s), sans
changer la conclusion sur F14.** Nommer trois objets coûte moins de mots que décrire un visage :
un signalement facial vit de qualificatifs (« la mâchoire », « plutôt que »), un signalement de
scène vit de substantifs. Estimation ~**55 mots** (contre ~75) ⇒ **16,5 s** à 200 mots/min,
plafond lecteur lent **18,0 s**. **Je ne redescends pas à 15,0 s** : trois signaux à conjoindre
ne logent pas dans l'ellipse de trois lignes de la Rev. 5, et sous ~16 s le troisième signal
disparaît du briefing — donc F21 devient invérifiable par le joueur.

Report sur F14b(n) : `n = 1` ⇒ **218,0 s** (réserve 82,0 ✓) · `n = 2` ⇒ **287,8 s** (✗, manque
7,8 s au lieu de 9,8). **La conclusion de §A.12.3 ne bouge pas : le max légal reste 1**, et les
2,0 s gagnées ne suffisent pas à racheter la seconde tentative. Je le signale pour que personne
n'espère que ce pivot a payé la reprise : il ne l'a pas payée.

**Décision A14.6 — la distribution des signaux sur les leurres tient dans 6, et elle impose un
plancher de plus.** Le gate demande plusieurs voitures, plusieurs serviettes, plusieurs couples
qui arrivent et repartent, **une seule table réunissant les trois**. Le piège arithmétique :
**si un seul leurre porte à la fois les signaux 1 et 2, la conjonction `1 ∧ 2` cesse d'être
unique et F21 tombe** — le joueur redevient obligé d'attendre le signal 3, c'est-à-dire
exactement la catastrophe d'A14.3, ramenée par la porte de derrière.

> **F22 — Aucun leurre ne porte les DEUX signaux précoces.** Chaque `decoy` porte **au plus un**
> de {signal 1, signal 2}. Le signal 3 (déroulé) est libre et **doit** être distribué largement.
> Le `master` est la seule piste portant `1 ∧ 2`.

| Slot leurre | Signal porté                       | Ce que ça fait au joueur                                                 |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------ |
| D1, D2      | **1 seul** (une voiture les sert)  | Une voiture en double file ne suffit pas ⇒ le signal 1 doit être vérifié |
| D3, D4      | **2 seul** (serviette / tailleur)  | Une serviette rigide ne suffit pas ⇒ le signal 2 doit être vérifié       |
| D5, D6      | **3 seul** (arrivent et repartent) | Le déroulé partiel ne suffit pas ⇒ le signal 3 n'est pas un raccourci    |

**6 leurres exactement, `DECOY_COUNT_MAX = 6` ✓, sans marge.** C'est la couverture minimale qui
rend chacun des trois signaux **individuellement insuffisant** — la condition littérale du
principe opposable du gate. En dessous de 6, un signal devient identifiant à lui seul et le
travail d'observation s'effondre. **`DECOY_COUNT_MAX` ne peut donc plus baisser** sans casser
le principe : je le note comme une contrainte, plus comme un plafond de confort.

**Note pour `lead-art` :** les **voitures** ne sont pas des candidats (F20 ne vise que les
groupes de ≥ 2 personnes en interaction) — ce sont des props de décor, elles n'ont ni piste ni
contrôle en intervalle. Le coût §7.2.a reste **× 7**, il ne monte pas.

**AC22 (nouveau)** — au `verify`, sur 3 sessions découverte : le joueur nomme **la voiture**
comme premier indice utilisé, et l'identification est complète **avant 36,5 s** dans les 3 cas
(F21). S'il déclare avoir attendu le départ pour être sûr, **F21 est violé en pratique** et le
levier est la **distribution des signaux** (A14.6), jamais un affaiblissement du signalement.

### A.15 — Rev. 6.3 : LE DÉPART n'est pas une 4e pose, c'est LA PLAQUE. Escalade n°5 close.

**Le trou trouvé par l'art est réel et il est à moi.** J'ai fait du « il repart seul, elle
reste » le **signal n°3** du signalement (§A.14) sans jamais l'authorer nulle part : ni boîte,
ni instant, ni piste. Un signal que la mécanique ne connaît pas est une promesse de prose —
exactement le défaut que F12 et F20 existent pour interdire. L'art a eu raison de refuser
d'inventer la donnée et de me la renvoyer.

**Décision A15.1 — LE DÉPART **EST** l'instant LA PLAQUE. Signal n°3 et bonus n°3 sont le même
événement, sur la même piste, sur le même segment authored. Aucune donnée nouvelle.**
L'hypothèse de l'art est la bonne : c'est la **translation de `berline_double_file`**, le même
sprite qui s'en va. Et c'était **déjà authoré** — je l'avais écrit sans le voir :

| Ce que la donnée dit déjà (§2.5)                             | Ce que ça signifie en fiction                             |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| K5 `t = 51,20` — boîte table `17,0 × 9,56`, **tell #3 fire** | Il se lève. C'est le télégraphe.                          |
| K5 → K6 transit `[51,20 ; 53,00]`                            | Il quitte la table et rejoint la voiture. **Elle reste.** |
| K6 `t = 53,00` → K7 `55,90` — plaque `7,50 × 4,22`, mobile   | **La berline s'en va.** `openAt`/`closeAt` de LA PLAQUE.  |
| K8 `t = 60,00`                                               | Elle achève sa manœuvre et s'éloigne. Fin de scène.       |

**Rien à authorer, rien à budgéter, rien qui bouge :** ni les 9 keyframes, ni `3,103 su/s`, ni
la bande focale `210–300 mm`, ni F5b/F5c, ni `pxPerSu` — la berline réutilise celui des
keyframes de plaque existants. **E-6(5)/(6) restent vrais par construction** puisque c'est bien
le même sprite qui translate, et non une seconde pose à faire coïncider avec la première.

**Décision A15.2 — et ce n'est pas une coïncidence élégante, c'est le verrou de F21, que
j'inscris comme tel.** §A14.3 posait : « la certitude tardive ne peut payer qu'un instant
tardif ». Rev. 6.3 va plus loin et c'est plus fort : **le signal tardif et l'instant tardif sont
le même objet dessiné.** Il devient donc _impossible_ de rendre le signal 3 nécessaire à
l'identification sans le rendre simultanément nécessaire à un **bonus** — et un bonus n'est
jamais obligatoire (F3). **F21 n'est plus seulement asserté sur des dates, il est vrai par
identité.** C'est le meilleur état possible pour un plancher : il ne peut pas être cassé par un
re-authoring qui déplacerait une fenêtre, puisqu'il n'y a rien à désynchroniser.

**Décision A15.3 — je réponds quand même à l'option (b), parce que la réponse est utile et
qu'elle n'est pas celle qu'on croit.** Une « pose non photographiable » (qui se joue mais qu'on
ne peut pas prendre en photo) **n'échappe pas** au coût que j'ai refusé en §A8.1, et pour trois
raisons dont deux ne sont pas budgétaires :

1. **Coût temps : partiellement échappé, oui.** Sans fenêtre ni tell, elle n'ajoute pas les
   ~10 s d'`ACTIVE` d'un vrai 4e instant. Sur ce seul axe, l'objection budgétaire tombe.
2. **Mais elle tombe sous F20 (« pas de cible orpheline »).** Un homme qui se lève et rejoint
   une voiture **se lit comme photographiable**. Non-candidate, elle produirait `C* = ∅` ⇒
   tampon `out-of-frame` sur une photo parfaitement cadrée : le mensonge de tampon que F20
   interdit. Elle devrait donc être une piste ⇒ keyframes + contrôle en intervalle ⇒ **le coût
   art et outillage revient intégralement**, seul le coût temps disparaît.
3. **Et elle serait un signal fort qu'on interdit de photographier**, c'est-à-dire la pire
   pédagogie possible : « regarde bien ceci, ça ne compte pas ». À côté de A15.1 qui donne le
   même signal **et** un bonus pour l'avoir vu, il n'y a pas de comparaison.

**Donc : pas de 4e pose, sous aucune forme.** L'option (b) est documentée ici pour que personne
ne la rouvre en croyant qu'elle est gratuite : elle est moins chère en temps et plus chère en
tout le reste.

**Décision A15.4 — escalade n°5 CLOSE, actée.** Bertrand a tranché : **la berline repart pendant
la scène**, elle ne reste pas garée. C'est l'option (i) que je recommandais, **coût mécanique
nul** : les 9 keyframes, `3,103 su/s`, F5b, F5c, §3.3.b, §4.3 et AC6c tiennent tous sans qu'une
valeur bouge. **§A.13.2 est superseded** — je retire l'escalade de ma liste. Il ne reste
**aucune option (ii)/(iii)** à instruire : le sujet mobile du set-piece est confirmé, et avec
lui le seul test de poursuite du jeu.

**Décision A15.5 — un point de F20 que ce départ règle au passage, vérifié plutôt que supposé.**
Après K5, la femme **reste seule** à la table. Une personne seule attablée n'est pas un groupe
de ≥ 2 en interaction : **F20 est satisfait sans piste supplémentaire**, la table cesse
proprement d'être une cible quand le master la quitte. Aucune huitième piste. Le coût §7.2.a
reste **× 7**.

**AC23 (nouveau)** — au `verify` : entre 51,2 s et 60,0 s, ce que le joueur voit (il se lève,
la berline s'en va, elle reste) est **le même objet** que ce que les brackets suivent — c'est
F12(1) sur le segment K5→K8, déjà couvert, mais je l'appelle explicitement parce que c'est le
seul segment où la piste `master` **change de sujet dessiné** et que c'est là qu'un
désalignement art/donnée coûterait le plus cher.

### A.16 — Rev. 6.4 : les signaux deviennent des RELATIONS AUTHORED, et l'instant du swap

**L'art a raison sur le fond et le cas `decoy_table_c` le prouve mieux que n'importe quel
argument.** Le gate a retiré à `_c` le signal n°1 pour breach de F22 — **et la chaîne de prompt
de `_c` n'a pas changé d'un caractère**, parce que le signal n°1 n'a jamais vécu dans le sprite
de la table : il vit dans le fait qu'**une berline soit garée hors file à côté d'elle**. Une
contrainte que je formule sur le **dessin** alors qu'elle porte sur le **placement** ne survit
pas au premier repositionnement, et son effondrement est silencieux : F22 tombe, F21 tombe
derrière, et rien ne devient rouge. **C'est le même défaut que T-6 en Rev. 5** — une propriété
défendue par une prose au lieu d'une donnée.

#### A16.1 — Décision : les signaux sont des `signalBindings` authored, pas des propriétés d'image

**Décision A16.1 — un signal n'est jamais « porté par un sprite ». Il est une RELATION authored
entre un porteur et un candidat**, et c'est cette relation que la vérification lit.

```
signalBindings: { signal: 1 | 2 | 3, carrier: PropId | EventId, candidate: CandidateId }[]
```

| Signal | Porteur (`carrier`)                                      | Type      | Ce qui est authored                                    |
| ------ | -------------------------------------------------------- | --------- | ------------------------------------------------------ |
| **1**  | `berline_double_file` (et les autres voitures hors file) | **prop**  | position sur le plateau + `candidate` qu'elle sert     |
| **2**  | parapheur / tailleur                                     | **prop**  | position + `candidate`                                 |
| **3**  | le déroulé (arrivée / départ)                            | **event** | l'instant de swap ou de retrait + `candidate` (§A16.3) |

**Aucune vérification ne lit un pixel de leurre.** `signals(c)` se calcule par agrégation des
bindings, et F22 s'assertent dessus :

> **F22 (Rev. 6.4, assertable) —** `∀ decoy d : |{1,2} ∩ signals(d)| ≤ 1` et
> `{1,2} ⊆ signals(master)`. Calculé sur `signalBindings`, jamais sur le contenu d'une image.

**Décision A16.2 — mais une relation authored qui ment est pire qu'une note d'intention, donc
le placement est plancherisé aussi.** Écrire `berline_07 → decoy_a` ne sert à rien si la berline
est dessinée à côté de `decoy_b` : le joueur lit la géométrie, pas la donnée. D'où le plancher
qui **relie la relation au placement**, et qui est celui que l'art réclame :

> **F23 — Un porteur de signal est proche de SON candidat et loin de tous les autres.**
> `∀ binding(s, carrier, c)` de type **prop** :
> **(a)** `‖pos(carrier) − centre_c(t)‖ ≤ SIGNAL_BIND_RADIUS` **pour tout `t`** ;
> **(b)** `‖pos(carrier) − centre_c'(t)‖ ≥ SIGNAL_EXCLUSION_RADIUS` **pour tout autre candidat
> `c'` et tout `t`**.

| Constante                 | Valeur     | Dérivation (pas un choix)                                                                                                                                                                     |
| ------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SIGNAL_BIND_RADIUS`      | **4,5 su** | ≈ 0,6 m : une voiture « qui sert cette table » est **contre** elle. Doit rester < la moitié du pas de terrasse (11,5 / 2 = 5,75) pour qu'aucun prop ne soit à équidistance de deux tables.    |
| `SIGNAL_EXCLUSION_RADIUS` | **6,0 su** | Ce qui reste garanti au voisin : `11,5 − 4,5 = 7,0 su ≥ 6,0` ✓, **marge 1,0 su**. C'est le même ordre de grandeur que F17 (6,0 su) et ce n'est pas un hasard : en dessous, l'œil hésite.      |
| **Cohérence des deux**    | assertée   | `SIGNAL_BIND_RADIUS + SIGNAL_EXCLUSION_RADIUS ≤ min séparation candidats` ⇒ `4,5 + 6,0 = 10,5 ≤ 11,5` ✓. **Sans ce contrôle, la paire de constantes peut devenir contradictoire en silence.** |

**Ce que ça donne concrètement : déplacer la berline de `_c` vers `_a` cesse d'être un geste
d'art invisible. Soit le binding suit (et F22 devient rouge si `_a` portait déjà le signal 2),
soit il ne suit pas (et F23 devient rouge). Il n'existe plus de chemin où F21 s'effondre en
silence.** C'est exactement ce que l'art demandait, et c'est mieux pour l'art : le
repositionnement redevient libre partout où il ne casse rien.

#### A16.2 — La distribution 2/2/2 devient un décompte, plus une note

**Décision A16.3 — la distribution est assertée par comptage sur `signalBindings`**, et je la
réécris sous la forme vérifiable :

> **F22b —** `∀ s ∈ {1, 2, 3}` : `count(bindings de signal s sur les decoys) === 2`, et
> `count(bindings de signal s sur le master) === 1`.
> Total attendu : **9 bindings** (3 signaux × (1 master + 2 leurres)), sur **6 leurres** portant
> **1 signal chacun** — la couverture minimale de §A14.6, désormais comptée au lieu d'être
> promise.

Un leurre sans binding est une violation aussi (il n'aurait aucune raison d'exister comme
leurre) : `∀ decoy d : |signals(d)| === 1`. Le décompte est total, donc **aucun leurre ne peut
être ajouté ou retiré sans casser la suite** — ce qui est le comportement voulu quand
`DECOY_COUNT_MAX = 6` est devenu une contrainte (§A14.6) et non un plafond.

#### A16.3 — L'instant du swap, et les deux retraits (authorés)

Le gate a tranché : le départ n'est **ni une 4e pose ni une 4e boîte**, mais un **swap de sprite
sur la boîte déjà authorée** — `commandant_table_apres` (elle seule, chaise reculée, parapheur
ouvert). Je ne dois donc que **des instants**. Les voici.

| Événement                         | `t` authored | Fenêtre légale    | Pourquoi cette valeur                                                                                                                                                    |
| --------------------------------- | ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Swap `commandant_table_apres`** | **52,2 s**   | `]51,20 ; 53,00[` | **1,0 s après le tell #3**, le même écart que la paire de tells composite de §4.2 (« assez proche pour se lire comme un seul événement ») ; **0,8 s avant `openAt` #3**. |
| **Retrait leurre D5**             | **50,4 s**   | `[50,2 ; 52,2]`   | **0,8 s avant** le tell #3 (51,2) ⇒ dans le ±1,0 s exigé par **F18**.                                                                                                    |
| **Retrait leurre D6**             | **52,0 s**   | `[50,2 ; 52,2]`   | **0,8 s après** le tell #3 ⇒ **F18** couvert des deux côtés : le départ du master est **encadré** par deux départs de leurres, jamais isolé.                             |

**Trois propriétés que ces trois valeurs achètent, et je les vérifie plutôt que je ne les
espère :**

1. **Le swap ne peut pas fuiter l'instant.** Il est **strictement après le tell #3** : le joueur
   apprend « quelque chose se passe » par le tell, jamais par le swap. Placé avant, il serait
   un tell non authored — la fuite que F2 et F12(2) interdisent.
2. **Le swap est placé DANS un transit, et c'est le seul endroit sûr du segment.** Sur
   `]51,20 ; 53,00[` la piste `master` est en télégraphe : §2.1 établit qu'une boîte en transit
   est « une lecture qui mène l'œil, jamais une prétention de validation », et F12(1) est
   asserté **aux keyframes**, pas dans le transit. **Un swap de sprite ne peut donc pas y
   désaligner la boîte du dessin.** Placé sur un hold (K2→K3 ou K4→K5), il aurait violé F12(1)
   instantanément. C'est le raisonnement qui fixe la fenêtre légale, pas le goût.
3. **F18 est satisfait sur le tell #3 par construction, et je dis ce qui reste dû.** Les deux
   retraits l'encadrent à ±0,8 s. **Les tells #1 (9,2 s) et #2 (34,7 s) ont toujours besoin de
   leur propre télégraphe de leurre concurrent** (F18, §A.8) : ils ne sont **pas** couverts par
   ces deux retraits et restent à authorer avec le plateau (Rev. 6.5, avec les 6 pistes leurres).
   Je le signale plutôt que de laisser croire que F18 est clos.

**Décision A16.4 — un leurre retiré garde sa piste. F12(3) n'est pas négociable.** « Retrait »
est un événement de mise en scène, **jamais une suppression de piste** : la boîte de D5/D6 reste
**définie, finie et dans le plateau** sur tout `[0 ; 60,0]` (elle translate vers un bord et y
tient). Deux conséquences que j'authore explicitement pour qu'elles ne soient pas découvertes
plus tard : le transit de retrait vit **dans le propre télégraphe** de la piste (F12(2) par
piste, donc onset de transit = les valeurs ci-dessus), et **F17 (≥ 6,0 su) doit tenir aussi à
la position de repli** — deux leurres qui se retirent vers le même bord et s'y empilent
casseraient la séparation là où plus personne ne regarde.

**AC24 (nouveau)** — `signalBindings` est vérifié **par la donnée** : un test déplace un prop
porteur au-delà de `SIGNAL_BIND_RADIUS` de son candidat, ou dans le rayon d'exclusion d'un
autre, et **la suite passe au rouge en nommant le binding fautif**. Un test qui exigerait de
regarder une image pour trancher est un test qui ne satisfait pas cet AC.

---

### A.17 — Rev. 6.5 : LES PASSANTS DEVIENNENT DES MARCHEURS DE PREMIER PLAN (décision Bertrand)

> **Décision de Bertrand, mot pour mot :** « est-ce que ça peut être des vrais perso qui
> marchent et qui seraient pris dans la perspective de la photo ? » Les passants sortent du
> décor peint : ce sont des **sprites animés posés dans la scène**, donc grossis par le zoom
> comme tout le reste, et **capables de traverser le cadre du joueur**.
>
> **Contrainte déjà tranchée avec `lead-game-designer` :** les marcheurs circulent **au PREMIER
> PLAN**, visiblement plus proches que les tables. Un obstacle qu'on anticipe est du gameplay ;
> un obstacle qui apparaît au moment du déclic est une injustice.

Je prends l'ajout pour ce qu'il est : **un troisième axe de pression sur une scène qui n'en
avait que deux** (le QUAND des instants, le QUI des candidats). Les marcheurs ajoutent le
**PENDANT** — la fenêtre est ouverte, le sujet est le bon, et la rue passe devant. C'est
exactement la même forme que la couverture sonore : une contrainte du monde, périodique,
lisible, que le joueur apprend à jouer au lieu de la subir.

#### A17.1 — Question 1 tranchée : le masquage COMPTE, option (c), et il compte EN DIRECT

**Les trois options, jugées contre « aucun tampon ne ment » (F20) et non contre le goût.**

| Opt.    | Règle                                      | Verdict     | Pourquoi                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | Tout recouvrement invalide                 | **REFUSÉE** | Un bras qui frôle le bord de la boîte tuerait la photo, et `SUBJECT_BOX_TOLERANCE` (0,40 su) suffirait à faire basculer un verdict — la boîte n'est honnête qu'**à la tolérance près**. Refuse aussi la « scène habitée » que §A13.3.d a explicitement achetée (un bout de voisin dans le cadre est **voulu**).                                                           |
| **(b)** | Aucune conséquence mécanique               | **REFUSÉE** | Non pas parce qu'elle est molle, mais parce qu'**elle ment dans l'autre sens** : elle tamponne `MASTER` sur une vignette où l'on voit le dos d'un passant et rien d'autre. F20 interdit qu'un tampon promette ce que l'image ne montre pas ; la symétrie est totale. Et elle reproduit le défaut Rev. 1-5 que Bertrand a déjà sanctionné : du décor mobile, intérêt zéro. |
| **(c)** | Invalide au-delà d'un taux de recouvrement | **ADOPTÉE** | C'est la seule qui reste vraie dans les deux sens : au-dessus du seuil, l'image ne montre plus la preuve **et** le tampon le dit ; en dessous, la preuve est lisible **et** la photo passe.                                                                                                                                                                               |

**Décision A17.1 — nouveau test `T6 — DÉGAGÉ`, et il est MÉCANIQUE, donc montré en direct.**

> **T6** — la somme des recouvrements du **noyau solide** des marcheurs sur la boîte du candidat
> résolu `C*(t)`, rapportée à l'aire de cette boîte, est `< OCCLUSION_REJECT_RATIO`.
> Calculé en **coordonnées plateau**, sur des AABB, **indépendamment du focal**.

Quatre propriétés que cette formulation achète, et je les vérifie plutôt que je ne les espère :

1. **C'est une propriété de composition, donc §2.4 m'oblige à la montrer en direct.** « Il y a
   quelqu'un devant » est mécanique (une propriété de l'image), pas sémantique (une propriété
   de la preuve). La cacher jusqu'à la planche serait exactement la règle invisible que AC14
   chasse. ⇒ **nouvel état de brackets `blocked`** (§A17.6, à Tony).
2. **Zoom-invariant.** Le taux est calculé sur le plateau, jamais à l'écran : le même passage
   coûte la même chose à 94 mm et à 251 mm. Sans ça, zoomer changerait la règle en plus de
   changer la vue, et le double arbitrage de §D3 deviendrait un triple arbitrage illisible.
3. **Le noyau solide seulement — le flou de premier plan ne compte JAMAIS.** Ce qui invalide
   est ce qui est franchement là. C'est ce qui permet à la pénombre de servir d'avertissement
   (§A17.4) sans servir de sanction.
4. **T6 ne remet PAS le hold à zéro.** Contrairement à une rupture de T3/T4 (§2.3), T6 **bloque
   le verdict sans casser la charge**. Raison de fond : le hold modèle « l'optique s'est
   posée » — une propriété de l'**outil** ; un passant est une propriété du **monde** et
   n'ébranle pas l'objectif. Conséquence de tuning : un passage coûte au joueur **exactement sa
   durée**, jamais sa durée + 0,35 s. C'est la différence entre une contrainte et une taxe.

**Le seuil, dérivé et non posé.**

| Constante                | Valeur   | Dérivation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OCCLUSION_REJECT_RATIO` | **0,25** | **Borne haute :** doit se déclencher **avant** qu'un élément énuméré soit perdu. À L'ÉCHANGE (boîte `17,0 × 9,56`), un marcheur de `6,0 su` de large masquant **un visage sur deux** couvre `6,0/17,0 = 35 %`. Un seuil à 25 % rougit **10 pp avant** que la preuve cesse d'être une preuve. **Borne basse :** doit dominer l'erreur induite par `SUBJECT_BOX_TOLERANCE` — pire cas LA PLAQUE, `0,40 su / 7,50 su = 5,3 %` ⇒ rapport **4,7×**. Une règle de verdict doit dominer la tolérance de la donnée qu'elle lit d'au moins **×3** ; ici ✓. |

#### A17.2 — Question 2 tranchée : `walkerTracks`, des trajectoires authorées, jamais du bruit

**Décision A17.2 — les marcheurs sont une collection authored de la MÊME forme que
`candidateTracks`, et c'est délibérément la même forme.**

```
walkerTracks: { id: WalkerId, keyframes: { t, cx, cy, w, h }[] }[]
```

Interpolation linéaire, **définie et finie sur tout `[0, sceneDuration]`**. Aucun spawner,
aucune période, aucun PRNG : **F11 tient sans amendement** et deux tentatives de la même scène
sont comparables à la seconde près — c'est la condition de survie de **AC10**.

**Trois écarts explicites avec `candidateTracks`, à ne pas découvrir plus tard :**

1. **Un marcheur N'EST PAS un candidat** (question 4, confirmée) : `walkerTracks` est une
   collection **séparée**. La résolution `C*(t)` (§A.3) énumère `candidateTracks` **et elles
   seules** ⇒ un marcheur ne peut **jamais** être résolu, ne peut **jamais** produire
   `wrong-subject`, ne porte **aucun** `signalBinding` (F22b compte 9 bindings sur candidats,
   inchangé), et n'entre dans **aucun** décompte `DECOY_COUNT_*` (F16 inchangé, coût §7.2.a
   des candidats inchangé × 7).
2. **F12(3) ne s'applique pas tel quel** : une piste marcheur est totale sur `[0, 60,0]` mais
   **a le droit d'être hors plateau** — c'est ainsi qu'elle entre et sort du cadre, ce que
   Bertrand demande. Elle est totale, finie, jamais indéfinie. Ne pas copier-coller F12(3).
3. **F17 (séparation des centres) ne s'applique pas aux marcheurs** : ils passent devant les
   candidats, c'est le principe même. F17 continue de ne parler que des candidats entre eux, et
   §A3.3 (le sway ne peut pas faire basculer `C*`) reste intact **parce que la résolution
   ignore les marcheurs**.

**Décision A17.3 — la piste marcheur est plancherisée comme une piste candidat sur le seul
point qui compte : l'honnêteté dessiné == boîte.** Le taux de T6 est calculé sur la boîte
authored ; si le sprite dessiné n'y correspond pas, le joueur est refusé par une géométrie qu'il
ne voit pas. C'est le défaut que F12(1) ferme côté candidats, et il est **plus grave** ici parce
que le marcheur bouge vite.

> **F25 — Honnêteté du noyau marcheur.** `∀ marcheur, ∀ t` : `AABB(noyau dessiné(t))` égale la
> boîte authored à `SUBJECT_BOX_TOLERANCE` près, **contrôlé en intervalle** (§7.2.a), jamais
> aux seuls keyframes. La **pénombre de flou** est dessinée **en plus** du noyau et n'entre
> **pas** dans cette AABB.

#### A17.3 — Question 3 tranchée : F3 reste une GARANTIE, par un plancher, pas par un espoir

**Le danger, chiffré avant d'être traité.** La course parfaite à zéro suspicion se joue **dans
les fenêtres de couverture**. Les recoupements instant × couverture sont **4,5 / 1,5 / 2,9 s**
(§4.2). Le maillon est **L'ÉCHANGE : 1,5 s couverte**, et un traversée de marcheur dure de
l'ordre de **1,3 s** (§A17.4). **Un seul passant mal placé supprime la course parfaite de la
scène.** F3 tomberait sans qu'aucune valeur de F3 ne bouge — exactement le mode de panne
silencieux que Rev. 6.4 vient de fermer côté signaux.

> **F24 — L'ALLÉE DÉGAGÉE.** Pour **chaque** instant `I` (master **et** bonus), l'intersection
> `[openAt_I, closeAt_I] ∩ coverWindows` contient un sous-intervalle **contigu** de durée
> `≥ CLEAR_AISLE_FLOOR` pendant lequel **aucun marcheur n'occulte la boîte de `I` au-delà de
> `OCCLUSION_REJECT_RATIO`**. Asserté par calcul sur `walkerTracks` × `candidateTracks`, jamais
> par relecture d'une intention.

| Constante           | Valeur    | Dérivation (pas un choix)                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLEAR_AISLE_FLOOR` | **1,2 s** | `FOCUS_HOLD (0,35) + SHUTTER_ARM_SECONDS (0,40) + 0,45 s` de perception/re-verrouillage = **1,20 s** — le pire cas honnête, celui du joueur qui **arrive** sur la fenêtre au lieu de l'avoir déjà chargée. Numériquement égal à `COVER_OVERLAP_FLOOR` : les deux répondent à la même question (« combien de temps faut-il pour placer une photo »), il serait suspect qu'ils diffèrent. |

**C'est la réponse exacte à la question 3, et c'est une garantie, pas un espoir : la course sans
faute est la course sous couverture, et l'allée dégagée est authorée SUR la couverture.** Le
joueur qui joue le feu joue aussi la rue vide — **une seule leçon, deux dangers**. Il n'a pas
besoin de savoir que l'allée existe, exactement comme il n'a pas besoin de savoir que F3 existe.

**Ce que F24 impose concrètement sur Belliard (instance authorée, plus stricte que le plancher) :**

| Instant       | Couvert         | Marge sous F24 | Décision authorée                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARRIVÉE       | `[11,0 ; 15,5]` | 3,3 s          | **≥ 1,2 s contigu dégagé** — une traversée est permise, deux ne le sont pas.                                                                                                                                                                                                                                                     |
| **L'ÉCHANGE** | `[36,5 ; 38,0]` | **0,3 s**      | **ZÉRO occultation du master.** 1,5 − 1,2 = 0,3 s ne loge aucune traversée : l'interdit total est la seule forme honnête du plancher ici, et il est plus simple à vérifier qu'une marge de 0,3 s.                                                                                                                                |
| LA PLAQUE     | `[53,0 ; 55,9]` | 1,7 s          | **ZÉRO occultation du master.** Le plancher tolérerait une traversée ; je ne la prends pas : F5b y est déjà à **116 %** (§7.1) et la boîte y traverse la **bande basse du plateau** (`cy = 9,00`) — c'est-à-dire précisément là où les marcheurs passent. La frame la plus dure du set-piece n'aura pas en plus un corps devant. |

#### A17.4 — Le vrai risque : à ×10 on ne voit PAS venir le passant. Fermé par un plancher.

**Le premier plan ne suffit pas, et il faut le dire.** À 251 mm le viseur fait `fovW = 13,9 su` :
un marcheur qui arrive hors cadre est **invisible**, et l'écart bord-de-cadre → boîte vaut
`(13,9 − 7,5)/2 = 3,2 su`. À une allure de piéton, cela fait **0,3 s** d'avertissement. **C'est
exactement l'injustice que la contrainte de Bertrand voulait empêcher, et elle survit au premier
plan** : « plus près » ne veut pas dire « visible plus tôt » quand le champ est de 13,9 su.

**Décision A17.4 — l'avertissement est la PÉNOMBRE DE FLOU, et c'est photographiquement vrai.**
Un corps de premier plan vu à 300 mm est massivement hors mise au point : il entre dans le cadre
comme une **masse sombre et molle, plus large que le corps**, bien avant que le corps net
n'arrive. Je transforme cette vérité optique en donnée : la pénombre est **dessinée**, elle
**avertit**, et (§A17.1(3)) elle **n'invalide jamais**.

> **F26 — PLANCHER D'AVERTISSEMENT D'OCCULTATION.** Pour tout focal de `[FOCAL_MIN, FOCAL_MAX]`,
> tout candidat cadré au remplissage légal et tout marcheur : la **masse dessinée** du marcheur
> (noyau **+** pénombre) est visible dans le viseur pendant `≥ OCCLUSION_WARNING_FLOOR` **avant**
> que son occultation de ce candidat ne franchisse `OCCLUSION_REJECT_RATIO`.

| Constante                 | Valeur       | Dérivation                                                                                                                                                                                                                      |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OCCLUSION_WARNING_FLOOR` | **1,00 s**   | `FOCUS_HOLD (0,35 — l'unité maison de « l'optique s'est posée ») + SHUTTER_ARM_SECONDS (0,40 — l'unité maison de « la main agit ») + 0,25 s de perception` = **1,00 s**. Composé d'unités déjà ratifiées, pas d'un nombre rond. |
| `OCCLUSION_PENUMBRA_MIN`  | **3,0 su**   | Ce qu'il faut pour que F26 soit satisfaisable au pire focal — voir le calcul ci-dessous. Contrainte de **lecture** livrée à `lead-art` (une masse molle qui déborde le corps de 3,0 su au bord d'attaque), jamais un style.     |
| `WALKER_SPEED_MAX`        | **8,0 su/s** | Conséquence arithmétique, pas une préférence.                                                                                                                                                                                   |
| `WALKER_SPEED_MIN`        | **3,0 su/s** | Un marcheur qui parcourt moins d'une largeur de corps (`6,0 su`) en 2 s ne marche plus : il stationne, et un figurant qui stationne rouvre F20 (§A17.5).                                                                        |

**Le calcul qui fixe `WALKER_SPEED_MAX`, au pire cas (LA PLAQUE, 251 mm) :**

```
distance à parcourir avant sanction = pénombre (3,0) + bord→boîte (3,2) + pénétration à 25 % (1,9) = 8,1 su
F26 exige ≥ 1,00 s pour la parcourir  ⇒  v ≤ 8,1 su/s  ⇒  WALKER_SPEED_MAX = 8,0 su/s ✓ (marge 1,2 %)
```

**Je dis le prix plutôt que de le cacher : 8,0 su/s au plan de premier plan ≈ 0,77 m/s, c'est
une allure de flâneur, pas un pas pressé.** C'est le tarif de l'anticipabilité à ×10 : au-delà,
le passant redevient une gifle. Si l'art veut des piétons pressés, il faut **augmenter
`OCCLUSION_PENUMBRA_MIN`** (chaque `+1,0 su` de pénombre achète `+1,0 su/s`), pas relâcher F26.
C'est un levier propre, et il est à moi — pas à absorber en silence.

**Durée d'une traversée, qui alimente §A17.3 :** à `8,0 su/s`, un marcheur de `6,0 su` occulte
la boîte de L'ÉCHANGE (`17,0 su`) au-dessus de 25 % pendant ≈ **1,3 s** — soit ≈ 34 % d'une
fenêtre de 3,8 s. Réel, survivable, jamais fatal.

**Bénéfice de conception non demandé mais réel : le zoom gagne un QUATRIÈME métier.** À 35 mm on
voit toute la rue et donc tous les marcheurs ; à 251 mm on ne voit plus arriver le danger. Zoomer
coûte désormais **du cadrage, de la stabilité, du temps d'observation ET de la conscience de la
rue**. Aucune constante de §D3 ne bouge : c'est du contenu qui fait travailler un axe existant.

#### A17.5 — Question 4 : les marcheurs ne sont pas des candidats — et F20 se referme MIEUX qu'avant

**Confirmé au modèle** (§A17.2(1)) : `walkerTracks ∩ candidateTracks = ∅`, aucune boîte vérifiée,
F12 ne les vise pas, F22b ne les compte pas.

**Mais je ne peux pas m'arrêter là, parce que F20 a une porte de derrière et elle est ouverte.**
F20 dit : tout groupe de ≥ 2 personnes en interaction est soit une piste, soit mis en scène comme
non-photographiable. Deux marcheurs côte à côte, ou un marcheur arrêté devant une table, **se
lisent comme un groupe**. Le joueur les cadre parfaitement, `C* = ∅` (aucun candidat contenu),
T3 échoue, et la planche tamponne **`out-of-frame` sur une photo impeccablement cadrée**. C'est
le mensonge de tampon exact que F20 existe pour interdire — importé par la porte des marcheurs.

**Décision A17.5 — je le règle à la racine plutôt qu'en interdisant la vie de la rue : le motif
`out-of-frame` était déjà surchargé, je le scinde.**

| `rejectReason`                 | Condition                                              | Ce que ça dit honnêtement     |
| ------------------------------ | ------------------------------------------------------ | ----------------------------- |
| **`nothing-here`** _(nouveau)_ | **Aucun** candidat n'intersecte le viseur              | « Il n'y avait personne là. » |
| `out-of-frame` _(resserré)_    | Un candidat intersecte `V` mais n'y est pas **entier** | « Tu l'avais presque. »       |

Ce partitionnement est **strictement plus honnête** que l'actuel, il coûte **une chaîne**, et il
retire à F20 la charge d'interdire ce que le décor doit pouvoir faire. **Conséquence voulue :
deux marcheurs qui marchent ensemble redeviennent AUTORISÉS** — la rue vivante que Bertrand
demande — parce que les photographier produit désormais un tampon vrai.

**Ce qui reste interdit, et c'est le seul interdit :**

> **F27 — UN MARCHEUR NE S'ARRÊTE JAMAIS.** `∀ marcheur, ∀ t` : `‖v(t)‖ ∈ [WALKER_SPEED_MIN,
WALKER_SPEED_MAX]`. Aucune vitesse nulle, aucun palier, et **aucun marcheur ne s'immobilise à
> moins de `SIGNAL_EXCLUSION_RADIUS` (6,0 su) d'un candidat** — trivialement vrai si la première
> clause tient, et asserté quand même parce que c'est la propriété qui compte.

Raison : un groupe **arrêté** à côté d'une table est indiscernable d'une table occupée ⇒ F20 se
rouvre **pour de vrai** (il promet une preuve). Un groupe **en marche** ne promet rien : la rue
passe, c'est tout. **La différence entre « photographiable » et « de passage » est le
mouvement**, et elle est maintenant une donnée assertable et non une note d'intention — même
discipline que §A.16.

**Décision A17.6 — l'ordre de précédence des motifs devient authored, parce qu'un ordre implicite
est un tampon qui ment un jour sur deux.** À l'obturation, le premier motif vrai gagne :

| Rang | Condition                               | Motif                        | Famille             |
| ---- | --------------------------------------- | ---------------------------- | ------------------- |
| 1    | Aucun candidat n'intersecte `V`         | `nothing-here`               | mécanique           |
| 2    | Aucun candidat entièrement contenu (T3) | `out-of-frame`               | mécanique           |
| 3    | `fill` hors bande (T4)                  | `too-wide` / `too-tight`     | mécanique           |
| 4    | **T6 faux au déclic**                   | **`obstructed`** _(nouveau)_ | mécanique           |
| 5    | Hold < `FOCUS_HOLD` (T5)                | `blurred`                    | mécanique           |
| 6    | `C*.role !== "master"`                  | `wrong-subject`              | **sémantique** (D8) |
| 7    | `master` cadré, `t` hors fenêtre (T2)   | `no-subject`                 | **sémantique** (D8) |

**Cet ordre n'est pas administratif : il place TOUS les motifs mécaniques avant TOUS les motifs
sémantiques, ce qui est la ligne à deux temps de §2.4 transcrite en code.** Tamponner
`wrong-subject` sur une vignette où l'on ne voit pas qui c'est serait une prétention de lecture
sur une image illisible — un mensonge de plus.

**Et la preuve du tampon est DANS la vignette.** La planche-contact affiche la frame telle que
dessinée, **marcheurs compris** : le joueur qui lit `obstructed` voit le dos qui a mangé sa
photo. C'est la forme la plus forte de « aucun tampon ne ment » — le motif est **vérifiable à
l'œil sur la pièce elle-même**, pas seulement vrai dans le code.

#### A17.6 — Ce que ça casse, et ce que ça ne casse pas (dit franchement)

**Ce qui NE bouge PAS, vérifié et non affirmé :** les 3 instants, les 3 fenêtres de couverture,
`SCENE_DURATION`, les 9 keyframes du master, `FILL_MIN/FILL_MAX/FRAME_MARGIN`, le modèle de sway
et `SWAY_AMP_X`, `FOCUS_HOLD`, le barème de suspicion, F1-F5, F7-F13, F15-F23, `signalBindings`,
`maxAttempts`, le levier R1. **Et surtout : `F14` (temps mur) est INTACT — les marcheurs
n'ajoutent pas une seconde à la scène.** Sur une réserve de 20,9 s déjà négative à deux
tentatives, c'était la condition d'entrée du pivot ; elle est remplie.

**Ce que ça casse ou coûte, nommé, non absorbé :**

| #     | Ce qui bouge                                                                                                                                                                   | Chez qui                            | Gravité                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Contrat typé** : nouvelle collection `walkerTracks`, deux nouveaux `rejectReason` (`obstructed`, `nothing-here`)                                                             | `senior-architect` / `dev-gameplay` | **Additif** — aucune forme existante ne change. Pas un drop-in, mais pas un pivot non plus.                                                                                                                                                                                                                                                                                             |
| **2** | **Cinquième état de brackets `blocked`**                                                                                                                                       | `ux-designer` (Tony)                | **BLOQUANT pour A17.1** — voir la dépendance ci-dessous. Read exigé : « quelqu'un est devant », **jamais** « tu as mal cadré » (à distinguer de `dashed`). Ne fuite rien : vrai des leurres comme du master, muet sur le rôle et sur l'instant.                                                                                                                                         |
| **3** | **Nouvelle famille d'assets** : marcheurs animés (cycle de marche) à l'échelle de premier plan + pénombre de flou                                                              | `lead-art` / `concept-artist`       | **Coût réel, nouveau.** Échelle plancher `WALKER_SCALE_MIN = 1,35 ×` la figure debout (`13,5 su`) ⇒ **≥ 18,2 su**, dérivé de la géométrie de la fiction (diagonale 60 m, marcheur 15 m plus près ⇒ `60/45 = 1,33`), pas du goût. Ordre de rendu : **devant tout candidat**, sans exception.                                                                                             |
| **4** | **Outillage** : §7.2.a gagne 2 contrôles (noyau marcheur en intervalle F25 ; **taux d'occultation dans le temps**, croisement `walkerTracks` × `candidateTracks` pour F24/F26) | `qa-lead` / `dev-tooling-assets`    | **Coût réel.** Le second contrôle est d'une nature nouvelle (produit de deux jeux de pistes), pas un ×N du contrôle existant.                                                                                                                                                                                                                                                           |
| **5** | **Reduced motion** : les marcheurs **ne sont PAS ralentis** sous `prefers-reduced-motion`                                                                                      | `ux-designer` (Tony)                | Les ralentir allonge les occultations et **mange l'allée dégagée** (F24) : ce serait une régression de difficulté déguisée en accessibilité. §3.4 ne bouge pas (`SWAY_LEG_DURATION_RM` seul). **À arbitrer par Tony ; je signale, je ne tranche pas l'a11y.**                                                                                                                           |
| **6** | **F6 / `filmCount = 8` : inchangé — SOUS CONDITION.**                                                                                                                          | dépendance sur (2)                  | Tenu **uniquement** parce que l'état `blocked` empêche de brûler de la pellicule sans le savoir. **Si `blocked` n'est pas livré, F6 doit être re-dérivé avec une `OCCLUSION_ERROR_ALLOWANCE` — et 8 est déjà le plafond UX (pas de pagination) : il n'y a nulle part où aller.** C'est la seule dépendance dure de cet amendement, et je la déclare au lieu de la découvrir au stage 5. |

**Ce que je NE tranche pas :** les keyframes de `walkerTracks` ne sont **pas** authorées ici —
même raison qu'en §A.2 pour les leurres : les inventer avant le plateau dense reproduirait le
défaut que F25 interdit (une boîte qui ne coïncide pas avec ce qui est dessiné). **Instance
Belliard visée : `WALKER_COUNT = 4`, bornes `[2, 6]`** — sous 2 la rue est morte, au-dessus de 6
les fenêtres d'avertissement de F26 se recouvrent et le premier plan devient un rideau. Authorées
en **Rev. 6.6** avec le plateau, sous les planchers **F24-F27** qui, eux, sont décidés ici et
sont vérifiables sur la livraison.

> **Plafond de pression, pour que la donnée à venir ait une borne :**
> **F28 — le temps total pendant lequel un candidat donné est occulté au-delà du seuil est
> `≤ 15 % de sceneDuration` (9,0 s sur 60,0).** Au-delà d'un sixième de la scène, l'occultation
> cesse d'être un événement et devient une taxe de fond — le contraire exact de ce que
> l'anticipabilité achète.

#### A17.7 — Critères d'acceptation ajoutés (stage 5)

- **AC25 — Le masquage compte, et il se voit venir.** (a) Une photo tenue, cadrée, dans la
  fenêtre, avec un marcheur couvrant **≥ 25 %** de la boîte, revient **`obstructed`** et **jamais**
  `MASTER` ; à **< 25 %**, elle revient `MASTER`. (b) L'état `blocked` est présent **pendant toute**
  la période où T6 est faux, et le joueur peut donc **choisir** de ne pas déclencher. (c) T6 ne
  remet **pas** le hold à zéro : dès que le marcheur a dégagé, la photo part immédiatement
  (delta-assert sur le compteur de hold à travers le passage). (d) La vignette de la planche
  **montre le marcheur** qui a produit le tampon.
- **AC26 — Déterminisme des marcheurs (F11, AC10).** Même `swaySeed` + même séquence d'entrées ⇒
  positions de marcheurs **byte-identiques** entre deux runs, entre framerates, et entre
  tentative 1 et tentative N. Aucun spawner, aucun `Math.random`/`Date.now` (grep-asserté).
- **AC27 — F3 survit, et c'est mesuré et non supposé.** (a) Assert sur la donnée : chaque instant
  a son allée dégagée ≥ 1,2 s dans sa couverture (F24), et **zéro** occultation du master sur
  `[36,5 ; 38,0]` et `[53,0 ; 55,9]`. (b) En playtest : **une course complète master + 2 bonus à
  zéro suspicion et zéro `obstructed` est réalisée**, aiguille jamais quittée du repos. Un F24
  vert avec une course impossible est un échec de cet AC, pas une tolérance à élargir.
- **AC28 — Aucun tampon ne ment, y compris sur les marcheurs.** Une photo parfaitement cadrée sur
  deux marcheurs revient **`nothing-here`** et **jamais** `out-of-frame` ; un candidat à moitié
  dans le cadre revient `out-of-frame`. L'ordre de précédence de §A17.6 est unit-testé **rang par
  rang**, y compris le cas ambigu « obstrué **et** hold rompu » ⇒ **`obstructed`**.
- **AC29 — Anticipabilité au pire focal (F26).** À **251 mm**, cadré au sweet spot sur LA PLAQUE :
  la masse dessinée d'un marcheur est visible dans le viseur **≥ 1,00 s** avant que le tampon
  ne bascule. Mesuré à `verify`, image par image, sur le marcheur le plus rapide de la donnée
  authorée. En dessous, la valeur à bouger est `OCCLUSION_PENUMBRA_MIN` ou `WALKER_SPEED_MAX` —
  **une seule à la fois**, jamais `OCCLUSION_REJECT_RATIO`.

---

| Rev.     | Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1        | 2026-08-01 | Initial spec.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **2**    | 2026-08-01 | **K-1** F5 re-derived against **effective** slack (formula pinned in §3.3), `SWAY_AMP_X` 2.4 → **2.00 su** + dependent constants, F5 becomes a **three-leg** floor (sway share / untracked grace / pan authority), new `PAN_RATE_MAX`. **K-2** the full **9-keyframe `subjectTrack` table** is authored (§2.5) and floor **F12** added in three legs. **K-3** F10 becomes a **compound** floor against the gated `SHIELD_BREAK_LULL_CUT`, `rewardMultiplier` is **phase-scoped and Niveau-Final-scoped**, tiers re-tuned ×0.90/×0.80, R1 transcribed as **AMENDMENT A1** (§D7.2). **K-4** the **decline exit** is specified (§1.3) and the ≤ 2 min attempt budget becomes floor **F13** + AC13.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **3**    | 2026-08-02 | **Relocation to Belliard** (Bertrand, override of R-10): sound cover re-derived on the **traffic-light cycle** (§4.1, `TRAIN_*` → `WAVE_*`, period re-derived from a 42 s two-phase cycle, **windows unmoved**), keyframe staging re-read on the **passage / reverse-out** geometry (§2.5, **no value moved**, two new art constraints), run-scoped carry renamed `Belliard → Niveau Final`, all Stalingrad/quai/métro references purged. **C-2** fixed: §1.2 posture is the T-2 **device fork**. No floor, window, keyframe or tier value changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **4**    | 2026-08-02 | **D-1 closed** (delta gate): the set-piece is INSIDE the mission, so its frozen time is now **bounded** — `PHOTO_MAX_ATTEMPTS = 2` mission-scoped, `BRIEFING` on attempt 1 only (retry = 62.8 s), new floors **F14** (150.6 s / composed 262.1 s = 4.37 min) and **F15** (8.0 s frozen-scene separation), `triggerAtElapsedSeconds = **2.5 s**` frozen for lane A. Rulings **R3-1** (21.0 s is the wave interval, 42 is never a value; two waves same duration/attack), **R3-2** (prohibition: nothing on the plate encodes cover but the headlights), **R3-3** (`BRIEFING` added to §1.1, carries the ellipse), **R3-5** (`enabledOnFirstRun = false`), **R3-6** (no rarity) acted. **C-5/C-6/C-7/C-8** fixed, **N-2** specified (§7.2.a), **AC14** and **AC15** added. **No window, keyframe, floor value or tier moved.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **5**    | 2026-08-02 | **D-1b closed** (gate arbitrage A-2, T-6): **F14 rewritten in wall-clock** under **G-4** — `90 + Σ attempts(authored frozen + sheet budget) + 21.5` ≤ **280 s** ⇒ **279.1 s = 4.65 min**, reserve **20.9 s**. Re-tuned the two reading constants — `PHOTO_BRIEFING_MAX_SECONDS` 25.0 → **15.0 s**, `CONTACT_SHEET_READ_BUDGET` 30.0 → **20.0 s** — plus one new **design** budget, `CONTACT_SHEET_DECISION_BUDGET = 7.0 s` (the sheet a player _retries from_ is judged, not read; §1.3.a-bis decision 3). Decision 3's measured ceilings are now **derived formulas**, not posed numbers (gate point 3). `PHOTO_MAX_ATTEMPTS` stays **2**, `ACTIVE` untouched, Decision 6 unchanged. **§1.3.b** answers the audio spec's open question: the tension BGM **ducks −24 dB, it neither stops nor continues at level** — behaviour, not level data. **C-9** applied. F14a (authored) now 140.6 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **6**    | 2026-08-05 | **PIVOT DENSITÉ + LEURRES (Bertrand)** — §A. `subjectTrack` (une boîte) → **`candidateTracks`** (1 `master` + 3 `decoy`, même forme, F16) ; **désignation par centrage** `C*(t)`, purement géométrique, aucune fuite sémantique (A.3) ; T2 réécrit + `rejectReason` **`wrong-subject`** (A.4) ; **leurres pleinement photographiables, prix = 1 pose, aucune surtaxe** (A.5) ; `filmCount` 6 → **8**, F6 re-dérivé ; **briefing = signalement à 2 critères** + interdits de pointage (A.6) ; `FILL_MIN`/zoom **inchangés et vérifiés** — au remplissage légal un leurre ne peut jamais entrer entier dans le cadre (A.7) ; **triptyque conservé, refus d'un 4e instant** pour raison de budget mur (A.8) ; nouveaux planchers **F16/F17/F18/F19**, F12 et §7.2.a généralisés × 4. **CASSES ESCALADÉES (A.9) :** `PHOTO_BRIEFING_MAX_SECONDS` 15,0 → **20,0 s** et **F14b = 289,8 s > 280 s à 2 tentatives** ⇒ recommandation **`PHOTO_MAX_ATTEMPTS` 2 → 1** (220,0 s, réserve 80 s), qui retire la forme A-1 ratifiée ⇒ **décision Karim + Bertrand**. **Contrat typé modifié : ce n'est PAS un drop-in pour lane A.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **6.1**  | 2026-08-05 | **Reprise réglable + fiction terrasse.** §A.12 : `PHOTO_MAX_ATTEMPTS` sort des constantes et devient **`maxAttempts`, donnée authored** (Bertrand : « sois flexible sur le nombre de retry ») ; **la forme A-1 à deux CTA n'est pas supprimée, elle est conditionnée** par la valeur (lane A a déjà `retryOffered`, lane B a déjà les deux formes ⇒ **rien à recoder**) ; **F14 devient paramétrée `F14b(n)`**, assertée sur la donnée (rouge en CI si illégale) ⇒ **max légal = 1** (220,0 s, réserve 80 s), **2 = 289,8 s ✗ et exige ~9,8 s rendues par le plan otage ou `pm` — aucun levier de game design ne les fournit** (démonstration chiffrée A12.4) ; départ authored **1**, réglable ; **AC21**. §A.13 : triptyque relu sur la **terrasse** — ARRIVÉE et **L'ÉCHANGE → LE GESTE** passent **sans qu'une valeur bouge** (même AABB, ensemble énuméré différent), **LA PLAQUE casse si la berline est immobile ⇒ escalade n°5** (reco : elle **repart** sur `[53,0 ; 55,9]`, coût zéro) ; les **7 tables** adoptées ⇒ `DECOY_COUNT_MAX` 4 → **6**, nouveau plancher **F20 « pas de cible orpheline »**, F17 revérifiée sur un pas de terrasse (**11,5 su ≫ 6,0**), §A.7 renforcée, contrôle §7.2.a **× 7**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **6.2**  | 2026-08-05 | **Le discriminant n'est plus le visage, c'est la SCÈNE** (§A.14, décision gate art : le Commandant shippé est chauve et rasé ⇒ aucune reconnaissance faciale possible). Le signalement passe de **2 critères** à **3 signaux conjonctifs** (voiture de service en double file / parapheur + tailleur / déroulé) — **la forme de §A.6 tient, son contenu change**, et le zoom sert désormais à **vérifier une hypothèse construite au grand-angle** au lieu de filtrer des visages. **Risque majeur identifié et fermé par un plancher : le signal le plus fort (le départ, ~53 s) arrive 12,7 s APRÈS la fermeture de la preuve maîtresse (40,3 s)** ⇒ **F21 « suffisance sans le signal tardif »** (`1 ∧ 2` identifie dès ~11,0 s, marge 17,5 s) ; le signal tardif ne paie plus que **LA PLAQUE**, un bonus — même structure que F3. **F19 : 6,0 → 8,0 s** (deux trajets d'optique) et son repère passe du **premier** `openAt` à **`masterOpenAt`** (ARRIVÉE devient un beat « parier ou attendre », coût max 1 pose sur 8). **`briefingMaxSeconds` 20,0 → 18,0 s** (escalade n°1 **allégée**, non refermée) ⇒ `F14b(1) = 218,0 s` ✓, `F14b(2) = 287,8 s` **toujours ✗** — **le pivot n'a pas payé la reprise**. Nouveau **F22 « aucun leurre ne porte les deux signaux précoces »** (sans quoi F21 tombe par la porte de derrière) ⇒ distribution 2/2/2 sur **exactement 6 leurres**, `DECOY_COUNT_MAX = 6` devient une **contrainte** et non un plafond. **AC22.** Les voitures sont des props, pas des candidats : le coût §7.2.a reste ×7.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **6.3**  | 2026-08-05 | **LE DÉPART = LA PLAQUE** (§A.15, trou trouvé par l'art : le signal n°3 de §A.14 n'avait ni boîte, ni instant, ni piste — à moi). Tranché : le départ **EST** l'instant LA PLAQUE, la **translation de `berline_double_file`**, **déjà authorée** par le segment K5→K8 de §2.5 (K5 il se lève / transit il rejoint la voiture, **elle reste** / K6-K7 la berline s'en va = `[53,0 ; 55,9]` / K8 fin de scène). **Aucune donnée nouvelle : ni keyframe, ni boîte, ni instant, ni `pxPerSu`** — la berline réutilise celui des keyframes de plaque, et **E-6(5)/(6) restent vrais par construction** (même sprite qui translate). **F21 devient vrai par IDENTITÉ, plus seulement par les dates** : signal tardif et bonus tardif sont le même objet dessiné, donc rendre le signal 3 nécessaire rendrait nécessaire un **bonus**, ce que F3 interdit — un plancher qu'aucun re-authoring de fenêtre ne peut désynchroniser. **Option (b) « pose non photographiable » refusée et documentée** : elle échappe au coût **temps** mais pas à **F20** (elle se lirait comme photographiable ⇒ piste + contrôle en intervalle ⇒ coût art/outillage intégral) et serait un signal fort qu'on interdit de photographier. **Escalade n°5 CLOSE** (Bertrand : la berline repart) ⇒ §A.13.2 superseded, coût mécanique nul. **F20 revérifié** : la femme seule à table n'est pas un groupe de ≥ 2 ⇒ pas de 8e piste, coût §7.2.a reste ×7. **AC23.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **6.4**  | 2026-08-05 | **Les signaux deviennent des RELATIONS AUTHORED** (§A.16 — trou trouvé par l'art sur `decoy_table_c` : le gate lui a retiré le signal n°1 **sans qu'un caractère de sa chaîne de prompt ne change**, parce que le signal vit dans le **placement d'une berline**, pas dans le sprite de la table). Nouveau **`signalBindings`** = `{ signal, carrier: prop\|event, candidate }[]` : **F22 devient assertable sur la donnée** (aucun leurre ne porte `1 ∧ 2`), **F22b** transforme la distribution 2/2/2 en **décompte exact** (9 bindings, `∀ decoy :                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | signals | === 1`), et nouveau **F23** relie la relation au placement (`SIGNAL_BIND_RADIUS = 4,5 su`de son candidat,`SIGNAL_EXCLUSION_RADIUS = 6,0 su`de tout autre, cohérence`4,5 + 6,0 = 10,5 ≤ 11,5`assertée). ⇒ **il n'existe plus de chemin où déplacer un prop fait s'effondrer F21 en silence** : soit le binding suit et F22 rougit, soit il ne suit pas et F23 rougit. **Instants authorés** : swap`commandant_table_apres` **52,2 s** (placé **dans le transit** K5→K6, le seul intervalle du segment où F12(1) n'est pas asserté ponctuellement, et **strictement après le tell #3** pour ne pas être un tell non authored) · retraits leurres **D5 50,4 s** / **D6 52,0 s** (encadrent le tell #3 à ±0,8 s ⇒ **F18 couvert sur le tell #3 seulement** — tells #1 et #2 **restent dus**, Rev. 6.5). Un leurre retiré **garde sa piste** (F12(3) non négociable) et **F17 tient à la position de repli**. **AC24.** |
| **6.5**  | 2026-08-05 | **LES PASSANTS DEVIENNENT DES MARCHEURS DE PREMIER PLAN** (§A.17, décision Bertrand : « est-ce que ça peut être des vrais perso qui marchent et qui seraient pris dans la perspective de la photo ? » ; contrainte de premier plan tranchée avec le gate). Nouvelle collection authorée **`walkerTracks`** (même forme que `candidateTracks`, interpolée, totale sur `[0,60]` mais **autorisée hors plateau** — F12(3) ne s'y applique pas ; **jamais des candidats** : `C*` ne les énumère pas, F16/F17/F22b/§7.2a×7 inchangés). **Question 1 tranchée : option (c)** — nouveau test **T6 « DÉGAGÉ »**, `OCCLUSION_REJECT_RATIO = **0,25**` (dérivé : rougit 10 pp **avant** qu'un visage soit perdu à L'ÉCHANGE ; domine `SUBJECT_BOX_TOLERANCE` ×4,7 au pire cas), calculé **en coordonnées plateau donc zoom-invariant**, sur le **noyau solide seul**, et **il ne remet PAS le hold à zéro** (le hold est une propriété de l'outil, l'occultation une propriété du monde ⇒ un passage coûte sa durée, pas sa durée + 0,35 s). (a) refusée (tolérance + « scène habitée »), (b) refusée car **elle ment dans l'autre sens** (tampon `MASTER` sur une vignette montrant un dos). **Question 3 fermée par un plancher : F24 « allée dégagée »** `CLEAR_AISLE_FLOOR = 1,2 s` sur `instant ∩ couverture` ⇒ **la course parfaite à zéro suspicion reste garantie** — instance Belliard **plus stricte** : **zéro occultation du master sur `[36,5 ; 38,0]` et `[53,0 ; 55,9]`** (L'ÉCHANGE n'a que 1,5 s couvertes ; LA PLAQUE est déjà à F5b 116 %). **Le vrai risque nommé et fermé : à 251 mm le champ fait 13,9 su ⇒ 0,3 s d'avertissement, le premier plan seul NE SUFFIT PAS** ⇒ **F26** `OCCLUSION_WARNING_FLOOR = **1,00 s**` (= `FOCUS_HOLD + SHUTTER_ARM + 0,25`), payé par la **pénombre de flou** (`OCCLUSION_PENUMBRA_MIN = 3,0 su`, dessinée, **jamais comptée** dans T6) ⇒ **`WALKER_SPEED_MAX = 8,0 su/s`** par arithmétique (≈ 0,77 m/s : le tarif de l'anticipabilité à ×10 ; +1,0 su de pénombre achète +1,0 su/s). **F25** (noyau dessiné == boîte, contrôlé en intervalle) · **F27** (`v ∈ [3,0 ; 8,0] su/s` **toujours** — un figurant arrêté rouvre F20 pour de vrai) · **F28** (occultation ≤ 15 % de la scène). **Question 4 confirmée + F20 recolmaté à la racine** : nouveau **`rejectReason` `nothing-here`** (aucun candidat n'intersecte `V`) qui **resserre `out-of-frame`** ⇒ photographier deux marcheurs produit un tampon **vrai**, donc **les groupes de marcheurs redeviennent autorisés** (la rue vivante) tant qu'ils **marchent**. Nouveau **`obstructed`**, et **ordre de précédence des motifs authored** (tous les mécaniques avant tous les sémantiques = §2.4 transcrite). **`F14` INTACT — zéro seconde ajoutée** (condition d'entrée du pivot, réserve déjà négative à 2 tentatives). **Coûts nommés, non absorbés :** 5e état de brackets **`blocked`** (Tony) — **dépendance dure : sans lui, F6 doit être re-dérivé et 8 est déjà le plafond UX** ; nouvelle famille d'assets marcheurs (`WALKER_SCALE_MIN = 1,35 ×` la figure debout ⇒ ≥ 18,2 su, dérivé de la diagonale 60 m de la fiction) ; **2 contrôles d'outillage nouveaux** dont un croisement `walkerTracks × candidateTracks` ; **reduced motion : les marcheurs ne sont PAS ralentis** (ce serait manger F24) ⇒ arbitrage a11y à Tony. Keyframes **non authorées ici** (même raison qu'en §A.2) ⇒ **Rev. 6.6** avec le plateau, `WALKER_COUNT = 4`, bornes `[2, 6]`. **AC25-AC29.** |
| ratified | —          | Carried unchanged from round 1 per the gate: `SPOTTED` → contact sheet, `SUSPICION_SHUTTER_EXPOSED +34` with **no decay**, `filmCount = 6`, `FOCUS_HOLD = 0.35 s` HOLD model, D1.a/D1.b, floors F1/F2/F3/F4/F6/F7/F8/F9/F11. **Not re-opened here.** (R-10's host level is the **one** ratification Bertrand overrode — Rev. 3.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Design source (DECIDED upstream, not re-opened here):**
[`docs/adr/0077-qte-photo-paparazzi-set-pieces.md`](../adr/0077-qte-photo-paparazzi-set-pieces.md)
— authored set-pieces (D1), verb = cadrer + zoomer + déclencher in a dedicated full-screen
view with the world paused (D2), zoom = fill-the-frame validation **+** sway (D3), hybrid
briefing (D4), multi-moment scene with exactly one master proof (D5), tension = suspicion
gauge fed by shutter noise vs. sound cover **plus** finite authored film (D6), spotted =
scene aborted + checkpoint retry, no death (D7), two-beat feedback — mechanical at the
shutter, semantic at the contact sheet (D8), dedicated 2D backdrop + key-pose sprites (D9).

**Sister specs this one is aligned to (read them, they are load-bearing):**

- `docs/game-design/spec-photo-qte-fiction.md` (`narrative-designer`, Yasmine) — **Rev. 3** —
  the first set-piece is **le Commandant encaissant une enveloppe dans la bouche du passage,
  rue Belliard** (`x_norm 0,372–0,408`), shot from a **lucarne de toit en haut de la rue**
  (diagonale de 60-70 m, ce qui justifie le 300 mm); triptych **ARRIVÉE** (bonus) /
  **L'ÉCHANGE** (master proof: _two faces AND two hands in frame_) / **LA PLAQUE** (bonus,
  max focal on a moving subject); sound cover = **the traffic-light cycle of the crossroads
  at the top of the street** (fiction §2.3); reward invariant = **"moins couvert", jamais
  "moins de PV"**.
- `docs/game-design/ux/photo-qte-controls.md` (`ux-designer`, Tony) — four verbs (viser /
  zoomer / déclencher / **lever-baisser** l'appareil, hold-to-raise), suspicion **needle**,
  AF **brackets that read composition only, never the verdict**, film ≤ 8 for a
  no-pagination contact sheet, reduced-motion = slow drift at comparable difficulty.

**Cahier des charges verdict: [EXTENSION]** — conscious, documented. Prohibition (Atari ST, 1987) had no photo mini-game and no camera verb; ADR-0077 already records the extension and
its justification. The core loop `Récupérer → Livrer → Éviter` is **untouched**: the
set-piece plays **inside the Belliard mission, at the very start of the night, before the
first `Récupérer`** — it is **not** a pre-level scene and the word "pré-niveau" is false
since Rev. 3 (**C-5**, gate ruling R3-3: the climb to the lucarne and the way back down are
elided by the `BRIEFING` phase, §1.1). It adds no rule to `Éviter` and is **never a gate**
(§7). This spec adds no loop verb.

**Rev. 4 — what "inside the mission" costs, and how it is paid.** Encasting the set-piece in a
90 s mission puts frozen time inside the "une mission = 3-5 minutes" promise. That is **D-1**,
the gate's blocking condition, and it is closed by a **bounded** re-entry budget: §1.3
(`PHOTO_MAX_ATTEMPTS`), floors **F14/F15** (§7), the authored trigger value (§8) and **AC15**
(§9). Nothing else in the spec moved.

**No code here.** Every number is a `game-designer` default, tunable, with its rationale,
to be transcribed into `src/game/**` by `dev-gameplay` (pure, TDD) and drawn by
`dev-r3f-render`. I touch nothing outside `docs/game-design/`.

---

## 0. World frame the numbers live in (read once)

The telephoto view does **not** zoom into the parallax level layers (ADR-0077 Context: they
are not authored for ×10). It renders a **dedicated 2D scene plate** — one authored
backdrop + key-pose sprites (D9). All the geometry below lives on that plate, in its own
coordinate space, and never touches `WORLD_HEIGHT`/street coordinates.

| Frame element       | Value                                             | Note                                                                           |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Scene plate         | `100.0 × 56.25` **scene units (su)**, 16:9        | `x ∈ [0,100]` left→right, `y ∈ [0,56.25]` bottom→top. One plate per set-piece. |
| Viewfinder rect `V` | centred on `viewfinderCentre`, width `fovW`, 16:9 | Always clamped fully inside the plate.                                         |
| Focal `f`           | `FOCAL_MIN 35 mm` → `FOCAL_MAX 300 mm`            | Diegetic: the UX "300 mm" label (fiction §4.2) IS `FOCAL_MAX`.                 |
| Magnification law   | `fovW(f) = 3500 / f` su                           | `f = 35` ⇒ the whole plate; `f = 300` ⇒ `fovW = 11.67 su`.                     |
| Scene clock         | `sceneClock`, seconds, monotonic                  | The **only** cadence input. Everything authored is a function of it.           |
| World outside       | **paused** (ADR-0030/0034 shell)                  | No street sim, no enemies, no energy movement — see §6.4.                      |

**Primitives reused from the shipped QTE family** (do NOT re-derive): the forward-only phase
machine shape; the establishing hold (`QTE_ZOOM_SECONDS 2.0`) and the result hold
(`QTE_RESULT_HOLD 2.2`); the **closed-form hashed-waypoint** deterministic motion model
(ADR-0034 Rev. 3 — no `Math.random`, no `Date.now`, no per-tick PRNG cursor); the
"floors are asserted in code against authored data, never trusted" discipline (ADR-0035 D2);
the WYSIWYG classify order (resolve player input against the state the render **drew**, then
advance the sim).

**Primitives deliberately NOT reused:** `COVERED ↔ PEEKING`, the ring hit test, the anatomy
colour zones, the energy ledger, `blownPeeks`. This QTE is non-lethal: nothing is shot,
nothing loses HP, energy does not move (§6.4). Sharing the _shape_ of the shell is right;
forking the _lethal_ primitives into it would be the silent-fork the ADR's Consequences
section warns the review panel about.

---

## D1 — The set-piece state machine (DECIDED)

Forward-only, exactly like the house shell. The posture toggle the UX spec delegates to me
(`ux/photo-qte-controls.md` §1.4) is a **sub-machine inside `ACTIVE`**, not a top-level phase.

```
BRIEFING ──► ESTABLISHING ──► ACTIVE ──┬─► SPOTTED   ─┐
   2.0 s                  ├─► ROLL_END   ├─► DEVELOPING ──► CONTACT_SHEET ──► DONE
                          └─► SCENE_END ─┘     0.8 s          (player CTA)
```

### 1.1 Top-level phases

| Phase           | Enter when                           | What runs                                                                                                                                                                                                                                              | Exit                                                                   |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `BRIEFING`      | set-piece triggers (attempt 1)       | The hybrid briefing (ADR-0077 D4). `sceneClock` frozen at 0, suspicion frozen, no camera. **Carries the ellipse of the climb to the lucarne and of the way back down** (R3-3). Skippable at any time by the player, **never absent from the machine**. | player skip, or `PHOTO_BRIEFING_MAX_SECONDS = 25.0 s` → `ESTABLISHING` |
| `ESTABLISHING`  | `BRIEFING` exits, or **retry entry** | The wide plate holds, unzoomed. Camera **forced LOWERED**, shutter inert, `sceneClock` **frozen at 0**, suspicion frozen.                                                                                                                              | after `PHOTO_ESTABLISH_SECONDS = 2.0 s` → `ACTIVE`                     |
| `ACTIVE`        | —                                    | `sceneClock` runs; the authored cadence (§3) plays; the posture sub-machine (§1.2) is live.                                                                                                                                                            | one of the three terminal conditions below                             |
| `SPOTTED`       | `suspicion ≥ SUSPICION_MAX`          | Targets scatter. Terminal, **non-lethal** (D7).                                                                                                                                                                                                        | → `DEVELOPING`                                                         |
| `ROLL_END`      | `film === 0` (after the decrement)   | The roll is finished; the scene is over for Muf whatever happens in the passage.                                                                                                                                                                       | → `DEVELOPING`                                                         |
| `SCENE_END`     | `sceneClock ≥ SCENE_DURATION`        | The berline is gone. The passive-failure route: a player who never presses ends here.                                                                                                                                                                  | → `DEVELOPING`                                                         |
| `DEVELOPING`    | any terminal                         | `PHOTO_DEVELOP_SECONDS = 0.8 s` mechanical beat (wind-on / cut to black). No input.                                                                                                                                                                    | → `CONTACT_SHEET`                                                      |
| `CONTACT_SHEET` | —                                    | The verdict (D8). Every frame shot is stamped (§4.4).                                                                                                                                                                                                  | player CTA → `DONE`                                                    |
| `DONE`          | —                                    | **A leaving control, always** (§1.3): `Continuer`/`Décliner` **leaves** the set-piece and resumes the run; `Réessayer` — offered while the attempt budget lasts — restarts it.                                                                         | run resumes, or `ESTABLISHING` on retry                                |

**`BRIEFING` is played ONCE per set-piece entry, not once per attempt (Rev. 4, D-1).** A retry
re-enters at `ESTABLISHING`, never at `BRIEFING`: the player has read the briefing and Muf is
already on the roof — replaying the ellipse of a climb he has not undone is both fiction-wrong
and the single fattest block of frozen time in the attempt (25.0 s of the 87.8 s F13 budget).
This is what makes attempt 2 cost **62.8 s** of authored time instead of 87.8 s, and it is
load-bearing for **F14**. It is a mechanical rule, not a convenience: `BRIEFING` is entered iff
`attemptIndex === 0`.

**Establishing is forced-LOWERED on purpose.** It gives the player the wide read of the
scene before any commitment, it makes the raise gesture the first thing they do, and it
guarantees the suspicion needle and the film counter are seen at rest before either moves.

**`SPOTTED` reaches the contact sheet — answering the UX open flag (`photo-qte-controls.md`
§4).** It does **not** bypass it. Rationale, and this is a real design call: the contact
sheet is the _only_ channel through which the player learns whether their frames were valid
(D8 withholds it everywhere else). A player who is spotted has just made the biggest
mistake available to them and is the player who most needs the diagnostic. Skipping the
sheet on `SPOTTED` would manufacture exactly the failure mode ADR-0077's Consequences
section flags for stage 5 ("players must not burn full film rolls unknowingly"). The sheet
shown on `SPOTTED` is the same sheet, truncated to the frames actually shot, with the
`Réessayer` CTA. Fiction variant (c) already covers the copy.

### 1.2 Posture sub-machine (inside `ACTIVE`) — `LOWERED ↔ RAISED`

**Raise/lower is a DEVICE FORK, not one binding (C-2, Rev. 3).** `ux/photo-qte-controls.md`
§1.4 corrected this at round 2 (T-2, blocking) and §6.3 of this spec adopts the UX bindings
unchanged — so the fork is what I spec against:

| Device      | Binding (UX §1.4, T-2)                                               | Posture semantics                                         |
| ----------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| **Desktop** | **Hold Space** — press-and-hold, released = lower.                   | `RAISED` while held.                                      |
| **Mobile**  | **Tap-to-toggle** a fixed on-screen button (≥ 44×44 px, thumb zone). | One tap raises, one tap lowers. **No sustained contact.** |

Rev. 2 said "a held on-screen button on mobile", which contradicted the UX spec it claims to
adopt — that was C-2 and it is corrected here. The mechanical model is **identical on both
devices**: `LOWERED` is the default and the resting state, and every rule below (`raisedElapsed`,
`SHUTTER_ARM_SECONDS`, sway reset, suspicion freeze) reads the **posture state**, never the
input that produced it. `raisedElapsed` therefore starts at the raise **event** on both devices;
nothing in D1.a/D1.b/D1.c depends on a finger staying down.

One consequence I own (the gate's playtest watch item): on mobile a sway re-roll costs **two
taps** instead of a press-release. D1.b's 0.40 s arm still lands the re-raise at `u = 0.73` of
the first sway leg, so the anti-spam argument survives the fork on paper — **AC6c and AC10
must confirm it in the built game on a mobile viewport**, and if re-rolling dominates there,
the fix is a raise-index term in the sway hash, not a change to the binding.

| Property        | `LOWERED` (safe)                                                 | `RAISED` (committed)                     |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| View            | Wide preview of the whole plate (reacquire where the action is)  | The viewfinder rect at the current focal |
| Focal **value** | **RETAINED** (see below)                                         | Live, player-adjustable                  |
| Sway            | **zero**, path reset                                             | Accrues from `raisedElapsed` (§2.3)      |
| Shutter         | **inert** — swallowed, no film, no noise, no suspicion (UX §1.3) | Armed after `SHUTTER_ARM_SECONDS` (§1.3) |
| Suspicion       | **frozen** (no rise, no decay — UX A5 verbatim)                  | Can rise, on shutter releases only (§5)  |
| `sceneClock`    | **runs** — the street does not wait for you                      | runs                                     |

**D1.a — The focal value survives a lower/raise; only the displayed view changes.** The UX
spec says the viewfinder "retracts to a neutral, un-zoomed wide preview" — that is the
_view_. If the _setting_ were also reset, the free bail-out (UX §3.4) would cost a full
zoom traverse to undo, and players would stop using it, which destroys the escape hatch the
accessibility envelope depends on. **Decision: `focal` is retained across posture changes.**

**D1.b — `SHUTTER_ARM_SECONDS = 0.40 s` (anti-exploit, and diegetic).** The shutter stays
inert for 0.40 s after each raise. Without it, tap-raise → immediate click would be a strict
dominant strategy: the sway path restarts at zero offset **and zero velocity** on every
raise, so spamming the posture toggle would hand the player a permanently perfect frame.
With a 0.40 s arm delay against a `SWAY_LEG_DURATION` of 0.55 s, a freshly-raised camera
arms at `u = 0.73` of the first sway leg — i.e. at the _fast_ part of the drift, the worst
moment. Spam is therefore strictly worse than committing. Diegetically it is just "the
camera has to reach your eye". A player who holds the raise is never affected.

**D1.c — Lower/raise spam is not otherwise punished.** No suspicion cost, no film cost, no
cooldown. The only thing it costs is _time_, and time is bounded by the pose cadence (§3),
which never pauses. That is the whole anti-abuse budget, and it is the non-punitive kind.

### 1.3 The exits from `DONE` — implementing "bonus, jamais gate" (**K-4**)

**Round 1 hole, and it was a real one.** Rev. 1 offered `Continuer` on a master proof and
`Réessayer` otherwise. A failing player therefore had exactly one button and it said _do it
again_ — which makes the set-piece a gate in the built screen, whatever §D7 and fiction §5.3
assert in prose. An invariant that is only written down is not implemented.

**Decision: `DONE` always offers a control that LEAVES, and it is always the primary one.**
While the attempt budget lasts (§1.3.a) it offers exactly two, the second being `Réessayer`;
once the budget is spent, the leaving control is alone.

| Roll outcome                                                 | Leaving control          | Second control                    | Boss state carried out                     |
| ------------------------------------------------------------ | ------------------------ | --------------------------------- | ------------------------------------------ |
| Contains a `MASTER` frame                                    | **`Continuer`**          | `Réessayer` — **iff budget left** | `photoOutcome = master` / `master+bonus`   |
| No `MASTER` frame (incl. `SPOTTED`, `ROLL_END`, `SCENE_END`) | **`Décliner`** (decline) | `Réessayer` — **iff budget left** | `photoOutcome = none` ⇒ **×1.00 baseline** |

- **C-9 (Rev. 5) — R2-5 Ruling B, verbatim, replacing Rev. 2-4's "the leaving control is the
  default/primary focus":** the leaving control is **always present, always one press, never
  subordinate** — _not_ "primary". Concretely, per the gate's A-1: master branch ⇒ **one** CTA
  `[ CONTINUER ]`; no master with budget left ⇒ **two paired CTAs**, same row, identical visual
  weight, **neither styled primary**, with **initial keyboard/gamepad focus on
  `[ RECOMMENCER ]`** and `[ LAISSER TOMBER ]` reachable in **one press** at all times (never
  nested, never behind a confirmation, never on a second screen); no master with budget
  exhausted ⇒ `[ RECOMMENCER ]` **absent from the DOM**, `[ LAISSER TOMBER ]` alone. Initial
  focus is a cursor start point, not a hierarchy: it prevents a reflex Enter from a player who
  just failed being pre-armed on the decline. Retry is offered, never imposed. (Copy for both
  labels is Yasmine's, gate condition F-1; the fiction already writes the decline as variant (c)
  _« Alors ils remettront ça. Ils remettent toujours ça. »_ — an acceptance, not a retry.)
- **`Décliner` is one press, and the run continues** from where the set-piece interrupted it,
  with the **Belliard** delivery intact and the Niveau Final boss at baseline. No penalty, no
  energy, no score, no quota (§6.4, F8). Declining is a legal way to play the game.
- **Retry is bounded — `PHOTO_MAX_ATTEMPTS = 2` per Belliard mission attempt (Rev. 4, D-1).**
  See §1.3.a. Rev. 2's "retry is not rate-limited, but it is budgeted" was written when the
  set-piece **preceded** the mission; encased in it, an unbounded loop breaks "une mission =
  3-5 minutes" at the first extra try. Floors **F13** (one attempt) and **F14** (all attempts
  - the composed mission) now bound both legs.
- **`PHOTO_BRIEFING_MAX_SECONDS = 15.0 s` (Rev. 5, was 25.0), skippable at any time** (the copy
  is fiction's, the cap is tuning). `CONTACT_SHEET_READ_BUDGET = 20.0 s` (Rev. 5, was 30.0) and
  `CONTACT_SHEET_DECISION_BUDGET = 7.0 s` (Rev. 5, new) are **design** budgets measured at
  playtest, **never** auto-dismiss timers: a verdict screen that closes itself is hostile and
  would defeat the whole two-beat feedback. Re-tuned in §1.3.a-bis to make F14 true in wall
  clock; the readability rationale for each value is there, not asserted here.

### 1.3.a — D-1 CLOSED: the frozen time inside a Belliard mission is bounded and costed

**The hole, in the gate's own words (D-1).** Rounds 1-2 granted the PASS on "the set-piece is
outside the mission clock, so the 3-5 min constraint is not violated on its face". True at
Stalingrad, where it **preceded** the mission. False at Belliard, where it is **encased**: a
2-8 s trigger inside a 90 s mission, with `[ RECOMMENCER ]` unbounded ⇒ ≈ 5.9 min at two
attempts. I take option **(a)** of the gate's three (bound the re-entries), because it is the
only one that costs a counter and a copy line instead of an architecture (option b re-opens
D-A and D-G) and because it does not weaken the constraint (option c does).

**Decision 1 — `PHOTO_MAX_ATTEMPTS = 2` per Belliard mission attempt.** One entry plus exactly
**one** `[ RECOMMENCER ]`. The counter is **mission-scoped**, not run-scoped and not
save-scoped: leaving Belliard and replaying it gives a fresh budget. That is deliberate and it
is what keeps ruling **R3-6 (no rarity) intact** — the proof stays farmable across runs, it is
merely not farmable **inside one 90 s mission**, which is the only place the 3-5 min promise
is measured.

**Decision 2 — the cap is expressed through the existing gated exit, not a new one.** When
`attemptIndex + 1 === PHOTO_MAX_ATTEMPTS`, `[ RECOMMENCER ]` is **absent** from `DONE` and the
**leaving** control is the only one. The invariant "bonus, jamais gate" therefore holds
**more** strongly at the cap than below it: the last state the player can be in is one press
from the delivery. **R2-5 is untouched** — the two paired CTAs remain the form on the failure
branch **for as long as retry is offered**, i.e. on attempt 1. A one-line copy for the
exhausted state is Yasmine's (§10.3, hand-off F-1b); it is an acceptance, never a scolding.

**Decision 3 — the frozen cost of one attempt, chiffré.** ⚠️ **SUPERSEDED by §1.3.a-bis
(Rev. 5).** The table below is Rev. 4's and it is kept only to make the correction legible: its
"measured wall-clock ceiling" column was **posed beside** the constants instead of **derived
from** them, which is exactly the defect T-6 found. The live numbers are §1.3.a-bis decision 4.

| Attempt                      | `BRIEFING` | `ESTABLISHING` | `ACTIVE` | `DEVELOPING` | **Authored frozen** | Measured wall-clock ceiling (AC13b/AC15) |
| ---------------------------- | ---------- | -------------- | -------- | ------------ | ------------------- | ---------------------------------------- |
| **1** (un-skipped)           | 25.0       | 2.0            | 60.0     | 0.8          | **87.8 s** (F13 ✓)  | ≤ **120 s** with the sheet read          |
| **2** (retry, no `BRIEFING`) | —          | 2.0            | 60.0     | 0.8          | **62.8 s** (F13 ✓)  | ≤ **90 s** with the sheet read           |
| **Total, budget exhausted**  |            |                |          |              | **150.6 s**         | ≤ **210 s**                              |

**Decision 4 — the composed mission, defended against 3-5 min.** ⚠️ **SUPERSEDED by §1.3.a-bis
(Rev. 5) — this is the paragraph the gate ratified and T-6 broke.** Read it as the record of the
error: it sums **authored frozen** time and then defends a **real-time** promise with it, and
its own prose names "the player's own dithering on the contact sheet" inside a 38 s headroom
that the same document prices at 2 × 30 s. The live derivation is §1.3.a-bis.

The played mission is 90 s and
the only other frozen block reachable before it ends is the hostage duel (≈ 21.5 s worst case,
techplan). Authored composition, worst legal case:

> `90 (played) + 150.6 (photo, both attempts) + 21.5 (hostage) = **262.1 s = 4.37 min**` — inside
> 3-5 min, with **≈ 38 s** of headroom under the hard ceiling for loading, transitions and the
> player's own dithering on the contact sheet.

A third attempt would put it at `324.9 s = 5.42 min` — **over**. That single line is why the cap
is 2 and not 3, and it is the number to re-run if any of the four terms ever moves.

**Decision 5 — `triggerAtElapsedSeconds = 2.5 s`, authored window `[2.0, 3.0]`.** The gate pinned
the bottom of `[2, 8]`; here is the mechanical reason rather than the taste. The played time
between the player leaving the contact sheet and the hostage duel freezing the world is
`12 − t_p`. I set a floor — **F15, `FROZEN_SCENE_SEPARATION_FLOOR = 8.0 s` of played time
between the exit of one frozen block and the entry of the next** — because two frozen scenes
4 s apart do not read as a mission, they read as a cutscene with a joystick. At `t_p = 2.5` the
separation is **9.5 s** ✓; at `t_p = 8.0` it is **4.0 s** ✗, which is precisely the value the
gate called indefensible. Why 2.5 and not 2.0: at 2.0 s the player has barely produced one
input and the freeze reads as "the level never started"; 2.5 s buys one full input beat of
Belliard — the street is seen moving under the player's own hand — for 0.5 s of separation the
floor can afford. **Lane A may freeze `triggerAtElapsedSeconds` at 2.5 s.**

**Decision 6 — the Belliard boss branch is explicitly out of this budget, and I say so rather
than hide it.** Behind `BELLIARD_BOSS_ENABLED`, timer expiry opens a boss QTE — a third frozen
block, on a branch where the mission has already run its full 90 s. Its budget is gated
elsewhere and I do not re-derive it here. **Rule: `F14` is stated for `BELLIARD_BOSS_ENABLED =
false`; with the flag on, AC15 measures the composed path and the result comes back to me
before that flag ships.** If it does not fit, the honest lever is the boss branch's own budget
or `PHOTO_MAX_ATTEMPTS = 1` on that configuration — not a silent re-reading of 3-5 min.

**On G-3 (the rule `lead-game-designer` escalated to Bertrand):** this spec satisfies the
bounded-frozen-time condition **whether or not G-3 is adopted**. If G-3 passes, F14 is the
written bound it demands. If Bertrand refuses G-3 and rules that frozen time counts against
3-5 min in full, the composed number above (**4.37 min**) is still inside the constraint. The
design does not depend on the ruling; only the vocabulary does.

---

### 1.3.a-bis — D-1b CLOSED: F14 rewritten in WALL-CLOCK (Rev. 5, gate arbitrage A-2 / T-6)

**The finding is correct and I do not soften it.** `qa-lead`'s T-6 and the gate's A-2 are
arithmetically right, and the defect is mine: F14b summed **authored** phase durations and then
used the result to defend **"une mission = 3-5 minutes"**, a promise about a human sitting in a
chair. The contact sheet is a phase the player is _in_, frozen, for a duration this very spec
publishes (30.0 s) — twice on the two-attempt path. **A bound that excludes a budget the same
document authorises is not a bound.** Inès's two predictions were both true against Rev. 4:
`62.8 + 30 = 92.8 s > 90 s` (attempt-2 ceiling) and `262.1 + 60 = 322.1 s = 5.37 min > 5 min`.

**Decision 1 — I adopt G-4 and restate what F14 measures.** From Rev. 5, the 3-5 min constraint
is evaluated in **wall clock, worst legal case, every frozen block and every published reading
budget included**. F14 becomes that measurement. The authored sum survives only as **F14a**, a
code-assertable sub-leg that now _says_ it bounds authored time and is never offered as the
proof of the constraint. This is the general lesson, not a local patch: **an authored floor may
bound a machine; only a wall-clock floor may bound a promise made to a player.**

**Decision 2 — the levers, and the two the gate forbade.** `PHOTO_MAX_ATTEMPTS` stays **2**
(the retry is the set-piece's only learning step, and it carries E4/H4 and the paired-CTA form
A-1 just restored). `ACTIVE = 60.0 s` is **untouched** — it is the authored cadence that F1-F5,
F12, the 9 keyframes and the three windows all hang from. That leaves the reading times, which
is correct: they are the only durations in the block that measure _a player's eyes_ rather than
_the scene's cadence_, so they are the only ones tuneable without moving a single gameplay value.

**Decision 3 — three budgets, because a sheet you retry from is judged, not read.** Rev. 4 had
one reading budget and the gate's formula spends it twice. That over-prices the two-attempt path
by modelling a player who reads all six verdicts in full **and then presses `[ RECOMMENCER ]`
anyway** — which contradicts the CTA design the gate ratified two hours earlier in A-1, where
initial focus sits **on `[ RECOMMENCER ]`** precisely because the most probable intent after a
failure is to retry. The retry decision is a **stamp-row scan and a press on an already-focused
control**, not a per-frame read. So the terminal sheet (the one the player _leaves_ from) and
the non-terminal sheet (the one they _retry_ from) get different budgets:

| Constant                        | Rev. 4  | **Rev. 5** | Readability rationale (the value is derived from this, not chosen then justified)                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PHOTO_BRIEFING_MAX_SECONDS`    | 25.0 s  | **15.0 s** | French prose at ~200 wpm ⇒ **~50 words ≈ 3 short lines**, which is the size of the ellipse briefing (R3-3) and of Yasmine's F-1 copy. It is a **cap on a skippable screen**, paid at most once per entry (never on the retry, §1.1), so the cap is the _slow reader's_ ceiling, not the pace. Below ~12 s the third line stops landing; 15.0 s keeps a margin. |
| `CONTACT_SHEET_READ_BUDGET`     | 30.0 s  | **20.0 s** | The terminal sheet: 6 frames max (F6) × (thumbnail locate 0.3 s + stamp glance 0.4 s + one-line reason ~2.2 s) ≈ **17.4 s**, + ~2.5 s to weigh the CTAs = **~20 s**. **This is a floor of readability, not a comfortable value** — see decision 6. AC14's "a reason per frame" is only true if the player is budgeted the time to read six of them.            |
| `CONTACT_SHEET_DECISION_BUDGET` | — (new) | **7.0 s**  | The non-terminal sheet: scan the stamp row for "any master?" (6 stamps × ~0.6 s ≈ 3.6 s) + decide + press an **already-focused** `[ RECOMMENCER ]` (A-1) ≈ **7 s**. It is a **design budget, not a timer and not a cap**: nothing prevents a player reading the first sheet in full — that player simply lands on the one-attempt path's numbers instead.      |

Both sheet budgets are **design budgets measured at playtest (AC15), never auto-dismiss
timers** — D8's two-beat feedback and K-4 both die the moment a verdict screen closes itself.

**Decision 4 — F14 in wall clock, the full derivation.** Fixed terms: 90 s played mission,
21.5 s hostage-duel worst case (techplan), `establish + ACTIVE + develop = 62.8 s` per attempt.

> **Worst legal case (2 attempts, briefing un-skipped, full roll, hostage worst case):**
> `90 (played) + 15.0 (briefing) + 62.8 (attempt 1) + 7.0 (sheet 1, decision) + 62.8 (attempt 2)
>
> - 20.0 (sheet 2, read) + 21.5 (hostage) = **279.1 s = 4.65 min**`
>   ≤ **280 s** ✓ — **20.9 s of reserve** under the 300 s hard ceiling, for loading, transitions
>   and the player's own hesitation. (The gate's ≥ 20 s reserve is met, not approximated.)

> **One-attempt path (the common case):**
> `90 + 15.0 + 62.8 + 20.0 + 21.5 = **209.3 s = 3.49 min**` — 90.7 s of reserve.

**Decision 5 — the measured ceilings are now DERIVED, never posed** (gate point 3). Rev. 4's
`120 / 90 / 210` were three numbers written next to the constants; they desynchronised the
moment a constant moved, which is how T-6 was born. From Rev. 5 there are **no posed ceilings**:
AC13(b)/AC15 report against these formulas, evaluated from the constants table.

| Leg (what the stopwatch measures)         | Formula                                           | Rev. 5 value | Rev. 4 (for contrast)               |
| ----------------------------------------- | ------------------------------------------------- | ------------ | ----------------------------------- |
| Attempt 1, **authored frozen**            | `briefingMax + establish + scene + develop`       | **77.8 s**   | 87.8 s                              |
| Attempt 2 (retry), **authored frozen**    | `establish + scene + develop`                     | **62.8 s**   | 62.8 s                              |
| **F14a** — authored frozen, both attempts | `briefingMax + 2 × (establish + scene + develop)` | **140.6 s**  | 150.6 s                             |
| Attempt 1 **wall clock**, terminal        | `77.8 + readBudget`                               | **97.8 s**   | (posed ≤ 120)                       |
| Attempt 1 **wall clock**, non-terminal    | `77.8 + decisionBudget`                           | **84.8 s**   | (not modelled)                      |
| Attempt 2 **wall clock**, terminal        | `62.8 + readBudget`                               | **82.8 s**   | (posed ≤ 90; **92.8** actual — T-6) |
| Set-piece total **wall clock**, exhausted | `84.8 + 82.8`                                     | **167.6 s**  | (posed ≤ 210)                       |
| **F14** — composed mission, wall clock    | `90 + setPieceTotal + 21.5`                       | **279.1 s**  | 262.1 s (authored only)             |

F13 is untouched and still passes with room to spare (`77.8 ≤ 90` ✓, `62.8 ≤ 90` ✓); F15 is
untouched (`12 − 2.5 = 9.5 s ≥ 8.0` ✓); Decision 6 (`BELLIARD_BOSS_ENABLED` out of budget, AC15
on that path returns to me before the flag ships) is unchanged and re-affirmed.

**Decision 6 — the honest risk, named with its trigger rather than buried.** `CONTACT_SHEET_READ_BUDGET
= 20.0 s` is **at the floor of my own readability derivation, not above it**. I am not raboting
below it: the gate authorised me to escalate rather than shave, and 20.0 s is exactly where I
would have escalated. What makes 20.0 s hold at all is `CONTACT_SHEET_DECISION_BUDGET` — without
it, the same reserve target would force `readBudget ≈ 13.9 s`, i.e. a sheet on which the player
can read **four of six** reason lines, which breaks AC14 as surely as an un-telegraphed instant
breaks F2. **The measured trigger:** if AC15/AC14 at stage 5 show players consistently exceeding
20.0 s on the terminal sheet, or failing to name why a frame was rejected, the lever is **not** a
widened budget (that re-breaks F14 the same day) — it is `PHOTO_MAX_ATTEMPTS = 1`, which the gate
reserved to itself with Bertrand, and whose numbers are already on the table above
(**209.3 s = 3.49 min**). I state this now so that the stage-5 measurement has a pre-declared
consequence instead of a negotiation.

### 1.3.b — The tension BGM during the frozen block (Rev. 5 — answers the audio spec's open question)

`sound-designer`'s audio spec (§1.3, §5) refused to guess this and was right to: it is a
**state** question, so it is mine. The set-piece is the sharpest listening moment in the game —
`inCover(t)` must be callable **blind** from the wave alone (audio spec §1.1), and the crisp/dull
click is the sole live channel for T5 (§2.4, D2.a). But the tension BGM is running when the block
freezes, and a hard cut is a rupture the player reads as a bug.

**Decision — the BGM DUCKS. It does not stop, and it does not continue at level.**

| Option               | Verdict     | Why                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continue at level    | **Refused** | The tension tier is periodic and the wave is periodic (`WAVE_PERIOD = 21.0 s`, R3-1). Two competing periodicities is the worst possible masking case for a cue whose entire job is to be counted by ear. It would make the tell (1.8 s, F2) fight a musical accent, and the zero-suspicion perfect run F3 guarantees would exist on paper only. |
| Stop                 | **Refused** | A hard stop on a level where music was playing reads as a failure, not as a transition; and restarting on exit means either a re-seek (audible) or a restart from bar 1 (worse). It also throws away the one thing that makes the return clean: continuity of position.                                                                         |
| **Duck** _(decided)_ | **Taken**   | Clears the ~20 dB of headroom the shutter needs to cut through the loudest wave (audio spec §1.2's own in-mix criterion) while leaving the track playing, so the exit is a gain restore and nothing else.                                                                                                                                       |

**The values (tuning, mine):**

| Value                          | Decision                                                                                                              | Rationale                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FROZEN_BLOCK_BGM_DUCK_DB`     | **−24 dB** (×0.063 of the tier's current gain)                                                                        | Below the affût bed's own floor, so the BGM is present as a room, never as a line. Not −∞: a true zero is a stop, and Malik's bed (§1.3) is what must occupy the silence, not nothing.                                             |
| `FROZEN_BLOCK_BGM_DUCK_IN_MS`  | **1200 ms**, starting on **entry into the block** (`BRIEFING`, or `ESTABLISHING` when the briefing is skipped/absent) | Must be fully down before the first tell can fire. Earliest tell ≥ `ESTABLISHING` (2.0 s) + `WAVE_FIRST_OPEN` — 1.2 s clears it with margin even on the retry path that skips `BRIEFING`.                                          |
| `FROZEN_BLOCK_BGM_DUCK_OUT_MS` | **1600 ms**, starting on the **`DONE` leaving press**                                                                 | Deliberately asymmetric: fast out (get out of the mechanic's way), slow in (returning to a street you must immediately play should not slam). Overlaps the transition back, so the street is already audible when control returns. |

**Scope and edge rules (these are the part that must not be improvised):**

1. **The duck is scoped to the BLOCK, not to the attempt.** `[ RECOMMENCER ]` does **not**
   restore-then-re-duck: a 1.6 s swell followed by a 1.2 s dive on a retry would be a musical
   event announcing a mechanical one. The duck is entered once, at block entry, and released
   once, on the leaving press — across both attempts, both sheets, and `SPOTTED`/`SCENE_END`,
   all of which route through the same `DONE` exit. **One entry point, one exit point.**
2. **The tier must not advance under the duck, and must not be re-selected on exit.** The world
   is frozen (§6.4: energy, score, enemies inert), so any tier that is a function of game state
   is already stable; the requirement is that the exit is a **pure gain restore** — same track,
   same playhead, no re-selection, no re-seek. If the tier at exit ≠ the tier at entry, something
   advanced during a frozen block and that is a bug, not a mix.
3. **Determinism (F11, ADR-0077) is not weakened, and here is exactly why.** The duck is
   **presentation**: no ducking value, ramp position or audio clock may enter `PhotoQte` state,
   feed `tickPhotoQte`, or be visible to the state hash AC10 compares. The ramp may therefore use
   the audio engine's own clock — it is not simulation. Conversely, and symmetrically with the
   audio spec's own refusal: **no audio-side value may ever drive `inCover(t)`**, which reads
   `sceneClock` and nothing else.
4. **Pause / tab-hide.** The existing global mute path applies unchanged. On resume the duck
   state is **re-derived from the current phase**, never resumed from a stored ramp position — a
   half-ramp resurrected after a 10-minute tab-hide is the classic stuck-at-−12 dB bug.
5. **It is BEHAVIOUR (code), not level data.** The rule is a property of _"a frozen block is
   entered"_, not of _"Belliard"_ — a per-level config would let the next set-piece ship with the
   music left on by omission. The three values above are named constants (tuneable); the affût
   bed asset reference is the only per-set-piece **data**. Applying the same rule to the **hostage
   duel**, which crosses the same boundary today without it, is a **follow-up for `pm`** — a
   deliberate scope call, not an oversight, and its absence today is not a bug.

**AC16 (new) — the duck, verified.** At `verify`: entering the set-piece, the tension BGM is
audibly under the affût bed within ~1.2 s and never masks a tell or a shutter click; a retry
produces **no** audible swell between sheet and `ESTABLISHING`; on the leaving press the same
track returns over ~1.6 s at the same tier, with no restart artefact. `H10` (the harness runs
muted) applies: this is an ear check at `verify`, recorded as **CI-DEFERRED**, not a CI gate.

---

## D2 — The validation contract of a photograph (DECIDED)

This is the spec's central deliverable. A shutter release produces a `Frame` record whose
verdict is computed **at the shutter**, on the state the render **drew** (WYSIWYG order),
and **revealed only at the contact sheet** (D8).

### 2.1 The subject track — one continuous box, not per-instant boxes

**Decision: the scene authors a `subjectTrack(t)` — a subject box (centre + size) defined at
EVERY scene time**, keyframed and linearly interpolated. Photographable instants are
**intervals over that same track**, not separate objects.

Why this shape and not "a box only during an instant": the AF brackets (UX §2.3) must read
composition validity **live and at all times**, and they must **not** leak whether the
current moment is incriminating. If the box only existed during an instant, the brackets
would silently become the "something is happening now" tell — a semantic leak that breaks
D8's two-beat promise. With a continuous track, composition validity is _always_ answerable,
and the only secret is which slices of the timeline count. One box function, one live read,
secrecy intact.

**Rev. 2 — the gate found the leak this model re-opens by the back door (K-2b), and it is
real.** A track that interpolates freely between three different subjects makes the brackets
travel toward the _next_ subject before that subject's authored tell fires. The fix is not to
abandon the continuous track (it is the right model) but to **constrain when the track is
allowed to move**:

> **The track is piecewise-constant except during a telegraph.** Between the close of an
> instant and the tell of the next one, `subjectTrack` does **not change at all** — same
> centre, same size. All transit happens inside `[tell(n), openAt(n)]`, i.e. exactly the
> 1.8 s the tell already exists to spend.

Three consequences, all of them good:

1. **The brackets' motion becomes one of the tell's channels** instead of a leak. The player
   who notices the frame start to travel learns _at the tell_, never before it.
2. **No retro-leak either.** The box does **not** relax at `closeAt(n)`, so the brackets never
   announce "a moment just ended" — which would have leaked T2 one beat late. It is why the
   authored staging owes a **hold pose** on every dead beat (§2.5, art constraint).
3. **A transit can never produce a verdict.** F2 guarantees `tell(n) < openAt(n)` strictly,
   so T2 is false for the whole transit: any release fired mid-transit is `no-subject`
   whatever the brackets say. The interpolated box during a tell is a travelling _read_ that
   leads the eye, never a validation claim — which is why F12(1) is asserted at keyframes.

### 2.2 The five tests (conjunctive, in this order)

A shutter input at scene time `t`, viewfinder `V`, focal `f`, subject box `B = subjectTrack(t)`:

| #      | Test            | Condition                                                                                                                       | Shown live?                         |
| ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **T1** | **ARMED**       | posture `RAISED` **and** `raisedElapsed ≥ SHUTTER_ARM_SECONDS`. Fails ⇒ input **swallowed**: no film, no noise, no record.      | yes (brackets absent while lowered) |
| **T2** | **MOMENT**      | `t` falls inside an authored instant's `[openAt, closeAt]` ⇒ candidate instant `I`. Else the frame is recorded as `NO_SUBJECT`. | **NO — the secret** (D8)            |
| **T3** | **CONTAINMENT** | `B` fully inside `V` with `FRAME_MARGIN` clear on all four sides.                                                               | yes (brackets)                      |
| **T4** | **FILL**        | `fill = max(B.w / V.w, B.h / V.h) ∈ [FILL_MIN, FILL_MAX]`.                                                                      | yes (brackets)                      |
| **T5** | **FOCUS HELD**  | T3 ∧ T4 have been **continuously true for `FOCUS_HOLD` seconds** at the moment of release.                                      | yes (bracket **lock** state)        |

**Verdict** (stored on the frame, stamped at the sheet):

- `MASTER` — T2 with `I.role === "master"`, and T3 ∧ T4 ∧ T5.
- `BONUS` — T2 with `I.role === "bonus"`, and T3 ∧ T4 ∧ T5.
- `REJECTED` — anything else, with a stored `rejectReason ∈ { no-subject, out-of-frame,
too-wide, too-tight, blurred }` so the sheet can stamp _why_ (§4.4).

Every release that passes T1 consumes exactly **one** frame of film, whatever the verdict
(ADR-0077 D6: every frame counts; UX §2.1).

### 2.3 D2.a — Focus is a HOLD, not a velocity test

**Decision: "focus tenu" means the composition tests (T3 ∧ T4) have been continuously
satisfied for `FOCUS_HOLD = 0.35 s` when the shutter fires.** Any break — sway pushing the
box past the margin, a pan overshoot, a zoom nudge out of the valid band — **resets the
hold to zero**.

Rejected alternative — _a velocity threshold on the viewfinder over a trailing window_
(the first model I costed). It fails on discrimination: with a smoothstep waypoint path,
the trailing-mean speed at a waypoint rest and at mid-leg differ by only ~12 %, so no
threshold cleanly separates "settled" from "moving" — the test would be a coin flip
dressed as a skill. It also breaks the moving subject (LA PLAQUE): panning **with** a car
is exactly how you photograph one, and a velocity test punishes it. The hold model is
positional, so tracking a moving subject is _free_ and _correct_ — the box simply has to
stay framed. One knob instead of two, and it is precisely what the AF brackets already draw.

**Consequence for the render (spec the read, not the style — `dev-r3f-render`/`lead-art`):**
the brackets need **three** forms, not two: `dashed` (composition invalid) → `solid`
(composition valid, focus charging) → `locked` (focus held ≥ `FOCUS_HOLD`, the shutter will
be sharp). This extends `ux/photo-qte-controls.md` §2.3 by one state — flagged back to Tony
in §8. It leaks **nothing** semantic: "the lens has settled" is not "this is proof". Without
it, "focus tenu" is an invisible rule the player only discovers via a dull click after
spending film — the exact frustration ADR-0077 asks stage 5 to hunt.

### 2.4 Where the two-beat feedback line falls (reconciling D8 with the live brackets)

| Bit                         | When the player learns it                           | Channel                                                                        |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Composition valid (T3 ∧ T4) | **live**, continuously                              | brackets dashed/solid                                                          |
| Focus held (T5)             | **live** (charging → locked), then **at the click** | brackets locked · **crisp click + discreet flash** vs **dull click, no flash** |
| A moment was open (T2)      | **contact sheet only**                              | stamp                                                                          |
| Master vs. bonus (`I.role`) | **contact sheet only**                              | stamp                                                                          |

This is the honest reading of ADR-0077 D8: the shutter gives **mechanical** feedback
(sharp/blurred — a property of the tool), never a **semantic** one (proof/not-proof — a
property of the evidence). Composition and focus are mechanical and therefore shown; the
moment and the role are semantic and therefore withheld.

### 2.5 The authored `subjectTrack` keyframe table (**K-2a** — set-piece #1) {#keyframes}

**Staging RE-READ in Rev. 3 on the Belliard passage — and every value below is unchanged.**
The plate is the **mouth of the passage, rue Belliard, seen from the roof lucarne at the top
of the street** (fiction Rev.3 §2.1/§2.2): a plunging diagonal at 60-70 m, which is exactly
what the 300 mm is for.

| Plate element      | Where, on the `100 × 56.25 su` plate                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roadway band       | low in frame, `y ≈ 6 – 11`. **Ground line `y = 6.0`** (unchanged).                                                                                     |
| Passage mouth      | the dark vertical slot, `x ≈ 58 – 74`, receding away from the camera. It is the **black backdrop** the manteau clair reads against.                    |
| Pavement / façades | rideaux de fer taggés either side; the **BOULANGERIE** in amorce frame-left; the **feu tricolore** planted in front, lighting the mouth.               |
| The berline        | nosed **into** the passage (feux éteints), rear towards the street; it leaves **in reverse** (fiction §3.2, instant 3).                                |
| The Commandant     | waits in the slot's shadow at `x ≈ 65` and steps out of it — where the viaduct version had a pillar, the passage's own darkness does the job for free. |

**Scale sanity check (new, Rev. 3).** Standing men are `13.5 su` tall (24 % of frame height)
⇒ `1 su ≈ 0.13 m` ⇒ the plate is **≈ 13.0 m wide × 7.3 m high**. That is a passage mouth plus
a slice of façade either side: the plate reads as a real place at a real focal, which the
`100 su ≈ a quai under a viaduct` framing never quite did.

**Linear interpolation between consecutive keyframes, on all four components** (`cx`, `cy`,
`w`, `h`). Nine keyframes, defined and finite on the whole of `[0, 60.0]`:

| K   | `t` (s)   | centre `(cx, cy)` su | size `(w × h)` su | Drawn subject the box is the AABB of                                              | Segment                   |
| --- | --------- | -------------------- | ----------------- | --------------------------------------------------------------------------------- | ------------------------- |
| K0  | **0.00**  | (65.00, 12.75)       | **6.00 × 13.50**  | the Commandant alone, in the dark of the passage mouth                            | **A** hold — pre-roll     |
| K1  | **9.20**  | (65.00, 12.75)       | 6.00 × 13.50      | idem (unchanged) — last frame before tell #1                                      | A end · **tell #1 fires** |
| K2  | **11.00** | (54.00, 12.75)       | **24.00 × 13.50** | the two men facing each other at the mouth, full figures, car door open           | **B** hold · `openAt` #1  |
| K3  | **34.70** | (54.00, 12.75)       | 24.00 × 13.50     | idem — dead-beat **hold pose** (they stand and talk)                              | B end · **tell #2 fires** |
| K4  | **36.50** | (54.00, 14.72)       | **17.00 × 9.56**  | the two **faces** + the two **hands** + the envelope                              | **C** hold · `openAt` #2  |
| K5  | **51.20** | (54.00, 14.72)       | 17.00 × 9.56      | idem — dead-beat **hold pose** (envelope pocketed, heads still close)             | C end · **tell #3 fires** |
| K6  | **53.00** | (62.00, 9.00)        | **7.50 × 4.22**   | the berline's rear plate **backing out of the passage**, entering the feu's light | **D** · `openAt` #3       |
| K7  | **55.90** | (71.00, 9.00)        | 7.50 × 4.22       | idem, plate leaving the light                                                     | D · `closeAt` #3          |
| K8  | **60.00** | (83.70, 9.00)        | 7.50 × 4.22       | the berline finishing its manoeuvre and pulling away, at the same speed           | **E** · `SCENE_END`       |

Derived, and consistent with §4.2 (no value moved): K6→K7 is `9.00 su / 2.90 s = **3.103
su/s**`; the three transits are exactly `[9.20, 11.00]`, `[34.70, 36.50]`, `[51.20, 53.00]`
— the three `TELEGRAPH_LEAD_PHOTO = 1.8 s` telegraphs; the track is **constant** on
`[15.50, 34.70]` and on `[40.30, 51.20]`, which is F12(2) satisfied by construction.

**Rev. 3 — the reverse-out geometry, verified against the numbers rather than assumed.**
The berline no longer "departs under a viaduct"; it **backs out of the passage into the
street**. Three checks, all of which the authored table passes **without a single value
moving**:

1. **Speed.** K6→K7 is `9.00 su / 2.90 s = 3.103 su/s`. At `1 su ≈ 0.13 m` that is
   **≈ 0.40 m/s ≈ 1.45 km/h** in the image plane. For a forward departure that was
   implausibly slow; for a car reversing out of a passage mouth into a live street, it is
   **exactly right**. The relocation makes the load-bearing constant physically honest —
   which is a better outcome than "it still fits".
2. **Direction is lateral, and that is why the path is horizontal.** Backing out of the
   passage means crossing the pavement **perpendicular to the street axis**; from a lucarne
   looking down the street, that projects as a near-**horizontal** slide across the low band
   of the plate. Hence `cy` constant at 9.00 on K6→K7→K8 — unchanged, and now motivated
   instead of merely authored.
3. **The rear plate leads.** The car was nosed in, so its **rear** faces the street: reversing
   out, the number plate is the **first** thing to clear the mouth and it faces the camera
   square-on. The 300 mm read the instant demands is geometrically available, which the
   viaduct staging only asserted.

**Two NEW art constraints this geometry creates (they did not exist in the viaduct version,
and both are blocking for F12(1)) — to `lead-art` / `concept-artist`, see §10.5 items 7-8:**

- **Vertical drift ≤ tolerance.** Over `[53.0, 55.9]` the drawn plate's AABB centre may not
  move on `y` by more than `SUBJECT_BOX_TOLERANCE` (0.40 su), because the authored track is
  flat. A staged reverse that visibly descends toward the camera desynchronises the brackets
  from the picture — "bien cadré" becomes a lie during the hardest frame in the set-piece.
- **Apparent scale constant ≤ tolerance.** Same window, same reason: the authored box is
  `7.50 × 4.22` throughout, so the reverse must be staged **near-parallel to the image plane**.
  If the art needs the car to grow as it approaches, that is not an art note — it is a
  **re-author of K6/K7**, and it moves `3.103 su/s`, F5b, F5c, §3.3.b and AC6c with it. Come
  back to me, do not absorb it silently.

**Why these centres.** K2→K4 keeps `cx = 54.00` and only shrinks the box while lifting `cy`
by 1.97 su: the master proof's telegraph is a **near-pure zoom-in** (94 → 132 mm, fill 0.64),
which is the cheapest transit in the scene and the right generosity for the mandatory shot.
K4→K6 is the expensive one — 9.83 su of pan **and** 132 → 251 mm of zoom in 1.8 s — which is
what makes LA PLAQUE the mastery test (§4.3 budgets it).

**Two constraints this table hands to `lead-art` / `concept-artist` (reads, not style).**

1. **Named parts, not "the subject".** Each keyframe's box is the AABB of an **enumerated set
   of drawn elements** — for K4 it is `{Commandant's head, manteau-clair's head, both hands,
envelope}`, not "the pair". The photo verb is a crop by nature; the honesty requirement is
   that the crop be **authored and enumerable**, so a dev and a reviewer can check it.
2. **Hold poses on dead beats.** K2→K3 (19.2 s) and K4→K5 (14.7 s) require key poses whose
   AABB does not move: idle animation must stay inside `SUBJECT_BOX_TOLERANCE` (§7, F12). A
   dead beat where the actors drift is a leak with extra steps.

---

## D3 — Zoom: the double trade-off, in numbers (DECIDED)

ADR-0077 D3 requires zoom to be a genuine two-sided cost. Here is the mechanism.

### 3.1 The focal axis

| Field                   | Default                                             | Rationale                                                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FOCAL_MIN`             | **35 mm**                                           | The whole plate in one frame — the lowered/wide read.                                                                                                                                                                                                                                                   |
| `FOCAL_MAX`             | **300 mm**                                          | The fiction's own label (`300 mm`, fiction §4.2). Nothing longer exists in the roll.                                                                                                                                                                                                                    |
| Input law               | **logarithmic**: `f = 35 × (300/35)^u`, `u ∈ [0,1]` | Constant ratio per unit of input — the only law that gives usable fine control at the long end, where the bonus lives.                                                                                                                                                                                  |
| `ZOOM_TRAVERSE_SECONDS` | **2.2 s** for `u: 0 → 1` at max input rate          | Sized against the telegraph budget: the worst authored re-zoom (L'ÉCHANGE ≈132 mm → LA PLAQUE ≈251 mm) costs **0.67 s**, comfortably inside the 1.8 s tell (§3.3). Slower than that and the tell stops being enough; faster and the narrowest valid band (LA PLAQUE, 0.37 s of travel) becomes twitchy. |

### 3.2 Side A — fill-the-frame validation

| Constant       | Default  | Rationale                                                                                                                                                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FRAME_MARGIN` | **0.04** | 4 % of each axis must stay clear around the subject box. Two jobs: it is the "the incriminating element must not touch the edge" rule, and it is the sway's working room (§3.3).                                                           |
| `FILL_MIN`     | **0.45** | Below 45 % of frame on its dominant axis the subject is not legible in photocopy B&W at fanzine size — "trop large, la scène est illisible" (fiction §3.2). It is the anti-safe-play rule: you cannot solve the set-piece by staying wide. |
| `FILL_MAX`     | **0.92** | **Derived, not authored:** `1 − 2 × FRAME_MARGIN`. One knob, no drift between the two rules.                                                                                                                                               |

Valid-fill latitude is a ratio of **2.04×** in focal terms — one stop. Wide enough to be
found under time pressure, narrow enough that "zoom to taste" is not a strategy.

### 3.3 Side B — sway

Sway is a **closed-form hashed-waypoint drift of the viewfinder centre**, in scene units,
identical in model to the shipped hostage wander (ADR-0034 Rev. 3): waypoints hashed from
`(swaySeed, raiseIndex, k)`, `k = floor(raisedElapsed / SWAY_LEG_DURATION)`, smoothstep-eased
between consecutive waypoints, `waypoint[0] = (0,0)` so a raise never snaps the frame.

**The physical model is the honest one: the tremor amplitude is CONSTANT in scene units, so
its share of the frame grows linearly with focal.** That is the whole trade-off — nothing
extra is bolted on.

| Constant               | Default (**Rev. 2**)  | Rev. 1 | Rationale                                                                                                                                                                                                   |
| ---------------------- | --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SWAY_AMP_X`           | **2.00 su**           | 2.4    | Peak displacement of the viewfinder centre. Re-calibrated by F5a against **effective** slack (below): 39 % / **54 %** / **75 %** at the three sweet spots, under the 60 % (master) / 80 % (bonus) ceilings. |
| `SWAY_AMP_Y`           | **1.125 su**          | 1.35   | `= SWAY_AMP_X / 1.7778`. The plate, the viewfinder and all three instant boxes are 16:9, so this makes the sway ellipse isotropic **in frame fractions** and F5 identical on both axes (verified below).    |
| `SWAY_LEG_DURATION`    | **0.55 s**            | =      | Unchanged. Slower than the hostage wander's 0.38 s: a tremor the player counter-steers, not a target that dodges. A leg fits inside every pose window.                                                      |
| `MIN_LEG_DISPLACEMENT` | **0.50 su**           | 0.60   | Anti-jitter floor (re-hash on collision), rescaled with the amplitude (`× 2.00/2.4`). Below it the drift reads as a rendering glitch.                                                                       |
| `MAX_LEG_DISPLACEMENT` | **2.60 su**           | 3.20   | Rescaled with the amplitude. Caps a leg's peak speed at `1.5 × 2.60 / 0.55 = **7.09 su/s**` (smoothstep), which is what F5c sizes the pan against.                                                          |
| `PAN_RATE_MAX`         | **12.0 su/s** _(new)_ | —      | Viewfinder pan authority at full input. Sized by F5c: `≥ 3.103` (fastest subject) `+ 7.09` (peak sway) `= 10.19`, with 18 % headroom. Also covers the worst authored re-frame (9.83 su, §2.5) in 0.82 s.    |

#### 3.3.a — Effective containment slack: the formula, pinned so it cannot drift again (**K-1**)

Rev. 1 measured sway against the **raw** slack `(1 − fill)/2 × fovW` and forgot that T3 has
**already spent `FRAME_MARGIN` of it**. The margin is not a separate rule that happens to sit
nearby — it is a subtraction from the very room the sway is allowed to use. The room actually
available to the drift, per side, is:

```
fovW(f)  = 3500 / f                                   (su)
s_eff(f) = (fovW(f) − B.w) / 2  −  FRAME_MARGIN × fovW(f)      (su, per side)
```

and the same relation on `y` with `fovH = fovW / 1.7778`, `B.h = B.w / 1.7778` — so
`s_eff_y = s_eff_x / 1.7778`, exactly the ratio of `SWAY_AMP_Y` to `SWAY_AMP_X`. **One axis
proves both.** The old figures (36 / 51 / 75 %) were the raw-slack numbers; two of them were
measured against a budget already spent, and the breach fell on the mandatory shot.

Re-derived at each instant's geometric mid-band focal, with `FRAME_MARGIN = 0.04` and
`SWAY_AMP_X = 2.00 su`:

| Instant                | `f`    | `fovW`   | raw slack | margin  | **`s_eff`** | **sway share** | F5a ceiling | Verdict           |
| ---------------------- | ------ | -------- | --------- | ------- | ----------- | -------------- | ----------- | ----------------- |
| ARRIVÉE (bonus)        | 94 mm  | 37.23 su | 6.62 su   | 1.49 su | **5.13 su** | **39.0 %**     | ≤ 80 %      | ✓ (teacher)       |
| L'ÉCHANGE (**master**) | 132 mm | 26.52 su | 4.76 su   | 1.06 su | **3.70 su** | **54.1 %**     | ≤ 60 %      | ✓ (5.9 pp margin) |
| LA PLAQUE (bonus)      | 251 mm | 13.94 su | 3.22 su   | 0.56 su | **2.66 su** | **75.1 %**     | ≤ 80 %      | ✓ (4.9 pp margin) |

**Why 2.00 su and not the 2.13 su ceiling.** `min(0.60 × 3.70, 0.80 × 2.66) = 2.131 su` does
close both breaches — on the nose, with **zero** headroom. A fairness floor satisfied at
0.0 % margin is a floor that the next re-author of a subject box silently breaks (shrink
LA PLAQUE's plate by 4 %, and it is back below its own ceiling). **2.00 su** is the round
value that keeps ≈ 5 pp of headroom on both binding cells, costs the master 3 pp of
difficulty against Rev. 1's _intended_ 51 % (it was never 51 %, it was 65 %), and leaves the
sweet-spot geometry visibly tense at the long end.

**How the two sides bite together (the point of D3), re-derived.**

- Frame **greedily tight** (fill → `FILL_MAX = 1 − 2 × FRAME_MARGIN`): `s_eff = 0` **by
  construction**, at every focal — the raw slack _is_ the margin. Any sway at all breaks the
  hold. Tight framing is unusable without a rule saying so.
- Frame **greedily wide**: `FILL_MIN` rejects the shot outright.
- Frame at the **sweet spot** (mid-band, fill ≈ 0.64): `s_eff = 3.70 su` vs. 2.00 su of
  sway — holdable with light counter-steer.
- Push the **focal itself** past ≈ **258 mm** on the plaque and the sway share crosses 80 %;
  at `FOCAL_MAX = 300 mm`, `s_eff = 1.62 su < 2.00 su` ⇒ **124 %**: containment cannot be held
  through a full sway leg at all. The top of the legal band is self-punishing, and the real
  sweet spot sits at ≈ 251 mm — which is where F5a is evaluated, on purpose (§7).

That is D3's "double trade-off" as a single geometric consequence, not two bolted rules.

#### 3.3.b — The moving subject's own share, and what the player owes it

At LA PLAQUE the box travels **3.103 su/s**, so over one `FOCUS_HOLD` it crosses
`1.085 su = 40.8 %` of `s_eff` on its own. A player who acquires the frame perfectly centred
and then **does not pan at all** faces a combined worst case of
`(2.00 + 1.085) / 2.66 = **115.8 %**` — i.e. the hold **cannot** be completed without
tracking. That is the authored intent (fiction §3.2: the most useful bonus is the hardest),
and F5b now bounds it instead of leaving it unstated. The demand is a number, not an
adjective:

```
v_required = (combined − 1.00) × s_eff / FOCUS_HOLD = 0.158 × 2.66 / 0.35 = 1.20 su/s
```

**The player must pan at ≥ 1.20 su/s — 39 % of the car's own speed — to hold the plate.** So:
tracking is required, _perfect_ tracking is not, and the pan authority (`PAN_RATE_MAX 12.0
su/s`, F5c) is 10× what the minimum demands and still beats subject + peak sway simultaneously.
The master proof's subject is static, so its combined budget is its sway budget: 54.1 %.

### 3.4 Reduced motion (answering UX §3.1's tuning seam)

**Decision: same amplitude, longer legs, linear interpolation.**

| Constant            | Standard            | Reduced motion              |
| ------------------- | ------------------- | --------------------------- |
| `SWAY_AMP_X / _Y`   | **2.00 / 1.125 su** | **identical**               |
| `SWAY_LEG_DURATION` | 0.55 s              | **1.30 s** (`_RM`)          |
| Interpolation       | smoothstep          | **linear** (constant speed) |

(Rev. 2: amplitudes follow the K-1 retune; the RM peak leg speed becomes
`2.60 / 1.30 = 2.00 su/s`, so F5c holds in both modes with a wider margin in RM.)

Rationale, and why this specific pair: keeping the **amplitude identical** means every
fairness floor in §7 (F5 holdability, the slack arithmetic, the sweet-spot geometry) is
**byte-identical between the two modes** — reduced-motion players inherit the same fairness
guarantees rather than a re-derived approximation. The difficulty that could have been lost
to the 2.4× slower drift is given back by **removing the smoothstep's zero-velocity dwell at
each waypoint**: standard mode offers a free "settling" moment twice per leg; the linear RM
path offers none, so the player counter-steers continuously. Motion quality changes (fast
small shake → slow wide drift, ≈ 0.8 Hz, far under the 3 Hz seizure floor, no discontinuity);
the _task_ — active correction to hold a valid composition for `FOCUS_HOLD` — is unchanged.

**Parity criterion (measurable, and the AC that tests it — AC9):** with the viewfinder held
still at each instant's mid-band focal, centred on the subject, the **fraction of a raised
10 s sample during which T3 ∧ T4 hold** must match within **±10 percentage points** between
the two modes. `SWAY_LEG_DURATION_RM` is the single free knob to close any gap found at
playtest — one variable at a time.

---

## D4 — Deterministic cadence: poses and sound-cover windows (DECIDED)

Everything below is **authored data** and a **pure function of `sceneClock`**. No
`Math.random`, no `Date.now`, no wall clock, anywhere (ADR-0077 determinism guardrail). Same
retry ⇒ byte-identical scene, which is what makes learning it a real skill.

### 4.1 Sound cover — the traffic-light cycle (RE-DERIVED, Rev. 3)

The relocation changes the **source**, not the shape: fiction Rev.3 §2.3 hands me the
**crossroads at the top of rue Belliard**. Each green releases a packet of vehicles that
descends the street; between packets the street is dead. Same three properties the mechanic
needs — periodic, deterministic, telegraphed — from a prop that is **already shipped in the
level** instead of a level that would have to be built.

**The period, derived instead of inherited.** This is the one number the new source genuinely
puts under pressure, so I derive it rather than carry it over:

| Step                                                                                                                                                                          | Value                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| A Maréchaux-type signalled junction, 1998, two phases                                                                                                                         | **cycle ≈ 42 s**           |
| Rue Belliard is fed on **both** phases — the through green (traffic coming straight down the street) **and** the cross green (traffic turning into it). Near-opposite phases. | **2 packets per cycle**    |
| ⇒ interval between two packets reaching the street                                                                                                                            | **42 / 2 = 21.0 s**        |
| Packet ≈ 6-8 vehicles over ≈ 45 m at ≈ 9 m/s, plus the ramp-up at the line and the tail                                                                                       | **≈ 7.0 s of loud street** |
| ⇒ duty cycle                                                                                                                                                                  | **7 / 21 = 33 %**          |

That is the honest reading, and it is why I keep the numbers rather than because they were
already written: **21.0 s is not a light cycle, it is a wave interval**, and a 42 s two-phase
cycle producing two evenly-spaced waves is period-correct for the junction the fiction names.
(Had I read 21 s as the _cycle_ itself it would have been too brisk for a real junction, and
had I taken a 42 s wave interval instead, a 60 s scene would hold **one** cover window: LA
PLAQUE would fall in silence and F3 would break on a bonus. The two-phase reading is both the
truthful one and the cheap one; that convergence is why it is the decision and not a
rationalisation.)

**RULING R3-1, ACTED — the two pins that come with the ratification.**

1. **`WAVE_PERIOD = 21.0 s` is a WAVE INTERVAL and it is the only authored datum. The 42 s
   cycle is a justification of fiction and NEVER a value.** No authored field, no constant, no
   unit test, no audio brief and no art brief may contain **42**. Without this pin the next
   reader "corrects" the period to 42 to match the junction and takes the nine keyframes with
   him.
2. **The two waves of the cycle may differ in CHARACTER, never in DURATION nor in ATTACK.**
   `inCover(t)` is a single boolean and F3 assumes all three windows are worth **7.0 s**. A
   shorter "turners" wave silently breaks the zero-suspicion run for whichever instant lands in
   it. This is a **gameplay constraint on the E-7 brief**, not a mix preference (§10.4).

**C-8 — the cost of the reading failing, stated correctly.** Rev. 3 announced "the cadence
re-opens, the scene grows to ~90 s, the nine keyframes move". **That was pessimistic by one
step and I withdraw it.** The fiction already carries the fallback — **the bakery's fournil**
(shipped prop, `x_norm 0,340`, §10.4) — which is **mono-periodic**: it produces one wave every
21 s with no two-phase reading required, and the whole mechanic reads `WAVE_*`, never "a car".
So if `sound-designer` or `art-advisor` cannot support the two-phase junction, **the cadence
does not re-open**: we switch source at **zero mechanical cost**. The real risk of R3-1 is
**fiction + mix**, not **cadence**.

| Field                | Default    | Rationale                                                                                                                                                                                                                                                                |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WAVE_FIRST_OPEN`    | **10.0 s** | Unchanged. Leaves 10 s of `ACTIVE` silence first, so the player meets the _risky_ state before the safe one and learns the needle from the safe side. It is a **phase offset**: the scene opens mid-cycle.                                                               |
| `WAVE_PERIOD`        | **21.0 s** | Derived above (42 s cycle ÷ 2 feeding greens). Three waves in a 60 s scene, and missing one costs **at most 14 s** of waiting — a recoverable mistake, which a 42 s wait would not be.                                                                                   |
| `WAVE_COVER_SECONDS` | **7.0 s**  | The packet-pass duration derived above; 33 % duty. Generous enough that a patient player takes **all three** shots at zero suspicion (F3), tight enough that impatience is the default failure.                                                                          |
| `WAVE_TELL_SECONDS`  | **1.8 s**  | **The engines rising at the line** before the wave arrives — "les moteurs qui montent au feu avant la vague" (fiction Rev.3 §2.3). The light is at the **top** of the street, i.e. right under the affût, so the tell is heard close and early. Never a surprise window. |

⇒ Cover windows at **[10.0, 17.0]**, **[31.0, 38.0]**, **[52.0, 59.0]**; approach tells from
**8.2 / 29.2 / 50.2 s**. **Identical to Rev. 2 — nothing downstream moves.** Window 3 closes at
59.0 s, inside `SCENE_DURATION = 60.0 s`; the fourth wave would open at 73.0 s, outside the
scene, so no window is ever truncated by the terminal.

**One deliberate refusal: the on-plate traffic light is NOT a mechanical channel.** The feu
is visible on the plate (it is what lights the number plate at instant 3), and fiction §2.3
offers its colour as a free second read of the cover state. **I decline it**, and this is a
design call, not an oversight: the level's feu is synchronised to the crossroads on an _onde
verte_, i.e. offset by the packet's travel time (≈ 65 m / 9 m/s ≈ 7 s). Wiring the cover read
to that light would put the visual signal **7 s out of phase** with the audio one and teach a
false causal model — the exact failure mode the suspicion needle's "no numbers" rule exists to
avoid. The tell has **two** channels and both live at the top of the street: **audio** (engines
rising at the line) and **visual** (the packet's headlights swinging into the street, readable
from the lucarne). The feu on the plate stays scenery and a light source. To `sound-designer`
and `ux-designer` as a settled constraint, §10.4.

**RULING R3-2, ACTED — the refusal is upheld and HARDENED into a prohibition.** The gate
sustained my refusal and widened it; it is now written as an interdiction, to be cited together
with the gated T-4 prohibition ("the needle is not a light meter"):

> **No element of the scene plate may encode the cover state, with the single exception of the
> packet's headlights.** The plate's traffic light is **scenery and a light source**: it may be
> animated, it may not be read. Not **out of phase** (it teaches a false causal model — the
> onde verte offsets it ≈ 7 s), and not **in phase** either (an unbudgeted free indicator:
> patience would become legible without listening, which moves the difficulty F3 and §5.2
> calibrate — a tuning change dressed up as an art note).

Two consequences I own: (1) fiction §2.3's "bonus de lisibilité" is **declined at the gate
(R3-2)** and is not to be re-proposed — recorded here so the refusal survives the next pass
(**C-6**); (2) what the render projects from `inCover` is **the illumination / the headlights
raking the mouth of the passage**, **never the colour of the plate's traffic light** — the
techplan's D-J decision is right, its wording is not, and that is note **N-1** to
`senior-architect` (§10.6 h).

**Silence is the default state, cover is the exception.** A shutter release is classified by
one boolean: `inCover(t)`. Nothing in between, no partial credit — the gauge stays countable
(§5).

### 4.2 The three instants (authored, from the fiction's triptych)

`SCENE_DURATION = 60.0 s`. All boxes in scene units on the plate.

| #   | Instant       | Role       | Tell at | Window          | Duration | Cover overlap                            | Subject box (su)                      | Valid focal band | Sweet spot |
| --- | ------------- | ---------- | ------- | --------------- | -------- | ---------------------------------------- | ------------------------------------- | ---------------- | ---------- |
| 1   | **ARRIVÉE**   | bonus      | 9.2 s   | **11.0 – 15.5** | 4.5 s    | **4.5 s** (fully in [10,17])             | `24.0 × 13.5` static                  | **66 – 134 mm**  | 94 mm      |
| 2   | **L'ÉCHANGE** | **master** | 34.7 s  | **36.5 – 40.3** | 3.8 s    | **1.5 s** (straddles the end of [31,38]) | `17.0 × 9.56` static                  | **93 – 189 mm**  | 132 mm     |
| 3   | **LA PLAQUE** | bonus      | 51.2 s  | **53.0 – 55.9** | 2.9 s    | **2.9 s** (fully in [52,59])             | `7.5 × 4.22`, **moving** x 62 → 71 su | **210 – 300 mm** | 251 mm     |

**Rev. 3 — the triptych re-checked against the new source, cell by cell.** No row moved; what
changed is that all three overlaps are now **caused** by the fiction instead of imposed on it:

| Instant       | Overlap   | F3 (≥ 1.2 s) | Why the wave and the scene coincide (Rev. 3)                                                                                                                                                       |
| ------------- | --------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ARRIVÉE**   | 4.5 s     | ✓            | The berline noses into the passage **inside a packet** — you hide a manoeuvre in traffic, not in an empty street. The two men time their meeting on the light like everyone else in Paris.         |
| **L'ÉCHANGE** | **1.5 s** | ✓ (just)     | They **wait for the street to empty** before the handover: no headlights on the envelope. The master proof is risky **because its actors chose the silence** — the design intent now has a motive. |
| **LA PLAQUE** | 2.9 s     | ✓            | The plate is legible **because** the packet's headlights rake the mouth of the passage as it backs out. The cover window is the **light source** of the shot, not just its alibi.                  |

That third line is the strongest lock in the scene: instant 3's F3 compliance is now
**structural** (no headlights ⇒ no readable plate ⇒ no instant), not a tuned coincidence a
future re-author could break by nudging a window.

**Tell collision, checked (new in Rev. 3).** Wave tells fire at 8.2 / 29.2 / 50.2 s, instant
tells at 9.2 / 34.7 / 51.2 s. On instants **1 and 3** the two tells are exactly **1.0 s apart**
— close enough to be read as one event. That is **information, not noise**: the scene moves
when the street moves, which is the whole causal claim above, and it gives the player a single
composite cue to learn. On instant **2** they are deliberately **anti-correlated** (the instant
tell at 34.7 s sits mid-cover, 3.3 s before the cover closes at 38.0 s), which is precisely the
beat that teaches "this one is different — shoot early". No change required; recorded so nobody
"fixes" the coincidence later.

`TELEGRAPH_LEAD_PHOTO = 1.8 s` for all three (tell → window open). **The boxes in that last
column are not authored here** — they are the values `subjectTrack(t)` already holds on each
instant's segment, read off the keyframe table (§2.5, K2/K4/K6-K7). One source, no duplicate.

**Why the windows shrink 4.5 → 3.8 → 2.9 s.** A legible difficulty ramp inside one scene,
with the _mandatory_ shot in the middle: the bonus you meet first is the teacher, the master
proof is demanding but generous, the last bonus is the mastery test. Nobody is asked to
learn the verb on the shot they must not miss.

**Why L'ÉCHANGE straddles the end of a cover window.** Directly from fiction §3.3, and I
adopt it as tuning: the master proof's window opens 1.5 s before the packet finishes passing
and stays open 2.3 s into the silence. A player who reads the tell and shoots early pays **zero**
suspicion; a hesitant player pays **+34** for the same photograph. That is the entire
suspicion mechanic taught in one beat, on the one beat that matters, without a tutorial
line. 1.5 s is above the F3 floor (1.2 s) but only just — deliberately.

**Why the telegraph is 1.8 s and not the family's 0.35 s.** The shooting QTEs telegraph a
_click_; this one telegraphs a **zoom traverse + a re-frame + a 0.35 s focus hold**. Budget
at the worst authored transition (L'ÉCHANGE 132 mm → LA PLAQUE 251 mm): traverse 0.67 s +
re-frame ≈ 0.4 s + hold 0.35 s = **1.42 s** < 1.8 s. The floor F2 (1.2 s) is set just under
that computed need, not picked round.

### 4.3 LA PLAQUE — the moving subject

The box translates x 62 → 71 su across its 2.9 s window as the berline **backs out of the
passage** (**3.103 su/s** ≈ 22 %/s of the frame width at the sweet spot — keyframes K6/K7,
§2.5; ≈ 0.40 m/s in the world, i.e. a real reverse). Held still, the viewfinder loses containment
in ≈ 0.86 s, so the shot **requires tracking**; §3.3.b puts the exact demand at
**≥ 1.20 su/s of pan**, 10 % of the available authority. Because focus is positional (D2.a),
panning with the car costs nothing — it is a tracking skill, not an impossible one.

The transition into it is the scene's most expensive: **9.83 su of pan** (K4 → K6) **and**
132 → 251 mm of zoom, inside `TELEGRAPH_LEAD_PHOTO = 1.8 s`. Budget: pan `9.83 / 12.0 =
0.82 s`, zoom traverse `0.66 s` (concurrent inputs, not additive), then `FOCUS_HOLD 0.35 s`
inside the 2.9 s window. It fits, with the pan as the critical path — which is why
`PAN_RATE_MAX` is a tuned value and not an afterthought. Combined with the band's 1.43×
latitude and the top-of-range sway, this is the hardest frame in the set-piece, which is
exactly its authored role (bonus, never mandatory).

### 4.4 The contact sheet (verdict surface — mechanics only; look is `lead-art`'s)

One thumbnail per frame shot, in shot order, stamped by verdict (UX §4.2): `MASTER` /
`BONUS` / `REJECTED` (+ the `rejectReason` from §2.2 so the reject stamp says _why_: flou /
hors cadre / trop large / trop serré / rien à voir). **Two CTAs, always** — the leaving one
(`Continuer` with a master frame, **`Décliner`** without) plus `Réessayer` (§1.3, K-4). The
sheet is shown on **all three** terminals, including `SPOTTED` (§1.1).

---

## D5 — Film economy and the suspicion gauge (DECIDED)

Two independent pressures — one on **attempts** (film), one on **noise** (suspicion) — with
no passive drain on either. House rule: outcome economies, never clocks that empty by
themselves.

### 5.1 Film

| Field         | Default                                       | Rationale                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filmCount`   | **6**                                         | 3 instants + **3 spare frames** = exactly a 100 % error margin: you may miss the master proof once, blow a bonus, and still finish the roll with a full set. Sits inside the fiction's supported 4–8 (fiction §3.4) and inside UX's ≤ 8 no-pagination ceiling (UX §4.1) as a clean 2 × 3 grid. |
| Decrement     | **1 per armed release**, whatever the verdict | ADR-0077 D6, UX §2.1: a wasted frame is still film. This is the entire reason the two-beat feedback is tense.                                                                                                                                                                                  |
| Lowered input | **0**                                         | Swallowed at T1 — no film, no click, no cost (UX §1.3).                                                                                                                                                                                                                                        |

`film === 0` after a decrement ⇒ `ROLL_END` immediately. **The roll ending ends the scene**,
whether or not the master proof is in it — a finished roll is a finished roll; the contact
sheet then says which it was.

### 5.2 Suspicion

| Field                       | Default  | Rationale                                                                                                                                                          |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUSPICION_MAX`             | **100**  | The needle's full sweep (UX §2.2).                                                                                                                                 |
| `SUSPICION_SHUTTER_COVERED` | **0**    | A packet of engines in the street absorbs the click completely. Cover is a genuine safe state, not a discount — that is what makes waiting for it a real decision. |
| `SUSPICION_SHUTTER_EXPOSED` | **+34**  | **Three silent frames get you spotted; two do not.** The gauge is a countable budget the needle teaches at a glance, without ever printing a number (UX §2.4).     |
| Decay                       | **none** | See below.                                                                                                                                                         |
| Any other source            | **none** | ADR-0077 D6 names exactly one input: shutter noise vs. sound cover. No time pressure, no proximity, no "he glances your way". One input, one lesson.               |

**Why no decay at all.** Three reasons, in order of weight: (a) UX A5 asserts the needle
shows **zero delta while lowered** — a decay that ran only while raised would be perverse,
and one that ran while lowered would contradict a gated acceptance criterion; (b) a
non-decaying gauge is a _budget_, which is countable and legible on a needle, whereas a
decaying one is a _rate_, which needs a number to read — and numbers are forbidden here
(UX §2.4); (c) the house rule is outcome economies over passive drains, and a decay is a
passive drain wearing a friendly hat. The anti-frustration guarantee is delivered instead by
the **F3 floor** (§7): every instant, master and bonus alike, has ≥ 1.2 s of overlap with a
cover window, so a **zero-suspicion perfect run always exists**. Patience is always
sufficient. That is a stronger promise than a decay, and it is assertable.

**Spotted (`suspicion ≥ 100`)** — targets scatter, scene aborts, contact sheet, retry from
checkpoint. **No death, no run loss, no energy cost, no quota effect** (D7, §6.4).

---

## D6 — 3C, and what this QTE does NOT touch

### 6.1 Camera

The "camera" here is the viewfinder rect; the R3F camera holds the plate. **No screen
shake, ever** — shake would be indistinguishable from sway and would corrupt the one signal
the player is reading. The only motion on screen is the sway, the subject track, and the
player's own pan. `LOWERED` shows the full plate; `RAISED` shows `V`.

### 6.2 Character

Muf has no avatar in this set-piece: he is the point of view. No movement, no weapon, no
energy stake. The four verbs of UX §1 are the entire ability set.

### 6.3 Controller and retry

Bindings, gestures, touch targets and the escape hatch are `ux-designer`'s
(`ux/photo-qte-controls.md` §1, §3) and I adopt them unchanged. Two gameplay notes I owe
back to that spec:

- **Pause freezes everything** — `sceneClock`, sway phase, `raisedElapsed`, film, suspicion.
  The set-piece must be tick-gated by the existing `paused` flag, not run beside it (UX §3.4
  already flags this to `senior-architect`; I confirm it as a gameplay requirement, not a
  nicety: an unpausable deterministic scene is a broken deterministic scene).
- **Retry restarts the set-piece at `sceneClock = 0`** with film restored and suspicion
  zeroed, from the checkpoint. Determinism means retry N is byte-identical to retry 1 — the
  player is learning a fixed scene, which is the only way a 60 s authored set-piece is worth
  replaying.

### 6.4 What does NOT move (answering UX §2.4's flag explicitly)

**No energy movement. None.** No refill on the master proof, no drain on `SPOTTED`, no panic
cost on a wasted frame. `energy` is inert for the whole set-piece, which is precisely why the
UX spec is right to keep the energy readout off this screen. **No score movement** either
(single-currency discipline, ADR-0034 D5 / boss spec §4.4). The only currencies are film,
suspicion, and the frames in the roll.

**No kill quota interaction, no enemy spawn, no vehicle sim.** The world is paused.

---

## D7 — The reward lever (RECOMMENDED, not decided — ADR-0077 open question)

ADR-0077 leaves "boss weakening vs. route unlock vs. narrative" open and assigns it jointly
to `game-designer` + `narrative-designer`. Yasmine's recommendation (fiction §5) is that the
proof makes the Commandant **isolé, jamais affaibli** — reusing the already-specified
"planque enfoncée" state (shortened `SHIELDED` lulls). Her invariant: _"toute récompense qui
se lit « il a moins de PV » casse la fiction ; toute récompense qui se lit « il est moins
couvert » la sert."_

**I concur, and I can make it exact.** Here are the three options with their cost, then the
recommendation.

| Option                        | What ships                                                                                 | Cost                                                                                      | Verdict                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1 — Boss cover reduction** | The final `bossQteSpec` per-phase **`SHIELDED` lull** is scaled down by an authored factor | **One multiplier** on an existing authored field. No new system, no new read, no new art. | **RECOMMENDED.** Cheapest, fully inside a gated contract, and it is literally "moins couvert".                                                         |
| **R2 — Route unlock**         | A new approach/entrance in the final level                                                 | New level authoring + art + a branch in level data + a second balance pass on that level  | **REJECTED for V1.** Expensive, and a route the set-piece unlocks quietly turns the set-piece into a soft gate — which fiction §5.3 and I both refuse. |
| **R3 — Narrative payoff**     | A `PARIS-MINUIT` UNE variant + the contact-sheet dialogue branch (b)                       | ~2 strings, zero systems (fiction §5.3)                                                   | **RECOMMENDED as a companion to R1**, never alone: a pure-cosmetic payoff for a 60 s skill set-piece reads as unpaid.                                  |

### D7.1 R1, specified (**Rev. 2 — K-3**)

**What round 1 got wrong.** R1 was checked against the boss's tell **alone**, ignoring the
already-gated `SHIELD_BREAK_LULL_CUT = 0.5 s` of
[`spec-boss-shield-break-tempo-shot.md`](spec-boss-shield-break-tempo-shot.md) §6-B (ADR-0060),
which cuts the **next** lull after a shield break. Composed, Rev. 1's stated floor of ×0.70
put phase 3's post-break lull at **0.34 s against a 0.35 s tell** — at which point that spec's
own clamp fires and **silently eats the shield-break reward**: the player pays a 1 HP chip for
a compression that no longer happens. Even the shipped ×0.75 left 0.40 s post-break against a
0.35 s tell, i.e. **0.05 s** of non-tell recovery, which is not recovery. Two gated fairness
contracts, one authored collision.

#### 7.1.a — `ε`, pinned to the gated spec instead of invented

The compound floor needs a minimum **residual recovery that is not tell**. I do not invent it:
I pin it to the worst headroom the shield-break lever **already ships and was already gated
at** — phase 3, `1.20 − 0.5 = 0.70 s` lull against a `0.35 s` tell:

> **`LULL_RESIDUAL_FLOOR (ε) = 0.35 s`.** _The photo reward may never leave a post-break lull
> with less breathing room than ADR-0060 already ships without it._

That framing is deliberate: it makes ε non-negotiable design-side (it is a quotation, not a
preference), and it means R1 can only ever be **additive** to the shield-break experience.

#### 7.1.b — What ε forces, and the decision it forces

Solving `m × lull(p) − 0.5 ≥ telegraphLead(p) + 0.35` per phase:

| Phase          | lull   | tell   | minimum legal `m`          |
| -------------- | ------ | ------ | -------------------------- |
| 1 — pressure   | 2.00 s | 0.45 s | `1.30 / 2.00` = **×0.650** |
| 2 — pressure   | 1.60 s | 0.40 s | `1.25 / 1.60` = **×0.781** |
| 3 — **frenzy** | 1.20 s | 0.35 s | `1.20 / 1.20` = **×1.000** |

**Phase 3 admits no compression at all.** A _uniform_ multiplier is therefore capped at ×1.00
— i.e. the reward is arithmetically dead — unless ε is shaved to ≤ 0.05 s, which is the
non-recovery the gate already refused. So the honest reading is not "pick a smaller multiplier"
but: **phase 3's lull is already at the fairness floor, and it is not this reward's playground.**

> **DECISION — the multiplier is PHASE-SCOPED: it applies to phases 1 and 2 only; phase 3 is
> always ×1.00.**

It is also the better design, not merely the legal one: the frenzy is the phase where the boss
barely hunkers at all, so "he can't stay behind cover" has almost nothing left to say there,
and stacking two compressions on the tightest beat of the encounter is exactly how a reward
turns into a difficulty spike. The reward moves the **waiting**, not the **climax**.

**Rejected alternative — non-cumulative composition** (`lull = min(m × lull, lull − CUT)`, the
stronger lever wins). It closes the collision just as cleanly and preserves both gated
contracts verbatim, but it makes the photo reward **invisible on every lull that follows a
shield break** (the cut dominates in all three phases at any `m ≥ 0.79`) — a reward that
disappears precisely when the player is playing well. Recorded so it is not reinvented; if
Karim prefers it, it is a one-line swap in F10 and the tiers below revert to a uniform value.

#### 7.1.c — The tiers

| What the player brings back   | multiplier (**phases 1-2 only**) | P1 / P2 / P3 lull  | after a shield break (−0.5 s) | residual recovery vs. tell |
| ----------------------------- | -------------------------------- | ------------------ | ----------------------------- | -------------------------- |
| Nothing / **declined** (§1.3) | **×1.00** (baseline)             | 2.00 / 1.60 / 1.20 | 1.50 / 1.10 / 0.70            | 1.05 / 0.70 / 0.35 ✓       |
| Master proof only             | **×0.90**                        | 1.80 / 1.44 / 1.20 | 1.30 / 0.94 / 0.70            | 0.85 / 0.54 / 0.35 ✓       |
| Master proof **+ ≥ 1 bonus**  | **×0.80**                        | 1.60 / 1.28 / 1.20 | 1.10 / **0.78** / 0.70        | 0.65 / **0.38** / 0.35 ✓   |

Binding cell: **phase 2 at ×0.80**, 0.38 s of residual against ε = 0.35 s. The wall is
`m ≥ ×0.781` — written down here so any future re-tune sees it before it hits it. (Rev. 1's
×0.85 / ×0.75 are **withdrawn**: ×0.75 breaches phase 2's own compound floor.)

**Everything else in the boss contract is untouched:** `bossHp 24`, ring damage 2/1/0,
`maxBlownWindows 10`, `EXPOSED` durations, `telegraphLeadSeconds`, the per-phase drain, and
**`SHIELD_BREAK_LULL_CUT` and its clamp, byte-for-byte**. In particular **no HP is removed** —
the narrative invariant holds by construction.

**Scope pin (K-3): `rewardMultiplier` targets the DATA, not "the boss".** It applies to the
**Niveau Final** `bossQteSpec` **only**. The **Belliard** encounter is byte-untouched, and it
is written down because the shield-break story's own K-2 already burned this crew once on a
system constant that reached _both_ live encounters.

> **Rev. 3 — this pin was cheap insurance, it is now load-bearing.** Rev. 2 could add "and
> anyway Belliard precedes the set-piece in progression, so it costs nothing". **That safety
> net is gone:** the set-piece now plays **on the Belliard level itself** (a return night,
> fiction Rev.3 §2.4), so a player can hold `photoOutcome = master` while the **Belliard**
> encounter is still ahead of them, depending on where `pm` places the return night. If the
> multiplier were ever a module constant rather than a field on the Niveau Final authored row,
> the relocation would silently buff the level-1 boss — the exact K-2 failure, re-armed.
> **The Niveau-Final-only scope is therefore a REGRESSION-ASSERTED requirement, not a
> convention** (AC12 already tests "the Belliard encounter is byte-identical at every tier";
> Rev. 3 promotes that clause from belt-and-braces to the point of the test). Implementation shape: a field on the Niveau Final authored row,
> never a module constant.

**Why this is the right mechanical shape, not just the cheap one.** Shortening the lull does
**not** make the fight easier: `maxBlownWindows` is unchanged, so the efficiency bar the
player must clear (≈ 62 % of windows answered, boss spec §4.2) is **identical**. What changes
is that the openings come _sooner_ in the two phases where he actually hides: phase 1's cycle
goes 3.6 s → 3.2 s (−11 %) at the strongest tier. The player's reward is **less waiting behind
a shield**, i.e. an enemy with less cover — the mechanic and the fiction say the same sentence.
A reward that lowered HP would have said "he is hurt", which is a lie a photograph cannot tell.

**Advisory A-1, answered.** The gate asks whether lever 2 (décor prop) still arms inside a
compressed lull. Under the phase-scoped decision the worst compressed lull is **phase 2 at
1.28 s** (0.94 s after a shield break) versus baseline 1.60 s (1.10 s) — a −0.32 s / −0.16 s
change on a beat that already survives the gated −0.5 s cut. I assert no new arming failure,
and hand it to `senior-architect` as a **regression assertion to add**, not a design change:
_lever 2's arming window must be re-checked against the compressed row_ (AC12).

### D7.2 AMENDMENT A1 to the gated shield-break spec (**K-3**)

`spec-boss-shield-break-tempo-shot.md` is **GATED** (ADR-0060). R1 composes with its §6-B
lever, so it amends it. **I do not edit that file.** The block below is the amendment,
verbatim-transcribable by whoever holds that spec's lane, numbered in its own series (it has
no prior amendment):

> ### AMENDMENT A1 — composition with the photo-proof lull multiplier — proposed 2026-08-01
>
> _Source: `spec-photo-qte-paparazzi.md` §D7.1 (Rev. 2), design gate `design-gate-photo-qte.md`
> K-3. Amends §6-B and the §6-B headroom table. No decision of this spec is reversed._
>
> 1. The Niveau Final `bossQteSpec` gains an authored **`rewardMultiplier`** (`×1.00` default),
>    applied to `shieldedLull` in **phases 1 and 2 only**; phase 3 is always `×1.00`. Belliard
>    is untouched.
> 2. **Order of operations is fixed:** `lull_effective = rewardMultiplier × shieldedLull`, THEN
>    `SHIELD_BREAK_LULL_CUT` is subtracted from that value, THEN the existing
>    `shieldedLull > telegraphLeadSeconds` clamp applies. The multiplier never bypasses the
>    clamp and the clamp never bypasses the multiplier.
> 3. **New compound floor, asserted in code against the runtime row** (not trusted from data):
>    `rewardMultiplier × shieldedLull(p) − SHIELD_BREAK_LULL_CUT ≥ telegraphLeadSeconds(p) +
LULL_RESIDUAL_FLOOR`, with **`LULL_RESIDUAL_FLOOR = 0.35 s`** — pinned to the worst
>    headroom this spec's own §6-B table already ships (phase 3: `0.70 − 0.35`). This is the
>    assert that keeps the −0.5 s cut from ever being silently eaten by the clamp.
> 4. Legal `rewardMultiplier` values are therefore `≥ ×0.781` (phase 2 binds). Shipped tiers:
>    ×1.00 / ×0.90 / ×0.80.
> 5. §6-B's "at the shipped table values the floor never binds" remains true **at ×1.00** and
>    must be re-read as "never binds at any legal `rewardMultiplier`" once point 3 ships.
>
> **No re-gate of this spec is required** if the transcription is verbatim (gate protocol,
> same as AMENDMENT A2 of `spec-boss-qte-differentiation.md`, 2026-07-20).

**Never a gate — and now implemented as such.** The boss is fully beatable at ×1.00; the
set-piece is skippable; the contact sheet always offers a **decline** that leaves at ×1.00 in
one press (§1.3, K-4); no progression depends on a photograph (fiction §5.3, ADR-0077 D1
"authored set-pieces").

**Bonus stacking is deliberately flat** (any one bonus gives the full ×0.80; a second adds
nothing mechanical). Rationale: two bonuses on a 6-frame roll would otherwise demand a
near-perfect run to feel complete, and completionist pressure on an optional set-piece is
how optional content becomes mandatory. The **second** bonus pays in fiction instead — R3's
UNE variant is gated on LA PLAQUE specifically (fiction §5.3), which is the right home for a
prestige reward. (Gate condition F-2: the UNE variant itself is deferred out of V1 to `pm`.)

---

## 7. Invariant floors — asserted in code against authored data, never trusted

House discipline (ADR-0035 D2, ADR-0034 G4/G5): every one of these is a unit-tested assert in
`createPhotoQte` (or equivalent) against the authored set-piece data, including any future
difficulty curve.

| ID      | Floor                                                                                                                                                                                                                             | Value / rule                                                                                                                                                                                                                                                                                        | Set-piece #1 (**Belliard**, Rev. 3)                                                                             | Why it exists                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | Every instant's pose window ≥ `POSE_WINDOW_FLOOR`                                                                                                                                                                                 | **1.6 s**                                                                                                                                                                                                                                                                                           | 4.5 / 3.8 / **2.9** ✓                                                                                           | Must fit tell-read + reframe + `FOCUS_HOLD` + click within human reaction.                                                                                                                                                                                                                                                                                                                           |
| **F2**  | Every instant preceded by a tell ≥ `TELEGRAPH_LEAD_FLOOR`, strictly before `openAt`                                                                                                                                               | **1.2 s**                                                                                                                                                                                                                                                                                           | **1.8** ✓ (computed need 1.42 s)                                                                                | No un-telegraphed instant ever ships. The zoom traverse must fit in the tell.                                                                                                                                                                                                                                                                                                                        |
| **F3**  | Every instant (master **and** bonus) overlaps a cover window by ≥ `COVER_OVERLAP_FLOOR`                                                                                                                                           | **1.2 s**                                                                                                                                                                                                                                                                                           | 4.5 / **1.5** / 2.9 ✓                                                                                           | Guarantees a **zero-suspicion perfect run exists**. A bonus reachable only by risking the run is a trap, not a bonus. This is the anti-frustration floor that replaces a decay.                                                                                                                                                                                                                      |
| **F4**  | Every instant's valid focal band is non-empty, inside `[FOCAL_MIN, FOCAL_MAX]`, ratio ≥ `FOCAL_BAND_FLOOR`                                                                                                                        | **1.10×**                                                                                                                                                                                                                                                                                           | 2.03 / 2.04 / **1.43** ✓                                                                                        | An instant you cannot legally frame is a bug shipped as difficulty.                                                                                                                                                                                                                                                                                                                                  |
| **F5**  | **Three legs — see §7.1 below.** Sway share of **effective** slack · untracked grace on a moving subject · pan authority                                                                                                          | a: ≤ 60 % master / ≤ 80 % bonus · b: ≤ 100 % master / ≤ 130 % bonus · c: `PAN_RATE_MAX ≥ v_max + v_sway_peak`                                                                                                                                                                                       | a: 39 / **54** / **75 %** ✓ · b: 54 / **116 %** ✓ · c: 12.0 ≥ 10.19 ✓                                           | The mandatory shot is never a coin flip; a bonus may be hard; and "hard" never means "geometrically impossible". Calibrates `SWAY_AMP_X` and `PAN_RATE_MAX`.                                                                                                                                                                                                                                         |
| **F6**  | Film count                                                                                                                                                                                                                        | `≥ instantCount + 2` **and** `≤ 8`                                                                                                                                                                                                                                                                  | 6 (floor 5, ceiling 8) ✓                                                                                        | Lower ⇒ a single mistake is fatal; higher ⇒ the contact sheet needs pagination (UX §4.1).                                                                                                                                                                                                                                                                                                            |
| **F7**  | Silent-shutter headroom `SUSPICION_MAX / SUSPICION_SHUTTER_EXPOSED`                                                                                                                                                               | **≥ 2**                                                                                                                                                                                                                                                                                             | 100/34 = 2.94 ⇒ **2 silent frames survivable** ✓                                                                | Never spotted by a single mistake. Anti-"mort bullshit", non-lethal edition.                                                                                                                                                                                                                                                                                                                         |
| **F8**  | Non-lethality                                                                                                                                                                                                                     | `SPOTTED` moves **no** energy, **no** score, ends **no** run, advances **no** quota                                                                                                                                                                                                                 | ✓                                                                                                               | ADR-0077 D7. Asserted as a zero-delta test, not a code-reading promise.                                                                                                                                                                                                                                                                                                                              |
| **F9**  | `SHUTTER_ARM_SECONDS + FOCUS_HOLD ≤ 0.5 ×` shortest pose window                                                                                                                                                                   | 0.40 + 0.35 = 0.75 ≤ 1.45 ✓                                                                                                                                                                                                                                                                         | ✓                                                                                                               | The arming rule must never eat the window it protects.                                                                                                                                                                                                                                                                                                                                               |
| **F10** | **COMPOUND** with the gated `SHIELD_BREAK_LULL_CUT` (§D7.2 amendment): `m × lull(p) − 0.5 ≥ telegraphLead(p) + ε`, `ε = 0.35 s`; `m` applies to **phases 1-2 of the Niveau Final row only**                                       | `m ≥ ×0.781` (phase 2 binds) · shipped ×1.00 / ×0.90 / ×0.80                                                                                                                                                                                                                                        | residual 0.65 / **0.38** / 0.35 s ✓                                                                             | The reward may never curve the boss's fairness floors away **nor silently eat a second gated lever** (§D7.1, K-3).                                                                                                                                                                                                                                                                                   |
| **F11** | Determinism                                                                                                                                                                                                                       | no `Math.random`, no `Date.now`, no per-tick PRNG cursor, anywhere in the set-piece                                                                                                                                                                                                                 | ✓                                                                                                               | ADR-0077 guardrail; grep/lint-asserted like ADR-0034 Rev. 3.                                                                                                                                                                                                                                                                                                                                         |
| **F12** | **Subject-track honesty — three legs, see §7.2 below**                                                                                                                                                                            | drawn == box (± `SUBJECT_BOX_TOLERANCE`) · no transit before the tell · total on `[0, sceneDuration]`                                                                                                                                                                                               | 9 keyframes §2.5 ✓                                                                                              | The brackets are the player's only live read: a box that disagrees with the picture, or that moves before its tell, turns "bien cadré" into a lie (K-2).                                                                                                                                                                                                                                             |
| **F13** | **Attempt budget, AUTHORED** — authored frozen time of one un-skipped attempt                                                                                                                                                     | `briefingMax + establish + sceneDuration + develop ≤ **90 s**`                                                                                                                                                                                                                                      | attempt 1 = **77.8 s** ✓ _(Rev.5)_ · retry = **62.8 s** ✓                                                       | An optional set-piece may never front an unbounded loop onto the 3-5 min mission promise (K-4). **This floor bounds AUTHORED time only** — it is code-assertable and it is never the proof of the 3-5 min constraint (that is F14). The measured leg is AC13(b).                                                                                                                                     |
| **F14** | **Composed mission budget, WALL CLOCK (Rev. 5, D-1b / G-4)** — the real time of ONE Belliard mission in the **worst legal case**: every frozen block, every published reading budget, every cap elapsed, attempt budget exhausted | **a (authored, code-assertable):** `briefingMax + attempts × (establish + scene + develop) ≤ **155 s**` · **b (wall clock, the actual bound):** `90 + briefingMax + attempts × 62.8 + decisionBudget + readBudget + hostageWorst(21.5) ≤ **280 s**` (⇒ ≥ 20 s reserve under the 300 s hard ceiling) | a: **140.6 s** ✓ · b: **279.1 s = 4.65 min** ✓ (reserve **20.9 s**) · one-attempt path **209.3 s = 3.49 min** ✓ | **T-6 / D-1b:** Rev. 4's F14b summed authored time and defended a real-time promise with it — `+60 s` of published sheet budget against `38 s` of headroom ⇒ **5.37 min**. An authored floor may bound a machine; only a wall-clock floor may bound a promise made to a player (**G-4**). Derivation and readability rationale: §1.3.a-bis. Stated for `BELLIARD_BOSS_ENABLED = false` (Decision 6). |
| **F15** | **Frozen-scene separation (Rev. 4, D-1)** — played seconds between the exit of one frozen block and the entry of the next, on the Belliard line                                                                                   | **≥ 8.0 s**                                                                                                                                                                                                                                                                                         | `12 − 2.5 = **9.5 s**` ✓ (would be 4.0 s at `t_p = 8`, ✗)                                                       | Two frozen scenes a handful of played seconds apart stop reading as a mission. This is what pins `triggerAtElapsedSeconds` to the bottom of `[2, 8]` mechanically, not by taste.                                                                                                                                                                                                                     |

### 7.1 F5, in full — the three legs (**K-1**)

With `fovW(f) = 3500 / f`, `s_eff(f) = (fovW − B.w)/2 − FRAME_MARGIN × fovW` (§3.3.a),
each leg evaluated at the instant's **geometric mid-band focal** (`√(f_min · f_max)`):

| Leg     | Assert                                                                                  | Ceiling                              | Set-piece #1                    |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- |
| **F5a** | `SWAY_AMP_X / s_eff(f_sweet)`                                                           | **≤ 0.60** master · **≤ 0.80** bonus | 0.390 / **0.541** / **0.751** ✓ |
| **F5b** | `(SWAY_AMP_X + v_subject × FOCUS_HOLD) / s_eff(f_sweet)` — the **untracked** worst case | **≤ 1.00** master · **≤ 1.30** bonus | 0.390 / **0.541** / **1.158** ✓ |
| **F5c** | `PAN_RATE_MAX ≥ max(v_subject) + 1.5 × MAX_LEG_DISPLACEMENT / SWAY_LEG_DURATION`        | strict                               | `12.0 ≥ 3.103 + 7.09 = 10.19` ✓ |

- **F5a** is the K-1 fix: it is measured against `s_eff`, never the raw slack.
- **F5b** bounds how much of the hold a moving subject may eat. `≤ 1.00` on a master means the
  mandatory shot is holdable **without panning at all**; `≤ 1.30` on a bonus permits the
  tracking demand LA PLAQUE is authored to make — and the spec must then **state the demand as
  a number** (§3.3.b: ≥ 1.20 su/s). A bonus may be hard; it may not be secretly impossible.
- **F5c** guarantees the player can always out-run subject + worst tremor **simultaneously**.
  Without it, "hard" could silently mean "the input cannot physically produce the correction".
- **Evaluated at the sweet spot, on purpose.** F5a is breached above ≈ 258 mm on LA PLAQUE and
  at `FILL_MAX` everywhere; that is the authored self-punishing top of range (§3.3.a, AC5),
  **not** a floor violation. Nobody should "fix" it.

### 7.2 F12, in full — subject-track honesty (**K-2**)

Asserted in code **against the authored keyframe table** (§2.5), never trusted:

1. **The drawn subject IS the validation box.** (a) The AF brackets are drawn from the _same_
   `subjectTrack(t)` value T3/T4 consume — no parallel constant, no render-side offset, no
   second source of truth. (b) At **every keyframe**, the authored box equals the opaque-pixel
   AABB of that keyframe's **enumerated drawn elements** (§2.5) within
   **`SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 % of the box dimension)`** per edge, and idle
   animation on a hold pose stays inside the same tolerance. Direct application of the gated
   _décor aim-honesty_ ruling (design gate 2026-07-20, `README.md`): catch geometry coincides
   with the drawn silhouette, or the player is asked to eat a bug.
2. **No transit before the tell.** For every consecutive pair of instants, `subjectTrack` is
   **constant on `[closeAt(n), tell(n+1)]`** — assertable on the authored keyframes as: no
   keyframe strictly inside that interval carries a different value, and the values at both
   ends are equal. All transit lives inside `[tell(n), openAt(n)]`. This also forbids the
   symmetric **retro-leak** (a box relaxing at `closeAt`, which would announce that a moment
   just ended). §2.1 carries the reasoning.
3. **Total and finite.** `subjectTrack(t)` is defined, finite and inside the plate for every
   `t ∈ [0, sceneDuration]`, including before the first instant (K0) and after the last (K8);
   the first and last keyframes sit exactly on `t = 0` and `t = sceneDuration`.

#### 7.2.a — N-2: what the F12(1) check must assert, and on WHAT (Rev. 4)

The gate found a real enforcement hole and it is mine to close in spec form: three of my
promises are **interval** properties, and `check-photo-subject-boxes.mjs` currently controls
**at the keyframes**. A reverse-out that dips and comes back, or a hold pose that wanders and
returns, passes at both ends and lies in between. **The shape of the control is mine; the step,
the tooling and the implementation are `qa-lead` + `dev-tooling-assets`.**

| #   | Property                                                      | Interval (not the endpoints)             | What must be asserted **at every sampled `t` of the interval**                                                                        |
| --- | ------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Drawn == box** (F12(1b))                                    | the whole of `[0, 60.0]`, per segment    | `AABB(drawn(t))` vs `subjectTrack(t)` per edge, within `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)`.                                   |
| 2   | **The reverse-out is FLAT** (art constraint 7, §10.5)         | `[53.0, 55.9]`                           | `abs(cy(AABB(drawn(t))) − 9.00) ≤ 0.40 su`. Sampling only 53.0 and 55.9 admits an arc; the constraint IS the absence of the arc.      |
| 3   | **The reverse-out does NOT grow** (art constraint 8, §10.5)   | `[53.0, 55.9]`                           | `w, h` of `AABB(drawn(t))` vs the authored `7.50 × 4.22`, within the same tolerance — monotone growth is exactly what endpoints hide. |
| 4   | **The two hold poses do not drift** (art constraint 6, §10.5) | `[K2, K3]` (19.2 s), `[K4, K5]` (14.7 s) | Same test against the **constant** authored box: idle animation lives inside the tolerance for the entire beat, not just at its ends. |

Two rules on the sampling itself, because they are design properties and not tool choices:

- **The step must be strictly finer than the shortest thing it must catch.** The shortest
  interval under control is LA PLAQUE's 2.9 s; a step that samples it fewer than ~10 times
  cannot distinguish a flat track from a shallow arc. `qa-lead` picks the number; a step that
  produces fewer than 10 samples on `[53.0, 55.9]` does not satisfy this spec.
- **Sample the ANIMATION, not the interpolation.** The point of the interval check is the
  drawn sprite's real frames between keyframes. Sampling a re-interpolation of the authored
  table against itself proves nothing and would be a green light that asserts nothing.

Failing any of these is an **art re-delivery**, not a tolerance widening — and if the drawn
reverse-out genuinely must arc or grow, that is a **re-author of K6/K7** which moves
`3.103 su/s`, F5b, F5c, §3.3.b and AC6c: it comes back to me (§10.5 item 8).

---

## 8. Consolidated value table (the deliverable)

**System constants** (**Belliard**-first, exactly as the hostage QTE's wander constants are —
promoted to authored fields only when a second set-piece needs to curve them):

| Constant                            | Default                                                                                                                  |     | Constant                        | Default                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `PHOTO_ESTABLISH_SECONDS`           | 2.0 s                                                                                                                    |     | `SWAY_AMP_X`                    | **2.00 su** _(Rev.2)_                                                                          |
| `PHOTO_DEVELOP_SECONDS`             | 0.8 s                                                                                                                    |     | `SWAY_AMP_Y`                    | **1.125 su** _(Rev.2)_                                                                         |
| `PHOTO_BRIEFING_MAX_SECONDS`        | **15.0 s** _(Rev.5, was 25.0 — D-1b)_                                                                                    |     | `SWAY_LEG_DURATION`             | 0.55 s                                                                                         |
| `CONTACT_SHEET_READ_BUDGET`         | **20.0 s** _(Rev.5, was 30.0 — design budget, never a timer)_                                                            |     | `SWAY_LEG_DURATION_RM`          | 1.30 s                                                                                         |
| `CONTACT_SHEET_DECISION_BUDGET`     | **7.0 s** _(Rev.5, new — non-terminal sheet, design budget)_                                                             |     | `FROZEN_BLOCK_BGM_DUCK_DB`      | **−24 dB** _(Rev.5, §1.3.b)_                                                                   |
| `FROZEN_BLOCK_BGM_DUCK_IN_MS`       | **1200 ms** _(Rev.5, §1.3.b)_                                                                                            |     | `FROZEN_BLOCK_BGM_DUCK_OUT_MS`  | **1600 ms** _(Rev.5, §1.3.b)_                                                                  |
| `SHUTTER_ARM_SECONDS`               | 0.40 s                                                                                                                   |     | `MIN_LEG_DISPLACEMENT`          | **0.50 su** _(Rev.2)_                                                                          |
| `FOCUS_HOLD`                        | 0.35 s                                                                                                                   |     | `MAX_LEG_DISPLACEMENT`          | **2.60 su** _(Rev.2)_                                                                          |
| `FOCAL_MIN` / `FOCAL_MAX`           | 35 / 300 mm                                                                                                              |     | `PAN_RATE_MAX`                  | **12.0 su/s** _(new)_                                                                          |
| `ZOOM_TRAVERSE_SECONDS`             | 2.2 s                                                                                                                    |     | `SUSPICION_MAX`                 | 100                                                                                            |
| `FRAME_MARGIN`                      | 0.04                                                                                                                     |     | `SUSPICION_SHUTTER_EXPOSED`     | +34                                                                                            |
| `FILL_MIN`                          | 0.45                                                                                                                     |     | `SUSPICION_SHUTTER_COVERED`     | 0                                                                                              |
| `FILL_MAX` (derived)                | 0.92                                                                                                                     |     | `SUBJECT_BOX_TOLERANCE`         | **max(0.40 su, 5 %)** _(new)_                                                                  |
| `TELEGRAPH_LEAD_PHOTO`              | 1.8 s                                                                                                                    |     | `LULL_RESIDUAL_FLOOR` (ε)       | **0.35 s** _(new, boss-side)_                                                                  |
| ~~`PHOTO_MAX_ATTEMPTS`~~            | ⚠️ **SUPPRIMÉ (Rev.6.1)** → donnée authored `maxAttempts`, §A.12                                                         |     | `FROZEN_SCENE_SEPARATION_FLOOR` | **8.0 s** _(Rev.4, F15)_                                                                       |
| Floors **F1–F28**                   | §7 + **§A.8** + **§A.13.3.b** (F20) + **§A.14** (F21, F22) + **§A.16** (F22 assertable, F22b, F23) + **§A.17** (F24–F28) |     | `DECOY_COUNT_MIN` / `_MAX`      | **2 / 6** _(Rev.6.2 — **6 est désormais une contrainte, plus un plafond de confort**, §A14.6)_ |
| `OCCLUSION_REJECT_RATIO`            | **0,25** _(Rev.6.5, T6 — rougit 10 pp avant la perte d'un visage ; ×4,7 la tolérance de boîte, §A17.1)_                  |     | `CLEAR_AISLE_FLOOR`             | **1,2 s** _(Rev.6.5, F24 — `FOCUS_HOLD + SHUTTER_ARM + 0,45`, §A17.3)_                         |
| `OCCLUSION_WARNING_FLOOR`           | **1,00 s** _(Rev.6.5, F26 — `0,35 + 0,40 + 0,25`, §A17.4)_                                                               |     | `OCCLUSION_PENUMBRA_MIN`        | **3,0 su** _(Rev.6.5 — dessinée, **jamais comptée** dans T6 ; +1,0 su achète +1,0 su/s)_       |
| `WALKER_SPEED_MIN` / `_MAX`         | **3,0 / 8,0 su/s** _(Rev.6.5, F27 / conséquence arithmétique de F26 au pire focal)_                                      |     | `WALKER_SCALE_MIN`              | **1,35 ×** la figure debout ⇒ **≥ 18,2 su** _(Rev.6.5 — diagonale 60 m, `60/45 = 1,33`)_       |
| `WALKER_COUNT` (bornes)             | **4** _(visé, Rev.6.6)_, bornes **[2, 6]** _(Rev.6.5, §A17.6)_                                                           |     | Plafond de pression             | **≤ 15 % de `sceneDuration`** = 9,0 s _(Rev.6.5, F28)_                                         |
| `CANDIDATE_CENTRE_SEPARATION_FLOOR` | **6,0 su** _(Rev.6, F17 = 3 × `SWAY_AMP_X`)_                                                                             |     | `IDENTIFICATION_LEAD_FLOOR`     | **8,0 s** _(Rev.6.2, F19 — mesuré contre `masterOpenAt`, §A14.4)_                              |
| `DECOY_ERROR_ALLOWANCE`             | **2** _(Rev.6, F6 re-dérivé — `filmCount` 6 → **8**)_                                                                    |     | `PHOTO_BRIEFING_MAX_SECONDS`    | ⚠️ **18,0 s proposé** _(Rev.6.2, allégé de 20,0 — §A14.5)_                                     |
| `SIGNAL_BIND_RADIUS`                | **4,5 su** _(Rev.6.4, F23a — < 11,5/2, §A16.2)_                                                                          |     | `SIGNAL_EXCLUSION_RADIUS`       | **6,0 su** _(Rev.6.4, F23b — `11,5 − 4,5 = 7,0 ≥ 6,0` ✓)_                                      |

**Rev. 5 note for lane A (zero-rework substitution).** The five changed/new values above are
**authored tuning data and nothing else**. `PHOTO_MAX_ATTEMPTS` stays **2**; the phase machine,
the typed contract, the CTA presence/absence at the cap and every cadence value (`ACTIVE`,
windows, keyframes, tiers) are **unchanged**. A lane coding against Rev. 4 substitutes the
numbers in the constants table and is done — provided, as F13/F14 already require, they live in
that table and are hard-coded nowhere else. The three `FROZEN_BLOCK_BGM_*` values are the
audio-wiring lane's, per §1.3.b(5) — behaviour, not level data.

**Authored per set-piece** (`photoQteSpec` — the data shape is `senior-architect`'s call):

| Key                                        | **Belliard** set-piece #1 (Rev. 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scenePlate`                               | **la bouche du passage, rue Belliard** (`x_norm 0,372–0,408`), vue plongeante depuis la lucarne du haut de rue — `100 × 56.25 su` ≈ 13,0 × 7,3 m (art request: fiction Rev.3 §6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sceneDuration`                            | 60.0 s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `filmCount`                                | **8** _(Rev.6, §A5.3 — F6 re-dérivé avec `DECOY_ERROR_ALLOWANCE = 2` ; plancher 7, plafond UX 8, grille 2×4 sans pagination)_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `swaySeed`                                 | integer, **pinned at stage-5 `verify`** (§9 AC10 — the ADR-0034 K-5 discipline)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `coverWindows`                             | **traffic waves** — `WAVE_PERIOD` 21.0 s, `WAVE_FIRST_OPEN` 10.0 s, `WAVE_COVER_SECONDS` 7.0 s, `WAVE_TELL_SECONDS` 1.8 s ⇒ [10,17] [31,38] [52,59] (§4.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **`signalBindings`** _(Rev.6.4, nouveau)_  | `{ signal: 1\|2\|3, carrier: PropId \| EventId, candidate: CandidateId }[]` — **9 bindings** attendus (F22b : 3 signaux × 1 master + 2 leurres). C'est **ici** que vit le signal n°1, **pas dans le sprite de la table** (§A.16). Assertions : **F22** (aucun leurre ne porte 1 ∧ 2), **F22b** (décompte 2/2/2 exact), **F23** (placement des props : `BIND ≤ 4,5 su` de son candidat, `≥ 6,0 su` de tout autre).                                                                                                                                                                                                                                                                                                                                                                                                |
| **Instants de swap / retrait** _(Rev.6.4)_ | swap `commandant_table_apres` **52,2 s** (fenêtre légale `]51,20 ; 53,00[`, **dans le transit** — le seul intervalle où F12(1) n'est pas asserté ponctuellement) · retrait leurre **D5 50,4 s** · retrait leurre **D6 52,0 s** (encadrent le tell #3 à ±0,8 s ⇒ **F18** couvert sur le tell #3 **seulement** ; tells #1 et #2 restent dus, Rev. 6.5). Un leurre retiré **garde sa piste** (F12(3)) et **F17 tient à la position de repli**.                                                                                                                                                                                                                                                                                                                                                                      |
| ~~`subjectTrack`~~ → **`candidateTracks`** | ⚠️ **CONTRAT TYPÉ MODIFIÉ (Rev.6, §A.2)** — `{ id, role: "master" \| "decoy", keyframes: { t, cx, cy, w, h }[] }[]`. La piste `master` = **les 9 keyframes de §2.5, inchangées** ; **6 pistes `decoy`** (les 7 tables, §A.13.3) authorées en **Rev. 6.2** à la livraison du plateau dense. Chacune interpolée linéairement et totale sur `[0, 60.0]` (F12(3) × 7).                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **`walkerTracks`** _(Rev.6.5, nouveau)_    | `{ id: WalkerId, keyframes: { t, cx, cy, w, h }[] }[]` — **collection SÉPARÉE de `candidateTracks`** : jamais résolue par `C*`, jamais comptée par F16/F22b, jamais soumise à F17 ni à F12(3) (elle **a le droit d'être hors plateau**, c'est ainsi qu'elle entre et sort du cadre). Rendue **devant tout candidat**. **Keyframes non authorées ici** (même raison qu'en §A.2) ⇒ **Rev. 6.6** avec le plateau dense. Visé : **4 marcheurs**, bornes `[2, 6]`. Assertions : **F24** (allée dégagée ≥ 1,2 s par instant sur sa couverture ; **zéro occultation du master sur `[36,5 ; 38,0]` et `[53,0 ; 55,9]`** sur Belliard), **F25** (noyau dessiné == boîte, en intervalle), **F26** (avertissement ≥ 1,00 s à tout focal), **F27** (`v ∈ [3,0 ; 8,0] su/s` à tout `t`), **F28** (≤ 15 % de la scène). §A.17. |
| `instants`                                 | the three rows of §4.2 (`openAt`, `closeAt`, `role`, tell)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `briefingMaxSeconds`                       | ⚠️ **18,0 s proposé** _(Rev.6.2, allégé de 20,0 — un signalement de **scène** coûte moins de mots qu'un signalement **facial**, §A14.5. **En attente de ratification du gate.** 15,0 s ne loge pas trois signaux conjonctifs ⇒ F21 deviendrait invérifiable par le joueur)_, skippable (§1.3), **played on attempt 1 only** (§1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `triggerAtElapsedSeconds`                  | **2.5 s** — authored window `[2.0, 3.0]`, **frozen and free for lane A** (D-1 closed, §1.3.a decision 5). Pinned by **F15** (`12 − 2.5 = 9.5 s ≥ 8.0`), not by taste. Above 4.0 s the floor breaks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `maxAttempts`                              | ⚠️ **RÉGLABLE (Rev.6.1, décision Bertrand)** — **départ authored : 1**, point de départ et non verdict (§A.12). **Borne : `F14b(n) ≤ 280 s` assertée sur la valeur authored** ⇒ max légal **1** aujourd'hui ; `2` = 289,8 s ✗ tant que ~9,8 s ne sont pas rendues par le plan otage ou `pm` (A12.4). Reste **mission-scoped** (R3-6 intact). La forme à deux CTA (A-1) est **conditionnée** par la valeur, pas supprimée.                                                                                                                                                                                                                                                                                                                                                                                        |
| `enabledOnFirstRun`                        | **false** — the set-piece does **not** trigger on the player's first Belliard run (ruling **R3-5**). The exact predicate is `pm`'s; the "not the first" is not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `rewardMultiplier`                         | **×0.90** master-only, **×0.80** master + ≥1 bonus, **×1.00** on decline — authored on the **Niveau Final** `bossQteSpec`, applied to **phases 1-2 only** (§D7.1, amendment §D7.2). Not a field of this set-piece's own data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## 9. Acceptance criteria (design VERIFY, stage 5 — Sacha playtests `verify` vs. these)

- **AC1 — State machine.** `ESTABLISHING` (2.0 s, forced-lowered, clock frozen) → `ACTIVE`
  → exactly one of `SPOTTED` / `ROLL_END` / `SCENE_END` → `DEVELOPING` → `CONTACT_SHEET` →
  `DONE`. Forward-only, no phase revisited. **All three** terminals reach the contact sheet.
- **AC2 — Posture.** Releasing the hold instantly (next tick) zeroes sway, freezes suspicion,
  disarms the shutter, and **retains the focal value**; re-raising restores that focal and
  arms the shutter only after 0.40 s. A shutter input while lowered or unarmed produces
  **zero** film, suspicion, sound and record (delta-asserted across the tick).
- **AC3 — Validation contract.** The five tests are conjunctive and evaluated against the
  drawn frame. Unit tests: a shot too wide (`fill < 0.45`) rejects; too tight (`fill > 0.92`
  or box clipping the 4 % margin) rejects; a shot fired before 0.35 s of continuous
  composition validity rejects as `blurred`; a valid shot outside every pose window rejects
  as `no-subject`; a valid shot inside L'ÉCHANGE returns `MASTER`.
- **AC4 — Two-beat feedback holds.** During `ACTIVE`, nothing on screen distinguishes an open
  instant from a dead beat, nor master from bonus (grep the frame's text + assert the bracket
  state depends only on T3/T4/T5). The click timbre and flash depend **only** on T5. The role
  is revealed **only** on the contact sheet.
- **AC5 — Zoom double trade-off is real.** In playtest: framing at `FILL_MAX` breaks the focus
  hold at **every** focal under sway alone (`s_eff = 0` by construction, §3.3.a); framing at
  the sweet spot holds with light counter-steer; 300 mm on LA PLAQUE is measurably worse than
  251 mm, and the degradation is visible from ≈ 258 mm up.
- **AC6 — Cadence and floors.** Windows/tells/cover match §4.2 within cadence tolerance;
  the **F1–F15** floors are asserted in code against the authored data (unit test), not just
  observed. In particular **a zero-suspicion full-set run is achievable** (F3): master +
  both bonuses, needle never leaves rest.
- **AC6b — Subject track (F12).** Unit tests on the authored keyframes: (a) brackets and the
  T3/T4 tests read the **same** `subjectTrack(t)` value (one source — assert by construction,
  not by inspection); (b) `subjectTrack` is byte-constant on `[closeAt(n), tell(n+1)]` for
  both dead beats; (c) it is defined and inside the plate for every `t ∈ [0, 60.0]`, with
  keyframes exactly on 0 and 60.0; (d) at every keyframe the box matches the drawn sprite's
  opaque-pixel AABB within `SUBJECT_BOX_TOLERANCE` (composite/visual check at `verify`, per
  the décor aim-honesty precedent); (e) a release fired during any of the three transits
  returns `no-subject`, whatever the brackets show.
- **AC6c — Tracking demand is real and bounded (F5b/F5c).** On LA PLAQUE at 251 mm: a raised,
  correctly-framed, **non-panning** player loses the hold before 0.35 s elapses (the bonus
  genuinely requires tracking); a player panning at ≥ 1.20 su/s completes it; and full pan
  input visibly out-runs subject + worst sway leg simultaneously.
- **AC7 — Suspicion economy.** Two silent shutters do **not** spot the player; the third
  does. A covered shutter moves the needle **zero**. The needle is frozen while lowered and
  while paused. No numeric suspicion value anywhere.
- **AC8 — Film economy.** Every armed release decrements film by exactly 1 regardless of
  verdict; `film → 0` ends the scene immediately; the 6-frame contact sheet fits one
  viewport with no pagination at both device classes.
- **AC9 — Reduced motion parity.** Under `prefers-reduced-motion: reduce`, the drift is slow,
  smooth and non-strobing, and the **valid-composition time fraction** at each instant's
  mid-band focal matches the standard mode within **±10 pp** over a 10 s raised sample
  (§3.4). Adjust `SWAY_LEG_DURATION_RM` only — one variable.
- **AC10 — Determinism.** Same `swaySeed` + same input sequence ⇒ byte-identical scene and
  sway path across two runs and across framerates/delta chunking; retry N is identical to
  retry 1. No `Math.random`/`Date.now` (grep-asserted). With the pinned seed, **each of the
  three instants presents at least one holdable 0.35 s composition window** — the K-5-style
  seed pin, confirmed empirically at `verify`.
- **AC11 — Non-lethality (F8).** Being spotted moves no energy, no score, ends no run,
  advances no quota, and returns the player to a checkpoint with a named reason on screen.
  Levels without a `photoQteSpec` are byte-for-byte unchanged (additive-and-optional law).
- **AC12 — Reward lever (if R1 is gated in).** The **Niveau Final** boss's `SHIELDED` lull is
  ×0.90 / ×0.80 per the roll's contents, **on phases 1 and 2 only** (phase 3 byte-identical at
  every tier); `bossHp`, damage, `EXPOSED`, tells and `maxBlownWindows` are **unchanged**
  (regression-asserted); **the Belliard encounter is byte-identical at every tier**; the
  **compound** assert `m × lull − SHIELD_BREAK_LULL_CUT ≥ telegraphLead + 0.35` passes at the
  strongest multiplier, on the **runtime** row, **and the −0.5 s cut is observed to actually
  apply** (never silently clamped away) at every tier; **lever 2's décor arming window still
  fits** the compressed phase-2 lull; the boss is beatable at ×1.00 (the set-piece is not a
  gate).
- **AC13 — Bonus, never gate; and it is bounded (K-4, F13).** (a) On a roll with **no** master
  proof — including a `SPOTTED` abort — the contact sheet shows **two** controls **while the
  attempt budget lasts** (see (d)), the primary one **leaves**, and **one press** returns the player to the **Belliard** delivery with the run
  intact and the boss at ×1.00. (b) The whole first-playthrough attempt, un-skipped and
  measured wall-clock at `verify` — briefing → set-piece → contact sheet → press — is
  **≤ 2 min**; the authored leg (F13) is asserted ≤ 90 s in a unit test. (c) The contact sheet
  never auto-dismisses. **(d) — Rev. 4, D-1:** `[ RECOMMENCER ]` is offered on attempt 1 and
  **absent** on attempt 2; on the exhausted sheet the single remaining control **leaves** in
  one press; the attempt counter **resets** when a new Belliard mission starts (asserted, both
  directions — a counter that never resets would smuggle in the rarity R3-6 forbids); a retry
  enters at `ESTABLISHING`, **never** at `BRIEFING` (delta-asserted: attempt 2's authored time
  is 62.8 s, not 87.8 s).
- **AC14 — The frustration hunt (ADR-0077's own stage-5 ask).** Over a first-contact playtest:
  no player burns a full roll without understanding why (the contact sheet names a reason per
  frame); no instant is missed for a reason the player could not perceive (tell present, ≥ 1.8 s,
  audible **and** visible); the `locked` bracket state makes `FOCUS_HOLD` learnable without copy;
  and the exhausted-budget sheet reads as an ending, not as a punishment. Deviations are
  reported as observations with the value I would move, one variable at a time.
- **AC15 — The composed Belliard mission, chronometered (imposed by the gate, E-8).** At
  `verify`, stopwatch the **total real time of one Belliard mission attempt including the
  set-piece**, measured **twice**: (a) with **1** set-piece attempt, (b) with **2** (budget
  exhausted). Report both against the 3-5 min constraint and against the **Rev. 5 F14b
  prediction of 279.1 s = 4.65 min** (worst legal case) and **209.3 s = 3.49 min** (one attempt)
  — **never against Rev. 4's 262.1 s, which T-6 disproved**. Also stopwatch the two reading
  budgets separately (terminal sheet vs. the sheet a retrying player leaves), since the whole
  bound rests on them: a terminal-sheet read consistently above **20.0 s** is the pre-declared
  trigger of §1.3.a-bis decision 6, not a tolerance to widen. Also report the **played** separation between leaving the contact sheet and the
  hostage duel freezing (F15, predicted 9.5 s). If `BELLIARD_BOSS_ENABLED` is on, measure that
  path too (§1.3.a decision 6). This is the measurement that closes or re-opens D-1 by
  observation instead of by argument; it **adds to** AC13(b), it does not replace it.

Sacha playtests the built set-piece against **AC1–AC15 _and_ the amendment criteria
AC16–AC29** (§A.11, §A.12, §A.14, §A.15, §A.16, **§A.17.7**) and reports PASS/deviations to
`lead-game-designer` **before** the architect's integration review (pipeline stage 5).
**Playtesting only AC1–AC15 leaves the whole dense-scene / decoy / walker layer unverified.**

---

## 10. Seams answered, and seams handed on

### 10.1 The four `ux-designer` seams — answered

| UX seam                                       | Answer                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Reduced-motion drift-curve calibration (§3.1) | §3.4: same amplitude, `SWAY_LEG_DURATION_RM = 1.30 s`, linear interpolation. Parity metric + AC9.                |
| Does `SPOTTED` reach the contact sheet? (§4)  | **Yes**, truncated, with `Réessayer`. §1.1, with rationale.                                                      |
| Hidden energy cost on abort? (§2.4)           | **None.** Energy and score are inert for the whole set-piece (§6.4, F8). The energy readout correctly stays off. |
| Film ceiling for a no-pagination sheet (§4.1) | **`filmCount = 6`**, ceiling asserted at 8 (F6). 2 × 3 grid.                                                     |

### 10.2 Back to `ux-designer` (Tony) — one reconciliation

**The AF brackets need a third state.** `dashed` (composition invalid) → `solid` (valid,
focus charging) → **`locked`** (focus held ≥ 0.35 s). Rationale in §2.3: without a lock read,
"focus tenu" is an invisible rule the player can only learn by burning film on dull clicks —
the frustration ADR-0077 explicitly asks stage 5 to hunt. It leaks nothing semantic. The
grayscale-distinguishability requirement (UX A6) now covers three states instead of two.
**Imposed on the UX spec as gate correction T-1** — settled, not a request.

**Rev. 2 adds a second reconciliation (gate T-3, pairs with my §1.3 / K-4):** the contact
sheet's failure branch is **not** one control. It is **`Décliner` (primary) + `Réessayer`**.
UX §4.3 and A14 need the second CTA and its focus order; the copy is Yasmine's (F-1).

### 10.3 To `narrative-designer` (Yasmine) — synchronised

Her §5.4 invariant is adopted verbatim and made mechanical (§D7): the reward touches
`SHIELDED` lull only, never HP, never `maxBlownWindows`. The bonus tier is **flat** (any one
bonus = the full ×0.80) — so the second bonus's payoff should be **fictional**, which is
exactly where her `PARIS-MINUIT` UNE variant belongs (fiction §5.3), gated on LA PLAQUE. Her
§3.3 proposal (bonuses land inside cover, the master proof straddles the end of a wave) is
**adopted as tuning** and hardened into floor F3, extended to the bonuses too.

**Rev. 3 — the relocation, back to her.** Her re-derived source (the traffic-light cycle) is
adopted with **her three orders of magnitude intact** — 21.0 s / 7.0 s / 1.8 s — but re-derived
rather than inherited (§4.1): the 21.0 s is a **wave interval**, not a light cycle, which needs
a **42 s two-phase junction** to hold up. If `sound-designer` or `art-advisor` cannot support a
42 s cycle feeding the street on both phases, **the cadence does NOT re-open** — we switch to
the **bakery fournil** fallback (mono-periodic, shipped prop, zero mechanical cost, §4.1 / §10.4).
Rev. 3 announced a ~90 s re-author here and that was wrong; corrected in Rev. 4 (**C-8**). The
residual risk is fiction + mix, not cadence. I also **decline** her §2.3 "bonus de lisibilité"
(the on-plate feu's colour doubling the audio cue), and the gate **hardened the refusal into a
prohibition (R3-2, §4.1)**: no element of the plate encodes cover except the headlights, neither
out of phase nor in phase. Please mark it in fiction §2.3 as **declined at the gate** so it is
not re-proposed (**C-6**).

**Rev. 4 — two copy asks, both one line:**

- **F-1 (still open, Rev. 2):** the contact sheet's failure branch needs a **decline** CTA
  label alongside `Réessayer` (§1.3). Her variant (c) — _« Alors ils remettront ça. Ils
  remettent toujours ça. »_ — is already the right sentence; I need the button.
- **F-1b (new, from D-1 / §1.3.a):** the **budget-exhausted** sheet — attempt 2, no retry
  offered, one control that leaves. It must read as an **ending, not a punishment** (AC14):
  the roll is finished, the night goes on. It is the same acceptance as variant (c), on a
  screen where no second chance is being withheld — it simply is not on offer any more tonight.

### 10.4 To `sound-designer` (Malik) — gameplay data, not dressing

The cover windows are **gameplay state**, not ambience: `[10,17] [31,38] [52,59]` s, with a
1.8 s audible approach before each. The mix must make "covered" and "silent" unmistakable
without looking at the needle, and the approach must be audible before it is visible.

**Rev. 3 — the source changed, the contract did not.** Not a métro; **a packet of vehicles
released by the crossroads at the top of rue Belliard**. Three things I need from the mix:

1. **One wave every `WAVE_PERIOD` = 21.0 s** — that interval is the datum. The 42 s two-phase
   light cycle carrying two packets (through traffic, then turners) is the **fiction that
   justifies** the interval; **it is never a value** (ruling R3-1, pin 1): nothing you author,
   name or test may contain **42**. **Gameplay constraint, not a mix preference (R3-1, pin 2):
   the two waves may differ in character — they must NOT differ in duration (7.0 s) nor in
   attack**, because both feed the same `inCover(t)` boolean and F3 assumes three windows of
   equal worth. A shorter "turners" wave breaks the zero-suspicion run for whichever instant
   falls in it.
2. **The tell is the engines rising at the line** — 1.8 s, and it comes from the **top of the
   street, close to the affût**, not from the far end. It must be unmistakably "something is
   about to arrive", never "something is happening down there".
3. **Silence must be genuinely dead** between waves (a rideau de fer, a néon, nothing else).
   The needle's whole lesson is that the safe state is the exception.

**The fallback, and its exact cost (R3-1).** If the two-phase junction does not survive your
pass or the playtest, the source becomes the **boulangerie's fournil/extractor** (fiction Rev.3
§2.3, shipped prop at `x_norm 0,340`) — **mono-periodic**: one wave every 21 s with no two-phase
reading needed, same duty, same tell shape. **Mechanical cost: zero**, because everything above
reads `WAVE_*` and never "a car". Say so plainly rather than stretching the junction fiction. The
shutter's **crisp vs. dull** click is the sole mechanical feedback channel for T5 (§2.4) —
an attentive ear must hear the difference with the visuals off.

### 10.5 To `lead-art` (Nico) — the reads, not the style

1. The player must identify **the subject box** at a glance in the wide preview (where is the
   action) and again through the lens. 2. The **tell** of each instant must read as "something
   is about to happen" 1.8 s ahead, in B&W photocopy. 3. The **wave approaching** must read
   visually as well as audibly — **the packet's headlights swinging into the top of the
   street**, not the on-plate feu's colour (§4.1: the onde verte puts it out of phase). 4. Three bracket states, three verdict stamps, all grayscale-distinguishable. Poses per
   fiction Rev.3 §6.

**Rev. 2 adds two hard constraints, both from F12 (gate E-6 already flagged them to Nico):**

5. **The drawn subject and the keyframe table are ONE deliverable, not two.** Each of the 9
   keyframes (§2.5) names the drawn elements its box is the AABB of; the delivered sprite's
   opaque-pixel AABB must match within `SUBJECT_BOX_TOLERANCE`. If art and table disagree,
   "bien cadré" becomes a lie — the same failure the décor aim-honesty ruling corrected.
6. **Two hold poses are required, and they must not drift**: the pair standing/talking
   (K2→K3, 19.2 s) and the pair post-exchange with heads still close (K4→K5, 14.7 s). Their
   idle animation must stay inside the same tolerance. A dead beat where the actors move is a
   semantic leak with extra steps.

**Rev. 3 adds two more, born from the passage geometry (§2.5) — both blocking for F12(1):**

7. **The reverse-out is FLAT in the frame.** Over `[53.0, 55.9]` the drawn number plate's AABB
   centre may not drift on `y` by more than `SUBJECT_BOX_TOLERANCE` (0.40 su): the authored
   track is horizontal at `cy = 9.00`.
8. **The reverse-out does NOT grow.** Same window, apparent scale constant within the same
   tolerance (authored box `7.50 × 4.22` throughout) — stage the manoeuvre near-parallel to the
   image plane. If the car must visibly approach the camera, that is a **re-author of K6/K7**
   which moves `3.103 su/s`, F5b, F5c, §3.3.b and AC6c: it comes back to me, it is not absorbed
   in the art pass.

**Rev. 4 adds the last constraint and a prohibition.** The gate re-issued E-6 at **7
constraints** (it had gone out at 4): mapped onto this section's numbering they are — the
needle is not a light meter (T-4), no interactive-glow vocabulary on the subject (F-4), item 5
(drawn == box), item 6 (two non-drifting hold poses), item 7 (flat reverse-out), item 8 (no
growth), and item 9 below. **The package is complete here; do not read it from the Rev. 3
techplan, which lists only the street-continuity addition.**

9. **Street continuity.** The plate must read as `street-wide.png` at first glance — the passage
   at `x_norm 0,372–0,408` (exclusion zone, no prop pops there), the boulangerie at `0,340`, the
   traffic light at `0,388` (the only tall prop, standing in front of the passage), the tagged
   rideaux de fer. The décor is **cited, not invented** (`spec-belliard-street-wide-repositioning.md`
   §0.2/§2.3).

> **PROHIBITION (mine, ruling R3-2 — cite it together with T-4 "the needle is not a light
> meter"): no element of the plate may encode the cover state, with the single exception of the
> packet's headlights.** The traffic light is **scenery and a light source**: animate it freely,
> it may not be read. Not out of phase (false causal model) and not in phase either (a free
> unbudgeted indicator that would make patience legible without listening — that is a tuning
> change wearing an art note's clothes, and it moves what F3 and §5.2 calibrate).

**How items 6-8 will actually be checked (N-2, §7.2.a):** on **intervals**, not at the
keyframes. A control that samples only `t = 53.0` and `t = 55.9` accepts a reverse-out that
arcs or grows in between, and a control that samples only K2/K3 accepts a hold pose that
wanders and comes back. The step is `qa-lead`'s; what must be asserted is in §7.2.a.

Everything else in fiction Rev.3 §6 (backdrop = the passage mouth, rideaux de fer, boulangerie
en amorce, feu tricolore, plunging view from the lucarne) is Yasmine's fiche and Nico's call;
my only read-level ask on the backdrop is that **the mouth of the passage stay the darkest
value on the plate**, because the manteau clair's contrast against it is what makes the master
proof legible at 132 mm in photocopy B&W.

### 10.6 To `senior-architect` (Winston) — for the tech plan

New pure system in `src/game` (state machine, subject track, validation, sway closed form,
suspicion/film ledgers) + a render surface in `src/render`. My asks: (a) the set-piece must
be **tick-gated by the existing `paused` flag**, not run beside the loop (§6.3); (b) the
composition-validity bit and the master/bonus role must be **two independently computed
fields** the render never receives conflated (UX §2.3 + my §2.4); (c) `photoQteSpec === null`
levels stay byte-for-byte deterministic (AC11).

**Rev. 2 adds four (they match gate escalation E-4):**

- (d) **`subjectTrack` data shape** — an array of `{ t, cx, cy, w, h }` sorted on `t`, linearly
  interpolated on all four components, with the F12(3) totality assert at construction. The
  brackets must consume the **same** evaluated value as T3/T4 — one call site, not two (F12(1a)).
- (e) **A run-scoped carry `Belliard → Niveau Final`** (Rev. 3 — the endpoints are renamed, the
  mechanism is unchanged). The roll's outcome (`none | master | master+bonus`) must survive
  between levels. No such carry exists today outside the run-stats work (ADR-0076) — this is a
  **new cross-level dependency** and it is yours to shape. Note the relocation makes it
  **longer-lived**, not shorter: the carry now spans the whole run from level 1 rather than a
  late-game level, so it must survive every intervening level transition and any mid-run
  retry — and it must be **inert** for a player who never triggers the set-piece.
- (f) **`rewardMultiplier` is authored on the Niveau Final `bossQteSpec` row**, never a module
  constant, and is applied **before** `SHIELD_BREAK_LULL_CUT` and **before** the existing clamp
  (order fixed by amendment §D7.2 point 2). Phases 1-2 only.
- (g) **The decline exit** (§1.3) must return control to the interrupted delivery without a
  reload of the **Belliard** level state — it is an exit from the set-piece, not a level restart.

**Rev. 4 adds three (D-1 closed + the gate's notes N-1/N-3):**

- (h) **N-1 — what the render projects from `inCover` is the ILLUMINATION, never the light's
  colour.** Techplan **D-J**'s decision is ratified without reserve (`trafficSignalPhase`,
  13.5 s, wall clock, never the source of truth for cover; re-tuning `TRAFFIC_PHASES` to 21 s
  is the D-F trap in costume). Its **wording** is what needs one line: the thing driven by
  `inCover(spec.cover, sceneClock, …)` is **the packet's headlights / the lighting of the mouth
  of the passage**, **not** the plate's traffic-light colour. The plate's feu does not consume
  `inCover` (ruling R3-2, §4.1). Blocking for lane B's brief, not for the build.
- (i) **N-3 closed — `triggerAtElapsedSeconds = 2.5 s` is free to freeze** (window `[2.0, 3.0]`,
  §1.3.a decision 5, floor F15). Lane A is unblocked.
- (j) **`PHOTO_MAX_ATTEMPTS = 2`, mission-scoped** (§1.3.a). Two shape asks: the counter lives
  with the mission attempt, **not** with the run and **not** with the save (a persisted counter
  would implement the rarity R3-6 forbids), and `BRIEFING` is entered iff `attemptIndex === 0`
  (§1.1) — the 25.0 s it saves per retry is load-bearing for F14, not a nicety.

---

## 11. Hand-off — Rev. 4 back to `lead-game-designer` (Karim)

### 11.0 Rev. 4 — the delta-gate residues, closed (2026-08-02)

**From:** `game-designer` (Sacha) · **To:** `lead-game-designer` (Karim) — closure of the
**PASS delta** verdict's blocking condition and of my share of its residues. **Nothing here
re-opens a ratified decision**; D-1 is answered inside the option set the gate framed.

#### D-1 — CLOSED, chiffré, assertable (§1.3.a)

I take **option (a)**: bound the re-entries, and let the already-gated `[ LAISSER TOMBER ]`
carry the ceiling. It costs a counter and a copy line, it re-opens nothing, and it does not
weaken the constraint the way option (c) would.

| The answer                              | Value                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen time of **one attempt**, chiffré | attempt 1 = **87.8 s** authored (≤ 120 s measured) · retry = **62.8 s** (≤ 90 s measured) — the retry drops `BRIEFING` (25.0 s), §1.1                                                                                                                                                                                                                                                                                      |
| **Retry bounding rule**                 | **`PHOTO_MAX_ATTEMPTS = 2`, mission-scoped.** At the cap, `[ RECOMMENCER ]` is **absent** and `[ LAISSER TOMBER ]` stands alone as the primary — the invariant "bonus jamais gate" holds _more_ strongly at the cap. **R2-5 untouched** (two paired CTAs remain the form while retry is offered). **R3-6 untouched** (the counter resets on a new Belliard mission — not rare, just not farmable inside one 90 s mission). |
| **New floors**                          | **F14** (a: photo frozen total ≤ 155 s ⇒ **150.6** ✓ · b: `90 + a + 21.5 ≤ 270 s` ⇒ **262.1 s = 4.37 min** ✓) · **F15** (`FROZEN_SCENE_SEPARATION_FLOOR = 8.0 s` of played time between two frozen blocks)                                                                                                                                                                                                                 |
| **`triggerAtElapsedSeconds`**           | **2.5 s**, authored window **`[2.0, 3.0]`** — **lane A may freeze it.** Pinned by F15 (`12 − 2.5 = 9.5 s ≥ 8.0`), not by taste; `t_p = 8` gives 4.0 s and breaks the floor, which is the value you called indefensible. 2.5 over 2.0 buys one full played input beat before the freeze, for 0.5 s the floor can afford.                                                                                                    |
| **New AC**                              | **AC13(d)** (the cap, the reset, the retry entry point) and **AC15** (your E-8 stopwatch) — plus **AC14**, which your §5 cites and which the spec did not actually carry. It does now.                                                                                                                                                                                                                                     |
| **What a 3rd attempt would cost**       | `324.9 s = 5.42 min` — **over**. That single line is the reason the cap is 2.                                                                                                                                                                                                                                                                                                                                              |
| **Stated honestly, not hidden**         | F14 is derived for `BELLIARD_BOSS_ENABLED = false`. With the flag on, a third frozen block enters the same mission; AC15 measures that path and it comes back to me before the flag ships (§1.3.a decision 6).                                                                                                                                                                                                             |

**On G-3 (E-3bis, Bertrand's):** the design holds **either way**. If G-3 is adopted, F14 is the
written bound it demands. If Bertrand rules that frozen time counts in full, **4.37 min is still
inside 3-5 min**. Only the vocabulary depends on the ruling.

#### Rulings taken as acted decisions

| Ruling   | Where it now lives                                                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R3-1** | §4.1 + §10.4 item 1: `WAVE_PERIOD = 21.0 s` is the **wave interval** and the **only** datum; **42 appears nowhere** in data, tests, audio or art briefs. Two waves may differ in character, **never in duration (7.0 s) nor attack** — a gameplay constraint on E-7, not a mix note. |
| **R3-2** | §4.1 + §10.5: refusal **hardened into a prohibition** — no element of the plate encodes cover except the headlights, **neither out of phase nor in phase**; the feu is scenery and a light source. Cited alongside T-4. Consequence N-1 forwarded to Winston (§10.6 h).              |
| **R3-3** | §1.1: `BRIEFING` is in the phase table and **carries the ellipse** of the climb and the way down; skippable for the player, never absent from the machine.                                                                                                                           |
| **R3-5** | §8: `enabledOnFirstRun = false`. The set-piece does **not** trigger on the first Belliard run. Predicate to `pm`, the "not the first" is not.                                                                                                                                        |
| **R3-6** | §1.3.a + §8: **no rarity.** The attempt cap is deliberately **mission-scoped**, and AC13(d) asserts the reset in both directions so nobody turns the counter into persistence.                                                                                                       |

#### My residues, closed

| ID      | Status            | Where                                                                                                                                                                   |
| ------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-2** | closed            | §1.2, since Rev. 3 — the T-2 device fork; every posture rule reads the **state**, never the input.                                                                      |
| **C-5** | closed            | Cahier-des-charges verdict (§ head) + §1.1 — "pré-niveau" and "before the loop" are gone; the set-piece is **inside** the mission.                                      |
| **C-6** | closed            | §4.1 (R3-2 block) + §10.3 — the "bonus de lisibilité" is marked **declined at the gate**, with the ask to Yasmine to mark it in her §2.3.                               |
| **C-7** | closed            | §11.4 — ADR-0077 **is** on the branch (`docs/adr/0077-…`, verified) and **E-1 is CLOSED**. The false line is deleted, not softened.                                     |
| **C-8** | closed            | §4.1 (bakery fallback at **zero mechanical cost**, the ~90 s claim withdrawn) + §1.1 (`BRIEFING` in the phase table).                                                   |
| **N-2** | closed, spec-side | §7.2.a — the four interval properties, what must be asserted at every sample, and two rules on the sampling. Step + implementation to `qa-lead` / `dev-tooling-assets`. |

### 11.0.a Rev. 3 — the relocation amendment (2026-08-02)

**From:** `game-designer` (Sacha) · **To:** `lead-game-designer` (Karim) — for information and
one small ruling; then `sound-designer`, `concept-artist` / `lead-art`, `senior-architect`.

**This is not a re-gate: it is the execution of Bertrand's decision** (host level = Belliard,
override of R-10). Everything Karim ruled in rounds 1 and 2 stands except that one line.

**What I re-derived, and the answer:**

| Question the relocation asked                             | Verdict                                                                                                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the traffic-light source carry 21.0 / 7.0 / 1.8 s?   | **Yes — but only read as a 42 s two-phase cycle feeding the street twice** ⇒ wave interval 21.0 s (§4.1). Derived, not inherited. A 21 s _cycle_ would not have held. |
| Do the absolute windows move?                             | **No.** [10,17] [31,38] [52,59], tells 8.2 / 29.2 / 50.2 — identical.                                                                                                 |
| Does the triptych still work (L'ÉCHANGE astride a close)? | **Yes**, and it is now **causal**: the pair wait for the street to empty before the handover (§4.2).                                                                  |
| Does floor **F3** still hold?                             | **Yes**: 4.5 / **1.5** / 2.9 s of overlap, floor 1.2 s. Instant 3's compliance is now **structural** (no headlights ⇒ no readable plate).                             |
| Do the 9 keyframes survive the passage / reverse-out?     | **Yes, with zero values moved** — and `3.103 su/s` becomes ≈ **0.40 m/s**, i.e. physically right for a reverse (§2.5). Two **new art constraints** are the price.     |
| Anything the relocation makes _worse_?                    | **One thing, and I flag it loudly**: the Niveau-Final-only scope of `rewardMultiplier` lost its "Belliard comes first anyway" safety net (§D7.1, Rev. 3 box).         |

**Rulings I asked Karim for (two, both small) — BOTH RULED at the delta gate; kept here for the
trail, answered in §11.0:**

1. **The 42 s two-phase reading of the junction.** → **RATIFIED (R3-1)** with two pins.
   ~~"the cadence re-opens and the scene grows to ≈ 90 s"~~ — **withdrawn (C-8)**: the bakery
   fournil fallback is mono-periodic, so failure costs **fiction + mix, not cadence** (§4.1).
2. **My refusal of fiction §2.3's "bonus de lisibilité"** (the on-plate feu's colour as a
   second cover read). Reason: the onde verte offsets it ≈ 7 s from the audio tell, so it would
   teach a false model. → **SUSTAINED and HARDENED into a prohibition (R3-2)**: neither out of
   phase nor in phase, the in-phase version being an unbudgeted difficulty change (§4.1).

**C-2 (round-2 editorial correction) is closed** — §1.2 now specs the T-2 device fork
(hold Space desktop / tap-to-toggle mobile) and states explicitly that every posture rule
reads the **state**, never the input, so D1.a/D1.b/D1.c are device-agnostic.

### 11.1 Rev. 2's hand-off — the four blocking corrections (unchanged)

**From:** `game-designer` (Sacha) · **To:** `lead-game-designer` (Karim), design gate round 2.
**Requesting:** closure of **K-1, K-2, K-3, K-4**. Round 1's ten points are ruled and I do not
re-open a single ratified one below.

#### 11.1.a The four blocking corrections — what Rev. 2 changed

| ID      | The hole                                                                                                               | What Rev. 2 does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Where                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **K-1** | F5 measured sway against **raw** slack; T3 had already spent `FRAME_MARGIN`. Master 65 % / ≤60 %, plaque 90 % / ≤80 %. | `s_eff(f) = (fovW − B.w)/2 − FRAME_MARGIN × fovW` **pinned as a formula** so it cannot drift again, and the isotropy proof (`s_eff_y = s_eff_x / 1.7778`) written down. **`SWAY_AMP_X` 2.4 → 2.00 su** (not your 2.13 ceiling: 2.13 satisfies the floor at **zero** headroom, and a floor with no margin is a floor the next box re-author breaks silently). New shares **39 / 54.1 / 75.1 %** — both breaches closed with ≈ 5 pp of margin. Dependent constants rescaled (`SWAY_AMP_Y` 1.125, `MIN/MAX_LEG_DISPLACEMENT` 0.50/2.60). **F5 becomes three legs**: a) sway share, b) **untracked grace** — which is where your "the honest combined budget is above 90 %" observation lands: it is **115.8 %**, and I now state the exact pan the plaque demands (**≥ 1.20 su/s**) instead of leaving it implicit; c) **pan authority**, a hole nobody had costed — `PAN_RATE_MAX = 12.0 su/s`, sized to beat subject + peak sway simultaneously.                                                                                                                                                                                          | §3.3, §3.3.a, §3.3.b, §4.3, §7.1   |
| **K-2** | `subjectTrack` had no keyframes, and free interpolation pre-announced the next subject.                                | **The 9-keyframe table is authored** (`t`, centre, size, drawn elements, segment) with the staging it implies. The leak is closed by a **structural** rule, not a tolerance: **the track is piecewise-constant except during a telegraph** — all transit lives inside `[tell(n), openAt(n)]`. Two consequences I owe you: it also kills the symmetric **retro-leak** (a box relaxing at `closeAt` would announce that a moment just ended — T2 leaked one beat late), and **a transit can never produce a verdict** (F2 ⇒ T2 false throughout ⇒ `no-subject`), which is what makes it legitimate to assert F12(1) at keyframes only. **F12 written in your three legs**, with 1(a) strengthened: brackets and T3/T4 must read the _same_ evaluated value — one call site — so drawn==box holds by construction rather than by inspection. `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)`.                                                                                                                                                                                                                                                   | §2.1, §2.5, §7.2, §10.5            |
| **K-3** | F10 checked the multiplier alone; composed with the gated −0.5 s cut, ×0.70 shipped 0.34 s < 0.35 s tell.              | **ε pinned by quotation, not preference: `LULL_RESIDUAL_FLOOR = 0.35 s`** = the worst headroom `spec-boss-shield-break-tempo-shot.md` §6-B **already ships and was gated at**. Then the arithmetic decides for us: phase 3 needs `m ≥ ×1.000`, so a **uniform** multiplier is arithmetically dead unless ε is shaved to the 0.05 s you already refused. **Decision: the multiplier is PHASE-SCOPED — phases 1-2 only, phase 3 always ×1.00.** Tiers re-tuned **×0.90 / ×0.80** (Rev. 1's ×0.75 breaches _phase 2_'s compound floor; the wall is ×0.781, written down). Non-cumulative `min()` recorded as the rejected alternative with its reason (it makes the photo reward invisible on every broken lull). **`rewardMultiplier` scoped to the Niveau Final row only**, Belliard byte-untouched. **R1 transcribed as AMENDMENT A1** (5 numbered points, including the fixed order of operations) for verbatim transcription into the gated spec — **which I did not edit.** Advisory A-1 answered: lever 2's worst compressed lull is phase 2 at 1.28 s / 0.94 s post-break, no new arming failure, handed on as a regression assert. | §D7.1, §D7.2, F10, AC12            |
| **K-4** | `DONE` offered only `Réessayer` on failure — "bonus, jamais gate" asserted in prose, contradicted in the screen.       | **Two controls on `DONE`, always, and the leaving one is primary on both branches**: `Continuer` with a master proof, **`Décliner`** without (incl. `SPOTTED`), one press, run continues, boss at ×1.00. Budget written as a **floor**: `PHOTO_BRIEFING_MAX_SECONDS 25 s` (skippable) + establish + scene + develop = **87.8 s ≤ 90 s** (F13, code-assertable) and the measured full attempt ≤ **2 min** (AC13). `CONTACT_SHEET_READ_BUDGET 30 s` is explicitly a **design** budget, **not** an auto-dismiss — a verdict screen that closes itself would defeat the two-beat feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §1.1, §1.3, §4.4, F13, AC13, §10.2 |

### 11.2 Ratifications applied, not re-opened

`SPOTTED` → contact sheet · `SUSPICION_SHUTTER_EXPOSED = +34` with **no decay** (F3 carries
the anti-frustration guarantee) · `filmCount = 6` · `FOCUS_HOLD = 0.35 s` as a HOLD ·
D1.a / D1.b · ~~host level **Stalingrad** (R-10)~~ → **Belliard, Rev. 3, decision Bertrand,
R-10 annulé** · R1 + R3, R2 rejected · the "moins couvert,
jamais moins de PV" invariant · the flat bonus tier · floors F1/F2/F3/F4/F6/F7/F8/F9/F11 ·
the focal bands, windows, telegraph and traverse arithmetic you re-derived. **Untouched.**

### 11.3 The three rulings Rev. 2 asked for (still open unless already ruled)

1. **`SWAY_AMP_X = 2.00 su`, not your 2.131 ceiling.** I traded ≈ 3 pp of master difficulty
   for ≈ 5 pp of headroom on both binding cells. If you want the tension back, ×0.55 of the
   master's slack (2.03 su) is the most I would take and it re-opens LA PLAQUE's margin.
2. **The phase-scoped multiplier (K-3).** This is the one place I did not do what the
   correction literally said: you asked for a compound floor asserted on the multiplier, and
   the compound floor — once ε is honest — says the multiplier cannot exist in phase 3 at all.
   So I scoped it out of phase 3 rather than shrinking it into meaninglessness (×0.875 uniform
   at best). If you prefer the non-cumulative `min()` model instead, it is a one-line swap in
   F10 + amendment point 2, and the tiers go back to a uniform value. **Your call, stated as
   an option rather than decided alone**, because it changes what the reward _feels_ like.
3. **F5b's bonus ceiling of 1.30** — i.e. "a bonus may require tracking, a master may not".
   It is the only genuinely new fairness threshold in Rev. 2 and it is the one that lets
   LA PLAQUE stay as hard as the fiction wants it.

### 11.4 Still open, not mine

**E-1 is CLOSED (C-7, corrected in Rev. 4).** `docs/adr/0077-qte-photo-paparazzi-set-pieces.md`
**is on this branch** — the gate read it and compared it at round 2 with zero divergence, and I
verified the file myself this round. Rev. 3's line saying otherwise was stale and a false line in
a hand-off becomes a false line in the next one; it is deleted, not softened. **No value in this
spec is provisional on E-1 any more.**

**E-3bis (Bertrand, new):** **G-3** — does frozen scene time count against "une mission =
3-5 minutes"? My §1.3.a holds under either answer; see §11.0. **E-2** (§8.3 ideological flag)
and **E-3** (G-1/G-2) remain Bertrand's.

**E-4** (`senior-architect`) grew to seven asks — §10.6 (d)-(g) from Rev. 2/3, plus **(h) N-1**
(what projects from `inCover` is the illumination, never the light's colour), **(i) N-3 closed**
(`triggerAtElapsedSeconds = 2.5 s`, lane A unblocked) and **(j)** the mission-scoped attempt
counter. The run-scoped **Belliard → Niveau Final** carry (e) is still the one with real
architecture in it, and the relocation makes it **longer-lived** (level 1 → final).

**E-5** (`pm`): **Q-3 is tranchée by the design — the set-piece does NOT trigger on the first
Belliard run (R3-5)**; the predicate is yours, the "not the first" is not (§8,
`enabledOnFirstRun`). **Q-4 is CLOSED, no rarity (R3-6)** — do not send it back as a balance
problem; if the lever plays too strong, the honest knob is the Niveau Final tier row
(×0.90/×0.80). **Q-2**: banking at clear contradicts K-4 — decide it knowing that. And the
return night's placement relative to the **Belliard boss encounter** must never leak into the
reward (§D7.1, ruling R3-4: the Belliard encounter stays ×1.00 forever, and that is not an
oversight — diffusion takes days, not minutes).

**E-6** (`lead-art`) is re-issued at **7 constraints plus one prohibition** — read it from
**§10.5**, which is complete, not from the techplan. **E-7** (`sound-designer`): source changed,
**cadence unmoved**; brief in §10.4, with R3-1's two pins (21.0 s is the datum, 42 is not a
value; two waves, same duration and attack) and the zero-cost bakery fallback.

**E-8** (`qa-lead`, imposed by the gate): **AC15** is transcribed in §9. **N-2** is specified in
**§7.2.a** — the interval properties and what must be asserted; the sampling step and the
implementation are yours with `dev-tooling-assets`.

**What I do NOT decide:** the fiction and cast (`narrative-designer`), controls,
accessibility envelope and HUD dress (`ux-designer`), the look (`lead-art`), the sound
palette (`sound-designer`), the lane split and data shape (`senior-architect`), gate-vs-bonus
in the progression (`lead-game-designer` + `pm`).

**After the verdict:** hand-off logged in `docs/handoffs/`, indexed in
`docs/agent-handoffs.md`; status reported in `docs/game-design/README.md`. If the gate
changes any ADR-0077 decision, that ADR is **superseded, not rewritten** (its own
Follow-up clause).
