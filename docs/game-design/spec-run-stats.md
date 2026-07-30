# Spec — Statistiques de run (local-first) — 3 métriques phares, compteurs v1, détail

**Feature:** compteurs de run + écran de fin (bloc phare + détail optionnel) + export.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-30
**Status:** **GATED (design) 2026-07-30** — `lead-game-designer` (Karim) **PASS WITH
RESERVES**. Réserves bloquantes à transcrire ici avant que `dev-r3f-render` n'ouvre :
**R1** (bloc de contrôles non-fermant, ≥ 24 px de padding inerte — résout D3.5.2),
**R3** (le détail fait 7 lignes et les 3 phares y réapparaissent — D3.1/D3.2 l'emportent
sur la lecture « additive » de la spec UX), **R5** (la cause de fin §2.6 est lisible à
0 entrée, hors des 3 emplacements phares — guidelines §5 règle 4). Les 7 questions du §7
sont tranchées au gate. Verdict complet et décisions :
[`docs/handoffs/story-run-stats-system.md`](../handoffs/story-run-stats-system.md) §3.
**Story:** `_bmad-output/planning-artifacts/story-run-stats-system.md`
**Hand-offs:** `docs/handoffs/story-run-stats-system.md`
**ADR:** 0076 (alloué, contenu à écrire par `senior-architect`).
**Lane:** mécaniques / tuning / 3C. Aucun code, aucun nom de fichier d'implémentation ici.
La forme visuelle et la typographie appartiennent à `ux-designer` + `lead-art` ; le schéma
JSON, les clés de stockage et l'emplacement des modules appartiennent à `senior-architect`.

**Verdict cahier des charges :** **EXTENSION CONSCIENTE**, déjà tranchée et justifiée par
`pm` dans la story (Prohibition Atari ST n'avait qu'un score). Cette spec n'ajoute **aucun
verbe** à la boucle `Récupérer → Livrer → Éviter` : elle l'**observe**. Elle n'ajoute aucune
règle, aucun seuil, aucune récompense, aucune source d'événement nouvelle — chaque compteur
se branche sur une transition qui existe déjà dans le tick.

---

## 0. Ce que j'ai constaté dans le build avant de spécifier

Trois faits mesurés dans l'état actuel du jeu conditionnent toute la spec. Sans eux, la
liste v1 de la story produit deux booléens déguisés en compteurs.

**F1 — Une run = une tentative sur UN niveau.** La run naît à l'entrée en `PLAYING` et meurt
sur `GAME_OVER` ou `LEVEL_COMPLETE`. Pas de chaînage, pas de campagne continue, pas de
respawn.

**F2 — « Livraisons effectuées » vaut 0 ou 1.** Chaque niveau publié n'autorise **qu'une
seule** livraison scriptée (belliard 1, stalingrad 1, vitry 1, niveau-final 1). Un compteur
« nombre de livraisons » n'a donc que deux valeurs possibles : c'est un booléen, pas une
métrique. Il faut le graduer autrement (§2.2).

**F3 — « Morts » vaut 0 ou 1.** Il n'y a pas de vie de rechange : la jauge de cœurs tombe à
0 et la run s'arrête immédiatement. Là encore, deux valeurs. Et pire : `GAME_OVER` **n'est
pas** synonyme de mort — l'expiration du chrono et un boss perdu produisent le même
`GAME_OVER` sans que le joueur ait perdu ses cœurs. Le compteur doit donc être gradué
(cœurs perdus, sur le pas de quart de cœur d'ADR-0066) et la cause de fin doit être une
donnée à part entière (§2.3, §2.6).

Conséquence : je **ne rajoute aucun compteur** à la liste des 5 de la story. Je **change
l'unité** de deux d'entre eux (livraison, morts) pour qu'ils cessent d'être des booléens.
Ce point est signalé au gate (§7, Q1) parce qu'il touche à la lettre du périmètre `pm`.

---

## 1. Les 3 métriques phares — décision

**D1.1 — Le trio retenu, dans cet ordre de lecture :**

| #   | Métrique phare                                | Libellé de travail | Valeur             | Verbe servi              |
| --- | --------------------------------------------- | ------------------ | ------------------ | ------------------------ |
| H1  | Score final                                   | `SCORE`            | entier             | agrégat des trois verbes |
| H2  | Résultat de la livraison + intégrité restante | `LIVRAISON`        | issue + %          | **Livrer**               |
| H3  | Cœurs perdus                                  | `DÉGÂTS`           | 0 → 3, pas de 0,25 | **Éviter**               |

**D1.2 — Critères d'admission d'une métrique phare** (appliqués avant de choisir ; toute
métrique phare future doit les repasser) :

1. **Universelle** — elle a une valeur sur _tous_ les niveaux publiés, sinon un des trois
   emplacements se vide selon le niveau et la lecture devient conditionnelle.
2. **Non dégénérée** — plus de 2 valeurs possibles, sinon c'est un badge, pas une mesure.
3. **Actionnable** — elle dit quoi faire autrement à la prochaine run, pas seulement
   « c'était mieux/moins bien ».
4. **Sans incitation perverse** — la maximiser (ou minimiser) ne doit pas payer un
   comportement qui abîme la boucle (§5).

**D1.3 — Justification par la boucle.**

- **H2 = Livrer.** C'est le seul verbe qui a un **objectif explicite et daté** dans le jeu :
  un véhicule arrive à un instant scripté, tient une fenêtre de 6 à 8 s, et sort intact ou
  détruit. C'est aussi le verbe le plus facile à **rater sans s'en rendre compte** — la
  victoire passe par le quota de neutralisations, pas par la livraison, donc un joueur peut
  gagner un niveau en ayant complètement ignoré `Livrer`. Le mettre en phare est la seule
  façon de le rendre visible sans ajouter de règle.
- **H3 = Éviter.** C'est le verbe dont l'échec **termine la run**, et le seul dont la mesure
  est non nulle sur pratiquement toutes les runs (on encaisse toujours quelque chose). Sur
  le pas de quart de cœur d'ADR-0066, il prend 13 valeurs (0 → 3 par 0,25) : c'est la
  métrique la plus fine des trois. Et elle est directement actionnable — elle se lit contre
  le tableau d'archétypes (un cœur perdu = 4 balles de flic de base, ou 1 CRS).
- **H1 = Score.** Il reste parce que : (a) c'est le seul chiffre affiché sur l'écran de fin
  aujourd'hui — le retirer est une régression ; (b) c'est la clé de tri de la fonctionnalité
  meilleurs scores du Sprint 4 ; (c) c'est là qu'atterrit `Récupérer` (les caisses portent une
  récompense de score) en plus du bonus de livraison et des neutralisations. Score répond à
  **combien**, H2 et H3 répondent à **comment**.

**D1.4 — Pourquoi PAS une métrique phare par verbe.** `Récupérer` n'a pas de candidat qui
passe le critère « universelle » : les caisses d'armement ne sont **authorées que sur
belliard**. Un emplacement phare « CAISSES » afficherait `—` sur trois niveaux sur quatre.
`Récupérer` est donc servi en **détail** (§3, ligne 1) et dans le score (H1). C'est une
limite de **contenu**, pas de design : si un futur niveau ajoute des caisses partout, la
promotion de `CAISSES` en phare à la place de H1 est le premier candidat à réexaminer.

**D1.5 — Rejets explicites** (pour qu'on ne les re-débatte pas) :

| Candidat                | Rejeté parce que                                                                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Durée de run            | Sur un niveau chronométré, une run perdue au temps vaut **exactement** la durée du niveau : dégénérée pour la moitié des issues. Et la mettre en phare crée l'incitation « aller vite » qui fait sauter la livraison (§5.2). → détail, sans comparaison. |
| Vague atteinte          | Proxy imprécis du quota ; déjà à l'écran, conservé en détail (§3, ligne 7) pour ne pas régresser.                                                                                                                                                        |
| Neutralisations / quota | La vraie porte de victoire, et une bonne métrique — mais c'est un **6ᵉ compteur**, hors périmètre v1. Premier candidat v1.1 (§7, Q4).                                                                                                                    |
| Précision de tir        | Coupée par `pm`, et à raison : c'est l'exemple canonique de la stat qui pousse à camper (§5.1).                                                                                                                                                          |

---

## 2. Définition exacte des 5 compteurs v1

Convention commune :

- **Portée** — une run (F1). Tous les compteurs sont remis à zéro à la création de l'état
  initial du niveau, jamais en cours de run.
- **Déterminisme** — chaque compteur se dérive d'une transition du tick pur. Aucun ne lit
  l'horloge murale ni un aléa. Deux runs rejouant la même séquence de ticks produisent le
  même résumé (contrainte story AC1/AC8).
- **Verrouillage (latch)** — quand une valeur est écrite par une transition qui la détruit
  ensuite, elle est **latchée** : capturée au tick de la transition et conservée telle
  quelle jusqu'à la fin de la run. Signalé explicitement ci-dessous là où c'est obligatoire.

### 2.1 — Compteur 1 : ramassages (Récupérer)

**D2.1.1 — Événement déclencheur.** La résolution d'un tir du joueur dont l'issue est
`loot-hit` (caisse d'armement touchée à l'état visible), dans le système d'armement /
résolution de tir. **Unité :** nombre entier de caisses ramassées.

**D2.1.2 — Dénominateur : caisses apparues.** On compte aussi le nombre de caisses **entrées
en jeu** sur la run (le tick où le système de butin signale un spawn). La métrique s'affiche
`ramassées / apparues` (ex. `3/4`). Sans dénominateur, `3` ne veut rien dire : trois caisses
sur trois est un sans-faute, trois sur sept est un problème.
_Note de périmètre :_ je considère le dénominateur comme une **graduation du compteur 2 de la
story**, pas comme un 6ᵉ compteur — il vient de la même chaîne d'événements et n'existe que
pour rendre le numérateur lisible. Signalé au gate (§7, Q2).

**D2.1.3 — Cas limites.**

| Cas                                                                             | Comportement spécifié                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Niveau sans caisses authorées (stalingrad, vitry, niveau-final)                 | Les deux compteurs valent 0 et la ligne détail affiche `—`, **jamais** `0/0`. `0/0` se lit comme un échec ; `—` se lit comme « pas de caisses ici ».                                              |
| Arme à dispersion : plusieurs projectiles dans le même tick sur la même caisse  | **1 ramassage exactement.** La caisse est consommée par le premier projectile et n'existe plus pour les suivants — la garantie est structurelle, pas à ajouter. À couvrir par un test (§6, AC-4). |
| Caisse apparue puis expirée sans être touchée                                   | `apparues` +1, `ramassées` +0. C'est précisément l'information utile.                                                                                                                             |
| Caisse en jeu (visible ou en cours d'apparition) au moment où la run se termine | Elle compte dans `apparues` (elle est bien entrée en jeu) et pas dans `ramassées`. Pas de traitement spécial : la fin de run ne « pardonne » pas la dernière caisse.                              |
| Caisse portant une récompense de score / de cœurs                               | Le ramassage compte pour 1 quelle que soit la récompense. La récompense atterrit dans H1 (score) et §2.3 (cœurs), pas ici.                                                                        |

### 2.2 — Compteur 2 : livraison (Livrer) — **H2**

**D2.2.1 — Événement déclencheur.** Les deux transitions terminales de la machine à états du
véhicule, dans le système de livraison :

- `EN LIVRAISON → SUCCÈS` (la fenêtre est tenue jusqu'au bout avec une intégrité > 0) —
  c'est aussi l'unique tick où le bonus de score est versé ;
- `EN LIVRAISON → ÉCHEC` (l'intégrité atteint 0 avant la fin de la fenêtre).

**D2.2.2 — Le latch est OBLIGATOIRE, pas une optimisation.** Après son issue, le véhicule
repart et passe à `PARTI` : **l'issue n'est plus lisible dans l'état final de la run**. Lire
la phase du véhicule sur l'écran de fin donnerait `PARTI` aussi bien après un succès qu'après
un échec. L'issue **doit** être capturée au tick de la transition, une seule fois, et ne plus
bouger. C'est la contrainte d'implémentation la plus importante de cette spec.

**D2.2.3 — Unité : une issue parmi cinq, plus un pourcentage.**

| Issue            | Condition                                                                              | Ce qui s'affiche                                                    |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `RÉUSSIE`        | transition vers succès latchée                                                         | `RÉUSSIE — intégrité NN %`                                          |
| `PERDUE`         | transition vers échec latchée                                                          | `PERDUE` (l'intégrité vaut 0 par construction, on ne l'affiche pas) |
| `INTERROMPUE`    | run terminée alors que le véhicule est en approche ou en livraison, sans issue latchée | `INTERROMPUE — intégrité NN %`                                      |
| `NON DÉCLENCHÉE` | run terminée avant l'instant de déclenchement scripté                                  | `NON DÉCLENCHÉE`                                                    |
| `—`              | le niveau n'authore aucune livraison                                                   | `—`                                                                 |

`INTERROMPUE` est le cas « mort pendant la livraison » demandé par le brief : ce n'est **ni**
un succès **ni** un échec, et le confondre avec `PERDUE` mentirait au joueur (il n'a pas raté
la protection du véhicule, il est mort à côté). L'intégrité restante à cet instant est la
donnée utile : `INTERROMPUE — 78 %` dit « tu tenais bien », `INTERROMPUE — 12 %` dit
« tu allais la perdre de toute façon ».

**D2.2.4 — Intégrité : unité et arrondi.** `plancher(intégrité / intégrité_max × 100)`, en
pourcentage entier. **Plancher, pas arrondi** : à 99,6 % on affiche `99`, jamais `100`. Un
`100 %` doit signifier « pas une égratignure », sinon la valeur perd son sens de repère. La
valeur est lisible à tout instant (elle est conservée à travers les phases terminales), donc
seule l'issue a besoin du latch.

**D2.2.5 — Cas limites.**

| Cas                                                                                          | Comportement spécifié                                                                   |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Le joueur meurt pendant la fenêtre de livraison                                              | `INTERROMPUE` + intégrité à l'instant de la mort.                                       |
| Le chrono expire pendant la fenêtre de livraison                                             | `INTERROMPUE`, même traitement.                                                         |
| Le quota de neutralisations est atteint avant l'instant de déclenchement (20 s sur belliard) | `NON DÉCLENCHÉE`. C'est un vrai scénario de jeu, pas un cas dégénéré — voir §5.2.       |
| Une cinématique (QTE otage, duel de boss) gèle la scène pendant la fenêtre                   | Le compteur de fenêtre est gelé avec le reste ; aucune règle spécifique ici.            |
| Le véhicule est réussi puis la run continue et se termine en `GAME_OVER`                     | L'issue reste `RÉUSSIE`. Le latch ne se dé-latche jamais : la livraison a bien eu lieu. |

### 2.3 — Compteur 3 : cœurs perdus (Éviter) — **H3**

**D2.3.1 — Redéfinition assumée.** La story dit « vies perdues / morts ». Par F3, ce
compteur ne peut valoir que 0 ou 1. Je le **gradue** : il compte les **cœurs perdus**, sur le
pas de quart de cœur d'ADR-0066. Même source d'événement, unité plus fine, aucun événement
nouveau. Le fait de mourir n'est pas perdu pour autant : il est porté par la cause de fin
(§2.6), qui est plus informative qu'un booléen.

**D2.3.2 — Événement déclencheur — DEUX sources distinctes, qui ne se compensent pas.**

| Source               | Événement                                                             | Amplitude                                                                     |
| -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Dégâts encaissés** | Un projectile ennemi atteint le joueur hors fenêtre d'invulnérabilité | Dégâts de l'archétype tireur : 0,25 (flic de base) / 0,5 (motard) / 1,0 (CRS) |
| **Fautes**           | Le joueur tire sur un livreur civil                                   | 1 cœur plein (c'est une faute, pas des dégâts — ADR-0066)                     |

`cœurs_perdus = dégâts encaissés + fautes`, et le détail affiche la décomposition (§3).
_Note de périmètre :_ c'est une **décomposition d'un compteur de la story**, pas un compteur
de plus — les deux termes sont déjà séparés dans le tick et il est **impossible** de les
reconstituer après coup depuis la variation nette de cœurs, parce qu'une caisse peut _rendre_
des cœurs. Sans la décomposition, la métrique n'est pas calculable correctement.

**D2.3.3 — Monotonie stricte.** Le compteur ne **décroît jamais**. Un gain de cœurs (récompense
de caisse) est ignoré ici : il agit sur la jauge de vie du joueur, pas sur l'historique des
coups reçus. « J'ai encaissé 1,5 cœur et j'en ai regagné 1 » se lit `1,5` — la mesure porte sur
l'exposition, pas sur le solde.

**D2.3.4 — Cas limites.**

| Cas                                                                              | Comportement spécifié                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deux projectiles touchent dans le même tick, ou dans les 0,4 s d'invulnérabilité | Le second est **absorbé** : il ne coûte rien et **ne compte pas**. Le compteur reflète les dégâts réellement subis, pas les balles arrivées.                                                                                                                                                                                                                                                                                                                                                                   |
| Le coup fatal dépasse les cœurs restants (CRS à 1,0 sur 0,5 cœur restant)        | La contribution du tick est **écrêtée au contenu réel de la jauge à cet instant** : on ne facture jamais un dégât que le joueur n'a pas subi. Il n'y a **pas** de plafond sur le total de la run : une caisse de soin peut rendre des cœurs, donc l'exposition cumulée peut légitimement dépasser la jauge de départ (`4,5 ♥` sur une jauge de 3 est un fait, pas un bug — cf. D2.3.3, la mesure porte sur l'exposition, pas sur le solde). La jauge de départ reste reportée à part, comme repère de lecture. |
| Run gagnée sans avoir été touchée                                                | `0`. Valeur légitime et fréquente — voir la contrainte de cadrage en §5.1.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Dégâts pris pendant un QTE                                                       | Comptés par la même règle si le QTE retire des cœurs ; aucune exception.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### 2.4 — Compteur 4 : durée de run

**D2.4.1 — Source.** L'accumulateur de temps écoulé du niveau (le même qui déclenche la
livraison scriptée), lu à la fin de la run. **Pas** l'horloge murale, **pas** un nouveau
chrono, **pas** `temps_du_niveau − temps_restant` (le temps restant reçoit des bonus de
secondes des ennemis bonus et ne mesure donc plus la durée jouée).

**D2.4.2 — Unité.** Secondes, **une décimale** (`68,4 s`). Rationale : les niveaux durent
70 à 90 s et la fenêtre de livraison fait 6 à 8 s ; la seconde entière écrase la lecture du
tempo autour de la livraison, le centième est du bruit.

**D2.4.3 — Ce que la durée EXCLUT, par construction.**

| Situation             | Incluse ?                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| Jeu en pause          | **Non** — la boucle entière est gelée en pause, aucun tick ne passe. Rien à ajouter. |
| Cinématique QTE otage | **Non** — elle gèle l'accumulateur.                                                  |
| Duel de boss          | **Non** — même gel.                                                                  |
| Écran de fin affiché  | **Non** — la run est terminée, la valeur est figée.                                  |

C'est donc du **temps de jeu effectif**, et c'est la définition que je veux : un rapport de
playtest doit pouvoir comparer deux runs sans qu'une pause pipi de trois minutes les rende
incomparables. À écrire tel quel dans le libellé du détail (§3) pour que le lecteur du
rapport ne se pose pas la question.

**D2.4.4 — Cas limite.** Run perdue au chrono ⇒ la durée vaut la durée du niveau à
±1 tick. Attendu, non corrigé, et c'est exactement pourquoi la durée n'est pas une métrique
phare (D1.5).

### 2.5 — Compteur 5 : score final

**D2.5.1 — Source.** Le score de l'état de jeu à la fin de la run. Aucun recalcul, aucune
pondération, aucun bonus de fin ajouté par cette fonctionnalité. **Unité :** entier.

**D2.5.2 — Ce qu'il agrège déjà** (pour mémoire, aucune modification demandée) :
neutralisations par archétype, bonus de livraison (300 à 500 selon le niveau), récompenses
de caisse, pénalités de tir sur civil.

**D2.5.3 — Cas limite : il n'y en a pas. Le score est déjà planché à 0 dans le tick.**
Le score de l'état de jeu est plafonné par le bas à chaque tick (`Math.max(0, …)`) : une
pénalité de tir sur civil sur un score de 0 laisse 0, elle ne descend pas en dessous. **Le
score final est donc toujours un entier ≥ 0, et l'écran de fin n'a jamais de valeur négative
à afficher ni de signe à gérer.** Aucun affichage conditionnel, aucun formatage signé.

_Amendement 2026-07-30 (renvoi ADR-0076 C6, `senior-architect`)._ La rédaction initiale de
cette clause demandait d'afficher un score négatif « tel quel, signe compris » et de ne pas
le plancher : **inatteignable**, le plancher existe déjà en amont. Arbitrage architecte :
**aucun changement de code** — modifier une règle de score depuis une fonctionnalité qui a
promis de se contenter d'observer la boucle serait hors mandat (§0). C'est la spec qui
s'aligne sur le tick, pas l'inverse. Aucune autre clause n'est touchée : le score reste le
phare H1, lu tel quel, sans recalcul (D2.5.1).

### 2.6 — Donnée transverse : cause de fin de run

**D2.6.1 — Ce n'est pas un 6ᵉ compteur**, c'est la **forme d'affichage** du compteur
« morts » de la story (§2.3.1) : au lieu d'un booléen à deux valeurs, une issue parmi cinq,
chacune correspondant à une branche de sortie qui existe déjà et est déjà distincte dans le
tick.

| Cause        | Branche de sortie                                            |
| ------------ | ------------------------------------------------------------ |
| `SANTÉ`      | jauge de cœurs ≤ 0 — **c'est la seule qui est une « mort »** |
| `TEMPS`      | chrono expiré sur un niveau sans finale de boss              |
| `QUOTA`      | quota de neutralisations atteint (issue victorieuse)         |
| `BOSS GAGNÉ` | duel de boss résolu en victoire                              |
| `BOSS PERDU` | duel de boss résolu en défaite                               |

**D2.6.2 — Pourquoi c'est indispensable.** Trois causes sur cinq produisent le même
`GAME_OVER`. Sans cette donnée, un rapport de playtest ne distingue pas « je me suis fait
tuer » de « je n'ai pas fini à temps » — deux problèmes de tuning **opposés** (l'un demande
de baisser les dégâts, l'autre de rallonger le chrono). C'est, à mon avis, l'information la
plus utile de tout le rapport pour Bertrand.

**D2.6.3 — Run abandonnée.** Le joueur qui quitte vers le menu en cours de run **ne
déclenche pas d'écran de fin** : aucune cause n'est produite, aucun résumé n'est affiché,
rien n'est exporté. Un abandon **n'est pas une run**. Les jalons de l'entonnoir déjà
franchis restent franchis (ils sont irréversibles par définition, §4). Ne **pas** inventer
une sixième cause `ABANDON` : ça obligerait à écrire une stat au moment d'un événement de
navigation, hors de la boucle pure.

---

## 3. Le détail optionnel — contenu, ordre, et ce qu'on n'affiche PAS

**D3.1 — Ordre imposé : les trois verbes de la boucle, puis le méta.** L'ordre n'est pas
esthétique, il est mnémotechnique : le détail se lit comme la boucle se joue.

| #   | Ligne                   | Valeur                                                                             | Absent / non applicable                                   |
| --- | ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | **RÉCUPÉRER — Caisses** | `n / m`                                                                            | `—` si le niveau n'authore pas de caisses                 |
| 2   | **LIVRER — Livraison**  | issue + `intégrité NN %` (§2.2.3)                                                  | `—` si aucune livraison authorée                          |
| 3   | **ÉVITER — Dégâts**     | `x ♥` puis, sur la même ligne, `(dont y ♥ de fautes)`                              | la parenthèse disparaît quand `y = 0`                     |
| 4   | **Durée de jeu**        | `t,t s` — libellé explicite « temps de jeu effectif (hors pause et cinématiques) » | jamais absent                                             |
| 5   | **Score final**         | entier signé                                                                       | jamais absent                                             |
| 6   | **Fin de run**          | une des 5 causes (§2.6.1)                                                          | jamais absent                                             |
| 7   | **Vague**               | entier                                                                             | jamais absent — reprise de l'écran actuel, non-régression |

Les lignes 1, 2, 3, 4, 5 **sont** les 5 compteurs v1 de la story (AC3 satisfait). Les lignes
6 et 7 sont respectivement la forme d'affichage du compteur « morts » (§2.6.1) et une donnée
déjà à l'écran aujourd'hui.

**D3.2 — Les trois métriques phares réapparaissent dans le détail** (lignes 2, 3, 5). On ne
retire rien du détail sous prétexte que c'est déjà en haut : le détail est le bloc qu'on
copie / qu'on lit à voix haute, il doit être complet et autoportant.

**D3.3 — Ce qu'on n'affiche PAS, nommément** (liste fermée ; tout ajout passe par une
nouvelle story) :

| Non affiché                                                                                                        | Raison                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Tirs tirés, coups au but, précision, ratio touché/manqué                                                           | Coupé par `pm` ; incitation à camper (§5.1).                                                                                                    |
| Détail des neutralisations par archétype                                                                           | 6ᵉ compteur. Candidat v1.1 (§7, Q4).                                                                                                            |
| Découpage par vague, temps par vague, temps de la fenêtre de livraison                                             | Analytique, pas jouable. Fabrique un tableau de bord.                                                                                           |
| Distance parcourue, déplacement du réticule, temps de visée                                                        | Aucun rapport avec la boucle.                                                                                                                   |
| Énergie (0–100)                                                                                                    | Sans effet mécanique en V1 : afficher un chiffre inerte apprend une fausse règle au joueur.                                                     |
| **Toute comparaison inter-runs** : record personnel, flèches ↑/↓, écart avec la run précédente, « nouveau record » | §5.3 — c'est le vecteur principal d'incitation perverse, et c'est le périmètre de la fonctionnalité meilleurs scores du Sprint 4, pas celui-ci. |
| **Tout badge, médaille, note, rang, mention « sans faute » / « parfait »**                                         | Hors périmètre (la story exclut explicitement les succès/badges) et §5.1.                                                                       |

**D3.4 — Coût d'interaction (contrainte 3C, PROJECT_GUIDELINES §5).**

| Action             | Entrées requises                                                                       |
| ------------------ | -------------------------------------------------------------------------------------- |
| Voir les 3 phares  | **0** — visibles au rendu de l'écran de fin.                                           |
| Ouvrir le détail   | **1**, explicite, sur une cible dédiée.                                                |
| Exporter           | **1**, explicite, sur une cible dédiée, disponible que le détail soit ouvert ou fermé. |
| Quitter / relancer | **1**, inchangée par rapport à aujourd'hui.                                            |

**D3.5 — Conflit d'entrée à résoudre — signalé maintenant, pas au stage 5.** L'écran de fin
actuel est **entièrement** une cible de sortie : un clic ou un tap **n'importe où** ferme
l'écran. Y poser deux nouveaux boutons crée un conflit direct. Contrat exigé :

1. Aucune entrée unique ne peut à la fois ouvrir le détail (ou exporter) **et** fermer
   l'écran. L'entrée qui atteint un des deux contrôles est consommée par lui.
2. Un tap qui **manque** un contrôle de moins d'une hauteur de contrôle **ne doit pas**
   fermer l'écran. Sur mobile, un pouce approximatif ne doit pas coûter la lecture du détail
   ni l'export (ADR-0015 : les deux classes d'appareils ont des schémas d'entrée distincts,
   celui-ci doit tenir sur les deux).
3. Ouvrir le détail **ne réarme pas** la sortie : le détail ouvert, une entrée hors des
   contrôles ferme l'écran comme avant.

Le dimensionnement, l'espacement et la forme des cibles sont de la lane `ux-designer` ; le
contrat ci-dessus est la contrainte de jouabilité qu'elle doit satisfaire.

**D3.6 — Contenu sémantique de l'export** (le _quoi_, pas le schéma — le format, les noms de
champs et le versionnement appartiennent à `senior-architect`). Le rapport copié doit
contenir, au minimum : l'identifiant du niveau ; les 5 compteurs v1 dans leur unité exacte
telle que définie en §2 ; la décomposition dégâts / fautes ; le dénominateur des caisses ;
l'intégrité de la livraison ; la cause de fin ; la vague ; l'état des 4 jalons de
l'entonnoir. **Interdits dans l'export** : horodatage à la milliseconde, identifiant
d'appareil ou de navigateur, tout identifiant stable qui rendrait deux rapports rattachables
au même humain. Un rapport de playtest est une run, pas une personne.

---

## 4. Entonnoir — lecture de conception des 4 jalons

Périmètre `pm`, mais deux points relèvent de mon avis mécanique et doivent être tranchés au
gate.

**D4.1 — « Première livraison effectuée » = le latch de succès de livraison** (§2.2.1), pas
le déclenchement du véhicule, pas son arrivée. Le jalon doit marquer que le joueur a **fait**
la chose, pas qu'il l'a vue passer.

**D4.2 — « Belliard atteint » est ambigu et doit devenir « Belliard bouclé »** (`LEVEL_COMPLETE`
sur belliard). Raison : belliard est le **premier** niveau, jouable immédiatement après le
tutoriel. Interprété comme « belliard lancé », le jalon 4 est un doublon du jalon 2
(« tutoriel terminé ») et se franchit **avant** le jalon 3 (« première livraison »), qui a
justement lieu sur belliard. Interprété comme « belliard bouclé », l'entonnoir raconte une
vraie progression : je vois le titre → j'apprends → je réussis une livraison → je finis un
niveau. Question pour `pm` (§7, Q3).

**D4.3 — Les 4 jalons sont des verrous INDÉPENDANTS, jamais chaînés.** L'AC6 de la story dit
« dans l'ordre » ; c'est la description du parcours nominal, **pas** une garantie mécanique.
Contre-exemple réel : le quota de belliard est de 10 neutralisations et la livraison se
déclenche à 20 s de jeu — un joueur rapide peut boucler belliard **sans jamais** avoir vu la
livraison, franchissant le jalon 4 avant le 3. Si l'implémentation conditionne le jalon N au
jalon N−1, ce joueur perd silencieusement deux jalons et l'entonnoir ment. **Chaque jalon se
verrouille sur son propre événement, une seule fois, dans n'importe quel ordre.**

---

## 5. Contrôle d'incitation perverse — analyse

Méthode : pour chaque valeur affichée, je réponds à « quel comportement optimise ce chiffre,
et ce comportement sert-il ou abîme-t-il `Récupérer → Livrer → Éviter` ? ».

**D5.1 — H3 (dégâts, « moins c'est mieux ») — risque RÉEL, mitigé par les règles existantes,
plus une contrainte de cadrage.**
Le comportement qui minimise les dégâts est la passivité : ne pas tirer, ne pas s'exposer,
attendre. Il existe même un vecteur technique : les ennemis hors champ sont gelés
(ADR-0071), donc balayer la caméra loin de l'action fait littéralement cesser le tir ennemi.
**Pourquoi la boucle gagne quand même :** camper gèle aussi vos neutralisations, or le chrono
(70 à 90 s) court sans arrêt et la victoire exige le quota. Camper garantit `TEMPS` avec un
score proche de zéro. Le coût du camping domine son bénéfice de plusieurs ordres de grandeur.
**Aucune règle anti-camping nouvelle n'est donc requise** — et c'est important : en ajouter
une serait une modification de la boucle par une fonctionnalité qui a promis de ne
qu'observer.
**Contrainte de cadrage exigée (contraignante pour `ux-designer` et `narrative-designer`) :**
H3 est affichée comme une **mesure neutre**, jamais comme un objectif. Interdits : « SANS
FAUTE », « PARFAIT », « 0 DÉGÂT ! », toute mise en valeur, couleur de réussite, animation ou
son de récompense sur la valeur 0. Le moment où l'écran **félicite** un 0 dégât est le moment
où la stat devient une récompense — et donc une raison de camper.

**D5.2 — Durée (« plus vite c'est mieux ») — risque RÉEL et concret ; c'est pour ça qu'elle
n'est ni phare ni comparée.**
Minimiser la durée pousse à foncer sur le quota. Or sur belliard la livraison se déclenche à
20 s : boucler 10 neutralisations avant 20 s **fait sauter le verbe `Livrer` en entier** et
la run se termine en `NON DÉCLENCHÉE`. Une stat de durée mise en avant et comparée
récompenserait donc précisément la run qui contourne un tiers de la boucle.
**Mitigations spécifiées :** (a) la durée reste en détail, ligne 4, jamais en phare ; (b)
aucune comparaison, aucun record, aucune flèche (§D3.3) ; (c) le libellé dit « temps de jeu
effectif », un fait, pas un chrono à battre ; (d) la ligne 2 affiche `NON DÉCLENCHÉE` en
clair, donc la run rapide **montre** ce qu'elle a sauté au lieu de le masquer.

**D5.3 — La comparaison inter-runs est l'incitation perverse mère — coupée.**
Dès qu'une valeur « moins c'est mieux » est comparée à un record personnel, on crée le
_restart-scum_ : quitter et relancer dès le premier cœur perdu pour préserver un beau
chiffre. Ça remplace la boucle par une boucle de redémarrage. **Recommandation ferme sur le
point 6 de la story (« petit historique local des N dernières runs, si c'est peu coûteux ») :
NE PAS le faire en v1.** Si Karim et `pm` le gardent malgré tout, alors contrainte
minimale : ordre **chronologique** strict, aucun tri par valeur, aucune mise en avant d'un
meilleur, aucun agrégat (moyenne, record). Un journal, pas un classement. Signalé au gate
(§7, Q5).

**D5.4 — H2 (livraison / intégrité) — pas de risque identifié.** Maximiser l'intégrité
revient à neutraliser vite les assaillants du véhicule pendant sa fenêtre : c'est
littéralement le verbe `Livrer`. Contre-vérification faite : perdre volontairement le
véhicule n'apporte rien (ni bonus ni pénalité), et ignorer les autres fenêtres pendant la
fenêtre de livraison est déjà arbitré par le quota + le chrono.

**D5.5 — Ligne 1 (caisses `n/m`) — pas de risque identifié.** Ramasser une caisse est un
tir sur une cible statique, sans pénalité, sans coût d'opportunité autre que le temps de
visée. Maximiser le ratio, c'est faire `Récupérer`. Le seul effet de bord — courir après une
caisse peu utile — est plafonné par le chrono.

**D5.6 — H1 (score) — inchangé.** Aucune règle de score n'est touchée, donc aucune incitation
nouvelle. Ce compteur ne fait que traverser.

---

## 6. Critères d'acceptation de conception (vérifiables au stage 5)

À contrôler par moi, build en main, avant la revue d'intégration.

| #     | Critère                                                                                                                                                                         | Vérification                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Exactement 3 métriques phares visibles, sans aucune entrée, sur `GAME_OVER` **et** sur `LEVEL_COMPLETE` ; ce sont H1/H2/H3 de D1.1.                                             | Capture d'écran des deux issues.                                                                                                                                                                                           |
| AC-2  | Le détail affiche les 7 lignes de D3.1 dans cet ordre exact, et rien d'autre.                                                                                                   | Capture, comparaison ligne à ligne.                                                                                                                                                                                        |
| AC-3  | Une run terminée par mort pendant la fenêtre de livraison affiche `INTERROMPUE` + une intégrité **strictement entre 0 et 100 %** — jamais `PERDUE`.                             | Run dirigée.                                                                                                                                                                                                               |
| AC-4  | Une caisse touchée par une arme à dispersion incrémente les ramassages de **1**, jamais de 2 ou 3.                                                                              | Test déterministe.                                                                                                                                                                                                         |
| AC-5  | Deux projectiles arrivant dans la même fenêtre d'invulnérabilité de 0,4 s ajoutent les dégâts **d'un seul**.                                                                    | Test déterministe.                                                                                                                                                                                                         |
| AC-6  | La contribution d'un tick **n'excède jamais** le contenu de la jauge à cet instant (coup fatal surdimensionné). Le **total** de la run n'est **pas** plafonné (D2.3.4 amendée). | Deux tests déterministes : (a) CRS à 1,0 sur 0,25 cœur restant ⇒ le tick compte `0,25`, pas `1,0` ; (b) soin de caisse puis exposition supérieure à la jauge de départ ⇒ le total dépasse légitimement la jauge de départ. |
| AC-7  | Une caisse bonus rendant un cœur **ne diminue pas** les cœurs perdus.                                                                                                           | Test déterministe.                                                                                                                                                                                                         |
| AC-8  | Sur un niveau sans caisses authorées, la ligne 1 affiche `—`, pas `0/0`.                                                                                                        | Run sur stalingrad.                                                                                                                                                                                                        |
| AC-9  | Une run quittée en cours vers le menu n'affiche aucun écran de fin et n'exporte rien ; les jalons déjà franchis le restent après rechargement.                                  | Run dirigée + rechargement.                                                                                                                                                                                                |
| AC-10 | Une pause de ≥ 10 s en cours de run n'ajoute **rien** à la durée affichée.                                                                                                      | Run chronométrée à la main.                                                                                                                                                                                                |
| AC-11 | Une run gagnée avant l'instant de déclenchement de la livraison affiche `NON DÉCLENCHÉE`.                                                                                       | Run dirigée sur belliard (quota avant 20 s).                                                                                                                                                                               |
| AC-12 | Une run perdue au chrono affiche la cause `TEMPS` ; une run perdue par la jauge de cœurs affiche `SANTÉ`. Les deux issues sont distinguables à l'écran.                         | Deux runs dirigées.                                                                                                                                                                                                        |
| AC-13 | Aucune entrée ne peut à la fois activer un contrôle (détail / export) et fermer l'écran ; un tap manquant un contrôle de moins d'une hauteur de contrôle ne ferme pas l'écran.  | Test manuel, bureau **et** mobile.                                                                                                                                                                                         |
| AC-14 | Nulle part sur l'écran de fin n'apparaissent : une comparaison inter-runs, une flèche de tendance, un record, un badge, une note, une mention de perfection.                    | Relecture de l'écran (mes yeux + `ux-designer`).                                                                                                                                                                           |
| AC-15 | La valeur `0` de H3 n'est ni colorée en réussite, ni animée, ni sonorisée différemment d'une autre valeur.                                                                      | Run sans dégâts.                                                                                                                                                                                                           |

---

## 7. Questions ouvertes pour le gate `lead-game-designer` (Karim)

| Q      | Question                                                                                                                                                                                                                                                    | Ma recommandation                                                                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Q1** | §0/§2.2/§2.3 : je **regradue** deux des 5 compteurs de `pm` (livraison → issue + intégrité ; morts → cœurs perdus + cause de fin) parce que tels quels ils sont des booléens. Est-ce dans ma lane (unité/tuning) ou faut-il un aval `pm` sur le périmètre ? | Ma lane, mais **à confirmer par `pm`** : aucun événement nouveau, aucun compteur ajouté, seule l'unité change.                                                                       |
| **Q2** | Le dénominateur « caisses apparues » (§2.1.2) et la décomposition dégâts/fautes (§2.3.2) sont-ils des graduations, ou des 6ᵉ et 7ᵉ compteurs hors périmètre ?                                                                                               | Graduations. La décomposition dégâts/fautes est en plus **techniquement obligatoire** : la variation nette de cœurs est polluée par les soins de caisse.                             |
| **Q3** | Jalon 4 : « Belliard atteint » ou « Belliard bouclé » ? (§4.2)                                                                                                                                                                                              | **Bouclé.** « Atteint » double le jalon 2 et casse l'ordre annoncé par l'AC6. Décision `pm`.                                                                                         |
| **Q4** | « Neutralisations / quota » est la meilleure métrique que je n'ai pas le droit d'ajouter (c'est un 6ᵉ compteur). On la garde pour v1.1 ?                                                                                                                    | Oui, v1.1. Ne pas l'introduire ici.                                                                                                                                                  |
| **Q5** | Point 6 de la story (petit historique local des N dernières runs) : on le garde ?                                                                                                                                                                           | **Non en v1** (§5.3 — vecteur de restart-scum). S'il est gardé : chronologique strict, aucun tri, aucun record, aucun agrégat.                                                       |
| **Q6** | L'écran de fin actuel se ferme sur un clic n'importe où. Le contrat D3.5 impose des zones qui ne ferment pas. C'est un changement d'ergonomie sur une surface déjà gatée — ça passe par toi, ou par une nouvelle passe `ux-designer` ?                      | À trancher au gate ; à mes yeux c'est un prérequis de jouabilité, pas une option.                                                                                                    |
| **Q7** | Le libellé exact des lignes (`RÉCUPÉRER — Caisses`, `Fin de run`, les 5 causes) est de la copie. Elle passe par `narrative-designer` ou reste du texte de diagnostic neutre ?                                                                               | **Neutre et hors fiction.** C'est un rapport de playtest ; la voix fanzine sur une cause de mort ajoute de l'ambiguïté là où on veut de la précision. Décision `lead-game-designer`. |

---

## 8. Ce que cette spec ne décide pas

- Le format, les noms de champs, le versionnement de l'export et les clés de stockage →
  `senior-architect` (ADR-0076). Je fixe le **contenu sémantique** (D3.6), pas le schéma.
- La disposition, la typographie, les tailles de cible, le registre visuel de l'écran de fin
  → `ux-designer` + `lead-art`. Je fixe la **lecture** (3 phares à 0 entrée, 7 lignes de
  détail dans cet ordre) et les **contrats d'entrée** (D3.4, D3.5).
- Le comportement de repli quand la copie presse-papier échoue (AC5 de la story) → `ux-designer`.
- Toute copie in-fiction → `narrative-designer`, si le gate tranche Q7 dans ce sens.
