# QTE photo paparazzi — fiction du PREMIER set-piece

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **Rev.3, amendement post-gate** · **Date:** 2026-08-02 ·
**Frame:** `docs/adr/0077-qte-photo-paparazzi-set-pieces.md` (Proposed)

---

## AMENDEMENT Rev.3 — relocalisation sur BELLIARD (décision Bertrand, 2026-08-02)

> **Décision de Bertrand, finale : le premier set-piece photo est hébergé sur BELLIARD**
> (le niveau 1 shippé, `street-wide.png`), **pas sur un nouveau niveau Stalingrad.**
> Cette décision **override le ruling R-10 du design gate** (« Stalingrad, quai de la Loire,
> ne pas rouvrir ») et l'annule. **Aucun nouveau niveau n'est à construire.**

**Périmètre de l'amendement — ce qui change :**

| Section                         | Changement                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| §2 (entière)                    | Nouveau lieu d'affût + nouveau lieu de la scène + nouvelle couverture sonore + moment ajusté. R-10 retiré.  |
| §1.3                            | Ajout : le set-piece et le boss partagent désormais la même rue — pourquoi c'est un gain, pas un doublon.   |
| §3.1 / §3.2                     | Décor des trois instants (viaduc/quai → passage/rideau de fer). Le triptyque lui-même est **inchangé**.     |
| §3.3                            | Réécrite : nouvelle source sonore, contraintes de cadence conservées.                                       |
| §4 (backdrop, ids, l. 4/8/9/11) | Répliques de briefing qui citaient le quai / le métro aérien / l'entrepôt KANAL. Ids de scène `belliard_*`. |
| §4.3 (c) `ROLL_END`, CTA        | Une image de décor, et « retour à la livraison » (plus « Stalingrad »).                                     |
| §5.1                            | Canal de diffusion : « le quartier » au lieu du 19e nommé.                                                  |
| §6                              | Fiche backdrop du set-piece.                                                                                |
| §7                              | Liste d'authenticité 1998.                                                                                  |

**Ce qui NE change pas (canon, non rouvert) :** la cible = **le Commandant** (§1) ·
l'enveloppe et le second homme anonyme (§3.1) · le triptyque **ARRIVÉE / L'ÉCHANGE / LA
PLAQUE** (§3.2) · `filmCount = 6` (§3.4) · le **canon gravé E-2** (§1.1, §8.3) · les deux CTA
`[ RECOMMENCER ]` / `[ LAISSER TOMBER ]` (§4.3) · « isolé jamais affaibli » (§5.4) ·
alternative B = set-piece n°2 (§1.2) · bonus jamais gate (§5.3).

**Conséquence budgétaire à noter pour le gate :** l'ADR-0077 D9 impose une planche 2D dédiée
dans les deux cas — donc Belliard ne coûte pas plus cher en art **et** économise le niveau.
L'argument « Belliard coûte l'invention d'une couverture sonore de substitution » (R-10)
tombe : la source retenue (§2.3) est un **prop déjà shippé du niveau**, pas une invention.

---

**Ce qui avait changé en Rev.2 (round 2 du gate)** (`design-gate-photo-qte.md`, round 1) :

| Entrée                                 | Effet sur cette spec                                                                                                                                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E-2 tranché par Bertrand — RATIFIÉ** | §8.3 est **canon gravé**, plus un flag. Toute formulation conditionnelle sur ce point est retirée (§1.1, §8.3).                                                                                                                                                             |
| **F-1** (blocking, paire avec K-4)     | §4.3 : copy de **refus** écrite, deux libellés de CTA, variante (c) couvre les trois terminaux + le rouleau vide.                                                                                                                                                           |
| **F-2**                                | (a) + (b) + (c) shippées au V1. La UNE `PARIS-MINUIT` sort du V1 (§5.3, §5 bonus).                                                                                                                                                                                          |
| **F-4**                                | Demande art **autorisée**, avec les deux contraintes de Karim reportées en §6.                                                                                                                                                                                              |
| **K-4a** (mécanique)                   | Le refus est le chemin « bonus, jamais gate ». Vérifié sans friction sur les 3 variantes (§4.3, §4.4).                                                                                                                                                                      |
| **E-3**                                | G-1 / G-2 valent comme **exception pour ce QTE**, pas comme règles générales (§7).                                                                                                                                                                                          |
| Ratifications du gate                  | Cible = le Commandant (§1) · alt. B = set-piece n°2 (§1.2) · ~~Stalingrad (§2)~~ **annulé Rev.3** · triptyque (§3.2) · « isolé jamais affaibli » = **invariant** (§5.4) · `filmCount = 6` (§3.4) · `SPOTTED` atteint la planche contact tronquée (§4.3). **Non rouvertes.** |

**Extends (ne rouvre pas) :** `spec-boss-encounter-fiction.md` (identité du Commandant),
`spec-boss-belliard-fiction.md` (le bouclier = cover prop), `pregame-copy-deck.md` §9
(canon gaté : SPIRALE 23 / KANAL SYSTEM / NADIR 94 / PARIS-MINUIT).

Registre de référence = les scènes **shippées** dans `src/game/systems/narrativeSystem.ts`
(DISPATCH sec et impératif, KENZA de terrain, MUF laconique). Période **1998 Paris, circuit
free-party** — francs, info-lines `08 36`, répondeurs, argentique ; zéro vocabulaire
post-2000. Toutes les strings joueur sont en **français** ; les notes de travail en français
aussi (cohérent avec les specs fiction précédentes). **Aucun code ici** — `dev-gameplay`
transcrit, je ne touche pas `src/game/**`.

Cette spec répond à l'**open question « the first set-piece's target and fiction »** de
l'ADR-0077 et donne une **recommandation** sur l'open question « exact reward of the
blackmail lever » (co-terrain avec `game-designer`).

---

## 0. Ce que cette spec décide — et ce qu'elle ne décide pas

| Décidé ici (**ratifié au round 1**, sauf mention contraire)              | Pas décidé ici                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| La **cible** du premier set-piece, argumentée contre 2 alternatives (§1) | Toute valeur de tuning (pellicule, jauge, sway, seuils) — `game-designer` |
| Le **lieu** et le **moment** diégétiques (§2)                            | Le schéma de contrôle desktop/mobile — `ux-designer`                      |
| La **scène compromettante** : arrivée / L'ÉCHANGE / plaque (§3)          | La forme exacte du levier mécanique — `game-designer` (§5 = reco)         |
| Les **textes de briefing** DISPATCH/KENZA + planche contact (§4)         | Le placement dans la progression et le hors-V1 — `pm`                     |
| Les **libellés des deux CTA** de la planche contact (§4.3, F-1)          | La hiérarchie visuelle de ces deux boutons — `ux-designer`                |
| La **reco narrative** sur ce que la preuve débloque (§5)                 | Le look des personnages — `concept-artist` → `lead-art` (§6 = fiche)      |

---

## 1. La cible — décision et alternatives écartées

### 1.1 Décision en une ligne

**Le premier set-piece photographie le Commandant en train d'encaisser.** Pas un nouveau
gradé, pas un anonyme : **le seul flic que le joueur connaît déjà par son nom**, surpris en
train de prendre une enveloppe des mains d'un **patron de boîte de nuit** — un civil de
l'establishment de la nuit, jamais nommé, identifié seulement par sa plaque.

Le sujet de la photo n'est donc pas « un flic ripou » : c'est **la raison de tout le jeu**.
Depuis Belliard le joueur fuit des fenêtres sans savoir pourquoi la BAC s'acharne sur des
teufs qui ne volent rien à personne. La photo répond : **on paie pour ça**. La répression
n'est pas de l'ordre public, c'est du nettoyage de concurrence commandé par la nuit légale.

> **Canon gravé** (Bertrand, 2026-08-01, escalade E-2 du gate). Ce n'est plus une proposition :
> la répression du circuit free-party est **commanditée et payée par la nuit légale**. Toute
> fiction ultérieure écrit à partir de là. Voir §8.3.

### 1.2 Pourquoi lui, et pas une alternative

**Alternative A — un subalterne anonyme (« un capitaine de la BAC »).**
Défendable : ça préserve le Commandant pour plus tard, ça n'engage pas le canon capstone, et
ça laisse une échelle d'escalade (subalterne → chef). **Écartée** pour trois raisons :

1. **Lisibilité.** Un set-piece photo dure quelques dizaines de secondes, muet, à travers une
   lunette. Le joueur doit reconnaître la cible **en moins d'une seconde**, en B&N photocopié,
   à 300 mm. Le Commandant a déjà un sprite shippé, une silhouette ratifiée (tête nue, pas de
   casque — `spec-boss-belliard-fiction.md` §2) et un nom que le joueur a entendu. Un capitaine
   inédit, c'est un personnage à apprendre **pendant** le QTE. Non.
2. **Coût.** L'ADR-0077 dit explicitement que les set-pieces restent **peu nombreux et
   authored** (coût art par set-piece). Dépenser le premier — peut-être le seul — sur un
   inconnu, c'est payer plein tarif pour un enjeu nul.
3. **Zéro fiction nouvelle.** Photographier le chef **n'invente aucune faction** : il est déjà
   l'apex du roster §7 (BAC de nuit, alimenté par les RG). L'alternative A, elle, ajoute un
   échelon nommé de plus au cast pour un gain nul.

**Alternative B — l'officier RG qui paie un indic.**
Très tentante : ça branche direct sur le troisième bras du roster §7 (« un contact retourné
garde une apparence normale ») et ça ferait de la photo l'outil qui **démasque** un des
contacts de Muf. **Écartée pour le PREMIER set-piece, réservée pour le second.** Raison : elle
suppose que le joueur a déjà des contacts nommés à trahir — or les 5 contacts §7 ne sont pas
encore in-game (`pregame-copy-deck.md` §9). La trahison ne fait mal que si on connaît le
traître. **Recommandation : garder B en réserve explicite comme set-piece n°2**, une fois les
contacts recrutables shippés. Notée ici pour qu'elle ne soit pas réinventée.
**RATIFIÉ au gate (R-F1) : l'officier RG est réservé comme set-piece n°2.** Ce n'est plus une
suggestion, c'est une réservation de canon — on n'écrit pas un autre sujet à cette place.

### 1.3 Le piège évité : ce set-piece n'est pas « le boss fight en version photo »

Objection légitime au gate : si le Commandant est déjà le boss qu'on abat, le photographier
fait doublon. Non — **les deux beats ne disent pas la même chose** :

- Le **boss fight** dit : _il te barre la route, dégage-le_.
- Le **set-piece photo** dit : _il n'est pas ta fatalité, il est l'employé de quelqu'un_.

**Ajout Rev.3 — le boss et la photo partagent maintenant la même rue.** `spec-boss-belliard-fiction.md`
§1.1 a posé que le Commandant tient le porche de Belliard **en personne**, sans déléguer. La
relocalisation transforme cette bizarrerie en explication : **il est là parce que c'est là qu'il
encaisse.** Le passage où il prend l'enveloppe est à trente mètres du porche qu'il bloque. Il ne
descend pas dans le 19e par zèle de chef de rue — il descend parce qu'il a un rendez-vous dans
cette rue-là, et qu'il en profite pour verrouiller la porte de son client. Le décor **paie une
dette de fiction** ouverte par la spec boss : on n'invente rien, on répond.

Et surtout, la photo **ne le tue pas** : elle lui retire sa couverture. Ce qui alimente
directement la ligne **déjà shippée** du niveau final — `« Cette nuit il n'a plus personne
pour le couvrir. Il descend lui-même. »` Aujourd'hui cette phrase n'a qu'une cause : les flics
débordés du 31 décembre. Avec le set-piece, elle en gagne une **seconde, gagnée par le
joueur** — sans changer un octet du dialogue shippé. C'est le meilleur argument en faveur de
cette cible : elle **rembourse** du canon existant au lieu d'en ajouter.

---

## 2. Lieu et moment — RÉÉCRITE Rev.3 (Belliard)

### 2.1 Lieu de l'affût — la lucarne, en haut de la rue Belliard

**Muf est sur les toits.** Il monte par la cage d'escalier du dernier immeuble de la rue —
celui au **pignon aveugle** — et se cale dans une **lucarne de la mansarde**, à plat ventre
sur le zinc, le boîtier posé sur le rebord.

Ce n'est pas une invention : c'est une **réplique shippée**. Dans `belliard_pre`, DISPATCH dit
déjà `« Les flics patrouillent depuis la manif. Reste sur les toits. »` Le set-piece **exécute
littéralement** l'ordre que le joueur a lu à sa première nuit de jeu. Là où le briefing
d'origine disait « reste en hauteur pour ne pas te faire prendre », le set-piece ajoute :
_en hauteur, on ne fait pas que se cacher — on voit._

Pourquoi cette position tient :

- **Ligne de vue.** La lucarne est au bout de la rue ; la cible est au **tiers gauche**
  (`x_norm ≈ 0,39`, cf. `spec-belliard-street-wide-repositioning.md` §0.2). C'est toute la
  diagonale de la rue — soixante, soixante-dix mètres en enfilade, sans un obstacle : la
  distance qui **justifie le 300 mm**, et l'angle plongeant qui explique qu'on voie le fond
  du passage depuis la rue.
- **Personne ne regarde en l'air.** La rangée de pop du niveau est aux **fenêtres** (rangées
  A/B/C) ; les toits, eux, n'ont jamais rien accueilli. L'affût est le seul point de la rue
  que le jeu n'a jamais utilisé comme menace — donc le seul crédible comme planque.
- **Zéro conflit de lecture.** Le set-piece se joue **depuis** un endroit d'où l'on ne tire
  jamais. Le joueur ne peut pas confondre le beat photo avec un beat de tir : la position elle-
  même est neuve.

### 2.2 Lieu de la scène — la bouche du passage, entre la boulangerie et le mur-pignon

**Le passage.** Le renfoncement noir entre deux immeubles, `x_norm 0,372 – 0,408` du décor
shippé — la faille verticale sombre déjà relevée par `spec-belliard-street-wide-repositioning.md`
§0.2 comme **zone d'exclusion** (aucune fenêtre, aucun pop, aucune cible) et comme **repère de
navigation** du tiers gauche.

C'est le meilleur endroit de la rue pour un rendez-vous qu'on ne veut pas voir, et le canon
mécanique le dit déjà sans le savoir : **c'est le seul point de la rue où le jeu a décidé que
personne ne regarde jamais.** Une berline s'y engage à moitié, feux éteints ; le reste de la
rue continue à ne rien voir.

Pourquoi ce lieu et pas un autre :

- **Il est déjà dessiné.** La « respiration » du passage, les rideaux de fer taggés qui
  l'encadrent, la **BOULANGERIE** à sa gauche (`x_norm 0,340`) : tout est dans `street-wide.png`.
  La planche 2D dédiée (ADR-0077 D9) ne fabrique pas un lieu — elle **rapproche** un lieu que
  le joueur a déjà panné cent fois sans le voir. C'est le meilleur retournement possible.
- **Il est adjacent au porche du boss.** Trente mètres. Le Commandant tient une porte et
  encaisse dans la ruelle d'à côté (§1.3).
- **Il a sa lumière.** Le **feu tricolore** est planté juste devant, `x_norm 0,388` — c'est le
  seul prop haut du niveau (`spec-belliard-street-wide-repositioning.md` §2.3). Il éclaire par
  intermittence la sortie du passage : c'est **lui** qui rend la plaque lisible au départ de la
  berline (§3.2, instant 3), et c'est **lui** qui porte la couverture sonore (§2.3). Un objet
  déjà shippé fait tout le travail.
- **Le contraste B&N est gratuit.** Un homme en manteau **clair** dans une bouche d'ombre
  **noire** : le read se fait au ton, à 300 mm, en photocopié. Le passage est le fond le moins
  cher et le plus lisible du niveau.

### 2.3 Couverture sonore — LE FEU DU CARREFOUR, en haut de la rue

**Source retenue : le carrefour au bout de la rue Belliard.** Le feu tricolore du niveau
(`x_norm 0,388`, prop shippé) est **synchronisé sur celui du carrefour** ; à chaque vert, le
carrefour lâche un **paquet de voitures et de deux-roues** qui descend la rue d'un coup, phares
et moteurs, puis s'écoule. Entre deux verts, la rue Belliard est **vide et muette** — un rideau
de fer, un néon de tabac, rien.

Ça donne, sans qu'on invente une seule ligne de fiction, exactement la forme dont la mécanique
a besoin :

| Contrainte mécanique (valeurs exactes = `game-designer`) | Ce que la fiction fournit                                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Période ~21 s, déterministe**                          | Un cycle de feu. C'est **la machine périodique de la rue** : elle ne varie pas, elle ne se négocie pas, et le joueur le sait depuis l'enfance.  |
| **Fenêtre couverte ~7 s**                                | Le temps qu'un paquet de véhicules relâché au vert défile devant l'affût. Un tiers du cycle : la proportion réelle d'un feu de carrefour.       |
| **Tell audible ~1,8 s avant**                            | Le **paquet qui redémarre** en haut de la rue : les moteurs qui montent avant que la vague arrive. On entend venir la voiture avant de la voir. |

Trois raisons de préférer cette source à toute autre :

1. **Elle est déjà à l'écran.** Le feu est le seul prop haut du décor Belliard, déjà placé
   **devant le passage** pour des raisons d'occlusion (§2.3 de la spec décor). On ne dessine
   rien, on ne pose rien : on **écoute** ce qui était déjà planté là. L'objection R-10
   (« Belliard coûte l'invention d'une couverture sonore ») tombe.
2. **Elle est déterministe par nature.** Un feu ne tire pas au sort. Le brief `sound-designer`
   est trivial (boucle de cycle + montée de moteurs), et le garde-fou ADR-0077 — jamais
   `Math.random`, jamais `Date.now` — est **soutenu par la fiction elle-même**, pas subi.
3. **Elle est period-correct sans effort.** Paris 1998, minuit, un carrefour de boulevard des
   Maréchaux qui coule toute la nuit : diesel, scooters, un bus. Zéro anachronisme, zéro
   technologie à dater.

**Bonus de lisibilité (à `sound-designer` + `ux-designer`, pas une exigence de ma lane) :** le
feu étant **visible** dans le décor, sa couleur peut doubler l'information sonore sans un mot
de tutoriel. Je le signale ; l'arbitrage (et le risque « ça se lit comme un feu de circulation
qu'on doit respecter ») ne m'appartient pas.

**Alternative en une ligne, si le feu ne tient pas au playtest :** le **fournil de la
BOULANGERIE** (devanture shippée, `x_norm 0,340`) — l'extracteur du four qui se relance en
cycle, soufflerie pleine puis silence, avec le moteur qui monte avant de souffler ; même forme,
même déterminisme, period-correct (on cuit la nuit en 1998), mais moins lisible à l'écran parce
qu'aucun objet ne le montre.

### 2.4 Moment — une nuit de retour rue Belliard, 23 h 40, avant le camion

**23 h 40, une livraison rue Belliard, avant que le camion arrive.** Muf est monté en avance ;
la scène dure le temps de quelques cycles de feu.

Quatre raisons :

1. **Ça ne gate rien.** Le set-piece se joue **avant** la boucle `Récupérer → Livrer → Éviter`,
   comme une scène pré-niveau qui serait jouable — jamais au milieu d'une livraison. La règle
   « une mission = 3-5 minutes » tient : le set-piece est **court, et hors du chrono**.
2. **Ça justifie la solitude.** Muf seul, sur le zinc, avant tout le monde : ni foule ni sono,
   donc le silence entre deux verts est crédible, donc le risque au déclenchement l'est aussi.
3. **Ça ne casse pas le premier gig.** La rue est la même, la **nuit** ne l'est pas : c'est un
   **retour** rue Belliard, pas la nuit du tutoriel. Le joueur a déjà appris à fuir cette rue ;
   il y revient pour la regarder. Le placement exact dans la progression reste `pm`.
4. **L'heure sert la source sonore.** À 23 h 40 le carrefour coule encore fort ; à 4 h du matin
   il n'y aurait plus de paquet à lâcher, donc plus de couverture. L'heure et la mécanique se
   tiennent.

> **Amendement Rev.3 — le ruling R-10 du gate est ANNULÉ** par la décision de Bertrand du
> 2026-08-02 (§ AMENDEMENT en tête de spec). Le premier set-piece est **rue Belliard** ;
> **aucun** niveau Stalingrad n'est à construire pour lui. Le calendrier de build reste
> `senior-architect` + `producer`.

---

## 3. La scène compromettante

Trois instants photographiables, dans un ordre **fixe et télégraphié** (poses déterministes,
ADR-0077 §4/§9). Une seule preuve maîtresse ; les deux autres sont des bonus qui renforcent le
levier. Aucune valeur de tuning ici — c'est `game-designer`.

### 3.1 Le casting de la scène

| Rôle                | Qui                                                                                                                                                                            | Nommé ?                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **La cible**        | **Le Commandant** — canon existant, silhouette ratifiée (tête nue, tenue de commandement, pas de casque).                                                                      | Oui, déjà canon.                                                 |
| **Le second homme** | **Le patron de boîte** — manteau clair, un civil qui n'a rien à faire là. La nuit légale : une boîte qui déclare ses recettes et perd sa clientèle au profit des free parties. | **Non.** Jamais nommé. Il n'est qu'« l'homme au manteau clair ». |
| **La voiture**      | Une berline sombre engagée à moitié dans le passage, feux éteints.                                                                                                             | Identifiée par sa **plaque** seulement.                          |

**Pourquoi le second homme reste anonyme** — trois bénéfices : (a) zéro cast nouveau à faire
apprendre au joueur ; (b) l'anonymat **est** le sujet (le pouvoir qui paie n'a pas de visage,
c'est ça qu'on lui vole) ; (c) ça rend la **plaque** — le bonus — narrativement indispensable
au lieu d'être un collectible décoratif.

### 3.2 Les trois instants

| #   | Instant       | Ce qu'on voit                                                                                                                                                  | Statut               | Ce que la photo prouve                                                                      |
| --- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **L'ARRIVÉE** | La berline s'engage dans le passage et s'arrête, feux éteints. Le manteau clair descend. Le Commandant sort du fond du passage — les deux hommes se font face. | **Bonus**            | Qu'ils étaient là, ensemble, la même nuit. Circonstance, pas preuve.                        |
| 2   | **L'ÉCHANGE** | Une enveloppe passe de la main du manteau clair à celle du Commandant, qui l'empoche. **Les deux visages et les deux mains dans le même cadre.**               | **PREUVE MAÎTRESSE** | L'acte. Sans les deux visages **et** l'enveloppe, la photo ne prouve rien.                  |
| 3   | **LA PLAQUE** | La berline ressort du passage en marche arrière ; en passant sous le feu, l'immatriculation est lisible une poignée de secondes.                               | **Bonus**            | **Qui** paie. C'est le bonus qui transforme « un flic ripou » en « un flic à qui on doit ». |

C'est ce triptyque qui fait vivre le double trade-off du zoom de l'ADR-0077 §3 sans aucune
règle plaquée :

- **#2 impose de dézoomer** : trop serré sur les mains, on perd le visage du Commandant — on
  a photographié une enveloppe anonyme. Trop large, la scène est illisible.
- **#3 impose de zoomer à fond** : une plaque, ça ne se lit qu'au maximum de focale — donc au
  maximum de tremblement, sur une fenêtre courte, pendant que la voiture bouge. Le bonus le
  plus utile est le plus dur. C'est juste.

**Réserve (non construite ici) :** un 4e instant possible — le Commandant, seul après le
départ de la voiture, qui **ouvre l'enveloppe et compte** — a été envisagé et écarté du V1 :
il redit ce que #2 dit déjà, pour un coût art plein. Noté pour ne pas être réinventé.

### 3.3 La couverture sonore, en clair — RÉÉCRITE Rev.3 (brief `sound-designer` + `game-designer`)

- **Le paquet qui descend la rue = fenêtre sûre.** Moteurs, diesel, un scooter : ça couvre le
  déclencheur.
- **Entre deux verts = la rue est morte.** Déclencher là fait monter la suspicion.
- Le **cycle du feu est déterministe et télégraphié** (on entend les moteurs monter au
  carrefour avant que la vague arrive) — jamais `Math.random`, jamais `Date.now` (ADR-0077,
  garde-fous). La fiction ne demande **aucune** dérogation : un feu, par définition, ne varie
  pas.
- Ordres de grandeur portés par la fiction, **à re-dériver par `game-designer`** : cycle
  complet **~21 s**, vague couvrante **~7 s** (un tiers du cycle — la proportion réelle d'un
  carrefour), montée de moteurs **~1,8 s** avant que ça couvre. La source les supporte ; les
  valeurs finales sont à Sacha.
- Contrainte de conception que je signale : #1 et #3 doivent **pouvoir** tomber dans une
  fenêtre sonore, sinon le joueur est puni pour jouer le jeu. #2, la preuve maîtresse, mérite
  au contraire d'être **à cheval** sur la fin d'une vague — le bon joueur déclenche tôt.
  _Proposition de fiction, pas une contrainte de tuning : Sacha tranche._

### 3.4 La pellicule

Le boîtier n'est pas à Muf. C'est celui d'**Oxane** (guidelines §7 — _Photographe /
Réputation, Belleville 20e, risque : « photos peuvent tomber en de mauvaises mains »_), prêté
avec **un fond de pellicule** : un rouleau déjà entamé, quelques poses, pas une de plus.
Argentique 1998 : on ne vérifie pas, on ne recommence pas, on développe après.

C'est la justification diégétique complète du film fini **et** du feedback en deux temps de
l'ADR-0077 §8 : au déclenchement on n'a qu'un bruit de mécanique ; le verdict, c'est la
planche contact. Aucune règle à expliquer au joueur — c'est juste comment marchait un appareil
photo.

> **Tranché (gate, point 7) : `filmCount = 6`.** Dans la fourchette 4-8 que la fiction
> supportait ; six poses = les 3 instants + trois erreurs pardonnées. « Un fond de pellicule »
> reste la formulation diégétique — on ne dit jamais « six » à voix haute dans le dialogue,
> c'est le compteur du boîtier qui le dit. **Ne pas rouvrir.**

---

## 4. Textes joueur

Format = `NarrativeLine` (`src/game/systems/narrativeSystem.ts`). **Règle de fer respectée :
aucune illustration qui ne soit un sprite DÉJÀ shippé dans `public/assets/`.** Les images ci-
dessous sont toutes vérifiées présentes. Le backdrop de scène (`NarrativeScene.backdrop`,
ADR-0023) réutilise la façade **Belliard** shippée — celle des trois scènes déjà à l'écran
(`belliard_pre`, `belliard_post`, tutoriel).

### 4.1 Pré-set-piece — briefing hybride (`belliard_photo_pre`, `id` proposé)

Le briefing donne **QUI** et **OÙ**, jamais **QUAND** ni **QUOI** — c'est la règle hybride de
l'ADR-0077 §4. DISPATCH pose le dossier, KENZA pose le terrain, personne ne décrit la scène :
le joueur la découvre dans la lunette.

`backdrop: "assets/levels/belliard/facade.png"`

| #   | speaker  | text (FR)                                                                                              | image (sprite shippé)                | imageAlt                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------- |
| 1   | DISPATCH | `Le camion a une heure de retard, Muf. T'as le temps de bosser pour moi.`                              | —                                    | —                                       |
| 2   | MUF      | `Bosser à quoi ? J'ai pas d'arme sur moi.`                                                             | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 3   | DISPATCH | `T'en as pas besoin. Oxane te prête son boîtier. Fond de pellicule.`                                   | —                                    | —                                       |
| 4   | KENZA    | `Rue Belliard, le passage à côté de la boulangerie. Deux jeudis de suite, la même berline.`            | `assets/vehicles/car.png`            | `Une berline garée dans la rue`         |
| 5   | MUF      | `Et qui l'attend ?`                                                                                    | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 6   | DISPATCH | `Lui.`                                                                                                 | `assets/boss/commander_shielded.png` | `Le Commandant, chef de la BAC de nuit` |
| 7   | MUF      | `...le Commandant. Au fond d'un passage. À minuit.`                                                    | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 8   | DISPATCH | `Tu montes sur le toit, la lucarne au bout de la rue. Tu regardes. Tu comprendras.`                    | —                                    | —                                       |
| 9   | KENZA    | `En haut de la rue, le feu lâche un paquet de bagnoles. Quand ça roule, personne t'entend déclencher.` | —                                    | —                                       |
| 10  | MUF      | `Et quand ça roule pas ?`                                                                              | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 11  | KENZA    | `Tu respires, et t'attends le vert suivant.`                                                           | —                                    | —                                       |

**Notes d'écriture (pour le gate) :**

- Ligne 3 : la seule ligne qui installe Oxane. Elle est **nommée sans apparaître** — pas de
  nouveau speaker, pas de nouveau sprite, pas de coût. Elle justifie le boîtier ET la
  pellicule finie en huit mots.
- Ligne 6 : `Lui.` — un mot, avec le sprite du Commandant. C'est le beat du briefing. La ligne
  la plus courte de la scène porte la révélation ; on ne l'emballe pas.
- Ligne 8 : `Tu comprendras.` — DISPATCH **refuse** de dire ce qui va se passer. C'est la règle
  hybride écrite dans sa bouche : le dossier s'arrête là où l'œil commence. **Rev.3 :**
  `Tu montes sur le toit` est le rappel exact de la ligne shippée `« Reste sur les toits. »`
  (`belliard_pre`) — le joueur reconnaît l'ordre, on ne lui explique pas la position.
- Ligne 9 : la couverture sonore est enseignée **diégétiquement** par KENZA, dans son registre
  de terrain — jamais par un tutoriel plaqué. Elle nomme le _quand_, pas le _comment_, et ne
  chiffre **jamais** le cycle (le tuning est à Sacha ; un feu n'a pas besoin d'être annoncé
  en secondes pour être compris).
- 11 répliques : dans la borne des scènes shippées (5-11, cf. le tutoriel). Skippable en un
  bouton comme toute cutscene (guidelines §5 UX 3).

### 4.2 Pendant — silence

Le set-piece est **muet**, comme tous les QTE de la maison (shell ADR-0030/0034 : la scène est
gelée, personne ne commente). **Aucune réplique pendant la lunette.** Si l'`ux-designer` a
besoin de micro-copy d'interface (un compteur de poses, un rappel de commande), c'est de l'UI,
pas du dialogue — et ça reste **sans speaker**.

Deux libellés d'interface que je fournis quand même, parce qu'ils sont diégétiques :

| Surface                     | Copy (FR)     | Max     | Statut                                                        |
| --------------------------- | ------------- | ------- | ------------------------------------------------------------- |
| Compteur de poses restantes | `POSES : {n}` | 12 car. | **Facultatif** — voir T-6 ci-dessous.                         |
| Étiquette de la vue lunette | `300 mm`      | 8 car.  | Retenue. Diégétique : c'est gravé sur la bague de l'objectif. |

**T-6 réconcilié (avec Tony, sans re-gate).** Le compteur est un **cadran mécanique avec son
chiffre**, comme sur un boîtier argentique — c'est la forme retenue, et elle n'a besoin
d'aucun mot. `POSES : {n}` n'est donc **pas** une seconde surface : c'est une **légende de
repli**, à n'utiliser que si le cadran seul ne se lit pas à la taille mobile. Un seul compteur
à l'écran, jamais deux.

### 4.3 Post — la planche contact (`belliard_photo_post`, `id` proposé)

La planche contact **est** le verdict (ADR-0077 §8). Le texte ne fait que la lire ; il ne la
remplace pas. Trois variantes selon ce que le joueur a dans la boîte.
**F-2 tranché : (a), (b) et (c) shippent toutes les trois au V1.** Couper (b) laisserait le
palier bonus sans aucun payoff. La variante d'UNE `PARIS-MINUIT` est **hors V1** (§5.3).

**(a) Preuve maîtresse obtenue, sans les bonus**

| #   | speaker  | text (FR)                                                 | image                      | imageAlt                  |
| --- | -------- | --------------------------------------------------------- | -------------------------- | ------------------------- |
| 1   | MUF      | `Une enveloppe. Sa main, sa gueule. C'est net.`           | `assets/courier/rider.png` | `Muf, le coursier à moto` |
| 2   | DISPATCH | `Le Commandant est payé. Par qui, on sait pas encore.`    | —                          | —                         |
| 3   | MUF      | `On sait qu'il l'est. Ça suffit pour ce soir.`            | `assets/courier/rider.png` | `Muf, le coursier à moto` |
| 4   | DISPATCH | `Oxane tire vingt-trois copies. Le camion arrive. Bouge.` | —                          | —                         |

**(b) Preuve maîtresse + la plaque**

| #   | speaker  | text (FR)                                                             | image                      | imageAlt                        |
| --- | -------- | --------------------------------------------------------------------- | -------------------------- | ------------------------------- |
| 1   | MUF      | `L'enveloppe. Et la plaque, au dernier moment.`                       | `assets/courier/rider.png` | `Muf, le coursier à moto`       |
| 2   | KENZA    | `Une boîte du centre. Ils déclarent tout, eux. Sauf ça.`              | `assets/vehicles/car.png`  | `Une berline garée dans la rue` |
| 3   | MUF      | `Ils nous font fermer pour remplir leur caisse.`                      | `assets/courier/rider.png` | `Muf, le coursier à moto`       |
| 4   | DISPATCH | `Maintenant tu sais pourquoi ils te courent après. Garde le négatif.` | —                          | —                               |

**(c) Pas de preuve maîtresse — la variante à deux sorties (F-1, paire avec K-4)**

Toujours **deux répliques**. La première nomme la cause de l'échec — elle est **conditionnée
au terminal atteint** (guidelines §5 règle 4 : « chaque échec : raison explicite affichée ») ;
la seconde est commune et ne change jamais.

| Terminal (mécanique §1.1)                        | Ligne 1 — speaker `MUF`, image `assets/courier/rider.png`, alt `Muf, le coursier à moto` |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `ROLL_END` (pellicule finie, rien d'exploitable) | `Plus de pellicule. Deux dos et un rideau de fer.`                                       |
| `SPOTTED` (repéré, la scène se disperse)         | `Ils ont levé la tête. La berline est partie.`                                           |
| `SCENE_END`, au moins une pose brûlée            | `L'enveloppe, je l'ai pas. Le reste, ça prouve rien.`                                    |
| `SCENE_END`, rouleau intact (zéro pose)          | `J'ai pas déclenché. J'ai regardé.`                                                      |

| #   | speaker  | text (FR)                                             | image | imageAlt |
| --- | -------- | ----------------------------------------------------- | ----- | -------- |
| 2   | DISPATCH | `Alors ils remettront ça. Ils remettent toujours ça.` | —     | —        |

**Les deux CTA de la planche contact (K-4 / T-3).** Sur cette branche l'écran offre **deux**
boutons, jamais un. Libellés, forme maison (`[ … ]` capitales, cf. `NarrativeScreen.tsx`) :

| Rôle                                          | Libellé              | Long. | Ce qu'il fait                                                                    |
| --------------------------------------------- | -------------------- | ----- | -------------------------------------------------------------------------------- |
| Rejouer le set-piece                          | `[ RECOMMENCER ]`    | 11 c. | Retry depuis le checkpoint (mécanique §6.3).                                     |
| **Refuser — le chemin « bonus jamais gate »** | `[ LAISSER TOMBER ]` | 15 c. | **Une seule pression** → retour à la livraison en cours, boss en baseline ×1.00. |
| Branches (a) / (b), un seul bouton            | `[ CONTINUER ]`      | 10 c. | Forme déjà shippée.                                                              |

**Pourquoi ces mots.** `[ LAISSER TOMBER ]` est du registre de Muf, pas de celui d'un menu :
c'est ce qu'on dit dans la rue quand on renonce sans se justifier. Il ne contient ni
« abandonner » (défaite), ni « passer » / « ignorer » (langage de menu hors-fiction), ni aucune
formulation qui suggère que le joueur rate du contenu obligatoire. Et il est **exactement** ce
que la réplique 2 vient de dire : _ils remettront ça_ — donc rien n'est perdu.

**Aucune scène supplémentaire sur le refus.** La ligne 2 est déjà la sortie ; appuyer sur
`[ LAISSER TOMBER ]` renvoie directement au niveau, sans écran intermédiaire, sans réplique de
plus. C'est la condition de zéro friction du K-4a : **le chemin de refus n'ajoute pas un mot à
lire.**

- **(c) ne punit pas, ne juge pas, ne moralise pas.** Deux lignes, deux portes, aucune des deux
  n'est une punition — conforme au « repéré = abort, pas de mort » de l'ADR-0077 §7 et à la
  règle anti-mort-bullshit.
- `vingt-trois copies` (variante a, ligne 4) : le motif **23** du fanzine (`N°23`, `SPIRALE 23`,
  `Tirage : 23 exemplaires photocopiés` — copy deck §4.1). Le tirage de la preuve est **le
  tirage du zine**. C'est là que se joue la §5.

### 4.4 Couverture des chemins — vérification demandée par le gate (K-4a)

Toutes les sorties possibles de la mécanique tombent dans une variante, sans trou et sans
copy conditionnelle ailleurs que dans le tableau ci-dessus.

| Ce que contient le rouleau                      | Terminal         | Variante    | CTA                                      |
| ----------------------------------------------- | ---------------- | ----------- | ---------------------------------------- |
| L'ÉCHANGE seul                                  | n'importe lequel | **(a)**     | `[ CONTINUER ]`                          |
| L'ÉCHANGE + la plaque                           | n'importe lequel | **(b)**     | `[ CONTINUER ]`                          |
| L'ÉCHANGE + l'arrivée (sans la plaque)          | n'importe lequel | **(a)**     | `[ CONTINUER ]`                          |
| L'ÉCHANGE, puis repéré après coup               | `SPOTTED`        | **(a)/(b)** | `[ CONTINUER ]`                          |
| Des bonus mais pas L'ÉCHANGE                    | tous             | **(c)**     | `[ RECOMMENCER ]` + `[ LAISSER TOMBER ]` |
| Rien d'exploitable                              | tous             | **(c)**     | `[ RECOMMENCER ]` + `[ LAISSER TOMBER ]` |
| Rouleau intact (le joueur n'a jamais déclenché) | `SCENE_END`      | **(c)**     | `[ RECOMMENCER ]` + `[ LAISSER TOMBER ]` |

Trois points que le dev ne doit pas avoir à deviner :

1. **La preuve maîtresse commande la variante, pas le terminal.** Un joueur repéré _après_
   avoir décroché L'ÉCHANGE lit (a) ou (b), pas (c) : il a la photo, le reste est du décor.
   Aucune copy ne mentionne le fait d'avoir été repéré sur ces branches — la planche tronquée
   le montre, on ne le commente pas.
2. **(b) couvre « L'ÉCHANGE + n'importe quel bonus ».** La ligne 2 de (b) parle de la plaque ;
   si le seul bonus obtenu est l'arrivée, on joue **(a)** — règle simple, pas de troisième
   palier : **(b) exige la plaque, sinon (a)**. Côté mécanique la récompense R1 est plate
   (un bonus quelconque = ×0.75) ; côté fiction seule la plaque nomme le client, donc seule
   elle change le texte. Les deux lanes ne se contredisent pas : R1 paie l'effort, (b)
   raconte l'information.
3. **Le refus est une sortie, pas une fin.** Le joueur qui refuse continue sa run normalement,
   avec le boss en baseline. Aucune string ne lui dit qu'il a « perdu » quelque chose.

---

## 5. Ce que la preuve débloque — ratifié (gate R-F3)

**Open question ADR-0077 : « boss weakening vs route unlock vs narrative ». Réponse retenue :
les trois à la fois, par un seul mécanisme — la preuve ne sort pas dans la presse, elle sort
dans la rue.** Le route unlock (R2) est écarté du V1 par le gate : un itinéraire discret
débloqué serait un soft gate déguisé.

### 5.1 Où va la photo (et surtout : où elle ne va PAS)

**Pas à `PARIS-MINUIT`.** Le tabloïd établi a fait du Commandant un héros — _« l'homme qui a
nettoyé les nuits de Paris »_ (`spec-boss-encounter-fiction.md` §1.4). Lui envoyer la preuve,
c'est l'enterrer. Et un joueur de 1998 dans le circuit free-party **ne fait pas confiance à la
presse** : ce serait un contresens de scène.

**La photo part sur la photocopieuse du fanzine.** Vingt-trois copies, agrafées aux flyers,
collées dans les cages d'escalier du quartier, passées de main en main aux entrées de teuf. Le
canal de diffusion **existe déjà** dans le canon (le zine `UNDERGROUND PARIS`, le tirage 23,
« Ne se vend pas. Ne se jette pas. Se passe. »). Zéro invention.

### 5.2 L'effet — il ne devient pas plus faible, il devient seul

Le levier ne retire pas de PV au Commandant. Il lui retire **sa couverture** — au sens propre
et au sens figuré, et les deux se rejoignent sur un objet qui existe déjà :

- **Sens figuré.** Une fois sa gueule affichée dans les cages d'escalier, ses hommes le
  couvrent moins bien, et le client cesse de payer un homme grillé.
- **Sens propre.** `spec-boss-belliard-fiction.md` §2 a déjà posé que **le bouclier du
  Commandant est un cover prop séparé**, et que le casser raccourcit ses accalmies `SHIELDED`.
  Le levier photo est **exactement le même read, appliqué avant le combat** : au niveau final,
  il entre au duel **avec sa planque déjà enfoncée**.

C'est ce qui rend cette recommandation économique : elle **ne demande aucun nouveau système
de récompense**. Elle réutilise un état mécanique déjà spécifié, déjà lisible pour le joueur,
et déjà gaté.

Et elle rembourse une ligne shippée : `« Cette nuit il n'a plus personne pour le couvrir. »`
Sans le set-piece, la cause est le 31 décembre. Avec, le joueur en est la **deuxième cause**.
**Aucun dialogue shippé n'est modifié.**

### 5.3 La gradation par les bonus

| Ce que le joueur ramène                          | Effet narratif                                                                                            | Piste mécanique (à valider par `game-designer`)                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Rien — échec **ou refus** (`[ LAISSER TOMBER ]`) | Le monde ne change pas. Le final se joue comme aujourd'hui.                                               | Baseline shippée (×1.00), aucun changement.                                          |
| **L'ÉCHANGE** seul (preuve maîtresse)            | Le Commandant est grillé auprès des siens.                                                                | Sa planque entre **déjà enfoncée** au duel final (accalmies `SHIELDED` raccourcies). |
| **L'ÉCHANGE + l'arrivée et/ou la plaque**        | Le **client** est identifié : il coupe les vivres. Le Commandant n'a plus ni couverture ni commanditaire. | Même effet, plus marqué (R1 est plate au V1). UNE `PARIS-MINUIT` **hors V1** (F-2).  |

**Bonus, jamais gate — RATIFIÉ au gate (R-8).** Le set-piece n'est pas obligatoire pour finir
le jeu. Un joueur qui l'ignore joue le jeu shippé ; un joueur qui le réussit arrive au final
avec un avantage **qu'il a compris**. Côté fiction, cet invariant a désormais **une incarnation
à l'écran et une seule** : le bouton `[ LAISSER TOMBER ]` de §4.3. Tant qu'il est là, la
phrase est vraie ; s'il disparaît de l'implémentation, elle devient un mensonge. C'est le
point de vérification que je demande au playtest (`game-designer`).

**Hors V1 (F-2) — la UNE `PARIS-MINUIT`.** Si la plaque est obtenue, la UNE du tabloïd dans
l'écran des scores pourrait basculer sur une variante embarrassée — le tabloïd forcé de
mentionner « une rumeur » qu'il ne peut plus taire. **Différé hors V1** par le gate : ça touche
l'écran des scores, donc une autre surface et l'arbitrage progression de `pm`. 2 strings, zéro
système, je les écris quand `pm` ouvre la porte. Noté ici pour ne pas être réinventé.

### 5.4 Terrain partagé avec `game-designer` (Sacha)

**« Isolé, jamais affaibli » est un INVARIANT ratifié du feature (gate R-F3)** — plus une
recommandation. La preuve rend le Commandant **isolé**, jamais **affaibli physiquement** : on
ne blesse pas un homme avec une photo. Toute récompense qui se lit « il a moins de PV » casse
la fiction ; toute récompense qui se lit « il est moins couvert » la sert.

Traduction mécanique arrêtée (gate) : le levier R1 touche **uniquement** la durée des accalmies
`SHIELDED` du boss du Niveau Final — **jamais** les PV, jamais `maxBlownWindows`. Si un futur
tuning veut sortir de cette fenêtre, ce n'est pas un ajustement de valeur, c'est une réouverture
de gate. _On conçoit ensemble, on livre séparément._

---

## 6. Fiches — pour l'art flow (fiche, pas look)

Le VISUEL appartient à `concept-artist` → `lead-art`. Voici ce qu'ils ont besoin de savoir.

| Élément                      | Rôle dans la scène                                                                                                                                                                                                                                                                                                                    | Poses / états demandés                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Le Commandant**            | La cible. Silhouette **déjà ratifiée** — tête nue, tenue de commandement, ni casque ni bouclier.                                                                                                                                                                                                                                      | `attend dans l'ombre` · `face à face` · `reçoit l'enveloppe` (main tendue, visage de trois quarts) · `empoche`.                                                          |
| **L'homme au manteau clair** | Le client. Civil, manteau clair (contraste B&N maximal avec le Commandant sombre : le read se fait au ton, pas à la couleur). Jamais nommé, visage lisible.                                                                                                                                                                           | `descend de voiture` · `face à face` · `tend l'enveloppe`.                                                                                                               |
| **La berline**               | L'identification. Feux éteints à l'arrivée, plaque lisible au départ sous le feu tricolore.                                                                                                                                                                                                                                           | `arrêtée` · `en départ, plaque lisible`.                                                                                                                                 |
| **Backdrop du set-piece**    | **Rev.3 —** la bouche du passage rue Belliard : faille d'ombre entre deux immeubles, rideaux de fer taggés de part et d'autre, la devanture de la BOULANGERIE en amorce à gauche, le **feu tricolore** planté devant. Vue plongeante depuis la lucarne du bout de la rue. Un paquet de phares qui descend la rue = la fenêtre sonore. | Backdrop 2D dédié (ADR-0077 §9) — **pas** un zoom dans `street-wide.png`, mais la **même rue**, reconnaissable au premier coup d'œil (rideaux taggés, boulangerie, feu). |
| **Planche contact**          | Le verdict. B&N photocopié, bords de perforation, croix au feutre gras sur ce qui compte.                                                                                                                                                                                                                                             | Surface UI — `ux-designer` + art flow.                                                                                                                                   |

**Demande AUTORISÉE par le gate (F-4).** Elle s'ouvre auprès de `concept-artist` → `lead-art`
avec **deux contraintes attachées par Karim**, transmises telles quelles — l'arbitrage
visuel reste à Nico (`docs/art-direction.md`) :

1. **Le sujet brille sans être tirable.** Guidelines §5 : « ce qui brille est interactif ».
   Ici le sujet EST l'élément interactif — mais on le **photographie**, on ne lui tire jamais
   dessus. La planche doit donc le rendre lisible **sans** le vocabulaire de glow interactif,
   sinon elle enseigne une affordance de tir fausse (même piège que le K-6 delivery-assault et
   la note mur-d'enceintes).
2. **Le dessin EST la boîte de validation** (F12(1) de la mécanique). Le sujet dessiné et la
   boîte `subjectTrack` coïncident à chaque keyframe. **L'art et la table de keyframes sont un
   seul livrable, pas deux** — précédent gaté « Décor aim-honesty » (2026-07-20).

Contrainte supplémentaire sur la planche contact, transmise à `lead-art` via `ux-designer`
(T-4) : l'aiguille de suspicion garde sa forme de cadran, mais **aucune** copy, glyphe ou
traitement ne doit la présenter comme une cellule / un posemètre. Elle mesure le risque, pas
la lumière ; l'annoncer autrement enseigne un modèle causal faux.

**Tant que ces assets n'existent pas, les scripts §4 restent non livrés** — les seules images
qu'ils référencent aujourd'hui sont des sprites **déjà shippés**.

---

## 7. Conformité boucle / scope

- **Boucle intouchable.** Le set-piece se joue **hors** de `Récupérer → Livrer → Éviter`, avant
  le camion. `Éviter` n'acquiert aucune règle nouvelle. PASS.
- **`une mission = 3-5 min`.** Set-piece court + une scène de 11 répliques + une planche
  contact de 2-4 répliques, skippables en un bouton. La photo ne rallonge pas la livraison :
  elle la précède. Le gate impose un budget **briefing + set-piece + planche ≤ 2 min** en
  première lecture non skippée : les scripts §4 y tiennent (11 + 4 répliques max), et le
  chemin de refus n'ajoute **aucune** ligne (§4.3).
- **Chaque échec a une raison explicite.** (c) §4.3 nomme la cause **par terminal** — pellicule
  finie / repéré / rien d'exploitable / rouleau intact. Le « repéré » abort n'est pas une mort
  (ADR-0077 §7). Anti-mort-bullshit : PASS.
- **G-1 / G-2 — exception, pas règle générale.** Le gate a proposé deux règles (nombre de verbes
  dans un set-piece dédié ; lisibilité d'un indicateur de tension diégétique). Décision de
  Bertrand : elles valent **comme exception pour ce QTE photo uniquement**, et n'entrent pas
  dans `PROJECT_GUIDELINES.md` comme règles générales. Cette spec s'y appuie à ce titre-là et
  ne crée aucun précédent opposable au prochain set-piece.
- **Roster §7 intact.** Aucune quatrième faction. Le Commandant est déjà l'apex de la BAC de
  nuit ; **le patron de boîte est un civil, pas un antagoniste jouable** — il n'entre pas au
  roster, il ne tire jamais, il ne réapparaît pas.
- **Authenticité 1998.** Argentique, pellicule finie, planche contact, photocopieuse, feu
  tricolore et circulation de nuit sur les Maréchaux, rideaux de fer, francs, aucun écran de
  contrôle, aucun réseau social, aucun téléphone à photo. Si le
  gate veut durcir le grounding culturel (matériel photo, plaque d'immatriculation format
  1998), `art-advisor` (Estelle) est la lane.
- **Cahier des charges.** Prohibition (Atari ST) n'avait ni narration ni photo : **extension
  consciente et documentée**, même standard qu'ADR-0012 / ADR-0030 / ADR-0077.

---

## 8. Flags fiction

1. **NET-NEW canon (mineur)** — « le patron de boîte » / « l'homme au manteau clair » : entité
   **anonyme et non récurrente**, volontairement sans nom. Aucun nouveau nom propre créé par
   cette spec. À folder dans un futur `narrative-bible.md`.
2. **Oxane entre au canon par une mention** — guidelines §7 la scope déjà (Photographe /
   Réputation, Belleville 20e). Elle est **nommée, jamais présente** : pas de speaker nouveau,
   pas de sprite. Son risque §7 (« photos peuvent tomber en de mauvaises mains ») est le hook
   de suite déjà prêt, **non construit ici**.
3. **Motivation de la répression = commerciale. CANON GRAVÉ** — ratifié par Bertrand le
   2026-08-01 (escalade E-2 du gate). La répression du circuit free-party est **commanditée et
   payée par la nuit légale** : la BAC n'est plus une force aveugle, c'est le prestataire de
   quelqu'un. Period-correct (1998, avant les lois de 2001). Ce n'est plus un flag ouvert :
   c'est la base d'écriture de toute fiction ultérieure, et ça ne se rouvre pas au cas par cas.
4. **Aucun dialogue shippé n'est modifié.** La spec s'accroche à la ligne existante
   `« il n'a plus personne pour le couvrir »` sans la réécrire.
5. **Alternative B réservée — RATIFIÉE** : RG payant un indic = **set-piece n°2**, une fois les
   contacts §7 recrutables in-game. Réservation de canon, **pas construite ici**.
6. **Ne décide pas** : tuning (`game-designer`), contrôles/accessibilité (`ux-designer`),
   ordre de build (`senior-architect` + `producer`), UNE `PARIS-MINUIT` hors V1 (`pm`).

---

## 9. Hand-off

### 9.0 Rev.3 — amendement de relocalisation (2026-08-02)

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim), pour
information — puis `game-designer` (Sacha), `sound-designer`, `concept-artist` / `lead-art`.

**Objet :** le premier set-piece est **rue Belliard** (décision Bertrand, override de R-10).
Ce n'est **pas** une réouverture de gate : c'est l'exécution d'une décision. Les huit
ratifications du round 1 tiennent, sauf le lieu.

Ce que chaque lane doit récupérer :

| Lane                          | Ce qui change pour elle                                                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game-designer` (Sacha)       | La source sonore est un **cycle de feu tricolore** (§2.3). Elle porte période ~21 s / vague ~7 s / montée ~1,8 s ; **les valeurs exactes restent à re-dériver par toi** — la fiction ne les grave pas.      |
| `sound-designer`              | Brief : boucle de cycle (paquet de véhicules qui descend une rue vide) + montée de moteurs en amorce. Déterministe par nature, zéro aléa. Alternative de repli en une ligne : le fournil de la boulangerie. |
| `concept-artist` / `lead-art` | Nouvelle fiche backdrop §6 : bouche du passage rue Belliard, rideaux de fer, boulangerie en amorce, feu tricolore, vue plongeante depuis la lucarne. Les deux contraintes de Karim sont **inchangées**.     |
| `dev-gameplay`                | Ids de scène `belliard_photo_pre` / `belliard_photo_post`, `backdrop: "assets/levels/belliard/facade.png"`. Répliques 4 / 7 / 8 / 9 / 10 / 11 réécrites (§4.1), ligne `ROLL_END` réécrite (§4.3).           |
| `pm`                          | Le set-piece se joue sur une **nuit de retour** rue Belliard, pas la nuit du tutoriel. Le placement exact dans la progression reste ta lane.                                                                |

**Aucun niveau à construire. Aucun dialogue shippé modifié.** Le seul asset neuf reste la
planche 2D dédiée déjà exigée par l'ADR-0077 D9 — donc le budget art est **inchangé**, et le
niveau Stalingrad qu'on n'écrit plus est une **économie sèche**.

### 9.1 Réponse aux conditions du gate (Rev.2 — inchangée)

| Cond.    | État            | Où c'est traité                                                                                                                                                      |
| -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-1**  | **TRAITÉE**     | §4.3 : deux CTA (`[ RECOMMENCER ]` / `[ LAISSER TOMBER ]`), ligne 1 de (c) conditionnée au terminal, **zéro** réplique ajoutée sur le refus. Budget copy inchangé.   |
| **F-2**  | **TRAITÉE**     | §4.3 : (a) + (b) + (c) au V1. UNE `PARIS-MINUIT` hors V1, conservée en réserve écrite (§5.3).                                                                        |
| **F-3**  | **LEVÉE**       | E-2 ratifié par Bertrand. §8.3 est canon gravé, formulations conditionnelles retirées (§1.1, §5.1, §8.3). Les scripts §4 sont **transcribables**.                    |
| **F-4**  | **TRAITÉE**     | §6 : demande art ouverte, les deux contraintes de Karim + la prohibition T-4 reportées telles quelles à `concept-artist` / `lead-art`.                               |
| **K-4a** | **VÉRIFIÉE**    | §4.4 : table de couverture des chemins. Le refus est une sortie en une pression, sans écran ni ligne supplémentaire — l'invariant « bonus jamais gate » a un bouton. |
| **T-6**  | **RÉCONCILIÉE** | §4.2 : le cadran chiffré est la forme retenue ; `POSES : {n}` devient une légende de repli mobile. Un seul compteur à l'écran.                                       |
| **E-3**  | **INTÉGRÉE**    | §7 : G-1 / G-2 citées comme **exception à ce QTE**, jamais comme règles générales.                                                                                   |

### 9.2 Ce que le gate n'a plus à trancher

Cible (§1), alternative B en n°2 (§1.2), ~~Stalingrad (§2)~~ — **remplacé Rev.3 par Belliard,
décision Bertrand, R-10 annulé** —, triptyque (§3.2), `filmCount = 6`
(§3.4), « isolé jamais affaibli » invariant (§5.4), bonus jamais gate (§5.3), `SPOTTED` atteint
la planche tronquée (§4.3/§4.4). **Ratifiés round 1, non rouverts ici.**

### 9.3 Deux points de synchro qui restent ouverts (peer lanes, pas des demandes de gate)

1. **`game-designer` (Sacha)** — la règle de branchement de §4.4 point 2 ((b) exige la plaque,
   sinon (a)) doit matcher la façon dont la mécanique stampe `I.role` sur la planche. Si Sacha
   expose « un bonus quelconque » plutôt que « la plaque » comme booléen unique, il me faut le
   second booléen — ou (b) se réécrit. Une ligne de données, pas un re-gate.
2. **`ux-designer` (Tony)** — les deux CTA de §4.3 doivent tenir côte à côte à ≥ 44×44 px en
   mobile paysage, et `[ LAISSER TOMBER ]` ne doit être ni secondaire visuellement au point
   d'être invisible, ni primaire au point d'inviter à renoncer. Hiérarchie = sa lane ; je
   signale seulement que **la lisibilité du bouton de refus porte l'invariant du feature**.

**Ce que je ne décide toujours pas :** tuning, contrôles, ordre de build, progression.

**À loguer après verdict :** hand-off dans `docs/handoffs/`, indexé dans
`docs/agent-handoffs.md` ; statut reporté dans `docs/game-design/README.md`.
