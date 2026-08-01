# QTE photo paparazzi — fiction du PREMIER set-piece

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-08-01 ·
**Frame:** `docs/adr/0077-qte-photo-paparazzi-set-pieces.md` (Proposed)
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

| Décidé ici (proposition à gater)                                         | Pas décidé ici                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| La **cible** du premier set-piece, argumentée contre 2 alternatives (§1) | Toute valeur de tuning (pellicule, jauge, sway, seuils) — `game-designer` |
| Le **lieu** et le **moment** diégétiques (§2)                            | Le schéma de contrôle desktop/mobile — `ux-designer`                      |
| La **scène compromettante** : arrivée / L'ÉCHANGE / plaque (§3)          | La forme exacte du levier mécanique — `game-designer` (§5 = reco)         |
| Les **textes de briefing** DISPATCH/KENZA + planche contact (§4)         | Gate vs bonus dans la progression — `lead-game-designer` + `pm`           |
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

### 1.3 Le piège évité : ce set-piece n'est pas « le boss fight en version photo »

Objection légitime au gate : si le Commandant est déjà le boss qu'on abat, le photographier
fait doublon. Non — **les deux beats ne disent pas la même chose** :

- Le **boss fight** dit : _il te barre la route, dégage-le_.
- Le **set-piece photo** dit : _il n'est pas ta fatalité, il est l'employé de quelqu'un_.

Et surtout, la photo **ne le tue pas** : elle lui retire sa couverture. Ce qui alimente
directement la ligne **déjà shippée** du niveau final — `« Cette nuit il n'a plus personne
pour le couvrir. Il descend lui-même. »` Aujourd'hui cette phrase n'a qu'une cause : les flics
débordés du 31 décembre. Avec le set-piece, elle en gagne une **seconde, gagnée par le
joueur** — sans changer un octet du dialogue shippé. C'est le meilleur argument en faveur de
cette cible : elle **rembourse** du canon existant au lieu d'en ajouter.

---

## 2. Lieu et moment

### 2.1 Lieu — sous le viaduc du métro aérien, quai de la Loire, Stalingrad (19e)

**Le quai du bassin de la Villette, au pied des piliers du métro aérien.** Muf est posté en
face, en hauteur, dans un étage vide de l'entrepôt de **KANAL SYSTEM** — le lieu du gig, la
seule fenêtre du quartier qui donne sur le quai sans être vue.

Pourquoi ce lieu et pas un autre :

- **Ligne de vue.** Un téléobjectif exige de la distance dégagée. La largeur du bassin la
  donne, sans qu'on ait à zoomer dans une façade (contrainte ADR-0077 : les calques parallax
  ne sont pas authored pour ×10 — donc **backdrop dédié**, et un bassin d'eau noire est le
  décor le moins coûteux qui soit en B&N photocopié).
- **Couverture sonore diégétique et gratuite.** Le **métro aérien** passe au-dessus de la
  scène. Chaque rame = une fenêtre de bruit. Entre deux rames, le quai est **silencieux** —
  eau, rien d'autre. La mécanique « déclencher pendant le bruit » de l'ADR-0077 §6 n'a besoin
  d'**aucune** invention : elle est déjà dans le lieu. Cadence déterministe, brief clair pour
  `sound-designer`.
- **Canon existant.** Stalingrad est déjà un niveau shippé, et KENZA y a déjà posé sa réplique
  `« Ils ont des planques là-dedans depuis '95. »` Le quartier **est** déjà, dans le canon, le
  lieu où l'on regarde les gens sans qu'ils le sachent. On retourne l'objectif, voilà tout.
- **Backdrop art.** Demande à l'art flow : piliers de fonte, eau noire, une rame qui passe.
  Réutilise l'ambiance `assets/levels/stalingrad/*` sans réutiliser les calques eux-mêmes.

### 2.2 Moment — la nuit du gig Stalingrad, avant le son

**23 h 40, le soir de la livraison Stalingrad, avant que le camion arrive.** Muf est venu en
avance pour repérer. Il attend avec un boîtier sur les genoux ; la scène dure le temps de deux
passages de métro.

Trois raisons :

1. **Ça ne gate rien.** Le set-piece se joue **avant** la boucle `Récupérer → Livrer → Éviter`,
   comme une scène pré-niveau qui serait jouable — jamais au milieu d'une livraison. La règle
   « une mission = 3-5 minutes » tient : le set-piece est **court, et hors du chrono**.
2. **Ça justifie la solitude.** Muf seul, en hauteur, avant tout le monde : ni foule ni sono,
   donc le silence entre deux rames est crédible, donc le risque au déclenchement l'est aussi.
3. **Ça ne casse pas Belliard.** Le premier gig reste le premier gig (tutoriel de la boucle).
   Le contre-pouvoir arrive au **deuxième** — quand le joueur a déjà appris à fuir, il apprend
   à répondre.

> **Flag pour le gate.** Si `game-designer` / `pm` préfèrent héberger le premier set-piece sur
> Belliard (vélocité d'ingénierie, précédent de tous les QTE), la fiction **tient quand même**
> — mais il faut alors déplacer le lieu (Belliard n'a ni bassin ni viaduc) et on perd la
> couverture sonore gratuite. Je recommande Stalingrad ; je ne tranche pas le calendrier de
> build. Voir §7, point 3.

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
| **La voiture**      | Une berline sombre garée sous le viaduc, feux éteints.                                                                                                                         | Identifiée par sa **plaque** seulement.                          |

**Pourquoi le second homme reste anonyme** — trois bénéfices : (a) zéro cast nouveau à faire
apprendre au joueur ; (b) l'anonymat **est** le sujet (le pouvoir qui paie n'a pas de visage,
c'est ça qu'on lui vole) ; (c) ça rend la **plaque** — le bonus — narrativement indispensable
au lieu d'être un collectible décoratif.

### 3.2 Les trois instants

| #   | Instant       | Ce qu'on voit                                                                                                                                         | Statut               | Ce que la photo prouve                                                                      |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **L'ARRIVÉE** | La berline s'arrête sous le viaduc, feux éteints. Le manteau clair descend. Le Commandant sort de l'ombre d'un pilier — les deux hommes se font face. | **Bonus**            | Qu'ils étaient là, ensemble, la même nuit. Circonstance, pas preuve.                        |
| 2   | **L'ÉCHANGE** | Une enveloppe passe de la main du manteau clair à celle du Commandant, qui l'empoche. **Les deux visages et les deux mains dans le même cadre.**      | **PREUVE MAÎTRESSE** | L'acte. Sans les deux visages **et** l'enveloppe, la photo ne prouve rien.                  |
| 3   | **LA PLAQUE** | La berline repart ; en passant sous le lampadaire du quai, l'immatriculation est lisible une poignée de secondes.                                     | **Bonus**            | **Qui** paie. C'est le bonus qui transforme « un flic ripou » en « un flic à qui on doit ». |

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

### 3.3 La couverture sonore, en clair (brief pour `sound-designer` + `game-designer`)

- **Rame au-dessus = fenêtre sûre.** Le grondement couvre le déclencheur.
- **Entre deux rames = silence du quai.** Déclencher là fait monter la suspicion.
- Le **timing des rames est déterministe et télégraphié** (on entend la rame arriver avant
  qu'elle couvre) — jamais `Math.random`, jamais `Date.now` (ADR-0077, garde-fous).
- Contrainte de conception que je signale : #1 et #3 doivent **pouvoir** tomber dans une
  fenêtre sonore, sinon le joueur est puni pour jouer le jeu. #2, la preuve maîtresse, mérite
  au contraire d'être **à cheval** sur la fin d'une rame — le bon joueur déclenche tôt.
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

> **Le nombre exact de poses est du tuning (`game-designer`).** La fiction supporte n'importe
> quel chiffre entre 4 et 8 ; en dessous de 4 elle ne supporte plus les 3 instants + une
> erreur, ce qui serait une punition sèche.

---

## 4. Textes joueur

Format = `NarrativeLine` (`src/game/systems/narrativeSystem.ts`). **Règle de fer respectée :
aucune illustration qui ne soit un sprite DÉJÀ shippé dans `public/assets/`.** Les images ci-
dessous sont toutes vérifiées présentes. Le backdrop de scène (`NarrativeScene.backdrop`,
ADR-0023) réutilise la façade Stalingrad shippée.

### 4.1 Pré-set-piece — briefing hybride (`stalingrad_photo_pre`, `id` proposé)

Le briefing donne **QUI** et **OÙ**, jamais **QUAND** ni **QUOI** — c'est la règle hybride de
l'ADR-0077 §4. DISPATCH pose le dossier, KENZA pose le terrain, personne ne décrit la scène :
le joueur la découvre dans la lunette.

`backdrop: "assets/levels/stalingrad/facade.png"`

| #   | speaker  | text (FR)                                                                        | image (sprite shippé)                | imageAlt                                |
| --- | -------- | -------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| 1   | DISPATCH | `Le camion a une heure de retard, Muf. T'as le temps de bosser pour moi.`        | —                                    | —                                       |
| 2   | MUF      | `Bosser à quoi ? J'ai pas d'arme sur moi.`                                       | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 3   | DISPATCH | `T'en as pas besoin. Oxane te prête son boîtier. Fond de pellicule.`             | —                                    | —                                       |
| 4   | KENZA    | `Quai de la Loire, sous le métro aérien. Deux jeudis de suite, la même berline.` | `assets/vehicles/car.png`            | `Une berline garée dans la rue`         |
| 5   | MUF      | `Et qui l'attend ?`                                                              | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 6   | DISPATCH | `Lui.`                                                                           | `assets/boss/commander_shielded.png` | `Le Commandant, chef de la BAC de nuit` |
| 7   | MUF      | `...le Commandant. Sous un viaduc. À minuit.`                                    | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 8   | DISPATCH | `Tu montes au troisième de l'entrepôt. Tu regardes. Tu comprendras.`             | —                                    | —                                       |
| 9   | KENZA    | `Le métro passe au-dessus. Quand ça gronde, personne t'entend déclencher.`       | —                                    | —                                       |
| 10  | MUF      | `Et quand ça gronde pas ?`                                                       | `assets/courier/rider.png`           | `Muf, le coursier à moto`               |
| 11  | KENZA    | `Tu respires, et t'attends la suivante.`                                         | —                                    | —                                       |

**Notes d'écriture (pour le gate) :**

- Ligne 3 : la seule ligne qui installe Oxane. Elle est **nommée sans apparaître** — pas de
  nouveau speaker, pas de nouveau sprite, pas de coût. Elle justifie le boîtier ET la
  pellicule finie en huit mots.
- Ligne 6 : `Lui.` — un mot, avec le sprite du Commandant. C'est le beat du briefing. La ligne
  la plus courte de la scène porte la révélation ; on ne l'emballe pas.
- Ligne 8 : `Tu comprendras.` — DISPATCH **refuse** de dire ce qui va se passer. C'est la règle
  hybride écrite dans sa bouche : le dossier s'arrête là où l'œil commence.
- Ligne 9 : la couverture sonore est enseignée **diégétiquement** par KENZA, dans son registre
  de terrain — jamais par un tutoriel plaqué. Elle nomme le _quand_, pas le _comment_.
- 11 répliques : dans la borne des scènes shippées (5-11, cf. le tutoriel). Skippable en un
  bouton comme toute cutscene (guidelines §5 UX 3).

### 4.2 Pendant — silence

Le set-piece est **muet**, comme tous les QTE de la maison (shell ADR-0030/0034 : la scène est
gelée, personne ne commente). **Aucune réplique pendant la lunette.** Si l'`ux-designer` a
besoin de micro-copy d'interface (un compteur de poses, un rappel de commande), c'est de l'UI,
pas du dialogue — et ça reste **sans speaker**.

Deux libellés d'interface que je fournis quand même, parce qu'ils sont diégétiques :

| Surface                     | Copy (FR)     | Max     |
| --------------------------- | ------------- | ------- |
| Compteur de poses restantes | `POSES : {n}` | 12 car. |
| Étiquette de la vue lunette | `300 mm`      | 8 car.  |

### 4.3 Post — la planche contact (`stalingrad_photo_post`, `id` proposé)

La planche contact **est** le verdict (ADR-0077 §8). Le texte ne fait que la lire ; il ne la
remplace pas. Trois variantes selon ce que le joueur a dans la boîte. Le dev n'implémente que
les branches que `game-designer` retient.

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

**(c) Preuve maîtresse manquée (pellicule finie ou repéré → retry, cf. ADR-0077 §7)**

| #   | speaker  | text (FR)                                             | image                      | imageAlt                  |
| --- | -------- | ----------------------------------------------------- | -------------------------- | ------------------------- |
| 1   | MUF      | `Rien de net. Deux dos et un pilier.`                 | `assets/courier/rider.png` | `Muf, le coursier à moto` |
| 2   | DISPATCH | `Alors ils remettront ça. Ils remettent toujours ça.` | —                          | —                         |

- **(c) ne punit pas, ne juge pas, ne moralise pas.** Deux lignes, et la porte reste ouverte —
  conforme au « spotted = retry, pas de mort » de l'ADR-0077 §7 et à la règle anti-mort-bullshit.
- `vingt-trois copies` (variante a, ligne 4) : le motif **23** du fanzine (`N°23`, `SPIRALE 23`,
  `Tirage : 23 exemplaires photocopiés` — copy deck §4.1). Le tirage de la preuve est **le
  tirage du zine**. C'est là que se joue la §5.

---

## 5. Reco narrative — ce que la preuve débloque

**Open question ADR-0077 : « boss weakening vs route unlock vs narrative ». Ma reco : les
trois à la fois, par un seul mécanisme — la preuve ne sort pas dans la presse, elle sort dans
la rue.**

### 5.1 Où va la photo (et surtout : où elle ne va PAS)

**Pas à `PARIS-MINUIT`.** Le tabloïd établi a fait du Commandant un héros — _« l'homme qui a
nettoyé les nuits de Paris »_ (`spec-boss-encounter-fiction.md` §1.4). Lui envoyer la preuve,
c'est l'enterrer. Et un joueur de 1998 dans le circuit free-party **ne fait pas confiance à la
presse** : ce serait un contresens de scène.

**La photo part sur la photocopieuse du fanzine.** Vingt-trois copies, agrafées aux flyers,
collées dans les cages d'escalier du 19e, passées de main en main aux entrées de teuf. Le
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

| Ce que le joueur ramène                   | Effet narratif                                                                                            | Piste mécanique (à valider par `game-designer`)                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Rien (échec, retry accepté)               | Le monde ne change pas. Le final se joue comme aujourd'hui.                                               | Baseline shippée, aucun changement.                                                  |
| **L'ÉCHANGE** seul (preuve maîtresse)     | Le Commandant est grillé auprès des siens.                                                                | Sa planque entre **déjà enfoncée** au duel final (accalmies `SHIELDED` raccourcies). |
| **L'ÉCHANGE + l'arrivée et/ou la plaque** | Le **client** est identifié : il coupe les vivres. Le Commandant n'a plus ni couverture ni commanditaire. | Même effet, plus marqué — **ou** une variante d'UNE `PARIS-MINUIT` dans les scores.  |

**Recommandation de forme : bonus, jamais gate.** Le set-piece ne doit pas être obligatoire
pour finir le jeu. Un joueur qui l'ignore joue le jeu shippé ; un joueur qui le réussit arrive
au final avec un avantage **qu'il a compris**. C'est cohérent avec la doctrine maison : la
fiction encadre la boucle, elle ne la gate jamais.

**Bonus narratif quasi gratuit (nice-to-have, à arbitrer par `pm`) :** si la plaque est
obtenue, la UNE de `PARIS-MINUIT` dans l'écran des scores peut basculer sur une variante
embarrassée — le tabloïd forcé de mentionner « une rumeur » qu'il ne peut plus taire. C'est
2 strings, zéro système. Je peux les écrire sur demande du gate.

### 5.4 Terrain partagé avec `game-designer` (Sacha)

Cette section est une **recommandation de fiction**, pas une spec mécanique. Le point de
synchronisation est unique et précis : **si Sacha propose un autre levier que « la planque
entre enfoncée », la fiction s'adapte sans se contredire** — le seul invariant narratif est
que la preuve rende le Commandant **isolé**, jamais **affaibli physiquement** (on ne blesse
pas un homme avec une photo). Toute récompense qui se lit « il a moins de PV » casse la
fiction ; toute récompense qui se lit « il est moins couvert » la sert. _On conçoit ensemble,
on livre séparément._

---

## 6. Fiches — pour l'art flow (fiche, pas look)

Le VISUEL appartient à `concept-artist` → `lead-art`. Voici ce qu'ils ont besoin de savoir.

| Élément                      | Rôle dans la scène                                                                                                                                          | Poses / états demandés                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Le Commandant**            | La cible. Silhouette **déjà ratifiée** — tête nue, tenue de commandement, ni casque ni bouclier.                                                            | `attend dans l'ombre` · `face à face` · `reçoit l'enveloppe` (main tendue, visage de trois quarts) · `empoche`. |
| **L'homme au manteau clair** | Le client. Civil, manteau clair (contraste B&N maximal avec le Commandant sombre : le read se fait au ton, pas à la couleur). Jamais nommé, visage lisible. | `descend de voiture` · `face à face` · `tend l'enveloppe`.                                                      |
| **La berline**               | L'identification. Feux éteints à l'arrivée, plaque lisible au départ sous le lampadaire.                                                                    | `arrêtée` · `en départ, plaque lisible`.                                                                        |
| **Backdrop du set-piece**    | Quai de la Loire, piliers du viaduc, eau noire, un lampadaire. Une rame qui passe au-dessus.                                                                | Backdrop 2D dédié (ADR-0077 §9) — **pas** un zoom dans les calques Stalingrad.                                  |
| **Planche contact**          | Le verdict. B&N photocopié, bords de perforation, croix au feutre gras sur ce qui compte.                                                                   | Surface UI — `ux-designer` + art flow.                                                                          |

**Ceci est une demande à l'art flow, pas un fait accompli.** Tant que ces assets n'existent
pas, les scripts §4 restent gatés et non livrés — les seules images qu'ils référencent
aujourd'hui sont des sprites **déjà shippés**.

---

## 7. Conformité boucle / scope

- **Boucle intouchable.** Le set-piece se joue **hors** de `Récupérer → Livrer → Éviter`, avant
  le camion. `Éviter` n'acquiert aucune règle nouvelle. PASS.
- **`une mission = 3-5 min`.** Set-piece court + une scène de 11 répliques + une planche
  contact de 2-4 répliques, skippables en un bouton. La photo ne rallonge pas la livraison :
  elle la précède.
- **Chaque échec a une raison explicite.** (c) §4.3 nomme la cause (`Rien de net.`) ; le
  « repéré » abort n'est pas une mort (ADR-0077 §7). Anti-mort-bullshit : PASS.
- **Roster §7 intact.** Aucune quatrième faction. Le Commandant est déjà l'apex de la BAC de
  nuit ; **le patron de boîte est un civil, pas un antagoniste jouable** — il n'entre pas au
  roster, il ne tire jamais, il ne réapparaît pas.
- **Authenticité 1998.** Argentique, pellicule finie, planche contact, photocopieuse, métro
  aérien, francs, aucun écran de contrôle, aucun réseau social, aucun téléphone à photo. Si le
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
3. **Motivation de la répression = commerciale.** C'est la seule vraie addition idéologique de
   cette spec, et elle est **irréversible une fois shippée** : après ça, la BAC n'est plus une
   force aveugle. Je la crois juste et period-correct (1998, avant les lois de 2001) — mais
   c'est un choix de fond, à ratifier explicitement par le gate.
4. **Aucun dialogue shippé n'est modifié.** La spec s'accroche à la ligne existante
   `« il n'a plus personne pour le couvrir »` sans la réécrire.
5. **Alternative B réservée** — RG payant un indic = **set-piece n°2**, une fois les contacts
   §7 recrutables in-game. Écrit ici pour ne pas être réinventé, **pas construit**.
6. **Ne décide pas** : tuning (`game-designer`), contrôles/accessibilité (`ux-designer`),
   gate-vs-bonus dans la progression (`lead-game-designer` + `pm`), niveau d'accueil du build.

---

## 9. Hand-off — points à faire valider par `lead-game-designer` (Karim)

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim) ·
**Objet :** fiction du premier set-piece photo (open question ADR-0077).

**Demandé au gate — `VERDICT:` PASS / PASS-WITH-CORRECTIONS / FAIL, plus une décision sur
chacun des 7 points :**

1. **La cible (§1).** Ratifier **le Commandant encaissant une enveloppe** comme premier
   set-piece, contre l'alternative A (subalterne anonyme) et l'alternative B (RG/indic,
   réservée en n°2). C'est la décision structurante ; tout le reste en découle.
2. **Le flag idéologique (§8.3).** Ratifier **explicitement** que la répression policière du
   circuit free-party est **commanditée et payée par la nuit légale**. C'est irréversible une
   fois shippé. Si le gate refuse, la cible tient toujours mais la scène change de contenu (à
   réécrire) — dis-le avant, pas après.
3. **Lieu et moment (§2).** Stalingrad, quai de la Loire, avant le gig — **ou** relocalisation
   sur Belliard si `senior-architect` / `game-designer` veulent le Belliard-first d'ingénierie.
   Je recommande Stalingrad (couverture sonore diégétique gratuite) ; le calendrier de build
   n'est pas ma lane.
4. **Le triptyque (§3.2).** Arrivée (bonus) / **L'ÉCHANGE** (preuve maîtresse) / plaque
   (bonus). Valider en particulier que **la preuve maîtresse exige les deux visages + les mains
   dans le cadre** — c'est ce qui rend le zoom un vrai arbitrage, et ça contraint le tuning des
   seuils de remplissage de cadre chez `game-designer`.
5. **La récompense (§5).** Ratifier la reco — **la preuve isole le Commandant, elle ne
   l'affaiblit pas** ; réutilisation de l'état « planque enfoncée » déjà spécifié
   (`spec-boss-belliard-fiction.md` §2) ; **bonus, jamais gate**. Point de synchro avec `game-designer` :
   l'invariant narratif est « moins couvert », jamais « moins de PV » (§5.4).
6. **Les scripts (§4).** PASS sur les 11 répliques du briefing et les 3 variantes de planche
   contact. Trancher aussi : garde-t-on la variante **(b)** (branche bonus) au V1, ou ne
   shippe-t-on que **(a)** + **(c)** pour réduire le coût dev ?
7. **La demande art (§6).** Autoriser l'ouverture de la demande auprès de `concept-artist` →
   `lead-art` : backdrop dédié du quai + poses clés (Commandant / manteau clair / berline) +
   surface planche contact. Sans ce feu vert, les scripts restent gatés et non livrés.

**Ce que je ne décide pas :** tuning, contrôles, progression, lane split. **Terrain partagé à
synchroniser avec `game-designer` (Sacha)** : §3.3 (fenêtres sonores) et §5 (nature du levier)
— on conçoit ensemble, on livre séparément (COLLABORATION.md).

**À loguer après verdict :** hand-off dans `docs/handoffs/`, indexé dans
`docs/agent-handoffs.md` ; statut reporté dans `docs/game-design/README.md`.
