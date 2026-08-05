# Spec — Scène PORTRAIT-ROBOT (mécanique + tuning)

**Feature :** nouvelle scène intercalaire « portrait-robot » — recomposer un visage à partir de
**4 bandes** (cheveux, yeux, nez, bouche). Référence assumée : la phase photofit de RoboCop
(Ocean, 1988), version Atari ST.
**Author:** `game-designer` (Sacha) · **Date:** 2026-08-05 · **Révision :** round 2 (post-gate)
**Status:** RÉVISÉE round 2 — alignée sur `docs/game-design/design-gate-portrait-robot.md` §3
(valeurs canoniques). Prête pour `senior-architect` (TECH PLAN).

> **Autorité de tuning.** La §3 du design gate fait foi. Cette spec ne fait qu'en porter les
> valeurs avec leur rationale. En cas de divergence résiduelle constatée, **le gate gagne** et
> c'est un bug de cette spec.

---

## Journal de révision — round 2 (2026-08-05)

| # | Ce qui change | Où | Arbitrage |
| - | ------------- | -- | --------- |
| R1 | **Suppression de toute perte de vie** (le `−0,5 cœur` et son plancher anti-mort). Sanction `FAILED` = **−20 sur le capital d'énergie initial du niveau suivant**. | §0, §2.4, §4.3, AC5, AC6 | A1 + A1c (story AC5) |
| R2 | **Suppression du `+25` énergie** à `IDENTIFIED` et du `+5` à `PARTIAL` : inopérants (clamp à 100) une fois la scène post-niveau. Récompense = score + payoff. | §4.3 | A1c |
| R3 | **Placement : interstitiel post-niveau**, hors mission, **aucun gel du monde**, pas de shell ADR-0030 ni de `QTE_ZOOM_SECONDS`. J'écrivais un déclenchement scripté en cours de niveau. | §0, §2.1, §2.3, §6, AC1 | A2 (budget 3-5 min) |
| R4 | **Une occurrence par RUN** (j'écrivais « une par niveau »). La table de progression #1/#2/#3+ passe en **note post-V1**. | §3 D3, §7.6 | A3 (`pm`) |
| R5 | **`variantsPerStrip` = 6, plafond dur 6, 1 seul gabarit** (24 assets). Le passage à 8 est retiré. | §3, §4.1, §7.5, AC9 | A5 (budget `lead-art`) |
| R6 | **Payoff chiffré, intégré à la mécanique** (il manquait dans les trois specs) : retard de la 1ʳᵉ vague RG/BAC au niveau suivant, **+20 s / +10 s / 0 s**. | §2.4 (nouveau §2.5), §4.3, AC12 | A10 |
| R7 | **Vocabulaire de surface joueur** : `LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`, bandeau `TÊTE À CONNAÎTRE`, CTA `SORTIR LA TÊTE`. Les noms cheveux/yeux/nez/bouche restent **internes**. | partout | A6 |
| R8 | **Chrono** : habillage télécarte, 1 unité = 2,5 s (14 unités), paliers 7/4/2 unités ; modulation `Prefs.difficulty` **56 / 35 / 30 s** ; pause sous `RotateOverlay`. | §4.1, §6 | A7 |
| R9 | **La spec ne prescrit plus de geste.** Elle prescrit la **règle** (« la bande *i* passe à la variante *j* », les 4 bandes indépendantes, ordre libre, cycle bouclé). Le mapping geste↔règle appartient à `ux-designer`. | §2.2, AC2, §9 | A4-bis (Bertrand 2026-08-05) |

**Ratifié par le gate et conservé intact :** D1 (sélection libre), D2 (règle du trait nommé + test
de recevabilité verbal), D4 (zéro feedback pendant / verdict complet à la révélation),
`confirmGuardSeconds` 1,0 · `revealSeconds` 2,6 · `resultHoldSeconds` 2,2, seuils 4/4 · 3/4 · ≤ 2/4,
timeout évalué normalement.

**Désaccords maintenus :** aucun. Les cinq points renvoyés étaient des contradictions avec des
décisions amont, pas des désaccords de fond — je les exécute. (Le seul point sur lequel j'aurais
argumenté, la valeur `+20 s` du payoff A10, me paraît bonne : voir §2.5, je la reprends telle
quelle.)
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

| Point | Décision |
| ----- | -------- |
| Placement | **Interstitiel**, dans la chaîne `LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT → (niveau suivant)`. `AppPhase` **dédié** `PORTRAIT_ROBOT`, **pas** un sous-état de `PLAYING`. |
| Fréquence | **Une occurrence par RUN** (A3), sur déclencheur narratif — pas une par niveau, pas un gate de niveau. |
| Le monde | **Il n'y a pas de monde.** Aucun gel, aucun ennemi en pause, aucune énergie en écoulement : la mission est terminée. Le shell ADR-0030 (`QTE_ZOOM_SECONDS`, zoom sur le tableau) n'est **pas** réutilisé. |
| Écran | **Plein écran dédié.** Le portrait cible et le portrait en construction sont **comparables sans scroll ni bascule** (la disposition CONFIRMÉE de l'original est cible à gauche / construction à droite ; l'adaptation mobile est la juridiction d'`ux-designer`). Bandeau **`TÊTE À CONNAÎTRE`**. |
| Transition d'entrée | Répliques d'entrée **skippables en un geste** (guidelines §5.3). La **phase interactive n'est pas skippable** : elle a une issue et un coût. Copie : `narrative-designer`. |
| Input pendant l'entrée | **Neutralisé.** Pas d'équivalent du `QTE_PANIC_SHOT` : on ne punit pas un joueur qui appuie pendant une transition qu'il ne contrôle pas. Le chrono ne démarre qu'à l'entrée en `ACTIVE`. |
| Abandon | `Escape` / retour Android ⇒ **confirmation légère**, puis la scène **se résout à l'état courant**, exactement comme l'expiration du chrono. Aucun chemin de sortie ne produit un résultat non évalué, et **aucun ne coûte de vie** (il n'y en a pas à coûter). |

### 2.2 BOUCLE D'INTERACTION (seconde par seconde)

Phase `ACTIVE`. Le chrono tourne (§4).

**État du modèle :** un **index de variante courant** par bande, soit 4 entiers dans `[0, 6[`. Rien
d'autre. Il n'y a **pas** d'état « bande active » dans le modèle de jeu — s'il en existe un, c'est
une notion d'IHM (curseur clavier), pas de mécanique.

> **Périmètre.** Cette section prescrit la **règle**, pas le geste. Depuis l'arbitrage Bertrand du
> 2026-08-05 (gate A4-bis), le geste tactile primaire est le **swipe horizontal sur la bande visée**
> et le mapping desktop se décide sur maquette Figma : **c'est la juridiction d'`ux-designer`**.
> Cette spec ne nomme donc aucune touche, aucun chevron, aucun swipe comme exigence. Ce qu'elle
> impose à tout mapping, c'est la conformité aux règles R1-R5 ci-dessous.

**Règles d'interaction (normatives, indépendantes du geste) :**

- **R1 — Adressage direct.** Le joueur doit pouvoir faire passer **la bande *i* à la variante *j***
  sans effet de bord sur les trois autres bandes. Les 4 bandes sont **indépendantes**.
- **R2 — Ordre libre et réversible.** N'importe quelle bande, dans n'importe quel ordre, autant de
  fois qu'on veut. Revenir sur une bande déjà changée est toujours possible (recon §3, PROBABLE,
  corroboré par « don't spend too long on one feature »). Aucune bande ne se verrouille (§4.3).
- **R3 — Cycle bouclé.** Le parcours des variantes d'une bande est **cyclique** dans les deux sens :
  après la 6ᵉ on revient à la 1ʳᵉ. Pas de cul-de-sac, pas de butée.
- **R4 — Changement instantané.** Un pas de variante s'applique en < 1 frame de latence logique,
  avec un `snap` sonore court. Un pas = **exactement une** variante (pas de saut, pas d'inertie
  qui dépasse) : la prévisibilité sous chrono prime.
- **R5 — Un seul acte de validation, global et terminal.** Le CTA **`SORTIR LA TÊTE`** gèle les 4
  index simultanément et lance la révélation. Confirmation **explicite en un geste**, pas de
  double-tap, pas de maintien. Garde anti-validation accidentelle : §4.1
  (`confirmGuardSeconds`).

**Déroulé type :**

| t | Ce que le joueur voit / fait |
| - | ---------------------------- |
| 0,0 s | Les 4 bandes du portrait en construction sont **pré-remplies** à une variante quelconque (jamais la bonne — invariant A5, §3). Le portrait cible est **visible en permanence jusqu'à la fin** (jamais masqué : test d'observation, pas de mémoire). |
| 0–2 s | Lecture. Le joueur compare une bande à la même zone du cible. |
| ~2 s → | Il fait défiler les variantes de la bande qu'il regarde (R1/R3/R4), passe à une autre, revient (R2). Le compteur `{n} sur {total}` lui dit s'il a tout vu. |
| n'importe quand | **`SORTIR LA TÊTE`** (R5). Le rôle du bouton feu est INCERTAIN dans l'original (recon §3) ; on le tranche ici : **il valide**. |
| chrono → 0 | Validation **forcée** de l'état courant. On ne « perd » pas sans être évalué : la composition telle qu'elle est au buzzer est **jugée normalement** (§4.2). C'est plus juste que l'échec sec de l'original et ça ne coûte rien en lisibilité. |

**Aucun feedback par trait pendant la phase** — voir §5.

### 2.3 SORTIE

Machine à phases forward-only, comme les QTE :
`ENTERING → ACTIVE → RESOLVING → (IDENTIFIED | PARTIAL | FAILED) → DONE`.

| Issue | Condition | Effet |
| ----- | --------- | ----- |
| `IDENTIFIED` | **4/4** bandes correctes | Réussite pleine. §4 récompense. |
| `PARTIAL` | **3/4** bandes correctes | Réussite dégradée : l'info tombe, incomplète. §4. |
| `FAILED` | **≤ 2/4**, ou validation forcée par le chrono avec ≤ 2/4 | Échec. §4 sanction. |

`RESOLVING` = la **révélation** (§5/§6), durée **2.6 s** avant le hold de résultat. Puis
`resultHoldSeconds 2.2 s`, puis `DONE`, puis enchaînement sur le niveau suivant. La scène ne se
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

| Issue | `waveDelaySeconds` |
| ----- | ------------------ |
| `IDENTIFIED` | **+20 s** de retard sur la **première vague de pression RG/BAC** du niveau suivant |
| `PARTIAL` | **+10 s** |
| `FAILED` | **0 s** (plus le −20 d'énergie initiale, §4.3) |

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

| Bande (nom interne) | Classe de silhouette (partagée par la famille) | Descripteurs discriminants admis (1 seul par leurre) |
| ----- | ---------------------------------------------- | ----------------------------------------------------- |
| **Cheveux** | volume global + implantation | raie (gauche/droite/aucune) · longueur des mèches · dégradé des tempes · frange (oui/non) |
| **Yeux** | écart interoculaire + inclinaison | épaisseur des sourcils · paupière tombante · cernes · écart des sourcils |
| **Nez** | longueur + largeur d'arête | forme des narines · bosse d'arête · pointe (retroussée/droite/tombante) |
| **Bouche** | largeur + épaisseur des lèvres | commissures (relevées/tombantes/neutres) · lèvre supérieure fine/pleine · pli nasogénien · dents visibles |

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
- **A5 — La bonne variante n'est jamais l'index 0.** L'état initial n'est jamais une bonne réponse
  gratuite (sinon un joueur qui valide immédiatement peut marquer par hasard).
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

| Variantes / bande | Composition du set | Chrono | Effet visé |
| ----------------- | ------------------ | ------ | ---------- |
| **6** | 1 bonne + **2 leurres de classe forte** (1 et 3) + **3 de classe moyenne** + **0 de classe 4** | 35 s | On apprend la grammaire en la jouant. L'élimination franche est possible ; le doute final se joue sur la classe moyenne. |

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
> | Occurrence | Composition envisagée |
> | ---------- | --------------------- |
> | #2 | resserrer vers 1 bonne + 1 forte + 4 moyennes + 1 classe 4 |
> | #3+ | 1 bonne + 4 moyennes + 2 classe 4, chrono éventuellement 32 s |
>
> Rien de ceci n'est spécifié pour V1. Un dev qui lit cette note ne l'implémente pas.

---

## 4. Table de tuning (le livrable)

Toutes les valeurs ci-dessous sont **strictement celles de la §3 du design gate**, qui fait foi.
La colonne « Plage » a été retirée là où le gate a figé la valeur : une plage sur une valeur
canonique serait une porte de sortie déguisée.

### 4.1 Cadre de la scène

| Clé | Valeur canonique | Justification |
| --- | ---------------- | ------------- |
| `stripCount` | **4** — figé (`LA COUPE`, `LE REGARD`, `LE NEZ`, `LA BOUCHE`) | **Demande de Bertrand.** L'original en a 5–6 (PROBABLE) ; 4 est un resserrage KISS assumé — les 4 zones les plus lisibles en BD, et celles qui tiennent à l'écran sur mobile. Menton/oreilles écartés : les moins discriminants et les plus coûteux à décliner. |
| `variantsPerStrip` | **6** — **plafond dur 6** | 6 : assez pour que l'élimination coûte un effort, assez peu pour un balayage complet en ~5 s (§3 D3). < 5 = trivial. Le plafond à 6 est le **budget de production chiffré par `lead-art`** (24 assets, 1 gabarit), pas une préférence : A3 ayant supprimé les occurrences #2/#3, la seule justification d'un passage à 8 est tombée avec. |
| `faceTemplates` | **1** gabarit ⇒ 24 assets de bande | Budget `lead-art` §5.1. Atomicité du gabarit demandée côté art. |
| `occurrences` | **1 par RUN**, sur déclencheur narratif | A3 / `pm`. Pas une par niveau. |
| `timerSeconds` | **35 s** · `easy` **56 s** · `hard` **30 s** | 35 s = milieu exact de la fourchette CONFIRMÉE (ACE 40 s / C&VG 30 s, recon §4). Budget : ~5 s de balayage + ~22 s de comparaison + ~8 s de marge. Le chrono **n'est pas** le levier de difficulté (§3). La modulation passe par `Prefs.difficulty`, qui **existe déjà** — on la câble au lieu d'inventer un mode. `easy` sort de la fourchette historique : assumé, l'accessibilité prime sur la fidélité sur une tâche de comparaison fine. |
| Unité de chrono | **1 unité = 2,5 s ⇒ 14 unités** au départ | Habillage diégétique **télécarte** (`TÉLÉCARTE · {n} UNITÉS`, jamais « temps restant »). La conversion est choisie pour faire tomber les paliers de son et de copie au même endroit (§6). |
| Paliers de chrono | **7 / 4 / 2 unités** = 17,5 s / 10,0 s / 5,0 s | Mi-parcours (copie seule) · urgence (copie + 1ᵉʳ resserrement musical) · dernier (bip + 2ᵉ resserrement + annonce `aria-live`). |
| Chrono sous `RotateOverlay` | **PAUSE** | Le joueur ne peut pas jouer derrière l'overlay ; laisser tourner serait une perte non imputable au joueur. |
| `revealSeconds` | **2,6 s** | Révélation trait par trait : 4 verdicts à ~0,45 s + 0,8 s de tenue du visage complet (§6). < 2,2 s illisible ; > 3,2 s on attend. |
| `resultHoldSeconds` | **2,2 s** | Aligné sur `QTE_RESULT_HOLD`. Cohérence inter-scènes. |
| `confirmGuardSeconds` | **1,0 s** | Le CTA `SORTIR LA TÊTE` est **inerte** pendant la première seconde de `ACTIVE` : garde anti-validation accidentelle. On **désarme** au lieu de punir (pas d'équivalent `QTE_PANIC_SHOT`). |
| `initialVariantRule` | **jamais la bonne** (A5, §3) | Invariant asserté en code contre les données autorisées, jamais présumé (discipline ADR-0035). |

*Il n'y a plus d'`enterSeconds` :* la transition de 2,0 s reposait sur `QTE_ZOOM_SECONDS` et le gel
du monde, tous deux supprimés par A2. Le rythme d'entrée est porté par les répliques skippables
(§2.1) ; sa durée appartient à `ux-designer` / `narrative-designer`.

### 4.2 Tolérance et issues

| Clé | Valeur canonique | Justification |
| --- | ---------------- | ------------- |
| `identifiedThreshold` | **4/4** | Un portrait-robot **juste** est juste. Baisser le seuil plein à 3/4 viderait de son sens la révélation (« c'est presque lui » n'identifie personne). |
| `partialThreshold` | **3/4** | **On ne joue pas en tout-ou-rien.** 3/4 après 35 s de comparaison honnête mérite un retour ; le tout-ou-rien sur une scène d'observation produit de la frustration sourde. Ratifié au gate (A9) : sans ce palier, un joueur à 3/4 subit le même verdict qu'un joueur à 0/4, ce qui contredit frontalement la non-négociable §5 règle 4 (« chaque échec, raison affichée »). Le presque-juste doit être **lisible, faiblement récompensé, jamais indolore**. |
| `failedThreshold` | **≤ 2/4** | Deux bandes justes sur 4 avec 6 variantes, c'est au niveau du bruit. |
| Timeout / abandon | **évalué normalement** à l'état courant, pas d'échec sec | **Divergence assumée avec l'original** (où l'expiration = −1 vie, CONFIRMÉ, recon §4). On supprime la double peine « le chrono expire ⇒ tout ce que tu as trouvé est annulé ». Un joueur à 3/4 au buzzer a **réellement** fait 3/4. L'abandon confirmé (§2.1) suit exactement la même route. |

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

| Issue | Vies | Énergie (capital initial du niveau **suivant**) | Score | Payoff (§2.5) | Justification |
| ----- | ---- | ----------------------------------------------- | ----- | ------------- | ------------- |
| `IDENTIFIED` (4/4) | **0 — interdit** | **0** | **+1500** | **+20 s** | La récompense est le retard de vague et le score. L'énergie serait clampée : la donner serait mentir au joueur. |
| `PARTIAL` (3/4) | **0 — interdit** | **0** | **+400** | **+10 s** | Un jeton de consolation, pas une récompense. On **ne perd rien** : avoir 3 traits justes n'est pas une faute. |
| `FAILED` (≤ 2/4) | **0 — interdit** | **−20** | **0** | **0 s** | **La sanction canonique.** Le niveau suivant démarre à 80 au lieu de 100 : le joueur commence sa mission avec moins de marge, sans qu'aucun coup ne lui ait été porté sur un écran où il ne peut pas se défendre. Ça pique, c'est visible dès la première seconde de la mission suivante, et ça ne brise aucun run. **Plus le beat narratif obligatoire** (§2.5) : un échec qui ne produit qu'un chiffre serait un échec sans beat, un échec qui ne produit qu'un beat serait sans enjeu. |
| Bonus de temps | — | — | **aucun en V1** | — | **Pas de bonus de vitesse.** Un bonus au temps restant pousserait à valider vite au lieu de comparer bien : il combat directement le verbe de la scène (D1). Explicitement HORS spec (§7). |

**Invariant de sécurité — la scène ne peut pas TUER, et c'est désormais trivialement vrai.**
Elle ne touche pas `lives` (le champ n'est pas dans son contrat de sortie, §2.4), et l'énergie n'a
pas de mort à 0. Il n'y a donc **aucun plancher à calculer, aucune sanction à plafonner** : l'ancien
mécanisme « plafonner à 0,25 cœur » disparaît avec la perte de vie. À asserter en test comme une
**absence** : aucune issue ne produit de `livesDelta`.

**Validation partielle — comportement (question explicite du brief) :** il n'existe **pas** de
validation par bande. On ne « verrouille » pas une bande. Le seul acte de validation est **global**
et **terminal** (R5, §2.2) : il gèle les 4 index simultanément et lance la révélation. Rationale
KISS : un verrouillage par bande créerait un état supplémentaire (verrouillé/libre), un risque de
blocage (verrouiller une erreur sans recours), et il faudrait alors trancher s'il donne un feedback
— ce que §5 refuse. Le gate a coupé le verrouillage indicatif proposé côté UX pour la même raison,
en ajoutant l'argument qui manquait : les 4 bandes étant **toutes visibles simultanément**, il n'y
a rien à mémoriser. **La « validation partielle » de muf, c'est le palier `PARTIAL` à 3/4, pas un
verrou.**

### 4.4 Constantes système vs données autorisées (recommandation à `senior-architect`)

- **Autorisé (données de run/niveau)** : le déclencheur narratif, la **graine** (`portraitSeed`,
  entier fini, **seule** source du tirage — déterminisme), et l'identifiant du jeu de visages.
  *Plus de « palier de difficulté » autorisé* : avec une occurrence unique (A3) et une composition
  de leurres figée (§3 D3), il n'y a pas de palier à choisir.
- **Constantes système** (Belliard-first, promues plus tard si une courbe le demande) :
  `timerSeconds` et ses facteurs `Prefs.difficulty`, `revealSeconds`, `resultHoldSeconds`,
  `confirmGuardSeconds`, `variantsPerStrip`, les seuils 4/4-3/4, et tous les deltas
  énergie/score/`waveDelaySeconds`. Même couture de promotion additive qu'ADR-0034/0035.
- **Contrat de sortie attendu par `senior-architect` :**
  `outcome · correctCount · energyDelta (appliqué au niveau+1) · scoreDelta · waveDelaySeconds`.
  **Pas de `livesDelta`** — son absence est l'invariant.

---

## 5. Feedback — position tranchée

**Constat source :** l'original ne donne **aucun feedback par trait** (recon §3, PROBABLE) ;
l'évaluation est globale, en fin de phase.

**Est-ce tenable en 2026, sur mobile ? Oui pendant la phase. Non après.**

### D4 — **Zéro feedback pendant `ACTIVE`. Verdict trait par trait à la révélation.**

**Pendant la phase — rien.** Aucune coche, aucune couleur, aucun son de justesse, aucun compteur
« 2/4 ». Non par archéologie, mais parce que **le moindre feedback par trait détruit la mécanique** :
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
- le chrono, en **unités de télécarte** (`TÉLÉCARTE · {n} UNITÉS`).

*(Le surlignage de bande, s'il existe, est une affordance d'IHM — `ux-designer`. Le modèle de jeu
n'a pas de « bande active », §2.2.)*

**À la révélation — tout, trait par trait.** `RESOLVING` (2.6 s) déroule les 4 verdicts **en
séquence, de haut en bas**, ~0.45 s chacun : pour chaque bande, la variante choisie et, si elle
est fausse, **la bonne**, en substitution visible. Puis le visage correct se tient 0.8 s.

Rationale game feel : c'est **exactement** là que le feedback est gratuit sur le plan mécanique
(la manche est finie, il n'exploite rien) et maximal sur le plan pédagogique — le joueur apprend
**quel descripteur** il a raté (« ah, la raie, pas la longueur »), donc il apprend la grammaire de
la §3. C'est le moteur du « encore une fois » (§6). Et ça répond au reproche moderne
qu'on ferait à l'original : on ne prive pas le joueur d'information, on la **diffère** jusqu'au
moment où elle enseigne au lieu d'assister.

**Ordre de la séquence :** de haut en bas, toujours (cheveux → yeux → nez → bouche), **jamais**
les erreurs en dernier pour ménager le suspense. Un ordre stable est lisible ; un ordre
dramatisé serait perçu comme une manipulation dès la deuxième occurrence.

---

## 6. Game feel

**Rythme (les trois temps).**

1. **L'après (entrée).** Pas un gel : une **retombée**. La mission est finie, le bruit de la teuf
   s'éloigne, la cabine se referme. Le contraste avec les 3-5 min de `Éviter` qu'on vient de jouer
   est l'effet, et il est gratuit — mais il se joue **hors** du budget de la mission (A2), ce qui
   est précisément ce qui empêche la scène d'être une digression.
2. **Le silence de travail (les 35 s).** C'est un **temps calme sous horloge**. Rien ne bouge sauf
   ce que le joueur bouge. La tension vient de trois sources et de rien d'autre :
   - le **chrono visible** qui décompte en **unités de télécarte** (14 → 0, 1 unité = 2,5 s) ; la
     recon note « tense music as the seconds tick down » — c'est la seule chose que l'original fait
     pour tenir cette phase, et elle marche ;
   - une **musique qui se resserre** aux paliers **4 unités (10,0 s)** puis **2 unités (5,0 s)**
     (hand-off `sound-designer` : deux paliers, pas un crescendo continu — un palier se perçoit,
     une rampe s'ignore). Le palier **7 unités (17,5 s)** est de la copie seule. Les trois paliers
     de copie, les deux paliers musicaux et les annonces `aria-live` tombent désormais **au même
     endroit** : c'est le seul rôle de la conversion 2,5 s/unité ;
   - le **portrait cible qui vous regarde**. C'est le seul « personnage » à l'écran ;
     `lead-art` doit lui donner un regard qui soutient 35 s de face-à-face.
3. **La révélation (2.6 s).** Le beat payant. Séquence descendante, un verdict à la fois,
   **rythmée comme une machine à écrire** : chaque bande claque, la fausse est corrigée sous les
   yeux du joueur. À `IDENTIFIED`, les quatre claquent juste et le visage se **fige d'un coup**,
   entier — c'est là qu'on gagne. À `FAILED`, on voit exactement **quelles** bandes se corrigent :
   la sanction est mise en scène comme une **leçon**, pas comme un buzzer.

**Ce qui donne envie de recommencer.** Trois moteurs, dans l'ordre :

1. **On a compris quelque chose.** La révélation nomme l'erreur. Au **run suivant** (une seule
   occurrence par run, A3), on sait *où regarder*. C'est une **courbe de compétence réelle**, pas
   une courbe de chance — c'est ce que la règle du trait nommé (§3 D2) achète.
2. **On a été à un trait près.** Le palier 3/4 rend le presque-juste explicite. « Je l'avais, sauf
   le nez » est la phrase qui fait rejouer.
3. **La récompense est narrative ET jouable.** Le portrait juste **devient une personne** — la
   page 23, une porte qui se ferme — *et* 20 secondes de répit au démarrage de la mission suivante
   (§2.5). C'est le pivot que l'original réussit (recon §5), et c'est aussi ce qui distingue la
   scène d'une curiosité : sans le payoff, c'est du remplissage par définition (A11).

**Le piège à éviter (à surveiller au playtest) :** la scène ne doit **jamais** ressembler à un
formulaire. Si au stage-5 elle lit comme un menu d'options, le défaut est dans la mise en scène
(cadrage, son, présence du portrait cible), **pas** dans la mécanique — ne pas répondre en
rajoutant du timing.

---

## 7. Explicitement HORS spec V1 (KISS/YAGNI)

1. **Bandes qui défilent / à figer** — rejeté en D1. Ne pas ré-introduire par la porte de service
   (« et si juste les cheveux défilaient ? » : non).
2. **Verrouillage / validation bande par bande.** §4.3.
3. **Feedback par trait pendant la phase**, sous quelque forme que ce soit (couleur, son, « chaud/
   froid », compteur de justesse). §5.
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
  (ADR-0015) et **quel que soit le geste retenu par `ux-designer`** : la bande *i* peut être portée
  à la variante *j* **sans effet de bord** sur les trois autres ; les 4 bandes sont adressables dans
  n'importe quel ordre et autant de fois qu'on veut ; le cycle boucle dans les deux sens ; un pas =
  exactement une variante ; la validation est unique, globale et terminale. **Cet AC ne teste aucun
  geste** — le mapping (swipe horizontal sur la bande en tactile, proposition Figma en desktop) est
  vérifié par l'AC d'`ux-designer`, pas ici.
- **AC3 — Zéro feedback pendant.** Aucun signal de justesse, par bande ou global, entre le début du
  chrono et `RESOLVING`. Vérifié par capture. Le compteur `n / N` de position dans le cycle et le
  chrono sont présents (lisibilité d'état, pas feedback).
- **AC4 — Révélation.** `RESOLVING` déroule 4 verdicts de haut en bas en ~0.45 s chacun, corrige
  visiblement chaque bande fausse, puis tient le visage complet 0.8 s. Total 2.6 s ± 0.2 s, suivi
  du hold 2.2 s.
- **AC5 — Barème.** 4/4 ⇒ `IDENTIFIED` (0 énergie, +1500 score) ; 3/4 ⇒ `PARTIAL` (0 énergie,
  +400 score) ; ≤ 2/4 ⇒ `FAILED` (**−20 sur le capital d'énergie INITIAL du niveau suivant**,
  0 score). Vérifié par test unitaire sur les trois issues. Le `FAILED` est vérifié **là où il
  s'applique** : le niveau suivant démarre à **80**, pas à 100 — et l'énergie du niveau écoulé est
  inchangée.
- **AC6 — La scène ne retire JAMAIS de vie.** Sur les trois issues, sur le timeout et sur l'abandon
  confirmé, `lives` est **strictement inchangé** — y compris à `lives` bas (0,5 puis `FAILED` ⇒
  toujours 0,5). Asserté comme une **absence** : le contrat de sortie de la scène ne contient aucun
  `livesDelta`. Test unitaire sur les cinq chemins.
- **AC7 — Timeout évalué.** L'expiration du chrono valide l'état courant et le juge par le même
  barème (un 3/4 au buzzer donne `PARTIAL`). Aucun chemin d'échec sec.
- **AC8 — Déterminisme.** Même `portraitSeed` ⇒ même bonne variante et mêmes leurres, aux mêmes
  index, sur deux runs. Aucun `Math.random`/`Date.now` dans la scène (grep/lint assertés). Les
  niveaux sans spec portrait sont byte-for-byte inchangés.
- **AC9 — Invariants du jeu de variantes.** L'état initial d'aucune bande n'est la bonne réponse
  (A5) ; la bonne variante n'est pas toujours au même index (A6) ; `variantsPerStrip === 6`,
  `faceTemplates === 1` et `stripCount === 4`, assertés en code contre les données autorisées,
  jamais présumés.
- **AC10 — Équité de la ressemblance (playtest, pas test unitaire).** Sur un device mobile réel,
  chaque différence bonne-variante/leurre est **nommable en une phrase** et **visible sans zoomer**
  (A1/A2/A3). Tout leurre qui échoue ce test est renvoyé à `lead-art`. Composite gate.
- **AC11 — Budget de chrono.** Un balayage complet des 4 bandes (toutes variantes vues une fois)
  consomme **≤ 25 %** du chrono en jeu réel (cible calculée : ~14 % à 6 variantes). Au-delà, baisser
  `variantsPerStrip` avant de toucher au timer.
- **AC12 — Le payoff existe et se sent (§2.5, critère de sortie de la feature).** Deux volets :
  1. *Mesurable :* au niveau suivant, la première vague de pression RG/BAC arrive avec **+20 s** de
     retard après `IDENTIFIED`, **+10 s** après `PARTIAL`, **0 s** après `FAILED`. Test unitaire sur
     l'horodatage de la première vague ; aucune persistance au-delà de ce niveau.
  2. *Ressenti (playtest, pas test unitaire) :* le rappel narratif obligatoire est joué au
     pré-niveau (la porte qui refuse / l'habitué refusé + « l'autre est entré »), et le joueur
     **perçoit** le répit du démarrage. La question du playtest n'est pas « est-ce que ça marche »
     mais **« est-ce que le payoff se sent »**. S'il ne se sent pas, la feature échoue son gate de
     justification (A11) et `pm` + `lead-game-designer` la coupent.
- **AC13 — Chrono, unités et accessibilité.** Le chrono s'affiche en **unités de télécarte**
  (14 → 0, 1 unité = 2,5 s), les paliers tombent à **7 / 4 / 2 unités**, `Prefs.difficulty` donne
  **56 / 35 / 30 s**, et le chrono est **en pause** tant que `RotateOverlay` est affiché.
- **AC14 — Vocabulaire de surface (A6).** Aucune capture d'écran de la scène ne contient
  `PORTRAIT-ROBOT`, `CHEVEUX`, `YEUX`, `dossier suspect`, `VALIDER LE PORTRAIT` ni « temps
  restant ». On y lit **`TÊTE À CONNAÎTRE`**, **`LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`**,
  **`SORTIR LA TÊTE`**, **`TÉLÉCARTE · {n} UNITÉS`**. Vérifié par capture au composite gate.

---

## 9. Questions ouvertes (pour les autres lanes — NON tranchées ici)

**Refermées par le gate, ne pas rouvrir :** D1 (ratifiée, option B close définitivement) · le coût
de l'échec (énergie seule, A1) · le palier 3/4 (maintenu, A9) · la fréquence (1 par run, A3) ·
le nombre de variantes (6, A5) · le placement (interstitiel, A2) · le mapping tactile (swipe sur la
bande, arbitrage Bertrand A4-bis) · le twist « ton propre portrait-robot » (gelé, A12).

**Pour `ux-designer` (Tony) — ouvert par l'arbitrage A4-bis, non bloquant pour le TECH PLAN :**

1. **Seuil d'angle et distance de déclenchement du swipe** — l'ambiguïté du swipe diagonal que tu
   documentais reste réelle ; elle se chiffre, elle ne se rejette plus.
2. **Discrete-swipe (1 swipe = 1 cran) vs défilement à l'inertie.** Ma contrainte de design est R4
   (§2.2) : un pas = exactement une variante, prévisible sous chrono. Le discret est donc ma
   recommandation forte ; le continu ne passe que s'il s'arrête toujours pile sur un cran.
3. **Hauteur minimale par bande** — devient une contrainte de swipe, plus seulement de lecture.
4. **Accessibilité** : un swipe n'est actionnable ni au clavier ni au lecteur d'écran. Les chevrons
   restent en affordance + cible d'accessibilité (≥ 44×44 px), jamais en geste primaire.
5. **Desktop : proposition sur maquette Figma** (demande de Bertrand). Socle clavier acquis
   (↑↓ bande · ←→ variante · Entrée CTA · Échap confirmation).
6. **Layout** : la contrainte de design est **le cible et la bande travaillée comparables sans
   scroll ni bascule**, médaillon cible ≥ **28 %** de la largeur en mobile paysage, rapproché des
   bandes (A8).
7. **Enseigner « compare, ne tape pas »** en < 2 s. Voir `tutorial-visual-gestures.md`.

**Pour `narrative-designer` (Yasmine) :**

8. **Le verdict `PARTIAL` (3/4)** — il manque à ta spec : tampon + lignes du « presque ». Le palier
   existe (A9) et la non-négociable §5 règle 4 impose une raison affichée.
9. **Les deux rappels du niveau suivant** (§2.5) — obligatoires, pas optionnels.
10. **Conversion télécarte** 1 unité = 2,5 s / 14 unités, paliers calés sur 7/4/2 unités.

**Pour `lead-art` (Nico) — le read, pas le style :**

11. **La règle D2 est productible au budget arrêté :** 4 bandes × **6** variantes × **1** gabarit =
    24 assets. Elle est **opposable au gate art** : un leurre dont tu ne peux pas énoncer la
    différence en une phrase courte, sans coordonnées de pixels, est rejeté.
12. **Correction à intégrer à ton brief §4 :** la scène n'a **pas** de chrono « qui coûte une vie »
    (A1) et n'est **pas** dans le monde de jeu (A2). Surface **interstitielle mais INTERACTIVE** :
    le liseré de sélection est légitime (ce qui brille est manipulable), la cible reste sans glow.
13. **Le regard du portrait cible** doit soutenir un face-à-face de 35 s (§6).

**Pour `sound-designer` :**

14. Deux paliers de resserrement musical à **4 unités (10,0 s)** et **2 unités (5,0 s)**, un `snap`
    court de changement de variante, un `bip` au dernier palier, et le rythme « machine à écrire »
    de la révélation (§6).

**Pour `senior-architect` / `tech-writer` :**

15. **ADR à ouvrir** (0079/0080/0081 pressentis) : `AppPhase` interstitiel sans réemploi du shell
    ADR-0030, contrat de sortie
    `outcome / correctCount / energyDelta (niveau+1) / scoreDelta / waveDelaySeconds`,
    déterminisme par `portraitSeed`, et **la règle A1c** (une scène interstitielle modifie le
    capital initial du niveau suivant, jamais l'énergie du niveau écoulé) — règle neuve, à
    remonter aux guidelines si Bertrand la valide, car elle servira à toute scène interstitielle
    future.

---

## Hand-off — `lead-game-designer` (Karim), round 2

Spec révisée sur place, journal de révision en tête. Les cinq contradictions relevées au gate sont
transcrites (R1-R9), la §4 est **strictement alignée** sur la §3 du gate, le payoff A10 est intégré
comme mécanique (§2.5) et non comme note, et la §2.2 ne prescrit plus aucun geste — seulement la
règle. **Désaccords maintenus : aucun.** Deux ACs neufs (AC12 payoff, AC13 chrono/a11y, AC14
vocabulaire) rendent les corrections vérifiables au stage 5. À logger dans `docs/handoffs/`.
