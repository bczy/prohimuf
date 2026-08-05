# Spec — Scène PORTRAIT-ROBOT (mécanique + tuning)

**Feature :** nouvelle scène intercalaire « portrait-robot » — recomposer un visage à partir de
**4 bandes** (cheveux, yeux, nez, bouche). Référence assumée : la phase photofit de RoboCop
(Ocean, 1988), version Atari ST.
**Author:** `game-designer` (Sacha) · **Date:** 2026-08-05 · **Révision :** round 3 (post-amendements Bertrand)
**Status:** RÉVISÉE round 3 — alignée sur `docs/game-design/design-gate-portrait-robot.md` §3
(valeurs canoniques, mise à jour en place par la **§8 Amendements post-gate**). Prête pour
`senior-architect` (TECH PLAN).

> **Autorité de tuning.** La §3 du design gate fait foi. Cette spec ne fait qu'en porter les
> valeurs avec leur rationale. En cas de divergence résiduelle constatée, **le gate gagne** et
> c'est un bug de cette spec.

---

## Journal de révision — round 3 (2026-08-05, amendements Bertrand B1/B2/B3)

| #   | Ce qui change                                                                                                                                                                                                                                                                                       | Où                                         | Arbitrage              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| R10 | **Le CTA `SORTIR LA TÊTE` n'existe plus.** Plus d'acte de soumission volontaire : la scène se **verrouille automatiquement** dès que l'état courant est 4/4. R5 réécrite, `confirmGuardSeconds` supprimée, `Entrée` retirée du socle clavier, AC14 nettoyé.                                         | §2.2 (R5), §2.3, §4.1, §4.3, §5, AC2, AC14 | **B1** · gate A12bis   |
| R11 | **Deux moments d'évaluation, plus un.** `IDENTIFIED` = verrouillage **en cours de phase** (sur événement d'entrée) ; `PARTIAL`/`FAILED` = état courant **au buzzer** ou à l'abandon. Le 3/4 devient un palier **subi**, plus un palier soumettable. Règle d'ordre du 4/4-pile-au-buzzer transcrite. | §2.2, §2.3, §4.2                           | **B1** · gate A12bis   |
| R12 | **`confirmGuardSeconds` 1,0 s supprimée**, remplacée par l'invariant de seed **`initialStateAllWrong = true`** (les 4 bandes démarrent fausses ⇒ ≥ 4 gestes délibérés avant tout verrouillage). Mon ancien invariant A5 (§3) en devient un cas particulier, il est **renforcé** au niveau du set.   | §3 D2/A5, §4.1, AC9                        | **B1** · gate A14      |
| R13 | **La discrétisation télécarte saute.** Plus d'unité de 2,5 s, plus de 14 unités, plus de paliers 7/4/2, plus de libellé `TÉLÉCARTE · {n} UNITÉS`. Chrono **continu**, affichage **jauge qui se vide sans nombre**. La télécarte survit comme **objet** diégétique, pas comme compteur.              | §4.1, §5, §6, AC13, AC14, §9               | **B2** · gate A13      |
| R14 | **Paliers de tension refaits en secondes** — règle mixte : mi-parcours **proportionnel** (50 %), urgence **10,0 s restants** et dernier **5,0 s restants** en **absolu**, identiques dans les trois difficultés. Rationale complète + **un trou trouvé en `hard`** (D5, escaladé).                  | §4.1, §6, AC13, §9                         | **B2** · gate A13 · D5 |
| R15 | **`revealSeconds` devient conditionnelle à l'issue** : **1,4 s** à `IDENTIFIED` (flash + 4 tampons **simultanés**, zéro reptation — rien à apprendre après un 4/4), **2,6 s** inchangée à `PARTIAL`/`FAILED` (la reptation porte les corrections, c'est la « raison affichée »).                    | §4.1, §5, §6, AC4                          | **B1** · gate A15      |
| R16 | **Desktop tranché : option B**, drag horizontal à la souris sur la bande visée = variante ±1 sur CETTE bande. Même modèle mental que le swipe tactile. La §2.2 continue de ne prescrire **aucun** geste ; c'est noté comme fait acquis, pas comme exigence de cette spec.                           | §2.2 (encadré), §9                         | **B3**                 |
| R17 | **Reformulation de la §5 (D4).** « Zéro feedback » était devenu factuellement faux : le verrouillage **est** un feedback. Nouvelle formulation — **aucun feedback par trait, sous aucune forme ; UN seul signal global, binaire et terminal : le verrouillage. Il ne commente pas, il termine.**    | §5 (D4), AC3                               | **B1** · gate A16      |
| R18 | **Analyse du brute-force intégrée** (le CTA la rendait impossible, son retrait l'ouvre) : 6⁴ = 1 296 états, ~140 couverts en 35 s au clavier (10,8 %), 1 295 crans ≈ 9,3× le chrono, et le balayeur qui échoue échoue en `FAILED` (P(≥3 bons) = 1,5 %). **Aucune contre-mesure ajoutée.**           | §5 (nouveau D6), §7, AC15                  | gate A16               |

**Ce que ces amendements NE changent PAS** (vérifié ligne à ligne contre la §8 du gate) : A1
(énergie seule, zéro vie), A1c, A2 (interstitiel), A3 (1/run), A5 (4 bandes · 6 variantes ·
1 gabarit · composition des leurres), A6 (vocabulaire, hors CTA), A8 (mini-crop et verrouillage
**indicatif** de bande restent CUT — le verrouillage **automatique** de R10/R11 n'a rien à voir),
A10 (payoff +20/+10/0 s), A11 (le couperet), A12 (gel du twist). `timerSeconds`, les seuils
4/4 · 3/4 · ≤ 2/4, `resultHoldSeconds` et les trois barèmes d'issue **n'ont pas bougé d'une unité**.

**Désaccords maintenus : voir la section dédiée en fin de journal.**

---

## Journal de révision — round 2 (2026-08-05)

| #   | Ce qui change                                                                                                                                                                                                           | Où                              | Arbitrage                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| R1  | **Suppression de toute perte de vie** (le `−0,5 cœur` et son plancher anti-mort). Sanction `FAILED` = **−20 sur le capital d'énergie initial du niveau suivant**.                                                       | §0, §2.4, §4.3, AC5, AC6        | A1 + A1c (story AC5)         |
| R2  | **Suppression du `+25` énergie** à `IDENTIFIED` et du `+5` à `PARTIAL` : inopérants (clamp à 100) une fois la scène post-niveau. Récompense = score + payoff.                                                           | §4.3                            | A1c                          |
| R3  | **Placement : interstitiel post-niveau**, hors mission, **aucun gel du monde**, pas de shell ADR-0030 ni de `QTE_ZOOM_SECONDS`. J'écrivais un déclenchement scripté en cours de niveau.                                 | §0, §2.1, §2.3, §6, AC1         | A2 (budget 3-5 min)          |
| R4  | **Une occurrence par RUN** (j'écrivais « une par niveau »). La table de progression #1/#2/#3+ passe en **note post-V1**.                                                                                                | §3 D3, §7.6                     | A3 (`pm`)                    |
| R5  | **`variantsPerStrip` = 6, plafond dur 6, 1 seul gabarit** (24 assets). Le passage à 8 est retiré.                                                                                                                       | §3, §4.1, §7.5, AC9             | A5 (budget `lead-art`)       |
| R6  | **Payoff chiffré, intégré à la mécanique** (il manquait dans les trois specs) : retard de la 1ʳᵉ vague RG/BAC au niveau suivant, **+20 s / +10 s / 0 s**.                                                               | §2.4 (nouveau §2.5), §4.3, AC12 | A10                          |
| R7  | **Vocabulaire de surface joueur** : `LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`, bandeau `TÊTE À CONNAÎTRE`, ~~CTA `SORTIR LA TÊTE`~~ (**caduc, R10**). Les noms cheveux/yeux/nez/bouche restent **internes**.          | partout                         | A6                           |
| R8  | **Chrono** : habillage télécarte, ~~1 unité = 2,5 s (14 unités), paliers 7/4/2 unités~~ (**caducs, R13/R14**) ; modulation `Prefs.difficulty` **56 / 35 / 30 s** et pause sous `RotateOverlay` — **maintenues**.        | §4.1, §6                        | A7                           |
| R9  | **La spec ne prescrit plus de geste.** Elle prescrit la **règle** (« la bande _i_ passe à la variante _j_ », les 4 bandes indépendantes, ordre libre, cycle bouclé). Le mapping geste↔règle appartient à `ux-designer`. | §2.2, AC2, §9                   | A4-bis (Bertrand 2026-08-05) |

**Ratifié par le gate et conservé intact :** D1 (sélection libre), D2 (règle du trait nommé + test
de recevabilité verbal), D4 (verdict complet à la révélation — ~~zéro feedback pendant~~ **reformulé
au round 3, R17**), ~~`confirmGuardSeconds` 1,0~~ (**supprimée, R12**) · ~~`revealSeconds` 2,6~~
(**conditionnelle à l'issue, R15**) · `resultHoldSeconds` 2,2, seuils 4/4 · 3/4 · ≤ 2/4, timeout
évalué normalement (**et devenu le chemin normal de `PARTIAL`/`FAILED`, R11**).

**Désaccords maintenus (round 2) :** aucun. Les cinq points renvoyés étaient des contradictions avec
des décisions amont, pas des désaccords de fond — je les exécute. (Le seul point sur lequel j'aurais
argumenté, la valeur `+20 s` du payoff A10, me paraît bonne : voir §2.5, je la reprends telle
quelle.)

### Désaccords maintenus — round 3

Aucun sur les trois arbitrages : B1, B2 et B3 sont des décisions de Bertrand, je les exécute, et
sur le fond je pense que B1 et B2 rendent la scène **meilleure** (voir §6, « ce que la convergence
fait au game feel »). Restent **deux réserves** que je maintiens et que je remonte à
`lead-game-designer` plutôt que de les enterrer :

1. **Le temps mort du joueur qui se croit fini (conséquence directe de B1, non couverte par le
   gate).** Avec un CTA, le joueur qui pensait avoir fini sortait de la scène. Sans CTA, un joueur à
   3/4 **convaincu** d'être à 4/4 n'a plus aucun geste disponible : il attend le buzzer en regardant
   une jauge se vider, sans comprendre pourquoi rien ne se passe. C'est le seul état vraiment
   dégradé que B1 introduit, et il est fréquent (c'est **l'état modal** de l'échec honnête).
   Je ne propose **pas** de réintroduire un bouton : le chemin existe déjà, c'est la sortie
   `Escape` / retour Android (§2.1), qui résout à l'état courant **exactement** comme le buzzer.
   **Demande ferme, non négociable côté design :** cette sortie ne peut plus être libellée comme un
   **abandon**. Elle est devenue le geste « j'ai fini, imprime ». Livrable dû par
   `narrative-designer` (copie) et `ux-designer` (affordance permanente, pas un `Escape` caché) —
   §9. Sans elle, B1 crée jusqu'à 20 s de vide subi par run.
2. **Le palier de mi-parcours est inutilisable en `hard` (trou révélé par le recalcul en secondes).**
   Voir **D5, §4.1** : trois cues dans les 15 dernières secondes. Je propose une règle de
   distance minimale entre paliers ; c'est un ajout au canon §3 du gate, donc `lead-game-designer`
   tranche, pas moi.

**Entrées (lues, non re-dérivées) :** `docs/research/research-photofit-robocop-atari-st.md`
(recon sourcée, `tech-scout`, 2026-08-05) ; `docs/game-design/spec-boss-qte-encounter.md` et
`docs/game-design/spec-hostage-qte-static-duel.md` (format maison + prior art des scènes figées) ;
`_bmad-output/guidelines/PROJECT_GUIDELINES.md` ; `src/game/types/hostageQte.ts`,
`src/game/types/bossQte.ts`, `src/game/systems/qteSystem.ts` (conventions de tuning et de
sous-état — lus pour parler le même langage, **aucun code écrit ici**).
**Arbitrage produit préalable (Bertrand, 2026-08-05, dans la recon §6) :** les visages restent
dans la **DA BD/comics maison** — pas de photo numérisée. On emprunte à la ST **la mise en scène
et la tension**, pas le procédé graphique. Cette spec ne contient donc **aucune** contrainte de
palette/dithering/grain.

**Verdict cahier des charges : [EXTENSION] — consciente, documentée, justifiée.**
Prohibition (Atari ST, 1987) n'avait **pas** de phase portrait-robot. C'est un emprunt explicite à
un autre titre 16-bit, demandé par Bertrand. Justification vis-à-vis de la boucle en §2.0 : la
scène est un beat de **`Récupérer`** (on récupère une **information** au lieu d'une caisse) qui
conditionne le **`Livrer`** suivant. Elle **n'ajoute aucun verbe** à la boucle
`Récupérer → Livrer → Éviter`, qui reste intouchée. Doit être enregistrée en ADR au même standard
qu'ADR-0030 / ADR-0034 (numéro à allouer par `tech-writer`/`producer`).

---

## 0. Cadre de référence (à lire une fois)

Ce que la scène **réutilise** — à ne pas re-dériver :

- La **discipline de machine à phases forward-only** des deux QTE (une phase ne recule jamais,
  hold de résultat, puis `DONE` — la scène ne se rejoue pas), et la constante
  `QTE_RESULT_HOLD 2.2` pour la cohérence inter-scènes.
- La **loi de déterminisme** ADR-0034/§14 : `src/game` est replay-déterministe. **Aucun
  `Math.random`, aucun `Date.now`.** Le tirage des variantes et le choix des leurres sont une
  **fonction pure hachée d'une graine autorisée** (même discipline que `targetSeed`).
- L'**énergie** : continue `[0, 100]`, `ENERGY_INITIAL = 100`, clamp-only, **pas de mort à 0**
  (`energySystem.ts`). C'est la **seule** currency de cette scène (§4.3).
- La convention « **le read est diégétique par défaut**, pas une barre de HUD ».

Ce que la scène **ne réutilise PAS**, volontairement :

- **Le shell de scène figée ADR-0030** (gel du monde, `QTE_ZOOM_SECONDS`, zoom sur le tableau).
  La scène est **interstitielle** : il n'y a pas de monde à geler (§2.1, A2). Seule la discipline
  de phases est empruntée, pas le shell.
- **Les vies.** ADR-0066 (treillis au quart, `snapLives`) ne s'applique pas ici : la scène
  **ne touche jamais `lives`**, quelle que soit l'issue (§4.3, story AC5).
- Le ring qui erre, `ringZoneAt`, la cadence `COVERED ↔ PEEKING`, `blownPeeks`. **Aucune visée,
  aucun tir, aucun réflexe.** C'est le point de la §1.

---

## 1. LA QUESTION OUVERTE, TRANCHÉE EN PREMIER — sélection libre ou bandes qui défilent ?

C'est la décision structurante. Je la pose à découvert, j'argumente les deux, je recommande, et je
dis ce qu'on perd.

### Option A — **Sélection libre** (fidèle à l'original)

Les 4 bandes sont toutes affichées, figées. Le joueur choisit une **zone** (haut/bas), fait
défiler ses **variantes** (gauche/droite) **à son rythme**, revient en arrière autant qu'il veut,
et **valide** quand il est prêt (ou à l'expiration du chrono). Le seul stress est le **chronomètre
global**.

C'est la mécanique **CONFIRMÉE par source primaire** (manuel Amiga officiel, recon §2) :
« left and right … select between the different pieces of face available, whereas up and down …
select which area of the photofit to change ». Aucune source, sur aucune version, ne décrit une
bande qu'on fige au vol.

- **+** Fidèle au modèle revendiqué par Bertrand (« quelque chose qui ressemble à la version ST »).
- **+** **Verbe neuf pour muf.** La scène devient un test d'**observation / comparaison /
  mémoire**. Les deux scènes figées existantes (duel d'otage, boss) sont **déjà** des tests
  d'adresse sous pression temporelle, avec la même grammaire (fenêtre à saisir, cible à toucher).
  Une troisième scène de réflexe serait une **redite mécanique** ; muf n'a en revanche aucune
  scène « regarder et déduire ».
- **+** La difficulté vient de là où la source dit qu'elle vient : la **proximité visuelle des
  variantes** (« minor differences », The Games Machine), pas du chrono. C'est un levier tunable
  proprement (§3), lisible, et qui ne dépend pas de la latence d'entrée.
- **+** **Mobile-compatible sans compromis** (ADR-0015) : un jeu de sélection tolère parfaitement
  60–120 ms de latence tactile, quel que soit le geste retenu par `ux-designer`.
- **−** Moins « nerveux » image par image ; un joueur passif peut rester statique 10 s sans que
  rien ne bouge à l'écran. Il faut fabriquer la tension autrement (§6).

### Option B — **Bandes qui défilent, à figer** (réflexe, façon shooter)

Les 4 bandes défilent en continu (chacune à sa vitesse) ; le joueur appuie pour **figer** celle
qui est active au bon moment. Quatre arrêts réussis = visage recomposé.

- **+** Colle peut-être à ce que Bertrand imaginait en disant « bandes ». Spectaculaire, immédiat,
  ça bouge tout seul à l'écran.
- **+** Réutilise la grammaire d'input existante (un bouton, une fenêtre à saisir), donc coût
  d'implémentation et de tutorial quasi nul.
- **−** **Ce n'est plus un portrait-robot, c'est un bandit manchot.** Le joueur ne compare plus
  deux visages : il attend qu'une image passe et il tape. La ressemblance — le cœur du sujet —
  devient décorative.
- **−** **Infidèle à la source primaire**, sur le seul point mécanique que la recon a CONFIRMÉ.
  On revendique la ST et on prend l'inverse de sa mécanique.
- **−** **Triple emploi** avec le duel d'otage et le boss : troisième scène figée fondée sur
  « saisis la fenêtre ». Le jeu s'aplatit.
- **−** **Injuste sur mobile** si les variantes sont proches : lire une différence fine sur une
  image en mouvement, sur un écran de 6 pouces, avec la latence tactile, n'est plus un test
  d'observation mais un coup de dé. Il faudrait alors éloigner les variantes… et perdre le levier
  de difficulté principal.

### **DÉCISION D1 — On retient l'Option A (sélection libre, fidèle).**

Trois raisons, par ordre de poids : (1) c'est le **seul fait mécanique confirmé** par une source
primaire sur la scène qu'on copie ; (2) elle apporte à muf un **verbe que le jeu n'a pas**, là où
B duplique un verbe qu'il a déjà deux fois ; (3) elle est la seule des deux qui reste **honnête sur
mobile** tout en conservant le levier « variantes proches » que la recon désigne comme la vraie
source de difficulté.

**Ce qu'on perd en choisissant A, explicitement :**

1. **Le mouvement gratuit à l'écran.** Rien ne bouge tant que le joueur ne fait rien. La tension
   doit être **fabriquée** (chrono visible, musique qui décompte, pression du regard du portrait
   cible) — c'est un coût de production son/art réel, §6.
2. **La lecture immédiate de « c'est un jeu d'action ».** Un joueur qui découvre la scène met
   ~2 s à comprendre qu'il ne doit pas tirer. D'où le bandeau d'entrée et le geste tutorial (§7,
   OQ pour `ux-designer`).
3. **Le frisson du « stop » réussi.** Le beat « j'ai figé pile au bon moment » n'existe pas ;
   son remplaçant est la **révélation finale** (§6), qui arrive plus tard et une seule fois.

> **Round 2 — D1 est RATIFIÉE par le gate (A4), et l'option B est CLOSE définitivement.** Motif du
> gate : B contredit la seule mécanique CONFIRMÉE par la source primaire et ferait de la scène la
> troisième épreuve de fenêtre-à-saisir du jeu après le duel d'otage et le boss. Ne pas la
> ré-introduire par la porte de service (un « défilement qu'on peut aussi arrêter et parcourir »
> serait le pire des deux mondes — KISS/YAGNI). Sa réouverture serait une escalade Bertrand, pas
> une décision de lane.

---

## 2. Le contrat de la scène

### 2.0 Place dans la boucle (la justification d'extension)

`Récupérer → Livrer → Éviter` est intouchée. La scène s'insère **entre deux missions** : le courier
sort de la teuf avec un souvenir, et **l'info manquante — qui l'a balancé, qui il ne faut plus
laisser entrer — est ce portrait**. Réussir, c'est transformer un souvenir en **avantage sur la
mission suivante** (le payoff §2.5) ; c'est le pivot exact que la phase joue dans RoboCop
(recon §5 : réussite → dossier du suspect → oriente le niveau suivant).

**Elle n'ajoute aucun verbe.** Elle ne tire pas, ne conduit pas, ne collecte pas. C'est un
`Récupérer` d'information, **hors** du budget 3-5 min d'une mission (A2) — c'est précisément
pourquoi elle ne dilue pas la boucle.

### 2.1 ENTRÉE — **interstitiel post-niveau, hors mission**

| Point                             | Décision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placement                         | **Interstitiel**, dans la chaîne `LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT → (niveau suivant)`. `AppPhase` **dédié** `PORTRAIT_ROBOT`, **pas** un sous-état de `PLAYING`.                                                                                                                                                                                                                                                                                                                                                                                      |
| Fréquence                         | **Une occurrence par RUN** (A3), sur déclencheur narratif — pas une par niveau, pas un gate de niveau.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Le monde                          | **Il n'y a pas de monde.** Aucun gel, aucun ennemi en pause, aucune énergie en écoulement : la mission est terminée. Le shell ADR-0030 (`QTE_ZOOM_SECONDS`, zoom sur le tableau) n'est **pas** réutilisé.                                                                                                                                                                                                                                                                                                                                                              |
| Écran                             | **Plein écran dédié.** Le portrait cible et le portrait en construction sont **comparables sans scroll ni bascule** (la disposition CONFIRMÉE de l'original est cible à gauche / construction à droite ; l'adaptation mobile est la juridiction d'`ux-designer`). Bandeau **`TÊTE À CONNAÎTRE`**.                                                                                                                                                                                                                                                                      |
| Transition d'entrée               | Répliques d'entrée **skippables en un geste** (guidelines §5.3). La **phase interactive n'est pas skippable** : elle a une issue et un coût. Copie : `narrative-designer`.                                                                                                                                                                                                                                                                                                                                                                                             |
| Input pendant l'entrée            | **Neutralisé.** Pas d'équivalent du `QTE_PANIC_SHOT` : on ne punit pas un joueur qui appuie pendant une transition qu'il ne contrôle pas. Le chrono ne démarre qu'à l'entrée en `ACTIVE`.                                                                                                                                                                                                                                                                                                                                                                              |
| Sortie anticipée (ex-« abandon ») | `Escape` / retour Android ⇒ **confirmation légère**, puis la scène **se résout à l'état courant**, exactement comme l'expiration du chrono. Aucun chemin de sortie ne produit un résultat non évalué, et **aucun ne coûte de vie** (il n'y en a pas à coûter). **Depuis B1, c'est le SEUL geste terminal volontaire du joueur** — il ne peut plus valider, il ne peut que s'arrêter. Elle ne peut donc plus être présentée comme un abandon : voir « Désaccords maintenus » 1 et §9. Elle ne peut **jamais** produire `IDENTIFIED` (un 4/4 se serait déjà verrouillé). |

### 2.2 BOUCLE D'INTERACTION (seconde par seconde)

Phase `ACTIVE`. Le chrono tourne (§4).

**État du modèle :** un **index de variante courant** par bande, soit 4 entiers dans `[0, 6[`. Rien
d'autre. Il n'y a **pas** d'état « bande active » dans le modèle de jeu — s'il en existe un, c'est
une notion d'IHM (curseur clavier), pas de mécanique.

> **Périmètre.** Cette section prescrit la **règle**, pas le geste. Les gestes sont tranchés ailleurs
> et rappelés ici comme **faits acquis**, pas comme exigences de cette spec : tactile = **swipe
> horizontal sur la bande visée** (gate A4-bis) ; desktop = **option B, drag horizontal à la souris
> sur la bande visée** (gate B3) — même modèle mental, un seul geste à documenter pour les deux
> classes d'appareil ; socle clavier ↑↓ bande / ←→ variante. Le détail (seuils, cibles a11y,
> affordances) est la juridiction d'`ux-designer`. Ce que cette spec impose à tout mapping, c'est la
> conformité aux règles R1-R5 ci-dessous.

**Règles d'interaction (normatives, indépendantes du geste) :**

- **R1 — Adressage direct.** Le joueur doit pouvoir faire passer **la bande _i_ à la variante _j_**
  sans effet de bord sur les trois autres bandes. Les 4 bandes sont **indépendantes**.
- **R2 — Ordre libre et réversible, sauf au point fixe.** N'importe quelle bande, dans n'importe
  quel ordre, autant de fois qu'on veut, sans limite d'essais (**B2**). Revenir sur une bande déjà
  changée est toujours possible (recon §3, PROBABLE, corroboré par « don't spend too long on one
  feature »). Aucune bande ne se verrouille individuellement (§4.3 · le verrouillage **indicatif**
  de bande reste coupé, gate A8). **Une seule exception, et elle est structurelle depuis B1 :
  l'état 4/4 est absorbant** — on ne peut pas le traverser, on y termine (R5). Il n'existe donc pas
  de « retour en arrière depuis la bonne réponse ».
- **R3 — Cycle bouclé.** Le parcours des variantes d'une bande est **cyclique** dans les deux sens :
  après la 6ᵉ on revient à la 1ʳᵉ. Pas de cul-de-sac, pas de butée.
- **R4 — Changement instantané.** Un pas de variante s'applique en < 1 frame de latence logique,
  avec un `snap` sonore court. Un pas = **exactement une** variante (pas de saut, pas d'inertie
  qui dépasse) : la prévisibilité sous chrono prime. Un drag/swipe continu ne s'arrête **jamais**
  entre deux crans.
- **R5 — Aucun acte de validation. La fin est produite, pas déclarée.** Il n'existe plus de CTA, ni
  de touche, ni de geste de soumission (**B1**). Deux fins seulement, de natures différentes :
  1. **Verrouillage automatique** — dès que l'état courant des 4 bandes est **4/4**, la phase se
     termine sur-le-champ et la révélation part. Le joueur ne décide pas de la fin ; il la **cause**.
  2. **Fin subie** — expiration du chrono, ou sortie anticipée confirmée (§2.1) : l'**état courant**
     est évalué tel quel (`PARTIAL` ou `FAILED`, jamais `IDENTIFIED`).

**Conséquence normative de R5 — le verrouillage est évalué sur ENTRÉE, pas sur tick.** Le test 4/4
se fait **à chaque changement d'index de bande**, avant tout tick de chrono ; le test d'expiration
ne s'évalue **que si aucun verrouillage n'a eu lieu**. Un 4/4 posé dans la même frame que
l'expiration ⇒ **`IDENTIFIED` gagne**. Le joueur a produit la combinaison, la scène ne peut pas la
lui refuser sur un départage de frame — c'est le même garde-fou anti-« mort bullshit » qu'en §4.3.
**Cet ordre est une propriété du réducteur, pas de l'ordre d'arrivée des events du navigateur**
(ADR-0034) : deux replays du même `portraitSeed` et de la même trace d'entrées donnent la même
issue, quel que soit le navigateur. Vérifié en test pur (AC7).

**Aucune règle ci-dessus ne présuppose une soumission** — relu ligne à ligne : R1/R3/R4 sont des
règles d'adressage et de pas, R2 pose la liberté d'essais que B2 rend illimitée, R5 est la seule
règle terminale et elle est passive côté joueur.

**Déroulé type :**

| t                      | Ce que le joueur voit / fait                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0,0 s                  | Les 4 bandes du portrait en construction sont **pré-remplies sur une variante FAUSSE — les quatre** (`initialStateAllWrong`, §4.1). L'état de départ est donc **0/4 garanti** : il faut au minimum **4 gestes délibérés** avant qu'un verrouillage soit possible. Le portrait cible est **visible en permanence jusqu'à la fin** (jamais masqué : test d'observation, pas de mémoire). |
| 0–2 s                  | Lecture. Le joueur compare une bande à la même zone du cible.                                                                                                                                                                                                                                                                                                                          |
| ~2 s →                 | Il fait défiler les variantes de la bande qu'il regarde (R1/R3/R4), passe à une autre, revient (R2), autant de fois qu'il veut. Le compteur `{n} sur {total}` lui dit s'il a tout vu. La jauge de télécarte se vide en continu.                                                                                                                                                        |
| **à l'instant du 4/4** | **La scène se verrouille d'elle-même** (R5) : le geste qui pose la 4ᵉ bonne bande **est** la fin. Pas de bouton, pas de confirmation, pas de délai de grâce. Le rôle du bouton feu, INCERTAIN dans l'original (recon §3), devient **sans objet** : il n'y a pas de bouton feu dans cette scène.                                                                                        |
| à tout moment          | Sortie anticipée confirmée (§2.1) — évaluée à l'état courant, `PARTIAL` ou `FAILED`. C'est le seul geste terminal volontaire restant.                                                                                                                                                                                                                                                  |
| chrono → 0             | **Chemin normal de `PARTIAL`/`FAILED`** (et non plus une variante) : l'état courant est jugé tel quel (§4.2). On ne « perd » pas sans être évalué. C'est plus juste que l'échec sec de l'original et ça ne coûte rien en lisibilité.                                                                                                                                                   |

**Aucun feedback par trait pendant la phase. Un seul signal, global et terminal : le verrouillage
lui-même** — voir §5.

### 2.3 SORTIE

Machine à phases forward-only, comme les QTE :
`ENTERING → ACTIVE → RESOLVING → (IDENTIFIED | PARTIAL | FAILED) → DONE`.

| Issue        | Moment d'évaluation                           | Condition                      | Effet                                                                               |
| ------------ | --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `IDENTIFIED` | **En cours de phase**, sur événement d'entrée | l'état courant devient **4/4** | Verrouillage immédiat. Réussite pleine, §4.                                         |
| `PARTIAL`    | **Au buzzer** (ou sortie anticipée)           | état courant = **3/4**         | Réussite dégradée : l'info tombe, incomplète. §4. **N'est plus soumettable** (R11). |
| `FAILED`     | **Au buzzer** (ou sortie anticipée)           | état courant **≤ 2/4**         | Échec. §4 sanction.                                                                 |

**Il n'existe plus d'issue produite par un acte du joueur autre que le 4/4 lui-même.** Corollaire
vérifiable : `IDENTIFIED` **ne peut jamais** sortir d'une évaluation au buzzer — si l'état était
4/4, il se serait déjà verrouillé (AC7).

`RESOLVING` = la **révélation** (§5/§6), de durée **conditionnelle à l'issue** (gate A15) :
**1,4 s** à `IDENTIFIED`, **2,6 s** à `PARTIAL`/`FAILED`. Puis `resultHoldSeconds 2,2 s` dans tous
les cas, puis `DONE`, puis enchaînement sur le niveau suivant. Budget total de la scène :
35 + 1,4 + 2,2 = **38,6 s** à `IDENTIFIED`, 35 + 2,6 + 2,2 = **39,8 s** ailleurs. La scène ne se
rejoue jamais dans le même run (A3).

### 2.4 CE QUE LA SCÈNE REND AU RESTE DU JEU

Elle expose un résultat **et rien d'autre** — aucune mutation directe depuis la scène :

1. `outcome: IDENTIFIED | PARTIAL | FAILED` et `correctCount: 0..4` (le détail par bande sert la
   révélation, pas la suite).
2. Un **delta d'énergie appliqué au capital INITIAL du niveau suivant** (`energyDelta`, règle A1c),
   jamais à l'énergie du niveau écoulé — qui est fini. Clamp `[0, 100]` inchangé.
3. Un **delta de score** (`scoreDelta`).
4. Un **retard de première vague** pour le niveau suivant (`waveDelaySeconds`) — le payoff §2.5.
5. Un **flag narratif** consommé par le niveau suivant (`suspectIdentified`), qui pilote les deux
   rappels obligatoires de §2.5. **Contenu : `narrative-designer`.**

**Elle ne touche JAMAIS `lives`.** Aucune issue, aucun chemin de sortie, aucun timeout ne retire de
vie, entière ou fractionnaire (story AC5, gate A1). Ce n'est pas un plafond ni un plancher : le
champ n'existe pas dans son contrat de sortie.

**Ce qu'elle ne fait PAS en V1 :** elle ne modifie pas le quota d'ennemis, ne débloque pas d'arme,
ne change pas la géométrie du niveau, ne bloque pas la complétion. **Elle n'est pas un gate**
(contrairement au boss). Le **seul** levier mécanique qu'elle actionne sur la suite est le
`waveDelaySeconds` de §2.5.

### 2.5 LE PAYOFF — ce que le portrait change au niveau suivant (obligatoire)

C'est la **condition d'existence de la feature** (gate A10/A11, critère de sortie `pm`) : une
interlude sans conséquence est du remplissage par définition. Le payoff est donc **une partie de la
mécanique**, pas une note d'intention. Il a deux moitiés, toutes deux requises.

**1. Le rappel narratif, joué au pré-niveau suivant.** Obligatoire, pas décoratif :

- `IDENTIFIED` — la tête est en page 23, et la porte le refuse.
- `PARTIAL` — l'info tombe, incomplète.
- `FAILED` — un habitué se fait refuser à sa propre porte, et « l'autre est entré ». C'est le
  **coût social** de l'échec, et le garde-fou moral : à l'échec, **c'est le réseau qui se blesse
  lui-même**, jamais un jeu de flic qui gagne. Copie : `narrative-designer`.

**2. L'effet mécanique — un seul levier, un seul niveau, aucune persistance au-delà :**

| Issue        | `waveDelaySeconds`                                                                 |
| ------------ | ---------------------------------------------------------------------------------- |
| `IDENTIFIED` | **+20 s** de retard sur la **première vague de pression RG/BAC** du niveau suivant |
| `PARTIAL`    | **+10 s**                                                                          |
| `FAILED`     | **0 s** (plus le −20 d'énergie initiale, §4.3)                                     |

**Rationale de la valeur (je reprends celle du gate, argumentée).** +20 s est le plus petit effet
qui se **sente** sans ouvrir un système : sur une mission de 3-5 min, c'est 7 à 11 % du temps joué
rendu au joueur **au moment où il en a le plus besoin** — le démarrage, quand il n'a encore ni
position ni marge. Ça ne touche ni le quota, ni les armes, ni la géométrie, ça ne gate aucune
complétion, et ça traduit littéralement la fiction : le renseignement adverse a perdu un œil pour
un moment. Le barreau `PARTIAL = +10 s` maintient la proportion du barème (`PARTIAL` vaut la
moitié partout : score 400 vs 1500 est plus dur, le retard est linéaire — c'est voulu, le
presque-juste doit être **lisible**, faiblement récompensé, jamais indolore).

**Vérification au playtest (AC12) :** la question posée au stage 5 n'est pas « est-ce que ça
marche » mais **« est-ce que le payoff se sent »**. S'il ne se sent pas, la feature échoue son
propre gate de justification et se coupe — pas de « on l'ajoutera plus tard » (A11).

---

## 3. La difficulté par la RESSEMBLANCE (le vrai levier)

La recon est catégorique : la difficulté vient de la **proximité visuelle des variantes**, pas du
chrono. Tout le tuning de difficulté passe donc par la **construction du jeu de leurres**. Encore
faut-il que ce ne soit pas du pixel-peeping injuste.

### D2 — Règle de distance visuelle : **UN TRAIT NOMMÉ**

**Règle (normative, opposable au gate art) :** dans une bande, la bonne variante et chacun de ses
leurres **partagent la silhouette** (même classe de forme, même encombrement, même épaisseur de
trait) et **diffèrent par exactement UN descripteur NOMMÉ**, pris dans une liste finie propre à la
zone.

Le test de recevabilité d'un leurre est **verbal** : si `lead-art` ne peut pas énoncer la
différence en **une phrase courte sans coordonnées de pixels**, le leurre est **rejeté**.

> **Vocabulaire (A6).** Les noms `cheveux / yeux / nez / bouche` ci-dessous sont des **noms
> internes de zone** (code, données, ADR). En surface joueur, les libellés canoniques sont
> **`LA COUPE` / `LE REGARD` / `LE NEZ` / `LA BOUCHE`** (repli sans article). Aucun des noms
> internes n'atteint l'écran.
>
> **Liste fermée.** Les descripteurs admis ci-dessous sont une **liste close** : toute addition
> repasse par le design gate. Règle opposable au gate art : **aucun descripteur discriminant ne
> peut être lu comme un marqueur d'origine, de classe ou de « sale gueule »**. Et la distinction
> qui tient la scène hors du registre policier : les **textes** décrivent du **comportemental**
> (« il regardait pas les gens, il les comptait ») ; seuls les **dessins** portent des différences
> morphologiques, parce que c'est le medium.

| Bande (nom interne) | Classe de silhouette (partagée par la famille) | Descripteurs discriminants admis (1 seul par leurre)                                                      |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Cheveux**         | volume global + implantation                   | raie (gauche/droite/aucune) · longueur des mèches · dégradé des tempes · frange (oui/non)                 |
| **Yeux**            | écart interoculaire + inclinaison              | épaisseur des sourcils · paupière tombante · cernes · écart des sourcils                                  |
| **Nez**             | longueur + largeur d'arête                     | forme des narines · bosse d'arête · pointe (retroussée/droite/tombante)                                   |
| **Bouche**          | largeur + épaisseur des lèvres                 | commissures (relevées/tombantes/neutres) · lèvre supérieure fine/pleine · pli nasogénien · dents visibles |

**Corollaires anti-injustice (chacun opposable en revue) :**

- **A1 — Une seule différence à la fois.** Un leurre ne cumule jamais deux descripteurs. Ce qui
  sépare la bonne réponse d'un leurre est toujours nommable **au singulier**.
- **A2 — Plancher de lisibilité.** Toute différence doit rester lisible **à la taille d'affichage
  mobile la plus petite** de la scène (`ux-designer` fixe cette taille ; le plancher, lui, est
  une règle de design : un descripteur invisible sur téléphone n'est pas un descripteur). Vérifié
  au **composite gate**, sur device réel, pas sur maquette desktop.
- **A3 — Pas de piège de rendu.** Aucune différence ne repose sur la couleur seule, l'anti-aliasing,
  le bruit de trame, une ombre ou un pixel isolé. Trait dessiné uniquement (accessibilité
  daltonisme incluse — la DA fanzine N&B aide ici).
- **A4 — La bonne réponse ne se déduit pas du contexte.** Les 4 zones sont **indépendantes** : une
  bande juste n'indique rien sur les autres. Pas de cohérence anatomique exploitable comme
  raccourci.
- **A5 — `initialStateAllWrong`. Les QUATRE bandes démarrent sur une variante fausse.** Renforcé au
  round 3 (R12) : ce n'était qu'« la bonne variante n'est jamais l'index de départ » bande par
  bande ; c'est désormais un invariant **du set**, `correctCount(état initial) === 0`, opposable au
  seed. Motif : sans CTA, la garde temporelle `confirmGuardSeconds` n'a plus d'objet, et le risque
  qu'elle couvrait de fait — **une issue produite sans geste** — devient un risque de _seed_, pas de
  _doigt_. L'invariant garantit **≥ 4 gestes délibérés** avant tout verrouillage, ce que la garde
  d'une seconde ne garantissait même pas. C'est un durcissement, pas un report.
- **A6 — Position aléatoire mais déterministe.** L'index de la bonne variante dans le cycle est
  une fonction pure hachée de la graine du niveau et de l'index de bande. Pas de « c'est toujours
  la 3e ».

### D3 — Composition du set de leurres, V1 (occurrence unique)

La difficulté vient de la **distance entre variantes**, pas de leur nombre ni du chrono — c'est la
thèse de la recon, la mienne, et celle de `lead-art` (« graduer par la classe de variation plutôt
que par le nombre »). Les trois classes de leurre sont définies par `lead-art` sur la grille
ci-dessus : **classe 1** (forme) et **classe 3** (proportion) = distance **forte**, classe 2 =
**moyenne**, **classe 4** (détail de trait) = très proche.

**Composition canonique V1, une seule occurrence par run (A5) :**

| Variantes / bande | Composition du set                                                                             | Chrono | Effet visé                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| **6**             | 1 bonne + **2 leurres de classe forte** (1 et 3) + **3 de classe moyenne** + **0 de classe 4** | 35 s   | On apprend la grammaire en la jouant. L'élimination franche est possible ; le doute final se joue sur la classe moyenne. |

**Plafond dur : 6 variantes par bande, 1 seul gabarit de visage** (soit 24 assets de bande — le
budget chiffré par `lead-art`, §5.1 de son brief). Aucun leurre de classe 4 en V1.

**Vérification du budget d'input (AC11) :** 6 × 4 = 20 pressions au pire pour tout balayer une
fois ; à ~0,25 s par pression, ~5 s, soit **14 % des 35 s**. Confortable. Au-delà de 6, le
défilement lui-même mangerait le chrono et la difficulté deviendrait de la **charge d'input**, pas
de l'observation — ce qui trahirait D2.

> **Note post-V1 (hors spec, non implémentable en l'état) — barème de progression multi-occurrences.**
> Rendu caduc par A3 : **une seule occurrence par run**, donc rien à cadencer. Conservé ici comme
> point de départ **si et seulement si** une occurrence #2 est un jour ouverte par `pm` — auquel cas
> il repasse par le design gate avec un budget art réévalué (le plafond de 6 variantes est une
> contrainte de production, pas une préférence de design) :
>
> | Occurrence | Composition envisagée                                         |
> | ---------- | ------------------------------------------------------------- |
> | #2         | resserrer vers 1 bonne + 1 forte + 4 moyennes + 1 classe 4    |
> | #3+        | 1 bonne + 4 moyennes + 2 classe 4, chrono éventuellement 32 s |
>
> Rien de ceci n'est spécifié pour V1. Un dev qui lit cette note ne l'implémente pas.

---

## 4. Table de tuning (le livrable)

Toutes les valeurs ci-dessous sont **strictement celles de la §3 du design gate**, qui fait foi.
La colonne « Plage » a été retirée là où le gate a figé la valeur : une plage sur une valeur
canonique serait une porte de sortie déguisée.

### 4.1 Cadre de la scène

| Clé                         | Valeur canonique                                                                                                | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stripCount`                | **4** — figé (`LA COUPE`, `LE REGARD`, `LE NEZ`, `LA BOUCHE`)                                                   | **Demande de Bertrand.** L'original en a 5–6 (PROBABLE) ; 4 est un resserrage KISS assumé — les 4 zones les plus lisibles en BD, et celles qui tiennent à l'écran sur mobile. Menton/oreilles écartés : les moins discriminants et les plus coûteux à décliner.                                                                                                                                                                                                                                                                                                                  |
| `variantsPerStrip`          | **6** — **plafond dur 6**                                                                                       | 6 : assez pour que l'élimination coûte un effort, assez peu pour un balayage complet en ~5 s (§3 D3). < 5 = trivial. Le plafond à 6 est le **budget de production chiffré par `lead-art`** (24 assets, 1 gabarit), pas une préférence : A3 ayant supprimé les occurrences #2/#3, la seule justification d'un passage à 8 est tombée avec.                                                                                                                                                                                                                                        |
| `faceTemplates`             | **1** gabarit ⇒ 24 assets de bande                                                                              | Budget `lead-art` §5.1. Atomicité du gabarit demandée côté art.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `occurrences`               | **1 par RUN**, sur déclencheur narratif                                                                         | A3 / `pm`. Pas une par niveau.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `timerSeconds`              | **35 s** · `easy` **56 s** · `hard` **30 s**                                                                    | 35 s = milieu exact de la fourchette CONFIRMÉE (ACE 40 s / C&VG 30 s, recon §4). Budget : ~5 s de balayage + ~22 s de comparaison + ~8 s de marge. Le chrono **n'est pas** le levier de difficulté (§3). La modulation passe par `Prefs.difficulty`, qui **existe déjà** — on la câble au lieu d'inventer un mode. `easy` sort de la fourchette historique : assumé, l'accessibilité prime sur la fidélité sur une tâche de comparaison fine.                                                                                                                                    |
| Écoulement du chrono        | **Continu.** Aucune discrétisation, aucun compte d'essais, aucun plafond de crans                               | **B2** : « autant d'essais que l'on veut, mais dans un temps imparti ». L'unité de 2,5 s et les 14 unités sont **supprimées** (elles ne survivaient d'ailleurs pas à `Prefs.difficulty` : 56 s = 22,4 unités, 30 s = 12 — la conversion était incompatible avec l'échappatoire d'accessibilité qui la côtoyait dans la même table).                                                                                                                                                                                                                                              |
| Affichage du chrono         | **Jauge continue qui se vide, SANS nombre** — ni unités, ni secondes                                            | La télécarte survit comme **objet**, pas comme compteur : c'est la carte qui se vide. « temps restant » reste interdit (A6), et un nombre serait exactement ce mot avec une autre police. Bénéfice de design : une jauge se lit **en périphérie**, sans quitter des yeux la comparaison — c'est ce que la scène demande.                                                                                                                                                                                                                                                         |
| Paliers de tension          | **Mi-parcours : 50 % de `timerSeconds` écoulés** · **Urgence : 10,0 s restants** · **Dernier : 5,0 s restants** | Règle **mixte, assumée** — voir D5 ci-dessous pour le rationale complet et le trou trouvé en `hard`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Chrono sous `RotateOverlay` | **PAUSE**                                                                                                       | Le joueur ne peut pas jouer derrière l'overlay ; laisser tourner serait une perte non imputable au joueur.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `revealSeconds`             | **1,4 s** à `IDENTIFIED` · **2,6 s** à `PARTIAL`/`FAILED`                                                       | **Conditionnelle à l'issue (R15).** À `PARTIAL`/`FAILED` la reptation trait-par-trait (4 verdicts à ~0,45 s + 0,8 s de tenue) **porte une information** : il reste 1 à 4 bandes à corriger sous les yeux du joueur, c'est le beat payant et la « raison affichée » exigée par la non-négociable §5 règle 4. À `IDENTIFIED` cette information est **nulle** — quatre tampons « juste » qui défilent pour annoncer ce que le verrouillage vient d'annoncer, soit du temps mort sur le meilleur moment du jeu : flash de verrouillage + **4 tampons simultanés**, pas de reptation. |
| `resultHoldSeconds`         | **2,2 s**, toutes issues                                                                                        | Aligné sur `QTE_RESULT_HOLD`. C'est le temps de lire le tampon et la ligne KENZA : il ne dépend pas de l'issue. Cohérence inter-scènes.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ~~`confirmGuardSeconds`~~   | **SUPPRIMÉE**                                                                                                   | Elle existait pour **une seule raison** : désarmer un CTA pendant la première seconde. Le CTA disparaît (B1), la raison disparaît — **la valeur saute, elle ne se transforme pas.** Un délai de grâce sur l'auto-verrouillage serait absurde (il retarderait une bonne réponse) ; un délai avant d'accepter les entrées serait une perte de temps non imputable au joueur. Remplacée par ↓.                                                                                                                                                                                      |
| `initialStateAllWrong`      | **`true`** — les 4 bandes démarrent fausses, `correctCount(initial) === 0`                                      | Remplace `confirmGuardSeconds` (R12, §3 A5). Garantit ≥ 4 gestes délibérés avant tout verrouillage et ferme le fantôme « le seed produit un 4/4 à l'entrée en `ACTIVE` ». Invariant asserté en code contre les données autorisées, jamais présumé (discipline ADR-0035), vérifiable par test pur sur `portraitSeed`.                                                                                                                                                                                                                                                             |

### D5 — Les paliers de tension, refaits en secondes (et pas convertis mécaniquement)

Les paliers étaient exprimés en unités de télécarte (7 / 4 / 2). B2 supprime l'unité : il faut les
**re-poser**, pas les diviser par 0,4. Deux natures de palier coexistent, et c'est ce qui décide de
leur règle :

- **Le mi-parcours est un palier de RYTHME.** Il dit « tu es à la moitié », il structure la scène en
  deux temps. Sa place correcte dépend donc de la **durée de la scène** ⇒ **proportionnel**.
- **L'urgence et le dernier palier sont des paliers de PANIQUE.** Ce qui les rend efficaces, c'est
  qu'il reste peu de temps **en secondes réelles** — le joueur n'estime pas des pourcentages, il
  estime « ai-je le temps de corriger une bande de plus ? ». En `easy`, une urgence proportionnelle
  tomberait à 16 s restants : largement de quoi tout corriger, donc une **fausse alarme**, et une
  fausse alarme apprend au joueur à ignorer la musique. ⇒ **absolus, identiques partout**.

**Trou trouvé en recalculant (il n'existait pas dans la table du gate) :** un mi-parcours strictement
à 50 % tombe à **15,0 s restants en `hard`**, soit **5,0 s** avant l'urgence. Trois cues dans les
15 dernières secondes, dont deux collés : ils ne se perçoivent plus comme deux paliers, ils
fusionnent en une rampe — exactement ce que le choix « paliers, pas crescendo » (§6) cherche à
éviter. **Correctif proposé, une seule constante, aucune branche conditionnelle :**

> **Le palier de mi-parcours se déclenche à `max(timerSeconds / 2 ; 17,0)` secondes restantes.**

Le plancher de 17,0 s = 10,0 s (urgence) + **7,0 s de distance minimale**. Pourquoi 7,0 s : c'est le
temps de **corriger réellement une bande** (balayage des 6 variantes ≈ 1,5 s à 0,25 s/pas, plus la
comparaison), donc le palier de mi-parcours reste **actionnable** au lieu d'être un constat. En deçà
de ~5 s, deux cues audio se lisent comme un seul événement (même argument qu'au §6 : un palier se
perçoit, une rampe s'ignore).

| Palier      | Déclencheur                             | `easy` (56 s)     | `normal` (35 s)   | `hard` (30 s)               | Ce qui se passe                                               |
| ----------- | --------------------------------------- | ----------------- | ----------------- | --------------------------- | ------------------------------------------------------------- |
| Mi-parcours | `max(timerSeconds/2 ; 17,0)` s restants | **28,0 s** (50 %) | **17,5 s** (50 %) | **17,0 s** (plancher, 43 %) | `KENZA — « Ma carte descend. »` — **copie seule, pas de son** |
| Urgence     | **10,0 s restants** (absolu)            | 10,0 s            | 10,0 s            | 10,0 s                      | copie KENZA + **1ᵉʳ resserrement musical**                    |
| Dernier     | **5,0 s restants** (absolu)             | 5,0 s             | 5,0 s             | 5,0 s                       | **`bip`** + 2ᵉ resserrement + annonce `aria-live`             |

Écarts obtenus, mi-parcours → urgence : **18,0 s** (`easy`) · **7,5 s** (`normal`) · **7,0 s**
(`hard`). Plus aucun palier collé.

**Trois bénéfices, et je les nomme parce qu'ils sont la raison du choix :** (1) la table
audio/`aria-live` des **deux paliers critiques est identique dans les trois difficultés** — un seul
jeu de cues à produire pour `sound-designer`, une seule règle a11y pour `ux-designer` ; (2) le
palier d'urgence garde le même **sens** quelle que soit la difficulté (« il te reste dix
secondes »), au lieu de vouloir dire trois choses ; (3) `easy` reste une échappatoire
d'accessibilité, pas un mode « moins tendu à la fin » — la fin d'une scène `easy` doit piquer autant,
c'est la marge de **travail** qu'on allonge, pas la marge de panique.

> **Statut de D5 :** le plancher `17,0 s` est un **ajout au canon §3 du gate** (qui dit
> « 50 % de `timerSeconds` », sans plancher). Il ne change ni `timerSeconds`, ni les deux paliers
> absolus, ni aucune valeur d'issue — il ne déplace qu'un palier de copie, et seulement en `hard`
> (15,0 → 17,0 s restants). **`lead-game-designer` tranche** ; s'il refuse, la table du gate
> s'applique telle quelle et le défaut de `hard` est acté comme connu.

_Il n'y a plus d'`enterSeconds` :_ la transition de 2,0 s reposait sur `QTE_ZOOM_SECONDS` et le gel
du monde, tous deux supprimés par A2. Le rythme d'entrée est porté par les répliques skippables
(§2.1) ; sa durée appartient à `ux-designer` / `narrative-designer`.

### 4.2 Tolérance et issues

| Clé                                      | Valeur canonique                                                                                                                                                                  | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifiedThreshold`                    | **4/4 — évalué EN CONTINU, verrouillage automatique et immédiat**                                                                                                                 | Un portrait-robot **juste** est juste. Baisser le seuil plein à 3/4 viderait de son sens la révélation (« c'est presque lui » n'identifie personne). Depuis B1, le seuil n'est plus un barème appliqué à une soumission : c'est une **condition de terminaison** testée à chaque changement d'index (R5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Ordre de résolution (anti-issue-fantôme) | Test 4/4 **sur événement d'entrée**, avant tout tick ; expiration évaluée **uniquement si aucun verrouillage n'a eu lieu** ; à égalité dans la même frame, **`IDENTIFIED` gagne** | Sans règle d'ordre, le 4/4 posé pile au buzzer ouvre deux évaluations concurrentes et l'issue dépend de l'ordonnancement des events du navigateur. Le joueur a produit la combinaison : on ne la lui refuse pas sur un départage de frame. **Propriété du réducteur**, pas de l'ordre d'arrivée des events (ADR-0034).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `partialThreshold`                       | **3/4 — atteignable UNIQUEMENT au buzzer ou en sortie anticipée**                                                                                                                 | **Il n'existe plus d'acte de soumission** (B1), donc plus de 3/4 volontaire. Le palier devient **subi**, et il en sort **plus honnête** : le joueur ne peut plus « se contenter » d'un 3/4 pour empocher 400 points, il ne peut que **ne pas avoir fini**. `PARTIAL` est ainsi strictement **moins farmable** qu'au round 2, à barème inchangé. Le motif d'origine tient mot pour mot : **On ne joue pas en tout-ou-rien.** 3/4 après 35 s de comparaison honnête mérite un retour ; le tout-ou-rien sur une scène d'observation produit de la frustration sourde. Ratifié au gate (A9) : sans ce palier, un joueur à 3/4 subit le même verdict qu'un joueur à 0/4, ce qui contredit frontalement la non-négociable §5 règle 4 (« chaque échec, raison affichée »). Le presque-juste doit être **lisible, faiblement récompensé, jamais indolore**. |
| `failedThreshold`                        | **≤ 2/4** au buzzer ou en sortie anticipée                                                                                                                                        | Deux bandes justes sur 4 avec 6 variantes, c'est au niveau du bruit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Timeout / sortie anticipée               | **évalué normalement** à l'état courant, pas d'échec sec · **ne peut JAMAIS produire `IDENTIFIED`**                                                                               | **Divergence assumée avec l'original** (où l'expiration = −1 vie, CONFIRMÉ, recon §4). On supprime la double peine « le chrono expire ⇒ tout ce que tu as trouvé est annulé ». Un joueur à 3/4 au buzzer a **réellement** fait 3/4. La sortie anticipée confirmée (§2.1) suit exactement la même route. Depuis B1 ce n'est plus une variante mais **le chemin normal** de `PARTIAL`/`FAILED` : un 4/4 se serait verrouillé avant.                                                                                                                                                                                                                                                                                                                                                                                                                   |

### 4.3 Coût de l'échec, récompense

**La currency est l'énergie, et rien d'autre.** L'original coûtait **−1 vie** (CONFIRMÉ), et j'avais
transposé cela en −0,5 cœur au round 1 : **coupé** (gate A1). Motif que je fais mien : faire perdre
de la santé physique sur un écran où l'on ne peut ni esquiver ni tirer est exactement la « mort
bullshit » que les garde-fous G4/G5 des QTE existent pour interdire — et la story `pm` (AC5) avait
déjà tranché « no life is subtracted directly » avant le design loop.

**Règle A1c — le destin de l'énergie entre deux niveaux (règle neuve, posée au gate).** La scène
étant interstitielle, une sanction appliquée « tout de suite » ne coûterait rien (le niveau est
fini) et un bonus serait mangé par le clamp à 100. Donc : **une issue de scène interstitielle
modifie le capital d'énergie INITIAL du niveau suivant** (`ENERGY_INITIAL` local), jamais l'énergie
du niveau écoulé. **Corollaire direct : il n'y a pas de récompense en énergie** — mon `+25` à
`IDENTIFIED` et `+5` à `PARTIAL` ne sont pas refusés, ils sont **inopérants**. La récompense est
donc **score + payoff**.

| Issue              | Vies             | Énergie (capital initial du niveau **suivant**) | Score           | Payoff (§2.5) | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ---------------- | ----------------------------------------------- | --------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IDENTIFIED` (4/4) | **0 — interdit** | **0**                                           | **+1500**       | **+20 s**     | La récompense est le retard de vague et le score. L'énergie serait clampée : la donner serait mentir au joueur.                                                                                                                                                                                                                                                                                                                                                                           |
| `PARTIAL` (3/4)    | **0 — interdit** | **0**                                           | **+400**        | **+10 s**     | Un jeton de consolation, pas une récompense. On **ne perd rien** : avoir 3 traits justes n'est pas une faute.                                                                                                                                                                                                                                                                                                                                                                             |
| `FAILED` (≤ 2/4)   | **0 — interdit** | **−20**                                         | **0**           | **0 s**       | **La sanction canonique.** Le niveau suivant démarre à 80 au lieu de 100 : le joueur commence sa mission avec moins de marge, sans qu'aucun coup ne lui ait été porté sur un écran où il ne peut pas se défendre. Ça pique, c'est visible dès la première seconde de la mission suivante, et ça ne brise aucun run. **Plus le beat narratif obligatoire** (§2.5) : un échec qui ne produit qu'un chiffre serait un échec sans beat, un échec qui ne produit qu'un beat serait sans enjeu. |
| Bonus de temps     | —                | —                                               | **aucun en V1** | —             | **Pas de bonus de vitesse.** Un bonus au temps restant pousserait à valider vite au lieu de comparer bien : il combat directement le verbe de la scène (D1). Explicitement HORS spec (§7).                                                                                                                                                                                                                                                                                                |

**Invariant de sécurité — la scène ne peut pas TUER, et c'est désormais trivialement vrai.**
Elle ne touche pas `lives` (le champ n'est pas dans son contrat de sortie, §2.4), et l'énergie n'a
pas de mort à 0. Il n'y a donc **aucun plancher à calculer, aucune sanction à plafonner** : l'ancien
mécanisme « plafonner à 0,25 cœur » disparaît avec la perte de vie. À asserter en test comme une
**absence** : aucune issue ne produit de `livesDelta`.

**Validation partielle — comportement (question explicite du brief) :** il n'existe **pas** de
validation par bande. On ne « verrouille » pas une bande à la main. Depuis B1 il n'existe même plus
de validation **du tout** : la seule terminaison volontaire est le 4/4 lui-même, et elle est
**globale, automatique et terminale** (R5, §2.2). Rationale KISS, inchangée : un verrouillage par
bande créerait un état supplémentaire (verrouillé/libre), un risque de blocage (verrouiller une
erreur sans recours), et il faudrait alors trancher s'il donne un feedback — ce que §5 refuse.
**À ne pas confondre :** le verrouillage **automatique** de R5 (global, terminal, sans information)
n'a rien à voir avec le verrouillage **indicatif de bande** proposé côté UX, qui reste **coupé**
(gate A8) et le reste. Le gate a coupé le verrouillage indicatif proposé côté UX pour la même raison,
en ajoutant l'argument qui manquait : les 4 bandes étant **toutes visibles simultanément**, il n'y
a rien à mémoriser. **La « validation partielle » de muf, c'est le palier `PARTIAL` à 3/4, pas un
verrou.**

### 4.4 Constantes système vs données autorisées (recommandation à `senior-architect`)

- **Autorisé (données de run/niveau)** : le déclencheur narratif, la **graine** (`portraitSeed`,
  entier fini, **seule** source du tirage — déterminisme), et l'identifiant du jeu de visages.
  _Plus de « palier de difficulté » autorisé_ : avec une occurrence unique (A3) et une composition
  de leurres figée (§3 D3), il n'y a pas de palier à choisir.
- **Constantes système** (Belliard-first, promues plus tard si une courbe le demande) :
  `timerSeconds` et ses facteurs `Prefs.difficulty`, les **deux** `revealSeconds` (1,4 / 2,6 —
  asymétrie assumée, R15), `resultHoldSeconds`, les trois seuils de palier de tension (dont le
  plancher 17,0 s de D5), `variantsPerStrip`, les seuils 4/4-3/4, et tous les deltas
  énergie/score/`waveDelaySeconds`. Même couture de promotion additive qu'ADR-0034/0035.
- **Contrat de sortie attendu par `senior-architect` :**
  `outcome · correctCount · energyDelta (appliqué au niveau+1) · scoreDelta · waveDelaySeconds`.
  **Pas de `livesDelta`** — son absence est l'invariant.

---

## 5. Feedback — position tranchée

**Constat source :** l'original ne donne **aucun feedback par trait** (recon §3, PROBABLE) ;
l'évaluation est globale, en fin de phase.

**Est-ce tenable en 2026, sur mobile ? Oui pendant la phase. Non après.**

### D4 — **Aucun feedback PAR TRAIT pendant `ACTIVE`. Un seul signal, global et terminal. Verdict trait par trait à la révélation.**

> **Reformulé au round 3 (R17).** « Zéro feedback, sous toute forme » est devenu **factuellement
> faux** avec B1 : le verrouillage automatique **est** un feedback, et c'est le seul. Prétendre le
> contraire serait une spec qui ment. Formulation canonique : \*aucun feedback par trait, sous aucune
> forme ; **UN** seul signal, global, binaire et terminal — le verrouillage. **Il ne commente pas,
> il termine.\*** La distinction est nette et opposable au dev comme à l'UX : un signal qui **met fin
> à la phase** n'oriente pas la suite du jeu du joueur, il n'y a pas de suite ; un signal par trait,
> lui, oriente les trois gestes suivants — c'est ce qui reste interdit, et c'est tout ce que D4
> protégeait vraiment. L'installation diégétique de Yasmine (« Personne te dira si c'est bon. C'est
> ton œil. ») reste **exacte au mot près** : personne ne te dit si c'est bon, la scène s'arrête
> quand ça l'est.

**Pendant la phase — rien par trait.** Aucune coche, aucune couleur, aucun son de justesse, aucun
compteur « 2/4 ». Non par archéologie, mais parce que **le moindre feedback par trait détruit la
mécanique** :
avec un signal « juste/faux », le joueur cesse de comparer et **balaye** les 6 variantes jusqu'au
vert. Le test d'observation devient un test de patience, et tout le §3 (la distance de leurre) ne
sert plus à rien. C'est l'unique raison, et elle suffit.

Ce qui est affiché en permanence pendant `ACTIVE` (ce n'est pas du feedback, c'est de la
**lisibilité d'état**, et c'est non négociable sur mobile) :

- le portrait cible, **entier, tout du long**, et **rapproché des bandes** — plancher **28 % de la
  largeur** en mobile paysage. C'est le repli retenu au gate (A8) contre le mini-crop de
  comparaison locale, coupé : co-localiser un crop de la cible ferait la moitié du travail que la
  scène demande. Le problème de confusion documenté par la recon se traite par la **proximité**,
  pas par une aide ;
- la position dans le cycle de variantes (« `{n}` sur `{total}` ») — pour savoir si on a tout vu.
  C'est de la lisibilité d'état, pas du feedback : ça ne dit rien de la justesse ;
- le chrono, sous forme de **jauge de télécarte qui se vide, sans nombre** (R13). Une jauge se lit
  en périphérie ; un nombre force un aller-retour du regard, hors de la comparaison.

_(Le surlignage de bande, s'il existe, est une affordance d'IHM — `ux-designer`. Le modèle de jeu
n'a pas de « bande active », §2.2.)_

**À la révélation — tout, trait par trait, MAIS seulement s'il y a quelque chose à dire.**

- **`PARTIAL` / `FAILED` — `RESOLVING` = 2,6 s.** Les 4 verdicts déroulent **en séquence, de haut en
  bas**, ~0,45 s chacun : pour chaque bande, la variante choisie et, si elle est fausse, **la
  bonne**, en substitution visible. Puis le visage correct se tient 0,8 s. C'est la reptation qui
  **porte les corrections** — sans elle, l'échec n'a pas de « raison affichée ».
- **`IDENTIFIED` — `RESOLVING` = 1,4 s.** Flash de verrouillage + les **4 tampons simultanés**.
  Zéro reptation : il n'y a aucune correction à montrer, et faire défiler quatre « juste » l'un
  après l'autre pour annoncer ce que le verrouillage vient d'annoncer serait du temps mort **sur le
  meilleur moment du jeu**. Le beat d'`IDENTIFIED` n'est pas une leçon, c'est un claquement.

Rationale game feel : c'est **exactement** là que le feedback est gratuit sur le plan mécanique
(la manche est finie, il n'exploite rien) et maximal sur le plan pédagogique — le joueur apprend
**quel descripteur** il a raté (« ah, la raie, pas la longueur »), donc il apprend la grammaire de
la §3. C'est le moteur du « encore une fois » (§6). Et ça répond au reproche moderne
qu'on ferait à l'original : on ne prive pas le joueur d'information, on la **diffère** jusqu'au
moment où elle enseigne au lieu d'assister.

**Ordre de la séquence :** de haut en bas, toujours (cheveux → yeux → nez → bouche), **jamais**
les erreurs en dernier pour ménager le suspense. Un ordre stable est lisible ; un ordre
dramatisé serait perçu comme une manipulation dès la deuxième occurrence.

### D6 — Le brute-force ouvert par B1 : chiffré, puis classé sans suite

Le CTA rendait le balayage impossible : on ne soumettait qu'une fois, donc balayer ne servait à
rien. Sans lui, le joueur peut **balayer les variantes en attendant que ça se verrouille**. C'est
l'effet de bord réel de B1 sur la mécanique ; je le chiffre au lieu de le supposer.

| Grandeur                    | Valeur                                                   | Détail                                                                                                     |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Espace de recherche         | **1 296** états                                          | 6⁴                                                                                                         |
| Balayage exhaustif          | **1 295 crans**                                          | compteur base 6 à 4 chiffres, 1 cran = 1 nouvel état                                                       |
| Cadence d'entrée            | **≈ 4 /s** au clavier · **≈ 2 /s** au swipe/drag discret | cohérent avec le budget d'input §3 D3 (20 pressions ≈ 5 s)                                                 |
| Couverture en 35 s          | **140 états (10,8 %)** clavier · **70 (5,4 %)** au doigt | en `easy` (56 s) : 224 états, **17,3 %** ; même à 8 /s — irréaliste sous chrono — on plafonne à **21,6 %** |
| Durée d'un balayage complet | **≈ 324 s**, soit **9,3 × le chrono**                    | 1 295 / 4                                                                                                  |
| Et s'il échoue              | **P(≥ 3 bons) = 4·(1/6)³·(5/6) = 20/1296 = 1,5 %**       | le balayeur ne rate pas en `PARTIAL`, il rate en **`FAILED`**                                              |

**Verdict : le brute-force n'est pas une menace, c'est une stratégie strictement dominée.** ~11 % de
réussite contre ~1,5 % de lot de consolation, face à un joueur qui **regarde** et vise 4/4 sur une
comparaison à 6 variantes dont **2 leurres forts seulement** (§3 D3). Anti-synergie en prime :
balayer au doigt, c'est ne pas regarder la cible — la stratégie dégradée **s'auto-punit** en
consommant précisément l'attention qu'il faudrait dépenser ailleurs.

**Aucune contre-mesure n'est ajoutée** : pas de cooldown d'input, pas de pénalité au nombre de
crans, pas de plafond d'essais (ce serait d'ailleurs contraire à B2). Ce serait de la complexité
contre un exploit qui n'existe pas, et **ça punirait le joueur qui hésite légitimement** — lequel
est indistinguable d'un balayeur, vu de la machine. Position réévaluable au stage 5 **sur une
observation de playtest**, jamais sur une intuition : si des joueurs balayent **au lieu** de
regarder, ce n'est pas le balayage qu'il faudra punir, c'est le signe que les leurres sont trop durs
(levier §3 D3, classe de variation). Je traiterai par là.

**Coût accepté et nommé :** un joueur peut gagner **par accident**, en tombant sur le 4/4 en
balayant. Il gagne alors sans avoir rien appris, et la révélation courte d'`IDENTIFIED` (1,4 s, sans
reptation) ne le lui enseignera pas non plus. À ~11 % d'occurrence sur **une seule scène par run**,
c'est un prix acceptable pour ne pas fabriquer une police d'input.

---

## 6. Game feel

**Rythme (les trois temps).**

1. **L'après (entrée).** Pas un gel : une **retombée**. La mission est finie, le bruit de la teuf
   s'éloigne, la cabine se referme. Le contraste avec les 3-5 min de `Éviter` qu'on vient de jouer
   est l'effet, et il est gratuit — mais il se joue **hors** du budget de la mission (A2), ce qui
   est précisément ce qui empêche la scène d'être une digression.
2. **Le silence de travail (les 35 s).** C'est un **temps calme sous horloge**. Rien ne bouge sauf
   ce que le joueur bouge. La tension vient de trois sources et de rien d'autre :
   - la **jauge de télécarte qui se vide en continu**, sans nombre (R13) ; la recon note « tense
     music as the seconds tick down » — c'est la seule chose que l'original fait pour tenir cette
     phase, et elle marche. Une jauge continue tient mieux qu'un décompte d'unités : elle ne donne
     pas de **prise arithmétique** (« il me reste 4 unités, soit 10 s, soit 2 bandes »), elle donne
     une **sensation de fuite**. La scène n'est pas un budget à optimiser, c'est une carte qui se
     vide pendant qu'on cherche ;
   - une **musique qui se resserre** aux paliers **10,0 s** puis **5,0 s restants** (hand-off
     `sound-designer` : deux paliers, pas un crescendo continu — un palier se perçoit, une rampe
     s'ignore). Le palier de mi-parcours est de la **copie seule**, sans son. Les deux paliers
     critiques tombent **aux mêmes secondes dans les trois difficultés** (§4.1 D5) : un seul jeu de
     cues, et le même sens partout ;
   - le **portrait cible qui vous regarde**. C'est le seul « personnage » à l'écran ;
     `lead-art` doit lui donner un regard qui soutient 35 s de face-à-face.
3. **La révélation — deux durées, deux fonctions.** À `PARTIAL`/`FAILED` (**2,6 s**) : séquence
   descendante, un verdict à la fois, **rythmée comme une machine à écrire** ; chaque bande claque,
   la fausse est corrigée sous les yeux du joueur. On voit exactement **quelles** bandes se
   corrigent : la sanction est mise en scène comme une **leçon**, pas comme un buzzer. À
   `IDENTIFIED` (**1,4 s**) : le visage se **fige d'un coup**, entier, les quatre tampons tombent
   **ensemble**. Ce n'est plus une séquence, c'est un **claquement** — et c'est mieux ainsi : le
   verrouillage a déjà dit « c'est lui », la révélation ne fait que le confirmer plus fort. Étaler
   une bonne nouvelle sur 2,6 s l'aurait diluée.

### La convergence — ce que B1 fait vraiment au game feel (verdict franc)

**La nature du jeu change, et je le dis sans enrobage.** Au round 2, le joueur **composait puis
soumettait** : il assemblait un objet, il le déclarait fini, une autorité le jugeait. C'est la
boucle d'un **formulaire** — remplir, envoyer, recevoir un accusé. Sans CTA, il ne compose plus, il
**converge** : il tâtonne vers un état, et l'état correct **se manifeste tout seul**. C'est la
boucle d'un **cadenas** — on tourne les molettes, et à un moment ça s'ouvre. Il n'y a personne au
bout qui juge ; il y a un mécanisme qui cède.

**Est-ce que ça sert la scène ? Oui, et davantage que je ne l'aurais parié.** Quatre raisons, par
ordre de poids :

1. **Ça supprime le pire moment de la version round 2 : le doigt au-dessus du bouton.** Le CTA
   créait une **décision méta** — « est-ce que je valide maintenant ou est-ce que je vérifie
   encore ? » — qui n'a **rien à voir** avec le verbe de la scène (regarder et déduire). Le joueur
   passait ses dernières secondes à arbitrer un risque, pas à comparer un nez. Le cadenas rend
   toute la durée de la scène homogène : il n'y a **qu'une** chose à faire, du début au buzzer, et
   c'est regarder.
2. **La récompense arrive à l'instant exact où elle est méritée.** Dans le formulaire, il y avait un
   délai — trouver, puis déclarer, puis attendre le verdict. Le cadenas colle la cause à l'effet :
   le geste qui pose la bonne bande **est** la victoire, dans la même frame. C'est le meilleur
   feedback du jeu et il ne coûte rien, parce que ce n'est pas une récompense ajoutée, c'est la
   **fin de la résistance**. Aucun QTE de muf n'a ce moment-là.
3. **Ça durcit `PARTIAL` sans toucher un chiffre.** Le 3/4 devient un état **subi** au lieu d'un lot
   qu'on encaisse volontairement. On ne peut plus « prendre ses 400 points et partir » : on ne peut
   que **ne pas avoir fini**. Le presque-juste reste lisible et faiblement récompensé — mais il
   cesse d'être une stratégie.
4. **C'est plus fidèle à la fiction que le bouton ne l'était.** « Sors-moi une tête, une seule » : la
   scène s'arrête quand la tête est sortie, pas quand le joueur estime qu'elle l'est. KENZA ne
   valide pas un formulaire, elle **reconnaît quelqu'un**. Que la réplique source du CTA supprimé
   soit précisément l'argument de sa suppression est la meilleure preuve que le bouton était de
   trop.

**Ce que ça coûte, honnêtement — trois points, dont un que je n'accepte pas en l'état :**

- **Le joueur perd le contrôle de la fin.** C'est réel, mais c'est le prix du cadenas et il est
  bien payé : il perd le contrôle **d'une seule** issue, la meilleure, et seulement en la
  produisant. On ne lui retire jamais une fin qu'il voulait.
- **Le joueur qui se croit fini n'a plus rien à faire** et attend le buzzer devant une jauge qui se
  vide — jusqu'à 20 s de vide subi, et c'est **l'état modal de l'échec honnête**, pas un cas rare.
  **C'est le seul vrai dégât de B1, et il n'est pas acceptable tel quel.** Il ne se répare pas par
  un bouton (ce serait le CTA par la fenêtre) mais par la **requalification de la sortie
  anticipée** : le geste existe déjà, il est juste libellé « abandon » au lieu de « j'ai fini,
  imprime ». Voir « Désaccords maintenus » 1 et §9 — livrable dû par `narrative-designer` et
  `ux-designer`, **bloquant pour l'acceptation design au stage 5**.
- **Le balayage devient possible.** Chiffré et classé sans suite en §5 D6 : stratégie dominée,
  aucune contre-mesure.

**Le risque de lecture, à surveiller au playtest.** Un cadenas mal mis en scène ressemble à un
distributeur en panne : on tripote et il ne se passe rien. Le garde-fou tient dans le `snap` de R4
(chaque cran doit **répondre**, sinon la scène paraît morte) et dans le fait que la jauge, elle,
bouge toujours. **Question à poser au stage 5, exactement :** « as-tu compris, sans qu'on te le
dise, que ça s'arrêterait tout seul quand tu aurais raison ? » Si la réponse est non chez plus d'un
joueur sur deux, le défaut est dans l'**enseignement d'entrée** (une ligne de KENZA, §9), pas dans
la mécanique — et surtout pas dans le retour d'un bouton.

**Ce qui donne envie de recommencer.** Trois moteurs, dans l'ordre :

1. **On a compris quelque chose.** La révélation nomme l'erreur. Au **run suivant** (une seule
   occurrence par run, A3), on sait _où regarder_. C'est une **courbe de compétence réelle**, pas
   une courbe de chance — c'est ce que la règle du trait nommé (§3 D2) achète.
2. **On a été à un trait près.** Le palier 3/4 rend le presque-juste explicite. « Je l'avais, sauf
   le nez » est la phrase qui fait rejouer.
3. **La récompense est narrative ET jouable.** Le portrait juste **devient une personne** — la
   page 23, une porte qui se ferme — _et_ 20 secondes de répit au démarrage de la mission suivante
   (§2.5). C'est le pivot que l'original réussit (recon §5), et c'est aussi ce qui distingue la
   scène d'une curiosité : sans le payoff, c'est du remplissage par définition (A11).

**Le piège à éviter (à surveiller au playtest) :** la scène ne doit **jamais** ressembler à un
formulaire — B1 vient de lui retirer son bouton « envoyer », ce qui aide beaucoup, mais un
formulaire sans bouton reste un formulaire si la mise en scène le laisse faire. Si au stage-5 elle lit comme un menu d'options, le défaut est dans la mise en scène
(cadrage, son, présence du portrait cible), **pas** dans la mécanique — ne pas répondre en
rajoutant du timing.

---

## 7. Explicitement HORS spec V1 (KISS/YAGNI)

1. **Bandes qui défilent / à figer** — rejeté en D1. Ne pas ré-introduire par la porte de service
   (« et si juste les cheveux défilaient ? » : non).
2. **Verrouillage / validation bande par bande** (et le verrouillage **indicatif** de bande, coupé
   au gate A8). §4.3 — à ne pas confondre avec le verrouillage **automatique global** de R5, qui
   est, lui, la mécanique.
3. **Feedback par trait pendant la phase**, sous quelque forme que ce soit (couleur, son, « chaud/
   froid », compteur de justesse). §5. Le verrouillage n'est pas une exception : il est **global et
   terminal**, il ne commente aucun trait.
   3-bis. **Tout CTA, bouton, touche ou geste de soumission** (B1), et toute garde temporelle
   associée (`confirmGuardSeconds`, R12). Ne pas les réintroduire sous un autre nom (« bouton
   J'AI FINI », « double-tap pour imprimer ») : la sortie anticipée de §2.1 couvre ce besoin et
   c'est la seule porte.
   3-ter. **Toute contre-mesure anti-balayage** — cooldown d'input, pénalité au nombre de crans,
   plafond d'essais. Chiffré comme inutile en §5 D6, et un plafond d'essais contredirait
   frontalement B2.
4. **Bonus de score au temps restant.** §4.3 — il combat le verbe de la scène.
5. **Plus de 4 bandes** (menton, oreilles) et **plus de 6 variantes** par bande, **plus d'un
   gabarit** de visage. §3/§4.1 — plafonds durs, budget art.
6. **Plus d'une occurrence par RUN** (A3). La table de progression multi-occurrences est une
   **note post-V1** (§3 D3), pas une spec : elle ne s'implémente pas.
7. **Indices / aides** (éliminer une variante, révéler une bande, ralentir le chrono). Y compris
   le **mini-crop de comparaison locale** et le **verrouillage indicatif de bande**, tous deux
   coupés au gate (A8).
8. **Portrait cible masqué / de mémoire.** Le cible reste visible en permanence : test
   d'observation, pas de mémorisation.
9. **Portraits générés proceduralement.** Les jeux de variantes sont **autorés**, revus par
   `lead-art` contre la règle D2. Une génération procédurale ne peut pas garantir A1/A2.
10. **Effet sur le quota d'ennemis, sur les armes, la géométrie, ou blocage de la complétion.**
    §2.4. Le **seul** effet mécanique sur la suite est le `waveDelaySeconds` de §2.5.
11. **Photo numérisée / palette ST.** Tranché par Bertrand en amont.
12. **Toute perte de vie**, entière ou fractionnaire, sur n'importe quel chemin de sortie. §4.3.
13. **Toute récompense en énergie** — inopérante par construction (clamp à 100). §4.3.
14. **Le twist « ton propre portrait-robot »** — **gelé** au canon, réservé au Niveau Final (A12).
    Aucune lane ne le référence d'ici là.

---

## 8. Critères d'acceptation (design VERIFY, stage 5 — Sacha rejoue le build via `verify`)

- **AC1 — Placement interstitiel.** La scène s'ouvre **après** la fin de niveau, dans un `AppPhase`
  dédié `PORTRAIT_ROBOT`, jamais pendant `PLAYING`. Aucun monde n'est gelé (il n'y en a pas), aucun
  `QTE_ZOOM_SECONDS` n'est consommé. **Le budget 3-5 min d'une mission n'est entamé d'aucune
  seconde** — vérifié en chronométrant une mission avec et sans la scène : écart nul.
- **AC2 — Règle d'interaction conforme à D1 (R1-R5, §2.2).** Sur les deux classes d'appareils
  (ADR-0015) et **quel que soit le geste retenu par `ux-designer`** : la bande _i_ peut être portée
  à la variante _j_ **sans effet de bord** sur les trois autres ; les 4 bandes sont adressables dans
  n'importe quel ordre et autant de fois qu'on veut, **sans limite d'essais** ; le cycle boucle dans
  les deux sens ; un pas = exactement une variante ; **il n'existe aucun geste de validation** et
  l'écran ne contient **aucun CTA**. **Cet AC ne teste aucun geste** — le mapping (swipe horizontal
  sur la bande en tactile, drag horizontal en desktop) est vérifié par l'AC d'`ux-designer`, pas ici.
- **AC2-bis — Verrouillage automatique.** Porter les 4 bandes sur la bonne combinaison **termine la
  phase immédiatement**, sans aucun geste supplémentaire, depuis n'importe quel ordre de pose et à
  n'importe quel instant du chrono. Vérifié en jeu réel **et** par test pur.
- **AC3 — Aucun feedback par trait pendant.** Aucun signal de justesse **par bande**, entre le début
  du chrono et `RESOLVING` : ni couleur, ni coche, ni son de justesse, ni compteur « n/4 ». Vérifié
  par capture. Le compteur `{n} sur {total}` de position dans le cycle et la jauge de chrono sont
  présents (lisibilité d'état, pas feedback). **Le verrouillage automatique est le seul signal
  admis, et il est terminal** — s'il existe un état où la scène signale « c'est bon » **sans**
  s'arrêter, l'AC échoue.
- **AC4 — Révélation, deux durées.** À `PARTIAL`/`FAILED` : `RESOLVING` déroule 4 verdicts de haut en
  bas en ~0,45 s chacun, corrige visiblement chaque bande fausse, puis tient le visage complet
  0,8 s — total **2,6 s ± 0,2 s**. À `IDENTIFIED` : flash + **4 tampons simultanés**, **aucune**
  reptation, total **1,4 s ± 0,15 s**. Hold 2,2 s dans les deux cas.
- **AC5 — Barème.** 4/4 ⇒ `IDENTIFIED` (0 énergie, +1500 score) ; 3/4 ⇒ `PARTIAL` (0 énergie,
  +400 score) ; ≤ 2/4 ⇒ `FAILED` (**−20 sur le capital d'énergie INITIAL du niveau suivant**,
  0 score). Vérifié par test unitaire sur les trois issues. Le `FAILED` est vérifié **là où il
  s'applique** : le niveau suivant démarre à **80**, pas à 100 — et l'énergie du niveau écoulé est
  inchangée.
- **AC6 — La scène ne retire JAMAIS de vie.** Sur les trois issues, sur le timeout et sur l'abandon
  confirmé, `lives` est **strictement inchangé** — y compris à `lives` bas (0,5 puis `FAILED` ⇒
  toujours 0,5). Asserté comme une **absence** : le contrat de sortie de la scène ne contient aucun
  `livesDelta`. Test unitaire sur les cinq chemins.
- **AC7 — Timeout évalué, et ordre de résolution.** Trois assertions : (a) l'expiration du chrono
  évalue l'état courant et le juge par le même barème (un 3/4 au buzzer donne `PARTIAL`) — aucun
  chemin d'échec sec ; (b) **aucune** évaluation au buzzer ni en sortie anticipée ne peut produire
  `IDENTIFIED` ; (c) **le 4/4 posé dans la frame de l'expiration donne `IDENTIFIED`**, et cette
  issue est **identique sur deux replays de la même trace d'entrées** — c'est une propriété du
  réducteur, pas de l'ordonnancement des events. Test pur sur les trois.
- **AC8 — Déterminisme.** Même `portraitSeed` ⇒ même bonne variante et mêmes leurres, aux mêmes
  index, sur deux runs. Aucun `Math.random`/`Date.now` dans la scène (grep/lint assertés). Les
  niveaux sans spec portrait sont byte-for-byte inchangés.
- **AC9 — Invariants du jeu de variantes.** `correctCount(état initial) === 0` — **les quatre**
  bandes démarrent sur une variante fausse (`initialStateAllWrong`, A5), sur **tout** `portraitSeed`
  testé, donc aucune scène ne peut se verrouiller avant 4 gestes ; la bonne variante n'est pas
  toujours au même index (A6) ; `variantsPerStrip === 6`,
  `faceTemplates === 1` et `stripCount === 4`, assertés en code contre les données autorisées,
  jamais présumés.
- **AC10 — Équité de la ressemblance (playtest, pas test unitaire).** Sur un device mobile réel,
  chaque différence bonne-variante/leurre est **nommable en une phrase** et **visible sans zoomer**
  (A1/A2/A3). Tout leurre qui échoue ce test est renvoyé à `lead-art`. Composite gate.
- **AC11 — Budget de chrono.** Un balayage complet des 4 bandes (toutes variantes vues une fois)
  consomme **≤ 25 %** du chrono en jeu réel (cible calculée : ~14 % à 6 variantes). Au-delà, baisser
  `variantsPerStrip` avant de toucher au timer.
- **AC12 — Le payoff existe et se sent (§2.5, critère de sortie de la feature).** Deux volets :
  1. _Mesurable :_ au niveau suivant, la première vague de pression RG/BAC arrive avec **+20 s** de
     retard après `IDENTIFIED`, **+10 s** après `PARTIAL`, **0 s** après `FAILED`. Test unitaire sur
     l'horodatage de la première vague ; aucune persistance au-delà de ce niveau.
  2. _Ressenti (playtest, pas test unitaire) :_ le rappel narratif obligatoire est joué au
     pré-niveau (la porte qui refuse / l'habitué refusé + « l'autre est entré »), et le joueur
     **perçoit** le répit du démarrage. La question du playtest n'est pas « est-ce que ça marche »
     mais **« est-ce que le payoff se sent »**. S'il ne se sent pas, la feature échoue son gate de
     justification (A11) et `pm` + `lead-game-designer` la coupent.
- **AC13 — Chrono continu, paliers et accessibilité.** Le chrono s'affiche en **jauge continue qui
  se vide, sans aucun nombre** (ni unités, ni secondes) ; il n'existe **aucun compte d'essais ni
  plafond de crans** ; `Prefs.difficulty` donne **56 / 35 / 30 s** ; le chrono est **en pause** tant
  que `RotateOverlay` est affiché. Paliers vérifiés au chronomètre dans les **trois** difficultés :
  urgence à **10,0 s restants** et dernier à **5,0 s restants** dans les trois, mi-parcours à
  `max(timerSeconds/2 ; 17,0)` s restants — soit 28,0 / 17,5 / 17,0 s (D5 ; si `lead-game-designer`
  refuse le plancher, la valeur `hard` attendue redevient 15,0 s).
- **AC14 — Vocabulaire de surface (A6).** Aucune capture d'écran de la scène ne contient
  `PORTRAIT-ROBOT`, `CHEVEUX`, `YEUX`, `dossier suspect`, `VALIDER LE PORTRAIT`, `SORTIR LA TÊTE`,
  `TÉLÉCARTE · {n} UNITÉS`, ni « temps restant », **ni aucun nombre de chrono**. On y lit
  **`TÊTE À CONNAÎTRE`** et **`LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`**. La copie de la jauge
  sans nombre et celle de la sortie anticipée sont dues par `narrative-designer` (§9). Vérifié par
  capture au composite gate.
- **AC15 — Balayage : aucune contre-mesure, et le coût est celui qui a été chiffré.** Deux volets :
  1. _Mesurable :_ aucun cooldown d'input, aucune pénalité au nombre de crans, aucun plafond
     d'essais n'existe dans le code de la scène. Un joueur peut enchaîner les crans à la cadence
     maximale que le geste permet, du début au buzzer.
  2. _Playtest :_ si des joueurs **balayent au lieu de regarder**, le rapport de stage 5 le
     signale comme un signal sur la **difficulté des leurres** (§3 D3), jamais comme une demande de
     pénalité (§5 D6).
- **AC16 — La sortie anticipée est une sortie, pas un abandon.** Elle est **visible en permanence**
  (pas seulement `Escape` / retour Android), elle résout à l'état courant, et sa copie ne lit pas
  comme un renoncement. **Bloquant** : sans elle, le joueur qui se croit fini subit jusqu'à 20 s de
  vide (§6, « Désaccords maintenus » 1). Vérifié par capture + playtest.

---

## 9. Questions ouvertes (pour les autres lanes — NON tranchées ici)

**Refermées par le gate, ne pas rouvrir :** D1 (ratifiée, option B close définitivement) · le coût
de l'échec (énergie seule, A1) · le palier 3/4 (maintenu, A9) · la fréquence (1 par run, A3) ·
le nombre de variantes (6, A5) · le placement (interstitiel, A2) · le mapping tactile (swipe sur la
bande, arbitrage Bertrand A4-bis) · **le mapping desktop (drag horizontal, option B, B3)** ·
**l'existence d'un CTA (supprimé, B1)** · **la discrétisation du chrono (supprimée, B2)** ·
le twist « ton propre portrait-robot » (gelé, A12).

**Pour `ux-designer` (Tony) — ouvert par l'arbitrage A4-bis, non bloquant pour le TECH PLAN :**

1. **Seuil d'angle et distance de déclenchement du swipe** — l'ambiguïté du swipe diagonal que tu
   documentais reste réelle ; elle se chiffre, elle ne se rejette plus.
2. **Discrete-swipe (1 swipe = 1 cran) vs défilement à l'inertie.** Ma contrainte de design est R4
   (§2.2) : un pas = exactement une variante, prévisible sous chrono. Le discret est donc ma
   recommandation forte ; le continu ne passe que s'il s'arrête toujours pile sur un cran.
3. **Hauteur minimale par bande** — devient une contrainte de swipe, plus seulement de lecture.
4. **Accessibilité** : un swipe n'est actionnable ni au clavier ni au lecteur d'écran. Les chevrons
   restent en affordance + cible d'accessibilité (≥ 44×44 px), jamais en geste primaire.
5. ~~Desktop : proposition sur maquette Figma~~ → **TRANCHÉ (B3) : option B, drag horizontal à la
   souris sur la bande visée.** Reste à toi : seuil de distance du drag (le même chiffrage que le
   swipe, ou un autre ?), curseur, et l'affordance qui dit « ça se tire ». Socle clavier acquis
   (↑↓ bande · ←→ variante · Échap sortie anticipée) — **`Entrée` n'a plus de fonction** (B1), elle
   ne doit être bindée à rien.
   5-bis. **BLOQUANT — la sortie anticipée doit devenir une affordance permanente.** Depuis B1, c'est
   le seul geste terminal volontaire du joueur, et le joueur qui se croit fini n'a que lui. Un
   `Escape` caché ne suffit plus : il faut une cible visible (≥ 44×44 px), non-CTA, qui ne se lise
   pas comme « valider » (sinon on réintroduit le CTA par la fenêtre) ni comme « abandonner »
   (sinon personne ne l'utilise). Voir §6 et AC16.
   5-ter. **La jauge sans nombre** : lisible en périphérie, sans quitter la comparaison des yeux, et
   avec un équivalent `aria` non-numérique ou à granularité grossière (une annonce par palier, pas
   un décompte).
6. **Layout** : la contrainte de design est **le cible et la bande travaillée comparables sans
   scroll ni bascule**, médaillon cible ≥ **28 %** de la largeur en mobile paysage, rapproché des
   bandes (A8).
7. **Enseigner « compare, ne tape pas »** en < 2 s. Voir `tutorial-visual-gestures.md`.

**Pour `narrative-designer` (Yasmine) :**

8. **Le verdict `PARTIAL` (3/4)** — il manque à ta spec : tampon + lignes du « presque ». Le palier
   existe (A9) et la non-négociable §5 règle 4 impose une raison affichée.
9. **Les deux rappels du niveau suivant** (§2.5) — obligatoires, pas optionnels.
10. ~~Conversion télécarte 1 unité = 2,5 s / 14 unités~~ → **morte (B2).** Trois livrables neufs à la
    place : (a) un **libellé de jauge sans nombre** (`TÉLÉCARTE · {n} UNITÉS` et son repli
    `{n} UNITÉS` sont morts) ; (b) le **recadrage de ta ligne d'expiration** (« Ma carte est morte.
    On imprime ce qu'on a. ») — elle était écrite comme la variante « le chrono expire avant toute
    validation », or l'expiration est désormais **le chemin normal** de `PARTIAL`/`FAILED` ; la
    ligne est bonne, son cadrage est caduc ; (c) la **copie de la sortie anticipée**, qui n'est plus
    un abandon mais le geste « j'ai fini, imprime » (§6, AC16) — **bloquant**.
    11-bis. **Enseigner le cadenas en une réplique.** Le joueur doit comprendre, sans tutoriel, que
    **ça s'arrêtera tout seul quand il aura raison** (§6). Une ligne de KENZA à l'entrée suffit
    probablement ; c'est ta juridiction, pas la mienne. `SORTIR LA TÊTE` disparaît de l'IHM mais la
    réplique source (« Sors-moi une tête, une seule ») **reste au dialogue** — et elle est
    exactement le bon candidat.

**Pour `lead-art` (Nico) — le read, pas le style :**

11. **La règle D2 est productible au budget arrêté :** 4 bandes × **6** variantes × **1** gabarit =
    24 assets. Elle est **opposable au gate art** : un leurre dont tu ne peux pas énoncer la
    différence en une phrase courte, sans coordonnées de pixels, est rejeté.
12. **Correction à intégrer à ton brief §4 :** la scène n'a **pas** de chrono « qui coûte une vie »
    (A1) et n'est **pas** dans le monde de jeu (A2). Surface **interstitielle mais INTERACTIVE** :
    le liseré de sélection est légitime (ce qui brille est manipulable), la cible reste sans glow.
13. **Le regard du portrait cible** doit soutenir un face-à-face de 35 s (§6).

**Pour `sound-designer` :**

14. Deux paliers de resserrement musical à **10,0 s** et **5,0 s restants** — **les mêmes secondes
    dans les trois difficultés** (§4.1 D5), donc **un seul jeu de cues** à produire. Un `snap` court
    de changement de variante (**critique** : c'est lui qui empêche le cadenas de ressembler à un
    distributeur en panne, §6), un `bip` au dernier palier, et le rythme « machine à écrire » de la
    révélation **à `PARTIAL`/`FAILED` uniquement**.
    14-bis. **Nouveau, et c'est le son le plus important de la scène : le `clac` de verrouillage.**
    C'est le seul feedback global de la phase (§5 D4) et la récompense arrive **dans la frame** du
    geste. Il doit se distinguer sans ambiguïté du `snap` de variante — un joueur ne doit jamais
    se demander s'il a gagné. Il précède la révélation courte d'`IDENTIFIED` (1,4 s), il ne la
    double pas.

**Pour `senior-architect` / `tech-writer` :**

15. **ADR à ouvrir** (0079/0080/0081 pressentis) : `AppPhase` interstitiel sans réemploi du shell
    ADR-0030, contrat de sortie
    `outcome / correctCount / energyDelta (niveau+1) / scoreDelta / waveDelaySeconds`,
    déterminisme par `portraitSeed`, et **la règle A1c** (une scène interstitielle modifie le
    capital initial du niveau suivant, jamais l'énergie du niveau écoulé) — règle neuve, à
    remonter aux guidelines si Bertrand la valide, car elle servira à toute scène interstitielle
    future.

---

## Hand-off — `lead-game-designer` (Karim), round 3

Spec révisée sur place, journal R10-R18 en tête. Les trois arbitrages Bertrand (B1/B2/B3) et tout ce
que le gate a instruit en §8 (A12bis, A13, A14, A15, A16) sont **transcrits, pas rouverts** : deux
moments d'évaluation, règle d'ordre du 4/4-au-buzzer comme propriété du réducteur,
`initialStateAllWrong` en remplacement de `confirmGuardSeconds`, `revealSeconds` 1,4/2,6, D4
reformulée, brute-force chiffré et classé sans suite.

**Travail propre de la lane, au-delà de la transcription — trois choses à arbitrer :**

1. **D5 (§4.1) — les paliers refaits en secondes.** Pas une conversion : une règle mixte
   (rythme = proportionnel, panique = absolu) et **un trou trouvé** — le mi-parcours à 50 % tombe à
   5,0 s de l'urgence en `hard`, deux cues collés qui fusionnent en rampe. Correctif proposé :
   déclencheur à `max(timerSeconds/2 ; 17,0)` s restants, une constante, aucune branche.
   **Ajout au canon §3 : tu tranches.**
2. **La sortie anticipée n'est plus un abandon (AC16, §9 5-bis/10c).** C'est le seul dégât réel de
   B1 : le joueur qui se croit fini n'a plus aucun geste et subit jusqu'à 20 s de vide. Je ne
   réintroduis pas de bouton ; je requalifie une porte qui existe déjà. **Je le déclare bloquant
   pour l'acceptation design au stage 5** — à confirmer par toi, avec livrables dus par
   `narrative-designer` et `ux-designer`.
3. **Le verdict de game feel sur la convergence (§6)**, demandé explicitement : franc, et il est
   **favorable**.

**Désaccords maintenus : deux, listés en tête** (le temps mort du joueur qui se croit fini ; le
palier de mi-parcours en `hard`). Aucun ne porte sur B1/B2/B3, que j'exécute et que je juge bons.
ACs neufs : **AC2-bis** (verrouillage automatique), **AC15** (aucune contre-mesure anti-balayage),
**AC16** (sortie anticipée) ; AC3/AC4/AC7/AC9/AC13/AC14 réécrits. À logger dans `docs/handoffs/`.
